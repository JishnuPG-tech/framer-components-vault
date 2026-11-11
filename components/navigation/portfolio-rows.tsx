import * as React from "react"
// @ts-ignore Framer supplies this runtime module; its editor declarations may be unavailable.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion, useTransform } from "framer-motion"

type ProjectImage = { src?: string; srcSet?: string; alt?: string }
type Project = { title?: string; category?: string; number?: string; image?: ProjectImage; link?: string }
interface Props {
    settings?: "list" | "preview" | "motion" | "mobile" | "editor"
    advanced?: boolean
    projects?: Project[]
    background?: string; textColor?: string; mutedColor?: string; lineColor?: string; hoverColor?: string
    titleFont?: React.CSSProperties; detailFont?: React.CSSProperties
    titleSize?: number; mobileTitleSize?: number; rowPadding?: number; gutter?: number
    previewWidth?: number; previewRatio?: number; previewRadius?: number; previewShadow?: boolean
    allowOverflow?: boolean
    previewTilt?: number; previewOffset?: number; followStiffness?: number; followDamping?: number
    transitionTime?: number; transitionStyle?: "slide" | "fade" | "zoom" | "blur"
    hoverShift?: number; inactiveOpacity?: number; enableHover?: boolean
    mobileBreakpoint?: number; mobileMode?: "tap" | "all"; showNumbers?: boolean
    canvasPreview?: boolean; canvasProject?: number; style?: React.CSSProperties
}
const samples: Project[] = [{"title":"Fieldwork","image":{"src":"https://framerusercontent.com/assets/QOLM1Viy7i9uPAUHKsTnb3aJE.png","alt":"Skater crossing a vivid wildflower field"},"category":"","number":""},{"title":"Afterimage","image":{"src":"https://framerusercontent.com/assets/6JRVxrWi9g9CAdumAYN3Bdew.png","alt":"Sculptural blue botanical silhouette"},"category":"","number":""},{"title":"Common Ground","image":{"src":"https://framerusercontent.com/assets/12yzuMWOuyhMq2pXyVdNjPIBj0.png","alt":"Motion-blurred skater in a sunlit concrete landscape"},"category":"","number":""},{"title":"Soft Focus","image":{"src":"https://framerusercontent.com/assets/uZra5hcBvcZrqjtYzGEKzOezGY.png","alt":"Sculptural soft clouds against a clear blue sky"},"category":"","number":""}]
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]
const titleDefault: { fontSelector: string; fontSize?: number; fontWeight?: number } = {"fontSelector":"FR;InterDisplay"}
const detailDefault = {"fontFamily":"Inter","fontSize":"16px","lineHeight":"1.65em","letterSpacing":"0em","fontWeight":400}
// Portable defaults do not depend on the source project's color styles.
const defaults = {
    projects: samples,
    settings: "list",
    advanced: false,
    showNumbers: true,
    titleFont: titleDefault,
    titleSize: 40,
    textColor: "rgb(255, 255, 255)",
    background: "rgb(0, 0, 0)",
    lineColor: "rgba(255, 255, 255, 0.12)",
    rowPadding: 30,
    gutter: 32,
    detailFont: detailDefault,
    mutedColor: "rgb(255, 255, 255)",
    enableHover: true,
    previewWidth: 350,
    previewRatio: 1.34,
    previewRadius: 6,
    previewShadow: true,
    allowOverflow: true,
    previewTilt: 0,
    previewOffset: 32,
    transitionStyle: "blur",
    transitionTime: 0.38,
    hoverColor: "rgb(255, 255, 255)",
    hoverShift: 14,
    inactiveOpacity: 0.42,
    followStiffness: 210,
    followDamping: 30,
    mobileMode: "tap",
    mobileTitleSize: 32,
    mobileBreakpoint: 640,
    canvasPreview: false,
    canvasProject: 1,
} satisfies Props
function safeColor(value: unknown, fallback: string): string {
    if (typeof value !== "string") return fallback
    const color = value.trim()
    if (!color || /^(unknown|undefined|null)$/i.test(color)) return fallback
    // Preserve valid style links, but always supply a portable literal fallback.
    // Nested fallbacks are normalized too, including unresolved "unknown" values.
    const variable = color.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/)
    if (variable) return `var(${variable[1]}, ${safeColor(variable[2], fallback)})`
    return /\b(unknown|undefined|null)\b/i.test(color) ? fallback : color
}
function normalizeProps(props: Props): Props {
    const normalized: Record<string, unknown> = { ...props }
    for (const [key, fallback] of Object.entries(defaults)) {
        const value = normalized[key]
        const invalid = value == null
            || (typeof fallback === "number" && (typeof value !== "number" || !Number.isFinite(value)))
            || (typeof fallback === "boolean" && typeof value !== "boolean")
            || (Array.isArray(fallback) && !Array.isArray(value))
            || (!Array.isArray(fallback) && typeof fallback === "object"
                && (typeof value !== "object" || Array.isArray(value)))
        if (invalid) normalized[key] = fallback
    }
    // False, zero, empty text and intentionally empty project lists remain editable.
    return normalized as Props
}
// Keep the host-assigned width independent of preview height and canvas zoom.
const useLayoutMeasurement = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
function responsiveMode(width: number, breakpoint: number, previous: boolean | null): boolean {
    if (previous === null) return width <= breakpoint
    return previous ? width <= breakpoint + 16 : width < breakpoint - 16
}
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max))
function fitPreview(requestedWidth: number, ratio: number, tilt: number, availableWidth: number, availableHeight: number) {
    const angle = Math.abs(tilt) * Math.PI / 180
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const safeRatio = Math.max(0.4, ratio)
    const width = Math.max(1, Math.min(requestedWidth,
        Math.max(1, availableWidth) / (cosine + sine / safeRatio),
        Math.max(1, availableHeight) / (sine + cosine / safeRatio)))
    const height = width / safeRatio
    return {
        width, height,
        overhangX: Math.max(0, (width * cosine + height * sine - width) / 2),
        overhangY: Math.max(0, (height * cosine + width * sine - height) / 2),
    }
}
function placePreview(px: number, py: number, imageWidth: number, imageHeight: number,
    offset: number, minX: number, maxX: number, minY: number, maxY: number, side: "left" | "right") {
    const right = px + offset
    const left = px - offset - imageWidth
    let nextSide = side
    if (side === "right" && right > maxX && left >= minX) nextSide = "left"
    if (side === "left" && left < minX && right <= maxX) nextSide = "right"
    return {
        x: clamp(nextSide === "right" ? right : left, minX, maxX),
        y: clamp(py - imageHeight / 2, minY, maxY),
        side: nextSide,
    }
}
function resolveFont(value: React.CSSProperties): React.CSSProperties {
    const raw = value as React.CSSProperties & { fontSelector?: string; variationAxes?: Record<string, number> }
    const unit = (v: unknown) => Array.isArray(v) ? String(v[0]) + String(v[1]) : v
    return { ...value, fontFamily: raw.fontFamily ?? raw.fontSelector,
        fontWeight: raw.variationAxes?.wght ?? raw.fontWeight,
        lineHeight: unit(raw.lineHeight) as React.CSSProperties["lineHeight"],
        letterSpacing: unit(raw.letterSpacing) as React.CSSProperties["letterSpacing"] }
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 660
 */
export default function PortfolioCursorList(props: Props) {
    const {
        projects = defaults.projects,
        settings = defaults.settings,
        advanced = defaults.advanced,
        showNumbers = defaults.showNumbers,
        titleFont = defaults.titleFont,
        titleSize = defaults.titleSize,
        textColor: textColorValue = defaults.textColor,
        background: backgroundValue = defaults.background,
        lineColor: lineColorValue = defaults.lineColor,
        rowPadding = defaults.rowPadding,
        gutter = defaults.gutter,
        detailFont = defaults.detailFont,
        mutedColor: mutedColorValue = defaults.mutedColor,
        enableHover = defaults.enableHover,
        previewWidth = defaults.previewWidth,
        previewRatio = defaults.previewRatio,
        previewRadius = defaults.previewRadius,
        previewShadow = defaults.previewShadow,
        allowOverflow = defaults.allowOverflow,
        previewTilt = defaults.previewTilt,
        previewOffset = defaults.previewOffset,
        transitionStyle = defaults.transitionStyle,
        transitionTime = defaults.transitionTime,
        hoverColor: hoverColorValue = defaults.hoverColor,
        hoverShift = defaults.hoverShift,
        inactiveOpacity = defaults.inactiveOpacity,
        followStiffness = defaults.followStiffness,
        followDamping = defaults.followDamping,
        mobileMode = defaults.mobileMode,
        mobileTitleSize = defaults.mobileTitleSize,
        mobileBreakpoint = defaults.mobileBreakpoint,
        canvasPreview = defaults.canvasPreview,
        canvasProject = defaults.canvasProject,
        style,
    } = normalizeProps(props)
    const background = safeColor(backgroundValue, defaults.background)
    const textColor = safeColor(textColorValue, defaults.textColor)
    const mutedColor = safeColor(mutedColorValue, defaults.mutedColor)
    const lineColor = safeColor(lineColorValue, defaults.lineColor)
    const hoverColor = safeColor(hoverColorValue, defaults.hoverColor)
    const resolvedTitleFont = resolveFont(titleFont)
    const resolvedDetailFont = resolveFont(detailFont)
    const items = (Array.isArray(projects) ? projects.filter(Boolean) : samples).map(project => {
        // Framer can omit nested responsive-image defaults when inserting a fresh instance.
        // Keep the demo artwork available without changing any explicitly supplied image.
        if (project.image !== undefined) return project
        const sample = samples.find(item => item.title === project.title)
        return sample ? { ...project, image: sample.image } : project
    })
    const root = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({
        width: 1120, height: 660, compact: false, measured: false, breakpoint: mobileBreakpoint,
    })
    const { width, height, compact } = size
    const [coarse, setCoarse] = React.useState(false)
    const [viewport, setViewport] = React.useState({ width: 1120, height: 900, scaleX: 1, scaleY: 1 })
    const previewSide = React.useRef<"left" | "right">("right")
    const [previewState, setPreviewState] = React.useState<{ index: number | null; revision: number }>({ index: null, revision: 0 })
    const active = previewState.index
    const setActive = (index: number | null) => setPreviewState(previous =>
        previous.index === index ? previous : { index, revision: previous.revision + 1 })
    const [open, setOpen] = React.useState<number | null>(null)
    const [focus, setFocus] = React.useState<number | null>(null)
    const [failed, setFailed] = React.useState<Record<string, boolean>>({})
    const uid = React.useId().replace(/:/g, "")
    const isStatic = useIsStaticRenderer()
    const reduce = useReducedMotion()
    const inline = compact || (!isStatic && coarse) || !enableHover
    const duration = isStatic || reduce ? 0 : Math.max(0, transitionTime)
    const transition = { duration, ease }
    const padding = compact ? Math.min(gutter, 20) : gutter
    const viewportMarginX = 12 / viewport.scaleX
    const viewportMarginY = 12 / viewport.scaleY
    const preview = fitPreview(previewWidth, previewRatio, reduce ? 0 : previewTilt,
        isStatic ? width - padding * 2 - 24 : Math.min(
            viewport.width / viewport.scaleX - viewportMarginX * 2,
            allowOverflow ? Infinity : width - padding * 2 - 24),
        isStatic ? height - 24 : Math.min(
            viewport.height / viewport.scaleY - viewportMarginY * 2,
            allowOverflow ? Infinity : height - 24))
    const imageWidth = preview.width
    const imageHeight = preview.height
    const staticIndex = canvasPreview && items.length ? clamp(canvasProject - 1, 0, items.length - 1) : null
    const selectedIndex = isStatic ? staticIndex : active
    const openIndex = isStatic ? staticIndex : open
    const targetX = useMotionValue(0)
    const targetY = useMotionValue(0)
    const x = useSpring(targetX, { stiffness: followStiffness, damping: followDamping, mass: 0.7 })
    const y = useSpring(targetY, { stiffness: followStiffness, damping: followDamping, mass: 0.7 })
    const limits = useMotionValue({ minX: 0, maxX: 0, minY: 0, maxY: 0 })
    const boundedX = useTransform(x, value => clamp(value, limits.get().minX, limits.get().maxX))
    const boundedY = useTransform(y, value => clamp(value, limits.get().minY, limits.get().maxY))

    useLayoutMeasurement(() => {
        const element = root.current
        if (!element) return
        let pending = 0
        let disposed = false
        const measure = () => {
            if (disposed) return
            const nextWidth = element.offsetWidth
            const nextHeight = element.offsetHeight
            // A hidden or not-yet-sized instance is not a phone breakpoint.
            if (nextWidth <= 1 || nextHeight <= 0) return
            setSize(previous => {
                const previousMode = previous.measured && previous.breakpoint === mobileBreakpoint
                    ? previous.compact : null
                const compact = responsiveMode(nextWidth, mobileBreakpoint, previousMode)
                return previous.measured && previous.width === nextWidth && previous.height === nextHeight
                    && previous.compact === compact && previous.breakpoint === mobileBreakpoint ? previous
                    : { width: nextWidth, height: nextHeight, compact, measured: true, breakpoint: mobileBreakpoint }
            })
            const bounds = element.getBoundingClientRect()
            const visual = window.visualViewport
            const next = {
                width: visual?.width ?? document.documentElement.clientWidth,
                height: visual?.height ?? window.innerHeight,
                scaleX: Math.max(0.001, Math.round(bounds.width / nextWidth * 10000) / 10000),
                scaleY: Math.max(0.001, Math.round(bounds.height / nextHeight * 10000) / 10000),
            }
            setViewport(previous => previous.width === next.width && previous.height === next.height
                && previous.scaleX === next.scaleX && previous.scaleY === next.scaleY ? previous : next)
        }
        const schedule = () => {
            if (disposed || pending) return
            pending = window.requestAnimationFrame(() => { pending = 0; measure() })
        }
        measure()
        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null
        observer?.observe(element)
        const media = window.matchMedia("(any-hover: none) and (any-pointer: coarse)")
        const pointer = () => setCoarse(media.matches)
        pointer()
        media.addEventListener("change", pointer)
        window.addEventListener("resize", schedule)
        window.visualViewport?.addEventListener("resize", schedule)
        return () => {
            disposed = true
            if (pending) window.cancelAnimationFrame(pending)
            observer?.disconnect()
            media.removeEventListener("change", pointer)
            window.removeEventListener("resize", schedule)
            window.visualViewport?.removeEventListener("resize", schedule)
        }
    }, [mobileBreakpoint])

    React.useEffect(() => {
        setActive(null); setOpen(null); setFocus(null)
    }, [inline])

    React.useEffect(() => {
        if (active !== null && active >= items.length) setActive(null)
        if (open !== null && open >= items.length) setOpen(null)
    }, [items.length, active, open])

    React.useEffect(() => {
        if (isStatic || inline) return
        const hide = () => { setActive(null); previewSide.current = "right" }
        window.addEventListener("scroll", hide, { passive: true, capture: true })
        window.addEventListener("blur", hide)
        window.addEventListener("resize", hide)
        window.visualViewport?.addEventListener("resize", hide)
        window.visualViewport?.addEventListener("scroll", hide)
        return () => {
            window.removeEventListener("scroll", hide, true)
            window.removeEventListener("blur", hide)
            window.removeEventListener("resize", hide)
            window.visualViewport?.removeEventListener("resize", hide)
            window.visualViewport?.removeEventListener("scroll", hide)
        }
    }, [isStatic, inline])

    function positionImage(clientX: number, clientY: number, snap = false) {
        const element = root.current
        if (!element) return false
        const bounds = element.getBoundingClientRect()
        if (bounds.width <= 0 || bounds.height <= 0) return false
        const scaleX = bounds.width / Math.max(1, element.offsetWidth)
        const scaleY = bounds.height / Math.max(1, element.offsetHeight)
        const px = (clientX - bounds.left) / scaleX
        const py = (clientY - bounds.top) / scaleY
        const visual = window.visualViewport
        const viewportLeft = visual?.offsetLeft ?? 0
        const viewportTop = visual?.offsetTop ?? 0
        const viewportRight = viewportLeft + (visual?.width ?? document.documentElement.clientWidth)
        const viewportBottom = viewportTop + (visual?.height ?? window.innerHeight)
        const minX = Math.max((viewportLeft + 12 - bounds.left) / scaleX,
            allowOverflow ? -Infinity : padding + 12) + preview.overhangX
        const maxX = Math.min((viewportRight - 12 - bounds.left) / scaleX,
            allowOverflow ? Infinity : element.offsetWidth - padding - 12) - imageWidth - preview.overhangX
        const minY = Math.max((viewportTop + 12 - bounds.top) / scaleY,
            allowOverflow ? -Infinity : 12) + preview.overhangY
        const maxY = Math.min((viewportBottom - 12 - bounds.top) / scaleY,
            allowOverflow ? Infinity : element.offsetHeight - 12) - imageHeight - preview.overhangY
        // A partially off-screen or too-small container cannot safely display the preview.
        if (maxX < minX - 0.001 || maxY < minY - 0.001) { setActive(null); return false }
        limits.set({ minX, maxX, minY, maxY })
        const next = placePreview(px, py, imageWidth, imageHeight, previewOffset,
            minX, maxX, minY, maxY, previewSide.current)
        previewSide.current = next.side
        targetX.set(next.x); targetY.set(next.y)
        // Bound the current spring position too, so momentum cannot carry the image off-screen.
        if (snap || reduce) { x.jump(next.x); y.jump(next.y) }
        else {
            if (x.get() < minX || x.get() > maxX) x.jump(clamp(x.get(), minX, maxX))
            if (y.get() < minY || y.get() > maxY) y.jump(clamp(y.get(), minY, maxY))
        }
        return true
    }

    function showFocus(index: number, button: HTMLButtonElement) {
        setFocus(index)
        if (isStatic || inline) return
        const bounds = button.getBoundingClientRect()
        if (positionImage(bounds.left + bounds.width * 0.68, bounds.top + bounds.height / 2, true)) setActive(index)
    }

    function renderImage(project: Project, decorative = false) {
        const image = project.image
        const src = typeof image === "string" ? image : image?.src
        return src && !failed[src]
            ? <img src={src} srcSet={typeof image === "object" ? image.srcSet : undefined}
                alt={decorative ? "" : (typeof image === "object" && image.alt) || project.title || "Project image"}
                draggable={false} onError={() => setFailed(previous => ({ ...previous, [src]: true }))}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div role={decorative ? undefined : "img"} aria-label={project.title || "Project preview"}
                style={{ height: "100%", width: "100%", background, border: "1px solid " + lineColor,
                    boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
                    color: mutedColor, fontSize: 18, ...detailFont }}>{project.title || "Project"}</div>
    }

    const imageEnter = { opacity: 0, y: !reduce && transitionStyle === "slide" ? 28 : 0,
        filter: !reduce && (transitionStyle === "blur" || transitionStyle === "zoom") ? "blur(8px)" : "blur(0px)" }
    const imageExit = { opacity: 0, y: !reduce && transitionStyle === "slide" ? -24 : 0, filter: "blur(0px)" }

    return <div ref={root} aria-label="Portfolio projects"
        onPointerMove={event => {
            if (isStatic || inline || event.pointerType === "touch" || active === null) return
            positionImage(event.clientX, event.clientY)
        }}
        onPointerLeave={() => { setActive(null); previewSide.current = "right" }}
        onKeyDown={event => { if (event.key === "Escape") { setActive(null); setOpen(null) } }}
        style={{ width: "100%", minWidth: 0, position: "relative", background, color: textColor, boxSizing: "border-box",
            padding: (compact ? 20 : 32) + "px " + padding + "px", ...style, height: "auto", overflow: "visible" }}>
        {/* A zero-height, shrinkable sizing guide gives Auto a real intrinsic width.
            Unlike inline-size containment, it cannot collapse the list to its padding.
            Fill and phone widths still constrain it to the available space. */}
        <div aria-hidden="true" style={{ width: Math.max(1, 1120 - gutter * 2),
            maxWidth: "100%", height: 0, pointerEvents: "none" }} />
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((project, index) => {
                const expanded = inline && (mobileMode === "all" || openIndex === index)
                const selected = !isStatic && (inline ? expanded : selectedIndex === index)
                const dim = !isStatic && !inline && selectedIndex !== null && selectedIndex !== index
                const title = project.title || "Untitled project"
                const previewId = uid + "-preview-" + index
                return <li key={index} style={{ borderTop: "1px solid " + lineColor,
                    borderBottom: index === items.length - 1 ? "1px solid " + lineColor : undefined }}>
                    <button type="button"
                        aria-label={title + (project.category ? ", " + project.category : "")}
                        aria-expanded={inline ? expanded : undefined}
                        aria-controls={inline && expanded ? previewId : undefined}
                        onPointerEnter={event => {
                            if (isStatic || inline || event.pointerType === "touch") return
                            if (positionImage(event.clientX, event.clientY, active === null)) setActive(index)
                        }}
                        onPointerMove={event => {
                            if (isStatic || inline || event.pointerType === "touch") return
                            if (active === null) {
                                if (positionImage(event.clientX, event.clientY, true)) setActive(index)
                            }
                        }}
                        onPointerDown={event => {
                            if (!inline) event.preventDefault()
                        }}
                        onFocus={event => {
                            if (event.currentTarget.matches(":focus-visible")) showFocus(index, event.currentTarget)
                        }}
                        onBlur={() => { setFocus(null); setActive(null) }}
                        onClick={() => {
                            if (inline) setOpen(current => current === index ? null : index)
                        }}
                        style={{ appearance: "none", border: 0, margin: 0, background: "transparent",
                            padding: (compact ? Math.min(rowPadding, 24) : rowPadding) + "px 0",
                            width: "100%", minWidth: 0, boxSizing: "border-box", textAlign: "left", cursor: "pointer", color: textColor,
                            display: "grid", alignItems: "center",
                            gridTemplateColumns: showNumbers ? (compact ? "28px minmax(0, 1fr)" : "54px minmax(0, 1fr) auto")
                                : (compact ? "minmax(0, 1fr)" : "minmax(0, 1fr) auto"),
                            columnGap: compact ? 12 : 24, rowGap: 9,
                            outline: focus === index ? "2px solid " + hoverColor : "none", outlineOffset: 6,
                            borderRadius: 1, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
                        {showNumbers && <motion.span animate={{ opacity: dim ? inactiveOpacity : 1 }} transition={transition}
                            style={{ ...resolvedDetailFont, color: mutedColor, fontSize: 12, lineHeight: 1.4,
                                fontVariantNumeric: "tabular-nums", alignSelf: compact ? "start" : "center",
                                paddingTop: compact ? 8 : 0 }}>{project.number || String(index + 1).padStart(2, "0")}</motion.span>}
                        <motion.span animate={{ x: selected && !inline && !reduce ? hoverShift : 0,
                            opacity: dim ? inactiveOpacity : 1, color: selected ? hoverColor : textColor }} transition={transition}
                            style={{ ...resolvedTitleFont, fontSize: compact ? mobileTitleSize : width < 860 ? Math.min(titleSize, 40) : titleSize,
                                letterSpacing: resolvedTitleFont.letterSpacing ?? "-0.035em", lineHeight: resolvedTitleFont.lineHeight ?? 1.12, minWidth: 0, overflowWrap: "break-word" }}>{title}</motion.span>
                        <motion.span animate={{ opacity: dim ? inactiveOpacity : 1 }} transition={transition}
                            style={{ ...resolvedDetailFont, fontSize: compact ? Math.max(10, Number.parseFloat(String(resolvedDetailFont.fontSize ?? 11)) - 1) : resolvedDetailFont.fontSize ?? 11, lineHeight: resolvedDetailFont.lineHeight ?? 1.5,
                                letterSpacing: resolvedDetailFont.letterSpacing ?? "0.06em", textTransform: "uppercase", color: mutedColor,
                                gridColumn: compact && showNumbers ? 2 : undefined, justifySelf: compact ? "start" : "end",
                                maxWidth: compact ? "100%" : 180, textAlign: compact ? "left" : "right" }}>{project.category || ""}</motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                        {expanded && <motion.div id={previewId} initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={transition} style={{ overflow: "hidden" }}>
                            <div style={{ paddingBottom: compact ? 24 : 30, paddingTop: 4 }}>
                                <div style={{ width: "100%", aspectRatio: String(previewRatio),
                                    borderRadius: previewRadius, overflow: "hidden" }}>{renderImage(project)}</div>
                                {project.link && <a href={project.link} style={{ ...detailFont, color: textColor, fontSize: 13,
                                    display: "inline-block", marginTop: 12, padding: "8px 0",
                                    textDecoration: "underline", textUnderlineOffset: 4 }}>View project</a>}
                            </div>
                        </motion.div>}
                    </AnimatePresence>
                </li>
            })}
        </ol>
        <AnimatePresence>
            {!inline && selectedIndex !== null && items[selectedIndex] &&
                <motion.div key="floating-preview" aria-hidden="true"
                    initial={false}
                    animate={{ opacity: 1, rotate: reduce ? 0 : previewTilt }}
                    exit={{ opacity: 0 }} transition={transition}
                    style={{ position: "absolute", left: 0, top: 0,
                        rotate: isStatic && !reduce ? previewTilt : undefined,
                        x: isStatic ? clamp(width * 0.7 - imageWidth / 2, padding + 12 + preview.overhangX, width - padding - 12 - imageWidth - preview.overhangX) : boundedX,
                        y: isStatic ? clamp(height * 0.5 - imageHeight / 2, 12 + preview.overhangY, height - 12 - imageHeight - preview.overhangY) : boundedY,
                        width: imageWidth, height: imageHeight, zIndex: 2, pointerEvents: "none",
                        borderRadius: previewRadius, overflow: "hidden", background,
                        boxShadow: previewShadow ? "0 18px 48px rgba(24,24,20,0.16), 0 3px 10px rgba(24,24,20,0.1)" : "none" }}>
                    <AnimatePresence initial={!isStatic}>
                        <motion.div key={isStatic ? selectedIndex : previewState.revision} initial={isStatic ? false : imageEnter}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={imageExit}
                            transition={transition} style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%" }}>
                            {renderImage(items[selectedIndex], true)}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>}
        </AnimatePresence>
    </div>
}
// Keep insertion, copying and runtime rendering on the same complete defaults.
PortfolioCursorList.defaultProps = defaults
PortfolioCursorList.displayName = "Portfolio Cursor List"
addPropertyControls(PortfolioCursorList, {
    projects: { type: ControlType.Array, title: "Projects", maxCount: 40, defaultValue: defaults.projects,
        control: { type: ControlType.Object, controls: {
            title: { type: ControlType.String, title: "Title", defaultValue: "New project" },
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            category: { type: ControlType.String, title: "Category", defaultValue: "Art direction" },
            number: { type: ControlType.String, title: "Custom number", placeholder: "Automatic", description: "Leave empty for automatic numbering." },
            link: { type: ControlType.Link, title: "Project link", description: "Shown below expanded images on mobile." },
        } } },
    settings: { type: ControlType.Enum, title: "Settings", options: ["list", "preview", "motion", "mobile", "editor"], optionTitles: ["List", "Image preview", "Animation", "Mobile", "Editor preview"], defaultValue: defaults.settings },
    advanced: { type: ControlType.Boolean, title: "More options", defaultValue: defaults.advanced, hidden: (p: Props) => p.settings === "editor" },
    showNumbers: { type: ControlType.Boolean, title: "Show numbers", defaultValue: defaults.showNumbers, hidden: (p: Props) => (p.settings ?? "list") !== "list" },
    titleFont: { type: ControlType.Font, title: "Title font", controls: "basic",
        defaultValue: titleDefault, hidden: (p: Props) => (p.settings ?? "list") !== "list" },
    titleSize: { type: ControlType.Number, title: "Text size", defaultValue: defaults.titleSize, min: 16, max: 100, unit: "px", hidden: (p: Props) => (p.settings ?? "list") !== "list" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: defaults.textColor, hidden: (p: Props) => (p.settings ?? "list") !== "list" },
    background: { type: ControlType.Color, title: "Background", defaultValue: defaults.background, hidden: (p: Props) => (p.settings ?? "list") !== "list" },
    lineColor: { type: ControlType.Color, title: "Divider color", defaultValue: defaults.lineColor, description: "Color of the lines between projects.", hidden: (p: Props) => (p.settings ?? "list") !== "list" },
    rowPadding: { type: ControlType.Number, title: "Row spacing", defaultValue: defaults.rowPadding, min: 12, max: 64, unit: "px", hidden: (p: Props) => (p.settings ?? "list") !== "list" },
    gutter: { type: ControlType.Number, title: "Side padding", defaultValue: defaults.gutter, min: 12, max: 80, unit: "px", hidden: (p: Props) => (p.settings ?? "list") !== "list" },
    detailFont: { type: ControlType.Font, title: "Detail font", controls: "basic",
        defaultValue: detailDefault, hidden: (p: Props) => (p.settings ?? "list") !== "list" || !p.advanced },
    mutedColor: { type: ControlType.Color, title: "Detail text", defaultValue: defaults.mutedColor, hidden: (p: Props) => (p.settings ?? "list") !== "list" || !p.advanced },
    enableHover: { type: ControlType.Boolean, title: "Follow cursor", defaultValue: defaults.enableHover, hidden: (p: Props) => (p.settings ?? "list") !== "preview" },
    previewWidth: { type: ControlType.Number, title: "Image width", defaultValue: defaults.previewWidth, min: 140, max: 700, unit: "px", hidden: (p: Props) => (p.settings ?? "list") !== "preview" || p.enableHover === false },
    previewRatio: { type: ControlType.Number, title: "Aspect ratio", defaultValue: defaults.previewRatio, min: 0.5, max: 2.5, step: 0.01, description: "Width divided by height. Use 1 for a square.", hidden: (p: Props) => (p.settings ?? "list") !== "preview" },
    previewRadius: { type: ControlType.Number, title: "Corners", defaultValue: defaults.previewRadius, min: 0, max: 60, unit: "px", hidden: (p: Props) => (p.settings ?? "list") !== "preview" },
    previewShadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: defaults.previewShadow, hidden: (p: Props) => (p.settings ?? "list") !== "preview" || p.enableHover === false },
    allowOverflow: { type: ControlType.Boolean, title: "Outside list", defaultValue: defaults.allowOverflow, description: "Let the preview extend beyond the list edges.", hidden: (p: Props) => (p.settings ?? "list") !== "preview" || p.enableHover === false },
    previewTilt: { type: ControlType.Number, title: "Image tilt", defaultValue: defaults.previewTilt, min: -15, max: 15, unit: "°", hidden: (p: Props) => (p.settings ?? "list") !== "preview" || !p.advanced || p.enableHover === false },
    previewOffset: { type: ControlType.Number, title: "Cursor gap", defaultValue: defaults.previewOffset, min: 0, max: 100, unit: "px", hidden: (p: Props) => (p.settings ?? "list") !== "preview" || !p.advanced || p.enableHover === false },
    transitionStyle: { type: ControlType.Enum, title: "Image effect", options: ["slide", "fade", "blur"],
        optionTitles: ["Slide", "Fade", "Blur in"], defaultValue: defaults.transitionStyle, hidden: (p: Props) => (p.settings ?? "list") !== "motion" || p.enableHover === false },
    transitionTime: { type: ControlType.Number, title: "Duration", defaultValue: defaults.transitionTime, min: 0, max: 1.5, step: 0.01, unit: "s", hidden: (p: Props) => (p.settings ?? "list") !== "motion" },
    hoverColor: { type: ControlType.Color, title: "Active text", defaultValue: defaults.hoverColor, hidden: (p: Props) => (p.settings ?? "list") !== "motion" || !p.advanced || p.enableHover === false },
    hoverShift: { type: ControlType.Number, title: "Title movement", defaultValue: defaults.hoverShift, min: 0, max: 40, unit: "px", hidden: (p: Props) => (p.settings ?? "list") !== "motion" || !p.advanced || p.enableHover === false },
    inactiveOpacity: { type: ControlType.Number, title: "Other rows", defaultValue: defaults.inactiveOpacity, min: 0.2, max: 1, step: 0.01, description: "Opacity of the other rows. Use 1 to keep them fully visible.", hidden: (p: Props) => (p.settings ?? "list") !== "motion" || !p.advanced || p.enableHover === false },
    followStiffness: { type: ControlType.Number, title: "Responsiveness", defaultValue: defaults.followStiffness, min: 40, max: 700, description: "Higher values make the image catch up faster.", hidden: (p: Props) => (p.settings ?? "list") !== "motion" || !p.advanced || p.enableHover === false },
    followDamping: { type: ControlType.Number, title: "Smoothness", defaultValue: defaults.followDamping, min: 12, max: 80, description: "Higher values reduce bounce.", hidden: (p: Props) => (p.settings ?? "list") !== "motion" || !p.advanced || p.enableHover === false },
    mobileMode: { type: ControlType.Enum, title: "Images", options: ["tap", "all"],
        optionTitles: ["Tap to show", "Always show"], defaultValue: defaults.mobileMode, hidden: (p: Props) => (p.settings ?? "list") !== "mobile" },
    mobileTitleSize: { type: ControlType.Number, title: "Text size", defaultValue: defaults.mobileTitleSize, min: 16, max: 60, unit: "px", hidden: (p: Props) => (p.settings ?? "list") !== "mobile" },
    mobileBreakpoint: { type: ControlType.Number, title: "Switch below", defaultValue: defaults.mobileBreakpoint, min: 320, max: 1000, unit: "px", description: "Use the mobile layout below this width.", hidden: (p: Props) => (p.settings ?? "list") !== "mobile" || !p.advanced },
    canvasPreview: { type: ControlType.Boolean, title: "Show image", defaultValue: defaults.canvasPreview, description: "Show a sample image in the editor only.", hidden: (p: Props) => (p.settings ?? "list") !== "editor" },
    canvasProject: { type: ControlType.Number, title: "Project number", defaultValue: defaults.canvasProject, min: 1, max: 40,
        step: 1, hidden: (p: Props) => (p.settings ?? "list") !== "editor" || !p.canvasPreview },
})
