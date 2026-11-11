// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useState } from "react"

const seed = (n: number) => {
    const x = Math.sin(n + 1) * 10000
    return x - Math.floor(x)
}

const optimizeUrl = (url: string, width: number) => {
    if (!url || !url.includes("res.cloudinary.com")) return url
    return url.replace("/upload/", `/upload/w_${width},f_auto,q_75/`)
}

const fullUrl = (url: string) => {
    if (!url || !url.includes("res.cloudinary.com")) return url
    return url.replace("/upload/", `/upload/w_1800,f_auto,q_85/`)
}

const isVideo = (url: string) => {
    if (!url) return false
    return /\.(mp4|webm|mov|ogg)$/i.test(url) || url.includes("video")
}

// Extract video thumbnail URL
const getVideoThumb = (url: string): string | null => {
    if (!url) return null
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const id = url.includes("youtu.be")
            ? url.split("/").pop()?.split("?")[0]
            : new URLSearchParams(url.split("?")[1] || "").get("v")
        if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    }
    // Google Drive
    if (url.includes("drive.google.com")) {
        const match =
            url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^&]+)/)
        const id = match ? match[1] : ""
        if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`
    }
    // Vimeo — use oEmbed API
    if (url.includes("vimeo.com")) return null // fetched async
    return null
}

const vimeoThumbCache: Record<string, string> = {}

interface MediaItem {
    image: string
    videoFile?: string
    videoUrl?: string
    title?: string
    description?: string
    type?: "foto" | "video" | "auto"
}

interface Props {
    images: MediaItem[]
    columns: number
    cardWidth: number
    gap: number
    borderRadius: number
    chaos: number
    parallaxStrength: number
    backgroundColor: string
    pillActiveColor: string
    pillTextColor: string
    showTitles: boolean
    fontSize: number
    fontFamily: string
    textColor: string
    hoverOverlayColor: string
}

const ratioCache: Record<string, number> = {}
const SIZE_PATTERN = [
    1.0, 0.6, 1.4, 0.75, 1.2, 0.55, 1.1, 0.85, 1.35, 0.65, 1.15, 0.7, 1.05, 1.3,
    0.6, 0.9,
]

type Filter = "todos" | "fotos" | "videos"

export default function AsymmetricGrid({
    images = [],
    columns = 4,
    cardWidth = 220,
    gap = 20,
    borderRadius = 4,
    chaos = 80,
    parallaxStrength = 8,
    backgroundColor = "#0a0a0a",
    pillActiveColor = "#ffffff",
    pillTextColor = "#000000",
    showTitles = false,
    fontSize = 9,
    fontFamily = "Space Mono, monospace",
    textColor = "rgba(255,255,255,0.5)",
    hoverOverlayColor = "rgba(0,0,0,0.4)",
}: Props) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(900)
    const [ratios, setRatios] = useState<Record<number, number>>({})
    const [lightbox, setLightbox] = useState<{ idx: number } | null>(null)
    const [imgVisible, setImgVisible] = useState(true)
    const [modalVisible, setModalVisible] = useState(false)
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
    const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
    const [filter, setFilter] = useState<Filter>("todos")
    const [filterTransition, setFilterTransition] = useState(true)
    const [filterLoading, setFilterLoading] = useState(false)
    const [vimeoThumbs, setVimeoThumbs] = useState<Record<string, string>>({})
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])

    const allItems =
        images.length > 0
            ? images.map((item) => {
                  const hasVideo = !!(item.videoFile || item.videoUrl)
                  const videoSrc = item.videoFile || item.videoUrl || ""
                  const isVideoType =
                      item.type === "video" ||
                      (item.type === "auto" &&
                          (hasVideo || isVideo(item.image)))
                  return {
                      ...item,
                      resolvedUrl:
                          isVideoType && hasVideo ? videoSrc : item.image,
                      resolvedType: isVideoType ? "video" : "foto",
                  }
              })
            : Array.from({ length: 20 }, (_, i) => ({
                  image: "",
                  title: `${i + 1}`,
                  type: "foto" as const,
                  resolvedType: "foto",
              }))

    const filteredItems =
        filter === "todos"
            ? allItems
            : allItems.filter(
                  (item) =>
                      item.resolvedType === filter.slice(0, -1) || // "fotos" → "foto", "videos" → "video"
                      (filter === "fotos" && item.resolvedType === "foto") ||
                      (filter === "videos" && item.resolvedType === "video")
              )

    const cols =
        containerWidth < 480
            ? 1
            : containerWidth < 768
              ? Math.min(2, columns)
              : Math.max(2, columns)

    useEffect(() => {
        if (!wrapRef.current) return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width
            if (w) setContainerWidth(w)
        })
        ro.observe(wrapRef.current)
        setContainerWidth(wrapRef.current.offsetWidth)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        allItems.forEach((item, i) => {
            if (!item.image || isVideo(item.image)) return
            const cached = ratioCache[item.image]
            if (cached !== undefined) {
                setRatios((prev) => ({ ...prev, [i]: cached }))
                return
            }
            const img = new window.Image()
            img.onload = () => {
                const r = img.naturalHeight / img.naturalWidth
                ratioCache[item.image] = r
                setRatios((prev) => ({ ...prev, [i]: r }))
            }
            img.src = optimizeUrl(item.image, 40)
        })
    }, [JSON.stringify(allItems.map((i) => i.image))])

    useEffect(() => {
        // Small delay to let DOM update after filter change
        const timer = setTimeout(() => {
            const obs = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const idx = Number(
                                (entry.target as HTMLElement).dataset.idx
                            )
                            setVisibleItems((prev) => new Set([...prev, idx]))
                            obs.unobserve(entry.target)
                        }
                    })
                },
                { threshold: 0.01, rootMargin: "0px 0px 100px 0px" }
            )
            cardRefs.current.forEach((el) => {
                if (el) obs.observe(el)
            })
            return () => obs.disconnect()
        }, 250)
        return () => clearTimeout(timer)
    }, [filter, filteredItems.length, containerWidth])

    // Fetch Vimeo thumbnails
    useEffect(() => {
        allItems.forEach((item) => {
            const url = item.videoUrl || item.videoFile || item.image || ""
            if (!url.includes("vimeo.com")) return
            if (vimeoThumbCache[url]) {
                setVimeoThumbs((prev) => ({
                    ...prev,
                    [url]: vimeoThumbCache[url],
                }))
                return
            }
            const id = url.split("/").pop()?.split("?")[0]
            if (!id) return
            fetch(`https://vimeo.com/api/v2/video/${id}.json`)
                .then((r) => r.json())
                .then((data) => {
                    const thumb =
                        data[0]?.thumbnail_large ||
                        data[0]?.thumbnail_medium ||
                        ""
                    if (thumb) {
                        vimeoThumbCache[url] = thumb
                        setVimeoThumbs((prev) => ({ ...prev, [url]: thumb }))
                    }
                })
                .catch(() => {})
        })
    }, [JSON.stringify(allItems.map((i) => i.videoUrl || i.image))])

    useEffect(() => {
        if (!wrapRef.current || !innerRef.current) return
        const wrap = wrapRef.current
        const inner = innerRef.current
        let curX = 0,
            curY = 0,
            rafId = 0
        const m = { x: 0.5, y: 0.5 }
        const onMove = (e: MouseEvent) => {
            const rect = wrap.getBoundingClientRect()
            m.x = (e.clientX - rect.left) / rect.width
            m.y = (e.clientY - rect.top) / rect.height
        }
        const onLeave = () => {
            m.x = 0.5
            m.y = 0.5
        }
        const raf = () => {
            const tx = (m.x - 0.5) * parallaxStrength * 2
            const ty = (m.y - 0.5) * parallaxStrength
            curX += (tx - curX) * 0.04
            curY += (ty - curY) * 0.04
            inner.style.transform = `translate(${curX}px, ${curY}px)`
            const imgs = inner.querySelectorAll(
                ".gx-img"
            ) as NodeListOf<HTMLElement>
            imgs.forEach((img) => {
                const imgX = (m.x - 0.5) * parallaxStrength * -0.6
                const imgY = (m.y - 0.5) * parallaxStrength * -0.6
                img.style.transform = `scale(1.12) translate(${imgX}px, ${imgY}px)`
            })
            rafId = requestAnimationFrame(raf)
        }
        rafId = requestAnimationFrame(raf)
        wrap.addEventListener("mousemove", onMove)
        wrap.addEventListener("mouseleave", onLeave)
        return () => {
            cancelAnimationFrame(rafId)
            wrap.removeEventListener("mousemove", onMove)
            wrap.removeEventListener("mouseleave", onLeave)
        }
    }, [parallaxStrength])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setModalVisible(false)
                setTimeout(() => setLightbox(null), 260)
            }
            if (e.key === "ArrowRight") {
                setImgVisible(false)
                setTimeout(() => {
                    setLightbox((prev) =>
                        prev
                            ? { idx: (prev.idx + 1) % filteredItems.length }
                            : null
                    )
                    setImgVisible(true)
                }, 180)
            }
            if (e.key === "ArrowLeft") {
                setImgVisible(false)
                setTimeout(() => {
                    setLightbox((prev) =>
                        prev
                            ? {
                                  idx:
                                      (prev.idx - 1 + filteredItems.length) %
                                      filteredItems.length,
                              }
                            : null
                    )
                    setImgVisible(true)
                }, 180)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [filteredItems.length])

    const handleFilterChange = (f: Filter) => {
        if (f === filter) return
        setFilterTransition(false)
        setFilterLoading(true)
        setVisibleItems(new Set())
        setTimeout(() => {
            setFilter(f)
            setFilterTransition(true)
            setTimeout(() => setFilterLoading(false), 300)
            // Fallback: make all items visible after 600ms in case observer misses them
            setTimeout(() => {
                setVisibleItems((prev) => {
                    const next = new Set(prev)
                    for (let i = 0; i < 200; i++) next.add(i)
                    return next
                })
            }, 600)
        }, 220)
    }

    // Layout engine
    const colW = Math.floor((containerWidth - gap * (cols + 1)) / cols)
    const colCursors = new Array(cols).fill(gap)
    for (let c = 0; c < cols; c++) {
        colCursors[c] = gap + seed(c * 13) * Math.min(chaos * 0.5, 80)
    }

    type CardLayout = {
        item: (typeof filteredItems)[0]
        idx: number
        x: number
        y: number
        w: number
        h: number
    }
    const layouts: CardLayout[] = []

    filteredItems.forEach((item, i) => {
        const sizeVar = SIZE_PATTERN[i % SIZE_PATTERN.length]
        const w = Math.round(colW * Math.min(sizeVar, 1.0))
        const ratio = isVideo(item.image)
            ? 9 / 16
            : (ratios[allItems.indexOf(item)] ?? 0.9 + seed(i * 7) * 1.2)
        const h = Math.round(w * ratio)

        const minHeight = Math.min(...colCursors)
        const shortestCols = colCursors
            .map((ch, c) => (ch === minHeight ? c : -1))
            .filter((c) => c >= 0)
        const col = shortestCols[Math.floor(seed(i * 31) * shortestCols.length)]

        const colX = gap + col * (colW + gap)
        const xOffset = (seed(i * 3) - 0.5) * Math.min(chaos * 0.25, colW * 0.1)
        const x = Math.max(
            gap / 2,
            Math.min(colX + xOffset, containerWidth - w - gap / 2)
        )
        const extraGap = seed(i * 11) * Math.min(chaos * 0.3, 40)
        const y = colCursors[col] + extraGap

        layouts.push({ item, idx: i, x, y, w, h })
        colCursors[col] = y + h + gap + (showTitles ? fontSize * 2 + 10 : 0)
    })

    const totalHeight = Math.max(...colCursors) + gap * 2

    const filters: { key: Filter; label: string }[] = [
        { key: "todos", label: "All" },
        { key: "fotos", label: "Photos" },
        { key: "videos", label: "Videos" },
    ]

    return (
        <div
            ref={wrapRef}
            style={{
                width: "100%",
                background: backgroundColor,
                boxSizing: "border-box",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <style>{`
                .gx-img { transition: transform 0.15s ease !important; }
                .gx-card:hover .gx-overlay { opacity: 1 !important; }
                .gx-card:hover .gx-icon { opacity: 1 !important; transform: scale(1) !important; }
                .gx-pill:hover { background: rgba(255,255,255,0.12) !important; }
                @keyframes lbScale{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
                @keyframes lbSkeleton{0%{opacity:0.4}50%{opacity:0.8}100%{opacity:0.4}}
                .lb-arrow:hover{background:rgba(255,255,255,0.14)!important}
                .lb-close:hover{background:rgba(255,255,255,0.18)!important}
                .lb-thumb:hover{opacity:1!important}
            `}</style>

            {/* Vignette */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 100,
                    pointerEvents: "none",
                    background: `radial-gradient(ellipse at center, transparent 40%, ${backgroundColor} 100%)`,
                }}
            />

            {/* Filter pills */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    padding: `${gap}px ${gap}px 0`,
                    position: "relative",
                    zIndex: 101,
                }}
            >
                {filters.map(({ key, label }) => {
                    const isActive = filter === key
                    return (
                        <button
                            key={key}
                            className="gx-pill"
                            onClick={() => handleFilterChange(key)}
                            style={{
                                padding: "7px 16px",
                                borderRadius: 100,
                                border: `1px solid ${isActive ? "transparent" : "rgba(255,255,255,0.15)"}`,
                                background: isActive
                                    ? pillActiveColor
                                    : "transparent",
                                color: isActive
                                    ? pillTextColor
                                    : "rgba(255,255,255,0.55)",
                                fontFamily: "Inter Display, Inter, sans-serif",
                                fontSize: 12,
                                fontWeight: isActive ? 500 : 400,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                letterSpacing: "0.02em",
                            }}
                        >
                            {label}
                        </button>
                    )
                })}
            </div>

            {/* Empty state */}
            {filteredItems.length === 0 && filterTransition && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "80px 24px",
                        opacity: filterTransition ? 1 : 0,
                        transition: "opacity 0.3s ease",
                    }}
                >
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16,
                        }}
                    >
                        {filter === "videos" ? (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        ) : (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M13 21.5V21C13 18.1716 13 16.7574 13.8787 15.8787C14.7574 15 16.1716 15 19 15H19.5M20 13.3431V10C20 6.22876 20 4.34315 18.8284 3.17157C17.6569 2 15.7712 2 12 2C8.22877 2 6.34315 2 5.17157 3.17157C4 4.34314 4 6.22876 4 10L4 14.5442C4 17.7892 4 19.4117 4.88607 20.5107C5.06508 20.7327 5.26731 20.9349 5.48933 21.1139C6.58831 22 8.21082 22 11.4558 22C12.1614 22 12.5141 22 12.8372 21.886C12.9044 21.8623 12.9702 21.835 13.0345 21.8043C13.3436 21.6564 13.593 21.407 14.0919 20.9081L18.8284 16.1716C19.4065 15.5935 19.6955 15.3045 19.8478 14.9369C20 14.5694 20 14.1606 20 13.3431Z"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        )}
                    </div>
                    <p
                        style={{
                            fontFamily: "Inter Display, Inter, sans-serif",
                            fontSize: 14,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.4)",
                            margin: 0,
                            textAlign: "center",
                        }}
                    >
                        {filter === "videos"
                            ? "No videos here yet"
                            : "No photos here yet"}
                    </p>
                </div>
            )}

            {/* Skeleton grid during filter transition */}
            {filterLoading && filteredItems.length > 0 && (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        padding: `0 ${gap}px`,
                        boxSizing: "border-box",
                        marginTop: gap,
                        display: "flex",
                        gap: gap,
                        alignItems: "flex-start",
                    }}
                >
                    {Array.from({ length: cols }).map((_, c) => (
                        <div
                            key={c}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: gap,
                                marginTop: c % 2 === 1 ? 40 : 0,
                            }}
                        >
                            {Array.from({ length: 3 }).map((_, r) => {
                                const skH = [180, 260, 200][r % 3]
                                return (
                                    <div
                                        key={r}
                                        style={{
                                            width: "100%",
                                            height: skH,
                                            borderRadius,
                                            background:
                                                "rgba(255,255,255,0.05)",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background:
                                                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
                                                animation:
                                                    "skeletonShimmer 1.4s ease infinite",
                                                animationDelay: `${(c * 3 + r) * 100}ms`,
                                            }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                    <style>{`@keyframes skeletonShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
                </div>
            )}

            {/* Grid */}
            <div
                ref={innerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: filteredItems.length === 0 ? 0 : totalHeight,
                    willChange: "transform",
                    marginTop: gap,
                    opacity: filterTransition ? 1 : 0,
                    transform: filterTransition
                        ? "translateY(0)"
                        : "translateY(12px)",
                    transition: "opacity 0.22s ease, transform 0.22s ease",
                }}
            >
                {layouts.map(({ item, idx, x, y, w, h }) => {
                    const isVid = item.resolvedType === "video"
                    const resolvedUrl = (item as any).resolvedUrl || item.image
                    const imageUrl = isVid
                        ? resolvedUrl
                        : optimizeUrl(item.image || "", w * 2)
                    const title = item.title || ""
                    const isVisible = visibleItems.has(idx)
                    const delay = Math.round(seed(idx * 3) * 300)

                    return (
                        <div
                            key={`${filter}-${idx}`}
                            data-idx={idx}
                            ref={(el) => {
                                cardRefs.current[idx] = el
                            }}
                            style={{
                                position: "absolute",
                                left: x,
                                top: y,
                                width: w,
                                cursor: "pointer",
                                zIndex: hoveredIdx === idx ? 10 : 1,
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible
                                    ? "translateY(0)"
                                    : "translateY(24px)",
                                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
                            }}
                            onClick={() => {
                                setLightbox({ idx })
                                requestAnimationFrame(() =>
                                    requestAnimationFrame(() =>
                                        setModalVisible(true)
                                    )
                                )
                            }}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        >
                            <div
                                className="gx-card"
                                style={{
                                    width: "100%",
                                    height: h,
                                    borderRadius,
                                    overflow: "hidden",
                                    position: "relative",
                                    background: `hsl(${(idx * 41) % 360},10%,15%)`,
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    transition:
                                        "transform 0.4s ease, box-shadow 0.4s ease",
                                    transform:
                                        hoveredIdx === idx
                                            ? "scale(1.03)"
                                            : "scale(1)",
                                    boxShadow:
                                        hoveredIdx === idx
                                            ? "0 20px 60px rgba(0,0,0,0.7)"
                                            : "0 4px 20px rgba(0,0,0,0.3)",
                                }}
                            >
                                {isVid ? (
                                    (() => {
                                        const vidSrc =
                                            (item as any).resolvedUrl ||
                                            item.image ||
                                            ""
                                        const isDriveVid =
                                            vidSrc.includes("drive.google.com")
                                        const ytThumb = getVideoThumb(vidSrc)
                                        const vimeoThumb = vimeoThumbs[vidSrc]
                                        const thumb = ytThumb || vimeoThumb
                                        return (
                                            <>
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            display: "block",
                                                            pointerEvents:
                                                                "none",
                                                        }}
                                                    />
                                                ) : (
                                                    <video
                                                        src={vidSrc}
                                                        muted
                                                        playsInline
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            display: "block",
                                                            pointerEvents:
                                                                "none",
                                                        }}
                                                    />
                                                )}
                                                {/* Play icon */}
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 44,
                                                            height: 44,
                                                            borderRadius: "50%",
                                                            background:
                                                                "rgba(255,255,255,0.15)",
                                                            backdropFilter:
                                                                "blur(8px)",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                        }}
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 16 16"
                                                            fill="none"
                                                        >
                                                            <path
                                                                d="M5 3L13 8L5 13V3Z"
                                                                fill="white"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    })()
                                ) : (
                                    <img
                                        className="gx-img"
                                        src={imageUrl}
                                        alt={title}
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none",
                                            transform: "scale(1.12)",
                                        }}
                                    />
                                )}
                                <div
                                    className="gx-overlay"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: hoverOverlayColor,
                                        opacity: 0,
                                        transition: "opacity 0.3s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {!isVid && (
                                        <svg
                                            className="gx-icon"
                                            width="22"
                                            height="22"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            style={{
                                                opacity: 0,
                                                transform: "scale(0.7)",
                                                transition:
                                                    "opacity 0.3s ease, transform 0.3s ease",
                                            }}
                                        >
                                            <path
                                                d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z"
                                                stroke="rgba(255,255,255,0.9)"
                                                strokeWidth="1.5"
                                                fill="none"
                                            />
                                            <path
                                                d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z"
                                                stroke="rgba(255,255,255,0.9)"
                                                strokeWidth="1.5"
                                                fill="none"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            {showTitles && title && (
                                <div style={{ marginTop: 7 }}>
                                    <span
                                        style={{
                                            fontFamily,
                                            fontSize,
                                            color: textColor,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                            whiteSpace: "nowrap",
                                            fontWeight: 400,
                                            display: "block",
                                        }}
                                    >
                                        {title}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Lightbox */}
            {lightbox &&
                (() => {
                    const lbIdx = lightbox.idx
                    const lbItem = filteredItems[lbIdx]
                    const total = filteredItems.length
                    const prev = (lbIdx - 1 + total) % total
                    const next = (lbIdx + 1) % total
                    const isVid = lbItem?.resolvedType === "video"
                    const hasDesc = !!lbItem?.description

                    return (
                        <div
                            onClick={() => {
                                setModalVisible(false)
                                setTimeout(() => setLightbox(null), 260)
                            }}
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 9999,
                                background: "rgba(8,8,8,0.97)",
                                fontFamily: "Inter Display, Inter, sans-serif",
                                opacity: modalVisible ? 1 : 0,
                                transform: modalVisible
                                    ? "scale(1)"
                                    : "scale(1.02)",
                                transition:
                                    "opacity 0.25s ease, transform 0.25s ease",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "56px 64px 24px",
                                boxSizing: "border-box",
                                overflowY: "auto",
                                gap: 20,
                            }}
                        >
                            <style>{`
                            @keyframes lbSkeleton{0%{opacity:0.4}50%{opacity:0.8}100%{opacity:0.4}}
                            @keyframes lbScale{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
                            .lb-arrow:hover{background:rgba(255,255,255,0.15)!important}
                            .lb-close:hover{background:rgba(255,255,255,0.2)!important}
                            .lb-thumb-item:hover{opacity:1!important}
                            @media(max-width:768px){
                                .lb-content{flex-direction:column!important;align-items:center!important;gap:20px!important;max-width:100%!important}
                                .lb-desc{width:100%!important;max-width:100%!important}
                                .lb-arrow-l{left:8px!important}
                                .lb-arrow-r{right:8px!important}
                                .lb-bottom{max-width:calc(100vw - 32px)!important}
                                .lb-wrap{padding:56px 16px 24px!important}
                            }
                        `}</style>

                            {/* Counter */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 22,
                                    left: 24,
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.35)",
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {String(lbIdx + 1).padStart(2, "0")} /{" "}
                                {String(total).padStart(2, "0")}
                            </div>

                            {/* Close */}
                            <button
                                className="lb-close"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setModalVisible(false)
                                    setTimeout(() => setLightbox(null), 260)
                                }}
                                style={{
                                    position: "absolute",
                                    top: 16,
                                    right: 20,
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.1)",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "background 0.2s",
                                    zIndex: 10,
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085"
                                        stroke="rgba(255,255,255,0.8)"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>

                            {/* Main content row */}
                            <div
                                className="lb-content"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 40,
                                    maxWidth: "calc(100vw - 128px)",
                                    width: "100%",
                                    opacity: imgVisible ? 1 : 0,
                                    transform: imgVisible
                                        ? "translateY(0)"
                                        : "translateY(8px)",
                                    transition:
                                        "opacity 0.18s ease, transform 0.18s ease",
                                }}
                            >
                                {/* Media */}
                                <div
                                    style={{
                                        flexShrink: 1,
                                        flexGrow: 0,
                                        maxHeight: "65vh",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {isVid ? (
                                        (() => {
                                            const vidUrl =
                                                (lbItem as any)?.resolvedUrl ||
                                                lbItem?.image ||
                                                ""
                                            let embedUrl = vidUrl
                                            if (vidUrl.includes("vimeo.com")) {
                                                const id = vidUrl
                                                    .split("/")
                                                    .pop()
                                                    ?.split("?")[0]
                                                embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1`
                                            } else if (
                                                vidUrl.includes(
                                                    "youtube.com"
                                                ) ||
                                                vidUrl.includes("youtu.be")
                                            ) {
                                                const id = vidUrl.includes(
                                                    "youtu.be"
                                                )
                                                    ? vidUrl.split("/").pop()
                                                    : new URLSearchParams(
                                                          vidUrl.split("?")[1]
                                                      ).get("v")
                                                embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`
                                            } else if (
                                                vidUrl.includes(
                                                    "drive.google.com"
                                                )
                                            ) {
                                                // Extract Drive file ID from various URL formats
                                                const match =
                                                    vidUrl.match(
                                                        /\/file\/d\/([^\/]+)/
                                                    ) ||
                                                    vidUrl.match(/id=([^&]+)/)
                                                const id = match ? match[1] : ""
                                                embedUrl = `https://drive.google.com/file/d/${id}/preview`
                                            }
                                            const isEmbed =
                                                embedUrl.includes(
                                                    "player.vimeo"
                                                ) ||
                                                embedUrl.includes(
                                                    "youtube.com/embed"
                                                ) ||
                                                embedUrl.includes(
                                                    "drive.google.com"
                                                )
                                            return isEmbed ? (
                                                <iframe
                                                    key={lbIdx}
                                                    src={embedUrl}
                                                    allow="autoplay; fullscreen"
                                                    style={{
                                                        width: "min(70vw, 800px)",
                                                        height: "min(55vh, 480px)",
                                                        border: "none",
                                                        borderRadius: 4,
                                                    }}
                                                />
                                            ) : (
                                                <video
                                                    key={lbIdx}
                                                    src={vidUrl}
                                                    controls
                                                    autoPlay
                                                    style={{
                                                        maxWidth:
                                                            "min(70vw, 800px)",
                                                        maxHeight: "65vh",
                                                        borderRadius: 4,
                                                    }}
                                                />
                                            )
                                        })()
                                    ) : (
                                        <img
                                            key={lbIdx}
                                            src={fullUrl(
                                                (lbItem as any)?.resolvedUrl ||
                                                    lbItem?.image ||
                                                    ""
                                            )}
                                            alt={lbItem?.title || ""}
                                            style={{
                                                maxWidth: hasDesc
                                                    ? "min(50vw, 660px)"
                                                    : "min(75vw, 900px)",
                                                maxHeight: "65vh",
                                                width: "auto",
                                                height: "auto",
                                                objectFit: "contain",
                                                display: "block",
                                                boxShadow:
                                                    "0 20px 60px rgba(0,0,0,0.7)",
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Description */}
                                {hasDesc && (
                                    <div
                                        className="lb-desc"
                                        style={{
                                            width: 220,
                                            flexShrink: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 12,
                                        }}
                                    >
                                        {lbItem?.title && (
                                            <span
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: 600,
                                                    color: "rgba(255,255,255,0.9)",
                                                    letterSpacing: "-0.01em",
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {lbItem.title}
                                            </span>
                                        )}
                                        <div
                                            style={{
                                                width: 24,
                                                height: 1,
                                                background:
                                                    "rgba(255,255,255,0.2)",
                                            }}
                                        />
                                        <p
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 400,
                                                color: "rgba(255,255,255,0.55)",
                                                lineHeight: 1.7,
                                                margin: 0,
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {(lbItem?.description || "").slice(
                                                0,
                                                255
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Bottom bar */}
                            <div
                                className="lb-bottom"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "12px 16px",
                                    borderRadius: 14,
                                    background: "rgba(255,255,255,0.07)",
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    maxWidth: "calc(100vw - 128px)",
                                    overflowX: "auto",
                                    scrollbarWidth: "none" as any,
                                    flexShrink: 0,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        marginRight: 4,
                                        flexShrink: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: "rgba(255,255,255,0.85)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {lbItem?.title || "—"}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: "rgba(255,255,255,0.35)",
                                            letterSpacing: "0.05em",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {String(lbIdx + 1).padStart(2, "0")} of{" "}
                                        {total}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        width: 1,
                                        height: 36,
                                        background: "rgba(255,255,255,0.12)",
                                        flexShrink: 0,
                                    }}
                                />
                                {[0, 1, 2, 3, 4].map((pos) => {
                                    const ti = (lbIdx + pos) % total
                                    const isLast = pos === 4
                                    const remaining = total - lbIdx - 4
                                    const thumbItem = filteredItems[ti]
                                    const thumbIsVid =
                                        thumbItem?.resolvedType === "video"
                                    return (
                                        <div
                                            key={pos}
                                            className="lb-thumb-item"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!isLast) {
                                                    setImgVisible(false)
                                                    setTimeout(() => {
                                                        setLightbox({ idx: ti })
                                                        setImgVisible(true)
                                                    }, 180)
                                                }
                                            }}
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 6,
                                                overflow: "hidden",
                                                cursor: isLast
                                                    ? "default"
                                                    : "pointer",
                                                flexShrink: 0,
                                                position: "relative",
                                                border:
                                                    pos === 0
                                                        ? "1.5px solid rgba(255,255,255,0.5)"
                                                        : "1.5px solid transparent",
                                                opacity: pos === 0 ? 1 : 0.5,
                                                transition: "all 0.2s",
                                                background:
                                                    "rgba(255,255,255,0.05)",
                                            }}
                                        >
                                            {(() => {
                                                const thumbVidSrc =
                                                    (thumbItem as any)
                                                        ?.resolvedUrl ||
                                                    thumbItem?.image ||
                                                    ""
                                                const thumbVideoThumb =
                                                    thumbIsVid
                                                        ? getVideoThumb(
                                                              thumbVidSrc
                                                          ) ||
                                                          vimeoThumbs[
                                                              thumbVidSrc
                                                          ]
                                                        : null
                                                if (
                                                    thumbIsVid &&
                                                    thumbVideoThumb
                                                ) {
                                                    return (
                                                        <img
                                                            src={
                                                                thumbVideoThumb
                                                            }
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                                display:
                                                                    "block",
                                                            }}
                                                        />
                                                    )
                                                }
                                                if (thumbIsVid) {
                                                    return (
                                                        <video
                                                            src={thumbVidSrc}
                                                            muted
                                                            playsInline
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    )
                                                }
                                                return (
                                                    <img
                                                        src={optimizeUrl(
                                                            thumbItem?.image ||
                                                                "",
                                                            120
                                                        )}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            display: "block",
                                                        }}
                                                    />
                                                )
                                            })()}
                                            {isLast && remaining > 0 && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background:
                                                            "rgba(0,0,0,0.72)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            color: "rgba(255,255,255,0.85)",
                                                        }}
                                                    >
                                                        +{remaining}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Prev */}
                            <button
                                className="lb-arrow lb-arrow-l"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setImgVisible(false)
                                    setTimeout(() => {
                                        setLightbox({ idx: prev })
                                        setImgVisible(true)
                                    }, 180)
                                }}
                                style={{
                                    position: "absolute",
                                    left: 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.08)",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "background 0.2s",
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18"
                                        stroke="rgba(255,255,255,0.8)"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>

                            {/* Next */}
                            <button
                                className="lb-arrow lb-arrow-r"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setImgVisible(false)
                                    setTimeout(() => {
                                        setLightbox({ idx: next })
                                        setImgVisible(true)
                                    }, 180)
                                }}
                                style={{
                                    position: "absolute",
                                    right: 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.08)",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "background 0.2s",
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18"
                                        stroke="rgba(255,255,255,0.8)"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    )
                })()}
        </div>
    )
}

