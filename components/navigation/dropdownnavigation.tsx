// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState, startTransition } from "react"

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DropdownNavigation(props) {
    const {
        items = [],
        placeholder,
        backgroundColor,
        textColor,
        borderColor,
        accentColor,
        font,
        borderRadius,
        padding,
        shadow,
        initialSelectedIndex,
    } = props

    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex)
    const containerRef = useRef(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        setSelectedIndex(initialSelectedIndex)
    }, [initialSelectedIndex])

    // Close dropdown when clicking outside
    useEffect(() => {
        if (isStatic || !isOpen) return

        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                startTransition(() => setIsOpen(false))
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isStatic, isOpen])

    const handleSelect = (index, item) => {
        startTransition(() => {
            setSelectedIndex(index)
            setIsOpen(false)
        })

        // Handle navigation if a link is provided
        if (item.link && !isStatic) {
            // Check if it's an external link or internal
            if (
                item.link.startsWith("http") ||
                item.link.startsWith("mailto")
            ) {
                window.open(item.link, "_blank")
            } else {
                // For internal links, we try to use window.location
                // In a real Framer site, this might need specific handling depending on router
                window.location.href = item.link
            }
        }
    }

    const toggleDropdown = () => {
        if (isStatic) return
        startTransition(() => setIsOpen(!isOpen))
    }

    const selectedItem =
        selectedIndex >= 0 && selectedIndex < items.length
            ? items[selectedIndex]
            : null

    // Animation variants
    const menuVariants = {
        closed: {
            opacity: 0,
            y: -4,
            scale: 0.98,
            transition: { duration: 0.15, ease: "easeInOut" },
            pointerEvents: "none",
        },
        open: {
            opacity: 1,
            y: 4,
            scale: 1,
            transition: { duration: 0.2, ease: "easeOut" },
            pointerEvents: "auto",
        },
    }

    const chevronVariants = {
        closed: { rotate: 0 },
        open: { rotate: 180 },
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                zIndex: isOpen ? 50 : 1,
                ...font,
            }}
        >
            {/* Trigger Button */}
            <motion.button
                onClick={toggleDropdown}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: `0 ${padding}px`,
                    backgroundColor: backgroundColor,
                    color: textColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: borderRadius,
                    cursor: "pointer",
                    outline: "none",
                    boxShadow: shadow ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                    textAlign: "left",
                    transition: "border-color 0.2s ease",
                    ...font,
                }}
                whileHover={
                    isStatic
                        ? undefined
                        : {
                              borderColor: accentColor,
                              opacity: 0.95,
                          }
                }
                whileTap={{ scale: 0.99 }}
            >
                <span
                    style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        opacity: selectedItem ? 1 : 0.6,
                    }}
                >
                    {selectedItem ? selectedItem.label : placeholder}
                </span>
                <motion.div
                    variants={chevronVariants}
                    animate={isOpen ? "open" : "closed"}
                    transition={{ duration: 0.2 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: 8,
                        opacity: 0.5,
                    }}
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            width: "100%",
                            backgroundColor: backgroundColor,
                            border: `1px solid ${borderColor}`,
                            borderRadius: borderRadius,
                            boxShadow:
                                "0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)",
                            overflow: "hidden",
                            padding: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            maxHeight: 300,
                            overflowY: "auto",
                        }}
                    >
                        {items.map((item, index) => (
                            <DropdownItem
                                key={item.id || index}
                                item={item}
                                isSelected={index === selectedIndex}
                                onClick={() => handleSelect(index, item)}
                                accentColor={accentColor}
                                textColor={textColor}
                                borderRadius={Math.max(0, borderRadius - 2)} // Slightly smaller radius for items
                                padding={padding}
                                font={font}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function DropdownItem({
    item,
    isSelected,
    onClick,
    accentColor,
    textColor,
    borderRadius,
    padding,
    font,
}) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <motion.div
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{
                padding: `8px ${padding}px`,
                cursor: "pointer",
                borderRadius: borderRadius,
                backgroundColor: isSelected
                    ? `${accentColor}15` // 15 is roughly 8% opacity in hex
                    : "transparent",
                color: isSelected ? accentColor : textColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
                borderLeft: `2px solid ${
                    isHovered && !isSelected
                        ? `${accentColor}60` // 40% opacity accent border on hover
                        : "transparent"
                }`,
                paddingLeft: `${padding - 2}px`, // Compensate for border width
                transition:
                    "border-color 0.2s ease, background-color 0.2s ease",
                ...font,
            }}
            whileHover={{
                backgroundColor: isSelected
                    ? `${accentColor}15`
                    : `${accentColor}14`, // Medium soft highlight (12% opacity)
            }}
        >
            <span
                style={{
                    fontWeight: isSelected ? 500 : 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    opacity: isHovered && !isSelected ? 1 : 0.92,
                    transition: "opacity 0.2s ease",
                }}
            >
                {item.label}
            </span>
            {isSelected && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ color: accentColor }}
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </motion.div>
            )}
        </motion.div>
    )
}

addPropertyControls(DropdownNavigation, {
    items: {
        type: ControlType.Array,
        title: "Options",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    defaultValue: "Option Label",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            { label: "Layout A", link: "" },
            { label: "Layout B", link: "" },
            { label: "Layout C", link: "" },
        ],
    },
    initialSelectedIndex: {
        type: ControlType.Number,
        title: "Selected",
        defaultValue: -1,
        min: -1,
        displayStepper: true,
        description: "Index of initially selected item. -1 for none.",
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Select Layout...",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontSize: 14,
            lineHeight: "1.4em",
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#111111",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E5E5E5",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0099FF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 20,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 4,
        max: 32,
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
    },
})
