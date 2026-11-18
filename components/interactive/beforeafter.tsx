// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useId, useRef, useState } from "react"

/**
 * Before / After Carousel
 * Drag-to-compare image slider with multi-slide storytelling.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 720
 */
export default function BeforeAfterCarousel(props) {
    const {
        slides = defaultSlides,
        autoPlay = false,
        autoPlayDelay = 5,
        pauseOnHover = true,
        initialReveal = 50,
        speed = 0.45,
        showArrows = true,
        showDots = true,
        radius = "0px",
        accent = "#FF7A1A",
        background = "#0A0A0B",
        headingColor = "#FFFFFF",
        cardBg = "rgba(18,18,20,0.72)",
        cardText = "#FFFFFF",
        cardMuted = "rgba(255,255,255,0.62)",
        navBg = "rgba(255,255,255,0.12)",
        navIcon = "#FFFFFF",
        style,
    } = props

    const rawId = useId()
    const uid = "bac" + rawId.replace(/[^a-zA-Z0-9]/g, "")

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()

    const safeSlides = Array.isArray(slides) && slides.length ? slides : [{}]
    const count = safeSlides.length
    const multi = count > 1

    const [index, setIndex] = useState(0)
    const [dir, setDir] = useState(1)
    const [paused, setPaused] = useState(false)

    const go = useCallback(
        (next) => {
            setDir(next)
            setIndex((i) => (i + next + count) % count)
        },
        [count]
    )

    const jump = useCallback(
        (i) => {
            setDir(i > index ? 1 : -1)
            setIndex(i)
        },
        [index]
    )

    // Keep the index valid if slides are removed on canvas.
    useEffect(() => {
        if (index > count - 1) setIndex(0)
    }, [count, index])

    // Autoplay. Never runs on the canvas so editing stays calm.
    useEffect(() => {
        if (isStatic || !autoPlay || !multi || paused) return
        const t = setTimeout(() => go(1), Math.max(1, autoPlayDelay) * 1000)
        return () => clearTimeout(t)
    }, [isStatic, autoPlay, autoPlayDelay, multi, paused, index, go])

    // Preload every image so slide changes never flash.
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        safeSlides.forEach((s) => {
            const srcs = [s?.beforeImage?.src, s?.afterImage?.src]
            srcs.forEach((src) => {
                if (!src) return
                const img = new window.Image()
                img.src = src
            })
        })
    }, [isStatic, slides])

    const onKeyDown = (e) => {
        if (!multi) return
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            go(-1)
        } else if (e.key === "ArrowRight") {
            e.preventDefault()
            go(1)
        }
    }

    const slide = safeSlides[Math.min(index, count - 1)] || {}
    const offset = reduceMotion ? 0 : dir * 40
    const duration = reduceMotion ? 0 : Math.max(0, speed)

    return (
        <section
            className={uid}
            role="region"
            aria-roledescription="carousel"
            aria-label="Before and after comparison"
            onKeyDown={onKeyDown}
            onMouseEnter={() => pauseOnHover && setPaused(true)}
            onMouseLeave={() => pauseOnHover && setPaused(false)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 360,
                overflow: "hidden",
                borderRadius: radius,
                background,
                fontFamily:
                    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                ...style,
            }}
        >
            <style>
                {css(
                    uid,
                    accent,
                    navBg,
                    navIcon,
                    cardBg,
                    cardText,
                    cardMuted,
                    headingColor
                )}
            </style>

            <div className={`${uid}-stage`}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={index}
                        className={`${uid}-pane`}
                        aria-label={`Slide ${index + 1} of ${count}`}
                        initial={{ opacity: 0, x: offset }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -offset }}
                        transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className={`${uid}-media`}>
                            <BeforeAfter
                                uid={uid}
                                beforeImage={slide.beforeImage}
                                afterImage={slide.afterImage}
                                beforeLabel={slide.beforeLabel}
                                afterLabel={slide.afterLabel}
                                initialReveal={initialReveal}
                                accent={accent}
                            />

                            {slide.heading ? (
                                <div className={`${uid}-heading`}>
                                    {slide.heading}
                                </div>
                            ) : null}
                        </div>

                        {slide.cardTitle ||
                        slide.cardDescription ||
                        slide.cardNumber ? (
                            <div className={`${uid}-card`}>
                                {slide.cardNumber ? (
                                    <span
                                        className={`${uid}-card-num`}
                                        style={{ color: accent }}
                                    >
                                        {slide.cardNumber}
                                    </span>
                                ) : null}
                                {slide.cardTitle ? (
                                    <h3 className={`${uid}-card-title`}>
                                        {slide.cardTitle}
                                    </h3>
                                ) : null}
                                {slide.cardDescription ? (
                                    <p className={`${uid}-card-desc`}>
                                        {slide.cardDescription}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </motion.div>
                </AnimatePresence>

                {showArrows && multi ? (
                    <>
                        <button
                            type="button"
                            aria-label="Previous slide"
                            className={`${uid}-nav ${uid}-prev`}
                            onClick={() => go(-1)}
                        >
                            <Chevron dir="left" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next slide"
                            className={`${uid}-nav ${uid}-next`}
                            onClick={() => go(1)}
                        >
                            <Chevron dir="right" />
                        </button>
                    </>
                ) : null}

                {showDots && multi ? (
                    <div className={`${uid}-dots`}>
                        {safeSlides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Go to slide ${i + 1}`}
                                aria-current={i === index}
                                className={`${uid}-dot${i === index ? " active" : ""}`}
                                onClick={() => jump(i)}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    )
}

/* ---------- Before / After slider ---------- */

function BeforeAfter({
    uid,
    beforeImage,
    afterImage,
    beforeLabel,
    afterLabel,
    initialReveal,
    accent,
}) {
    const ref = useRef(null)
    const dragging = useRef(false)
    const start = Math.max(0, Math.min(100, Number(initialReveal) || 0))
    const [pos, setPos] = useState(start)

    useEffect(() => {
        setPos(start)
    }, [start])

    const move = (clientX) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        if (!r.width) return
        const p = ((clientX - r.left) / r.width) * 100
        setPos(Math.max(0, Math.min(100, p)))
    }

    const nudge = (delta) =>
        setPos((p) => Math.max(0, Math.min(100, p + delta)))

    return (
        <div
            ref={ref}
            className={`${uid}-ba`}
            onPointerDown={(e) => {
                if (e.button !== 0 && e.pointerType === "mouse") return
                dragging.current = true
                e.currentTarget.setPointerCapture?.(e.pointerId)
                move(e.clientX)
            }}
            onPointerMove={(e) => {
                if (dragging.current) move(e.clientX)
            }}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
        >
            <Layer image={afterImage} uid={uid} fallback="after" />

            <div
                className={`${uid}-clip`}
                style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            >
                <Layer image={beforeImage} uid={uid} fallback="before" />
            </div>

            {beforeLabel ? (
                <span className={`${uid}-tag left`}>{beforeLabel}</span>
            ) : null}
            {afterLabel ? (
                <span className={`${uid}-tag right`}>{afterLabel}</span>
            ) : null}

            <div className={`${uid}-divider`} style={{ left: `${pos}%` }}>
                <div
                    role="slider"
                    tabIndex={0}
                    aria-label="Reveal amount"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(pos)}
                    className={`${uid}-handle`}
                    style={{ borderColor: accent }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft") {
                            e.preventDefault()
                            e.stopPropagation()
                            nudge(-4)
                        } else if (e.key === "ArrowRight") {
                            e.preventDefault()
                            e.stopPropagation()
                            nudge(4)
                        }
                    }}
                >
                    <Arrows accent={accent} />
                </div>
            </div>
        </div>
    )
}

function Layer({ image, uid, fallback }) {
    if (image?.src) {
        return (
            <img
                src={image.src}
                srcSet={image.srcSet}
                alt={image.alt || ""}
                className={`${uid}-img`}
                draggable={false}
            />
        )
    }
    return (
        <div className={`${uid}-ph ${fallback}`}>
            <span>{fallback === "before" ? "BEFORE" : "AFTER"}</span>
            <small>Add an image in the properties panel</small>
        </div>
    )
}

/* ---------- Icons ---------- */

function Chevron({ dir }) {
    const d = dir === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
                d={d}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function Arrows({ accent }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
                d="M9 7l-4 5 4 5M15 7l4 5-4 5"
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/* ---------- Styles ---------- */

function css(
    u,
    accent,
    navBg,
    navIcon,
    cardBg,
    cardText,
    cardMuted,
    headingColor
) {
    return `
.${u} *{box-sizing:border-box;margin:0}
.${u}{container-type:inline-size;container-name:${u}cq}
.${u}-stage{position:relative;width:100%;height:100%}
.${u}-pane{position:absolute;inset:0}
.${u}-media{position:absolute;inset:0;overflow:hidden}

.${u}-ba{position:absolute;inset:0;cursor:ew-resize;user-select:none;-webkit-user-select:none;overflow:hidden;touch-action:pan-y}
.${u}-clip{position:absolute;inset:0}
.${u}-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none;-webkit-user-drag:none}
.${u}-ph{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:16px;letter-spacing:.18em;font-weight:700;font-size:14px;color:rgba(255,255,255,.85)}
.${u}-ph small{letter-spacing:.04em;font-weight:500;font-size:11px;color:rgba(255,255,255,.5)}
.${u}-ph.before{background:radial-gradient(120% 120% at 30% 30%,#2b2b30,#101012)}
.${u}-ph.after{background:radial-gradient(120% 120% at 70% 40%,#1b3a35,#05100f)}

.${u}-tag{position:absolute;top:16px;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:rgba(0,0,0,.45);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#fff;pointer-events:none;white-space:nowrap}
.${u}-tag.left{left:16px}
.${u}-tag.right{right:16px}

.${u}-divider{position:absolute;top:0;bottom:0;width:2px;background:rgba(255,255,255,.9);transform:translateX(-1px);pointer-events:none;will-change:left}
.${u}-handle{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:50%;border:2px solid;background:rgba(10,10,11,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.4);pointer-events:auto;cursor:ew-resize}
.${u}-handle:focus-visible{outline:2px solid ${accent};outline-offset:3px}

.${u}-heading{position:absolute;top:0;left:0;right:0;padding:64px max(44px,calc(100% - 724px)) 90px 44px;font-size:clamp(22px,2.6cqw + 12px,34px);line-height:1.18;font-weight:700;color:${headingColor};text-shadow:0 2px 24px rgba(0,0,0,.5);background:linear-gradient(180deg,rgba(0,0,0,.55),transparent);pointer-events:none}

.${u}-card{position:absolute;right:32px;bottom:32px;width:360px;max-width:calc(100% - 64px);padding:24px 26px;border-radius:18px;background:${cardBg};-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 60px rgba(0,0,0,.45);z-index:3}
.${u}-card-num{display:block;font-size:13px;font-weight:700;letter-spacing:.1em;margin-bottom:10px}
.${u}-card-title{font-size:20px;font-weight:700;line-height:1.25;color:${cardText};margin-bottom:8px}
.${u}-card-desc{font-size:14px;line-height:1.55;color:${cardMuted}}

.${u}-nav{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;border:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;background:${navBg};color:${navIcon};-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);transition:transform .18s ease,opacity .18s ease;z-index:4}
.${u}-nav:hover{transform:translateY(-50%) scale(1.07)}
.${u}-nav:active{transform:translateY(-50%) scale(.96)}
.${u}-nav:focus-visible{outline:2px solid ${accent};outline-offset:3px}
.${u}-prev{left:20px}
.${u}-next{right:20px}

.${u}-dots{position:absolute;left:32px;bottom:38px;display:flex;align-items:center;gap:8px;z-index:4}
.${u}-dot{width:8px;height:8px;border-radius:50%;border:none;padding:0;cursor:pointer;background:rgba(255,255,255,.32);transition:width .25s ease,background .25s ease}
.${u}-dot:hover{background:rgba(255,255,255,.6)}
.${u}-dot.active{width:26px;border-radius:999px;background:${accent}}
.${u}-dot:focus-visible{outline:2px solid ${accent};outline-offset:3px}

@container ${u}cq (max-width:809px){
  .${u}-heading{padding:56px 18px 24px 18px;font-size:clamp(17px,3.4cqw + 6px,22px);line-height:1.28}
  .${u}-tag{top:14px;font-size:10px;padding:5px 10px}
  .${u}-tag.left{left:14px}
  .${u}-tag.right{right:14px}
  .${u}-handle{width:40px;height:40px}
  .${u}-card{left:14px;right:14px;bottom:48px;width:auto;max-width:none;padding:16px 18px;border-radius:14px}
  .${u}-card-title{font-size:17px}
  .${u}-card-desc{font-size:13px;line-height:1.5}
  .${u}-nav{width:40px;height:40px;top:38%}
  .${u}-prev{left:12px}
  .${u}-next{right:12px}
  .${u}-dots{left:0;right:0;bottom:16px;justify-content:center}
}

@media (prefers-reduced-motion:reduce){
  .${u}-nav,.${u}-dot{transition:none}
}
`
}

/* ---------- Defaults ---------- */

const defaultSlides = [
    {
        heading: "Show the difference. Don't just describe it.",
        beforeLabel: "Before",
        afterLabel: "After",
        cardNumber: "01",
        cardTitle: "Drag to Compare",
        cardDescription:
            "Grab the handle and drag across the image to reveal what changed. Works with mouse, trackpad, touch, and keyboard.",
    },
    {
        heading: "Every comparison gets its own slide.",
        beforeLabel: "Before",
        afterLabel: "After",
        cardNumber: "02",
        cardTitle: "Multi-Slide Story",
        cardDescription:
            "Add as many slides as you need. Each one carries its own image pair, headline, labels, and caption.",
    },
    {
        heading: "Looks right on every screen size.",
        beforeLabel: "Original",
        afterLabel: "Edited",
        cardNumber: "03",
        cardTitle: "Fully Responsive",
        cardDescription:
            "The layout adapts to the width of the component itself, so it fits inside any section or grid without extra breakpoints.",
    },
    {
        heading: "Match it to your brand in seconds.",
        beforeLabel: "Default",
        afterLabel: "Branded",
        cardNumber: "04",
        cardTitle: "Yours to Style",
        cardDescription:
            "Colors, corner radius, labels, autoplay, and transition speed are all editable from the properties panel.",
    },
]

addPropertyControls(BeforeAfterCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            title: "Slide",
            controls: {
                beforeImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Before",
                },
                afterImage: {
                    type: ControlType.ResponsiveImage,
                    title: "After",
                },
                beforeLabel: {
                    type: ControlType.String,
                    title: "Left Tag",
                    defaultValue: "Before",
                },
                afterLabel: {
                    type: ControlType.String,
                    title: "Right Tag",
                    defaultValue: "After",
                },
                heading: {
                    type: ControlType.String,
                    title: "Heading",
                    displayTextArea: true,
                    defaultValue: "Show the difference.",
                },
                cardNumber: {
                    type: ControlType.String,
                    title: "Card No.",
                    defaultValue: "01",
                },
                cardTitle: {
                    type: ControlType.String,
                    title: "Card Title",
                    defaultValue: "Feature",
                },
                cardDescription: {
                    type: ControlType.String,
                    title: "Card Text",
                    displayTextArea: true,
                    defaultValue:
                        "Describe what changed between the two images.",
                },
            },
        },
        defaultValue: defaultSlides,
    },

    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Runs on the published site and in preview only.",
    },
    autoPlayDelay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (props) => !props.autoPlay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        hidden: (props) => !props.autoPlay,
    },
    initialReveal: {
        type: ControlType.Number,
        title: "Reveal",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    speed: {
        type: ControlType.Number,
        title: "Slide Speed",
        defaultValue: 0.45,
        min: 0,
        max: 1.5,
        step: 0.05,
        unit: "s",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        defaultValue: true,
    },

    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#FF7A1A",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0B",
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading",
        defaultValue: "#FFFFFF",
    },
    cardBg: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgba(18,18,20,0.72)",
    },
    cardText: {
        type: ControlType.Color,
        title: "Card Title",
        defaultValue: "#FFFFFF",
    },
    cardMuted: {
        type: ControlType.Color,
        title: "Card Text",
        defaultValue: "rgba(255,255,255,0.62)",
    },
    navBg: {
        type: ControlType.Color,
        title: "Nav BG",
        defaultValue: "rgba(255,255,255,0.12)",
    },
    navIcon: {
        type: ControlType.Color,
        title: "Nav Icon",
        defaultValue: "#FFFFFF",
    },
})
