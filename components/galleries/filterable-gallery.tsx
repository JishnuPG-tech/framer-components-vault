import * as React from "react"
import { useState, useMemo, useRef, useEffect, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * ProjectGallery — Self-contained filterable gallery for Framer
 *
 * Right panel:
 * - Items: add projects (image, title, category)
 * - Tabs are generated automatically from unique category values
 * - Supports Desktop / Tablet / Mobile column counts
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResponsiveImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface ProjectItem {
    image: ResponsiveImageValue | null
    title: string
    category: string
    focalX?: number
    focalY?: number
}

interface Props {
    items: ProjectItem[]
    // Columns per breakpoint
    columns: number
    // Gaps
    cardGap: number
    tabGap: number
    sectionGap: number
    // Tab colors
    activeTextColor: string
    inactiveTextColor: string
    underlineColor: string
    dividerColor: string
    // Tab text
    tabFont: any
    tabUppercase: boolean
    // Card text
    cardTextColor: string
    cardFont: any
    cardUppercase: boolean
    cardTextGap: number
    // Other
    allLabel: string
    aspectRatio: string
}

// ─── Card wrapper (scroll-triggered reveal, static fallback) ────────────────

function Card({
    i,
    isStatic,
    cardTextGap,
    children,
}: {
    i: number
    isStatic: boolean
    cardTextGap: number
    children: React.ReactNode
}) {
    const ref = useRef<HTMLDivElement>(null)
    // The ref is only attached in live contexts, so no observer is created
    // on the canvas, in thumbnails or in static exports.
    const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" })

    const layout: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: `${cardTextGap}px`,
    }

    if (isStatic) {
        return <div style={layout}>{children}</div>
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            exit={{
                opacity: 0,
                y: 20,
                transition: { duration: 0.2, ease: "easeIn" },
            }}
            transition={{
                duration: 1.8,
                delay: i * 0.25,
                ease: [0.16, 1, 0.3, 1],
            }}
            style={layout}
        >
            {children}
        </motion.div>
    )
}

// ─── Lightbox (accessible dialog) ───────────────────────────────────────────

