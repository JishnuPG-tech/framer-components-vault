import { useState, useRef, useEffect, startTransition, type CSSProperties } from "react"
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

interface FAQ {
    question: string
    answer: string
}

interface ChatbotProps {
    greeting: string
    faqs: FAQ[]
    primaryColor: string
    backgroundColor: string
    textColor: string
    subtitleColor: string
    titleFont: any
    bodyFont: any
    position: "bottom-right" | "bottom-left"
    iconType: "svg" | "image"
    icon: "chat" | "help" | "custom"
    customSvgCode: string
    svgIconColor: string
    customIcon?: { src: string; alt?: string }
    padding: number
    style?: CSSProperties
}

/**
 * FAQ Chatbot Component
 * 
 * @framerIntrinsicWidth 350
 * @framerIntrinsicHeight 500
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Chatbot(props: ChatbotProps) {
    const {
        greeting = "How can we help you?",
        faqs = [
            {
                question: "What services do you offer?",
                answer: "We offer a wide range of digital services including web development, mobile apps, and UI/UX design."
            },
            {
                question: "How can I contact support?",
                answer: "You can reach our support team via email at support@company.com or through our live chat during business hours."
            },
            {
                question: "What are your business hours?",
                answer: "We're available Monday to Friday, 9 AM to 6 PM EST. Our support team responds within 24 hours."
            },
            {
                question: "Do you offer refunds?",
                answer: "Yes, we offer a 30-day money-back guarantee for all our services. Contact us for more details."
            }
        ],
        primaryColor = "#22C55E",
        backgroundColor = "#F9FAFB",
        textColor = "#1F2937",
        subtitleColor = "#6B7280",
        titleFont,
        bodyFont,
        position = "bottom-right",
        iconType = "svg",
        icon = "chat",
        customSvgCode = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
        svgIconColor = "white",
        padding = 20,
        style
    } = props

    const [chatOpen, setChatOpen] = useState(false)
    const [openFAQs, setOpenFAQs] = useState<Set<number>>(new Set())

    const toggleFAQ = (index: number) => {
        startTransition(() => {
            setOpenFAQs(prev => {
                const newSet = new Set(prev)
                if (newSet.has(index)) {
                    newSet.delete(index)
                } else {
                    newSet.add(index)
                }
                return newSet
            })
        })
    }

    const getIconSVG = (iconType: string) => {
        switch (iconType) {
            case "chat":
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={svgIconColor}>
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                )
            case "help":
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={svgIconColor}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                    </svg>
                )
            default:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={svgIconColor}>
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                )
        }
    }

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Always visible closed button */}
            <div
                style={{
                    position: "fixed",
                    bottom: `${padding}px`,
                    [position === "bottom-right" ? "right" : "left"]: `${padding}px`,
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: primaryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    zIndex: chatOpen ? 998 : 999,
                    transition: "all 0.3s ease"
                }}
                onClick={() => startTransition(() => setChatOpen(!chatOpen))}
            >
                {iconType === "image" && props.customIcon ? (
                    <img 
                        src={props.customIcon.src} 
                        alt={props.customIcon.alt || "Chatbot icon"} 
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "50%"
                        }}
                    />
                ) : icon === "custom" ? (
                    <div 
                        style={{ 
                            padding: "18px",
                            color: svgIconColor
                        }}
                        dangerouslySetInnerHTML={{ __html: customSvgCode.replace(/fill="[^"]*"/g, `fill="${svgIconColor}"`).replace(/stroke="[^"]*"/g, `stroke="${svgIconColor}"`) }}
                    />
                ) : (
                    getIconSVG(icon)
                )}
            </div>

            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ 
                            opacity: 0, 
                            y: 100,
                            scale: 0.8
                        }}
                        animate={{ 
                            opacity: 1, 
                            y: 0,
                            scale: 1
                        }}
                        exit={{ 
                            opacity: 0, 
                            y: 100,
                            scale: 0.8
                        }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            duration: 0.4
                        }}
                        style={{
                            position: "fixed",
                            bottom: `${padding + 80}px`,
                            [position === "bottom-right" ? "right" : "left"]: `${padding}px`,
                            width: "350px",
                            height: "500px",
                            backgroundColor,
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            zIndex: 1000,
                            transformOrigin: position === "bottom-right" ? "bottom right" : "bottom left"
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                background: primaryColor,
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                flexShrink: 0,
                                minHeight: "60px"
                            }}
                        >
                            <div
                                style={{
                                    color: "white",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    flex: 1,
                                    marginRight: "12px",
                                    wordWrap: "break-word",
                                    overflowWrap: "break-word",
                                    lineHeight: "1.3",
                                    ...titleFont
                                }}
                            >
                                {greeting}
                            </div>
                            <button
                                style={{
                                    background: "rgba(255,255,255,0.15)",
                                    border: "none",
                                    color: "white",
                                    cursor: "pointer",
                                    padding: "6px",
                                    borderRadius: "6px",
                                    transition: "all 0.2s ease",
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "28px",
                                    height: "28px"
                                }}
                                onClick={() => startTransition(() => setChatOpen(false))}
                                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.25)"}
                                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>

                        {/* FAQ Questions */}
                        <div
                            style={{
                                flex: 1,
                                padding: "16px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                overflowY: "auto",
                                minHeight: 0
                            }}
                        >
                            {faqs.map((faq, index) => {
                                const isOpen = openFAQs.has(index)
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            backgroundColor: "#FFFFFF",
                                            borderRadius: "8px",
                                            border: `1px solid ${isOpen ? primaryColor : "#E5E7EB"}`,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            overflow: "hidden",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                            flexShrink: 0
                                        }}
                                        onClick={() => toggleFAQ(index)}
                                    >
                                        <div
                                            style={{
                                                padding: "16px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: textColor,
                                                    fontSize: "15px",
                                                    fontWeight: "500",
                                                    flex: 1,
                                                    ...bodyFont
                                                }}
                                            >
                                                {faq.question}
                                            </div>
                                            <div
                                                style={{
                                                    marginLeft: "12px",
                                                    transition: "transform 0.2s ease",
                                                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                    color: primaryColor
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                                                </svg>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                maxHeight: isOpen ? "300px" : "0",
                                                overflow: "hidden",
                                                transition: "max-height 0.3s ease, padding 0.3s ease",
                                                paddingLeft: isOpen ? "16px" : "16px",
                                                paddingRight: isOpen ? "16px" : "16px",
                                                paddingBottom: isOpen ? "16px" : "0"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: subtitleColor,
                                                    fontSize: "14px",
                                                    lineHeight: "1.6",
                                                    opacity: isOpen ? 1 : 0,
                                                    transition: "opacity 0.2s ease 0.1s",
                                                    ...bodyFont
                                                }}
                                            >
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(Chatbot, {
    greeting: {
        type: ControlType.String,
        title: "Greeting",
        defaultValue: "How can we help you?"
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon Type",
        options: ["svg", "image"],
        optionTitles: ["Default SVG", "Custom Image"],
        defaultValue: "svg"
    },
    icon: {
        type: ControlType.Enum,
        title: "SVG Icon",
        options: ["chat", "help", "custom"],
        optionTitles: ["Chat", "Help", "Custom SVG"],
        defaultValue: "chat",
        hidden: ({ iconType }) => iconType !== "svg"
    },
    customSvgCode: {
        type: ControlType.String,
        title: "Custom SVG Code",
        defaultValue: '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
        displayTextArea: true,
        hidden: ({ iconType, icon }) => iconType !== "svg" || icon !== "custom"
    },
    svgIconColor: {
        type: ControlType.Color,
        title: "SVG Icon Color",
        defaultValue: "white",
        hidden: ({ iconType }) => iconType !== "svg"
    },
    customIcon: {
        type: ControlType.ResponsiveImage,
        title: "Custom Image",
        hidden: ({ iconType }) => iconType !== "image"
    },
    faqs: {
        type: ControlType.Array,
        title: "FAQ Items",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "What services do you offer?"
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue: "We offer a wide range of digital services.",
                    displayTextArea: true
                }
            }
        },
        defaultValue: [
            {
                question: "What services do you offer?",
                answer: "We offer a wide range of digital services including web development, mobile apps, and UI/UX design."
            },
            {
                question: "How can I contact support?",
                answer: "You can reach our support team via email at support@company.com or through our live chat during business hours."
            },
            {
                question: "What are your business hours?",
                answer: "We're available Monday to Friday, 9 AM to 6 PM EST. Our support team responds within 24 hours."
            },
            {
                question: "Do you offer refunds?",
                answer: "Yes, we offer a 30-day money-back guarantee for all our services. Contact us for more details."
            }
        ],
        maxCount: 10
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottom-right", "bottom-left"],
        optionTitles: ["Bottom Right", "Bottom Left"],
        defaultValue: "bottom-right"
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#22C55E"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F9FAFB"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1F2937"
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "#6B7280"
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontSize: "28px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px"
    }
})