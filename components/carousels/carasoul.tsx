/**
 * @framerSupportedLayoutWidth fixed, fill
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 480
 * @framerDisableUnlink
 *
 * Carousel Component for Framer
 * Fluid physics carousel with momentum flick, elastic rubber-banding, responsive morphing pill indicators, and autoplay rotation.
 *
 * Made by Wael (https://x.com/Waeldesignz)
 */
import * as React from "react"
import {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
    startTransition,
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

import {
    motion,
    useMotionValue,
    animate,
    useTransform,
    AnimatePresence,
    type MotionValue,
} from "framer-motion"

export type CarouselTheme = "dark" | "light" | "auto"

export interface CarouselSlideItem {
    image: string
    title: string
    price?: string
    description?: string
    link?: string
}

export interface CarouselProps {
    slides: CarouselSlideItem[]
    slideWidth: number
    slideGap: number
    radius: number
    defaultIndex: number
    scaleNeighbors: boolean
    dimNeighbors: boolean
    neighborScale: number
    neighborOpacity: number
    showArrows: boolean
    showIndicators: boolean
    showPlayPause: boolean
    autoplay: boolean
    interval: number
    pauseOnHover: boolean
    theme: CarouselTheme
    useCustomColors: boolean
    textColor: string
    mutedColor: string
    cardBg: string
    photoBorder: string
    controlBg: string
    controlBorder: string
    controlHover: string
    dotBg: string
    dotActive: string
    credits: string
    style?: React.CSSProperties
    className?: string
}

// ─── Default Carousel Slides ──────────────────────────────────────────────

const DEFAULT_SLIDES: CarouselSlideItem[] = [
    {
        image: "https://uiarc.dev/_next/static/media/lounge-chair.f8bd3d77.jpg",
        title: "Oak lounge chair",
        price: "$1,450",
        description: "Hand-braided Danish paper cord on a solid oak frame",
    },
    {
        image: "https://uiarc.dev/_next/static/media/table-lamp.1e6e9c82.jpg",
        title: "Opal table lamp",
        price: "$640",
        description: "Hand-blown glass shade, dimmable",
    },
    {
        image: "https://uiarc.dev/_next/static/media/linen-throw.8999da7d.jpg",
        title: "Stonewashed linen throw",
        price: "$180",
        description: "Oat, 130 × 180 cm",
    },
    {
        image: "https://uiarc.dev/_next/static/media/glass-carafe.8745e2b5.jpg",
        title: "Ribbed glass carafe",
        price: "$95",
        description: "Mouth-blown, holds 1 liter",
    },
    {
        image: "https://uiarc.dev/_next/static/media/sea-at-dusk.25cb721d.jpg",
        title: "Sea at dusk",
        price: "$320",
        description: "Archival pigment print, 50 × 70 cm",
    },
]

// ─── Scoped Vector Icons (1.75 Stroke) ────────────────────────────────────────

function IconChevronLeft() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <polyline points="15 18 9 12 15 6" />
        </svg>
    )
}

function IconChevronRight() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    )
}

function IconPlay() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: 2 }}
            aria-hidden="true"
        >
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    )
}

function IconPause() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
    )
}

// ─── Scoped CSS Tokens & Styles ───────────────────────────────────────────────

