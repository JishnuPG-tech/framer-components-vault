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


import { motion, AnimatePresence, useInView } from "framer-motion"

const isCanvas =
    typeof RenderTarget !== "undefined" &&
    RenderTarget.current() === RenderTarget.canvas

// ─── Color Helper ─────────────────────────────────────────────────────────────

function withAlpha(color: string, alphaHex: string = "ff"): string {
    if (!color)
        return `rgba(41, 98, 255, ${(parseInt(alphaHex, 16) / 255).toFixed(3)})`

    const trimmed = color.trim()

    const a = (parseInt(alphaHex, 16) / 255).toFixed(3)

    // Handle rgb(r, g, b) or rgba(r, g, b, a)

    const rgbMatch = trimmed.match(
        /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
    )

    if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${a})`
    }

    // Handle #hex

    if (trimmed.startsWith("#")) {
        const hex = trimmed.replace("#", "")

        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16)

            const g = parseInt(hex[1] + hex[1], 16)

            const b = parseInt(hex[2] + hex[2], 16)

            return `rgba(${r}, ${g}, ${b}, ${a})`
        }

        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16)

            const g = parseInt(hex.slice(2, 4), 16)

            const b = parseInt(hex.slice(4, 6), 16)

            return `rgba(${r}, ${g}, ${b}, ${a})`
        }
    }

    return color
}

// ─── Preset Icons ─────────────────────────────────────────────────────────────

function PresetIcon({
    name,

    color,

    size = 20,
}: {
    name: string

    color: string

    size?: number
}) {
    const p = {
        width: size,

        height: size,

        viewBox: "0 0 24 24",

        fill: "none" as const,

        stroke: color,

        strokeWidth: "1.8",

        strokeLinecap: "round" as const,

        strokeLinejoin: "round" as const,
    }

    if (name === "framer") {
        return (
            <svg {...p} fill={color} stroke="none">
                <path d="M4 2h16v8h-8zM4 10h8l8 8H4zM4 18h8v8z" />
            </svg>
        )
    }

    if (name === "chart") {
        return (
            <svg {...p}>
                <path d="M6 16L10 11L14 14L18 8" strokeWidth="2" />

                <circle cx="6" cy="16" r="1.5" fill={color} stroke="none" />

                <circle cx="10" cy="11" r="1.5" fill={color} stroke="none" />

                <circle cx="14" cy="14" r="1.5" fill={color} stroke="none" />

                <circle cx="18" cy="8" r="1.5" fill={color} stroke="none" />
            </svg>
        )
    }

    if (name === "bot") {
        return (
            <svg {...p}>
                <rect x="3" y="11" width="18" height="10" rx="3" />

                <circle cx="12" cy="5" r="2" />

                <path d="M12 7V11" />

                <line x1="8" y1="16" x2="8" y2="16.01" strokeWidth="3" />

                <line x1="16" y1="16" x2="16" y2="16.01" strokeWidth="3" />
            </svg>
        )
    }

    if (name === "diamond") {
        return (
            <svg {...p}>
                <path d="M6 3H18L22 9L12 22L2 9L6 3Z" />
            </svg>
        )
    }

    if (name === "lightning") {
        return (
            <svg {...p}>
                <polygon
                    points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                    fill={withAlpha(color, "22")}
                />
            </svg>
        )
    }

    if (name === "shield") {
        return (
            <svg {...p}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        )
    }

    if (name === "cpu") {
        return (
            <svg {...p}>
                <rect x="4" y="4" width="16" height="16" rx="2" />

                <rect x="9" y="9" width="6" height="6" />

                <path d="M9 1V4M15 1V4M9 20V23M15 20V23M20 9H23M20 15H23M1 9H4M1 15H4" />
            </svg>
        )
    }

    if (name === "sparkles") {
        return (
            <svg {...p}>
                <path d="M12 3l1.9 4.7L18.5 9.5 13.9 11.4 12 16.1 10.1 11.4 5.5 9.5 10.1 7.7zM19 16l.9 2.2 2.1.8-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.8z" />
            </svg>
        )
    }

    if (name === "code") {
        return (
            <svg {...p}>
                <polyline points="16 18 22 12 16 6" />

                <polyline points="8 6 2 12 8 18" />
            </svg>
        )
    }

    if (name === "globe") {
        return (
            <svg {...p}>
                <circle cx="12" cy="12" r="10" />

                <line x1="2" y1="12" x2="22" y2="12" />

                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        )
    }

    if (name === "layers") {
        return (
            <svg {...p}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />

                <polyline points="2 17 12 22 22 17" />

                <polyline points="2 12 12 17 22 12" />
            </svg>
        )
    }

    if (name === "rocket") {
        return (
            <svg {...p}>
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6.05 11a22.35 22.35 0 0 1-3.95 2z" />
            </svg>
        )
    }

    if (name === "star") {
        return (
            <svg {...p}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        )
    }

    return (
        <svg {...p}>
            <polyline points="4 17 10 11 4 5" />

            <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
    )
}

// ─── Strict Allowlist SVG Sanitizer ───────────────────────────────────────────

// Framer Community Security Compliance: Strict allowlist SVG parser that strips

// scripts, foreignObject, event handlers, and unsafe attributes into native React SVG elements.

const ALLOWED_SVG_TAGS = new Set([
    "path",

    "circle",

    "rect",

    "line",

    "polyline",

    "polygon",

    "ellipse",

    "g",

    "defs",
])

const ALLOWED_SVG_ATTRS = new Set([
    "viewbox",

    "fill",

    "stroke",

    "strokewidth",

    "stroke-width",

    "strokelinecap",

    "stroke-linecap",

    "strokelinejoin",

    "stroke-linejoin",

    "d",

    "points",

    "x",

    "y",

    "x1",

    "y1",

    "x2",

    "y2",

    "cx",

    "cy",

    "r",

    "rx",

    "ry",

    "width",

    "height",

    "transform",

    "opacity",

    "fillrule",

    "fill-rule",

    "cliprule",

    "clip-rule",
])

const SVG_ATTR_CAMEL_MAP: Record<string, string> = {
    viewbox: "viewBox",

    strokewidth: "strokeWidth",

    "stroke-width": "strokeWidth",

    strokelinecap: "strokeLinecap",

    "stroke-linecap": "strokeLinecap",

    strokelinejoin: "strokeLinejoin",

    "stroke-linejoin": "strokeLinejoin",

    fillrule: "fillRule",

    "fill-rule": "fillRule",

    cliprule: "clipRule",

    "clip-rule": "clipRule",
}

function sanitizeElementAttributes(
    el: Element,

    extraProps: Record<string, any> = {}
): Record<string, any> {
    const props: Record<string, any> = { ...extraProps }

    for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i]

        const attrName = attr.name.toLowerCase()

        const attrValue = attr.value

        // Strictly block event handlers

        if (attrName.startsWith("on")) continue

        // Strictly allow only safe attributes

        if (!ALLOWED_SVG_ATTRS.has(attrName)) continue

        // Block active URI schemes

        const cleanVal = attrValue.replace(/\s+/g, "").toLowerCase()

        if (
            cleanVal.includes("javascript:") ||
            cleanVal.includes("data:") ||
            cleanVal.includes("vbscript:")
        ) {
            continue
        }

        const reactName = SVG_ATTR_CAMEL_MAP[attrName] || attrName

        props[reactName] = attrValue
    }

    return props
}

function domNodeToReact(
    el: Element,

    keyPrefix: string,

    keyIndex: { current: number }
): React.ReactNode | null {
    const tag = el.tagName.toLowerCase()

    if (!ALLOWED_SVG_TAGS.has(tag)) return null

    const props = sanitizeElementAttributes(el, {
        key: `${keyPrefix}-${keyIndex.current++}`,
    })

    // Ensure default fill / stroke if unspecified on geometry elements

    if (tag !== "g" && tag !== "defs" && !props.fill && !props.stroke) {
        props.fill = "currentColor"
    }

    // Recursively process children for <g> and <defs>

    const children: React.ReactNode[] = []

    for (let i = 0; i < el.children.length; i++) {
        const child = domNodeToReact(el.children[i], keyPrefix, keyIndex)

        if (child) children.push(child)
    }

    return React.createElement(
        tag,

        props,

        children.length > 0 ? children : undefined
    )
}

function renderSanitizedSvg(
    rawSvg: string,

    defaultColor: string,

    size: number = 20
): React.ReactNode {
    if (
        !rawSvg ||
        typeof rawSvg !== "string" ||
        !rawSvg.trim().startsWith("<svg")
    ) {
        return null
    }

    // SSR safety guard: ensure DOMParser exists in the runtime environment

    if (typeof window === "undefined" || typeof DOMParser === "undefined") {
        return null
    }

    // Parse with DOMParser instead of regex for robust SVG handling

    let doc: Document

    try {
        const parser = new DOMParser()

        doc = parser.parseFromString(rawSvg, "image/svg+xml")

        // Check for parse errors

        const parseError = doc.querySelector("parsererror")

        if (parseError) return null
    } catch {
        return null
    }

    const svgEl = doc.querySelector("svg")

    if (!svgEl) return null

    // Build root props from parsed element attributes

    const rootProps = sanitizeElementAttributes(svgEl, {
        width: size,

        height: size,

        style: { display: "block", color: defaultColor },
    })

    if (!rootProps.viewBox && !rootProps.width) {
        rootProps.viewBox = "0 0 24 24"
    }

    // Recursively extract safe geometry children

    const keyIndex = { current: 0 }

    const children: React.ReactNode[] = []

    for (let i = 0; i < svgEl.children.length; i++) {
        const child = svgEl.children[i]

        const tag = child.tagName.toLowerCase()

        if (!ALLOWED_SVG_TAGS.has(tag)) continue

        const reactChild = domNodeToReact(child, "safe-svg", keyIndex)

        if (reactChild) children.push(reactChild)
    }

    if (children.length === 0) return null

    return React.createElement("svg", rootProps, ...children)
}

// ─── Universal Icon Renderer ──────────────────────────────────────────────────

function RenderIcon({
    preset,

    image,

    customSvg,

    color,

    size = 20,
}: {
    preset?: string

    image?: { src?: string; alt?: string } | string

    customSvg?: string

    color: string

    size?: number
}) {
    // 1. Custom SVG with strict allowlist geometry sanitization

    if (customSvg && customSvg.trim().startsWith("<svg")) {
        const sanitizedNode = renderSanitizedSvg(customSvg, color, size)

        if (sanitizedNode) {
            return (
                <div
                    style={{
                        width: size,

                        height: size,

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        color: color,
                    }}
                >
                    {sanitizedNode}
                </div>
            )
        }
    }

    // 2. Uploaded image asset (Framer ControlType.ResponsiveImage)

    const imgSrc = typeof image === "string" ? image : image?.src

    if (imgSrc && imgSrc.trim() !== "") {
        return (
            <img
                src={imgSrc}
                alt={typeof image === "object" ? image?.alt || "icon" : "icon"}
                style={{
                    width: size,

                    height: size,

                    objectFit: "contain",

                    display: "block",
                }}
            />
        )
    }

    // 3. Built-in preset vector icon

    return <PresetIcon name={preset || "framer"} color={color} size={size} />
}

// ─── Screw ────────────────────────────────────────────────────────────────────

function Screw({ style }: { style: React.CSSProperties }) {
    return (
        <div
            style={{
                position: "absolute",

                width: 6,

                height: 6,

                borderRadius: "50%",

                background:
                    "radial-gradient(circle at 35% 35%,#383840 0%,#101014 70%,#000 100%)",

                border: "1px solid rgba(255,255,255,0.12)",

                pointerEvents: "none" as const,

                ...style,
            }}
        />
    )
}

// ─── Single card ──────────────────────────────────────────────────────────────

interface CardProps {
    title: string

    summary: string

    iconName?: string

    iconImage?: { src?: string; alt?: string } | string

    customSvg?: string

    accent: string

    stat1Key: string

    stat1Val: string

    stat2Key: string

    stat2Val: string

    btnLabel: string

    btnUrl: string

    sub1Name: string

    sub1Detail: string

    sub1Badge: string

    sub2Name: string

    sub2Detail: string

    sub2Badge: string

    sub3Name: string

    sub3Detail: string

    sub3Badge: string

    sub4Name: string

    sub4Detail: string

    sub4Badge: string

    index: number

    showScrews: boolean

    isTouch: boolean

    isTabOrPhone?: boolean

    subTitleColor?: string

    subDetailColor?: string

    onHoverState?: (hovered: boolean, accent: string) => void

    isStatic?: boolean
}

function Card({
    title,

    summary,

    iconName,

    iconImage,

    customSvg,

    accent,

    stat1Key,

    stat1Val,

    stat2Key,

    stat2Val,

    btnLabel,

    btnUrl,

    sub1Name,

    sub1Detail,

    sub1Badge,

    sub2Name,

    sub2Detail,

    sub2Badge,

    sub3Name,

    sub3Detail,

    sub3Badge,

    sub4Name,

    sub4Detail,

    sub4Badge,

    index,

    showScrews,

    isTouch,

    isTabOrPhone = false,

    subTitleColor = "#ffffff",

    subDetailColor = "#e4e4e7",

    onHoverState,

    isStatic: isStaticProp,
}: CardProps) {
    const isStaticHook = useIsStaticRenderer()

    const isStatic = isStaticProp ?? isStaticHook

    // Viewport visibility: pause infinite animations when card is offscreen (Marketplace compliance)

    const cardRef = React.useRef<HTMLDivElement>(null)

    const isInView = useInView(cardRef, { amount: 0.05 })

    const isMobileMode = isTouch || isTabOrPhone

    // Viewport focal visibility for Tablet & Phone auto-reveal on scroll

    const isFocalInView = useInView(cardRef, {
        margin: "-22% 0px -22% 0px",

        amount: 0.25,
    })

    const [isHovered, setIsHovered] = React.useState(false)

    const [manualToggle, setManualToggle] = React.useState<boolean | null>(null)

    // Reset manual tap toggle when scrolling away on mobile/tablet so scroll auto-reveal works naturally

    React.useEffect(() => {
        if (isMobileMode) {
            setManualToggle(null)
        }
    }, [isFocalInView, isMobileMode])

    // Effective open state:

    // - On Tablet & Phone: driven by focal scroll auto-reveal (or touch tap)

    // - On Desktop: strictly hover & click / keyboard driven (reverted per user instruction)

    const open = isStatic
        ? false
        : manualToggle !== null
          ? manualToggle
          : isMobileMode
            ? isFocalInView
            : isHovered

    const subs = [
        { name: sub1Name, detail: sub1Detail, badge: sub1Badge },

        { name: sub2Name, detail: sub2Detail, badge: sub2Badge },

        { name: sub3Name, detail: sub3Detail, badge: sub3Badge },

        { name: sub4Name, detail: sub4Detail, badge: sub4Badge },
    ].filter((s) => s.name && s.name.trim() !== "")

    const col = accent || "#2962FF"

    const safeUrl = React.useMemo(() => {
        if (!btnUrl) return undefined

        const trimmed = btnUrl.trim()

        const lower = trimmed.toLowerCase()

        if (
            lower.startsWith("javascript:") ||
            lower.startsWith("data:") ||
            lower.startsWith("vbscript:")
        ) {
            return undefined
        }

        return trimmed
    }, [btnUrl])

    const handleHover = (state: boolean) => {
        setIsHovered(state)

        if (onHoverState) onHoverState(state, col)
    }

    React.useEffect(() => {
        if (!isStatic && open && onHoverState) {
            onHoverState(true, col)
        }
    }, [open, isStatic, col, onHoverState])

    return (
        <motion.div
            ref={cardRef}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            initial={isStatic ? false : { opacity: 0, y: 20 }}
            animate={isStatic ? { opacity: 1, y: 0 } : undefined}
            whileInView={isStatic ? undefined : { opacity: 1, y: 0 }}
            viewport={isStatic ? undefined : { once: true, amount: 0.1 }}
            transition={
                isStatic
                    ? { duration: 0 }
                    : {
                          duration: 0.5,

                          delay: Math.min(index * 0.07, 0.25),

                          ease: [0.16, 1, 0.3, 1],
                      }
            }
            onMouseEnter={() => {
                if (!isMobileMode && !isStatic) handleHover(true)
            }}
            onMouseLeave={() => {
                if (!isMobileMode && !isStatic) handleHover(false)
            }}
            onClick={() => {
                if (!isStatic) {
                    setManualToggle((prev) => (prev === null ? !open : !prev))
                }
            }}
            onFocus={(e: React.FocusEvent) => {
                if (
                    e.currentTarget === e.target &&
                    !isStatic &&
                    !isMobileMode
                ) {
                    handleHover(true)
                }
            }}
            onBlur={(e: React.FocusEvent) => {
                if (
                    !e.currentTarget.contains(e.relatedTarget) &&
                    !isStatic &&
                    !isMobileMode
                ) {
                    handleHover(false)
                }
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (!isStatic && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()

                    setManualToggle((prev) => (prev === null ? !open : !prev))
                }
            }}
            whileTap={isStatic ? undefined : { scale: 0.985 }}
            style={{
                position: "relative",

                borderRadius: 14,

                background: "linear-gradient(160deg,#06060a 0%,#000 100%)",

                border: open
                    ? `1px solid ${withAlpha(col, "77")}`
                    : "1px solid rgba(255,255,255,0.07)",

                boxShadow: open
                    ? `0 20px 48px rgba(0,0,0,0.95), 0 0 40px ${withAlpha(col, "35")}, inset 0 0 24px ${withAlpha(col, "15")}`
                    : "0 8px 28px rgba(0,0,0,0.8), inset 0 1px rgba(255,255,255,0.03)",

                overflow: "hidden",

                cursor: isMobileMode ? "pointer" : "default",

                userSelect: "none" as const,

                WebkitUserSelect: "none" as const,

                outline: "none",

                transition: "border 0.25s ease, box-shadow 0.25s ease",
            }}
        >
            {/* 4-Side Border Shimmer Lines - conditional infinite loops for marketplace compliance */}

            {open && !isStatic && (
                <>
                    {/* Top Shimmer */}

                    <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                            duration: 1.8,

                            repeat: open && isInView ? Infinity : 0,

                            ease: "linear",
                        }}
                        style={{
                            position: "absolute",

                            top: 0,

                            left: 0,

                            width: "70%",

                            height: 2,

                            background: `linear-gradient(90deg, transparent, ${col}, #ffffff, transparent)`,

                            zIndex: 10,

                            pointerEvents: "none",
                        }}
                    />

                    {/* Right Shimmer */}

                    <motion.div
                        animate={{ y: ["-100%", "100%"] }}
                        transition={{
                            duration: 1.8,

                            repeat: open && isInView ? Infinity : 0,

                            ease: "linear",

                            delay: 0.45,
                        }}
                        style={{
                            position: "absolute",

                            top: 0,

                            right: 0,

                            width: 2,

                            height: "70%",

                            background: `linear-gradient(180deg, transparent, ${col}, #ffffff, transparent)`,

                            zIndex: 10,

                            pointerEvents: "none",
                        }}
                    />

                    {/* Bottom Shimmer */}

                    <motion.div
                        animate={{ x: ["100%", "-100%"] }}
                        transition={{
                            duration: 1.8,

                            repeat: open && isInView ? Infinity : 0,

                            ease: "linear",

                            delay: 0.9,
                        }}
                        style={{
                            position: "absolute",

                            bottom: 0,

                            right: 0,

                            width: "70%",

                            height: 2,

                            background: `linear-gradient(270deg, transparent, ${col}, #ffffff, transparent)`,

                            zIndex: 10,

                            pointerEvents: "none",
                        }}
                    />

                    {/* Left Shimmer */}

                    <motion.div
                        animate={{ y: ["100%", "-100%"] }}
                        transition={{
                            duration: 1.8,

                            repeat: open && isInView ? Infinity : 0,

                            ease: "linear",

                            delay: 1.35,
                        }}
                        style={{
                            position: "absolute",

                            top: 0,

                            left: 0,

                            width: 2,

                            height: "70%",

                            background: `linear-gradient(0deg, transparent, ${col}, #ffffff, transparent)`,

                            zIndex: 10,

                            pointerEvents: "none",
                        }}
                    />
                </>
            )}

            {/* Corner screws */}

            {showScrews && (
                <>
                    <Screw style={{ top: 8, left: 8 }} />

                    <Screw style={{ top: 8, right: 8 }} />

                    <Screw style={{ bottom: 8, left: 8 }} />

                    <Screw style={{ bottom: 8, right: 8 }} />
                </>
            )}

            <div
                style={{
                    padding: "24px 20px 20px",

                    display: "flex",

                    flexDirection: "column",

                    gap: 16,
                }}
            >
                {/* Icon + pulse */}

                <div
                    style={{
                        display: "flex",

                        alignItems: "center",

                        justifyContent: "space-between",
                    }}
                >
                    <div
                        style={{
                            width: 42,

                            height: 42,

                            borderRadius: 10,

                            background:
                                "linear-gradient(145deg,#141418 0%,#04040a 100%)",

                            border: `1px solid ${open ? withAlpha(col, "66") : "rgba(255,255,255,0.08)"}`,

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            boxShadow: `0 4px 12px rgba(0,0,0,0.6), 0 0 16px ${withAlpha(col, open ? "40" : "15")}`,

                            overflow: "hidden",

                            transition:
                                "border 0.2s ease, box-shadow 0.2s ease",
                        }}
                    >
                        <RenderIcon
                            preset={iconName}
                            image={iconImage}
                            customSvg={customSvg}
                            color={col}
                            size={20}
                        />
                    </div>

                    {isStatic ? (
                        <div
                            style={{
                                width: 6,

                                height: 6,

                                borderRadius: "50%",

                                backgroundColor: col,

                                boxShadow: `0 0 10px ${col}`,

                                opacity: 0.85,
                            }}
                        />
                    ) : (
                        <motion.div
                            animate={{
                                opacity: [0.4, 1, 0.4],

                                scale: [0.85, 1.25, 0.85],
                            }}
                            transition={{
                                duration: 2,

                                repeat: open && isInView ? Infinity : 0,

                                ease: "easeInOut",

                                delay: index * 0.2,
                            }}
                            style={{
                                width: 6,

                                height: 6,

                                borderRadius: "50%",

                                backgroundColor: col,

                                boxShadow: `0 0 10px ${col}`,
                            }}
                        />
                    )}
                </div>

                {/* Title + summary */}

                <div>
                    <h3
                        style={{
                            margin: "0 0 6px",

                            fontSize: 18,

                            fontWeight: 700,

                            fontFamily: "'Orbitron', sans-serif",

                            letterSpacing: "-0.018em",

                            lineHeight: 1.25,

                            color: "#FFFFFF",
                        }}
                    >
                        {title}
                    </h3>

                    <p
                        style={{
                            margin: 0,

                            fontSize: 13.5,

                            lineHeight: 1.6,

                            fontFamily: "'Geist', -apple-system, sans-serif",

                            color: "#A1A1AA",
                        }}
                    >
                        {summary}
                    </p>
                </div>

                {/* Stats */}

                {(stat1Key || stat2Key) && (
                    <div
                        style={{
                            display: "flex",

                            borderRadius: 8,

                            background: "rgba(255,255,255,0.025)",

                            border: "1px solid rgba(255,255,255,0.05)",

                            overflow: "hidden",
                        }}
                    >
                        {stat1Key && (
                            <div
                                style={{
                                    flex: 1,

                                    padding: "8px 12px",

                                    borderRight: stat2Key
                                        ? "1px solid rgba(255,255,255,0.05)"
                                        : undefined,
                                }}
                            >
                                <div
                                    style={{
                                        fontFamily:
                                            "'Geist', ui-monospace, monospace",

                                        fontSize: 8,

                                        color: "#71717A",

                                        letterSpacing: "0.1em",

                                        textTransform: "uppercase" as const,

                                        marginBottom: 3,
                                    }}
                                >
                                    {stat1Key}
                                </div>

                                <div
                                    style={{
                                        fontFamily:
                                            "'Orbitron', ui-monospace, monospace",

                                        fontSize: 12,

                                        fontWeight: 700,

                                        color: open ? col : "#FFFFFF",

                                        fontVariantNumeric: "tabular-nums",

                                        transition: "color 0.2s ease",
                                    }}
                                >
                                    {stat1Val}
                                </div>
                            </div>
                        )}

                        {stat2Key && (
                            <div style={{ flex: 1, padding: "8px 12px" }}>
                                <div
                                    style={{
                                        fontFamily:
                                            "'Geist', ui-monospace, monospace",

                                        fontSize: 8,

                                        color: "#71717A",

                                        letterSpacing: "0.1em",

                                        textTransform: "uppercase" as const,

                                        marginBottom: 3,
                                    }}
                                >
                                    {stat2Key}
                                </div>

                                <div
                                    style={{
                                        fontFamily:
                                            "'Orbitron', ui-monospace, monospace",

                                        fontSize: 12,

                                        fontWeight: 700,

                                        color: open ? col : "#FFFFFF",

                                        fontVariantNumeric: "tabular-nums",

                                        transition: "color 0.2s ease",
                                    }}
                                >
                                    {stat2Val}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sub-services */}

                <AnimatePresence>
                    {open && subs.length > 0 && (
                        <motion.div
                            key="subs"
                            initial={
                                isStatic ? false : { opacity: 0, height: 0 }
                            }
                            animate={{ opacity: 1, height: "auto" }}
                            exit={
                                isStatic ? undefined : { opacity: 0, height: 0 }
                            }
                            transition={
                                isStatic
                                    ? { duration: 0 }
                                    : {
                                          duration: 0.26,

                                          ease: [0.16, 1, 0.3, 1],
                                      }
                            }
                            style={{ overflow: "hidden" }}
                        >
                            {/* Divider */}

                            <div
                                style={{
                                    display: "flex",

                                    alignItems: "center",

                                    gap: 8,

                                    marginBottom: 10,
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,

                                        height: 1,

                                        background: `linear-gradient(90deg,${withAlpha(col, "55")},transparent)`,
                                    }}
                                />

                                <span
                                    style={{
                                        fontFamily: "'Orbitron', sans-serif",

                                        fontSize: 8,

                                        fontWeight: 700,

                                        letterSpacing: "0.12em",

                                        textTransform: "uppercase" as const,

                                        color: col,
                                    }}
                                >
                                    INCLUDED
                                </span>

                                <div
                                    style={{
                                        flex: 1,

                                        height: 1,

                                        background: `linear-gradient(270deg,${withAlpha(col, "55")},transparent)`,
                                    }}
                                />
                            </div>

                            {/* Sub pills */}

                            <div
                                style={{
                                    display: "flex",

                                    flexDirection: "column",

                                    gap: 8,
                                }}
                            >
                                {subs.map((sub, si) => (
                                    <motion.div
                                        key={si}
                                        initial={
                                            isStatic
                                                ? false
                                                : { opacity: 0, y: 6 }
                                        }
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={
                                            isStatic
                                                ? { duration: 0 }
                                                : {
                                                      duration: 0.18,

                                                      delay: si * 0.04,
                                                  }
                                        }
                                        style={{
                                            padding: "10px 12px",

                                            borderRadius: 8,

                                            background:
                                                "rgba(255, 255, 255, 0.03)",

                                            border: `1px solid ${withAlpha(col, "35")}`,

                                            position: "relative",

                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",

                                                top: 0,

                                                left: 0,

                                                right: 0,

                                                height: 1,

                                                background: `linear-gradient(90deg,transparent,${withAlpha(col, "66")},transparent)`,
                                            }}
                                        />

                                        <div
                                            style={{
                                                display: "flex",

                                                alignItems: "center",

                                                justifyContent: "space-between",

                                                gap: 8,

                                                marginBottom: sub.detail
                                                    ? 4
                                                    : 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 13,

                                                    fontWeight: 700,

                                                    fontFamily:
                                                        "'Geist', -apple-system, sans-serif",

                                                    color: subTitleColor,

                                                    letterSpacing: "-0.01em",
                                                }}
                                            >
                                                {sub.name}
                                            </span>

                                            {sub.badge && (
                                                <span
                                                    style={{
                                                        fontSize: 8,

                                                        fontFamily:
                                                            "'Orbitron', monospace",

                                                        fontWeight: 700,

                                                        letterSpacing: "0.1em",

                                                        textTransform:
                                                            "uppercase" as const,

                                                        color: "#FFFFFF",

                                                        background: withAlpha(
                                                            col,

                                                            "35"
                                                        ),

                                                        border: `1px solid ${withAlpha(col, "70")}`,

                                                        padding: "2px 6px",

                                                        borderRadius: 4,

                                                        whiteSpace:
                                                            "nowrap" as const,
                                                    }}
                                                >
                                                    {sub.badge}
                                                </span>
                                            )}
                                        </div>

                                        {sub.detail && (
                                            <span
                                                style={{
                                                    fontSize: 12,

                                                    fontFamily:
                                                        "'Geist', -apple-system, sans-serif",

                                                    color: subDetailColor,

                                                    lineHeight: 1.5,

                                                    display: "block",
                                                }}
                                            >
                                                {sub.detail}
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CTA button */}

                {btnLabel && (
                    <a
                        href={safeUrl}
                        target={
                            safeUrl && safeUrl.startsWith("http")
                                ? "_blank"
                                : undefined
                        }
                        rel="noopener noreferrer"
                        onClick={(e) => {
                            e.stopPropagation()

                            if (!safeUrl) e.preventDefault()
                        }}
                        style={{
                            display: "inline-flex",

                            alignItems: "center",

                            gap: 8,

                            padding: "12px 20px",

                            borderRadius: 8,

                            background: open
                                ? col
                                : "rgba(255, 255, 255, 0.05)",

                            border: `1px solid ${open ? col : "rgba(255, 255, 255, 0.12)"}`,

                            color: open ? "#ffffff" : "#FFFFFF",

                            fontSize: 11.5,

                            fontWeight: 700,

                            fontFamily: "'Orbitron', sans-serif",

                            letterSpacing: "0.08em",

                            textTransform: "uppercase" as const,

                            textDecoration: "none",

                            transition: "all 0.22s ease",

                            userSelect: "none" as const,

                            alignSelf: "flex-start",

                            boxShadow: open
                                ? `0 6px 20px ${withAlpha(col, "50")}`
                                : "none",
                        }}
                    >
                        <span>{btnLabel}</span>

                        <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="5" y1="12" x2="19" y2="12" />

                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </a>
                )}
            </div>
        </motion.div>
    )
}

// ─── Main Exported Component ──────────────────────────────────────────────────

export interface ServiceSectionProps {
    layout?: {
        desktopCols?: number

        tabletCols?: number

        showScrews?: boolean

        showGrid?: boolean
    }

    theme?: {
        bgColor?: string

        globalAccent?: string

        showCenterGlow?: boolean

        glowOpacity?: number

        glowBlur?: number

        glowSize?: number

        subTitleColor?: string

        subDetailColor?: string
    }

    card1?: {
        c1Title?: string

        c1Summary?: string

        c1Icon?: string

        c1IconImage?: { src?: string; alt?: string } | string

        c1CustomSvg?: string

        c1Accent?: string

        c1S1k?: string

        c1S1v?: string

        c1S2k?: string

        c1S2v?: string

        c1Btn?: string

        c1Url?: string

        c1A1?: string

        c1A1d?: string

        c1A1b?: string

        c1A2?: string

        c1A2d?: string

        c1A2b?: string

        c1A3?: string

        c1A3d?: string

        c1A3b?: string

        c1A4?: string

        c1A4d?: string

        c1A4b?: string
    }

    card2?: {
        c2Title?: string

        c2Summary?: string

        c2Icon?: string

        c2IconImage?: { src?: string; alt?: string } | string

        c2CustomSvg?: string

        c2Accent?: string

        c2S1k?: string

        c2S1v?: string

        c2S2k?: string

        c2S2v?: string

        c2Btn?: string

        c2Url?: string

        c2A1?: string

        c2A1d?: string

        c2A1b?: string

        c2A2?: string

        c2A2d?: string

        c2A2b?: string

        c2A3?: string

        c2A3d?: string

        c2A3b?: string

        c2A4?: string

        c2A4d?: string

        c2A4b?: string
    }

    card3?: {
        c3Title?: string

        c3Summary?: string

        c3Icon?: string

        c3IconImage?: { src?: string; alt?: string } | string

        c3CustomSvg?: string

        c3Accent?: string

        c3S1k?: string

        c3S1v?: string

        c3S2k?: string

        c3S2v?: string

        c3Btn?: string

        c3Url?: string

        c3A1?: string

        c3A1d?: string

        c3A1b?: string

        c3A2?: string

        c3A2d?: string

        c3A2b?: string

        c3A3?: string

        c3A3d?: string

        c3A3b?: string

        c3A4?: string

        c3A4d?: string

        c3A4b?: string
    }

    card4?: {
        c4Title?: string

        c4Summary?: string

        c4Icon?: string

        c4IconImage?: { src?: string; alt?: string } | string

        c4CustomSvg?: string

        c4Accent?: string

        c4S1k?: string

        c4S1v?: string

        c4S2k?: string

        c4S2v?: string

        c4Btn?: string

        c4Url?: string

        c4A1?: string

        c4A1d?: string

        c4A1b?: string

        c4A2?: string

        c4A2d?: string

        c4A2b?: string

        c4A3?: string

        c4A3d?: string

        c4A3b?: string

        c4A4?: string

        c4A4d?: string

        c4A4b?: string
    }

    // Flat props for backward compatibility

    globalAccent?: string

    bgColor?: string

    desktopCols?: number

    tabletCols?: number

    showScrews?: boolean

    showGrid?: boolean

    showCenterGlow?: boolean

    glowOpacity?: number

    glowBlur?: number

    glowSize?: number

    subTitleColor?: string

    subDetailColor?: string

    // Card 1

    c1Title?: string

    c1Summary?: string

    c1Icon?: string

    c1IconImage?: { src?: string; alt?: string } | string

    c1CustomSvg?: string

    c1Accent?: string

    c1S1k?: string

    c1S1v?: string

    c1S2k?: string

    c1S2v?: string

    c1Btn?: string

    c1Url?: string

    c1A1?: string

    c1A1d?: string

    c1A1b?: string

    c1A2?: string

    c1A2d?: string

    c1A2b?: string

    c1A3?: string

    c1A3d?: string

    c1A3b?: string

    c1A4?: string

    c1A4d?: string

    c1A4b?: string

    // Card 2

    c2Title?: string

    c2Summary?: string

    c2Icon?: string

    c2IconImage?: { src?: string; alt?: string } | string

    c2CustomSvg?: string

    c2Accent?: string

    c2S1k?: string

    c2S1v?: string

    c2S2k?: string

    c2S2v?: string

    c2Btn?: string

    c2Url?: string

    c2A1?: string

    c2A1d?: string

    c2A1b?: string

    c2A2?: string

    c2A2d?: string

    c2A2b?: string

    c2A3?: string

    c2A3d?: string

    c2A3b?: string

    c2A4?: string

    c2A4d?: string

    c2A4b?: string

    // Card 3

    c3Title?: string

    c3Summary?: string

    c3Icon?: string

    c3IconImage?: { src?: string; alt?: string } | string

    c3CustomSvg?: string

    c3Accent?: string

    c3S1k?: string

    c3S1v?: string

    c3S2k?: string

    c3S2v?: string

    c3Btn?: string

    c3Url?: string

    c3A1?: string

    c3A1d?: string

    c3A1b?: string

    c3A2?: string

    c3A2d?: string

    c3A2b?: string

    c3A3?: string

    c3A3d?: string

    c3A3b?: string

    c3A4?: string

    c3A4d?: string

    c3A4b?: string

    // Card 4

    c4Title?: string

    c4Summary?: string

    c4Icon?: string

    c4IconImage?: { src?: string; alt?: string } | string

    c4CustomSvg?: string

    c4Accent?: string

    c4S1k?: string

    c4S1v?: string

    c4S2k?: string

    c4S2v?: string

    c4Btn?: string

    c4Url?: string

    c4A1?: string

    c4A1d?: string

    c4A1b?: string

    c4A2?: string

    c4A2d?: string

    c4A2b?: string

    c4A3?: string

    c4A3d?: string

    c4A3b?: string

    c4A4?: string

    c4A4d?: string

    c4A4b?: string

    _branding?: any

    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerLock
 * @framerImmutable
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ServiceSection(rawProps: ServiceSectionProps) {
    const isStatic = useIsStaticRenderer()

    const sectionRef = React.useRef<HTMLDivElement>(null)

    const isSectionInView = useInView(sectionRef, { amount: 0.05 })

    const layout = rawProps.layout || {}

    const theme = rawProps.theme || {}

    const card1 = rawProps.card1 || {}

    const card2 = rawProps.card2 || {}

    const card3 = rawProps.card3 || {}

    const card4 = rawProps.card4 || {}

    const desktopCols = layout.desktopCols ?? rawProps.desktopCols ?? 2

    const tabletCols = layout.tabletCols ?? rawProps.tabletCols ?? 2

    const showScrews = layout.showScrews ?? rawProps.showScrews ?? true

    const showGrid = layout.showGrid ?? rawProps.showGrid ?? true

    const bgColor = theme.bgColor ?? rawProps.bgColor ?? "#000000"

    const globalAccent =
        theme.globalAccent ?? rawProps.globalAccent ?? "#2962FF"

    const showCenterGlow =
        theme.showCenterGlow ?? rawProps.showCenterGlow ?? true

    const glowOpacity = theme.glowOpacity ?? rawProps.glowOpacity ?? 0.75

    const glowBlur = theme.glowBlur ?? rawProps.glowBlur ?? 90

    const glowSize = theme.glowSize ?? rawProps.glowSize ?? 1000

    const subTitleColor =
        theme.subTitleColor ?? rawProps.subTitleColor ?? "#ffffff"

    const subDetailColor =
        theme.subDetailColor ?? rawProps.subDetailColor ?? "#e4e4e7"

    // Card 1

    const c1Title =
        card1.c1Title ?? rawProps.c1Title ?? "Framer Web Development"

    const c1Summary =
        card1.c1Summary ??
        rawProps.c1Summary ??
        "Production-ready Framer builds with clean layer hierarchy, custom code overrides, and calibrated motion."

    const c1Icon = card1.c1Icon ?? rawProps.c1Icon ?? "framer"

    const c1IconImage = card1.c1IconImage ?? rawProps.c1IconImage

    const c1CustomSvg = card1.c1CustomSvg ?? rawProps.c1CustomSvg

    const c1Accent = card1.c1Accent ?? rawProps.c1Accent ?? "#2962FF"

    const c1S1k = card1.c1S1k ?? rawProps.c1S1k ?? "Starting"

    const c1S1v = card1.c1S1v ?? rawProps.c1S1v ?? "$1,600"

    const c1S2k = card1.c1S2k ?? rawProps.c1S2k ?? "Timeline"

    const c1S2v = card1.c1S2v ?? rawProps.c1S2v ?? "1–2 WEEKS"

    const c1Btn = card1.c1Btn ?? rawProps.c1Btn ?? "Start a project"

    const c1Url =
        card1.c1Url ?? rawProps.c1Url ?? "https://contra.com/mdrafat_bondz"

    const c1A1 = card1.c1A1 ?? rawProps.c1A1 ?? "High-Conversion Landing Pages"

    const c1A1d =
        card1.c1A1d ??
        rawProps.c1A1d ??
        "Conversion-focused single pages with motion."

    const c1A1b = card1.c1A1b ?? rawProps.c1A1b ?? "01"

    const c1A2 = card1.c1A2 ?? rawProps.c1A2 ?? "Full-Site Multi-Page Builds"

    const c1A2d =
        card1.c1A2d ??
        rawProps.c1A2d ??
        "Scalable page architecture from design to edge deployment."

    const c1A2b = card1.c1A2b ?? rawProps.c1A2b ?? "02"

    const c1A3 = card1.c1A3 ?? rawProps.c1A3 ?? "CMS & Dynamic Routing"

    const c1A3d =
        card1.c1A3d ??
        rawProps.c1A3d ??
        "Custom collection schemas and real-time filter views."

    const c1A3b = card1.c1A3b ?? rawProps.c1A3b ?? "03"

    const c1A4 = card1.c1A4 ?? rawProps.c1A4 ?? "Platform Migrations"

    const c1A4d =
        card1.c1A4d ??
        rawProps.c1A4d ??
        "Clean rebuilds from Webflow or WordPress to Framer."

    const c1A4b = card1.c1A4b ?? rawProps.c1A4b ?? "04"

    // Card 2

    const c2Title = card2.c2Title ?? rawProps.c2Title ?? "Product & UX Design"

    const c2Summary =
        card2.c2Summary ??
        rawProps.c2Summary ??
        "Interface architecture, design systems, and interactive prototypes for web apps, SaaS, and dashboards."

    const c2Icon = card2.c2Icon ?? rawProps.c2Icon ?? "layers"

    const c2IconImage = card2.c2IconImage ?? rawProps.c2IconImage

    const c2CustomSvg = card2.c2CustomSvg ?? rawProps.c2CustomSvg

    const c2Accent = card2.c2Accent ?? rawProps.c2Accent ?? "#A78BFA"

    const c2S1k = card2.c2S1k ?? rawProps.c2S1k ?? "Starting"

    const c2S1v = card2.c2S1v ?? rawProps.c2S1v ?? "$2,500"

    const c2S2k = card2.c2S2k ?? rawProps.c2S2k ?? "Timeline"

    const c2S2v = card2.c2S2v ?? rawProps.c2S2v ?? "2 WEEKS"

    const c2Btn = card2.c2Btn ?? rawProps.c2Btn ?? "Request scope"

    const c2Url =
        card2.c2Url ?? rawProps.c2Url ?? "https://contra.com/mdrafat_bondz"

    const c2A1 = card2.c2A1 ?? rawProps.c2A1 ?? "UX Research & User Flows"

    const c2A1d =
        card2.c2A1d ??
        rawProps.c2A1d ??
        "Information architecture and core user journeys."

    const c2A1b = card2.c2A1b ?? rawProps.c2A1b ?? "01"

    const c2A2 = card2.c2A2 ?? rawProps.c2A2 ?? "Design Systems in Figma"

    const c2A2d =
        card2.c2A2d ??
        rawProps.c2A2d ??
        "Scalable component libraries with semantic design tokens."

    const c2A2b = card2.c2A2b ?? rawProps.c2A2b ?? "02"

    const c2A3 = card2.c2A3 ?? rawProps.c2A3 ?? "Interactive Working Prototypes"

    const c2A3d =
        card2.c2A3d ??
        rawProps.c2A3d ??
        "Clickable prototypes for validation and stakeholder alignment."

    const c2A3b = card2.c2A3b ?? rawProps.c2A3b ?? "03"

    const c2A4 = card2.c2A4 ?? rawProps.c2A4 ?? "Developer Handoff"

    const c2A4d =
        card2.c2A4d ??
        rawProps.c2A4d ??
        "Tokenized component specs and engineering documentation."

    const c2A4b = card2.c2A4b ?? rawProps.c2A4b ?? "04"

    // Card 3

    const c3Title =
        card3.c3Title ?? rawProps.c3Title ?? "Full Stack: Design + Build"

    const c3Summary =
        card3.c3Summary ??
        rawProps.c3Summary ??
        "Unified delivery from concept to live URL. Strategy, Figma UI systems, and live Framer production."

    const c3Icon = card3.c3Icon ?? rawProps.c3Icon ?? "code"

    const c3IconImage = card3.c3IconImage ?? rawProps.c3IconImage

    const c3CustomSvg = card3.c3CustomSvg ?? rawProps.c3CustomSvg

    const c3Accent = card3.c3Accent ?? rawProps.c3Accent ?? "#34D399"

    const c3S1k = card3.c3S1k ?? rawProps.c3S1k ?? "Starting"

    const c3S1v = card3.c3S1v ?? rawProps.c3S1v ?? "$3,400"

    const c3S2k = card3.c3S2k ?? rawProps.c3S2k ?? "Timeline"

    const c3S2v = card3.c3S2v ?? rawProps.c3S2v ?? "2–3 WEEKS"

    const c3Btn = card3.c3Btn ?? rawProps.c3Btn ?? "Build proposal"

    const c3Url =
        card3.c3Url ?? rawProps.c3Url ?? "https://contra.com/mdrafat_bondz"

    const c3A1 = card3.c3A1 ?? rawProps.c3A1 ?? "Brand Strategy & Identity"

    const c3A1d =
        card3.c3A1d ??
        rawProps.c3A1d ??
        "Strategic narrative, type scales, and visual direction."

    const c3A1b = card3.c3A1b ?? rawProps.c3A1b ?? "01"

    const c3A2 = card3.c3A2 ?? rawProps.c3A2 ?? "Complete Product UI System"

    const c3A2d =
        card3.c3A2d ??
        rawProps.c3A2d ??
        "Figma design system paired directly with Framer components."

    const c3A2b = card3.c3A2b ?? rawProps.c3A2b ?? "02"

    const c3A3 = card3.c3A3 ?? rawProps.c3A3 ?? "Live Framer Production Build"

    const c3A3d =
        card3.c3A3d ??
        rawProps.c3A3d ??
        "Edge-hosted deployment with custom domain, SEO, and analytics."

    const c3A3b = card3.c3A3b ?? rawProps.c3A3b ?? "03"

    const c3A4 = card3.c3A4 ?? rawProps.c3A4 ?? "Direct Collaboration"

    const c3A4d =
        card3.c3A4d ??
        rawProps.c3A4d ??
        "Dedicated Slack/Trello channel with async revision rounds."

    const c3A4b = card3.c3A4b ?? rawProps.c3A4b ?? "04"

    // Card 4

    const c4Title =
        card4.c4Title ?? rawProps.c4Title ?? "Creative Tech & AI Interfaces"

    const c4Summary =
        card4.c4Summary ??
        rawProps.c4Summary ??
        "Physics-driven interfaces, custom interaction tools, and automated agentic workflow integrations."

    const c4Icon = card4.c4Icon ?? rawProps.c4Icon ?? "bot"

    const c4IconImage = card4.c4IconImage ?? rawProps.c4IconImage

    const c4CustomSvg = card4.c4CustomSvg ?? rawProps.c4CustomSvg

    const c4Accent = card4.c4Accent ?? rawProps.c4Accent ?? "#F97316"

    const c4S1k = card4.c4S1k ?? rawProps.c4S1k ?? "Starting"

    const c4S1v = card4.c4S1v ?? rawProps.c4S1v ?? "$1,500"

    const c4S2k = card4.c4S2k ?? rawProps.c4S2k ?? "Timeline"

    const c4S2v = card4.c4S2v ?? rawProps.c4S2v ?? "1 WEEK"

    const c4Btn = card4.c4Btn ?? rawProps.c4Btn ?? "Explore case studies"

    const c4Url =
        card4.c4Url ?? rawProps.c4Url ?? "https://www.mdrafat.com/works"

    const c4A1 = card4.c4A1 ?? rawProps.c4A1 ?? "Physics & Constellation UI"

    const c4A1d =
        card4.c4A1d ??
        rawProps.c4A1d ??
        "Dynamic talent discovery and real-time visualizers."

    const c4A1b = card4.c4A1b ?? rawProps.c4A1b ?? "01"

    const c4A2 = card4.c4A2 ?? rawProps.c4A2 ?? "Skeuomorphic Instruments"

    const c4A2d =
        card4.c4A2d ??
        rawProps.c4A2d ??
        "Custom synthesizer terminals and sequencer interfaces."

    const c4A2b = card4.c4A2b ?? rawProps.c4A2b ?? "02"

    const c4A3 = card4.c4A3 ?? rawProps.c4A3 ?? "Agentic Workflow Systems"

    const c4A3d =
        card4.c4A3d ??
        rawProps.c4A3d ??
        "Tooling architectures, automation pipelines, and API integrations."

    const c4A3b = card4.c4A3b ?? rawProps.c4A3b ?? "03"

    const c4A4 = card4.c4A4 ?? rawProps.c4A4 ?? "Rapid Prototyping Sprints"

    const c4A4d =
        card4.c4A4d ??
        rawProps.c4A4d ??
        "High-velocity testbeds built for makeathons and pitches."

    const c4A4b = card4.c4A4b ?? rawProps.c4A4b ?? "04"

    const style = rawProps.style

    const [cols, setCols] = React.useState(desktopCols || 2)

    const [isTouch, setIsTouch] = React.useState(false)

    const [isTabOrPhone, setIsTabOrPhone] = React.useState(false)

    const [currentAccent, setCurrentAccent] = React.useState<string>(
        c1Accent || globalAccent || "#2962FF"
    )

    const patternId = React.useId ? React.useId().replace(/:/g, "") : "ss-pcb"

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const isCoarse = window.matchMedia(
                "(hover:none) and (pointer:coarse)"
            ).matches

            setIsTouch(isCoarse)

            setIsTabOrPhone(isCoarse || window.innerWidth < 1024)
        }
    }, [])

    React.useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        function calc() {
            const w = window.innerWidth

            const isNarrow = w < 1024

            const isCoarse = window.matchMedia(
                "(hover:none) and (pointer:coarse)"
            ).matches

            setCols(w < 640 ? 1 : w < 1024 ? tabletCols || 2 : desktopCols || 2)

            setIsTouch(isCoarse)

            setIsTabOrPhone(isCoarse || isNarrow)
        }

        calc()

        let raf = 0

        function h() {
            cancelAnimationFrame(raf)

            raf = requestAnimationFrame(calc)
        }

        window.addEventListener("resize", h)

        return () => {
            window.removeEventListener("resize", h)

            cancelAnimationFrame(raf)
        }
    }, [desktopCols, tabletCols])

    const bg = bgColor || "#000000"

    const cards = [
        {
            title: c1Title,

            summary: c1Summary,

            icon: c1Icon,

            iconImage: c1IconImage,

            customSvg: c1CustomSvg,

            accent: c1Accent,

            s1k: c1S1k,

            s1v: c1S1v,

            s2k: c1S2k,

            s2v: c1S2v,

            btn: c1Btn,

            url: c1Url,

            a1: c1A1,

            a1d: c1A1d,

            a1b: c1A1b,

            a2: c1A2,

            a2d: c1A2d,

            a2b: c1A2b,

            a3: c1A3,

            a3d: c1A3d,

            a3b: c1A3b,

            a4: c1A4,

            a4d: c1A4d,

            a4b: c1A4b,
        },

        {
            title: c2Title,

            summary: c2Summary,

            icon: c2Icon,

            iconImage: c2IconImage,

            customSvg: c2CustomSvg,

            accent: c2Accent,

            s1k: c2S1k,

            s1v: c2S1v,

            s2k: c2S2k,

            s2v: c2S2v,

            btn: c2Btn,

            url: c2Url,

            a1: c2A1,

            a1d: c2A1d,

            a1b: c2A1b,

            a2: c2A2,

            a2d: c2A2d,

            a2b: c2A2b,

            a3: c2A3,

            a3d: c2A3d,

            a3b: c2A3b,

            a4: c2A4,

            a4d: c2A4d,

            a4b: c2A4b,
        },

        {
            title: c3Title,

            summary: c3Summary,

            icon: c3Icon,

            iconImage: c3IconImage,

            customSvg: c3CustomSvg,

            accent: c3Accent,

            s1k: c3S1k,

            s1v: c3S1v,

            s2k: c3S2k,

            s2v: c3S2v,

            btn: c3Btn,

            url: c3Url,

            a1: c3A1,

            a1d: c3A1d,

            a1b: c3A1b,

            a2: c3A2,

            a2d: c3A2d,

            a2b: c3A2b,

            a3: c3A3,

            a3d: c3A3d,

            a3b: c3A3b,

            a4: c3A4,

            a4d: c3A4d,

            a4b: c3A4b,
        },

        {
            title: c4Title,

            summary: c4Summary,

            icon: c4Icon,

            iconImage: c4IconImage,

            customSvg: c4CustomSvg,

            accent: c4Accent,

            s1k: c4S1k,

            s1v: c4S1v,

            s2k: c4S2k,

            s2v: c4S2v,

            btn: c4Btn,

            url: c4Url,

            a1: c4A1,

            a1d: c4A1d,

            a1b: c4A1b,

            a2: c4A2,

            a2d: c4A2d,

            a2b: c4A2b,

            a3: c4A3,

            a3d: c4A3d,

            a3b: c4A3b,

            a4: c4A4,

            a4d: c4A4d,

            a4b: c4A4b,
        },
    ].filter((c) => c.title && c.title.trim() !== "")

    return (
        <div
            ref={sectionRef}
            style={{
                ...style,

                position: "relative",

                width: "100%",

                minHeight: isStatic ? 500 : undefined,

                backgroundColor: bg,

                overflow: "hidden",

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                padding: "24px 20px 48px",

                boxSizing: "border-box",

                color: "#fff",
            }}
        >
            {/* PCB dot grid */}

            {showGrid && (
                <svg
                    style={{
                        position: "absolute",

                        inset: 0,

                        width: "100%",

                        height: "100%",

                        pointerEvents: "none",

                        zIndex: 0,
                    }}
                    aria-hidden="true"
                >
                    <defs>
                        <pattern
                            id={`ss-pcb-${patternId}`}
                            width="32"
                            height="32"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle
                                cx="2"
                                cy="2"
                                r="0.55"
                                fill="rgba(255,255,255,0.025)"
                            />
                        </pattern>
                    </defs>

                    <rect
                        width="100%"
                        height="100%"
                        fill={`url(#ss-pcb-${patternId})`}
                    />
                </svg>
            )}

            {/* Dynamic Moving Shader Center Glow - static fallback for static renderer */}

            {showCenterGlow &&
                (isStatic ? (
                    <div
                        style={{
                            position: "absolute",

                            top: "50%",

                            left: "50%",

                            transform: "translate(-50%, -50%)",

                            width: glowSize,

                            height: Math.round(glowSize * 0.58),

                            background: `radial-gradient(ellipse at 50% 50%, ${withAlpha(currentAccent, "66")} 0%, ${withAlpha(currentAccent, "30")} 45%, transparent 75%)`,

                            pointerEvents: "none",

                            filter: `blur(${glowBlur}px)`,

                            opacity: glowOpacity,

                            zIndex: 0,
                        }}
                    />
                ) : (
                    <motion.div
                        animate={{
                            scale: [1, 1.15, 0.95, 1],

                            opacity: [
                                glowOpacity * 0.7,

                                glowOpacity,

                                glowOpacity * 0.82,

                                glowOpacity * 0.7,
                            ],

                            x: ["-50%", "-48%", "-52%", "-50%"],

                            y: ["-50%", "-46%", "-54%", "-50%"],
                        }}
                        transition={{
                            duration: 7,

                            repeat: isSectionInView ? Infinity : 0,

                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",

                            top: "50%",

                            left: "50%",

                            width: glowSize,

                            height: Math.round(glowSize * 0.58),

                            background: `radial-gradient(ellipse at 50% 50%, ${withAlpha(currentAccent, "66")} 0%, ${withAlpha(currentAccent, "30")} 45%, transparent 75%)`,

                            pointerEvents: "none",

                            filter: `blur(${glowBlur}px)`,

                            zIndex: 0,

                            transition: "background 0.45s ease",
                        }}
                    />
                ))}

            {/* Card grid */}

            <div
                style={{
                    position: "relative",

                    zIndex: 2,

                    width: "100%",

                    maxWidth: 1200,

                    display: "grid",

                    gridTemplateColumns: `repeat(${cols},1fr)`,

                    gap: cols === 1 ? 16 : 24,
                }}
            >
                {cards.map((c, i) => (
                    <Card
                        key={i}
                        index={i}
                        isStatic={isStatic}
                        title={c.title || ""}
                        summary={c.summary || ""}
                        iconName={c.icon || "diamond"}
                        iconImage={c.iconImage}
                        customSvg={c.customSvg}
                        accent={c.accent || globalAccent}
                        stat1Key={c.s1k || ""}
                        stat1Val={c.s1v || ""}
                        stat2Key={c.s2k || ""}
                        stat2Val={c.s2v || ""}
                        btnLabel={c.btn || ""}
                        btnUrl={c.url || ""}
                        sub1Name={c.a1 || ""}
                        sub1Detail={c.a1d || ""}
                        sub1Badge={c.a1b || ""}
                        sub2Name={c.a2 || ""}
                        sub2Detail={c.a2d || ""}
                        sub2Badge={c.a2b || ""}
                        sub3Name={c.a3 || ""}
                        sub3Detail={c.a3d || ""}
                        sub3Badge={c.a3b || ""}
                        sub4Name={c.a4 || ""}
                        sub4Detail={c.a4d || ""}
                        sub4Badge={c.a4b || ""}
                        showScrews={showScrews}
                        isTouch={isTouch}
                        isTabOrPhone={isTabOrPhone}
                        subTitleColor={subTitleColor}
                        subDetailColor={subDetailColor}
                        onHoverState={(hovered, cardAccent) => {
                            if (hovered) {
                                setCurrentAccent(cardAccent)
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

// ─── Controls ─────────────────────────────────────────────────────────────────

const ICONS = [
    "framer",

    "diamond",

    "bot",

    "lightning",

    "chart",

    "shield",

    "cpu",

    "terminal",

    "sparkles",

    "code",

    "globe",

    "layers",

    "rocket",

    "star",
]

const ICON_LABELS = [
    "Framer",

    "Diamond",

    "Bot",

    "Lightning",

    "Chart",

    "Shield",

    "CPU",

    "Terminal",

    "Sparkles",

    "Code",

    "Globe",

    "Layers",

    "Rocket",

    "Star",
]

addPropertyControls(ServiceSection, {
    // ════ GROUP 1: LAYOUT & GRID ═════════════════════════════════════════════

    layout: {
        type: ControlType.Object,

        title: "Layout & Grid",

        controls: {
            desktopCols: {
                type: ControlType.Number,

                title: "Cols Desktop",

                min: 1,

                max: 4,

                step: 1,

                defaultValue: 2,
            },

            tabletCols: {
                type: ControlType.Number,

                title: "Cols Tablet",

                min: 1,

                max: 3,

                step: 1,

                defaultValue: 2,
            },

            showScrews: {
                type: ControlType.Boolean,

                title: "Screws",

                defaultValue: true,
            },

            showGrid: {
                type: ControlType.Boolean,

                title: "PCB Grid",

                defaultValue: true,
            },
        },
    },

    // ════ GROUP 2: COLORS & ATMOSPHERE ══════════════════════════════════════

    theme: {
        type: ControlType.Object,

        title: "Colors & Atmosphere",

        controls: {
            bgColor: {
                type: ControlType.Color,

                title: "Background",

                defaultValue: "#000000",
            },

            globalAccent: {
                type: ControlType.Color,

                title: "Global Accent",

                defaultValue: "#2962FF",
            },

            // ─── Center Shader Glow Controls ───,

            showCenterGlow: {
                type: ControlType.Boolean,

                title: "Center Glow",

                defaultValue: true,
            },

            glowOpacity: {
                type: ControlType.Number,

                title: "Glow Opacity",

                min: 0,

                max: 1,

                step: 0.05,

                displayStepper: true,

                defaultValue: 0.75,

                hidden: (props) => !props.showCenterGlow,
            },

            glowBlur: {
                type: ControlType.Number,

                title: "Glow Blur",

                min: 20,

                max: 200,

                step: 5,

                unit: "px",

                defaultValue: 90,

                hidden: (props) => !props.showCenterGlow,
            },

            glowSize: {
                type: ControlType.Number,

                title: "Glow Size",

                min: 400,

                max: 1600,

                step: 50,

                unit: "px",

                defaultValue: 1000,

                hidden: (props) => !props.showCenterGlow,
            },

            subTitleColor: {
                type: ControlType.Color,

                title: "Sub Title Color",

                defaultValue: "#ffffff",
            },

            subDetailColor: {
                type: ControlType.Color,

                title: "Sub Detail Color",

                defaultValue: "#e4e4e7",
            },

            // ─── Card 1 ───,
        },
    },

    // ════ GROUP 3: CARD 01 (Framer Web Development) ══════════════════════════

    card1: {
        type: ControlType.Object,

        title: "Card 01 — Service",

        controls: {
            c1Title: {
                type: ControlType.String,

                title: "① Title",

                defaultValue: "Framer Web Development",
            },

            c1Summary: {
                type: ControlType.String,

                title: "① Summary",

                defaultValue:
                    "Production-ready Framer builds with clean layer hierarchy, custom code overrides, and calibrated motion.",

                displayTextArea: true,
            },

            c1Icon: {
                type: ControlType.Enum,

                title: "① Preset Icon",

                options: ICONS,

                optionTitles: ICON_LABELS,

                defaultValue: "framer",
            },

            c1IconImage: {
                type: ControlType.ResponsiveImage,

                title: "① Upload Icon",
            },

            c1CustomSvg: {
                type: ControlType.String,

                title: "① Custom SVG (Sanitized)",

                description:
                    "Strict allowlist: path, circle, rect, line, polyline, polygon, g",

                placeholder: "<svg ...>...</svg>",

                displayTextArea: true,

                optional: true,
            },

            c1Accent: {
                type: ControlType.Color,

                title: "① Accent",

                defaultValue: "#2962FF",
            },

            c1S1k: {
                type: ControlType.String,

                title: "① Stat 1 Label",

                defaultValue: "Starting",
            },

            c1S1v: {
                type: ControlType.String,

                title: "① Stat 1 Value",

                defaultValue: "$1,600",
            },

            c1S2k: {
                type: ControlType.String,

                title: "① Stat 2 Label",

                defaultValue: "Timeline",
            },

            c1S2v: {
                type: ControlType.String,

                title: "① Stat 2 Value",

                defaultValue: "1–2 WEEKS",
            },

            c1Btn: {
                type: ControlType.String,

                title: "① Button Label",

                defaultValue: "Start a project",
            },

            c1Url: {
                type: ControlType.String,

                title: "① Button URL",

                defaultValue: "https://contra.com/mdrafat_bondz",
            },

            c1A1: {
                type: ControlType.String,

                title: "① Sub 1 Name",

                defaultValue: "High-Conversion Landing Pages",
            },

            c1A1d: {
                type: ControlType.String,

                title: "① Sub 1 Detail",

                defaultValue: "Conversion-focused single pages with motion.",

                displayTextArea: true,
            },

            c1A1b: {
                type: ControlType.String,

                title: "① Sub 1 Badge",

                defaultValue: "01",
            },

            c1A2: {
                type: ControlType.String,

                title: "① Sub 2 Name",

                defaultValue: "Full-Site Multi-Page Builds",
            },

            c1A2d: {
                type: ControlType.String,

                title: "① Sub 2 Detail",

                defaultValue:
                    "Scalable page architecture from design to edge deployment.",

                displayTextArea: true,
            },

            c1A2b: {
                type: ControlType.String,

                title: "① Sub 2 Badge",

                defaultValue: "02",
            },

            c1A3: {
                type: ControlType.String,

                title: "① Sub 3 Name",

                defaultValue: "CMS & Dynamic Routing",
            },

            c1A3d: {
                type: ControlType.String,

                title: "① Sub 3 Detail",

                defaultValue:
                    "Custom collection schemas and real-time filter views.",

                displayTextArea: true,
            },

            c1A3b: {
                type: ControlType.String,

                title: "① Sub 3 Badge",

                defaultValue: "03",
            },

            c1A4: {
                type: ControlType.String,

                title: "① Sub 4 Name",

                defaultValue: "Platform Migrations",
            },

            c1A4d: {
                type: ControlType.String,

                title: "① Sub 4 Detail",

                defaultValue:
                    "Clean rebuilds from Webflow or WordPress to Framer.",

                displayTextArea: true,
            },

            c1A4b: {
                type: ControlType.String,

                title: "① Sub 4 Badge",

                defaultValue: "04",
            },

            // ─── Card 2 ───,
        },
    },

    // ════ GROUP 4: CARD 02 (Product & UX Design) ═════════════════════════════

    card2: {
        type: ControlType.Object,

        title: "Card 02 — Service",

        controls: {
            c2Title: {
                type: ControlType.String,

                title: "② Title",

                defaultValue: "Product & UX Design",
            },

            c2Summary: {
                type: ControlType.String,

                title: "② Summary",

                defaultValue:
                    "Interface architecture, design systems, and interactive prototypes for web apps, SaaS, and dashboards.",

                displayTextArea: true,
            },

            c2Icon: {
                type: ControlType.Enum,

                title: "② Preset Icon",

                options: ICONS,

                optionTitles: ICON_LABELS,

                defaultValue: "layers",
            },

            c2IconImage: {
                type: ControlType.ResponsiveImage,

                title: "② Upload Icon",
            },

            c2CustomSvg: {
                type: ControlType.String,

                title: "② Custom SVG (Sanitized)",

                description:
                    "Strict allowlist: path, circle, rect, line, polyline, polygon, g",

                placeholder: "<svg ...>...</svg>",

                displayTextArea: true,

                optional: true,
            },

            c2Accent: {
                type: ControlType.Color,

                title: "② Accent",

                defaultValue: "#A78BFA",
            },

            c2S1k: {
                type: ControlType.String,

                title: "② Stat 1 Label",

                defaultValue: "Starting",
            },

            c2S1v: {
                type: ControlType.String,

                title: "② Stat 1 Value",

                defaultValue: "$2,500",
            },

            c2S2k: {
                type: ControlType.String,

                title: "② Stat 2 Label",

                defaultValue: "Timeline",
            },

            c2S2v: {
                type: ControlType.String,

                title: "② Stat 2 Value",

                defaultValue: "2 WEEKS",
            },

            c2Btn: {
                type: ControlType.String,

                title: "② Button Label",

                defaultValue: "Request scope",
            },

            c2Url: {
                type: ControlType.String,

                title: "② Button URL",

                defaultValue: "https://contra.com/mdrafat_bondz",
            },

            c2A1: {
                type: ControlType.String,

                title: "② Sub 1 Name",

                defaultValue: "UX Research & User Flows",
            },

            c2A1d: {
                type: ControlType.String,

                title: "② Sub 1 Detail",

                defaultValue:
                    "Information architecture and core user journeys.",

                displayTextArea: true,
            },

            c2A1b: {
                type: ControlType.String,

                title: "② Sub 1 Badge",

                defaultValue: "01",
            },

            c2A2: {
                type: ControlType.String,

                title: "② Sub 2 Name",

                defaultValue: "Design Systems in Figma",
            },

            c2A2d: {
                type: ControlType.String,

                title: "② Sub 2 Detail",

                defaultValue:
                    "Scalable component libraries with semantic design tokens.",

                displayTextArea: true,
            },

            c2A2b: {
                type: ControlType.String,

                title: "② Sub 2 Badge",

                defaultValue: "02",
            },

            c2A3: {
                type: ControlType.String,

                title: "② Sub 3 Name",

                defaultValue: "Interactive Working Prototypes",
            },

            c2A3d: {
                type: ControlType.String,

                title: "② Sub 3 Detail",

                defaultValue:
                    "Clickable prototypes for validation and stakeholder alignment.",

                displayTextArea: true,
            },

            c2A3b: {
                type: ControlType.String,

                title: "② Sub 3 Badge",

                defaultValue: "03",
            },

            c2A4: {
                type: ControlType.String,

                title: "② Sub 4 Name",

                defaultValue: "Developer Handoff",
            },

            c2A4d: {
                type: ControlType.String,

                title: "② Sub 4 Detail",

                defaultValue:
                    "Tokenized component specs and engineering documentation.",

                displayTextArea: true,
            },

            c2A4b: {
                type: ControlType.String,

                title: "② Sub 4 Badge",

                defaultValue: "04",
            },

            // ─── Card 3 ───,
        },
    },

    // ════ GROUP 5: CARD 03 (Full Stack: Design + Build) ══════════════════════

    card3: {
        type: ControlType.Object,

        title: "Card 03 — Service",

        controls: {
            c3Title: {
                type: ControlType.String,

                title: "③ Title",

                defaultValue: "Full Stack: Design + Build",
            },

            c3Summary: {
                type: ControlType.String,

                title: "③ Summary",

                defaultValue:
                    "Unified delivery from concept to live URL. Strategy, Figma UI systems, and live Framer production.",

                displayTextArea: true,
            },

            c3Icon: {
                type: ControlType.Enum,

                title: "③ Preset Icon",

                options: ICONS,

                optionTitles: ICON_LABELS,

                defaultValue: "code",
            },

            c3IconImage: {
                type: ControlType.ResponsiveImage,

                title: "③ Upload Icon",
            },

            c3CustomSvg: {
                type: ControlType.String,

                title: "③ Custom SVG (Sanitized)",

                description:
                    "Strict allowlist: path, circle, rect, line, polyline, polygon, g",

                placeholder: "<svg ...>...</svg>",

                displayTextArea: true,

                optional: true,
            },

            c3Accent: {
                type: ControlType.Color,

                title: "③ Accent",

                defaultValue: "#34D399",
            },

            c3S1k: {
                type: ControlType.String,

                title: "③ Stat 1 Label",

                defaultValue: "Starting",
            },

            c3S1v: {
                type: ControlType.String,

                title: "③ Stat 1 Value",

                defaultValue: "$3,400",
            },

            c3S2k: {
                type: ControlType.String,

                title: "③ Stat 2 Label",

                defaultValue: "Timeline",
            },

            c3S2v: {
                type: ControlType.String,

                title: "③ Stat 2 Value",

                defaultValue: "2–3 WEEKS",
            },

            c3Btn: {
                type: ControlType.String,

                title: "③ Button Label",

                defaultValue: "Build proposal",
            },

            c3Url: {
                type: ControlType.String,

                title: "③ Button URL",

                defaultValue: "https://contra.com/mdrafat_bondz",
            },

            c3A1: {
                type: ControlType.String,

                title: "③ Sub 1 Name",

                defaultValue: "Brand Strategy & Identity",
            },

            c3A1d: {
                type: ControlType.String,

                title: "③ Sub 1 Detail",

                defaultValue:
                    "Strategic narrative, type scales, and visual direction.",

                displayTextArea: true,
            },

            c3A1b: {
                type: ControlType.String,

                title: "③ Sub 1 Badge",

                defaultValue: "01",
            },

            c3A2: {
                type: ControlType.String,

                title: "③ Sub 2 Name",

                defaultValue: "Complete Product UI System",
            },

            c3A2d: {
                type: ControlType.String,

                title: "③ Sub 2 Detail",

                defaultValue:
                    "Figma design system paired directly with Framer components.",

                displayTextArea: true,
            },

            c3A2b: {
                type: ControlType.String,

                title: "③ Sub 2 Badge",

                defaultValue: "02",
            },

            c3A3: {
                type: ControlType.String,

                title: "③ Sub 3 Name",

                defaultValue: "Live Framer Production Build",
            },

            c3A3d: {
                type: ControlType.String,

                title: "③ Sub 3 Detail",

                defaultValue:
                    "Edge-hosted deployment with custom domain, SEO, and analytics.",

                displayTextArea: true,
            },

            c3A3b: {
                type: ControlType.String,

                title: "③ Sub 3 Badge",

                defaultValue: "03",
            },

            c3A4: {
                type: ControlType.String,

                title: "③ Sub 4 Name",

                defaultValue: "Direct Collaboration",
            },

            c3A4d: {
                type: ControlType.String,

                title: "③ Sub 4 Detail",

                defaultValue:
                    "Dedicated Slack/Trello channel with async revision rounds.",

                displayTextArea: true,
            },

            c3A4b: {
                type: ControlType.String,

                title: "③ Sub 4 Badge",

                defaultValue: "04",
            },

            // ─── Card 4 ───,
        },
    },

    // ════ GROUP 6: CARD 04 (Creative Tech & AI Interfaces) ═══════════════════

    card4: {
        type: ControlType.Object,

        title: "Card 04 — Service",

        description:
            "Built by [Mohammad Rafat](https://www.mdrafat.com)\nMore components at [Framer Marketplace](https://www.framer.com/marketplace/creator/mdrafat)",

        controls: {
            c4Title: {
                type: ControlType.String,

                title: "④ Title",

                defaultValue: "Creative Tech & AI Interfaces",
            },

            c4Summary: {
                type: ControlType.String,

                title: "④ Summary",

                defaultValue:
                    "Physics-driven interfaces, custom interaction tools, and automated agentic workflow integrations.",

                displayTextArea: true,
            },

            c4Icon: {
                type: ControlType.Enum,

                title: "④ Preset Icon",

                options: ICONS,

                optionTitles: ICON_LABELS,

                defaultValue: "bot",
            },

            c4IconImage: {
                type: ControlType.ResponsiveImage,

                title: "④ Upload Icon",
            },

            c4CustomSvg: {
                type: ControlType.String,

                title: "④ Custom SVG (Sanitized)",

                description:
                    "Strict allowlist: path, circle, rect, line, polyline, polygon, g",

                placeholder: "<svg ...>...</svg>",

                displayTextArea: true,

                optional: true,
            },

            c4Accent: {
                type: ControlType.Color,

                title: "④ Accent",

                defaultValue: "#F97316",
            },

            c4S1k: {
                type: ControlType.String,

                title: "④ Stat 1 Label",

                defaultValue: "Starting",
            },

            c4S1v: {
                type: ControlType.String,

                title: "④ Stat 1 Value",

                defaultValue: "$1,500",
            },

            c4S2k: {
                type: ControlType.String,

                title: "④ Stat 2 Label",

                defaultValue: "Timeline",
            },

            c4S2v: {
                type: ControlType.String,

                title: "④ Stat 2 Value",

                defaultValue: "1 WEEK",
            },

            c4Btn: {
                type: ControlType.String,

                title: "④ Button Label",

                defaultValue: "Explore case studies",
            },

            c4Url: {
                type: ControlType.String,

                title: "④ Button URL",

                defaultValue: "https://www.mdrafat.com/works",
            },

            c4A1: {
                type: ControlType.String,

                title: "④ Sub 1 Name",

                defaultValue: "Physics & Constellation UI",
            },

            c4A1d: {
                type: ControlType.String,

                title: "④ Sub 1 Detail",

                defaultValue:
                    "Dynamic talent discovery and real-time visualizers.",

                displayTextArea: true,
            },

            c4A1b: {
                type: ControlType.String,

                title: "④ Sub 1 Badge",

                defaultValue: "01",
            },

            c4A2: {
                type: ControlType.String,

                title: "④ Sub 2 Name",

                defaultValue: "Skeuomorphic Instruments",
            },

            c4A2d: {
                type: ControlType.String,

                title: "④ Sub 2 Detail",

                defaultValue:
                    "Custom synthesizer terminals and sequencer interfaces.",

                displayTextArea: true,
            },

            c4A2b: {
                type: ControlType.String,

                title: "④ Sub 2 Badge",

                defaultValue: "02",
            },

            c4A3: {
                type: ControlType.String,

                title: "④ Sub 3 Name",

                defaultValue: "Agentic Workflow Systems",
            },

            c4A3d: {
                type: ControlType.String,

                title: "④ Sub 3 Detail",

                defaultValue:
                    "Tooling architectures, automation pipelines, and API integrations.",

                displayTextArea: true,
            },

            c4A3b: {
                type: ControlType.String,

                title: "④ Sub 3 Badge",

                defaultValue: "03",
            },

            c4A4: {
                type: ControlType.String,

                title: "④ Sub 4 Name",

                defaultValue: "Rapid Prototyping Sprints",
            },

            c4A4d: {
                type: ControlType.String,

                title: "④ Sub 4 Detail",

                defaultValue:
                    "High-velocity testbeds built for makeathons and pitches.",

                displayTextArea: true,
            },

            c4A4b: {
                type: ControlType.String,

                title: "④ Sub 4 Badge",

                defaultValue: "04",
            },
        },
    },

    // ════ BOTTOM BRANDING & CREDITS (FRAMER UNIVERSITY STYLE) ════════════════
    _branding: {
        type: ControlType.Object,
        title: "Framer Marketplace",
        description:
            "Built by [Mohammad Rafat](https://www.mdrafat.com)\n\nMore components at [Framer Marketplace](https://www.framer.com/marketplace/creator/mdrafat)",
        controls: {},
    },
})
