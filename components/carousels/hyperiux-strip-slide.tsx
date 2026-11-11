import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { gsap } from "gsap"
import { SplitText } from "gsap/SplitText"

gsap.registerPlugin(SplitText)

const STRIP_COUNT = 12
const REVEAL_DURATION = 0.5
const STRIP_STAGGER = 0.04
const ZOOM_DURATION = 0.9
const ZOOM_FROM = 1.2
const AUTOPLAY_INTERVAL = 5000
const TITLE_CHAR_DURATION = 0.6
const TITLE_CHAR_STAGGER = 0.04
const TITLE_CHAR_Y_PERCENT = 100
const PROGRESS_DURATION = 0.9
const STYLE_ID = "hpx-parallax-slider-styles"

export interface HyperiuxStripSliderImage {
    src: string
    srcSet?: string
    alt?: string
}

export interface HyperiuxStripSliderSlide {
    image: HyperiuxStripSliderImage
    title: string
    chapter?: string
}

export interface HyperiuxStripSliderProps {
    slides?: HyperiuxStripSliderSlide[]
    stripCount?: number
    revealDuration?: number
    stripStagger?: number
    zoomFrom?: number
    zoomDuration?: number
    autoplay?: boolean
    showProgressBar?: boolean
    showCounter?: boolean
    showControls?: boolean
    showClue?: boolean
    clueText?: string
    accentColor?: string
    style?: React.CSSProperties
}

const defaultSlides: HyperiuxStripSliderSlide[] = [
    {
        image: {
            src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/strip-paralax-slider/img01.png",
        },
        title: "Fire",
        chapter: "Collection 01",
    },
    {
        image: {
            src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/strip-paralax-slider/img02.png",
        },
        title: "Allure",
        chapter: "Collection 02",
    },
    {
        image: {
            src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/strip-paralax-slider/img03.png",
        },
        title: "Ember",
        chapter: "Collection 03",
    },
]

type TransitionDirection = "next" | "prev"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function prefersReducedMotion() {
    if (typeof window === "undefined") return false
    return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false
}

const imgFillStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    userSelect: "none",
    display: "block",
}