addPropertyControls(AsymmetricGrid, {
    images: {
        type: ControlType.Array,
        title: "Media",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Photo" },
                videoFile: {
                    type: ControlType.File,
                    title: "Video (Upload)",
                    allowedFileTypes: ["mp4", "webm", "mov", "ogg"],
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    defaultValue: "",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                },
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["auto", "foto", "video"],
                    optionTitles: ["Auto", "Photo", "Video"],
                    defaultValue: "auto",
                },
            },
        },
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 4,
        min: 2,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Base Width",
        defaultValue: 220,
        min: 80,
        max: 600,
        step: 10,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 4,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 4,
        min: 0,
        max: 60,
        step: 1,
        displayStepper: true,
    },
    chaos: {
        type: ControlType.Number,
        title: "Chaos",
        defaultValue: 80,
        min: 0,
        max: 200,
        step: 10,
        displayStepper: true,
        description:
            "Controls how scattered the layout looks. Low values keep tiles aligned, high values spread them out for an organic, editorial feel.",
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 2,
        displayStepper: true,
        description:
            "Strength of the mouse-follow motion. Set to 0 to disable parallax, higher values add more depth on hover.",
    },
    pillActiveColor: {
        type: ControlType.Color,
        title: "Active Pill",
        defaultValue: "#ffffff",
    },
    pillTextColor: {
        type: ControlType.Color,
        title: "Active Pill Text",
        defaultValue: "#000000",
    },
    hoverOverlayColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "rgba(0,0,0,0.4)",
    },
    showTitles: {
        type: ControlType.Boolean,
        title: "Show Titles",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 9,
        min: 7,
        max: 24,
        step: 1,
        displayStepper: true,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Space Mono, monospace",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "rgba(255,255,255,0.5)",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
    },
})
