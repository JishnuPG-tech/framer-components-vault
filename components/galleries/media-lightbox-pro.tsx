import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useLayoutEffect,
} from "react"
import { createPortal } from "react-dom"
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


function extractYouTubeId(url: string): string | null {
    try {
        const parsed = new URL(url)
        const hostname = parsed.hostname.replace(/^www\./, "")
        let id: string | null = null

        if (hostname === "youtu.be") {
            id = parsed.pathname.split("/").filter(Boolean)[0] || null
        } else if (
            hostname === "youtube.com" ||
            hostname === "m.youtube.com" ||
            hostname === "youtube-nocookie.com"
        ) {
            if (parsed.pathname === "/watch") id = parsed.searchParams.get("v")
            else {
                const match = parsed.pathname.match(
                    /^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})(?:\/|$)/
                )
                id = match?.[1] || null
            }
        }
        return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
    } catch {
        return null
    }
}

function extractVimeoId(url: string): string | null {
    try {
        const parsed = new URL(url)
        const hostname = parsed.hostname.replace(/^www\./, "")
        if (hostname !== "vimeo.com" && hostname !== "player.vimeo.com")
            return null
        const match = parsed.pathname.match(/(?:^|\/)(?:video\/)?(\d+)(?:\/|$)/)
        return match?.[1] || null
    } catch {
        return null
    }
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
    sunset: ["golden hour", "evening", "dusk", "twilight", "orange sky"],
    beach: ["ocean", "sea", "coast", "shore", "vacation", "sand"],
    portrait: ["person", "people", "face", "fashion", "headshot"],
    nature: ["outdoor", "landscape", "forest", "mountain", "garden"],
    food: ["meal", "restaurant", "cuisine", "dish", "dessert"],
    travel: ["vacation", "trip", "destination", "city", "adventure"],
}

function semanticTokens(query: string): string[] {
    const base = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return Array.from(
        new Set(
            base.flatMap((token) => [token, ...(SEARCH_SYNONYMS[token] || [])])
        )
    )
}

function useFocusTrap(
    containerRef: React.RefObject<HTMLDivElement | null>,
    enabled = true
) {
    useEffect(() => {
        if (!enabled || !containerRef.current) return
        const container = containerRef.current
        const previouslyFocused = document.activeElement as HTMLElement | null
        const getFocusable = () =>
            Array.from(
                container.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])'
                )
            )
        const focusables = getFocusable()
        ;(focusables[0] || container).focus()
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return
            const items = getFocusable()
            if (items.length === 0) return
            const first = items[0],
                last = items[items.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }
        container.addEventListener("keydown", handleKeyDown)
        return () => {
            container.removeEventListener("keydown", handleKeyDown)
            previouslyFocused?.focus?.()
        }
    }, [containerRef, enabled])
}

