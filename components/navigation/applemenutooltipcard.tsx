import * as React from "react"
import { startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion } from "framer-motion"

type IconName = "none" | "minus" | "faceid" | "grid" | "share" | "search"

type MenuItem = {
    label: string
    tooltip?: string
    link?: string
    openInNewTab?: boolean
    iconMode: "preset" | "image" | "svg"
    icon: IconName
    iconImage?: { src?: string; srcSet?: string; alt?: string }
    iconSvgPath?: string
    iconSvgPath2?: string
    iconSvgStrokeWidth?: number
    badgeMode?: "none" | "dot" | "text"
    badgeText?: string
    badgeBackground?: string
    badgeTextColor?: string
    destructive: boolean
    separatorBefore: boolean
    paddingX?: number
    paddingY?: number
}

type Props = {
    items: MenuItem[]

    // Tooltip behavior
    interaction: "always" | "hover" | "tap"
    open: boolean

    // Trigger
    useCustomTrigger: boolean
    trigger?: React.ReactNode

    showAnchor: boolean
    anchorLabel: string
    anchorSize: number
    anchorBackground: string
    anchorTextColor: string
    anchorShadow: string
    gap: number

    background: string
    hoverBackground: string
    textColor: string
    iconColor: string
    destructiveColor: string
    separatorColor: string
    radius: number
    padding: number
    itemHeight: number
    iconSize: number
    hoverInsetX: number
    hoverInsetY: number
    shadow: string
    border: { borderWidth?: number; borderStyle?: any; borderColor?: string } | null
    backdropBlur: number
    surfaceOpacity: number

    tooltipBackground: string
    tooltipTextColor: string
    tooltipMaxWidth: number

    hoverScale: number
    tapScale: number
    springStiffness: number
    springDamping: number

    font: any
    style?: React.CSSProperties
}

// Create like this apple style tooltip interaction
// Key Features to Implement:
// Layout: A rounded card with list items, icons, and separators.
// Hover State: Smooth background color change and a subtle scale-up.
// Click (Tap) Effect: The whole card "pops" (scales down and bounces back) using a spring animation.
// Styling: Clean typography, system-like icons, and soft shadows.
// Breakdown of the Animation Logic:
// whileHover: Inside the MenuItem, this property adds a very slight scale increase (1.02) and a faint gray background. This makes the UI feel responsive to the cursor.
// whileTap (Card Level): To achieve that "squishy" Apple feel, we apply a whileTap scale of 0.97 to the entire container. When you click anywhere on the menu, the whole card shrinks slightly and springs back, creating a tactile "pop."
// The Spring Configuration:
// stiffness: 400 makes the movement feel fast and energetic.
// damping: 25 ensures it settles quickly without oscillating too much, which mimics the high-end feel of iOS system animations.
// Typography & Icons: We use a standard sans-serif stack to mimic San Francisco. For icons, I used lucide-react, but you can replace these with custom SVGs for an exact match to Apple's SF Symbols.

