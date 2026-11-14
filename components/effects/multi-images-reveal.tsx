// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"
import type { CSSProperties, ReactNode } from "react"

type Direction =
    | "bottom right"
    | "bottom left"
    | "top right"
    | "top left"
    | "bottom"
    | "top"
    | "left"
    | "right"
    | "center"

interface Inset {
    top: string
    right: string
    bottom: string
    left: string
}

interface ImageRevealProps {
    content?: ReactNode
    image?: { src?: string; srcSet?: string; alt?: string }
    direction: Direction
    startAt: number
    delay: number
    duration: number
    easing: string
    radius: string
    hoverRadius: number
    scaleFrom: number
    replay: boolean
    gateVideo: boolean
    mobileFade: boolean
    mobileMax: number
    style?: CSSProperties
}

// Every direction collapses the visible box to nothing, pinned at the edge or
// corner it should grow out of
const FROM: Record<Direction, Inset> = {
    "bottom right": { top: "100%", right: "0%", bottom: "0%", left: "100%" },
    "bottom left": { top: "100%", right: "100%", bottom: "0%", left: "0%" },
    "top right": { top: "0%", right: "0%", bottom: "100%", left: "100%" },
    "top left": { top: "0%", right: "100%", bottom: "100%", left: "0%" },
    bottom: { top: "100%", right: "0%", bottom: "0%", left: "0%" },
    top: { top: "0%", right: "0%", bottom: "100%", left: "0%" },
    left: { top: "0%", right: "100%", bottom: "0%", left: "0%" },
    right: { top: "0%", right: "0%", bottom: "0%", left: "100%" },
    center: { top: "50%", right: "50%", bottom: "50%", left: "50%" },
}

// Leaving view folds the asset away into the opposing edge or corner, so a
// scroll through reads as one continuous move rather than a rewind
const AWAY: Record<Direction, Direction> = {
    "bottom right": "top left",
    "bottom left": "top right",
    "top right": "bottom left",
    "top left": "bottom right",
    bottom: "top",
    top: "bottom",
    left: "right",
    right: "left",
    center: "center",
}

const OPEN: Inset = { top: "0%", right: "0%", bottom: "0%", left: "0%" }

const EASES: Record<string, string> = {
    "power1.out": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    "power2.out": "cubic-bezier(0.22, 0.61, 0.36, 1)",
    "power3.out": "cubic-bezier(0.16, 1, 0.3, 1)",
    "expo.out": "cubic-bezier(0.19, 1, 0.22, 1)",
    linear: "linear",
}

// A Slot prop is an array of linked layers, empty when nothing is connected
function slotHasContent(content: ReactNode): boolean {
    if (Array.isArray(content)) return content.length > 0
    return Boolean(content)
}

function clipOf(i: Inset, radius: string): string {
    return `inset(${i.top} ${i.right} ${i.bottom} ${i.left} round ${radius})`
}

