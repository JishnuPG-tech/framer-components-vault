// Automatic Table of Contents component with heading detection, smooth scrolling, and active section highlighting
import { useEffect, useState, useCallback, startTransition, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface HeadingItem {
    id: string
    text: string
    level: number
    element: HTMLElement
}

interface TableOfContentsProps {
    headings: {
        includeH1: boolean
        includeH2: boolean
        includeH3: boolean
        includeH4: boolean
        includeH5: boolean
        includeH6: boolean
    }
    colors: {
        backgroundColor: string
        textColor: string
        activeColor: string
        hoverColor: string
    }
    typography: {
        font: any
        activeFont: any
    }
    layout: {
        padding: number
        itemSpacing: number
    }
    border: {
        showBorder: boolean
        borderColor: string
        borderWidth: number
        borderRadius: number
    }
    indentation: {
        indentNested: boolean
        indentSize: number
    }
    scrolling: {
        smoothScroll: boolean
        scrollOffset: number
        activationPosition: "top" | "center" | "bottom"
    }
    activeIndicator: {
        showActiveIndicator: boolean
        indicatorColor: string
        indicatorWidth: number
        indicatorShape: "line" | "circle" | "square" | "rounded"
        indicatorSize: number
        indicatorSpacing: number
    }
    animation: {
        enableAnimation: boolean
        animationDuration: number
        animationEasing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TableOfContents(props: TableOfContentsProps) {
    const {
        headings: {
            includeH1 = false,
            includeH2 = true,
            includeH3 = true,
            includeH4 = false,
            includeH5 = false,
            includeH6 = false,
        } = {},
        colors: {
            backgroundColor = "#FFFFFF",
            textColor = "#000000",
            activeColor = "#0099FF",
            hoverColor = "#0066FF",
        } = {},
        typography: {
            font,
            activeFont,
        } = {},
        layout: {
            padding = 20,
            itemSpacing = 12,
        } = {},
        border: {
            showBorder = true,
            borderColor = "#EEEEEE",
            borderWidth = 1,
            borderRadius = 8,
        } = {},
        indentation: {
            indentNested = true,
            indentSize = 20,
        } = {},
        scrolling: {
            smoothScroll = true,
            scrollOffset = 80,
            activationPosition = "center",
        } = {},
        activeIndicator: {
            showActiveIndicator = true,
            indicatorColor = "#0099FF",
            indicatorWidth = 3,
            indicatorShape = "line",
            indicatorSize = 12,
            indicatorSpacing = 8,
        } = {},
        animation: {
            enableAnimation = true,
            animationDuration = 200,
            animationEasing = "ease",
        } = {},
    } = props

    const [headings, setHeadings] = useState<HeadingItem[]>([])
    const [activeId, setActiveId] = useState<string>("")

    const headingLevels = useMemo(() => {
        const levels: string[] = []
        if (includeH1) levels.push("H1")
        if (includeH2) levels.push("H2")
        if (includeH3) levels.push("H3")
        if (includeH4) levels.push("H4")
        if (includeH5) levels.push("H5")
        if (includeH6) levels.push("H6")
        return levels
    }, [includeH1, includeH2, includeH3, includeH4, includeH5, includeH6])

    const levelNumbers = useMemo(() => {
        return headingLevels.map(level => parseInt(level.replace("H", "")))
    }, [headingLevels])

    const minLevel = useMemo(() => Math.min(...levelNumbers), [levelNumbers])

    useEffect(() => {
        if (typeof window === "undefined") return

        const selector = headingLevels.map(level => level.toLowerCase()).join(", ")
        
        // Determine the container to search within
        const container = document
        
        const headingElements = container.querySelectorAll(selector)
        
        const items: HeadingItem[] = []
        headingElements.forEach((element, index) => {
            const htmlElement = element as HTMLElement
            let id = htmlElement.id
            
            if (!id) {
                id = `heading-${index}-${htmlElement.textContent?.toLowerCase().replace(/\s+/g, "-")}`
                htmlElement.id = id
            }

            items.push({
                id,
                text: htmlElement.textContent || "",
                level: parseInt(htmlElement.tagName.replace("H", "")),
                element: htmlElement,
            })
        })

        startTransition(() => setHeadings(items))
    }, [headingLevels])

    useEffect(() => {
        if (typeof window === "undefined" || headings.length === 0) return

        const observerCallback = () => {
            // Find which heading is currently at the activation position
            let targetY = 0
            if (activationPosition === "top") {
                targetY = scrollOffset
            } else if (activationPosition === "center") {
                targetY = window.innerHeight / 2
            } else {
                // bottom
                targetY = window.innerHeight - scrollOffset
            }

            let closestHeading: HeadingItem | null = null
            let closestDistance = Infinity

            headings.forEach(heading => {
                if (heading.element) {
                    const rect = heading.element.getBoundingClientRect()
                    const headingY = rect.top
                    const distance = Math.abs(headingY - targetY)

                    // Only consider headings that are above or at the target position
                    if (headingY <= targetY && distance < closestDistance) {
                        closestDistance = distance
                        closestHeading = heading
                    }
                }
            })

            // If no heading is above the target, use the first one that's below
            if (!closestHeading) {
                headings.forEach(heading => {
                    if (heading.element) {
                        const rect = heading.element.getBoundingClientRect()
                        const headingY = rect.top
                        const distance = Math.abs(headingY - targetY)

                        if (distance < closestDistance) {
                            closestDistance = distance
                            closestHeading = heading
                        }
                    }
                })
            }

            if (closestHeading) {
                startTransition(() => setActiveId(closestHeading.id))
            }
        }

        // Run on scroll
        window.addEventListener("scroll", observerCallback, { passive: true })
        // Run initially
        observerCallback()

        return () => {
            window.removeEventListener("scroll", observerCallback)
        }
    }, [headings, scrollOffset, activationPosition])

    const handleClick = useCallback((id: string) => {
        if (typeof window === "undefined") return

        const element = document.getElementById(id)
        if (!element) return

        const yOffset = -scrollOffset
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset

        if (smoothScroll) {
            window.scrollTo({ top: y, behavior: "smooth" })
        } else {
            window.scrollTo({ top: y })
        }

        startTransition(() => setActiveId(id))
    }, [scrollOffset, smoothScroll])

    if (headings.length === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    padding,
                    backgroundColor,
                    borderRadius,
                    border: showBorder ? `${borderWidth}px solid ${borderColor}` : "none",
                    ...font,
                    color: textColor,
                    opacity: 0.5,
                }}
            >
                No headings found on page
            </div>
        )
    }

    return (
        <nav
            style={{
                width: "100%",
                padding,
                backgroundColor,
                borderRadius,
                border: showBorder ? `${borderWidth}px solid ${borderColor}` : "none",
            }}
            aria-label="Table of contents"
        >
            <ul
                style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: itemSpacing,
                }}
            >
                {headings.map((heading) => {
                    const isActive = activeId === heading.id
                    const indent = indentNested ? (heading.level - minLevel) * indentSize : 0

                    return (
                        <li
                            key={heading.id}
                            style={{
                                position: "relative",
                                paddingLeft: indent,
                            }}
                        >
                            {showActiveIndicator && isActive && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: indent,
                                        top: indicatorShape === "line" ? 0 : "50%",
                                        bottom: indicatorShape === "line" ? 0 : undefined,
                                        width: indicatorShape === "line" ? indicatorWidth : indicatorSize,
                                        height: indicatorShape === "line" ? undefined : indicatorSize,
                                        transform: indicatorShape === "line" ? undefined : "translateY(-50%)",
                                        backgroundColor: indicatorColor,
                                        borderRadius: 
                                            indicatorShape === "line" ? indicatorWidth / 2 :
                                            indicatorShape === "circle" ? "50%" :
                                            indicatorShape === "rounded" ? indicatorSize / 4 :
                                            0,
                                        transition: enableAnimation 
                                            ? `opacity ${animationDuration}ms ${animationEasing}, transform ${animationDuration}ms ${animationEasing}`
                                            : "none",
                                    }}
                                />
                            )}
                            <button
                                onClick={() => handleClick(heading.id)}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    paddingLeft: showActiveIndicator ? (indicatorShape === "line" ? indicatorWidth : indicatorSize) + indicatorSpacing : 0,
                                    cursor: "pointer",
                                    transition: enableAnimation 
                                        ? `color ${animationDuration}ms ${animationEasing}`
                                        : "none",
                                    ...(isActive ? activeFont : font),
                                    color: isActive ? activeColor : textColor,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = hoverColor
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = textColor
                                    }
                                }}
                            >
                                {heading.text}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}