const CAROUSEL_CSS = `
.ui-arc-carousel {
  display: grid;
  width: 100%;
  max-width: 100%;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  box-sizing: border-box;
  overflow-x: clip;
  contain: inline-size;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.ui-arc-viewport {
  position: relative;
  width: 100%;
  min-width: 0;
  overflow-x: clip;
  overflow-y: visible;
  cursor: grab;
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
}
.ui-arc-viewport[data-dragging="true"] {
  cursor: grabbing;
}

.ui-arc-track {
  display: flex;
  gap: var(--carousel-gap, 16px);
  padding-inline: calc((100% - var(--carousel-slide, 340px)) / 2);
  user-select: none;
  -webkit-user-select: none;
  width: max-content;
  box-sizing: border-box;
}

.ui-arc-slide {
  flex: 0 0 var(--carousel-slide, 340px);
  width: var(--carousel-slide, 340px);
  min-width: 0;
  transform-origin: 50% 50%;
  will-change: transform, opacity;
  box-sizing: border-box;
}

.ui-arc-card {
  display: grid;
  gap: 12px;
  margin: 0;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  color: inherit;
}

.ui-arc-photo {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: var(--carousel-radius, 24px);
  background: var(--carousel-card-bg, #27272a);
}
.ui-arc-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}
.ui-arc-photo::after {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid var(--carousel-photo-border, rgba(255, 255, 255, 0.08));
  content: "";
  pointer-events: none;
}

.ui-arc-caption {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 12px;
  row-gap: 2px;
  align-items: baseline;
  padding-inline: 4px;
}

.ui-arc-name {
  grid-row: 1;
  grid-column: 1;
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--carousel-fg, #ffffff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.015em;
  line-height: 1.35;
}

.ui-arc-price {
  grid-row: 1;
  grid-column: 2;
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--carousel-fg, #ffffff);
  white-space: nowrap;
  letter-spacing: -0.015em;
  line-height: 1.35;
}

.ui-arc-detail {
  grid-row: 2;
  grid-column: 1 / -1;
  margin: 0;
  font-size: 13px;
  color: var(--carousel-muted, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

/* Controls row: perfectly aligned with the centered slide */
.ui-arc-controls {
  display: flex;
  align-items: center;
  width: min(100%, var(--carousel-slide, 340px));
  margin: 16px auto 0 auto;
  box-sizing: border-box;
  padding-inline: 4px;
  gap: 8px;
}

.ui-arc-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0 auto;
}

.ui-arc-tab {
  display: grid;
  place-items: center;
  height: 32px;
  padding: 0 5px;
  border: 0;
  background: transparent;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.ui-arc-dot {
  position: relative;
  display: block;
  height: 6px;
  border-radius: 9999px;
  background: var(--carousel-dot-bg, rgba(255, 255, 255, 0.25));
  overflow: hidden;
  transition: background-color 150ms ease;
}

.ui-arc-dot-fill {
  position: absolute;
  inset: 0;
  background: var(--carousel-dot-fg, #ffffff);
  border-radius: 9999px;
}

.ui-arc-arrows {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.ui-arc-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 1px solid var(--carousel-ctrl-border, rgba(255, 255, 255, 0.12));
  background: var(--carousel-ctrl-bg, rgba(255, 255, 255, 0.08));
  color: var(--carousel-fg, #ffffff);
  cursor: pointer;
  padding: 0;
  outline: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    opacity 150ms ease,
    transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ui-arc-btn:hover:not(:disabled) {
  background: var(--carousel-ctrl-hover, rgba(255, 255, 255, 0.15));
}
.ui-arc-btn:active:not(:disabled) {
  transform: scale(0.96);
}
.ui-arc-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
`

// ─── Main Carousel Component ──────────────────────────────────────────────────

