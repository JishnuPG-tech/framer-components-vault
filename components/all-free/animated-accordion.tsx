import React, { useState, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AccordionItem {
    title: string
    body: string
}

interface Props {
    items: AccordionItem[]
    accentColor: string
    type: "single" | "multiple"
    defaultOpenIndex: number
    titleSize: number
    bodySize: number
    titleColor: string
    bodyColor: string
    mutedColor: string
    borderColor: string
    rowGap: number
}

function AccordionIcon({
    isOpen,
    accentColor,
    mutedColor,
}: {
    isOpen: boolean
    accentColor: string
    mutedColor: string
}) {
    return (
        <div
            style={{
                position: "relative",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
            aria-hidden="true"
        >
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    color: isOpen ? accentColor : mutedColor,
                    transition:
                        "transform 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55), color 300ms",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            >
                <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12"
                    strokeDasharray="4 4"
                />
            </svg>

            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: isOpen ? "rotate(90deg) scale(1.1)" : "scale(1)",
                    transition: "transform 500ms",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        width: 12,
                        height: 2,
                        borderRadius: 9999,
                        background: isOpen ? accentColor : mutedColor,
                        transition: "background 500ms",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        height: 12,
                        width: 2,
                        borderRadius: 9999,
                        background: isOpen ? "transparent" : mutedColor,
                        transform: isOpen
                            ? "rotate(90deg) scale(0)"
                            : "scale(1)",
                        transition: "all 500ms",
                    }}
                />
            </div>
        </div>
    )
}

function AccordionRow({
    item,
    idx,
    isOpen,
    onToggle,
    accentColor,
    titleSize,
    bodySize,
    titleColor,
    bodyColor,
    mutedColor,
    borderColor,
}: {
    item: AccordionItem
    idx: number
    isOpen: boolean
    onToggle: () => void
    accentColor: string
    titleSize: number
    bodySize: number
    titleColor: string
    bodyColor: string
    mutedColor: string
    borderColor: string
}) {
    const [hovered, setHovered] = useState(false)
    const contentId = `acc-content-${idx}`

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: 2,
                    marginRight: 16,
                    flexShrink: 0,
                }}
            >
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${
                            isOpen ? accentColor : borderColor
                        }`,
                        boxShadow: isOpen
                            ? `0 0 20px color-mix(in srgb, ${accentColor} 25%, transparent)`
                            : "none",
                        transform: isOpen
                            ? "scale(1.1)"
                            : hovered
                              ? "scale(1.05)"
                              : "scale(1)",
                        cursor: "pointer",
                        userSelect: "none",
                        transition:
                            "background-color 500ms, border-color 500ms, box-shadow 500ms, transform 500ms",
                        padding: 0,
                        outline: "none",
                    }}
                >
                    <AccordionIcon
                        isOpen={isOpen}
                        accentColor={accentColor}
                        mutedColor={mutedColor}
                    />
                </button>
                <div
                    style={{
                        position: "absolute",
                        top: 48,
                        bottom: -12,
                        width: 2,
                        background: isOpen
                            ? `linear-gradient(to bottom, ${accentColor}, transparent)`
                            : "transparent",
                        opacity: isOpen ? 1 : 0,
                        transformOrigin: "top",
                        transform: isOpen ? "scaleY(1)" : "scaleY(0)",
                        transition: "all 500ms",
                    }}
                    aria-hidden="true"
                />
            </div>

            <div
                style={{
                    flex: 1,
                    transform: isOpen
                        ? "translateX(4px)"
                        : hovered
                          ? "translateX(2px)"
                          : "translateX(0)",
                    transition: "transform 500ms",
                }}
            >
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 16,
                        borderRadius: 16,
                        background: isOpen
                            ? "rgba(255, 255, 255, 0.05)"
                            : hovered
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${
                            isOpen
                                ? `color-mix(in srgb, ${accentColor} 25%, transparent)`
                                : borderColor
                        }`,
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        cursor: "pointer",
                        userSelect: "none",
                        transition:
                            "background-color 500ms, border-color 500ms, border-radius 500ms",
                        outline: "none",
                        position: "relative",
                        overflow: "hidden",
                        borderBottomLeftRadius: isOpen ? 0 : 16,
                        borderBottomRightRadius: isOpen ? 0 : 16,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(to right, ${accentColor}, transparent)`,
                            opacity: isOpen ? 0.1 : hovered ? 0.05 : 0,
                            transition: "opacity 150ms",
                            pointerEvents: "none",
                        }}
                        aria-hidden="true"
                    />
                    <span
                        style={{
                            position: "relative",
                            zIndex: 1,
                            fontSize: titleSize,
                            fontWeight: 500,
                            color: isOpen ? titleColor : mutedColor,
                            transition: "color 300ms",
                        }}
                    >
                        {item.title}
                    </span>
                </button>

                <div
                    id={contentId}
                    role="region"
                    aria-hidden={!isOpen}
                    style={{
                        display: "grid",
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        opacity: isOpen ? 1 : 0,
                        transition:
                            "grid-template-rows 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                >
                    <div style={{ overflow: "hidden" }}>
                        <div
                            style={{
                                position: "relative",
                                padding: 20,
                                border: `1px solid color-mix(in srgb, ${accentColor} 12.5%, transparent)`,
                                borderTop: "none",
                                borderBottomLeftRadius: 16,
                                borderBottomRightRadius: 16,
                                background: "rgba(255, 255, 255, 0.02)",
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: 1,
                                    background: `linear-gradient(to right, transparent, color-mix(in srgb, ${accentColor} 31%, transparent), transparent)`,
                                }}
                                aria-hidden="true"
                            />
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 1,
                                    fontSize: bodySize,
                                    lineHeight: 1.55,
                                    color: bodyColor,
                                }}
                            >
                                {item.body}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export function AnimatedAccordion(props: Props) {
    const {
        items,
        accentColor,
        type,
        defaultOpenIndex,
        titleSize,
        bodySize,
        titleColor,
        bodyColor,
        mutedColor,
        borderColor,
        rowGap,
    } = props

    const [openValues, setOpenValues] = useState<string[]>(() => {
        if (defaultOpenIndex < 0 || defaultOpenIndex >= items.length) return []
        return [String(defaultOpenIndex)]
    })

    const toggle = useCallback(
        (value: string) => {
            setOpenValues((prev) => {
                const isOpen = prev.includes(value)
                if (type === "single") return isOpen ? [] : [value]
                return isOpen
                    ? prev.filter((v) => v !== value)
                    : [...prev, value]
            })
        },
        [type]
    )

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                fontFamily:
                    "ui-sans-serif, system-ui, -apple-system, sans-serif",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: 23,
                    top: 40,
                    bottom: 40,
                    width: 2,
                    background: `linear-gradient(to bottom, transparent, ${borderColor}, transparent)`,
                    pointerEvents: "none",
                }}
                aria-hidden="true"
            />
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: rowGap,
                }}
            >
                {items.map((item, idx) => {
                    const value = String(idx)
                    const isOpen = openValues.includes(value)
                    return (
                        <AccordionRow
                            key={idx}
                            item={item}
                            idx={idx}
                            isOpen={isOpen}
                            onToggle={() => toggle(value)}
                            accentColor={accentColor}
                            titleSize={titleSize}
                            bodySize={bodySize}
                            titleColor={titleColor}
                            bodyColor={bodyColor}
                            mutedColor={mutedColor}
                            borderColor={borderColor}
                        />
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(AnimatedAccordion, {
    items: {
        type: ControlType.Array,
        title: "Items",
        defaultValue: [
            {
                title: "What is Future UI?",
                body: "A premium component library focused on motion, materials, and details — drop-in pieces that make a website look like it cost ten times the budget.",
            },
            {
                title: "Built for production",
                body: "Every component is responsive, accessible, and tuned for 60fps. No dependencies you don't need.",
            },
            {
                title: "Customizable through and through",
                body: "Color, size, motion — every parameter is exposed. Match it to your brand in seconds.",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    defaultValue: "Question",
                },
                body: {
                    type: ControlType.String,
                    defaultValue: "Answer",
                    displayTextArea: true,
                },
            },
        },
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#8b5cf6",
    },
    type: {
        type: ControlType.Enum,
        title: "Mode",
        defaultValue: "single",
        options: ["single", "multiple"],
        optionTitles: ["Single open", "Multiple open"],
    },
    defaultOpenIndex: {
        type: ControlType.Number,
        title: "Default Open",
        defaultValue: 0,
        min: -1,
        max: 20,
        step: 1,
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
    },
    bodySize: {
        type: ControlType.Number,
        title: "Body Size",
        defaultValue: 14,
        min: 10,
        max: 20,
        step: 1,
        unit: "px",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#f5f5f5",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "rgba(245, 245, 245, 0.7)",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "rgba(245, 245, 245, 0.5)",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 2,
        unit: "px",
    },
})

export default AnimatedAccordion
