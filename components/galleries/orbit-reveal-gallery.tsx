import { useEffect, useRef, useState } from "react"
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
    useInView,
    useReducedMotion,
    useMotionValue,
    useTransform,
    useSpring,
    animate,
} from "framer-motion"

/**
 * Orbit Reveal Gallery
 * Images burst out from the center on scroll, then orbit around the heading.
 * The orbit loop only runs while the component is visible in the viewport.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 880
 */

const DEFAULT_IMAGES = [
    { width: 152, height: 168, x: 36, y: 26, radius: 0 },
    { width: 120, height: 136, x: 47, y: 17, radius: 0 },
    { width: 152, height: 168, x: 70, y: 36, radius: 0 },
    { width: 152, height: 168, x: 31, y: 65, radius: 0 },
    { width: 152, height: 168, x: 55, y: 79, radius: 0 },
    { width: 120, height: 136, x: 67, y: 72, radius: 0 },
]

const DEFAULT_BUTTON = {
    show: true,
    label: "Learn about our efforts",
    link: "",
    newTab: false,
    font: {},
    height: 44,
    paddingX: 20,
    gap: 4,
    radius: 4,
    roundOnHover: true,
    borderWidth: 1,
    labelBg: "transparent",
    labelColor: "#2B2A22",
    borderColor: "#CFC8BC",
    fillColor: "#5C6B3C",
    hoverLabelColor: "#FFFFFF",
    hoverBorderColor: "#5C6B3C",
    showIcon: true,
    iconPosition: "left",
    iconBg: "#DCDCC8",
    iconColor: "#2B2A22",
    iconHoverBg: "#2B2A22",
    iconHoverColor: "#FFFFFF",
    iconSize: 20,
    duration: 0.5,
    exitMode: "continue",
}

const DEFAULT_ANIMATION = {
    once: true,
    threshold: 0.3,
    duration: 1.2,
    stagger: 0.08,
    startScale: 0.4,
    travel: 0.6,
    imageDelay: 0,
    textDelay: 0.2,
    reducedMotion: "respect",
}

const DEFAULT_ORBIT = {
    enabled: true,
    speed: 4,
    direction: "clockwise",
    shape: "circle",
    pauseOn: "image",
}

const DEFAULT_HOVER = {
    tilt: true,
    maxTilt: 12,
    hoverScale: 1.04,
    perspective: 800,
}

const DEFAULT_RESPONSIVE = {
    enabled: true,
    baseWidth: 1440,
    minScale: 0.52,
}

const EASE = [0.22, 1, 0.36, 1]
const SWEEP_EASE = [0.65, 0, 0.35, 1]
const MAX_DELTA = 50 // ms, prevents jumps after tab switches

function useSize(ref: any) {
    const [size, setSize] = useState({ w: 0, h: 0 })
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return size
}

