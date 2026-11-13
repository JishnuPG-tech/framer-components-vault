/**
 * Pixionweb Service Card
 * Original component implementation for Framer.
 * Use only images, fonts, and other assets that you own or are licensed to use.
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
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
    useInView,
} from "framer-motion"

/**
 * Convert Framer's usual hex/rgb color values to rgba() for broad browser support.
 * This also avoids relying on newer CSS color functions.
 */
function colorWithOpacity(color: string, opacity: number): string {
    const alpha = Math.max(0, Math.min(1, opacity))
    const value = typeof color === "string" ? color.trim() : ""

    const hex = value.match(
        /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
    )
    if (hex) {
        let raw = hex[1]
        if (raw.length === 3 || raw.length === 4) {
            raw = raw
                .split("")
                .map((part) => part + part)
                .join("")
        }
        const red = parseInt(raw.slice(0, 2), 16)
        const green = parseInt(raw.slice(2, 4), 16)
        const blue = parseInt(raw.slice(4, 6), 16)
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`
    }

    const rgb = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
    if (rgb) {
        const red = Math.max(0, Math.min(255, Number(rgb[1])))
        const green = Math.max(0, Math.min(255, Number(rgb[2])))
        const blue = Math.max(0, Math.min(255, Number(rgb[3])))
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`
    }

    // Safe visual fallback for uncommon CSS color formats from external sources.
    return `rgba(139, 92, 246, ${alpha})`
}

interface PixionwebServiceCardProps {
    number: string
    eyebrow: string
    title: string
    description: string
    image: string
    accent: string
    orbColor: string
    background: string
    textColor: string
    radius: number
    tilt: number
    imageDepth: number
    contentDepth: number
    hoverScale: number
    showImage: boolean
    showDescription: boolean
    showGlow: boolean
    showBadge: boolean
}

