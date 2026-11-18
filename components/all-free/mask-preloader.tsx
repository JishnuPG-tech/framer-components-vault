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

import { motion, useInView, useAnimation } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }
type DeviceMode = "auto" | "desktop" | "phone"

type BannerSlot = { image?: ResponsiveImage; video?: string } | null | undefined
type BannerItem =
    | { type: "image"; src: string; srcSet?: string; alt?: string }
    | { type: "video"; src: string }

function normalizeBanner(slot: BannerSlot): BannerItem | null {
    if (!slot) return null
    const vid = typeof slot.video === "string" ? slot.video.trim() : ""
    if (vid) return { type: "video", src: vid }
    if (slot.image?.src)
        return {
            type: "image",
            src: slot.image.src,
            srcSet: slot.image.srcSet,
            alt: slot.image.alt,
        }
    return null
}

interface RevealFlowPreloaderProps {
    device: DeviceMode
    play: boolean
    loop: boolean
    hideWhenDone: boolean
    backgroundColor: string
    banner1: BannerSlot
    banner2: BannerSlot
    banner3: BannerSlot
    banner4: BannerSlot
    banner5: BannerSlot
    banner6: BannerSlot
    scaleFrom: number
    scaleTo: number
    bannerDuration: number
    scalePause: number
    springiness: number
    style?: React.CSSProperties
}

const defaultBanner1: BannerItem = {
    type: "image",
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Gradient 1",
}
const defaultBanner2: BannerItem = {
    type: "image",
    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    alt: "Gradient 2",
}
const defaultBanner3: BannerItem = {
    type: "image",
    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
    alt: "Gradient 3",
}

const REVEAL_STORAGE_KEY = "revealflow-preloader-played-v1"
function hasPlayedThisSession() {
    if (typeof window === "undefined") return false
    try {
        return window.sessionStorage.getItem(REVEAL_STORAGE_KEY) === "1"
    } catch {
        return false
    }
}
function markPlayedThisSession() {
    if (typeof window === "undefined") return
    try {
        window.sessionStorage.setItem(REVEAL_STORAGE_KEY, "1")
    } catch {}
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function useElementWidth(ref: React.RefObject<HTMLElement>) {
    const [w, setW] = React.useState(0)
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const el = ref.current
        if (!el) return
        const update = () =>
            React.startTransition(() => setW(el.getBoundingClientRect().width))
        update()
        const win = window as any
        if (typeof win.ResizeObserver !== "undefined") {
            const ro = new win.ResizeObserver(update)
            ro.observe(el)
            return () => ro.disconnect()
        }
        win.addEventListener("resize", update)
        return () => win.removeEventListener("resize", update)
    }, [ref])
    return w
}

const CROSSFADE_MS = 60
const PRELOAD_AHEAD_MS = 400

// Canvas and preview both run inside Framer's editor — skip inView + sessionStorage for both
function getEditorMode() {
    const t = RenderTarget.current()
    return t === RenderTarget.canvas || t === RenderTarget.preview
}

