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


// Instructions: should be add a link every image, and customize hover every emage by image, and not limit for drag and scrolls , should be loop scroll and dragging

type ResponsiveImageLike = { src: string; srcSet?: string; alt?: string }

interface GalleryItem {
    image: ResponsiveImageLike
    caption: string
    link: string
    hover: {
        zoom: number
        overlayColor: string
        overlayOpacity: number
        dim: number
    }
}

type Props = {
    list: GalleryItem[]
    columns: number
    tile: number
    gap: number
    radius: number
    objectFit: "cover" | "contain"
    enableDragScroll: boolean
    allowX: boolean
    allowY: boolean
    cursor: "grab" | "move" | "auto" | "none"
    showScrollbars: boolean
    maxRenderCells: number
    linkTarget: "same" | "new"
    fullscreen: {
        enabled: boolean
        clickMode: "link" | "fullscreen"
        backgroundColor: string
        backgroundOpacity: number
        showCaption: boolean
    }
    captionStyle: {
        backgroundColor: string
        textColor: string
        font: any
        paddingX: number
        paddingY: number
        radius: number
        inset: number
    }
    float: {
        enabled: boolean
        amount: number
        speed: number
    }
    preloadImages: boolean
    rotate: {
        enabled: boolean
        angle: number
        speed: number
    }
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollableImageGallery(props: Props) {
    const isStatic = useIsStaticRenderer()

    const {
        list,
        columns,
        tile,
        gap,
        radius,
        objectFit,
        enableDragScroll,
        allowX,
        allowY,
        cursor,
        showScrollbars,
        maxRenderCells,
        linkTarget,
        fullscreen,
        captionStyle,
        float,
        preloadImages,
        rotate,
    } = props

    const safeColumns = Math.max(1, Math.floor(columns || 1))
    const safeTile = Math.max(1, tile || 1)
    const safeGap = Math.max(0, gap || 0)
    const safeRadius = Math.max(0, radius || 0)

    const safeCaption = React.useMemo(() => {
        return {
            backgroundColor: captionStyle?.backgroundColor ?? "rgba(0,0,0,0.55)",
            textColor: captionStyle?.textColor ?? "#FFFFFF",
            font: captionStyle?.font ?? {},
            paddingX: Math.max(0, captionStyle?.paddingX ?? 10),
            paddingY: Math.max(0, captionStyle?.paddingY ?? 8),
            radius: Math.max(0, captionStyle?.radius ?? 10),
            inset: Math.max(0, captionStyle?.inset ?? 10),
        }
    }, [captionStyle])

    const normalizedList = React.useMemo<GalleryItem[]>(() => {
        const defaults: GalleryItem[] = [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                caption: "Green Gradient",
                link: "",
                hover: { zoom: 1.06, overlayColor: "#000000", overlayOpacity: 0, dim: 0 },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                caption: "Yellow Gradient",
                link: "",
                hover: { zoom: 1.06, overlayColor: "#000000", overlayOpacity: 0, dim: 0 },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                caption: "Orange Gradient",
                link: "",
                hover: { zoom: 1.06, overlayColor: "#000000", overlayOpacity: 0, dim: 0 },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                caption: "Purple Gradient",
                link: "",
                hover: { zoom: 1.06, overlayColor: "#000000", overlayOpacity: 0, dim: 0 },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                caption: "Blue Gradient",
                link: "",
                hover: { zoom: 1.06, overlayColor: "#000000", overlayOpacity: 0, dim: 0 },
            },
        ]

        const base = Array.isArray(list) && list.length > 0 ? list : defaults

        return base.map((it, i) => {
            const fallback = defaults[i % defaults.length]
            const src = (it?.image?.src || "").trim() || fallback.image.src
            return {
                image: {
                    src,
                    srcSet: it?.image?.srcSet,
                    alt: it?.image?.alt ?? fallback.image.alt,
                },
                caption: it?.caption ?? "",
                link: it?.link ?? "",
                hover: {
                    zoom: Math.max(1, it?.hover?.zoom ?? fallback.hover.zoom),
                    overlayColor: it?.hover?.overlayColor ?? fallback.hover.overlayColor,
                    overlayOpacity: Math.max(0, Math.min(1, it?.hover?.overlayOpacity ?? fallback.hover.overlayOpacity)),
                    dim: Math.max(0, Math.min(1, it?.hover?.dim ?? fallback.hover.dim)),
                },
            }
        })
    }, [list])

    React.useEffect(() => {
        if (isStatic) return
        if (!preloadImages) return
        if (typeof window === "undefined") return

        const uniqueSrcs = Array.from(
            new Set(
                normalizedList
                    .map((it) => (it?.image?.src || "").trim())
                    .filter(Boolean)
            )
        )

        uniqueSrcs.forEach((src) => {
            const img = new window.Image()
            img.decoding = "async"
            img.loading = "eager"
            img.src = src
        })
    }, [isStatic, preloadImages, normalizedList])

    const scrollerRef = React.useRef<HTMLDivElement | null>(null)
    const pressedRef = React.useRef(false)
    const movedRef = React.useRef(false)
    const rafRef = React.useRef<number | null>(null)
    const targetLeftRef = React.useRef(0)
    const targetTopRef = React.useRef(0)
    const lastMoveTimeRef = React.useRef(0)
    const lastMoveXRef = React.useRef(0)
    const lastMoveYRef = React.useRef(0)
    const velXRef = React.useRef(0)
    const velYRef = React.useRef(0)
    const pointerIdRef = React.useRef<number | null>(null)
    const lastDragEndRef = React.useRef(0)
    const startXRef = React.useRef(0)
    const startYRef = React.useRef(0)
    const startLeftRef = React.useRef(0)
    const startTopRef = React.useRef(0)

    const capturedRef = React.useRef(false)
    const dragThresholdRef = React.useRef(10)
    const totalDragDistanceRef = React.useRef(0)

    const [isDragging, setIsDragging] = React.useState(false)
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    const [fullscreenIndex, setFullscreenIndex] = React.useState<number | null>(null)
    const openFullscreen = React.useCallback(
        (idx: number) => {
            if (!fullscreen?.enabled) return
            React.startTransition(() => setFullscreenIndex(idx))
        },
        [fullscreen?.enabled]
    )
    const closeFullscreen = React.useCallback(() => {
        React.startTransition(() => setFullscreenIndex(null))
    }, [])
    const goFullscreenDelta = React.useCallback(
        (delta: number) => {
            React.startTransition(() =>
                setFullscreenIndex((current) => {
                    if (current === null) return current
                    const len = normalizedList.length || 1
                    return (current + delta + len) % len
                })
            )
        },
        // normalizedList referenced below; safe because memoized and stable enough
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [normalizedList]
    )

    const computedCursor = React.useMemo(() => {
        if (cursor === "none") return "none"
        if (!enableDragScroll) return cursor === "grab" ? "auto" : cursor
        if (isDragging) return "grabbing"
        return cursor === "auto" ? "grab" : cursor
    }, [cursor, enableDragScroll, isDragging])

    const baseRows = React.useMemo(
        () => Math.max(1, Math.ceil(normalizedList.length / safeColumns)),
        [normalizedList.length, safeColumns]
    )

    const patternWidth = React.useMemo(() => {
        // One seamless repeat width (includes the boundary gap between copies)
        return safeColumns * safeTile + safeColumns * safeGap
    }, [safeColumns, safeTile, safeGap])

    const patternHeight = React.useMemo(() => {
        // One seamless repeat height (includes the boundary gap between copies)
        return baseRows * safeTile + baseRows * safeGap
    }, [baseRows, safeTile, safeGap])

    const wrapScroll = React.useCallback(() => {
        const el = scrollerRef.current
        if (!el) return

        const canScrollX = allowX && el.scrollWidth > el.clientWidth + 1
        const canScrollY = allowY && el.scrollHeight > el.clientHeight + 1

        if (canScrollX && patternWidth > 0) {
            const x = el.scrollLeft
            // Keep scrollLeft inside the middle copy (1x pattern width)
            if (x < patternWidth * 0.5) {
                el.scrollLeft = x + patternWidth
                if (pressedRef.current) {
                    startLeftRef.current += patternWidth
                    targetLeftRef.current += patternWidth
                }
            } else if (x > patternWidth * 1.5) {
                el.scrollLeft = x - patternWidth
                if (pressedRef.current) {
                    startLeftRef.current -= patternWidth
                    targetLeftRef.current -= patternWidth
                }
            }
        }

        if (canScrollY && patternHeight > 0) {
            const y = el.scrollTop
            // Keep scrollTop inside the middle copy (1x pattern height)
            if (y < patternHeight * 0.5) {
                el.scrollTop = y + patternHeight
                if (pressedRef.current) {
                    startTopRef.current += patternHeight
                    targetTopRef.current += patternHeight
                }
            } else if (y > patternHeight * 1.5) {
                el.scrollTop = y - patternHeight
                if (pressedRef.current) {
                    startTopRef.current -= patternHeight
                    targetTopRef.current -= patternHeight
                }
            }
        }
    }, [allowX, allowY, patternHeight, patternWidth])

    React.useEffect(() => {
        if (isStatic) return
        if (!scrollerRef.current) return

        // Start centered in the middle copy to avoid wrap jitter/doubling on first drag
        const el = scrollerRef.current
        if (allowX) el.scrollLeft = patternWidth
        if (allowY) el.scrollTop = patternHeight

        // Ensure we're inside the safe wrap zone after any size/content changes
        wrapScroll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, allowX, allowY, patternWidth, patternHeight])

    React.useEffect(() => {
        if (isStatic) return
        if (!fullscreen?.enabled) return
        if (typeof window === "undefined") return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                closeFullscreen()
            }
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                goFullscreenDelta(-1)
            }
            if (e.key === "ArrowRight") {
                e.preventDefault()
                goFullscreenDelta(1)
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [closeFullscreen, fullscreenIndex, goFullscreenDelta, isStatic])

    React.useEffect(() => {
        if (isStatic) return
        if (!preloadImages) return
        if (typeof window === "undefined") return

        const uniqueSrcs = Array.from(
            new Set(
                normalizedList
                    .map((it) => (it?.image?.src || "").trim())
                    .filter(Boolean)
            )
        )

        uniqueSrcs.forEach((src) => {
            const img = new window.Image()
            img.decoding = "async"
            img.loading = "eager"
            img.src = src
        })
    }, [isStatic, preloadImages, normalizedList])

    const endDrag = React.useCallback(() => {
        const el = scrollerRef.current
        if (!pressedRef.current) return
        pressedRef.current = false

        if (pointerIdRef.current !== null && el && capturedRef.current) {
            try {
                el.releasePointerCapture(pointerIdRef.current)
            } catch {}
        }
        capturedRef.current = false

        const now = typeof performance !== "undefined" ? performance.now() : Date.now()
        if (movedRef.current) lastDragEndRef.current = now

        // Inertia
        if (el && !isStatic && enableDragScroll) {
            // Sync target to current position
            targetLeftRef.current = el.scrollLeft
            targetTopRef.current = el.scrollTop

            // If user stopped moving before release, kill velocity
            if (now - lastMoveTimeRef.current > 50) {
                velXRef.current = 0
                velYRef.current = 0
            }

            // Boost velocity for feel
            const velocityBoost = 16
            velXRef.current *= velocityBoost
            velYRef.current *= velocityBoost

            const start = now
            const step = (t: number) => {
                if (!el) return
                const currentNow = t || (typeof performance !== "undefined" ? performance.now() : Date.now())
                const dt = Math.min(32, Math.max(8, currentNow - start))
                const friction = 0.95

                velXRef.current *= friction
                velYRef.current *= friction

                if (Math.abs(velXRef.current) < 0.1 && Math.abs(velYRef.current) < 0.1) {
                    rafRef.current = null
                    return
                }

                if (allowX) targetLeftRef.current -= velXRef.current * (dt / 16)
                if (allowY) targetTopRef.current -= velYRef.current * (dt / 16)

                // Smoothly approach target
                const lerp = 0.2
                if (allowX) el.scrollLeft += (targetLeftRef.current - el.scrollLeft) * lerp
                if (allowY) el.scrollTop += (targetTopRef.current - el.scrollTop) * lerp

                wrapScroll()
                rafRef.current = requestAnimationFrame(step)
            }

            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(step)
        }

        // Delay clearing so click events immediately after a drag are still blocked
        if (typeof window !== "undefined") {
            window.setTimeout(() => {
                movedRef.current = false
            }, 0)
        } else {
            movedRef.current = false
        }
        React.startTransition(() => setIsDragging(false))
    }, [allowX, allowY, enableDragScroll, isStatic, wrapScroll])

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (!enableDragScroll) return
            if (!scrollerRef.current) return
            if (typeof (e as any).button === "number" && (e as any).button !== 0) return

            pressedRef.current = true
            movedRef.current = false
            capturedRef.current = false
            pointerIdRef.current = e.pointerId
            totalDragDistanceRef.current = 0

            startXRef.current = e.clientX
            startYRef.current = e.clientY
            startLeftRef.current = scrollerRef.current.scrollLeft
            startTopRef.current = scrollerRef.current.scrollTop

            targetLeftRef.current = startLeftRef.current
            targetTopRef.current = startTopRef.current
            lastMoveTimeRef.current = typeof performance !== "undefined" ? performance.now() : Date.now()
            lastMoveXRef.current = e.clientX
            lastMoveYRef.current = e.clientY
            velXRef.current = 0
            velYRef.current = 0

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }

            // Use a smaller threshold for better click detection
            dragThresholdRef.current = 12

            React.startTransition(() => setIsDragging(false))
        },
        [enableDragScroll, isStatic]
    )

    React.useEffect(() => {
        if (isStatic) return
        if (!enableDragScroll) return

        const onUp = () => endDrag()

        if (typeof window !== "undefined") {
            window.addEventListener("pointerup", onUp, { passive: true })
            window.addEventListener("pointercancel", onUp, { passive: true })
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("pointerup", onUp as any)
                window.removeEventListener("pointercancel", onUp as any)
            }
        }
    }, [enableDragScroll, endDrag, isStatic])

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (!enableDragScroll) return
            if (!pressedRef.current) return
            if (!scrollerRef.current) return
            if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return

            const dx = e.clientX - startXRef.current
            const dy = e.clientY - startYRef.current
            const dist = Math.hypot(dx, dy)

            const now = typeof performance !== "undefined" ? performance.now() : Date.now()
            const dt = Math.max(1, now - lastMoveTimeRef.current)
            const mdx = e.clientX - lastMoveXRef.current
            const mdy = e.clientY - lastMoveYRef.current
            const moveDist = Math.hypot(mdx, mdy)
            totalDragDistanceRef.current += moveDist

            // Smooth velocity tracking
            const newVx = mdx / dt
            const newVy = mdy / dt
            const alpha = 0.2
            velXRef.current = velXRef.current * (1 - alpha) + newVx * alpha
            velYRef.current = velYRef.current * (1 - alpha) + newVy * alpha

            lastMoveTimeRef.current = now
            lastMoveXRef.current = e.clientX
            lastMoveYRef.current = e.clientY

            if (!movedRef.current && dist > dragThresholdRef.current) {
                movedRef.current = true
                React.startTransition(() => setIsDragging(true))
                if (!capturedRef.current && scrollerRef.current) {
                    try {
                        scrollerRef.current.setPointerCapture(e.pointerId)
                        capturedRef.current = true
                    } catch {}
                }
            }

            // Only scroll when we've actually started dragging
            if (movedRef.current) {
                if (allowX) scrollerRef.current.scrollLeft = startLeftRef.current - dx
                if (allowY) scrollerRef.current.scrollTop = startTopRef.current - dy
            }

            wrapScroll()
        },
        [allowX, allowY, enableDragScroll, isStatic, wrapScroll]
    )

    const hideScrollbarStyle = showScrollbars
        ? undefined
        : (
              {
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
              } as React.CSSProperties
          )

    const isFullscreenClick = !!(fullscreen?.enabled && fullscreen?.clickMode === "fullscreen")

    return (
        <div
            ref={scrollerRef}
            className="framer-scrollable-image-gallery__scroller"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflowX: allowX ? "auto" : "hidden",
                overflowY: allowY ? "auto" : "hidden",
                cursor: computedCursor === "none" ? "none" : (computedCursor as any),
                userSelect: enableDragScroll ? "none" : "auto",
                touchAction: enableDragScroll ? "none" : "auto",
                WebkitOverflowScrolling: "touch",
                ...hideScrollbarStyle,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onScroll={isStatic ? undefined : wrapScroll}
            role={enableDragScroll ? "application" : undefined}
            aria-label="Scrollable image gallery"
        >
            {!showScrollbars && (
                <style>{`.framer-scrollable-image-gallery__scroller::-webkit-scrollbar{display:none;width:0;height:0}`}</style>
            )}
            {!isStatic && float?.enabled && (
                <style>{`@keyframes framer-sig-float{0%{transform:translateY(calc(var(--f-amt,8px)*-1)) scale(var(--f-scale,1.04))}50%{transform:translateY(var(--f-amt,8px)) scale(var(--f-scale,1.04))}100%{transform:translateY(calc(var(--f-amt,8px)*-1)) scale(var(--f-scale,1.04))}}`}</style>
            )}
            {!isStatic && rotate?.enabled && (
                <style>{`@keyframes framer-sig-rotate{0%{transform:rotate(calc(var(--r-amt,20deg)*-1))}50%{transform:rotate(var(--r-amt,20deg))}100%{transform:rotate(calc(var(--r-amt,20deg)*-1))}}`}</style>
            )}
            <div
                style={{
                    position: "relative",
                    padding: 0,
                    display: "grid",
                    gridTemplateColumns: `repeat(${safeColumns * 3}, ${safeTile}px)`,
                    gridAutoRows: `${safeTile}px`,
                    gap: safeGap,
                    width: "max-content",
                    height: "max-content",
                    alignContent: "start",
                    paddingLeft: 0,
                    paddingTop: 0,
                    paddingRight: 0,
                    paddingBottom: 0,
                    transformOrigin: "50% 50%",
                    animation:
                        !isStatic && rotate?.enabled
                            ? `framer-sig-rotate ${Math.max(0.5, rotate?.speed || 5)}s ease-in-out infinite`
                            : undefined,
                    willChange: rotate?.enabled ? "transform" : undefined,
                    // @ts-ignore
                    "--r-amt": `${Math.max(0, rotate?.angle ?? 20)}deg`,
                } as any}
            >
                {Array.from({
                    length: Math.max(1, Math.min(baseRows * 3 * safeColumns * 3, Math.floor(maxRenderCells))),
                }).map((_, worldIdx) => {
                    const col = worldIdx % (safeColumns * 3)
                    const row = Math.floor(worldIdx / (safeColumns * 3))

                    const baseCol = col % safeColumns
                    const baseRow = row % baseRows
                    const idx = baseRow * safeColumns + baseCol

                    const it = normalizedList[idx % normalizedList.length]
                    const key = `${worldIdx}-${it?.image?.src || ""}`

                    const hover = it?.hover
                    const zoom = Math.max(1, hover?.zoom ?? 1.04)
                    const overlayColor = hover?.overlayColor ?? "#000000"
                    const overlayOpacity = Math.max(0, Math.min(1, hover?.overlayOpacity ?? 0))
                    const dim = Math.max(0, Math.min(1, hover?.dim ?? 0))

                    const isHovered = hoveredIndex === worldIdx

                    const wrapStyle: React.CSSProperties = {
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        borderRadius: safeRadius,
                        background: "transparent",
                        display: "block",
                        textDecoration: "none",
                        color: "inherit",
                        WebkitTapHighlightColor: "transparent",
                    }

                    const href = (it?.link || "").trim()

                    const handleEnter = () => React.startTransition(() => setHoveredIndex(worldIdx))
                    const handleLeave = () =>
                        React.startTransition(() => setHoveredIndex((v) => (v === worldIdx ? null : v)))

                    const commonProps = {
                        key,
                        style: wrapStyle,
                        onMouseEnter: handleEnter,
                        onMouseLeave: handleLeave,
                        onPointerEnter: handleEnter,
                        onPointerLeave: handleLeave,
                        onPointerUp: (e: any) => {
                            if (movedRef.current) return
                            if (!href || isFullscreenClick) return
                            if (typeof window === "undefined") return

                            // Some browsers/environments may swallow the click when drag-scroll is enabled.
                            // Use a pointer-up fallback to ensure link navigation works reliably.
                            try {
                                if (linkTarget === "new") {
                                    window.open(href, "_blank", "noopener,noreferrer")
                                } else {
                                    window.location.assign(href)
                                }
                            } catch {}
                        },
                        onDragStart: (e: any) => {
                            e.preventDefault()
                        },
                        onClick: (e: any) => {
                            // Only prevent click if we actually dragged (net movement exceeded threshold)
                            if (movedRef.current) {
                                e.preventDefault()
                                e.stopPropagation()
                                return
                            }

                            if (fullscreen?.enabled && fullscreen?.clickMode === "fullscreen") {
                                e.preventDefault()
                                e.stopPropagation()
                                openFullscreen(idx % normalizedList.length)
                            }
                        },
                        "aria-label": it?.image?.alt || "Open image",
                    } as const

                    const target = linkTarget === "new" ? "_blank" : undefined
                    const rel = linkTarget === "new" ? "noreferrer" : undefined

                    const Wrapper: any = href && !isFullscreenClick ? "a" : "div"

                    const floatAmount = Math.max(0, float?.amount || 8)
                    const floatScale = 1 + Math.min(0.25, floatAmount / 200)

                    return (
                        <Wrapper
                            {...commonProps}
                            {...(href && !isFullscreenClick
                                ? { href, target, rel }
                                : { role: "img" })}
                        >
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    animation:
                                        !isStatic && float?.enabled
                                            ? `framer-sig-float ${Math.max(1, float?.speed || 6)}s ease-in-out ${((worldIdx % 20) * 0.12).toFixed(2)}s infinite`
                                            : undefined,
                                    willChange: float?.enabled ? "transform" : undefined,
                                    // @ts-ignore
                                    "--f-amt": `${floatAmount}px`,
                                    // @ts-ignore
                                    "--f-scale": String(floatScale),
                                } as any}
                            >
                                <img
                                    src={it.image.src}
                                    srcSet={it.image.srcSet}
                                    alt={it.image.alt || ""}
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit,
                                        borderRadius: safeRadius,
                                        display: "block",
                                        transform: isHovered ? `scale(${zoom})` : "scale(1)",
                                        transition: "transform 180ms ease",
                                        willChange: "transform",
                                    }}
                                />
                            </div>
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: overlayColor,
                                    opacity: isHovered ? overlayOpacity : 0,
                                    transition: "opacity 180ms ease",
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "#000",
                                    opacity: isHovered ? dim : 0,
                                    transition: "opacity 180ms ease",
                                    pointerEvents: "none",
                                }}
                            />
                            {!!(it?.caption || "").trim() && (
                                href && isFullscreenClick ? (
                                    <a
                                        href={href}
                                        target={target}
                                        rel={rel}
                                        onClick={(e) => {
                                            // Allow caption link to work even when tile click opens fullscreen
                                            if (movedRef.current) {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                return
                                            }
                                            e.stopPropagation()
                                        }}
                                        style={{
                                            position: "absolute",
                                            left: safeCaption.inset,
                                            right: safeCaption.inset,
                                            bottom: safeCaption.inset,
                                            padding: `${safeCaption.paddingY}px ${safeCaption.paddingX}px`,
                                            borderRadius: safeCaption.radius,
                                            background: safeCaption.backgroundColor,
                                            color: safeCaption.textColor,
                                            fontSize: 12,
                                            lineHeight: "1.2em",
                                            letterSpacing: "-0.01em",
                                            pointerEvents: "auto",
                                            whiteSpace: "pre-wrap",
                                            textDecoration: "none",
                                            ...safeCaption.font,
                                        }}
                                        aria-label="Open caption link"
                                    >
                                        {(it?.caption || "").trim()}
                                    </a>
                                ) : (
                                    <div
                                        aria-hidden
                                        style={{
                                            position: "absolute",
                                            left: safeCaption.inset,
                                            right: safeCaption.inset,
                                            bottom: safeCaption.inset,
                                            padding: `${safeCaption.paddingY}px ${safeCaption.paddingX}px`,
                                            borderRadius: safeCaption.radius,
                                            background: safeCaption.backgroundColor,
                                            color: safeCaption.textColor,
                                            fontSize: 12,
                                            lineHeight: "1.2em",
                                            letterSpacing: "-0.01em",
                                            pointerEvents: "none",
                                            whiteSpace: "pre-wrap",
                                            ...safeCaption.font,
                                        }}
                                    >
                                        {(it?.caption || "").trim()}
                                    </div>
                                )
                            )}
                        </Wrapper>
                    )
                })}
            </div>

            {fullscreen?.enabled && fullscreenIndex !== null && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Full screen image view"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        closeFullscreen()
                    }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: fullscreen?.backgroundColor || "#000000",
                        opacity: 1,
                    }}
                >
                    <div
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        style={{
                            position: "relative",
                            width: "min(92vw, 1200px)",
                            height: "min(88vh, 820px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: fullscreen?.backgroundColor || "#000000",
                                opacity: Math.max(0, Math.min(1, fullscreen?.backgroundOpacity ?? 0.92)),
                                borderRadius: 18,
                            }}
                        />

                        <img
                            src={normalizedList[fullscreenIndex]?.image?.src}
                            srcSet={normalizedList[fullscreenIndex]?.image?.srcSet}
                            alt={normalizedList[fullscreenIndex]?.image?.alt || ""}
                            draggable={false}
                            style={{
                                position: "relative",
                                maxWidth: "100%",
                                maxHeight: "100%",
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                borderRadius: 18,
                                display: "block",
                                userSelect: "none",
                            }}
                        />

                        <button
                            type="button"
                            aria-label="Close"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                closeFullscreen()
                            }}
                            style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                width: 40,
                                height: 40,
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.25)",
                                background: "rgba(0,0,0,0.35)",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontSize: 20,
                                lineHeight: "40px",
                                textAlign: "center",
                            }}
                        >
                            ×
                        </button>

                        <button
                            type="button"
                            aria-label="Previous"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                goFullscreenDelta(-1)
                            }}
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 44,
                                height: 44,
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.25)",
                                background: "rgba(0,0,0,0.35)",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontSize: 18,
                            }}
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            aria-label="Next"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                goFullscreenDelta(1)
                            }}
                            style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 44,
                                height: 44,
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.25)",
                                background: "rgba(0,0,0,0.35)",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontSize: 18,
                            }}
                        >
                            ›
                        </button>

                        {fullscreen?.showCaption && !!(normalizedList[fullscreenIndex]?.caption || "").trim() && (
                            (normalizedList[fullscreenIndex]?.link || "").trim() ? (
                                <a
                                    href={(normalizedList[fullscreenIndex]?.link || "").trim()}
                                    target={linkTarget === "new" ? "_blank" : undefined}
                                    rel={linkTarget === "new" ? "noreferrer" : undefined}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        position: "absolute",
                                        left: safeCaption.inset + 4,
                                        right: safeCaption.inset + 4,
                                        bottom: safeCaption.inset + 4,
                                        padding: `${Math.max(0, safeCaption.paddingY + 2)}px ${Math.max(0, safeCaption.paddingX + 2)}px`,
                                        borderRadius: Math.max(0, safeCaption.radius + 4),
                                        background: safeCaption.backgroundColor,
                                        color: safeCaption.textColor,
                                        fontSize: 13,
                                        lineHeight: "1.25em",
                                        letterSpacing: "-0.01em",
                                        pointerEvents: "auto",
                                        whiteSpace: "pre-wrap",
                                        textDecoration: "none",
                                        ...safeCaption.font,
                                    }}
                                >
                                    {(normalizedList[fullscreenIndex]?.caption || "").trim()}
                                </a>
                            ) : (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: safeCaption.inset + 4,
                                        right: safeCaption.inset + 4,
                                        bottom: safeCaption.inset + 4,
                                        padding: `${Math.max(0, safeCaption.paddingY + 2)}px ${Math.max(0, safeCaption.paddingX + 2)}px`,
                                        borderRadius: Math.max(0, safeCaption.radius + 4),
                                        background: safeCaption.backgroundColor,
                                        color: safeCaption.textColor,
                                        fontSize: 13,
                                        lineHeight: "1.25em",
                                        letterSpacing: "-0.01em",
                                        pointerEvents: "none",
                                        whiteSpace: "pre-wrap",
                                        ...safeCaption.font,
                                    }}
                                >
                                    {(normalizedList[fullscreenIndex]?.caption || "").trim()}
                                </div>
                            )
                        )}

                        {!!(normalizedList[fullscreenIndex]?.link || "").trim() && (
                            <a
                                href={(normalizedList[fullscreenIndex]?.link || "").trim()}
                                target={linkTarget === "new" ? "_blank" : undefined}
                                rel={linkTarget === "new" ? "noreferrer" : undefined}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    top: 12,
                                    padding: "10px 12px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,0.35)",
                                    border: "1px solid rgba(255,255,255,0.25)",
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    fontSize: 12,
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                Open link
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(ScrollableImageGallery, {
    fullscreen: {
        type: ControlType.Object,
        title: "Fullscreen",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "On",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            clickMode: {
                type: ControlType.Enum,
                title: "Click",
                options: ["link", "fullscreen"],
                optionTitles: ["Open Link", "Fullscreen"],
                defaultValue: "link",
                displaySegmentedControl: true,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "BG",
                defaultValue: "#000000",
            },
            backgroundOpacity: {
                type: ControlType.Number,
                title: "BG Op",
                defaultValue: 0.92,
                min: 0,
                max: 1,
                step: 0.01,
            },
            showCaption: {
                type: ControlType.Boolean,
                title: "Caption",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
        },
        defaultValue: {
            enabled: false,
            clickMode: "link",
            backgroundColor: "#000000",
            backgroundOpacity: 0.92,
            showCaption: true,
        },
    },
    captionStyle: {
        type: ControlType.Object,
        title: "Caption Style",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "BG",
                defaultValue: "rgba(0,0,0,0.55)",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
            paddingX: {
                type: ControlType.Number,
                title: "Pad X",
                defaultValue: 10,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            paddingY: {
                type: ControlType.Number,
                title: "Pad Y",
                defaultValue: 8,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 10,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                defaultValue: 10,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            backgroundColor: "rgba(0,0,0,0.55)",
            textColor: "#FFFFFF",
            font: {
                fontSize: "12px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
            },
            paddingX: 10,
            paddingY: 8,
            radius: 10,
            inset: 10,
        },
    },
    linkTarget: {
        type: ControlType.Enum,
        title: "Link",
        options: ["same", "new"],
        optionTitles: ["Same Tab", "New Tab"],
        defaultValue: "new",
        displaySegmentedControl: true,
    },
    preloadImages: {
        type: ControlType.Boolean,
        title: "Preload",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotate: {
        type: ControlType.Object,
        title: "Rotate",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "On",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 20,
                min: 0,
                max: 45,
                step: 1,
                unit: "deg",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 5,
                min: 0.5,
                max: 20,
                step: 0.5,
                unit: "s",
            },
        },
        defaultValue: { enabled: false, angle: 20, speed: 5 },
    },
    float: {
        type: ControlType.Object,
        title: "Float",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "On",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            amount: {
                type: ControlType.Number,
                title: "Amount",
                defaultValue: 8,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 6,
                min: 1,
                max: 20,
                step: 0.5,
                unit: "s",
            },
        },
        defaultValue: { enabled: true, amount: 8, speed: 6 },
    },
    list: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 100,
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                caption: "Green Gradient",
                link: "",
                hover: { zoom: 1.06, overlayColor: "#000000", overlayOpacity: 0, dim: 0 },
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                caption: { type: ControlType.String, title: "Caption", defaultValue: "", displayTextArea: true },
                link: { type: ControlType.Link, title: "Link" },
                hover: {
                    type: ControlType.Object,
                    title: "Hover",
                    controls: {
                        zoom: { type: ControlType.Number, title: "Zoom", defaultValue: 1.06, min: 1, max: 2, step: 0.01 },
                        overlayColor: { type: ControlType.Color, title: "Overlay", defaultValue: "#000000" },
                        overlayOpacity: {
                            type: ControlType.Number,
                            title: "Overlay Op",
                            defaultValue: 0,
                            min: 0,
                            max: 1,
                            step: 0.01,
                        },
                        dim: { type: ControlType.Number, title: "Dim", defaultValue: 0, min: 0, max: 1, step: 0.01 },
                    },
                },
            },
        },
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
    },
    tile: {
        type: ControlType.Number,
        title: "Tile",
        defaultValue: 140,
        min: 40,
        max: 400,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    enableDragScroll: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    allowX: {
        type: ControlType.Boolean,
        title: "Scroll X",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    allowY: {
        type: ControlType.Boolean,
        title: "Scroll Y",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cursor: {
        type: ControlType.Enum,
        title: "Cursor",
        options: ["grab", "move", "auto", "none"],
        optionTitles: ["Grab", "Move", "Auto", "None"],
        defaultValue: "grab",
    },
    showScrollbars: {
        type: ControlType.Boolean,
        title: "Scrollbars",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    maxRenderCells: {
        type: ControlType.Number,
        title: "Max Cells",
        defaultValue: 450,
        min: 9,
        max: 2000,
        step: 1,
    },
})