export default function PixionwebServiceCard(props: PixionwebServiceCardProps) {
    const {
        number,
        eyebrow,
        title,
        description,
        image,
        accent,
        orbColor,
        background,
        textColor,
        radius,
        tilt,
        imageDepth,
        contentDepth,
        hoverScale,
        showImage,
        showDescription,
        showGlow,
        showBadge,
    } = props

    const accentSoft = colorWithOpacity(accent, 0.44)
    const accentFaint = colorWithOpacity(accent, 0.22)
    const accentGlow = colorWithOpacity(accent, 0.33)
    const accentHalf = colorWithOpacity(accent, 0.5)
    const accentBorder = colorWithOpacity(accent, 0.33)
    const accentArrowShadow = colorWithOpacity(accent, 0.18)
    const orbGlow = colorWithOpacity(orbColor, 0.42)

    // Keep the component still on the Framer Canvas/export and respect
    // the visitor's reduced-motion preference on the published site.
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const motionDisabled = isStaticRenderer || prefersReducedMotion === true
    const cardRef = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(cardRef, { amount: 0.1 })
    const shouldAnimate = !motionDisabled && isInView

    const mx = useMotionValue(0)
    const my = useMotionValue(0)

    const sx = useSpring(mx, {
        stiffness: 180,
        damping: 24,
        mass: 0.7,
    })

    const sy = useSpring(my, {
        stiffness: 180,
        damping: 24,
        mass: 0.7,
    })

    /* 3D */

    const rotateX = useTransform(sy, [-0.5, 0.5], [tilt, -tilt])

    const rotateY = useTransform(sx, [-0.5, 0.5], [-tilt, tilt])

    /* Image depth */

    const imgX = useTransform(sx, [-0.5, 0.5], [-imageDepth, imageDepth])

    const imgY = useTransform(sy, [-0.5, 0.5], [-imageDepth, imageDepth])

    /* Content depth */

    const contentX = useTransform(
        sx,
        [-0.5, 0.5],
        [-contentDepth, contentDepth]
    )

    const contentY = useTransform(
        sy,
        [-0.5, 0.5],
        [-contentDepth, contentDepth]
    )

    /* Arrow */

    const arrowX = useTransform(sx, [-0.5, 0.5], [-7, 7])

    const arrowY = useTransform(sy, [-0.5, 0.5], [-7, 7])

    const arrowRotate = useTransform(sx, [-0.5, 0.5], [-20, 20])

    function move(event: React.MouseEvent<HTMLDivElement>) {
        // This is intentionally a mouse-only effect; touch users keep a stable card.
        const rect = event.currentTarget.getBoundingClientRect()
        if (!rect.width || !rect.height) return

        const x = Math.max(
            -0.5,
            Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5)
        )
        const y = Math.max(
            -0.5,
            Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5)
        )

        mx.set(x)
        my.set(y)
    }

    function leave() {
        mx.set(0)
        my.set(0)
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                perspective: 1400,
                WebkitPerspective: 1400,
            }}
        >
            <motion.div
                ref={cardRef}
                onMouseMove={shouldAnimate ? move : undefined}
                onMouseLeave={leave}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: radius,

                    background,

                    rotateX: shouldAnimate ? rotateX : 0,
                    rotateY: shouldAnimate ? rotateY : 0,

                    transformStyle: "preserve-3d",
                    WebkitTransformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",

                    boxShadow: "0 40px 100px rgba(0,0,0,.32)",
                }}
                whileHover={shouldAnimate ? { scale: hoverScale } : undefined}
                transition={{
                    scale: {
                        type: "spring",
                        stiffness: 260,
                        damping: 22,
                    },
                }}
            >
                {/* =================================
                    AURORA BACKGROUND
                ================================= */}

                <motion.div
                    style={{
                        position: "absolute",
                        inset: "-30%",

                        background: `
                            radial-gradient(
                                circle at 20% 25%,
                                ${accentSoft} 0%,
                                transparent 24%
                            ),
                            radial-gradient(
                                circle at 80% 75%,
                                ${accentFaint} 0%,
                                transparent 28%
                            ),
                            radial-gradient(
                                circle at 60% 10%,
                                rgba(255,255,255,.12),
                                transparent 18%
                            )
                        `,

                        x: shouldAnimate ? imgX : 0,
                        y: shouldAnimate ? imgY : 0,

                        filter: "blur(25px)",
                    }}
                    animate={
                        !shouldAnimate
                            ? { rotate: 0, scale: 1 }
                            : {
                                  rotate: [0, 4, -3, 0],
                                  scale: [1, 1.06, 1],
                              }
                    }
                    transition={
                        !shouldAnimate
                            ? { duration: 0 }
                            : {
                                  duration: 14,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                              }
                    }
                />

                {/* =================================
                    IMAGE
                ================================= */}

                {showImage && image && (
                    <motion.img
                        src={image}
                        alt=""
                        style={{
                            position: "absolute",

                            width: "116%",
                            height: "116%",

                            left: "-8%",
                            top: "-8%",

                            objectFit: "cover",

                            x: shouldAnimate ? imgX : 0,
                            y: shouldAnimate ? imgY : 0,

                            scale: 1.04,

                            opacity: 0.72,

                            mixBlendMode: "screen",
                        }}
                    />
                )}

                {/* =================================
                    ABSTRACT FALLBACK VISUAL
                ================================= */}

                {(!showImage || !image) && (
                    <>
                        <motion.div
                            style={{
                                position: "absolute",

                                width: "55%",
                                aspectRatio: "1",

                                right: "-12%",
                                top: "12%",

                                borderRadius: "50%",

                                background: `
                                    radial-gradient(
                                        circle at 35% 30%,
                                        white 0%,
                                        ${orbColor} 12%,
                                        ${colorWithOpacity(orbColor, 0.88)} 42%,
                                        #080808 72%
                                    )
                                `,

                                boxShadow: `
                                    0 0 80px ${orbGlow},
                                    inset -25px -30px 60px rgba(0,0,0,.5)
                                `,

                                x: shouldAnimate ? imgX : 0,
                                y: shouldAnimate ? imgY : 0,

                                z: 45,
                            }}
                            animate={
                                !shouldAnimate ? { rotate: 0 } : { rotate: 360 }
                            }
                            transition={
                                !shouldAnimate
                                    ? { duration: 0 }
                                    : {
                                          duration: 28,
                                          repeat: Infinity,
                                          ease: "linear",
                                      }
                            }
                        />

                        <motion.div
                            style={{
                                position: "absolute",

                                width: "25%",
                                aspectRatio: "1",

                                right: "23%",
                                top: "30%",

                                borderRadius: "50%",

                                border: `1px solid ${accentHalf}`,

                                boxShadow: `0 0 35px ${accentGlow}`,

                                x: shouldAnimate ? imgX : 0,
                                y: shouldAnimate ? imgY : 0,

                                z: 70,
                            }}
                            animate={
                                !shouldAnimate
                                    ? { scale: 1 }
                                    : { scale: [1, 1.15, 1] }
                            }
                            transition={
                                !shouldAnimate
                                    ? { duration: 0 }
                                    : {
                                          duration: 4,
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                      }
                            }
                        />
                    </>
                )}

                {/* =================================
                    DARK VIGNETTE
                ================================= */}

                <div
                    style={{
                        position: "absolute",
                        inset: 0,

                        background: `
                            linear-gradient(
                                180deg,
                                rgba(0,0,0,.05) 0%,
                                rgba(0,0,0,.08) 40%,
                                rgba(0,0,0,.94) 100%
                            )
                        `,
                    }}
                />

                {/* =================================
                    TOP NAV
                ================================= */}

                <motion.div
                    style={{
                        position: "absolute",

                        top: 26,
                        left: 28,
                        right: 28,

                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",

                        color: textColor,

                        x: shouldAnimate ? contentX : 0,
                        y: shouldAnimate ? contentY : 0,

                        z: 90,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                opacity: 0.5,
                                letterSpacing: ".12em",
                            }}
                        >
                            {number}
                        </span>

                        <span
                            style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: accent,
                                boxShadow: `0 0 12px ${accent}`,
                            }}
                        />
                    </div>

                    {showBadge && (
                        <div
                            style={{
                                padding: "7px 11px",

                                borderRadius: 99,

                                border: "1px solid rgba(255,255,255,.14)",

                                background: "rgba(255,255,255,.06)",

                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",

                                fontSize: 9,
                                letterSpacing: ".12em",
                                textTransform: "uppercase",

                                opacity: 0.7,
                            }}
                        >
                            Available
                        </div>
                    )}
                </motion.div>

                {/* =================================
                    MAIN CONTENT
                ================================= */}

                <motion.div
                    style={{
                        position: "absolute",

                        left: 30,
                        right: 30,
                        bottom: 30,

                        color: textColor,

                        x: shouldAnimate ? contentX : 0,
                        y: shouldAnimate ? contentY : 0,

                        z: 85,
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 600,

                            textTransform: "uppercase",

                            letterSpacing: ".18em",

                            opacity: 0.5,

                            marginBottom: 12,
                        }}
                    >
                        {eyebrow}
                    </div>

                    {/* HUGE TITLE */}

                    <div
                        style={{
                            fontSize: "clamp(38px, 6vw, 70px)",

                            fontWeight: 600,

                            lineHeight: 0.84,

                            letterSpacing: "-.065em",

                            maxWidth: "90%",

                            marginBottom: 18,
                        }}
                    >
                        {title}
                    </div>

                    {showDescription && (
                        <div
                            style={{
                                maxWidth: 370,

                                fontSize: 13,

                                lineHeight: 1.5,

                                opacity: 0.58,

                                marginBottom: 24,
                            }}
                        >
                            {description}
                        </div>
                    )}

                    {/* BOTTOM META */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",

                            justifyContent: "space-between",

                            paddingTop: 15,

                            borderTop: "1px solid rgba(255,255,255,.14)",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10,
                                opacity: 0.45,
                                letterSpacing: ".12em",
                                textTransform: "uppercase",
                            }}
                        >
                            Explore service
                        </span>

                        {/* MAGNETIC ARROW */}

                        <motion.div
                            aria-hidden="true"
                            style={{
                                width: 44,
                                height: 44,

                                borderRadius: "50%",

                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",

                                background: textColor,

                                color: background,

                                x: shouldAnimate ? arrowX : 0,
                                y: shouldAnimate ? arrowY : 0,

                                rotate: shouldAnimate ? arrowRotate : 0,

                                fontSize: 18,

                                z: 120,

                                boxShadow: `0 10px 35px ${accentArrowShadow}`,
                            }}
                        >
                            ↗
                        </motion.div>
                    </div>
                </motion.div>

                {/* =================================
                    GLASS BORDER
                ================================= */}

                <div
                    style={{
                        position: "absolute",
                        inset: 0,

                        borderRadius: radius,

                        border: "1px solid rgba(255,255,255,.15)",

                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.12)",

                        pointerEvents: "none",
                    }}
                />

                {/* =================================
                    BORDER GLOW
                ================================= */}

                {showGlow && (
                    <motion.div
                        style={{
                            position: "absolute",

                            inset: -1,

                            borderRadius: radius,

                            border: `1px solid ${accentBorder}`,

                            opacity: 0.5,

                            pointerEvents: "none",
                        }}
                        animate={
                            !shouldAnimate
                                ? { opacity: 0.5 }
                                : {
                                      opacity: [0.25, 0.65, 0.25],
                                  }
                        }
                        transition={
                            !shouldAnimate
                                ? { duration: 0 }
                                : {
                                      duration: 3,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                  }
                        }
                    />
                )}

                {/* =================================
                    FILM GRAIN
                ================================= */}

                <div
                    style={{
                        position: "absolute",
                        inset: 0,

                        opacity: 0.035,

                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E\")",

                        pointerEvents: "none",
                    }}
                />
            </motion.div>
        </div>
    )
}