function LightboxGallery({
    slides,
    initialIndex,
    title,
    onClose,
    showThumbnails = true,
    animationDuration = 0.42,
    overlayColor = "rgba(0,0,0,0.9)",
    cursorSize = 58,
    closeOnBackdropClick = true,
    autoplay = false,
    autoplayDelay = 4,
    showCaption = true,
    showFavorite = true,
    showShare = true,
    showFullscreen = true,
    transitionStyle = "zoom",
    slideshowEffect = "fade",
    showShortcutHelp = true,
    originRect,
    typographySettings = {},
}: {
    slides: {
        type: "image" | "video" | "youtube" | "vimeo"
        src: string
        label?: string
        description?: string
        fallbackImage?: string
        id?: string
    }[]
    initialIndex: number
    title?: string
    gallerySettings?: GallerySettings
    imageBadge?: BadgeSettings
    videoBadge?: BadgeSettings
    youtubeBadge?: BadgeSettings
    vimeoBadge?: BadgeSettings
    filterSettings?: FilterSettings
    lightboxSettings?: LightboxSettings
    animationSettings?: AnimationSettings
    onClose: () => void
    showThumbnails?: boolean
    animationDuration?: number
    overlayColor?: string
    cursorSize?: number
    closeOnBackdropClick?: boolean
    autoplay?: boolean
    autoplayDelay?: number
    showCaption?: boolean
    showFavorite?: boolean
    showShare?: boolean
    showFullscreen?: boolean
    transitionStyle?: "zoom" | "fade" | "slide" | "blur"
    slideshowEffect?: "fade" | "crossfade" | "zoom" | "ken-burns"
    showShortcutHelp?: boolean
    typographySettings?: TypographySettings
    originRect?: {
        left: number
        top: number
        width: number
        height: number
    } | null
}) {
    const isStatic = useIsStaticRenderer()
    const backdropRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const mediaRef = useRef<HTMLDivElement>(null)
    const imageStageRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const thumbnailsRef = useRef<HTMLDivElement>(null)
    const closeCursorRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const pointersRef = useRef(new Map<number, { x: number; y: number }>())
    const gestureStartRef = useRef<{
        x: number
        y: number
        time: number
    } | null>(null)
    const dragStartRef = useRef<{
        x: number
        y: number
        panX: number
        panY: number
    } | null>(null)
    const pinchRef = useRef<{
        distance: number
        zoom: number
        angle: number
        rotation: number
    } | null>(null)
    const zoomRef = useRef(1)
    const rotationRef = useRef(0)
    const lastTapRef = useRef(0)
    const panRef = useRef({ x: 0, y: 0 })
    const isClosingRef = useRef(false)
    const [showCloseCursor, setShowCloseCursor] = useState(false)
    const [mediaStatus, setMediaStatus] = useState<
        "loading" | "loaded" | "error"
    >("loading")
    const [zoomDisplay, setZoomDisplay] = useState(1)
    const [rotationDisplay, setRotationDisplay] = useState(0)
    const [showLikeBurst, setShowLikeBurst] = useState(false)
    const [isPlaying, setIsPlaying] = useState(isStatic ? false : autoplay)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [favoriteIds, setFavoriteIds] = useState<string[]>([])
    const [shareStatus, setShareStatus] = useState("")
    const [retryKey, setRetryKey] = useState(0)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [compareEnabled, setCompareEnabled] = useState(false)
    const [compareMode, setCompareMode] = useState<
        "before-after" | "side-by-side"
    >("before-after")
    const [compareBaseIndex, setCompareBaseIndex] = useState<number | null>(
        null
    )
    const [compareIndex, setCompareIndex] = useState<number | null>(null)
    const [comparePosition, setComparePosition] = useState(50)
    const compareDragRef = useRef<{
        pointerId: number
        element: HTMLDivElement
    } | null>(null)
    const [index, setIndex] = useState(() =>
        Math.min(Math.max(initialIndex, 0), Math.max(slides.length - 1, 0))
    )
    const [isLightboxVisible, setIsLightboxVisible] = useState(false)
    const slide = slides[index]
    const imageIndexes = useMemo(
        () =>
            slides
                .map((item, itemIndex) =>
                    item.type === "image" ? itemIndex : -1
                )
                .filter((itemIndex) => itemIndex >= 0),
        [slides]
    )
    const canCompare = imageIndexes.length >= 2
    const compareBaseSlide =
        compareBaseIndex !== null && slides[compareBaseIndex]?.type === "image"
            ? slides[compareBaseIndex]
            : undefined
    const compareSlide =
        compareIndex !== null && slides[compareIndex]?.type === "image"
            ? slides[compareIndex]
            : undefined

    const beginCompare = useCallback(() => {
        if (!canCompare) return
        const baseIndex = slide.type === "image" ? index : imageIndexes[0]
        const secondIndex =
            imageIndexes.find((itemIndex) => itemIndex !== baseIndex) ??
            imageIndexes[1]
        setCompareBaseIndex(baseIndex)
        setCompareIndex(secondIndex)
        setComparePosition(50)
        setCompareEnabled(true)
        setIsPlaying(false)
    }, [canCompare, imageIndexes, index, slide.type])

    const updateComparePosition = useCallback(
        (clientX: number, element?: HTMLDivElement | null) => {
            const target = element || compareDragRef.current?.element
            if (!target) return
            const rect = target.getBoundingClientRect()
            const next = ((clientX - rect.left) / Math.max(rect.width, 1)) * 100
            setComparePosition(Math.max(0, Math.min(100, next)))
        },
        []
    )

    const {
        font = {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "1.45em",
            letterSpacing: "0em",
        },
        lightboxTitleFont = {
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "1.2em",
        },
        lightboxMetaFont = {
            fontSize: "12px",
            fontWeight: 400,
            lineHeight: "1.35em",
        },
        toolbarFont = { fontSize: "11px", fontWeight: 500, lineHeight: "1em" },
        captionTitleFont = {
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: "1.3em",
        },
        captionDescriptionFont = {
            fontSize: "12px",
            fontWeight: 400,
            lineHeight: "1.5em",
        },
    } = typographySettings
    useFocusTrap(backdropRef, !isStatic)

    useEffect(() => {
        if (!compareEnabled || compareMode !== "before-after") return
        const move = (event: PointerEvent) => {
            const drag = compareDragRef.current
            if (!drag || drag.pointerId !== event.pointerId) return
            event.preventDefault()
            updateComparePosition(event.clientX)
        }
        const end = (event: PointerEvent) => {
            const drag = compareDragRef.current
            if (!drag || drag.pointerId !== event.pointerId) return
            compareDragRef.current = null
        }
        window.addEventListener("pointermove", move, { passive: false })
        window.addEventListener("pointerup", end)
        window.addEventListener("pointercancel", end)
        return () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", end)
            window.removeEventListener("pointercancel", end)
            compareDragRef.current = null
        }
    }, [compareEnabled, compareMode, updateComparePosition])

    useEffect(() => {
        if (!compareEnabled) return
        const valid =
            compareBaseIndex !== null &&
            compareIndex !== null &&
            compareBaseIndex !== compareIndex &&
            slides[compareBaseIndex]?.type === "image" &&
            slides[compareIndex]?.type === "image"
        if (!valid) {
            setCompareEnabled(false)
            setCompareBaseIndex(null)
            setCompareIndex(null)
        }
    }, [compareBaseIndex, compareEnabled, compareIndex, slides])

    useEffect(() => {
        if (isStatic) return
        try {
            const stored = window.localStorage.getItem(
                "framer-lightbox-favorites"
            )
            if (stored) setFavoriteIds(JSON.parse(stored))
        } catch {}
    }, [])

    useEffect(() => {
        if (isStatic || !isPlaying || slides.length < 2 || zoomDisplay > 1.01)
            return
        const timer = window.setInterval(
            () => {
                setMediaStatus("loading")
                setIndex((current) => (current + 1) % slides.length)
            },
            Math.max(1, autoplayDelay) * 1000
        )
        return () => window.clearInterval(timer)
    }, [autoplayDelay, isPlaying, isStatic, slides.length, zoomDisplay])

    useEffect(() => {
        if (isStatic) return
        const syncFullscreen = () =>
            setIsFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener("fullscreenchange", syncFullscreen)
        return () =>
            document.removeEventListener("fullscreenchange", syncFullscreen)
    }, [])

    const currentFavoriteId =
        slide?.id || `${slide?.type || "item"}:${slide?.src || index}`

    const toggleFavorite = useCallback(() => {
        if (isStatic || !currentFavoriteId) return
        setFavoriteIds((current) => {
            const next = current.includes(currentFavoriteId)
                ? current.filter((item) => item !== currentFavoriteId)
                : [...current, currentFavoriteId]
            try {
                window.localStorage.setItem(
                    "framer-lightbox-favorites",
                    JSON.stringify(next)
                )
                window.dispatchEvent(
                    new CustomEvent("framer-lightbox-favorites-change", {
                        detail: next,
                    })
                )
            } catch {}
            return next
        })
    }, [currentFavoriteId, isStatic])

    const shareCurrent = useCallback(async () => {
        if (isStatic) return
        const text = slide?.label || title || "Gallery item"
        try {
            if (navigator.share) {
                await navigator.share({ title: text, text, url: slide?.src })
                setShareStatus("Shared")
            } else {
                await navigator.clipboard.writeText(
                    slide?.src || window.location.href
                )
                setShareStatus("Link copied")
            }
        } catch {
            setShareStatus("Unable to share")
        }
        window.setTimeout(() => setShareStatus(""), 1800)
    }, [isStatic, slide, title])

    const toggleFullscreen = useCallback(async () => {
        if (isStatic) return
        try {
            if (!document.fullscreenElement) {
                await backdropRef.current?.requestFullscreen?.()
            } else {
                await document.exitFullscreen?.()
            }
        } catch {}
    }, [isStatic])

    const prefersReducedMotion = () =>
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const stopActiveMedia = useCallback(() => {
        if (isStatic) return
        const video = videoRef.current
        if (video) video.pause()
        mediaRef.current
            ?.querySelectorAll("video")
            .forEach((item) => item.pause())
        mediaRef.current?.querySelectorAll("iframe").forEach((frame) => {
            const current = frame.src
            frame.src = "about:blank"
            requestAnimationFrame(() => {
                if (frame.isConnected) frame.src = current
            })
        })
    }, [isStatic])

    const clampPan = useCallback((x: number, y: number, zoom: number) => {
        const stage = imageStageRef.current
        if (!stage || zoom <= 1) return { x: 0, y: 0 }
        const maxX = (stage.clientWidth * (zoom - 1)) / 2
        const maxY = (stage.clientHeight * (zoom - 1)) / 2
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
        }
    }, [])

    const applyImageTransform = useCallback(
        (
            zoom = zoomRef.current,
            x = panRef.current.x,
            y = panRef.current.y,
            animate = false
        ) => {
            const image = imageRef.current
            if (isStatic || !image) return
            const nextZoom = Math.max(1, Math.min(4, zoom))
            const nextPan = clampPan(x, y, nextZoom)
            zoomRef.current = nextZoom
            panRef.current = nextPan
            setZoomDisplay(Number(nextZoom.toFixed(2)))
            gsap.to(image, {
                scale: nextZoom,
                rotation: rotationRef.current,
                x: nextPan.x,
                y: nextPan.y,
                duration: animate && !prefersReducedMotion() ? 0.42 : 0,
                ease: animate ? "back.out(1.45)" : "none",
                overwrite: true,
                transformOrigin: "50% 50%",
            })
        },
        [clampPan, isStatic]
    )

    const resetZoom = useCallback(
        (animate = false) => {
            if (isStatic) return
            panRef.current = { x: 0, y: 0 }
            zoomRef.current = 1
            setZoomDisplay(1)
            if (imageRef.current) {
                gsap.to(imageRef.current, {
                    scale: 1,
                    x: 0,
                    y: 0,
                    duration: animate && !prefersReducedMotion() ? 0.35 : 0,
                    ease: "power3.out",
                    overwrite: true,
                })
            }
        },
        [isStatic]
    )

    const resetRotation = useCallback(
        (animate = true) => {
            if (isStatic) return
            rotationRef.current = 0
            setRotationDisplay(0)
            if (imageRef.current) {
                gsap.to(imageRef.current, {
                    rotation: 0,
                    duration: animate && !prefersReducedMotion() ? 0.35 : 0,
                    ease: "power3.out",
                    overwrite: true,
                })
            }
        },
        [isStatic]
    )

    const goTo = useCallback(
        (nextIndex: number) => {
            if (!slides.length) return
            stopActiveMedia()
            resetZoom(false)
            resetRotation(false)
            setMediaStatus("loading")
            setIndex(
                ((nextIndex % slides.length) + slides.length) % slides.length
            )
        },
        [slides.length, stopActiveMedia, resetZoom, resetRotation]
    )

    const previous = useCallback(() => {
        if (!slides.length) return
        stopActiveMedia()
        resetZoom(false)
        resetRotation(false)
        setMediaStatus("loading")
        setIndex((current) => (current - 1 + slides.length) % slides.length)
    }, [slides.length, stopActiveMedia, resetZoom, resetRotation])

    const next = useCallback(() => {
        if (!slides.length) return
        stopActiveMedia()
        resetZoom(false)
        resetRotation(false)
        setMediaStatus("loading")
        setIndex((current) => (current + 1) % slides.length)
    }, [slides.length, stopActiveMedia, resetZoom, resetRotation])

    const requestClose = useCallback(() => {
        if (isStatic || isClosingRef.current) {
            onClose()
            return
        }
        isClosingRef.current = true
        stopActiveMedia()
        if (
            prefersReducedMotion() ||
            !backdropRef.current ||
            !panelRef.current
        ) {
            onClose()
            return
        }
        gsap.timeline({ onComplete: onClose })
            .to(panelRef.current, {
                opacity: 0,
                scale: 0.82,
                y: 44,
                filter: "blur(18px)",
                duration: Math.min(animationDuration * 0.8, 0.38),
                ease: "power3.in",
            })
            .to(
                backdropRef.current,
                {
                    opacity: 0,
                    backdropFilter: "blur(0px)",
                    duration: Math.min(animationDuration * 0.72, 0.32),
                    ease: "power2.inOut",
                },
                0.04
            )
    }, [animationDuration, isStatic, onClose, stopActiveMedia])

    const handleOverlayPointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (
                event.pointerType === "touch" ||
                window.matchMedia("(pointer: coarse)").matches
            )
                return
            const direct = event.target === backdropRef.current
            setShowCloseCursor(direct)
            if (direct && closeCursorRef.current) {
                gsap.to(closeCursorRef.current, {
                    x: event.clientX,
                    y: event.clientY,
                    duration: 0.16,
                    ease: "power2.out",
                    overwrite: true,
                })
            }
        },
        [isStatic]
    )

    useEffect(() => {
        if (isStatic) return
        const backdrop = backdropRef.current
        if (!backdrop) return

        let isIntersecting = false
        let isDisposed = false

        const syncVisibility = () => {
            if (isDisposed) return
            const styles = window.getComputedStyle(backdrop)
            const isRendered =
                styles.display !== "none" &&
                styles.visibility !== "hidden" &&
                Number(styles.opacity || 1) > 0

            setIsLightboxVisible(
                isIntersecting && isRendered && !document.hidden
            )
        }

        const intersectionObserver =
            typeof IntersectionObserver === "undefined"
                ? null
                : new IntersectionObserver(
                      ([entry]) => {
                          isIntersecting =
                              Boolean(entry?.isIntersecting) &&
                              (entry?.intersectionRatio || 0) > 0
                          syncVisibility()
                      },
                      { threshold: 0.01 }
                  )

        const mutationObserver =
            typeof MutationObserver === "undefined"
                ? null
                : new MutationObserver(syncVisibility)

        if (intersectionObserver) {
            intersectionObserver.observe(backdrop)
        } else {
            const rect = backdrop.getBoundingClientRect()
            isIntersecting =
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < window.innerHeight &&
                rect.left < window.innerWidth
            syncVisibility()
        }

        mutationObserver?.observe(backdrop, {
            attributes: true,
            attributeFilter: ["class", "hidden", "style"],
        })
        document.addEventListener("visibilitychange", syncVisibility)
        window.addEventListener("pageshow", syncVisibility)
        window.addEventListener("pagehide", syncVisibility)

        return () => {
            isDisposed = true
            intersectionObserver?.disconnect()
            mutationObserver?.disconnect()
            document.removeEventListener("visibilitychange", syncVisibility)
            window.removeEventListener("pageshow", syncVisibility)
            window.removeEventListener("pagehide", syncVisibility)
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic || !isLightboxVisible || slides.length < 2) return

        const cleanup: Array<() => void> = []
        const candidates = [
            slides[(index - 1 + slides.length) % slides.length],
            slides[(index + 1) % slides.length],
        ]

        candidates.forEach((item) => {
            if (!item?.src) return
            if (item.type === "image") {
                const image = new Image()
                image.decoding = "async"
                image.src = item.src
                image.decode?.().catch(() => undefined)
                cleanup.push(() => {
                    image.src = ""
                })
            } else if (item.type === "youtube") {
                const id = extractYouTubeId(item.src)
                if (!id) return
                const image = new Image()
                image.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                cleanup.push(() => {
                    image.src = ""
                })
            } else if (item.type === "video") {
                const video = document.createElement("video")
                video.preload = "metadata"
                video.src = item.src
                video.load()
                cleanup.push(() => {
                    video.pause()
                    video.removeAttribute("src")
                    video.load()
                })
            }
        })

        return () => cleanup.forEach((dispose) => dispose())
    }, [index, isLightboxVisible, isStatic, slides])

    useEffect(() => {
        if (isStatic) return
        const backdrop = backdropRef.current
        const panel = panelRef.current
        if (!backdrop || !panel || prefersReducedMotion()) return

        // Keep the lightbox visible by default. Framer may interrupt or replay
        // effects while mounting code components; setting opacity to zero here can
        // otherwise leave the entire portal permanently invisible.
        const panelBounds = panel.getBoundingClientRect()
        const sourceCenterX = originRect
            ? originRect.left + originRect.width / 2
            : window.innerWidth / 2
        const sourceCenterY = originRect
            ? originRect.top + originRect.height / 2
            : window.innerHeight / 2
        const panelCenterX = panelBounds.left + panelBounds.width / 2
        const panelCenterY = panelBounds.top + panelBounds.height / 2
        const startScale = originRect
            ? Math.max(
                  0.18,
                  Math.min(
                      0.92,
                      Math.min(
                          originRect.width / Math.max(panelBounds.width, 1),
                          originRect.height / Math.max(panelBounds.height, 1)
                      )
                  )
              )
            : 0.92

        const context = gsap.context(() => {
            gsap.fromTo(
                panel,
                {
                    scale: startScale,
                    x: originRect ? sourceCenterX - panelCenterX : 0,
                    y: originRect ? sourceCenterY - panelCenterY : 24,
                },
                {
                    scale: 1,
                    x: 0,
                    y: 0,
                    duration: Math.max(0, animationDuration * 1.1),
                    ease: "back.out(1.35)",
                    clearProps: "transform",
                }
            )

            if (showThumbnails && thumbnailsRef.current) {
                gsap.fromTo(
                    thumbnailsRef.current.children,
                    { y: 10, scale: 0.96 },
                    {
                        y: 0,
                        scale: 1,
                        duration: Math.max(0, animationDuration * 0.7),
                        stagger: 0.025,
                        ease: "power2.out",
                        clearProps: "transform",
                    }
                )
            }
        }, backdrop)

        return () => context.revert()
    }, [animationDuration, isStatic, originRect, showThumbnails])

    useEffect(() => {
        if (isStatic) return
        resetZoom(false)
        pointersRef.current.clear()
        pinchRef.current = null
        const media = mediaRef.current
        if (prefersReducedMotion() || !media) return
        const fromState =
            transitionStyle === "fade"
                ? { opacity: 0 }
                : transitionStyle === "slide"
                  ? { opacity: 0, x: 70 }
                  : transitionStyle === "blur"
                    ? { opacity: 0, filter: "blur(24px)" }
                    : { opacity: 0, scale: 0.9, filter: "blur(16px)", x: 28 }
        const animation = gsap.fromTo(media, fromState, {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            x: 0,
            duration: animationDuration * 1.05,
            ease: "back.out(1.35)",
            clearProps: "filter,transform",
        })
        return () => animation.kill()
    }, [animationDuration, index, isStatic, resetZoom, transitionStyle])

    useEffect(() => {
        if (isStatic) return
        const activeThumbnail = thumbnailsRef.current?.querySelector(
            `[data-thumbnail-index="${index}"]`
        ) as HTMLElement | null
        activeThumbnail?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        })
    }, [index, isStatic])

    useEffect(() => {
        if (isStatic) return
        const handleKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            if (
                target?.matches(
                    "input, textarea, select, [contenteditable='true']"
                )
            )
                return
            if (event.key === "Escape") {
                if (showShortcuts) setShowShortcuts(false)
                else requestClose()
            }
            if (event.key === "?" && showShortcutHelp)
                setShowShortcuts((value) => !value)
            if (event.key === "ArrowLeft" && zoomRef.current === 1) previous()
            if (event.key === "ArrowRight" && zoomRef.current === 1) next()
            if (event.key === "0") resetZoom(true)
            if (event.key.toLowerCase() === "f") toggleFullscreen()
            if (event.key === " ") {
                event.preventDefault()
                setIsPlaying((value) => !value)
            }
            if (
                (event.key === "+" || event.key === "=") &&
                slide?.type === "image"
            )
                applyImageTransform(
                    zoomRef.current + 0.5,
                    panRef.current.x,
                    panRef.current.y,
                    true
                )
            if (event.key === "-" && slide?.type === "image")
                applyImageTransform(
                    zoomRef.current - 0.5,
                    panRef.current.x,
                    panRef.current.y,
                    true
                )
        }
        window.addEventListener("keydown", handleKey)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            stopActiveMedia()
            window.removeEventListener("keydown", handleKey)
            document.body.style.overflow = previousOverflow
        }
    }, [
        applyImageTransform,
        next,
        previous,
        requestClose,
        resetZoom,
        slide?.type,
        stopActiveMedia,
        toggleFullscreen,
        showShortcutHelp,
        showShortcuts,
        isStatic,
    ])

    if (!slide) return null

    if (isStatic) {
        const previewSrc =
            slide.type === "image" ? slide.src : slide.fallbackImage || ""

        return (
            <div
                aria-label={`${title || "Gallery"} static preview`}
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 240,
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    borderRadius: 16,
                    background: "#090909",
                    color: "#fff",
                }}
            >
                {previewSrc ? (
                    <img
                        src={previewSrc}
                        alt={slide.label || title || "Gallery preview"}
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            padding: 24,
                            textAlign: "center",
                            opacity: 0.72,
                        }}
                    >
                        {slide.label || "Media preview"}
                    </div>
                )}
            </div>
        )
    }

    if (typeof document === "undefined") return null
    const youtubeId =
        slide.type === "youtube" ? extractYouTubeId(slide.src) : null
    const vimeoId = slide.type === "vimeo" ? extractVimeoId(slide.src) : null
    const invalidEmbed =
        (slide.type === "youtube" && !youtubeId) ||
        (slide.type === "vimeo" && !vimeoId)

    const mediaLabel =
        slide.type === "image"
            ? "Image"
            : slide.type === "youtube"
              ? "YouTube video"
              : slide.type === "vimeo"
                ? "Vimeo video"
                : "Video"

    const renderThumbnail = (
        item: {
            type: "image" | "video" | "youtube" | "vimeo"
            src: string
            fallbackImage?: string
        },
        thumbnailIndex: number
    ) => {
        const itemYoutubeId =
            item.type === "youtube" ? extractYouTubeId(item.src) : null
        const active = compareEnabled
            ? thumbnailIndex === compareBaseIndex ||
              thumbnailIndex === compareIndex
            : thumbnailIndex === index
        const compareTarget = compareEnabled && thumbnailIndex === compareIndex
        return (
            <button
                key={`${item.type}-${item.src}-${thumbnailIndex}`}
                type="button"
                data-thumbnail-index={thumbnailIndex}
                data-lightbox-control="true"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (compareEnabled) {
                        if (
                            item.type === "image" &&
                            thumbnailIndex !== compareBaseIndex
                        ) {
                            setCompareIndex(thumbnailIndex)
                            setComparePosition(50)
                        }
                        return
                    }
                    goTo(thumbnailIndex)
                }}
                aria-label={
                    compareEnabled
                        ? item.type === "image"
                            ? thumbnailIndex === compareBaseIndex
                                ? `Comparison image A ${thumbnailIndex + 1}`
                                : `Use image ${thumbnailIndex + 1} as comparison B`
                            : `${item.type} cannot be compared`
                        : `Open ${item.type} ${thumbnailIndex + 1}`
                }
                aria-current={active ? "true" : undefined}
                style={{
                    position: "relative",
                    width: "clamp(48px, 13vw, 76px)",
                    height: "clamp(38px, 9vw, 58px)",
                    flex: "0 0 auto",
                    padding: 0,
                    overflow: "hidden",
                    borderRadius: 8,
                    border: compareTarget
                        ? "2px solid #8fd3ff"
                        : active
                          ? "2px solid #fff"
                          : "1px solid rgba(255,255,255,.24)",
                    background: "rgba(255,255,255,.08)",
                    cursor:
                        compareEnabled &&
                        (item.type !== "image" ||
                            thumbnailIndex === compareBaseIndex)
                            ? "not-allowed"
                            : "pointer",
                    opacity:
                        compareEnabled && item.type !== "image"
                            ? 0.28
                            : active
                              ? 1
                              : 0.64,
                    transform: active ? "scale(1)" : "scale(.94)",
                    transition:
                        "opacity .22s ease, transform .28s cubic-bezier(.2,.8,.2,1), border-color .22s ease",
                    scrollSnapAlign: "center",
                    zIndex: 2,
                    pointerEvents: "auto",
                    touchAction: "manipulation",
                }}
            >
                {item.type === "image" ? (
                    <img
                        src={item.src}
                        alt=""
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (item.type === "youtube" || item.type === "vimeo") &&
                  (item.fallbackImage || itemYoutubeId) ? (
                    <img
                        src={
                            item.fallbackImage ||
                            (itemYoutubeId
                                ? `https://i.ytimg.com/vi/${itemYoutubeId}/hqdefault.jpg`
                                : "")
                        }
                        alt=""
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontSize: 10,
                            background:
                                "linear-gradient(135deg,#292929,#0b0b0b)",
                        }}
                    >
                        VIDEO
                    </span>
                )}
                {item.type !== "image" && (
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0,0,0,.2)",
                        }}
                    >
                        <span
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(0,0,0,.68)",
                                color: "#fff",
                            }}
                        >
                            <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                style={{ marginLeft: 2 }}
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </span>
                    </span>
                )}
            </button>
        )
    }

    const pointerDistance = () => {
        const values = Array.from(pointersRef.current.values())
        if (values.length < 2) return 0
        return Math.hypot(values[1].x - values[0].x, values[1].y - values[0].y)
    }

    const pointerAngle = () => {
        const values = Array.from(pointersRef.current.values())
        if (values.length < 2) return 0
        return (
            Math.atan2(values[1].y - values[0].y, values[1].x - values[0].x) *
            (180 / Math.PI)
        )
    }

    const isInteractiveTarget = (target: EventTarget | null) =>
        target instanceof Element &&
        Boolean(
            target.closest(
                "[data-lightbox-control], button, a, input, select, textarea, video, iframe, [role='button']"
            )
        )

    const handleMediaPointerDown = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (isInteractiveTarget(event.target)) return

        event.currentTarget.setPointerCapture?.(event.pointerId)
        pointersRef.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        })
        if (pointersRef.current.size === 2 && slide.type === "image") {
            pinchRef.current = {
                distance: pointerDistance(),
                zoom: zoomRef.current,
                angle: pointerAngle(),
                rotation: rotationRef.current,
            }
            gestureStartRef.current = null
            return
        }
        gestureStartRef.current = {
            x: event.clientX,
            y: event.clientY,
            time: Date.now(),
        }
        if (slide.type === "image" && zoomRef.current > 1) {
            dragStartRef.current = {
                x: event.clientX,
                y: event.clientY,
                panX: panRef.current.x,
                panY: panRef.current.y,
            }
        }
    }

    const handleMediaPointerMove = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (isInteractiveTarget(event.target)) return
        if (!pointersRef.current.has(event.pointerId)) return
        pointersRef.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        })
        if (slide.type !== "image") return
        if (pointersRef.current.size >= 2 && pinchRef.current) {
            event.preventDefault()
            const distance = pointerDistance()
            if (distance > 0) {
                rotationRef.current =
                    pinchRef.current.rotation +
                    pointerAngle() -
                    pinchRef.current.angle
                setRotationDisplay(Math.round(rotationRef.current))
                applyImageTransform(
                    pinchRef.current.zoom *
                        (distance / Math.max(1, pinchRef.current.distance)),
                    panRef.current.x,
                    panRef.current.y,
                    false
                )
            }
            return
        }
        if (zoomRef.current > 1 && dragStartRef.current) {
            event.preventDefault()
            applyImageTransform(
                zoomRef.current,
                dragStartRef.current.panX +
                    event.clientX -
                    dragStartRef.current.x,
                dragStartRef.current.panY +
                    event.clientY -
                    dragStartRef.current.y,
                false
            )
        }
    }

    const handleMediaPointerUp = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (isInteractiveTarget(event.target)) {
            pointersRef.current.delete(event.pointerId)
            if (pointersRef.current.size < 2) pinchRef.current = null
            gestureStartRef.current = null
            dragStartRef.current = null
            return
        }

        const start = gestureStartRef.current
        pointersRef.current.delete(event.pointerId)
        if (pointersRef.current.size < 2) pinchRef.current = null
        dragStartRef.current = null
        if (!start || zoomRef.current > 1.01) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        const now = Date.now()
        if (
            event.pointerType === "touch" &&
            Math.abs(dx) < 18 &&
            Math.abs(dy) < 18 &&
            now - lastTapRef.current < 320
        ) {
            if (!favoriteIds.includes(currentFavoriteId)) toggleFavorite()
            setShowLikeBurst(true)
            window.setTimeout(() => setShowLikeBurst(false), 700)
            lastTapRef.current = 0
            gestureStartRef.current = null
            return
        }
        if (
            event.pointerType === "touch" &&
            Math.abs(dx) < 18 &&
            Math.abs(dy) < 18
        )
            lastTapRef.current = now
        const elapsed = Date.now() - start.time
        gestureStartRef.current = null
        if (elapsed > 750) return
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.15)
            dx < 0 ? next() : previous()
        else if (Math.abs(dy) > 85 && Math.abs(dy) > Math.abs(dx) * 1.15)
            requestClose()
    }

    const toolbarButtonStyle: React.CSSProperties = {
        border: "1px solid rgba(255,255,255,.25)",
        background: "rgba(255,255,255,.08)",
        color: "#fff",
        borderRadius: 999,
        padding: "7px 11px",
        cursor: "pointer",
        ...toolbarFont,
        whiteSpace: "nowrap",
    }

    return createPortal(
        <div
            ref={backdropRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={`${title || "Gallery"} lightbox`}
            onPointerMove={handleOverlayPointerMove}
            onPointerLeave={() => setShowCloseCursor(false)}
            onClick={(event) => {
                if (
                    closeOnBackdropClick &&
                    event.target === backdropRef.current
                )
                    requestClose()
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100000,
                background: overlayColor || "rgba(0,0,0,0.9)",
                opacity: 1,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(10px, 3vw, 30px)",
                cursor: showCloseCursor ? "none" : "default",
                overflow: "hidden",
            }}
        >
            <div
                ref={panelRef}
                onPointerMove={(event) => event.stopPropagation()}
                style={{
                    width: "min(1120px, 100%)",
                    maxHeight: "calc(100dvh - 20px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    position: "relative",
                    opacity: 1,
                    visibility: "visible",
                    willChange: "transform",
                    ...font,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        color: "#fff",
                        padding: "0 52px 0 4px",
                        minHeight: 36,
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                ...lightboxTitleFont,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {title || "Gallery"}
                        </div>
                        <div
                            style={{
                                ...lightboxMetaFont,
                                opacity: 0.68,
                                marginTop: 2,
                            }}
                        >
                            {mediaLabel} · {index + 1} of {slides.length}
                            {slide.type === "image" && zoomDisplay > 1
                                ? ` · ${Math.round(zoomDisplay * 100)}%`
                                : ""}
                            {slide.type === "image" &&
                            Math.abs(rotationDisplay) > 1
                                ? ` · ${rotationDisplay}°`
                                : ""}
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: 7,
                            alignItems: "center",
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                        }}
                    >
                        {slides.length > 1 && !compareEnabled && (
                            <button
                                type="button"
                                onClick={() => setIsPlaying((value) => !value)}
                                aria-label={
                                    isPlaying
                                        ? "Pause slideshow"
                                        : "Play slideshow"
                                }
                                style={toolbarButtonStyle}
                            >
                                {isPlaying ? "Pause" : "Play"}
                            </button>
                        )}
                        {canCompare && !compareEnabled && (
                            <button
                                type="button"
                                onClick={beginCompare}
                                aria-label="Compare two images"
                                style={toolbarButtonStyle}
                            >
                                Compare
                            </button>
                        )}
                        {compareEnabled && (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCompareMode((mode) =>
                                            mode === "before-after"
                                                ? "side-by-side"
                                                : "before-after"
                                        )
                                    }
                                    aria-label="Change comparison layout"
                                    style={toolbarButtonStyle}
                                >
                                    {compareMode === "before-after"
                                        ? "Side by side"
                                        : "Before / after"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCompareEnabled(false)
                                        setCompareBaseIndex(null)
                                        setCompareIndex(null)
                                    }}
                                    aria-label="Exit image comparison"
                                    style={toolbarButtonStyle}
                                >
                                    Exit compare
                                </button>
                            </>
                        )}
                        {showFavorite && !compareEnabled && (
                            <button
                                type="button"
                                onClick={toggleFavorite}
                                aria-label="Favorite current item"
                                aria-pressed={favoriteIds.includes(
                                    currentFavoriteId
                                )}
                                style={toolbarButtonStyle}
                            >
                                {favoriteIds.includes(currentFavoriteId)
                                    ? "♥"
                                    : "♡"}
                            </button>
                        )}
                        {showShare && (
                            <button
                                type="button"
                                onClick={shareCurrent}
                                aria-label="Share current item"
                                style={toolbarButtonStyle}
                            >
                                Share
                            </button>
                        )}
                        {showFullscreen && (
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                aria-label={
                                    isFullscreen
                                        ? "Exit fullscreen"
                                        : "Enter fullscreen"
                                }
                                style={toolbarButtonStyle}
                            >
                                {isFullscreen ? "Exit full" : "Fullscreen"}
                            </button>
                        )}
                        {slide.type === "image" &&
                            Math.abs(rotationDisplay) > 1 && (
                                <button
                                    type="button"
                                    onClick={() => resetRotation(true)}
                                    aria-label="Reset image rotation"
                                    style={toolbarButtonStyle}
                                >
                                    Reset rotation
                                </button>
                            )}
                        {slide.type === "image" && zoomDisplay > 1 && (
                            <button
                                type="button"
                                onClick={() => resetZoom(true)}
                                aria-label="Reset image zoom"
                                style={toolbarButtonStyle}
                            >
                                Reset zoom
                            </button>
                        )}
                    </div>
                </div>
                <div
                    ref={imageStageRef}
                    onPointerDown={(event) => {
                        if (isInteractiveTarget(event.target)) return
                        handleMediaPointerDown(event)
                    }}
                    onPointerMove={(event) => {
                        if (isInteractiveTarget(event.target)) return
                        handleMediaPointerMove(event)
                    }}
                    onPointerUp={(event) => {
                        if (isInteractiveTarget(event.target)) return
                        handleMediaPointerUp(event)
                    }}
                    onPointerCancel={(event) => {
                        if (isInteractiveTarget(event.target)) return
                        handleMediaPointerUp(event)
                    }}
                    onDoubleClick={(event) => {
                        if (compareEnabled || slide.type !== "image") return
                        event.preventDefault()
                        zoomRef.current > 1
                            ? resetZoom(true)
                            : applyImageTransform(2.5, 0, 0, true)
                    }}
                    onWheel={(event) => {
                        if (compareEnabled || slide.type !== "image") return
                        event.preventDefault()
                        const amount = event.deltaY > 0 ? -0.28 : 0.28
                        applyImageTransform(
                            zoomRef.current + amount,
                            panRef.current.x,
                            panRef.current.y,
                            true
                        )
                    }}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "min(72vh, 760px)",
                        minHeight: 240,
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "#090909",
                        boxShadow: "0 32px 110px rgba(0,0,0,.62)",
                        touchAction: compareEnabled
                            ? "none"
                            : slide.type === "image"
                              ? "none"
                              : "pan-y",
                        cursor: compareEnabled
                            ? compareMode === "before-after"
                                ? "ew-resize"
                                : "default"
                            : slide.type === "image"
                              ? zoomDisplay > 1
                                  ? "grab"
                                  : "zoom-in"
                              : "default",
                    }}
                >
                    {compareEnabled && compareBaseSlide && compareSlide && (
                        <div
                            data-lightbox-compare="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 30,
                                display:
                                    compareMode === "side-by-side"
                                        ? "grid"
                                        : "block",
                                gridTemplateColumns:
                                    compareMode === "side-by-side"
                                        ? "1fr 1fr"
                                        : undefined,
                                gap:
                                    compareMode === "side-by-side"
                                        ? 2
                                        : undefined,
                                background: "#090909",
                                userSelect: "none",
                                touchAction: "none",
                            }}
                            onPointerDown={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                if (compareMode !== "before-after") return
                                compareDragRef.current = {
                                    pointerId: event.pointerId,
                                    element: event.currentTarget,
                                }
                                event.currentTarget.setPointerCapture?.(
                                    event.pointerId
                                )
                                updateComparePosition(
                                    event.clientX,
                                    event.currentTarget
                                )
                            }}
                            onPointerMove={(event) => {
                                const drag = compareDragRef.current
                                if (
                                    compareMode !== "before-after" ||
                                    !drag ||
                                    drag.pointerId !== event.pointerId
                                )
                                    return
                                event.preventDefault()
                                event.stopPropagation()
                                updateComparePosition(
                                    event.clientX,
                                    drag.element
                                )
                            }}
                            onPointerUp={(event) => {
                                const drag = compareDragRef.current
                                if (!drag || drag.pointerId !== event.pointerId)
                                    return
                                event.preventDefault()
                                event.stopPropagation()
                                updateComparePosition(
                                    event.clientX,
                                    drag.element
                                )
                                compareDragRef.current = null
                            }}
                        >
                            <img
                                src={compareBaseSlide.src}
                                alt={`${compareBaseSlide.label || title || "Image"} A`}
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    display: "block",
                                }}
                            />
                            {compareMode === "side-by-side" ? (
                                <img
                                    src={compareSlide.src}
                                    alt={`${compareSlide.label || title || "Image"} B`}
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <>
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            clipPath: `inset(0 ${100 - comparePosition}% 0 0)`,
                                        }}
                                    >
                                        <img
                                            src={compareSlide.src}
                                            alt={`${compareSlide.label || title || "Image"} B`}
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                display: "block",
                                            }}
                                        />
                                    </div>
                                    <div
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            bottom: 0,
                                            left: `${comparePosition}%`,
                                            width: 2,
                                            transform: "translateX(-1px)",
                                            background: "#fff",
                                            boxShadow:
                                                "0 0 0 1px rgba(0,0,0,.25)",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <span
                                            style={{
                                                position: "absolute",
                                                left: "50%",
                                                top: "50%",
                                                transform:
                                                    "translate(-50%, -50%)",
                                                width: 42,
                                                height: 42,
                                                borderRadius: "50%",
                                                display: "grid",
                                                placeItems: "center",
                                                background: "#fff",
                                                color: "#111",
                                                boxShadow:
                                                    "0 8px 28px rgba(0,0,0,.35)",
                                                fontSize: 18,
                                            }}
                                        >
                                            ↔
                                        </span>
                                    </div>
                                </>
                            )}
                            <span
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    bottom: 12,
                                    padding: "6px 9px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,.62)",
                                    color: "#fff",
                                    fontSize: 10,
                                    pointerEvents: "none",
                                }}
                            >
                                A
                            </span>
                            <span
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    bottom: 12,
                                    padding: "6px 9px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,.62)",
                                    color: "#fff",
                                    fontSize: 10,
                                    pointerEvents: "none",
                                }}
                            >
                                B
                            </span>
                        </div>
                    )}
                    {mediaStatus === "loading" && !compareEnabled && (
                        <div
                            aria-label="Loading media"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems: "center",
                                zIndex: 2,
                                color: "#fff",
                            }}
                        >
                            <span
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    border: "3px solid rgba(255,255,255,.2)",
                                    borderTopColor: "#fff",
                                    animation:
                                        "lightboxSpin .8s linear infinite",
                                }}
                            />
                        </div>
                    )}
                    {!compareEnabled &&
                    (mediaStatus === "error" || invalidEmbed) ? (
                        <div
                            role="alert"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                textAlign: "center",
                                padding: 24,
                            }}
                        >
                            <div style={{ fontSize: 34 }}>⚠</div>
                            <strong>
                                {invalidEmbed
                                    ? "Invalid video URL"
                                    : "Media could not be loaded"}
                            </strong>
                            <span style={{ opacity: 0.68, fontSize: 13 }}>
                                {invalidEmbed
                                    ? "Use a valid YouTube or Vimeo URL."
                                    : "Choose another item or try again."}
                            </span>
                            {!invalidEmbed && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMediaStatus("loading")
                                        setRetryKey((value) => value + 1)
                                    }}
                                    style={{
                                        marginTop: 4,
                                        padding: "10px 14px",
                                        borderRadius: 999,
                                        border: "1px solid rgba(255,255,255,.3)",
                                        background: "rgba(255,255,255,.1)",
                                        color: "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    ) : (
                        <div
                            key={`${index}-${slide.src}-${retryKey}`}
                            ref={mediaRef}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                willChange: "transform, opacity, filter",
                                animation:
                                    isPlaying && slide.type === "image"
                                        ? slideshowEffect === "ken-burns"
                                            ? `galleryKenBurns ${Math.max(2, autoplayDelay)}s ease-in-out both`
                                            : slideshowEffect === "zoom"
                                              ? `gallerySlideZoom ${Math.max(1, autoplayDelay)}s ease both`
                                              : undefined
                                        : undefined,
                            }}
                        >
                            {slide.type === "image" ? (
                                <img
                                    ref={imageRef}
                                    src={slide.src}
                                    alt={`${title || "Gallery item"} ${index + 1}`}
                                    draggable={false}
                                    onLoad={() => setMediaStatus("loaded")}
                                    onError={() => setMediaStatus("error")}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                        opacity:
                                            mediaStatus === "loaded" ? 1 : 0,
                                        userSelect: "none",
                                        WebkitUserDrag: "none",
                                        willChange: "transform",
                                        transformOrigin: "50% 50%",
                                    }}
                                />
                            ) : slide.type === "youtube" && youtubeId ? (
                                <iframe
                                    title={`${title || "Video"} ${index + 1}`}
                                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                                    onLoad={() => setMediaStatus("loaded")}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: 0,
                                        background: "#000",
                                        opacity:
                                            mediaStatus === "loaded" ? 1 : 0,
                                    }}
                                />
                            ) : slide.type === "vimeo" && vimeoId ? (
                                <iframe
                                    title={`${title || "Vimeo video"} ${index + 1}`}
                                    src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                                    onLoad={() => setMediaStatus("loaded")}
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: 0,
                                        background: "#000",
                                        opacity:
                                            mediaStatus === "loaded" ? 1 : 0,
                                    }}
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    src={slide.src}
                                    poster={slide.fallbackImage || undefined}
                                    controls
                                    autoPlay
                                    playsInline
                                    preload="auto"
                                    onCanPlay={() => setMediaStatus("loaded")}
                                    onError={() => setMediaStatus("error")}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                        opacity:
                                            mediaStatus === "loaded" ? 1 : 0,
                                    }}
                                />
                            )}
                        </div>
                    )}
                    {!compareEnabled && showLikeBurst && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 12,
                                fontSize: "clamp(64px, 14vw, 130px)",
                                filter: "drop-shadow(0 12px 30px rgba(0,0,0,.45))",
                                animation: "galleryLikeBurst .7s ease both",
                                pointerEvents: "none",
                            }}
                        >
                            ♥
                        </div>
                    )}
                    <button
                        type="button"
                        data-lightbox-control="true"
                        onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            requestClose()
                        }}
                        aria-label="Close lightbox"
                        style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,.3)",
                            background: "rgba(0,0,0,.64)",
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            touchAction: "manipulation",
                            pointerEvents: "auto",
                        }}
                    >
                        <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            aria-hidden="true"
                            pointerEvents="none"
                        >
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                    {!compareEnabled &&
                        slides.length > 1 &&
                        zoomDisplay <= 1.01 && (
                            <>
                                <button
                                    type="button"
                                    data-lightbox-control="true"
                                    onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        previous()
                                    }}
                                    aria-label="Previous media"
                                    style={{
                                        position: "absolute",
                                        left: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        border: "1px solid rgba(255,255,255,.28)",
                                        background: "rgba(0,0,0,.58)",
                                        color: "#fff",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 10,
                                        touchAction: "manipulation",
                                        pointerEvents: "auto",
                                    }}
                                >
                                    <svg
                                        width="21"
                                        height="21"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        aria-hidden="true"
                                        pointerEvents="none"
                                    >
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    data-lightbox-control="true"
                                    onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        next()
                                    }}
                                    aria-label="Next media"
                                    style={{
                                        position: "absolute",
                                        right: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        border: "1px solid rgba(255,255,255,.28)",
                                        background: "rgba(0,0,0,.58)",
                                        color: "#fff",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 10,
                                        touchAction: "manipulation",
                                        pointerEvents: "auto",
                                    }}
                                >
                                    <svg
                                        width="21"
                                        height="21"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        aria-hidden="true"
                                        pointerEvents="none"
                                    >
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </button>
                            </>
                        )}
                    {!compareEnabled &&
                        slide.type === "image" &&
                        mediaStatus === "loaded" &&
                        zoomDisplay === 1 && (
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    bottom: 12,
                                    transform: "translateX(-50%)",
                                    padding: "7px 11px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,.48)",
                                    color: "rgba(255,255,255,.78)",
                                    fontSize: 10,
                                    pointerEvents: "none",
                                    backdropFilter: "blur(8px)",
                                }}
                            >
                                Double-click, wheel, or pinch to zoom
                            </div>
                        )}
                </div>
                {(showCaption && (slide.label || slide.description)) ||
                shareStatus ? (
                    <div
                        aria-live="polite"
                        style={{
                            color: "#fff",
                            padding: "2px 4px 0",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 18,
                            alignItems: "flex-start",
                        }}
                    >
                        <div style={{ minWidth: 0 }}>
                            {showCaption && slide.label && (
                                <div style={{ ...captionTitleFont }}>
                                    {slide.label}
                                </div>
                            )}
                            {showCaption && slide.description && (
                                <div
                                    style={{
                                        ...captionDescriptionFont,
                                        opacity: 0.68,
                                        marginTop: 3,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {slide.description}
                                </div>
                            )}
                        </div>
                        {shareStatus && (
                            <div
                                style={{
                                    fontSize: 11,
                                    opacity: 0.8,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {shareStatus}
                            </div>
                        )}
                    </div>
                ) : null}
                {showThumbnails && slides.length > 1 && (
                    <div
                        ref={thumbnailsRef}
                        role="list"
                        aria-label="Gallery thumbnails"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            gap: "clamp(6px, 1.5vw, 10px)",
                            overflowX: "auto",
                            overflowY: "hidden",
                            maxWidth: "100%",
                            padding: "6px 4px",
                            margin: "0 auto",
                            scrollbarWidth: "thin",
                            WebkitOverflowScrolling: "touch",
                            scrollSnapType: "x proximity",
                            position: "relative",
                            zIndex: 20,
                            pointerEvents: "auto",
                            touchAction: "pan-x",
                        }}
                    >
                        {slides.map(renderThumbnail)}
                    </div>
                )}
            </div>
            {showShortcuts && showShortcutHelp && (
                <div
                    role="dialog"
                    aria-label="Keyboard shortcuts"
                    onClick={() => setShowShortcuts(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 100010,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(0,0,0,.5)",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(420px, calc(100vw - 32px))",
                            padding: 24,
                            borderRadius: 18,
                            background: "#151515",
                            border: "1px solid rgba(255,255,255,.16)",
                            color: "#fff",
                            boxShadow: "0 30px 90px rgba(0,0,0,.55)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                marginBottom: 16,
                            }}
                        >
                            Keyboard shortcuts
                        </div>
                        {[
                            ["← / →", "Previous / next"],
                            ["Esc", "Close"],
                            ["F", "Fullscreen"],
                            ["Space", "Play / pause"],
                            ["+ / −", "Zoom"],
                            ["0", "Reset zoom"],
                            ["?", "Show / hide shortcuts"],
                        ].map(([key, action]) => (
                            <div
                                key={key}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 24,
                                    padding: "9px 0",
                                    borderBottom:
                                        "1px solid rgba(255,255,255,.08)",
                                    fontSize: 13,
                                }}
                            >
                                <kbd
                                    style={{
                                        padding: "3px 8px",
                                        borderRadius: 6,
                                        background: "rgba(255,255,255,.1)",
                                        fontFamily: "inherit",
                                    }}
                                >
                                    {key}
                                </kbd>
                                <span style={{ opacity: 0.72 }}>{action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div
                ref={closeCursorRef}
                aria-hidden="true"
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    width: cursorSize,
                    height: cursorSize,
                    marginLeft: -cursorSize / 2,
                    marginTop: -cursorSize / 2,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,.32)",
                    background: "rgba(18,18,18,.5)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 100002,
                    opacity: showCloseCursor ? 1 : 0,
                    scale: showCloseCursor ? "1" : ".72",
                    transition: "opacity .18s ease, scale .18s ease",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow: "0 10px 32px rgba(0,0,0,.32)",
                }}
            >
                <svg
                    width={Math.max(17, cursorSize * 0.36)}
                    height={Math.max(17, cursorSize * 0.36)}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </div>
            <style>{`@keyframes lightboxSpin{to{transform:rotate(360deg)}} @keyframes galleryKenBurns{from{transform:scale(1)}to{transform:scale(1.12) translate3d(-1.5%,-1%,0)}} @keyframes gallerySlideZoom{from{transform:scale(.96);opacity:.35}to{transform:scale(1);opacity:1}} @keyframes galleryLikeBurst{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}35%{opacity:1;transform:translate(-50%,-50%) scale(1.18)}100%{opacity:0;transform:translate(-50%,-50%) scale(1)} } @media(max-width:480px){button[aria-label="Previous media"],button[aria-label="Next media"]{width:38px!important;height:38px!important}} @media(pointer:coarse){div[aria-hidden="true"]{pointer-events:none}}`}</style>
        </div>,
        document.body
    )
}

type GalleryItem = {
    id?: string
    type?: "image" | "video" | "youtube" | "vimeo"
    image?: string
    videoFile?: string
    videoUrl?: string
    fallbackImage?: string
    label?: string
    alt?: string
    description?: string
    tags?: string[]
    collection?: string
    aspectRatio?: string
    date?: string
    showButton?: boolean
    buttonText?: string
    buttonLink?: string
    buttonNewTab?: boolean
}

type GallerySettings = {
    layout?:
        | "grid"
        | "masonry"
        | "justified"
        | "pinterest"
        | "magazine"
        | "bento"
        | "metro"
        | "alternating"
        | "hero-grid"
    enableInfiniteLoading?: boolean
    initialItemCount?: number
    loadMoreCount?: number
    columns?: number
    gap?: number
    borderRadius?: number
    imageFit?: "cover" | "contain"
    cardAspectRatio?: string
    backgroundColor?: string
    showLabels?: boolean
    showSort?: boolean
    defaultSort?: "newest" | "oldest" | "az" | "za" | "random" | "favorites"
    semanticSearch?: boolean
}

type BadgeSettings = {
    enabled?: boolean
    text?: string
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    background?: string
    textColor?: string
    borderColor?: string
    radius?: number
    fontSize?: number
    paddingX?: number
    paddingY?: number
}

type CardButtonSettings = {
    enabled?: boolean
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    background?: string
    textColor?: string
    borderColor?: string
    radius?: number
    fontSize?: number
    paddingX?: number
    paddingY?: number
    showArrow?: boolean
}

type FilterSettings = {
    showSearch?: boolean
    searchPlaceholder?: string
    searchAriaLabel?: string
    searchIcon?: "search" | "none"
    searchWidth?: number
    searchHeight?: number
    searchRadius?: number
    searchFontSize?: number
    searchBackground?: string
    searchBorder?: string
    searchFocusBorder?: string
    searchTextColor?: string
    searchPlaceholderColor?: string
    searchIconColor?: string
    searchClearColor?: string
    searchShadow?: string
    searchFocusShadow?: string
    searchLabel?: boolean
    searchDescription?: boolean
    searchTags?: boolean
    searchCollection?: boolean
    showMediaFilters?: boolean
    showCollections?: boolean
    showTags?: boolean
    multiSelectTags?: boolean
    tagLogic?: "and" | "or"
    showActiveFilters?: boolean
    showClearAll?: boolean
    showResultCount?: boolean
    showFilterCounts?: boolean
    style?: "pills" | "underline" | "minimal"
    gap?: number
    containerBackground?: string
    containerBorder?: string
    containerRadius?: number
    containerPadding?: number
    containerShadow?: string
    textColor?: string
    inactiveBackground?: string
    inactiveBorder?: string
    hoverBackground?: string
    hoverTextColor?: string
    activeBackground?: string
    activeTextColor?: string
}

type NativeFontStyle = React.CSSProperties

type TypographySettings = {
    font?: NativeFontStyle
    searchFont?: NativeFontStyle
    filterFont?: NativeFontStyle
    tagFont?: NativeFontStyle
    cardLabelFont?: NativeFontStyle
    cardButtonFont?: NativeFontStyle
    badgeFont?: NativeFontStyle
    lightboxTitleFont?: NativeFontStyle
    lightboxMetaFont?: NativeFontStyle
    toolbarFont?: NativeFontStyle
    captionTitleFont?: NativeFontStyle
    captionDescriptionFont?: NativeFontStyle
    emptyTitleFont?: NativeFontStyle
}

type LightboxSettings = {
    showThumbnails?: boolean
    showCaption?: boolean
    showFavorite?: boolean
    showShare?: boolean
    showFullscreen?: boolean
    autoplay?: boolean
    autoplayDelay?: number
    transitionStyle?: "zoom" | "fade" | "slide" | "blur"
    slideshowEffect?: "fade" | "crossfade" | "zoom" | "ken-burns"
    showShortcutHelp?: boolean
    animationDuration?: number
    overlayColor?: string
    cursorSize?: number
    closeOnBackdropClick?: boolean
}

type AnimationSettings = {
    animateFiltering?: boolean
    animateImageClick?: boolean
    filterAnimationDuration?: number
    filterAnimationStagger?: number
}

type GalleryOnlyProps = {
    items?: GalleryItem[]
    title?: string
    gallerySettings?: GallerySettings
    imageBadge?: BadgeSettings
    videoBadge?: BadgeSettings
    youtubeBadge?: BadgeSettings
    vimeoBadge?: BadgeSettings
    cardButtonSettings?: CardButtonSettings
    filterSettings?: FilterSettings
    typographySettings?: TypographySettings
    lightboxSettings?: LightboxSettings
    animationSettings?: AnimationSettings
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: GalleryItem[] = [
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=85",
        label: "Seasonal bowl",
        description: "Fresh ingredients photographed in natural light.",
        tags: ["Nature", "Food"],
        collection: "Editorial",
        aspectRatio: "4 / 5",
        showButton: false,
        buttonText: "View Project",
        buttonLink: "",
        buttonNewTab: false,
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=85",
        label: "Artisan pizza",
        description: "Wood-fired crust with a simple, modern presentation.",
        tags: ["Travel", "Food"],
        collection: "Travel Stories",
        aspectRatio: "1 / 1",
    },
    {
        type: "image",
        image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=85",
        label: "Dessert detail",
        description: "A close-up composition for editorial or portfolio work.",
        tags: ["Wedding", "Portrait"],
        collection: "People",
        aspectRatio: "5 / 4",
    },
]

function resolveGalleryItem(item: GalleryItem) {
    const type = item.type || "image"
    const src =
        type === "image"
            ? item.image || ""
            : type === "video"
              ? item.videoFile || ""
              : item.videoUrl || ""
    return {
        id: item.id || `${type}:${src}`,
        type,
        src,
        fallbackImage:
            type === "image" ? item.image || "" : item.fallbackImage || "",
        label: item.label || "",
        alt: item.alt || item.label || "",
        description: item.description || "",
        tags: (item.tags || [])
            .map((tag) => String(tag).trim())
            .filter(Boolean),
        collection: String(item.collection || "").trim(),
        aspectRatio: item.aspectRatio || "1 / 1",
        date: String(item.date || ""),
        showButton: item.showButton ?? false,
        buttonText: String(item.buttonText || "View").trim() || "View",
        buttonLink: String(item.buttonLink || "").trim(),
        buttonNewTab: item.buttonNewTab ?? false,
    } as {
        id: string
        type: "image" | "video" | "youtube" | "vimeo"
        src: string
        label: string
        alt: string
        description: string
        tags: string[]
        collection: string
        fallbackImage: string
        aspectRatio: string
        date: string
        showButton: boolean
        buttonText: string
        buttonLink: string
        buttonNewTab: boolean
    }
}

function getFilterButtonStyle(
    active: boolean,
    style: "pills" | "underline" | "minimal",
    size: "category" | "tag",
    textColor: string,
    inactiveBackground: string,
    inactiveBorder: string,
    activeBackground: string,
    activeTextColor: string,
    categoryFont: React.CSSProperties = {
        fontSize: "13px",
        fontWeight: 600,
        lineHeight: "1em",
    },
    tagFont: React.CSSProperties = {
        fontSize: "12px",
        fontWeight: 500,
        lineHeight: "1em",
    }
): React.CSSProperties {
    const base: React.CSSProperties = {
        appearance: "none",
        ...(size === "category" ? categoryFont : tagFont),
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition:
            "transform .2s ease, background .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease",
        WebkitTapHighlightColor: "transparent",
    }

    if (style === "underline") {
        return {
            ...base,
            padding: size === "category" ? "10px 2px" : "8px 2px",
            color: active ? activeBackground : textColor,
            background: "transparent",
            border: 0,
            borderBottom: active
                ? `2px solid ${activeBackground}`
                : "2px solid transparent",
            borderRadius: 0,
        }
    }

    if (style === "minimal") {
        return {
            ...base,
            padding: size === "category" ? "10px 14px" : "8px 12px",
            color: active ? activeTextColor : textColor,
            background: active ? activeBackground : "transparent",
            border: "1px solid transparent",
            borderRadius: 9,
            opacity: active ? 1 : 0.82,
        }
    }

    return {
        ...base,
        padding: size === "category" ? "10px 18px" : "8px 14px",
        color: active ? activeTextColor : textColor,
        background: active ? activeBackground : inactiveBackground,
        border: `1px solid ${active ? activeBackground : inactiveBorder}`,
        borderRadius: 999,
        boxShadow: active ? "0 4px 14px rgba(0,0,0,.12)" : "none",
    }
}

function applyFilterHover(
    element: HTMLButtonElement,
    active: boolean,
    style: "pills" | "underline" | "minimal",
    hoverBackground: string,
    hoverTextColor: string,
    inactiveBackground: string,
    textColor: string
) {
    if (active) return
    element.style.transform = "translateY(-1px)"
    element.style.color = hoverTextColor
    if (style !== "underline") element.style.background = hoverBackground
}

function clearFilterHover(
    element: HTMLButtonElement,
    active: boolean,
    style: "pills" | "underline" | "minimal",
    inactiveBackground: string,
    textColor: string
) {
    if (active) return
    element.style.transform = "translateY(0)"
    element.style.color = textColor
    if (style === "pills") element.style.background = inactiveBackground
    else if (style === "minimal") element.style.background = "transparent"
}

function stableHash(value: string): number {
    let hash = 2166136261
    for (let index = 0; index < value.length; index++) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
}

function ProgressiveGalleryImage({
    src,
    alt,
    fit,
    loadImmediately = false,
    isStatic = false,
}: {
    src: string
    alt: string
    fit: "cover" | "contain"
    loadImmediately?: boolean
    isStatic?: boolean
}) {
    const [loaded, setLoaded] = useState(isStatic || loadImmediately)
    const [failed, setFailed] = useState(false)
    return (
        <>
            {!loaded && !failed && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(100deg, rgba(255,255,255,.06) 20%, rgba(255,255,255,.15) 40%, rgba(255,255,255,.06) 60%)",
                        backgroundSize: "220% 100%",
                        animation: isStatic
                            ? "none"
                            : "gallerySkeleton 1.25s ease-in-out infinite",
                    }}
                />
            )}
            <img
                src={src}
                alt={alt}
                loading={loadImmediately ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: fit,
                    opacity: loaded ? 1 : 0,
                    filter: loaded ? "blur(0px)" : "blur(18px)",
                    transform: loaded ? "scale(1)" : "scale(1.035)",
                    transition: isStatic
                        ? "none"
                        : "opacity .5s ease, filter .7s ease, transform .7s cubic-bezier(.2,.8,.2,1)",
                }}
            />
        </>
    )
}