/* ---------- Image on the orbit ---------- */
function OrbitImage({
    item,
    index,
    angle,
    w,
    h,
    scale,
    show,
    animation,
    shape,
    hoverCfg,
    isHovered,
    onHoverChange,
}) {
    const baseW = item.width ?? 152
    const baseH = item.height ?? 168
    const px = item.x ?? 50
    const py = item.y ?? 50
    const iw = Math.round((baseW * scale) / 4) * 4
    const ih = Math.round((baseH * scale) / 4) * 4
    const radius = item.radius ?? 0

    const geo = useRef({ ox: 0, oy: 0, w: 0, h: 0, shape, travel: 0.6 })
    geo.current = {
        ox: (px / 100 - 0.5) * w,
        oy: (py / 100 - 0.5) * h,
        w,
        h,
        shape,
        travel: animation.travel,
    }

    const progress = useMotionValue(show ? 1 : 0)
    useEffect(() => {
        const controls = animate(progress, show ? 1 : 0, {
            duration: animation.duration,
            ease: EASE,
            delay: show ? animation.imageDelay + index * animation.stagger : 0,
        })
        return () => controls.stop()
    }, [show])

    const getPos = (a: number, p: number) => {
        const g = geo.current
        const rad = (a * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const factor = 1 - g.travel + g.travel * p

        if (g.shape === "ellipse" && g.w > 0 && g.h > 0) {
            const nx = g.ox / (g.w / 2)
            const ny = g.oy / (g.h / 2)
            return {
                x: (nx * cos - ny * sin) * (g.w / 2) * factor,
                y: (nx * sin + ny * cos) * (g.h / 2) * factor,
            }
        }
        return {
            x: (g.ox * cos - g.oy * sin) * factor,
            y: (g.ox * sin + g.oy * cos) * factor,
        }
    }

    const x = useTransform([angle, progress], ([a, p]: any) => getPos(a, p).x)
    const y = useTransform([angle, progress], ([a, p]: any) => getPos(a, p).y)
    const s = useTransform(progress, [0, 1], [animation.startScale, 1])
    const opacity = useTransform(progress, [0, 0.4, 1], [0, 1, 1])

    const springCfg = { stiffness: 200, damping: 20, mass: 0.6 }
    const rotateX = useSpring(0, springCfg)
    const rotateY = useSpring(0, springCfg)
    const hoverS = useSpring(1, springCfg)

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!hoverCfg.tilt) return
        const r = e.currentTarget.getBoundingClientRect()
        const relX = (e.clientX - r.left) / r.width - 0.5
        const relY = (e.clientY - r.top) / r.height - 0.5
        rotateY.set(relX * 2 * hoverCfg.maxTilt)
        rotateX.set(-relY * 2 * hoverCfg.maxTilt)
    }

    const handleEnter = () => {
        hoverS.set(hoverCfg.hoverScale)
        onHoverChange(index, true)
    }

    const handleLeave = () => {
        rotateX.set(0)
        rotateY.set(0)
        hoverS.set(1)
        onHoverChange(index, false)
    }

    return (
        <motion.div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: iw,
                height: ih,
                marginLeft: -iw / 2,
                marginTop: -ih / 2,
                x,
                y,
                scale: s,
                opacity,
                zIndex: isHovered ? 2 : 1,
            }}
        >
            <motion.div
                onMouseEnter={handleEnter}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                style={{
                    width: "100%",
                    height: "100%",
                    rotateX,
                    rotateY,
                    scale: hoverS,
                    transformPerspective: hoverCfg.perspective,
                    borderRadius: radius,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.12)",
                    cursor: "pointer",
                    willChange: "transform",
                }}
            >
                {item.image?.src && (
                    <img
                        src={item.image.src}
                        srcSet={item.image.srcSet}
                        alt={item.image.alt || ""}
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </motion.div>
        </motion.div>
    )
}

/* ---------- Sweep button ---------- */
function SweepButton({ b }) {
    const [hover, setHover] = useState(false)
    const originX = b.exitMode === "continue" ? (hover ? 0 : 1) : 0
    const r =
        hover && b.roundOnHover
            ? b.height / 2
            : Math.min(b.radius, b.height / 2)
    const t = { duration: b.duration, ease: SWEEP_EASE }

    return (
        <a
            href={b.link || undefined}
            target={b.newTab ? "_blank" : undefined}
            rel={b.newTab ? "noopener" : undefined}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: "inline-flex",
                flexDirection:
                    b.iconPosition === "left" ? "row" : "row-reverse",
                alignItems: "center",
                gap: b.gap,
                textDecoration: "none",
                cursor: "pointer",
            }}
        >
            {b.showIcon && (
                <motion.span
                    initial={false}
                    animate={{
                        backgroundColor: hover ? b.iconHoverBg : b.iconBg,
                        color: hover ? b.iconHoverColor : b.iconColor,
                        borderRadius: r,
                    }}
                    transition={t}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: b.height,
                        height: b.height,
                        flexShrink: 0,
                    }}
                >
                    <svg
                        width={b.iconSize}
                        height={b.iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M7 4v10h12" />
                        <path d="M15 10l4 4-4 4" />
                    </svg>
                </motion.span>
            )}

            <motion.span
                initial={false}
                animate={{
                    borderColor: hover ? b.hoverBorderColor : b.borderColor,
                    borderRadius: r,
                }}
                transition={t}
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    height: b.height,
                    padding: `0 ${b.paddingX}px`,
                    border: `${b.borderWidth}px solid ${b.borderColor}`,
                    background: b.labelBg,
                    overflow: "hidden",
                    boxSizing: "border-box",
                    flexShrink: 0,
                }}
            >
                <motion.span
                    initial={false}
                    animate={{ scaleX: hover ? 1 : 0 }}
                    transition={t}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: b.fillColor,
                        originX,
                        pointerEvents: "none",
                    }}
                />
                <motion.span
                    initial={false}
                    animate={{
                        color: hover ? b.hoverLabelColor : b.labelColor,
                    }}
                    transition={t}
                    style={{
                        position: "relative",
                        whiteSpace: "nowrap",
                        fontSize: 16,
                        lineHeight: "24px",
                        fontWeight: 500,
                        ...(b.font || {}),
                    }}
                >
                    {b.label}
                </motion.span>
            </motion.span>
        </a>
    )
}

