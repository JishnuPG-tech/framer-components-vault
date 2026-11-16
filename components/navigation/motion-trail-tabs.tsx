import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { LayoutGroup, motion, useReducedMotion } from "framer-motion"

type TabItem = {
    label: string
    link?: string
}

type FontStyle = React.CSSProperties & {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
}

type PopoverElement = HTMLDivElement & {
    showPopover?: () => void
    hidePopover?: () => void
}

export type MotionTrailTabsProps = {
    tabs: TabItem[]
    initialTab: number
    mobileBreakpoint: number
    desktopMaxWidth: number
    navigateOnSelect: boolean
    openLinksInNewTab: boolean
    background: string
    activeBackground: string
    textColor: string
    activeTextColor: string
    trailColor: string
    trailCount: number
    trailWidth: number
    trailSpread: number
    trailGap: number
    trailLength: number
    duration: number
    springBounce: number
    height: number
    radius: number
    padding: number
    gap: number
    mobileButtonSize: number
    mobileRadius: number
    menuWidth: number
    menuGap: number
    shadow: string
    font: FontStyle
    style?: React.CSSProperties
}

const safeTabs = (tabs: TabItem[]) =>
    (tabs || []).filter((tab) => tab && tab.label?.trim()).slice(0, 10)

function useElementWidth(ref: React.RefObject<HTMLElement>, enabled = true) {
    const [width, setWidth] = React.useState(0)

    React.useLayoutEffect(() => {
        if (!enabled) return
        const element = ref.current
        if (!element) return

        const measure = () => setWidth(element.getBoundingClientRect().width)
        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [ref, enabled])

    return width
}

function useViewportWidth(enabled = true) {
    const [width, setWidth] = React.useState(0)

    React.useLayoutEffect(() => {
        if (!enabled) return
        if (typeof window === "undefined") return

        const measure = () => {
            const visualWidth = window.visualViewport?.width
            setWidth(
                visualWidth ||
                    document.documentElement.clientWidth ||
                    window.innerWidth
            )
        }

        measure()
        window.addEventListener("resize", measure)
        window.visualViewport?.addEventListener("resize", measure)

        return () => {
            window.removeEventListener("resize", measure)
            window.visualViewport?.removeEventListener("resize", measure)
        }
    }, [enabled])

    return width
}

function Trail({
    distance,
    direction,
    horizontal,
    color,
    count,
    width,
    spread,
    duration,
    reducedMotion,
    eventId,
    trailGap,
}: {
    distance: number
    direction: 1 | -1
    horizontal: boolean
    color: string
    count: number
    width: number
    spread: number
    duration: number
    reducedMotion: boolean
    eventId: number
    trailGap: number
}) {
    if (distance <= 0 || reducedMotion) return null

    const trailLength = Math.max(1, distance)
    const crossSize = 100
    const viewBox = horizontal
        ? `0 0 ${trailLength} ${crossSize}`
        : `0 0 ${crossSize} ${trailLength}`
    const roundedCount = Math.max(1, Math.round(count))

    const position: React.CSSProperties = horizontal
        ? {
              top: 0,
              width: trailLength,
              height: "100%",
              ...(direction > 0
                  ? { right: `calc(100% + ${trailGap}px)` }
                  : { left: `calc(100% + ${trailGap}px)` }),
          }
        : {
              left: 0,
              width: "100%",
              height: trailLength,
              ...(direction > 0
                  ? { bottom: `calc(100% + ${trailGap}px)` }
                  : { top: `calc(100% + ${trailGap}px)` }),
          }

    return (
        <motion.svg
            key={eventId}
            viewBox={viewBox}
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{
                position: "absolute",
                ...position,
                overflow: "visible",
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            {Array.from({ length: roundedCount }).map((_, index) => {
                const centeredIndex = index - (roundedCount - 1) / 2
                const cross = 50 + centeredIndex * spread
                const lengthRatio =
                    index === 0 ? 1 : Math.max(0.28, 0.58 - (index - 1) * 0.12)
                const path = horizontal
                    ? direction > 0
                        ? `M ${trailLength} ${cross} L ${trailLength * (1 - lengthRatio)} ${cross}`
                        : `M 0 ${cross} L ${trailLength * lengthRatio} ${cross}`
                    : direction > 0
                      ? `M ${cross} ${trailLength} L ${cross} ${trailLength * (1 - lengthRatio)}`
                      : `M ${cross} 0 L ${cross} ${trailLength * lengthRatio}`

                return (
                    <motion.path
                        key={index}
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth={width}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0, pathOffset: 0, opacity: 1 }}
                        animate={{
                            pathLength: [0, 1, 0],
                            pathOffset: 0,
                            opacity: [1, 1, 0],
                        }}
                        transition={{
                            delay: index * 0.025,
                            pathLength: {
                                duration: Math.max(0.25, duration * 1.18),
                                times: [0, 0.36, 1],
                                ease: [0.22, 1, 0.36, 1],
                            },
                            opacity: {
                                duration: Math.max(0.25, duration * 1.18),
                                times: [0, 0.88, 1],
                                ease: "easeOut",
                            },
                        }}
                    />
                )
            })}
        </motion.svg>
    )
}

