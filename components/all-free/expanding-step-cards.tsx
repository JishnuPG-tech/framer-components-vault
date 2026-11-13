import { useCallback, useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface CardEntry {
    number?: string
    title?: string
    description?: string
    image?: ResponsiveImageValue
}

interface ImpactRowProps {
    cards?: CardEntry[]
    cardHeight: number
    cardRadius: number
    cardPadding: number
    innerGap: number
    columnWidth: number
    columnPaddingY: number
    textGap: number
    imageWidth: number
    imageRadius: number
    imageBackground: string
    gap: number
    cardBackground: string
    numberColor: string
    titleColor: string
    bodyColor: string
    numberFont: CSSProperties
    titleFont: CSSProperties
    bodyFont: CSSProperties
    defaultIndex: number
    resetOnLeave: boolean
    transition: Record<string, unknown>
    stacked?: boolean
    stackedImage?: "right" | "top"
    stackedCardHeight?: number
    stackedImageHeight?: number
    style?: CSSProperties
}

const EMPTY_CARDS: CardEntry[] = []

/**
 * Hover row of impact cards.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1202
 * @framerIntrinsicHeight 453
 */
export default function ImpactRow(props: ImpactRowProps) {
    const {
        cards = EMPTY_CARDS,
        cardHeight,
        cardRadius,
        cardPadding,
        innerGap,
        columnWidth,
        columnPaddingY,
        textGap,
        imageWidth,
        imageRadius,
        imageBackground,
        gap,
        cardBackground,
        numberColor,
        titleColor,
        bodyColor,
        numberFont,
        titleFont,
        bodyFont,
        defaultIndex,
        resetOnLeave,
        transition,
        stacked = false,
        stackedImage = "right",
        stackedCardHeight = 320,
        stackedImageHeight = 220,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [active, setActive] = useState(defaultIndex)

    useEffect(() => {
        setActive(defaultIndex)
    }, [defaultIndex])

    const handleLeave = useCallback(() => {
        if (resetOnLeave) setActive(defaultIndex)
    }, [resetOnLeave, defaultIndex])

    // Both widths come from the same numbers that build the card.
    const collapsedWidth = cardPadding * 2 + columnWidth
    const expandedWidth = collapsedWidth + innerGap + imageWidth

    const numberStyle = useMemo(
        () => ({ margin: 0, color: numberColor, ...numberFont }),
        [numberColor, numberFont]
    )
    const titleStyle = useMemo(
        () => ({ margin: 0, color: titleColor, ...titleFont }),
        [titleColor, titleFont]
    )
    const bodyStyle = useMemo(
        () => ({ margin: 0, color: bodyColor, ...bodyFont }),
        [bodyColor, bodyFont]
    )

    if (cards.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: cardHeight,
                    borderRadius: cardRadius,
                    background: cardBackground,
                    color: bodyColor,
                    fontSize: 14,
                    ...style,
                }}
            >
                Add cards in the properties panel.
            </div>
        )
    }

    // Stacked: one full-width card per row, every image visible. Used on
    // narrow breakpoints where the hover row cannot fit.
    if (stacked) {
        const imageOnTop = stackedImage === "top"
        return (
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap,
                    width: "100%",
                    ...style,
                    height: "auto",
                }}
            >
                {cards.map((card, index) => (
                    <div
                        key={index}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: cardPadding,
                            borderRadius: cardRadius,
                            background: cardBackground,
                            display: "flex",
                            flexDirection: imageOnTop ? "column" : "row",
                            alignItems: "stretch",
                            gap: innerGap,
                            height: imageOnTop ? "auto" : stackedCardHeight,
                        }}
                    >
                        <div
                            style={{
                                flex: "1 1 0",
                                minWidth: 0,
                                boxSizing: "border-box",
                                padding: imageOnTop
                                    ? `0 ${cardPadding}px ${columnPaddingY}px`
                                    : `${columnPaddingY}px 0 ${columnPaddingY}px ${cardPadding}px`,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: imageOnTop ? 24 : 0,
                                order: imageOnTop ? 2 : 1,
                            }}
                        >
                            <span style={numberStyle}>{card?.number}</span>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: textGap,
                                    width: "100%",
                                }}
                            >
                                <h3 style={titleStyle}>{card?.title}</h3>
                                <p style={bodyStyle}>{card?.description}</p>
                            </div>
                        </div>
                        <div
                            style={{
                                flex: "0 0 auto",
                                width: imageOnTop ? "100%" : imageWidth,
                                height: imageOnTop
                                    ? stackedImageHeight
                                    : "auto",
                                borderRadius: imageRadius,
                                overflow: "hidden",
                                background: imageBackground,
                                order: imageOnTop ? 1 : 2,
                            }}
                        >
                            {card?.image?.src ? (
                                <img
                                    src={card.image.src}
                                    srcSet={card.image.srcSet}
                                    alt={card.image.alt || ""}
                                    decoding="async"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const safeActive = Math.min(active, cards.length - 1)
    // One expanded card plus collapsed ones - a constant.
    const totalWidth =
        expandedWidth +
        collapsedWidth * (cards.length - 1) +
        gap * (cards.length - 1)

    return (
        <div
            onMouseLeave={handleLeave}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap,
                width: totalWidth,
                height: cardHeight,
                ...style,
            }}
        >
            {cards.map((card, index) => {
                const isActive = index === safeActive
                return (
                    <motion.div
                        key={index}
                        onMouseEnter={() => setActive(index)}
                        onPointerEnter={() => setActive(index)}
                        onFocus={() => setActive(index)}
                        tabIndex={0}
                        aria-expanded={isActive}
                        style={{
                            position: "relative",
                            // Neither grow nor shrink: the widths above are
                            // the only thing deciding the layout.
                            flex: "0 0 auto",
                            height: "100%",
                            // The card growing paints above those shrinking.
                            zIndex: isActive ? 2 : 1,
                            overflow: "hidden",
                            borderRadius: cardRadius,
                            background: cardBackground,
                            outline: "none",
                            willChange: "width",
                        }}
                        initial={false}
                        animate={{
                            width: isActive ? expandedWidth : collapsedWidth,
                        }}
                        transition={isStatic ? { duration: 0 } : transition}
                    >
                        {/* Always laid out at full width and clipped by the
                            wrapper, so widening reveals the image rather than
                            reflowing the card. */}
                        <div
                            style={{
                                width: expandedWidth,
                                height: "100%",
                                boxSizing: "border-box",
                                padding: cardPadding,
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: innerGap,
                            }}
                        >
                            <div
                                style={{
                                    flex: "0 0 auto",
                                    width: columnWidth,
                                    height: "100%",
                                    boxSizing: "border-box",
                                    padding: `${columnPaddingY}px 0`,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                }}
                            >
                                <span style={numberStyle}>{card?.number}</span>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: textGap,
                                        width: "100%",
                                    }}
                                >
                                    <h3 style={titleStyle}>{card?.title}</h3>
                                    <p style={bodyStyle}>{card?.description}</p>
                                </div>
                            </div>

                            <div
                                style={{
                                    flex: "0 0 auto",
                                    width: imageWidth,
                                    height: "100%",
                                    borderRadius: imageRadius,
                                    overflow: "hidden",
                                    background: imageBackground,
                                }}
                            >
                                {card?.image?.src ? (
                                    <img
                                        src={card.image.src}
                                        srcSet={card.image.srcSet}
                                        alt={card.image.alt || ""}
                                        decoding="async"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : null}
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

const defaultCards: CardEntry[] = [
    {
        number: "01",
        title: "Scan website",
        description:
            "Paste your URL and let our clinical engine run a comprehensive 360° technical scan instantly.",
    },
    {
        number: "02",
        title: "Read the diagnosis",
        description:
            "Every fault is ranked by the traffic actually at risk, so the first fix on the list is the one that pays.",
    },
    {
        number: "03",
        title: "Ship the fixes",
        description:
            "Approved changes go live through your CMS and are tracked against the pages they touched.",
    },
]

addPropertyControls(ImpactRow, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                number: {
                    type: ControlType.String,
                    title: "Number",
                    defaultValue: "01",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Scan website",
                },
                description: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                    defaultValue: "",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "Shown when the card is expanded.",
                },
            },
        },
        defaultValue: defaultCards,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 453,
        min: 100,
        max: 1200,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    columnWidth: {
        type: ControlType.Number,
        title: "Text W",
        description:
            "Width of the text column. Collapsed card = padding + this + padding.",
        defaultValue: 275,
        min: 100,
        max: 800,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    stacked: {
        type: ControlType.Boolean,
        title: "Stacked",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    stackedImage: {
        type: ControlType.Enum,
        title: "Stack Image",
        options: ["right", "top"],
        optionTitles: ["Right", "Top"],
        defaultValue: "right",
        hidden: (props: any) => !props.stacked,
    },
    stackedCardHeight: {
        type: ControlType.Number,
        title: "Stack Card H",
        defaultValue: 320,
        min: 120,
        max: 900,
        step: 1,
        unit: "px",
        displayStepper: false,
        hidden: (props: any) => !props.stacked || props.stackedImage === "top",
    },
    stackedImageHeight: {
        type: ControlType.Number,
        title: "Stack Image H",
        defaultValue: 220,
        min: 80,
        max: 900,
        step: 1,
        unit: "px",
        displayStepper: false,
        hidden: (props: any) => !props.stacked || props.stackedImage !== "top",
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image W",
        description: "Revealed when the card expands.",
        defaultValue: 257,
        min: 50,
        max: 900,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    innerGap: {
        type: ControlType.Number,
        title: "Text ↔ Image",
        defaultValue: 32,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    columnPaddingY: {
        type: ControlType.Number,
        title: "Text P Y",
        defaultValue: 20,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    textGap: {
        type: ControlType.Number,
        title: "Title ↔ Text",
        defaultValue: 8,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    gap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image R",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgb(248, 248, 243)",
    },
    imageBackground: {
        type: ControlType.Color,
        title: "Image BG",
        defaultValue: "rgb(235, 233, 210)",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number",
        defaultValue: "rgba(26, 26, 28, 0.6)",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "rgb(26, 26, 28)",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "rgba(26, 26, 28, 0.6)",
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Regular",
            lineHeight: "1.2em",
            letterSpacing: "0px",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Regular",
            lineHeight: "1.2em",
            letterSpacing: "0px",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Regular",
            lineHeight: "1.2em",
            letterSpacing: "0px",
        },
    },
    defaultIndex: {
        type: ControlType.Number,
        title: "Start",
        description:
            "Which card is expanded before anything is hovered. 0 is the first.",
        defaultValue: 0,
        min: 0,
        max: 9,
        step: 1,
        displayStepper: true,
    },
    resetOnLeave: {
        type: ControlType.Boolean,
        title: "On Leave",
        enabledTitle: "Reset",
        disabledTitle: "Keep",
        defaultValue: true,
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "spring",
            stiffness: 260,
            damping: 34,
            mass: 0.9,
        },
    },
})
