import { useRef, useState, useEffect, useLayoutEffect, useMemo } from "react"
import { createPortal } from "react-dom"
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
    useScroll,
    useTransform,
    MotionValue,
    AnimatePresence,
} from "framer-motion"

// --- Types ---
interface SyncScrollSliderProps {
    rowCount: number
    mediaRow1?: string[]
    mediaRow2?: string[]
    mediaRow3?: string[]
    videoPoster?: string
    gap: number
    imgWidth: number
    imgHeight: number
    borderRadius: number
    speed: number
}

// One visual slot in a row. `logicalIndex` always points at the ORIGINAL
// media array, so the lightbox never depends on the padded visual list.
interface SlideEntry {
    url: string
    logicalIndex: number
    isDuplicate: boolean
}

interface LiveVideoSlot {
    rowIndex: number
    logicalIndex: number
    url: string
}

interface SyncScrollSliderRowProps {
    mediaList: string[]
    translationX: MotionValue<string>
    gap: number
    imgWidth: number
    imgHeight: number
    borderRadius: number
    rowIndex: number
    videoPoster?: string
    liveVideoSlot: LiveVideoSlot | null
    registerSlotHost: (el: HTMLDivElement | null) => void
    onItemClick: (rowIndex: number, logicalIndex: number) => void
}

// --- Constants / helpers ---
const MIN_REQUIRED = 7

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const isVideo = (url: string) => {
    if (!url) return false
    return (
        url.match(/\.(mp4|webm|ogg|mov|m4v)/i) !== null ||
        url.includes("videos%") ||
        url.includes(".mp4")
    )
}

// Originals are kept exactly once and in order. Only IMAGES are repeated to
// reach the minimum slot count. Videos are never duplicated.
function buildExtendedList(
    mediaList: string[],
    minRequired: number = MIN_REQUIRED
): SlideEntry[] {
    const entries: SlideEntry[] = mediaList.map((url, i) => ({
        url,
        logicalIndex: i,
        isDuplicate: false,
    }))

    const imageEntries = entries.filter((e) => !isVideo(e.url))
    if (entries.length === 0 || imageEntries.length === 0) return entries

    let cursor = 0
    while (entries.length < minRequired) {
        const source = imageEntries[cursor % imageEntries.length]
        entries.push({ ...source, isDuplicate: true })
        cursor++
    }
    return entries
}

// First video found in the visible rows owns the single live <video>.
function findPrimaryVideo(rows: { media: string[] }[]): LiveVideoSlot | null {
    for (let r = 0; r < rows.length; r++) {
        for (let i = 0; i < rows[r].media.length; i++) {
            if (isVideo(rows[r].media[i])) {
                return { rowIndex: r, logicalIndex: i, url: rows[r].media[i] }
            }
        }
    }
    return null
}

function safePlay(v: HTMLVideoElement) {
    if (!v.isConnected) return
    const p = v.play()
    if (p && typeof p.catch === "function") p.catch(() => {})
}

// Only changes how the SAME element looks. Never touches src/currentTime.
function applyVideoPresentation(
    v: HTMLVideoElement,
    mode: "slider" | "lightbox"
) {
    if (mode === "slider") {
        v.controls = false
        v.muted = true
        Object.assign(v.style, {
            display: "block",
            width: "100%",
            height: "100%",
            maxWidth: "none",
            maxHeight: "none",
            objectFit: "cover",
            cursor: "pointer",
        })
    } else {
        v.controls = true
        Object.assign(v.style, {
            display: "block",
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "80vh",
            objectFit: "contain",
            cursor: "default",
        })
    }
}

