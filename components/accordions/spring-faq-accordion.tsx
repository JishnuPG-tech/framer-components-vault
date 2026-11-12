import * as React from "react"
import {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
    startTransition,
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

import { motion } from "framer-motion"

/**
 * Spring FAQ Accordion — Framer code component
 * -------------------------------------------------------------
 * - Fully driven by Framer property controls: content, typography,
 *   colors, layout/spacing (desktop + mobile), and Framer's own
 *   built-in Transition control (spring stiffness/damping/mass or
 *   tween) for the expand/collapse animation.
 * - Row layout: number / question / open-close label sit in one
 *   row, with the question + answer forming a left-aligned stack.
 * - Below the "breakpoint" width the row switches to a stacked
 *   mobile layout (number + label on top, question below), with
 *   its own spacing controls and no hover states.
 * - useIsStaticRenderer() disables the live animation and every
 *   continuous effect (ResizeObserver, IntersectionObserver) the
 *   moment this component is rendered on the Framer canvas
 *   thumbnail or during export, falling back to a plain styled
 *   snapshot instead.
 * -------------------------------------------------------------
 */

interface FAQItem {
    question: string
    answer: string
}

interface FontValue {
    fontFamily?: string
    fontSize?: string | number
    fontWeight?: number
    fontStyle?: React.CSSProperties["fontStyle"]
    lineHeight?: string | number
    letterSpacing?: string | number
    textAlign?: React.CSSProperties["textAlign"]
}

interface MyComponentProps {
    title: string
    showTitle: boolean
    titleSpacing: number
    items: FAQItem[]
    defaultOpenIndex: number
    layout: "auto" | "row" | "stacked"
    breakpoint: number
    colors: {
        background: string
        border: string
        hoverColor: string
        number: string
        questionActive: string
        questionInactive: string
        answer: string
        label: string
    }
    transition: any
    spacing: {
        desktop: {
            stackGap: number
            rowPadding: string
        }
        mobile: {
            stackGap: number
            rowPadding: string
        }
    }
    titleFont: FontValue
    numberFont: FontValue
    questionFont: FontValue
    answerFont: FontValue
    labelFont: FontValue
    uppercase: boolean
    qaMaxWidth: number
    containerPadding: string
    containerRadius: string
    containerBorder: {
        borderColor?: string
        borderStyle?: "solid" | "dashed" | "dotted" | "double"
        borderWidth?: number
        borderTopWidth?: number
        borderLeftWidth?: number
        borderRightWidth?: number
        borderBottomWidth?: number
    }
    containerBlurEnabled: boolean
    containerBlurAmount: number
    style?: React.CSSProperties
}

interface FAQRowProps {
    item: FAQItem
    index: number
    isOpen: boolean
    isStatic: boolean
    isMobile: boolean
    onToggle: () => void
    colors: MyComponentProps["colors"]
    transition: any
    spacing: {
        stackGap: number
        rowPadding: string
    }
    numberFont: FontValue
    questionFont: FontValue
    answerFont: FontValue
    labelFont: FontValue
    uppercase: boolean
    qaMaxWidth: number
}

/**
 * Static-safe replacement for framer-motion's `useInView`.
 * When `skip` is true (i.e. useIsStaticRenderer() reports we're on
 * the canvas thumbnail or in an export), no IntersectionObserver is
 * ever created — this is the one continuous effect that was still
 * running unconditionally before, and is the fix for this pass.
 */
function useInViewSafe(ref: React.RefObject<HTMLElement>, skip: boolean) {
    const [inView, setInView] = useState(true)
    useEffect(() => {
        if (skip) return
        if (
            typeof window === "undefined" ||
            typeof IntersectionObserver === "undefined"
        )
            return
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.2 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [skip])
    return inView
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SpringFAQAccordion(props: MyComponentProps) {
    const {
        items,
        title,
        showTitle,
        titleSpacing,
        defaultOpenIndex,
        layout,
        breakpoint,
        colors,
        transition,
        spacing,
        titleFont,
        numberFont,
        questionFont,
        answerFont,
        labelFont,
        uppercase,
        qaMaxWidth,
        containerPadding,
        containerRadius,
        containerBorder,
        containerBlurEnabled,
        containerBlurAmount,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [autoStacked, setAutoStacked] = useState(false)
    const [openIndex, setOpenIndex] = useState(
        defaultOpenIndex >= 0 && defaultOpenIndex < items.length
            ? defaultOpenIndex
            : -1
    )

    // Responsive layout detection — skipped entirely in static contexts
    // (canvas thumbnail / export) since it's a continuous effect that
    // has no value once the component is no longer interactive.
    useEffect(() => {
        if (isStatic || layout !== "auto") return
        if (typeof window === "undefined") return
        if (typeof ResizeObserver === "undefined") return
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const isNarrow = entries[0].contentRect.width < breakpoint
            startTransition(() => setAutoStacked(isNarrow))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic, layout, breakpoint])

    const isMobile = useMemo(
        () =>
            layout === "stacked" ||
            (layout === "auto" && !isStatic && autoStacked),
        [layout, isStatic, autoStacked]
    )

    const activeSpacing = useMemo(
        () =>
            isMobile
                ? {
                      stackGap: spacing.mobile.stackGap,
                      rowPadding: spacing.mobile.rowPadding,
                  }
                : {
                      stackGap: spacing.desktop.stackGap,
                      rowPadding: spacing.desktop.rowPadding,
                  },
        [isMobile, spacing]
    )

    const handleToggle = useCallback(
        (i: number) => {
            if (isStatic) return
            startTransition(() => setOpenIndex(openIndex === i ? -1 : i))
        },
        [isStatic, openIndex]
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                background: colors.background,
                padding: containerPadding,
                borderRadius: containerRadius,
                ...containerBorder,
                backdropFilter: containerBlurEnabled
                    ? `blur(${containerBlurAmount}px)`
                    : undefined,
                WebkitBackdropFilter: containerBlurEnabled
                    ? `blur(${containerBlurAmount}px)`
                    : undefined,
                width: "100%",
                height: "100%",
                overflow: "auto",
            }}
        >
            {showTitle && (
                <div
                    style={{
                        paddingTop: 20,
                        paddingBottom: titleSpacing,
                    }}
                >
                    <div
                        style={{
                            color: colors.number,
                            textTransform: uppercase ? "uppercase" : "none",
                            fontFamily: titleFont.fontFamily,
                            fontSize:
                                titleFont.fontSize ?? (isMobile ? 20 : 22),
                            fontWeight: titleFont.fontWeight,
                            fontStyle: titleFont.fontStyle,
                            lineHeight: titleFont.lineHeight,
                            letterSpacing: titleFont.letterSpacing,
                        }}
                    >
                        {title}
                    </div>
                </div>
            )}

            {items.map((item: FAQItem, i: number) => (
                <FAQRow
                    key={i}
                    item={item}
                    index={i}
                    isOpen={openIndex === i}
                    isStatic={isStatic}
                    isMobile={isMobile}
                    onToggle={() => handleToggle(i)}
                    colors={colors}
                    transition={transition}
                    spacing={activeSpacing}
                    numberFont={numberFont}
                    questionFont={questionFont}
                    answerFont={answerFont}
                    labelFont={labelFont}
                    uppercase={uppercase}
                    qaMaxWidth={qaMaxWidth}
                />
            ))}
        </div>
    )
}

function FAQRow({
    item,
    index,
    isOpen,
    isStatic,
    isMobile,
    onToggle,
    colors,
    transition,
    spacing,
    numberFont,
    questionFont,
    answerFont,
    labelFont,
    uppercase,
    qaMaxWidth,
}: FAQRowProps) {
    const [hover, setHover] = useState(false)
    const rowRef = useRef<HTMLDivElement>(null)
    // Gated: creates no IntersectionObserver at all when isStatic is true.
    const inView = useInViewSafe(rowRef, isStatic)
    const setHoverTrue = useCallback(() => {
        if (isStatic) return
        startTransition(() => setHover(true))
    }, [isStatic])
    const setHoverFalse = useCallback(() => {
        if (isStatic) return
        startTransition(() => setHover(false))
    }, [isStatic])
    const hoverTransitionDuration = useMemo(() => {
        const durationFromControl =
            typeof transition?.duration === "number" ? transition.duration : 0.2
        return Math.max(0.08, durationFromControl)
    }, [transition])

    const numberStyle: React.CSSProperties = {
        fontFamily: numberFont.fontFamily,
        fontSize: numberFont.fontSize,
        fontWeight: numberFont.fontWeight,
        fontStyle: numberFont.fontStyle,
        lineHeight: numberFont.lineHeight,
        letterSpacing: numberFont.letterSpacing,
        textAlign: numberFont.textAlign,
        textTransform: uppercase ? "uppercase" : "none",
        color: colors.number,
        flex: "0 0 auto",
    }
    const questionStyle: React.CSSProperties = {
        fontFamily: questionFont.fontFamily,
        fontSize: questionFont.fontSize,
        fontWeight: questionFont.fontWeight,
        fontStyle: questionFont.fontStyle,
        lineHeight: questionFont.lineHeight,
        letterSpacing: questionFont.letterSpacing,
        textAlign: questionFont.textAlign,
        color: hover
            ? colors.hoverColor
            : isOpen
              ? colors.questionActive
              : colors.questionInactive,
        transition: `color ${hoverTransitionDuration}s ease`,
        margin: 0,
    }
    const answerStyle: React.CSSProperties = {
        fontFamily: answerFont.fontFamily,
        fontSize: answerFont.fontSize,
        fontWeight: answerFont.fontWeight,
        fontStyle: answerFont.fontStyle,
        lineHeight: answerFont.lineHeight,
        letterSpacing: answerFont.letterSpacing,
        textAlign: answerFont.textAlign,
        color: colors.answer,
        margin: 0,
        paddingTop: 2,
    }
    const labelStyle: React.CSSProperties = {
        fontFamily: labelFont.fontFamily,
        fontSize: labelFont.fontSize,
        fontWeight: labelFont.fontWeight,
        fontStyle: labelFont.fontStyle,
        lineHeight: labelFont.lineHeight,
        letterSpacing: labelFont.letterSpacing,
        textAlign: labelFont.textAlign,
        color: hover ? colors.hoverColor : colors.label,
        transition: `color ${hoverTransitionDuration}s ease`,
        textTransform: uppercase ? "uppercase" : "none",
        flex: "0 0 auto",
        userSelect: "none",
    }

    const rowStyle: React.CSSProperties = {
        borderBottom: `1px solid ${colors.border}`,
        padding: spacing.rowPadding,
        cursor: isStatic ? "default" : "pointer",
    }

    const columnGap = Math.max(24, spacing.stackGap * 2)
    const mobileTopGap = Math.max(12, spacing.stackGap)

    const answerNode = (
        <motion.div
            initial={false}
            animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
            transition={
                !isStatic && inView
                    ? {
                          ...transition,
                          delay: 0,
                          opacity: {
                              duration: transition?.duration ?? 0.22,
                              delay: 0,
                          },
                          height: {
                              duration: transition?.duration ?? 0.22,
                              delay: 0,
                          },
                      }
                    : { duration: 0 }
            }
            style={{ overflow: "hidden" }}
        >
            <div style={answerStyle}>{item.answer}</div>
        </motion.div>
    )

    const rowContent = isMobile ? (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span style={numberStyle}>
                    {String(index + 1).padStart(2, "0")}
                </span>
                <span
                    style={labelStyle}
                    onMouseEnter={setHoverTrue}
                    onMouseLeave={setHoverFalse}
                    onPointerEnter={setHoverTrue}
                    onPointerLeave={setHoverFalse}
                >
                    {isOpen ? "Close" : "Open"}
                </span>
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing.stackGap,
                    marginTop: mobileTopGap,
                }}
            >
                <p
                    style={questionStyle}
                    onMouseEnter={setHoverTrue}
                    onMouseLeave={setHoverFalse}
                    onPointerEnter={setHoverTrue}
                    onPointerLeave={setHoverFalse}
                >
                    {item.question}
                </p>
                {isStatic
                    ? isOpen && <div style={answerStyle}>{item.answer}</div>
                    : answerNode}
            </div>
        </div>
    ) : (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `minmax(0, 1fr) minmax(0, ${qaMaxWidth}px) minmax(0, 1fr)`,
                columnGap,
                alignItems: "start",
                width: "100%",
            }}
        >
            <div style={{ justifySelf: "start" }}>
                <span style={numberStyle}>
                    {String(index + 1).padStart(2, "0")}
                </span>
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing.stackGap,
                    minWidth: 0,
                    width: "100%",
                }}
            >
                <p
                    style={questionStyle}
                    onMouseEnter={setHoverTrue}
                    onMouseLeave={setHoverFalse}
                    onPointerEnter={setHoverTrue}
                    onPointerLeave={setHoverFalse}
                >
                    {item.question}
                </p>
                {isStatic
                    ? isOpen && <div style={answerStyle}>{item.answer}</div>
                    : answerNode}
            </div>
            <div style={{ justifySelf: "end" }}>
                <span
                    style={labelStyle}
                    onMouseEnter={setHoverTrue}
                    onMouseLeave={setHoverFalse}
                    onPointerEnter={setHoverTrue}
                    onPointerLeave={setHoverFalse}
                >
                    {isOpen ? "Close" : "Open"}
                </span>
            </div>
        </div>
    )

    return (
        <div
            ref={rowRef}
            style={rowStyle}
            role="button"
            tabIndex={isStatic ? -1 : 0}
            aria-expanded={isOpen}
            onClick={onToggle}
            onKeyDown={(e) => {
                if (isStatic) return
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onToggle()
                }
            }}
        >
            {rowContent}
        </div>
    )
}

