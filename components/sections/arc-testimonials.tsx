import * as React from "react"
import { useState, useEffect, useLayoutEffect, useRef } from "react"
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
    AnimatePresence,
    animate,
    useMotionValue,
    useReducedMotion,
    MotionValue,
} from "framer-motion"

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

type Item = {
    image?: { src: string; srcSet?: string; alt?: string }
    quote: string
    name: string
    role: string
    rating: number
}

type Geo = {
    cx: number
    cy: number
    r: number
    step: number
    half: number
    s: number
    activeScale: number
}

function Star({ size, color }: { size: number; color: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            aria-hidden="true"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
        </svg>
    )
}

/* One circle. It follows the arc using a shared rotation value, so a click
   rotates it along the arc like a clock hand instead of jumping across. */
function Avatar(props: {
    k: number
    item: Item
    rotation: MotionValue<number>
    geo: Geo
    activeBorder: number
    activeBorderColor: string
    interactive: boolean
    clickable: boolean
    isActive: boolean
    onSelect: (k: number) => void
}) {
    const {
        k,
        item,
        rotation,
        geo,
        activeBorder,
        activeBorderColor,
        interactive,
        clickable,
        isActive,
        onSelect,
    } = props

    const place = (v: number) => {
        const o = k - v
        const a = ((90 + o * geo.step) * Math.PI) / 180
        const act = clamp(1 - Math.abs(o), 0, 1)
        return {
            x: geo.cx + geo.r * Math.cos(a) - geo.s / 2,
            y: geo.cy - geo.r * Math.sin(a) - geo.s / 2,
            opacity: clamp(geo.half + 1 - Math.abs(o), 0, 1),
            scale: 1 + (geo.activeScale - 1) * act,
            ring: act,
            z: Math.round(act * 10),
        }
    }

    const p0 = place(rotation.get())
    const x = useMotionValue(p0.x)
    const y = useMotionValue(p0.y)
    const opacity = useMotionValue(p0.opacity)
    const scale = useMotionValue(p0.scale)
    const ring = useMotionValue(p0.ring)
    const zIndex = useMotionValue(p0.z)

    useIso(() => {
        const update = (v: number) => {
            const p = place(v)
            x.set(p.x)
            y.set(p.y)
            opacity.set(p.opacity)
            scale.set(p.scale)
            ring.set(p.ring)
            zIndex.set(p.z)
        }
        update(rotation.get())
        return rotation.on("change", update)
    }, [
        k,
        rotation,
        geo.cx,
        geo.cy,
        geo.r,
        geo.step,
        geo.half,
        geo.s,
        geo.activeScale,
    ])

    const initial = (item.name || "?").trim().charAt(0).toUpperCase()
    const canClick = clickable && interactive

    return (
        <motion.div
            role={canClick ? "button" : undefined}
            tabIndex={canClick ? 0 : -1}
            aria-label={canClick ? `Show ${item.name}` : undefined}
            aria-current={isActive ? "true" : undefined}
            aria-hidden={interactive ? undefined : true}
            onClick={() => canClick && onSelect(k)}
            onKeyDown={(e) => {
                if (canClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    onSelect(k)
                }
            }}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: geo.s,
                height: geo.s,
                x,
                y,
                opacity,
                scale,
                zIndex,
                borderRadius: "50%",
                overflow: "hidden",
                boxSizing: "border-box",
                background: "#E6E6EA",
                cursor: canClick ? "pointer" : "default",
                pointerEvents: interactive ? "auto" : "none",
                willChange: "transform",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {item.image?.src ? (
                <img
                    src={item.image.src}
                    srcSet={item.image.srcSet}
                    alt={item.image.alt || item.name}
                    draggable={false}
                    loading={interactive ? "eager" : "lazy"}
                    decoding="async"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        fontSize: geo.s * 0.4,
                        color: "#7A7A85",
                    }}
                >
                    {initial}
                </div>
            )}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    boxSizing: "border-box",
                    border: `${activeBorder}px solid ${activeBorderColor}`,
                    opacity: ring,
                    pointerEvents: "none",
                }}
            />
        </motion.div>
    )
}

