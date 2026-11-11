import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import NumberFlow, { useCanAnimate } from "@number-flow/react"
import { motion } from "motion/react"

const MotionNumberFlow = motion.create(NumberFlow)

interface PriceItem {
    value: number
    diff: number
}

interface PriceWithDiffProps {
    value: number
    diff: number
    numberSize: number
}

function PriceWithDiff({ value, diff, numberSize }: PriceWithDiffProps) {
    const canAnimate = useCanAnimate()
    const isStaticRenderer = useIsStaticRenderer()

    const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value)

    const formattedDiff = new Intl.NumberFormat("en-US", {
        style: "percent",
        maximumFractionDigits: 2,
    }).format(diff)

    /*
     * Static renderer:
     * Framer uses this when rendering the canvas/export/static preview.
     * Do not run NumberFlow or motion animations here.
     */
    if (isStaticRenderer) {
        return (
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                }}
            >
                <span
                    style={{
                        fontSize: numberSize,
                        fontWeight: 600,
                        lineHeight: 1,
                    }}
                >
                    {formattedPrice}
                </span>

                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        paddingLeft: "0.3em",
                        paddingRight: "0.3em",
                        color: "#ffffff",
                        background:
                            diff > 0 ? "rgb(52, 211, 153)" : "rgb(239, 68, 68)",
                        borderRadius: 999,
                        fontWeight: 600,
                        lineHeight: 1.4,
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            width: "0.75em",
                            height: "0.75em",
                            marginRight: "0.125em",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75em",
                            lineHeight: 1,
                        }}
                    >
                        {diff > 0 ? "↑" : "↓"}
                    </span>

                    {formattedDiff}
                </span>
            </span>
        )
    }

    /*
     * Interactive/live renderer:
     * NumberFlow and Motion animations are enabled here.
     */
    return (
        <span
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
            }}
        >
            <NumberFlow
                value={value}
                style={{
                    fontSize: numberSize,
                    fontWeight: 600,
                    lineHeight: 1,
                }}
                format={{
                    style: "currency",
                    currency: "USD",
                }}
            />

            <motion.span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    paddingLeft: "0.3em",
                    paddingRight: "0.3em",
                    color: "#ffffff",
                    background:
                        diff > 0 ? "rgb(52, 211, 153)" : "rgb(239, 68, 68)",
                    borderRadius: 999,
                }}
                layout={canAnimate}
                transition={{
                    layout: {
                        duration: 0.9,
                        bounce: 0,
                        type: "spring",
                    },
                }}
            >
                <motion.span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "0.75em",
                        height: "0.75em",
                        marginRight: "0.125em",
                        fontSize: "0.75em",
                        fontWeight: 600,
                    }}
                    animate={{
                        rotate: diff > 0 ? 0 : -180,
                    }}
                    initial={false}
                    transition={{
                        type: "spring",
                        duration: 0.5,
                        bounce: 0,
                    }}
                >
                    ↑
                </motion.span>

                <MotionNumberFlow
                    value={diff}
                    style={{
                        fontWeight: 600,
                    }}
                    format={{
                        style: "percent",
                        maximumFractionDigits: 2,
                    }}
                    layout={canAnimate}
                    layoutRoot={canAnimate}
                />
            </motion.span>
        </span>
    )
}

interface NumberFlowTradingProps {
    items: PriceItem[]
    buttonText: string
    showButton: boolean

    numberSize: number

    buttonHeight: number
    buttonPadding: number
    buttonGap: number
    buttonFontSize: number
    buttonBackground: string
    buttonColor: string
    buttonRadius: number
    buttonMarginTop: number
}