/**
 * Apple Menu Tooltip Card
 *
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 240
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AppleMenuTooltipCard(props: Props) {
    const {
        items = [
            { label: "Remove App", iconMode: "preset", icon: "minus", destructive: true, separatorBefore: false },
            { label: "Require Face ID", iconMode: "preset", icon: "faceid", destructive: false, separatorBefore: true },
            { label: "Edit Home Screen", iconMode: "preset", icon: "grid", destructive: false, separatorBefore: false },
            { label: "Share App", iconMode: "preset", icon: "share", destructive: false, separatorBefore: true, badgeMode: "text", badgeText: "New", badgeBackground: "#007AFF", badgeTextColor: "#FFFFFF" },
            { label: "Search", iconMode: "preset", icon: "search", destructive: false, separatorBefore: false, badgeMode: "dot", badgeBackground: "#FF3B30" },
        ],
        interaction = "hover",
        open: openProp = true,
        useCustomTrigger = false,
        trigger,
        showAnchor = true,
        anchorLabel = "F",
        anchorSize = 52,
        anchorBackground = "#FFFFFF",
        anchorTextColor = "#000000",
        anchorShadow = "0 10px 30px rgba(0,0,0,0.18)",
        gap = 18,

        background = "#FFFFFF",
        hoverBackground = "#F5F5F5",
        textColor = "#000000",
        iconColor = "rgba(0,0,0,0.55)",
        destructiveColor = "#FF3B30",
        separatorColor = "rgba(0,0,0,0.08)",
        radius = 16,
        padding = 10,
        itemHeight = 42,
        iconSize = 18,
        hoverInsetX = 6,
        hoverInsetY = 2,
        shadow = "0 10px 30px rgba(0,0,0,0.18)",
        border = null,
        backdropBlur = 16,
        surfaceOpacity = 0.92,

        tooltipBackground = "rgba(0,0,0,0.92)",
        tooltipTextColor = "#FFFFFF",
        tooltipMaxWidth = 220,

        hoverScale = 1.02,
        tapScale = 0.97,
        springStiffness = 400,
        springDamping = 25,

        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const [openState, setOpenState] = React.useState<boolean>(openProp)
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    React.useEffect(() => {
        if (isStatic) return
        startTransition(() => setOpenState(openProp))
    }, [openProp, isStatic])

    const resolvedOpen = isStatic || interaction === "always" ? true : openState

    const setOpen = React.useCallback((next: boolean) => {
        startTransition(() => setOpenState(next))
    }, [])

    const handleToggle = React.useCallback(() => {
        if (interaction !== "tap") return
        setOpen(!openState)
    }, [interaction, openState, setOpen])

    const handleMouseEnter = React.useCallback(() => {
        if (interaction !== "hover") return
        setOpen(true)
    }, [interaction, setOpen])

    const handleMouseLeave = React.useCallback(() => {
        if (interaction !== "hover") return
        setOpen(false)
    }, [interaction, setOpen])

    const handleItemActivate = React.useCallback(() => {
        if (interaction !== "tap") return
        setOpen(false)
    }, [interaction, setOpen])

    const containerTransition = React.useMemo(
        () => ({
            type: "spring" as const,
            stiffness: springStiffness,
            damping: springDamping,
        }),
        [springStiffness, springDamping]
    )

    const cardStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "auto",
            borderRadius: radius,
            background,
            boxShadow: shadow,
            overflow: "visible",
            padding,
            boxSizing: "border-box",
            backdropFilter: `blur(${backdropBlur}px)`,
            WebkitBackdropFilter: `blur(${backdropBlur}px)`,
            opacity: surfaceOpacity,
            ...(border ? border : {}),
        }),
        [radius, background, shadow, padding, border, backdropBlur, surfaceOpacity]
    )

    const shouldShowMenu = resolvedOpen && RenderTarget.current() !== RenderTarget.thumbnail

    const hasCustomTrigger = useCustomTrigger && !!trigger
    const shouldShowTrigger = hasCustomTrigger || showAnchor

    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    const estimatedSeparators = React.useMemo(() => {
        let count = 0
        for (let i = 0; i < items.length; i++) {
            if (items[i]?.separatorBefore && i !== 0) count++
        }
        return count
    }, [items])

    const estimatedMenuHeight = React.useMemo(() => {
        // itemHeight + per-item inset padding + vertical padding + separator lines + separator margins (6px top + 6px bottom)
        const separatorsBlock = estimatedSeparators * (1 + 12)
        const perItem = itemHeight + hoverInsetY * 2
        const base = padding * 2 + items.length * perItem + separatorsBlock
        return Math.max(5, base)
    }, [estimatedSeparators, hoverInsetY, itemHeight, items.length, padding])

    const requiredHeight = React.useMemo(() => {
        // Keep the anchor fixed by reserving the menu space even when the menu is closed.
        const anchorBlock = shouldShowTrigger ? anchorSize : 0
        const menuBlock = RenderTarget.current() !== RenderTarget.thumbnail ? estimatedMenuHeight : 0
        const gapBlock = shouldShowTrigger && menuBlock > 0 ? gap : 0
        return Math.max(5, anchorBlock + gapBlock + menuBlock)
    }, [anchorSize, estimatedMenuHeight, gap, shouldShowTrigger])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: isFixedHeight ? "100%" : `${requiredHeight}px`,
                minWidth: isFixedWidth ? undefined : 5,
                minHeight: 5,
                display: "block",
                ...(style || {}),
            }}
            onMouseEnter={isStatic ? undefined : handleMouseEnter}
            onMouseLeave={isStatic ? undefined : handleMouseLeave}
        >
            <AnimatePresence initial={false}>
                {shouldShowMenu && (
                    <div
                        key="menuWrap"
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: shouldShowTrigger ? anchorSize + gap : 0,
                            display: "flex",
                            justifyContent: "center",
                            pointerEvents: "none",
                        }}
                    >
                        <motion.div
                            key="menu"
                            style={{
                                ...cardStyle,
                                maxWidth: "100%",
                                pointerEvents: "auto",
                            }}
                            initial={isStatic ? false : { opacity: 0, y: 8, scale: 0.98 }}
                            animate={isStatic ? undefined : { opacity: 1, y: 0, scale: 1 }}
                            exit={isStatic ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
                            transition={isStatic ? undefined : containerTransition}
                            whileTap={isStatic ? undefined : { scale: tapScale }}
                            role="menu"
                            aria-label="Menu"
                        >
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {items.map((item, idx) => {
                                    const color = item.destructive ? destructiveColor : textColor
                                    const rightIconColor = item.destructive ? destructiveColor : iconColor

                                    const iconNode =
                                        item.iconMode === "image" && item.iconImage?.src ? (
                                            <img
                                                src={item.iconImage.src}
                                                srcSet={item.iconImage.srcSet}
                                                alt={item.iconImage.alt || ""}
                                                style={{ width: iconSize, height: iconSize, objectFit: "contain", display: "block" }}
                                            />
                                        ) : item.iconMode === "svg" && item.iconSvgPath ? (
                                            <svg
                                                width={iconSize}
                                                height={iconSize}
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke={rightIconColor}
                                                strokeWidth={item.iconSvgStrokeWidth ?? 1.8}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                focusable="false"
                                                aria-hidden="true"
                                            >
                                                <path d={item.iconSvgPath} />
                                                {item.iconSvgPath2 ? <path d={item.iconSvgPath2} /> : null}
                                            </svg>
                                        ) : (
                                            <Icon name={item.icon} size={iconSize} color={rightIconColor} />
                                        )

                                    const itemPaddingX = item.paddingX ?? 10
                                    const itemPaddingY = item.paddingY ?? 0
                                    const hasTooltip = !!item.tooltip

                                    const badgeMode = item.badgeMode || "none"
                                    const badgeBackground = item.badgeBackground || "#007AFF"
                                    const badgeTextColor = item.badgeTextColor || "#FFFFFF"
                                    const shouldShowBadge = badgeMode !== "none" && (badgeMode === "dot" || !!item.badgeText)

                                    return (
                                        <React.Fragment key={`${item.label}-${idx}`}>
                                            {item.separatorBefore && idx !== 0 && (
                                                <div
                                                    aria-hidden="true"
                                                    style={{
                                                        height: 1,
                                                        background: separatorColor,
                                                        margin: `6px ${hoverInsetX}px`,
                                                    }}
                                                />
                                            )}

                                            <div
                                                style={{
                                                    padding: `${hoverInsetY}px ${hoverInsetX}px`,
                                                    boxSizing: "border-box",
                                                    position: "relative",
                                                }}
                                                onMouseEnter={
                                                    isStatic || !hasTooltip
                                                        ? undefined
                                                        : () => {
                                                              startTransition(() => setHoveredIndex(idx))
                                                          }
                                                }
                                                onMouseLeave={
                                                    isStatic || !hasTooltip
                                                        ? undefined
                                                        : () => {
                                                              startTransition(() => setHoveredIndex((current) => (current === idx ? null : current)))
                                                          }
                                                }
                                            >
                                                <AnimatePresence initial={false}>
                                                    {!isStatic && hasTooltip && hoveredIndex === idx && (
                                                        <motion.div
                                                            key="tooltip"
                                                            initial={{ opacity: 0, y: 2, scale: 0.98 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 2, scale: 0.98 }}
                                                            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.4 }}
                                                            style={{
                                                                position: "absolute",
                                                                left: "100%",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                marginLeft: 10,
                                                                zIndex: 10,
                                                                pointerEvents: "none",
                                                                background: tooltipBackground,
                                                                color: tooltipTextColor,
                                                                borderRadius: 10,
                                                                padding: "8px 10px",
                                                                boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                                                                maxWidth: tooltipMaxWidth,
                                                                fontFamily:
                                                                    (font && font.fontFamily) ||
                                                                    'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
                                                                fontSize: 12,
                                                                lineHeight: "1.2em",
                                                                letterSpacing: "-0.01em",
                                                                whiteSpace: "normal",
                                                            }}
                                                            role="tooltip"
                                                        >
                                                            {item.tooltip}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {item.link ? (
                                                    <motion.a
                                                        href={item.link}
                                                        target={item.openInNewTab ? "_blank" : undefined}
                                                        rel={item.openInNewTab ? "noreferrer noopener" : undefined}
                                                        role="menuitem"
                                                        aria-label={item.label}
                                                        aria-describedby={hasTooltip && hoveredIndex === idx ? `tooltip-${idx}` : undefined}
                                                        onClick={isStatic ? undefined : handleItemActivate}
                                                        onFocus={
                                                            isStatic || !hasTooltip
                                                                ? undefined
                                                                : () => {
                                                                      startTransition(() => setHoveredIndex(idx))
                                                                  }
                                                        }
                                                        onBlur={
                                                            isStatic || !hasTooltip
                                                                ? undefined
                                                                : () => {
                                                                      startTransition(() => setHoveredIndex((current) => (current === idx ? null : current)))
                                                                  }
                                                        }
                                                        style={{
                                                            appearance: "none",
                                                            border: "none",
                                                            background: "transparent",
                                                            padding: 0,
                                                            margin: 0,
                                                            width: "100%",
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            borderRadius: 12,
                                                            transformOrigin: "center",
                                                            display: "block",
                                                            textDecoration: "none",
                                                        }}
                                                        whileHover={
                                                            isStatic
                                                                ? undefined
                                                                : {
                                                                      scale: hoverScale,
                                                                      backgroundColor: hoverBackground,
                                                                  }
                                                        }
                                                        transition={
                                                            isStatic
                                                                ? undefined
                                                                : {
                                                                      type: "spring",
                                                                      stiffness: 500,
                                                                      damping: 35,
                                                                      mass: 0.5,
                                                                  }
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                height: itemHeight,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                paddingLeft: itemPaddingX,
                                                                paddingRight: itemPaddingX,
                                                                paddingTop: itemPaddingY,
                                                                paddingBottom: itemPaddingY,
                                                                boxSizing: "border-box",
                                                                gap: 12,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    ...font,
                                                                    color,
                                                                    fontFamily:
                                                                        (font && font.fontFamily) ||
                                                                        'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
                                                                    fontSize: (font && font.fontSize) || 15,
                                                                    lineHeight: (font && font.lineHeight) || "1.2em",
                                                                    letterSpacing: (font && font.letterSpacing) || "-0.01em",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                {item.label}
                                                            </span>

                                                            {shouldShowBadge && (
                                                                <span
                                                                    aria-label={badgeMode === "dot" ? "Notification" : item.badgeText || "Badge"}
                                                                    style={{
                                                                        flex: "0 0 auto",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        height: badgeMode === "dot" ? 8 : 18,
                                                                        minWidth: badgeMode === "dot" ? 8 : 18,
                                                                        padding: badgeMode === "dot" ? 0 : "0 6px",
                                                                        borderRadius: badgeMode === "dot" ? 999 : 999,
                                                                        background: badgeBackground,
                                                                        color: badgeTextColor,
                                                                        fontSize: 11,
                                                                        lineHeight: "18px",
                                                                        letterSpacing: "-0.01em",
                                                                        fontWeight: 600,
                                                                        boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                                                                    }}
                                                                >
                                                                    {badgeMode === "text" ? item.badgeText : null}
                                                                </span>
                                                            )}

                                                            <span
                                                                aria-hidden="true"
                                                                style={{
                                                                    width: iconSize + 6,
                                                                    height: iconSize + 6,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    color: rightIconColor,
                                                                    flex: "0 0 auto",
                                                                }}
                                                            >
                                                                {iconNode}
                                                            </span>
                                                        </div>
                                                    </motion.a>
                                                ) : (
                                                    <motion.button
                                                        type="button"
                                                        role="menuitem"
                                                        aria-label={item.label}
                                                        aria-describedby={hasTooltip && hoveredIndex === idx ? `tooltip-${idx}` : undefined}
                                                        onClick={isStatic ? undefined : handleItemActivate}
                                                        onFocus={
                                                            isStatic || !hasTooltip
                                                                ? undefined
                                                                : () => {
                                                                      startTransition(() => setHoveredIndex(idx))
                                                                  }
                                                        }
                                                        onBlur={
                                                            isStatic || !hasTooltip
                                                                ? undefined
                                                                : () => {
                                                                      startTransition(() => setHoveredIndex((current) => (current === idx ? null : current)))
                                                                  }
                                                        }
                                                        style={{
                                                            appearance: "none",
                                                            border: "none",
                                                            background: "transparent",
                                                            padding: 0,
                                                            margin: 0,
                                                            width: "100%",
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            borderRadius: 12,
                                                            transformOrigin: "center",
                                                        }}
                                                        whileHover={
                                                            isStatic
                                                                ? undefined
                                                                : {
                                                                      scale: hoverScale,
                                                                      backgroundColor: hoverBackground,
                                                                  }
                                                        }
                                                        transition={
                                                            isStatic
                                                                ? undefined
                                                                : {
                                                                      type: "spring",
                                                                      stiffness: 500,
                                                                      damping: 35,
                                                                      mass: 0.5,
                                                                  }
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                height: itemHeight,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                paddingLeft: itemPaddingX,
                                                                paddingRight: itemPaddingX,
                                                                paddingTop: itemPaddingY,
                                                                paddingBottom: itemPaddingY,
                                                                boxSizing: "border-box",
                                                                gap: 12,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    ...font,
                                                                    color,
                                                                    fontFamily:
                                                                        (font && font.fontFamily) ||
                                                                        'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
                                                                    fontSize: (font && font.fontSize) || 15,
                                                                    lineHeight: (font && font.lineHeight) || "1.2em",
                                                                    letterSpacing: (font && font.letterSpacing) || "-0.01em",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                {item.label}
                                                            </span>

                                                            {shouldShowBadge && (
                                                                <span
                                                                    aria-label={badgeMode === "dot" ? "Notification" : item.badgeText || "Badge"}
                                                                    style={{
                                                                        flex: "0 0 auto",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        height: badgeMode === "dot" ? 8 : 18,
                                                                        minWidth: badgeMode === "dot" ? 8 : 18,
                                                                        padding: badgeMode === "dot" ? 0 : "0 6px",
                                                                        borderRadius: 999,
                                                                        background: badgeBackground,
                                                                        color: badgeTextColor,
                                                                        fontSize: 11,
                                                                        lineHeight: "18px",
                                                                        letterSpacing: "-0.01em",
                                                                        fontWeight: 600,
                                                                        boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                                                                    }}
                                                                >
                                                                    {badgeMode === "text" ? item.badgeText : null}
                                                                </span>
                                                            )}

                                                            <span
                                                                aria-hidden="true"
                                                                style={{
                                                                    width: iconSize + 6,
                                                                    height: iconSize + 6,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    color: rightIconColor,
                                                                    flex: "0 0 auto",
                                                                }}
                                                            >
                                                                {iconNode}
                                                            </span>
                                                        </div>
                                                    </motion.button>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {shouldShowTrigger && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    {hasCustomTrigger ? (
                        <div
                            role={interaction === "tap" ? "button" : undefined}
                            tabIndex={interaction === "tap" ? 0 : -1}
                            aria-label={interaction === "tap" ? "Toggle menu" : "Menu trigger"}
                            onClick={isStatic ? undefined : handleToggle}
                            onKeyDown={
                                isStatic || interaction !== "tap"
                                    ? undefined
                                    : (e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault()
                                              handleToggle()
                                          }
                                      }
                            }
                            style={{
                                height: anchorSize,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: interaction === "tap" ? "pointer" : "default",
                                outline: "none",
                            }}
                        >
                            {trigger}
                        </div>
                    ) : (
                        <motion.button
                            type="button"
                            aria-label={interaction === "tap" ? "Toggle menu" : "Menu anchor"}
                            onClick={isStatic ? undefined : handleToggle}
                            style={{
                                width: anchorSize,
                                height: anchorSize,
                                borderRadius: 14,
                                border: "none",
                                background: anchorBackground,
                                boxShadow: anchorShadow,
                                color: anchorTextColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: interaction === "tap" ? "pointer" : "default",
                                position: "relative",
                            }}
                            whileTap={
                                isStatic || interaction !== "tap"
                                    ? undefined
                                    : {
                                          scale: 0.96,
                                      }
                            }
                            transition={
                                isStatic
                                    ? undefined
                                    : {
                                          type: "spring",
                                          stiffness: 500,
                                          damping: 30,
                                          mass: 0.4,
                                      }
                            }
                        >
                            <span
                                style={{
                                    ...font,
                                    fontFamily:
                                        (font && font.fontFamily) ||
                                        'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
                                    fontSize: (font && font.fontSize) || 18,
                                    lineHeight: (font && font.lineHeight) || "1em",
                                    letterSpacing: (font && font.letterSpacing) || "-0.01em",
                                    fontWeight: (font && font.fontWeight) || 600,
                                    userSelect: "none",
                                }}
                            >
                                {anchorLabel}
                            </span>
                        </motion.button>
                    )}
                </div>
            )}
        </div>
    )
}

function Icon(props: { name: IconName; size: number; color: string }) {
    const { name, size, color } = props

    const common: React.SVGProps<SVGSVGElement> = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        focusable: "false",
        "aria-hidden": true,
    }

    if (name === "none") return null

    if (name === "minus") {
        return (
            <svg {...common}>
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 12h7" />
            </svg>
        )
    }

    if (name === "search") {
        return (
            <svg {...common}>
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16.2 16.2 20 20" />
            </svg>
        )
    }

    if (name === "share") {
        return (
            <svg {...common}>
                <path d="M12 3v10" />
                <path d="M8.5 6.5 12 3l3.5 3.5" />
                <path d="M6.5 11.5v6.2c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2v-6.2" />
            </svg>
        )
    }

    if (name === "grid") {
        return (
            <svg {...common}>
                <rect x="5.5" y="5.5" width="5.5" height="5.5" rx="1.3" />
                <rect x="13" y="5.5" width="5.5" height="5.5" rx="1.3" />
                <rect x="5.5" y="13" width="5.5" height="5.5" rx="1.3" />
                <rect x="13" y="13" width="5.5" height="5.5" rx="1.3" />
            </svg>
        )
    }

    // faceid
    return (
        <svg {...common}>
            <path d="M8 6.8h-.6c-1 0-1.8.8-1.8 1.8V9" />
            <path d="M16 6.8h.6c1 0 1.8.8 1.8 1.8V9" />
            <path d="M8 17.2h-.6c-1 0-1.8-.8-1.8-1.8V15" />
            <path d="M16 17.2h.6c1 0 1.8-.8 1.8-1.8V15" />
            <path d="M9 10.5v.8" />
            <path d="M15 10.5v.8" />
            <path d="M9.5 14.5c.6.6 1.5 1 2.5 1s1.9-.4 2.5-1" />
        </svg>
    )
}

addPropertyControls(AppleMenuTooltipCard, {
    interaction: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["always", "hover", "tap"],
        optionTitles: ["Always", "Hover", "Tap"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    open: {
        type: ControlType.Boolean,
        title: "Open",
        defaultValue: true,
        enabledTitle: "Open",
        disabledTitle: "Closed",
        hidden: ({ interaction }) => interaction === "always",
    },
    useCustomTrigger: {
        type: ControlType.Boolean,
        title: "Custom Trigger",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    trigger: {
        type: ControlType.Slot,
        title: "Trigger",
        maxCount: 1,
        hidden: ({ useCustomTrigger }) => !useCustomTrigger,
    },
    showAnchor: {
        type: ControlType.Boolean,
        title: "Anchor",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ useCustomTrigger }) => useCustomTrigger,
    },
    anchorLabel: {
        type: ControlType.String,
        title: "Anchor Label",
        defaultValue: "F",
        hidden: ({ showAnchor, useCustomTrigger }) => !showAnchor || useCustomTrigger,
    },
    anchorSize: {
        type: ControlType.Number,
        title: "Anchor Size",
        defaultValue: 52,
        min: 32,
        max: 90,
        step: 1,
        unit: "px",
    },
    anchorBackground: {
        type: ControlType.Color,
        title: "Anchor BG",
        defaultValue: "#FFFFFF",
        hidden: ({ showAnchor, useCustomTrigger }) => !showAnchor || useCustomTrigger,
    },
    anchorTextColor: {
        type: ControlType.Color,
        title: "Anchor Text",
        defaultValue: "#000000",
        hidden: ({ showAnchor, useCustomTrigger }) => !showAnchor || useCustomTrigger,
    },
    anchorShadow: {
        type: ControlType.BoxShadow,
        title: "Anchor Shadow",
        defaultValue: "0 10px 30px rgba(0,0,0,0.18)",
        hidden: ({ showAnchor, useCustomTrigger }) => !showAnchor || useCustomTrigger,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ showAnchor, useCustomTrigger }) => !showAnchor || useCustomTrigger,
    },

    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Menu Item" },
                tooltip: { type: ControlType.String, title: "Tooltip", defaultValue: "", placeholder: "Optional description…" },
                link: { type: ControlType.Link, title: "Link" },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                    hidden: ({ link }) => !link,
                },
                iconMode: {
                    type: ControlType.Enum,
                    title: "Icon Type",
                    options: ["preset", "image", "svg"],
                    optionTitles: ["Preset", "Image", "SVG"],
                    defaultValue: "preset",
                    displaySegmentedControl: true,
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ["none", "minus", "faceid", "grid", "share", "search"],
                    optionTitles: ["None", "Minus", "Face ID", "Grid", "Share", "Search"],
                    defaultValue: "search",
                    hidden: ({ iconMode }) => iconMode === "image",
                },
                iconImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon Image",
                    hidden: ({ iconMode }) => iconMode !== "image",
                },
                iconSvgPath: {
                    type: ControlType.String,
                    title: "SVG Path 1",
                    defaultValue: "",
                    placeholder: "Paste SVG path d=…",
                    displayTextArea: true,
                    hidden: ({ iconMode }) => iconMode !== "svg",
                },
                iconSvgPath2: {
                    type: ControlType.String,
                    title: "SVG Path 2",
                    defaultValue: "",
                    placeholder: "Optional second path",
                    displayTextArea: true,
                    hidden: ({ iconMode }) => iconMode !== "svg",
                },
                iconSvgStrokeWidth: {
                    type: ControlType.Number,
                    title: "SVG Stroke",
                    defaultValue: 1.8,
                    min: 0.5,
                    max: 4,
                    step: 0.1,
                    hidden: ({ iconMode }) => iconMode !== "svg",
                },
                destructive: {
                    type: ControlType.Boolean,
                    title: "Destructive",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
                separatorBefore: {
                    type: ControlType.Boolean,
                    title: "Separator",
                    defaultValue: false,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
                paddingX: {
                    type: ControlType.Number,
                    title: "Padding X",
                    defaultValue: 10,
                    min: 0,
                    max: 24,
                    step: 1,
                    unit: "px",
                },
                paddingY: {
                    type: ControlType.Number,
                    title: "Padding Y",
                    defaultValue: 0,
                    min: 0,
                    max: 16,
                    step: 1,
                    unit: "px",
                },
                badgeMode: {
                    type: ControlType.Enum,
                    title: "Badge",
                    options: ["none", "dot", "text"],
                    optionTitles: ["None", "Dot", "Text"],
                    defaultValue: "none",
                    displaySegmentedControl: true,
                },
                badgeText: {
                    type: ControlType.String,
                    title: "Badge Text",
                    defaultValue: "New",
                    hidden: ({ badgeMode }) => badgeMode !== "text",
                },
                badgeBackground: {
                    type: ControlType.Color,
                    title: "Badge BG",
                    defaultValue: "#007AFF",
                    hidden: ({ badgeMode }) => !badgeMode || badgeMode === "none",
                },
                badgeTextColor: {
                    type: ControlType.Color,
                    title: "Badge Text",
                    defaultValue: "#FFFFFF",
                    hidden: ({ badgeMode }) => badgeMode !== "text",
                },
            },
        },
        defaultValue: [
            { label: "Remove App", tooltip: "Uninstall and remove from your device", iconMode: "preset", icon: "minus", destructive: true, separatorBefore: false },
            { label: "Require Face ID", tooltip: "Adds Face ID lock to this app", iconMode: "preset", icon: "faceid", destructive: false, separatorBefore: true },
            { label: "Edit Home Screen", tooltip: "Rearrange apps and widgets", iconMode: "preset", icon: "grid", destructive: false, separatorBefore: false },
            { label: "Share App", tooltip: "Send a link to this app", iconMode: "preset", icon: "share", destructive: false, separatorBefore: true, badgeMode: "text", badgeText: "New", badgeBackground: "#007AFF", badgeTextColor: "#FFFFFF" },
            { label: "Search", tooltip: "Search within this menu", iconMode: "preset", icon: "search", destructive: false, separatorBefore: false, badgeMode: "dot", badgeBackground: "#FF3B30" },
        ],
        maxCount: 12,
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
            lineHeight: "1.2em",
        },
    },

    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    surfaceOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.92,
        min: 0.5,
        max: 1,
        step: 0.01,
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 16,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
    },
    hoverBackground: { type: ControlType.Color, title: "Hover BG", defaultValue: "#F5F5F5" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#000000" },
    iconColor: { type: ControlType.Color, title: "Icon", defaultValue: "rgba(0, 0, 0, 0.55)" },
    destructiveColor: { type: ControlType.Color, title: "Destructive", defaultValue: "#FF3B30" },
    separatorColor: { type: ControlType.Color, title: "Separator", defaultValue: "rgba(0, 0, 0, 0.08)" },

    tooltipBackground: {
        type: ControlType.Color,
        title: "Tooltip BG",
        defaultValue: "rgba(0,0,0,0.92)",
    },
    tooltipTextColor: {
        type: ControlType.Color,
        title: "Tooltip Text",
        defaultValue: "#FFFFFF",
    },
    tooltipMaxWidth: {
        type: ControlType.Number,
        title: "Tooltip MaxW",
        defaultValue: 220,
        min: 120,
        max: 420,
        step: 1,
        unit: "px",
    },

    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 40, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 10, min: 0, max: 24, step: 1, unit: "px" },
    itemHeight: { type: ControlType.Number, title: "Item H", defaultValue: 42, min: 32, max: 64, step: 1, unit: "px" },
    iconSize: { type: ControlType.Number, title: "Icon Size", defaultValue: 18, min: 12, max: 28, step: 1, unit: "px" },
    hoverInsetX: {
        type: ControlType.Number,
        title: "Hover Inset X",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    hoverInsetY: {
        type: ControlType.Number,
        title: "Hover Inset Y",
        defaultValue: 2,
        min: 0,
        max: 12,
        step: 1,
        unit: "px",
    },

    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 10px 30px rgba(0,0,0,0.18)",
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        optional: true,
        defaultValue: {
            borderWidth: 0,
            borderStyle: "solid",
            borderColor: "rgba(0,0,0,0.06)",
        },
    },

    hoverScale: { type: ControlType.Number, title: "Hover Scale", defaultValue: 1.02, min: 1, max: 1.08, step: 0.005 },
    tapScale: { type: ControlType.Number, title: "Tap Scale", defaultValue: 0.97, min: 0.9, max: 1, step: 0.005 },
    springStiffness: { type: ControlType.Number, title: "Stiffness", defaultValue: 400, min: 50, max: 1000, step: 10 },
    springDamping: { type: ControlType.Number, title: "Damping", defaultValue: 25, min: 1, max: 80, step: 1 },
})