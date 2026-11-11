/**
 * Flow Reveal Rows
 * ─────────────────────────────────────────────────────────────
 * Marketplace-ready Framer component.
 *
 * Controls (only these):
 * · Rows        – one array control; each item has Title, Image
 *                 (upload), Link, New Tab. Numbers are automatic.
 * · Layout      – padding, C-Radius, image radius, gap, image height,
 *                 image min height (mobile), rows max width
 * · Font + Rows – title font, number font, row height, row spacing,
 *                 row padding, icon size
 * · Colors
 * · Auto Speed  – seconds per row (0 = autoplay off). Default 1.2
 *
 * Behaviour:
 * · Default variant is Desktop (1200 × 624). In "Fit" sizing the
 *   component's minimum size equals that desktop size.
 * · Mobile (<= 480px wide): stacked, both fill width inside padding.
 * · Canvas thumbnail / export always renders the desktop layout.
 * · Autoplay starts on appear (row 1), hover takes over, leaving
 *   resumes from the last hovered row.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 624
 */

import * as React from "react"
import {
    useState,
    useRef,
    useCallback,
    useEffect,
    useLayoutEffect,
} from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { ArrowUpRight } from "@phosphor-icons/react"

// ─── Fixed settings (no controls) ─────────────────────────────
const MOBILE_BREAKPOINT = 480
const DESKTOP_IMAGE_MIN_WIDTH = 460 // 32 + 460 + 36 + 640 + 32 = 1200
const NUMBER_TITLE_GAP = 32
const NUMBER_HOVER_SHIFT = 8
const IDLE_ROTATION = 0
const ACTIVE_ROTATION = 45
const EASE: [number, number, number, number] = [0.44, 0, 0.56, 1]
const CSS_EASE = "cubic-bezier(0.44, 0, 0.56, 1)"

// Row highlight / text / icon motion
const HOVER_DURATION = 0.45
const HOVER_T = { type: "tween" as const, duration: HOVER_DURATION, ease: EASE }
const HOVER_CSS = `${HOVER_DURATION}s ${CSS_EASE}`
// Image appearing motion (slightly slower so it feels soft)
const IMAGE_T = { type: "tween" as const, duration: 0.7, ease: EASE }

// ─── Types ────────────────────────────────────────────────────
type Direction = "up" | "down"

interface RowItem {
    title: string
    imageFile?: { src: string } | string
    link: string
    newTab: boolean
}

interface LayoutGroup {
    padding: string
    cRadius: number
    imageRadius: number
    gap: number
    imageHeight: number
    imageMinHeight: number
    rowsMaxWidth: number
}

interface StyleGroup {
    titleFont: Record<string, any>
    numberFont: Record<string, any>
    rowHeight: number
    rowSpacing: number
    rowPadding: string
    iconSize: number
}

interface ColorsGroup {
    bg: string
    highlight: string
    text: string
    activeText: string
    divider: string
}

interface Props {
    items: RowItem[]
    layout: LayoutGroup
    style: StyleGroup
    colors: ColorsGroup
    autoSpeed: number
}

// ─── Helpers ──────────────────────────────────────────────────
function resolveUploadSrc(val: RowItem["imageFile"] | undefined): string {
    if (!val) return ""
    if (typeof val === "string") return val.trim()
    const anyVal = val as any
    if (typeof anyVal.src === "string") return anyVal.src.trim()
    if (anyVal.src && typeof anyVal.src.src === "string")
        return anyVal.src.src.trim()
    return ""
}

const pad = (n: number) => String(n).padStart(2, "0")

// ─── HoverIndicator ───────────────────────────────────────────
// Single shared highlight. Animates transform + opacity only.
function HoverIndicator({
    rect,
    visible,
    color,
}: {
    rect: { top: number; height: number } | null
    visible: boolean
    color: string
}) {
    if (!rect) return null
    return (
        <motion.div
            initial={false}
            animate={{ y: rect.top, opacity: visible ? 1 : 0 }}
            transition={HOVER_T}
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: rect.height,
                background: color,
                zIndex: 0,
                pointerEvents: "none",
                willChange: "transform, opacity",
            }}
        />
    )
}

