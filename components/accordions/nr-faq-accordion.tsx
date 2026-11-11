// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useId, startTransition } from "react"

// @framerSupportedLayoutWidth any-prefer-fixed
// @framerSupportedLayoutHeight auto
export default function FaqAccordionNR(props) {
    const {
        items,
        theme,
        bgFill,
        bgColor,
        qColor,
        aColor,
        lineColor,
        accentColor,
        questionFont,
        answerFont,
        questionSize,
        answerSize,
        showIndex,
        singleOpen,
        iconStyle,
        dividers,
        defaultOpen,
        itemPadY,
    } = props

    const presets = {
        Light: {
            bg: "#F6F2EB",
            q: "#0C0C0B",
            a: "#7A6E5A",
            line: "#D4CFC6",
            acc: "#E8604A",
        },
        Dark: {
            bg: "#1A0E48",
            q: "#F6F2EB",
            a: "rgba(246,242,235,0.6)",
            line: "rgba(246,242,235,0.14)",
            acc: "#E8604A",
        },
        Custom: {
            bg: bgColor,
            q: qColor,
            a: aColor,
            line: lineColor,
            acc: accentColor,
        },
    }
    const c = presets[theme] || presets.Light
    const background = bgFill ? c.bg : "transparent"

    const isStatic = useIsStaticRenderer()

    const [open, setOpen] = useState(() => {
        const init = {}
        if (defaultOpen >= 0) init[defaultOpen] = true
        return init
    })

    const rawId = useId()
    const uid = rawId.replace(/[:]/g, "")

    // 폰트 로드
    useEffect(() => {
        const id = "nr-fonts"
        if (typeof document !== "undefined" && !document.getElementById(id)) {
            const link = document.createElement("link")
            link.id = id
            link.rel = "stylesheet"
            link.href =
                "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital@0;1&family=DM+Mono&family=DM+Sans:wght@400;500&display=swap"
            document.head.appendChild(link)
        }
    }, [])

    const toggle = (i) => {
        startTransition(() => {
            setOpen((prev) => {
                if (singleOpen) return prev[i] ? {} : { [i]: true }
                return { ...prev, [i]: !prev[i] }
            })
        })
    }

    const Icon = ({ isOpen }) =>
        iconStyle === "Chevron" ? (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                style={{
                    flexShrink: 0,
                    transition: isStatic ? "none" : "transform 0.3s ease",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
            >
                <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke={c.acc}
                    strokeWidth="2"
                />
            </svg>
        ) : (
            <span
                style={{
                    flexShrink: 0,
                    color: c.acc,
                    fontSize: 26,
                    lineHeight: 1,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: isStatic ? "none" : "transform 0.3s ease",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                }}
            >
                +
            </span>
        )

    return (
        <div
            style={{
                width: "100%",
                background,
                boxSizing: "border-box",
                borderTop: dividers ? `1px solid ${c.line}` : "none",
            }}
        >
            <style>{`.faqnr-${uid} button:focus{outline:none}.faqnr-${uid} button:focus-visible{box-shadow:inset 0 0 0 2px ${c.acc}}`}</style>
            <div className={`faqnr-${uid}`}>
                {items.map((it, i) => {
                    const isOpen = !!open[i]
                    const btnId = `faqnr-${uid}-b${i}`
                    const panelId = `faqnr-${uid}-p${i}`
                    return (
                        <div
                            key={i}
                            style={{
                                borderBottom: dividers
                                    ? `1px solid ${c.line}`
                                    : "none",
                            }}
                        >
                            {/* 질문 행 (button = 키보드/포커스/Enter·Space 자동) */}
                            <button
                                id={btnId}
                                type="button"
                                onClick={() => toggle(i)}
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                style={{
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    background: "transparent",
                                    border: "none",
                                    borderRadius: 0,
                                    margin: 0,
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 20,
                                    padding: `${itemPadY}px 4px`,
                                    cursor: "pointer",
                                    userSelect: "none",
                                    textAlign: "left",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 16,
                                        minWidth: 0,
                                    }}
                                >
                                    {showIndex ? (
                                        <span
                                            style={{
                                                fontFamily:
                                                    "'DM Mono', monospace",
                                                fontSize: answerSize * 0.85,
                                                color: c.acc,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                    ) : null}
                                    <span
                                        style={{
                                            fontFamily: `'${questionFont}', serif`,
                                            fontSize: questionSize,
                                            lineHeight: 1.2,
                                            color: c.q,
                                        }}
                                    >
                                        {it.question}
                                    </span>
                                </div>
                                <Icon isOpen={isOpen} />
                            </button>

                            {/* 답변 (grid 높이 애니메이션 — 정적이면 transition 제거) */}
                            <div
                                id={panelId}
                                role="region"
                                aria-labelledby={btnId}
                                style={{
                                    display: "grid",
                                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                                    transition: isStatic
                                        ? "none"
                                        : "grid-template-rows 0.3s ease",
                                }}
                            >
                                <div style={{ overflow: "hidden" }}>
                                    <div
                                        style={{
                                            fontFamily: `'${answerFont}', sans-serif`,
                                            fontSize: answerSize,
                                            lineHeight: 1.7,
                                            color: c.a,
                                            padding: showIndex
                                                ? `0 40px ${itemPadY}px 40px`
                                                : `0 40px ${itemPadY}px 4px`,
                                            maxWidth: 640,
                                        }}
                                    >
                                        {it.answer}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

FaqAccordionNR.defaultProps = {
    items: [
        {
            question: "What's included in the component?",
            answer: "A fully editable editorial accordion — questions, answers, colors, and fonts all adjustable from the properties panel. Drop it in and make it yours.",
        },
        {
            question: "Can I change the styling?",
            answer: "Yes. Switch between Light, Dark, and Custom themes, toggle the number index and dividers, and set your own accent color.",
        },
        {
            question: "Is it responsive?",
            answer: "It adapts to any container width and works across desktop, tablet, and mobile out of the box.",
        },
        {
            question: "How do I install it?",
            answer: "Copy the component URL and paste it onto your Framer canvas. That's it — no setup required.",
        },
    ],
    theme: "Light",
    bgFill: true,
    bgColor: "#F6F2EB",
    qColor: "#0C0C0B",
    aColor: "#7A6E5A",
    lineColor: "#D4CFC6",
    accentColor: "#E8604A",
    questionFont: "Cormorant Garamond",
    answerFont: "DM Sans",
    questionSize: 26,
    answerSize: 15,
    showIndex: true,
    singleOpen: true,
    iconStyle: "Plus",
    dividers: true,
    defaultOpen: 0,
    itemPadY: 24,
}

addPropertyControls(FaqAccordionNR, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                question: { type: ControlType.String, title: "Question" },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    displayTextArea: true,
                },
            },
        },
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark", "Custom"],
        displaySegmentedControl: true,
    },
    bgFill: {
        type: ControlType.Boolean,
        title: "Background Fill",
        defaultValue: true,
    },
    singleOpen: {
        type: ControlType.Boolean,
        title: "Single Open",
        defaultValue: true,
    },
    showIndex: {
        type: ControlType.Boolean,
        title: "Show Index (01)",
        defaultValue: true,
    },
    iconStyle: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["Plus", "Chevron"],
        displaySegmentedControl: true,
    },
    dividers: {
        type: ControlType.Boolean,
        title: "Dividers",
        defaultValue: true,
    },
    defaultOpen: {
        type: ControlType.Number,
        title: "Default Open",
        min: -1,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    questionFont: {
        type: ControlType.Enum,
        title: "Question Font",
        options: ["Cormorant Garamond", "DM Sans", "DM Mono"],
    },
    answerFont: {
        type: ControlType.Enum,
        title: "Answer Font",
        options: ["DM Sans", "Cormorant Garamond", "DM Mono"],
    },
    questionSize: {
        type: ControlType.Number,
        title: "Question Size",
        min: 14,
        max: 48,
        step: 1,
        unit: "px",
    },
    answerSize: {
        type: ControlType.Number,
        title: "Answer Size",
        min: 11,
        max: 24,
        step: 1,
        unit: "px",
    },
    itemPadY: {
        type: ControlType.Number,
        title: "Item Padding Y",
        min: 8,
        max: 48,
        step: 2,
        unit: "px",
    },
    bgColor: { type: ControlType.Color, title: "BG (Custom)" },
    qColor: { type: ControlType.Color, title: "Question (Custom)" },
    aColor: { type: ControlType.Color, title: "Answer (Custom)" },
    lineColor: { type: ControlType.Color, title: "Line (Custom)" },
    accentColor: { type: ControlType.Color, title: "Accent (Custom)" },
})
