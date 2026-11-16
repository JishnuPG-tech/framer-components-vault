import * as React from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
import gsap from "gsap"
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
 * Parallax Strip Slider
 * -----------------------------------------------------------------------
 * Framer-ready GSAP parallax image slider.
 *
 * Improvements:
 * - Stable rendering in Framer Canvas
 * - Static renderer support
 * - No SplitText dependency
 * - Safer GSAP lifecycle
 * - Valid default image URLs
 * - Custom title/chapter/counter fonts
 * - Responsive mobile layout
 * - Reduced-motion support
 * - Autoplay support
 * - Cursor navigation
 */

const STRIP_COUNT = 10
const REVEAL_DURATION = 0.5
const STRIP_STAGGER = 0.04
const ZOOM_DURATION = 0.9
const ZOOM_FROM = 1.2
const AUTOPLAY_INTERVAL = 5000

const TITLE_CHAR_DURATION = 0.6
const TITLE_CHAR_STAGGER = 0.04

const PROGRESS_DURATION = 0.9

type ResponsiveImageValue =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
      }

type Slide = {
    src?: ResponsiveImageValue
    image?: ResponsiveImageValue
    title?: string
    chapter?: string
}

export type ParallaxStripSliderProps = {
    slides?: Slide[]

    className?: string

    stripCount?: number
    revealDuration?: number
    stripStagger?: number

    zoomFrom?: number
    zoomDuration?: number

    autoplay?: boolean

    showProgressBar?: boolean
    showCounter?: boolean
    showControls?: boolean

    accentColor?: string
    backgroundColor?: string

    height?: number

    titleFont?: React.CSSProperties
    chapterFont?: React.CSSProperties
    counterFont?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/* Default slides                                                              */
/* -------------------------------------------------------------------------- */

const DEFAULT_SLIDES: Slide[] = [
    {
        src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
        title: "Flow",
        chapter: "Workflows",
    },
    {
        src: "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
        title: "Signal",
        chapter: "Insights",
    },
    {
        src: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
        title: "Sync",
        chapter: "Integrations",
    },
]

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function srcOf(image: ResponsiveImageValue | undefined): string | undefined {
    if (!image) return undefined

    if (typeof image === "string") {
        return image
    }

    return image.src
}

function getSlideSrc(slide?: Slide): string | undefined {
    if (!slide) return undefined

    return srcOf(slide.src) ?? srcOf(slide.image)
}

function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false

    return (
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
        false
    )
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                      */
/* -------------------------------------------------------------------------- */

const STYLE_SHEET = `
.pss-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    isolation: isolate;
}

.pss-layer {
    position: absolute;
    inset: 0;
}

.pss-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    user-select: none;
    -webkit-user-drag: none;
}

.pss-strip {
    position: absolute;
    top: 0;
    bottom: 0;
    overflow: hidden;
    will-change: clip-path;
}

.pss-strip-inner {
    position: absolute;
    top: 0;
    bottom: 0;
}

.pss-zoom {
    position: relative;
    width: 100%;
    height: 100%;
    will-change: transform;
}

.pss-clickzone {
    position: absolute;
    inset: 0;
    z-index: 20;
}

.pss-progress-track {
    pointer-events: none;
    position: absolute;
    left: 24px;
    right: 24px;
    top: 24px;
    z-index: 30;
    height: 1px;
    overflow: hidden;
}

.pss-progress-fill {
    width: 100%;
    height: 100%;
    transform-origin: left center;
    will-change: transform;
}

.pss-caption {
    pointer-events: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    z-index: 25;
    padding: 48px 24px 0;
}

.pss-chapter {
    display: block;
}

.pss-bottombar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 25;

    display: flex;
    align-items: flex-end;

    padding: 0 24px 40px;
}

.pss-bottombar.pss-stacked {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    padding-bottom: 96px;
}

.pss-title {
    pointer-events: none;
    display: flex;
    align-items: flex-end;

    margin: 0;
    padding: 0;

    overflow: hidden;

    line-height: 1;
    white-space: nowrap;
}

.pss-title-normal {
    width: 33.3333%;
    flex-shrink: 0;
}

.pss-title-stacked {
    order: 2;
    width: 100%;
}

.pss-title-char {
    display: inline-block;
    will-change: transform, opacity;
}

.pss-spacer {
    width: 33.3333%;
    flex-shrink: 0;
}

.pss-counter {
    pointer-events: none;
    display: flex;
    flex-shrink: 0;
    align-items: center;
}

.pss-counter-normal {
    width: 33.3333%;
    height: 100%;
    justify-content: flex-end;
    padding: 20px 0;
}

.pss-counter-stacked {
    order: 1;
    width: 100%;
    justify-content: flex-end;
}

.pss-counter-clip {
    display: inline-block;
    width: 2ch;
    overflow: hidden;
    text-align: right;
}

.pss-counter-number {
    display: inline-block;
    will-change: transform;
}

.pss-cursor {
    pointer-events: none;

    position: fixed;
    left: 0;
    top: 0;

    z-index: 100;
    width: 60px;
    height: 60px;

    will-change: transform, opacity;
}

.pss-cursor-circle {
    display: flex;

    width: 60px;
    height: 60px;

    align-items: center;
    justify-content: center;

    border-radius: 999px;
}

.pss-cursor-inner {
    position: relative;
    width: 30px;
    height: 30px;
}

.pss-cursor-line {
    position: absolute;

    left: 50%;
    top: 50%;

    width: 16px;
    height: 2px;

    transform-origin: 100% 50%;
}

@media (min-width: 640px) {
    .pss-progress-track {
        left: 40px;
        right: 40px;
        top: 32px;
    }

    .pss-caption {
        padding-left: 40px;
        padding-right: 40px;
        padding-top: 64px;
    }

    .pss-bottombar {
        padding-left: 40px;
        padding-right: 40px;
    }
}

@media (min-width: 640px) {
    .pss-title {
        font-size: 72px;
    }
}

@media (min-width: 1024px) {
    .pss-title {
        font-size: 96px;
    }
}
`

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function ParallaxStripSlider({
    slides = DEFAULT_SLIDES,
    className = "",

    stripCount = STRIP_COUNT,
    revealDuration = REVEAL_DURATION,
    stripStagger = STRIP_STAGGER,

    zoomFrom = ZOOM_FROM,
    zoomDuration = ZOOM_DURATION,

    autoplay = false,

    showProgressBar = true,
    showCounter = true,
    showControls = true,

    accentColor = "#ffffff",
    backgroundColor = "#000000",

    height = 640,

    titleFont = {
        fontFamily: "Georgia, serif",
        fontSize: 96,
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: "-0.02em",
    },

    chapterFont = {
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: "0.025em",
    },

    counterFont = {
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: "0em",
    },
}: ParallaxStripSliderProps) {
    /* ---------------------------------------------------------------------- */
    /* Framer static renderer                                                 */
    /* ---------------------------------------------------------------------- */

    const isStaticRenderer = useIsStaticRenderer()

    /* ---------------------------------------------------------------------- */
    /* State                                                                  */
    /* ---------------------------------------------------------------------- */

    const safeSlides =
        Array.isArray(slides) && slides.length > 0 ? slides : DEFAULT_SLIDES

    const total = safeSlides.length

    const [current, setCurrent] = useState(0)
    const [incoming, setIncoming] = useState<number | null>(null)
    const [caption, setCaption] = useState(0)
    const [isCoarsePointer, setIsCoarsePointer] = useState(false)

    const [direction, setDirection] = useState<"next" | "prev">("next")

    /* ---------------------------------------------------------------------- */
    /* Refs                                                                   */
    /* ---------------------------------------------------------------------- */

    const rootRef = useRef<HTMLDivElement>(null)

    const captionRef = useRef<HTMLDivElement>(null)
    const chapterRef = useRef<HTMLSpanElement>(null)

    const titleRef = useRef<HTMLHeadingElement>(null)
    const titleCharsRef = useRef<HTMLSpanElement[]>([])

    const counterRef = useRef<HTMLSpanElement>(null)
    const counterNumRef = useRef<HTMLSpanElement>(null)

    const progressRef = useRef<HTMLDivElement>(null)

    const stripsRef = useRef<HTMLDivElement[]>([])
    const zoomRef = useRef<HTMLDivElement[]>([])

    const cursorRef = useRef<HTMLDivElement>(null)
    const line1Ref = useRef<HTMLSpanElement>(null)
    const line2Ref = useRef<HTMLSpanElement>(null)

    const isAnimating = useRef(false)

    const mouse = useRef({
        x: 0,
        y: 0,
    })

    const position = useRef({
        x: 0,
        y: 0,
    })

    const isInside = useRef(false)

    /* ---------------------------------------------------------------------- */
    /* Responsive pointer detection                                           */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (typeof window === "undefined") return

        const media = window.matchMedia("(pointer: coarse)")

        const update = () => {
            setIsCoarsePointer(media.matches)
        }

        update()

        media.addEventListener?.("change", update)

        return () => {
            media.removeEventListener?.("change", update)
        }
    }, [])

    /* ---------------------------------------------------------------------- */
    /* Reset invalid current index                                            */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (current >= total) {
            setCurrent(0)
        }

        if (caption >= total) {
            setCaption(0)
        }
    }, [current, caption, total])

    /* ---------------------------------------------------------------------- */
    /* Navigation                                                              */
    /* ---------------------------------------------------------------------- */

    const goTo = useCallback(
        (nextIndex: number, nextDirection: "next" | "prev") => {
            if (isStaticRenderer) return
            if (isAnimating.current) return
            if (total < 2) return

            const normalized = ((nextIndex % total) + total) % total

            if (normalized === current) return

            isAnimating.current = true

            setDirection(nextDirection)
            setIncoming(normalized)
        },
        [current, total, isStaticRenderer]
    )

    const onNext = useCallback(() => {
        goTo((current + 1) % total, "next")
    }, [current, total, goTo])

    const onPrev = useCallback(() => {
        goTo((current - 1 + total) % total, "prev")
    }, [current, total, goTo])

    /* ---------------------------------------------------------------------- */
    /* Autoplay                                                                */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (isStaticRenderer) return
        if (!autoplay) return
        if (total < 2) return
        if (prefersReducedMotion()) return

        const timer = window.setInterval(() => {
            if (!isAnimating.current) {
                onNext()
            }
        }, AUTOPLAY_INTERVAL)

        return () => {
            window.clearInterval(timer)
        }
    }, [autoplay, total, onNext, isStaticRenderer])

    /* ---------------------------------------------------------------------- */
    /* Transition animation                                                    */
    /* ---------------------------------------------------------------------- */

    useLayoutEffect(() => {
        if (incoming === null) return

        const strips = stripsRef.current.slice(0, stripCount).filter(Boolean)

        const zooms = zoomRef.current.slice(0, stripCount).filter(Boolean)

        if (!strips.length) {
            setCurrent(incoming)
            setCaption(incoming)
            setIncoming(null)
            isAnimating.current = false
            return
        }

        const targetIndex = incoming
        const previousDirection = direction === "prev"

        /* Static / reduced motion */

        if (isStaticRenderer || prefersReducedMotion()) {
            setCurrent(targetIndex)
            setCaption(targetIndex)
            setIncoming(null)
            isAnimating.current = false

            return
        }

        const orderedStrips = previousDirection ? [...strips].reverse() : strips

        const timeline = gsap.timeline({
            defaults: {
                overwrite: "auto",
            },
        })

        /* Prepare incoming strips */

        gsap.set(orderedStrips, {
            clipPath: previousDirection
                ? "inset(0 0 0 100%)"
                : "inset(0 100% 0 0)",
        })

        gsap.set(zooms, {
            scale: zoomFrom,
        })

        /* Strip wipe */

        timeline.to(
            orderedStrips,
            {
                clipPath: previousDirection
                    ? "inset(0 0 0 0%)"
                    : "inset(0 0% 0 0%)",

                duration: Math.max(0.05, revealDuration),

                ease: "power3.out",

                stagger: Math.max(0, stripStagger),
            },
            0
        )

        /* Ken Burns zoom */

        timeline.to(
            zooms,
            {
                scale: 1,

                duration: Math.max(0.05, zoomDuration),

                ease: "power3.out",
            },
            0
        )

        /* Progress */

        if (progressRef.current) {
            timeline.to(
                progressRef.current,
                {
                    scaleX: (targetIndex + 1) / total,

                    duration: PROGRESS_DURATION,

                    ease: "power3.inOut",
                },
                0
            )
        }

        /* Fade current caption */

        const outgoing = [
            captionRef.current,
            titleRef.current,
            counterRef.current,
        ].filter(Boolean)

        if (outgoing.length) {
            timeline.to(
                outgoing,
                {
                    autoAlpha: 0,
                    y: -4,
                    duration: 0.25,
                    ease: "power2.in",
                },
                0
            )
        }

        timeline.call(
            () => {
                setCurrent(targetIndex)
                setCaption(targetIndex)
            },
            [],
            0.42
        )

        timeline.call(
            () => {
                setIncoming(null)
                isAnimating.current = false
            },
            [],
            ">"
        )

        return () => {
            timeline.kill()
        }
    }, [
        incoming,
        direction,
        stripCount,
        revealDuration,
        stripStagger,
        zoomFrom,
        zoomDuration,
        total,
        isStaticRenderer,
    ])

    /* ---------------------------------------------------------------------- */
    /* Caption animation                                                      */
    /* ---------------------------------------------------------------------- */

    useLayoutEffect(() => {
        if (!titleRef.current) return

        const chars = titleCharsRef.current.filter(Boolean)

        if (!chars.length) return

        gsap.killTweensOf([
            captionRef.current,
            chapterRef.current,
            titleRef.current,
            counterRef.current,
            counterNumRef.current,
            ...chars,
        ])

        gsap.set(
            [
                captionRef.current,
                chapterRef.current,
                titleRef.current,
                counterRef.current,
                counterNumRef.current,
            ].filter(Boolean),
            {
                autoAlpha: 1,
                y: 0,
            }
        )

        gsap.set(chars, {
            yPercent: 0,
            autoAlpha: 1,
        })

        /* Static renderer */

        if (isStaticRenderer || prefersReducedMotion()) {
            return
        }

        gsap.set(chars, {
            yPercent: 110,
            autoAlpha: 1,
        })

        gsap.set([chapterRef.current, counterRef.current].filter(Boolean), {
            autoAlpha: 0,
        })

        const timeline = gsap.timeline()

        timeline.to(
            chars,
            {
                yPercent: 0,
                duration: TITLE_CHAR_DURATION,
                ease: "power2.out",
                stagger: TITLE_CHAR_STAGGER,
            },
            0
        )

        if (chapterRef.current) {
            timeline.to(
                chapterRef.current,
                {
                    autoAlpha: 1,
                    duration: 0.45,
                    ease: "power2.out",
                },
                0.05
            )
        }

        if (counterRef.current) {
            timeline.to(
                counterRef.current,
                {
                    autoAlpha: 1,
                    duration: 0.4,
                    ease: "power2.out",
                },
                0.05
            )
        }

        if (counterNumRef.current) {
            gsap.set(counterNumRef.current, {
                yPercent: 110,
            })

            timeline.to(
                counterNumRef.current,
                {
                    yPercent: 0,
                    duration: 0.55,
                    ease: "power3.out",
                },
                0
            )
        }

        return () => {
            timeline.kill()
        }
    }, [caption, isStaticRenderer])

    /* ---------------------------------------------------------------------- */
    /* Cursor                                                                  */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (isStaticRenderer) return
        if (!showControls) return
        if (isCoarsePointer) return

        const cursor = cursorRef.current
        const line1 = line1Ref.current
        const line2 = line2Ref.current
        const root = rootRef.current

        if (!cursor || !line1 || !line2 || !root) {
            return
        }

        gsap.set(cursor, {
            xPercent: -50,
            yPercent: -50,
            opacity: 0,
            scale: 0.6,
        })

        gsap.set(line1, {
            xPercent: -50,
            yPercent: -50,
            y: -1.5,
            x: 4,
            rotation: 45,
        })

        gsap.set(line2, {
            xPercent: -50,
            yPercent: -50,
            y: 1.5,
            x: 4,
            rotation: -45,
        })

        let currentSide: "left" | "right" = "right"

        let rafId: number | null = null

        const handleMove = (event: MouseEvent) => {
            const x = event.clientX
            const y = event.clientY

            const target = event.target instanceof Element ? event.target : null

            const isOverInteractive = Boolean(
                target?.closest(
                    'button, input, textarea, select, a, label, [role="button"], [contenteditable="true"]'
                )
            )

            mouse.current.x = x
            mouse.current.y = y

            const rect = root.getBoundingClientRect()

            const outside =
                x <= rect.left ||
                y <= rect.top ||
                x >= rect.right ||
                y >= rect.bottom

            if (outside || isOverInteractive) {
                if (isInside.current) {
                    isInside.current = false

                    gsap.to(cursor, {
                        opacity: 0,
                        scale: 0.6,
                        duration: 0.2,
                        ease: "power3.inOut",
                    })
                }

                return
            }

            if (!isInside.current) {
                isInside.current = true

                position.current.x = x
                position.current.y = y

                gsap.set(cursor, {
                    x,
                    y,
                })

                gsap.to(cursor, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.2,
                    ease: "power3.out",
                })
            }

            const isLeft = x < rect.left + rect.width / 2

            const nextSide = isLeft ? "left" : "right"

            if (nextSide !== currentSide) {
                currentSide = nextSide

                if (nextSide === "left") {
                    gsap.to(line1, {
                        rotation: 135,
                        x: "-1vw",
                        duration: 0.3,
                        ease: "power3.inOut",
                    })

                    gsap.to(line2, {
                        rotation: -135,
                        x: "-1vw",
                        duration: 0.3,
                        ease: "power3.inOut",
                    })
                } else {
                    gsap.to(line1, {
                        rotation: 45,
                        x: 4,
                        duration: 0.3,
                        ease: "power3.inOut",
                    })

                    gsap.to(line2, {
                        rotation: -45,
                        x: 4,
                        duration: 0.3,
                        ease: "power3.inOut",
                    })
                }
            }
        }

        const render = () => {
            position.current.x += (mouse.current.x - position.current.x) * 0.12

            position.current.y += (mouse.current.y - position.current.y) * 0.12

            gsap.set(cursor, {
                x: position.current.x,
                y: position.current.y,
            })

            rafId = window.requestAnimationFrame(render)
        }

        window.addEventListener("mousemove", handleMove)

        render()

        return () => {
            window.removeEventListener("mousemove", handleMove)

            if (rafId !== null) {
                window.cancelAnimationFrame(rafId)
            }

            gsap.killTweensOf([cursor, line1, line2])
        }
    }, [showControls, isCoarsePointer, isStaticRenderer])

    /* ---------------------------------------------------------------------- */
    /* Strip rendering                                                         */
    /* ---------------------------------------------------------------------- */

    const renderStrips = (slide: Slide) => {
        const safeStripCount = Math.max(1, Math.round(stripCount))

        const width = 100 / safeStripCount

        const imageSrc = getSlideSrc(slide)

        if (!imageSrc) {
            return null
        }

        return Array.from(
            {
                length: safeStripCount,
            },
            (_, index) => (
                <div
                    key={`strip-${index}`}
                    ref={(element) => {
                        if (element) {
                            stripsRef.current[index] = element
                        }
                    }}
                    className="pss-strip"
                    style={{
                        left: `${index * width}%`,
                        width: `${width}%`,
                        marginLeft: index === 0 ? 0 : "-0.5px",
                        paddingLeft: index === 0 ? 0 : "0.5px",
                    }}
                >
                    <div
                        className="pss-strip-inner"
                        style={{
                            left: `-${index * 100}%`,
                            width: `${safeStripCount * 100}%`,
                        }}
                    >
                        <div
                            ref={(element) => {
                                if (element) {
                                    zoomRef.current[index] = element
                                }
                            }}
                            className="pss-zoom"
                        >
                            <img
                                src={imageSrc}
                                alt={slide.title ?? ""}
                                draggable={false}
                                className="pss-img"
                            />
                        </div>
                    </div>
                </div>
            )
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Empty state                                                             */
    /* ---------------------------------------------------------------------- */

    if (!total) {
        return (
            <div
                style={{
                    width: "100%",
                    height,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 40,
                    boxSizing: "border-box",
                    background: backgroundColor,
                    color: "#888",
                    fontSize: 14,
                    textAlign: "center",
                }}
            >
                Add slides in the property panel to see the slider.
            </div>
        )
    }

    /* ---------------------------------------------------------------------- */
    /* Active slide                                                            */
    /* ---------------------------------------------------------------------- */

    const activeSlide =
        safeSlides[Math.min(caption, total - 1)] ?? DEFAULT_SLIDES[0]

    const currentSlide = safeSlides[Math.min(current, total - 1)] ?? activeSlide

    const activeSrc = getSlideSrc(activeSlide)

    const currentSrc = getSlideSrc(currentSlide)

    const stacked = isCoarsePointer

    const title = activeSlide.title ?? "Untitled"

    const titleCharacters = Array.from(title)

    /* ---------------------------------------------------------------------- */
    /* Render                                                                  */
    /* ---------------------------------------------------------------------- */

    return (
        <div
            ref={rootRef}
            className={`pss-root ${className}`}
            style={{
                backgroundColor,
                height,
            }}
        >
            <style>{STYLE_SHEET}</style>

            {/* Current image */}
            <div className="pss-layer">
                {currentSrc ? (
                    <img
                        src={currentSrc}
                        alt={currentSlide.title ?? ""}
                        draggable={false}
                        className="pss-img"
                    />
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: backgroundColor,
                        }}
                    />
                )}
            </div>

            {/* Incoming transition */}
            {incoming !== null && safeSlides[incoming] && (
                <div className="pss-layer">
                    {renderStrips(safeSlides[incoming])}
                </div>
            )}

            {/* Navigation click zone */}
            {showControls && total > 1 && !isStaticRenderer && (
                <div
                    className="pss-clickzone"
                    style={{
                        cursor: stacked ? "pointer" : "none",
                    }}
                    onClick={(event) => {
                        if (isAnimating.current) {
                            return
                        }

                        const rect = event.currentTarget.getBoundingClientRect()

                        const left = event.clientX < rect.left + rect.width / 2

                        if (left) {
                            onPrev()
                        } else {
                            onNext()
                        }
                    }}
                />
            )}

            {/* Progress bar */}
            {showProgressBar && (
                <div
                    className="pss-progress-track"
                    style={{
                        backgroundColor: `${accentColor}33`,
                    }}
                >
                    <div
                        ref={progressRef}
                        className="pss-progress-fill"
                        style={{
                            transform: `scaleX(${(caption + 1) / total})`,
                            backgroundColor: accentColor,
                        }}
                    />
                </div>
            )}

            {/* Chapter */}
            <div ref={captionRef} className="pss-caption">
                <span
                    ref={chapterRef}
                    className="pss-chapter"
                    style={{
                        color: accentColor,
                        ...chapterFont,
                    }}
                >
                    {activeSlide.chapter ??
                        `Collection ${String(caption + 1).padStart(2, "0")}`}
                </span>
            </div>

            {/* Bottom content */}
            <div className={`pss-bottombar ${stacked ? "pss-stacked" : ""}`}>
                {/* Title */}
                <h2
                    ref={titleRef}
                    className={`pss-title ${
                        stacked ? "pss-title-stacked" : "pss-title-normal"
                    }`}
                    style={{
                        color: accentColor,

                        ...titleFont,

                        /* Keep the title inside
                           the component */
                        margin: 0,

                        overflow: "hidden",
                    }}
                >
                    {titleCharacters.map((character, index) => (
                        <span
                            key={`${caption}-${index}`}
                            ref={(element) => {
                                if (element) {
                                    titleCharsRef.current[index] = element
                                }
                            }}
                            className="pss-title-char"
                        >
                            {character === " " ? "\u00A0" : character}
                        </span>
                    ))}
                </h2>

                {/* Desktop spacer */}
                {!stacked && <div aria-hidden className="pss-spacer" />}

                {/* Counter */}
                {showCounter && (
                    <span
                        ref={counterRef}
                        className={`pss-counter ${
                            stacked
                                ? "pss-counter-stacked"
                                : "pss-counter-normal"
                        }`}
                        style={{
                            color: `${accentColor}b3`,
                            ...counterFont,
                        }}
                    >
                        <span className="pss-counter-clip">
                            <span
                                ref={counterNumRef}
                                className="pss-counter-number"
                            >
                                {String(caption + 1).padStart(2, "0")}
                            </span>
                        </span>

                        <span> / {String(total).padStart(2, "0")}</span>
                    </span>
                )}
            </div>

            {/* Custom cursor */}
            {showControls &&
                total > 1 &&
                !isCoarsePointer &&
                !isStaticRenderer && (
                    <div ref={cursorRef} className="pss-cursor">
                        <div
                            className="pss-cursor-circle"
                            style={{
                                backgroundColor: accentColor,
                            }}
                        >
                            <div className="pss-cursor-inner">
                                <span
                                    ref={line1Ref}
                                    className="pss-cursor-line"
                                    style={{
                                        backgroundColor: "#000000",
                                    }}
                                />

                                <span
                                    ref={line2Ref}
                                    className="pss-cursor-line"
                                    style={{
                                        backgroundColor: "#000000",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Default props                                                               */
/* -------------------------------------------------------------------------- */

ParallaxStripSlider.defaultProps = {
    slides: DEFAULT_SLIDES,

    stripCount: STRIP_COUNT,
    revealDuration: REVEAL_DURATION,
    stripStagger: STRIP_STAGGER,

    zoomFrom: ZOOM_FROM,
    zoomDuration: ZOOM_DURATION,

    autoplay: false,

    showProgressBar: true,
    showCounter: true,
    showControls: true,

    accentColor: "#ffffff",
    backgroundColor: "#000000",

    height: 640,

    titleFont: {
        fontFamily: "Georgia, serif",
        fontSize: 96,
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: "-0.02em",
    },

    chapterFont: {
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: "0.025em",
    },

    counterFont: {
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: "0em",
    },
}

/* -------------------------------------------------------------------------- */
/* Property Controls                                                           */
/* -------------------------------------------------------------------------- */

addPropertyControls(ParallaxStripSlider, {
    slides: {
        type: ControlType.Array,
        title: "Slides",

        control: {
            type: ControlType.Object,

            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },

                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Flow",
                },

                chapter: {
                    type: ControlType.String,
                    title: "Chapter",
                    defaultValue: "Workflows",
                },
            },
        },

        defaultValue: DEFAULT_SLIDES,
    },

    /* -------------------------------------------------------------- */
    /* Layout                                                         */
    /* -------------------------------------------------------------- */

    height: {
        type: ControlType.Number,
        title: "Height",
        min: 320,
        max: 1200,
        step: 10,
        unit: "px",
    },

    /* -------------------------------------------------------------- */
    /* Navigation                                                     */
    /* -------------------------------------------------------------- */

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
        title: "Nav Cursor",
        defaultValue: true,
    },

    /* -------------------------------------------------------------- */
    /* Strip animation                                                */
    /* -------------------------------------------------------------- */

    stripCount: {
        type: ControlType.Number,
        title: "Strip Count",
        min: 3,
        max: 20,
        step: 1,
        defaultValue: STRIP_COUNT,
    },

    revealDuration: {
        type: ControlType.Number,
        title: "Reveal Duration",
        min: 0.2,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: REVEAL_DURATION,
    },

    stripStagger: {
        type: ControlType.Number,
        title: "Strip Stagger",
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: "s",
        defaultValue: STRIP_STAGGER,
    },

    /* -------------------------------------------------------------- */
    /* Zoom                                                           */
    /* -------------------------------------------------------------- */

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
        min: 0.2,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: ZOOM_DURATION,
    },

    /* -------------------------------------------------------------- */
    /* Typography                                                     */
    /* -------------------------------------------------------------- */

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",

        defaultValue: {
            fontSize: 96,
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            variant: "Regular",
        },

        defaultFontType: "serif",

        defaultFontSize: "96px",

        displayTextAlignment: true,

        displayFontSize: true,

        controls: "extended",
    },

    chapterFont: {
        type: ControlType.Font,
        title: "Chapter Font",

        defaultValue: {
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: "0.025em",
            variant: "Medium",
        },

        defaultFontType: "sans-serif",

        defaultFontSize: "12px",

        displayTextAlignment: true,

        displayFontSize: true,

        controls: "extended",
    },

    counterFont: {
        type: ControlType.Font,
        title: "Counter Font",

        defaultValue: {
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: "0em",
            variant: "Regular",
        },

        defaultFontType: "sans-serif",

        defaultFontSize: "12px",

        displayTextAlignment: true,

        displayFontSize: true,

        controls: "extended",
    },

    /* -------------------------------------------------------------- */
    /* Colors                                                         */
    /* -------------------------------------------------------------- */

    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#ffffff",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
})
