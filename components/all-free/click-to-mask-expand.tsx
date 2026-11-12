// Responsive click-to-expand container component where only one item is fully open at a time
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

interface MaskExpandProps {
    children: React.ReactNode[]
    orientation: "horizontal" | "vertical"
    collapsedSize: number
    expandedSize: number
    gap: number
    animationDuration: number
    borderRadius: number
    defaultExpanded: number
    style?: CSSProperties
}

/**
 * Expandable Container Component
 *
 * A responsive container where only one item is fully expanded at a time.
 * Items can be added via Framer's drag functionality and will automatically
 * stack and become interactive.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MaskExpand(props: MaskExpandProps) {
    const {
        children = [],
        orientation = "horizontal",
        collapsedSize = 80,
        expandedSize = 400,
        gap = 8,
        animationDuration = 0.3,
        borderRadius = 12,
        defaultExpanded = 0,
        style,
    } = props

    const [expandedIndex, setExpandedIndex] = useState(defaultExpanded)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const isHorizontal = orientation === "horizontal"

    // Convert children to array if it's not already
    const childrenArray = Array.isArray(children)
        ? children
        : children
          ? [children]
          : []

    const handleItemClick = (index: number) => {
        if (index !== expandedIndex) {
            startTransition(() => {
                setExpandedIndex(index)
            })
        }
    }

    const containerStyle: CSSProperties = {
        ...style,
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        gap: `${gap}px`,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
    }

    const getItemSize = (index: number) => {
        const baseSize = index === expandedIndex ? expandedSize : collapsedSize
        const hoverExpansion = 8 // 8px expansion on hover

        if (hoveredIndex === index && index !== expandedIndex) {
            return baseSize + hoverExpansion
        }

        // If another item is hovered, slightly reduce this item's size to compensate
        if (
            hoveredIndex !== null &&
            hoveredIndex !== index &&
            index !== expandedIndex
        ) {
            const reductionPerItem =
                hoverExpansion / Math.max(1, childrenArray.length - 2) // -2 for hovered and expanded items
            return Math.max(baseSize - reductionPerItem, baseSize * 0.9) // Don't reduce too much
        }

        return baseSize
    }

    const getItemStyle = (index: number): CSSProperties => {
        const isExpanded = index === expandedIndex
        const size = getItemSize(index)

        return {
            borderRadius: `${borderRadius}px`,
            overflow: "hidden",
            cursor: isExpanded ? "default" : "pointer",
            position: "relative",
            flexShrink: 0,
            transition: isHorizontal
                ? `width ${animationDuration}s ease-out`
                : `height ${animationDuration}s ease-out`,
            ...(isHorizontal
                ? {
                      width: `${size}px`,
                      height: "100%",
                  }
                : {
                      height: `${size}px`,
                      width: "100%",
                  }),
        }
    }

    const getContentStyle = (index: number): CSSProperties => {
        const isExpanded = index === expandedIndex

        return {
            width: "100%",
            height: "100%",
            overflow: isExpanded ? "visible" : "hidden",
            position: "relative",
        }
    }

    if (childrenArray.length === 0) {
        return (
            <div
                style={{
                    ...containerStyle,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F8F9FA",
                    border: "2px dashed #DEE2E6",
                    borderRadius: `${borderRadius}px`,
                    color: "#6C757D",
                    fontSize: "16px",
                    fontWeight: "500",
                }}
            >
                Drag components here to create expandable items
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <AnimatePresence>
                {childrenArray.map((child, index) => (
                    <motion.div
                        key={index}
                        style={getItemStyle(index)}
                        onClick={() => handleItemClick(index)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        animate={{
                            [isHorizontal ? "width" : "height"]:
                                getItemSize(index),
                        }}
                        transition={{
                            duration: animationDuration,
                            ease: "easeInOut",
                        }}
                        whileTap={
                            index !== expandedIndex
                                ? {
                                      scale: 0.98,
                                      transition: { duration: 0.1 },
                                  }
                                : {}
                        }
                    >
                        <div style={getContentStyle(index)}>{child}</div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(MaskExpand, {
    children: {
        type: ControlType.Array,
        control: {
            type: ControlType.ComponentInstance,
        },
        maxCount: 10,
        title: "Items",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    collapsedSize: {
        type: ControlType.Number,
        title: "Collapsed Size",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 10,
        unit: "px",
    },
    expandedSize: {
        type: ControlType.Number,
        title: "Expanded Size",
        defaultValue: 400,
        min: 200,
        max: 800,
        step: 20,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        unit: "s",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
    },
    defaultExpanded: {
        type: ControlType.Number,
        title: "Default Expanded",
        description:
            "More components by [Sarib Khan](https://www.framer.com/marketplace/components/matrix-pixel-grid/)",
        defaultValue: 0,
        min: 0,
        max: 9,
        step: 1,
        displayStepper: true,
    },
})