addPropertyControls(TableOfContents, {
    headings: {
        type: ControlType.Object,
        title: "Headings",
        controls: {
            includeH1: {
                type: ControlType.Boolean,
                title: "H1",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            includeH2: {
                type: ControlType.Boolean,
                title: "H2",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            includeH3: {
                type: ControlType.Boolean,
                title: "H3",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            includeH4: {
                type: ControlType.Boolean,
                title: "H4",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            includeH5: {
                type: ControlType.Boolean,
                title: "H5",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            includeH6: {
                type: ControlType.Boolean,
                title: "H6",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#000000",
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: "#0099FF",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: "#0066FF",
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
            },
            activeFont: {
                type: ControlType.Font,
                title: "Active Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 20,
                min: 0,
                max: 60,
                step: 4,
                unit: "px",
            },
            itemSpacing: {
                type: ControlType.Number,
                title: "Item Spacing",
                defaultValue: 12,
                min: 0,
                max: 40,
                step: 2,
                unit: "px",
            },
        },
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            showBorder: {
                type: ControlType.Boolean,
                title: "Show Border",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#EEEEEE",
                hidden: ({ showBorder }) => !showBorder,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 1,
                min: 1,
                max: 10,
                step: 1,
                unit: "px",
                hidden: ({ showBorder }) => !showBorder,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 8,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
        },
    },
    indentation: {
        type: ControlType.Object,
        title: "Indentation",
        controls: {
            indentNested: {
                type: ControlType.Boolean,
                title: "Indent Nested",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            indentSize: {
                type: ControlType.Number,
                title: "Indent Size",
                defaultValue: 20,
                min: 0,
                max: 60,
                step: 4,
                unit: "px",
                hidden: ({ indentNested }) => !indentNested,
            },
        },
    },
    scrolling: {
        type: ControlType.Object,
        title: "Scrolling",
        controls: {
            activationPosition: {
                type: ControlType.Enum,
                title: "Activate At",
                options: ["top", "center", "bottom"],
                optionTitles: ["Top", "Center", "Bottom"],
                defaultValue: "center",
                displaySegmentedControl: true,
            },
            smoothScroll: {
                type: ControlType.Boolean,
                title: "Smooth Scroll",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            scrollOffset: {
                type: ControlType.Number,
                title: "Scroll Offset",
                defaultValue: 80,
                min: 0,
                max: 200,
                step: 10,
                unit: "px",
            },
        },
    },
    activeIndicator: {
        type: ControlType.Object,
        title: "Active Indicator",
        controls: {
            showActiveIndicator: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            indicatorShape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["line", "circle", "square", "rounded"],
                optionTitles: ["Line", "Circle", "Square", "Rounded"],
                defaultValue: "line",
                displaySegmentedControl: false,
                hidden: ({ showActiveIndicator }) => !showActiveIndicator,
            },
            indicatorColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#0099FF",
                hidden: ({ showActiveIndicator }) => !showActiveIndicator,
            },
            indicatorWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 3,
                min: 1,
                max: 10,
                step: 1,
                unit: "px",
                hidden: ({ showActiveIndicator, indicatorShape }) => !showActiveIndicator || indicatorShape !== "line",
            },
            indicatorSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 12,
                min: 4,
                max: 32,
                step: 1,
                unit: "px",
                hidden: ({ showActiveIndicator, indicatorShape }) => !showActiveIndicator || indicatorShape === "line",
            },
            indicatorSpacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 8,
                min: 0,
                max: 32,
                step: 2,
                unit: "px",
                hidden: ({ showActiveIndicator }) => !showActiveIndicator,
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            enableAnimation: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            animationDuration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 200,
                min: 0,
                max: 1000,
                step: 50,
                unit: "ms",
                hidden: ({ enableAnimation }) => !enableAnimation,
            },
            animationEasing: {
                type: ControlType.Enum,
                title: "Easing",
                options: ["linear", "ease", "ease-in", "ease-out", "ease-in-out"],
                optionTitles: ["Linear", "Ease", "Ease In", "Ease Out", "Ease In Out"],
                defaultValue: "ease",
                displaySegmentedControl: false,
                hidden: ({ enableAnimation }) => !enableAnimation,
            },
        },
    },
})