const CSS = `
.hpx-pss-root {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #000000;
}
.hpx-pss-strip {
  position: absolute;
  top: 0;
  bottom: 0;
  overflow: hidden;
}
.hpx-pss-strip-inner {
  position: absolute;
  top: 0;
  bottom: 0;
}
.hpx-pss-zoom {
  position: relative;
  height: 100%;
  width: 100%;
  will-change: transform;
}
.hpx-pss-overlay-fill {
  position: absolute;
  inset: 0;
}
.hpx-pss-controls {
  position: absolute;
  inset: 0;
  z-index: 20;
  cursor: none;
}
.hpx-pss-progress-track {
  pointer-events: none;
  position: absolute;
  left: 40px;
  right: 40px;
  top: 80px;
  z-index: 10;
  height: 1px;
}
@media (max-width: 1024.98px) {
  .hpx-pss-progress-track { top: 112px; }
}
.hpx-pss-progress-fill {
  height: 100%;
  width: 100%;
  transform-origin: left;
}
.hpx-pss-caption {
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  padding: 96px 40px 40px 40px;
}
@media (max-width: 1024.98px) {
  .hpx-pss-caption { padding-top: 128px; }
}
.hpx-pss-chapter {
  display: block;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.hpx-pss-bottom-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  padding: 0 40px 40px 40px;
}
@media (max-width: 1024.98px) {
  .hpx-pss-bottom-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 24px;
  }
}
@media (max-width: 767.98px) {
  .hpx-pss-bottom-bar { padding-bottom: 128px; }
}
.hpx-pss-title {
  pointer-events: none;
  width: 33.3333%;
  flex-shrink: 0;
  overflow: hidden;
  font-size: 96px;
  line-height: 1;
  display: flex;
  align-items: flex-end;
  margin: 0;
  font-family: "Instrument Serif", Georgia, serif;
}
@media (max-width: 1024.98px) {
  .hpx-pss-title { order: 1; width: 100%; }
}
.hpx-pss-spacer {
  width: 33.3333%;
  flex-shrink: 0;
}
@media (max-width: 1024.98px) {
  .hpx-pss-spacer { display: none; }
}
.hpx-pss-counter {
  pointer-events: none;
  display: flex;
  width: 33.3333%;
  flex-shrink: 0;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 20px;
  padding-top: 20px;
  font-size: 12px;
  line-height: 16px;
}
@media (max-width: 1024.98px) {
  .hpx-pss-counter {
    order: 2;
    height: auto;
    width: 100%;
    justify-content: flex-start;
    padding: 0;
  }
}
@media (max-width: 767.98px) {
  .hpx-pss-counter {
    order: -1;
    justify-content: flex-end;
  }
}
.hpx-pss-counter-num-wrap {
  display: inline-block;
  width: 2ch;
  overflow: hidden;
  text-align: right;
}
.hpx-pss-counter-num {
  display: inline-block;
}
.hpx-pss-cursor {
  pointer-events: none;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  opacity: 0;
}
@media (max-width: 1024.98px) {
  .hpx-pss-cursor { display: none; }
}
.hpx-pss-cursor-circle {
  display: flex;
  width: 60px;
  height: 60px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}
.hpx-pss-cursor-inner {
  position: relative;
  width: 30px;
  height: 30px;
}
.hpx-pss-cursor-line {
  position: absolute;
  left: 50%;
  top: 50%;
  height: 2px;
  width: 16px;
  background: #000000;
}
.hpx-pss-clue {
  pointer-events: none;
  position: absolute;
  bottom: 32px;
  left: 50%;
  z-index: 50;
  transform: translateX(-50%);
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.35);
  padding: 12px 24px;
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  margin: 0;
}
@media (max-width: 1024.98px) {
  .hpx-pss-clue { font-size: 16px; }
}
@media (max-width: 767.98px) {
  .hpx-pss-clue {
    bottom: 24px;
    width: 70%;
    font-size: 14px;
  }
}
`