/**
 * Arc Testimonials
 * Circles sit on an arc and rotate clockwise like a clock.
 * The arc stops at the bottom of the text, so the text height decides
 * how many circles fit. No circle ever goes below the text.
 * If there are fewer testimonials than circles, the list loops so no circle is blank.
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1060
 * @framerIntrinsicHeight 600
 */
export default function ArcTestimonials(props: any) {
    const {
        items,
        avatarSize,
        spacing,
        textWidth,
        textY,
        autoplay,
        interval,
        pauseOnHover,
        reverse,
        clickToSelect,
        animation,
        activeBorder,
        activeBorderColor,
        activeScale,
        showStars,
        starColor,
        starSize,
        quoteFont,
        quoteColor,
        nameFont,
        nameColor,
        roleFont,
        roleColor,
        style,
    } = props

    const list: Item[] =
        Array.isArray(items) && items.length > 0
            ? items
            : [
                  {
                      quote: "Add a testimonial",
                      name: "Name",
                      role: "Role",
                      rating: 5,
                  },
              ]
    const n = list.length
    const mod = (k: number) => ((k % n) + n) % n

    // Static renderer (canvas, thumbnails, exports): no animation, no effects
    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reducedMotion = useReducedMotion()
    const isStatic = isStaticRenderer || isCanvas

    // Safe animation settings, even if an older instance has missing values
    const anim = {
        type: "spring",
        stiffness: 120,
        damping: 26,
        duration: 0.8,
        ...(animation || {}),
    }

    const ref = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const [w, setW] = useState(1060)
    const [th, setTh] = useState(0)
    const [active, setActive] = useState(0)
    const [hovered, setHovered] = useState(false)
    const [inView, setInView] = useState(true)
    const [pageVisible, setPageVisible] = useState(true)
    const rotation = useMotionValue(0)

    // Swipe support
    const pointerStart = useRef<{ x: number; y: number } | null>(null)

    const go = (dir: number) => setActive((a) => a + dir)

    // Measure width (layout size, so canvas zoom does not affect it)
    useIso(() => {
        const el = ref.current
        if (!el) return
        const measure = () => {
            const width = el.offsetWidth
            if (width > 0) setW(width)
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Measure the text block so the arc can stop at its bottom
    useIso(() => {
        const el = textRef.current
        if (!el) return
        const measure = () => setTh(el.offsetHeight)
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Only autoplay while visible on screen and while the tab is open
    useEffect(() => {
        if (isStatic) return
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.1 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic || typeof document === "undefined") return
        const onChange = () => setPageVisible(!document.hidden)
        onChange()
        document.addEventListener("visibilitychange", onChange)
        return () => document.removeEventListener("visibilitychange", onChange)
    }, [isStatic])

    // Rotate along the arc whenever the active index changes
    const animKey = JSON.stringify(anim)
    useEffect(() => {
        if (isStatic || reducedMotion) {
            rotation.set(active)
            return
        }
        const transition: any =
            anim.type === "spring"
                ? {
                      type: "spring",
                      stiffness: anim.stiffness,
                      damping: anim.damping,
                  }
                : {
                      type: "tween",
                      ease: "easeInOut",
                      duration: anim.duration,
                  }
        const controls = animate(rotation, active, transition)
        return () => controls.stop()
    }, [active, animKey, isStatic, reducedMotion])

    // Autoplay, one tick per interval, clockwise by default
    useEffect(() => {
        if (
            !autoplay ||
            isStatic ||
            reducedMotion ||
            !inView ||
            !pageVisible ||
            (pauseOnHover && hovered)
        )
            return
        const t = setTimeout(
            () => go(reverse ? -1 : 1),
            Math.max(0.5, interval) * 1000
        )
        return () => clearTimeout(t)
    }, [
        active,
        autoplay,
        interval,
        pauseOnHover,
        hovered,
        reverse,
        isStatic,
        reducedMotion,
        inView,
        pageVisible,
    ])

    // Geometry
    const s = avatarSize
    const pad = 6
    const topPad = pad + Math.max(0, (s * (activeScale - 1)) / 2)
    const r = Math.max(20, (w - s) / 2 - pad)
    const cx = w / 2
    const cy = topPad + s / 2 + r

    // Text block position
    const textCenter = cy - r * textY
    const textBottom = textCenter + th / 2

    // The arc may never go below the text bottom. The top circle always fits.
    const limitY = Math.max(textBottom, topPad + s + pad)

    // Circle center y is cy - r * cos(angle from top). The circle bottom
    // (center + s / 2) must stay above limitY, which gives the max angle.
    const cosMin = clamp((cy + s / 2 - limitY) / r, -1, 1)
    const maxAngle = clamp((Math.acos(cosMin) * 180) / Math.PI, 0, 90)

    // How many circles fit on each side within that angle, using the spacing
    const chord = s + spacing
    const minStepDeg =
        (2 * Math.asin(clamp(chord / (2 * r), 0, 1)) * 180) / Math.PI
    const half = clamp(Math.floor(maxAngle / Math.max(minStepDeg, 1)), 0, 24)
    const step = half > 0 ? maxAngle / half : Math.max(minStepDeg, 1)
    const geo: Geo = { cx, cy, r, step, half, s, activeScale }

    // The component ends right under the text
    const height = Math.ceil(limitY + pad)

    // Render a wide window of slots so rotating by many steps still has circles
    const W = 2 * half + 3
    const ks: number[] = []
    for (let k = active - W; k <= active + W; k++) ks.push(k)

    const current = list[mod(active)]

    const content = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 20,
                width: "100%",
            }}
        >
            <p
                style={{
                    margin: 0,
                    ...quoteFont,
                    color: quoteColor,
                    textWrap: "balance" as any,
                }}
            >
                {current.quote}
            </p>

            {showStars && (
                <div
                    style={{ display: "flex", gap: 3 }}
                    role="img"
                    aria-label={`${clamp(Math.round(current.rating ?? 5), 0, 5)} out of 5 stars`}
                >
                    {Array.from({
                        length: clamp(Math.round(current.rating ?? 5), 0, 5),
                    }).map((_, i) => (
                        <Star key={i} size={starSize} color={starColor} />
                    ))}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <span style={{ ...nameFont, color: nameColor }}>
                    {current.name}
                </span>
                <span style={{ ...roleFont, color: roleColor }}>
                    {current.role}
                </span>
            </div>
        </div>
    )

    return (
        <div
            ref={ref}
            tabIndex={clickToSelect && !isStatic ? 0 : undefined}
            onMouseEnter={() => !isStatic && setHovered(true)}
            onMouseLeave={() => !isStatic && setHovered(false)}
            onFocus={() => !isStatic && setHovered(true)}
            onBlur={() => !isStatic && setHovered(false)}
            onKeyDown={(e) => {
                if (isStatic || !clickToSelect) return
                if (e.key === "ArrowRight") {
                    e.preventDefault()
                    go(1)
                } else if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    go(-1)
                }
            }}
            onPointerDown={(e) => {
                if (isStatic || !clickToSelect) return
                pointerStart.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerUp={(e) => {
                const start = pointerStart.current
                pointerStart.current = null
                if (!start || isStatic || !clickToSelect) return
                const dx = e.clientX - start.x
                const dy = e.clientY - start.y
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    go(dx < 0 ? 1 : -1)
                }
            }}
            onPointerCancel={() => {
                pointerStart.current = null
            }}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height,
                overflow: "hidden",
                touchAction: "pan-y",
            }}
        >
            {/* Circles are clipped at the text bottom */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: Math.ceil(limitY),
                    overflow: "hidden",
                }}
            >
                {ks.map((k) => (
                    <Avatar
                        key={k}
                        k={k}
                        item={list[mod(k)]}
                        rotation={rotation}
                        geo={geo}
                        activeBorder={activeBorder}
                        activeBorderColor={activeBorderColor}
                        interactive={!isStatic && Math.abs(k - active) <= half}
                        clickable={clickToSelect && !isStatic}
                        isActive={k === active}
                        onSelect={(sel) => setActive(sel)}
                    />
                ))}
            </div>

            {/* Center content */}
            <div
                ref={textRef}
                aria-live={isStatic ? undefined : "polite"}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: textCenter,
                    width: `${textWidth}%`,
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 20,
                }}
            >
                {isStatic || reducedMotion ? (
                    content
                ) : (
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={mod(active)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            style={{ width: "100%" }}
                        >
                            {content}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
}

ArcTestimonials.defaultProps = {
    items: [
        {
            quote: "Conversion transformed our business overnight. From stale organic growth to explosive growth with Google Ads and it's scaling everyday.",
            name: "David Malan",
            role: "Head of Product, Haptik",
            rating: 5,
        },
        {
            quote: "The team understood our product from day one and the results showed up in weeks, not months.",
            name: "Amir Rahman",
            role: "Founder, Northwind",
            rating: 5,
        },
        {
            quote: "Clean, fast and exactly what we asked for. Our launch page has never performed better.",
            name: "Lucas Meyer",
            role: "CMO, Brightly",
            rating: 5,
        },
        {
            quote: "Working with them felt like having an in house team. Highly recommended.",
            name: "Sofia Alvarez",
            role: "Product Lead, Lumen",
            rating: 5,
        },
        {
            quote: "Our sign ups doubled after the redesign. The attention to detail is unmatched.",
            name: "Daniel Kim",
            role: "CEO, Stackly",
            rating: 5,
        },
    ],
    avatarSize: 100,
    spacing: 24,
    textWidth: 50,
    textY: 0.32,
    autoplay: true,
    interval: 4,
    pauseOnHover: true,
    reverse: false,
    clickToSelect: true,
    animation: { type: "spring", stiffness: 120, damping: 26, duration: 0.8 },
    activeBorder: 3,
    activeBorderColor: "#0066FF",
    activeScale: 1,
    showStars: true,
    starColor: "#000000",
    starSize: 18,
    quoteFont: {
        fontFamily: "Inter",
        fontSize: 28,
        fontWeight: 500,
        lineHeight: "1.2em",
        letterSpacing: "-0.04em",
    },
    quoteColor: "#000000",
    nameFont: {
        fontFamily: "Inter",
        fontSize: 17,
        fontWeight: 500,
        lineHeight: "1.3em",
    },
    nameColor: "#000000",
    roleFont: {
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: "1.3em",
    },
    roleColor: "#6B6B6B",
}

addPropertyControls(ArcTestimonials, {
    items: {
        type: ControlType.Array,
        title: "Testimonials",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Photo" },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue: "Great work!",
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Name",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Role, Company",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Stars",
                    min: 0,
                    max: 5,
                    step: 1,
                    defaultValue: 5,
                    displayStepper: true,
                },
            },
        },
    },
    avatarSize: {
        type: ControlType.Number,
        title: "Circle Size",
        min: 40,
        max: 200,
        step: 2,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    textWidth: {
        type: ControlType.Number,
        title: "Text Width",
        min: 20,
        max: 90,
        step: 1,
        unit: "%",
    },
    textY: {
        type: ControlType.Number,
        title: "Text Height",
        min: 0,
        max: 0.8,
        step: 0.01,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
        hidden: (p) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        hidden: (p) => !p.autoplay,
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Counter Clockwise",
        defaultValue: false,
        hidden: (p) => !p.autoplay,
    },
    clickToSelect: {
        type: ControlType.Boolean,
        title: "Click Select",
        defaultValue: true,
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["spring", "tween"],
                optionTitles: ["Spring", "Tween"],
                displaySegmentedControl: true,
            },
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                min: 20,
                max: 600,
                hidden: (p) => p.type !== "spring",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                min: 5,
                max: 80,
                hidden: (p) => p.type !== "spring",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.1,
                max: 3,
                step: 0.1,
                unit: "s",
                hidden: (p) => p.type !== "tween",
            },
        },
    },
    activeBorder: {
        type: ControlType.Number,
        title: "Active Border",
        min: 0,
        max: 8,
        step: 1,
        unit: "px",
    },
    activeBorderColor: { type: ControlType.Color, title: "Active Color" },
    activeScale: {
        type: ControlType.Number,
        title: "Active Scale",
        min: 0.8,
        max: 1.5,
        step: 0.05,
    },
    showStars: {
        type: ControlType.Boolean,
        title: "Stars",
        defaultValue: true,
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        hidden: (p) => !p.showStars,
    },
    starSize: {
        type: ControlType.Number,
        title: "Star Size",
        min: 8,
        max: 40,
        step: 1,
        hidden: (p) => !p.showStars,
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
    },
    quoteColor: { type: ControlType.Color, title: "Quote Color" },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
    },
    nameColor: { type: ControlType.Color, title: "Name Color" },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
    },
    roleColor: { type: ControlType.Color, title: "Role Color" },
})
