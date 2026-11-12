// Create a fully responsive Plan Card component with animated price switching, dropdown selection, and toggle for no-code development
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef, type CSSProperties } from "react"

interface PlanCardProps {
    title: string
    subtitle: string
    includedTitle: string
    button: {
        label: string
        font: any
        background: string
        textColor: string
        paddingHorizontal: number
        paddingVertical: number
        link: string
        width: "stretch" | "auto"
        borderRadius: number
        visible: boolean
    }
    pricingOptions: Array<{
        name: string
        displayName: string
        price: string
        priceNoCode: string
    }>
    toggleState: boolean
    features: Array<{ text: string; visible: boolean }>
    cardBackground: string
    textColor: string
    subtitleColor: string
    priceColor: string
    toggleLabel: string
    fontManagement: {
        titleFont: any
        titleColor: string
        subtitleFont: any
        subtitleColor: string
        priceFont: any
        priceColor: string
        featureFont: any
        featureColor: string
        includedTitleFont: any
        includedTitleColor: string
        dropdownFont: any
        dropdownColor: string
        toggleFont: any
        toggleColor: string
    }
    paddingHorizontal: number
    paddingVertical: number
    checkIcon?: React.ReactNode
    dropdownIcon?: React.ReactNode
    dropdownTextColor: string
    dropdownIconSpacing: number
    showBottomRow: boolean
    priceDisplayMode: "dropdown" | "text"
    priceText: string
    onButtonClick?: () => void
    gapManagement: {
        topComponentGap: number
        titleSubtitleGap: number
        listItemsGap: number
        sectionGap: number
        priceButtonGap: number
        includedListGap: number
        listToggleGap: number
    }
    topComponent?: React.ReactNode
    cardBorderRadius: number
    style?: CSSProperties
}

