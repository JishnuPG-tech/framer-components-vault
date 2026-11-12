import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { createPortal } from "react-dom"

interface Props {
    // Trigger
    triggerText: string
    triggerFont: any
    triggerBgColor: string
    triggerTextColor: string
    triggerBorderColor: string
    triggerBorderRadius: number
    triggerPaddingX: number
    triggerPaddingY: number

    // Drawer
    direction: "top" | "right" | "bottom" | "left"
    drawerBgColor: string
    drawerSize: number
    overlayColor: string
    overlayOpacity: number

    // Content
    title: string
    description: string
    contentPlacement: "top" | "bottom"
    textAlign: "left" | "center" | "right"
    paragraph1: string
    paragraph2: string
    paragraph3: string
    showParagraph2: boolean
    showParagraph3: boolean

    // Typography
    titleFont: any
    descriptionFont: any
    bodyFont: any
    buttonFont: any

    // Stagger
    staggerDelay: number
    staggerDirection: "up" | "down"

    // Buttons
    submitText: string
    cancelText: string
    submitBgColor: string
    submitTextColor: string
    cancelBgColor: string
    cancelTextColor: string
    buttonBorderRadius: number
}

export default function Drawer(props: Props) {
    const {
        triggerText = "Open Drawer",
        triggerFont,
        triggerBgColor = "#ffffff",
        triggerTextColor = "#09090b",
        triggerBorderColor = "#e4e4e7",
        triggerBorderRadius = 8,
        triggerPaddingX = 16,
        triggerPaddingY = 10,
        direction = "bottom",
        drawerBgColor = "#ffffff",
        drawerSize = 50,
        overlayColor = "#000000",
        overlayOpacity = 0.8,
        title = "Move Goal",
        description = "Set your daily activity goal.",
        contentPlacement = "top",
        textAlign = "center",
        paragraph1 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        paragraph2 = "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        paragraph3 = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        showParagraph2 = true,
        showParagraph3 = true,
        titleFont,
        descriptionFont,
        bodyFont,
        buttonFont,
        staggerDelay = 0.08,
        staggerDirection = "up",
        submitText = "Submit",
        cancelText = "Cancel",
        submitBgColor = "#18181b",
        submitTextColor = "#fafafa",
        cancelBgColor = "#ffffff",
        cancelTextColor = "#09090b",
        buttonBorderRadius = 8,
    } = props

    const [isOpen, setIsOpen] = useState(false)
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
        null
    )

    useEffect(() => {
        setPortalContainer(document.body)
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    const getDrawerStyles = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: "fixed",
            backgroundColor: drawerBgColor,
            display: "flex",
            flexDirection: "column",
            zIndex: 51,
        }

        switch (direction) {
            case "top":
                return {
                    ...base,
                    top: 0,
                    left: 0,
                    right: 0,
                    maxHeight: `${drawerSize}vh`,
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                }
            case "bottom":
                return {
                    ...base,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    maxHeight: `${drawerSize}vh`,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                }
            case "left":
                return {
                    ...base,
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${drawerSize}vw`,
                    maxWidth: 400,
                }
            case "right":
                return {
                    ...base,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: `${drawerSize}vw`,
                    maxWidth: 400,
                }
        }
    }

    const getDrawerAnimationVariants = () => {
        switch (direction) {
            case "top":
                return {
                    hidden: { y: "-100%" },
                    visible: { y: 0 },
                    exit: { y: "-100%" },
                }
            case "bottom":
                return {
                    hidden: { y: "100%" },
                    visible: { y: 0 },
                    exit: { y: "100%" },
                }
            case "left":
                return {
                    hidden: { x: "-100%" },
                    visible: { x: 0 },
                    exit: { x: "-100%" },
                }
            case "right":
                return {
                    hidden: { x: "100%" },
                    visible: { x: 0 },
                    exit: { x: "100%" },
                }
        }
    }

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0.1,
            },
        },
        exit: {
            transition: {
                staggerChildren: staggerDelay / 2,
                staggerDirection: -1,
            },
        },
    }

    const getItemVariants = () => {
        const yOffset = staggerDirection === "up" ? 20 : -20
        return {
            hidden: {
                opacity: 0,
                y: yOffset,
            },
            visible: {
                opacity: 1,
                y: 0,
                transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                },
            },
            exit: {
                opacity: 0,
                y: yOffset / 2,
                transition: {
                    duration: 0.15,
                },
            },
        }
    }

    const itemVariants = getItemVariants()

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false)
        }
    }

    const paragraphs = [paragraph1]
    if (showParagraph2 && paragraph2) paragraphs.push(paragraph2)
    if (showParagraph3 && paragraph3) paragraphs.push(paragraph3)

    const drawerContent = (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: overlayOpacity }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleBackdropClick}
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: overlayColor,
                            zIndex: 50,
                        }}
                    />

                    {/* Drawer */}
                    <motion.div
                        variants={getDrawerAnimationVariants()}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                        }}
                        style={getDrawerStyles()}
                    >
                        {(direction === "top" || direction === "bottom") && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    padding: "12px 0 8px",
                                    order: direction === "top" ? 1 : -1,
                                }}
                            >
                                <div
                                    style={{
                                        width: 48,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: "#e4e4e7",
                                    }}
                                />
                            </div>
                        )}

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                                overflow: "hidden",
                            }}
                        >
                            {contentPlacement === "top" && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: "16px 24px",
                                        textAlign: textAlign,
                                    }}
                                >
                                    <h2
                                        style={{
                                            margin: 0,
                                            color: "#09090b",
                                            ...titleFont,
                                        }}
                                    >
                                        {title}
                                    </h2>
                                    <p
                                        style={{
                                            margin: "4px 0 0",
                                            color: "#71717a",
                                            ...descriptionFont,
                                        }}
                                    >
                                        {description}
                                    </p>
                                </motion.div>
                            )}

                            <div
                                style={{
                                    flex: 1,
                                    overflowY: "auto",
                                    padding: "0 24px",
                                    order:
                                        contentPlacement === "bottom" ? -1 : 0,
                                }}
                            >
                                {paragraphs.map((text, index) => (
                                    <motion.p
                                        key={index}
                                        variants={itemVariants}
                                        style={{
                                            margin: "0 0 16px",
                                            color: "#3f3f46",
                                            textAlign: textAlign,
                                            ...bodyFont,
                                        }}
                                    >
                                        {text}
                                    </motion.p>
                                ))}
                            </div>

                            {contentPlacement === "bottom" && (
                                <motion.div
                                    variants={itemVariants}
                                    style={{
                                        padding: "16px 24px",
                                        textAlign: textAlign,
                                    }}
                                >
                                    <h2
                                        style={{
                                            margin: 0,
                                            color: "#09090b",
                                            ...titleFont,
                                        }}
                                    >
                                        {title}
                                    </h2>
                                    <p
                                        style={{
                                            margin: "4px 0 0",
                                            color: "#71717a",
                                            ...descriptionFont,
                                        }}
                                    >
                                        {description}
                                    </p>
                                </motion.div>
                            )}

                            <motion.div
                                variants={itemVariants}
                                style={{
                                    padding: 24,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                <motion.button
                                    variants={itemVariants}
                                    onClick={() => setIsOpen(false)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        padding: "10px 16px",
                                        backgroundColor: submitBgColor,
                                        color: submitTextColor,
                                        border: "none",
                                        borderRadius: buttonBorderRadius,
                                        cursor: "pointer",
                                        ...buttonFont,
                                    }}
                                >
                                    {submitText}
                                </motion.button>
                                <motion.button
                                    variants={itemVariants}
                                    onClick={() => setIsOpen(false)}
                                    whileHover={{
                                        scale: 1.02,
                                        backgroundColor: "#f4f4f5",
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        padding: "10px 16px",
                                        backgroundColor: cancelBgColor,
                                        color: cancelTextColor,
                                        border: `1px solid ${triggerBorderColor}`,
                                        borderRadius: buttonBorderRadius,
                                        cursor: "pointer",
                                        ...buttonFont,
                                    }}
                                >
                                    {cancelText}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )

    return (
        <>
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.02, backgroundColor: "#f4f4f5" }}
                whileTap={{ scale: 0.98 }}
                style={{
                    padding: `${triggerPaddingY}px ${triggerPaddingX}px`,
                    backgroundColor: triggerBgColor,
                    color: triggerTextColor,
                    border: `1px solid ${triggerBorderColor}`,
                    borderRadius: triggerBorderRadius,
                    cursor: "pointer",
                    ...triggerFont,
                }}
            >
                {triggerText}
            </motion.button>

            {portalContainer && createPortal(drawerContent, portalContainer)}
        </>
    )
}

addPropertyControls(Drawer, {
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["top", "right", "bottom", "left"],
        optionTitles: ["Top", "Right", "Bottom", "Left"],
        defaultValue: "bottom",
    },
    drawerSize: {
        type: ControlType.Number,
        title: "Drawer Size",
        min: 20,
        max: 100,
        step: 5,
        defaultValue: 50,
        description: "vh for top/bottom, vw for left/right",
    },
    contentPlacement: {
        type: ControlType.Enum,
        title: "Content Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "top",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        optionIcons: [
            "text-align-left",
            "text-align-center",
            "text-align-right",
        ],
        displaySegmentedControl: true,
        defaultValue: "center",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        min: 0.02,
        max: 0.3,
        step: 0.02,
        defaultValue: 0.08,
        description: "Delay between each element",
    },
    staggerDirection: {
        type: ControlType.Enum,
        title: "Stagger From",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        defaultValue: "up",
    },

    // Trigger
    triggerText: {
        type: ControlType.String,
        title: "Trigger Text",
        defaultValue: "Open Drawer",
    },
    triggerFont: {
        type: ControlType.Font,
        title: "Trigger Font",
        controls: "extended",
        defaultValue: {
            fontSize: 14,
            variant: "Medium",
        },
    },
    triggerBgColor: {
        type: ControlType.Color,
        title: "Trigger Bg",
        defaultValue: "#ffffff",
    },
    triggerTextColor: {
        type: ControlType.Color,
        title: "Trigger Text",
        defaultValue: "#09090b",
    },
    triggerBorderColor: {
        type: ControlType.Color,
        title: "Trigger Border",
        defaultValue: "#e4e4e7",
    },
    triggerBorderRadius: {
        type: ControlType.Number,
        title: "Trigger Radius",
        min: 0,
        max: 24,
        defaultValue: 8,
    },
    triggerPaddingX: {
        type: ControlType.Number,
        title: "Trigger Pad X",
        min: 0,
        max: 48,
        defaultValue: 16,
    },
    triggerPaddingY: {
        type: ControlType.Number,
        title: "Trigger Pad Y",
        min: 0,
        max: 24,
        defaultValue: 10,
    },

    // Drawer chrome
    drawerBgColor: {
        type: ControlType.Color,
        title: "Drawer Bg",
        defaultValue: "#ffffff",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.8,
    },

    // Header content
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Move Goal",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultValue: {
            fontSize: 18,
            variant: "Semibold",
        },
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Set your daily activity goal.",
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultValue: {
            fontSize: 14,
            variant: "Regular",
        },
    },

    // Body
    paragraph1: {
        type: ControlType.String,
        title: "Paragraph 1",
        defaultValue:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        displayTextArea: true,
    },
    showParagraph2: {
        type: ControlType.Boolean,
        title: "Show Para 2",
        defaultValue: true,
    },
    paragraph2: {
        type: ControlType.String,
        title: "Paragraph 2",
        defaultValue:
            "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        displayTextArea: true,
        hidden: (props) => !props.showParagraph2,
    },
    showParagraph3: {
        type: ControlType.Boolean,
        title: "Show Para 3",
        defaultValue: true,
    },
    paragraph3: {
        type: ControlType.String,
        title: "Paragraph 3",
        defaultValue:
            "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        displayTextArea: true,
        hidden: (props) => !props.showParagraph3,
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultValue: {
            fontSize: 14,
            variant: "Regular",
        },
    },

    // Buttons
    submitText: {
        type: ControlType.String,
        title: "Submit Text",
        defaultValue: "Submit",
    },
    cancelText: {
        type: ControlType.String,
        title: "Cancel Text",
        defaultValue: "Cancel",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultValue: {
            fontSize: 14,
            variant: "Medium",
        },
    },
    submitBgColor: {
        type: ControlType.Color,
        title: "Submit Bg",
        defaultValue: "#18181b",
    },
    submitTextColor: {
        type: ControlType.Color,
        title: "Submit Text",
        defaultValue: "#fafafa",
    },
    cancelBgColor: {
        type: ControlType.Color,
        title: "Cancel Bg",
        defaultValue: "#ffffff",
    },
    cancelTextColor: {
        type: ControlType.Color,
        title: "Cancel Text",
        defaultValue: "#09090b",
    },
    buttonBorderRadius: {
        type: ControlType.Number,
        title: "Button Radius",
        min: 0,
        max: 24,
        defaultValue: 8,
    },
})
