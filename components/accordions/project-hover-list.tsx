import * as React from "react"
import { useEffect, useRef, useState } from "react"
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
    useVelocity,
    useTransform,
    useReducedMotion,
} from "framer-motion"
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
 * PROJECT HOVER LIST
 *
 * A numbered index of projects where hovering a row floats a preview image
 * next to the cursor, crossfading between rows, with a subtle velocity-based
 * tilt — the classic agency case-study-index interaction, done precisely
 * rather than with extra effects.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface ProjectItem {
    title: string
    category: string
    image: { src: string; alt?: string } | string
    link: string
}

interface ProjectHoverListProps {
    items: ProjectItem[]
    textColor: string
    mutedColor: string
    accentColor: string
    dividerColor: string
    font: any
    previewWidth: number
    previewHeight: number
    borderRadius: number
    compactBreakpoint: number
}

export default function ProjectHoverList(props: ProjectHoverListProps) {
    const {
        items = [],
        textColor,
        mutedColor,
        accentColor,
        dividerColor,
        font,
        previewWidth,
        previewHeight,
        borderRadius,
        compactBreakpoint,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const reduceMotion = Boolean(isStatic || prefersReducedMotion)

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    // No cursor on touch, and a floating image is unreadable on narrow
    // screens either way — switch to a static inline-thumbnail layout.
    const [isCompact, setIsCompact] = useState(false)

    useEffect(() => {
        if (!containerRef.current || isStatic) return

        const noHoverQuery = window.matchMedia?.(
            "(hover: none), (pointer: coarse)"
        )

        function evaluate(width: number) {
            const noHover = noHoverQuery ? noHoverQuery.matches : false
            setIsCompact(noHover || width < compactBreakpoint)
        }

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0
            evaluate(width)
        })
        observer.observe(containerRef.current)

        const onMediaChange = () =>
            evaluate(containerRef.current?.clientWidth ?? 0)
        noHoverQuery?.addEventListener?.("change", onMediaChange)

        return () => {
            observer.disconnect()
            noHoverQuery?.removeEventListener?.("change", onMediaChange)
        }
    }, [isStatic, compactBreakpoint])

    const showFloatingPreview = !reduceMotion && !isCompact

    // Cursor position, smoothed, relative to the list container.
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const smoothX = useSpring(mouseX, {
        stiffness: 300,
        damping: 32,
        mass: 0.6,
    })
    const smoothY = useSpring(mouseY, {
        stiffness: 300,
        damping: 32,
        mass: 0.6,
    })

    // Velocity-based tilt: fast cursor movement skews the preview slightly.
    const velocityX = useVelocity(smoothX)
    const rawSkew = useTransform(velocityX, [-1500, 0, 1500], [-8, 0, 8], {
        clamp: true,
    })
    const skewSpring = useSpring(rawSkew, { stiffness: 200, damping: 20 })

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
    }

    const previewOffsetX = 36
    const previewOffsetY = -previewHeight / 2

    const activeItem =
        hoveredIndex !== null && items[hoveredIndex]
            ? items[hoveredIndex]
            : null

    function getImageSrc(item: ProjectItem) {
        return typeof item.image === "string" ? item.image : item.image?.src
    }
    function getImageAlt(item: ProjectItem) {
        return typeof item.image === "string"
            ? item.title
            : item.image?.alt || item.title
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                }}
            >
                {items.map((item, i) => {
                    const isActive = hoveredIndex === i
                    const isDimmed = hoveredIndex !== null && hoveredIndex !== i

                    return (
                        <motion.a
                            key={i}
                            href={item.link || "#"}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onFocus={() => setHoveredIndex(i)}
                            onBlur={() => setHoveredIndex(null)}
                            animate={{
                                opacity: reduceMotion ? 1 : isDimmed ? 0.35 : 1,
                            }}
                            transition={{
                                duration: reduceMotion ? 0 : 0.4,
                                ease: EASE,
                            }}
                            whileTap={
                                isCompact && !reduceMotion
                                    ? { scale: 0.98 }
                                    : undefined
                            }
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: isCompact ? 14 : 24,
                                padding: isCompact ? "14px 2px" : "22px 4px",
                                borderTop: `1px solid ${dividerColor}`,
                                borderBottom:
                                    i === items.length - 1
                                        ? `1px solid ${dividerColor}`
                                        : "none",
                                textDecoration: "none",
                                cursor: "pointer",
                                ...font,
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: isCompact ? 14 : 20,
                                    minWidth: 0,
                                    flex: 1,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 13,
                                        lineHeight: 1.4,
                                        flexShrink: 0,
                                        color: isActive
                                            ? accentColor
                                            : mutedColor,
                                        fontVariantNumeric: "tabular-nums",
                                        transition: "color 0.3s ease",
                                    }}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>

                                {isCompact && getImageSrc(item) && (
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            flexShrink: 0,
                                            borderRadius: Math.min(
                                                borderRadius,
                                                10
                                            ),
                                            overflow: "hidden",
                                            background: dividerColor,
                                        }}
                                    >
                                        <img
                                            src={getImageSrc(item)}
                                            alt={getImageAlt(item)}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    </div>
                                )}

                                <span
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        minWidth: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: isCompact ? 19 : 34,
                                            lineHeight: 1.35,
                                            fontWeight: 600,
                                            letterSpacing: "-0.01em",
                                            color: isActive
                                                ? accentColor
                                                : textColor,
                                            transition: "color 0.3s ease",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                            overflow: "hidden",
                                            display: "inline-block",
                                            maxWidth: "100%",
                                        }}
                                    >
                                        {item.title}
                                    </span>
                                    {isCompact && (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                lineHeight: 1.4,
                                                color: mutedColor,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {item.category}
                                        </span>
                                    )}
                                </span>
                            </span>

                            {!isCompact && (
                                <span
                                    style={{
                                        fontSize: 13,
                                        lineHeight: 1.4,
                                        color: mutedColor,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}
                                >
                                    {item.category}
                                </span>
                            )}

                            {/* Per-row underline that draws in on hover */}
                            <motion.span
                                aria-hidden
                                animate={{
                                    scaleX: reduceMotion ? 0 : isActive ? 1 : 0,
                                }}
                                transition={{
                                    duration: reduceMotion ? 0 : 0.45,
                                    ease: EASE,
                                }}
                                style={{
                                    position: "absolute",
                                    left: 4,
                                    right: 4,
                                    bottom: -1,
                                    height: 1,
                                    background: accentColor,
                                    transformOrigin: "left",
                                }}
                            />
                        </motion.a>
                    )
                })}
            </div>

            {/* Floating preview image — desktop/hover only, never on touch or narrow layouts */}
            {showFloatingPreview && (
                <motion.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: previewWidth,
                        height: previewHeight,
                        x: smoothX,
                        y: smoothY,
                        translateX: previewOffsetX,
                        translateY: previewOffsetY,
                        skewY: skewSpring,
                        borderRadius,
                        overflow: "hidden",
                        pointerEvents: "none",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                        zIndex: 10,
                    }}
                    animate={{
                        opacity: activeItem ? 1 : 0,
                        scale: activeItem ? 1 : 0.85,
                    }}
                    transition={{ duration: 0.35, ease: EASE }}
                >
                    <AnimatePresence mode="popLayout">
                        {activeItem && getImageSrc(activeItem) && (
                            <motion.img
                                key={hoveredIndex}
                                src={getImageSrc(activeItem)}
                                alt={getImageAlt(activeItem)}
                                initial={{ opacity: 0, scale: 1.06 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: EASE }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Reduced-motion / static fallback: pin first item's image, no cursor logic */}
            {reduceMotion && items[0] && getImageSrc(items[0]) && (
                <div
                    style={{
                        position: "absolute",
                        top: 24,
                        right: 24,
                        width: previewWidth,
                        height: previewHeight,
                        borderRadius,
                        overflow: "hidden",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                    }}
                >
                    <img
                        src={getImageSrc(items[0])}
                        alt={getImageAlt(items[0])}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

ProjectHoverList.displayName = "Project Hover List"

addPropertyControls(ProjectHoverList, {
    items: {
        type: ControlType.Array,
        title: "Projects",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, defaultValue: "Mercer" },
                category: {
                    type: ControlType.String,
                    defaultValue: "Branding",
                },
                image: { type: ControlType.ResponsiveImage },
                link: { type: ControlType.Link },
            },
        },
        defaultValue: [
            { title: "Mercer", category: "Branding, 2025" },
            { title: "Lumina", category: "Product Design, 2025" },
            { title: "Cascadia", category: "Web Design, 2024" },
            { title: "Laurel", category: "Identity, 2024" },
            { title: "Palisades", category: "Art Direction, 2024" },
        ],
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#111111",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#8A8A8A",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#111111",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider",
        defaultValue: "rgba(0,0,0,0.12)",
    },
    previewWidth: {
        type: ControlType.Number,
        title: "Preview W",
        min: 120,
        max: 480,
        defaultValue: 260,
    },
    previewHeight: {
        type: ControlType.Number,
        title: "Preview H",
        min: 120,
        max: 560,
        defaultValue: 320,
    },
    compactBreakpoint: {
        type: ControlType.Number,
        title: "Compact Below",
        min: 300,
        max: 1000,
        step: 10,
        defaultValue: 680,
        description:
            "Container width (px) below which rows switch to inline thumbnails instead of the cursor-follow preview. Touch devices always use this layout.",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        defaultValue: 12,
    },
})
