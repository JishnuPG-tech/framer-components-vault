/**
 * VersionBadge.tsx — Framer Component
 *
 * Compact version/release badge for hero sections. Shows "v2.4.1 · What's
 * new" with an animated pulsing dot. Optional expandable panel shows
 * recent changes. Inspired by Linear, Vercel, and Arc hero patterns.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ========================================================================== */
/*  Types                                                                      */
/* ========================================================================== */

interface ChangeEntry {
    version: string
    date: string
    title: string
    description: string
}

interface Props {
    version: string
    label: string
    showPrefix: boolean
    prefix: string
    showDot: boolean
    pulseDot: boolean
    showArrow: boolean

    expandable: boolean
    changes: ChangeEntry[]
    panelTitle: string

    link: string
    openInNewTab: boolean

    background: string
    hoverBackground: string
    textColor: string
    prefixColor: string
    dotColor: string
    borderColor: string

    font: Record<string, any>
    fontSize: number
    fontWeight: number
    paddingX: number
    paddingY: number
    gap: number
    radius: number
    borderWidth: number

    panelBackground: string
    panelBorder: string
    panelRadius: number
    panelPadding: number
    panelWidth: number
    panelTitleColor: string
    panelTextColor: string
    panelMutedColor: string
    panelItemGap: number
}

/* ========================================================================== */
/*  Component                                                                  */
/* ========================================================================== */

