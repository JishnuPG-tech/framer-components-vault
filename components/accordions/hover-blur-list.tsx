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

import { motion, useReducedMotion, useSpring, type Transition } from "framer-motion"

interface ResponsiveImage {
    src?: string
    srcSet?: string
    alt?: string
    positionX?: string
    positionY?: string
}
type SamplePhoto = "none" | "stair" | "coast" | "chair" | "garden"
interface AccordionItem {
    title?: string
    category?: string
    description?: string
    image?: ResponsiveImage
    samplePhoto?: SamplePhoto
    link?: string
    linkLabel?: string
    newTab?: boolean
}
interface Props {
    items?: AccordionItem[]
    initialOpen?: number
    showNumbers?: boolean
    showDescription?: boolean
    background?: string
    textColor?: string
    mutedColor?: string
    accentColor?: string
    divider?: React.CSSProperties
    padding?: string
    smallPadding?: string
    rowPadding?: string
    imageRadius?: string
    imageRatio?: number
    mobileRatio?: number
    photoWidth?: number
    followAmount?: number
    titleFont?: React.CSSProperties
    smallTitleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    blur?: number
    hoverBlur?: number
    transition?: Transition
    focusColor?: string
    style?: React.CSSProperties
}

const samples: Record<Exclude<SamplePhoto, "none">, ResponsiveImage> = {
    stair: { src: "https://framerusercontent.com/images/hhpiRitQsx9nG8gRvyCUtXbxknM.png", alt: "Sunlight across a sculptural travertine staircase and warm stone interior" },
    coast: { src: "https://framerusercontent.com/images/ctgckvWCvfdgJ4HK4hRnuovPw.png", alt: "A warm limestone coastal home overlooking the calm blue-green sea" },
    chair: { src: "https://framerusercontent.com/images/D9uzavkupNZh6ku3EEcS1y3lnS0.png", alt: "A curved dark walnut chair with linen against an earthy plaster wall" },
    garden: { src: "https://framerusercontent.com/images/PJhfqwhNFTPDvJxxCLpYxyGUQ.png", alt: "Sculptural olive tree and reflecting pool in a warm stone courtyard" },
}
const demoItems: AccordionItem[] = [
    { title: "Sculpted spaces", category: "Architecture", description: "Quiet geometry. Natural light. Spaces shaped around the way we live.", image: samples.stair, samplePhoto: "stair", link: "", linkLabel: "View project", newTab: false },
    { title: "Coastal stillness", category: "Retreats", description: "Open horizons and honest materials, with room to slow down.", image: samples.coast, samplePhoto: "coast", link: "", linkLabel: "View project", newTab: false },
    { title: "Objects of quiet", category: "Interiors", description: "Tactile details and considered forms that feel at home, every day.", image: samples.chair, samplePhoto: "chair", link: "", linkLabel: "View project", newTab: false },
    { title: "Living gardens", category: "Landscape", description: "Leaf, light and water. A quiet connection to the natural world.", image: samples.garden, samplePhoto: "garden", link: "", linkLabel: "View project", newTab: false },
]

const titleControlDefault = { fontSize: "44px", lineHeight: "1.08em", letterSpacing: "-0.055em", textAlign: "left" as const, variant: "Medium" as const }
const smallTitleControlDefault = { ...titleControlDefault, fontSize: "26px", letterSpacing: "-0.04em" }
const bodyControlDefault = { fontSize: "13px", lineHeight: "1.55em", letterSpacing: "-0.01em", textAlign: "left" as const, variant: "Regular" as const }
const labelControlDefault = { fontSize: "10px", lineHeight: "1.4em", letterSpacing: "0.12em", textAlign: "left" as const, variant: "Medium" as const }
const defaultTitle: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: "44px", fontWeight: 500, lineHeight: "1.08em", letterSpacing: "-0.055em", textAlign: "left" }
const defaultSmallTitle: React.CSSProperties = { ...defaultTitle, fontSize: "26px", letterSpacing: "-0.04em" }
const defaultBody: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 400, lineHeight: "1.55em", letterSpacing: "-0.01em", textAlign: "left" }
const defaultLabel: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 500, lineHeight: "1.4em", letterSpacing: "0.12em", textAlign: "left" }
const defaultTransition: Transition = { type: "tween", duration: 0.78, ease: [0.22, 1, 0.36, 1] }
const defaultDivider = { borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 1, borderLeftWidth: 0, borderStyle: "solid" as const, borderColor: "#373B35" }