/* ---------- Main component ---------- */
export default function OrbitRevealGallery(props: any) {
    const {
        images,
        background = "#F3EAE5",
        minHeight = 880,
        showEyebrow = true,
        eyebrow = "CONSERVATION",
        heading = "Preserving Life's Balance",
        eyebrowFont = {},
        headingFont = {},
        eyebrowColor = "#2B2A22",
        headingColor = "#2B2A22",
        textMaxWidth = 560,
        textGap = 36,
        buttonGap = 40,
        style,
    } = props

    const button = { ...DEFAULT_BUTTON, ...(props.button || {}) }
    const animation = { ...DEFAULT_ANIMATION, ...(props.animation || {}) }
    const orbit = { ...DEFAULT_ORBIT, ...(props.orbit || {}) }
    const hoverCfg = { ...DEFAULT_HOVER, ...(props.imageHover || {}) }
    const responsive = { ...DEFAULT_RESPONSIVE, ...(props.responsive || {}) }

    const ref = useRef(null)
    const { w, h } = useSize(ref)
    const systemReduce = useReducedMotion()
    const reduceMotion = animation.reducedMotion === "respect" && !!systemReduce
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Reveal trigger (can play once)
    const inView = useInView(ref, {
        once: animation.once,
        amount: animation.threshold,
    })
    const show = isCanvas || reduceMotion || inView

    // Live visibility, used to start and stop the orbit loop
    const isVisible = useInView(ref, { amount: 0 })

    const ratio = w > 0 ? w / responsive.baseWidth : 1
    const scale = responsive.enabled
        ? Math.max(responsive.minScale, Math.min(1, ratio))
        : 1

    const [hoveredImage, setHoveredImage] = useState<number | null>(null)
    const [sectionHover, setSectionHover] = useState(false)

    const onHoverChange = (i: number, on: boolean) => {
        setHoveredImage((cur) => (on ? i : cur === i ? null : cur))
    }

    const paused =
        (orbit.pauseOn === "image" && hoveredImage !== null) ||
        (orbit.pauseOn === "section" && sectionHover)

    const canOrbit = orbit.enabled && !isCanvas && !reduceMotion && isVisible
    const spin = canOrbit && !paused

    const angle = useMotionValue(0)
    const speedFactor = useRef(paused ? 0 : 1)

    // Keep the latest orbit settings available to the loop
    const settings = useRef({ speed: orbit.speed, direction: orbit.direction })
    settings.current = { speed: orbit.speed, direction: orbit.direction }

    // Orbit loop: only runs while visible, stops itself once fully paused
    useEffect(() => {
        if (!canOrbit) return
        if (!spin && speedFactor.current < 0.001) return

        let raf = 0
        let last = performance.now()
        const target = spin ? 1 : 0

        const tick = (now: number) => {
            const delta = Math.min(now - last, MAX_DELTA)
            last = now

            const k = Math.min(1, (delta / 1000) * 5)
            speedFactor.current += (target - speedFactor.current) * k

            const dir = settings.current.direction === "clockwise" ? 1 : -1
            angle.set(
                angle.get() +
                    dir *
                        settings.current.speed *
                        speedFactor.current *
                        (delta / 1000)
            )

            // Fully stopped while paused: end the loop, no idle frames
            if (target === 0 && speedFactor.current < 0.001) {
                speedFactor.current = 0
                return
            }
            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [canOrbit, spin])

    const list =
        Array.isArray(images) && images.length > 0 ? images : DEFAULT_IMAGES

    return (
        <div
            ref={ref}
            onMouseEnter={() => setSectionHover(true)}
            onMouseLeave={() => setSectionHover(false)}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight,
                background,
                overflow: "hidden",
            }}
        >
            {list.map((item: any, i: number) => (
                <OrbitImage
                    key={i}
                    item={item}
                    index={i}
                    angle={angle}
                    w={w}
                    h={h}
                    scale={scale}
                    show={show}
                    animation={animation}
                    shape={orbit.shape}
                    hoverCfg={hoverCfg}
                    isHovered={hoveredImage === i}
                    onHoverChange={onHoverChange}
                />
            ))}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 3,
                }}
            >
                <motion.div
                    initial={false}
                    animate={
                        show ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
                    }
                    transition={{
                        duration: animation.duration,
                        ease: EASE,
                        delay: show ? animation.textDelay : 0,
                    }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: buttonGap,
                        maxWidth: textMaxWidth,
                        pointerEvents: "auto",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: textGap,
                        }}
                    >
                        {showEyebrow && (
                            <p
                                style={{
                                    margin: 0,
                                    color: eyebrowColor,
                                    textAlign: "center",
                                    fontSize: 16,
                                    lineHeight: "24px",
                                    ...eyebrowFont,
                                }}
                            >
                                {eyebrow}
                            </p>
                        )}
                        <h2
                            style={{
                                margin: 0,
                                color: headingColor,
                                textAlign: "center",
                                fontSize: 40,
                                lineHeight: "48px",
                                fontWeight: 400,
                                ...headingFont,
                            }}
                        >
                            {heading}
                        </h2>
                    </div>

                    {button.show && <SweepButton b={button} />}
                </motion.div>
            </div>
        </div>
    )
}

