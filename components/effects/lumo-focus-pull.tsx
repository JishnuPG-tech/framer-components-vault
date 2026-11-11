/**
 * ScrollMediaFilters — Framer code component (Hero Kit)
 *
 * An image or video that arrives blurred, desaturated, dim, slightly small and
 * rounded, and settles to its true look as it reaches the middle of the
 * viewport. With `mode` inOut it goes back to the start look as it leaves.
 *
 * Fixed size: it fills its frame. Per frame it writes filter, transform and
 * border-radius. Static (canvas, thumbnail, reduced motion): at rest.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 */
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

import {
    formatNumber,
    ImageSource,
    mix,
    PLACEHOLDER_BACKGROUND,
    resolveMedia,
    smoothstep,
    useMotionMode,
    useScrollDriver,
} from "./HeroKit.tsx"

type Props = {
    image?: ImageSource
    video?: string
    blur?: number
    saturate?: number
    hue?: number
    brightness?: number
    contrast?: number
    scale?: number
    radius?: number
    radiusEnd?: number
    mode?: "in" | "inOut"
    smooth?: boolean
    style?: React.CSSProperties
}

export default function ScrollMediaFilters(props: Props) {
    const {
        image,
        video,
        blur = 12,
        saturate = 0,
        hue = 0,
        brightness = 0.6,
        contrast = 1,
        scale = 0.9,
        radius = 32,
        radiusEnd = 0,
        mode = "inOut",
        smooth = true,
        style,
    } = props

    const motion = useMotionMode()
    const media = resolveMedia(image)
    const frameRef = React.useRef<HTMLDivElement>(null)
    const mediaRef = React.useRef<HTMLElement>(null)

    const apply = React.useCallback(
        (p: number) => {
            // 0 = start look, 1 = at rest. Rest is reached at the viewport centre (p 0.5), which is also what static mode paints.
            const rest =
                mode === "in"
                    ? smoothstep(0, 0.5, p)
                    : p <= 0.5
                      ? smoothstep(0, 0.5, p)
                      : 1 - smoothstep(0.5, 1, p)
            const m = mediaRef.current
            if (m) {
                m.style.filter = `blur(${formatNumber(mix(blur, 0, rest), 2)}px) saturate(${formatNumber(mix(saturate, 1, rest), 3)}) hue-rotate(${formatNumber(mix(hue, 0, rest), 1)}deg) brightness(${formatNumber(mix(brightness, 1, rest), 3)}) contrast(${formatNumber(mix(contrast, 1, rest), 3)})`
                m.style.transform = `scale(${formatNumber(mix(scale, 1, rest), 4)})`
            }
            if (frameRef.current)
                frameRef.current.style.borderRadius = `${formatNumber(mix(radius, radiusEnd, rest), 1)}px`
        },
        [
            mode,
            blur,
            saturate,
            hue,
            brightness,
            contrast,
            scale,
            radius,
            radiusEnd,
        ]
    )

    useScrollDriver(frameRef, {
        mode: motion,
        track: "viewport",
        smooth,
        staticProgress: 0.5,
        onFrame: apply,
    })

    const mediaStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        willChange: "filter, transform",
        transformOrigin: "50% 50%",
    }

    return (
        <div
            ref={frameRef}
            data-hk="frame"
            data-hk-mode={motion}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: media || video ? "#000" : PLACEHOLDER_BACKGROUND,
                isolation: "isolate",
            }}
        >
            {video ? (
                <video
                    ref={mediaRef as React.RefObject<HTMLVideoElement>}
                    data-hk="media"
                    src={video}
                    poster={media?.src}
                    muted
                    playsInline
                    loop
                    autoPlay={motion === "animated"}
                    preload="metadata"
                    style={mediaStyle}
                />
            ) : media ? (
                <img
                    ref={mediaRef as React.RefObject<HTMLImageElement>}
                    data-hk="media"
                    src={media.src}
                    srcSet={media.srcSet}
                    alt={media.alt}
                    style={{
                        ...mediaStyle,
                        objectPosition: media.objectPosition,
                    }}
                />
            ) : (
                <div
                    ref={mediaRef as React.RefObject<HTMLDivElement>}
                    data-hk="media"
                    style={{
                        ...mediaStyle,
                        background: PLACEHOLDER_BACKGROUND,
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(ScrollMediaFilters, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm"],
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["in", "inOut"],
        optionTitles: ["Settle once", "In and out"],
        defaultValue: "inOut",
    },
    blur: {
        type: ControlType.Number,
        title: "Start blur",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    saturate: {
        type: ControlType.Number,
        title: "Start saturation",
        defaultValue: 0,
        min: 0,
        max: 2,
        step: 0.05,
    },
    hue: {
        type: ControlType.Number,
        title: "Start hue",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 5,
        unit: "°",
    },
    brightness: {
        type: ControlType.Number,
        title: "Start brightness",
        defaultValue: 0.6,
        min: 0,
        max: 2,
        step: 0.05,
    },
    contrast: {
        type: ControlType.Number,
        title: "Start contrast",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
    },
    scale: {
        type: ControlType.Number,
        title: "Start scale",
        defaultValue: 0.9,
        min: 0.5,
        max: 1.5,
        step: 0.01,
    },
    radius: {
        type: ControlType.Number,
        title: "Start radius",
        defaultValue: 32,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    radiusEnd: {
        type: ControlType.Number,
        title: "Rest radius",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    smooth: {
        type: ControlType.Boolean,
        title: "Smooth",
        defaultValue: true,
        enabledTitle: "Spring",
        disabledTitle: "Direct",
    },
})
