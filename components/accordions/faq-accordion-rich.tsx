import { useState, useEffect } from "react"
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
 * @framerSupportedLayoutHeight any
 */
export default function FAQAccordion(props) {
    const {
        toggleSize = 34,
        toggleIconSize = 18,
        closeOthers = true,
        animationDuration = 500,
        borderRadius = 14,
        itemGap = 10,
        startOpen = false,
        accentColor = "#0B1E2A",
        bgColor = "#ffffff",
        bgHoverColor = "rgba(127,174,165,0.05)",
        bgOpenColor = "#ffffff",
        borderColor = "rgba(11,30,42,0.1)",
        borderOpenColor = "rgba(11,30,42,0.2)",
        textColor = "#0B1E2A",
        mutedColor = "rgba(11,30,42,0.45)",
        mutedOpenColor = "#0B1E2A",
        answerColor = "rgba(11,30,42,0.65)",
        boldColor = "#0B1E2A",
        italicColor = "inherit",
        toggleBg = "#ffffff",
        toggleBorderColor = "rgba(11,30,42,0.15)",
        toggleBorderHoverColor = "#0B1E2A",
        toggleHoverColor = "#0B1E2A",
        toggleHoverBackground = "rgba(127,174,165,0.08)",
        toggleOpenBg = "#0B1E2A",
        toggleOpenColor = "#ffffff",
        items = [],
        // Font props — extended mode covers size, weight, family, line height, letter spacing
        numberFont,
        questionFont,
        answerFont,
    } = props

    const [openIndex, setOpenIndex] = useState<number | null>(
        startOpen ? 0 : null
    )
    const [hovering, setHovering] = useState<number | null>(null)

    useEffect(() => {
        setOpenIndex(startOpen ? 0 : null)
    }, [startOpen])

    const toggle = (i: number) => {
        setOpenIndex(openIndex === i ? null : i)
    }

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: itemGap,
            }}
        >
            {items.map((item, i) => {
                const open = openIndex === i
                const hover = hovering === i && !open

                return (
                    <div
                        key={i}
                        style={{
                            background: open
                                ? bgOpenColor
                                : hover
                                  ? bgHoverColor
                                  : bgColor,
                            border:
                                "1px solid " +
                                (open ? borderOpenColor : borderColor),
                            borderRadius,
                            overflow: "hidden",
                            transition:
                                "border-color " +
                                animationDuration +
                                "ms ease, box-shadow " +
                                animationDuration +
                                "ms ease, background " +
                                animationDuration +
                                "ms ease",
                            boxShadow: open
                                ? "0 18px 40px -24px rgba(11,30,42,0.15)"
                                : "none",
                        }}
                        onMouseEnter={() => setHovering(i)}
                        onMouseLeave={() => setHovering(null)}
                    >
                        <button
                            onClick={() => toggle(i)}
                            style={{
                                width: "100%",
                                background: "transparent",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 24,
                                padding: "22px 26px",
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: "inherit",
                                color: "inherit",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 20,
                                    flex: 1,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: open
                                            ? mutedOpenColor
                                            : mutedColor,
                                        minWidth: 22,
                                        flexShrink: 0,
                                        transition:
                                            "color " +
                                            animationDuration +
                                            "ms ease",
                                        ...numberFont,
                                    }}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span
                                    style={{
                                        fontSize: 17,
                                        fontWeight: 500,
                                        color: textColor,
                                        ...questionFont,
                                    }}
                                >
                                    {item.question}
                                </span>
                            </div>

                            <div
                                style={{
                                    flexShrink: 0,
                                    width: toggleSize,
                                    height: toggleSize,
                                    borderRadius: "50%",
                                    border:
                                        "1px solid " +
                                        (open
                                            ? accentColor
                                            : hover
                                              ? toggleBorderHoverColor
                                              : toggleBorderColor),
                                    background: open
                                        ? toggleOpenBg
                                        : hover
                                          ? toggleHoverBackground
                                          : toggleBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: open
                                        ? toggleOpenColor
                                        : hover
                                          ? toggleHoverColor
                                          : textColor,
                                    fontSize: toggleIconSize,
                                    fontWeight: 300,
                                    lineHeight: 0,
                                    transform: open
                                        ? "rotate(45deg)"
                                        : "rotate(0deg)",
                                    transition:
                                        "all " +
                                        animationDuration +
                                        "ms cubic-bezier(0.2,0.8,0.2,1)",
                                    userSelect: "none",
                                }}
                            >
                                +
                            </div>
                        </button>

                        <div
                            style={{
                                maxHeight: open ? 500 : 0,
                                overflow: "hidden",
                                transition:
                                    "max-height " +
                                    animationDuration +
                                    "ms cubic-bezier(0.4,0,0.2,1)",
                            }}
                        >
                            <div
                                style={{
                                    padding: "4px 26px 26px 68px",
                                    fontSize: 15,
                                    color: answerColor,
                                    ...answerFont,
                                }}
                            >
                                {item.answer}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(FAQAccordion, {
    items: {
        type: ControlType.Array,
        title: "FAQ Items",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "New question",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue: "Add the answer here.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                question: "What services do you offer?",
                answer: "We offer a range of services tailored to different goals and requirements. Update this answer with a concise overview of your main services.",
            },
            {
                question: "How does the process work?",
                answer: "The process typically begins with a conversation about your needs, followed by planning, delivery, and review. Adjust these stages to match your workflow.",
            },
            {
                question: "How long does it usually take?",
                answer: "Timing depends on the scope and complexity of the request. A clear schedule and important milestones are agreed upon before work begins.",
            },
            {
                question: "Who is this for?",
                answer: "This service is suitable for individuals, teams, and organizations looking for thoughtful support and a clear path from idea to completion.",
            },
            {
                question: "What do you need to get started?",
                answer: "A short description of your goals, relevant background information, and any useful files or references are usually enough to begin.",
            },
            {
                question: "Can the service be customized?",
                answer: "Yes. The scope, deliverables, and approach can be adapted to your priorities. Use this answer to explain the options available to your audience.",
            },
            {
                question: "How can I ask another question?",
                answer: "Use your preferred contact method or enquiry form to reach out. Add your expected response time and any information people should include in their message.",
            },
        ],
        maxCount: 30,
    },
    startOpen: {
        type: ControlType.Boolean,
        title: "Edit Mode",
        enabledTitle: "Open 01",
        disabledTitle: "Closed",
        defaultValue: false,
    },
    closeOthers: {
        type: ControlType.Boolean,
        title: "Close Others",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 500,
        min: 100,
        max: 1000,
        step: 50,
        unit: "ms",
    },
    itemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 14,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0B1E2A",
    },
    bgColor: {
        type: ControlType.Color,
        title: "BG Default",
        defaultValue: "#ffffff",
    },
    bgHoverColor: {
        type: ControlType.Color,
        title: "BG Hover",
        defaultValue: "rgba(127,174,165,0.05)",
    },
    bgOpenColor: {
        type: ControlType.Color,
        title: "BG Open",
        defaultValue: "#ffffff",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Default",
        defaultValue: "rgba(11,30,42,0.1)",
    },
    borderOpenColor: {
        type: ControlType.Color,
        title: "Border Open",
        defaultValue: "rgba(11,30,42,0.2)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Question Color",
        defaultValue: "#0B1E2A",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Number Default",
        defaultValue: "rgba(11,30,42,0.45)",
    },
    mutedOpenColor: {
        type: ControlType.Color,
        title: "Number Open",
        defaultValue: "#0B1E2A",
    },
    answerColor: {
        type: ControlType.Color,
        title: "Answer Color",
        defaultValue: "rgba(11,30,42,0.65)",
    },
    boldColor: {
        type: ControlType.Color,
        title: "Bold Color",
        defaultValue: "#0B1E2A",
    },
    italicColor: {
        type: ControlType.Color,
        title: "Italic Color",
        defaultValue: "inherit",
    },
    toggleBg: {
        type: ControlType.Color,
        title: "Toggle BG",
        defaultValue: "#ffffff",
    },
    toggleBorderColor: {
        type: ControlType.Color,
        title: "Toggle Border",
        defaultValue: "rgba(11,30,42,0.15)",
    },
    toggleBorderHoverColor: {
        type: ControlType.Color,
        title: "Toggle Hover Border",
        defaultValue: "#0B1E2A",
    },
    toggleHoverColor: {
        type: ControlType.Color,
        title: "Toggle Hover Color",
        defaultValue: "#0B1E2A",
    },
    toggleHoverBackground: {
        type: ControlType.Color,
        title: "Toggle Hover BG",
        defaultValue: "rgba(127,174,165,0.08)",
    },
    toggleOpenBg: {
        type: ControlType.Color,
        title: "Toggle Open BG",
        defaultValue: "#0B1E2A",
    },
    toggleOpenColor: {
        type: ControlType.Color,
        title: "Toggle Open Color",
        defaultValue: "#ffffff",
    },
    toggleSize: {
        type: ControlType.Number,
        title: "Toggle Size",
        defaultValue: 34,
        min: 20,
        max: 64,
        step: 2,
        unit: "px",
    },
    toggleIconSize: {
        type: ControlType.Number,
        title: "Toggle Icon Size",
        defaultValue: 18,
        min: 10,
        max: 36,
        step: 1,
        unit: "px",
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
    },
    questionFont: {
        type: ControlType.Font,
        title: "Question Font",
        controls: "extended",
    },
    answerFont: {
        type: ControlType.Font,
        title: "Answer Font",
        controls: "extended",
    },
})
