import { useEffect, useState, useRef } from "react"
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


export default function RightSideHoverTOC(props) {
    const {
        containerSelector,
        headingSelector,
        offset,
        title,
        compact,
        indicatorPosition,
        indicatorWidth,
        indicatorRadius,
    } = props

    const isStatic = useIsStaticRenderer()

    const [items, setItems] = useState([])
    const [activeId, setActiveId] = useState("")
    const [hovered, setHovered] = useState(false)
    const [hoveredItem, setHoveredItem] = useState("")

    // Prevent observer updates while programmatically scrolling
    const isManualScrolling = useRef(false)

    // SSR Safe Dark Mode Check
    const isDark =
        typeof window !== "undefined" &&
        Boolean(
            window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
        )

    // Standard Minimal Grayscale Palette
    const colors = {
        line: isDark ? "#333333" : "#e4e4e7",
        active: isDark ? "#ffffff" : "#09090b",
        panelBg: isDark ? "#18181b" : "#ffffff",
        text: isDark ? "#a1a1aa" : "#71717a",
        activeText: isDark ? "#ffffff" : "#09090b",
        activeBg: isDark ? "#27272a" : "#f4f4f5",
        hoverBg: isDark ? "#202023" : "#fafafa",
        shadow: isDark
            ? "0 10px 30px rgba(0,0,0,0.5)"
            : "0 10px 30px rgba(0,0,0,0.06)",
    }

    useEffect(() => {
        // Disable observers in static context (Canvas / Exports)
        if (isStatic) return

        let observer = null

        const updateHeadings = () => {
            // Find scoped root container to avoid global DOM mutation/interference
            const root = containerSelector
                ? document.querySelector(containerSelector) || document.body
                : document.body

            const headings = Array.from(root.querySelectorAll(headingSelector))

            // Map heading elements with direct element references (no ID mutation)
            const mapped = headings.map((el, i) => ({
                id: el.id || `toc-item-${i}`,
                element: el,
                text: el.innerText || el.textContent || "",
                level: el.tagName,
            }))

            setItems(mapped)

            if (observer) observer.disconnect()

            const visibleHeadings = new Map()

            observer = new IntersectionObserver(
                (entries) => {
                    if (isManualScrolling.current) return

                    entries.forEach((entry) => {
                        const targetItem = mapped.find(
                            (m) => m.element === entry.target
                        )
                        if (!targetItem) return

                        if (entry.isIntersecting) {
                            visibleHeadings.set(
                                targetItem.id,
                                entry.boundingClientRect.top
                            )
                        } else {
                            visibleHeadings.delete(targetItem.id)
                        }
                    })

                    if (visibleHeadings.size > 0) {
                        const sorted = Array.from(
                            visibleHeadings.entries()
                        ).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))
                        setActiveId(sorted[0][0])
                    }
                },
                {
                    rootMargin: `-${offset}px 0px -50% 0px`,
                    threshold: 0.1,
                }
            )

            headings.forEach((el) => observer.observe(el))
        }

        updateHeadings()

        // MutationObserver scoped to target root container
        const targetContainer = containerSelector
            ? document.querySelector(containerSelector) || document.body
            : document.body

        const mutationObserver = new MutationObserver(updateHeadings)
        mutationObserver.observe(targetContainer, {
            childList: true,
            subtree: true,
        })

        return () => {
            if (observer) observer.disconnect()
            mutationObserver.disconnect()
        }
    }, [containerSelector, headingSelector, offset, isStatic])

    const scrollToElement = (targetElement, id) => {
        if (isStatic || !targetElement) return

        setActiveId(id)
        isManualScrolling.current = true

        const elementPosition =
            targetElement.getBoundingClientRect().top + window.pageYOffset

        window.scrollTo({
            top: elementPosition - offset,
            behavior: "smooth",
        })

        setTimeout(() => {
            isManualScrolling.current = false
        }, 800)
    }

    const showLeftIndicator = indicatorPosition === "left"
    const showRightIndicator = indicatorPosition === "right"

    // --- FALLBACK PREVIEW FOR FRAMER CANVAS & EXPORT (STATIC RENDERER) ---
    if (isStatic) {
        const previewItems = [
            { id: "p1", text: "Overview", level: "H1" },
            { id: "p2", text: "Getting Started", level: "H2" },
            { id: "p3", text: "Configuration", level: "H2" },
        ]

        return (
            <div
                style={{
                    position: "relative",
                    width: 260,
                    padding: 12,
                    background: colors.panelBg,
                    borderRadius: 18,
                    border: `1px solid ${colors.line}`,
                    boxShadow: colors.shadow,
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
                {title && (
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 600,
                            padding: "8px 12px",
                            marginBottom: 4,
                            color: colors.activeText,
                        }}
                    >
                        {title}
                    </div>
                )}
                {previewItems.map((item, idx) => {
                    const level = Number(item.level.replace("H", "")) || 1
                    const isActive = idx === 0
                    const indentPadding = (level - 1) * 12
                    const totalLeftPadding =
                        (showLeftIndicator ? 16 : 12) + indentPadding

                    return (
                        <div
                            key={item.id}
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                borderRadius: 8,
                                marginBottom: 2,
                                padding: compact ? "6px 10px" : "8px 12px",
                                paddingLeft: totalLeftPadding,
                                paddingRight: showRightIndicator ? 16 : 12,
                                background: isActive
                                    ? colors.activeBg
                                    : "transparent",
                            }}
                        >
                            {showLeftIndicator && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 6,
                                        top: 6,
                                        bottom: 6,
                                        width: indicatorWidth,
                                        borderRadius: indicatorRadius,
                                        background: colors.active,
                                        opacity: isActive ? 1 : 0,
                                    }}
                                />
                            )}
                            <div
                                style={{
                                    flex: 1,
                                    fontSize: compact ? 12 : 13,
                                    fontWeight: isActive ? 600 : 450,
                                    color: isActive
                                        ? colors.activeText
                                        : colors.text,
                                }}
                            >
                                {item.text}
                            </div>
                            {showRightIndicator && (
                                <div
                                    style={{
                                        position: "absolute",
                                        right: 6,
                                        top: 6,
                                        bottom: 6,
                                        width: indicatorWidth,
                                        borderRadius: indicatorRadius,
                                        background: colors.active,
                                        opacity: isActive ? 1 : 0,
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    // --- INTERACTIVE RUNTIME RENDER ---
    return (
        <nav
            aria-label="Table of contents"
            style={{
                position: "fixed",
                right: 40,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 999,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setHovered(false)
                }
            }}
        >
            {/* Minimal indicator lines (Collapsed state) */}
            <motion.div
                animate={{ opacity: hovered ? 0 : 1 }}
                transition={{ duration: 0.15 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}
            >
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        style={{
                            height: 2,
                            borderRadius: 2,
                            background:
                                activeId === item.id
                                    ? colors.active
                                    : colors.line,
                        }}
                        animate={{
                            width: activeId === item.id ? 36 : 18,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                    />
                ))}
            </motion.div>

            {/* Expanded Hover TOC Panel */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.18 }}
                        style={{
                            position: "absolute",
                            right: 0,
                            top: "-20px",
                            width: "clamp(220px, 22vw, 320px)",
                            maxHeight: "70vh",
                            overflowY: "auto",
                            padding: 12,
                            background: colors.panelBg,
                            borderRadius: 18,
                            backdropFilter: "blur(20px)",
                            border: `1px solid ${colors.line}`,
                            boxShadow: colors.shadow,
                        }}
                    >
                        {title && (
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    padding: "8px 12px",
                                    marginBottom: 4,
                                    color: colors.activeText,
                                }}
                            >
                                {title}
                            </div>
                        )}

                        {items.map((item) => {
                            const level =
                                Number(item.level.replace("H", "")) || 1
                            const isActive = activeId === item.id
                            const isHovered = hoveredItem === item.id

                            const indentPadding = (level - 1) * 12
                            const baseLeftPadding = showLeftIndicator ? 16 : 12
                            const totalLeftPadding =
                                baseLeftPadding + indentPadding

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="link"
                                    tabIndex={0}
                                    aria-current={isActive ? "true" : undefined}
                                    onClick={() =>
                                        scrollToElement(item.element, item.id)
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            e.preventDefault()
                                            scrollToElement(
                                                item.element,
                                                item.id
                                            )
                                        }
                                    }}
                                    onMouseEnter={() => setHoveredItem(item.id)}
                                    onMouseLeave={() => setHoveredItem("")}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        width: "100%",
                                        border: "none",
                                        outline: "none",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        userSelect: "none",
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        marginBottom: 2,
                                        padding: compact
                                            ? "6px 10px"
                                            : "8px 12px",
                                        paddingLeft: totalLeftPadding,
                                        paddingRight: showRightIndicator
                                            ? 16
                                            : 12,
                                        background: isActive
                                            ? colors.activeBg
                                            : isHovered
                                              ? colors.hoverBg
                                              : "transparent",
                                        transition: "background 0.15s ease",
                                    }}
                                >
                                    {/* Left Indicator */}
                                    {showLeftIndicator && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 6,
                                                top: 6,
                                                bottom: 6,
                                                width: indicatorWidth,
                                                borderRadius: indicatorRadius,
                                                background: colors.active,
                                                opacity: isActive
                                                    ? 1
                                                    : isHovered
                                                      ? 0.4
                                                      : 0,
                                                transform: isActive
                                                    ? "scaleY(1)"
                                                    : isHovered
                                                      ? "scaleY(0.6)"
                                                      : "scaleY(0.2)",
                                                transition:
                                                    "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                                            }}
                                        />
                                    )}

                                    {/* Text Content */}
                                    <div
                                        style={{
                                            flex: 1,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            fontSize: compact ? 12 : 13,
                                            fontWeight: isActive ? 600 : 450,
                                            color: isActive
                                                ? colors.activeText
                                                : colors.text,
                                            transition: "color 0.18s ease",
                                        }}
                                    >
                                        {item.text}
                                    </div>

                                    {/* Right Indicator */}
                                    {showRightIndicator && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                right: 6,
                                                top: 6,
                                                bottom: 6,
                                                width: indicatorWidth,
                                                borderRadius: indicatorRadius,
                                                background: colors.active,
                                                opacity: isActive
                                                    ? 1
                                                    : isHovered
                                                      ? 0.4
                                                      : 0,
                                                transform: isActive
                                                    ? "scaleY(1)"
                                                    : isHovered
                                                      ? "scaleY(0.6)"
                                                      : "scaleY(0.2)",
                                                transition:
                                                    "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                                            }}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

addPropertyControls(RightSideHoverTOC, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Table of contents",
    },
    containerSelector: {
        type: ControlType.String,
        title: "Container",
        defaultValue: "main",
    },
    headingSelector: {
        type: ControlType.String,
        title: "Headings",
        defaultValue: "h1, h2, h3",
    },
    offset: {
        type: ControlType.Number,
        title: "Scroll Offset",
        defaultValue: 120,
        min: 0,
        max: 500,
        step: 10,
    },
    compact: {
        type: ControlType.Boolean,
        title: "Compact",
        defaultValue: false,
    },
    indicatorPosition: {
        type: ControlType.Enum,
        title: "Indicator",
        options: ["none", "left", "right"],
        optionTitles: ["None", "Left", "Right"],
        defaultValue: "none",
    },
    indicatorWidth: {
        type: ControlType.Number,
        title: "Ind. Width",
        min: 1,
        max: 6,
        step: 1,
        defaultValue: 3,
        hidden: (props) => props.indicatorPosition === "none",
    },
    indicatorRadius: {
        type: ControlType.Number,
        title: "Ind. Radius",
        min: 0,
        max: 999,
        step: 1,
        defaultValue: 999,
        hidden: (props) => props.indicatorPosition === "none",
    },
})
