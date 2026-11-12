import {
    useEffect,
    useId,
    useState,
    type CSSProperties,
    type ReactNode,
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

import {
    AnimatePresence,
    LayoutGroup,
    motion,
    useReducedMotion,
} from "framer-motion"

// ---------- Types ----------

type ImageSource = { src: string; srcSet?: string; alt?: string }

type IconKey =
    | "none"
    | "question"
    | "card"
    | "truck"
    | "calendar"
    | "shield"
    | "globe"
    | "chat"
    | "return"
    | "custom"

type Item = {
    question?: string
    answer?: string
    icon?: IconKey
    iconImage?: ImageSource
}

interface Props {
    items?: Item[]
    defaultOpen?: number
    allowCloseAll?: boolean
    showIcons?: boolean
    gap?: number
    radius?: number
    rowHeight?: number
    paddingX?: number
    duration?: number
    bounce?: number
    cardBg?: string
    questionColor?: string
    answerColor?: string
    iconColor?: string
    chevronColor?: string
    hoverBg?: string
    hoverText?: string
    focusColor?: string
    questionFont?: CSSProperties
    answerFont?: CSSProperties
    style?: CSSProperties
}

// ---------- Defaults ----------

const DEFAULT_ITEMS: Item[] = [
    {
        question: "How do I book a trip?",
        answer: "Pick a package or tell us where you want to go. We send a full plan, then you confirm on WhatsApp.",
        icon: "question",
    },
    {
        question: "What payment methods do you accept?",
        answer: "Cards, bank transfer and Apple Pay. You only pay once your plan is confirmed.",
        icon: "card",
    },
    {
        question: "Can I change my travel dates?",
        answer: "Yes. Message us any time before departure and we will rebook flights and hotels where possible.",
        icon: "calendar",
    },
    {
        question: "Is my booking protected?",
        answer: "Every trip includes booking protection, and we stay on call for the whole journey.",
        icon: "shield",
    },
    {
        question: "Do you plan trips abroad?",
        answer: "We plan trips to over 40 countries, from city breaks to island escapes.",
        icon: "globe",
    },
    {
        question: "How fast do you reply?",
        answer: "Usually within an hour, and always the same day.",
        icon: "chat",
    },
]

const ICON_KEYS: IconKey[] = [
    "none",
    "question",
    "card",
    "truck",
    "calendar",
    "shield",
    "globe",
    "chat",
    "return",
    "custom",
]
const ICON_TITLES = [
    "No Icon",
    "Question",
    "Payment",
    "Shipping",
    "Calendar",
    "Shield",
    "Globe",
    "Chat",
    "Return",
    "Custom Image",
]

const HOVER_INSET = 8 // hover fill sits this far inside the card

const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v

// ---------- Icons ----------

function iconPaths(key: IconKey): ReactNode {
    switch (key) {
        case "question":
            return (
                <>
                    <circle cx="10" cy="10" r="7.5" />
                    <path d="M7.8 7.8a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 1.9-2.2 3.2" />
                    <circle
                        cx="10"
                        cy="14.2"
                        r="0.6"
                        fill="currentColor"
                        stroke="none"
                    />
                </>
            )
        case "card":
            return (
                <>
                    <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
                    <path d="M2.5 8h15M5.5 12.5h3" />
                </>
            )
        case "truck":
            return (
                <>
                    <path d="M2.5 5.5h9v8h-9zM11.5 8.5h3l3 3v2h-6" />
                    <circle cx="6" cy="14.5" r="1.5" />
                    <circle cx="14.5" cy="14.5" r="1.5" />
                </>
            )
        case "calendar":
            return (
                <>
                    <rect x="3" y="4.5" width="14" height="12" rx="2" />
                    <path d="M3 8.5h14M7 3v3M13 3v3" />
                </>
            )
        case "shield":
            return (
                <>
                    <path d="M10 2.5l6 2.5v4.5c0 3.8-2.6 6.4-6 8-3.4-1.6-6-4.2-6-8V5z" />
                    <path d="M7.5 10l1.8 1.8 3.4-3.6" />
                </>
            )
        case "globe":
            return (
                <>
                    <circle cx="10" cy="10" r="7.5" />
                    <path d="M2.5 10h15M10 2.5c2 2.2 3 4.7 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.7-3-7.5s1-5.3 3-7.5z" />
                </>
            )
        case "chat":
            return (
                <path d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5z" />
            )
        case "return":
            return (
                <>
                    <path d="M4 8h9a4 4 0 0 1 0 8H8" />
                    <path d="M7 5L4 8l3 3" />
                </>
            )
        default:
            return null
    }
}

function ItemIcon({ item, color }: { item: Item; color: string }) {
    const key = item.icon ?? "none"
    if (key === "none") return null
    if (key === "custom") {
        if (!item.iconImage?.src) return null
        return (
            <img
                src={item.iconImage.src}
                srcSet={item.iconImage.srcSet}
                alt=""
                draggable={false}
                style={{
                    width: 24,
                    height: 24,
                    objectFit: "contain",
                    display: "block",
                    flexShrink: 0,
                }}
            />
        )
    }
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color, display: "block", flexShrink: 0 }}
        >
            {iconPaths(key)}
        </svg>
    )
}