/**
 * RevealFlow Preloader
 *
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 1024
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function RevealFlowPreloader(props: RevealFlowPreloaderProps) {
    const {
        device = "auto",
        play = true,
        loop = false,
        hideWhenDone = false,
        backgroundColor = "#FFFFFF",
        banner1,
        banner2,
        banner3,
        banner4,
        banner5,
        banner6,
        scaleFrom = 0.2,
        scaleTo = 1,
        bannerDuration = 0.9,
        scalePause = 0.5,
        springiness = 0,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const isEditor = React.useMemo(() => getEditorMode(), [])

    const containerRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { amount: 0.2, once: true })
    const width = useElementWidth(containerRef)
    const controls = useAnimation()
    const timersRef = React.useRef<number[]>([])
    const imgRef = React.useRef<HTMLImageElement>(null)
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const scrollLockedRef = React.useRef(false)
    const savedScrollRef = React.useRef(0)
    const [skipAnimation] = React.useState(() =>
        isEditor ? false : hasPlayedThisSession()
    )

    const resolvedDevice = React.useMemo<"desktop" | "phone">(() => {
        if (device === "desktop" || device === "phone") return device
        return width > 0 && width < 600 ? "phone" : "desktop"
    }, [device, width])

    const banners = React.useMemo<BannerItem[]>(() => {
        const raw = [
            normalizeBanner(banner1) ?? defaultBanner1,
            normalizeBanner(banner2) ?? defaultBanner2,
            normalizeBanner(banner3) ?? defaultBanner3,
            normalizeBanner(banner4),
            normalizeBanner(banner5),
            normalizeBanner(banner6),
        ]
        return [
            raw[0]!,
            raw[1]!,
            raw[2]!,
            ...raw.slice(3).filter((b): b is BannerItem => b !== null),
        ]
    }, [banner1, banner2, banner3, banner4, banner5, banner6])

    const bannersRef = React.useRef(banners)
    bannersRef.current = banners

    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [done, setDone] = React.useState(false)
    const [hidden, setHidden] = React.useState(false)

    React.useEffect(() => {
        const banner = bannersRef.current[currentIndex]
        const img = imgRef.current
        const vid = videoRef.current
        if (!banner) return

        if (banner.type === "video") {
            if (vid && vid.getAttribute("src") !== banner.src) {
                vid.src = banner.src
                vid.load()
            }
            if (vid) vid.play().catch(() => {})
            if (vid) vid.style.opacity = "1"
            if (img) img.style.opacity = "0"
        } else {
            if (img) {
                img.src = banner.src
                img.srcset = banner.srcSet ?? ""
                img.alt = banner.alt ?? ""
            }
            if (img) img.style.opacity = "1"
            if (vid) vid.style.opacity = "0"
            const t = window.setTimeout(() => vid?.pause(), CROSSFADE_MS + 50)
            return () => window.clearTimeout(t)
        }
    }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

    const preventWheel = React.useCallback((e: Event) => {
        e.preventDefault()
    }, [])
    const preventKey = React.useCallback((e: KeyboardEvent) => {
        const scrollKeys = [
            "ArrowUp",
            "ArrowDown",
            "Space",
            "PageUp",
            "PageDown",
            "Home",
            "End",
        ]
        if (scrollKeys.includes(e.code)) e.preventDefault()
    }, [])

    const lockScroll = React.useCallback(() => {
        if (
            isEditor ||
            typeof window === "undefined" ||
            scrollLockedRef.current
        )
            return
        savedScrollRef.current = window.scrollY
        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"
        document.body.style.position = "fixed"
        document.body.style.top = `-${savedScrollRef.current}px`
        document.body.style.width = "100%"
        window.addEventListener("wheel", preventWheel, { passive: false })
        window.addEventListener("touchmove", preventWheel, { passive: false })
        window.addEventListener("keydown", preventKey)
        scrollLockedRef.current = true
    }, [isEditor, preventWheel, preventKey])

    const unlockScroll = React.useCallback(() => {
        if (typeof window === "undefined" || !scrollLockedRef.current) return
        document.body.style.overflow = ""
        document.documentElement.style.overflow = ""
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        window.removeEventListener("wheel", preventWheel)
        window.removeEventListener("touchmove", preventWheel)
        window.removeEventListener("keydown", preventKey)
        window.scrollTo(0, savedScrollRef.current)
        scrollLockedRef.current = false
    }, [preventWheel, preventKey])

    React.useEffect(() => () => unlockScroll(), [unlockScroll])

    const clearAll = React.useCallback(() => {
        timersRef.current.forEach((t) => window.clearTimeout(t))
        timersRef.current = []
        unlockScroll()
    }, [unlockScroll])

    const startSequence = React.useCallback(() => {
        if (typeof window === "undefined") return
        clearAll()

        const list = bannersRef.current
        const n = list.length
        if (n === 0) return

        const d = bannerDuration * 1000
        const sp = scalePause * 1000
        const bounce = clamp(springiness, 0, 0.3)

        lockScroll()

        controls.set({
            y: "100%",
            clipPath: "inset(100% 0% 0% 0%)",
            scale: scaleFrom,
        })
        React.startTransition(() => {
            setCurrentIndex(0)
            setDone(false)
            setHidden(false)
        })

        timersRef.current.push(
            window.setTimeout(() => {
                controls.start({
                    y: "0%",
                    clipPath: "inset(0% 0% 0% 0%)",
                    transition: {
                        y: { type: "spring", bounce, duration: bannerDuration },
                        clipPath: {
                            type: "tween",
                            ease: [0.6, 0, 0.15, 1],
                            duration: bannerDuration * 0.9,
                        },
                    },
                })
            }, 50)
        )

        for (let i = 1; i < n; i++) {
            const banner = list[i]
            const switchAt = 50 + d * i
            if (banner.type === "video") {
                const preloadAt = Math.max(0, switchAt - PRELOAD_AHEAD_MS)
                timersRef.current.push(
                    window.setTimeout(() => {
                        const vid = videoRef.current
                        if (vid && vid.getAttribute("src") !== banner.src) {
                            vid.src = banner.src
                            vid.load()
                        }
                    }, preloadAt)
                )
            }
        }

        for (let i = 1; i < n; i++) {
            const idx = i
            timersRef.current.push(
                window.setTimeout(
                    () => {
                        React.startTransition(() => setCurrentIndex(idx))
                    },
                    50 + d * i
                )
            )
        }

        timersRef.current.push(
            window.setTimeout(
                () => {
                    controls.start({
                        scale: scaleTo,
                        transition: {
                            type: springiness > 0 ? "spring" : "tween",
                            bounce: clamp(springiness, 0, 1),
                            ease: [0.76, 0, 0.24, 1],
                            duration: 1.1,
                        },
                    })
                },
                50 + d * (n - 1) + sp
            )
        )

        timersRef.current.push(
            window.setTimeout(
                () => {
                    unlockScroll()
                    if (!isEditor) markPlayedThisSession()
                    React.startTransition(() => {
                        setDone(true)
                        if (hideWhenDone) setHidden(true)
                    })
                },
                50 + d * (n - 1) + sp + 1200
            )
        )
    }, [
        bannerDuration,
        scalePause,
        scaleFrom,
        scaleTo,
        springiness,
        hideWhenDone,
        isEditor,
        controls,
        clearAll,
        lockScroll,
        unlockScroll,
    ])

    const jumpToEnd = React.useCallback(() => {
        controls.set({
            y: "0%",
            clipPath: "inset(0% 0% 0% 0%)",
            scale: scaleTo,
        })
        const n = bannersRef.current.length
        React.startTransition(() => {
            setCurrentIndex(Math.max(0, n - 1))
            setDone(true)
        })
    }, [controls, scaleTo])

    React.useEffect(() => {
        if (isStatic) jumpToEnd()
    }, [isStatic]) // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        if (isStatic || isEditor || !skipAnimation) return
        jumpToEnd()
        if (hideWhenDone) React.startTransition(() => setHidden(true))
    }, [isStatic, skipAnimation]) // eslint-disable-line react-hooks/exhaustive-deps

    // Single unified trigger — editor fires immediately, published waits for inView
    React.useEffect(() => {
        if (isStatic || !play) return
        if (isEditor) {
            startSequence()
            return clearAll
        }
        if (!inView || skipAnimation) return
        startSequence()
        return clearAll
    }, [isEditor ? play : inView, isStatic, play, skipAnimation]) // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        if (!loop || isStatic || !play || !done) return
        if (!isEditor && skipAnimation) return
        const t = window.setTimeout(() => startSequence(), 600)
        return () => window.clearTimeout(t)
    }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

    const canvasSizeStyle: React.CSSProperties =
        resolvedDevice === "phone"
            ? { aspectRatio: "390 / 844" }
            : { aspectRatio: "1440 / 1024" }

    const firstBanner = bannersRef.current[0]
    const thumbnailSrc =
        firstBanner?.type === "image" ? firstBanner.src : undefined

    if (RenderTarget.current() === RenderTarget.thumbnail) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: backgroundColor,
                    ...style,
                }}
            >
                {thumbnailSrc && (
                    <img
                        src={thumbnailSrc}
                        alt=""
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                )}
            </div>
        )
    }

    const sharedMediaStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        userSelect: "none",
        pointerEvents: "none",
        transition: `opacity ${CROSSFADE_MS}ms ease`,
    }

    const firstIsVideo = banners[0]?.type === "video"

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
            aria-label="Preloader"
        >
            <motion.div
                animate={controls}
                initial={{
                    y: "100%",
                    clipPath: "inset(100% 0% 0% 0%)",
                    scale: scaleFrom,
                }}
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    transformPerspective: 1200,
                    transformOrigin: "center center",
                    willChange: "transform, clip-path",
                    visibility: hidden ? "hidden" : "visible",
                    position: "relative",
                    ...canvasSizeStyle,
                }}
            >
                <img
                    ref={imgRef}
                    src={
                        banners[0]?.type === "image"
                            ? banners[0].src
                            : undefined
                    }
                    alt=""
                    style={{
                        ...sharedMediaStyle,
                        opacity: firstIsVideo ? 0 : 1,
                    }}
                    draggable={false}
                />
                <video
                    ref={videoRef}
                    autoPlay={firstIsVideo}
                    muted
                    playsInline
                    loop
                    style={{
                        ...sharedMediaStyle,
                        opacity: firstIsVideo ? 1 : 0,
                    }}
                />
            </motion.div>
        </div>
    )
}

const bannerControls = {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov", "ogg", "m4v"],
    },
}

addPropertyControls(RevealFlowPreloader, {
    device: {
        type: ControlType.Enum,
        title: "Device",
        options: ["auto", "desktop", "phone"],
        optionTitles: ["Auto", "Desktop", "Phone"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    play: {
        type: ControlType.Boolean,
        title: "Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hideWhenDone: {
        type: ControlType.Boolean,
        title: "Hide",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    banner1: {
        type: ControlType.Object,
        title: "Banner 1",
        controls: bannerControls,
    },
    banner2: {
        type: ControlType.Object,
        title: "Banner 2",
        controls: bannerControls,
    },
    banner3: {
        type: ControlType.Object,
        title: "Banner 3",
        controls: bannerControls,
    },
    banner4: {
        type: ControlType.Object,
        title: "Banner 4",
        controls: bannerControls,
    },
    banner5: {
        type: ControlType.Object,
        title: "Banner 5",
        controls: bannerControls,
    },
    banner6: {
        type: ControlType.Object,
        title: "Banner 6",
        controls: bannerControls,
    },
    scaleFrom: {
        type: ControlType.Number,
        title: "Scale From",
        defaultValue: 0.2,
        min: 0.01,
        max: 2,
        step: 0.01,
    },
    scaleTo: {
        type: ControlType.Number,
        title: "Scale To",
        defaultValue: 1,
        min: 0.01,
        max: 2,
        step: 0.01,
    },
    bannerDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.9,
        min: 0.1,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    scalePause: {
        type: ControlType.Number,
        title: "Scale Pause",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    springiness: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
