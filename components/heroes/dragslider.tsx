import React, { useRef, useState, useEffect } from "react"
import { motion, useMotionValue, animate } from "framer-motion"
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
 * DragSlider Component
 * A fluid, draggable horizontal slider with custom cursor and navigation arrows.
 * * Helper Instructions:
 * 1. "Items": Connect component instances (like cards or images) to populate the slider.
 * 2. "Enable Hover": Toggle this to unlock custom background and arrow color settings.
 * 3. "Positioning": Use "Arrow Position" to align the controls relative to the slider.
 * 4. "Fluidity": The slider uses spring physics; adjust "Gap" and "Padding" for spacing.
 */

export default function DragSlider(props) {
    const {
        items,
        gap,
        arrowColor,
        padding,
        arrowStroke,
        cursorText,
        zIndex,
        arrowPosition,
        enableHover,
        hoverBgColor,
        hoverArrowColor,
    } = props

    const isStatic = useIsStaticRenderer()
    const constraintsRef = useRef(null)
    const [contentWidth, setContentWidth] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [hoveredBtn, setHoveredBtn] = useState(null)

    const x = useMotionValue(0)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    useEffect(() => {
        if (isStatic) return
        const updateWidth = () => {
            if (constraintsRef.current) {
                const scrollWidth = constraintsRef.current.scrollWidth
                const offsetWidth = constraintsRef.current.offsetWidth
                setContentWidth(Math.max(0, scrollWidth - offsetWidth))
            }
        }
        updateWidth()
        window.addEventListener("resize", updateWidth)
        return () => window.removeEventListener("resize", updateWidth)
    }, [items, gap, isStatic])

    const handleArrow = (direction) => {
        if (isStatic) return
        const currentX = x.get()
        const moveAmount = 600
        let targetX =
            direction === "next" ? currentX - moveAmount : currentX + moveAmount
        targetX = Math.max(Math.min(targetX, 0), -contentWidth)
        animate(x, targetX, { type: "spring", bounce: 0.1, duration: 0.8 })
    }

    if (!items || items.length === 0)
        return <div style={placeholderStyle}>Connect cards in Items list</div>

    // Static fallback: Render items without motion or drag
    if (isStatic) {
        return (
            <div style={{ ...containerStyle, zIndex: zIndex }}>
                <div
                    style={{
                        ...trackStyle,
                        gap: `${gap}px`,
                        paddingLeft: `${padding}px`,
                    }}
                >
                    {items.map((item, index) => (
                        <div key={index} style={itemWrapperStyle}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div style={{ ...containerStyle, zIndex: zIndex }} ref={constraintsRef}>
            <motion.div
                style={{
                    ...cursorStyle,
                    left: mouseX,
                    top: mouseY,
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? (isDragging ? 0.7 : 1) : 0,
                }}
            >
                {cursorText}
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{
                    left: -contentWidth - padding,
                    right: padding,
                }}
                dragElastic={0.15}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                onMouseMove={(e) => {
                    const rect = constraintsRef.current?.getBoundingClientRect()
                    if (rect) {
                        mouseX.set(e.clientX - rect.left)
                        mouseY.set(e.clientY - rect.top)
                    }
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                dragTransition={{
                    power: 0.4,
                    timeConstant: 250,
                    restDelta: 0.5,
                }}
                style={{
                    x,
                    ...trackStyle,
                    gap: `${gap}px`,
                    paddingLeft: `${padding}px`,
                }}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            ...itemWrapperStyle,
                            pointerEvents: isDragging ? "none" : "auto",
                        }}
                        onDragStart={(e) => e.preventDefault()}
                    >
                        {item}
                    </div>
                ))}
            </motion.div>

            <div style={getArrowGroupStyle(arrowPosition)}>
                {["prev", "next"].map((dir) => (
                    <button
                        key={dir}
                        aria-label={
                            dir === "prev" ? "Previous slide" : "Next slide"
                        }
                        onMouseEnter={() => enableHover && setHoveredBtn(dir)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        onClick={() => handleArrow(dir)}
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            border: `${arrowStroke}px solid ${arrowColor}`,
                            background:
                                enableHover && hoveredBtn === dir
                                    ? hoverBgColor
                                    : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            outline: "none",
                            transition:
                                "background-color 0.2s ease, border-color 0.2s ease",
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={
                                enableHover && hoveredBtn === dir
                                    ? hoverArrowColor
                                    : arrowColor
                            }
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path
                                d={
                                    dir === "prev"
                                        ? "M15 18l-6-6 6-6"
                                        : "M9 18l6-6-6-6"
                                }
                            />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    )
}

const getArrowGroupStyle = (position) => {
    const base = { display: "flex", gap: "12px", padding: "20px", zIndex: 3 }
    const posMap = {
        "top-left": { justifyContent: "flex-start", order: -1 },
        "top-right": { justifyContent: "flex-end", order: -1 },
        "bottom-right": { justifyContent: "flex-end" },
        "bottom-left": { justifyContent: "flex-start" },
    }
    return {
        ...base,
        ...posMap[position],
    }
}

const containerStyle = {
    width: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
}
const trackStyle = {
    display: "flex",
    width: "max-content",
    paddingTop: "20px",
    paddingBottom: "20px",
    cursor: "none",
}
const cursorStyle = {
    position: "absolute",
    width: "80px",
    height: "80px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    zIndex: 2,
    pointerEvents: "none",
    marginLeft: "-40px",
    marginTop: "-40px",
}
const itemWrapperStyle = { flex: "0 0 auto", userSelect: "none" }
const placeholderStyle = {
    width: "100%",
    height: "200px",
    border: "1px dashed #444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#888",
}

addPropertyControls(DragSlider, {
    items: {
        title: "Items",
        type: ControlType.Array,
        control: { type: ControlType.ComponentInstance },
        description: "Add the components you want to display in the slider.",
    },
    enableHover: {
        title: "Enable Hover",
        type: ControlType.Boolean,
        defaultValue: true,
        description:
            "Turns on interactive hover states for the navigation arrows.",
    },
    arrowColor: {
        title: "Arrow Color",
        type: ControlType.Color,
        defaultValue: "#D4B144",
        description: "The default color of the navigation arrow icons.",
    },
    arrowStroke: {
        title: "Stroke",
        type: ControlType.Number,
        defaultValue: 2,
        description: "Thickness of the arrow icon line.",
    },
    hoverBgColor: {
        title: "Hover BG Color",
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        hidden: (props) => props.enableHover === false,
        description: "Background color of the arrow button when hovered.",
    },
    hoverArrowColor: {
        title: "Hover Arrow Color",
        type: ControlType.Color,
        defaultValue: "#000000",
        hidden: (props) => props.enableHover === false,
        description: "Color of the arrow icon when the button is hovered.",
    },
    arrowPosition: {
        title: "Arrow Position",
        type: ControlType.Enum,
        options: ["bottom-left", "bottom-right", "top-left", "top-right"],
        optionTitles: ["Bottom Left", "Bottom Right", "Top Left", "Top Right"],
        defaultValue: "bottom-left",
        description:
            "Choose where the navigation buttons appear relative to the slider.",
    },
    zIndex: {
        title: "Z Index",
        type: ControlType.Number,
        defaultValue: 1,
        description: "Controls the stacking order of the component.",
    },
    cursorText: {
        title: "Drag Text",
        type: ControlType.String,
        defaultValue: "Drag",
        description: "The text shown inside the custom cursor.",
    },
    gap: {
        title: "Gap",
        type: ControlType.Number,
        defaultValue: 15,
        description: "Spacing between items in the slider.",
    },
    padding: {
        title: "Padding",
        type: ControlType.Number,
        defaultValue: 20,
        description: "Outer padding for the track.",
    },
})
