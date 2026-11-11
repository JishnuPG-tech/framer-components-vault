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
import { useState, useRef, useEffect } from "react"

/**
 * LIQUID GOOEY NAVIGATION
 * A segmented nav/tab bar where the highlight pill morphs and melts between
 * items using an SVG goo filter (blur + contrast threshold), producing a
 * liquid metaball blend as it moves — not a sliding rectangle, an actual
 * fluid shape transition. No native Framer primitive does this.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function LiquidGooeyNav(props) {
    const {
        items,
        mode,
        pillColor,
        backgroundColor,
        textColor,
        activeTextColor,
        containerRadius,
        pillPadding,
        gap,
        font,
        gooeyBlur,
        gooeyContrast,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef(null)
    const itemRefs = useRef([])
    const [filterId] = useState(
        () => `goo-${Math.random().toString(36).slice(2, 9)}`
    )
    const [activeIndex, setActiveIndex] = useState(0)
    const [hoverIndex, setHoverIndex] = useState(null)
    const [rect, setRect] = useState({ left: 0, width: 0, height: 0, top: 0 })

    const displayIndex =
        mode === "hover" && hoverIndex !== null ? hoverIndex : activeIndex

    function measure(index) {
        if (isStatic) return
        const node = itemRefs.current[index]
        const container = containerRef.current
        if (!node || !container) return
        setRect({
            left: node.offsetLeft,
            width: node.offsetWidth,
            height: node.offsetHeight,
            top: node.offsetTop,
        })
    }

    useEffect(() => {
        if (isStatic) return
        measure(displayIndex)
        function handleResize() {
            measure(displayIndex)
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayIndex, items.length, isStatic])

    return (
        <div
            ref={containerRef}
            onMouseLeave={() => setHoverIndex(null)}
            style={{
                position: "relative",
                display: "inline-flex",
                gap,
                padding: 6,
                backgroundColor,
                borderRadius: containerRadius,
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            {/* Render interactive liquid goo filter only in live runtime context */}
            {!isStatic && (
                <>
                    {/* Goo filter definition */}
                    <svg style={{ position: "absolute", width: 0, height: 0 }}>
                        <defs>
                            <filter id={filterId}>
                                <feGaussianBlur
                                    in="SourceGraphic"
                                    stdDeviation={gooeyBlur}
                                    result="blur"
                                />
                                <feColorMatrix
                                    in="blur"
                                    mode="matrix"
                                    values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${gooeyContrast} -7`}
                                />
                            </filter>
                        </defs>
                    </svg>

                    {/* Filtered layer for animated morphing blob */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            filter: `url(#${filterId})`,
                            pointerEvents: "none",
                        }}
                    >
                        <motion.div
                            animate={{
                                x: rect.left,
                                y: rect.top,
                                width: rect.width,
                                height: rect.height,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 28,
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                backgroundColor: pillColor,
                                borderRadius: 999,
                            }}
                        />
                    </div>
                </>
            )}

            {/* Navigation items layer */}
            {items.map((item, i) => {
                const isActive = i === displayIndex
                return (
                    <div
                        key={i}
                        ref={(el) => (itemRefs.current[i] = el)}
                        onMouseEnter={() => {
                            if (mode === "hover" && !isStatic) setHoverIndex(i)
                        }}
                        onClick={() => {
                            if (isStatic) return
                            setActiveIndex(i)
                            if (item.link && typeof window !== "undefined") {
                                window.location.href = item.link
                            }
                        }}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            padding: pillPadding,
                            borderRadius: 999,
                            color: isActive ? activeTextColor : textColor,
                            cursor: "pointer",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                            transition: "color 0.2s ease",
                            /* In static canvas mode, render a clean, plain active background highlight */
                            backgroundColor:
                                isStatic && isActive
                                    ? pillColor
                                    : "transparent",
                            ...font,
                        }}
                    >
                        {item.label}
                    </div>
                )
            })}
        </div>
    )
}

LiquidGooeyNav.displayName = "Liquid Gooey Navigation"

addPropertyControls(LiquidGooeyNav, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Item",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: [
            { label: "Home" },
            { label: "Work" },
            { label: "About" },
            { label: "Contact" },
        ],
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["hover", "click"],
        optionTitles: ["Follow Hover", "Click to Select"],
        defaultValue: "hover",
    },
    pillColor: {
        type: ControlType.Color,
        title: "Pill Color",
        defaultValue: "#111111",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f0f0f0",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#333333",
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text Color",
        defaultValue: "#ffffff",
    },
    containerRadius: {
        type: ControlType.Number,
        title: "Container Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
    },
    pillPadding: {
        type: ControlType.String,
        title: "Item Padding",
        defaultValue: "10px 20px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 4,
        min: 0,
        max: 30,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: { fontSize: 14, fontWeight: 600 },
    },
    gooeyBlur: {
        type: ControlType.Number,
        title: "Gooey Blur",
        defaultValue: 8,
        min: 0,
        max: 20,
    },
    gooeyContrast: {
        type: ControlType.Number,
        title: "Gooey Contrast",
        defaultValue: 18,
        min: 5,
        max: 40,
    },
})
