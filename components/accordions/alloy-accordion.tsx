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

import { motion, animate as animateValue, useMotionValue, useSpring, useTransform, useReducedMotion, type MotionValue, type Transition } from "framer-motion"

type ImageValue = { src: string; srcSet?: string; alt?: string }
type FolioItem = {
    title: string
    description: string
    tone?: string
    coverColor?: string
    image?: ImageValue
    imageScale?: number
    linkLabel?: string
    link?: string
    newTab?: boolean
}
type Palette = { text: string; secondary: string; coverText: string; focus: string }
type Metrics = { header: number; copy: number; ticket: number; top: number; bottom: number; left: number; right: number; center: number; minimum: number }
interface AlloyAccordionProps {
    items?: FolioItem[]
    initialOpen?: number
    collapsible?: boolean
    hoverToOpen?: boolean
    autoplay?: boolean
    interval?: number
    colors?: Partial<Palette>
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    padding?: string
    compactPadding?: string
    radius?: string
    gap?: string
    border?: React.CSSProperties
    cardHeight?: number
    closedWidth?: number
    mobileHeaderHeight?: number
    breakpoint?: number
    layoutMode?: "auto" | "horizontal" | "vertical"
    minOpenWidth?: number
    animate?: boolean
    hoverMotion?: boolean
    artTravel?: number
    transition?: Transition
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: FolioItem[] = [
    {
        title: "Strategy",
        description: "Clarity before creativity. A focused direction for what comes next.",
        tone: "#AE8EE7",
        coverColor: "#24262B",
        image: { src: "https://framerusercontent.com/images/UARiuT1JncbvFwsAlOZ0ba15DM.png", alt: "Violet titanium fan sculpture" },
        linkLabel: "Explore",
        link: "",
        newTab: false,
    },
    {
        title: "Growth",
        description: "Ideas that evolve. A clear path to what comes next.",
        tone: "#DDA7B8",
        coverColor: "#24262B",
        image: { src: "https://framerusercontent.com/images/8sf1jlBh6DLSr5NsepZRWYB748o.png", alt: "Rose titanium sculptural growth loop" },
        linkLabel: "Explore",
        link: "",
        newTab: false,
    },
    {
        title: "Identity",
        description: "A distinct visual language, built to be recognised.",
        tone: "#9CC4AE",
        coverColor: "#24262B",
        image: { src: "https://framerusercontent.com/images/CihqYHr3aOAwxPmbq8oPNBf40o.png", alt: "Celadon chrome interlocking bands" },
        linkLabel: "Explore",
        link: "",
        newTab: false,
    },
    {
        title: "Digital",
        description: "Considered websites. Effortless experiences. Every detail connected.",
        tone: "#EDAA7E",
        coverColor: "#24262B",
        image: { src: "https://framerusercontent.com/images/4cn8ZbfFKNRFj8ZHOOsiApeEok.png", alt: "Rose copper modular frames" },
        linkLabel: "Explore",
        link: "",
        newTab: false,
    },
    {
        title: "Motion",
        description: "Character in every movement. A brand that feels alive.",
        tone: "#82BEDF",
        coverColor: "#24262B",
        image: { src: "https://framerusercontent.com/images/ckIfdeLf83dHXGn364R5Tpawo.png", alt: "Blue titanium ribbon sculpture" },
        linkLabel: "Explore",
        link: "",
        newTab: false,
    },
]
const DEFAULT_COLORS: Palette = {
    text: "#24262B",
    secondary: "#30343D",
    coverText: "#EFEEE9",
    focus: "#D7D5E5",
}
const DEFAULT_TITLE: React.CSSProperties = {
    fontFamily: '"Inter", sans-serif',
    fontSize: "40px",
    fontWeight: 500,
    lineHeight: "1.08em",
    letterSpacing: "-0.045em",
    textAlign: "left",
}
const DEFAULT_BODY: React.CSSProperties = {
    fontFamily: '"Inter", sans-serif',
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: "1.55em",
    letterSpacing: "-0.015em",
    textAlign: "left",
}
const DEFAULT_TRANSITION: Transition = {
    type: "spring",
    stiffness: 260,
    damping: 34,
    mass: 1,
    restDelta: 0.05,
    restSpeed: 0.5,
}
const useSafeLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function smoothRange(value: number, start: number, end: number) {
    const phase = Math.max(0, Math.min(1, (value - start) / (end - start)))
    return phase * phase * (3 - 2 * phase)
}

function initialIndex(value: number, length: number, collapsible: boolean) {
    if (!length) return -1
    const index = Math.min(length - 1, Math.max(-1, Math.round(Number.isFinite(value) ? value : 1) - 1))
    return !collapsible && index < 0 ? 0 : index
}

function numericGap(value: string, width: number) {
    const number = parseFloat(value)
    if (!Number.isFinite(number)) return 0
    return value.trim().endsWith("%") ? number * width / 100 : number
}

function PanelMark({ openness, progress, timerEnabled, paused, reduced }: {
    openness: MotionValue<number>; progress: MotionValue<number>; timerEnabled: boolean; paused: boolean; reduced: boolean
}) {
    const timerOpacity = useTransform(openness, (value) => smoothRange(value, 0.18, 0.92))
    const plusOpacity = useTransform(timerOpacity, (value) => timerEnabled ? 1 - value : 1)
    const verticalOpacity = useTransform(openness, (value) => timerEnabled ? 1 : 1 - smoothRange(value, 0, 1))
    const offset = useTransform(progress, (value) => 1 - value)
    const glyphTransition: Transition = { duration: reduced ? 0 : 0.16, ease: [0.4, 0, 0.2, 1] }
    return (
        <svg className="folio-mark" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <circle className="folio-mark-track" cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="1.5" opacity=".22" />
            <motion.g style={{ opacity: plusOpacity }}>
                <path d="M11 18h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <motion.path d="M18 11v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: verticalOpacity }} />
            </motion.g>
            {timerEnabled ? <motion.g style={{ opacity: timerOpacity }}>
                <motion.circle cx="18" cy="18" r="15" pathLength="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1" style={{ strokeDashoffset: offset }} transform="rotate(-90 18 18)" />
                <motion.path initial={false} animate={{ opacity: paused ? 1 : 0 }} transition={glyphTransition} d="M15 12.5 23 18l-8 5.5z" fill="currentColor" />
                <motion.path initial={false} animate={{ opacity: paused ? 0 : 1 }} transition={glyphTransition} d="M15.5 14v8M20.5 14v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </motion.g> : null}
        </svg>
    )
}

