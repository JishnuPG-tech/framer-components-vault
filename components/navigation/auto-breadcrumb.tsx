// Breadcrumb component that automatically pulls the site's URL and displays each step with links to navigate back
import { useEffect, useState, startTransition, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface BreadcrumbProps {
    separator: {
        useSvg: boolean
        text: string
        svg: string
        color: string
        size: number
    }
    links: {
        showHome: boolean
        homeLabel: string
        linkColor: string
        textPadding: string
        textBackground: string
        textBorderRadius: number
        currentColor: string
        hoverColor: string
        hoverUnderline: boolean
        truncate: boolean
        truncateLength: number
        userSelect: boolean
    }
    font: any
    style?: React.CSSProperties
    gap: number
    collapseMode: "auto" | "manual"
    maxVisibleCrumbs: number
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function AutoBreadcrumb(props: BreadcrumbProps) {
    const {
        separator = {
            useSvg: false,
            text: "/",
            svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            color: "#CCCCCC",
            size: 16,
        },
        links = {
            showHome: true,
            homeLabel: "Home",
            linkColor: "#0099FF",
            textPadding: "0px",
            textBackground: "transparent",
            textBorderRadius: 0,
            currentColor: "#000000",
            hoverColor: "#0066FF",
            hoverUnderline: true,
            truncate: false,
            truncateLength: 20,
            userSelect: true,
        },
        font,
        gap = 8,
        collapseMode = "auto",
        maxVisibleCrumbs = 3,
    } = props

    // Destructure separator properties
    const { useSvg: useSvgSeparator, text: textSeparator, svg: svgSeparator, color: separatorColor, size: separatorSize } = separator

    // Destructure links properties
    const {
        showHome,
        homeLabel,
        linkColor,
        textPadding,
        textBackground,
        textBorderRadius,
        currentColor,
        hoverColor,
        hoverUnderline,
        truncate,
        truncateLength,
        userSelect,
    } = links

    const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; path: string }>>([
        { label: homeLabel, path: "/" },
        { label: "Example", path: "/example" },
        { label: "Page", path: "/example/page" },
    ])
    const [shouldCollapse, setShouldCollapse] = useState(false)
    const [focusedIndex, setFocusedIndex] = useState<number>(-1)
    const navRef = useRef<HTMLElement>(null)
    const olRef = useRef<HTMLOListElement>(null)
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    useEffect(() => {
        if (typeof window === "undefined") {
            startTransition(() => {
                setBreadcrumbs([
                    { label: homeLabel, path: "/" },
                    { label: "Example", path: "/example" },
                    { label: "Page", path: "/example/page" },
                ])
            })
            return
        }

        const pathname = window.location.pathname
        const segments = pathname.split("/").filter((segment) => segment !== "")

        const crumbs: Array<{ label: string; path: string }> = []

        if (showHome) {
            crumbs.push({ label: homeLabel, path: "/" })
        }

        segments.forEach((segment, index) => {
            const path = "/" + segments.slice(0, index + 1).join("/")
            const label = segment
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")

            crumbs.push({ label, path })
        })

        startTransition(() => {
            setBreadcrumbs(crumbs)
        })
    }, [showHome, homeLabel])

    // Auto-collapse logic based on width
    useEffect(() => {
        if (collapseMode === "manual") {
            startTransition(() => {
                setShouldCollapse(breadcrumbs.length > maxVisibleCrumbs)
            })
            return
        }

        if (!navRef.current || !olRef.current || typeof window === "undefined") return

        const checkOverflow = () => {
            if (!navRef.current || !olRef.current) return

            const navWidth = navRef.current.offsetWidth
            const olWidth = olRef.current.scrollWidth

            startTransition(() => {
                setShouldCollapse(olWidth > navWidth && breadcrumbs.length > 3)
            })
        }

        checkOverflow()

        const resizeObserver = new ResizeObserver(checkOverflow)
        resizeObserver.observe(navRef.current)

        return () => {
            resizeObserver.disconnect()
        }
    }, [breadcrumbs, collapseMode, maxVisibleCrumbs, gap, font])

    // Helper function to get display label
    const getDisplayLabel = (crumb: { label: string; path: string }, index: number) => {
        if (isCanvas) {
            // In canvas, show "Page 1", "Page 2", etc. for non-home items
            if (index === 0 && showHome) {
                return crumb.label // Keep "Home" as is
            }
            return `Page ${showHome ? index : index + 1}`
        }
        return crumb.label // On live site, use actual labels
    }

    // Helper function to truncate text
    const truncateText = (text: string) => {
        if (!truncate || text.length <= truncateLength) {
            return text
        }
        return text.slice(0, truncateLength) + "..."
    }

    // Determine which breadcrumbs to show
    const getVisibleBreadcrumbs = () => {
        if (!shouldCollapse) {
            return breadcrumbs
        }

        if (collapseMode === "manual") {
            // Manual mode: show first, ellipsis, and last (maxVisibleCrumbs - 2) items
            const visibleCount = Math.max(2, maxVisibleCrumbs)
            if (breadcrumbs.length <= visibleCount) {
                return breadcrumbs
            }

            const lastItemsCount = visibleCount - 1 // Reserve 1 for home
            const result = [
                breadcrumbs[0], // Home
                { label: "...", path: "", isEllipsis: true } as any,
                ...breadcrumbs.slice(-lastItemsCount),
            ]
            return result
        }

        // Auto mode: show first, ellipsis, and last 2 items
        return [
            breadcrumbs[0],
            { label: "...", path: "", isEllipsis: true } as any,
            ...breadcrumbs.slice(-2),
        ]
    }

    const visibleBreadcrumbs = getVisibleBreadcrumbs()

    // Keyboard navigation handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const clickableCount = visibleBreadcrumbs.filter((crumb, index) => {
            const isLast = index === visibleBreadcrumbs.length - 1
            const isEllipsis = (crumb as any).isEllipsis
            return !isLast && !isEllipsis
        }).length

        if (clickableCount === 0) return

        if (e.key === "ArrowRight") {
            e.preventDefault()
            startTransition(() => {
                setFocusedIndex((prev) => {
                    const next = prev + 1
                    if (next >= clickableCount) return 0
                    return next
                })
            })
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            startTransition(() => {
                setFocusedIndex((prev) => {
                    const next = prev - 1
                    if (next < 0) return clickableCount - 1
                    return next
                })
            })
        } else if (e.key === "Enter" && focusedIndex >= 0) {
            e.preventDefault()
            const link = linkRefs.current[focusedIndex]
            if (link) {
                link.click()
            }
        }
    }

    // Focus the link when focusedIndex changes
    useEffect(() => {
        if (focusedIndex >= 0 && linkRefs.current[focusedIndex]) {
            linkRefs.current[focusedIndex]?.focus()
        }
    }, [focusedIndex])

    return (
        <nav
            ref={navRef}
            aria-label="Breadcrumb"
            onKeyDown={handleKeyDown}
            style={{
                display: "flex",
                alignItems: "center",
                gap,
                width: "max-content",
                minWidth: 5,
                minHeight: 5,
                ...font,
                ...(collapseMode === "auto" && props.style?.width === "100%" ? { width: "100%" } : {}),
            }}
        >
            <ol
                ref={olRef}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap,
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                }}
            >
                {visibleBreadcrumbs.map((crumb, index) => {
                    const isLast = index === visibleBreadcrumbs.length - 1
                    const isEllipsis = (crumb as any).isEllipsis
                    const displayLabel = isEllipsis ? "..." : getDisplayLabel(crumb, breadcrumbs.indexOf(crumb))
                    const truncatedLabel = truncateText(displayLabel)

                    // Calculate the ref index for clickable links
                    let refIndex = -1
                    if (!isLast && !isEllipsis) {
                        refIndex = visibleBreadcrumbs
                            .slice(0, index)
                            .filter((c, i) => {
                                const iL = i === visibleBreadcrumbs.length - 1
                                const iE = (c as any).isEllipsis
                                return !iL && !iE
                            }).length
                    }

                    return (
                        <li
                            key={isEllipsis ? "ellipsis" : crumb.path}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap,
                            }}
                        >
                            {isEllipsis ? (
                                <>
                                    <span
                                        style={{
                                            color: currentColor,
                                            userSelect: userSelect ? "auto" : "none",
                                            padding: textPadding,
                                            backgroundColor: textBackground,
                                            borderRadius: textBorderRadius,
                                        }}
                                    >
                                        ...
                                    </span>
                                    {useSvgSeparator ? (
                                        <span
                                            style={{
                                                color: separatorColor,
                                                userSelect: "none",
                                                display: "flex",
                                                alignItems: "center",
                                                width: separatorSize,
                                                height: separatorSize,
                                            }}
                                            aria-hidden="true"
                                            dangerouslySetInnerHTML={{ __html: svgSeparator }}
                                        />
                                    ) : (
                                        <span
                                            style={{
                                                color: separatorColor,
                                                userSelect: "none",
                                                fontSize: separatorSize,
                                            }}
                                            aria-hidden="true"
                                        >
                                            {textSeparator}
                                        </span>
                                    )}
                                </>
                            ) : isLast ? (
                                <span
                                    style={{
                                        color: currentColor,
                                        padding: textPadding,
                                        backgroundColor: textBackground,
                                        borderRadius: textBorderRadius,
                                        userSelect: userSelect ? "auto" : "none",
                                    }}
                                    aria-current="page"
                                >
                                    {truncatedLabel}
                                </span>
                            ) : (
                                <>
                                    <a
                                        ref={(el) => {
                                            if (refIndex >= 0) {
                                                linkRefs.current[refIndex] = el
                                            }
                                        }}
                                        href={crumb.path}
                                        tabIndex={0}
                                        style={{
                                            color: linkColor,
                                            textDecoration: "none",
                                            cursor: "pointer",
                                            transition: "color 0.2s ease",
                                            outline: "none",
                                            padding: textPadding,
                                            backgroundColor: textBackground,
                                            borderRadius: textBorderRadius,
                                            userSelect: userSelect ? "auto" : "none",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = hoverColor
                                            if (hoverUnderline) {
                                                e.currentTarget.style.textDecoration = "underline"
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = linkColor
                                            e.currentTarget.style.textDecoration = "none"
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.color = hoverColor
                                            if (hoverUnderline) {
                                                e.currentTarget.style.textDecoration = "underline"
                                            }
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.color = linkColor
                                            e.currentTarget.style.textDecoration = "none"
                                        }}
                                    >
                                        {truncatedLabel}
                                    </a>
                                    {useSvgSeparator ? (
                                        <span
                                            style={{
                                                color: separatorColor,
                                                userSelect: "none",
                                                display: "flex",
                                                alignItems: "center",
                                                width: separatorSize,
                                                height: separatorSize,
                                            }}
                                            aria-hidden="true"
                                            dangerouslySetInnerHTML={{ __html: svgSeparator }}
                                        />
                                    ) : (
                                        <span
                                            style={{
                                                color: separatorColor,
                                                userSelect: "none",
                                                fontSize: separatorSize,
                                            }}
                                            aria-hidden="true"
                                        >
                                            {textSeparator}
                                        </span>
                                    )}
                                </>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

addPropertyControls(AutoBreadcrumb, {
    collapseMode: {
        type: ControlType.Enum,
        title: "Collapse Mode",
        options: ["auto", "manual"],
        optionTitles: ["Auto", "Manual"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    maxVisibleCrumbs: {
        type: ControlType.Number,
        title: "Max Visible",
        defaultValue: 3,
        min: 2,
        max: 10,
        step: 1,
        displayStepper: true,
        hidden: ({ collapseMode }) => collapseMode === "auto",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    separator: {
        type: ControlType.Object,
        title: "Separator",
        controls: {
            useSvg: {
                type: ControlType.Boolean,
                title: "Use SVG",
                defaultValue: false,
                enabledTitle: "SVG",
                disabledTitle: "Text",
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "/",
                hidden: (props) => props.useSvg,
            },
            svg: {
                type: ControlType.String,
                title: "SVG Code",
                defaultValue:
                    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                displayTextArea: true,
                hidden: (props) => !props.useSvg,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#CCCCCC",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 16,
                min: 8,
                max: 48,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
        },
    },
    links: {
        type: ControlType.Object,
        title: "Links",
        controls: {
            showHome: {
                type: ControlType.Boolean,
                title: "Show Home",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            homeLabel: {
                type: ControlType.String,
                title: "Home Label",
                defaultValue: "Home",
                hidden: (props) => !props.showHome,
            },
            linkColor: {
                type: ControlType.Color,
                title: "Link Color",
                defaultValue: "#0099FF",
            },
            textPadding: {
                type: ControlType.Padding,
                title: "Text Padding",
                defaultValue: "0px",
            },
            textBackground: {
                type: ControlType.Color,
                title: "Text Background",
                defaultValue: "rgba(0, 0, 0, 0)",
            },
            textBorderRadius: {
                type: ControlType.Number,
                title: "Text Radius",
                defaultValue: 0,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            currentColor: {
                type: ControlType.Color,
                title: "Current Color",
                defaultValue: "#000000",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover Color",
                defaultValue: "#0066FF",
            },
            hoverUnderline: {
                type: ControlType.Boolean,
                title: "Hover Underline",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            truncate: {
                type: ControlType.Boolean,
                title: "Truncate",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            truncateLength: {
                type: ControlType.Number,
                title: "Max Characters",
                defaultValue: 20,
                min: 3,
                max: 100,
                step: 1,
                displayStepper: false,
                hidden: (props) => !props.truncate,
            },
            userSelect: {
                type: ControlType.Boolean,
                title: "User Select",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        description: "Explore [more components](https://dub.sh/Explore-more).\n\nMade by [Till Janek](https://dub.sh/made-by-tilljanek).",
    },
})