function useSelection(initialTab: number, length: number) {
    const clampedInitial = Math.min(
        Math.max(0, Math.round(initialTab)),
        Math.max(0, length - 1)
    )
    const [active, setActive] = React.useState(clampedInitial)
    const [previous, setPrevious] = React.useState(clampedInitial)
    const [eventId, setEventId] = React.useState(0)

    React.useEffect(() => {
        setActive(clampedInitial)
        setPrevious(clampedInitial)
    }, [clampedInitial])

    React.useEffect(() => {
        if (active >= length) {
            setActive(Math.max(0, length - 1))
            setPrevious(Math.max(0, length - 1))
        }
    }, [active, length])

    const select = React.useCallback(
        (next: number) => {
            if (next === active) return false
            setPrevious(active)
            setActive(next)
            setEventId((value) => value + 1)
            return true
        },
        [active]
    )

    return { active, previous, eventId, select }
}

function goToLink(
    tab: TabItem,
    navigate: boolean,
    newTab: boolean,
    delay: number
) {
    if (
        !navigate ||
        !tab.link ||
        typeof window === "undefined" ||
        RenderTarget.current() === RenderTarget.canvas
    )
        return
    window.setTimeout(
        () => {
            if (newTab) window.open(tab.link, "_blank", "noopener,noreferrer")
            else window.location.assign(tab.link)
        },
        Math.max(0, delay * 1000)
    )
}

/**
 * Floating pill navigation with distance-aware SVG motion trails.
 * Desktop trails travel horizontally; mobile uses a stable, non-animated pop-up menu.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 56
 */