function FolioPanel({
    item, index, open, collapsible, horizontal, compact, width, activeWidth, spineWidth, panelHeight, mobileHeaderHeight,
    colors, titleFont, bodyFont, padding, radius, border, transition, reduced, hoverMotion, artTravel, motionActive, id,
    setButton, onToggle, onKeyDown, onMinimum, onHoverIntent, onHoverLeave, timerEnabled, progress, paused, timerFocus, timerEngaged, onGeometry, onSettled, selectionKey,
}: {
    item: FolioItem; index: number; open: boolean; collapsible: boolean
    horizontal: boolean; compact: boolean; width: number; activeWidth: number; spineWidth: number
    panelHeight: number; mobileHeaderHeight: number; colors: Palette
    titleFont: React.CSSProperties; bodyFont: React.CSSProperties; padding: string; radius: string
    border: React.CSSProperties; transition: Transition; reduced: boolean; hoverMotion: boolean
    artTravel: number; motionActive: boolean; id: string; timerEnabled: boolean; selectionKey: string
    progress: MotionValue<number>; paused: boolean; timerFocus: boolean; timerEngaged: boolean
    setButton: (node: HTMLButtonElement | null) => void
    onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
    onHoverIntent: (event: React.PointerEvent<HTMLElement>) => void
    onHoverLeave: () => void
    onGeometry: (index: number, width: number, height: number) => void
    onSettled: (index: number, settled: boolean) => void
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
    onMinimum: (index: number, minimum: number, header: number, right: number, center: number) => void
}) {
    const headerContentRef = React.useRef<HTMLSpanElement>(null)
    const sideTitleProbeRef = React.useRef<HTMLSpanElement>(null)
    const bodyRef = React.useRef<HTMLDivElement>(null)
    const copyRef = React.useRef<HTMLParagraphElement>(null)
    const ticketRef = React.useRef<HTMLSpanElement>(null)
    const [triggerHover, setTriggerHover] = React.useState(false)
    const [triggerFocus, setTriggerFocus] = React.useState(false)
    const [linkHover, setLinkHover] = React.useState(false)
    const [linkFocus, setLinkFocus] = React.useState(false)
    const [settled, setSettled] = React.useState(true)
    const linkEngaged = open && (linkHover || linkFocus)
    const footerProgress = useMotionValue(0)
    const footerInk = useTransform(footerProgress, [0, 1], [colors.secondary, colors.text])
    useSafeLayoutEffect(() => {
        if (reduced || !hoverMotion) { footerProgress.jump(linkEngaged ? 1 : 0); return }
        const animation = animateValue(footerProgress, linkEngaged ? 1 : 0, {
            type: "spring", stiffness: 230, damping: 32, mass: 1, restDelta: 0.001, restSpeed: 0.005,
        })
        return () => animation.stop()
    }, [linkEngaged, reduced, hoverMotion, footerProgress])
    const pointerX = useMotionValue(0)
    const pointerY = useMotionValue(0)
    const driftX = useSpring(pointerX, { stiffness: 180, damping: 27, mass: 1 })
    const driftY = useSpring(pointerY, { stiffness: 180, damping: 27, mass: 1 })
    const openness = useMotionValue(open ? 1 : 0)
    const artEngaged = open && (triggerHover || linkHover || triggerFocus || linkFocus)
    const hoverPose = useSpring(0, { stiffness: 90, damping: 21, mass: 1, restDelta: 0.0001, restSpeed: 0.001 })
    const floatPhase = useMotionValue(0)
    useSafeLayoutEffect(() => {
        if (reduced || !hoverMotion) { hoverPose.jump(0); return }
        hoverPose.set(artEngaged && motionActive ? 1 : 0)
    }, [artEngaged, motionActive, reduced, hoverMotion, hoverPose])
    React.useEffect(() => {
        if (reduced || !hoverMotion || !motionActive || (!artEngaged && hoverPose.get() < 0.001)) return
        // Keep the phase moving through the exit. Re-entry continues from the
        // current phase, so the sculpture never resets to an earlier pose.
        const cycle = animateValue(floatPhase, floatPhase.get() + Math.PI * 2, {
            duration: 6.8, ease: "linear", repeat: Infinity,
        })
        const unsubscribe = hoverPose.on("change", (value) => {
            if (!artEngaged && value < 0.001) cycle.stop()
        })
        return () => { unsubscribe(); cycle.stop() }
    }, [artEngaged, motionActive, reduced, hoverMotion, hoverPose, floatPhase])
    const artAperture = () => reduced || !hoverMotion ? 0 : smoothRange(openness.get(), 0.2, 0.95)
    const artPresence = () => hoverPose.get() * artAperture()
    const renderDriftX = useTransform(() => driftX.get() * artAperture() + Math.sin(floatPhase.get()) * 0.65 * artPresence())
    const renderDriftY = useTransform(() => driftY.get() * artAperture() + (-5 + Math.sin(floatPhase.get()) * 1.4) * artPresence())
    const renderArtScale = useTransform(() => 1 + 0.022 * artPresence())
    const renderArtRotate = useTransform(() => ([-0.8, 0.7, -0.65, 0.9][index % 4] + Math.sin(floatPhase.get()) * 0.24) * artPresence() + Math.max(-0.6, Math.min(0.6, driftX.get() * 0.16)) * artAperture())
    // Freeze the outgoing ring until it has faded back into its plus.
    const displayedProgress = useMotionValue(0)
    useSafeLayoutEffect(() => {
        if (!open) return
        displayedProgress.set(0)
        return progress.on("change", (value) => displayedProgress.set(value))
    }, [open, progress, displayedProgress])
    const resetPointer = () => { pointerX.set(0); pointerY.set(0) }
    const pointerAllowed = (event: React.PointerEvent<HTMLElement>) =>
        event.pointerType !== "touch" && typeof window !== "undefined" && window.matchMedia("(hover:hover) and (pointer:fine)").matches
    const trackPointer = (event: React.PointerEvent<HTMLElement>) => {
        if (reduced || !hoverMotion || !open || !settled || !pointerAllowed(event)) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        pointerX.set(Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)) * artTravel)
        pointerY.set(Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)) * artTravel * 0.65)
    }
    const enterArtwork = (event: React.PointerEvent<HTMLElement>) => {
        if (!pointerAllowed(event)) return
        setLinkHover(true)
        trackPointer(event)
    }
    const leaveArtwork = () => { setLinkHover(false); resetPointer() }
    React.useEffect(() => {
        resetPointer()
        if (!open) { setLinkHover(false); setLinkFocus(false) }
    }, [open, horizontal, reduced, hoverMotion, pointerX, pointerY])
    const [metrics, setMetrics] = React.useState<Metrics>({
        header: horizontal ? 0 : mobileHeaderHeight, copy: 50, ticket: item.link ? 72 : 0,
        top: 24, bottom: 24, left: 24, right: 24, center: horizontal ? 40 : mobileHeaderHeight / 2, minimum: 390,
    })
    const image = item.image === undefined ? DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].image : item.image
    const tone = item.tone || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].tone
    const cover = item.coverColor || DEFAULT_ITEMS[index % DEFAULT_ITEMS.length].coverColor
    const hasLink = Boolean(item.link && item.link.trim())
    const transitionKey = JSON.stringify(transition)
    const geometry = React.useMemo<Transition>(() => reduced ? { duration: 0 } : transition, [reduced, transitionKey])
    const clamp = (value: number) => Math.max(0, Math.min(1, value))
    const mix = (start: number, end: number, value: number) => start + (end - start) * value
    const bodyOpacity = useTransform(openness, (value) => linkFocus ? 1 : smoothRange(value, 0.3, 0.92))
    const paneOpacity = useTransform(openness, (value) => smoothRange(value, 0, 1))
    const titleSize = titleFont.fontSize ?? "40px"
    const sideTitleStyle: React.CSSProperties = {
        ...titleFont, position: "absolute", writingMode: "vertical-rl",
        height: "max-content", width: "max-content", whiteSpace: "nowrap",
        lineHeight: "1.2em", paddingInline: "0.075em", overflow: "visible",
    }
    const titleScale = compact ? 0.7 : 0.8
    const stackedTitleSize = typeof titleSize === "number" ? titleSize * titleScale : "calc(" + titleSize + " * " + titleScale + ")"
    const baseFontSize = typeof titleSize === "number" ? titleSize : parseFloat(String(titleSize)) || 40
    const hideThumbnail = !horizontal && (baseFontSize > 56 || width < 340)
    // A horizontal header measures zero height. Keep the mobile header usable
    // on the first orientation-change render, before ResizeObserver catches up.
    const headerHeight = horizontal ? 0 : Math.max(mobileHeaderHeight, metrics.header)
    const headerCenter = horizontal ? 40 : metrics.header > 0 ? metrics.center + (headerHeight - metrics.header) / 2 : headerHeight / 2
    const contentWidth = Math.max(1, horizontal ? activeWidth - spineWidth : width)
    const galleryWidth = Math.max(1, contentWidth - metrics.left - metrics.right)
    const imageHeight = horizontal
        ? Math.max(220, panelHeight - metrics.top - metrics.bottom - metrics.copy - metrics.ticket)
        : Math.max(180, Math.min(390, galleryWidth * 0.98))
    const bodyHeight = metrics.top + imageHeight + metrics.copy + metrics.ticket + metrics.bottom
    const totalHeight = horizontal ? panelHeight : headerHeight + (open ? bodyHeight : 0)
    const artworkSize = Math.max(1, Math.min(imageHeight, galleryWidth))
    const previousHorizontal = React.useRef(horizontal)
    const visualWidth = useMotionValue(width)
    const visualHeight = useMotionValue(totalHeight)
    // One image keeps its square raster box. Only translation and uniform image
    // scale change; article clipping supplies the cover crop without a mask.
    const artX = useTransform(() => {
        const phase = clamp(openness.get())
        const closedCenter = horizontal ? Math.min(spineWidth - 14, spineWidth * 0.92) : width - metrics.right - 22 - 12 - 24
        const openCenter = (horizontal ? spineWidth : 0) + metrics.left + galleryWidth / 2
        return mix(closedCenter, openCenter, phase) - artworkSize / 2
    })
    const artY = useTransform(() => {
        const phase = clamp(openness.get())
        const closedCenter = horizontal ? Math.max(visualHeight.get(), panelHeight) - 65 : headerCenter
        const openCenter = headerHeight + metrics.top + imageHeight / 2
        return mix(closedCenter, openCenter, phase) - artworkSize / 2
    })
    const openArtScale = Math.max(0.5, Math.min(1, Number.isFinite(item.imageScale) ? item.imageScale! / 100 : 0.94))
    const artScale = useTransform(openness, (value) => {
        const phase = clamp(value)
        return mix((horizontal ? Math.min(230, artworkSize * 0.74) : 48) / artworkSize, openArtScale, phase)
    })
    const artOpacity = useTransform(openness, (value) => hideThumbnail ? smoothRange(value, 0.1, 0.8) : 1)
    useSafeLayoutEffect(() => {
        const report = () => onGeometry(index, visualWidth.get(), visualHeight.get())
        report()
        const unsubscribeWidth = visualWidth.on("change", report)
        const unsubscribeHeight = visualHeight.on("change", report)
        return () => { unsubscribeWidth(); unsubscribeHeight() }
    }, [index, onGeometry, visualWidth, visualHeight])
    // Retarget all extents together, preserving spring velocity on interruption.
    // Wait for pixel geometry and normalized content before starting the timer.
    useSafeLayoutEffect(() => {
        const layoutChanged = previousHorizontal.current !== horizontal
        previousHorizontal.current = horizontal
        if (reduced || layoutChanged) {
            // A breakpoint change starts a new geometry. Carrying the previous
            // horizontal spring velocity into the stacked layout causes overshoot.
            visualWidth.jump(width)
            visualHeight.jump(totalHeight)
            openness.jump(open ? 1 : 0)
            setSettled(true)
            onSettled(index, true)
            return
        }
        setSettled(false)
        onSettled(index, false)
        let cancelled = false
        let remaining = 3
        const complete = () => {
            if (!cancelled && --remaining === 0) { setSettled(true); onSettled(index, true) }
        }
        const widthAnimation = animateValue(visualWidth, width, { ...geometry, onComplete: complete })
        const heightAnimation = animateValue(visualHeight, totalHeight, { ...geometry, onComplete: complete })
        const contentAnimation = animateValue(openness, open ? 1 : 0, {
            ...geometry,
            ...(geometry.type === "spring" ? { restDelta: 0.0001, restSpeed: 0.001 } : {}),
            onComplete: complete,
        })
        return () => { cancelled = true; widthAnimation.stop(); heightAnimation.stop(); contentAnimation.stop() }
    }, [selectionKey, open, width, totalHeight, horizontal, reduced, geometry, openness, visualWidth, visualHeight, index, onSettled])
    useSafeLayoutEffect(() => {
        const header = headerContentRef.current
        const body = bodyRef.current
        if (!header || !body) return
        const measure = () => {
            const headerStyle = window.getComputedStyle(header)
            const bodyStyle = window.getComputedStyle(body)
            const headerHeight = horizontal ? 0 : header.offsetHeight
            const copyHeight = copyRef.current?.offsetHeight || 0
            const ticketHeight = ticketRef.current ? ticketRef.current.offsetHeight + (parseFloat(window.getComputedStyle(ticketRef.current).marginTop) || 0) : 0
            const top = parseFloat(bodyStyle.paddingTop) || 0
            const bottom = parseFloat(bodyStyle.paddingBottom) || 0
            const right = parseFloat(bodyStyle.paddingRight) || 0
            const next = {
                header: headerHeight, copy: copyHeight, ticket: ticketHeight, top, bottom,
                left: parseFloat(bodyStyle.paddingLeft) || 0, right,
                center: horizontal ? 40 : headerHeight / 2 + ((parseFloat(headerStyle.paddingTop) || 0) - (parseFloat(headerStyle.paddingBottom) || 0)) / 2,
                // Reserve the index/timer above and the closed artwork below.
                // The unconstrained probe remains measurable in either layout.
                minimum: Math.max(top + bottom + copyHeight + ticketHeight + 220, 94 + (sideTitleProbeRef.current?.offsetHeight || 0) + 200),
            }
            setMetrics((previous) => Object.keys(next).some((key) => Math.abs(previous[key as keyof Metrics] - next[key as keyof Metrics]) > 0.5) ? next : previous)
            onMinimum(index, next.minimum, next.header, next.right, next.center)
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measure)
        observer.observe(header)
        if (sideTitleProbeRef.current) observer.observe(sideTitleProbeRef.current)
        if (copyRef.current) observer.observe(copyRef.current)
        if (ticketRef.current) observer.observe(ticketRef.current)
        return () => observer.disconnect()
    }, [horizontal, compact, contentWidth, padding, hasLink, index, onMinimum])
    const bodyContents = (
        <>
            <motion.span aria-hidden={!image?.alt} className="folio-art-position" style={{ position: "absolute", top: 0, left: 0, width: artworkSize, height: artworkSize, x: artX, y: artY, scale: artScale, opacity: artOpacity, transformOrigin: "50% 50%", pointerEvents: "none" }}>
                <motion.span className="folio-art-hover" style={{ display: "block", width: "100%", height: "100%", x: renderDriftX, y: renderDriftY, scale: renderArtScale, rotate: renderArtRotate, transformOrigin: "50% 50%" }}>
                    {image?.src ? <img className="folio-art" src={image.src} srcSet={image.srcSet} alt={image.alt || ""} sizes={horizontal ? "50vw" : "100vw"} draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }} /> : <span aria-hidden="true" style={{ display: "block", width: "66%", height: "66%", margin: "17%", borderRadius: "46% 54% 45% 55%", background: colors.coverText, opacity: 0.16 }} />}
                </motion.span>
            </motion.span>
            <div ref={bodyRef} className="folio-content-padding" style={{ position: "absolute", left: horizontal ? spineWidth : 0, top: headerHeight, width: contentWidth, height: bodyHeight, padding, boxSizing: "border-box" }}>
                <div aria-hidden="true" style={{ height: imageHeight, flexShrink: 0 }} />
                <motion.div style={{ opacity: bodyOpacity }}>
                    <p ref={copyRef} style={{ ...bodyFont, margin: 0, color: colors.secondary, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.description}</p>
                    {hasLink ? <span ref={ticketRef} className="folio-ticket" style={{ position: "relative", display: "flex", alignItems: "center", minHeight: 52, marginTop: 20, padding: "15px 24px 15px 0", color: colors.text, fontSize: ".875em", lineHeight: "1.45em", fontWeight: 500, isolation: "isolate" }}>
                        <span aria-hidden="true" className="folio-ticket-rule" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: colors.text, opacity: 0.18 }} />
                        <motion.span aria-hidden="true" className="folio-ticket-trace" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: colors.text, opacity: 0.55, scaleX: footerProgress, transformOrigin: "0 50%", pointerEvents: "none" }} />
                        <motion.span className="folio-ticket-label" style={{ display: "block", minWidth: 0, overflowWrap: "anywhere", color: footerInk }}>{item.linkLabel || "Explore"}</motion.span>
                    </span> : null}
                </motion.div>
            </div>
        </>
    )
    return (
        <motion.article className="folio-card" data-open={open ? "true" : "false"} data-horizontal={horizontal ? "true" : "false"} data-trigger-engaged={triggerHover || triggerFocus ? "true" : undefined} data-trigger-focus={triggerFocus ? "true" : undefined} data-link-engaged={linkEngaged ? "true" : undefined} style={{ width: visualWidth, height: visualHeight, minHeight: horizontal ? panelHeight : headerHeight, position: "relative", flexShrink: 0, minWidth: 0, borderRadius: radius, overflow: "hidden", background: cover, color: colors.coverText, ...border }}>
            <span ref={sideTitleProbeRef} aria-hidden="true" className="folio-title-probe" style={{ ...sideTitleStyle, top: 0, left: 0, visibility: "hidden", pointerEvents: "none" }}>{item.title || "Untitled"}</span>
            <motion.span aria-hidden="true" style={{ position: "absolute", left: horizontal ? spineWidth : 0, top: headerHeight, right: 0, bottom: 0, background: tone, opacity: paneOpacity, pointerEvents: "none" }} />
            <span className="folio-keyline" aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow: "inset 0 0 0 1px currentColor", pointerEvents: "none", zIndex: 4 }} />
            <h3 style={{ position: "absolute", inset: 0, margin: 0, padding: 0, pointerEvents: "none", zIndex: 2 }}>
                <button ref={setButton} className="folio-trigger" type="button" id={id + "-trigger-" + index} aria-label={item.title || "Untitled"} aria-expanded={open} aria-disabled={open && !collapsible ? true : undefined} aria-controls={id + "-panel-" + index} onClick={onToggle} onKeyDown={onKeyDown}
                    onPointerEnter={(event) => { if (pointerAllowed(event)) { setTriggerHover(true); if (!open) onHoverIntent(event) } }}
                    onPointerMove={(event) => { if (!open && pointerAllowed(event)) onHoverIntent(event) }}
                    onPointerLeave={() => { setTriggerHover(false); resetPointer(); onHoverLeave() }}
                    onPointerCancel={() => { setTriggerHover(false); resetPointer(); onHoverLeave() }}
                    onFocus={(event) => setTriggerFocus(event.currentTarget.matches(":focus-visible"))} onBlur={() => setTriggerFocus(false)}
                    style={{ position: "absolute", top: 0, left: 0, appearance: "none", border: 0, margin: 0, padding: 0, width: horizontal && open ? spineWidth : "100%", height: horizontal ? "100%" : headerHeight, background: "transparent", color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer", pointerEvents: "auto", borderRadius: radius, WebkitTapHighlightColor: "transparent" }}>
                    <span ref={headerContentRef} aria-hidden="true" style={horizontal
                        ? { position: "absolute", top: 0, left: 0, width: spineWidth, height: panelHeight }
                        : { position: "absolute", top: 0, left: 0, display: "flex", alignItems: "center", gap: 12, width, minHeight: mobileHeaderHeight, padding, boxSizing: "border-box" }}>
                        <span className="folio-index" style={horizontal ? { position: "absolute", top: 34, left: 21, fontSize: 11, lineHeight: "1em", fontWeight: 500, letterSpacing: "0.06em", opacity: 0.7 } : { width: 20, flexShrink: 0, fontSize: 11, lineHeight: "1em", fontWeight: 500, letterSpacing: "0.06em", opacity: 0.7 }}>{String(index + 1).padStart(2, "0")}</span>
                        <span className="folio-title" style={horizontal
                            ? { ...sideTitleStyle, left: "50%", top: 94, transform: "translateX(-50%) rotate(180deg)" }
                            : { ...titleFont, fontSize: stackedTitleSize, minWidth: 0, flex: 1, overflowWrap: "anywhere" }}>{item.title || "Untitled"}</span>
                        {!horizontal && !hideThumbnail && image?.src ? <span aria-hidden="true" style={{ width: 48, height: 48, flexShrink: 0 }} /> : null}
                        {!horizontal ? <span aria-hidden="true" style={{ width: 22, height: 22, flexShrink: 0 }} /> : null}
                    </span>
                </button>
            </h3>
            <div id={id + "-panel-" + index} role="region" aria-labelledby={id + "-trigger-" + index} aria-hidden={!open} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
                {hasLink ? <a className="folio-body-link" href={item.link} aria-label={(item.linkLabel || "Explore") + " — " + item.title} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined} tabIndex={open ? 0 : -1}
                    onPointerEnter={enterArtwork} onPointerMove={trackPointer} onPointerLeave={leaveArtwork} onPointerCancel={leaveArtwork} onFocus={(event) => setLinkFocus(event.currentTarget.matches(":focus-visible"))} onBlur={() => setLinkFocus(false)}
                    style={{ position: "absolute", inset: 0, display: "block", borderRadius: radius, color: colors.text, textDecoration: "none", font: "inherit", cursor: "pointer", pointerEvents: open ? "auto" : "none" }}>{bodyContents}</a>
                    : <div onPointerEnter={enterArtwork} onPointerMove={trackPointer} onPointerLeave={leaveArtwork} onPointerCancel={leaveArtwork} style={{ position: "absolute", inset: 0, pointerEvents: open ? "auto" : "none" }}>{bodyContents}</div>}
            </div>
            <span className="folio-mark-slot" data-timer-focus={open && timerFocus ? "true" : undefined} data-timer-engaged={open && timerEngaged ? "true" : undefined} aria-hidden="true" style={{ position: "absolute", left: horizontal ? spineWidth - 56 : width - metrics.right - 33, top: headerCenter - 22, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", pointerEvents: "none", zIndex: 3 }}>
                <PanelMark openness={openness} progress={displayedProgress} timerEnabled={timerEnabled} paused={paused} reduced={reduced} />
            </span>
        </motion.article>
    )
}

/**
 * Alloy Accordion: expanding covers with an integrated linked artwork area.
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 520
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function AlloyAccordion(props: AlloyAccordionProps) {
    const {
        items = DEFAULT_ITEMS, initialOpen = 3, collapsible = true, hoverToOpen = true, autoplay = false, interval = 5,
        colors: customColors, titleFont: customTitle, bodyFont: customBody,
        padding = "24px", compactPadding = "20px", radius = "8px", gap = "8px",
        border = { borderWidth: 0, borderStyle: "solid", borderColor: "rgba(40,35,38,0.18)" },
        cardHeight = 520, closedWidth = 112, mobileHeaderHeight = 96, breakpoint = 820,
        layoutMode = "auto", minOpenWidth = 442,
        animate = true, hoverMotion = true, artTravel = 4, transition = DEFAULT_TRANSITION, style,
    } = props
    const safeItems = Array.isArray(items) ? items : DEFAULT_ITEMS
    const colors = { ...DEFAULT_COLORS, ...customColors }
    const titleFont = { ...DEFAULT_TITLE, ...customTitle }
    const bodyFont = { ...DEFAULT_BODY, ...customBody }
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const reduced = Boolean(isStatic || reducedMotion || !animate)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const viewportRef = React.useRef<HTMLDivElement>(null)
    const fontProbeRef = React.useRef<HTMLSpanElement>(null)
    const buttons = React.useRef<(HTMLButtonElement | null)[]>([])
    const id = "folio-" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const [layout, setLayout] = React.useState({ width: 1040, columnGap: 8, rowGap: 8, fontSize: 40 })
    const [minimumHeights, setMinimumHeights] = React.useState<Record<number, number>>({})
    const [active, setActive] = React.useState(() => initialIndex(initialOpen, safeItems.length, collapsible))
    const activeRef = React.useRef(active)
    activeRef.current = active
    const progress = useMotionValue(0)
    const clockEpoch = React.useRef(0)
    const [userPaused, setUserPaused] = React.useState(false)
    const [pointerInside, setPointerInside] = React.useState(false)
    const [playThroughHover, setPlayThroughHover] = React.useState(false)
    const [inView, setInView] = React.useState(false)
    const [pageVisible, setPageVisible] = React.useState(true)
    const [cycle, setCycle] = React.useState(0)
    const hoverTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingHover = React.useRef(-1)
    const hoverPosition = React.useRef({ x: 0, y: 0 })
    const lastHoverSwitch = React.useRef({ x: -9999, y: -9999, index: -1, time: 0 })
    const hoverScrollUntil = React.useRef(0)
    const elapsed = React.useRef(0)
    const [geometrySettled, setGeometrySettled] = React.useState(true)
    const geometryState = React.useRef<Record<number, { width: number; height: number }>>({})
    const timerX = useMotionValue(0)
    const timerY = useMotionValue(0)
    const [timerFocus, setTimerFocus] = React.useState(false)
    const [timerEngaged, setTimerEngaged] = React.useState(false)
    const duration = Math.max(2, Number.isFinite(interval) ? interval : 5) * 1000
    const timerEnabled = autoplay && safeItems.length > 1 && (!reduced || isStatic)
    const running = geometrySettled && timerEnabled && !reduced && !userPaused && (!pointerInside || playThroughHover) && inView && pageVisible && active >= 0
    const cancelHover = React.useCallback(() => {
        if (hoverTimeout.current !== null) clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
        pendingHover.current = -1
    }, [])
    const selectPanel = React.useCallback((next: number) => {
        cancelHover()
        lastHoverSwitch.current = { ...hoverPosition.current, index: -1, time: 0 }
        clockEpoch.current += 1
        setActive(next)
        setCycle((value) => value + 1)
        elapsed.current = 0
        setGeometrySettled(reduced)
    }, [reduced, cancelHover])
    const focusHoldsPanel = () => {
        const root = rootRef.current
        const focused = root?.ownerDocument.activeElement
        return Boolean(root && focused instanceof HTMLElement && root.contains(focused) && focused.classList.contains("folio-body-link") && focused.matches(":focus-visible"))
    }
    const hoverIntent = (index: number, event: React.PointerEvent<HTMLElement>) => {
        if (!hoverToOpen || isStatic || focusHoldsPanel() || index === active || event.pointerType === "touch" || event.buttons || performance.now() < hoverScrollUntil.current || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return
        // Expansion can move another cover under a stationary pointer. Require a
        // fresh pointer position before another hover selection is accepted.
        const { clientX: x, clientY: y } = event
        hoverPosition.current = { x, y }
        const last = lastHoverSwitch.current
        if (Math.abs(x - last.x) + Math.abs(y - last.y) < 4 || pendingHover.current === index) return
        cancelHover()
        pendingHover.current = index
        const target = event.currentTarget
        hoverTimeout.current = setTimeout(() => {
            hoverTimeout.current = null
            pendingHover.current = -1
            if (!target.isConnected || !target.matches(":hover") || focusHoldsPanel()) return
            selectPanel(index)
            lastHoverSwitch.current = { ...hoverPosition.current, index, time: performance.now() }
        }, 120)
    }
    React.useEffect(() => cancelHover, [cancelHover])
    React.useEffect(() => { cancelHover() }, [hoverToOpen, safeItems.length, cancelHover])
    useSafeLayoutEffect(() => {
        // Child subscriptions switch before this reset, keeping closing rings intact.
        clockEpoch.current += 1
        elapsed.current = 0
        progress.set(0)
    }, [active, cycle, duration, progress, reduced])
    React.useEffect(() => {
        if (typeof document === "undefined") return
        const update = () => setPageVisible(document.visibilityState === "visible")
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        if (typeof IntersectionObserver === "undefined") { setInView(true); return }
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.25), { threshold: [0, 0.25] })
        observer.observe(root)
        return () => observer.disconnect()
    }, [isStatic])
    React.useEffect(() => {
        if (!running) return
        const epoch = clockEpoch.current
        let frame = 0
        let previous = performance.now()
        const tick = (now: number) => {
            if (epoch !== clockEpoch.current) return
            const delta = Math.max(0, now - previous)
            previous = now
            elapsed.current = Math.min(duration, elapsed.current + delta)
            progress.set(elapsed.current / duration)
            if (elapsed.current >= duration) {
                selectPanel((active + 1) % safeItems.length)
                return
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [running, active, cycle, duration, safeItems.length, progress, selectPanel])
    const [headerMetrics, setHeaderMetrics] = React.useState<Record<number, { height: number; right: number; center: number }>>({})
    const setMinimum = React.useCallback((index: number, minimum: number, header: number, right: number, center: number) => {
        setMinimumHeights((previous) => Math.abs((previous[index] || 0) - minimum) > 0.5 ? { ...previous, [index]: minimum } : previous)
        setHeaderMetrics((previous) => Math.abs((previous[index]?.height || 0) - header) > 0.5 || Math.abs((previous[index]?.right || 0) - right) > 0.5 || Math.abs((previous[index]?.center || 0) - center) > 0.5 ? { ...previous, [index]: { height: header, right, center } } : previous)
    }, [])

    React.useEffect(() => {
        setActive(initialIndex(initialOpen, safeItems.length, collapsible))
    }, [initialOpen, safeItems.length, collapsible])

    useSafeLayoutEffect(() => {
        const root = rootRef.current
        const probe = fontProbeRef.current
        if (!root || !probe) return
        const measure = () => {
            const width = root.clientWidth
            const computed = window.getComputedStyle(root)
            const next = {
                width,
                columnGap: numericGap(computed.columnGap, width),
                rowGap: numericGap(computed.rowGap, root.clientHeight),
                fontSize: parseFloat(window.getComputedStyle(probe).fontSize) || 40,
            }
            setLayout((previous) => Math.abs(previous.width - next.width) > 0.5 || Math.abs(previous.columnGap - next.columnGap) > 0.5 || Math.abs(previous.rowGap - next.rowGap) > 0.5 || Math.abs(previous.fontSize - next.fontSize) > 0.5 ? next : previous)
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measure)
        observer.observe(root)
        observer.observe(probe)
        return () => observer.disconnect()
    }, [gap, titleFont.fontSize, titleFont.lineHeight])

    const gaps = Math.max(0, safeItems.length - 1) * layout.columnGap
    const closedSpace = Math.max(0, safeItems.length - 1) * closedWidth
    const effectiveMinOpenWidth = Math.max(Number.isFinite(minOpenWidth) ? minOpenWidth : 442, closedWidth + layout.fontSize * 7)
    // Orientation follows the chosen layout and breakpoint only. Extra items
    // extend the horizontal track instead of unexpectedly stacking the cards.
    const horizontal = safeItems.length > 0 && (layoutMode === "horizontal" || (layoutMode === "auto" && layout.width >= breakpoint))
    const trackWidth = horizontal ? Math.max(layout.width, closedSpace + gaps + effectiveMinOpenWidth) : layout.width
    const activeWidth = Math.max(0, trackWidth - gaps - closedSpace)
    const scrollable = horizontal && trackWidth > layout.width + 0.5
    const compact = layout.width < 600
    const desktopHeight = Math.max(cardHeight, ...safeItems.map((_, index) => minimumHeights[index] || 0))
    const equalClosedWidth = safeItems.length ? Math.max(0, (trackWidth - gaps) / safeItems.length) : 0
    const measuredHeader = headerMetrics[active]
    const activeHeaderHeight = horizontal ? 0 : Math.max(mobileHeaderHeight, measuredHeader?.height || 0)
    const activeHeader = {
        height: activeHeaderHeight,
        right: measuredHeader?.right ?? (compact ? 20 : 24),
        center: horizontal ? 40 : measuredHeader && measuredHeader.height > 0
            ? measuredHeader.center + (activeHeaderHeight - measuredHeader.height) / 2
            : activeHeaderHeight / 2,
    }
    // The one persistent timer button keeps keyboard focus. Its transparent hit
    // area follows the live panel geometry; the visible mark belongs to the card.
    const positionTimer = React.useCallback(() => {
        if (active < 0) return
        const preceding = safeItems.slice(0, active).reduce((sum, _, index) => {
            const box = geometryState.current[index]
            return sum + (horizontal ? box?.width ?? closedWidth : box?.height ?? headerMetrics[index]?.height ?? mobileHeaderHeight) + (horizontal ? layout.columnGap : layout.rowGap)
        }, 0)
        timerX.set(horizontal ? preceding + closedWidth - 56 : layout.width - activeHeader.right - 33)
        timerY.set((horizontal ? 0 : preceding) + activeHeader.center - 22)
    }, [active, horizontal, safeItems.length, closedWidth, activeWidth, mobileHeaderHeight, layout.width, layout.columnGap, layout.rowGap, activeHeader.right, activeHeader.center, headerMetrics, timerX, timerY])
    const onGeometry = React.useCallback((index: number, width: number, height: number) => {
        geometryState.current[index] = { width, height }
        positionTimer()
    }, [positionTimer])
    const onSettled = React.useCallback((index: number, settled: boolean) => {
        if (index === activeRef.current || activeRef.current < 0) setGeometrySettled(settled)
    }, [])
    useSafeLayoutEffect(positionTimer, [positionTimer])
    React.useEffect(() => { cancelHover() }, [horizontal, layout.width, cancelHover])

    const revealItem = React.useCallback((index: number, headerOnly = false, immediate = false) => {
        const viewport = viewportRef.current
        const button = buttons.current[index]
        if (!scrollable || !viewport || !button) return
        const card = button.closest<HTMLElement>(".folio-card")
        if (!card) return
        // Keep scroll coordinates in layout pixels, including on a zoomed canvas.
        const targetWidth = headerOnly ? button.offsetWidth : card.offsetWidth
        const left = card.offsetLeft + (headerOnly ? button.offsetLeft : 0)
        const right = left + targetWidth
        const visibleLeft = viewport.scrollLeft
        const visibleRight = visibleLeft + viewport.clientWidth
        let next = visibleLeft
        if (targetWidth > viewport.clientWidth || left < visibleLeft) next = left
        else if (right > visibleRight) next = right - viewport.clientWidth
        next = Math.max(0, Math.min(next, viewport.scrollWidth - viewport.clientWidth))
        if (Math.abs(next - visibleLeft) > 0.5) viewport.scrollTo({ left: next, behavior: reduced || immediate ? "auto" : "smooth" })
    }, [scrollable, reduced])
    useSafeLayoutEffect(() => {
        if (!scrollable) {
            if (viewportRef.current) viewportRef.current.scrollLeft = 0
            return
        }
        if (geometrySettled && active >= 0) {
            const focused = viewportRef.current?.ownerDocument.activeElement
            const focusedIndex = focused instanceof HTMLButtonElement && focused.matches(":focus-visible") ? buttons.current.indexOf(focused) : -1
            if (focusedIndex >= 0 && focusedIndex !== active) revealItem(focusedIndex, true, true)
            else revealItem(active)
        }
    }, [scrollable, trackWidth, layout.width, active, geometrySettled, revealItem])
    const handleScroll = () => {
        cancelHover()
        hoverScrollUntil.current = performance.now() + 160
        lastHoverSwitch.current = { ...hoverPosition.current, index: -1, time: 0 }
    }

    const focusHeader = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let target = index
        if (event.key === "ArrowDown" || (horizontal && event.key === "ArrowRight")) target = (index + 1) % safeItems.length
        else if (event.key === "ArrowUp" || (horizontal && event.key === "ArrowLeft")) target = (index - 1 + safeItems.length) % safeItems.length
        else if (event.key === "Home") target = 0
        else if (event.key === "End") target = safeItems.length - 1
        else return
        event.preventDefault()
        buttons.current[target]?.focus({ preventScroll: scrollable })
        revealItem(target, true, true)
    }

    if (!safeItems.length && !isStatic) return null

    const scope = "." + id
    const css = [
        scope + ", " + scope + " * { box-sizing: border-box; }",
        scope + " .folio-trigger:focus { outline:none; }",
        scope + " .folio-trigger:focus-visible { outline:2px solid " + colors.focus + "; outline-offset:-5px; }",
        scope + " .folio-timer:focus { outline:none; }",
        scope + " .folio-mark-slot[data-timer-focus=true] { outline:2px solid " + colors.focus + "; outline-offset:2px; }",
        scope + " .folio-body-link:focus-visible { outline:2px solid " + colors.text + "; outline-offset:-3px; }",
        scope + " .folio-keyline { opacity:.08; transition:opacity 240ms ease; }",
        scope + " .folio-card[data-trigger-engaged=true] .folio-keyline, " + scope + " .folio-card[data-link-engaged=true] .folio-keyline { opacity:.22; }",
        scope + " .folio-mark-track { transition:opacity 220ms ease; }",
        scope + " .folio-card[data-trigger-engaged=true] .folio-mark-track, " + scope + " .folio-mark-slot[data-timer-engaged=true] .folio-mark-track { opacity:.5; }",
        scope + " .folio-index { transition:opacity 220ms ease; }",
        scope + " .folio-card[data-trigger-engaged=true] .folio-index { opacity:1 !important; }",
        scope + " .folio-ticket-trace { transition:opacity 180ms ease; }",
        scope + " .folio-body-link:active .folio-ticket-trace { opacity:.38 !important; }",
        scope + "[data-no-motion=true] *, " + scope + "[data-hover-motion=false] * { transition:none !important; }",
        "@media (prefers-reduced-motion:reduce) { " + scope + " * { transition:none !important; } }",
    ].join("\n")

    return (
        <div ref={rootRef} className={id} onPointerMoveCapture={(event) => { hoverPosition.current = { x: event.clientX, y: event.clientY } }} data-autoplay={timerEnabled ? (running ? "running" : "paused") : "off"} data-layout={horizontal ? "horizontal" : "vertical"} onPointerEnter={(event) => { if (event.pointerType !== "touch") setPointerInside(true) }} onPointerLeave={() => { setPointerInside(false); setPlayThroughHover(false); cancelHover() }} onPointerDownCapture={(event) => { if (event.pointerType === "touch" && !(event.target instanceof Element && event.target.closest(".folio-timer"))) setUserPaused(true) }} onFocusCapture={(event) => { if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) { cancelHover(); setUserPaused(true); const index = buttons.current.findIndex((button) => button?.isSameNode(event.target)); if (index >= 0) revealItem(index, true, true) } }} data-no-motion={reduced ? "true" : undefined} data-hover-motion={hoverMotion ? "true" : "false"} style={{ position: "relative", minWidth: 0, display: "block", gap, ...bodyFont, ...style }}>
            <style>{css}</style>
            <span ref={fontProbeRef} aria-hidden="true" style={{ ...titleFont, position: "absolute", visibility: "hidden", pointerEvents: "none", width: "max-content", top: 0, left: 0 }}>M</span>
            <div ref={viewportRef} className="folio-viewport" onScroll={handleScroll} style={{ width: "100%", minWidth: 0, overflowX: scrollable ? "auto" : "visible", overflowY: scrollable ? "hidden" : "visible", overscrollBehaviorX: "contain" }}>
            <div className="folio-track" style={{ position: "relative", width: trackWidth, display: "flex", flexDirection: horizontal ? "row" : "column", alignItems: "flex-start", columnGap: layout.columnGap, rowGap: layout.rowGap }}>
            {safeItems.length ? safeItems.map((item, index) => (
                <FolioPanel
                    key={index} item={item} index={index} open={active === index} collapsible={collapsible}
                    horizontal={horizontal} compact={compact}
                    width={horizontal ? (active < 0 ? equalClosedWidth : active === index ? activeWidth : closedWidth) : layout.width}
                    activeWidth={horizontal ? activeWidth : layout.width} spineWidth={closedWidth}
                    panelHeight={desktopHeight} mobileHeaderHeight={mobileHeaderHeight}
                    colors={colors} titleFont={titleFont} bodyFont={bodyFont}
                    padding={compact ? compactPadding : padding}
                    radius={radius} border={border} transition={transition} reduced={reduced} hoverMotion={hoverMotion} artTravel={artTravel} motionActive={inView && pageVisible}
                    id={id} setButton={(node) => { buttons.current[index] = node }}
                    onToggle={(event) => {
                        cancelHover()
                        if (event.detail > 0 && active === index && lastHoverSwitch.current.index === index && performance.now() - lastHoverSwitch.current.time < 650) return
                        if (active === index && !collapsible) return
                        if (active === index && collapsible) setUserPaused(true)
                        selectPanel(active === index && collapsible ? -1 : index)
                    }}
                    onHoverIntent={(event) => hoverIntent(index, event)} onHoverLeave={cancelHover}
                    timerEnabled={timerEnabled} progress={progress} paused={userPaused} timerFocus={timerFocus} timerEngaged={timerEngaged} onGeometry={onGeometry} onSettled={onSettled} selectionKey={active + "-" + cycle}
                    onKeyDown={(event) => focusHeader(event, index)}
                    onMinimum={setMinimum}
                />
            )) : <div style={{ padding: 24, color: colors.text }}>Add an item in the component controls.</div>}
            {timerEnabled ? (
                <motion.button type="button" className="folio-timer" aria-label={userPaused ? "Resume autoplay" : "Pause autoplay"} title={userPaused ? "Resume autoplay" : "Pause autoplay"} aria-controls={active >= 0 ? id + "-panel-" + active : undefined} aria-hidden={active < 0} tabIndex={active >= 0 ? 0 : -1} onFocus={(event) => setTimerFocus(event.currentTarget.matches(":focus-visible"))} onBlur={() => setTimerFocus(false)} onPointerEnter={() => setTimerEngaged(true)} onPointerLeave={() => setTimerEngaged(false)} onClick={() => { cancelHover(); setUserPaused((paused) => !paused); setPlayThroughHover(true) }} style={{ position: "absolute", left: timerX, top: timerY, zIndex: 5, width: 44, height: 44, padding: 0, border: 0, borderRadius: "50%", background: "transparent", cursor: "pointer", visibility: active >= 0 ? "visible" : "hidden", pointerEvents: active >= 0 ? "auto" : "none", WebkitTapHighlightColor: "transparent" }} />
            ) : null}
            </div>
            </div>
        </div>
    )
}

AlloyAccordion.displayName = "Alloy Accordion"

addPropertyControls(AlloyAccordion, {
    items: {
        type: ControlType.Array, title: "Items", maxCount: 12, defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "New service" },
                description: { type: ControlType.String, title: "Description", defaultValue: "A short description of what you do.", displayTextArea: true },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageScale: { type: ControlType.Number, title: "Image Scale", defaultValue: 94, min: 50, max: 100, step: 1, unit: "%", description: "Size of the artwork inside the open card. Cover thumbnails keep their size." },
                tone: { type: ControlType.Color, title: "Open Color", defaultValue: "#AE8EE7" },
                coverColor: { type: ControlType.Color, title: "Cover Color", defaultValue: "#24262B" },
                linkLabel: { type: ControlType.String, title: "Link Label", defaultValue: "Explore" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false },
            },
        },
    },
    layoutMode: { type: ControlType.Enum, title: "Layout", options: ["auto", "horizontal", "vertical"], optionTitles: ["Auto", "Horizontal", "Vertical"], defaultValue: "auto", displaySegmentedControl: true, description: "Auto changes direction only at Stack Below. Horizontal and Vertical keep the direction you choose. Adding items never changes direction." },
    breakpoint: { type: ControlType.Number, title: "Stack Below", min: 320, max: 1600, step: 10, unit: "px", defaultValue: 820, hidden: (props) => props.layoutMode !== undefined && props.layoutMode !== "auto", description: "Auto uses vertical cards below this component width and horizontal cards at or above it." },
    initialOpen: { type: ControlType.Number, title: "Initial Open", min: 0, max: 12, step: 1, defaultValue: 3, displayStepper: true, description: "Item number to open initially. Set to 0 to start closed." },
    collapsible: { type: ControlType.Boolean, title: "Collapsible", defaultValue: true },
    hoverToOpen: { type: ControlType.Boolean, title: "Hover to Open", defaultValue: true },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: false },
    interval: { type: ControlType.Number, title: "Interval", defaultValue: 5, min: 2, max: 20, step: 0.5, unit: "s", hidden: (props) => !props.autoplay },
    colors: {
        type: ControlType.Object, title: "Colors", icon: "color", defaultValue: DEFAULT_COLORS,
        controls: {
            text: { type: ControlType.Color, title: "Text", defaultValue: DEFAULT_COLORS.text },
            secondary: { type: ControlType.Color, title: "Secondary", defaultValue: DEFAULT_COLORS.secondary },
            coverText: { type: ControlType.Color, title: "Cover Text", defaultValue: DEFAULT_COLORS.coverText },
            focus: { type: ControlType.Color, title: "Focus", defaultValue: DEFAULT_COLORS.focus },
        },
    },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "40px", variant: "Medium", letterSpacing: "-0.045em", lineHeight: "1.08em", textAlign: "left" } },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "16px", variant: "Regular", letterSpacing: "-0.015em", lineHeight: "1.55em", textAlign: "left" } },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "24px" },
    compactPadding: { type: ControlType.Padding, title: "Compact Padding", defaultValue: "20px" },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "8px" },
    gap: { type: ControlType.Gap, title: "Gap", defaultValue: "8px" },
    border: { type: ControlType.Border, title: "Border", defaultValue: { borderWidth: 0, borderStyle: "solid", borderColor: "rgba(40,35,38,0.18)" } },
    cardHeight: { type: ControlType.Number, title: "Cover Height", min: 400, max: 900, step: 10, unit: "px", defaultValue: 520, description: "Minimum horizontal height. All covers grow together when longer titles or content need more room." },
    closedWidth: { type: ControlType.Number, title: "Closed Width", min: 96, max: 220, step: 1, unit: "px", defaultValue: 112 },
    mobileHeaderHeight: { type: ControlType.Number, title: "Mobile Header", min: 80, max: 180, step: 1, unit: "px", defaultValue: 96 },
    minOpenWidth: { type: ControlType.Number, title: "Min Open Width", min: 360, max: 1000, step: 1, unit: "px", defaultValue: 442, hidden: (props) => props.layoutMode === "vertical", description: "Minimum expanded card width, including its cover. When the cards no longer fit, the horizontal row scrolls instead of stacking." },
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true },
    hoverMotion: { type: ControlType.Boolean, title: "Hover Motion", defaultValue: true },
    artTravel: { type: ControlType.Number, title: "Art Travel", defaultValue: 4, min: 0, max: 12, step: 1, unit: "px", hidden: (props) => !props.hoverMotion },
    transition: { type: ControlType.Transition, title: "Transition", defaultValue: DEFAULT_TRANSITION, description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
})