function imageFor(item: AccordionItem): ResponsiveImage | undefined {
    if (item.image?.src) return item.image
    if (item.samplePhoto && item.samplePhoto !== "none") return samples[item.samplePhoto]
    return undefined
}
function safeLink(value?: string) {
    if (!value) return ""
    const link = value.trim()
    return /^(javascript|data|vbscript):/i.test(link) ? "" : link
}
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const useClientLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
interface PhotoGeometry {
    width: number
    height: number
    photoWidth: number
    photoHeight: number
    baseLeft: number
    centers: number[]
    rowHeights: number[]
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 480
 * @framerDisableUnlink
 */
export default function HoverBlurList(props: Props) {
    const {
        items = demoItems, initialOpen = 1, showNumbers = true, showDescription = true,
        background = "#181B18", textColor = "#F1F0E8", mutedColor = "#92978D", accentColor = "#E9E7DD",
        divider = defaultDivider, padding = "16px 32px 16px 32px", smallPadding = "0px 0px 0px 0px", rowPadding = "24px 0px 24px 0px",
        imageRadius = "14px", imageRatio = 1.04, mobileRatio = 1.6, photoWidth = 320, followAmount = 14,
        titleFont = defaultTitle, smallTitleFont = defaultSmallTitle, bodyFont = defaultBody, labelFont = defaultLabel,
        blur = 10, hoverBlur = 0.8, transition = defaultTransition, focusColor = "#E9E7DD", style,
    } = props
    const cleanItems = Array.isArray(items) ? items.filter(Boolean) : []
    const initialIndex = Math.max(0, Math.min(Math.floor(initialOpen || 1) - 1, cleanItems.length - 1))
    const [active, setActive] = React.useState(initialIndex)
    const [mobileOpen, setMobileOpen] = React.useState(initialIndex)
    const [pointerWithin, setPointerWithin] = React.useState(false)
    const [focusWithin, setFocusWithin] = React.useState(false)
    const root = React.useRef<HTMLDivElement>(null)
    const list = React.useRef<HTMLDivElement>(null)
    const floatingPhoto = React.useRef<HTMLDivElement>(null)
    const controls = React.useRef<Array<HTMLElement | null>>([])
    const mobileControls = React.useRef<Array<HTMLButtonElement | null>>([])
    const mobileId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const rows = React.useRef<Array<HTMLDivElement | null>>([])
    const geometry = React.useRef<PhotoGeometry | null>(null)
    const activeRef = React.useRef(initialIndex)
    const photoHovered = React.useRef(false)
    const reducedMotion = useReducedMotion()
    const motionTransition: Transition = reducedMotion ? { duration: 0 } : transition
    const photoX = useSpring(0, { stiffness: 110, damping: 27, mass: 0.9 })
    const photoY = useSpring(0, { stiffness: 110, damping: 27, mass: 0.9 })
    const photoTilt = useSpring(0, { stiffness: 100, damping: 26, mass: 0.9 })
    const engaged = pointerWithin || focusWithin
    const activeIndex = Math.max(0, Math.min(active, cleanItems.length - 1))
    const activeItem = cleanItems[activeIndex]
    const activeImage = activeItem ? imageFor(activeItem) : undefined
    const activeHref = safeLink(activeItem?.link)
    const hasPhotos = cleanItems.some(item => Boolean(imageFor(item)?.src))
    const safeRatio = Math.max(0.5, imageRatio || 1.04)

    const positionPhoto = React.useCallback((index: number, offsetX = 0, offsetY = 0, immediate = false) => {
        const box = geometry.current
        if (!box || box.photoWidth <= 0 || box.height <= 0) return
        const center = box.centers[index] ?? box.height / 2
        const absoluteX = clamp(box.baseLeft + offsetX, box.width * 0.6 + 8, box.width - box.photoWidth - 10)
        const absoluteY = clamp(center - box.photoHeight / 2 + offsetY, 10, Math.max(10, box.height - box.photoHeight - 10))
        const tilt = reducedMotion || !followAmount ? 0 : clamp(offsetX / Math.max(1, followAmount), -1, 1) * 0.65
        if (reducedMotion || immediate) {
            photoX.jump(absoluteX - box.baseLeft)
            photoY.jump(absoluteY)
            photoTilt.jump(0)
        } else {
            photoX.set(absoluteX - box.baseLeft)
            photoY.set(absoluteY)
            photoTilt.set(tilt)
        }
    }, [reducedMotion, followAmount, photoX, photoY, photoTilt])

    const freezePhoto = () => {
        photoX.jump(photoX.get())
        photoY.jump(photoY.get())
        photoTilt.jump(photoTilt.get())
    }

    const selectItem = (index: number, keyboard = false) => {
        if (photoHovered.current && !keyboard) return
        activeRef.current = index
        setActive(index)
        positionPhoto(index)
    }

    React.useEffect(() => {
        activeRef.current = initialIndex
        setActive(initialIndex)
        setMobileOpen(initialIndex)
        positionPhoto(initialIndex, 0, 0, true)
    }, [initialOpen, cleanItems.length, positionPhoto])

    useClientLayoutEffect(() => {
        const listElement = list.current
        if (!listElement) return
        const measure = () => {
            const photoElement = floatingPhoto.current
            if (!photoElement || !photoElement.offsetWidth) { geometry.current = null; return }
            geometry.current = {
                width: listElement.clientWidth,
                height: listElement.clientHeight,
                photoWidth: photoElement.offsetWidth,
                photoHeight: photoElement.offsetHeight,
                baseLeft: photoElement.offsetLeft,
                centers: rows.current.slice(0, cleanItems.length).map(row => row ? row.offsetTop + row.offsetHeight / 2 : 0),
                rowHeights: rows.current.slice(0, cleanItems.length).map(row => row?.offsetHeight || 1),
            }
            positionPhoto(activeRef.current, 0, 0, true)
        }
        measure()
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }
        const observer = new ResizeObserver(measure)
        observer.observe(listElement)
        if (floatingPhoto.current) observer.observe(floatingPhoto.current)
        rows.current.slice(0, cleanItems.length).forEach(row => { if (row) observer.observe(row) })
        return () => observer.disconnect()
    }, [cleanItems.length, hasPhotos, photoWidth, safeRatio, padding, smallPadding, rowPadding, positionPhoto])