export default function NumberFlowTrading(props: NumberFlowTradingProps) {
    const {
        items,
        buttonText,
        showButton,
        numberSize,
        buttonHeight,
        buttonPadding,
        buttonGap,
        buttonFontSize,
        buttonBackground,
        buttonColor,
        buttonRadius,
        buttonMarginTop,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const [currentIndex, setCurrentIndex] = React.useState(0)

    React.useEffect(() => {
        if (currentIndex >= items.length) {
            setCurrentIndex(0)
        }
    }, [items.length, currentIndex])

    const handleCustomClick = () => {
        if (items.length === 0) return

        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
    }

    if (items.length === 0) {
        return null
    }

    /*
     * Always show the first item in static rendering.
     * This avoids relying on interactive state during export.
     */
    const currentItem = isStaticRenderer ? items[0] : items[currentIndex]

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <PriceWithDiff
                value={currentItem.value}
                diff={currentItem.diff}
                numberSize={numberSize}
            />

            {showButton && (
                <button
                    onClick={handleCustomClick}
                    style={{
                        display: "flex",
                        height: buttonHeight,
                        width: "fit-content",
                        marginTop: buttonMarginTop,
                        marginLeft: "auto",
                        marginRight: "auto",
                        alignItems: "center",
                        gap: buttonGap,
                        paddingLeft: buttonPadding,
                        paddingRight: buttonPadding,
                        border: "none",
                        borderRadius: buttonRadius,
                        background: buttonBackground,
                        color: buttonColor,
                        fontSize: buttonFontSize,
                        fontWeight: 500,
                        cursor: isStaticRenderer ? "default" : "pointer",
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M2.72876 6.42462C3.40596 4.15488 5.51032 2.5 8.00002 2.5C10.0902 2.5 11.9092 3.66566 12.8405 5.38592L13.1975 6.04548L14.5166 5.33138L14.1596 4.67183C12.9767 2.48677 10.6625 1 8.00002 1C5.05485 1 2.53485 2.81872 1.50122 5.39447V3.75V3H0.0012207V3.75V7.17462C0.0012207 7.58883 0.337007 7.92462 0.751221 7.92462H4.17584H4.92584V6.42462H4.17584H2.72876ZM13.2713 9.57538H11.8243H11.0743V8.07538H11.8243H15.2489C15.6631 8.07538 15.9989 8.41117 15.9989 8.82538V12.25V13H14.4989V12.25V10.6053C13.4653 13.1812 10.9456 15 8.00002 15C5.35065 15 3.04619 13.5279 1.85809 11.3605L1.49757 10.7029L2.8129 9.98181L3.17342 10.6395C4.10882 12.3458 5.92017 13.5 8.00002 13.5C10.4897 13.5 12.5941 11.8451 13.2713 9.57538Z"
                            fill="currentColor"
                        />
                    </svg>

                    {buttonText}
                </button>
            )}
        </div>
    )
}

NumberFlowTrading.defaultProps = {
    items: [
        {
            value: 124.23,
            diff: 0.0564,
        },
        {
            value: 41.75,
            diff: -0.114,
        },
        {
            value: 2125.95,
            diff: 0.0029,
        },
    ],

    buttonText: "Shuffle",
    showButton: true,

    numberSize: 48,

    buttonHeight: 44,
    buttonPadding: 20,
    buttonGap: 8,
    buttonFontSize: 14,
    buttonBackground: "#171717",
    buttonColor: "#ffffff",
    buttonRadius: 999,
    buttonMarginTop: 16,
}

addPropertyControls(NumberFlowTrading, {
    items: {
        type: ControlType.Array,
        title: "Prices",
        control: {
            type: ControlType.Object,
            controls: {
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    defaultValue: 124.23,
                    step: 0.01,
                },
                diff: {
                    type: ControlType.Number,
                    title: "Difference",
                    defaultValue: 0.0564,
                    step: 0.0001,
                },
            },
        },
        defaultValue: [
            {
                value: 124.23,
                diff: 0.0564,
            },
            {
                value: 41.75,
                diff: -0.114,
            },
            {
                value: 2125.95,
                diff: 0.0029,
            },
        ],
    },

    buttonText: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Shuffle",
    },

    showButton: {
        type: ControlType.Boolean,
        title: "Show Button",
        defaultValue: true,
    },

    numberSize: {
        type: ControlType.Number,
        title: "Price Size",
        min: 12,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 48,
    },

    buttonHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 24,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 44,
    },

    buttonPadding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 20,
    },

    buttonGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },

    buttonFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 8,
        max: 32,
        step: 1,
        unit: "px",
        defaultValue: 14,
    },

    buttonBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#171717",
    },

    buttonColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },

    buttonRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 999,
    },

    buttonMarginTop: {
        type: ControlType.Number,
        title: "Top Space",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
})