export default function VersionBadge(props: Props) {
    const {
        version,
        label,
        showPrefix,
        prefix,
        showDot,
        pulseDot,
        showArrow,
        expandable,
        changes,
        panelTitle,
        link,
        openInNewTab,
        background,
        hoverBackground,
        textColor,
        prefixColor,
        dotColor,
        borderColor,
        font,
        fontSize,
        fontWeight,
        paddingX,
        paddingY,
        gap,
        radius,
        borderWidth,
        panelBackground,
        panelBorder,
        panelRadius,
        panelPadding,
        panelWidth,
        panelTitleColor,
        panelTextColor,
        panelMutedColor,
        panelItemGap,
    } = props

    const fontFamily = font?.fontFamily || "Inter, system-ui, sans-serif"
    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false

    const [open, setOpen] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)
    const rootRef = React.useRef<HTMLDivElement>(null)

    // Close on click outside
    React.useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    const bgNow = hovered ? hoverBackground : background

    const handleClick = () => {
        if (expandable) {
            setOpen((v) => !v)
        } else if (link) {
            if (openInNewTab) {
                window.open(link, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = link
            }
        }
    }

    const interactive = expandable || !!link

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                display: "inline-block",
                fontFamily: fontFamily,
                width: "fit-content",
            }}
        >
            <style>{`
                @keyframes vb-pulse-ring {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                .vb-dot-ring {
                    animation: vb-pulse-ring 1.8s ease-out infinite;
                }
                .vb-root {
                    transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
                }
                .vb-arrow {
                    transition: transform 200ms ease;
                }
            `}</style>

            <div
                className="vb-root"
                onClick={interactive ? handleClick : undefined}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: gap,
                    background: bgNow,
                    color: textColor,
                    fontSize: fontSize,
                    fontWeight: fontWeight,
                    padding: `${paddingY}px ${paddingX}px`,
                    borderRadius: radius,
                    border:
                        borderWidth > 0
                            ? `${borderWidth}px solid ${borderColor}`
                            : "none",
                    cursor: interactive ? "pointer" : "default",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                    boxSizing: "border-box",
                }}
            >
                {showDot && (
                    <span
                        style={{
                            position: "relative",
                            width: fontSize * 0.55,
                            height: fontSize * 0.55,
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: "50%",
                                background: dotColor,
                                zIndex: 1,
                            }}
                        />
                        {pulseDot && !isStatic && (
                            <span
                                className="vb-dot-ring"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    background: dotColor,
                                    zIndex: 0,
                                }}
                            />
                        )}
                    </span>
                )}
                {showPrefix && prefix && (
                    <span
                        style={{
                            color: prefixColor,
                            fontWeight: fontWeight,
                        }}
                    >
                        {prefix}
                    </span>
                )}
                {version && (
                    <span
                        style={{
                            fontVariantNumeric: "tabular-nums",
                            fontWeight:
                                fontWeight + 100 > 900 ? 900 : fontWeight + 100,
                        }}
                    >
                        {version}
                    </span>
                )}
                {label && (
                    <>
                        <span
                            aria-hidden
                            style={{
                                color: prefixColor,
                                opacity: 0.5,
                            }}
                        >
                            ·
                        </span>
                        <span>{label}</span>
                    </>
                )}
                {showArrow && interactive && (
                    <svg
                        className="vb-arrow"
                        width={fontSize * 0.85}
                        height={fontSize * 0.85}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            display: "block",
                            flexShrink: 0,
                            transform: expandable
                                ? open
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)"
                                : hovered
                                  ? "translateX(2px)"
                                  : "translateX(0)",
                            opacity: 0.7,
                        }}
                    >
                        {expandable ? (
                            <path d="M4 6l4 4 4-4" />
                        ) : (
                            <path d="M6 4l4 4-4 4" />
                        )}
                    </svg>
                )}
            </div>

            {/* Dropdown panel */}
            {expandable && open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        width: panelWidth,
                        maxWidth: "90vw",
                        background: panelBackground,
                        border: "1px solid " + panelBorder,
                        borderRadius: panelRadius,
                        padding: panelPadding,
                        boxSizing: "border-box",
                        boxShadow:
                            "0 10px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        zIndex: 100,
                    }}
                >
                    {panelTitle && (
                        <div
                            style={{
                                fontSize: fontSize,
                                fontWeight: 600,
                                color: panelTitleColor,
                                marginBottom: panelItemGap,
                                paddingBottom: panelItemGap - 4,
                                borderBottom: "1px solid " + panelBorder,
                            }}
                        >
                            {panelTitle}
                        </div>
                    )}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: panelItemGap,
                        }}
                    >
                        {changes.map((entry, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 3,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: fontSize - 1,
                                            fontWeight: 600,
                                            color: panelTitleColor,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {entry.version}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: fontSize - 2,
                                            color: panelMutedColor,
                                        }}
                                    >
                                        {entry.date}
                                    </div>
                                </div>
                                {entry.title && (
                                    <div
                                        style={{
                                            fontSize: fontSize - 1,
                                            fontWeight: 500,
                                            color: panelTextColor,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {entry.title}
                                    </div>
                                )}
                                {entry.description && (
                                    <div
                                        style={{
                                            fontSize: fontSize - 2,
                                            color: panelMutedColor,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {entry.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ========================================================================== */
/*  Default Props                                                              */
/* ========================================================================== */

const defaultChanges: ChangeEntry[] = [
    {
        version: "v2.4.0",
        date: "Apr 14, 2026",
        title: "Team workspaces",
        description:
            "Invite members and assign roles across your organization.",
    },
    {
        version: "v2.3.2",
        date: "Apr 8, 2026",
        title: "Webhook reliability",
        description: "Automatic retries with exponential backoff.",
    },
    {
        version: "v2.3.0",
        date: "Mar 27, 2026",
        title: "Dark mode",
        description: "System-aware dark theme across the entire app.",
    },
]

/* ========================================================================== */
/*  Property Controls                                                          */
/* ========================================================================== */

addPropertyControls(VersionBadge, {
    // ═══════════════════════════════════════
    // 1. CONTENT
    // ═══════════════════════════════════════
    showPrefix: {
        type: ControlType.Boolean,
        title: "Prefix",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix Text",
        defaultValue: "New",
        description:
            "Text before the version. Try 'New', 'Update', 'Just shipped'.",
        hidden: (p: Props) => !p.showPrefix,
    },
    version: {
        type: ControlType.String,
        title: "Version",
        defaultValue: "v2.4.0",
        description: "Version number or tag. Leave empty to hide.",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "What's new",
        description: "Text after the version. Leave empty to hide.",
    },

    // ═══════════════════════════════════════
    // 2. DOT
    // ═══════════════════════════════════════
    showDot: {
        type: ControlType.Boolean,
        title: "Dot",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Leading status dot.",
    },
    pulseDot: {
        type: ControlType.Boolean,
        title: "Pulse",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Animated pulse ring around the dot.",
        hidden: (p: Props) => !p.showDot,
    },
    showArrow: {
        type: ControlType.Boolean,
        title: "Arrow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Show a trailing arrow or chevron.",
    },

    // ═══════════════════════════════════════
    // 3. BEHAVIOR
    // ═══════════════════════════════════════
    expandable: {
        type: ControlType.Boolean,
        title: "Expandable",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Click to open a dropdown with recent changes. Disable to use as a simple link instead.",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        hidden: (p: Props) => p.expandable,
        description:
            "URL to navigate to when clicked (when Expandable is off).",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p: Props) => p.expandable,
    },

    // ═══════════════════════════════════════
    // 4. DROPDOWN PANEL (expandable only)
    // ═══════════════════════════════════════
    panelTitle: {
        type: ControlType.String,
        title: "Panel Title",
        defaultValue: "Recent updates",
        hidden: (p: Props) => !p.expandable,
    },
    changes: {
        type: ControlType.Array,
        title: "Changes",
        description: "Entries shown in the dropdown panel. Newest first.",
        control: {
            type: ControlType.Object,
            controls: {
                version: {
                    type: ControlType.String,
                    title: "Version",
                    defaultValue: "v1.0.0",
                },
                date: {
                    type: ControlType.String,
                    title: "Date",
                    defaultValue: "Jan 1, 2026",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Release title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: defaultChanges,
        hidden: (p: Props) => !p.expandable,
    },

    // ═══════════════════════════════════════
    // 5. BADGE STYLE
    // ═══════════════════════════════════════
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f4f4f8",
    },
    hoverBackground: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#eaeaf0",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#0c0c14",
    },
    prefixColor: {
        type: ControlType.Color,
        title: "Prefix Color",
        defaultValue: "#7a7a88",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot",
        defaultValue: "#22c55e",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(0, 0, 0, 0.08)",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.5,
    },

    // ═══════════════════════════════════════
    // 6. LAYOUT
    // ═══════════════════════════════════════
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 12,
        min: 4,
        max: 32,
        step: 1,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 6,
        min: 2,
        max: 20,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 2,
        max: 20,
        step: 1,
        description: "Space between badge elements.",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 99,
        min: 0,
        max: 99,
        step: 1,
        description: "99 = pill shape. Lower values = rounded rectangle.",
    },

    // ═══════════════════════════════════════
    // 7. TYPOGRAPHY
    // ═══════════════════════════════════════
    // @ts-ignore
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: { fontFamily: "Inter", fontWeight: 400 },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 13,
        min: 10,
        max: 20,
        step: 1,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
    },

    // ═══════════════════════════════════════
    // 8. DROPDOWN PANEL STYLE
    // ═══════════════════════════════════════
    panelBackground: {
        type: ControlType.Color,
        title: "Panel BG",
        defaultValue: "#ffffff",
        hidden: (p: Props) => !p.expandable,
    },
    panelBorder: {
        type: ControlType.Color,
        title: "Panel Border",
        defaultValue: "#e5e5ea",
        hidden: (p: Props) => !p.expandable,
    },
    panelRadius: {
        type: ControlType.Number,
        title: "Panel Radius",
        defaultValue: 12,
        min: 0,
        max: 24,
        step: 1,
        hidden: (p: Props) => !p.expandable,
    },
    panelPadding: {
        type: ControlType.Number,
        title: "Panel Padding",
        defaultValue: 16,
        min: 8,
        max: 40,
        step: 1,
        hidden: (p: Props) => !p.expandable,
    },
    panelWidth: {
        type: ControlType.Number,
        title: "Panel Width",
        defaultValue: 340,
        min: 240,
        max: 600,
        step: 10,
        hidden: (p: Props) => !p.expandable,
    },
    panelTitleColor: {
        type: ControlType.Color,
        title: "Panel Title",
        defaultValue: "#0c0c14",
        hidden: (p: Props) => !p.expandable,
    },
    panelTextColor: {
        type: ControlType.Color,
        title: "Panel Text",
        defaultValue: "#3a3a48",
        hidden: (p: Props) => !p.expandable,
    },
    panelMutedColor: {
        type: ControlType.Color,
        title: "Panel Muted",
        defaultValue: "#7a7a88",
        hidden: (p: Props) => !p.expandable,
    },
    panelItemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        defaultValue: 14,
        min: 4,
        max: 32,
        step: 1,
        hidden: (p: Props) => !p.expandable,
    },
})