/**
 * Premium standalone gallery using the lightbox extracted from the menu component.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function LightboxGalleryComponent(props: GalleryOnlyProps) {
    const {
        items = DEFAULT_ITEMS,
        title = "Gallery",
        gallerySettings = {},
        imageBadge = {},
        videoBadge = {},
        youtubeBadge = {},
        vimeoBadge = {},
        cardButtonSettings = {},
        filterSettings = {},
        typographySettings = {},
        lightboxSettings = {},
        animationSettings = {},
        style,
    } = props

    const {
        layout = "grid",
        enableInfiniteLoading = true,
        initialItemCount = 24,
        loadMoreCount = 24,
        columns = 3,
        gap = 12,
        borderRadius = 12,
        imageFit = "cover",
        cardAspectRatio = "1 / 1",
        backgroundColor = "#FFFFFF",
        showLabels = false,
        showSort = true,
        defaultSort = "newest",
        semanticSearch = true,
    } = gallerySettings

    const {
        enabled: cardButtonsEnabled = true,
        position: cardButtonPosition = "bottom-right",
        background: cardButtonBackground = "#FFFFFF",
        textColor: cardButtonTextColor = "#111111",
        borderColor: cardButtonBorderColor = "rgba(17,17,17,0.14)",
        radius: cardButtonRadius = 999,
        fontSize: cardButtonFontSize = 12,
        paddingX: cardButtonPaddingX = 14,
        paddingY: cardButtonPaddingY = 10,
        showArrow: cardButtonShowArrow = true,
    } = cardButtonSettings

    const {
        showSearch = true,
        searchPlaceholder = "Search gallery…",
        searchAriaLabel = "Search gallery",
        searchIcon = "search",
        searchWidth = 100,
        searchHeight = 46,
        searchRadius = 14,
        searchFontSize = 14,
        searchBackground = "#FFFFFF",
        searchBorder = "#E7E7E7",
        searchFocusBorder = "#111111",
        searchTextColor = "#222222",
        searchPlaceholderColor = "#8A8A8A",
        searchIconColor = "#777777",
        searchClearColor = "#555555",
        searchShadow = "none",
        searchFocusShadow = "0 0 0 3px rgba(17,17,17,.08)",
        searchLabel = true,
        searchDescription = true,
        searchTags = true,
        searchCollection = true,
        showMediaFilters = true,
        showCollections = true,
        showTags = true,
        multiSelectTags = true,
        tagLogic = "or",
        showActiveFilters = true,
        showClearAll = true,
        showResultCount = true,
        showFilterCounts = false,
        style: filterStyle = "pills",
        gap: filterGap = 10,
        containerBackground: filterContainerBackground = "#FFFFFF",
        containerBorder: filterContainerBorder = "#ECECEC",
        containerRadius: filterContainerRadius = 18,
        containerPadding: filterContainerPadding = 18,
        containerShadow: filterContainerShadow = "0 10px 35px rgba(0,0,0,.04)",
        textColor: filterTextColor = "#555555",
        inactiveBackground: filterInactiveBackground = "#FFFFFF",
        inactiveBorder: filterInactiveBorder = "#E7E7E7",
        hoverBackground: filterHoverBackground = "#F5F5F5",
        hoverTextColor: filterHoverTextColor = "#111111",
        activeBackground: filterActiveBackground = "#111111",
        activeTextColor: filterActiveTextColor = "#FFFFFF",
    } = filterSettings

    const {
        font = {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "1.45em",
            letterSpacing: "0em",
        },
        searchFont = {
            fontSize: `${searchFontSize}px`,
            fontWeight: 400,
            lineHeight: "1em",
        },
        filterFont = {
            fontSize: "13px",
            fontWeight: 600,
            lineHeight: "1em",
            letterSpacing: "-0.01em",
        },
        tagFont = { fontSize: "12px", fontWeight: 500, lineHeight: "1em" },
        cardLabelFont = {
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: "1.3em",
        },
        cardButtonFont = {
            fontSize: `${cardButtonFontSize}px`,
            fontWeight: 600,
            lineHeight: "1em",
        },
        badgeFont = {
            fontSize: "10px",
            fontWeight: 600,
            lineHeight: "1em",
            letterSpacing: "0.04em",
        },
        emptyTitleFont = {
            fontSize: "16px",
            fontWeight: 600,
            lineHeight: "1.3em",
        },
    } = typographySettings

    const {
        showThumbnails = true,
        showCaption = true,
        showFavorite = true,
        showShare = true,
        showFullscreen = true,
        autoplay = false,
        autoplayDelay = 4,
        transitionStyle = "zoom",
        slideshowEffect = "fade",
        showShortcutHelp = true,
        animationDuration = 0.42,
        overlayColor = "rgba(0,0,0,0.9)",
        cursorSize = 58,
        closeOnBackdropClick = true,
    } = lightboxSettings

    const {
        animateFiltering = true,
        animateImageClick = true,
        filterAnimationDuration = 0.42,
        filterAnimationStagger = 0.045,
    } = animationSettings

    const isStatic = useIsStaticRenderer()
    const galleryRef = useRef<HTMLDivElement>(null)
    const previousCardRectsRef = useRef(new Map<string, DOMRect>())
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const [originRect, setOriginRect] = useState<{
        left: number
        top: number
        width: number
        height: number
    } | null>(null)
    const loadMoreRef = useRef<HTMLDivElement>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchFocused, setSearchFocused] = useState(false)
    const [visibleCount, setVisibleCount] = useState(
        Math.max(1, Math.round(initialItemCount))
    )
    const [activeMedia, setActiveMedia] = useState<
        "all" | "photos" | "videos" | "youtube" | "vimeo" | "favorites"
    >("all")
    const [activeCollection, setActiveCollection] = useState("all")
    const [sortMode, setSortMode] = useState(defaultSort)
    const [activeTags, setActiveTags] = useState<string[]>([])
    const [favoriteIds, setFavoriteIds] = useState<string[]>([])
    const resolvedItems = useMemo(
        () => items.map(resolveGalleryItem).filter((item) => item.src),
        [items]
    )

    useEffect(() => {
        if (isStatic) return
        const readFavorites = () => {
            try {
                const stored = window.localStorage.getItem(
                    "framer-lightbox-favorites"
                )
                setFavoriteIds(stored ? JSON.parse(stored) : [])
            } catch {
                setFavoriteIds([])
            }
        }
        const handleFavoriteChange = (event: Event) => {
            const customEvent = event as CustomEvent<string[]>
            if (Array.isArray(customEvent.detail))
                setFavoriteIds(customEvent.detail)
            else readFavorites()
        }
        readFavorites()
        window.addEventListener("storage", readFavorites)
        window.addEventListener(
            "framer-lightbox-favorites-change",
            handleFavoriteChange
        )
        return () => {
            window.removeEventListener("storage", readFavorites)
            window.removeEventListener(
                "framer-lightbox-favorites-change",
                handleFavoriteChange
            )
        }
    }, [isStatic])

    const allCollections = useMemo(
        () =>
            Array.from(
                new Set(
                    resolvedItems.map((item) => item.collection).filter(Boolean)
                )
            ).sort(),
        [resolvedItems]
    )

    const allTags = useMemo(
        () =>
            Array.from(
                new Set(resolvedItems.flatMap((item) => item.tags))
            ).sort(),
        [resolvedItems]
    )

    const mediaCounts = useMemo(
        () => ({
            all: resolvedItems.length,
            photos: resolvedItems.filter((item) => item.type === "image")
                .length,
            videos: resolvedItems.filter((item) => item.type === "video")
                .length,
            youtube: resolvedItems.filter((item) => item.type === "youtube")
                .length,
            vimeo: resolvedItems.filter((item) => item.type === "vimeo").length,
            favorites: resolvedItems.filter((item) =>
                favoriteIds.includes(item.id)
            ).length,
        }),
        [favoriteIds, resolvedItems]
    )

    const filteredItems = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase()
        const tokens = semanticSearch
            ? semanticTokens(normalizedQuery)
            : [normalizedQuery]
        const matches = resolvedItems.filter((item) => {
            const searchableText = [
                searchLabel ? item.label : "",
                searchDescription ? item.description : "",
                searchCollection ? item.collection : "",
                ...(searchTags ? item.tags : []),
            ]
                .join(" ")
                .toLowerCase()
            const matchesSearch =
                !normalizedQuery ||
                tokens.some((token) => searchableText.includes(token))
            const matchesMedia =
                activeMedia === "all" ||
                (activeMedia === "photos" && item.type === "image") ||
                (activeMedia === "videos" && item.type === "video") ||
                (activeMedia === "youtube" && item.type === "youtube") ||
                (activeMedia === "vimeo" && item.type === "vimeo") ||
                (activeMedia === "favorites" && favoriteIds.includes(item.id))
            const matchesCollection =
                activeCollection === "all" ||
                item.collection === activeCollection
            const matchesTag =
                activeTags.length === 0 ||
                (tagLogic === "and"
                    ? activeTags.every((tag) => item.tags.includes(tag))
                    : activeTags.some((tag) => item.tags.includes(tag)))
            return (
                matchesSearch && matchesMedia && matchesCollection && matchesTag
            )
        })
        const sorted = [...matches]
        if (sortMode === "az")
            sorted.sort((a, b) => a.label.localeCompare(b.label))
        else if (sortMode === "za")
            sorted.sort((a, b) => b.label.localeCompare(a.label))
        else if (sortMode === "newest")
            sorted.sort(
                (a, b) => Date.parse(b.date || "0") - Date.parse(a.date || "0")
            )
        else if (sortMode === "oldest")
            sorted.sort(
                (a, b) => Date.parse(a.date || "0") - Date.parse(b.date || "0")
            )
        else if (sortMode === "favorites")
            sorted.sort(
                (a, b) =>
                    Number(favoriteIds.includes(b.id)) -
                    Number(favoriteIds.includes(a.id))
            )
        else if (sortMode === "random")
            sorted.sort((a, b) => stableHash(a.id) - stableHash(b.id))
        return sorted
    }, [
        activeMedia,
        activeCollection,
        activeTags,
        tagLogic,
        favoriteIds,
        resolvedItems,
        searchQuery,
        sortMode,
        semanticSearch,
        searchLabel,
        searchDescription,
        searchCollection,
        searchTags,
    ])

    useEffect(() => {
        setVisibleCount(Math.max(1, Math.round(initialItemCount)))
    }, [
        activeMedia,
        activeCollection,
        activeTags,
        tagLogic,
        sortMode,
        searchQuery,
        initialItemCount,
    ])

    const visibleItems = useMemo(
        () =>
            enableInfiniteLoading && !isStatic
                ? filteredItems.slice(0, visibleCount)
                : filteredItems,
        [enableInfiniteLoading, filteredItems, visibleCount, isStatic]
    )

    useEffect(() => {
        const sentinel = loadMoreRef.current
        if (
            isStatic ||
            !enableInfiniteLoading ||
            !sentinel ||
            visibleCount >= filteredItems.length
        )
            return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisibleCount((current) =>
                        Math.min(
                            filteredItems.length,
                            current + Math.max(1, Math.round(loadMoreCount))
                        )
                    )
                }
            },
            { rootMargin: "500px 0px" }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [
        enableInfiniteLoading,
        filteredItems.length,
        isStatic,
        loadMoreCount,
        visibleCount,
    ])

    const slides = useMemo(
        () =>
            filteredItems.map(
                ({ id, type, src, label, description, fallbackImage }) => ({
                    id,
                    type,
                    src,
                    label,
                    description,
                    fallbackImage,
                })
            ),
        [filteredItems]
    )

    const openGallery = useCallback(
        (index: number, element?: HTMLElement | null) => {
            if (!slides.length) return

            // Capture the source bounds before any transform is applied.
            if (element && animateImageClick && !isStatic) {
                const rect = element.getBoundingClientRect()
                setOriginRect({
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                })

                // The card animation is decorative only. It must never delay
                // or control the React state that mounts the lightbox.
                gsap.killTweensOf(element)
                gsap.fromTo(
                    element,
                    { scale: 0.965 },
                    {
                        scale: 1,
                        duration: 0.22,
                        ease: "back.out(2)",
                        overwrite: true,
                        clearProps: "transform",
                    }
                )
            } else {
                setOriginRect(null)
            }

            // Open immediately so interrupted GSAP timelines cannot block it.
            setOpenIndex(index)
        },
        [animateImageClick, isStatic, slides.length]
    )
    const closeGallery = useCallback(() => {
        setOpenIndex(null)
        if (isStatic) {
            setOriginRect(null)
            return
        }
        window.setTimeout(() => setOriginRect(null), 450)
    }, [isStatic])

    const animateFilterButton = useCallback(
        (button: HTMLButtonElement) => {
            if (isStatic || !animateFiltering) return
            gsap.fromTo(
                button,
                { scale: 0.92 },
                {
                    scale: 1,
                    duration: Math.min(filterAnimationDuration, 0.38),
                    ease: "back.out(2.4)",
                    overwrite: true,
                }
            )
        },
        [animateFiltering, filterAnimationDuration, isStatic]
    )

    // Recalculate the active grid after filtering. Four visible cards use a
    // three-column 3 + 1 arrangement instead of collapsing into two columns.
    // Every other result count respects the configured column limit while
    // avoiding unused tracks.
    const requestedColumns = Math.max(1, Math.round(columns))
    const visibleItemCount = Math.max(visibleItems.length, 1)
    const preferredColumnCount =
        visibleItems.length === 4
            ? 3
            : Math.min(requestedColumns, visibleItemCount)
    const visibleColumnCount = Math.max(
        1,
        Math.min(preferredColumnCount, visibleItemCount)
    )

    const isMasonryLayout = layout === "masonry" || layout === "pinterest"
    const [galleryWidth, setGalleryWidth] = useState(0)

    useLayoutEffect(() => {
        const gallery = galleryRef.current
        if (isStatic || !gallery || !isMasonryLayout) return

        const updateWidth = () => {
            const nextWidth = gallery.getBoundingClientRect().width
            if (nextWidth <= 0) return
            setGalleryWidth((current) =>
                Math.abs(current - nextWidth) > 0.5 ? nextWidth : current
            )
        }

        updateWidth()

        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(updateWidth)
        observer.observe(gallery)
        return () => observer.disconnect()
    }, [isMasonryLayout, isStatic])

    const masonryLayout = useMemo(() => {
        if (!isMasonryLayout || galleryWidth <= 0) {
            return { positions: [] as React.CSSProperties[], height: 0 }
        }

        const columnCount = Math.max(1, visibleColumnCount)
        const columnWidth = Math.max(
            0,
            (galleryWidth - gap * (columnCount - 1)) / columnCount
        )
        const columnHeights = Array(columnCount).fill(0) as number[]

        const parseAspectRatio = (value: string) => {
            const parts = String(value || "1 / 1")
                .split("/")
                .map((part) => Number(part.trim()))
            const width = parts[0]
            const height = parts[1]
            return width > 0 && height > 0 ? width / height : 1
        }

        const positions = visibleItems.map((item) => {
            let columnIndex = 0
            for (let index = 1; index < columnHeights.length; index += 1) {
                if (columnHeights[index] < columnHeights[columnIndex]) {
                    columnIndex = index
                }
            }

            const ratio = parseAspectRatio(item.aspectRatio)
            const cardHeight = columnWidth / ratio
            const top = columnHeights[columnIndex]
            const left = columnIndex * (columnWidth + gap)
            columnHeights[columnIndex] = top + cardHeight + gap

            return {
                position: "absolute",
                top,
                left,
                width: columnWidth,
                height: cardHeight,
            } as React.CSSProperties
        })

        return {
            positions,
            height:
                Math.max(0, ...columnHeights) - (positions.length ? gap : 0),
        }
    }, [gap, galleryWidth, isMasonryLayout, visibleColumnCount, visibleItems])

    const isEditorialLayout = [
        "magazine",
        "bento",
        "metro",
        "alternating",
        "hero-grid",
    ].includes(layout)
    const galleryStyle: React.CSSProperties =
        isMasonryLayout && isStatic
            ? {
                  width: "100%",
                  columnCount: visibleColumnCount,
                  columnGap: gap,
              }
            : isMasonryLayout
              ? {
                    position: "relative",
                    width: "100%",
                    height: masonryLayout.height,
                }
              : {
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.max(2, visibleColumnCount)}, minmax(0, 1fr))`,
                    gridAutoFlow: "dense",
                    gridAutoRows:
                        layout === "justified"
                            ? "minmax(150px, auto)"
                            : undefined,
                    gap,
                    width: "100%",
                    alignItems: "stretch",
                }

    const getLayoutCardStyle = (index: number): React.CSSProperties => {
        if (layout === "hero-grid" && index === 0)
            return { gridColumn: "span 2", gridRow: "span 2" }
        if (layout === "magazine") {
            if (index % 7 === 0)
                return { gridColumn: "span 2", gridRow: "span 2" }
            if (index % 7 === 5) return { gridColumn: "span 2" }
        }
        if (layout === "bento") {
            if (index % 6 === 0)
                return { gridColumn: "span 2", gridRow: "span 2" }
            if (index % 6 === 3) return { gridColumn: "span 2" }
        }
        if (layout === "metro")
            return index % 5 === 0
                ? { gridColumn: "span 2" }
                : index % 5 === 3
                  ? { gridRow: "span 2" }
                  : {}
        if (layout === "alternating")
            return index % 3 === 0 ? { gridColumn: "span 2" } : {}
        return {}
    }

    useLayoutEffect(() => {
        const gallery = galleryRef.current
        if (!animateFiltering || isStatic || !gallery) return
        const cards = Array.from(
            gallery.querySelectorAll<HTMLElement>("[data-gallery-card='true']")
        )
        cards.forEach((card) => {
            const key = card.dataset.galleryId || ""
            const previous = previousCardRectsRef.current.get(key)
            if (!previous) return
            const current = card.getBoundingClientRect()
            const dx = previous.left - current.left
            const dy = previous.top - current.top
            const sx = previous.width / Math.max(current.width, 1)
            const sy = previous.height / Math.max(current.height, 1)
            if (
                Math.abs(dx) > 1 ||
                Math.abs(dy) > 1 ||
                Math.abs(sx - 1) > 0.01 ||
                Math.abs(sy - 1) > 0.01
            ) {
                gsap.fromTo(
                    card,
                    {
                        x: dx,
                        y: dy,
                        scaleX: sx,
                        scaleY: sy,
                        transformOrigin: "top left",
                    },
                    {
                        x: 0,
                        y: 0,
                        scaleX: 1,
                        scaleY: 1,
                        duration: filterAnimationDuration,
                        ease: "power3.inOut",
                        clearProps: "transform",
                        overwrite: true,
                    }
                )
            }
        })
        return () => {
            const next = new Map<string, DOMRect>()
            Array.from(
                gallery.querySelectorAll<HTMLElement>(
                    "[data-gallery-card='true']"
                )
            ).forEach((card) => {
                next.set(
                    card.dataset.galleryId || "",
                    card.getBoundingClientRect()
                )
            })
            previousCardRectsRef.current = next
        }
    }, [
        visibleItems,
        layout,
        columns,
        gap,
        animateFiltering,
        filterAnimationDuration,
        isStatic,
    ])

    useEffect(() => {
        if (!animateFiltering || isStatic || !galleryRef.current) return
        const cards = Array.from(
            galleryRef.current.querySelectorAll<HTMLElement>(
                "[data-gallery-card='true']"
            )
        )
        if (!cards.length) return

        gsap.killTweensOf(cards)
        gsap.fromTo(
            cards,
            {
                opacity: 0,
                y: 24,
                scale: 0.965,
                filter: "blur(8px)",
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                duration: filterAnimationDuration,
                stagger: filterAnimationStagger,
                ease: "power3.out",
                clearProps: "filter,transform,opacity",
                overwrite: true,
            }
        )
    }, [
        activeMedia,
        activeCollection,
        activeTags,
        animateFiltering,
        filterAnimationDuration,
        filterAnimationStagger,
        visibleItems,
        isStatic,
    ])

    return (
        <div
            data-static-renderer={isStatic ? "true" : "false"}
            style={{
                width: "100%",
                height: "100%",
                minHeight: 120,
                overflow: "auto",
                background: backgroundColor,
                ...font,
                ...style,
            }}
        >
            {(showMediaFilters ||
                (showCollections && allCollections.length > 0) ||
                (showTags && allTags.length > 0)) && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        marginBottom: 28,
                        padding: filterContainerPadding,
                        background: filterContainerBackground,
                        border: `1px solid ${filterContainerBorder}`,
                        borderRadius: filterContainerRadius,
                        boxShadow: filterContainerShadow,
                    }}
                >
                    {(showSearch || showSort) && (
                        <div
                            className="framer-gallery-search-sort-row"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: filterGap,
                                width: "100%",
                                flexWrap: "wrap",
                            }}
                        >
                            {showSearch && (
                                <label
                                    style={{
                                        position: "relative",
                                        display: "block",
                                        width: `${Math.max(10, Math.min(100, searchWidth))}%`,
                                        maxWidth: "100%",
                                        flex: "1 1 260px",
                                        contentVisibility: "auto",
                                        containIntrinsicSize: "320px 48px",
                                    }}
                                >
                                    {searchIcon !== "none" && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                left: 14,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: searchIconColor,
                                                lineHeight: 0,
                                                pointerEvents: "none",
                                                zIndex: 1,
                                            }}
                                            aria-hidden="true"
                                        >
                                            <svg
                                                width="17"
                                                height="17"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            >
                                                <circle cx="11" cy="11" r="7" />
                                                <path d="m20 20-3.4-3.4" />
                                            </svg>
                                        </span>
                                    )}
                                    <input
                                        className="framer-gallery-search-input"
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) =>
                                            setSearchQuery(
                                                event.currentTarget.value
                                            )
                                        }
                                        onFocus={() => setSearchFocused(true)}
                                        onBlur={() => setSearchFocused(false)}
                                        placeholder={searchPlaceholder}
                                        aria-label={searchAriaLabel}
                                        style={{
                                            width: "100%",
                                            height: Math.max(34, searchHeight),
                                            padding:
                                                searchIcon === "none"
                                                    ? "0 42px 0 14px"
                                                    : "0 42px 0 40px",
                                            borderRadius: searchRadius,
                                            border: `1px solid ${searchFocused ? searchFocusBorder : searchBorder}`,
                                            background: searchBackground,
                                            color: searchTextColor,
                                            fontFamily: "inherit",
                                            ...searchFont,
                                            lineHeight: 1.2,
                                            outline: "none",
                                            boxShadow: searchFocused
                                                ? searchFocusShadow
                                                : searchShadow,
                                            transition:
                                                "border-color .2s ease, box-shadow .2s ease, background .2s ease",
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            aria-label="Clear gallery search"
                                            style={{
                                                position: "absolute",
                                                right: 8,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                width: 28,
                                                height: 28,
                                                border: 0,
                                                borderRadius: "50%",
                                                background: "transparent",
                                                color: searchClearColor,
                                                cursor: "pointer",
                                                fontSize: 20,
                                                lineHeight: 1,
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </label>
                            )}
                            {showSort && (
                                <div
                                    style={{
                                        position: "relative",
                                        flex: showSearch
                                            ? "0 0 auto"
                                            : "1 1 220px",
                                        minWidth: 176,
                                    }}
                                >
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            left: 13,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            display: "grid",
                                            placeItems: "center",
                                            color: filterTextColor,
                                            pointerEvents: "none",
                                            zIndex: 1,
                                        }}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M3 6h18M6 12h12M10 18h4" />
                                        </svg>
                                    </span>
                                    <select
                                        className="framer-gallery-sort-select"
                                        value={sortMode}
                                        onChange={(event) =>
                                            setSortMode(
                                                event.target
                                                    .value as typeof sortMode
                                            )
                                        }
                                        aria-label="Sort gallery"
                                        style={{
                                            width: "100%",
                                            height: Math.max(34, searchHeight),
                                            appearance: "none",
                                            WebkitAppearance: "none",
                                            padding: "0 38px 0 38px",
                                            borderRadius: searchRadius,
                                            border: `1px solid ${searchBorder}`,
                                            background:
                                                filterInactiveBackground,
                                            color: filterTextColor,
                                            cursor: "pointer",
                                            outline: "none",
                                            boxShadow: searchShadow,
                                            ...filterFont,
                                            transition:
                                                "border-color .2s ease, box-shadow .2s ease, background .2s ease",
                                        }}
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="oldest">Oldest</option>
                                        <option value="az">A–Z</option>
                                        <option value="za">Z–A</option>
                                        <option value="random">Random</option>
                                        <option value="favorites">
                                            Favorites first
                                        </option>
                                    </select>
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            right: 13,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: filterTextColor,
                                            pointerEvents: "none",
                                            lineHeight: 0,
                                        }}
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </span>
                                </div>
                            )}
                            <style>{`.framer-gallery-search-input::placeholder{color:${searchPlaceholderColor};opacity:1}.framer-gallery-search-input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}.framer-gallery-sort-select:focus{border-color:${searchFocusBorder}!important;box-shadow:${searchFocusShadow}!important}@media(max-width:560px){.framer-gallery-search-sort-row>label,.framer-gallery-search-sort-row>div{width:100%!important;flex:1 1 100%!important}}`}</style>
                        </div>
                    )}
                    {showMediaFilters && (
                        <div
                            role="group"
                            aria-label="Media filters"
                            style={{
                                display: "flex",
                                gap: filterGap,
                                flexWrap: "wrap",
                            }}
                        >
                            {(
                                [
                                    ["all", "All"],
                                    ["photos", "Photos"],
                                    ["videos", "Videos"],
                                    ["youtube", "YouTube"],
                                    ["vimeo", "Vimeo"],
                                    ["favorites", "Favorites"],
                                ] as const
                            ).map(([value, label]) => {
                                const active = activeMedia === value
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={(event) => {
                                            animateFilterButton(
                                                event.currentTarget
                                            )
                                            setActiveMedia(value)
                                            setOpenIndex(null)
                                        }}
                                        onMouseEnter={(event) =>
                                            applyFilterHover(
                                                event.currentTarget,
                                                active,
                                                filterStyle,
                                                filterHoverBackground,
                                                filterHoverTextColor,
                                                filterInactiveBackground,
                                                filterTextColor
                                            )
                                        }
                                        onMouseLeave={(event) =>
                                            clearFilterHover(
                                                event.currentTarget,
                                                active,
                                                filterStyle,
                                                filterInactiveBackground,
                                                filterTextColor
                                            )
                                        }
                                        aria-pressed={active}
                                        style={getFilterButtonStyle(
                                            active,
                                            filterStyle,
                                            "category",
                                            filterTextColor,
                                            filterInactiveBackground,
                                            filterInactiveBorder,
                                            filterActiveBackground,
                                            filterActiveTextColor,
                                            filterFont,
                                            tagFont
                                        )}
                                    >
                                        {label}
                                        {showFilterCounts && (
                                            <span
                                                style={{
                                                    marginLeft: 6,
                                                    fontSize: 11,
                                                    opacity: active
                                                        ? 0.72
                                                        : 0.5,
                                                }}
                                            >
                                                {mediaCounts[value]}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                    {showCollections && allCollections.length > 0 && (
                        <div
                            role="group"
                            aria-label="Gallery collections"
                            style={{
                                display: "flex",
                                gap: filterGap,
                                flexWrap: "wrap",
                            }}
                        >
                            {["all", ...allCollections].map((collection) => {
                                const active = activeCollection === collection
                                const label =
                                    collection === "all"
                                        ? "All Collections"
                                        : collection
                                const count =
                                    collection === "all"
                                        ? resolvedItems.length
                                        : resolvedItems.filter(
                                              (item) =>
                                                  item.collection === collection
                                          ).length
                                return (
                                    <button
                                        key={collection}
                                        type="button"
                                        onClick={(event) => {
                                            animateFilterButton(
                                                event.currentTarget
                                            )
                                            setActiveCollection(collection)
                                            setOpenIndex(null)
                                        }}
                                        onMouseEnter={(event) =>
                                            applyFilterHover(
                                                event.currentTarget,
                                                active,
                                                filterStyle,
                                                filterHoverBackground,
                                                filterHoverTextColor,
                                                filterInactiveBackground,
                                                filterTextColor
                                            )
                                        }
                                        onMouseLeave={(event) =>
                                            clearFilterHover(
                                                event.currentTarget,
                                                active,
                                                filterStyle,
                                                filterInactiveBackground,
                                                filterTextColor
                                            )
                                        }
                                        aria-pressed={active}
                                        style={getFilterButtonStyle(
                                            active,
                                            filterStyle,
                                            "category",
                                            filterTextColor,
                                            filterInactiveBackground,
                                            filterInactiveBorder,
                                            filterActiveBackground,
                                            filterActiveTextColor,
                                            filterFont,
                                            tagFont
                                        )}
                                    >
                                        {label}
                                        {showFilterCounts && (
                                            <span
                                                style={{
                                                    marginLeft: 6,
                                                    fontSize: 11,
                                                    opacity: active
                                                        ? 0.72
                                                        : 0.5,
                                                }}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                    {showTags && allTags.length > 0 && (
                        <div
                            role="group"
                            aria-label="Gallery tags"
                            style={{
                                display: "flex",
                                gap: filterGap,
                                flexWrap: "wrap",
                            }}
                        >
                            {allTags.map((tag) => {
                                const active = activeTags.includes(tag)
                                const count = resolvedItems.filter((item) =>
                                    item.tags.includes(tag)
                                ).length
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={(event) => {
                                            animateFilterButton(
                                                event.currentTarget
                                            )
                                            setActiveTags((current) => {
                                                if (!multiSelectTags)
                                                    return active ? [] : [tag]
                                                return active
                                                    ? current.filter(
                                                          (item) => item !== tag
                                                      )
                                                    : [...current, tag]
                                            })
                                            setOpenIndex(null)
                                        }}
                                        onMouseEnter={(event) =>
                                            applyFilterHover(
                                                event.currentTarget,
                                                active,
                                                filterStyle,
                                                filterHoverBackground,
                                                filterHoverTextColor,
                                                filterInactiveBackground,
                                                filterTextColor
                                            )
                                        }
                                        onMouseLeave={(event) =>
                                            clearFilterHover(
                                                event.currentTarget,
                                                active,
                                                filterStyle,
                                                filterInactiveBackground,
                                                filterTextColor
                                            )
                                        }
                                        aria-pressed={active}
                                        style={getFilterButtonStyle(
                                            active,
                                            filterStyle,
                                            "tag",
                                            filterTextColor,
                                            filterInactiveBackground,
                                            filterInactiveBorder,
                                            filterActiveBackground,
                                            filterActiveTextColor,
                                            filterFont,
                                            tagFont
                                        )}
                                    >
                                        {active ? "✓ " : ""}
                                        {tag}
                                        {showFilterCounts && (
                                            <span
                                                style={{
                                                    marginLeft: 6,
                                                    fontSize: 10,
                                                    opacity: active
                                                        ? 0.72
                                                        : 0.5,
                                                }}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                    {(showActiveFilters || showResultCount || showClearAll) &&
                        (searchQuery ||
                            activeMedia !== "all" ||
                            activeCollection !== "all" ||
                            activeTags.length > 0) && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    paddingTop: 2,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 7,
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                    }}
                                >
                                    {showActiveFilters && searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            style={getFilterButtonStyle(
                                                false,
                                                "minimal",
                                                "tag",
                                                filterTextColor,
                                                filterInactiveBackground,
                                                filterInactiveBorder,
                                                filterActiveBackground,
                                                filterActiveTextColor,
                                                filterFont,
                                                tagFont
                                            )}
                                        >
                                            Search: {searchQuery} ×
                                        </button>
                                    )}
                                    {showActiveFilters &&
                                        activeMedia !== "all" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveMedia("all")
                                                }
                                                style={getFilterButtonStyle(
                                                    false,
                                                    "minimal",
                                                    "tag",
                                                    filterTextColor,
                                                    filterInactiveBackground,
                                                    filterInactiveBorder,
                                                    filterActiveBackground,
                                                    filterActiveTextColor,
                                                    filterFont,
                                                    tagFont
                                                )}
                                            >
                                                {activeMedia} ×
                                            </button>
                                        )}
                                    {showActiveFilters &&
                                        activeCollection !== "all" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveCollection("all")
                                                }
                                                style={getFilterButtonStyle(
                                                    false,
                                                    "minimal",
                                                    "tag",
                                                    filterTextColor,
                                                    filterInactiveBackground,
                                                    filterInactiveBorder,
                                                    filterActiveBackground,
                                                    filterActiveTextColor,
                                                    filterFont,
                                                    tagFont
                                                )}
                                            >
                                                {activeCollection} ×
                                            </button>
                                        )}
                                    {showActiveFilters &&
                                        activeTags.map((tag) => (
                                            <button
                                                key={`active-${tag}`}
                                                type="button"
                                                onClick={() =>
                                                    setActiveTags((current) =>
                                                        current.filter(
                                                            (item) =>
                                                                item !== tag
                                                        )
                                                    )
                                                }
                                                style={getFilterButtonStyle(
                                                    false,
                                                    "minimal",
                                                    "tag",
                                                    filterTextColor,
                                                    filterInactiveBackground,
                                                    filterInactiveBorder,
                                                    filterActiveBackground,
                                                    filterActiveTextColor,
                                                    filterFont,
                                                    tagFont
                                                )}
                                            >
                                                {tag} ×
                                            </button>
                                        ))}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        ...tagFont,
                                    }}
                                >
                                    {showResultCount && (
                                        <span
                                            style={{
                                                color: filterTextColor,
                                                opacity: 0.72,
                                                fontSize: 12,
                                            }}
                                        >
                                            Showing {filteredItems.length} of{" "}
                                            {resolvedItems.length}
                                        </span>
                                    )}
                                    {showClearAll && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery("")
                                                setActiveMedia("all")
                                                setActiveCollection("all")
                                                setActiveTags([])
                                                setSortMode(defaultSort)
                                                setOpenIndex(null)
                                            }}
                                            style={getFilterButtonStyle(
                                                false,
                                                filterStyle,
                                                "tag",
                                                filterTextColor,
                                                filterInactiveBackground,
                                                filterInactiveBorder,
                                                filterActiveBackground,
                                                filterActiveTextColor,
                                                filterFont,
                                                tagFont
                                            )}
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                </div>
            )}
            <div
                ref={galleryRef}
                style={{
                    ...galleryStyle,
                    overflow:
                        isMasonryLayout && isStatic ? "visible" : "hidden",
                }}
            >
                {visibleItems.map((item, index) => {
                    const youtubeId =
                        item.type === "youtube"
                            ? extractYouTubeId(item.src)
                            : null
                    const vimeoId =
                        item.type === "vimeo" ? extractVimeoId(item.src) : null
                    const previewSrc =
                        item.type === "image"
                            ? item.src
                            : item.fallbackImage ||
                              (youtubeId
                                  ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
                                  : "")
                    const ratio =
                        layout === "masonry" || layout === "pinterest"
                            ? item.aspectRatio
                            : isEditorialLayout && index % 4 === 0
                              ? "4 / 3"
                              : layout === "justified"
                                ? "4 / 3"
                                : cardAspectRatio
                    const badge =
                        item.type === "image"
                            ? imageBadge
                            : item.type === "youtube"
                              ? youtubeBadge
                              : item.type === "vimeo"
                                ? vimeoBadge
                                : videoBadge
                    const badgeEnabled = badge.enabled ?? false
                    const badgeText =
                        badge.text ??
                        (item.type === "image"
                            ? "IMG"
                            : item.type === "youtube"
                              ? "YOUTUBE"
                              : item.type === "vimeo"
                                ? "VIMEO"
                                : "VIDEO")
                    const badgePosition = badge.position ?? "top-left"
                    const badgePositionStyle: React.CSSProperties =
                        badgePosition === "top-right"
                            ? { top: 12, right: 12 }
                            : badgePosition === "bottom-left"
                              ? { bottom: 12, left: 12 }
                              : badgePosition === "bottom-right"
                                ? { bottom: 12, right: 12 }
                                : { top: 12, left: 12 }
                    const cardButtonPositionStyle: React.CSSProperties =
                        cardButtonPosition === "top-left"
                            ? { top: 12, left: 12 }
                            : cardButtonPosition === "top-right"
                              ? { top: 12, right: 12 }
                              : cardButtonPosition === "bottom-left"
                                ? { bottom: 12, left: 12 }
                                : { bottom: 12, right: 12 }
                    const showCardButton =
                        cardButtonsEnabled &&
                        item.showButton &&
                        Boolean(item.buttonLink)
                    return (
                        <div
                            key={`${item.type}-${item.src}-${index}`}
                            role={isStatic ? undefined : "button"}
                            tabIndex={isStatic ? undefined : 0}
                            data-gallery-card="true"
                            data-gallery-id={item.id}
                            onClick={
                                isStatic
                                    ? undefined
                                    : (event) =>
                                          openGallery(
                                              index,
                                              event.currentTarget
                                          )
                            }
                            onKeyDown={
                                isStatic
                                    ? undefined
                                    : (event) => {
                                          if (
                                              event.key === "Enter" ||
                                              event.key === " "
                                          ) {
                                              event.preventDefault()
                                              openGallery(
                                                  index,
                                                  event.currentTarget
                                              )
                                          }
                                      }
                            }
                            aria-label={
                                isStatic
                                    ? undefined
                                    : `Open ${item.label || `${title} item ${index + 1}`}`
                            }
                            style={{
                                position:
                                    isMasonryLayout && !isStatic
                                        ? "absolute"
                                        : "relative",
                                width: "100%",
                                aspectRatio:
                                    isMasonryLayout && !isStatic
                                        ? undefined
                                        : ratio,
                                ...(isMasonryLayout && !isStatic
                                    ? masonryLayout.positions[index]
                                    : {}),
                                ...(isMasonryLayout && isStatic
                                    ? {
                                          display: "inline-block",
                                          marginBottom: gap,
                                          breakInside: "avoid",
                                          WebkitColumnBreakInside: "avoid",
                                      }
                                    : {}),
                                border: 0,
                                padding: 0,
                                marginBottom:
                                    isMasonryLayout && isStatic ? gap : 0,
                                ...getLayoutCardStyle(index),
                                breakInside: "avoid",
                                minWidth: 0,
                                borderRadius,
                                overflow: "hidden",
                                background: "#111",
                                cursor: isStatic ? "default" : "pointer",
                                color: "#fff",
                                display:
                                    isMasonryLayout && isStatic
                                        ? "inline-block"
                                        : "block",
                            }}
                        >
                            {previewSrc ? (
                                <ProgressiveGalleryImage
                                    src={previewSrc}
                                    alt={
                                        item.alt ||
                                        item.label ||
                                        `${title} item ${index + 1}`
                                    }
                                    fit={imageFit}
                                    loadImmediately={isStatic}
                                    isStatic={isStatic}
                                />
                            ) : (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "grid",
                                        placeItems: "center",
                                        background:
                                            "linear-gradient(135deg,#2b2b2b,#090909)",
                                        fontSize: 12,
                                        letterSpacing: ".12em",
                                    }}
                                >
                                    VIDEO
                                </div>
                            )}
                            <span
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(to top,rgba(0,0,0,.5),transparent 55%)",
                                    opacity: showLabels ? 1 : 0,
                                    pointerEvents: "none",
                                }}
                            />
                            {badgeEnabled && badgeText && (
                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        ...badgePositionStyle,
                                        zIndex: 3,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: `${badge.paddingY ?? 6}px ${badge.paddingX ?? 9}px`,
                                        borderRadius: badge.radius ?? 999,
                                        border: `1px solid ${badge.borderColor ?? "rgba(255,255,255,0.22)"}`,
                                        background:
                                            badge.background ??
                                            "rgba(17,17,17,0.82)",
                                        color: badge.textColor ?? "#FFFFFF",
                                        ...badgeFont,
                                        fontSize:
                                            badge.fontSize ??
                                            badgeFont.fontSize,
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        letterSpacing: ".08em",
                                        textTransform: "uppercase",
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                        backdropFilter: "blur(8px)",
                                        WebkitBackdropFilter: "blur(8px)",
                                        boxShadow: "0 4px 14px rgba(0,0,0,.16)",
                                    }}
                                >
                                    {badgeText}
                                </span>
                            )}
                            {item.type !== "image" && (
                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                        width: 52,
                                        height: 52,
                                        borderRadius: "50%",
                                        background: "rgba(0,0,0,.68)",
                                        border: "1px solid rgba(255,255,255,.35)",
                                        display: "grid",
                                        placeItems: "center",
                                        backdropFilter: "blur(8px)",
                                    }}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        style={{ marginLeft: 3 }}
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </span>
                            )}
                            {showLabels && item.label && (
                                <span
                                    style={{
                                        position: "absolute",
                                        left: 12,
                                        right: 12,
                                        bottom: 11,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        textAlign: "left",
                                        ...cardLabelFont,
                                        textShadow: "0 2px 10px rgba(0,0,0,.8)",
                                        pointerEvents: "none",
                                    }}
                                >
                                    {item.label}
                                </span>
                            )}
                            {showCardButton && (
                                <a
                                    href={item.buttonLink}
                                    target={
                                        item.buttonNewTab ? "_blank" : undefined
                                    }
                                    rel={
                                        item.buttonNewTab
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    onPointerDown={(event) =>
                                        event.stopPropagation()
                                    }
                                    onClick={(event) => event.stopPropagation()}
                                    aria-label={`${item.buttonText}: ${item.label || `gallery item ${index + 1}`}`}
                                    style={{
                                        position: "absolute",
                                        ...cardButtonPositionStyle,
                                        zIndex: 6,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 7,
                                        maxWidth: "calc(100% - 24px)",
                                        padding: `${cardButtonPaddingY}px ${cardButtonPaddingX}px`,
                                        borderRadius: cardButtonRadius,
                                        border: `1px solid ${cardButtonBorderColor}`,
                                        background: cardButtonBackground,
                                        color: cardButtonTextColor,
                                        ...cardButtonFont,
                                        fontWeight: 650,
                                        lineHeight: 1,
                                        textDecoration: "none",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        boxShadow: "0 8px 24px rgba(0,0,0,.16)",
                                        backdropFilter: "blur(10px)",
                                        WebkitBackdropFilter: "blur(10px)",
                                        cursor: "pointer",
                                        transition:
                                            "transform .2s ease, filter .2s ease",
                                    }}
                                    onMouseEnter={(event) => {
                                        event.currentTarget.style.transform =
                                            "translateY(-2px)"
                                        event.currentTarget.style.filter =
                                            "brightness(.96)"
                                    }}
                                    onMouseLeave={(event) => {
                                        event.currentTarget.style.transform =
                                            "translateY(0)"
                                        event.currentTarget.style.filter =
                                            "none"
                                    }}
                                >
                                    <span
                                        style={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {item.buttonText}
                                    </span>
                                    {cardButtonShowArrow && (
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                            style={{ flex: "0 0 auto" }}
                                        >
                                            <path d="M5 12h14M13 6l6 6-6 6" />
                                        </svg>
                                    )}
                                </a>
                            )}
                        </div>
                    )
                })}
                {filteredItems.length === 0 && (
                    <div
                        style={{
                            gridColumn: "1 / -1",
                            padding: "48px 20px",
                            textAlign: "center",
                            color: filterTextColor,
                            border: "1px dashed rgba(127,127,127,.35)",
                            borderRadius,
                        }}
                    >
                        <div style={{ ...emptyTitleFont, marginBottom: 8 }}>
                            No gallery items found
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("")
                                setActiveMedia("all")
                                setActiveCollection("all")
                                setActiveTags([])
                            }}
                            style={getFilterButtonStyle(
                                true,
                                filterStyle,
                                "category",
                                filterTextColor,
                                filterInactiveBackground,
                                filterInactiveBorder,
                                filterActiveBackground,
                                filterActiveTextColor,
                                filterFont,
                                tagFont
                            )}
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
            {!isStatic &&
                enableInfiniteLoading &&
                visibleCount < filteredItems.length && (
                    <div
                        ref={loadMoreRef}
                        aria-label="Loading more gallery items"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap,
                            paddingTop: gap,
                        }}
                    >
                        {[0, 1, 2].map((item) => (
                            <div
                                key={item}
                                style={{
                                    aspectRatio: cardAspectRatio,
                                    borderRadius,
                                    background:
                                        "linear-gradient(100deg, rgba(127,127,127,.08) 20%, rgba(127,127,127,.18) 40%, rgba(127,127,127,.08) 60%)",
                                    backgroundSize: "220% 100%",
                                    animation:
                                        "gallerySkeleton 1.25s ease-in-out infinite",
                                }}
                            />
                        ))}
                    </div>
                )}
            <style>{`
                @keyframes gallerySkeleton{0%{background-position:200% 0}100%{background-position:-20% 0}}
                [data-static-renderer="true"] *,
                [data-static-renderer="true"] *::before,
                [data-static-renderer="true"] *::after {
                    animation: none !important;
                    transition: none !important;
                    scroll-behavior: auto !important;
                }
            `}</style>

            {!isStatic && openIndex !== null && slides.length > 0 && (
                <LightboxGallery
                    slides={slides}
                    initialIndex={openIndex}
                    title={title}
                    onClose={closeGallery}
                    showThumbnails={showThumbnails}
                    animationDuration={animationDuration}
                    overlayColor={overlayColor}
                    cursorSize={cursorSize}
                    closeOnBackdropClick={closeOnBackdropClick}
                    autoplay={autoplay}
                    autoplayDelay={autoplayDelay}
                    showCaption={showCaption}
                    showFavorite={showFavorite}
                    showShare={showShare}
                    showFullscreen={showFullscreen}
                    transitionStyle={transitionStyle}
                    slideshowEffect={slideshowEffect}
                    showShortcutHelp={showShortcutHelp}
                    typographySettings={typographySettings}
                    originRect={originRect}
                />
            )}
        </div>
    )
}

LightboxGalleryComponent.defaultProps = {
    items: DEFAULT_ITEMS,
    title: "Gallery",
    gallerySettings: {
        layout: "grid",
        enableInfiniteLoading: true,
        initialItemCount: 24,
        loadMoreCount: 24,
        columns: 3,
        gap: 12,
        borderRadius: 12,
        imageFit: "cover",
        cardAspectRatio: "1 / 1",
        backgroundColor: "#FFFFFF",
        showLabels: false,
        showSort: true,
        defaultSort: "newest",
        semanticSearch: true,
    },
    filterSettings: {},
    lightboxSettings: {},
    animationSettings: {},
}

addPropertyControls(LightboxGalleryComponent, {
    items: {
        type: ControlType.Array,
        title: "Gallery Items",
        control: {
            type: ControlType.Object,
            title: "Item",
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Media Type",
                    options: ["image", "video", "youtube", "vimeo"],
                    optionTitles: [
                        "Image",
                        "Uploaded Video",
                        "YouTube",
                        "Vimeo",
                    ],
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (item) => item.type !== "image",
                },
                fallbackImage: {
                    type: ControlType.Image,
                    title: "Fallback Image",
                    hidden: (item) =>
                        item.type !== "video" &&
                        item.type !== "youtube" &&
                        item.type !== "vimeo",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video File",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (item) => item.type !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "YouTube or Vimeo URL",
                    hidden: (item) =>
                        item.type !== "youtube" && item.type !== "vimeo",
                },
                label: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                },
                collection: {
                    type: ControlType.String,
                    title: "Collection",
                    defaultValue: "",
                    placeholder: "Editorial",
                },
                tags: {
                    type: ControlType.Array,
                    title: "Tags",
                    control: {
                        type: ControlType.String,
                        placeholder: "Nature",
                    },
                    defaultValue: [],
                },
                date: {
                    type: ControlType.String,
                    title: "Date",
                    placeholder: "2026-07-15",
                },
                showButton: {
                    type: ControlType.Boolean,
                    title: "Link Button",
                    defaultValue: false,
                },
                buttonText: {
                    type: ControlType.String,
                    title: "Button Text",
                    defaultValue: "View Project",
                    hidden: (item) => !item.showButton,
                },
                buttonLink: {
                    type: ControlType.Link,
                    title: "Button Link",
                    hidden: (item) => !item.showButton,
                },
                buttonNewTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    hidden: (item) => !item.showButton,
                },
                aspectRatio: {
                    type: ControlType.String,
                    title: "Masonry Ratio",
                    defaultValue: "1 / 1",
                    placeholder: "4 / 5",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    title: {
        type: ControlType.String,
        title: "Lightbox Title",
        defaultValue: "Gallery",
    },
    gallerySettings: {
        type: ControlType.Object,
        title: "Gallery",
        controls: {
            layout: {
                type: ControlType.Enum,
                title: "Layout",
                options: [
                    "grid",
                    "masonry",
                    "justified",
                    "pinterest",
                    "magazine",
                    "bento",
                    "metro",
                    "alternating",
                    "hero-grid",
                ],
                optionTitles: [
                    "Grid",
                    "Masonry",
                    "Justified",
                    "Pinterest",
                    "Magazine",
                    "Bento",
                    "Metro",
                    "Alternating",
                    "Hero + Grid",
                ],
                defaultValue: "grid",
            },
            enableInfiniteLoading: {
                type: ControlType.Boolean,
                title: "Infinite Load",
                defaultValue: true,
            },
            initialItemCount: {
                type: ControlType.Number,
                title: "Initial Items",
                defaultValue: 24,
                min: 6,
                max: 100,
                step: 1,
                hidden: (v) => !v.enableInfiniteLoading,
            },
            loadMoreCount: {
                type: ControlType.Number,
                title: "Load Batch",
                defaultValue: 24,
                min: 3,
                max: 100,
                step: 1,
                hidden: (v) => !v.enableInfiniteLoading,
            },
            showSort: {
                type: ControlType.Boolean,
                title: "Sort Menu",
                defaultValue: true,
            },
            defaultSort: {
                type: ControlType.Enum,
                title: "Default Sort",
                options: [
                    "newest",
                    "oldest",
                    "az",
                    "za",
                    "random",
                    "favorites",
                ],
                optionTitles: [
                    "Newest",
                    "Oldest",
                    "A–Z",
                    "Z–A",
                    "Random",
                    "Favorites",
                ],
                defaultValue: "newest",
                hidden: (v) => !v.showSort,
            },
            semanticSearch: {
                type: ControlType.Boolean,
                title: "AI-like Search",
                defaultValue: true,
            },
            columns: {
                type: ControlType.Number,
                title: "Columns",
                defaultValue: 3,
                min: 1,
                max: 8,
                step: 1,
                displayStepper: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 12,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            imageFit: {
                type: ControlType.Enum,
                title: "Image Fit",
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                defaultValue: "cover",
            },
            cardAspectRatio: {
                type: ControlType.String,
                title: "Grid Ratio",
                defaultValue: "1 / 1",
                placeholder: "4 / 3",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
            },
            showLabels: {
                type: ControlType.Boolean,
                title: "Grid Labels",
                defaultValue: false,
            },
        },
        defaultValue: {},
    },
    imageBadge: {
        type: ControlType.Object,
        title: "IMG Badge",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "IMG",
                hidden: (v) => !v.enabled,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: [
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Right",
                ],
                defaultValue: "top-left",
                hidden: (v) => !v.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: "rgba(17,17,17,0.82)",
                hidden: (v) => !v.enabled,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
                hidden: (v) => !v.enabled,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(255,255,255,0.22)",
                hidden: (v) => !v.enabled,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 999,
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Text Size",
                defaultValue: 10,
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 9,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 6,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
        },
        defaultValue: {},
    },
    videoBadge: {
        type: ControlType.Object,
        title: "VIDEO Badge",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "VIDEO",
                hidden: (v) => !v.enabled,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: [
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Right",
                ],
                defaultValue: "top-left",
                hidden: (v) => !v.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: "rgba(17,17,17,0.82)",
                hidden: (v) => !v.enabled,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
                hidden: (v) => !v.enabled,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(255,255,255,0.22)",
                hidden: (v) => !v.enabled,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 999,
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Text Size",
                defaultValue: 10,
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 9,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 6,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
        },
        defaultValue: {},
    },
    youtubeBadge: {
        type: ControlType.Object,
        title: "YOUTUBE Badge",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "YOUTUBE",
                hidden: (v) => !v.enabled,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: [
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Right",
                ],
                defaultValue: "top-left",
                hidden: (v) => !v.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: "rgba(17,17,17,0.82)",
                hidden: (v) => !v.enabled,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
                hidden: (v) => !v.enabled,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(255,255,255,0.22)",
                hidden: (v) => !v.enabled,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 999,
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Text Size",
                defaultValue: 10,
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 9,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 6,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
        },
        defaultValue: {},
    },
    vimeoBadge: {
        type: ControlType.Object,
        title: "VIMEO Badge",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "VIMEO",
                hidden: (v) => !v.enabled,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: [
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Right",
                ],
                defaultValue: "top-left",
                hidden: (v) => !v.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: "rgba(17,17,17,0.82)",
                hidden: (v) => !v.enabled,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
                hidden: (v) => !v.enabled,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(255,255,255,0.22)",
                hidden: (v) => !v.enabled,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 999,
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Text Size",
                defaultValue: 10,
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 9,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 6,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
        },
        defaultValue: {},
    },
    cardButtonSettings: {
        type: ControlType.Object,
        title: "Card Button",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: [
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Right",
                ],
                defaultValue: "bottom-right",
                hidden: (v) => !v.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: "#FFFFFF",
                hidden: (v) => !v.enabled,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#111111",
                hidden: (v) => !v.enabled,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(17,17,17,0.14)",
                hidden: (v) => !v.enabled,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 999,
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Text Size",
                defaultValue: 12,
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 14,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 10,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                hidden: (v) => !v.enabled,
            },
            showArrow: {
                type: ControlType.Boolean,
                title: "Arrow",
                defaultValue: true,
                hidden: (v) => !v.enabled,
            },
        },
        defaultValue: {},
    },
    filterSettings: {
        type: ControlType.Object,
        title: "Filters",
        controls: {
            showSearch: {
                type: ControlType.Boolean,
                title: "Search",
                defaultValue: true,
            },
            searchPlaceholder: {
                type: ControlType.String,
                title: "Search Hint",
                defaultValue: "Search gallery…",
                hidden: (v) => !v.showSearch,
            },
            searchAriaLabel: {
                type: ControlType.String,
                title: "ARIA Label",
                defaultValue: "Search gallery",
                hidden: (v) => !v.showSearch,
            },
            searchIcon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["search", "none"],
                optionTitles: ["Search", "None"],
                defaultValue: "search",
                hidden: (v) => !v.showSearch,
            },
            searchWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 100,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (v) => !v.showSearch,
            },
            searchHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 46,
                min: 34,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (v) => !v.showSearch,
            },
            searchRadius: {
                type: ControlType.Number,
                title: "Search Radius",
                defaultValue: 14,
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                hidden: (v) => !v.showSearch,
            },
            searchFontSize: {
                type: ControlType.Number,
                title: "Font Size",
                defaultValue: 14,
                min: 10,
                max: 28,
                step: 1,
                unit: "px",
                hidden: (v) => !v.showSearch,
            },
            searchBackground: {
                type: ControlType.Color,
                title: "Search BG",
                defaultValue: "#FFFFFF",
                hidden: (v) => !v.showSearch,
            },
            searchBorder: {
                type: ControlType.Color,
                title: "Search Border",
                defaultValue: "#E7E7E7",
                hidden: (v) => !v.showSearch,
            },
            searchFocusBorder: {
                type: ControlType.Color,
                title: "Focus Border",
                defaultValue: "#111111",
                hidden: (v) => !v.showSearch,
            },
            searchTextColor: {
                type: ControlType.Color,
                title: "Search Text",
                defaultValue: "#222222",
                hidden: (v) => !v.showSearch,
            },
            searchPlaceholderColor: {
                type: ControlType.Color,
                title: "Hint Color",
                defaultValue: "#8A8A8A",
                hidden: (v) => !v.showSearch,
            },
            searchIconColor: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#777777",
                hidden: (v) => !v.showSearch || v.searchIcon === "none",
            },
            searchClearColor: {
                type: ControlType.Color,
                title: "Clear Color",
                defaultValue: "#555555",
                hidden: (v) => !v.showSearch,
            },
            searchShadow: {
                type: ControlType.String,
                title: "Search Shadow",
                defaultValue: "none",
                hidden: (v) => !v.showSearch,
            },
            searchFocusShadow: {
                type: ControlType.String,
                title: "Focus Shadow",
                defaultValue: "0 0 0 3px rgba(17,17,17,.08)",
                hidden: (v) => !v.showSearch,
            },
            searchLabel: {
                type: ControlType.Boolean,
                title: "Search Labels",
                defaultValue: true,
                hidden: (v) => !v.showSearch,
            },
            searchDescription: {
                type: ControlType.Boolean,
                title: "Search Descriptions",
                defaultValue: true,
                hidden: (v) => !v.showSearch,
            },
            searchTags: {
                type: ControlType.Boolean,
                title: "Search Tags",
                defaultValue: true,
                hidden: (v) => !v.showSearch,
            },
            searchCollection: {
                type: ControlType.Boolean,
                title: "Search Collections",
                defaultValue: true,
                hidden: (v) => !v.showSearch,
            },
            showMediaFilters: {
                type: ControlType.Boolean,
                title: "Media",
                defaultValue: true,
            },
            showCollections: {
                type: ControlType.Boolean,
                title: "Collections",
                defaultValue: true,
            },
            showTags: {
                type: ControlType.Boolean,
                title: "Tags",
                defaultValue: true,
            },
            multiSelectTags: {
                type: ControlType.Boolean,
                title: "Multi Tags",
                defaultValue: true,
                hidden: (v) => !v.showTags,
            },
            tagLogic: {
                type: ControlType.Enum,
                title: "Tag Logic",
                options: ["or", "and"],
                optionTitles: ["Match Any (OR)", "Match All (AND)"],
                defaultValue: "or",
                hidden: (v) => !v.showTags || !v.multiSelectTags,
            },
            showActiveFilters: {
                type: ControlType.Boolean,
                title: "Active Chips",
                defaultValue: true,
            },
            showClearAll: {
                type: ControlType.Boolean,
                title: "Clear All",
                defaultValue: true,
            },
            showResultCount: {
                type: ControlType.Boolean,
                title: "Result Count",
                defaultValue: true,
            },
            showFilterCounts: {
                type: ControlType.Boolean,
                title: "Counts",
                defaultValue: false,
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["pills", "underline", "minimal"],
                optionTitles: ["Pills", "Underline", "Minimal"],
                defaultValue: "pills",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 10,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            containerBackground: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: "#FFFFFF",
            },
            containerBorder: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "#ECECEC",
            },
            containerRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 18,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            containerPadding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 18,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            containerShadow: {
                type: ControlType.String,
                title: "Shadow",
                defaultValue: "0 10px 35px rgba(0,0,0,.04)",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#555555",
            },
            inactiveBackground: {
                type: ControlType.Color,
                title: "Pill Surface",
                defaultValue: "#FFFFFF",
            },
            inactiveBorder: {
                type: ControlType.Color,
                title: "Pill Border",
                defaultValue: "#E7E7E7",
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: "#F5F5F5",
            },
            hoverTextColor: {
                type: ControlType.Color,
                title: "Hover Text",
                defaultValue: "#111111",
            },
            activeBackground: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: "#111111",
            },
            activeTextColor: {
                type: ControlType.Color,
                title: "Active Text",
                defaultValue: "#FFFFFF",
            },
        },
        defaultValue: {},
    },
    typographySettings: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.45em",
                },
            },
            searchFont: {
                type: ControlType.Font,
                title: "Search",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1em",
                },
            },
            filterFont: {
                type: ControlType.Font,
                title: "Filters",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "13px",
                    variant: "Semi-Bold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
            tagFont: {
                type: ControlType.Font,
                title: "Tags",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Medium",
                    letterSpacing: "0em",
                    lineHeight: "1em",
                },
            },
            cardLabelFont: {
                type: ControlType.Font,
                title: "Card Label",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Semi-Bold",
                    letterSpacing: "0em",
                    lineHeight: "1.3em",
                },
            },
            cardButtonFont: {
                type: ControlType.Font,
                title: "Card Button",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Semi-Bold",
                    letterSpacing: "0em",
                    lineHeight: "1em",
                },
            },
            badgeFont: {
                type: ControlType.Font,
                title: "Badges",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "10px",
                    variant: "Semi-Bold",
                    letterSpacing: "0.04em",
                    lineHeight: "1em",
                },
            },
            lightboxTitleFont: {
                type: ControlType.Font,
                title: "LB Title",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "18px",
                    variant: "Semi-Bold",
                    letterSpacing: "0em",
                    lineHeight: "1.2em",
                },
            },
            lightboxMetaFont: {
                type: ControlType.Font,
                title: "LB Meta",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.35em",
                },
            },
            toolbarFont: {
                type: ControlType.Font,
                title: "Toolbar",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "11px",
                    variant: "Medium",
                    letterSpacing: "0em",
                    lineHeight: "1em",
                },
            },
            captionTitleFont: {
                type: ControlType.Font,
                title: "Caption Title",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Semi-Bold",
                    letterSpacing: "0em",
                    lineHeight: "1.3em",
                },
            },
            captionDescriptionFont: {
                type: ControlType.Font,
                title: "Caption Body",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.5em",
                },
            },
            emptyTitleFont: {
                type: ControlType.Font,
                title: "Empty State",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Semi-Bold",
                    letterSpacing: "0em",
                    lineHeight: "1.3em",
                },
            },
        },
        defaultValue: {},
    },
    lightboxSettings: {
        type: ControlType.Object,
        title: "Lightbox",
        controls: {
            showThumbnails: {
                type: ControlType.Boolean,
                title: "Thumbnails",
                defaultValue: true,
            },
            showCaption: {
                type: ControlType.Boolean,
                title: "Captions",
                defaultValue: true,
            },
            showFavorite: {
                type: ControlType.Boolean,
                title: "Favorites",
                defaultValue: true,
            },
            showShare: {
                type: ControlType.Boolean,
                title: "Share",
                defaultValue: true,
            },
            showFullscreen: {
                type: ControlType.Boolean,
                title: "Fullscreen",
                defaultValue: true,
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
            },
            autoplayDelay: {
                type: ControlType.Number,
                title: "Slide Delay",
                defaultValue: 4,
                min: 1,
                max: 20,
                step: 0.5,
                unit: "s",
                hidden: (v) => !v.autoplay,
            },
            transitionStyle: {
                type: ControlType.Enum,
                title: "Transition",
                options: ["zoom", "fade", "slide", "blur"],
                optionTitles: ["Zoom", "Fade", "Slide", "Blur"],
                defaultValue: "zoom",
            },
            slideshowEffect: {
                type: ControlType.Enum,
                title: "Slideshow FX",
                options: ["fade", "crossfade", "zoom", "ken-burns"],
                optionTitles: ["Fade", "Crossfade", "Zoom", "Ken Burns"],
                defaultValue: "fade",
            },
            showShortcutHelp: {
                type: ControlType.Boolean,
                title: "Shortcut Help",
                defaultValue: true,
            },
            animationDuration: {
                type: ControlType.Number,
                title: "Animation",
                defaultValue: 0.42,
                min: 0,
                max: 1.5,
                step: 0.01,
                unit: "s",
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Overlay",
                defaultValue: "rgba(0,0,0,0.9)",
            },
            cursorSize: {
                type: ControlType.Number,
                title: "Close Cursor",
                defaultValue: 58,
                min: 32,
                max: 120,
                step: 1,
                unit: "px",
            },
            closeOnBackdropClick: {
                type: ControlType.Boolean,
                title: "Backdrop Close",
                defaultValue: true,
            },
        },
        defaultValue: {},
    },
    animationSettings: {
        type: ControlType.Object,
        title: "Animations",
        controls: {
            animateFiltering: {
                type: ControlType.Boolean,
                title: "Filter Animation",
                defaultValue: true,
            },
            animateImageClick: {
                type: ControlType.Boolean,
                title: "Click Animation",
                defaultValue: true,
            },
            filterAnimationDuration: {
                type: ControlType.Number,
                title: "Filter Speed",
                min: 0.15,
                max: 1.2,
                step: 0.05,
                defaultValue: 0.42,
                hidden: (v) => !v.animateFiltering,
            },
            filterAnimationStagger: {
                type: ControlType.Number,
                title: "Filter Stagger",
                min: 0,
                max: 0.18,
                step: 0.005,
                defaultValue: 0.045,
                hidden: (v) => !v.animateFiltering,
            },
        },
        defaultValue: {},
    },
})
