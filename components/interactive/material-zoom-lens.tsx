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

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion"

type ImageValue = { src?: string; srcSet?: string; alt?: string }
type Ratio = "wide" | "classic" | "square"

interface Props {
    image?: ImageValue
    detailImage?: ImageValue
    additionalImages?: ImageValue[]
    showCaption: boolean
    ratio: Ratio
    imageX: number
    imageY: number
    zoom: number
    lensSize: number
    lensShape: "circle" | "rounded"
    lensStroke: number
    lensStrokeColor: string
    showIdleLens: boolean
    title: string
    description: string
    ctaLabel: string
    ctaLink: string
    surface: string
    textColor: string
    mutedColor: string
    radius: number
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    style?: React.CSSProperties
}

const SAMPLE_IMAGE: ImageValue = {
    src: "https://images.unsplash.com/photo-1527283308122-41ee35be6195?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1700",
    alt: "Detail photograph of a sculptural silver and charcoal over-ear headphone"
}

const CSS = [
    ".mzl-root{container-type:inline-size;box-sizing:border-box;width:100%;min-width:0;display:flex;flex-direction:column;gap:14px;font-family:'Inter','Helvetica Neue',Arial,sans-serif}",
    ".mzl-root *{box-sizing:border-box}",
    ".mzl-stage{position:relative;isolation:isolate;width:100%;overflow:hidden;background:#C8C6C2;outline:none;touch-action:none;user-select:none;-webkit-user-select:none;cursor:crosshair}",
    ".mzl-stage:focus-visible{outline:3px solid #242421;outline-offset:4px}",
    ".mzl-main{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;pointer-events:none}",
    ".mzl-image-link{position:absolute;inset:0;z-index:2;display:block;background:transparent;cursor:pointer;touch-action:none}",
    ".mzl-image-link:focus-visible{outline:3px solid #FFFFFF;outline-offset:-7px;border-radius:inherit}",
    ".mzl-stage::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(10,10,10,.25),transparent 29%,transparent 75%,rgba(0,0,0,.12))}",
    
    
    
    
    ".mzl-lens{position:absolute;z-index:3;overflow:hidden;pointer-events:none;background-color:#8E8B86;background-repeat:no-repeat;box-shadow:0 24px 55px rgba(0,0,0,.26),0 5px 14px rgba(0,0,0,.16);will-change:left,top,opacity;backface-visibility:hidden}",
    ".mzl-lens-gloss{position:absolute;inset:0;pointer-events:none;border-radius:inherit;box-shadow:inset 0 2px 2px rgba(255,255,255,.38),inset 0 -4px 12px rgba(0,0,0,.08)}",
    ".mzl-lens-mark{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:18px;height:18px;border:1px solid rgba(255,255,255,.7);border-radius:50%;opacity:.9;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}",
    ".mzl-lens-mark::before,.mzl-lens-mark::after{content:'';position:absolute;background:rgba(255,255,255,.85)}",
    ".mzl-lens-mark::before{width:1px;height:27px;top:-5px;left:7px}",
    ".mzl-lens-mark::after{height:1px;width:27px;left:-5px;top:7px}",
    ".mzl-zoom-chip{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);border-radius:30px;background:rgba(16,16,16,.78);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);color:white;font-size:10px;font-weight:650;letter-spacing:.08em;white-space:nowrap;padding:7px 11px}",
    
    
    ".mzl-caption{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:30px;padding:26px 30px;border:1px solid rgba(17,17,17,.065);min-height:113px;align-items:center}",
    
    ".mzl-title{font-size:clamp(23px,2.8cqi,35px);font-weight:550;letter-spacing:-.048em;line-height:1.13;margin:0}",
    ".mzl-side{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:14px;text-align:right}",
    ".mzl-description{margin:0;font-size:13px;line-height:1.52;letter-spacing:-.012em;max-width:300px}",
    ".mzl-nav{position:absolute;z-index:5;right:22px;bottom:22px;display:flex;align-items:center;gap:8px;pointer-events:auto}",
    ".mzl-nav-count{color:#fff;font-size:11px;font-weight:600;letter-spacing:.06em;margin-right:9px;text-shadow:0 2px 10px rgba(0,0,0,.45);font-variant-numeric:tabular-nums}",
    ".mzl-nav-button{display:grid;place-items:center;appearance:none;width:39px;height:39px;padding:0;border:1px solid rgba(255,255,255,.63);border-radius:50%;color:#fff;background:rgba(15,15,15,.22);backdrop-filter:blur(11px);-webkit-backdrop-filter:blur(11px);cursor:pointer;transition:background .2s ease,transform .2s ease;touch-action:manipulation}",
    ".mzl-nav-button:hover{background:rgba(15,15,15,.58);transform:translateY(-1px)}",
    ".mzl-nav-button:focus-visible{outline:3px solid white;outline-offset:3px}",
    ".mzl-cta{display:inline-flex;align-items:center;gap:9px;color:inherit;font-size:11px;font-weight:600;text-underline-offset:4px;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:3px;outline-offset:4px}",
    ".mzl-cta:hover{text-decoration:none;opacity:.65}",
    ".mzl-cta:focus-visible{outline:2px solid currentColor}",
    ".mzl-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}",
    "@container (max-width:620px){.mzl-stage{aspect-ratio:1.04!important}.mzl-nav{right:15px;bottom:15px;gap:7px}.mzl-nav-button{width:38px;height:38px}.mzl-nav-count{margin-right:3px;font-size:10px}.mzl-caption{grid-template-columns:1fr;gap:11px;padding:20px 21px 22px;min-height:0;align-items:start}.mzl-side{align-items:flex-start;text-align:left}.mzl-description{font-size:12px;max-width:360px}.mzl-title{font-size:clamp(23px,5.2cqi,31px)}}",
    "@media (prefers-reduced-motion:reduce){.mzl-root *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}"
].join("\n")

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 730
 */