function Lightbox({
    image,
    label,
    onClose,
}: {
    image: ResponsiveImageValue
    label: string
    onClose: () => void
}) {
    const closeRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null
        closeRef.current?.focus()

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                onClose()
            } else if (e.key === "Tab") {
                // The close button is the only focusable element: keep focus inside
                e.preventDefault()
                closeRef.current?.focus()
            }
        }

        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        document.addEventListener("keydown", onKeyDown)

        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.body.style.overflow = prevOverflow
            previouslyFocused?.focus?.()
        }
    }, [onClose])

    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                cursor: "zoom-out",
            }}
        >
            <button
                ref={closeRef}
                type="button"
                aria-label="Close image"
                onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                }}
                style={{
                    position: "absolute",
                    top: "40px",
                    right: "40px",
                    width: "48px",
                    height: "48px",
                    padding: 0,
                    border: "none",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#fff",
                    zIndex: 2,
                    transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.2)"
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)"
                }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Loaded only when the lightbox opens; sized to the screen */}
            <motion.img
                src={image.src}
                srcSet={image.srcSet}
                sizes="100vw"
                alt={image.alt || label}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                }}
            />
        </motion.div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectGallery(props: Props) {
    const {
        items = [],
        columns,
        cardGap,
        tabGap,
        sectionGap,
        activeTextColor,
        inactiveTextColor,
        underlineColor,
        dividerColor,
        tabFont,
        tabUppercase,
        cardTextColor,
        cardFont,
        cardUppercase,
        cardTextGap,
        allLabel,
        aspectRatio,
    } = props

    // Canvas, thumbnails and static exports: no animations, observers or lightbox
    const isStatic = useIsStaticRenderer()

    const getFontStyle = (
        font: any,
        defaultSize: number,
        defaultWeight: number | string
    ) => {
        const rawSize = font?.fontSize ?? defaultSize
        const fontSize = typeof rawSize === "number" ? `${rawSize}px` : rawSize

        return {
            fontFamily: font?.fontFamily || "Inter, sans-serif",
            fontSize: fontSize,
            fontWeight: font?.fontWeight ?? defaultWeight,
            letterSpacing: font?.letterSpacing ?? 0,
            lineHeight: font?.lineHeight ?? 1.3,
            textAlign: font?.textAlign || "left",
        }
    }

    const tabStyles = getFontStyle(tabFont, 14, 500)
    const cardStyles = getFontStyle(cardFont, 13, 400)

    // Build unique tab list from item categories (case-insensitive deduplication)
    const tabs = useMemo(() => {
        const catsMap = new Map<string, string>()
        items.forEach((item) => {
            if (item.category && item.category.trim()) {
                const trimmed = item.category.trim()
                const lower = trimmed.toLowerCase()
                if (!catsMap.has(lower)) {
                    catsMap.set(lower, trimmed)
                }
            }
        })
        return [allLabel, ...Array.from(catsMap.values())]
    }, [items, allLabel])

    const [activeTab, setActiveTab] = useState<string>(allLabel)
    const [lightboxItem, setLightboxItem] = useState<ProjectItem | null>(null)
    const closeLightbox = useCallback(() => setLightboxItem(null), [])

    const tabsRef = useRef<HTMLDivElement>(null)
    // Ref is attached only in live contexts → no observer in static renders
    const tabsInView = useInView(tabsRef, {
        once: true,
        margin: "0px 0px -50px 0px",
    })

    // Filter items by active tab
    const filtered = useMemo(() => {
        if (activeTab === allLabel) return items
        return items.filter(
            (item) =>
                item.category?.trim().toLowerCase() === activeTab.toLowerCase()
        )
    }, [items, activeTab, allLabel])

    // Placeholder when no items are added
    if (!items || items.length === 0) {
        return (
            <div
                style={{
                    padding: "24px",
                    color: "#888",
                    fontSize: 13,
                    fontFamily: "Inter, sans-serif",
                    border: "1px dashed #444",
                    borderRadius: 8,
                    textAlign: "center",
                }}
            >
                ← Add projects in the right panel (Items)
            </div>
        )
    }

    const tabBarStyle: React.CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        gap: `${tabGap}px`,
        width: "100%",
        borderBottom: `1px solid ${dividerColor}`,
        position: "relative",
        paddingBottom: "1px", // Space for the absolute underline
    }

    const tabShown = isStatic || tabsInView

    // Each card is roughly 1/columns of the viewport wide; the browser picks
    // the matching Framer variant (incl. retina), so thumbnails stay sharp.
    const gridSizes = `${Math.ceil(100 / Math.max(columns, 1))}vw`

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: `${sectionGap}px`,
                width: "100%",
            }}
        >
            {/* ── Tab bar ── */}
            <motion.div
                ref={isStatic ? undefined : tabsRef}
                role="group"
                aria-label="Filter projects by category"
                initial={isStatic ? false : { opacity: 0, y: 15 }}
                animate={
                    tabShown ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }
                }
                transition={{
                    duration: 1.2,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1,
                }}
                style={tabBarStyle}
            >
                {tabs.map((tab, i: number) => {
                    const isActive = activeTab === tab
                    return (
                        <motion.button
                            key={tab}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => setActiveTab(tab)}
                            initial={isStatic ? false : { opacity: 0, x: -10 }}
                            animate={
                                tabShown
                                    ? { opacity: 1, x: 0 }
                                    : { opacity: 0, x: -10 }
                            }
                            transition={{
                                duration: 0.6,
                                delay: isStatic ? 0 : 0.2 + i * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                                border: "none",
                                backgroundColor: "transparent",
                                padding: "8px 0",
                                cursor: "pointer",
                                fontWeight: tabStyles.fontWeight,
                                fontSize: tabStyles.fontSize,
                                fontFamily: tabStyles.fontFamily,
                                letterSpacing: tabStyles.letterSpacing,
                                lineHeight: tabStyles.lineHeight,
                                textAlign: tabStyles.textAlign as any,
                                textTransform: tabUppercase
                                    ? "uppercase"
                                    : "none",
                                color: isActive
                                    ? activeTextColor
                                    : inactiveTextColor,
                                transition: "color 0.2s ease",
                                userSelect: "none",
                                whiteSpace: "nowrap",
                                position: "relative",
                            }}
                        >
                            {tab}
                            {/* Animated underline for the active tab */}
                            {isActive ? (
                                <motion.div
                                    layoutId={
                                        isStatic
                                            ? undefined
                                            : "tabUnderlineLineVariant"
                                    }
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        bottom: "-2px",
                                        left: 0,
                                        right: 0,
                                        height: "2px",
                                        backgroundColor: underlineColor,
                                        zIndex: 2,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 35,
                                    }}
                                />
                            ) : null}
                        </motion.button>
                    )
                })}
            </motion.div>

            {/* ── Card grid ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: `${cardGap}px`,
                    width: "100%",
                }}
            >
                <AnimatePresence mode="wait">
                    {filtered.map((item, i) => {
                        const label = item.title || item.image?.alt || "image"
                        const imageStyle: React.CSSProperties = {
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: `${item.focalX ?? 50}% ${item.focalY ?? 50}%`,
                            display: "block",
                            transformOrigin: "center center",
                        }
                        const frameStyle: React.CSSProperties = {
                            width: "100%",
                            aspectRatio: aspectRatio,
                            overflow: "hidden",
                            backgroundColor: "#1a1a1a",
                            flexShrink: 0,
                            padding: 0,
                            border: "none",
                            display: "block",
                        }

                        let media: React.ReactNode
                        if (!item.image?.src) {
                            media = (
                                <div
                                    style={{
                                        ...frameStyle,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#888",
                                        fontSize: 11,
                                        fontFamily: cardStyles.fontFamily,
                                        textAlign: "center",
                                        padding: "12px",
                                        gap: "6px",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    <span style={{ fontSize: 18 }}>+</span>
                                    Add image & fill in Title and Category via
                                    the right panel
                                </div>
                            )
                        } else if (isStatic) {
                            media = (
                                <div style={frameStyle}>
                                    <img
                                        src={item.image.src}
                                        srcSet={item.image.srcSet}
                                        sizes={gridSizes}
                                        alt={item.image.alt || item.title || ""}
                                        draggable={false}
                                        style={imageStyle}
                                    />
                                </div>
                            )
                        } else {
                            media = (
                                <button
                                    type="button"
                                    aria-label={`Open ${label} in full screen`}
                                    onClick={() => setLightboxItem(item)}
                                    style={{ ...frameStyle, cursor: "zoom-in" }}
                                >
                                    <motion.img
                                        src={item.image.src}
                                        srcSet={item.image.srcSet}
                                        sizes={gridSizes}
                                        alt={item.image.alt || item.title || ""}
                                        loading="lazy"
                                        decoding="async"
                                        draggable={false}
                                        whileHover={{ scale: 1.04 }}
                                        transition={{
                                            duration: 0.6,
                                            ease: [0.22, 0.03, 0.26, 1],
                                        }}
                                        style={imageStyle}
                                    />
                                </button>
                            )
                        }

                        return (
                            <Card
                                key={`${activeTab}-${i}`}
                                i={i}
                                isStatic={isStatic}
                                cardTextGap={cardTextGap}
                            >
                                {media}

                                {/* Title */}
                                {item.title && (
                                    <div
                                        style={{
                                            fontSize: cardStyles.fontSize,
                                            fontWeight: cardStyles.fontWeight,
                                            color: cardTextColor,
                                            fontFamily: cardStyles.fontFamily,
                                            letterSpacing:
                                                cardStyles.letterSpacing,
                                            lineHeight: cardStyles.lineHeight,
                                            textAlign:
                                                cardStyles.textAlign as any,
                                            textTransform: cardUppercase
                                                ? "uppercase"
                                                : "none",
                                            width: "100%",
                                            overflowWrap: "break-word",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {item.title}
                                    </div>
                                )}
                            </Card>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* ── Lightbox (live contexts only) ── */}
            {!isStatic && (
                <AnimatePresence>
                    {lightboxItem?.image?.src && (
                        <Lightbox
                            key="lightbox"
                            image={lightboxItem.image}
                            label={lightboxItem.title || "Image preview"}
                            onClose={closeLightbox}
                        />
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(ProjectGallery, {
    // ── Data ─────────────────────────────────────────────────────────────────
    items: {
        type: ControlType.Array,
        title: "Items",
        description:
            "Add your projects — each item has an image, title, and category.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description:
                        "💡 Tip: Use Focal X/Y below to crop. (Built-in Crop can be buggy inside arrays).",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project Name",
                    placeholder: "Project Name",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Commercial",
                    placeholder: "Commercial",
                },
                focalX: {
                    type: ControlType.Number,
                    title: "Focal X",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    displayStepper: true,
                    unit: "%",
                },
                focalY: {
                    type: ControlType.Number,
                    title: "Focal Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    displayStepper: true,
                    unit: "%",
                },
            },
        },
        defaultValue: [
            { title: "Project 1", category: "Category A" },
            { title: "Project 2", category: "Category B" },
            { title: "Project 3", category: "Category A" },
            { title: "Project 4", category: "Category C" },
            { title: "Project 5", category: "Category B" },
        ],
    },

    allLabel: {
        type: ControlType.String,
        title: "All Label",
        defaultValue: "ALL",
        description: "Text for the tab that shows all items.",
    },

    // ─── TABS ────────────────────────────────────────────────────────────────
    tabFont: {
        type: ControlType.Font,
        title: "Tab Font",
        description:
            "Control font family, size, weight, and letter spacing for the filter tabs.",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 500,
        },
        controls: "extended",
    },
    tabUppercase: {
        type: ControlType.Boolean,
        title: "Tab Uppercase",
        defaultValue: true,
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text Color",
        defaultValue: "#000000",
        description: "Color of the currently selected tab label.",
    },
    inactiveTextColor: {
        type: ControlType.Color,
        title: "Inactive Text Color",
        defaultValue: "#888888",
        description: "Color of unselected tab labels.",
    },
    underlineColor: {
        type: ControlType.Color,
        title: "Underline Color",
        defaultValue: "#000000",
        description: "Color of the animated underline under the active tab.",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Line Color",
        defaultValue: "#e5e5e5",
        description: "Color of the full-width line beneath all tabs.",
    },
    tabGap: {
        type: ControlType.Number,
        title: "Tab Gap",
        defaultValue: 16,
        min: 0,
        max: 40,
        description: "Horizontal space between filter tab buttons.",
    },

    // ─── CARDS ───────────────────────────────────────────────────────────────
    cardFont: {
        type: ControlType.Font,
        title: "Card Font",
        description:
            "Control font family, size, weight, and alignment for project titles on cards.",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 13,
            fontWeight: 400,
        },
        controls: "extended",
    },
    cardUppercase: {
        type: ControlType.Boolean,
        title: "Card Uppercase",
        defaultValue: false,
    },
    cardTextColor: {
        type: ControlType.Color,
        title: "Card Title Color",
        defaultValue: "#000000",
        description: "Color of the project title below each card.",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        description: "Number of columns in the card grid.",
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["1 / 1", "4 / 3", "16 / 9", "3 / 4", "9 / 16"],
        optionTitles: [
            "Square",
            "4:3",
            "16:9",
            "Portrait 3:4",
            "Portrait 9:16",
        ],
        defaultValue: "4 / 3",
        description: "Proportions of each image card.",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap X/Y",
        defaultValue: 16,
        min: 0,
        max: 80,
        description: "Space between cards, both horizontal and vertical.",
    },
    cardTextGap: {
        type: ControlType.Number,
        title: "Img to Title Gap",
        defaultValue: 4,
        min: 0,
        max: 40,
        description: "Vertical space between the card image and its title.",
    },

    // ─── LAYOUT ──────────────────────────────────────────────────────────────
    sectionGap: {
        type: ControlType.Number,
        title: "Tabs to Cards",
        defaultValue: 40,
        min: 0,
        max: 120,
        description: "Vertical gap between the tab row and the card grid.",
    },
})
