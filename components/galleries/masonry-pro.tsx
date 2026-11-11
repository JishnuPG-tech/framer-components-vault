// Masonry grid component with full customization including columns, gap, items, and styling options
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef, startTransition, useMemo } from "react"

interface MasonryItem {
    image: { src: string; alt: string }
    height: number
    category?: string
}

interface MasonryGridProps {
    items: MasonryItem[]
    columns: number
    gap: number
    backgroundColor: string
    cardBorderRadius: number
    imageHeight: "auto" | "fixed"
    fixedImageHeight: number
    padding: number
    showFilters: boolean
    filterWidth: number
    filterBackground: string
    filterBorderRadius: number
    filterOptions: string[]
    filterFont: any
    filterTextColor: string
    filterActiveColor: string
    filterHoverColor: string
    filterAlign: "left" | "center" | "right"
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
export default function MasonryGrid(props: MasonryGridProps) {
    const {
        items,
        columns,
        gap,
        backgroundColor,
        cardBorderRadius,
        imageHeight,
        fixedImageHeight,
        padding,
        showFilters,
        filterWidth,
        filterBackground,
        filterBorderRadius,
        filterOptions,
        filterFont,
        filterTextColor,
        filterActiveColor,
        filterHoverColor,
        filterAlign,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [columnHeights, setColumnHeights] = useState<number[]>([])
    const [activeFilter, setActiveFilter] = useState<string>("All")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [hoveredOption, setHoveredOption] = useState<string | null>(null)

    const filteredItems = useMemo(() => {
        if (activeFilter === "All") return items
        return items.filter((item) => item.category === activeFilter)
    }, [items, activeFilter])

    const columnArrays = useMemo(() => {
        const cols: MasonryItem[][] = Array.from({ length: columns }, () => [])
        const heights = Array(columns).fill(0)

        filteredItems.forEach((item) => {
            const shortestColumnIndex = heights.indexOf(Math.min(...heights))
            cols[shortestColumnIndex].push(item)
            heights[shortestColumnIndex] += item.height
        })

        return cols
    }, [filteredItems, columns])

    useEffect(() => {
        if (containerRef.current) {
            const heights = Array(columns).fill(0)
            startTransition(() => setColumnHeights(heights))
        }
    }, [columns, items])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                padding,
                overflow: "auto",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 20,
            }}
        >
            {showFilters && (
                <div
                    style={{
                        width: filterWidth,
                        backgroundColor: filterBackground,
                        borderRadius: filterBorderRadius,
                        alignSelf: filterAlign === "left" ? "flex-start" : filterAlign === "center" ? "center" : "flex-end",
                    }}
                >
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() => startTransition(() => setIsDropdownOpen(!isDropdownOpen))}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                backgroundColor: "transparent",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                color: filterTextColor,
                                ...filterFont,
                            }}
                        >
                            <span>{activeFilter}</span>
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                style={{
                                    transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                }}
                            >
                                <path
                                    d="M2 4L6 8L10 4"
                                    stroke={filterTextColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 8px)",
                                    left: 0,
                                    right: 0,
                                    backgroundColor: filterBackground,
                                    border: `1px solid ${filterTextColor}22`,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    zIndex: 1000,
                                }}
                            >
                                {["All", ...filterOptions].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            startTransition(() => {
                                                setActiveFilter(option)
                                                setIsDropdownOpen(false)
                                            })
                                        }}
                                        onMouseEnter={() => setHoveredOption(option)}
                                        onMouseLeave={() => setHoveredOption(null)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            backgroundColor:
                                                hoveredOption === option
                                                    ? filterHoverColor
                                                    : "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            color:
                                                activeFilter === option ? filterActiveColor : filterTextColor,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            transition: "background-color 0.2s",
                                            ...filterFont,
                                        }}
                                    >
                                        <span>{option}</span>
                                        {activeFilter === option && (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path
                                                    d="M13 4L6 11L3 8"
                                                    stroke={filterActiveColor}
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    gap,
                    alignItems: "flex-start",
                    width: "100%",
                    flex: 1,
                }}
            >
                {columnArrays.map((column, columnIndex) => (
                    <div
                        key={columnIndex}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap,
                        }}
                    >
                        {column.map((item, itemIndex) => {
                            const itemImage = item.image || {
                                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                                alt: "Gradient 1 - Blue",
                            }
                            return (
                                <div
                                    key={itemIndex}
                                    style={{
                                        borderRadius: cardBorderRadius,
                                        overflow: "hidden",
                                    }}
                                >
                                    <img
                                        src={itemImage.src}
                                        alt={itemImage.alt}
                                        style={{
                                            width: "100%",
                                            height: imageHeight === "fixed" ? fixedImageHeight : item.height,
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

addPropertyControls(MasonryGrid, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                height: {
                    type: ControlType.Number,
                    title: "Height Weight",
                    defaultValue: 300,
                    min: 100,
                    max: 800,
                    step: 50,
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Popular",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                height: 400,
                category: "Popular",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                height: 300,
                category: "New",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                height: 500,
                category: "Daily picks",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                height: 350,
                category: "Popular",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                height: 450,
                category: "New",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                height: 320,
                category: "Daily picks",
            },
        ],
    },
    showFilters: {
        type: ControlType.Boolean,
        title: "Show Filters",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    filterAlign: {
        type: ControlType.Enum,
        title: "Filter Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
        hidden: ({ showFilters }) => !showFilters,
    },
    filterOptions: {
        type: ControlType.Array,
        title: "Filter Options",
        description: "Categories to filter items. Items are filtered by their 'Category' field.",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["Daily picks", "Popular", "New"],
        hidden: ({ showFilters }) => !showFilters,
    },
    filterWidth: {
        type: ControlType.Number,
        title: "Filter Width",
        defaultValue: 200,
        min: 150,
        max: 400,
        step: 10,
        unit: "px",
        hidden: ({ showFilters }) => !showFilters,
    },
    filterBackground: {
        type: ControlType.Color,
        title: "Filter Background",
        defaultValue: "#1a1a1a",
        hidden: ({ showFilters }) => !showFilters,
    },
    filterBorderRadius: {
        type: ControlType.Number,
        title: "Filter Radius",
        defaultValue: 12,
        min: 0,
        max: 24,
        step: 2,
        unit: "px",
        hidden: ({ showFilters }) => !showFilters,
    },
    filterFont: {
        type: ControlType.Font,
        title: "Filter Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showFilters }) => !showFilters,
    },
    filterTextColor: {
        type: ControlType.Color,
        title: "Filter Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showFilters }) => !showFilters,
    },
    filterActiveColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#0099FF",
        hidden: ({ showFilters }) => !showFilters,
    },
    filterHoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#2a2a2a",
        hidden: ({ showFilters }) => !showFilters,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Enum,
        title: "Image Height",
        options: ["auto", "fixed"],
        optionTitles: ["Auto", "Fixed"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    fixedImageHeight: {
        type: ControlType.Number,
        title: "Fixed Height",
        defaultValue: 200,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
        hidden: ({ imageHeight }) => imageHeight !== "fixed",
    },
})