// ─── ImagePanel ───────────────────────────────────────────────
function ImagePanel({
    items,
    activeIndex,
    radius,
    direction,
}: {
    items: RowItem[]
    activeIndex: number
    radius: number
    direction: Direction
}) {
    const isStatic = useIsStaticRenderer()
    const src = resolveUploadSrc(items[activeIndex]?.imageFile)
    const yIn = direction === "down" ? "6%" : "-6%"
    const yOut = direction === "down" ? "-6%" : "6%"

    // Preload every row's image so crossfades never wait on a download.
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        items.forEach((it) => {
            const s = resolveUploadSrc(it.imageFile)
            if (s) {
                const im = new Image()
                im.src = s
            }
        })
    }, [items, isStatic])

    const emptyState = (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
                textAlign: "center",
                padding: 16,
                zIndex: 2,
            }}
        >
            Upload an image for this row
        </div>
    )

    const bg = {
        position: "absolute" as const,
        inset: 0,
        backgroundImage: src ? `url("${src}")` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
    }

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                borderRadius: radius,
                overflow: "hidden",
                background: "#0d0d0d",
            }}
        >
            {isStatic ? (
                <div style={bg}>{!src && emptyState}</div>
            ) : (
                <AnimatePresence initial={false}>
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, y: yIn, scale: 1.04 }}
                        animate={{ opacity: 1, y: "0%", scale: 1 }}
                        exit={{ opacity: 0, y: yOut }}
                        transition={IMAGE_T}
                        style={{ ...bg, willChange: "transform, opacity" }}
                    >
                        {!src && emptyState}
                    </motion.div>
                </AnimatePresence>
            )}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(to bottom,transparent 55%,rgba(0,0,0,0.3) 100%)",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />
        </div>
    )
}

// ─── RowIcon ──────────────────────────────────────────────────
function RowIcon({
    isActive,
    size,
    color,
}: {
    isActive: boolean
    size: number
    color: string
}) {
    const isStatic = useIsStaticRenderer()
    const rotation = isActive ? ACTIVE_ROTATION : IDLE_ROTATION

    const shared = {
        position: "relative" as const,
        zIndex: 1,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        color,
        transition: `color ${HOVER_CSS}`,
    }

    const icon = (
        <ArrowUpRight size={size} weight="regular" color="currentColor" />
    )

    if (isStatic) {
        return (
            <div style={{ ...shared, transform: `rotate(${rotation}deg)` }}>
                {icon}
            </div>
        )
    }

    return (
        <motion.div
            initial={false}
            animate={{ rotate: rotation }}
            transition={HOVER_T}
            style={shared}
        >
            {icon}
        </motion.div>
    )
}

// ─── Row ──────────────────────────────────────────────────────
const Row = React.forwardRef<
    HTMLDivElement,
    {
        item: RowItem
        index: number
        isActive: boolean
        showActive: boolean
        canHover: boolean
        onEnter: (i: number) => void
        colors: ColorsGroup
        style: StyleGroup
        isLast: boolean
    }