    const followPointer = (event: React.PointerEvent<HTMLDivElement>) => {
        if (reducedMotion || photoHovered.current || !followAmount || (event.pointerType !== "mouse" && event.pointerType !== "pen")) return
        const box = geometry.current
        const element = list.current
        if (!box || !element) return
        const rect = element.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const localX = (event.clientX - rect.left) * box.width / rect.width
        const localY = (event.clientY - rect.top) * box.height / rect.height
        const index = activeRef.current
        const normalizedX = clamp(localX / box.width * 2 - 1, -1, 1)
        const normalizedY = clamp((localY - (box.centers[index] || 0)) / Math.max(1, (box.rowHeights[index] || 1) / 2), -1, 1)
        positionPhoto(index, normalizedX * followAmount, normalizedY * followAmount * 0.65)
    }

    const navigate = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
        let next = index
        if (event.key === "ArrowDown") next = (index + 1) % cleanItems.length
        else if (event.key === "ArrowUp") next = (index - 1 + cleanItems.length) % cleanItems.length
        else if (event.key === "Home") next = 0
        else if (event.key === "End") next = cleanItems.length - 1
        else return
        event.preventDefault()
        controls.current[next]?.focus()
    }

    const navigateMobile = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next = index
        if (event.key === "ArrowDown") next = (index + 1) % cleanItems.length
        else if (event.key === "ArrowUp") next = (index - 1 + cleanItems.length) % cleanItems.length
        else if (event.key === "Home") next = 0
        else if (event.key === "End") next = cleanItems.length - 1
        else return
        event.preventDefault()
        mobileControls.current[next]?.focus()
    }

    const toggleMobile = (index: number) => {
        setMobileOpen(current => current === index ? -1 : index)
        selectItem(index, true)
    }

    const rootStyle = {
        position: "relative", boxSizing: "border-box", minWidth: 0, background, color: textColor,
        containerType: "inline-size", containerName: "veil-hover", containIntrinsicInlineSize: "1040px",
        "--veil-padding": padding, "--veil-small-padding": smallPadding, "--veil-focus": focusColor,
        "--veil-photo-width": `${Math.max(120, photoWidth)}px`, "--veil-photo-ratio": safeRatio,
        "--veil-mobile-ratio": Math.max(0.75, mobileRatio || 1.6), "--veil-radius": imageRadius,
        "--veil-accent": accentColor, "--veil-secondary": mutedColor, "--veil-background": background,
        "--veil-title-size": typeof titleFont.fontSize === "number" ? `${titleFont.fontSize}px` : titleFont.fontSize || "44px", ...style,
    } as React.CSSProperties

    const photoContent = <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: imageRadius, background: "#242822", isolation: "isolate" }}>
        {cleanItems.map((item, index) => {
            const image = imageFor(item)
            const isActive = index === activeIndex
            if (!image?.src) return null
            return <motion.figure key={index} aria-hidden={!isActive} initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={motionTransition} style={{ position: "absolute", inset: 0, margin: 0, zIndex: isActive ? 1 : 0, pointerEvents: "none" }}>
                <motion.img src={image.src} srcSet={image.srcSet} sizes="340px" alt={image.alt || ""} decoding="async" loading={index === initialIndex ? "eager" : "lazy"} draggable={false}
                    initial={false} animate={{ filter: isActive || reducedMotion ? "blur(0px)" : `blur(${Math.max(0, blur)}px)`, scale: reducedMotion ? 1 : isActive ? 1.015 : 1.075 }} transition={motionTransition}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: `${image.positionX || "50%"} ${image.positionY || "50%"}` }} />
                {showDescription && item.description && <motion.figcaption initial={false} animate={{ opacity: isActive ? 1 : 0, y: isActive || reducedMotion ? 0 : 6 }} transition={motionTransition} style={{ ...defaultBody, ...bodyFont, position: "absolute", bottom: 0, left: 0, right: 0, margin: 0, padding: "70px 22px 22px 22px", color: "#FFFFFF", background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.66) 100%)", overflowWrap: "anywhere", whiteSpace: "pre-line" }}>{item.description}</motion.figcaption>}
            </motion.figure>
        })}
        <span aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 4, borderRadius: "inherit", border: "1px solid rgba(255,255,255,0.18)", pointerEvents: "none" }} />
    </div>

    const mobileAccordion = <div className="veil-mobile-accordion">
        {cleanItems.map((item, index) => {
            const image = imageFor(item)
            const title = item.title?.trim() || `Item ${index + 1}`
            const href = safeLink(item.link)
            const isOpen = mobileOpen === index
            const triggerId = `veil-${mobileId}-mobile-trigger-${index}`
            const panelId = `veil-${mobileId}-mobile-panel-${index}`
            const media = image?.src ? <figure className="veil-mobile-media">
                <motion.img src={image.src} srcSet={image.srcSet} sizes="(max-width: 719px) calc(100vw - 40px), 350px" alt={image.alt || ""}
                    loading={index === initialIndex ? "eager" : "lazy"} decoding="async" draggable={false}
                    initial={false}
                    animate={{ opacity: isOpen ? 1 : 0.25, filter: isOpen || reducedMotion ? "blur(0px)" : `blur(${Math.max(0, blur)}px)`, scale: reducedMotion ? 1 : isOpen ? 1.015 : 1.065 }}
                    transition={motionTransition}
                    style={{ objectPosition: `${image.positionX || "50%"} ${image.positionY || "50%"}` }} />
                {showDescription && item.description && <motion.figcaption initial={false}
                    animate={{ opacity: isOpen ? 1 : 0, y: isOpen || reducedMotion ? 0 : 6 }} transition={motionTransition}
                    style={{ ...defaultBody, ...bodyFont, position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 18px 18px 18px", color: "#FFFFFF", background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.66) 100%)", overflowWrap: "anywhere", whiteSpace: "pre-line", pointerEvents: "none" }}>{item.description}</motion.figcaption>}
                {href && <span className="veil-mobile-image-arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 12.5L12 4M4 4h8v8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg></span>}
            </figure> : null
            return <div key={index} style={{ ...divider, minWidth: 0 }}>
                <h3 style={{ margin: 0, padding: 0, font: "inherit" }}>
                    <button ref={element => { mobileControls.current[index] = element }} className="veil-mobile-trigger"
                        id={triggerId} type="button" aria-expanded={isOpen} aria-controls={panelId}
                        onClick={() => toggleMobile(index)} onKeyDown={event => navigateMobile(event, index)}
                        style={{ color: textColor }}>
                        {showNumbers && <span aria-hidden="true" style={{ ...defaultLabel, ...labelFont, color: mutedColor, width: 20, flex: "0 0 20px", fontVariantNumeric: "tabular-nums" }}>{String(index + 1).padStart(2, "0")}</span>}
                        <span style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", minWidth: 0, gap: 6 }}>
                            {item.category && <span style={{ ...defaultLabel, ...labelFont, color: mutedColor, textTransform: "uppercase", overflowWrap: "anywhere" }}>{item.category}</span>}
                            <span style={{ ...defaultSmallTitle, ...smallTitleFont, overflowWrap: "anywhere" }}>{title}</span>
                        </span>
                        <motion.span className="veil-mobile-toggle" aria-hidden="true" initial={false}
                            animate={{ backgroundColor: isOpen ? accentColor : "rgba(255,255,255,0)", color: isOpen ? background : textColor, borderColor: isOpen ? accentColor : divider.borderColor || "#373B35" }} transition={motionTransition}>
                            <span style={{ position: "absolute", width: 10, height: 1, background: "currentColor" }} />
                            <motion.span initial={false} animate={{ scaleY: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }} transition={motionTransition} style={{ position: "absolute", width: 1, height: 10, background: "currentColor" }} />
                        </motion.span>
                    </button>
                </h3>
                <motion.div id={panelId} role="region" aria-labelledby={triggerId} aria-hidden={!isOpen}
                    initial={false} animate={{ height: isOpen ? "auto" : 0 }} transition={motionTransition}
                    style={{ overflow: "hidden", pointerEvents: isOpen ? "auto" : "none" }}>
                    <div style={{ padding: "2px 0px 16px 0px" }}>
                        {media && (href
                            ? <a className="veil-mobile-image-link" href={href} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}
                                tabIndex={isOpen ? 0 : -1} aria-label={`View ${title}`}>{media}</a>
                            : media)}
                        {!media && showDescription && item.description && <p style={{ ...defaultBody, ...bodyFont, margin: "0 0 12px", color: mutedColor, overflowWrap: "anywhere", whiteSpace: "pre-line" }}>{item.description}</p>}
                        {!media && href && <a className="veil-mobile-text-link" href={href} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}
                            tabIndex={isOpen ? 0 : -1} style={{ ...defaultBody, ...bodyFont, color: textColor }}>{item.linkLabel || "View project"} <span aria-hidden="true">↗</span></a>}
                    </div>
                </motion.div>
            </div>
        })}
    </div>

    return (
        <div ref={root} className="veil-accordion" style={rootStyle}
            onPointerEnter={event => { if (event.pointerType === "mouse" || event.pointerType === "pen") setPointerWithin(true) }}
            onPointerMove={followPointer}
            onPointerLeave={() => { setPointerWithin(false); photoHovered.current = false; positionPhoto(activeRef.current) }}
            onPointerCancel={() => { setPointerWithin(false); photoHovered.current = false; positionPhoto(activeRef.current) }}
            onFocusCapture={() => setFocusWithin(true)}
            onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false) }}>
            <style>{`
                .veil-accordion *, .veil-accordion *::before, .veil-accordion *::after { box-sizing: border-box; }
                .veil-accordion .veil-layout { padding: var(--veil-padding); }
                .veil-accordion .veil-list { position: relative; display: flex; flex-direction: column; min-width: 0; }
                .veil-accordion .veil-list.has-photos { min-height: calc(min(var(--veil-photo-width), 32cqw) / var(--veil-photo-ratio) + 20px); }
                .veil-accordion .veil-row { -webkit-tap-highlight-color: transparent; text-decoration: none; }
                .veil-accordion .veil-row:focus:not(:focus-visible), .veil-accordion .veil-photo-link:focus:not(:focus-visible) { outline: none; }
                .veil-accordion .veil-row:focus-visible { outline: 2px solid var(--veil-focus); outline-offset: 3px; border-radius: 2px; }
                .veil-accordion .veil-photo-link:focus-visible { outline: 2px solid var(--veil-focus); outline-offset: 5px; }
                .veil-accordion .veil-row-content { display: flex; align-items: center; gap: 18px; min-width: 0; width: 100%; }
                .veil-accordion .has-photos .veil-row-content { width: 58%; }
                .veil-accordion .veil-title-desktop { display: block; }
                .veil-accordion .veil-title-small, .veil-accordion .veil-mobile-accordion { display: none; }
                .veil-accordion .veil-arrow { width: 42px; height: 42px; flex: 0 0 42px; }
                .veil-accordion .veil-index { width: 24px; flex: 0 0 24px; }
                .veil-accordion .veil-floating-photo { position: absolute; left: 62%; top: 0; width: min(var(--veil-photo-width), 32%); aspect-ratio: var(--veil-photo-ratio); z-index: 3; }
                .veil-accordion .veil-mobile-trigger { appearance: none; -webkit-appearance: none; display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0; min-height: 72px; padding: 12px 0; margin: 0; border: 0; background: transparent; cursor: pointer; text-align: left; user-select: none; -webkit-tap-highlight-color: transparent; }
                .veil-accordion .veil-mobile-trigger:focus:not(:focus-visible), .veil-accordion .veil-mobile-image-link:focus:not(:focus-visible), .veil-accordion .veil-mobile-text-link:focus:not(:focus-visible) { outline: none; }
                .veil-accordion .veil-mobile-trigger:focus-visible { outline: 2px solid var(--veil-focus); outline-offset: -2px; border-radius: 4px; }
                .veil-accordion .veil-mobile-image-link:focus-visible { outline: 2px solid var(--veil-focus); outline-offset: -4px; }
                .veil-accordion .veil-mobile-text-link:focus-visible { outline: 2px solid var(--veil-focus); outline-offset: 3px; }
                .veil-accordion .veil-mobile-toggle { position: relative; display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; border: 1px solid; border-radius: 50%; }
                .veil-accordion .veil-mobile-image-link { display: block; position: relative; border-radius: var(--veil-radius); color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent; }
                .veil-accordion .veil-mobile-media { display: block; position: relative; width: 100%; aspect-ratio: var(--veil-mobile-ratio); margin: 0; border-radius: var(--veil-radius); overflow: hidden; background: rgba(255,255,255,0.04); isolation: isolate; }
                .veil-accordion .veil-mobile-media::after { content: ''; position: absolute; inset: 0; border: 1px solid rgba(255,255,255,0.14); border-radius: inherit; pointer-events: none; }
                .veil-accordion .veil-mobile-media img { display: block; width: 100%; height: 100%; position: absolute; inset: 0; object-fit: cover; }
                .veil-accordion .veil-mobile-image-arrow { position: absolute; top: 12px; right: 12px; display: grid; place-items: center; width: 30px; height: 30px; color: #fff; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.4); border-radius: 50%; pointer-events: none; }
                .veil-accordion .veil-mobile-text-link { display: inline-block; text-underline-offset: 4px; }
                @container veil-hover (min-width: 720px) and (max-width: 900px) {
                    .veil-accordion .veil-title-desktop { font-size: calc(var(--veil-title-size) * 0.864) !important; }
                    .veil-accordion .veil-index { display: none; }
                    .veil-accordion .veil-row-content { gap: 12px; }
                    .veil-accordion .veil-arrow { width: 34px; height: 34px; flex-basis: 34px; }
                }
                @container veil-hover (max-width: 719px) {
                    .veil-accordion .veil-layout { padding: var(--veil-small-padding); }
                    .veil-accordion .veil-list { display: none; }
                    .veil-accordion .veil-mobile-accordion { display: flex; flex-direction: column; min-width: 0; }
                }
                @media (prefers-reduced-motion: reduce) { .veil-accordion * { scroll-behavior: auto !important; } .veil-accordion .veil-mobile-media img { transform: none !important; } }
            `}</style>

            {cleanItems.length > 0 && <div className="veil-layout">
                {mobileAccordion}
                <div ref={list} className={`veil-list${hasPhotos ? " has-photos" : ""}`}>
                    {cleanItems.map((item, index) => {
                        const isActive = activeIndex === index
                        const title = item.title?.trim() || `Item ${index + 1}`
                        const href = safeLink(item.link)
                        const image = imageFor(item)
                        const dim = engaged && !isActive
                        const content = <span className="veil-row-content">
                            {showNumbers && <span className="veil-index" aria-hidden="true" style={{ ...defaultLabel, ...labelFont, color: mutedColor, fontVariantNumeric: "tabular-nums" }}>{String(index + 1).padStart(2, "0")}</span>}
                            <motion.span className="veil-title-motion" initial={false}
                                animate={{ opacity: dim ? 0.58 : isActive ? 1 : 0.8, filter: !reducedMotion && dim ? `blur(${Math.max(0, Math.min(hoverBlur, 3))}px)` : "blur(0px)", x: !reducedMotion && engaged && isActive ? 6 : 0 }}
                                transition={motionTransition} style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", minWidth: 0, gap: 10 }}>
                                {item.category && <span style={{ ...defaultLabel, ...labelFont, textTransform: "uppercase", color: mutedColor, overflowWrap: "anywhere" }}>{item.category}</span>}
                                <span className="veil-title-desktop" style={{ ...defaultTitle, ...titleFont, overflowWrap: "anywhere" }}>{title}</span>
                                <span className="veil-title-small" style={{ ...defaultSmallTitle, ...smallTitleFont, overflowWrap: "anywhere" }}>{title}</span>
                            </motion.span>
                            <motion.span className="veil-arrow" aria-hidden="true" initial={false}
                                animate={{ backgroundColor: isActive ? accentColor : "rgba(255,255,255,0)", color: isActive ? background : textColor, borderColor: isActive ? accentColor : divider.borderColor || "#373B35" }}
                                transition={motionTransition} style={{ display: "grid", placeItems: "center", border: "1px solid", borderRadius: "50%" }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 12.5L12 4M4 4h8v8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </motion.span>
                        </span>
                        const interaction = {
                            ref: (element: HTMLElement | null) => { controls.current[index] = element },
                            className: "veil-row", "aria-label": title,
                            onFocus: () => selectItem(index, true),
                            onPointerEnter: (event: React.PointerEvent<HTMLElement>) => { if (event.pointerType === "mouse" || event.pointerType === "pen") selectItem(index) },
                            onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => navigate(event, index),
                            style: { appearance: "none", WebkitAppearance: "none", display: "flex", alignItems: "center", width: "100%", minWidth: 0, minHeight: 112, border: 0, padding: rowPadding, margin: 0, background: "transparent", color: textColor, cursor: "pointer", textAlign: "left", userSelect: "none" } as React.CSSProperties,
                        }
                        return <div key={index} ref={element => { rows.current[index] = element }} style={{ ...divider, flex: "1 0 auto", display: "flex", minWidth: 0 }}>
                            {href ? <a {...interaction} href={href} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}>{content}</a>
                                : <button {...interaction} type="button" aria-pressed={isActive} onClick={() => selectItem(index, true)}>{content}</button>}
                        </div>
                    })}

                    {hasPhotos && <motion.div ref={floatingPhoto} className="veil-floating-photo"
                        onPointerEnter={() => { photoHovered.current = true; freezePhoto() }}
                        onPointerLeave={() => { photoHovered.current = false }}
                        onFocusCapture={freezePhoto}
                        style={{ x: photoX, y: photoY, rotate: photoTilt, visibility: activeImage?.src ? "visible" : "hidden", borderRadius: imageRadius, boxShadow: "0 24px 56px -12px rgba(0,0,0,0.42), 0 5px 16px -5px rgba(0,0,0,0.24)" }}>
                        {activeHref
                            ? <a className="veil-photo-link" href={activeHref} target={activeItem?.newTab ? "_blank" : undefined} rel={activeItem?.newTab ? "noopener noreferrer" : undefined} aria-label={`View ${activeItem?.title?.trim() || `item ${activeIndex + 1}`}`} tabIndex={activeImage?.src ? 0 : -1} style={{ position: "absolute", inset: 0, display: "block", borderRadius: imageRadius, cursor: "pointer", color: "inherit", textDecoration: "none" }}>{photoContent}</a>
                            : <div style={{ position: "absolute", inset: 0 }}>{photoContent}</div>}
                    </motion.div>}
                </div>
            </div>}
        </div>
    )
}

