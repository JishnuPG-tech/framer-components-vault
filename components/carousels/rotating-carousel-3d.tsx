/* Animation math adapted from Codrops RotatingOnScrollAnimations, MIT.
Copyright (c) 2009–2026 Codrops. Permission is hereby granted, free of charge,
to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom
the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
import * as React from "react"
import { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const photos =
    "1464822759023-fed622ff2c3b 1470252649378-9c29740c9fa8 1441974231531-c6227db76b6e 1500534623283-312aade485b7 1470770841072-f978cf4d019e 1501785888041-af3ef285b470 1519681393784-d120267933ba 1469474968028-56623f02e42e 1500530855697-b586d89ba3ee 1447752875215-b2761acb3c5d 1433086966358-54859d0ed716 1470071459604-3b5ec3a7fe05 1518837695005-2083093ee35b 1468581264429-2548ef9eb732 1426604966848-d7adac402bff 1511497584788-876760111969 1475924156734-496f6cac6ec1 1501854140801-50d01698950b 1507525428034-b723cf961d3e 1418065460487-3e41a6c84dc5"
const mediaDefaults = photos.split(" ").map((id, i) => ({
    type: "image",
    image: {
        src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=85`,
    },
    alt: `Landscape ${i + 1}`,
}))
const layoutDefaults = {
    cardWidth: 600,
    aspectRatio: 14 / 9,
    overlap: 55,
    waveAmplitude: 20,
    topSpace: 25,
    bottomSpace: 35,
}
const motionDefaults = {
    perspective: 900,
    rotationXMin: 70,
    rotationXMax: 120,
    rotationY: 20,
    rotationZ: 20,
    depth: 50,
    scrollSmoothing: 90,
}
const src = (image: any) =>
    typeof image === "string" ? image : image?.src || ""
const random = (i: number, axis: number) => {
    const n = Math.sin((i + 1) * 127.1 + axis * 311.7) * 43758.5453
    return n - Math.floor(n)
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 */
export default function RotatingScrollCarousel(incomingProps: any) {
    const props = {
        ...incomingProps,
        ...layoutDefaults,
        ...(incomingProps.layout || {}),
        ...motionDefaults,
        ...(incomingProps.motion || {}),
        editorPreview:
            incomingProps.livePreview ?? incomingProps.editorPreview ?? true,
    }
    const mountRef = useRef<HTMLDivElement>(null),
        galleryRef = useRef<HTMLDivElement>(null)
    const isIntersecting = useRef(true),
        updateRef = useRef<() => void>(() => {})
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.editorPreview ?? true)
    const media = (incomingProps.media ?? mediaDefaults)
        .filter(Boolean)
        .map((m: any) => ({
            type: m.type === "video" ? "video" : "image",
            src:
                m.type === "video"
                    ? m.video || m.url || ""
                    : src(m.image) || m.url || "",
            poster: src(m.poster),
            alt: m.alt || m.image?.alt || "Gallery media",
        }))
    const mediaKey = JSON.stringify(media)

    useEffect(() => {
        const root = mountRef.current,
            gallery = galleryRef.current
        if (!root || !gallery) return
        let frameId = 0,
            disposed = false,
            currentTop = 0,
            lastTime = 0,
            first = true
        let resizeObserver: ResizeObserver | undefined,
            observer: IntersectionObserver | undefined,
            viewportObserver: IntersectionObserver | undefined
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
        const near = new Set<number>()
        const cards = Array.from(gallery.children).map((el, index) => ({
            wrap: el as HTMLElement,
            face: el.firstElementChild as HTMLElement,
            video: el.querySelector("video"),
            top: 0,
            height: 0,
            index,
            blocked: false,
            pending: false,
        }))
        const indexOf = new Map(cards.map((c) => [c.wrap, c.index]))
        const stop = (c: (typeof cards)[number], release = false) => {
            c.video?.pause()
            if (release && c.video?.hasAttribute("src")) {
                c.video.removeAttribute("src")
                c.video.load()
                c.blocked = false
            }
            if (release) {
                c.face.style.willChange = "auto"
                c.wrap.style.transform = ""
            }
        }
        const pauseAll = () => {
            cancelAnimationFrame(frameId)
            frameId = 0
            cards.forEach((c) => stop(c))
        }
        function request() {
            if (disposed || !isIntersecting.current || document.hidden) return
            if (!shouldAnimate) draw(performance.now())
            else if (!frameId) frameId = requestAnimationFrame(draw)
        }
        function draw(time: number) {
            frameId = 0
            if (disposed || !isIntersecting.current || document.hidden) return
            const target = gallery!.getBoundingClientRect().top,
                viewport = window.innerHeight
            const reduced = preference.matches,
                dt = lastTime ? Math.min(100, time - lastTime) : 16.7
            lastTime = time
            if (
                first ||
                !shouldAnimate ||
                reduced ||
                props.scrollSmoothing <= 0
            )
                currentTop = target
            else
                currentTop +=
                    (target - currentTop) *
                    (1 - Math.exp(-dt / props.scrollSmoothing))
            first = false
            const moving = Math.abs(target - currentTop) > 0.05
            if (!moving) currentTop = target
            const width = gallery!.clientWidth,
                amplitude = Math.min(
                    (width * props.waveAmplitude) / 100,
                    Math.max(0, (width - (cards[0]?.wrap.offsetWidth || 0)) / 2)
                )
            near.forEach((i) => {
                const c = cards[i],
                    top = currentTop + c.top
                const p = Math.max(
                    0,
                    Math.min(
                        1,
                        (1.2 * viewport - top) / (1.4 * viewport + c.height)
                    )
                )
                const r = reduced ? 0 : 1 - 2 * p
                c.wrap.style.transform = `translate3d(${Math.sin(i * 0.45) * amplitude}px,${currentTop - target}px,0)`
                c.face.style.willChange = "transform"
                c.face.style.transform = `translateZ(${-Math.sin(Math.PI * p) * props.depth * (reduced ? 0 : 1)}px) rotateZ(${(random(i, 3) * 2 - 1) * props.rotationZ * r}deg) rotateY(${(random(i, 2) * 2 - 1) * props.rotationY * r}deg) rotateX(${(props.rotationXMin + random(i, 1) * (props.rotationXMax - props.rotationXMin)) * r}deg)`
                const video = c.video
                if (!video) return
                if (!video.hasAttribute("src") && video.dataset.src) {
                    video.src = video.dataset.src
                    video.preload = "auto"
                    video.load()
                }
                if (
                    shouldAnimate &&
                    !reduced &&
                    top < viewport &&
                    top + c.height > 0
                ) {
                    if (video.paused && !c.pending && !c.blocked) {
                        c.pending = true
                        video
                            .play()
                            .then(() => {
                                c.pending = false
                                if (
                                    disposed ||
                                    !isIntersecting.current ||
                                    document.hidden ||
                                    !near.has(i)
                                )
                                    video.pause()
                            })
                            .catch((error) => {
                                c.pending = false
                                c.blocked = error?.name !== "AbortError"
                            })
                    }
                } else stop(c)
            })
            if (shouldAnimate && moving) frameId = requestAnimationFrame(draw)
        }
        function measure() {
            if (disposed) return
            const top = gallery!.getBoundingClientRect().top,
                v = window.innerHeight
            cards.forEach((c) => {
                c.height = c.wrap.offsetHeight
            })
            cards.forEach((c) => {
                c.wrap.style.marginBottom = `${-Math.min(props.overlap, c.height * 0.8)}px`
            })
            cards.forEach((c) => {
                c.top = c.wrap.offsetTop
                c.height = c.wrap.offsetHeight
                if (top + c.top < v * 1.7 && top + c.top + c.height > -v * 0.7)
                    near.add(c.index)
                else {
                    near.delete(c.index)
                    stop(c, true)
                }
            })
            request()
        }
        function visibility() {
            if (document.hidden) pauseAll()
            else {
                first = true
                request()
            }
        }
        function motionChanged() {
            first = true
            request()
        }
        updateRef.current = request
        document.addEventListener("scroll", request, {
            capture: true,
            passive: true,
        })
        document.addEventListener("visibilitychange", visibility)
        window.addEventListener("resize", measure, { passive: true })
        preference.addEventListener("change", motionChanged)
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => {
                        const i = indexOf.get(e.target as HTMLElement)!
                        if (e.isIntersecting) near.add(i)
                        else {
                            near.delete(i)
                            stop(cards[i], true)
                        }
                    })
                    request()
                },
                { rootMargin: "60% 0px" }
            )
            cards.forEach((c) => observer!.observe(c.wrap))
            viewportObserver = new IntersectionObserver((entries) => {
                isIntersecting.current = entries[0].isIntersecting
                if (!isIntersecting.current) pauseAll()
                else {
                    first = true
                    request()
                }
            })
            viewportObserver.observe(root)
        } else cards.forEach((c) => near.add(c.index))
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(measure)
            resizeObserver.observe(gallery)
        }
        measure()
        return () => {
            disposed = true
            pauseAll()
            observer?.disconnect()
            viewportObserver?.disconnect()
            resizeObserver?.disconnect()
            document.removeEventListener("scroll", request, true)
            document.removeEventListener("visibilitychange", visibility)
            window.removeEventListener("resize", measure)
            preference.removeEventListener("change", motionChanged)
            updateRef.current = () => {}
            cards.forEach((c) => {
                stop(c, true)
                c.wrap.style.transform = ""
                c.face.style.transform = ""
            })
        }
    }, [
        mediaKey,
        shouldAnimate,
        props.cardWidth,
        props.aspectRatio,
        props.overlap,
        props.waveAmplitude,
        props.topSpace,
        props.bottomSpace,
        props.perspective,
        props.rotationXMin,
        props.rotationXMax,
        props.rotationY,
        props.rotationZ,
        props.depth,
        props.scrollSmoothing,
    ])

    const {
        livePreview,
        editorPreview,
        media: ignored,
        layout,
        motion,
        appearance,
        performance: ignoredPerformance,
        children,
        style,
        ...domProps
    } = incomingProps
    const mediaStyle: React.CSSProperties = {
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
    }
    return (
        <div
            {...domProps}
            ref={mountRef}
            role="region"
            aria-label="Rotating media gallery"
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                ...style,
                overflow: "clip",
                background: "transparent",
            }}
        >
            <div
                ref={galleryRef}
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingTop: `${props.topSpace}vh`,
                    paddingBottom: `${props.bottomSpace}vh`,
                }}
            >
                {media.map((m: any, i: number) => (
                    <div
                        key={i}
                        style={{
                            width: "100%",
                            maxWidth: props.cardWidth,
                            perspective: props.perspective,
                            marginBottom: -props.overlap,
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: props.aspectRatio,
                                background: "#202420",
                                overflow: "hidden",
                            }}
                        >
                            {m.type === "video" ? (
                                <video
                                    data-src={m.src}
                                    poster={m.poster || undefined}
                                    aria-label={m.alt}
                                    muted
                                    loop
                                    playsInline
                                    preload="none"
                                    onLoadedData={() => updateRef.current()}
                                    style={mediaStyle}
                                />
                            ) : (
                                <img
                                    src={m.src || undefined}
                                    alt={m.alt}
                                    loading={i === 0 ? "eager" : "lazy"}
                                    decoding="async"
                                    onLoad={() => updateRef.current()}
                                    style={mediaStyle}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

RotatingScrollCarousel.defaultProps = {
    livePreview: true,
    media: mediaDefaults,
    layout: layoutDefaults,
    motion: motionDefaults,
}
const num = (
    title: string,
    value: number,
    min: number,
    max: number,
    unit: string,
    description = "",
    step = 1
): any => ({
    type: ControlType.Number,
    title,
    defaultValue: value,
    min,
    max,
    unit,
    step,
    description,
})
addPropertyControls(RotatingScrollCarousel, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate while visible.",
    },
    media: {
        type: ControlType.Array,
        title: "Media",
        defaultValue: mediaDefaults,
        description: "Add or reorder any number.",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.type !== "video",
                },
                url: {
                    type: ControlType.String,
                    title: "Media URL",
                    description: "Optional direct file URL.",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (p: any) => p.type !== "video",
                },
                alt: {
                    type: ControlType.String,
                    title: "Description",
                    description: "For screen readers.",
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: num("Card Width", 600, 100, 1600, "px"),
            aspectRatio: num(
                "Aspect Ratio",
                14 / 9,
                0.5,
                3,
                ":1",
                "Width divided by height.",
                0.01
            ),
            overlap: num("Overlap", 55, 0, 300, "px", "Space shared by cards."),
            waveAmplitude: num(
                "Side Travel",
                20,
                0,
                50,
                "%",
                "Sideways wave width."
            ),
            topSpace: num("Top Space", 25, 0, 100, "%", "Of viewport height."),
            bottomSpace: num(
                "Bottom Space",
                35,
                0,
                100,
                "%",
                "Of viewport height."
            ),
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            perspective: num(
                "Perspective",
                900,
                400,
                2400,
                "px",
                "Lower means more depth.",
                10
            ),
            rotationXMin: num("Tilt Min", 70, 0, 150, "°"),
            rotationXMax: num("Tilt Max", 120, 0, 150, "°"),
            rotationY: num("Yaw", 20, 0, 60, "°", "Side-to-side tilt."),
            rotationZ: num("Roll", 20, 0, 60, "°", "In-plane tilt."),
            depth: num("Depth", 50, 0, 250, "px", "Recession at the center."),
            scrollSmoothing: num(
                "Smoothing",
                90,
                0,
                500,
                "ms",
                "Scroll follow softness.",
                5
            ),
        },
    },
})