const Chevron = ({ color }: { color: string }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        style={{ color, display: "block" }}
    >
        <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

// ---------- Component ----------

/**
 * Split FAQ
 * A grouped FAQ list. Opening a question splits it out into its own
 * card with the answer; the questions above and below regroup into
 * their own cards. Opening another one closes the first and the cards
 * merge back together, all on a snappy spring.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 480
 */
export default function SplitFAQ(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        defaultOpen = 1,
        allowCloseAll = true,
        showIcons = true,
        gap = 12,
        radius = 24,
        rowHeight = 48,
        paddingX = 20,
        duration = 0.4,
        bounce = 0.15,
        cardBg = "#0A0A0A",
        questionColor = "#E5E5E5",
        answerColor = "rgba(255,255,255,0.56)",
        iconColor = "rgba(255,255,255,0.72)",
        chevronColor = "#FFFFFF",
        hoverBg = "rgba(255,255,255,0.06)",
        hoverText = "#FFFFFF",
        focusColor = "rgba(255,255,255,0.72)",
        questionFont = {},
        answerFont = {},
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const baseId = `faq-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

    const list = items.length > 0 ? items : DEFAULT_ITEMS
    const count = list.length
    const startOpen =
        defaultOpen >= 1 && defaultOpen <= count
            ? Math.round(defaultOpen) - 1
            : null

    const [open, setOpen] = useState<number | null>(startOpen)
    // Row under the pointer, and row focused from the keyboard
    const [hovered, setHovered] = useState<number | null>(null)
    const [focused, setFocused] = useState<number | null>(null)

    // Follow the panel setting while editing
    useEffect(() => {
        setOpen(startOpen)
    }, [startOpen])

    const toggle = (i: number) => {
        if (isStatic) return
        setOpen((cur) => (cur === i ? (allowCloseAll ? null : cur) : i))
    }

    // One spring drives everything, so all parts move as one
    const animated = !isStatic && !reduceMotion
    const spring = {
        type: "spring" as const,
        duration: clamp(duration, 0.1, 1.2),
        bounce: clamp(bounce, 0, 0.6),
    }
    const transition = animated ? spring : { duration: 0 }

    const r = clamp(radius, 0, 40)
    const edge = 8 // inner breathing room at the top and bottom of each card
    const width = style?.width ?? 480

    /* How it stays smooth: nothing is tweened frame by frame in the
       layout. The new arrangement is applied at once and the motion
       layout engine glides every card from its old place and size to
       the new one with GPU transforms. */
    return (
        <LayoutGroup id={baseId}>
            <div
                style={{
                    ...style,
                    width,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {list.map((item, i) => {
                    const isOpen = open === i
                    const isFocused = focused === i && !isStatic
                    const isHover = (hovered === i || isFocused) && !isStatic
                    // Where the cards split: around the open item
                    const startsGroup =
                        i === 0 ||
                        (open !== null && (i === open || i === open + 1))
                    const endsGroup =
                        i === count - 1 ||
                        (open !== null && (i === open || i === open - 1))
                    const splitAbove =
                        i > 0 && open !== null && (i === open || i === open + 1)
                    const panelId = `${baseId}-panel-${i}`
                    const buttonId = `${baseId}-button-${i}`

                    return (
                        <motion.div
                            key={i}
                            layout={animated}
                            initial={false}
                            animate={{
                                borderTopLeftRadius: startsGroup ? r : 0,
                                borderTopRightRadius: startsGroup ? r : 0,
                                borderBottomLeftRadius: endsGroup ? r : 0,
                                borderBottomRightRadius: endsGroup ? r : 0,
                            }}
                            transition={transition}
                            style={{
                                background: cardBg,
                                overflow: "hidden",
                                marginTop: splitAbove ? gap : 0,
                                paddingTop: startsGroup ? edge : 0,
                                paddingBottom: endsGroup ? edge : 0,
                                willChange: animated ? "transform" : undefined,
                            }}
                        >
                            <motion.button
                                layout={animated ? "position" : false}
                                transition={transition}
                                id={buttonId}
                                type="button"
                                aria-expanded={isOpen}
                                aria-controls={isOpen ? panelId : undefined}
                                onClick={() => toggle(i)}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() =>
                                    setHovered((h) => (h === i ? null : h))
                                }
                                onFocus={(e) => {
                                    // Only keyboard focus shows the ring, not mouse clicks
                                    let keyboard = true
                                    try {
                                        keyboard =
                                            e.currentTarget.matches(
                                                ":focus-visible"
                                            )
                                    } catch {}
                                    if (keyboard) setFocused(i)
                                }}
                                onBlur={() =>
                                    setFocused((f) => (f === i ? null : f))
                                }
                                style={{
                                    // Inset so the hover fill sits inside the card edges
                                    width: `calc(100% - ${HOVER_INSET * 2}px)`,
                                    marginLeft: HOVER_INSET,
                                    minHeight: rowHeight,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    padding: `0 ${Math.max(paddingX - HOVER_INSET, 4)}px`,
                                    border: 0,
                                    borderRadius: Math.max(r - HOVER_INSET, 8),
                                    background: isHover
                                        ? hoverBg
                                        : "transparent",
                                    transition: "background 180ms ease",
                                    // Clear focus ring for keyboard users, drawn inside the card
                                    outline: isFocused
                                        ? `2px solid ${focusColor}`
                                        : undefined,
                                    outlineOffset: -2,
                                    cursor: isStatic ? "default" : "pointer",
                                    textAlign: "left",
                                }}
                            >
                                {showIcons && (
                                    <ItemIcon
                                        item={item}
                                        color={isHover ? hoverText : iconColor}
                                    />
                                )}
                                <span
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        fontFamily:
                                            "Inter, system-ui, sans-serif",
                                        fontSize: 16,
                                        lineHeight: "24px",
                                        fontWeight: 500,
                                        ...questionFont,
                                        color: isHover
                                            ? hoverText
                                            : questionColor,
                                        transition: "color 180ms ease",
                                    }}
                                >
                                    {item.question}
                                </span>
                                <motion.span
                                    initial={false}
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={transition}
                                    style={{ display: "flex", flexShrink: 0 }}
                                >
                                    <Chevron color={chevronColor} />
                                </motion.span>
                            </motion.button>

                            <AnimatePresence initial={false} mode="popLayout">
                                {isOpen && (
                                    <motion.div
                                        key="answer"
                                        id={panelId}
                                        role="region"
                                        aria-labelledby={buttonId}
                                        layout={animated ? "position" : false}
                                        initial={
                                            animated
                                                ? { opacity: 0, y: -4 }
                                                : false
                                        }
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={
                                            animated
                                                ? {
                                                      opacity: 0,
                                                      transition: {
                                                          duration: 0.08,
                                                      },
                                                  }
                                                : undefined
                                        }
                                        transition={
                                            animated
                                                ? {
                                                      ...spring,
                                                      opacity: {
                                                          duration: 0.2,
                                                          delay: 0.06,
                                                      },
                                                  }
                                                : { duration: 0 }
                                        }
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                padding: `4px ${paddingX}px 12px`,
                                                color: answerColor,
                                                fontFamily:
                                                    "Inter, system-ui, sans-serif",
                                                fontSize: 16,
                                                lineHeight: "24px",
                                                ...answerFont,
                                            }}
                                        >
                                            {item.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>
        </LayoutGroup>
    )
}

SplitFAQ.displayName = "Split FAQ"

addPropertyControls(SplitFAQ, {
    items: {
        type: ControlType.Array,
        title: "Questions",
        maxCount: 30,
        defaultValue: DEFAULT_ITEMS,
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
                    displayTextArea: true,
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ICON_KEYS,
                    optionTitles: ICON_TITLES,
                    defaultValue: "question",
                },
                iconImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon Image",
                    hidden: (p: Item) => p.icon !== "custom",
                },
            },
        },
    },
    defaultOpen: {
        type: ControlType.Number,
        title: "Open First",
        defaultValue: 1,
        min: 0,
        max: 30,
        step: 1,
        displayStepper: true,
        description: "Question open on load. 0 starts all closed",
    },
    allowCloseAll: {
        type: ControlType.Boolean,
        title: "Close All",
        defaultValue: true,
        description: "Clicking the open question closes it",
    },
    showIcons: {
        type: ControlType.Boolean,
        title: "Icons",
        defaultValue: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.4,
        min: 0.1,
        max: 1.2,
        step: 0.05,
        unit: "s",
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 0.15,
        min: 0,
        max: 0.6,
        step: 0.05,
    },
    gap: {
        type: ControlType.Number,
        title: "Split Gap",
        defaultValue: 12,
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 40,
        step: 4,
        unit: "px",
    },
    rowHeight: {
        type: ControlType.Number,
        title: "Row Height",
        defaultValue: 48,
        min: 32,
        max: 96,
        step: 4,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 20,
        min: 8,
        max: 48,
        step: 4,
        unit: "px",
    },
    questionFont: {
        type: ControlType.Font,
        title: "Question Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 16, lineHeight: "24px" },
    },
    answerFont: {
        type: ControlType.Font,
        title: "Answer Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 16, lineHeight: "24px" },
    },
    cardBg: { type: ControlType.Color, title: "Card", defaultValue: "#0A0A0A" },
    questionColor: {
        type: ControlType.Color,
        title: "Question",
        defaultValue: "#E5E5E5",
    },
    answerColor: {
        type: ControlType.Color,
        title: "Answer",
        defaultValue: "rgba(255,255,255,0.56)",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "rgba(255,255,255,0.72)",
        hidden: (p: Props) => !p.showIcons,
    },
    chevronColor: {
        type: ControlType.Color,
        title: "Chevron",
        defaultValue: "#FFFFFF",
    },
    hoverBg: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "rgba(255,255,255,0.06)",
    },
    hoverText: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
        description: "Question and icon color on hover",
    },
    focusColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "rgba(255,255,255,0.72)",
        description:
            "Outline shown when a question is focused with the keyboard",
    },
})
