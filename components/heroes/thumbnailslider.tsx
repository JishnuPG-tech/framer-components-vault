import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import Swiper from "swiper/bundle"

// the page's global head.
const SWIPER_BASE_CSS = `
.swiper {
    position: relative;
    overflow: hidden;
    list-style: none;
    padding: 0;
    z-index: 1;
}
.swiper-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 1;
    display: flex;
    box-sizing: content-box;
    transition-property: transform;
}
.swiper-slide {
    flex-shrink: 0;
    width: 100%;
    height: 100%;
    position: relative;
    transition-property: transform;
    display: block;
}
`

function ArrowIcon({
    isPrev,
    color,
    arrowImg,
    arrowRadius,
}: {
    isPrev: boolean
    color: string
    arrowImg?: string
    arrowRadius?: number
}) {
    if (arrowImg)
        return (
            <img
                src={arrowImg}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: arrowRadius,
                    transform: isPrev ? "none" : "rotate(180deg)",
                }}
            />
        )
    return (
        <svg
            width="45%"
            height="45%"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            style={{ transition: "stroke 0.2s" }}
        >
            <path d={isPrev ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
        </svg>
    )
}

function ThumbnailSlider(props) {
    const {
        fixedWidth,
        fixedHeight,
        images,
        showAutoplay,
        transitionSpeed,
        autoplayDelay,
        objectFit,
        innerPadding,
        loop,
        direction,
        slidePerView,
        slideRadius,
        slideGap,
        thumbnails,
        arrows,
        pagination,
        counter,
        progress,
    } = props

    const thumbPerView = thumbnails?.thumbPerView ?? 4
    const thumbRadius = thumbnails?.thumbRadius ?? 6
    const thumbGap = thumbnails?.thumbGap ?? 10
    const thumbActiveStyle = thumbnails?.thumbActiveStyle ?? "border"
    const thumbActiveColor = thumbnails?.thumbActiveColor ?? "#6366F1"
    const trayOffset = thumbnails?.trayOffset ?? 12

    const showArrows = arrows?.showArrows ?? true
    const arrowRadius = arrows?.arrowRadius ?? 30
    const arrowBg = arrows?.arrowBg ?? "rgba(15,15,20,0.7)"
    const arrowImg = arrows?.arrowImg ?? ""
    const arrowSize = arrows?.arrowSize ?? 44
    const arrowOffset = arrows?.arrowOffset ?? 0
    const arrowPosition = arrows?.arrowPosition ?? "center"
    const arrowLayout = arrows?.arrowLayout ?? "separate"
    const arrowGroupPlacement = arrows?.arrowGroupPlacement ?? "bottomRight"
    const arrowGroupGap = arrows?.arrowGroupGap ?? 8
    const arrowHoverBg = arrows?.arrowHoverBg ?? "rgba(99,102,241,0.9)"
    const arrowHoverScale = arrows?.arrowHoverScale ?? 1.1

    const showDots = pagination?.showDots ?? true
    const dotColor = pagination?.dotColor ?? "rgba(255,255,255,0.3)"
    const dotActiveColor = pagination?.dotActiveColor ?? "#6366F1"
    const dotRadius = pagination?.dotRadius ?? 4
    const dotSize = pagination?.dotSize ?? 7
    const dotGap = pagination?.dotGap ?? 8
    const dotPosition = pagination?.dotPosition ?? 16
    const dotPlacement = pagination?.dotPlacement ?? "bottomCenter"

    const showCounter = counter?.showCounter ?? true
    const counterFontSize = counter?.counterFontSize ?? 11
    const counterBg = counter?.counterBg ?? "rgba(15,15,20,0.8)"
    const counterColor = counter?.counterColor ?? "#FFFFFF"
    const counterRadius = counter?.counterRadius ?? 6
    const counterPosition = counter?.counterPosition ?? "topRight"

    const showProgressBar = progress?.showProgressBar ?? true
    const progressHeight = progress?.progressHeight ?? 3
    const progressTrackColor =
        progress?.progressTrackColor ?? "rgba(255,255,255,0.1)"
    const progressFillColor = progress?.progressFillColor ?? "#6366F1"
    const progressPosition = progress?.progressPosition ?? "bottom"
    const progressRadius = progress?.progressRadius ?? 0
    const progressOffset = progress?.progressOffset ?? 0

    const activeImages =
        images && images.length > 0
            ? images
            : [
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
                  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200",
                  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200",
              ]
    const total = activeImages.length
    const isVertical = direction === "vertical"

    const isStatic = useIsStaticRenderer()

    const [current, setCurrent] = useState(0)
    const [prog, setProgress] = useState(0)
    const [hoveredArrow, setHoveredArrow] = useState<string | null>(null)
    const [ready, setReady] = useState(false)

    const wrapperRef = useRef<HTMLDivElement>(null)
    const mainRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<HTMLDivElement>(null)
    const mainSwiper = useRef<any>(null)
    const thumbSwiper = useRef<any>(null)
    const progressTimer = useRef<any>(null)
    const autoplayTimer = useRef<any>(null)
    const propsRef = useRef(props)
    propsRef.current = props

    useEffect(() => {
        // Swiper is bundled with the component, so there is nothing to fetch.
        // In static contexts (e.g. canvas thumbnails, exports) we skip
        // initializing the carousel entirely and render a plain preview.
        if (isStatic) return
        setReady(true)
    }, [isStatic])

    useEffect(() => {
        if (!ready || isStatic) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp")
                mainSwiper.current?.slidePrev()
            if (e.key === "ArrowRight" || e.key === "ArrowDown")
                mainSwiper.current?.slideNext()
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [ready, isStatic])

    const startProgress = useCallback(() => {
        if (isStatic) return
        clearInterval(progressTimer.current)
        setProgress(0)
        if (!propsRef.current.showAutoplay) return
        const step = (propsRef.current.autoplayDelay * 1000) / 100
        progressTimer.current = setInterval(() => {
            setProgress((p) =>
                p >= 100 ? (clearInterval(progressTimer.current), 100) : p + 1
            )
        }, step)
    }, [])

    const goTo = useCallback(
        (idx: number) => {
            const s = mainSwiper.current
            if (!s || s.destroyed) return
            const safe = ((idx % total) + total) % total
            if (s.params.loop)
                s.slideToLoop(safe, propsRef.current.transitionSpeed * 1000)
            else s.slideTo(safe, propsRef.current.transitionSpeed * 1000)
        },
        [total]
    )

    const buildSwiper = useCallback(() => {
        if (isStatic || !mainRef.current || !thumbRef.current) return
        try {
            mainSwiper.current?.destroy(true, false)
        } catch (_) {}
        try {
            thumbSwiper.current?.destroy(true, false)
        } catch (_) {}
        const p = propsRef.current
        const tPerView = p.thumbnails?.thumbPerView ?? 4
        const tGap = p.thumbnails?.thumbGap ?? 10
        thumbSwiper.current = new Swiper(thumbRef.current, {
            direction: p.direction,
            slidesPerView: tPerView,
            spaceBetween: tGap,
            watchSlidesProgress: true,
            freeMode: false,
            touchRatio: 0.5,
            centeredSlides: false,
        })
        mainSwiper.current = new Swiper(mainRef.current, {
            direction: p.direction,
            slidesPerView: p.slidePerView,
            spaceBetween: p.slideGap,
            loop: p.loop,
            speed: p.transitionSpeed * 1000,
            thumbs: { swiper: thumbSwiper.current },
            ...(p.showAutoplay
                ? {
                      autoplay: {
                          delay: p.autoplayDelay * 1000,
                          disableOnInteraction: false,
                      },
                  }
                : {}),
            on: {
                slideChange(sw: any) {
                    setCurrent(sw.realIndex)
                    startProgress()
                    if (thumbSwiper.current && !thumbSwiper.current.destroyed) {
                        if (thumbSwiper.current.params.loop)
                            thumbSwiper.current.slideToLoop(sw.realIndex)
                        else thumbSwiper.current.slideTo(sw.realIndex)
                    }
                },
                init() {
                    startProgress()
                },
            },
        })
    }, [startProgress, isStatic])

    useEffect(() => {
        if (!ready || isStatic) return
        buildSwiper()
        return () => {
            clearInterval(progressTimer.current)
            clearTimeout(autoplayTimer.current)
            try {
                mainSwiper.current?.destroy(true, true)
            } catch (_) {}
            try {
                thumbSwiper.current?.destroy(true, true)
            } catch (_) {}
        }
    }, [ready, isStatic, buildSwiper])

    const prevStructural = useRef("")
    useEffect(() => {
        if (!ready || isStatic) return
        const key = [
            direction,
            loop,
            showAutoplay,
            autoplayDelay,
            transitionSpeed,
            slidePerView,
            slideGap,
            thumbPerView,
            thumbGap,
        ].join("|")
        if (key === prevStructural.current) return
        prevStructural.current = key
        buildSwiper()
    }, [
        ready,
        isStatic,
        direction,
        loop,
        showAutoplay,
        autoplayDelay,
        transitionSpeed,
        slidePerView,
        slideGap,
        thumbPerView,
        thumbGap,
        buildSwiper,
    ])

    useEffect(() => {
        if (!ready || isStatic || typeof ResizeObserver === "undefined") return
        let pending = false
        const ro = new ResizeObserver(() => {
            if (pending) return
            pending = true
            requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                    pending = false
                    try {
                        if (
                            thumbSwiper.current &&
                            !thumbSwiper.current.destroyed
                        )
                            thumbSwiper.current.update()
                        if (mainSwiper.current && !mainSwiper.current.destroyed)
                            mainSwiper.current.update()
                    } catch (_) {}
                })
            )
        })
        if (wrapperRef.current) ro.observe(wrapperRef.current)
        return () => ro.disconnect()
    }, [ready, isStatic])

    const arrowStyle = (isPrev: boolean): React.CSSProperties => {
        const vTop =
            arrowPosition === "center"
                ? "50%"
                : arrowPosition === "top"
                  ? "15%"
                  : "85%"
        const h: React.CSSProperties = {
            top: vTop,
            transform: "translateY(-50%)",
            left: isPrev ? innerPadding + arrowOffset : "auto",
            right: !isPrev ? innerPadding + arrowOffset : "auto",
        }
        const v: React.CSSProperties = {
            left: "50%",
            transform: "translateX(-50%)",
            top: isPrev ? innerPadding + arrowOffset : "auto",
            bottom: !isPrev ? innerPadding + arrowOffset : "auto",
        }
        const key = isPrev ? "prev" : "next"
        const hovered = hoveredArrow === key
        return {
            position: "absolute",
            width: arrowSize,
            height: arrowSize,
            borderRadius: arrowRadius,
            backgroundColor: hovered ? arrowHoverBg || arrowBg : arrowBg,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1,
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            transform:
                (isVertical ? v.transform : h.transform) +
                (hovered ? ` scale(${arrowHoverScale})` : ""),
            transition: "background-color 0.2s, transform 0.2s",
            ...(isVertical
                ? { left: v.left, top: v.top, bottom: v.bottom }
                : { top: h.top, left: h.left, right: h.right }),
        }
    }

    const groupedContainerStyle = (): React.CSSProperties => {
        const isTop = arrowGroupPlacement.includes("top")
        const isLeft = arrowGroupPlacement.includes("Left")
        const isCenter = arrowGroupPlacement.includes("Center")
        return {
            position: "absolute",
            display: "flex",
            flexDirection: "row",
            gap: arrowGroupGap,
            zIndex: 1,
            top: isTop ? innerPadding + arrowOffset : "auto",
            bottom: !isTop ? innerPadding + arrowOffset : "auto",
            left: isCenter
                ? "50%"
                : isLeft
                  ? innerPadding + arrowOffset
                  : "auto",
            right: isCenter
                ? "auto"
                : !isLeft
                  ? innerPadding + arrowOffset
                  : "auto",
            transform: isCenter ? "translateX(-50%)" : "none",
        }
    }

    const groupedBtnStyle = (isPrev: boolean): React.CSSProperties => {
        const key = isPrev ? "prev" : "next"
        const hovered = hoveredArrow === key
        return {
            width: arrowSize,
            height: arrowSize,
            borderRadius: arrowRadius,
            backgroundColor: hovered ? arrowHoverBg || arrowBg : arrowBg,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            transform: hovered ? `scale(${arrowHoverScale})` : "scale(1)",
            transition: "background-color 0.2s, transform 0.2s",
            flexShrink: 0,
        }
    }

    const counterStyle = (): React.CSSProperties => {
        const isTop = counterPosition.includes("top")
        const isLeft = counterPosition.includes("Left")
        return {
            position: "absolute",
            top: isTop ? innerPadding + 16 : "auto",
            bottom: !isTop ? innerPadding + 16 : "auto",
            left: isLeft ? innerPadding + 16 : "auto",
            right: !isLeft ? innerPadding + 16 : "auto",
            padding: "6px 14px",
            backgroundColor: counterBg,
            color: counterColor,
            borderRadius: counterRadius,
            fontSize: counterFontSize,
            fontWeight: 700,
            zIndex: 14,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }
    }

    const dotTrackStyle = (): React.CSSProperties => {
        const isTop = dotPlacement.includes("top")
        const isLeft = dotPlacement.includes("Left")
        const isCenter = dotPlacement.includes("Center")
        return {
            position: "absolute",
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            gap: dotGap,
            zIndex: 14,
            top: isVertical
                ? "50%"
                : isTop
                  ? innerPadding + dotPosition
                  : "auto",
            bottom: isVertical
                ? "auto"
                : !isTop
                  ? innerPadding + dotPosition
                  : "auto",
            left: isVertical
                ? dotPlacement.includes("Left")
                    ? innerPadding + dotPosition
                    : "auto"
                : isCenter
                  ? "50%"
                  : isLeft
                    ? innerPadding + 16
                    : "auto",
            right: isVertical
                ? dotPlacement.includes("Right")
                    ? innerPadding + dotPosition
                    : "auto"
                : isCenter
                  ? "auto"
                  : !isLeft
                    ? innerPadding + 16
                    : "auto",
            transform: isVertical
                ? "translateY(-50%)"
                : isCenter
                  ? "translateX(-50%)"
                  : "none",
        }
    }

    const handleMouseEnter = () => {
        if (isStatic) return
        if (showAutoplay && mainSwiper.current?.autoplay)
            mainSwiper.current.autoplay.stop()
    }
    const handleMouseLeave = () => {
        if (isStatic) return
        if (showAutoplay && mainSwiper.current?.autoplay)
            mainSwiper.current.autoplay.start()
    }

    const thumbTrayStyle: React.CSSProperties = {
        width: isVertical ? "20%" : "100%",
        height: isVertical ? "100%" : "20%",
        minHeight: isVertical ? "auto" : "70px",
        minWidth: isVertical ? "70px" : "auto",
        display: "flex",
        boxSizing: "border-box",
        alignItems: "center",
        justifyContent: "center",
        order: 1,
        marginLeft: isVertical ? trayOffset : 0,
        marginTop: !isVertical ? trayOffset : 0,
    }

    const rootStyle: React.CSSProperties = {
        width: "100%",
        height: fixedHeight,
        maxWidth: "100%",
        maxHeight: "100%",
        aspectRatio: 800 / 600,
        display: "flex",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "transparent",
        flexDirection: isVertical ? "row" : "column",
        fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
    }

    return (
        <div
            ref={wrapperRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={rootStyle}
        >
            <style>{SWIPER_BASE_CSS}</style>
            <div
                style={{
                    flex: 1,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    padding: innerPadding,
                    boxSizing: "border-box",
                    order: 0,
                }}
            >
                <div
                    ref={mainRef}
                    className="swiper"
                    style={{ width: "100%", height: "100%" }}
                >
                    <div
                        className="swiper-wrapper"
                        style={{
                            display: "flex",
                            flexDirection: isVertical ? "column" : "row",
                        }}
                    >
                        {activeImages.map((img, idx) => {
                            const url = typeof img === "string" ? img : img?.src
                            return (
                                <div
                                    key={idx}
                                    className="swiper-slide"
                                    style={{
                                        overflow: "hidden",
                                        borderRadius: slideRadius,
                                        backgroundColor: "transparent",
                                        height: "100%",
                                    }}
                                >
                                    <img
                                        src={url}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit,
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    {showProgressBar && showAutoplay && !isStatic && (
                        <div
                            style={{
                                position: "absolute",
                                left: progressOffset,
                                right: progressOffset,
                                height: progressHeight,
                                backgroundColor: progressTrackColor,
                                zIndex: 12,
                                top:
                                    progressPosition === "top"
                                        ? progressOffset
                                        : "auto",
                                bottom:
                                    progressPosition === "bottom"
                                        ? progressOffset
                                        : "auto",
                                borderRadius: progressRadius,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    backgroundColor: progressFillColor,
                                    width: `${prog}%`,
                                    transition: "width 0.1s linear",
                                    borderRadius: progressRadius,
                                }}
                            />
                        </div>
                    )}
                </div>

                {showArrows && arrowLayout === "separate" && (
                    <>
                        <button
                            onMouseEnter={() => setHoveredArrow("prev")}
                            onMouseLeave={() => setHoveredArrow(null)}
                            onClick={() => mainSwiper.current?.slidePrev()}
                            style={arrowStyle(true)}
                        >
                            <ArrowIcon
                                isPrev={true}
                                color="#FFFFFF"
                                arrowImg={arrowImg}
                                arrowRadius={arrowRadius}
                            />
                        </button>
                        <button
                            onMouseEnter={() => setHoveredArrow("next")}
                            onMouseLeave={() => setHoveredArrow(null)}
                            onClick={() => mainSwiper.current?.slideNext()}
                            style={arrowStyle(false)}
                        >
                            <ArrowIcon
                                isPrev={false}
                                color="#FFFFFF"
                                arrowImg={arrowImg}
                                arrowRadius={arrowRadius}
                            />
                        </button>
                    </>
                )}

                {showArrows && arrowLayout === "grouped" && (
                    <div style={groupedContainerStyle()}>
                        <button
                            onMouseEnter={() => setHoveredArrow("prev")}
                            onMouseLeave={() => setHoveredArrow(null)}
                            onClick={() => mainSwiper.current?.slidePrev()}
                            style={groupedBtnStyle(true)}
                        >
                            <ArrowIcon
                                isPrev={true}
                                color="#FFFFFF"
                                arrowImg={arrowImg}
                                arrowRadius={arrowRadius}
                            />
                        </button>
                        <button
                            onMouseEnter={() => setHoveredArrow("next")}
                            onMouseLeave={() => setHoveredArrow(null)}
                            onClick={() => mainSwiper.current?.slideNext()}
                            style={groupedBtnStyle(false)}
                        >
                            <ArrowIcon
                                isPrev={false}
                                color="#FFFFFF"
                                arrowImg={arrowImg}
                                arrowRadius={arrowRadius}
                            />
                        </button>
                    </div>
                )}

                {showCounter && (
                    <div style={counterStyle()}>
                        {current + 1} / {total}
                    </div>
                )}

                {showDots && (
                    <div style={dotTrackStyle()}>
                        {Array.from({ length: total }).map((_, idx) => {
                            const active = idx === current
                            return (
                                <button
                                    key={idx}
                                    onClick={() => goTo(idx)}
                                    style={{
                                        border: "none",
                                        padding: 0,
                                        width:
                                            !isVertical && active
                                                ? dotSize * 2.2
                                                : dotSize,
                                        height:
                                            isVertical && active
                                                ? dotSize * 2.2
                                                : dotSize,
                                        borderRadius: dotRadius,
                                        backgroundColor: active
                                            ? dotActiveColor
                                            : dotColor,
                                        cursor: "pointer",
                                        transition: "all 0.3s ease-in-out",
                                    }}
                                />
                            )
                        })}
                    </div>
                )}
            </div>

            <div style={thumbTrayStyle}>
                <div
                    ref={thumbRef}
                    className="swiper"
                    style={{ width: "100%", height: "100%" }}
                >
                    <div
                        className="swiper-wrapper"
                        style={{
                            display: "flex",
                            flexDirection: isVertical ? "column" : "row",
                        }}
                    >
                        {activeImages.map((img, idx) => {
                            const url = typeof img === "string" ? img : img?.src
                            const selected = idx === current
                            return (
                                <div
                                    key={idx}
                                    className="swiper-slide"
                                    onClick={() => goTo(idx)}
                                    style={{
                                        borderRadius: thumbRadius,
                                        backgroundColor: "transparent",
                                        border:
                                            thumbActiveStyle === "border" &&
                                            selected
                                                ? `2px solid ${thumbActiveColor}`
                                                : "2px solid transparent",
                                        opacity:
                                            thumbActiveStyle === "opacity"
                                                ? selected
                                                    ? 1
                                                    : 0.4
                                                : 1,
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        boxSizing: "border-box",
                                        transition: "all 0.3s ease-in-out",
                                        height: "100%",
                                        width: "100%",
                                    }}
                                >
                                    <img
                                        src={url}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

ThumbnailSlider.defaultProps = {
    fixedWidth: 800,
    fixedHeight: 600,
    images: [],
    showAutoplay: true,
    transitionSpeed: 0.45,
    autoplayDelay: 4,
    objectFit: "cover",
    innerPadding: 0,
    loop: true,
    direction: "horizontal",
    slidePerView: 1,
    slideRadius: 12,
    slideGap: 16,
    thumbnails: {
        thumbPerView: 4,
        thumbRadius: 6,
        thumbGap: 10,
        thumbActiveStyle: "border",
        thumbActiveColor: "#6366F1",
        trayOffset: 12,
    },
    arrows: {
        showArrows: true,
        arrowLayout: "separate",
        arrowPosition: "center",
        arrowGroupPlacement: "bottomRight",
        arrowGroupGap: 8,
        arrowSize: 44,
        arrowRadius: 30,
        arrowOffset: 0,
        arrowBg: "rgba(15,15,20,0.7)",
        arrowHoverBg: "rgba(99,102,241,0.9)",
        arrowHoverScale: 1.1,
        arrowImg: "",
    },
    pagination: {
        showDots: true,
        dotPlacement: "bottomCenter",
        dotPosition: 16,
        dotSize: 7,
        dotRadius: 4,
        dotGap: 8,
        dotColor: "rgba(255,255,255,0.3)",
        dotActiveColor: "#6366F1",
    },
    counter: {
        showCounter: true,
        counterPosition: "topRight",
        counterFontSize: 11,
        counterRadius: 6,
        counterBg: "rgba(15,15,20,0.8)",
        counterColor: "#FFFFFF",
    },
    progress: {
        showProgressBar: true,
        progressPosition: "bottom",
        progressHeight: 3,
        progressRadius: 0,
        progressOffset: 0,
        progressTrackColor: "rgba(255,255,255,0.1)",
        progressFillColor: "#6366F1",
    },
}

addPropertyControls(ThumbnailSlider, {
    fixedWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 200,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: true,
    },
    fixedHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 150,
        max: 2000,
        step: 10,
        unit: "px",
    },
    images: {
        type: ControlType.Array,
        title: "Slider Images",
        control: { type: ControlType.Image },
    },
    direction: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal (↔)", "Vertical (↕)"],
    },
    showAutoplay: { type: ControlType.Boolean, title: "Autoplay" },
    transitionSpeed: {
        type: ControlType.Number,
        title: "Slide Speed",
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Autoplay Gap",
        min: 1.5,
        max: 12,
        step: 0.5,
        unit: "s",
        hidden: (p) => !p.showAutoplay,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Aspect Fit",
        options: ["cover", "contain"],
    },
    innerPadding: {
        type: ControlType.Number,
        title: "Outer Gutter",
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
    },
    loop: { type: ControlType.Boolean, title: "Infinite Loop" },
    slidePerView: {
        type: ControlType.Number,
        title: "Slides View",
        min: 1,
        max: 4,
        step: 1,
    },
    slideRadius: {
        type: ControlType.Number,
        title: "Slide Radius",
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    slideGap: {
        type: ControlType.Number,
        title: "Slide Gap",
        min: 0,
        max: 100,
        step: 2,
        unit: "px",
    },
    thumbnails: {
        type: ControlType.Object,
        title: "Thumbnails",
        controls: {
            thumbPerView: {
                type: ControlType.Number,
                title: "Thumbs View",
                min: 2,
                max: 10,
                step: 1,
            },
            thumbRadius: {
                type: ControlType.Number,
                title: "Thumb Radius",
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            thumbGap: {
                type: ControlType.Number,
                title: "Thumb Gap",
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            thumbActiveStyle: {
                type: ControlType.Enum,
                title: "Active State",
                options: ["border", "opacity", "none"],
            },
            thumbActiveColor: {
                type: ControlType.Color,
                title: "Active Border",
                hidden: (p) => p.thumbActiveStyle !== "border",
            },
            trayOffset: {
                type: ControlType.Number,
                title: "Tray Gap",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
        },
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            showArrows: { type: ControlType.Boolean, title: "Show Arrows" },
            arrowLayout: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["separate", "grouped"],
                optionTitles: ["Separate", "Grouped"],
                hidden: (p) => !p.showArrows,
            },
            arrowPosition: {
                type: ControlType.Enum,
                title: "Placement",
                options: ["center", "top", "bottom"],
                hidden: (p) => !p.showArrows || p.arrowLayout !== "separate",
            },
            arrowGroupPlacement: {
                type: ControlType.Enum,
                title: "Group Pos",
                options: [
                    "topLeft",
                    "topCenter",
                    "topRight",
                    "bottomLeft",
                    "bottomCenter",
                    "bottomRight",
                ],
                hidden: (p) => !p.showArrows || p.arrowLayout !== "grouped",
            },
            arrowGroupGap: {
                type: ControlType.Number,
                title: "Group Gap",
                min: 0,
                max: 100,
                step: 2,
                unit: "px",
                hidden: (p) => !p.showArrows || p.arrowLayout !== "grouped",
            },
            arrowSize: {
                type: ControlType.Number,
                title: "Size",
                min: 20,
                max: 80,
                step: 2,
                unit: "px",
                hidden: (p) => !p.showArrows,
            },
            arrowRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 100,
                step: 2,
                unit: "px",
                hidden: (p) => !p.showArrows,
            },
            arrowOffset: {
                type: ControlType.Number,
                title: "Offset",
                min: 0,
                max: 80,
                step: 2,
                unit: "px",
                hidden: (p) => !p.showArrows,
            },
            arrowBg: {
                type: ControlType.Color,
                title: "Background",
                hidden: (p) => !p.showArrows,
            },
            arrowHoverBg: {
                type: ControlType.Color,
                title: "Hover Bg",
                hidden: (p) => !p.showArrows,
            },
            arrowHoverScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                min: 0.9,
                max: 1.3,
                step: 0.05,
                hidden: (p) => !p.showArrows,
            },
            arrowImg: {
                type: ControlType.Image,
                title: "Custom Icon",
                hidden: (p) => !p.showArrows,
            },
        },
    },
    pagination: {
        type: ControlType.Object,
        title: "Pagination",
        controls: {
            showDots: { type: ControlType.Boolean, title: "Show Dots" },
            dotPlacement: {
                type: ControlType.Enum,
                title: "Placement",
                options: [
                    "topLeft",
                    "topCenter",
                    "topRight",
                    "bottomLeft",
                    "bottomCenter",
                    "bottomRight",
                ],
                hidden: (p) => !p.showDots,
            },
            dotPosition: {
                type: ControlType.Number,
                title: "Edge Gap",
                min: 0,
                max: 80,
                step: 2,
                unit: "px",
                hidden: (p) => !p.showDots,
            },
            dotSize: {
                type: ControlType.Number,
                title: "Size",
                min: 4,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showDots,
            },
            dotRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showDots,
            },
            dotGap: {
                type: ControlType.Number,
                title: "Spacing",
                min: 2,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showDots,
            },
            dotColor: {
                type: ControlType.Color,
                title: "Color",
                hidden: (p) => !p.showDots,
            },
            dotActiveColor: {
                type: ControlType.Color,
                title: "Active Color",
                hidden: (p) => !p.showDots,
            },
        },
    },
    counter: {
        type: ControlType.Object,
        title: "Counter",
        controls: {
            showCounter: { type: ControlType.Boolean, title: "Show Counter" },
            counterPosition: {
                type: ControlType.Enum,
                title: "Placement",
                options: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
                hidden: (p) => !p.showCounter,
            },
            counterFontSize: {
                type: ControlType.Number,
                title: "Font Size",
                min: 9,
                max: 24,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showCounter,
            },
            counterRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showCounter,
            },
            counterBg: {
                type: ControlType.Color,
                title: "Background",
                hidden: (p) => !p.showCounter,
            },
            counterColor: {
                type: ControlType.Color,
                title: "Text Color",
                hidden: (p) => !p.showCounter,
            },
        },
    },
    progress: {
        type: ControlType.Object,
        title: "Progress Bar",
        controls: {
            showProgressBar: {
                type: ControlType.Boolean,
                title: "Show Progress",
            },
            progressPosition: {
                type: ControlType.Enum,
                title: "Placement",
                options: ["top", "bottom"],
                hidden: (p) => !p.showProgressBar,
            },
            progressHeight: {
                type: ControlType.Number,
                title: "Height",
                min: 1,
                max: 10,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showProgressBar,
            },
            progressRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 10,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showProgressBar,
            },
            progressOffset: {
                type: ControlType.Number,
                title: "Inset Gap",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showProgressBar,
            },
            progressTrackColor: {
                type: ControlType.Color,
                title: "Track Color",
                hidden: (p) => !p.showProgressBar,
            },
            progressFillColor: {
                type: ControlType.Color,
                title: "Fill Color",
                hidden: (p) => !p.showProgressBar,
            },
        },
    },
})

export default ThumbnailSlider