// --- Row ---
function SyncScrollSliderRow({
    mediaList,
    translationX,
    gap,
    imgWidth,
    imgHeight,
    borderRadius,
    rowIndex,
    videoPoster,
    liveVideoSlot,
    registerSlotHost,
    onItemClick,
}: SyncScrollSliderRowProps) {
    const extendedList = useMemo(
        () => buildExtendedList(mediaList),
        [mediaList]
    )

    const sharedStyles: React.CSSProperties = {
        width: `${imgWidth}px`,
        height: `${imgHeight}px`,
        objectFit: "cover",
        borderRadius: `${borderRadius}px`,
        cursor: "pointer",
    }

    const placeholderStyles: React.CSSProperties = {
        ...sharedStyles,
        overflow: "hidden",
        backgroundColor: "rgba(128, 128, 128, 0.18)",
        backgroundImage: videoPoster ? `url(${videoPoster})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
    }

    const hoverAnimation = {
        scale: 1.04,
        y: -6,
        filter: "brightness(1.08)",
    }

    const hoverTransition = {
        type: "spring",
        stiffness: 120,
        damping: 24,
        mass: 0.8,
    }

    return (
        <motion.div
            style={{
                display: "flex",
                gap: `${gap}px`,
                width: "max-content",
                x: translationX,
            }}
        >
            {extendedList.map((entry, index) => {
                const isMediaVideo = isVideo(entry.url)
                const isLiveSlot =
                    isMediaVideo &&
                    !entry.isDuplicate &&
                    !!liveVideoSlot &&
                    liveVideoSlot.rowIndex === rowIndex &&
                    liveVideoSlot.logicalIndex === entry.logicalIndex

                return (
                    <motion.div
                        key={`${entry.url}-${index}`}
                        whileHover={hoverAnimation}
                        transition={hoverTransition}
                        onClick={() =>
                            onItemClick(rowIndex, entry.logicalIndex)
                        }
                        style={{ display: "inline-block" }}
                    >
                        {isMediaVideo ? (
                            isLiveSlot ? (
                                // Empty host. The ONE persistent <video> is
                                // attached here imperatively by the parent.
                                <div
                                    ref={registerSlotHost}
                                    style={placeholderStyles}
                                />
                            ) : videoPoster ? (
                                // Defensive: any other video position is a
                                // poster image, never another <video>.
                                <img
                                    src={videoPoster}
                                    alt={`Slider item ${index}`}
                                    loading="lazy"
                                    decoding="async"
                                    width={imgWidth}
                                    height={imgHeight}
                                    style={sharedStyles}
                                />
                            ) : (
                                <div style={placeholderStyles} />
                            )
                        ) : (
                            <img
                                src={entry.url}
                                alt={`Slider item ${index}`}
                                loading="lazy"
                                decoding="async"
                                width={imgWidth}
                                height={imgHeight}
                                style={sharedStyles}
                            />
                        )}
                    </motion.div>
                )
            })}
        </motion.div>
    )
}

// Stable default arrays (module level, so memoised rows don't recompute)
const defaultMediaRow1 = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=70&fm=webp",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=70&fm=webp",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800&q=70&fm=webp",
]
const defaultMediaRow2 = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70&fm=webp",
    "https://images.unsplash.com/photo-1516117172878-fd2c41f4a759?w=800&q=70&fm=webp",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70&fm=webp",
]
const defaultMediaRow3 = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70&fm=webp",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=70&fm=webp",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=70&fm=webp",
]

// --- Main component ---
export default function SyncScrollSlider(props: SyncScrollSliderProps) {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
    const [currentIndex, setCurrentIndex] = useState<number | null>(null)

    // Persistent video state
    const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
    const [slotHostEl, setSlotHostEl] = useState<HTMLDivElement | null>(null)
    const [lightboxHostEl, setLightboxHostEl] = useState<HTMLDivElement | null>(
        null
    )
    const [inView, setInView] = useState(false)
    const shouldPlayRef = useRef(false)
    const guardUntilRef = useRef(0)

    useEffect(() => {
        if (typeof document !== "undefined") {
            setPortalTarget(document.body)
        }
    }, [])

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start .8", "end .1"],
    })

    const leftShift = `-${props.speed * 1.7}%`
    const rightShift = `${props.speed * 1.3}%`

    const leftTranslation = useTransform(
        scrollYProgress,
        [0, 1],
        ["0%", leftShift]
    )
    const rightTranslation = useTransform(
        scrollYProgress,
        [0, 1],
        ["0%", rightShift]
    )

    const row1Media =
        props.mediaRow1 && props.mediaRow1.length > 0
            ? props.mediaRow1
            : defaultMediaRow1
    const row2Media =
        props.mediaRow2 && props.mediaRow2.length > 0
            ? props.mediaRow2
            : defaultMediaRow2
    const row3Media =
        props.mediaRow3 && props.mediaRow3.length > 0
            ? props.mediaRow3
            : defaultMediaRow3

    const masterRowsConfig = [
        { key: "row-1", translation: leftTranslation, media: row1Media },
        { key: "row-2", translation: rightTranslation, media: row2Media },
        { key: "row-3", translation: leftTranslation, media: row3Media },
    ]

    const visibleRows = masterRowsConfig.slice(0, props.rowCount)

    // Lightbox playlist = ORIGINAL media only (never the padded visual list)
    const universalGalleryPlaylist = visibleRows.reduce<string[]>(
        (acc, row) => acc.concat(row.media),
        []
    )

    const primaryVideo = findPrimaryVideo(visibleRows)
    const hasVideo = !!primaryVideo

    const handleItemClick = (rowIndex: number, logicalIndex: number) => {
        let flatIndex = 0
        for (let i = 0; i < rowIndex; i++) {
            flatIndex += visibleRows[i].media.length
        }
        setCurrentIndex(flatIndex + logicalIndex)
    }

    const nextSlide = () => {
        if (currentIndex !== null) {
            setCurrentIndex(
                (currentIndex + 1) % universalGalleryPlaylist.length
            )
        }
    }

    const prevSlide = () => {
        if (currentIndex !== null) {
            setCurrentIndex(
                (currentIndex - 1 + universalGalleryPlaylist.length) %
                    universalGalleryPlaylist.length
            )
        }
    }

    useEffect(() => {
        if (currentIndex === null) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextSlide()
            if (e.key === "ArrowLeft") prevSlide()
            if (e.key === "Escape") setCurrentIndex(null)
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [currentIndex])

    const activeMediaUrl =
        currentIndex !== null ? universalGalleryPlaylist[currentIndex] : null
    const lightboxOpen = currentIndex !== null && !!activeMediaUrl
    const lightboxShowsVideo =
        lightboxOpen && !!activeMediaUrl && isVideo(activeMediaUrl)

    // Source the single player should hold right now. Same video => no change.
    const activeVideoSrc: string | null = lightboxShowsVideo
        ? activeMediaUrl
        : primaryVideo
          ? primaryVideo.url
          : null

    // Video plays only when it is the thing being shown
    const shouldPlay = hasVideo && (lightboxOpen ? lightboxShowsVideo : inView)
    shouldPlayRef.current = shouldPlay

    // --- 1. Create the ONE <video> element (imperatively, once) ---
    // Created outside React's tree on purpose: it is moved between the slider
    // slot and the lightbox, and React must never try to reconcile/remove it.
    useEffect(() => {
        if (!hasVideo || typeof document === "undefined") return
        const v = document.createElement("video")
        v.defaultMuted = true
        v.muted = true
        v.loop = true
        v.playsInline = true
        v.setAttribute("playsinline", "")
        v.preload = "auto"
        applyVideoPresentation(v, "slider")
        setVideoEl(v)
        return () => {
            v.pause()
            v.removeAttribute("src")
            v.load() // teardown only: release the network/media resource
            v.remove()
            setVideoEl(null)
        }
    }, [hasVideo])

    // --- 2. Poster ---
    useEffect(() => {
        if (videoEl) videoEl.poster = props.videoPoster || ""
    }, [videoEl, props.videoPoster])

    // --- 3. Source: only assigned when it actually changes ---
    useEffect(() => {
        if (!videoEl || !activeVideoSrc) return
        if (videoEl.dataset.src !== activeVideoSrc) {
            videoEl.dataset.src = activeVideoSrc
            videoEl.src = activeVideoSrc
        }
    }, [videoEl, activeVideoSrc])

    // --- 4. Placement: move the SAME node between slot and lightbox ---
    // Re-parenting is synchronous (same task), no src change, no .load(),
    // so currentTime and the buffered data are untouched.
    useIsoLayoutEffect(() => {
        if (!videoEl) return
        const inLightbox = lightboxShowsVideo && !!lightboxHostEl
        const target = inLightbox ? lightboxHostEl : slotHostEl

        applyVideoPresentation(videoEl, inLightbox ? "lightbox" : "slider")

        if (target && videoEl.parentElement !== target) {
            guardUntilRef.current = performance.now() + 400
            target.appendChild(videoEl)
            if (shouldPlayRef.current) safePlay(videoEl)
        }
    }, [videoEl, slotHostEl, lightboxHostEl, lightboxShowsVideo])

    // Some browsers fire a pause after a DOM move. Resume only inside the
    // short post-move window, so the user's own pause button still works.
    useEffect(() => {
        if (!videoEl) return
        const onPause = () => {
            if (
                shouldPlayRef.current &&
                !videoEl.ended &&
                performance.now() < guardUntilRef.current
            ) {
                safePlay(videoEl)
            }
        }
        videoEl.addEventListener("pause", onPause)
        return () => videoEl.removeEventListener("pause", onPause)
    }, [videoEl])

    // --- 5. Play / pause state machine ---
    useEffect(() => {
        if (!videoEl) return
        if (shouldPlay) safePlay(videoEl)
        else videoEl.pause()
    }, [videoEl, shouldPlay, activeVideoSrc, slotHostEl])

    // --- 6. Pause when the slider is off-screen (scoped to this component) ---
    useEffect(() => {
        const el = sectionRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const smoothModalTransition = { ease: [0.16, 1, 0.3, 1], duration: 0.45 }
    const arrowHoverStyle = {
        scale: 1.1,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
    }

    return (
        <div
            ref={sectionRef}
            style={{
                width: "100%",
                padding: "60px 0",
                overflow: "hidden",
                backgroundColor: "transparent",
                willChange: "transform",
            }}
        >
            <div
                style={{
                    display: "flex",
                    gap: `${props.gap}px`,
                    flexDirection: "column",
                    width: "max-content",
                }}
            >
                {visibleRows.map((row, rIdx) => (
                    <SyncScrollSliderRow
                        key={row.key}
                        mediaList={row.media}
                        translationX={row.translation}
                        gap={props.gap}
                        imgWidth={props.imgWidth}
                        imgHeight={props.imgHeight}
                        borderRadius={props.borderRadius}
                        rowIndex={rIdx}
                        videoPoster={props.videoPoster}
                        liveVideoSlot={primaryVideo}
                        registerSlotHost={setSlotHostEl}
                        onItemClick={handleItemClick}
                    />
                ))}
            </div>

            {/* --- PORTALED FANCYBOX-STYLE LIGHTBOX --- */}
            {portalTarget &&
                createPortal(
                    <AnimatePresence mode="wait">
                        {currentIndex !== null && activeMediaUrl && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={() => setCurrentIndex(null)}
                                style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    width: "100vw",
                                    height: "100vh",
                                    backgroundColor: "rgba(10, 10, 11, 0.92)",
                                    zIndex: 99999,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    backdropFilter: "blur(16px)",
                                    cursor: "zoom-out",
                                    userSelect: "none",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "24px",
                                        left: "24px",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        fontFamily: "system-ui, sans-serif",
                                    }}
                                >
                                    {currentIndex + 1} /{" "}
                                    {universalGalleryPlaylist.length}
                                </div>

                                <div
                                    onClick={() => setCurrentIndex(null)}
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        right: "24px",
                                        color: "#fff",
                                        fontSize: "22px",
                                        cursor: "pointer",
                                        padding: "8px",
                                        opacity: 0.7,
                                    }}
                                >
                                    ✕
                                </div>

                                <motion.button
                                    whileHover={arrowHoverStyle}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        prevSlide()
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: "32px",
                                        background: "rgba(255, 255, 255, 0.12)",
                                        border: "none",
                                        color: "#fff",
                                        width: "54px",
                                        height: "54px",
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "30px",
                                        backdropFilter: "blur(4px)",
                                        transition: "background 0.2s ease",
                                        zIndex: 2,
                                    }}
                                >
                                    ‹
                                </motion.button>

                                {/* CENTRAL MEDIA BLOCK */}
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                                    transition={smoothModalTransition}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        maxWidth: "75%",
                                        maxHeight: "80vh",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderRadius: "16px",
                                        overflow: "hidden",
                                        boxShadow:
                                            "0px 40px 80px -20px rgba(0,0,0,0.8)",
                                    }}
                                >
                                    {isVideo(activeMediaUrl) ? (
                                        // No <video> here. The persistent video
                                        // is attached into this empty host.
                                        <div
                                            ref={setLightboxHostEl}
                                            style={{ display: "contents" }}
                                        />
                                    ) : (
                                        <img
                                            src={activeMediaUrl}
                                            alt="Enlarged gallery presentation"
                                            decoding="async"
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "80vh",
                                                objectFit: "contain",
                                            }}
                                        />
                                    )}
                                </motion.div>

                                <motion.button
                                    whileHover={arrowHoverStyle}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        nextSlide()
                                    }}
                                    style={{
                                        position: "absolute",
                                        right: "32px",
                                        background: "rgba(255, 255, 255, 0.12)",
                                        border: "none",
                                        color: "#fff",
                                        width: "54px",
                                        height: "54px",
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "30px",
                                        backdropFilter: "blur(4px)",
                                        transition: "background 0.2s ease",
                                        zIndex: 2,
                                    }}
                                >
                                    ›
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    portalTarget
                )}
        </div>
    )
}

SyncScrollSlider.defaultProps = {
    rowCount: 3,
    mediaRow1: [],
    mediaRow2: [],
    mediaRow3: [],
    gap: 20,
    imgWidth: 280,
    imgHeight: 160,
    borderRadius: 16,
    speed: 4,
}

const mediaFileControl = {
    type: ControlType.File as const,
    allowedFileTypes: ["png", "jpg", "jpeg", "webp", "gif", "mp4", "quicktime"],
}

addPropertyControls(SyncScrollSlider, {
    rowCount: {
        type: ControlType.Enum,
        title: "Total Rows",
        options: [1, 2, 3],
        optionTitles: ["1 Row", "2 Rows", "3 Rows"],
    },
    mediaRow1: {
        type: ControlType.Array,
        title: "Row 1 Media",
        control: mediaFileControl,
    },
    mediaRow2: {
        type: ControlType.Array,
        title: "Row 2 Media",
        control: mediaFileControl,
        hidden: (props) => props.rowCount < 2,
    },
    mediaRow3: {
        type: ControlType.Array,
        title: "Row 3 Media",
        control: mediaFileControl,
        hidden: (props) => props.rowCount < 3,
    },
    videoPoster: {
        type: ControlType.File,
        title: "Video Poster",
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
    },
    gap: {
        type: ControlType.Number,
        title: "Gap Size",
        min: 0,
        max: 100,
    },
    imgWidth: {
        type: ControlType.Number,
        title: "Item Width",
        min: 100,
        max: 600,
    },
    imgHeight: {
        type: ControlType.Number,
        title: "Item Height",
        min: 100,
        max: 600,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 50,
    },
    speed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
})
