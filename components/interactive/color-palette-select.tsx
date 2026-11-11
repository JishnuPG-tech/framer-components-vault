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

import { motion } from "framer-motion"

export default function ColorPalette(props) {
    const [hoveredIndex, setHoveredIndex] = React.useState(null)

    const getScale = (index) => {
        if (hoveredIndex === null) return 1
        const distance = Math.abs(hoveredIndex - index)
        if (distance === 0) return 1.5
        if (distance === 1) return 1.3
        if (distance === 2) return 1.15
        return 1
    }

    const getZIndex = (index) => {
        if (hoveredIndex === index) return 100
        if (Math.abs(hoveredIndex - index) === 1) return 50
        return 1
    }

    return (
        <div style={styles.containerItems}>
            {props.colors.map((color, index) => (
                <PaletteItem
                    key={index}
                    color={color}
                    scale={getScale(index)}
                    zIndex={getZIndex(index)}
                    isHovered={hoveredIndex === index}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                    boxWidth={props.boxWidth}
                    boxHeight={props.boxHeight}
                    borderRadius={props.borderRadius}
                    spacing={props.spacing}
                />
            ))}
        </div>
    )
}

function PaletteItem({
    color,
    scale,
    zIndex,
    onHoverStart,
    onHoverEnd,
    isHovered,
    boxWidth,
    boxHeight,
    borderRadius,
    spacing,
}) {
    const [isCopied, setIsCopied] = React.useState(false)
    const [hexValue, setHexValue] = React.useState(color)

    React.useEffect(() => {
        if (typeof document !== "undefined") {
            try {
                const ctx = document.createElement("canvas").getContext("2d")
                ctx.fillStyle = color
                const converted = ctx.fillStyle.toUpperCase()
                setHexValue(converted)
            } catch (e) {
                setHexValue(color)
            }
        }
    }, [color])

    const handleCopy = async () => {
        const textToCopy = hexValue || color

        if (navigator && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(textToCopy)
                setIsCopied(true)
                setTimeout(() => setIsCopied(false), 1500)
                return
            } catch (err) {
                console.warn("Clipboard API falhou, tentando fallback...")
            }
        }

        try {
            if (typeof document !== "undefined") {
                const textArea = document.createElement("textarea")
                textArea.value = textToCopy
                textArea.style.position = "fixed"
                textArea.style.left = "-9999px"
                textArea.style.top = "0"
                textArea.setAttribute("readonly", "")
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                const successful = document.execCommand("copy")
                document.body.removeChild(textArea)
                if (successful) {
                    setIsCopied(true)
                    setTimeout(() => setIsCopied(false), 1500)
                }
            }
        } catch (err) {
            console.error("Falha ao copiar", err)
        }
    }

    const tooltipBottomPosition = boxHeight + 12
    const tooltipHoverPosition = boxHeight * 1.5 - 8

    return (
        <motion.div
            style={{
                ...styles.itemWrapper,
                zIndex,
                width: boxWidth,
                height: boxHeight,
                margin: `0 ${spacing / 2}px`,
            }}
            animate={{ scale }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
            onClick={handleCopy}
            whileTap={{ scale: scale * 0.9 }}
        >
            <div
                style={{
                    ...styles.colorBlock,
                    backgroundColor: color,
                    borderRadius: borderRadius,
                }}
            />

            <div
                style={{
                    ...styles.tooltip,
                    opacity: isHovered || isCopied ? 1 : 0,
                    bottom:
                        isHovered || isCopied
                            ? tooltipHoverPosition
                            : tooltipBottomPosition,
                }}
            >
                {isCopied ? "✅ Copied" : hexValue}
            </div>
        </motion.div>
    )
}

ColorPalette.defaultProps = {
    colors: [
        "#e53935",
        "#d81b60",
        "#8e24aa",
        "#5e35b1",
        "#3949ab",
        "#1e88e5",
        "#039be5",
        "#00acc1",
        "#00897b",
        "#43a047",
    ],
    boxWidth: 32,
    boxHeight: 40,
    borderRadius: 6,
    spacing: 0,
}

addPropertyControls(ColorPalette, {
    colors: {
        type: ControlType.Array,
        control: { type: ControlType.Color },
        title: "Colors",
    },
    boxWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 32,
        min: 10,
        max: 200,
        step: 1,
    },
    boxHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 40,
        min: 10,
        max: 200,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 6,
        min: 0,
        max: 100,
        step: 1,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
    },
})

const styles = {
    containerItems: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "50px",
        perspective: "1000px",
    },
    itemWrapper: {
        position: "relative",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
    },
    colorBlock: {
        width: "100%",
        height: "100%",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        outline: "none",
        border: "none",
    },
    tooltip: {
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#ffffff",
        padding: "3px 6px",
        borderRadius: "4px",
        fontSize: "8px",
        fontWeight: "bold",
        color: "#333",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        transition: "opacity 0.2s ease, bottom 0.2s ease",
    },
}
