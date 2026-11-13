import * as React from "react"
import { startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimationControls, useInView } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

interface CircularGalleryProps {
    images: ResponsiveImage[]
    startAngle: number
    sweepAngle: number
    gapDegrees: number
    innerRadiusRatio: number
    outerPadding: number
    cornerRadius: number

    hoverScaleEnabled: boolean
    hoverScale: number
    hoverOffsetRatio: number
    hoverDuration: number

    revolveEnabled: boolean
    revolveDuration: number

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function degToRad(d: number) {
    return (d * Math.PI) / 180
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
    const a = degToRad(angleDeg)
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
    a0: number,
    a1: number,
    cornerRadius: number
) {
    const sweep = a1 - a0
    const absSweep = Math.abs(sweep)
    const largeArc = absSweep > 180 ? 1 : 0
    const sweepFlagOuter = sweep >= 0 ? 1 : 0
    const sweepFlagInner = sweep >= 0 ? 0 : 1

    const p0o = polar(cx, cy, rOuter, a0)
    const p1o = polar(cx, cy, rOuter, a1)
    const p0i = polar(cx, cy, rInner, a0)
    const p1i = polar(cx, cy, rInner, a1)

    const cr = clamp(cornerRadius, 0, Math.max(0, (rOuter - rInner) * 0.48))

    if (cr <= 0) {
        return [
            `M ${p0o.x} ${p0o.y}`,
            `A ${rOuter} ${rOuter} 0 ${largeArc} ${sweepFlagOuter} ${p1o.x} ${p1o.y}`,
            `L ${p1i.x} ${p1i.y}`,
            `A ${rInner} ${rInner} 0 ${largeArc} ${sweepFlagInner} ${p0i.x} ${p0i.y}`,
            "Z",
        ].join(" ")
    }

    const insetOuter = (cr / rOuter) * (180 / Math.PI)
    const insetInner = (cr / rInner) * (180 / Math.PI)

    const a0o = a0 + (sweep >= 0 ? insetOuter : -insetOuter)
    const a1o = a1 - (sweep >= 0 ? insetOuter : -insetOuter)
    const a0i = a0 + (sweep >= 0 ? insetInner : -insetInner)
    const a1i = a1 - (sweep >= 0 ? insetInner : -insetInner)

    const q0o = polar(cx, cy, rOuter, a0o)
    const q1o = polar(cx, cy, rOuter, a1o)
    const q0i = polar(cx, cy, rInner, a0i)
    const q1i = polar(cx, cy, rInner, a1i)

    const p0oIn = polar(cx, cy, rOuter, a0)
    const p1oIn = polar(cx, cy, rOuter, a1)
    const p0iIn = polar(cx, cy, rInner, a0)
    const p1iIn = polar(cx, cy, rInner, a1)

    const cornerArc = cr

    return [
        `M ${q0o.x} ${q0o.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} ${sweepFlagOuter} ${q1o.x} ${q1o.y}`,
        `A ${cornerArc} ${cornerArc} 0 0 ${sweepFlagOuter} ${p1iIn.x} ${p1iIn.y}`,
        `L ${q1i.x} ${q1i.y}`,
        `A ${rInner} ${rInner} 0 ${largeArc} ${sweepFlagInner} ${q0i.x} ${q0i.y}`,
        `A ${cornerArc} ${cornerArc} 0 0 ${sweepFlagOuter} ${p0oIn.x} ${p0oIn.y}`,
        "Z",
    ].join(" ")
}

/**
 * Instructions:
 * Create a component of a circular gallery like the attached screenshot.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CircularGallery(props: CircularGalleryProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Image 1",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 3",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 4",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 5",
            },
        ],
        startAngle = -180,
        sweepAngle = 180,
        gapDegrees = 3,
        innerRadiusRatio = 0.56,
        outerPadding = 8,
        cornerRadius = 10,
        hoverScaleEnabled = true,
        hoverScale = 1.02,
        hoverOffsetRatio = 0.06,
        hoverDuration = 0.18,
        revolveEnabled = false,
        revolveDuration = 16,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = React.useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { amount: 0.2, once: false })
    const [isHovering, setIsHovering] = React.useState(false)
    const revolveControls = useAnimationControls()

    const count = Math.max(1, images.length)
    const totalGap = gapDegrees * Math.max(0, count - 1)
    const usableSweep = sweepAngle >= 0 ? Math.max(0, sweepAngle - totalGap) : Math.min(0, sweepAngle + totalGap)
    const seg = usableSweep / count

    const VB = 1000
    const cx = VB / 2
    const cy = VB / 2
    const outerR = VB / 2 - outerPadding
    const innerR = clamp(innerRadiusRatio, 0.05, 0.95) * outerR

    const wedges = React.useMemo(() => {
        const list: { path: string; fillId: string; label: string; midAngle: number }[] = []
        for (let i = 0; i < count; i++) {
            const a0 = startAngle + i * (seg + (sweepAngle >= 0 ? gapDegrees : -gapDegrees))
            const a1 = a0 + seg
            const path = arcPath(cx, cy, outerR, innerR, a0, a1, cornerRadius)
            const fillId = `cg_img_${i}`
            const label = images[i]?.alt || `Image ${i + 1}`
            const midAngle = (a0 + a1) / 2
            list.push({ path, fillId, label, midAngle })
        }
        return list
    }, [count, startAngle, seg, gapDegrees, sweepAngle, cx, cy, outerR, innerR, cornerRadius, images])

    const isFullWidth = !!props?.style && props.style?.width === "100%"
    const isFullHeight = !!props?.style && props.style?.height === "100%"

    const canAnimate = !isStatic && inView

    React.useEffect(() => {
        if (!canAnimate || !revolveEnabled) {
            revolveControls.stop()
            revolveControls.set({ rotate: 0 })
            return
        }

        if (isHovering) {
            revolveControls.stop()
            return
        }

        revolveControls.start({
            rotate: 360,
            transition: { duration: Math.max(0.1, revolveDuration), ease: "linear", repeat: Infinity },
        })
    }, [canAnimate, revolveEnabled, revolveDuration, isHovering, revolveControls])

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                ...(isFullWidth ? null : { minWidth: 320 }),
                ...(isFullHeight ? null : { minHeight: 240 }),
                ...props.style,
            }}
            aria-label="Circular gallery"
            role="img"
        >
            <motion.svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${VB} ${VB}`}
                style={{
                    display: "block",
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                }}
                animate={
                    canAnimate
                        ? {
                              scale: 1,
                          }
                        : { scale: 1 }
                }
            >
                <defs>
                    {images.slice(0, count).map((img, i) => {
                        const src = img?.src || ""
                        return (
                            <pattern
                                key={`p_${i}`}
                                id={`cg_img_${i}`}
                                patternUnits="objectBoundingBox"
                                patternContentUnits="objectBoundingBox"
                                width="1"
                                height="1"
                            >
                                <image
                                    href={src}
                                    x="0"
                                    y="0"
                                    width="1"
                                    height="1"
                                    preserveAspectRatio="xMidYMid slice"
                                />
                            </pattern>
                        )
                    })}
                </defs>

                <motion.g
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                    animate={revolveControls}
                >
                    {wedges.map((w, i) => {
                        const img = images[i]
                        const alt = img?.alt || `Image ${i + 1}`
                        return (
                            <motion.path
                                key={`w_${i}`}
                                d={w.path}
                                fill={`url(#${w.fillId})`}
                                stroke="rgba(255,255,255,0.95)"
                                strokeWidth={2}
                                initial={false}
                                animate={
                                    canAnimate
                                        ? {
                                              opacity: 1,
                                          }
                                        : { opacity: 1 }
                                }
                                onHoverStart={
                                    isStatic
                                        ? undefined
                                        : () => {
                                              startTransition(() => setIsHovering(true))
                                          }
                                }
                                onHoverEnd={
                                    isStatic
                                        ? undefined
                                        : () => {
                                              startTransition(() => setIsHovering(false))
                                          }
                                }
                                whileHover={
                                    isStatic || !hoverScaleEnabled
                                        ? undefined
                                        : {
                                              scale: clamp(hoverScale, 1, 1.3),
                                              x: Math.cos(degToRad(w.midAngle)) * outerR * clamp(hoverOffsetRatio, 0, 0.5),
                                              y: Math.sin(degToRad(w.midAngle)) * outerR * clamp(hoverOffsetRatio, 0, 0.5),
                                              transition: { duration: Math.max(0, hoverDuration) },
                                          }
                                }
                                style={{
                                    transformOrigin: `${cx}px ${cy}px`,
                                    transformBox: "fill-box",
                                    cursor: isStatic ? "default" : "pointer",
                                }}
                                role="img"
                                aria-label={alt}
                            />
                        )
                    })}
                </motion.g>
            </motion.svg>
        </div>
    )
}

addPropertyControls(CircularGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 10,
        defaultValue: [
            { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Image 1" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 2" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 4" },
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 5" },
        ],
        control: {
            type: ControlType.ResponsiveImage,
        },
    },
    startAngle: {
        type: ControlType.Number,
        title: "Start",
        defaultValue: -180,
        min: -360,
        max: 360,
        step: 1,
        unit: "°",
    },
    sweepAngle: {
        type: ControlType.Number,
        title: "Sweep",
        defaultValue: 180,
        min: -360,
        max: 360,
        step: 1,
        unit: "°",
    },
    gapDegrees: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 3,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "°",
    },
    innerRadiusRatio: {
        type: ControlType.Number,
        title: "Inner",
        defaultValue: 0.56,
        min: 0.2,
        max: 0.85,
        step: 0.01,
    },
    outerPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corners",
        defaultValue: 10,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    hoverScaleEnabled: {
        type: ControlType.Boolean,
        title: "Hover On",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover",
        defaultValue: 1.02,
        min: 1,
        max: 1.3,
        step: 0.01,
        hidden: ({ hoverScaleEnabled }) => !hoverScaleEnabled,
    },
    hoverOffsetRatio: {
        type: ControlType.Number,
        title: "Hover Out",
        defaultValue: 0.06,
        min: 0,
        max: 0.3,
        step: 0.01,
        hidden: ({ hoverScaleEnabled }) => !hoverScaleEnabled,
    },
    hoverDuration: {
        type: ControlType.Number,
        title: "Hover Dur",
        defaultValue: 0.18,
        min: 0,
        max: 1,
        step: 0.01,
        unit: "s",
        hidden: ({ hoverScaleEnabled }) => !hoverScaleEnabled,
    },
    revolveEnabled: {
        type: ControlType.Boolean,
        title: "Revolve",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    revolveDuration: {
        type: ControlType.Number,
        title: "Rev Dur",
        defaultValue: 16,
        min: 1,
        max: 60,
        step: 0.5,
        unit: "s",
        hidden: ({ revolveEnabled }) => !revolveEnabled,
    },
})