export default function MaterialZoomLens(props: Props) {
    const {
        image = SAMPLE_IMAGE, detailImage, additionalImages = [], showCaption = true,
        ratio = "wide", imageX = 50, imageY = 50,
        zoom = 2.5, lensSize = 228, lensShape = "circle", lensStroke = 3,
        lensStrokeColor = "#FFFFFF", showIdleLens = true,
        title = "A closer look at every detail.",
        description = "Form, finish and texture — all worth a second look.",
        ctaLabel = "View Product", ctaLink = "",
        surface = "#F5F4F0", textColor = "#151513", mutedColor = "#666761",
        radius = 20, titleFont, bodyFont, style
    } = props

    const isStatic = useIsStaticRenderer()
    const prefersReduced = Boolean(useReducedMotion())
    const extra = Array.isArray(additionalImages) ? additionalImages.filter(item => item && typeof item.src === "string" && item.src.length > 0) : []
    const slides = [image?.src ? image : SAMPLE_IMAGE, ...extra]
    const [slideIndex, setSlideIndex] = React.useState(0)
    React.useEffect(() => { setSlideIndex(index => Math.min(index, slides.length - 1)) }, [slides.length])
    const main = slides[slideIndex] || slides[0]
    const lensSrc = slideIndex === 0 && detailImage?.src ? detailImage.src : main.src || ""
    const alt = main.alt || "Close-up product detail"

    const stageRef = React.useRef<HTMLDivElement>(null)
    const gestureRef = React.useRef<{ id: number; x: number; y: number; dragged: boolean } | null>(null)
    const [dimensions, setDimensions] = React.useState({ width: 1080, height: 560 })
    const [natural, setNatural] = React.useState({ width: 5650, height: 3767 })
    const [active, setActive] = React.useState(false)
    const [touchUsed, setTouchUsed] = React.useState(false)
    const focusHint = React.useId()

    const rx = useMotionValue(0.55)
    const ry = useMotionValue(0.49)
    const sx = useSpring(rx, { stiffness: 550, damping: 52, mass: .8 })
    const sy = useSpring(ry, { stiffness: 550, damping: 52, mass: .8 })
    const px = (isStatic || prefersReduced) ? rx : sx
    const py = (isStatic || prefersReduced) ? ry : sy
    const left = useTransform(px, v => (v * 100) + "%")
    const top = useTransform(py, v => (v * 100) + "%")

    React.useEffect(() => {
        const element = stageRef.current
        if (!element || typeof ResizeObserver === "undefined") return
        const measure = () => {
            const { width, height } = element.getBoundingClientRect()
            if (width > 0 && height > 0) {
                setDimensions(previous => (
                    Math.abs(previous.width - width) < .5 && Math.abs(previous.height - height) < .5
                        ? previous : { width, height }
                ))
            }
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const scale = Math.max(dimensions.width / natural.width, dimensions.height / natural.height)
    const paintWidth = natural.width * scale
    const paintHeight = natural.height * scale
    const offsetX = (dimensions.width - paintWidth) * clamp(imageX, 0, 100) / 100
    const offsetY = (dimensions.height - paintHeight) * clamp(imageY, 0, 100) / 100
    const magnification = clamp(zoom, 1.2, 5)
    const diameter = clamp(Math.min(lensSize, dimensions.width * .60, dimensions.height * .73), 100, 370)
    const half = diameter / 2
    const bpx = useTransform(px, v => (half - (v * dimensions.width - offsetX) * magnification) + "px")
    const bpy = useTransform(py, v => (half - (v * dimensions.height - offsetY) * magnification) + "px")
    const aspect = ratio === "square" ? "1 / 1" : ratio === "classic" ? "4 / 3" : "1.95 / 1"
    const link = (ctaLink || "").trim()
    const visible = showIdleLens || active || touchUsed
    const changeSlide = (offset: number) => {
        if (slides.length < 2) return
        setSlideIndex(index => (index + offset + slides.length) % slides.length)
        rx.set(.55)
        ry.set(.49)
        setNatural({ width: 1700, height: 1133 })
        setTouchUsed(false)
        setActive(false)
    }

    const move = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect()
        if (!r.width || !r.height) return
        rx.set(clamp((e.clientX - r.left) / r.width, 0, 1))
        ry.set(clamp((e.clientY - r.top) / r.height, 0, 1))
    }

    const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const jump = e.shiftKey ? .11 : .045
        let x = rx.get(), y = ry.get()
        if (e.key === "ArrowLeft") x -= jump
        else if (e.key === "ArrowRight") x += jump
        else if (e.key === "ArrowUp") y -= jump
        else if (e.key === "ArrowDown") y += jump
        else if (e.key === "Home") { x = .5; y = .5 }
        else if (e.key === "Escape") { setActive(false); setTouchUsed(false); return }
        else return
        e.preventDefault()
        rx.set(clamp(x, 0, 1))
        ry.set(clamp(y, 0, 1))
        setActive(true)
    }

    return (
        <div className="mzl-root" style={{ background: "transparent", color: textColor, ...style }}>
            <style>{CSS}</style>
            <div
                ref={stageRef}
                className="mzl-stage"
                style={{ aspectRatio: aspect, borderRadius: radius, backgroundColor: "#C4C2BD" }}
                tabIndex={link ? -1 : 0}
                role="group"
                aria-label="Interactive product image magnifier"
                aria-describedby={focusHint}
                onPointerEnter={e => { if (e.pointerType === "mouse" || e.pointerType === "pen") { setActive(true); move(e) } }}
                onPointerMove={e => {
                    const gesture = gestureRef.current
                    if (gesture && gesture.id === e.pointerId && (Math.abs(e.clientX - gesture.x) > 9 || Math.abs(e.clientY - gesture.y) > 9)) gesture.dragged = true
                    if (e.pointerType !== "touch" || e.buttons > 0) { move(e); setActive(true) }
                }}
                onPointerDown={e => {
                    gestureRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dragged: false }
                    move(e)
                    setActive(true)
                    if (e.pointerType === "touch") setTouchUsed(true)
                }}
                onPointerCancel={() => { gestureRef.current = null }}
                onPointerLeave={e => {
                    if (e.pointerType !== "touch") {
                        setActive(false)
                        if (showIdleLens) { rx.set(.55); ry.set(.49) }
                    }
                }}
                onFocus={() => setActive(true)}
                onBlur={() => setActive(false)}
                onKeyDown={handleKey}
            >
                <AnimatePresence initial={false}>
                <motion.img
                    key={slideIndex + "-" + (main.src || "")}
                    className="mzl-main"
                    src={main.src}
                    srcSet={main.srcSet}
                    alt={alt}
                    draggable={false}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: isStatic || prefersReduced ? 0 : .32 }}
                    style={{ objectPosition: imageX + "% " + imageY + "%" }}
                    onLoad={e => {
                        const img = e.currentTarget
                        if (img.naturalWidth > 0) setNatural({ width: img.naturalWidth, height: img.naturalHeight })
                    }}
                />
                </AnimatePresence>
                {link && (
                    <a
                        className="mzl-image-link"
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={"Open " + (title || "product image") + " in a new tab"}
                        onClick={e => {
                            if (gestureRef.current?.dragged) e.preventDefault()
                            gestureRef.current = null
                        }}
                    />
                )}
                <motion.div
                    className="mzl-lens"
                    aria-hidden="true"
                    initial={false}
                    animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : .9 }}
                    transition={{ duration: isStatic || prefersReduced ? 0 : .19, ease: [ .25, .8, .25, 1 ] }}
                    style={{
                        left, top, marginLeft: -half, marginTop: -half,
                        width: diameter, height: diameter,
                        borderRadius: lensShape === "circle" ? "50%" : Math.min(diameter * .24, 40),
                        border: lensStroke + "px solid " + lensStrokeColor,
                        backgroundImage: 'url("' + lensSrc.replace(/"/g, "%22") + '")',
                        backgroundSize: (paintWidth * magnification) + "px " + (paintHeight * magnification) + "px",
                        backgroundPositionX: bpx,
                        backgroundPositionY: bpy
                    }}
                >
                    <span className="mzl-lens-gloss"/>
                    <span className="mzl-lens-mark"/>
                    <span className="mzl-zoom-chip">{magnification.toFixed(1)}×</span>
                </motion.div>
                {slides.length > 1 && (
                    <div className="mzl-nav" role="group" aria-label="Image navigation"
                        onPointerDown={e => e.stopPropagation()}
                        onPointerMove={e => e.stopPropagation()}
                        onPointerEnter={e => e.stopPropagation()}
                        onPointerLeave={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                    >
                        <span className="mzl-nav-count" aria-live="polite">{String(slideIndex + 1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</span>
                        <button className="mzl-nav-button" type="button" onClick={() => changeSlide(-1)} aria-label="Previous image">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5L8 12l7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button className="mzl-nav-button" type="button" onClick={() => changeSlide(1)} aria-label="Next image">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </div>
                )}
            </div>
            {showCaption && (
                <div className="mzl-caption" style={{ background: surface, borderRadius: Math.max(0, radius - 4) }}>
                    {title && <h2 className="mzl-title" style={titleFont}>{title}</h2>}
                    {(description || link) && (
                        <div className="mzl-side">
                            {description && <p className="mzl-description" style={{ color: mutedColor, ...bodyFont }}>{description}</p>}
                            {link && <a className="mzl-cta" href={link} target="_blank" rel="noopener noreferrer">
                                {ctaLabel || "View Product"} <span aria-hidden="true">↗</span>
                            </a>}
                        </div>
                    )}
                </div>
            )}
            <span id={focusHint} className="mzl-sr-only">Move the cursor or drag to inspect details. On the keyboard, use arrow keys to move the magnifier and Home to center.</span>
        </div>
    )
}

addPropertyControls(MaterialZoomLens, {
    image: { type: ControlType.ResponsiveImage, title: "Product Image" },
    detailImage: { type: ControlType.ResponsiveImage, title: "High Res Image" },
    additionalImages: { type: ControlType.Array, title: "More Images", defaultValue: [], maxCount: 12, control: { type: ControlType.ResponsiveImage, title: "Image" } },
    showCaption: { type: ControlType.Boolean, title: "Show Text Box", defaultValue: true },
    ratio: { type: ControlType.Enum, title: "Image Ratio", options: ["wide","classic","square"], optionTitles: ["Wide","Classic","Square"], defaultValue: "wide" },
    imageX: { type: ControlType.Number, title: "Image X", min: 0, max: 100, step: 1, defaultValue: 50 },
    imageY: { type: ControlType.Number, title: "Image Y", min: 0, max: 100, step: 1, defaultValue: 50 },
    zoom: { type: ControlType.Number, title: "Zoom", min: 1.2, max: 5, step: .1, defaultValue: 2.5, displayStepper: true },
    lensSize: { type: ControlType.Number, title: "Lens Size", min: 100, max: 370, step: 2, defaultValue: 228 },
    lensShape: { type: ControlType.Enum, title: "Lens Shape", options: ["circle","rounded"], optionTitles: ["Circle","Rounded"], defaultValue: "circle" },
    lensStroke: { type: ControlType.Number, title: "Lens Border", min: 0, max: 8, step: 1, defaultValue: 3 },
    lensStrokeColor: { type: ControlType.Color, title: "Border Color", defaultValue: "#FFFFFF" },
    showIdleLens: { type: ControlType.Boolean, title: "Show Idle Lens", defaultValue: true },
    title: { type: ControlType.String, title: "Headline", defaultValue: "A closer look at every detail.", displayTextArea: true },
    description: { type: ControlType.String, title: "Description", defaultValue: "Form, finish and texture — all worth a second look.", displayTextArea: true },
    ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "View Product" },
    ctaLink: { type: ControlType.Link, title: "Product Link", defaultValue: "" },
    surface: { type: ControlType.Color, title: "Background", defaultValue: "#F5F4F0" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#151513" },
    mutedColor: { type: ControlType.Color, title: "Muted Text", defaultValue: "#666761" },
    radius: { type: ControlType.Number, title: "Corners", min: 0, max: 48, step: 1, defaultValue: 20 },
    titleFont: { type: ControlType.Font, title: "Headline Font", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended" }
})