export default function MotionTrailTabs(props: MotionTrailTabsProps) {
    const isStaticRenderer = useIsStaticRenderer()
    const {
        tabs: rawTabs,
        initialTab,
        mobileBreakpoint,
        desktopMaxWidth,
        navigateOnSelect,
        openLinksInNewTab,
        background,
        activeBackground,
        textColor,
        activeTextColor,
        trailColor,
        trailCount,
        trailWidth,
        trailSpread,
        trailGap,
        trailLength,
        duration,
        springBounce,
        height,
        radius,
        padding,
        gap,
        mobileButtonSize,
        mobileRadius,
        menuWidth,
        menuGap,
        shadow,
        font,
        style,
    } = props

    const tabs = React.useMemo(() => safeTabs(rawTabs), [rawTabs])
    const rootRef = React.useRef<HTMLDivElement>(null)
    const desktopRef = React.useRef<HTMLDivElement>(null)
    const mobileButtonRef = React.useRef<HTMLButtonElement>(null)
    const mobileMenuRef = React.useRef<PopoverElement>(null)
    // Static rendering is used by the Framer canvas and export pipeline. Avoid
    // observers and viewport listeners there; the fallback below is pure markup.
    const rootWidth = useElementWidth(rootRef, !isStaticRenderer)
    const desktopWidth = useElementWidth(desktopRef, !isStaticRenderer)
    const viewportWidth = useViewportWidth(!isStaticRenderer)
    const layoutGroupId = React.useId()
    const reducedMotion = useReducedMotion() ?? false
    const motionDisabled = reducedMotion || isStaticRenderer
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [menuPosition, setMenuPosition] = React.useState<{
        top: number
        left: number
        width: number
    } | null>(null)
    const { active, previous, eventId, select } = useSelection(
        initialTab,
        tabs.length
    )
    const [isAnimating, setIsAnimating] = React.useState(false)
    const [animationTarget, setAnimationTarget] = React.useState(active)
    const animationTimer = React.useRef<number | null>(null)
    const resolvedBreakpoint = Number.isFinite(mobileBreakpoint)
        ? mobileBreakpoint
        : 420
    const resolvedDesktopMaxWidth = Number.isFinite(desktopMaxWidth)
        ? desktopMaxWidth
        : 500
    const isMobile =
        (rootWidth > 0 && rootWidth <= resolvedBreakpoint) ||
        (viewportWidth > 0 && viewportWidth <= resolvedBreakpoint)

    const measuredDesktopWidth =
        desktopWidth > 0 ? desktopWidth : resolvedDesktopMaxWidth
    const itemWidth =
        tabs.length > 0
            ? (measuredDesktopWidth - padding * 2 - gap * (tabs.length - 1)) /
              tabs.length
            : 0
    const desktopStep = itemWidth + gap
    // Mobile sizing is intentionally independent from the desktop bar controls.
    const mobileRowHeight = 48
    const mobileMenuPadding = 8
    const mobileMenuGap = 4
    const resolvedMenuWidth = Math.max(
        160,
        Number.isFinite(menuWidth) ? menuWidth : 220,
        Number.isFinite(mobileButtonSize) ? mobileButtonSize : 52
    )
    const resolvedMenuGap = Number.isFinite(menuGap) ? Math.max(0, menuGap) : 10
    const mobileMenuHeight =
        mobileMenuPadding * 2 +
        tabs.length * mobileRowHeight +
        Math.max(0, tabs.length - 1) * mobileMenuGap
    const resolvedRadius = Number.isFinite(radius)
        ? Math.max(0, Math.min(80, radius))
        : 80
    const resolvedMobileRadius = Number.isFinite(mobileRadius)
        ? Math.max(0, Math.min(80, mobileRadius))
        : 14
    const desktopDistance =
        Math.abs(active - previous) * desktopStep * trailLength
    const trailDirection: 1 | -1 = active >= previous ? 1 : -1
    const spring = motionDisabled
        ? { duration: 0 }
        : { type: "spring" as const, duration, bounce: springBounce }

    const positionMenuFromButton = React.useCallback(
        (button: HTMLButtonElement) => {
            const ownerWindow = button.ownerDocument.defaultView
            if (!ownerWindow) return

            const rect = button.getBoundingClientRect()
            const viewportPadding = 12
            const currentViewportWidth =
                ownerWindow.visualViewport?.width || ownerWindow.innerWidth
            const currentViewportHeight =
                ownerWindow.visualViewport?.height || ownerWindow.innerHeight
            const width = Math.min(
                resolvedMenuWidth,
                currentViewportWidth - viewportPadding * 2
            )
            const left = Math.min(
                Math.max(viewportPadding, rect.right - width),
                currentViewportWidth - width - viewportPadding
            )
            const below = rect.bottom + resolvedMenuGap
            const above = rect.top - resolvedMenuGap - mobileMenuHeight
            const top =
                below + mobileMenuHeight <=
                currentViewportHeight - viewportPadding
                    ? below
                    : Math.max(viewportPadding, above)

            setMenuPosition({ top, left, width })
        },
        [resolvedMenuWidth, mobileMenuHeight, resolvedMenuGap]
    )

    React.useEffect(() => {
        if (isStaticRenderer) return
        return () => {
            if (animationTimer.current !== null)
                window.clearTimeout(animationTimer.current)
        }
    }, [isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer) return
        if (!isAnimating) setAnimationTarget(active)
    }, [active, isAnimating, isStaticRenderer])

    React.useLayoutEffect(() => {
        if (isStaticRenderer) return
        if (!isMobile || !menuOpen) {
            setMenuPosition(null)
            return
        }

        const positionMenu = () => {
            const button = mobileButtonRef.current
            if (button) positionMenuFromButton(button)
        }

        positionMenu()
        const ownerWindow = mobileButtonRef.current?.ownerDocument.defaultView
        ownerWindow?.addEventListener("resize", positionMenu)
        ownerWindow?.addEventListener("scroll", positionMenu, true)
        ownerWindow?.visualViewport?.addEventListener("resize", positionMenu)

        return () => {
            ownerWindow?.removeEventListener("resize", positionMenu)
            ownerWindow?.removeEventListener("scroll", positionMenu, true)
            ownerWindow?.visualViewport?.removeEventListener(
                "resize",
                positionMenu
            )
        }
    }, [isMobile, isStaticRenderer, menuOpen, positionMenuFromButton])

    React.useLayoutEffect(() => {
        if (isStaticRenderer) return
        const menu = mobileMenuRef.current
        if (!menu) return

        try {
            const isOpen = menu.matches(":popover-open")
            if (menuOpen && !isOpen) menu.showPopover?.()
            if (!menuOpen && isOpen) menu.hidePopover?.()
        } catch {
            // Older preview engines still receive the inline fallback below.
        }
    }, [menuOpen, menuPosition, isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer) return
        if (!menuOpen) return
        const ownerDocument = mobileButtonRef.current?.ownerDocument
        if (!ownerDocument) return

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false)
        }
        const closeOutside = (event: PointerEvent) => {
            const target = event.target as Node
            if (mobileButtonRef.current?.contains(target)) return
            const menu = ownerDocument.querySelector(
                `[data-motion-trail-menu="${layoutGroupId}"]`
            )
            if (menu?.contains(target)) return
            setMenuOpen(false)
        }

        ownerDocument.addEventListener("keydown", closeOnEscape)
        ownerDocument.addEventListener("pointerdown", closeOutside)
        return () => {
            ownerDocument.removeEventListener("keydown", closeOnEscape)
            ownerDocument.removeEventListener("pointerdown", closeOutside)
        }
    }, [menuOpen, layoutGroupId, isStaticRenderer])

    const handleSelect = (index: number) => {
        const changed = select(index)
        if (isMobile && !changed) {
            setMenuOpen(false)
            goToLink(tabs[index], navigateOnSelect, openLinksInNewTab, 0)
            return
        }
        if (changed) {
            if (isMobile) {
                if (animationTimer.current !== null)
                    window.clearTimeout(animationTimer.current)
                setIsAnimating(false)
                setAnimationTarget(index)
                setMenuOpen(false)
                goToLink(tabs[index], navigateOnSelect, openLinksInNewTab, 0)
                return
            }

            if (animationTimer.current !== null)
                window.clearTimeout(animationTimer.current)

            const trailDurationMs = motionDisabled
                ? 0
                : Math.max(250, duration * 1180) +
                  Math.max(0, Math.round(trailCount) - 1) * 25
            const fadeInMs = motionDisabled ? 0 : Math.min(350, duration * 450)

            setAnimationTarget(index)
            setIsAnimating(!motionDisabled)
            animationTimer.current = window.setTimeout(() => {
                setIsAnimating(false)
                animationTimer.current = null
            }, trailDurationMs)

            goToLink(
                tabs[index],
                navigateOnSelect,
                openLinksInNewTab,
                trailDurationMs / 1000 + fadeInMs / 1000
            )
        }
    }

    if (tabs.length === 0) {
        return (
            <div
                ref={rootRef}
                style={{
                    ...style,
                    display: "grid",
                    placeItems: "center",
                    minWidth: 120,
                    minHeight: 48,
                    color: textColor,
                    ...font,
                }}
            >
                Add at least one tab
            </div>
        )
    }

    // Framer canvas/export fallback: no Framer Motion nodes, SVG trails,
    // timers, popovers, observers, or continuously running visual effects.
    if (isStaticRenderer) {
        return (
            <div
                ref={rootRef}
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minWidth: 1,
                    minHeight: height,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    overflow: "visible",
                    ...font,
                }}
            >
                <div
                    role="tablist"
                    aria-label="Product categories"
                    style={{
                        position: "relative",
                        width: `min(100%, ${resolvedDesktopMaxWidth}px)`,
                        height,
                        padding,
                        display: "grid",
                        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                        gap,
                        borderRadius: resolvedRadius,
                        background,
                        boxSizing: "border-box",
                        boxShadow: shadow,
                        overflow: "hidden",
                    }}
                >
                    {tabs.map((tab, index) => (
                        <div
                            key={`${tab.label}-${index}`}
                            role="tab"
                            aria-selected={index === active}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                minWidth: 0,
                                height: "100%",
                                display: "grid",
                                placeItems: "center",
                                borderRadius: Math.max(
                                    0,
                                    resolvedRadius - padding
                                ),
                                background:
                                    index === active
                                        ? activeBackground
                                        : "transparent",
                                color:
                                    index === active
                                        ? activeTextColor
                                        : textColor,
                                whiteSpace: "nowrap",
                                padding: "0 12px",
                                boxSizing: "border-box",
                                overflow: "hidden",
                            }}
                        >
                            <span
                                style={{
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {tab.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 1,
                minHeight: mobileButtonSize,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                overflow: "visible",
                ...font,
            }}
        >
            {!isMobile ? (
                <LayoutGroup id={layoutGroupId}>
                    <div
                        ref={desktopRef}
                        role="tablist"
                        aria-label="Product categories"
                        style={{
                            position: "relative",
                            width: `min(100%, ${resolvedDesktopMaxWidth}px)`,
                            height,
                            padding,
                            display: "grid",
                            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                            gap,
                            borderRadius: resolvedRadius,
                            background,
                            boxSizing: "border-box",
                            boxShadow: shadow,
                            isolation: "isolate",
                        }}
                    >
                        {tabs.map((tab, index) => (
                            <motion.button
                                key={`${tab.label}-${index}`}
                                type="button"
                                role="tab"
                                aria-selected={index === active}
                                onClick={() => handleSelect(index)}
                                initial={false}
                                animate={{
                                    opacity:
                                        isAnimating && index !== animationTarget
                                            ? 0.3
                                            : 1,
                                }}
                                transition={{
                                    duration: isAnimating
                                        ? 0.06
                                        : Math.min(0.35, duration * 0.45),
                                    ease: "easeOut",
                                }}
                                style={{
                                    position: "relative",
                                    zIndex: 3,
                                    minWidth: 0,
                                    border: 0,
                                    borderRadius: Math.max(
                                        0,
                                        resolvedRadius - padding
                                    ),
                                    background: "transparent",
                                    color:
                                        index === active
                                            ? activeTextColor
                                            : textColor,
                                    cursor: "pointer",
                                    pointerEvents:
                                        isAnimating && index !== animationTarget
                                            ? "none"
                                            : "auto",
                                    whiteSpace: "nowrap",
                                    padding: "0 12px",
                                    font: "inherit",
                                    overflow: "visible",
                                    transition: motionDisabled
                                        ? "none"
                                        : `color ${duration * 0.45}s ease`,
                                }}
                            >
                                {index === active && (
                                    <motion.div
                                        layoutId="active-pill"
                                        aria-hidden="true"
                                        initial={false}
                                        transition={spring}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: Math.max(
                                                0,
                                                resolvedRadius - padding
                                            ),
                                            background: activeBackground,
                                            zIndex: 0,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <Trail
                                            distance={desktopDistance}
                                            direction={trailDirection}
                                            horizontal
                                            color={trailColor}
                                            count={trailCount}
                                            width={trailWidth}
                                            spread={trailSpread}
                                            duration={duration}
                                            reducedMotion={motionDisabled}
                                            eventId={eventId}
                                            trailGap={trailGap}
                                        />
                                    </motion.div>
                                )}
                                <span
                                    style={{ position: "relative", zIndex: 1 }}
                                >
                                    {tab.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </LayoutGroup>
            ) : (
                <div
                    style={{
                        position: "relative",
                        width: mobileButtonSize,
                        height: mobileButtonSize,
                        minWidth: mobileButtonSize,
                        minHeight: mobileButtonSize,
                        overflow: "visible",
                        isolation: "isolate",
                    }}
                >
                    <button
                        ref={mobileButtonRef}
                        type="button"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        onClick={(event) => {
                            if (menuOpen) {
                                setMenuOpen(false)
                                return
                            }
                            positionMenuFromButton(event.currentTarget)
                            setMenuOpen(true)
                        }}
                        style={{
                            position: "relative",
                            zIndex: 12,
                            width: mobileButtonSize,
                            height: mobileButtonSize,
                            display: "grid",
                            placeItems: "center",
                            border: 0,
                            borderRadius: resolvedMobileRadius,
                            background,
                            boxShadow: shadow,
                            color: textColor,
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        <span
                            style={{
                                position: "relative",
                                display: "block",
                                width: mobileButtonSize * 0.38,
                                height: 12,
                            }}
                        >
                            <span
                                style={{
                                    position: "absolute",
                                    top: menuOpen ? 5 : 0,
                                    left: 0,
                                    width: "100%",
                                    height: 2,
                                    borderRadius: 99,
                                    background: "currentColor",
                                    transform: menuOpen
                                        ? "rotate(45deg)"
                                        : "none",
                                    transformOrigin: "center",
                                }}
                            />
                            <span
                                style={{
                                    position: "absolute",
                                    bottom: menuOpen ? 5 : 0,
                                    left: 0,
                                    width: "100%",
                                    height: 2,
                                    borderRadius: 99,
                                    background: "currentColor",
                                    transform: menuOpen
                                        ? "rotate(-45deg)"
                                        : "none",
                                    transformOrigin: "center",
                                }}
                            />
                        </span>
                    </button>

                    <div
                        ref={mobileMenuRef}
                        {...({ popover: "manual" } as any)}
                        data-motion-trail-menu={layoutGroupId}
                        role="menu"
                        aria-label="Product categories"
                        style={{
                            position: "fixed",
                            inset: "auto",
                            top: menuPosition?.top ?? 12,
                            left: menuPosition?.left ?? 12,
                            width: menuPosition?.width ?? resolvedMenuWidth,
                            height: mobileMenuHeight,
                            minHeight: mobileMenuHeight,
                            maxHeight: "calc(100vh - 24px)",
                            margin: 0,
                            padding: mobileMenuPadding,
                            border: 0,
                            display: menuOpen ? "grid" : "none",
                            gridTemplateRows: `repeat(${tabs.length}, ${mobileRowHeight}px)`,
                            alignContent: "start",
                            gap: mobileMenuGap,
                            borderRadius: resolvedMobileRadius,
                            background,
                            boxShadow: shadow,
                            boxSizing: "border-box",
                            overflowX: "hidden",
                            overflowY: "auto",
                            color: textColor,
                            ...font,
                        }}
                    >
                        {tabs.map((tab, index) => (
                            <button
                                key={`${tab.label}-${index}`}
                                type="button"
                                role="menuitem"
                                onClick={() => handleSelect(index)}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: mobileRowHeight,
                                    minHeight: mobileRowHeight,
                                    border: 0,
                                    borderRadius: Math.max(
                                        4,
                                        resolvedMobileRadius - 4
                                    ),
                                    background:
                                        index === active
                                            ? activeBackground
                                            : "transparent",
                                    color:
                                        index === active
                                            ? activeTextColor
                                            : textColor,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    whiteSpace: "nowrap",
                                    padding: "0 18px",
                                    font: "inherit",
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export const defaultProps: MotionTrailTabsProps = {
    tabs: [
        { label: "All heroes", link: "" },
        { label: "Supermen", link: "" },
        { label: "Spidermen", link: "" },
        { label: "Cat women", link: "" },
        { label: "Black widows", link: "" },
    ],
    initialTab: 0,
    mobileBreakpoint: 420,
    desktopMaxWidth: 500,
    navigateOnSelect: true,
    openLinksInNewTab: false,
    background: "#ECECF1",
    activeBackground: "#18181B",
    textColor: "#111114",
    activeTextColor: "#FFFFFF",
    trailColor: "#18181B",
    trailCount: 2,
    trailWidth: 7,
    trailSpread: 22,
    trailGap: 9,
    trailLength: 0.5,
    duration: 0.62,
    springBounce: 0.18,
    height: 56,
    radius: 80,
    padding: 5,
    gap: 2,
    mobileButtonSize: 52,
    mobileRadius: 14,
    menuWidth: 220,
    menuGap: 10,
    shadow: "0 10px 32px rgba(0, 0, 0, 0.08)",
    font: {
        fontFamily: "Inter, sans-serif",
        fontSize: 16,
        fontWeight: 500,
        lineHeight: "1em",
        letterSpacing: "-0.01em",
    },
}

MotionTrailTabs.defaultProps = defaultProps

export const propertyControls = {
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Tab",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: defaultProps.tabs,
    },
    initialTab: {
        type: ControlType.Number,
        title: "Selected",
        min: 0,
        max: 9,
        step: 1,
        defaultValue: defaultProps.initialTab,
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: defaultProps.font,
    },
    background: {
        type: ControlType.Color,
        title: "Bar",
        defaultValue: defaultProps.background,
    },
    activeBackground: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: defaultProps.activeBackground,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: defaultProps.textColor,
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text",
        defaultValue: defaultProps.activeTextColor,
    },
    trailColor: {
        type: ControlType.Color,
        title: "Trail",
        defaultValue: defaultProps.trailColor,
    },
    trailCount: {
        type: ControlType.Number,
        title: "Trail Lines",
        min: 1,
        max: 4,
        step: 1,
        defaultValue: defaultProps.trailCount,
    },
    trailWidth: {
        type: ControlType.Number,
        title: "Trail Width",
        min: 1,
        max: 16,
        step: 0.5,
        defaultValue: defaultProps.trailWidth,
    },
    trailSpread: {
        type: ControlType.Number,
        title: "Trail Spread",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: defaultProps.trailSpread,
    },
    trailGap: {
        type: ControlType.Number,
        title: "Trail Gap",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.trailGap,
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        min: 0.2,
        max: 1,
        step: 0.05,
        defaultValue: defaultProps.trailLength,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: defaultProps.duration,
    },
    springBounce: {
        type: ControlType.Number,
        title: "Bounce",
        min: 0,
        max: 0.8,
        step: 0.01,
        defaultValue: defaultProps.springBounce,
    },
    height: {
        type: ControlType.Number,
        title: "Item Height",
        min: 36,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.height,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.radius,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.padding,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.gap,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile At",
        min: 240,
        max: 900,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.mobileBreakpoint,
    },
    desktopMaxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        min: 240,
        max: 1200,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.desktopMaxWidth,
    },
    mobileButtonSize: {
        type: ControlType.Number,
        title: "Menu Button",
        min: 40,
        max: 90,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.mobileButtonSize,
    },
    mobileRadius: {
        type: ControlType.Number,
        title: "Mobile Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.mobileRadius,
    },
    menuWidth: {
        type: ControlType.Number,
        title: "Menu Width",
        min: 160,
        max: 420,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.menuWidth,
    },
    menuGap: {
        type: ControlType.Number,
        title: "Menu Gap",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: defaultProps.menuGap,
    },
    shadow: {
        type: ControlType.String,
        title: "Shadow",
        defaultValue: defaultProps.shadow,
    },
    navigateOnSelect: {
        type: ControlType.Boolean,
        title: "Use Links",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: defaultProps.navigateOnSelect,
    },
    openLinksInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: defaultProps.openLinksInNewTab,
        hidden: (props: MotionTrailTabsProps) => !props.navigateOnSelect,
    },
}

addPropertyControls(MotionTrailTabs, propertyControls as any)