export default function Carousel(props: CarouselProps) {
    const {
        slides = DEFAULT_SLIDES,
        slideWidth = 340,
        slideGap = 16,
        radius = 24,
        defaultIndex = 2,
        scaleNeighbors = true,
        dimNeighbors = true,
        neighborScale = 0.9,
        neighborOpacity = 0.5,
        showArrows = true,
        showIndicators = true,
        showPlayPause = true,
        autoplay = false,
        interval = 4,
        pauseOnHover = true,
        theme = "dark",
        useCustomColors = false,
        textColor = "#ffffff",
        mutedColor = "#9ca3af",
        cardBg = "#27272a",
        photoBorder = "rgba(255, 255, 255, 0.08)",
        controlBg = "rgba(255, 255, 255, 0.08)",
        controlBorder = "rgba(255, 255, 255, 0.12)",
        controlHover = "rgba(255, 255, 255, 0.15)",
        dotBg = "rgba(255, 255, 255, 0.25)",
        dotActive = "#ffffff",
        style,
        className,
    } = props

    const count = slides.length
    const last = Math.max(0, count - 1)
    const initialIndex = Math.min(last, Math.max(0, defaultIndex))

    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [isPlaying, setIsPlaying] = useState(autoplay)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [containerWidth, setContainerWidth] = useState(0)
    const currentIndexRef = useRef(initialIndex)

    const rootRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const styleInjected = useRef(false)

    // Store step distance without causing React re-renders or resize loops
    const metrics = useRef({ step: slideWidth + slideGap, width: 720 })

    const sidePeek = 24
    const minSlideWidth = 120
    const getClampedSlideWidth = useCallback(
        (width: number) => {
            if (width <= 0) return slideWidth
            const maxSlideWidth = Math.max(minSlideWidth, width - sidePeek * 2)
            return Math.min(slideWidth, maxSlideWidth)
        },
        [slideWidth]
    )
    const clampedSlideWidth = useMemo(
        () => getClampedSlideWidth(containerWidth),
        [containerWidth, getClampedSlideWidth]
    )

    const x = useMotionValue(-initialIndex * (slideWidth + slideGap))
    const progress = useMotionValue(initialIndex)

    // Inject CSS once
    if (typeof document !== "undefined" && !styleInjected.current) {
        const id = "ui-arc-carousel-styles"
        if (!document.getElementById(id)) {
            const styleTag = document.createElement("style")
            styleTag.id = id
            styleTag.textContent = CAROUSEL_CSS
            document.head.appendChild(styleTag)
        }
        styleInjected.current = true
    }

    // Measure track step dynamically using DOM bounding box
    const measure = useCallback(() => {
        const viewport = viewportRef.current
        if (!viewport) return

        const nextWidth = viewport.clientWidth
        const nextSlideWidth = getClampedSlideWidth(nextWidth)
        metrics.current = {
            step: nextSlideWidth + slideGap,
            width: nextWidth,
        }

        startTransition(() => {
            setContainerWidth((prev) =>
                Math.abs(prev - nextWidth) > 0.5 ? nextWidth : prev
            )
        })
    }, [getClampedSlideWidth, slideGap])

    useEffect(() => {
        measure()
        const viewport = viewportRef.current
        if (!viewport || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => measure())
        ro.observe(viewport)
        return () => ro.disconnect()
    }, [measure])

    useEffect(() => {
        currentIndexRef.current = currentIndex
    }, [currentIndex])

    useEffect(() => {
        if (containerWidth <= 0) return
        const step = clampedSlideWidth + slideGap
        metrics.current = { step, width: containerWidth }
        x.set(-currentIndexRef.current * step)
        progress.set(currentIndexRef.current)
    }, [containerWidth, clampedSlideWidth, progress, slideGap, x])

    // Move to specific slide with natural spring motion
    const select = useCallback(
        (target: number, velocity = 0) => {
            const next = Math.max(0, Math.min(target, last))
            startTransition(() => {
                setCurrentIndex(next)
            })
            const step = metrics.current.step || slideWidth + slideGap
            animate(x, -next * step, {
                type: "spring",
                stiffness: 350,
                damping: 34,
                mass: 0.9,
                velocity,
            })
        },
        [last, slideWidth, slideGap, x]
    )

    // Sync continuous index progress with x position
    useEffect(() => {
        const unsubscribe = x.on("change", (latest) => {
            const step = metrics.current.step || slideWidth + slideGap
            if (step > 0) {
                progress.set(-latest / step)
            }
        })
        return () => unsubscribe()
    }, [x, slideWidth, slideGap, progress])

    // Autoplay Timer
    useEffect(() => {
        if (
            !autoplay ||
            !isPlaying ||
            isDragging ||
            (pauseOnHover && isHovered) ||
            count <= 1
        ) {
            return
        }

        const timer = setInterval(
            () => {
                select(currentIndex >= last ? 0 : currentIndex + 1)
            },
            Math.max(1500, interval * 1000)
        )

        return () => clearInterval(timer)
    }, [
        autoplay,
        isPlaying,
        isDragging,
        pauseOnHover,
        isHovered,
        count,
        interval,
        currentIndex,
        last,
        select,
    ])

    // Pointer Drag & Flick gesture tracking
    const drag = useRef<{
        pointer: number
        startX: number
        startY: number
        origin: number
        from: number
        locked: "x" | "y" | null
        samples: [number, number][]
    } | null>(null)

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (count < 2 || (e.pointerType === "mouse" && e.button !== 0)) return
        drag.current = {
            pointer: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            origin: x.get(),
            from: currentIndex,
            locked: null,
            samples: [[e.timeStamp, e.clientX]],
        }
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const cur = drag.current
        if (!cur || cur.pointer !== e.pointerId) return

        if (!cur.locked) {
            const dx = e.clientX - cur.startX
            const dy = e.clientY - cur.startY
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
            if (Math.abs(dy) > Math.abs(dx)) {
                cur.locked = "y"
                return
            }
            cur.locked = "x"
            cur.startX = e.clientX
            cur.origin = x.get()
            startTransition(() => {
                setIsDragging(true)
            })
            e.currentTarget.setPointerCapture(e.pointerId)
        }

        if (cur.locked !== "x") return

        const raw = cur.origin + (e.clientX - cur.startX)
        const step = metrics.current.step || slideWidth + slideGap
        const minBound = -last * step
        const maxBound = 0

        // Elastic rubber-banding at boundaries
        let banded = raw
        if (raw > maxBound) {
            const overshoot = raw - maxBound
            banded =
                maxBound + (overshoot * 300 * 0.55) / (300 + 0.55 * overshoot)
        } else if (raw < minBound) {
            const overshoot = minBound - raw
            banded =
                minBound - (overshoot * 300 * 0.55) / (300 + 0.55 * overshoot)
        }

        x.set(banded)
        cur.samples.push([e.timeStamp, e.clientX])
        if (cur.samples.length > 16) cur.samples.shift()
    }

    const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const cur = drag.current
        if (!cur || cur.pointer !== e.pointerId) return
        drag.current = null

        if (cur.locked === "x") {
            startTransition(() => {
                setIsDragging(false)
            })
            const step = metrics.current.step || slideWidth + slideGap
            const now = e.timeStamp
            const recent = cur.samples.filter(([t]) => now - t <= 90)
            let velocity = 0
            if (
                recent.length >= 2 &&
                now - recent[recent.length - 1][0] <= 50
            ) {
                const [t0, x0] = recent[0]
                const [t1, x1] = recent[recent.length - 1]
                if (t1 > t0) {
                    velocity = (x1 - x0) / ((t1 - t0) / 1000)
                }
            }

            // Momentum projection
            const projected = ((velocity / 1000) * 0.995) / (1 - 0.995)
            let target = Math.round(-(x.get() + projected) / step)

            if (Math.abs(velocity) > 360) {
                const dir = velocity < 0 ? 1 : -1
                if ((target - cur.from) * dir < 1) {
                    target = cur.from + dir
                }
            }
            select(target, velocity)
        }
    }

    // Determine Theme tokens
    const isDark = theme === "dark" || theme === "auto"

    const themeVariables: React.CSSProperties = useCustomColors
        ? ({
              "--carousel-fg": textColor,
              "--carousel-muted": mutedColor,
              "--carousel-card-bg": cardBg,
              "--carousel-photo-border": photoBorder,
              "--carousel-ctrl-bg": controlBg,
              "--carousel-ctrl-border": controlBorder,
              "--carousel-ctrl-hover": controlHover,
              "--carousel-dot-bg": dotBg,
              "--carousel-dot-fg": dotActive,
              "--carousel-slide": `${clampedSlideWidth}px`,
              "--carousel-gap": `${slideGap}px`,
              "--carousel-radius": `${radius}px`,
          } as React.CSSProperties)
        : isDark
          ? ({
                "--carousel-fg": "#ffffff",
                "--carousel-muted": "#9ca3af",
                "--carousel-card-bg": "#27272a",
                "--carousel-photo-border": "rgba(255, 255, 255, 0.08)",
                "--carousel-ctrl-bg": "rgba(255, 255, 255, 0.08)",
                "--carousel-ctrl-border": "rgba(255, 255, 255, 0.12)",
                "--carousel-ctrl-hover": "rgba(255, 255, 255, 0.15)",
                "--carousel-dot-bg": "rgba(255, 255, 255, 0.25)",
                "--carousel-dot-fg": "#ffffff",
                "--carousel-slide": `${clampedSlideWidth}px`,
                "--carousel-gap": `${slideGap}px`,
                "--carousel-radius": `${radius}px`,
            } as React.CSSProperties)
          : ({
                "--carousel-fg": "#18181b",
                "--carousel-muted": "#71717a",
                "--carousel-card-bg": "#f4f4f5",
                "--carousel-photo-border": "rgba(0, 0, 0, 0.06)",
                "--carousel-ctrl-bg": "#ffffff",
                "--carousel-ctrl-border": "#e4e4e7",
                "--carousel-ctrl-hover": "#f4f4f5",
                "--carousel-dot-bg": "#d4d4d8",
                "--carousel-dot-fg": "#18181b",
                "--carousel-slide": `${clampedSlideWidth}px`,
                "--carousel-gap": `${slideGap}px`,
                "--carousel-radius": `${radius}px`,
            } as React.CSSProperties)

    return (
        <section
            ref={rootRef}
            className={`ui-arc-carousel ${className || ""}`}
            style={{
                ...themeVariables,
                ...style,
            }}
            onMouseEnter={() =>
                startTransition(() => {
                    setIsHovered(true)
                })
            }
            onMouseLeave={() =>
                startTransition(() => {
                    setIsHovered(false)
                })
            }
        >
            {/* Viewport and Track */}
            <div
                ref={viewportRef}
                className="ui-arc-viewport"
                data-dragging={isDragging}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
            >
                <motion.div
                    ref={trackRef}
                    className="ui-arc-track"
                    style={{ x }}
                >
                    {slides.map((slide, i) => (
                        <Slide
                            key={i}
                            index={i}
                            slide={slide}
                            progress={progress}
                            scaleNeighbors={scaleNeighbors}
                            dimNeighbors={dimNeighbors}
                            neighborScale={neighborScale}
                            neighborOpacity={neighborOpacity}
                            onSelect={() => select(i)}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Controls Bar: Aligned with the center slide */}
            {count > 1 && (
                <div className="ui-arc-controls">
                    {/* Play/Pause Button */}
                    {autoplay && showPlayPause && (
                        <button
                            type="button"
                            className="ui-arc-btn"
                            onClick={() =>
                                startTransition(() => {
                                    setIsPlaying(!isPlaying)
                                })
                            }
                            aria-label={
                                isPlaying ? "Pause rotation" : "Start rotation"
                            }
                        >
                            {isPlaying ? <IconPause /> : <IconPlay />}
                        </button>
                    )}

                    {/* Fluid Pill Indicators */}
                    {showIndicators && (
                        <div
                            className="ui-arc-tabs"
                            role="tablist"
                            aria-label="Slides"
                        >
                            {slides.map((_, i) => (
                                <Dot
                                    key={i}
                                    index={i}
                                    count={count}
                                    progress={progress}
                                    onSelect={() => select(i)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Previous / Next Arrow Buttons */}
                    {showArrows && (
                        <div className="ui-arc-arrows">
                            <button
                                type="button"
                                className="ui-arc-btn"
                                disabled={currentIndex === 0}
                                onClick={() => select(currentIndex - 1)}
                                aria-label="Previous slide"
                            >
                                <IconChevronLeft />
                            </button>
                            <button
                                type="button"
                                className="ui-arc-btn"
                                disabled={currentIndex === last}
                                onClick={() => select(currentIndex + 1)}
                                aria-label="Next slide"
                            >
                                <IconChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}

// ─── Individual Slide Component ───────────────────────────────────────────────

interface SlideProps {
    index: number
    slide: CarouselSlideItem
    progress: MotionValue<number>
    scaleNeighbors: boolean
    dimNeighbors: boolean
    neighborScale: number
    neighborOpacity: number
    onSelect: () => void
}

function Slide({
    index,
    slide,
    progress,
    scaleNeighbors,
    dimNeighbors,
    neighborScale,
    neighborOpacity,
    onSelect,
}: SlideProps) {
    const scale = useTransform(
        progress,
        [index - 1, index, index + 1],
        [
            scaleNeighbors ? neighborScale : 1,
            1,
            scaleNeighbors ? neighborScale : 1,
        ],
        { clamp: true }
    )

    const opacity = useTransform(
        progress,
        [index - 1, index, index + 1],
        [
            dimNeighbors ? neighborOpacity : 1,
            1,
            dimNeighbors ? neighborOpacity : 1,
        ],
        { clamp: true }
    )

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const handleClick = (e: React.MouseEvent) => {
        onSelect()
        if (slide.link && !isCanvas) {
            window.open(slide.link, "_blank", "noopener,noreferrer")
        }
    }

    return (
        <motion.div
            className="ui-arc-slide"
            style={{ scale, opacity }}
            role="tabpanel"
            aria-label={slide.title}
        >
            <article className="ui-arc-card" onClick={handleClick}>
                <div className="ui-arc-photo">
                    <img
                        src={slide.image}
                        alt={slide.title}
                        draggable={false}
                    />
                </div>
                <div className="ui-arc-caption">
                    <h3 className="ui-arc-name">{slide.title}</h3>
                    {slide.price && (
                        <span className="ui-arc-price">{slide.price}</span>
                    )}
                    {slide.description && (
                        <p className="ui-arc-detail">{slide.description}</p>
                    )}
                </div>
            </article>
        </motion.div>
    )
}

// ─── Fluid Dot / Pill Indicator Component ────────────────────────────────────

interface DotProps {
    index: number
    count: number
    progress: MotionValue<number>
    onSelect: () => void
}

function Dot({ index, count, progress, onSelect }: DotProps) {
    const last = count - 1
    const emphasis = useTransform(progress, (value) => {
        const clamped = Math.min(last, Math.max(0, value))
        return Math.max(0, 1 - Math.abs(clamped - index))
    })
    const width = useTransform(emphasis, (val) => 6 + (22 - 6) * val)

    return (
        <button
            type="button"
            className="ui-arc-tab"
            onClick={onSelect}
            aria-label={`Go to slide ${index + 1}`}
        >
            <motion.span
                className="ui-arc-dot"
                style={{ width }}
                aria-hidden="true"
            >
                <motion.span
                    className="ui-arc-dot-fill"
                    style={{ opacity: emphasis }}
                />
            </motion.span>
        </button>
    )
}

// ─── Default Props ────────────────────────────────────────────────────────────

Carousel.defaultProps = {
    slides: DEFAULT_SLIDES,
    slideWidth: 340,
    slideGap: 16,
    radius: 24,
    defaultIndex: 2,
    scaleNeighbors: true,
    dimNeighbors: true,
    neighborScale: 0.9,
    neighborOpacity: 0.5,
    showArrows: true,
    showIndicators: true,
    showPlayPause: true,
    autoplay: false,
    interval: 4,
    pauseOnHover: true,
    theme: "dark",
    useCustomColors: false,
    textColor: "#ffffff",
    mutedColor: "#9ca3af",
    cardBg: "#27272a",
    photoBorder: "rgba(255, 255, 255, 0.08)",
    controlBg: "rgba(255, 255, 255, 0.08)",
    controlBorder: "rgba(255, 255, 255, 0.12)",
    controlHover: "rgba(255, 255, 255, 0.15)",
    dotBg: "rgba(255, 255, 255, 0.25)",
    dotActive: "#ffffff",
    credits: "Made by Wael",
}

// ─── Framer Property Controls ─────────────────────────────────────────────────

addPropertyControls(Carousel, {
    // ── Slides Content ──
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Photo",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Item Name",
                },
                price: {
                    type: ControlType.String,
                    title: "Price",
                    defaultValue: "$180",
                },
                description: {
                    type: ControlType.String,
                    title: "Detail",
                    defaultValue: "Item description goes here.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: DEFAULT_SLIDES,
    },

    // ── Dimensions & Initial Slide ──
    slideWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 340,
        min: 200,
        max: 800,
        step: 10,
        unit: "px",
    },
    slideGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 4,
        max: 60,
        step: 2,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 48,
        step: 2,
        unit: "px",
    },
    defaultIndex: {
        type: ControlType.Number,
        title: "Start Index",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
    },

    // ── Depth & Neighbors ──
    scaleNeighbors: {
        type: ControlType.Boolean,
        title: "Scale Sides",
        defaultValue: true,
    },
    neighborScale: {
        type: ControlType.Number,
        title: "Side Scale",
        defaultValue: 0.9,
        min: 0.7,
        max: 1,
        step: 0.02,
        hidden: (props) => !props.scaleNeighbors,
    },
    dimNeighbors: {
        type: ControlType.Boolean,
        title: "Dim Sides",
        defaultValue: true,
    },
    neighborOpacity: {
        type: ControlType.Number,
        title: "Side Opacity",
        defaultValue: 0.5,
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.dimNeighbors,
    },

    // ── Navigation & Indicators ──
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    showIndicators: {
        type: ControlType.Boolean,
        title: "Indicators",
        defaultValue: true,
    },

    // ── Autoplay ──
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 4,
        min: 1,
        max: 12,
        step: 0.5,
        unit: "s",
        hidden: (props) => !props.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        hidden: (props) => !props.autoplay,
    },
    showPlayPause: {
        type: ControlType.Boolean,
        title: "Play Button",
        defaultValue: true,
        hidden: (props) => !props.autoplay,
    },

    // ── Theme ──
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light", "auto"],
        optionTitles: ["Dark", "Light", "Auto"],
        defaultValue: "dark",
        hidden: (props) => props.useCustomColors,
    },

    // ── Custom Colors ──
    useCustomColors: {
        type: ControlType.Boolean,
        title: "Custom Colors",
        defaultValue: false,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
        hidden: (props) => !props.useCustomColors,
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "#9ca3af",
        hidden: (props) => !props.useCustomColors,
    },
    cardBg: {
        type: ControlType.Color,
        title: "Photo Bg",
        defaultValue: "#27272a",
        hidden: (props) => !props.useCustomColors,
    },
    photoBorder: {
        type: ControlType.Color,
        title: "Photo Border",
        defaultValue: "rgba(255, 255, 255, 0.08)",
        hidden: (props) => !props.useCustomColors,
    },
    controlBg: {
        type: ControlType.Color,
        title: "Control Bg",
        defaultValue: "rgba(255, 255, 255, 0.08)",
        hidden: (props) => !props.useCustomColors,
    },
    controlBorder: {
        type: ControlType.Color,
        title: "Control Border",
        defaultValue: "rgba(255, 255, 255, 0.12)",
        hidden: (props) => !props.useCustomColors,
    },
    dotBg: {
        type: ControlType.Color,
        title: "Dot Bg",
        defaultValue: "rgba(255, 255, 255, 0.25)",
        hidden: (props) => !props.useCustomColors,
    },
    dotActive: {
        type: ControlType.Color,
        title: "Dot Active",
        defaultValue: "#ffffff",
        hidden: (props) => !props.useCustomColors,
    },

    // ── Credits & Author (Last Section) ──
    credits: {
        type: ControlType.String,
        title: "Credits",
        defaultValue: "Made by Wael",
        description: "Made by [Wael](https://x.com/Waeldesignz)",
    },
})