function injectStyles() {
    if (typeof document === "undefined") return
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!styleEl) {
        styleEl = document.createElement("style")
        styleEl.id = STYLE_ID
        document.head.appendChild(styleEl)
    }
    if (styleEl.textContent !== CSS) {
        styleEl.textContent = CSS
    }
    if (!document.getElementById("hpx-pss-font")) {
        const link = document.createElement("link")
        link.id = "hpx-pss-font"
        link.rel = "stylesheet"
        link.href =
            "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
        document.head.appendChild(link)
    }
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */
export default function HyperiuxStripSlider({
    slides = defaultSlides,
    stripCount = STRIP_COUNT,
    revealDuration = REVEAL_DURATION,
    stripStagger = STRIP_STAGGER,
    zoomFrom = ZOOM_FROM,
    zoomDuration = ZOOM_DURATION,
    autoplay = false,
    showProgressBar = true,
    showCounter = true,
    showControls = true,
    showClue = true,
    clueText = "Click either side and watch the next strip cut through.",
    accentColor = "#ffffff",
    style,
}: HyperiuxStripSliderProps) {
    const isStatic = useIsStaticRenderer()
    injectStyles()

    const [current, setCurrent] = useState(0)
    const [incoming, setIncoming] = useState<number | null>(null)
    const [caption, setCaption] = useState(0)
    const [direction, setDirection] = useState<TransitionDirection>("next")
    const rootRef = useRef<HTMLDivElement>(null)
    const captionRef = useRef<HTMLDivElement>(null)
    const chapterRef = useRef<HTMLSpanElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const counterRef = useRef<HTMLSpanElement>(null)
    const counterNumRef = useRef<HTMLSpanElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)
    const stripsRef = useRef<HTMLDivElement[]>([])
    const zoomRef = useRef<HTMLDivElement[]>([])
    const isAnimating = useRef(false)
    const isFirstCaption = useRef(true)
    const splitRef = useRef<any>(null)

    const cursorRef = useRef<HTMLDivElement>(null)
    const line1Ref = useRef<HTMLSpanElement>(null)
    const line2Ref = useRef<HTMLSpanElement>(null)
    const isInside = useRef(false)
    const mouse = useRef({ x: 0, y: 0 })
    const pos = useRef({ x: 0, y: 0 })

    const total = slides.length

    const goTo = useCallback(
        (next: number, transitionDirection: TransitionDirection) => {
            if (isAnimating.current || next === current || total < 2) return
            isAnimating.current = true
            setDirection(transitionDirection)
            setIncoming(next)
        },
        [current, total]
    )

    const onNext = useCallback(
        () => goTo((current + 1) % total, "next"),
        [current, total, goTo]
    )
    const onPrev = useCallback(
        () => goTo((current - 1 + total) % total, "prev"),
        [current, total, goTo]
    )

    useEffect(() => {
        if (!autoplay || total < 2 || isStatic) return
        if (prefersReducedMotion()) return
        const id = window.setInterval(() => {
            if (!isAnimating.current) onNext()
        }, AUTOPLAY_INTERVAL)
        return () => window.clearInterval(id)
    }, [autoplay, total, onNext, isStatic])

    useLayoutEffect(() => {
        if (incoming === null) return

        const strips = stripsRef.current.slice(0, stripCount).filter(Boolean)
        const zooms = zoomRef.current.slice(0, stripCount).filter(Boolean)
        if (!strips.length) return
        const isPrevious = direction === "prev"
        const orderedStrips = isPrevious ? [...strips].reverse() : strips

        if (isStatic || prefersReducedMotion()) {
            setCaption(incoming)
            setCurrent(incoming)
            setIncoming(null)
            isAnimating.current = false
            return
        }

        const settle = () => {
            setCaption(incoming)
            setCurrent(incoming)
            setIncoming(null)
            isAnimating.current = false
        }

        const tl = gsap.timeline({ onComplete: settle })

        tl.fromTo(
            orderedStrips,
            {
                clipPath: isPrevious
                    ? "inset(0 0 0 100%)"
                    : "inset(0 100% 0 0)",
            },
            {
                clipPath: isPrevious ? "inset(0 0 0 0%)" : "inset(0 0% 0 0)",
                duration: revealDuration,
                ease: "power3.out",
                stagger: stripStagger,
            },
            0
        )

        tl.fromTo(
            zooms,
            { scale: zoomFrom },
            {
                scale: 1,
                duration: zoomDuration,
                ease: "power3.out",
            },
            0
        )

        if (progressRef.current) {
            tl.to(
                progressRef.current,
                {
                    scaleX: (incoming + 1) / total,
                    duration: PROGRESS_DURATION,
                    ease: "power3.inOut",
                },
                0
            )
        }

        const outgoing = [
            captionRef.current,
            titleRef.current,
            counterRef.current,
        ].filter(Boolean)
        if (outgoing.length) {
            tl.to(
                outgoing,
                {
                    autoAlpha: 0,
                    y: -2,
                    duration: 0.35,
                    ease: "power2.in",
                },
                0.15
            )
            tl.add(() => setCaption(incoming), 0.5)
        }

        return () => {
            tl.kill()
        }
    }, [
        incoming,
        direction,
        stripCount,
        revealDuration,
        stripStagger,
        zoomFrom,
        zoomDuration,
        isStatic,
    ])

    useLayoutEffect(() => {
        splitRef.current?.revert()
        splitRef.current = null
    }, [caption])

    useLayoutEffect(() => {
        if (isFirstCaption.current) {
            isFirstCaption.current = false
            return
        }
        if (!captionRef.current || !titleRef.current) return

        gsap.set([captionRef.current, titleRef.current], { autoAlpha: 1, y: 0 })

        if (isStatic || prefersReducedMotion()) {
            gsap.set(
                [
                    chapterRef.current,
                    titleRef.current,
                    counterRef.current,
                    counterNumRef.current,
                ],
                { autoAlpha: 1, y: 0, yPercent: 0 }
            )
            return
        }

        const split = SplitText.create(titleRef.current, { type: "chars" })
        splitRef.current = split

        const tl = gsap.timeline({
            onComplete: () => {
                split.revert()
                if (splitRef.current === split) splitRef.current = null
            },
        })

        tl.from(
            split.chars,
            {
                yPercent: TITLE_CHAR_Y_PERCENT,
                duration: TITLE_CHAR_DURATION,
                ease: "power2.out",
                stagger: TITLE_CHAR_STAGGER,
            },
            0
        )

        if (chapterRef.current) {
            tl.fromTo(
                chapterRef.current,
                { autoAlpha: 0, y: 0 },
                { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
                0
            )
        }

        if (counterRef.current) {
            tl.fromTo(
                counterRef.current,
                { autoAlpha: 0, y: 0 },
                { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
                0
            )
        }
        if (counterNumRef.current) {
            tl.from(
                counterNumRef.current,
                {
                    yPercent: 110,
                    duration: 0.55,
                    ease: "power3.out",
                },
                0
            )
        }

        return () => {
            tl.kill()
        }
    }, [caption, isStatic])

    useEffect(() => {
        return () => {
            splitRef.current?.revert()
            splitRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!showControls || isStatic) return
        const root = rootRef.current
        const cursor = cursorRef.current
        const l1 = line1Ref.current
        const l2 = line2Ref.current
        if (!root || !cursor || !l1 || !l2) return

        gsap.set(cursor, {
            xPercent: -50,
            yPercent: -50,
            opacity: 0,
            scale: 0.6,
        })
        gsap.set(l1, {
            transformOrigin: "100% 50%",
            xPercent: -50,
            yPercent: -50,
            y: -1.5,
            rotation: 45,
            x: 0,
        })
        gsap.set(l2, {
            transformOrigin: "100% 50%",
            xPercent: -50,
            yPercent: -50,
            y: 1.5,
            rotation: -45,
            x: 0,
        })

        let currentSide: "left" | "right" = "right"
        let rafId: number | null = null

        const handleMove = (e: MouseEvent) => {
            const x = e.clientX
            const y = e.clientY
            const target = e.target instanceof Element ? e.target : null
            const isOverControls = Boolean(
                target?.closest(
                    'button, input, textarea, select, a, label, [role="button"], [contenteditable="true"]'
                )
            )

            mouse.current.x = x
            mouse.current.y = y

            const rect = rootRef.current?.getBoundingClientRect()
            const isOut =
                !rect ||
                x <= rect.left ||
                y <= rect.top ||
                x >= rect.right ||
                y >= rect.bottom

            if (isOut || isOverControls) {
                if (isInside.current) {
                    isInside.current = false
                    gsap.to(cursor, {
                        opacity: 0,
                        scale: 0.6,
                        duration: 0.25,
                        ease: "power3.inOut",
                    })
                }
                return
            }

            if (!isInside.current) {
                pos.current.x = x
                pos.current.y = y
                gsap.set(cursor, { x, y })
                gsap.to(cursor, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.25,
                    ease: "power3.out",
                })
                isInside.current = true
            }

            const isLeft = rect ? x < rect.left + rect.width / 2 : false
            const nextSide = isLeft ? "left" : "right"

            if (nextSide !== currentSide) {
                currentSide = nextSide
                if (nextSide === "left") {
                    gsap.to(l1, {
                        rotation: 135,
                        x: "-1vw",
                        duration: 0.35,
                        ease: "power3.inOut",
                    })
                    gsap.to(l2, {
                        rotation: -135,
                        x: "-1vw",
                        duration: 0.35,
                        ease: "power3.inOut",
                    })
                } else {
                    gsap.to(l1, {
                        rotation: 45,
                        x: 4,
                        duration: 0.35,
                        ease: "power3.inOut",
                    })
                    gsap.to(l2, {
                        rotation: -45,
                        x: 4,
                        duration: 0.35,
                        ease: "power3.inOut",
                    })
                }
            }
        }

        const render = () => {
            pos.current.x += (mouse.current.x - pos.current.x) * 0.12
            pos.current.y += (mouse.current.y - pos.current.y) * 0.12
            gsap.set(cursor, { x: pos.current.x, y: pos.current.y })
            rafId = requestAnimationFrame(render)
        }

        const start = () => {
            if (rafId !== null) return
            window.addEventListener("mousemove", handleMove)
            render()
        }

        const stop = () => {
            window.removeEventListener("mousemove", handleMove)
            if (rafId !== null) {
                cancelAnimationFrame(rafId)
                rafId = null
            }
            if (isInside.current) {
                isInside.current = false
                gsap.set(cursor, { opacity: 0, scale: 0.6 })
            }
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry?.isIntersecting) start()
                else stop()
            },
            { threshold: 0 }
        )
        observer.observe(root)

        return () => {
            observer.disconnect()
            stop()
        }
    }, [showControls, isStatic])

    if (!slides.length) return null

    const renderStrips = (slide: HyperiuxStripSliderSlide) => {
        const width = 100 / stripCount

        return Array.from({ length: stripCount }, (_, i) => (
            <div
                key={i}
                ref={(el) => {
                    if (el) stripsRef.current[i] = el
                }}
                className="hpx-pss-strip"
                style={{
                    left: `${i * width}%`,
                    width: `${width}%`,
                    marginLeft: i === 0 ? 0 : "-0.5px",
                    paddingLeft: i === 0 ? 0 : "0.5px",
                }}
            >
                <div
                    className="hpx-pss-strip-inner"
                    style={{
                        left: `-${i * 100}%`,
                        width: `${stripCount * 100}%`,
                    }}
                >
                    <div
                        ref={(el) => {
                            if (el) zoomRef.current[i] = el
                        }}
                        className="hpx-pss-zoom"
                    >
                        <img
                            src={slide.image?.src}
                            srcSet={slide.image?.srcSet}
                            alt=""
                            draggable={false}
                            style={imgFillStyle}
                        />
                    </div>
                </div>
            </div>
        ))
    }

    const activeSlide = slides[caption] ?? slides[0]

    return (
        <div ref={rootRef} className="hpx-pss-root" style={style}>
            <div className="hpx-pss-overlay-fill">
                <img
                    src={slides[current].image?.src}
                    srcSet={slides[current].image?.srcSet}
                    alt={slides[current].image?.alt ?? slides[current].title}
                    draggable={false}
                    style={imgFillStyle}
                />
            </div>

            {incoming !== null && (
                <div className="hpx-pss-overlay-fill">
                    {renderStrips(slides[incoming])}
                </div>
            )}

            {showControls && total > 1 && (
                <div
                    className="hpx-pss-controls"
                    onClick={(e) => {
                        if (isAnimating.current) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        const isLeft = e.clientX < rect.left + rect.width / 2
                        if (isLeft) onPrev()
                        else onNext()
                    }}
                />
            )}

            {showProgressBar && (
                <div
                    className="hpx-pss-progress-track"
                    style={{ backgroundColor: `${accentColor}33` }}
                >
                    <div
                        ref={progressRef}
                        className="hpx-pss-progress-fill"
                        style={{
                            transform: `scaleX(${(caption + 1) / total})`,
                            backgroundColor: accentColor,
                        }}
                    />
                </div>
            )}

            <div ref={captionRef} className="hpx-pss-caption">
                <span
                    ref={chapterRef}
                    className="hpx-pss-chapter"
                    style={{ color: accentColor }}
                >
                    {activeSlide.chapter ??
                        `Collection ${String(caption + 1).padStart(2, "0")}`}
                </span>
            </div>

            <div className="hpx-pss-bottom-bar">
                <h2
                    ref={titleRef}
                    className="hpx-pss-title"
                    style={{ color: accentColor }}
                >
                    {activeSlide.title}
                </h2>

                <div aria-hidden className="hpx-pss-spacer" />

                {showCounter && (
                    <span
                        ref={counterRef}
                        className="hpx-pss-counter"
                        style={{ color: `${accentColor}b3` }}
                    >
                        <span className="hpx-pss-counter-num-wrap">
                            <span
                                ref={counterNumRef}
                                className="hpx-pss-counter-num"
                            >
                                {String(caption + 1).padStart(2, "0")}
                            </span>
                        </span>
                        <span>&nbsp;/ {String(total).padStart(2, "0")}</span>
                    </span>
                )}
            </div>

            {showControls && total > 1 && (
                <div ref={cursorRef} className="hpx-pss-cursor">
                    <div
                        className="hpx-pss-cursor-circle"
                        style={{ backgroundColor: accentColor }}
                    >
                        <div className="hpx-pss-cursor-inner">
                            <span
                                ref={line1Ref}
                                className="hpx-pss-cursor-line"
                            />
                            <span
                                ref={line2Ref}
                                className="hpx-pss-cursor-line"
                            />
                        </div>
                    </div>
                </div>
            )}

            {showClue && clueText && total > 1 && (
                <p className="hpx-pss-clue">{clueText}</p>
            )}
        </div>
    )
}