HoverBlurList.defaultProps = {
    items: demoItems, initialOpen: 1, showNumbers: true, showDescription: true,
    background: "#181B18", textColor: "#F1F0E8", mutedColor: "#92978D", accentColor: "#E9E7DD",
    divider: defaultDivider, padding: "16px 32px 16px 32px", smallPadding: "0px 0px 0px 0px", rowPadding: "24px 0px 24px 0px",
    imageRadius: "14px", imageRatio: 1.04, mobileRatio: 1.6, photoWidth: 320, followAmount: 14, titleFont: defaultTitle, smallTitleFont: defaultSmallTitle,
    bodyFont: defaultBody, labelFont: defaultLabel, blur: 10, hoverBlur: 0.8, transition: defaultTransition, focusColor: "#E9E7DD",
}

addPropertyControls(HoverBlurList, {
    items: {
        type: ControlType.Array, title: "Items", defaultValue: demoItems, maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "New space" },
                category: { type: ControlType.String, title: "Category", defaultValue: "" },
                description: { type: ControlType.String, title: "Description", defaultValue: "", displayTextArea: true },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                samplePhoto: { type: ControlType.Enum, title: "Sample Photo", options: ["none", "stair", "coast", "chair", "garden"], optionTitles: ["None", "Stair", "Coast", "Chair", "Garden"], defaultValue: "none", hidden: item => Boolean(item.image?.src), description: "Used when no custom image is selected." },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, hidden: item => !item.link },
            },
        },
    },
    initialOpen: { type: ControlType.Number, title: "First Item", defaultValue: 1, min: 1, max: 12, step: 1, displayStepper: true },
    showNumbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: true },
    showDescription: { type: ControlType.Boolean, title: "Descriptions", defaultValue: true },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#181B18" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#F1F0E8" },
    mutedColor: { type: ControlType.Color, title: "Secondary", defaultValue: "#92978D" },
    accentColor: { type: ControlType.Color, title: "Active Arrow", defaultValue: "#E9E7DD" },
    divider: { type: ControlType.Border, title: "Dividers", defaultValue: defaultDivider },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "16px 32px 16px 32px" },
    smallPadding: { type: ControlType.Padding, title: "Small Padding", defaultValue: "0px 0px 0px 0px" },
    rowPadding: { type: ControlType.Padding, title: "Row Padding", defaultValue: "24px 0px 24px 0px" },
    imageRadius: { type: ControlType.BorderRadius, title: "Image Radius", defaultValue: "14px" },
    imageRatio: { type: ControlType.Number, title: "Image Ratio", defaultValue: 1.04, min: 0.5, max: 1.5, step: 0.01 },
    mobileRatio: { type: ControlType.Number, title: "Mobile Ratio", defaultValue: 1.6, min: 0.75, max: 2, step: 0.01 },
    photoWidth: { type: ControlType.Number, title: "Photo Width", defaultValue: 320, min: 160, max: 420, step: 1, unit: "px", description: "Automatically fits the space beside the titles." },
    followAmount: { type: ControlType.Number, title: "Mouse Follow", defaultValue: 14, min: 0, max: 32, step: 1, unit: "px" },
    titleFont: { type: ControlType.Font, title: "Title", controls: "extended", defaultFontType: "sans-serif", defaultValue: titleControlDefault },
    smallTitleFont: { type: ControlType.Font, title: "Small Title", controls: "extended", defaultFontType: "sans-serif", defaultValue: smallTitleControlDefault, description: "Used below a component width of 720px." },
    bodyFont: { type: ControlType.Font, title: "Description", controls: "extended", defaultFontType: "sans-serif", defaultValue: bodyControlDefault, hidden: props => !props.showDescription },
    labelFont: { type: ControlType.Font, title: "Labels", controls: "extended", defaultFontType: "sans-serif", defaultValue: labelControlDefault },
    blur: { type: ControlType.Number, title: "Image Blur", defaultValue: 10, min: 0, max: 24, step: 1, unit: "px" },
    hoverBlur: { type: ControlType.Number, title: "Row Blur", defaultValue: 0.8, min: 0, max: 3, step: 0.1, unit: "px" },
    transition: { type: ControlType.Transition, title: "Motion", defaultValue: defaultTransition },
    focusColor: { type: ControlType.Color, title: "Focus Ring", defaultValue: "#E9E7DD", description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
})