/**
 * IMAGE REVEAL
 *
 * Opens whatever is inside it out of an edge or corner with clip-path as it
 * scrolls into view, and folds it away into the opposite side on the way out.
 *
 * Drop any layer into Content — an image, a video, a whole card — or leave it
 * empty and set an Image. Nothing is clipped on the canvas, so the design
 * stays readable while you work.
 *
 * @framerIntrinsicWidth 424
 * @framerIntrinsicHeight 618
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageReveal(props: ImageRevealProps) {
    const {
        content,
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "",
        },
        direction,
        startAt,
        delay,
        duration,
        easing,
        radius,
        hoverRadius,
        scaleFrom = 1.2,
        replay,
        gateVideo,
        mobileFade,
        mobileMax,
        style,
    } = props

    const ref = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const hasContent = slotHasContent(content)
    const ease = EASES[easing] || EASES["power1.out"]
    const ms = Math.max(0.01, duration) * 1000
    const delayMs = Math.max(0, delay) * 1000

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const el = ref.current
        const inner = innerRef.current
        if (!el || !inner) return

        // The content settles from Scale From down to its real size in the
        // same move that opens the clip, so the two read as one motion
        const zoomed = Math.max(1, scaleFrom) !== 1
        const scaleTo = (to: number, curve: string) => {
            if (!zoomed) return
            inner.style.transition =
                curve === "none" ? "none" : `transform ${ms}ms ${curve}`
            inner.style.transform = to === 1 ? "" : `scale(${to})`
        }

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const small = mobileFade && window.innerWidth < mobileMax
        const video = el.querySelector("video")

        const playVideo = () => {
            if (!video || !gateVideo) return
            const p = video.play()
            if (p && typeof p.catch === "function") p.catch(() => {})
        }
        const stopVideo = () => {
            if (!video || !gateVideo) return
            video.pause()
            video.currentTime = 0
        }

        // An asset nobody can see is worse than an effect that did not play, so
        // every bail-out below leaves the content on screen
        const show = () => {
            el.style.clipPath = ""
            el.style.opacity = "1"
            el.style.visibility = "visible"
            el.style.willChange = ""
            scaleTo(1, "none")
            playVideo()
        }

        const canClip =
            typeof CSS !== "undefined" &&
            typeof CSS.supports === "function" &&
            CSS.supports("clip-path", "inset(0% 0% 0% 0% round 1px)")

        if (reduced || (!canClip && !small)) {
            show()
            return
        }

        const openClip = FROM[direction] || FROM["bottom right"]
        const shutClip = FROM[AWAY[direction] || "top left"]

        let current = radius
        let visible = false
        let delayTimer = 0
        let settleTimer = 0

        const settle = () => {
            window.clearTimeout(settleTimer)
            settleTimer = window.setTimeout(() => {
                el.style.willChange = ""
                inner.style.willChange = ""
                // Playback waits for the reveal so decoding never competes
                // with the animation for frame budget
                if (visible) playVideo()
            }, ms)
        }

        const tween = (inset: Inset, curve: string) => {
            el.style.willChange = small ? "opacity" : "clip-path"
            if (small) {
                el.style.transition = `opacity ${ms}ms ${curve}`
                el.style.opacity = visible ? "1" : "0"
            } else {
                el.style.transition = `clip-path ${ms}ms ${curve}`
                el.style.clipPath = clipOf(inset, current)
            }
            if (zoomed) inner.style.willChange = "transform"
            scaleTo(visible ? 1 : scaleFrom, curve)
            settle()
        }

        const reveal = () => {
            if (visible) return
            visible = true
            window.clearTimeout(delayTimer)
            const run = () => tween(OPEN, ease)
            if (delayMs > 0) delayTimer = window.setTimeout(run, delayMs)
            else run()
        }

        const hide = (inset: Inset) => {
            if (!visible) return
            visible = false
            window.clearTimeout(delayTimer)
            stopVideo()
            tween(inset, ease)
        }

        el.style.transition = "none"
        if (small) el.style.opacity = "0"
        else el.style.clipPath = clipOf(openClip, current)
        scaleTo(scaleFrom, "none")
        void el.offsetWidth

        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        reveal()
                    } else if (replay) {
                        const past = entry.boundingClientRect.top < 0
                        hide(past ? shutClip : openClip)
                    }
                }
            },
            {
                // Shrinking the root from the bottom puts the trigger on a fixed
                // line on screen, so tall and short elements fire in the same
                // place instead of depending on their own height
                threshold: 0,
                rootMargin: `0px 0px -${Math.round((1 - startAt) * 100)}% 0px`,
            }
        )
        io.observe(el)

        // If the observer never reports it visible but it plainly is, open it
        const watchdog = window.setTimeout(
            () => {
                if (visible) return
                const r = el.getBoundingClientRect()
                if (r.bottom > 0 && r.top < window.innerHeight && r.width > 0) {
                    reveal()
                }
            },
            ms + delayMs + 3000
        )

        const setRadius = (value: string) => {
            current = value
            if (small || !visible) return
            el.style.transition = `clip-path ${ms}ms ${ease}`
            el.style.clipPath = clipOf(OPEN, current)
        }
        const enter = () => setRadius(`${hoverRadius}px`)
        const leave = () => setRadius(radius)

        const hovers = hoverRadius >= 0 && `${hoverRadius}px` !== radius
        if (hovers) {
            el.addEventListener("mouseenter", enter)
            el.addEventListener("mouseleave", leave)
        }

        return () => {
            io.disconnect()
            window.clearTimeout(watchdog)
            window.clearTimeout(delayTimer)
            window.clearTimeout(settleTimer)
            if (hovers) {
                el.removeEventListener("mouseenter", enter)
                el.removeEventListener("mouseleave", leave)
            }
            inner.style.transition = ""
            inner.style.transform = ""
            inner.style.willChange = ""
        }
    }, [
        isStatic,
        direction,
        startAt,
        delayMs,
        ms,
        ease,
        radius,
        hoverRadius,
        scaleFrom,
        replay,
        gateVideo,
        mobileFade,
        mobileMax,
    ])

    return (
        <div
            ref={ref}
            style={{
                // Framer's own sizing comes through style, so it is spread
                // first and never overridden — the component sits in a stack,
                // fills, or takes a fixed size exactly like any other layer
                ...style,
                position: "relative",
                borderRadius: radius,
                overflow: "hidden",
            }}
        >
            <div
                ref={innerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                }}
            >
                {hasContent ? (
                    content
                ) : (
                    <img
                        src={image?.src}
                        srcSet={image?.srcSet}
                        alt={image?.alt ?? ""}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                )}
            </div>
        </div>
    )
}

ImageReveal.displayName = "Multi Image Reveal"

addPropertyControls(ImageReveal, {
    content: {
        type: ControlType.Slot,
        title: "Content",
        description: "Any layer. Falls back to the Image below when empty.",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        // An empty slot arrives as [], which is truthy — check its length
        hidden: (props) => slotHasContent(props.content),
    },
    direction: {
        type: ControlType.Enum,
        title: "From",
        options: [
            "bottom right",
            "bottom left",
            "top right",
            "top left",
            "bottom",
            "top",
            "left",
            "right",
            "center",
        ],
        optionTitles: [
            "Bottom Right",
            "Bottom Left",
            "Top Right",
            "Top Left",
            "Bottom",
            "Top",
            "Left",
            "Right",
            "Center",
        ],
        defaultValue: "bottom right",
    },
    startAt: {
        type: ControlType.Number,
        title: "Start At",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
        description:
            "How far down the screen the element must reach before it opens.",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1,
        min: 0.1,
        max: 4,
        step: 0.05,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "power1.out",
            "power2.out",
            "power3.out",
            "expo.out",
            "linear",
        ],
        optionTitles: ["Soft", "Medium", "Snappy", "Dramatic", "Linear"],
        defaultValue: "power1.out",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
    },
    hoverRadius: {
        type: ControlType.Number,
        title: "Hover Radius",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        description: "Radius while hovered. Match Radius to switch it off.",
    },
    scaleFrom: {
        type: ControlType.Number,
        title: "Scale From",
        defaultValue: 1.2,
        min: 1,
        max: 2,
        step: 0.05,
        description:
            "Content starts this large and settles to 1 as it opens. 1 is off.",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: true,
        description: "Fold away when it leaves view and open again on return.",
    },
    gateVideo: {
        type: ControlType.Boolean,
        title: "Video",
        defaultValue: true,
        description:
            "Hold playback until the reveal finishes, then stop when hidden.",
    },
    mobileFade: {
        type: ControlType.Boolean,
        title: "Fade On Small",
        defaultValue: true,
    },
    mobileMax: {
        type: ControlType.Number,
        title: "Small Below",
        defaultValue: 810,
        min: 0,
        max: 2000,
        step: 1,
        unit: "px",
        hidden: (props) => !props.mobileFade,
    },
})
