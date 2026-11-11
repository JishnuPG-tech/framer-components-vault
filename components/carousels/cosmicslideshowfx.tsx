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

import { gsap } from "gsap"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ResponsiveImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface Slide {
    image?: ResponsiveImageValue | string
    title: string
}

function getImageSrc(img: any): string {
    if (!img) return ""
    if (typeof img === "string") return img
    return img.src ?? ""
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_SLIDES: Slide[] = [
    {
        image: "https://i.ibb.co.com/spSd6BRM/Snowboarder-Mid-Jump.png",
        title: "Mid Jump",
    },
    {
        image: "https://i.ibb.co.com/JwJddFmp/Mid-Air-Majesty-Snowboarders-Flight-Against-the-Blue.png",
        title: "Mid Air Majesty",
    },
    {
        image: "https://i.ibb.co.com/dsn1PT9C/Golden-Hour-Snowboarders-in-Sync.png",
        title: "Golden Hour",
    },
    {
        image: "https://i.ibb.co.com/TqtFhjDq/Dynamic-Ski-Descent.png",
        title: "Dynamic Descent",
    },
    {
        image: "https://i.ibb.co.com/gbVGY68F/Dynamic-Snowboarder-Carving-Powder.png",
        title: "Carving Powder",
    },
    {
        image: "https://i.ibb.co.com/hxMCxZxV/Snowboarding-Adventure.png",
        title: "Adventure",
    },
]

const TOTAL_LINES = 60

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function CosmicSlideshow(props: any) {
    const {
        slides = DEFAULT_SLIDES,
        titleFont,
        textColor = "#ffffff",
        backgroundColor = "#000000",
        autoPlay = false,
        autoPlayInterval = 3,
        style,
    } = props

    // ── FIX: memoize derived arrays so the main effect doesn't re-run on every render
    const images: string[] = React.useMemo(
        () =>
            (slides as Slide[]).map(
                (s, i) =>
                    getImageSrc(s?.image) ||
                    (DEFAULT_SLIDES[i]?.image as string) ||
                    ""
            ),
        [slides]
    )
    const slideTitles: string[] = React.useMemo(
        () => (slides as Slide[]).map((s) => s?.title ?? ""),
        [slides]
    )

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // ─── DOM Refs ─────────────────────────────────────────────────────────────
    const containerRef = React.useRef<HTMLDivElement>(null)
    const slideRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const slideInnerRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const lineRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const thumbRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const counterRef = React.useRef<HTMLSpanElement>(null)
    const titleContainerRef = React.useRef<HTMLDivElement>(null)
    const prevNavRef = React.useRef<HTMLDivElement>(null)
    const nextNavRef = React.useRef<HTMLDivElement>(null)
    const thumbsAreaRef = React.useRef<HTMLDivElement>(null)

    // ─── Prop refs — keep closures fresh without re-running main effect ────────
    const textColorRef = React.useRef(textColor)
    const slideTitlesRef = React.useRef(slideTitles)
    const titleFontRef = React.useRef<React.CSSProperties>(titleFont ?? {})
    const autoPlayRef = React.useRef(autoPlay)
    const autoPlayIntervalRef = React.useRef(autoPlayInterval)

    React.useEffect(() => {
        textColorRef.current = textColor
    }, [textColor])
    React.useEffect(() => {
        slideTitlesRef.current = slideTitles
    }, [slideTitles])
    React.useEffect(() => {
        titleFontRef.current = titleFont ?? {}
    }, [titleFont])
    React.useEffect(() => {
        autoPlayRef.current = autoPlay
    }, [autoPlay])
    React.useEffect(() => {
        autoPlayIntervalRef.current = autoPlayInterval
    }, [autoPlayInterval])

    // ─── Main setup effect ────────────────────────────────────────────────────
    React.useEffect(() => {
        if (isCanvas) return
        const container = containerRef.current
        if (!container) return

        const slideCount = images.length
        if (!slideCount) return

        // ── Mutable state local to this effect run ────────────────────────────
        let currentIdx = 0
        let isAnimating = false
        let pending: {
            type: string
            index?: number
            direction?: number
        } | null = null
        let hoveredThumb: number | null = null
        let mouseOverThumbs = false
        let lastHoveredThumb: number | null = null

        // ── Auto-play state ───────────────────────────────────────────────────
        let autoPlayTimer: ReturnType<typeof setTimeout> | null = null
        let autoPlayPaused = false

        function clearAutoPlayTimer() {
            if (autoPlayTimer !== null) {
                clearTimeout(autoPlayTimer)
                autoPlayTimer = null
            }
        }

        function scheduleNext() {
            clearAutoPlayTimer()
            if (!autoPlayRef.current || autoPlayPaused) return
            autoPlayTimer = setTimeout(() => {
                autoPlayTimer = null
                // Skip (don't queue) if animating — just wait for the next tick
                if (!isAnimating) navigate(1)
                scheduleNext()
            }, autoPlayIntervalRef.current * 1000)
        }

        function resetAutoPlayTimer() {
            clearAutoPlayTimer()
            scheduleNext()
        }

        function pauseAutoPlay() {
            autoPlayPaused = true
            clearAutoPlayTimer()
        }

        function resumeAutoPlay() {
            autoPlayPaused = false
            scheduleNext()
        }

        // ── Init slides via GSAP ──────────────────────────────────────────────
        slideRefs.current.forEach((s, i) => {
            if (s)
                gsap.set(s, {
                    autoAlpha: i === 0 ? 1 : 0,
                    scale: 1,
                    yPercent: 0,
                    zIndex: i === 0 ? 1 : 0,
                })
        })

        // ── Init counter ──────────────────────────────────────────────────────
        if (counterRef.current) counterRef.current.textContent = "01"

        // ── Init title (purely imperative — avoids React reconciliation conflict)
        const titleContainer = titleContainerRef.current
        let currentTitleEl: HTMLDivElement | null = null
        if (titleContainer) {
            while (titleContainer.firstChild)
                titleContainer.removeChild(titleContainer.firstChild)
            currentTitleEl = document.createElement("div")
            applyTitleStyles(currentTitleEl, { opacity: "0.8" })
            currentTitleEl.textContent = slideTitlesRef.current[0] ?? ""
            titleContainer.appendChild(currentTitleEl)
        }

        // ── Init thumbnails ───────────────────────────────────────────────────
        thumbRefs.current.forEach((t, i) => {
            if (t) t.style.opacity = i === 0 ? "1" : "0.5"
        })

        // ── Init drag lines ───────────────────────────────────────────────────
        updateDragLines(0, true)

        // ── Start auto-play ───────────────────────────────────────────────────
        scheduleNext()

        // ── Helpers ───────────────────────────────────────────────────────────

        function applyTitleStyles(
            el: HTMLDivElement,
            extra: Partial<Record<string, string>> = {}
        ) {
            const font = titleFontRef.current ?? {}
            Object.assign(el.style, {
                position: "absolute",
                width: "100%",
                left: "0",
                textAlign: "center",
                transition: "transform 0.5s ease, opacity 0.5s ease",
                fontSize: "14px",
                opacity: "0.8",
                ...font,
                color: textColorRef.current,
                ...extra,
            })
        }

        function updateDragLines(activeIndex: number | null, force = false) {
            const lines = lineRefs.current.filter(Boolean) as HTMLDivElement[]
            if (!lines.length) return

            lines.forEach((l) => {
                l.style.height = "15px"
                l.style.backgroundColor = "rgba(255,255,255,0.3)"
            })
            if (activeIndex === null) return

            const uiWidth = 720
            const tW = uiWidth / slideCount
            const center = (activeIndex + 0.5) * tW
            const lineW = uiWidth / lines.length

            for (let i = 0; i < lines.length; i++) {
                const lc = (i + 0.5) * lineW
                const dist = Math.abs(lc - center)
                const maxDist = tW * 0.7
                if (dist <= maxDist) {
                    const nd = dist / maxDist
                    const wave = Math.cos((nd * Math.PI) / 2)
                    const h = 15 + wave * 35
                    const op = 0.3 + wave * 0.4
                    const delay = nd * 100
                    const ci = i
                    if (force) {
                        lines[ci].style.height = `${h}px`
                        lines[ci].style.backgroundColor =
                            `rgba(255,255,255,${op})`
                    } else {
                        setTimeout(() => {
                            if (
                                hoveredThumb === activeIndex ||
                                (mouseOverThumbs &&
                                    lastHoveredThumb === activeIndex)
                            ) {
                                lines[ci].style.height = `${h}px`
                                lines[ci].style.backgroundColor =
                                    `rgba(255,255,255,${op})`
                            }
                        }, delay)
                    }
                }
            }
        }

        function updateSlideTitle(index: number) {
            if (!titleContainer || !currentTitleEl) return
            const newTitle = document.createElement("div")
            applyTitleStyles(newTitle, {
                opacity: "0",
                transform: "translateY(30px)",
            })
            newTitle.textContent = slideTitlesRef.current[index] ?? ""
            titleContainer.appendChild(newTitle)

            const oldTitle = currentTitleEl
            oldTitle.style.transform = "translateY(-30px)"
            oldTitle.style.opacity = "0"
            void newTitle.offsetWidth // force reflow

            setTimeout(() => {
                newTitle.style.opacity = "0.8"
                newTitle.style.transform = "translateY(0px)"
            }, 10)
            setTimeout(() => {
                oldTitle.remove()
                currentTitleEl = newTitle
            }, 500)
        }

        function updateNavUI(disabled: boolean) {
            ;[prevNavRef.current, nextNavRef.current].forEach((el) => {
                if (!el) return
                el.style.opacity = disabled ? "0.3" : ""
                el.style.pointerEvents = disabled ? "none" : ""
            })
            thumbRefs.current.forEach((t) => {
                if (t) t.style.pointerEvents = disabled ? "none" : ""
            })
        }

        function performAnimation(
            toIdx: number,
            fromIdx: number,
            direction: number
        ) {
            const cs = slideRefs.current[fromIdx]
            const ci = slideInnerRefs.current[fromIdx]
            const us = slideRefs.current[toIdx]
            const ui = slideInnerRefs.current[toIdx]

            if (!cs || !ci || !us || !ui) {
                isAnimating = false
                updateNavUI(false)
                return
            }

            if (counterRef.current)
                counterRef.current.textContent = String(toIdx + 1).padStart(
                    2,
                    "0"
                )
            updateSlideTitle(toIdx)
            updateDragLines(toIdx, true)
            thumbRefs.current.forEach((t, i) => {
                if (t) t.style.opacity = i === toIdx ? "1" : "0.5"
            })

            gsap.timeline({
                onStart: () => {
                    gsap.set(us, { zIndex: 99 })
                },
                onComplete: () => {
                    gsap.set(cs, { autoAlpha: 0 })
                    gsap.set(us, { zIndex: 1 })
                    currentIdx = toIdx
                    isAnimating = false
                    updateNavUI(false)

                    if (pending) {
                        const p = pending
                        pending = null
                        setTimeout(() => {
                            if (p.type === "goto" && p.index !== undefined)
                                goTo(p.index)
                            else if (
                                p.type === "navigate" &&
                                p.direction !== undefined
                            )
                                navigate(p.direction)
                        }, 50)
                    }

                    if (mouseOverThumbs && lastHoveredThumb !== null) {
                        hoveredThumb = lastHoveredThumb
                        updateDragLines(lastHoveredThumb, true)
                    }
                },
            })
                .addLabel("start", 0)
                .fromTo(
                    us,
                    {
                        autoAlpha: 1,
                        scale: 0.1,
                        yPercent: direction === 1 ? 100 : -100,
                    },
                    { duration: 0.7, ease: "expo", scale: 0.4, yPercent: 0 },
                    "start"
                )
                .fromTo(
                    ui,
                    {
                        filter: "contrast(100%) saturate(100%)",
                        transformOrigin: "100% 50%",
                        scaleY: 4,
                    },
                    { duration: 0.7, ease: "expo", scaleY: 1 },
                    "start"
                )
                .fromTo(
                    ci,
                    { filter: "contrast(100%) saturate(100%)" },
                    {
                        duration: 0.7,
                        ease: "expo",
                        filter: "contrast(120%) saturate(140%)",
                    },
                    "start"
                )
                .addLabel("middle", "start+=0.6")
                .to(
                    us,
                    { duration: 1, ease: "power4.inOut", scale: 1 },
                    "middle"
                )
                .to(
                    cs,
                    {
                        duration: 1,
                        ease: "power4.inOut",
                        scale: 0.98,
                        autoAlpha: 0,
                    },
                    "middle"
                )
        }

        function navigate(direction: number) {
            if (isAnimating) {
                pending = { type: "navigate", direction }
                return
            }
            isAnimating = true
            updateNavUI(true)
            const prev = currentIdx
            const next =
                direction === 1
                    ? prev < slideCount - 1
                        ? prev + 1
                        : 0
                    : prev > 0
                      ? prev - 1
                      : slideCount - 1
            performAnimation(next, prev, direction)
        }

        function goTo(index: number) {
            if (isAnimating) {
                pending = { type: "goto", index }
                return
            }
            if (index === currentIdx) return
            isAnimating = true
            updateNavUI(true)
            const prev = currentIdx
            performAnimation(index, prev, index > prev ? 1 : -1)
        }

        // ── Event listeners ───────────────────────────────────────────────────
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            if (isAnimating) return
            resetAutoPlayTimer()
            if (e.deltaY > 0) navigate(1)
            else navigate(-1)
        }

        // Touch
        let touchStartY = 0
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY
        }
        const handleTouchEnd = (e: TouchEvent) => {
            if (isAnimating) return
            const diff = e.changedTouches[0].clientY - touchStartY
            if (Math.abs(diff) > 50) {
                resetAutoPlayTimer()
                if (diff > 0) navigate(-1)
                else navigate(1)
            }
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isAnimating) return
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                resetAutoPlayTimer()
                navigate(1)
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                resetAutoPlayTimer()
                navigate(-1)
            }
        }

        // Pause auto-play on hover over the whole slideshow
        const handleContainerEnter = () => pauseAutoPlay()
        const handleContainerLeave = () => resumeAutoPlay()

        container.addEventListener("wheel", handleWheel, { passive: false })
        container.addEventListener("touchstart", handleTouchStart)
        container.addEventListener("touchend", handleTouchEnd)
        container.addEventListener("mouseenter", handleContainerEnter)
        container.addEventListener("mouseleave", handleContainerLeave)
        document.addEventListener("keydown", handleKeyDown)

        // Capture refs at registration time for correct cleanup
        const prevNav = prevNavRef.current
        const nextNav = nextNavRef.current
        const handlePrev = () => {
            resetAutoPlayTimer()
            navigate(-1)
        }
        const handleNext = () => {
            resetAutoPlayTimer()
            navigate(1)
        }
        prevNav?.addEventListener("click", handlePrev)
        nextNav?.addEventListener("click", handleNext)

        // Thumbnails
        const thumbCleanups: (() => void)[] = []
        thumbRefs.current.forEach((thumb, idx) => {
            if (!thumb) return
            const click = () => {
                lastHoveredThumb = idx
                resetAutoPlayTimer()
                goTo(idx)
            }
            const enter = () => {
                hoveredThumb = idx
                lastHoveredThumb = idx
                mouseOverThumbs = true
                if (!isAnimating) updateDragLines(idx, true)
            }
            const leave = () => {
                if (hoveredThumb === idx) hoveredThumb = null
            }
            thumb.addEventListener("click", click)
            thumb.addEventListener("mouseenter", enter)
            thumb.addEventListener("mouseleave", leave)
            thumbCleanups.push(() => {
                thumb.removeEventListener("click", click)
                thumb.removeEventListener("mouseenter", enter)
                thumb.removeEventListener("mouseleave", leave)
            })
        })

        // Thumbs area — reset lines on mouse leave
        const thumbsArea = thumbsAreaRef.current
        const handleThumbsEnter = () => {
            mouseOverThumbs = true
        }
        const handleThumbsLeave = () => {
            mouseOverThumbs = false
            hoveredThumb = null
            updateDragLines(null)
        }
        thumbsArea?.addEventListener("mouseenter", handleThumbsEnter)
        thumbsArea?.addEventListener("mouseleave", handleThumbsLeave)

        // ── Cleanup ───────────────────────────────────────────────────────────
        return () => {
            clearAutoPlayTimer()
            container.removeEventListener("wheel", handleWheel)
            container.removeEventListener("touchstart", handleTouchStart)
            container.removeEventListener("touchend", handleTouchEnd)
            container.removeEventListener("mouseenter", handleContainerEnter)
            container.removeEventListener("mouseleave", handleContainerLeave)
            document.removeEventListener("keydown", handleKeyDown)
            prevNav?.removeEventListener("click", handlePrev)
            nextNav?.removeEventListener("click", handleNext)
            thumbCleanups.forEach((fn) => fn())
            thumbsArea?.removeEventListener("mouseenter", handleThumbsEnter)
            thumbsArea?.removeEventListener("mouseleave", handleThumbsLeave)
            gsap.killTweensOf(
                [...slideRefs.current, ...slideInnerRefs.current].filter(
                    Boolean
                )
            )
        }
    }, [images, isCanvas]) // re-runs only when slides change

    // ─── Canvas placeholder ───────────────────────────────────────────────────
    if (isCanvas) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                {(getImageSrc(slides[0]?.image) ||
                    DEFAULT_SLIDES[0]?.image) && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${getImageSrc(slides[0]?.image) || DEFAULT_SLIDES[0]?.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 0.4,
                        }}
                    />
                )}
                <div
                    style={{
                        position: "relative",
                        color: textColor,
                        fontSize: "1rem",
                        opacity: 0.7,
                        textAlign: "center",
                    }}
                >
                    View preview to watch animation
                </div>
            </div>
        )
    }

    // Each thumb width fills the 720px UI bar evenly
    const computedThumbWidth = Math.floor(720 / Math.max(1, images.length))

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                backgroundColor,
            }}
        >
            {/* Slides — stacked via CSS grid */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateRows: "100%",
                    gridTemplateColumns: "100%",
                    placeItems: "center",
                }}
            >
                {images.map((src: string, i: number) => (
                    <div
                        key={i}
                        ref={(el) => {
                            slideRefs.current[i] = el
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            gridArea: "1 / 1 / -1 / -1",
                            overflow: "hidden",
                            position: "relative",
                            display: "grid",
                            placeItems: "center",
                            willChange: "transform, opacity",
                        }}
                    >
                        <div
                            ref={(el) => {
                                slideInnerRefs.current[i] = el
                            }}
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundImage: `url(${src})`,
                                backgroundSize: "cover",
                                backgroundPosition: "left center",
                                backgroundRepeat: "no-repeat",
                                willChange: "transform, opacity, filter",
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Bottom UI container */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 720,
                    maxWidth: "100%",
                    zIndex: 100,
                    paddingBottom: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                {/* Slide counter */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        justifyContent: "space-between",
                        color: textColor,
                        fontSize: "0.825rem",
                        marginBottom: "24px",
                    }}
                >
                    <div
                        ref={prevNavRef}
                        style={{
                            width: "20px",
                            cursor: "pointer",
                            opacity: 0.7,
                            userSelect: "none",
                        }}
                        onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLDivElement).style.opacity =
                                "1"
                        }}
                        onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLDivElement).style.opacity =
                                "0.7"
                        }}
                    >
                        ⟪
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        <span ref={counterRef}>01</span>
                        <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                            //
                        </span>
                        <span>{String(images.length).padStart(2, "0")}</span>
                    </div>

                    <div
                        ref={nextNavRef}
                        style={{
                            width: "20px",
                            cursor: "pointer",
                            opacity: 0.7,
                            userSelect: "none",
                        }}
                        onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLDivElement).style.opacity =
                                "1"
                        }}
                        onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLDivElement).style.opacity =
                                "0.7"
                        }}
                    >
                        ⟫
                    </div>
                </div>

                {/* Slide title — managed imperatively to avoid React conflicts */}
                <div
                    ref={titleContainerRef}
                    style={{
                        width: "100%",
                        textAlign: "center",
                        height: "30px",
                        overflow: "hidden",
                        marginBottom: "16px",
                        position: "relative",
                    }}
                />

                {/* Drag indicator — 60 animated vertical lines */}
                <div
                    style={{
                        width: "100%",
                        height: "50px",
                        pointerEvents: "none",
                        marginBottom: "8px",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            height: "100%",
                            width: "100%",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                        }}
                    >
                        {Array.from({ length: TOTAL_LINES }).map((_, i) => (
                            <div
                                key={i}
                                ref={(el) => {
                                    lineRefs.current[i] = el
                                }}
                                style={{
                                    width: "2px",
                                    backgroundColor: "rgba(255,255,255,0.3)",
                                    height: "15px",
                                    transformOrigin: "bottom center",
                                    transition:
                                        "height 0.6s cubic-bezier(0.25,0.1,0.25,1), background-color 0.6s cubic-bezier(0.25,0.1,0.25,1)",
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Thumbnails */}
                <div
                    ref={thumbsAreaRef}
                    style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.5)",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ display: "flex", zIndex: 11 }}>
                        {images.map((src: string, i: number) => (
                            <div
                                key={i}
                                ref={(el) => {
                                    thumbRefs.current[i] = el
                                }}
                                style={{
                                    width: computedThumbWidth,
                                    height: "80px",
                                    backgroundImage: `url(${src})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    cursor: "pointer",
                                    opacity: 0.5,
                                    transition: "opacity 0.3s",
                                    flexShrink: 0,
                                    userSelect: "none",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
CosmicSlideshow.defaultProps = {
    slides: DEFAULT_SLIDES,
    textColor: "#ffffff",
    backgroundColor: "#000000",
    autoPlay: false,
    autoPlayInterval: 3,
}

// ─── Property Controls ────────────────────────────────────────────────────────
addPropertyControls(CosmicSlideshow, {
    slides: {
        title: "Slides",
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    title: "Image",
                    type: ControlType.ResponsiveImage,
                },
                title: {
                    title: "Title",
                    type: ControlType.String,
                    defaultValue: "Slide Title",
                },
            },
        },
        defaultValue: DEFAULT_SLIDES,
        maxCount: 12,
    },
    autoPlay: {
        title: "Auto Play",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlayInterval: {
        title: "Interval (s)",
        type: ControlType.Number,
        defaultValue: 3,
        min: 1,
        max: 30,
        step: 0.5,
        unit: "s",
        displayStepper: true,
        hidden: (props) => !props.autoPlay,
    },
    titleFont: {
        title: "Title Font",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            lineHeight: "1.4",
            letterSpacing: "0em",
        },
    },
    textColor: {
        title: "Text Color",
        type: ControlType.Color,
        defaultValue: "#ffffff",
    },
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#000000",
    },
})
