// ============================================================================
// SlideshowNavigator for Framer - Classic Arrow Version
// Author: Fikri (https://www.framer.com/@fikri/)
// ============================================================================

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SlideshowNavigatorProps {
    layout: "horizontal" | "vertical"
    arrowColor: string
    backgroundColor: string
    borderRadius: number
    border: {
        borderWidth: number
        borderStyle: string
        borderColor: string
    }
    size: number
    arrowSize: number
    gap: number
    alignment: "flex-start" | "center" | "flex-end"
    selectedSlideshow: string
    showCounter: boolean
    counterFont: any
    hoverOptions?: {
        enableHover?: boolean
        hoverScale?: number
        hoverBackgroundColor?: string
        hoverArrowColor?: string
    }
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
// @framerDisableUnlink
export default function SlideshowNavigator(props: SlideshowNavigatorProps) {
    const {
        layout = "horizontal",
        arrowColor = "#000",
        backgroundColor = "#fff",
        borderRadius = 40,
        border = { borderWidth: 1, borderStyle: "solid", borderColor: "#ddd" },
        size = 44,
        arrowSize = 20,
        gap = 12,
        alignment = "center",
        selectedSlideshow = "",
        showCounter = false,
        counterFont,
        hoverOptions,
        style,
    } = props

    const enableHover = hoverOptions?.enableHover ?? true
    const hoverScale = hoverOptions?.hoverScale ?? 1.1
    const hoverBackgroundColor = hoverOptions?.hoverBackgroundColor
    const hoverArrowColor = hoverOptions?.hoverArrowColor

    const slideshowRef = useRef<HTMLElement | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [totalSlides, setTotalSlides] = useState(0)
    const [hoveredBtn, setHoveredBtn] = useState<"prev" | "next" | null>(null)

    const updateSlideshowState = (el: HTMLElement | null) => {
        if (!el) return
        const slides = Array.from(
            el.querySelectorAll(
                '[data-framer-component-type="Page"], .framer-slide, [class*="Slide"]'
            )
        )
        const activeSlide = el.querySelector(
            '[aria-current="true"], [data-active="true"], .active'
        )
        if (slides.length > 0) {
            setTotalSlides(slides.length)
            const idx = slides.indexOf(activeSlide as Element)
            if (idx !== -1) setCurrentIndex(idx)
        }
    }

    useLayoutEffect(() => {
        const name = selectedSlideshow?.trim()
        if (!name) return
        const el = document.querySelector<HTMLElement>(
            `[data-framer-name="${CSS.escape(name)}"]`
        )
        slideshowRef.current = el
        updateSlideshowState(el)
        if (!el) return
        const observer = new MutationObserver(() => updateSlideshowState(el))
        observer.observe(el, {
            attributes: true,
            subtree: true,
            childList: true,
            attributeFilter: ["class", "data-active", "aria-current"],
        })
        return () => observer.disconnect()
    }, [selectedSlideshow])

    const handleAction = (direction: "prev" | "next") => {
        const el = slideshowRef.current
        if (!el) return
        const btn = el.querySelector<HTMLElement>(
            direction === "prev"
                ? '[aria-label*="Previous"], [class*="arrow-left"]'
                : '[aria-label*="Next"], [class*="arrow-right"]'
        )
        if (btn) btn.click()
        else {
            const key = direction === "prev" ? "ArrowLeft" : "ArrowRight"
            el.dispatchEvent(
                new KeyboardEvent("keydown", { key, bubbles: true })
            )
        }
    }

    const getButtonStyle = (type: "prev" | "next"): CSSProperties => {
        const isHovering = hoveredBtn === type && enableHover
        const borderWidth = border?.borderWidth ?? 0
        const borderStyle = border?.borderStyle ?? "solid"
        const borderColor = border?.borderColor ?? "transparent"

        return {
            width: size,
            height: size,
            borderRadius,
            backgroundColor:
                isHovering && hoverBackgroundColor
                    ? hoverBackgroundColor
                    : backgroundColor,
            border:
                borderWidth > 0
                    ? `${borderWidth}px ${borderStyle} ${borderColor}`
                    : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isHovering ? `scale(${hoverScale})` : "scale(1)",
            outline: "none",
            padding: 0,
        }
    }

    const getArrowColor = (type: "prev" | "next") => {
        return hoveredBtn === type && enableHover && hoverArrowColor
            ? hoverArrowColor
            : arrowColor
    }

    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: layout === "horizontal" ? "row" : "column",
                alignItems: "center",
                justifyContent: alignment,
                gap,
                width: "100%",
                height: "100%",
            }}
        >
            <button
                style={getButtonStyle("prev")}
                onClick={() => handleAction("prev")}
                onMouseEnter={() => setHoveredBtn("prev")}
                onMouseLeave={() => setHoveredBtn(null)}
                aria-label="Previous Slide"
            >
                <svg
                    width={arrowSize}
                    height={arrowSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={getArrowColor("prev")}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
            </button>

            {showCounter && totalSlides > 0 && (
                <div
                    style={{
                        ...counterFont,
                        color: arrowColor,
                        userSelect: "none",
                    }}
                >
                    {currentIndex + 1} / {totalSlides}
                </div>
            )}

            <button
                style={getButtonStyle("next")}
                onClick={() => handleAction("next")}
                onMouseEnter={() => setHoveredBtn("next")}
                onMouseLeave={() => setHoveredBtn(null)}
                aria-label="Next Slide"
            >
                <svg
                    width={arrowSize}
                    height={arrowSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={getArrowColor("next")}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </button>
        </div>
    )
}

addPropertyControls(SlideshowNavigator, {
    selectedSlideshow: { type: ControlType.String, title: "Target Name" },
    layout: {
        type: ControlType.Enum,
        options: ["horizontal", "vertical"],
        defaultValue: "horizontal",
    },
    alignment: {
        type: ControlType.Enum,
        options: ["flex-start", "center", "flex-end"],
        defaultValue: "center",
    },
    gap: { type: ControlType.Number, defaultValue: 12 },
    size: { type: ControlType.Number, title: "Btn Size", defaultValue: 44 },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 20,
    },
    backgroundColor: { type: ControlType.Color, defaultValue: "#fff" },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#000",
    },
    borderRadius: { type: ControlType.Number, defaultValue: 40 },
    border: {
        type: ControlType.Border,
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#ddd",
        },
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: false,
    },
    counterFont: {
        type: ControlType.Font,
        hidden: (props) => !props.showCounter,
    },
    hoverOptions: {
        type: ControlType.Object,
        title: "Hover State",
        description: "Component made by [Fikri](https://framer.link/hF03j90)",
        controls: {
            enableHover: {
                type: ControlType.Boolean,
                title: "Hover",
                defaultValue: true,
            },
            hoverScale: {
                type: ControlType.Number,
                defaultValue: 1.1,
                step: 0.05,
                hidden: ({ enableHover }) => !enableHover,
            },
            hoverBackgroundColor: {
                type: ControlType.Color,
                title: "Hover BG",
                hidden: ({ enableHover }) => !enableHover,
            },
            hoverArrowColor: {
                type: ControlType.Color,
                title: "Hover Arrow",
                hidden: ({ enableHover }) => !enableHover,
            },
        },
        defaultValue: {
            enableHover: true,
            hoverScale: 1.1,
        },
    },
})