SpringFAQAccordion.displayName = "Spring FAQ Accordion"

addPropertyControls(SpringFAQAccordion, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["auto", "row", "stacked"],
        optionTitles: [
            "Auto (responsive)",
            "Row (desktop)",
            "Stacked (mobile)",
        ],
        defaultValue: "auto",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        defaultValue: 480,
        min: 280,
        max: 900,
        step: 10,
        hidden: (props) => props.layout !== "auto",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Frequently asked questions",
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    titleSpacing: {
        type: ControlType.Number,
        title: "Title Spacing",
        defaultValue: 12,
        min: 0,
        max: 64,
    },
    items: {
        type: ControlType.Array,
        title: "Questions",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "Question",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue: "Answer",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                question: "Do you offer support after purchasing a template?",
                answer: "Yes — every template includes email support for 30 days after purchase, covering setup questions and bug fixes.",
            },
            {
                question: "Can I customize the templates after purchasing?",
                answer: "Absolutely. You get full access to the source file, so you can change colors, fonts, layout, and content freely.",
            },
            {
                question: "Do your templates include responsive design?",
                answer: "Yes, all our templates are fully responsive, and adapt to desktops, tablets, and mobile devices.",
            },
            {
                question: "How can I get started with one of your templates?",
                answer: "Choose the template that suits you, purchase it, and you'll receive PDF instructions along with the file.",
            },
        ],
    },
    defaultOpenIndex: {
        type: ControlType.Number,
        title: "Default open",
        defaultValue: -1,
        min: -1,
        max: 20,
        step: 1,
        displayStepper: true,
        description: "-1 means every row starts closed.",
    },

    numberFont: {
        type: ControlType.Font,
        title: "Numbers Font",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    questionFont: {
        type: ControlType.Font,
        title: "Questions Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    answerFont: {
        type: ControlType.Font,
        title: "Answers Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.6em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
    },
    qaMaxWidth: {
        type: ControlType.Number,
        title: "Question & Answer Max Width",
        defaultValue: 720,
        min: 280,
        max: 1400,
        step: 10,
        description:
            "Sets the maximum width of the question and answer text block within each row. The number and open/close label stay pinned to the row edges.",
    },
    containerPadding: {
        type: ControlType.Padding,
        title: "Container Padding",
        defaultValue: "24px 24px 24px 24px",
    },
    containerRadius: {
        type: ControlType.BorderRadius,
        title: "Container Radius",
        defaultValue: "16px",
    },
    containerBorder: {
        type: ControlType.Border,
        title: "Container Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(0, 0, 0, 0.1)",
        },
    },
    containerBlurEnabled: {
        type: ControlType.Boolean,
        title: "Background Blur",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    containerBlurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 12,
        min: 0,
        max: 40,
        unit: "px",
        step: 1,
        hidden: (props) => !props.containerBlurEnabled,
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#ffffff",
            },
            border: {
                type: ControlType.Color,
                title: "Divider",
                defaultValue: "#e6e6e6",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: "#000000",
            },
            number: {
                type: ControlType.Color,
                title: "Number",
                defaultValue: "#1a1a1a",
            },
            questionActive: {
                type: ControlType.Color,
                title: "Question — active",
                defaultValue: "#111111",
            },
            questionInactive: {
                type: ControlType.Color,
                title: "Question — inactive",
                defaultValue: "#a3a3a3",
            },
            answer: {
                type: ControlType.Color,
                title: "Answer text",
                defaultValue: "#5c5c5c",
            },
            label: {
                type: ControlType.Color,
                title: "Open / Close label",
                defaultValue: "#111111",
            },
        },
    },

    spacing: {
        type: ControlType.Object,
        title: "Spacing",
        controls: {
            desktop: {
                type: ControlType.Object,
                title: "Desktop (row layout)",
                controls: {
                    stackGap: {
                        type: ControlType.Number,
                        title: "Question ↔ answer",
                        defaultValue: 10,
                        min: 0,
                        max: 32,
                    },
                    rowPadding: {
                        type: ControlType.Padding,
                        title: "Row Padding",
                        defaultValue: "22px 0px 22px 0px",
                    },
                },
            },
            mobile: {
                type: ControlType.Object,
                title: "Mobile (stacked layout)",
                controls: {
                    stackGap: {
                        type: ControlType.Number,
                        title: "Question ↔ answer",
                        defaultValue: 8,
                        min: 0,
                        max: 32,
                    },
                    rowPadding: {
                        type: ControlType.Padding,
                        title: "Row Padding",
                        defaultValue: "18px 0px 18px 0px",
                    },
                },
            },
        },
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { type: "spring", stiffness: 220, damping: 24, mass: 1 },
    },
})