/**
 * Plan Card Component
 * 
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 700
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PlanCard(props: PlanCardProps) {
    const {
        title = "Website Plan",
        subtitle = "Professional website design with modern interactions",
        includedTitle = "What's included :",
        button = {
            label: "Start your Project",
            font: {},
            background: "#1A1A1A",
            textColor: "#FFFFFF",
            paddingHorizontal: 24,
            paddingVertical: 16,
            link: "",
            width: "stretch",
            borderRadius: 12,
            visible: true,
        },
        pricingOptions = [
            { name: "Landing Page", displayName: "Landing Page", price: "300", priceNoCode: "500" },
            { name: "4–6 Pages", displayName: "4–6 Pages", price: "600", priceNoCode: "900" },
            { name: "More than 6 Pages", displayName: "+ 6 Pages", price: "800", priceNoCode: "1600" },
        ],
        toggleState = false,
        cardBackground = "#FFFFFF",
        textColor = "#1A1A1A",
        subtitleColor = "#666666",
        priceColor = "#10B981",
        toggleLabel = "+No-code Development",
        fontManagement = {
            titleFont: {
                fontSize: "24px",
                variant: "Semibold",
                letterSpacing: "-0.02em",
                lineHeight: "1.2em",
            },
            titleColor: "#1A1A1A",
            subtitleFont: {
                fontSize: "14px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.4em",
            },
            subtitleColor: "#666666",
            priceFont: {
                fontSize: "48px",
                variant: "Bold",
                letterSpacing: "-0.03em",
                lineHeight: "1em",
            },
            priceColor: "#10B981",
            featureFont: {
                fontSize: "14px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.4em",
            },
            featureColor: "#1A1A1A",
            includedTitleFont: {
                fontSize: "14px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            includedTitleColor: "#666666",
            dropdownFont: {
                fontSize: "16px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            dropdownColor: "#1A1A1A",
            toggleFont: {
                fontSize: "14px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            toggleColor: "#1A1A1A",
        },
        paddingHorizontal = 32,
        paddingVertical = 32,
        checkIcon,
        dropdownIcon,
        dropdownTextColor = "#1A1A1A",
        dropdownIconSpacing = 4,
        showBottomRow = true,
        priceDisplayMode = "dropdown",
        priceText = "/ Landing Page",
        onButtonClick,
        gapManagement = {
            topComponentGap: 16,
            titleSubtitleGap: 8,
            listItemsGap: 12,
            sectionGap: 24,
            priceButtonGap: 32,
            includedListGap: 12,
            listToggleGap: 12,
        },
        cardBorderRadius = 24,
        topComponent,
    } = props

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [currentOptionIndex, setCurrentOptionIndex] = useState(0)
    const [isNoCode, setIsNoCode] = useState(toggleState)
    const [displayPrice, setDisplayPrice] = useState("")
    const [targetPrice, setTargetPrice] = useState("")
    const [isButtonHovered, setIsButtonHovered] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const getPriceForOption = (optionIndex: number, withNoCode: boolean) => {
        if (optionIndex < 0 || optionIndex >= pricingOptions.length) {
            return pricingOptions[0]?.price || "0"
        }
        const option = pricingOptions[optionIndex]
        return withNoCode ? option.priceNoCode : option.price
    }

    const formatPrice = (price: string, optionIndex: number) => {
        const option = pricingOptions[optionIndex]
        if (option && option.displayName.includes("+") && price.match(/\d+/) && parseInt(price.match(/\d+/)[0]) >= 800) {
            if (!price.trim().startsWith('+')) {
                return `+${price}`
            }
        }
        return price
    }

    useEffect(() => {
        const newTargetPrice = getPriceForOption(currentOptionIndex, isNoCode)
        setTargetPrice(newTargetPrice)
    }, [currentOptionIndex, isNoCode, pricingOptions])

    useEffect(() => {
        if (displayPrice === "") {
            setDisplayPrice(targetPrice)
            return
        }

        // Extract numeric value for animation
        const startMatch = displayPrice.match(/\d+/)
        const targetMatch = targetPrice.match(/\d+/)
        
        if (!startMatch || !targetMatch) {
            setDisplayPrice(targetPrice)
            return
        }

        const startNumeric = parseInt(startMatch[0])
        const targetNumeric = parseInt(targetMatch[0])
        
        if (startNumeric === targetNumeric) {
            setDisplayPrice(targetPrice)
            return
        }

        const duration = 500
        const difference = targetNumeric - startNumeric
        const startTime = Date.now()

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            const easeOutQuad = (t: number) => t * (2 - t)
            const easedProgress = easeOutQuad(progress)
            
            const currentNumeric = Math.round(startNumeric + difference * easedProgress)
            // Replace the numeric part in the target price string
            const animatedPrice = targetPrice.replace(/\d+/, currentNumeric.toString())
            setDisplayPrice(animatedPrice)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [targetPrice])

    useEffect(() => {
        setIsNoCode(toggleState)
    }, [toggleState])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }

        if (typeof document !== "undefined") {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleOptionSelect = (optionIndex: number) => {
        setCurrentOptionIndex(optionIndex)
        setDropdownOpen(false)
    }

    const handleToggle = () => {
        setIsNoCode(!isNoCode)
    }

    const handleButtonClick = () => {
        if (button.link && typeof window !== "undefined") {
            window.location.href = button.link
        }
        if (onButtonClick) {
            onButtonClick()
        }
    }

    const features = props.features.length > 0 ? props.features : [
        { text: "Decide end goals and sections", visible: true },
        { text: "Sitemaps and Userflows", visible: true },
        { text: "Building structure and variables for different breakpoints", visible: true },
        { text: "UI design for pages", visible: true },
        { text: "Prototype and Usability testing", visible: true },
        { text: "Prototype and animations", visible: true },
    ]

    const isFixedWidth = props?.style && props.style.width === "100%"
    const isFixedHeight = props?.style && props.style.height === "100%"

    const currentOption = pricingOptions[currentOptionIndex] || pricingOptions[0]

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                backgroundColor: cardBackground,
                borderRadius: cardBorderRadius,
                padding: `${paddingVertical}px ${paddingHorizontal}px`,
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
                ...(isFixedWidth ? {} : { minWidth: "max-content" }),
                minHeight: isFixedHeight ? "100%" : 5,
            }}
        >
            {props.topComponent && (
                <div style={{ marginBottom: gapManagement.topComponentGap }}>
                    {props.topComponent}
                </div>
            )}

            <h2
                style={{
                    margin: 0,
                    marginBottom: gapManagement.titleSubtitleGap,
                    color: fontManagement.titleColor,
                    ...fontManagement.titleFont,
                }}
            >
                {title}
            </h2>

            <p
                style={{
                    margin: 0,
                    marginBottom: gapManagement.sectionGap,
                    color: fontManagement.subtitleColor,
                    ...fontManagement.subtitleFont,
                }}
            >
                {subtitle}
            </p>

            <div style={{ display: "flex", alignItems: "baseline", marginBottom: gapManagement.priceButtonGap, gap: 8 }}>
                <span
                    style={{
                        color: fontManagement.priceColor,
                        ...fontManagement.priceFont,
                    }}
                >
                    {formatPrice(displayPrice, currentOptionIndex)}
                </span>

                {priceDisplayMode === "dropdown" ? (
                    <div style={{ position: "relative" }} ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: dropdownIconSpacing,
                                padding: 0,
                                color: fontManagement.dropdownColor,
                                ...fontManagement.dropdownFont,
                            }}
                        >
                            <span>/ {currentOption?.displayName || currentOption?.name}</span>
                            {dropdownIcon ? (
                                <div
                                    style={{
                                        width: 12,
                                        height: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease",
                                    }}
                                >
                                    {dropdownIcon}
                                </div>
                            ) : (
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    style={{
                                        transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease",
                                    }}
                                >
                                    <path
                                        d="M3 4.5L6 7.5L9 4.5"
                                        stroke={fontManagement.dropdownColor}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>

                        {dropdownOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 8px)",
                                    left: 0,
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 8,
                                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                                    padding: 8,
                                    minWidth: 180,
                                    zIndex: 1000,
                                }}
                            >
                                {pricingOptions.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleOptionSelect(index)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "none",
                                            background: currentOptionIndex === index ? "#F5F5F5" : "transparent",
                                            borderRadius: 4,
                                            cursor: "pointer",
                                            textAlign: "left",
                                            fontSize: 14,
                                            color: fontManagement.dropdownColor,
                                            transition: "background 0.2s ease",
                                            ...fontManagement.dropdownFont,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (currentOptionIndex !== index) {
                                                e.currentTarget.style.background = "#F9F9F9"
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (currentOptionIndex !== index) {
                                                e.currentTarget.style.background = "transparent"
                                            }
                                        }}
                                    >
                                        {option.displayName || option.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <span
                        style={{
                            color: fontManagement.dropdownColor,
                            ...fontManagement.dropdownFont,
                        }}
                    >
                        {priceText}
                    </span>
                )}
            </div>

            {button.visible && (
                <button
                    style={{
                        width: button.width === "stretch" ? "100%" : "auto",
                        padding: `${button.paddingVertical}px ${button.paddingHorizontal}px`,
                        backgroundColor: button.background,
                        color: button.textColor,
                        border: "none",
                        borderRadius: button.borderRadius,
                        cursor: "pointer",
                        marginBottom: showBottomRow ? gapManagement.sectionGap : gapManagement.sectionGap,
                        transition: "box-shadow 0.2s ease",
                        boxShadow: isButtonHovered ? "0 0 0 2px #03BB5E" : "none",
                        ...button.font,
                    }}
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                    onClick={handleButtonClick}
                >
                    {button.label}
                </button>
            )}

            {showBottomRow && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: gapManagement.listToggleGap,
                        marginBottom: gapManagement.sectionGap,
                    }}
                >
                    <button
                        onClick={handleToggle}
                        style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: isNoCode ? "#13202B" : "#CCCCCC",
                            border: "none",
                            cursor: "pointer",
                            position: "relative",
                            transition: "background-color 0.3s ease",
                            padding: 0,
                        }}
                    >
                        <div
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                backgroundColor: "#FFFFFF",
                                position: "absolute",
                                top: 2,
                                left: isNoCode ? 22 : 2,
                                transition: "left 0.3s ease",
                            }}
                        />
                    </button>
                    <span
                        style={{
                            color: fontManagement.toggleColor,
                            ...fontManagement.toggleFont,
                        }}
                    >
                        {toggleLabel}
                    </span>
                </div>
            )}

            <h3
                style={{
                    margin: 0,
                    marginBottom: gapManagement.sectionGap,
                    color: fontManagement.includedTitleColor,
                    ...fontManagement.includedTitleFont,
                }}
            >
                {includedTitle}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: gapManagement.listItemsGap, marginBottom: gapManagement.includedListGap }}>
                {features
                    .filter((feature) => feature.visible)
                    .map((feature, index) => (
                        <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: gapManagement.listItemsGap }}>
                            {checkIcon ? (
                                <div style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2 }}>
                                    {checkIcon}
                                </div>
                            ) : (
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    style={{ flexShrink: 0, marginTop: 2 }}
                                >
                                    <circle cx="10" cy="10" r="10" fill="#10B981" fillOpacity="0.15" />
                                    <path
                                        d="M6 10L8.5 12.5L14 7"
                                        stroke="#10B981"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                            <span
                                style={{
                                    color: fontManagement.featureColor,
                                    flex: 1,
                                    ...fontManagement.featureFont,
                                }}
                            >
                                {feature.text}
                            </span>
                        </div>
                    ))}
            </div>
        </div>
    )
}

addPropertyControls(PlanCard, {
    topComponent: {
        type: ControlType.ComponentInstance,
        title: "Main Icon",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Website Plan",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Professional website design with modern interactions",
        displayTextArea: true,
    },
    includedTitle: {
        type: ControlType.String,
        title: "Included Title",
        defaultValue: "What's included :",
    },
    pricingOptions: {
        type: ControlType.Array,
        title: "Pricing Options",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Option Name",
                    defaultValue: "Landing Page",
                },
                displayName: {
                    type: ControlType.String,
                    title: "Display Name",
                    defaultValue: "Landing Page",
                },
                price: {
                    type: ControlType.String,
                    title: "Price (Toggle Off)",
                    defaultValue: "300",
                },
                priceNoCode: {
                    type: ControlType.String,
                    title: "Price (Toggle On)",
                    defaultValue: "500",
                },
            },
        },
        defaultValue: [
            { name: "Landing Page", displayName: "Landing Page", price: "300", priceNoCode: "500" },
            { name: "4–6 Pages", displayName: "4–6 Pages", price: "600", priceNoCode: "900" },
            { name: "More than 6 Pages", displayName: "+ 6 Pages", price: "800", priceNoCode: "1600" },
        ],
    },
    button: {
        type: ControlType.Object,
        title: "Button Settings",
        controls: {
            visible: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Start your Project",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#1A1A1A",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
            },
            paddingHorizontal: {
                type: ControlType.Number,
                title: "Padding H",
                defaultValue: 24,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            paddingVertical: {
                type: ControlType.Number,
                title: "Padding V",
                defaultValue: 16,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
            width: {
                type: ControlType.Enum,
                title: "Width",
                options: ["stretch", "auto"],
                optionTitles: ["Stretch", "Auto"],
                defaultValue: "stretch",
                displaySegmentedControl: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 12,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            visible: true,
            label: "Start your Project",
            font: {
                fontSize: "16px",
                variant: "Semibold",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            background: "#1A1A1A",
            textColor: "#FFFFFF",
            paddingHorizontal: 24,
            paddingVertical: 16,
            link: "",
            width: "stretch",
            borderRadius: 12,
        },
    },
    toggleLabel: {
        type: ControlType.String,
        title: "Toggle Label",
        defaultValue: "+No-code Development",
    },
    toggleState: {
        type: ControlType.Boolean,
        title: "Toggle State",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showBottomRow: {
        type: ControlType.Boolean,
        title: "Toggle Row",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    features: {
        type: ControlType.Array,
        title: "Features",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Feature Text",
                    defaultValue: "Feature item",
                    displayTextArea: true,
                },
                visible: {
                    type: ControlType.Boolean,
                    title: "Visible",
                    defaultValue: true,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
            },
        },
        defaultValue: [
            { text: "Decide end goals and sections", visible: true },
            { text: "Sitemaps and Userflows", visible: true },
            { text: "Building structure and variables for different breakpoints", visible: true },
            { text: "UI design for pages", visible: true },
            { text: "Prototype and Usability testing", visible: true },
            { text: "Prototype and animations", visible: true },
        ],
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Border Radius",
        defaultValue: 24,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    paddingHorizontal: {
        type: ControlType.Number,
        title: "Padding Horizontal",
        defaultValue: 32,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
    },
    paddingVertical: {
        type: ControlType.Number,
        title: "Padding Vertical",
        defaultValue: 32,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
    },
    priceDisplayMode: {
        type: ControlType.Enum,
        title: "Price Display Mode",
        options: ["dropdown", "text"],
        optionTitles: ["Dropdown Menu", "Normal Text"],
        defaultValue: "dropdown",
        displaySegmentedControl: true,
    },
    priceText: {
        type: ControlType.String,
        title: "Price Text",
        defaultValue: "/ Landing Page",
        hidden: ({ priceDisplayMode }) => priceDisplayMode === "dropdown",
    },
    checkIcon: {
        type: ControlType.ComponentInstance,
        title: "Check Icon",
    },
    dropdownIcon: {
        type: ControlType.ComponentInstance,
        title: "Dropdown Icon",
    },
    dropdownIconSpacing: {
        type: ControlType.Number,
        title: "Dropdown Icon Spacing",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    onButtonClick: {
        type: ControlType.EventHandler,
    },
    gapManagement: {
        type: ControlType.Object,
        title: "Gap Management",
        controls: {
            topComponentGap: {
                type: ControlType.Number,
                title: "Top Component Gap",
                defaultValue: 16,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            titleSubtitleGap: {
                type: ControlType.Number,
                title: "Title-Subtitle Gap",
                defaultValue: 8,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            listItemsGap: {
                type: ControlType.Number,
                title: "List Items Gap",
                defaultValue: 12,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            sectionGap: {
                type: ControlType.Number,
                title: "Section Gap",
                defaultValue: 24,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            priceButtonGap: {
                type: ControlType.Number,
                title: "Price-Button Gap",
                defaultValue: 32,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            includedListGap: {
                type: ControlType.Number,
                title: "Included List Gap",
                defaultValue: 12,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            listToggleGap: {
                type: ControlType.Number,
                title: "List-Toggle Gap",
                defaultValue: 12,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            topComponentGap: 16,
            titleSubtitleGap: 8,
            listItemsGap: 12,
            sectionGap: 24,
            priceButtonGap: 32,
            includedListGap: 12,
            listToggleGap: 12,
        },
    },
    fontManagement: {
        type: ControlType.Object,
        title: "Texts Style",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "24px",
                    variant: "Semibold",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.2em",
                },
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#1A1A1A",
            },
            subtitleFont: {
                type: ControlType.Font,
                title: "Subtitle Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.4em",
                },
            },
            subtitleColor: {
                type: ControlType.Color,
                title: "Subtitle Color",
                defaultValue: "#666666",
            },
            priceFont: {
                type: ControlType.Font,
                title: "Price Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "48px",
                    variant: "Bold",
                    letterSpacing: "-0.03em",
                    lineHeight: "1em",
                },
            },
            priceColor: {
                type: ControlType.Color,
                title: "Price Color",
                defaultValue: "#10B981",
            },
            featureFont: {
                type: ControlType.Font,
                title: "Feature Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.4em",
                },
            },
            featureColor: {
                type: ControlType.Color,
                title: "Feature Color",
                defaultValue: "#1A1A1A",
            },
            includedTitleFont: {
                type: ControlType.Font,
                title: "Included Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
            includedTitleColor: {
                type: ControlType.Color,
                title: "Included Title Color",
                defaultValue: "#666666",
            },
            dropdownFont: {
                type: ControlType.Font,
                title: "Dropdown Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Regular",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
            dropdownColor: {
                type: ControlType.Color,
                title: "Dropdown Color",
                defaultValue: "#1A1A1A",
            },
            toggleFont: {
                type: ControlType.Font,
                title: "Toggle Label Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
            toggleColor: {
                type: ControlType.Color,
                title: "Toggle Label Color",
                defaultValue: "#1A1A1A",
            },
        },
        defaultValue: {
            titleFont: {
                fontSize: "24px",
                variant: "Semibold",
                letterSpacing: "-0.02em",
                lineHeight: "1.2em",
            },
            titleColor: "#1A1A1A",
            subtitleFont: {
                fontSize: "14px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.4em",
            },
            subtitleColor: "#666666",
            priceFont: {
                fontSize: "48px",
                variant: "Bold",
                letterSpacing: "-0.03em",
                lineHeight: "1em",
            },
            priceColor: "#10B981",
            featureFont: {
                fontSize: "14px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.4em",
            },
            featureColor: "#1A1A1A",
            includedTitleFont: {
                fontSize: "14px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            includedTitleColor: "#666666",
            dropdownFont: {
                fontSize: "16px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            dropdownColor: "#1A1A1A",
            toggleFont: {
                fontSize: "14px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            toggleColor: "#1A1A1A",
        },
    },
})