import React, { useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ============================================================================
// Advanced Bento Grid System
// Framer Marketplace Component — v1
// Fixed width: 370px | Pure CSS Grid + React State | Zero layout shift
// Hover: opacity cross-fade only (no transform, no layout-affecting transitions)
// ============================================================================

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
interface BentoCard {
    title: string
    description: string
    imageUrl: string
    cardBackground: string
    colSpan: number
    rowSpan: number
}

interface AdvancedBentoGridProps {
    items: BentoCard[]
    gridGap: number
    rowHeight: number
    padding: number
    cornerRadius: number
    globalBackground: string
    borderColor: string
    accentColor: string
    textColor: string
}

// ----------------------------------------------------------------------------
// Defaults
// ----------------------------------------------------------------------------
const DEFAULT_ITEMS: BentoCard[] = [
    {
        title: "Design System",
        description: "Build consistent interfaces at scale with unified tokens",
        imageUrl: "",
        cardBackground: "#1a1a2e",
        colSpan: 2,
        rowSpan: 2,
    },
    {
        title: "Typography",
        description: "Crafted type hierarchy",
        imageUrl: "",
        cardBackground: "#16213e",
        colSpan: 2,
        rowSpan: 1,
    },
    {
        title: "Color",
        description: "",
        imageUrl: "",
        cardBackground: "#0f3460",
        colSpan: 1,
        rowSpan: 1,
    },
    {
        title: "Icons",
        description: "",
        imageUrl: "",
        cardBackground: "#533483",
        colSpan: 1,
        rowSpan: 1,
    },
    {
        title: "Grid System",
        description: "Flexible layouts for every screen",
        imageUrl: "",
        cardBackground: "#c94040",
        colSpan: 2,
        rowSpan: 1,
    },
    {
        title: "Components",
        description: "Reusable building blocks",
        imageUrl: "",
        cardBackground: "#1a6b3c",
        colSpan: 2,
        rowSpan: 1,
    },
]

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------
export default function AdvancedBentoGrid(props: AdvancedBentoGridProps) {
    const {
        items,
        gridGap = 10,
        rowHeight = 108,
        padding = 14,
        cornerRadius = 14,
        globalBackground = "#0a0a0f",
        borderColor = "rgba(255,255,255,0.07)",
        accentColor = "#6366f1",
        textColor = "#ffffff",
    } = props

    // Guard: ControlType.Array may deliver [] on first render — explicit fallback required
    const safeItems =
        Array.isArray(items) && items.length > 0 ? items : DEFAULT_ITEMS

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    return (
        <div
            style={{
                width: "370px",
                padding: `${padding}px`,
                backgroundColor: globalBackground,
                borderRadius: `${cornerRadius + 6}px`,
                boxSizing: "border-box",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gridAutoRows: `${rowHeight}px`,
                    gap: `${gridGap}px`,
                }}
            >
                {safeItems.map((item, i) => {
                    const isHovered = hoveredIndex === i
                    const colSpan = Math.min(Math.max(item.colSpan || 2, 1), 4)
                    const rowSpan = Math.min(Math.max(item.rowSpan || 1, 1), 3)
                    const isWide = colSpan >= 2

                    return (
                        <div
                            key={i}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                                gridColumn: `span ${colSpan}`,
                                gridRow: `span ${rowSpan}`,
                                backgroundColor:
                                    item.cardBackground || "#1a1a2e",
                                borderRadius: `${cornerRadius}px`,
                                border: `1px solid ${borderColor}`,
                                position: "relative",
                                overflow: "hidden",
                                cursor: "pointer",
                                boxSizing: "border-box",
                            }}
                        >
                            {/* Image background layer */}
                            {item.imageUrl ? (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        right: 0,
                                        bottom: 0,
                                        left: 0,
                                        backgroundImage: `url(${item.imageUrl})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        zIndex: 0,
                                    }}
                                />
                            ) : null}

                            {/* Hover accent background — cross-fade only, zero layout shift */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0,
                                    backgroundColor: accentColor,
                                    opacity: isHovered ? 0.1 : 0,
                                    transition: "opacity 0.25s ease",
                                    pointerEvents: "none",
                                    zIndex: 1,
                                }}
                            />

                            {/* Content — Flexbox center-aligned inside each card */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0,
                                    zIndex: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: isWide
                                        ? "flex-start"
                                        : "center",
                                    justifyContent: "flex-end",
                                    padding: isWide ? "14px 15px" : "10px",
                                    boxSizing: "border-box",
                                    textAlign: isWide ? "left" : "center",
                                }}
                            >
                                <span
                                    style={{
                                        display: "block",
                                        fontSize: isWide ? "13px" : "11px",
                                        fontWeight: 600,
                                        color: textColor,
                                        lineHeight: 1.3,
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    {item.title || "Card Title"}
                                </span>
                                {item.description && isWide ? (
                                    <span
                                        style={{
                                            display: "block",
                                            marginTop: "3px",
                                            fontSize: "11px",
                                            color: textColor,
                                            opacity: 0.5,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        {item.description}
                                    </span>
                                ) : null}
                            </div>

                            {/* Hover accent border — cross-fade only (opacity, not border-color) */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0,
                                    border: `1.5px solid ${accentColor}`,
                                    borderRadius: `${cornerRadius}px`,
                                    opacity: isHovered ? 1 : 0,
                                    transition: "opacity 0.25s ease",
                                    pointerEvents: "none",
                                    zIndex: 3,
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ----------------------------------------------------------------------------
// Property Controls — the buyer's UX in Framer's right-side panel
// ----------------------------------------------------------------------------
addPropertyControls(AdvancedBentoGrid, {
    items: {
        type: ControlType.Array,
        title: "Content Items",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                },
                imageUrl: {
                    type: ControlType.Image,
                    title: "Image",
                },
                cardBackground: {
                    type: ControlType.Color,
                    title: "Card Background",
                    defaultValue: "#1a1a2e",
                },
                colSpan: {
                    type: ControlType.Number,
                    title: "Col Span",
                    min: 1,
                    max: 4,
                    step: 1,
                    defaultValue: 2,
                    displayStepper: true,
                },
                rowSpan: {
                    type: ControlType.Number,
                    title: "Row Span",
                    min: 1,
                    max: 3,
                    step: 1,
                    defaultValue: 1,
                    displayStepper: true,
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    gridGap: {
        type: ControlType.Number,
        title: "Grid Gap",
        min: 4,
        max: 32,
        step: 1,
        defaultValue: 10,
        unit: "px",
    },
    rowHeight: {
        type: ControlType.Number,
        title: "Row Height",
        min: 64,
        max: 200,
        step: 4,
        defaultValue: 108,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 8,
        max: 48,
        step: 2,
        defaultValue: 14,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 32,
        step: 1,
        defaultValue: 14,
        unit: "px",
    },
    globalBackground: {
        type: ControlType.Color,
        title: "Global Background",
        defaultValue: "#0a0a0f",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255,255,255,0.07)",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#6366f1",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
})
