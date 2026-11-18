// Offset Table of Contents - automatically detects headings in a rich text block
// and generates smooth-scrolling links with customizable offset for sticky navbars
import { useEffect, useState, useCallback, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TOCItem {
    id: string
    text: string
    level: number
}

interface TableOfContentsProps {
    sectionId: string
    showHeading: boolean
    headingText: string
    headingFont: CSSProperties
    layout: "vertical" | "horizontal"
    itemSpacing: number
    backgroundColor: string
    textColor: string
    hoverColor: string
    activeColor: string
    font: CSSProperties
    bulletStyle: "numbers" | "circles" | "squares" | "dashes" | "arrows" | "none"
    bulletColor: string
    scrollOffset: number
    animationDuration: number
    underlineOnHover: boolean
    style?: CSSProperties
}

/**
 * Offset Table of Contents
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function OffsetTableOfContents(props: TableOfContentsProps) {
    const {
        sectionId = "content",
        showHeading = false,
        headingText = "Table of Contents",
        headingFont,
        layout = "vertical",
        itemSpacing = 12,
        backgroundColor = "#FFFFFF",
        textColor = "#000000",
        hoverColor = "#0099FF",
        activeColor = "#0066FF",
        font,
        bulletStyle = "numbers",
        bulletColor = "#CCCCCC",
        scrollOffset = 100,
        animationDuration = 800,
        underlineOnHover = true,
        style,
    } = props

    const [tocItems, setTocItems] = useState<TOCItem[]>([])
    const [activeId, setActiveId] = useState<string>("")
    const [hoveredId, setHoveredId] = useState<string>("")
    
    // Generate a stable unique instance ID for this component instance
    const instanceIdRef = useRef<string>()
    if (!instanceIdRef.current) {
        instanceIdRef.current = `toc-${Math.random().toString(36).substring(2, 11)}`
    }

    // Extract H1-H6 headings from the target section
    useEffect(() => {
        if (typeof window === "undefined") return

        const extractHeadings = () => {
            const section = document.getElementById(sectionId)
            if (!section) {
                console.warn(`Section with id "${sectionId}" not found`)
                return
            }

            const headings = section.querySelectorAll("h1, h2, h3, h4, h5, h6")
            const items: TOCItem[] = []

            headings.forEach((heading, index) => {
                // Preserve existing heading IDs, only generate if missing
                let id = heading.id
                if (!id) {
                    id = `${instanceIdRef.current}-heading-${index}`
                    heading.id = id
                }
                const level = parseInt(heading.tagName.substring(1))
                items.push({
                    id,
                    text: heading.textContent || "",
                    level,
                })
            })

            startTransition(() => setTocItems(items))
        }

        // Initial extraction
        extractHeadings()

        // Re-extract if DOM changes
        const observer = new MutationObserver(extractHeadings)
        const section = document.getElementById(sectionId)
        if (section) {
            observer.observe(section, {
                childList: true,
                subtree: true,
            })
        }

        return () => observer.disconnect()
    }, [sectionId])

    // Track active section on scroll
    useEffect(() => {
        if (typeof window === "undefined" || tocItems.length === 0) return

        const handleScroll = () => {
            const scrollPosition = window.scrollY + scrollOffset + 50

            for (let i = tocItems.length - 1; i >= 0; i--) {
                const element = document.getElementById(tocItems[i].id)
                if (element) {
                    const rect = element.getBoundingClientRect()
                    const elementTop = rect.top + window.scrollY
                    
                    if (elementTop <= scrollPosition) {
                        startTransition(() => setActiveId(tocItems[i].id))
                        return
                    }
                }
            }

            startTransition(() => setActiveId(""))
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll()

        return () => window.removeEventListener("scroll", handleScroll)
    }, [tocItems, scrollOffset])

    const handleClick = useCallback(
        (id: string) => {
            if (typeof window === "undefined") return

            const element = document.getElementById(id)
            if (!element) return

            const rect = element.getBoundingClientRect()
            const elementTop = rect.top + window.scrollY
            const targetPosition = elementTop - scrollOffset

            window.scrollTo({
                top: targetPosition,
                behavior: "smooth",
            })
        },
        [scrollOffset]
    )

    const isVertical = layout === "vertical"
    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    const getBulletContent = (index: number) => {
        switch (bulletStyle) {
            case "numbers":
                return String(index + 1).padStart(2, "0")
            case "circles":
                return "●"
            case "squares":
                return "■"
            case "dashes":
                return "—"
            case "arrows":
                return "→"
            case "none":
                return null
            default:
                return String(index + 1).padStart(2, "0")
        }
    }

    return (
        <nav
            style={{
                ...style,
                position: "relative",
                backgroundColor,
                borderRadius: 8,
                padding: 20,
                overflow: "auto",
                ...(isFixedWidth ? {} : { minWidth: "max-content" }),
                ...(isFixedHeight ? {} : { minHeight: "max-content" }),
            }}
            aria-label="Table of Contents"
        >
            {showHeading && (
                <h3
                    style={{
                        ...headingFont,
                        margin: 0,
                        marginBottom: itemSpacing * 1.5,
                        color: textColor,
                    }}
                >
                    {headingText}
                </h3>
            )}
            <ul
                style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: isVertical ? "column" : "row",
                    gap: itemSpacing,
                    flexWrap: isVertical ? "nowrap" : "wrap",
                }}
            >
                {tocItems.length === 0 ? (
                    <li
                        style={{
                            ...font,
                            color: textColor,
                            opacity: 0.5,
                        }}
                    >
                        No headings found in section "{sectionId}"
                    </li>
                ) : (
                    tocItems.map((item, index) => {
                        const isActive = activeId === item.id
                        const isHovered = hoveredId === item.id
                        const currentColor = isActive ? activeColor : isHovered ? hoverColor : textColor
                        const bulletContent = getBulletContent(index)

                        return (
                            <li key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {bulletContent && (
                                    <span
                                        style={{
                                            ...font,
                                            color: isActive ? activeColor : bulletColor,
                                            fontWeight: isActive ? "bold" : "normal",
                                            minWidth: bulletStyle === "numbers" ? 24 : 16,
                                            transition: `color ${animationDuration}ms ease`,
                                            textAlign: bulletStyle === "numbers" ? "left" : "center",
                                        }}
                                    >
                                        {bulletContent}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleClick(item.id)}
                                    onMouseEnter={() => startTransition(() => setHoveredId(item.id))}
                                    onMouseLeave={() => startTransition(() => setHoveredId(""))}
                                    style={{
                                        ...font,
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        paddingLeft: isVertical ? (item.level - 1) * 16 : 0,
                                        color: currentColor,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        position: "relative",
                                        transition: `color ${animationDuration}ms ease`,
                                        textDecoration: "none",
                                        fontWeight: isActive ? "bold" : "normal",
                                    }}
                                    aria-current={isActive ? "location" : undefined}
                                >
                                    {item.text}
                                    {underlineOnHover && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                bottom: -2,
                                                left: 0,
                                                width: isHovered || isActive ? "100%" : "0%",
                                                height: 2,
                                                backgroundColor: currentColor,
                                                transition: `width ${animationDuration}ms ease`,
                                            }}
                                        />
                                    )}
                                </button>
                            </li>
                        )
                    })
                )}
            </ul>
        </nav>
    )
}

addPropertyControls(OffsetTableOfContents, {
    sectionId: {
        type: ControlType.String,
        title: "Section ID",
        defaultValue: "content",
        description: "ID of the rich text block containing headings (H1-H6)",
    },
    showHeading: {
        type: ControlType.Boolean,
        title: "Show Heading",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    headingText: {
        type: ControlType.String,
        title: "Heading Text",
        defaultValue: "Table of Contents",
        hidden: ({ showHeading }) => !showHeading,
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: ({ showHeading }) => !showHeading,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
    itemSpacing: {
        type: ControlType.Number,
        title: "Item Spacing",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#0099FF",
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#0066FF",
    },
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
    bulletStyle: {
        type: ControlType.Enum,
        title: "Bullet Style",
        options: ["numbers", "circles", "squares", "dashes", "arrows", "none"],
        optionTitles: ["Numbers", "Circles", "Squares", "Dashes", "Arrows", "None"],
        defaultValue: "numbers",
    },
    bulletColor: {
        type: ControlType.Color,
        title: "Bullet Color",
        defaultValue: "#CCCCCC",
        hidden: ({ bulletStyle }) => bulletStyle === "none",
    },
    scrollOffset: {
        type: ControlType.Number,
        title: "Scroll Offset",
        defaultValue: 100,
        min: 0,
        max: 300,
        step: 10,
        unit: "px",
        description: "Custom offset for sites with sticky navbars. Adjusts scroll position to account for fixed headers at the top of the page.",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 800,
        min: 100,
        max: 2000,
        step: 100,
        unit: "ms",
    },
    underlineOnHover: {
        type: ControlType.Boolean,
        title: "Underline",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})