HyperiuxStripSlider.defaultProps = {
    slides: defaultSlides,
    stripCount: STRIP_COUNT,
    revealDuration: REVEAL_DURATION,
    stripStagger: STRIP_STAGGER,
    zoomFrom: ZOOM_FROM,
    zoomDuration: ZOOM_DURATION,
    autoplay: false,
    showProgressBar: true,
    showCounter: true,
    showControls: true,
    showClue: true,
    clueText: "Click either side and watch the next strip cut through.",
    accentColor: "#ffffff",
}

addPropertyControls(HyperiuxStripSlider, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title" },
                chapter: { type: ControlType.String, title: "Chapter" },
            },
        },
        defaultValue: defaultSlides,
    },
    stripCount: {
        type: ControlType.Number,
        title: "Strip Count",
        min: 2,
        max: 24,
        step: 1,
        defaultValue: STRIP_COUNT,
    },
    revealDuration: {
        type: ControlType.Number,
        title: "Reveal Duration",
        min: 0.1,
        max: 2,
        step: 0.05,
        defaultValue: REVEAL_DURATION,
    },
    stripStagger: {
        type: ControlType.Number,
        title: "Strip Stagger",
        min: 0,
        max: 0.2,
        step: 0.005,
        defaultValue: STRIP_STAGGER,
    },
    zoomFrom: {
        type: ControlType.Number,
        title: "Zoom From",
        min: 1,
        max: 2,
        step: 0.05,
        defaultValue: ZOOM_FROM,
    },
    zoomDuration: {
        type: ControlType.Number,
        title: "Zoom Duration",
        min: 0.1,
        max: 2,
        step: 0.05,
        defaultValue: ZOOM_DURATION,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    showProgressBar: {
        type: ControlType.Boolean,
        title: "Progress Bar",
        defaultValue: true,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Click Controls",
        defaultValue: true,
        description: "Click-to-navigate overlay and the circular cursor.",
    },
    showClue: {
        type: ControlType.Boolean,
        title: "Hint Pill",
        defaultValue: true,
    },
    clueText: {
        type: ControlType.String,
        title: "Hint Text",
        defaultValue: "Click either side and watch the next strip cut through.",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#ffffff",
    },
})
