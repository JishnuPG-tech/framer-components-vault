// Physics-Animated Context Menu with spring stagger, sub-menus, keyboard navigation, and viewport bounds
import { useEffect, useState, useRef, useCallback, useMemo, startTransition, type CSSProperties } from "react"
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

interface MenuItem {
    label: string
    icon?: string
    shortcut?: string
    danger?: boolean
    divider?: boolean
    disabled?: boolean
    children?: MenuItem[]
    onClick?: () => void
    link?: string
}

interface ContextMenuProps {
    items: MenuItem[]
    trigger: "rightClick" | "longPress" | "click"
    animationStyle: "stagger-down" | "radial" | "expand" | "unfold"
    theme: "dark" | "light" | "blur"
    closeOnScroll: boolean
    closeOnOutsideClick: boolean
    onClose?: () => void
    style?: CSSProperties
}

interface MenuPosition {
    x: number
    y: number
}

interface SubMenuState {
    parentIndex: number
    items: MenuItem[]
    position: MenuPosition
}

/**
 * Physics-Animated Context Menu
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ContextMenu(props: ContextMenuProps) {
    const {
        items = [],
        trigger = "rightClick",
        animationStyle = "stagger-down",
        theme = "dark",
        closeOnScroll = true,
        closeOnOutsideClick = true,
        onClose,
    } = props

    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 })
    const [subMenu, setSubMenu] = useState<SubMenuState | null>(null)
    const [focusedIndex, setFocusedIndex] = useState(0)
    const [subFocusedIndex, setSubFocusedIndex] = useState(0)
    
    const triggerRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const subMenuRef = useRef<HTMLDivElement>(null)
    const longPressTimer = useRef<number | null>(null)
    const subMenuTimer = useRef<number | null>(null)
    const mousePathRef = useRef<{ x: number; y: number } | null>(null)

    const themeStyles = useMemo(() => {
        switch (theme) {
            case "light":
                return {
                    bg: "rgba(255, 255, 255, 0.98)",
                    text: "#000000",
                    textSecondary: "#666666",
                    hover: "rgba(0, 0, 0, 0.05)",
                    border: "rgba(0, 0, 0, 0.1)",
                    shadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                }
            case "blur":
                return {
                    bg: "rgba(255, 255, 255, 0.7)",
                    text: "#000000",
                    textSecondary: "#666666",
                    hover: "rgba(0, 0, 0, 0.08)",
                    border: "rgba(0, 0, 0, 0.15)",
                    shadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                    backdrop: "blur(20px)",
                }
            default: // dark
                return {
                    bg: "rgba(30, 30, 30, 0.98)",
                    text: "#FFFFFF",
                    textSecondary: "#999999",
                    hover: "rgba(255, 255, 255, 0.1)",
                    border: "rgba(255, 255, 255, 0.1)",
                    shadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                }
        }
    }, [theme])

    const adjustPositionForViewport = useCallback((x: number, y: number, menuWidth: number, menuHeight: number) => {
        let adjustedX = x
        let adjustedY = y

        const padding = 8
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1000
        const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1000

        // Check right edge
        if (adjustedX + menuWidth + padding > viewportWidth) {
            adjustedX = viewportWidth - menuWidth - padding
        }

        // Check bottom edge
        if (adjustedY + menuHeight + padding > viewportHeight) {
            adjustedY = viewportHeight - menuHeight - padding
        }

        // Ensure not off left edge
        if (adjustedX < padding) {
            adjustedX = padding
        }

        // Ensure not off top edge
        if (adjustedY < padding) {
            adjustedY = padding
        }

        return { x: adjustedX, y: adjustedY }
    }, [])

    const openMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const x = "clientX" in e ? e.clientX : 0
        const y = "clientY" in e ? e.clientY : 0

        startTransition(() => {
            setPosition({ x, y })
            setIsOpen(true)
            setFocusedIndex(0)
            setSubMenu(null)
        })
    }, [])

    const closeMenu = useCallback(() => {
        startTransition(() => {
            setIsOpen(false)
            setSubMenu(null)
            setFocusedIndex(0)
            setSubFocusedIndex(0)
        })
        if (onClose) onClose()
    }, [onClose])

    const handleTriggerInteraction = useCallback((e: React.MouseEvent) => {
        if (trigger === "click") {
            openMenu(e)
        } else if (trigger === "rightClick") {
            e.preventDefault()
            openMenu(e)
        }
    }, [trigger, openMenu])

    const handleLongPressStart = useCallback((e: React.MouseEvent) => {
        if (trigger === "longPress") {
            longPressTimer.current = window.setTimeout(() => {
                openMenu(e)
            }, 500)
        }
    }, [trigger, openMenu])

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }, [])

    const handleItemClick = useCallback((item: MenuItem, e: React.MouseEvent) => {
        e.stopPropagation()
        if (item.disabled) return
        if (item.children && item.children.length > 0) return

        if (item.link) {
            if (typeof window !== "undefined") {
                window.open(item.link, "_blank", "noopener,noreferrer")
            }
        } else if (item.onClick) {
            item.onClick()
        }
        closeMenu()
    }, [closeMenu])

    const handleSubMenuHover = useCallback((item: MenuItem, index: number, e: React.MouseEvent) => {
        if (!item.children || item.children.length === 0 || item.disabled) {
            if (subMenuTimer.current) {
                clearTimeout(subMenuTimer.current)
            }
            setSubMenu(null)
            return
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        mousePathRef.current = { x: e.clientX, y: e.clientY }

        if (subMenuTimer.current) {
            clearTimeout(subMenuTimer.current)
        }

        subMenuTimer.current = window.setTimeout(() => {
            startTransition(() => {
                setSubMenu({
                    parentIndex: index,
                    items: item.children!,
                    position: { x: rect.right + 4, y: rect.top },
                })
                setSubFocusedIndex(0)
            })
        }, 300)
    }, [])

    const isInTriangle = useCallback((mouseX: number, mouseY: number, itemRect: DOMRect, subMenuRect: DOMRect) => {
        const p1 = { x: itemRect.right, y: itemRect.top }
        const p2 = { x: itemRect.right, y: itemRect.bottom }
        const p3 = { x: subMenuRect.left, y: (subMenuRect.top + subMenuRect.bottom) / 2 }

        const sign = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
            return (px - bx) * (ay - by) - (ax - bx) * (py - by)
        }

        const d1 = sign(mouseX, mouseY, p1.x, p1.y, p2.x, p2.y)
        const d2 = sign(mouseX, mouseY, p2.x, p2.y, p3.x, p3.y)
        const d3 = sign(mouseX, mouseY, p3.x, p3.y, p1.x, p1.y)

        const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
        const hasPos = d1 > 0 || d2 > 0 || d3 > 0

        return !(hasNeg && hasPos)
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!subMenu || !menuRef.current || !subMenuRef.current) return

        const menuRect = menuRef.current.getBoundingClientRect()
        const subMenuRect = subMenuRef.current.getBoundingClientRect()
        const itemElements = menuRef.current.querySelectorAll('[data-menu-item]')
        const parentItem = itemElements[subMenu.parentIndex] as HTMLElement

        if (!parentItem) return

        const itemRect = parentItem.getBoundingClientRect()

        if (!isInTriangle(e.clientX, e.clientY, itemRect, subMenuRect)) {
            const isOverMenu = (
                e.clientX >= menuRect.left && e.clientX <= menuRect.right &&
                e.clientY >= menuRect.top && e.clientY <= menuRect.bottom
            )
            const isOverSubMenu = (
                e.clientX >= subMenuRect.left && e.clientX <= subMenuRect.right &&
                e.clientY >= subMenuRect.top && e.clientY <= subMenuRect.bottom
            )

            if (!isOverMenu && !isOverSubMenu) {
                if (subMenuTimer.current) {
                    clearTimeout(subMenuTimer.current)
                }
                subMenuTimer.current = window.setTimeout(() => {
                    setSubMenu(null)
                }, 300)
            }
        }
    }, [subMenu, isInTriangle])

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return

        const currentItems = subMenu ? subMenu.items : items
        const currentIndex = subMenu ? subFocusedIndex : focusedIndex
        const setCurrentIndex = subMenu ? setSubFocusedIndex : setFocusedIndex

        switch (e.key) {
            case "Escape":
                e.preventDefault()
                if (subMenu) {
                    setSubMenu(null)
                } else {
                    closeMenu()
                }
                break
            case "ArrowDown":
                e.preventDefault()
                startTransition(() => {
                    setCurrentIndex((prev) => (prev + 1) % currentItems.length)
                })
                break
            case "ArrowUp":
                e.preventDefault()
                startTransition(() => {
                    setCurrentIndex((prev) => (prev - 1 + currentItems.length) % currentItems.length)
                })
                break
            case "ArrowRight":
                e.preventDefault()
                if (!subMenu) {
                    const item = items[focusedIndex]
                    if (item?.children && item.children.length > 0 && !item.disabled) {
                        const itemElement = menuRef.current?.querySelectorAll('[data-menu-item]')[focusedIndex] as HTMLElement
                        if (itemElement) {
                            const rect = itemElement.getBoundingClientRect()
                            startTransition(() => {
                                setSubMenu({
                                    parentIndex: focusedIndex,
                                    items: item.children!,
                                    position: { x: rect.right + 4, y: rect.top },
                                })
                                setSubFocusedIndex(0)
                            })
                        }
                    }
                }
                break
            case "ArrowLeft":
                e.preventDefault()
                if (subMenu) {
                    setSubMenu(null)
                }
                break
            case "Enter":
                e.preventDefault()
                const selectedItem = currentItems[currentIndex]
                if (selectedItem && !selectedItem.disabled && !selectedItem.divider) {
                    if (selectedItem.children && selectedItem.children.length > 0) {
                        // Open submenu
                        if (!subMenu) {
                            const itemElement = menuRef.current?.querySelectorAll('[data-menu-item]')[currentIndex] as HTMLElement
                            if (itemElement) {
                                const rect = itemElement.getBoundingClientRect()
                                startTransition(() => {
                                    setSubMenu({
                                        parentIndex: currentIndex,
                                        items: selectedItem.children!,
                                        position: { x: rect.right + 4, y: rect.top },
                                    })
                                    setSubFocusedIndex(0)
                                })
                            }
                        }
                    } else {
                        if (selectedItem.onClick) {
                            selectedItem.onClick()
                        }
                        closeMenu()
                    }
                }
                break
            default:
                // First character navigation
                if (e.key.length === 1) {
                    const char = e.key.toLowerCase()
                    const startIndex = currentIndex + 1
                    for (let i = 0; i < currentItems.length; i++) {
                        const index = (startIndex + i) % currentItems.length
                        const item = currentItems[index]
                        if (item.label.toLowerCase().startsWith(char) && !item.disabled && !item.divider) {
                            startTransition(() => {
                                setCurrentIndex(index)
                            })
                            break
                        }
                    }
                }
        }
    }, [isOpen, items, focusedIndex, subMenu, subFocusedIndex, closeMenu])

    // Event listeners
    useEffect(() => {
        if (typeof window === "undefined") return

        const handleContextMenu = (e: MouseEvent) => {
            if (trigger === "rightClick" && triggerRef.current?.contains(e.target as Node)) {
                openMenu(e)
            }
        }

        const handleClick = (e: MouseEvent) => {
            if (closeOnOutsideClick && isOpen) {
                if (
                    menuRef.current && !menuRef.current.contains(e.target as Node) &&
                    (!subMenuRef.current || !subMenuRef.current.contains(e.target as Node))
                ) {
                    closeMenu()
                }
            }
        }

        const handleScroll = () => {
            if (closeOnScroll && isOpen) {
                closeMenu()
            }
        }

        if (trigger === "rightClick") {
            window.addEventListener("contextmenu", handleContextMenu)
        }
        window.addEventListener("click", handleClick)
        window.addEventListener("keydown", handleKeyDown)
        if (closeOnScroll) {
            window.addEventListener("scroll", handleScroll, true)
        }
        if (isOpen) {
            window.addEventListener("mousemove", handleMouseMove)
        }

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu)
            window.removeEventListener("click", handleClick)
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("scroll", handleScroll, true)
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [trigger, isOpen, closeOnScroll, closeOnOutsideClick, openMenu, closeMenu, handleKeyDown, handleMouseMove])

    // Adjust position after menu renders
    useEffect(() => {
        if (isOpen && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            const adjusted = adjustPositionForViewport(position.x, position.y, rect.width, rect.height)
            if (adjusted.x !== position.x || adjusted.y !== position.y) {
                startTransition(() => {
                    setPosition(adjusted)
                })
            }
        }
    }, [isOpen, position, adjustPositionForViewport])

    // Adjust submenu position
    useEffect(() => {
        if (subMenu && subMenuRef.current) {
            const rect = subMenuRef.current.getBoundingClientRect()
            const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1000
            const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1000

            let adjustedX = subMenu.position.x
            let adjustedY = subMenu.position.y

            // Check if submenu exceeds right edge
            if (adjustedX + rect.width > viewportWidth - 8) {
                // Position to the left of parent instead
                if (menuRef.current) {
                    const menuRect = menuRef.current.getBoundingClientRect()
                    adjustedX = menuRect.left - rect.width - 4
                }
            }

            // Check if submenu exceeds bottom edge
            if (adjustedY + rect.height > viewportHeight - 8) {
                adjustedY = viewportHeight - rect.height - 8
            }

            if (adjustedX !== subMenu.position.x || adjustedY !== subMenu.position.y) {
                startTransition(() => {
                    setSubMenu({ ...subMenu, position: { x: adjustedX, y: adjustedY } })
                })
            }
        }
    }, [subMenu])

    const getAnimationVariants = () => {
        switch (animationStyle) {
            case "radial":
                return {
                    container: {
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.03 },
                        },
                    },
                    item: {
                        hidden: { opacity: 0, scale: 0, x: 0, y: 0 },
                        visible: {
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            y: 0,
                            transition: {
                                type: "spring" as const,
                                stiffness: 500,
                                damping: 25,
                            },
                        },
                    },
                }
            case "expand":
                return {
                    container: {
                        hidden: { height: 0, opacity: 0 },
                        visible: {
                            height: "auto",
                            opacity: 1,
                            transition: {
                                height: { type: "spring" as const, stiffness: 500, damping: 30 },
                                opacity: { duration: 0.2 },
                            },
                        },
                    },
                    item: {
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 },
                    },
                }
            case "unfold":
                return {
                    container: {
                        hidden: { scaleY: 0, opacity: 0 },
                        visible: {
                            scaleY: 1,
                            opacity: 1,
                            transition: {
                                type: "spring" as const,
                                stiffness: 500,
                                damping: 30,
                            },
                        },
                    },
                    item: {
                        hidden: { opacity: 0, x: -20 },
                        visible: {
                            opacity: 1,
                            x: 0,
                            transition: {
                                type: "spring" as const,
                                stiffness: 500,
                                damping: 25,
                            },
                        },
                    },
                }
            default: // stagger-down
                return {
                    container: {
                        hidden: { opacity: 0, y: -8 },
                        visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                type: "spring" as const,
                                stiffness: 500,
                                damping: 25,
                                staggerChildren: 0.03,
                            },
                        },
                    },
                    item: {
                        hidden: { opacity: 0, y: -8 },
                        visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                type: "spring" as const,
                                stiffness: 500,
                                damping: 25,
                            },
                        },
                    },
                }
        }
    }

    const variants = getAnimationVariants()

    const renderMenuItem = (item: MenuItem, index: number, isSubMenuItem = false) => {
        if (item.divider) {
            return (
                <motion.div
                    key={`divider-${index}`}
                    variants={variants.item}
                    style={{
                        height: 1,
                        backgroundColor: themeStyles.border,
                        margin: "4px 0",
                    }}
                />
            )
        }

        const isFocused = isSubMenuItem ? index === subFocusedIndex : index === focusedIndex
        const hasChildren = item.children && item.children.length > 0

        return (
            <motion.div
                key={`item-${index}`}
                data-menu-item
                variants={variants.item}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    backgroundColor: isFocused && !item.disabled ? themeStyles.hover : "transparent",
                    borderRadius: 6,
                    opacity: item.disabled ? 0.4 : 1,
                    transition: "background-color 0.15s ease",
                    gap: 12,
                }}
                onClick={(e) => handleItemClick(item, e)}
                onMouseEnter={(e) => {
                    if (!isSubMenuItem) {
                        startTransition(() => setFocusedIndex(index))
                        handleSubMenuHover(item, index, e)
                    } else {
                        startTransition(() => setSubFocusedIndex(index))
                    }
                }}
                whileHover={!item.disabled ? { scale: 1.02 } : {}}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    {item.icon && (
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    )}
                    <span
                        style={{
                            color: item.danger ? "#FF5555" : themeStyles.text,
                            fontSize: 14,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {item.label}
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {item.shortcut && (
                        <span
                            style={{
                                color: themeStyles.textSecondary,
                                fontSize: 12,
                                fontWeight: 500,
                            }}
                        >
                            {item.shortcut}
                        </span>
                    )}
                    {hasChildren && (
                        <span style={{ color: themeStyles.textSecondary, fontSize: 12 }}>›</span>
                    )}
                </div>
            </motion.div>
        )
    }

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div
                ref={triggerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: themeStyles.bg,
                    borderRadius: 8,
                    border: `1px solid ${themeStyles.border}`,
                    cursor: "pointer",
                    userSelect: "none",
                }}
                onClick={handleTriggerInteraction}
                onContextMenu={trigger === "rightClick" ? handleTriggerInteraction : undefined}
                onMouseDown={handleLongPressStart}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
            >
                <span style={{ color: themeStyles.text, fontSize: 14, fontWeight: 500 }}>
                    {trigger === "rightClick" ? "Right Click Me" : trigger === "longPress" ? "Long Press Me" : "Click Me"}
                </span>
            </div>

            <AnimatePresence>
                {isOpen && typeof window !== "undefined" && (
                    <motion.div
                        ref={menuRef}
                        variants={variants.container}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        style={{
                            position: "fixed",
                            left: position.x,
                            top: position.y,
                            backgroundColor: themeStyles.bg,
                            borderRadius: 8,
                            border: `1px solid ${themeStyles.border}`,
                            boxShadow: themeStyles.shadow,
                            padding: 4,
                            minWidth: 200,
                            maxWidth: 300,
                            zIndex: 10000,
                            ...(theme === "blur" && { backdropFilter: themeStyles.backdrop }),
                            ...(animationStyle === "unfold" && { transformOrigin: "top" }),
                            overflow: animationStyle === "expand" ? "hidden" : "visible",
                        }}
                    >
                        {items.map((item, index) => renderMenuItem(item, index, false))}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {subMenu && typeof window !== "undefined" && (
                    <motion.div
                        ref={subMenuRef}
                        variants={variants.container}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        style={{
                            position: "fixed",
                            left: subMenu.position.x,
                            top: subMenu.position.y,
                            backgroundColor: themeStyles.bg,
                            borderRadius: 8,
                            border: `1px solid ${themeStyles.border}`,
                            boxShadow: themeStyles.shadow,
                            padding: 4,
                            minWidth: 200,
                            maxWidth: 300,
                            zIndex: 10001,
                            ...(theme === "blur" && { backdropFilter: themeStyles.backdrop }),
                            ...(animationStyle === "unfold" && { transformOrigin: "top" }),
                            overflow: animationStyle === "expand" ? "hidden" : "visible",
                        }}
                    >
                        {subMenu.items.map((item, index) => renderMenuItem(item, index, true))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(ContextMenu, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Menu Item",
                },
                icon: {
                    type: ControlType.String,
                    title: "Icon",
                    defaultValue: "📄",
                },
                shortcut: {
                    type: ControlType.String,
                    title: "Shortcut",
                    defaultValue: "",
                },
                danger: {
                    type: ControlType.Boolean,
                    title: "Danger",
                    defaultValue: false,
                },
                divider: {
                    type: ControlType.Boolean,
                    title: "Divider",
                    defaultValue: false,
                },
                disabled: {
                    type: ControlType.Boolean,
                    title: "Disabled",
                    defaultValue: false,
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            { label: "New File", icon: "📄", shortcut: "⌘N", danger: false, divider: false, disabled: false },
            { label: "Open", icon: "📂", shortcut: "⌘O", danger: false, divider: false, disabled: false },
            { label: "Save", icon: "💾", shortcut: "⌘S", danger: false, divider: false, disabled: false },
            { label: "", icon: "", shortcut: "", danger: false, divider: true, disabled: false },
            { label: "Export", icon: "📤", shortcut: "", danger: false, divider: false, disabled: false },
            { label: "Share", icon: "🔗", shortcut: "", danger: false, divider: false, disabled: false },
            { label: "", icon: "", shortcut: "", danger: false, divider: true, disabled: false },
            { label: "Delete", icon: "🗑️", shortcut: "⌘⌫", danger: true, divider: false, disabled: false },
        ],
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["rightClick", "longPress", "click"],
        optionTitles: ["Right Click", "Long Press", "Click"],
        defaultValue: "rightClick",
        displaySegmentedControl: true,
    },
    animationStyle: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["stagger-down", "radial", "expand", "unfold"],
        optionTitles: ["Stagger Down", "Radial", "Expand", "Unfold"],
        defaultValue: "stagger-down",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light", "blur"],
        optionTitles: ["Dark", "Light", "Blur"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    closeOnScroll: {
        type: ControlType.Boolean,
        title: "Close on Scroll",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    closeOnOutsideClick: {
        type: ControlType.Boolean,
        title: "Close on Outside Click",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