/* ============================================
   DEFAULT DEMO
============================================ */

Object.assign(PixionwebServiceCard, {
    displayName: "Pixionweb Service Card",
    defaultProps: {
        number: "01",

        eyebrow: "Digital Experience",

        title: "Web Design",

        description:
            "Immersive digital experiences designed to make brands impossible to ignore.",

        image: "",

        accent: "#8B5CF6",

        orbColor: "#8B5CF6",

        background: "#0A0A0B",

        textColor: "#FFFFFF",

        radius: 30,

        tilt: 8,

        imageDepth: 20,

        contentDepth: 7,

        hoverScale: 1.025,

        showImage: true,

        showDescription: true,

        showGlow: true,

        showBadge: true,
    },
})

/* ============================================
   FRAMER CONTROLS
============================================ */

addPropertyControls(PixionwebServiceCard, {
    number: {
        type: ControlType.String,
        title: "Number",
        defaultValue: "01",
    },

    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "Digital Experience",
    },

    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Web Design",
    },

    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue:
            "Immersive digital experiences designed to make brands impossible to ignore.",
    },

    image: {
        type: ControlType.Image,
        title: "Image",
        defaultValue: "",
    },

    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#8B5CF6",
    },

    orbColor: {
        type: ControlType.Color,
        title: "Orb Color",
        defaultValue: "#8B5CF6",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0B",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 30,
    },

    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 18,
        step: 1,
        defaultValue: 8,
    },

    imageDepth: {
        type: ControlType.Number,
        title: "Image Depth",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 20,
    },

    contentDepth: {
        type: ControlType.Number,
        title: "Content Depth",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 7,
    },

    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 1,
        max: 1.08,
        step: 0.005,
        defaultValue: 1.025,
    },

    showImage: {
        type: ControlType.Boolean,
        title: "Image",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },

    showDescription: {
        type: ControlType.Boolean,
        title: "Description",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },

    showGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },

    showBadge: {
        type: ControlType.Boolean,
        title: "Badge",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
})