OrbitRevealGallery.displayName = "Orbit Reveal Gallery"

addPropertyControls(OrbitRevealGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 16,
        defaultValue: DEFAULT_IMAGES,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                width: {
                    type: ControlType.Number,
                    title: "Width",
                    defaultValue: 152,
                    min: 24,
                    max: 800,
                    step: 4,
                    unit: "px",
                },
                height: {
                    type: ControlType.Number,
                    title: "Height",
                    defaultValue: 168,
                    min: 24,
                    max: 800,
                    step: 4,
                    unit: "px",
                },
                x: {
                    type: ControlType.Number,
                    title: "X",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                y: {
                    type: ControlType.Number,
                    title: "Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                radius: {
                    type: ControlType.Number,
                    title: "Radius",
                    defaultValue: 0,
                    min: 0,
                    max: 200,
                    step: 4,
                },
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F3EAE5",
    },
    minHeight: {
        type: ControlType.Number,
        title: "Min Height",
        defaultValue: 880,
        min: 200,
        max: 2000,
        step: 4,
        unit: "px",
    },
    showEyebrow: {
        type: ControlType.Boolean,
        title: "Eyebrow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow Text",
        defaultValue: "CONSERVATION",
        hidden: (p: any) => !p.showEyebrow,
    },
    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 16, lineHeight: "24px" },
        hidden: (p: any) => !p.showEyebrow,
    },
    eyebrowColor: {
        type: ControlType.Color,
        title: "Eyebrow Color",
        defaultValue: "#2B2A22",
        hidden: (p: any) => !p.showEyebrow,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Preserving Life's Balance",
        displayTextArea: true,
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: { fontSize: 40, lineHeight: "48px" },
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#2B2A22",
    },
    textMaxWidth: {
        type: ControlType.Number,
        title: "Text Max W",
        defaultValue: 560,
        min: 160,
        max: 1200,
        step: 4,
        unit: "px",
    },
    textGap: {
        type: ControlType.Number,
        title: "Text Gap",
        defaultValue: 36,
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
    },
    buttonGap: {
        type: ControlType.Number,
        title: "Button Gap",
        defaultValue: 40,
        min: 0,
        max: 160,
        step: 4,
        unit: "px",
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Learn about our efforts",
            },
            link: { type: ControlType.Link, title: "Link" },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 16, lineHeight: "24px" },
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 44,
                min: 24,
                max: 120,
                step: 4,
                unit: "px",
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 20,
                min: 0,
                max: 80,
                step: 4,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 4,
                min: 0,
                max: 40,
                step: 4,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 4,
                min: 0,
                max: 60,
                step: 4,
                unit: "px",
            },
            roundOnHover: {
                type: ControlType.Boolean,
                title: "Round Hover",
                defaultValue: true,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                defaultValue: 1,
                min: 0,
                max: 4,
                step: 1,
                unit: "px",
            },
            labelBg: {
                type: ControlType.Color,
                title: "Label BG",
                defaultValue: "transparent",
            },
            labelColor: {
                type: ControlType.Color,
                title: "Label Text",
                defaultValue: "#2B2A22",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#CFC8BC",
            },
            fillColor: {
                type: ControlType.Color,
                title: "Hover Fill",
                defaultValue: "#5C6B3C",
            },
            hoverLabelColor: {
                type: ControlType.Color,
                title: "Hover Text",
                defaultValue: "#FFFFFF",
            },
            hoverBorderColor: {
                type: ControlType.Color,
                title: "Hover Border",
                defaultValue: "#5C6B3C",
            },
            showIcon: {
                type: ControlType.Boolean,
                title: "Icon Box",
                defaultValue: true,
            },
            iconPosition: {
                type: ControlType.Enum,
                title: "Icon Side",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
            },
            iconBg: {
                type: ControlType.Color,
                title: "Icon BG",
                defaultValue: "#DCDCC8",
            },
            iconColor: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#2B2A22",
            },
            iconHoverBg: {
                type: ControlType.Color,
                title: "Icon Hover BG",
                defaultValue: "#2B2A22",
            },
            iconHoverColor: {
                type: ControlType.Color,
                title: "Icon Hover",
                defaultValue: "#FFFFFF",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                defaultValue: 20,
                min: 12,
                max: 48,
                step: 4,
                unit: "px",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.5,
                min: 0.1,
                max: 2,
                step: 0.05,
                unit: "s",
            },
            exitMode: {
                type: ControlType.Enum,
                title: "On Leave",
                options: ["continue", "reverse"],
                optionTitles: ["Exit Right", "Back Left"],
                defaultValue: "continue",
                displaySegmentedControl: true,
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Reveal",
        controls: {
            once: {
                type: ControlType.Boolean,
                title: "Play Once",
                defaultValue: true,
            },
            threshold: {
                type: ControlType.Number,
                title: "Trigger At",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.05,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 1.2,
                min: 0.1,
                max: 4,
                step: 0.1,
                unit: "s",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 0.08,
                min: 0,
                max: 1,
                step: 0.01,
                unit: "s",
            },
            startScale: {
                type: ControlType.Number,
                title: "Start Scale",
                defaultValue: 0.4,
                min: 0,
                max: 1,
                step: 0.05,
            },
            travel: {
                type: ControlType.Number,
                title: "Travel",
                defaultValue: 0.6,
                min: 0,
                max: 1,
                step: 0.05,
            },
            imageDelay: {
                type: ControlType.Number,
                title: "Image Delay",
                defaultValue: 0,
                min: 0,
                max: 3,
                step: 0.05,
                unit: "s",
            },
            textDelay: {
                type: ControlType.Number,
                title: "Text Delay",
                defaultValue: 0.2,
                min: 0,
                max: 3,
                step: 0.05,
                unit: "s",
            },
            reducedMotion: {
                type: ControlType.Enum,
                title: "Reduce Motion",
                options: ["respect", "ignore"],
                optionTitles: ["Respect", "Ignore"],
                defaultValue: "respect",
                displaySegmentedControl: true,
            },
        },
    },
    orbit: {
        type: ControlType.Object,
        title: "Orbit",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Revolve",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 4,
                min: 0,
                max: 60,
                step: 0.5,
                unit: "°/s",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["clockwise", "counter"],
                optionTitles: ["Clockwise", "Counter"],
                defaultValue: "clockwise",
                displaySegmentedControl: true,
            },
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["circle", "ellipse"],
                optionTitles: ["Circle", "Ellipse"],
                defaultValue: "circle",
                displaySegmentedControl: true,
            },
            pauseOn: {
                type: ControlType.Enum,
                title: "Pause On",
                options: ["image", "section", "none"],
                optionTitles: ["Image", "Section", "Never"],
                defaultValue: "image",
                displaySegmentedControl: true,
            },
        },
    },
    imageHover: {
        type: ControlType.Object,
        title: "Image Hover",
        controls: {
            tilt: {
                type: ControlType.Boolean,
                title: "Tilt",
                defaultValue: true,
            },
            maxTilt: {
                type: ControlType.Number,
                title: "Max Tilt",
                defaultValue: 12,
                min: 0,
                max: 40,
                step: 1,
                unit: "°",
            },
            hoverScale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 1.04,
                min: 1,
                max: 1.4,
                step: 0.01,
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 800,
                min: 200,
                max: 2000,
                step: 40,
                unit: "px",
            },
        },
    },
    responsive: {
        type: ControlType.Object,
        title: "Responsive",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Scale Images",
                defaultValue: true,
            },
            baseWidth: {
                type: ControlType.Number,
                title: "Design Width",
                defaultValue: 1440,
                min: 320,
                max: 2560,
                step: 4,
                unit: "px",
            },
            minScale: {
                type: ControlType.Number,
                title: "Min Scale",
                defaultValue: 0.52,
                min: 0.1,
                max: 1,
                step: 0.02,
            },
        },
    },
})
