// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState } from "react"

interface TabItem {
    label: string
    title: string
    description: string
    content: string
}

interface Props {
    tabs: TabItem[]
    width: number
    accentColor: string
    backgroundColor: string
    borderColor: string
    textColor: string
    mutedColor: string
    titleColor: string
    borderRadius: number
    fontFamily: string
}

export default function TabsCard(props: Props) {
    const {
        tabs,
        width,
        accentColor,
        backgroundColor,
        borderColor,
        textColor,
        mutedColor,
        titleColor,
        borderRadius,
        fontFamily,
    } = props

    const [active, setActive] = useState(0)
    const current = tabs[active] ?? tabs[0]

    return (
        <div
            style={{
                width,
                fontFamily,
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "stretch",
                    gap: 4,
                    padding: 4,
                    background: backgroundColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: borderRadius,
                    width: "100%",
                }}
            >
                {tabs.map((tab, i) => {
                    const isActive = i === active
                    return (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            style={{
                                flex: 1,
                                padding: "6px 12px",
                                fontSize: 13,
                                fontWeight: 500,
                                fontFamily: "inherit",
                                color: isActive ? "#fff" : textColor,
                                background: isActive
                                    ? accentColor
                                    : "transparent",
                                border: "none",
                                borderRadius: Math.max(borderRadius - 4, 4),
                                cursor: "pointer",
                                transition:
                                    "background 0.15s ease, color 0.15s ease",
                            }}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <div
                style={{
                    background: backgroundColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: borderRadius,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}
            >
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: titleColor,
                            lineHeight: 1.3,
                        }}
                    >
                        {current.title}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: mutedColor,
                            lineHeight: 1.5,
                        }}
                    >
                        {current.description}
                    </div>
                </div>
                <div
                    style={{
                        fontSize: 14,
                        color: mutedColor,
                        lineHeight: 1.5,
                    }}
                >
                    {current.content}
                </div>
            </div>
        </div>
    )
}

TabsCard.defaultProps = {
    width: 480,
    accentColor: "#0A0A0A",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E5E5",
    textColor: "#525252",
    mutedColor: "#737373",
    titleColor: "#0A0A0A",
    borderRadius: 10,
    fontFamily: "Inter, sans-serif",
    tabs: [
        {
            label: "Dashboard",
            title: "Dashboard",
            description:
                "Your workspace at a glance. See what's shipping, what's blocked, and what's next.",
            content: "8 workflows running. 2 deployments queued for review.",
        },
        {
            label: "Insights",
            title: "Insights",
            description:
                "Usage data across your team. Spot patterns before they become problems.",
            content: "Active users grew 18% week over week.",
        },
        {
            label: "Billing",
            title: "Billing",
            description:
                "Invoices, seats, and plan details. Everything finance asks for, in one place.",
            content: "Next invoice: $2,400 on May 1. 14 of 20 seats in use.",
        },
        {
            label: "Workspace",
            title: "Workspace",
            description:
                "Team settings, integrations, and access controls. Set it up once, forget about it.",
            content: "SSO enabled. 6 integrations connected.",
        },
    ],
}

addPropertyControls(TabsCard, {
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Tab Label" },
                title: { type: ControlType.String, title: "Title" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                },
                content: {
                    type: ControlType.String,
                    title: "Content",
                    displayTextArea: true,
                },
            },
        },
    },
    width: {
        type: ControlType.Number,
        title: "Width",
        min: 280,
        max: 800,
        step: 10,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 24,
        step: 1,
    },
    accentColor: { type: ControlType.Color, title: "Accent" },
    backgroundColor: { type: ControlType.Color, title: "Background" },
    borderColor: { type: ControlType.Color, title: "Border" },
    titleColor: { type: ControlType.Color, title: "Title" },
    textColor: { type: ControlType.Color, title: "Text" },
    mutedColor: { type: ControlType.Color, title: "Muted" },
    fontFamily: { type: ControlType.String, title: "Font" },
})