>(function Row(
    {
        item,
        index,
        isActive,
        showActive,
        canHover,
        onEnter,
        colors,
        style,
        isLast,
    },
    ref
) {
    const isStatic = useIsStaticRenderer()

    const handleClick = () => {
        if (item.link) window.open(item.link, item.newTab ? "_blank" : "_self")
    }

    const on = isActive && showActive
    const fg = on ? colors.activeText : colors.text
    const shiftX = on ? NUMBER_HOVER_SHIFT : 0

    const numberStyle = {
        position: "relative" as const,
        zIndex: 1,
        ...(style.numberFont || {}),
        color: fg,
        flexShrink: 0,
        minWidth: "2ch",
        transition: `color ${HOVER_CSS}`,
    }

    return (
        <div
            ref={ref}
            onMouseEnter={
                canHover && !isStatic ? () => onEnter(index) : undefined
            }
            onClick={item.link ? handleClick : undefined}
            style={{
                position: "relative",
                zIndex: 1,
                minHeight: style.rowHeight,
                display: "flex",
                alignItems: "center",
                gap: NUMBER_TITLE_GAP,
                padding: style.rowPadding || "12px",
                marginBottom: isLast ? 0 : style.rowSpacing,
                borderBottom: `1px solid ${colors.divider}`,
                cursor: item.link ? "pointer" : "default",
                overflow: "hidden",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
                boxSizing: "border-box",
                // Static fallback: plain snapshot of the active row.
                background: isStatic && on ? colors.highlight : "transparent",
            }}
        >
            {isStatic ? (
                <span
                    style={{
                        ...numberStyle,
                        transform: `translateX(${shiftX}px)`,
                    }}
                >
                    {pad(index + 1)}
                </span>
            ) : (
                <motion.span
                    initial={false}
                    animate={{ x: shiftX }}
                    transition={HOVER_T}
                    style={numberStyle}
                >
                    {pad(index + 1)}
                </motion.span>
            )}

            <span
                style={{
                    position: "relative",
                    zIndex: 1,
                    ...(style.titleFont || {}),
                    color: fg,
                    flex: 1,
                    transition: `color ${HOVER_CSS}`,
                }}
            >
                {item.title}
            </span>

            <RowIcon isActive={on} size={style.iconSize} color={fg} />
        </div>
    )
})

