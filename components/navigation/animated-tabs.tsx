// Tabbed audience switcher (Teams / Founders / Designers / Engineers) with a
// per-word masked slide transition between tab contents.
import { useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface TabItem {
    label: string
    text: string
}

interface AudienceTabsProps {
    tabs: TabItem[]
    activeBackground: string
    activeTextColor: string
    inactiveBackground: string
    inactiveTextColor: string
    textColor: string
    tabFont: any
    contentFont: any
    tabCornerRadius: string
    tabsAlign: "flex-start" | "center" | "flex-end"
    duration: number
    stagger: number
    gap: number
    style?: CSSProperties
}

const Y_OFFSET = 150

const DEFAULT_TABS: TabItem[] = [
    {
        label: "Teams",
        text: "Work that moves at the speed of trust. Shared language, aligned direction, and a process that makes collaboration feel genuinely effortless.",
    },
    {
        label: "Founders",
        text: "Turn early conviction into something people actually want. From rough idea to refined product — without losing what made it compelling.",
    },
    {
        label: "Designers",
        text: "Craft interfaces that speak before a single word is read. Visual systems built to carry meaning across every touchpoint of a product.",
    },
    {
        label: "Engineers",
        text: "Build with precision on a foundation that scales. Architecture decisions that outlast the brief and hold up under real-world pressure.",
    },
]

/**
 * Audience Tabs
 *
 * Tabbed content switcher. Switching tabs masks and slides each word of the
 * outgoing text down while the incoming text's words slide up into place.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AudienceTabs(props: AudienceTabsProps) {
    const {
        tabs,
        activeBackground = "#1A1A1A",
        activeTextColor = "#FFFFFF",
        inactiveBackground = "#E5E3DD",
        inactiveTextColor = "#1A1A1A",
        textColor = "#111111",
        tabFont,
        contentFont,
        tabCornerRadius = "999px",
        tabsAlign = "flex-start",
        duration = 0.4,
        stagger = 0.02,
        gap = 24,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const safeTabs = tabs && tabs.length > 0 ? tabs : DEFAULT_TABS
    const [activeIndex, setActiveIndex] = useState(0)
    const clampedIndex = Math.min(activeIndex, safeTabs.length - 1)
    const active = safeTabs[clampedIndex]
    const words = active.text.split(" ")

    function handleSelect(index: number) {
        if (index === clampedIndex) return
        startTransition(() => setActiveIndex(index))
    }

    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                gap,
                width: style?.width === "100%" ? "100%" : "max-content",
                height: style?.height === "100%" ? "100%" : "max-content",
            }}
        >
            <div
                role="tablist"
                style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: tabsAlign,
                }}
            >
                {safeTabs.map((tab, i) => (
                    <button
                        key={i}
                        role="tab"
                        aria-selected={i === clampedIndex}
                        onClick={() => handleSelect(i)}
                        style={{
                            ...tabFont,
                            background:
                                i === clampedIndex
                                    ? activeBackground
                                    : inactiveBackground,
                            color:
                                i === clampedIndex
                                    ? activeTextColor
                                    : inactiveTextColor,
                            border: "none",
                            borderRadius: tabCornerRadius,
                            padding: "10px 22px",
                            margin: 0,
                            cursor: "pointer",
                            transition:
                                "background-color 0.2s ease, color 0.2s ease",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ display: "grid" }}>
                {isStatic ? (
                    <p
                        role="tabpanel"
                        style={{
                            ...contentFont,
                            color: textColor,
                            margin: 0,
                        }}
                    >
                        {active.text}
                    </p>
                ) : (
                    <AnimatePresence initial={false}>
                        <motion.p
                            key={clampedIndex}
                            role="tabpanel"
                            style={{
                                ...contentFont,
                                color: textColor,
                                margin: 0,
                                gridArea: "1 / 1",
                            }}
                        >
                            {words.map((word, i) => (
                                <span
                                    key={i}
                                    style={{
                                        display: "inline-block",
                                        overflow: "hidden",
                                        verticalAlign: "top",
                                    }}
                                >
                                    <motion.span
                                        style={{ display: "inline-block" }}
                                        initial={{ y: `${Y_OFFSET}%` }}
                                        animate={{ y: "0%" }}
                                        exit={{ y: `${Y_OFFSET}%` }}
                                        transition={{
                                            duration,
                                            delay: i * stagger,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    >
                                        {word}
                                        {i < words.length - 1 ? " " : ""}
                                    </motion.span>
                                </span>
                            ))}
                        </motion.p>
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
}

addPropertyControls(AudienceTabs, {
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Tab",
                },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: DEFAULT_TABS,
        maxCount: 8,
    },
    tabFont: {
        type: ControlType.Font,
        title: "Tab Font",
        controls: "extended",
        displayTextAlignment: true,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
    contentFont: {
        type: ControlType.Font,
        title: "Content Font",
        controls: "extended",
        displayTextAlignment: true,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
            textAlign: "left",
        },
    },
    tabCornerRadius: {
        type: ControlType.BorderRadius,
        title: "Tab Corners",
        defaultValue: "999px",
    },
    tabsAlign: {
        type: ControlType.Enum,
        title: "Tabs Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "flex-start",
        displaySegmentedControl: true,
    },
    activeBackground: {
        type: ControlType.Color,
        title: "Active Tab BG",
        defaultValue: "#1A1A1A",
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Tab Text",
        defaultValue: "#FFFFFF",
    },
    inactiveBackground: {
        type: ControlType.Color,
        title: "Inactive Tab BG",
        defaultValue: "#E5E3DD",
    },
    inactiveTextColor: {
        type: ControlType.Color,
        title: "Inactive Tab Text",
        defaultValue: "#1A1A1A",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111111",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.4,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.02,
        min: 0,
        max: 0.1,
        step: 0.005,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
    },
})