// ─── Main ─────────────────────────────────────────────────────
export default function FlowRevealRows(props: Props) {
    const {
        items = [],
        layout = DEFAULT_LAYOUT,
        style = DEFAULT_STYLE,
        colors = DEFAULT_COLORS,
        autoSpeed = 1.2,
    } = props

    const L = { ...DEFAULT_LAYOUT, ...layout }
    const S = { ...DEFAULT_STYLE, ...style }
    const C = { ...DEFAULT_COLORS, ...colors }

    const isStatic = useIsStaticRenderer()
    const list = Array.isArray(items) ? items : []
    const autoOn = autoSpeed > 0

    const [activeIndex, setActiveIndex] = useState(0)
    const [direction, setDirection] = useState<Direction>("down")
    const [measuredMobile, setMeasuredMobile] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [highlightRect, setHighlightRect] = useState<{
        top: number
        height: number
    } | null>(null)

    // Canvas thumbnail / export always shows the desktop version.
    const isMobile = isStatic ? false : measuredMobile

    const containerRef = useRef<HTMLDivElement>(null)
    const rowsWrapperRef = useRef<HTMLDivElement>(null)
    const rowRefs = useRef<Array<HTMLDivElement | null>>([])
    const lastIndex = useRef(0)
    const activeIndexRef = useRef(0)
    const hasAppeared = useRef(false)

    const inView = useInView(containerRef, { amount: 0.3 })

    // On mobile there is no hover, but the highlight still shows when
    // autoplay is on so the auto cycle is visible.
    const showActive = !isMobile || autoOn
    const canHover = !isMobile

    const measureRow = useCallback((i: number) => {
        const rowEl = rowRefs.current[i]
        const wrapperEl = rowsWrapperRef.current
        if (!rowEl || !wrapperEl) return
        const rowBox = rowEl.getBoundingClientRect()
        const wrapBox = wrapperEl.getBoundingClientRect()
        setHighlightRect({
            top: rowBox.top - wrapBox.top + wrapperEl.scrollTop,
            height: rowBox.height,
        })
    }, [])

    useEffect(() => {
        const check = () => {
            const w = containerRef.current?.offsetWidth ?? window.innerWidth
            setMeasuredMobile(w <= MOBILE_BREAKPOINT)
            if (!isStatic && activeIndexRef.current !== -1) {
                measureRow(activeIndexRef.current)
            }
        }
        check()
        if (isStatic) return
        const ro = new ResizeObserver(check)
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [isStatic, measureRow])

    useLayoutEffect(() => {
        if (isStatic) return
        measureRow(0)
    }, [list.length, isStatic, measureRow])

    // Activates a row (from hover or autoplay), tracking direction.
    const goTo = useCallback(
        (i: number) => {
            setDirection((prev) =>
                i === lastIndex.current
                    ? prev
                    : i > lastIndex.current
                      ? "down"
                      : "up"
            )
            lastIndex.current = i
            activeIndexRef.current = i
            setActiveIndex(i)
            measureRow(i)
        },
        [measureRow]
    )

    const handleEnter = useCallback(
        (i: number) => {
            setIsHovering(true)
            goTo(i)
        },
        [goTo]
    )

    // With autoplay on, the last hovered row stays active and autoplay
    // resumes from it. With autoplay off, the highlight fades out.
    const handleLeave = useCallback(() => {
        setIsHovering(false)
        if (!autoOn) {
            activeIndexRef.current = -1
            setActiveIndex(-1)
        }
    }, [autoOn])

    // On appear: activate the first row.
    useEffect(() => {
        if (isStatic || !autoOn || !inView || hasAppeared.current) return
        hasAppeared.current = true
        goTo(0)
    }, [inView, autoOn, isStatic, goTo])

    // Autoplay loop — pauses while hovering or off screen.
    useEffect(() => {
        if (isStatic || !autoOn || !inView || isHovering || list.length < 2)
            return
        const id = setInterval(
            () => {
                const cur = activeIndexRef.current
                goTo(cur < 0 ? 0 : (cur + 1) % list.length)
            },
            Math.max(300, autoSpeed * 1000)
        )
        return () => clearInterval(id)
    }, [isStatic, autoOn, inView, isHovering, list.length, autoSpeed, goTo])

    const activeForImage = activeIndex === -1 ? lastIndex.current : activeIndex

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: C.bg,
                borderRadius: L.cRadius,
                overflow: "hidden",
                padding: L.padding || "0px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "stretch",
                gap: L.gap,
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            }}
        >
            {/* Hides the scrollbar on the rows stack */}
            <style>{`.frr-rows::-webkit-scrollbar{display:none;width:0;height:0}`}</style>

            {/* IMAGE PANEL — fills the space left by the rows stack */}
            <div
                style={{
                    position: "relative",
                    flex: isMobile ? "0 0 auto" : "1 1 0",
                    minWidth: isMobile ? 0 : DESKTOP_IMAGE_MIN_WIDTH,
                    width: isMobile ? "100%" : undefined,
                    height: isMobile ? L.imageMinHeight : undefined,
                    minHeight: isMobile ? L.imageMinHeight : L.imageHeight,
                    alignSelf: "stretch",
                }}
            >
                {list.length > 0 && (
                    <ImagePanel
                        items={list}
                        activeIndex={Math.max(0, activeForImage)}
                        radius={L.imageRadius}
                        direction={direction}
                    />
                )}
            </div>

            {/* ROWS — max width on desktop, full width on mobile */}
            <div
                ref={rowsWrapperRef}
                className="frr-rows"
                onMouseLeave={canHover && !isStatic ? handleLeave : undefined}
                style={{
                    position: "relative",
                    flex: isMobile ? "0 0 auto" : `1 1 ${L.rowsMaxWidth}px`,
                    minWidth: 0,
                    width: isMobile ? "100%" : undefined,
                    maxWidth: isMobile ? "100%" : L.rowsMaxWidth,
                    display: "flex",
                    flexDirection: "column",
                    borderTop: `1px solid ${C.divider}`,
                    boxSizing: "border-box",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                {showActive && !isStatic && (
                    <HoverIndicator
                        rect={highlightRect}
                        visible={activeIndex !== -1}
                        color={C.highlight}
                    />
                )}

                {list.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "rgba(255,255,255,0.25)",
                            fontSize: 13,
                        }}
                    >
                        Add rows in the property panel
                    </div>
                ) : (
                    list.map((item, i) => (
                        <Row
                            key={i}
                            ref={(el) => (rowRefs.current[i] = el)}
                            item={item}
                            index={i}
                            isActive={activeIndex === i}
                            showActive={showActive}
                            canHover={canHover}
                            onEnter={handleEnter}
                            colors={C}
                            style={S}
                            isLast={i === list.length - 1}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────
const DEFAULT_LAYOUT: LayoutGroup = {
    padding: "32px",
    cRadius: 0,
    imageRadius: 0,
    gap: 36,
    imageHeight: 560,
    imageMinHeight: 400,
    rowsMaxWidth: 640,
}

const DEFAULT_STYLE: StyleGroup = {
    titleFont: {
        fontFamily: "Inter",
        fontSize: 18,
        fontWeight: 500,
        lineHeight: "1.2em",
    },
    numberFont: {
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: "1em",
    },
    rowHeight: 80,
    rowSpacing: 0,
    rowPadding: "12px",
    iconSize: 20,
}

const DEFAULT_COLORS: ColorsGroup = {
    bg: "#0d0d0d",
    highlight: "#dcd6c8",
    text: "#9fb0a2",
    activeText: "#0d0d0d",
    divider: "rgba(255,255,255,0.15)",
}

const DEFAULT_ITEMS: RowItem[] = [
    "Brand Identity",
    "Web Design",
    "Product Strategy",
    "Motion Design",
    "Creative Development",
].map((title) => ({ title, link: "", newTab: false }))

FlowRevealRows.defaultProps = {
    items: DEFAULT_ITEMS,
    layout: DEFAULT_LAYOUT,
    style: DEFAULT_STYLE,
    colors: DEFAULT_COLORS,
    autoSpeed: 1.2,
}

// ─── Property Controls ────────────────────────────────────────
addPropertyControls(FlowRevealRows, {
    items: {
        type: ControlType.Array,
        title: "Rows",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Row title",
                },
                imageFile: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "32px",
            },
            cRadius: {
                type: ControlType.Number,
                title: "C-Radius",
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 0,
            },
            imageRadius: {
                type: ControlType.Number,
                title: "Image Radius",
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 0,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 36,
            },
            imageHeight: {
                type: ControlType.Number,
                title: "Image Height",
                min: 200,
                max: 1400,
                step: 1,
                defaultValue: 560,
            },
            imageMinHeight: {
                type: ControlType.Number,
                title: "Image Min H (Mobile)",
                min: 100,
                max: 800,
                step: 1,
                defaultValue: 400,
            },
            rowsMaxWidth: {
                type: ControlType.Number,
                title: "Rows Max Width",
                min: 200,
                max: 1400,
                step: 1,
                defaultValue: 640,
            },
        },
    },

    style: {
        type: ControlType.Object,
        title: "Font + Rows",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 18,
                    fontWeight: 500,
                },
            },
            numberFont: {
                type: ControlType.Font,
                title: "Number Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 14,
                    fontWeight: 400,
                },
            },
            rowHeight: {
                type: ControlType.Number,
                title: "Row Height",
                min: 40,
                max: 300,
                step: 1,
                defaultValue: 80,
            },
            rowSpacing: {
                type: ControlType.Number,
                title: "Row Spacing",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 0,
            },
            rowPadding: {
                type: ControlType.Padding,
                title: "Row Padding",
                defaultValue: "12px",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                min: 10,
                max: 64,
                step: 1,
                defaultValue: 20,
            },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            bg: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0d0d0d",
            },
            highlight: {
                type: ControlType.Color,
                title: "Row Hover",
                defaultValue: "#dcd6c8",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#9fb0a2",
            },
            activeText: {
                type: ControlType.Color,
                title: "Active Text",
                defaultValue: "#0d0d0d",
            },
            divider: {
                type: ControlType.Color,
                title: "Divider",
                defaultValue: "rgba(255,255,255,0.15)",
            },
        },
    },

    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed (s)",
        min: 0,
        max: 6,
        step: 0.1,
        defaultValue: 1.2,
    },
})
