import * as React from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Tween (not spring) avoids any overshoot-driven repaint flicker on text.
const Z_TRANSITION = { duration: 0.35, ease: "easeOut" }
const FILL_TRANSITION = { duration: 0.25, ease: "easeOut" }

// A "rest" z of exactly 0 causes some browsers to demote/repromote the GPU
// compositing layer right as the animation starts, producing a visible
// flash on text. Using a hair above zero keeps the layer stable throughout.
const Z_REST = 0.01

const ANTI_FLICKER_STYLE = {
    backfaceVisibility: "hidden",
    WebkitFontSmoothing: "antialiased",
}

// Plain, non-animated CTA used whenever useIsStaticRenderer() is true (the
// Framer canvas while editing, or a static export/thumbnail). No motion
// engine, no listeners, no continuous effects — just the button at rest.
function StaticCta({ href, label, radius, restBg, restText, restBorder }) {
    return (
        <a
            href={href}
            style={{
                padding: "8px 18px",
                borderRadius: radius > 20 ? 20 : radius,
                border: `1px solid ${restBorder}`,
                background: restBg,
                color: restText,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-block",
            }}
        >
            {label}
        </a>
    )
}

// Isolated CTA: every animated value (z + fill colors) is computed from its
// OWN local hover state plus the `cardHovered` flag passed in as a plain
// boolean prop. Nothing here uses Framer's variant-name propagation, so a
// hover on the card can never be mistaken for a hover on the button.
// `blurFilter` is a raw MotionValue (a ready-made "blur(Npx)" string) driven
// by the card's current tilt angle — passed straight into style.filter.
function CtaButton({
    href,
    label,
    radius,
    cardHovered,
    baseZ,
    cardLift,
    buttonLift,
    restBg,
    restText,
    restBorder,
    blurFilter,
    isStatic,
}) {
    const [hovered, setHovered] = React.useState(false)

    if (isStatic) {
        return (
            <StaticCta
                href={href}
                label={label}
                radius={radius}
                restBg={restBg}
                restText={restText}
                restBorder={restBorder}
            />
        )
    }

    const z = baseZ + (cardHovered ? cardLift : 0) + (hovered ? buttonLift : 0)

    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noreferrer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            animate={{
                z,
                backgroundColor: hovered ? "#ffffff" : restBg,
                color: hovered ? "#000000" : restText,
                borderColor: hovered ? "#ffffff" : restBorder,
                boxShadow: hovered
                    ? "0 0 16px 2px rgba(255,255,255,0.45)"
                    : "0 0 0px 0px rgba(255,255,255,0)",
            }}
            transition={{
                z: Z_TRANSITION,
                backgroundColor: FILL_TRANSITION,
                color: FILL_TRANSITION,
                borderColor: FILL_TRANSITION,
                boxShadow: FILL_TRANSITION,
            }}
            style={{
                ...ANTI_FLICKER_STYLE,
                filter: blurFilter,
                // Static fallback so Framer's Canvas edit mode (which doesn't
                // always run the animation engine continuously) still paints
                // the right rest colors instead of the browser's default
                // anchor blue/underline before any JS runs.
                backgroundColor: restBg,
                color: restText,
                borderColor: restBorder,
                padding: "8px 18px",
                borderRadius: radius > 20 ? 20 : radius,
                border: "1px solid transparent",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-block",
            }}
        >
            {label}
        </motion.a>
    )
}

/**
 * 3D Hover Card
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ThreeDCard(props) {
    const {
        content,
        image,
        colors,
        ctas,
        background,
        layout,
        motionSettings,
        tiltShift,
    } = props

    const { title, description } = content
    const { titleColor, descriptionColor } = colors
    const {
        count: ctaCount,
        primaryText,
        primaryUrl,
        primaryBg,
        primaryTextColor,
        secondaryText,
        secondaryUrl,
        secondaryTextColor,
        secondaryBorderColor,
    } = ctas
    const {
        style: backgroundStyle,
        color: backgroundColor,
        opacity: backgroundOpacity,
        blurAmount,
        borderColor,
    } = background
    const { radius, padding } = layout
    const {
        tiltStrength,
        hoverDelay,
        trackingSmoothing,
        restoreDuration,
        perspectiveDistance,
        translateAmount,
    } = motionSettings

    // Derived depth values — one slider drives everything.
    const imageHoverZ = translateAmount * 1.6
    const titleHoverZ = translateAmount * 0.8
    const descriptionHoverZ = translateAmount * 1.0
    const ctaBaseZ = translateAmount * 0.5
    const ctaCardLift = translateAmount * 0.3
    const ctaButtonLift = translateAmount * 0.3
    // As an element advances in Z, perspective makes it appear to grow
    // toward the vanishing point. The CTAs sit flush against the
    // bottom-right corner (flex-end), so that apparent growth reads as
    // "touching the edge" even though the box itself still respects
    // `padding`. This buffer scales with how far the CTAs travel forward.
    const ctaEdgeBuffer = Math.round(
        (ctaBaseZ + ctaCardLift + ctaButtonLift) * 0.35
    )

    const rotateX = useMotionValue(0)
    const rotateY = useMotionValue(0)
    // Normalized cursor position within the card, -0.5..0.5 on each axis.
    // Reused for the focus-follows-cursor tilt-shift blur below.
    const pointerX = useMotionValue(0)
    const pointerY = useMotionValue(0)
    const [cardHovered, setCardHovered] = React.useState(false)

    // True inside the Framer canvas (editing) and during static export /
    // thumbnail generation. Framer's automated review flags components that
    // keep running motion/listeners in those contexts — it wastes cycles in
    // the editor and can export mid-animation. Everything past this point
    // that drives continuous motion gets skipped when this is true; hooks
    // themselves still get called unconditionally (Rules of Hooks), only the
    // JSX branches and the event wiring change.
    const isStatic = useIsStaticRenderer()

    // Tilt-shift, focus-follows-cursor: each content layer has an
    // approximate anchor point on the card (image top-center, title/desc
    // center, CTAs bottom-right). Blur for that layer grows with its
    // distance from the current cursor position, so whatever area you're
    // actually hovering stays sharp and everything else falls out of focus
    // — like a real shallow depth of field tracking your point of interest.
    function makeFocusBlur(anchorX, anchorY, amount) {
        return useTransform([pointerX, pointerY], ([px, py]) => {
            if (!tiltShift.enabled || !cardHovered) return "blur(0px)"
            const dx = px - anchorX
            const dy = py - anchorY
            const distance = Math.sqrt(dx * dx + dy * dy)
            const raw =
                Math.max(0, distance - tiltShift.focusRadius) *
                tiltShift.blurGain
            const blur = Math.min(tiltShift.maxBlur, raw) * amount
            return `blur(${blur.toFixed(2)}px)`
        })
    }

    const imageBlurFilter = makeFocusBlur(0, -0.35, tiltShift.imageAmount)
    const titleBlurFilter = makeFocusBlur(0, -0.05, tiltShift.titleAmount)
    const descriptionBlurFilter = makeFocusBlur(
        0,
        0.15,
        tiltShift.descriptionAmount
    )
    const ctaBlurFilter = makeFocusBlur(0.35, 0.4, tiltShift.ctaAmount)

    const trackingActiveRef = React.useRef(false)
    const delayTimeoutRef = React.useRef(null)

    function handleMouseEnter() {
        setCardHovered(true)
        clearTimeout(delayTimeoutRef.current)
        delayTimeoutRef.current = setTimeout(() => {
            trackingActiveRef.current = true
        }, hoverDelay)
    }

    function handleMouseMove(event) {
        // Measured against the OUTER, non-rotated wrapper — not the tilted
        // motion.div itself. A transformed element's own bounding rect
        // distorts as it rotates (most visibly near corners/edges), which
        // was feeding back into the rotation calculation and causing a
        // trembling loop. The outer wrapper never transforms, so its rect
        // is stable regardless of tilt angle.
        const rect = event.currentTarget.getBoundingClientRect()
        const px = (event.clientX - rect.left) / rect.width - 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5

        // Focus tracking updates immediately (no tilt delay) so the blur
        // feels responsive even before the tilt itself engages.
        animate(pointerX, px, {
            duration: trackingSmoothing / 1000,
            ease: "easeOut",
        })
        animate(pointerY, py, {
            duration: trackingSmoothing / 1000,
            ease: "easeOut",
        })

        if (!trackingActiveRef.current) return
        // animate() replaces the running tween on the same motion value, so
        // rapid mousemove events chain into one smooth curve instead of
        // snapping straight to the new angle (fixes corner-entry jump).
        animate(rotateY, px * 2 * tiltStrength, {
            duration: trackingSmoothing / 1000,
            ease: "easeOut",
        })
        animate(rotateX, -py * 2 * tiltStrength, {
            duration: trackingSmoothing / 1000,
            ease: "easeOut",
        })
    }

    function handleMouseLeave() {
        setCardHovered(false)
        clearTimeout(delayTimeoutRef.current)
        trackingActiveRef.current = false
        animate(rotateX, 0, {
            duration: restoreDuration / 1000,
            ease: "easeOut",
        })
        animate(rotateY, 0, {
            duration: restoreDuration / 1000,
            ease: "easeOut",
        })
        animate(pointerX, 0, {
            duration: restoreDuration / 1000,
            ease: "easeOut",
        })
        animate(pointerY, 0, {
            duration: restoreDuration / 1000,
            ease: "easeOut",
        })
    }

    React.useEffect(() => () => clearTimeout(delayTimeoutRef.current), [])

    function withOpacity(color, opacity) {
        if (!color) return color
        const rgbaMatch = color.match(/rgba?\(([^)]+)\)/)
        if (rgbaMatch) {
            const [r, g, b] = rgbaMatch[1].split(",").map((s) => s.trim())
            return `rgba(${r}, ${g}, ${b}, ${opacity})`
        }
        let hex = color.replace("#", "")
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    const finalBackground = withOpacity(
        backgroundColor,
        backgroundOpacity / 100
    )
    const backdropFilter =
        backgroundStyle === "Blur" ? `blur(${blurAmount}px)` : "none"

    // ---------- Static fallback (canvas edit mode / export) ----------
    // Plain nested <div>s, no motion.*, no listeners, no filters, no
    // perspective/rotation, no requestAnimationFrame-driven values. Content
    // sits at its rest position exactly as it would before any hover.
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    borderRadius: radius,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: radius,
                        border: `1px solid ${borderColor}`,
                        background: finalBackground,
                        backdropFilter,
                        WebkitBackdropFilter: backdropFilter,
                    }}
                />
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        padding,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {image?.source && (
                        <div style={{ width: "100%" }}>
                            <img
                                src={image.source?.src || image.source}
                                alt=""
                                style={{
                                    height: image.height,
                                    width: "100%",
                                    objectFit: image.fit,
                                    borderRadius: image.radius,
                                    display: "block",
                                }}
                            />
                        </div>
                    )}
                    <div
                        style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: titleColor,
                            lineHeight: 1.3,
                            marginTop: image?.source ? 16 : 0,
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: descriptionColor,
                            marginTop: 8,
                            lineHeight: 1.5,
                        }}
                    >
                        {description}
                    </div>
                    {ctaCount !== "None" && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 10,
                                marginTop: "auto",
                                paddingTop: 24,
                            }}
                        >
                            {ctaCount === "Two" && (
                                <StaticCta
                                    href={secondaryUrl}
                                    label={secondaryText}
                                    radius={radius}
                                    restBg="rgba(255,255,255,0)"
                                    restText={secondaryTextColor}
                                    restBorder={secondaryBorderColor}
                                />
                            )}
                            <StaticCta
                                href={primaryUrl}
                                label={primaryText}
                                radius={radius}
                                restBg={primaryBg}
                                restText={primaryTextColor}
                                restBorder={primaryBg}
                            />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: perspectiveDistance,
                width: "100%",
                height: "100%",
            }}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    borderRadius: radius,
                    transformStyle: "preserve-3d",
                    rotateX,
                    rotateY,
                    cursor: "pointer",
                }}
            >
                {/* Background layer: carries the blur/opacity. A filter forces
                    transform-style:flat on the element it's applied to, so it
                    must NOT be the same element as the 3D content below —
                    that was silently killing every translateZ. */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: radius,
                        border: `1px solid ${borderColor}`,
                        background: finalBackground,
                        backdropFilter,
                        WebkitBackdropFilter: backdropFilter,
                        zIndex: 0,
                    }}
                />

                {/* Content layer: keeps its own preserve-3d so translateZ on
                    title/description/image/CTAs renders correctly. */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        width: "100%",
                        height: "100%",
                        padding,
                        boxSizing: "border-box",
                        transformStyle: "preserve-3d",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {image?.source && (
                        <motion.div
                            animate={{ z: cardHovered ? imageHoverZ : Z_REST }}
                            transition={Z_TRANSITION}
                            style={{
                                ...ANTI_FLICKER_STYLE,
                                width: "100%",
                                transformStyle: "preserve-3d",
                                filter: imageBlurFilter,
                            }}
                        >
                            <img
                                src={image.source?.src || image.source}
                                alt=""
                                style={{
                                    height: image.height,
                                    width: "100%",
                                    objectFit: image.fit,
                                    borderRadius: image.radius,
                                    display: "block",
                                }}
                            />
                        </motion.div>
                    )}

                    <motion.div
                        animate={{ z: cardHovered ? titleHoverZ : Z_REST }}
                        transition={Z_TRANSITION}
                        style={{
                            ...ANTI_FLICKER_STYLE,
                            filter: titleBlurFilter,
                            fontSize: 20,
                            fontWeight: 700,
                            color: titleColor,
                            lineHeight: 1.3,
                            marginTop: image?.source ? 16 : 0,
                        }}
                    >
                        {title}
                    </motion.div>

                    <motion.div
                        animate={{
                            z: cardHovered ? descriptionHoverZ : Z_REST,
                        }}
                        transition={Z_TRANSITION}
                        style={{
                            ...ANTI_FLICKER_STYLE,
                            filter: descriptionBlurFilter,
                            fontSize: 14,
                            color: descriptionColor,
                            marginTop: 8,
                            lineHeight: 1.5,
                        }}
                    >
                        {description}
                    </motion.div>

                    {ctaCount !== "None" && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                gap: 10,
                                marginTop: "auto",
                                paddingTop: 24,
                                paddingRight: ctaEdgeBuffer,
                                paddingBottom: ctaEdgeBuffer,
                                // Required so the CTAs' own translateZ isn't
                                // flattened onto this row's plane.
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {ctaCount === "Two" && (
                                <CtaButton
                                    href={secondaryUrl}
                                    label={secondaryText}
                                    radius={radius}
                                    cardHovered={cardHovered}
                                    baseZ={ctaBaseZ}
                                    cardLift={ctaCardLift}
                                    buttonLift={ctaButtonLift}
                                    restBg="rgba(255,255,255,0)"
                                    restText={secondaryTextColor}
                                    restBorder={secondaryBorderColor}
                                    blurFilter={ctaBlurFilter}
                                />
                            )}

                            <CtaButton
                                href={primaryUrl}
                                label={primaryText}
                                radius={radius}
                                cardHovered={cardHovered}
                                baseZ={ctaBaseZ}
                                cardLift={ctaCardLift}
                                buttonLift={ctaButtonLift}
                                restBg={primaryBg}
                                restText={primaryTextColor}
                                restBorder={primaryBg}
                                blurFilter={ctaBlurFilter}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

ThreeDCard.defaultProps = {
    content: {
        title: "Make things float in air",
        description:
            "Hover over this card to unleash the power of CSS perspective",
    },
    image: { source: undefined, height: 220, fit: "cover", radius: 12 },
    colors: {
        titleColor: "#ffffff",
        descriptionColor: "rgba(255,255,255,0.85)",
    },
    ctas: {
        count: "Two",
        primaryText: "Sign up",
        primaryUrl: "https://twitter.com",
        primaryBg: "rgba(255,255,255,0.15)",
        primaryTextColor: "#ffffff",
        secondaryText: "Try now",
        secondaryUrl: "https://twitter.com",
        secondaryTextColor: "#ffffff",
        secondaryBorderColor: "rgba(255,255,255,0.4)",
    },
    background: {
        style: "Blur",
        color: "rgba(255, 255, 255, 1)",
        opacity: 12,
        blurAmount: 24,
        borderColor: "rgba(255,255,255,0.25)",
    },
    layout: { radius: 16, padding: 24 },
    motionSettings: {
        tiltStrength: 17.5,
        hoverDelay: 0,
        trackingSmoothing: 150,
        restoreDuration: 400,
        perspectiveDistance: 600,
        translateAmount: 50,
    },
    tiltShift: {
        enabled: true,
        maxBlur: 6,
        focusRadius: 0.18,
        blurGain: 14,
        imageAmount: 1,
        titleAmount: 0.6,
        descriptionAmount: 0.6,
        ctaAmount: 0.8,
    },
}

addPropertyControls(ThreeDCard, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            title: {
                type: ControlType.String,
                defaultValue: ThreeDCard.defaultProps.content.title,
            },
            description: {
                type: ControlType.String,
                defaultValue: ThreeDCard.defaultProps.content.description,
                displayTextArea: true,
            },
        },
    },
    image: {
        type: ControlType.Object,
        title: "Image",
        controls: {
            source: { type: ControlType.Image, title: "Source" },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: ThreeDCard.defaultProps.image.height,
                min: 80,
                max: 500,
                step: 10,
            },
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["cover", "contain", "fill"],
                defaultValue: ThreeDCard.defaultProps.image.fit,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: ThreeDCard.defaultProps.image.radius,
                min: 0,
                max: 40,
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            titleColor: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: ThreeDCard.defaultProps.colors.titleColor,
            },
            descriptionColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: ThreeDCard.defaultProps.colors.descriptionColor,
            },
        },
    },
    ctas: {
        type: ControlType.Object,
        title: "CTAs",
        controls: {
            count: {
                type: ControlType.Enum,
                title: "Count",
                options: ["None", "One", "Two"],
                optionTitles: ["No CTA", "1 CTA", "2 CTA"],
                defaultValue: ThreeDCard.defaultProps.ctas.count,
            },
            primaryText: {
                type: ControlType.String,
                title: "Primary label",
                defaultValue: ThreeDCard.defaultProps.ctas.primaryText,
                hidden: (p) => p.count === "None",
            },
            primaryUrl: {
                type: ControlType.Link,
                title: "Primary URL",
                defaultValue: ThreeDCard.defaultProps.ctas.primaryUrl,
                hidden: (p) => p.count === "None",
            },
            primaryBg: {
                type: ControlType.Color,
                title: "Primary bg",
                defaultValue: ThreeDCard.defaultProps.ctas.primaryBg,
                hidden: (p) => p.count === "None",
            },
            primaryTextColor: {
                type: ControlType.Color,
                title: "Primary text",
                defaultValue: ThreeDCard.defaultProps.ctas.primaryTextColor,
                hidden: (p) => p.count === "None",
            },
            secondaryText: {
                type: ControlType.String,
                title: "Secondary label",
                defaultValue: ThreeDCard.defaultProps.ctas.secondaryText,
                hidden: (p) => p.count !== "Two",
            },
            secondaryUrl: {
                type: ControlType.Link,
                title: "Secondary URL",
                defaultValue: ThreeDCard.defaultProps.ctas.secondaryUrl,
                hidden: (p) => p.count !== "Two",
            },
            secondaryTextColor: {
                type: ControlType.Color,
                title: "Secondary text",
                defaultValue: ThreeDCard.defaultProps.ctas.secondaryTextColor,
                hidden: (p) => p.count !== "Two",
            },
            secondaryBorderColor: {
                type: ControlType.Color,
                title: "Secondary border",
                defaultValue: ThreeDCard.defaultProps.ctas.secondaryBorderColor,
                hidden: (p) => p.count !== "Two",
            },
        },
    },
    background: {
        type: ControlType.Object,
        title: "Background",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["Solid", "Blur"],
                defaultValue: ThreeDCard.defaultProps.background.style,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: ThreeDCard.defaultProps.background.color,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: ThreeDCard.defaultProps.background.opacity,
                min: 0,
                max: 100,
                step: 1,
            },
            blurAmount: {
                type: ControlType.Number,
                title: "Blur px",
                defaultValue: ThreeDCard.defaultProps.background.blurAmount,
                min: 0,
                max: 40,
                step: 1,
                hidden: (p) => p.style !== "Blur",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: ThreeDCard.defaultProps.background.borderColor,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: ThreeDCard.defaultProps.layout.radius,
                min: 0,
                max: 40,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: ThreeDCard.defaultProps.layout.padding,
                min: 0,
                max: 80,
            },
        },
    },
    motionSettings: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            tiltStrength: {
                type: ControlType.Number,
                title: "Tilt (deg)",
                defaultValue:
                    ThreeDCard.defaultProps.motionSettings.tiltStrength,
                min: 0,
                max: 35,
                step: 0.5,
            },
            perspectiveDistance: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue:
                    ThreeDCard.defaultProps.motionSettings.perspectiveDistance,
                min: 300,
                max: 2000,
                step: 50,
            },
            translateAmount: {
                type: ControlType.Number,
                title: "Translate amount",
                defaultValue:
                    ThreeDCard.defaultProps.motionSettings.translateAmount,
                min: 0,
                max: 150,
                step: 5,
            },
            hoverDelay: {
                type: ControlType.Number,
                title: "Hover delay (ms)",
                defaultValue: ThreeDCard.defaultProps.motionSettings.hoverDelay,
                min: 0,
                max: 1000,
                step: 10,
            },
            trackingSmoothing: {
                type: ControlType.Number,
                title: "Tracking ease (ms)",
                defaultValue:
                    ThreeDCard.defaultProps.motionSettings.trackingSmoothing,
                min: 0,
                max: 500,
                step: 10,
            },
            restoreDuration: {
                type: ControlType.Number,
                title: "Restore (ms)",
                defaultValue:
                    ThreeDCard.defaultProps.motionSettings.restoreDuration,
                min: 0,
                max: 2000,
                step: 50,
            },
        },
    },
    tiltShift: {
        type: ControlType.Object,
        title: "Tilt-shift",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: ThreeDCard.defaultProps.tiltShift.enabled,
            },
            maxBlur: {
                type: ControlType.Number,
                title: "Max blur (px)",
                defaultValue: ThreeDCard.defaultProps.tiltShift.maxBlur,
                min: 0,
                max: 20,
                step: 0.5,
                hidden: (p) => !p.enabled,
            },
            focusRadius: {
                type: ControlType.Number,
                title: "Focus radius",
                defaultValue: ThreeDCard.defaultProps.tiltShift.focusRadius,
                min: 0,
                max: 0.6,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
            blurGain: {
                type: ControlType.Number,
                title: "Blur gain",
                defaultValue: ThreeDCard.defaultProps.tiltShift.blurGain,
                min: 0,
                max: 40,
                step: 1,
                hidden: (p) => !p.enabled,
            },
            imageAmount: {
                type: ControlType.Number,
                title: "Image amount",
                defaultValue: ThreeDCard.defaultProps.tiltShift.imageAmount,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p) => !p.enabled,
            },
            titleAmount: {
                type: ControlType.Number,
                title: "Title amount",
                defaultValue: ThreeDCard.defaultProps.tiltShift.titleAmount,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p) => !p.enabled,
            },
            descriptionAmount: {
                type: ControlType.Number,
                title: "Text amount",
                defaultValue:
                    ThreeDCard.defaultProps.tiltShift.descriptionAmount,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p) => !p.enabled,
            },
            ctaAmount: {
                type: ControlType.Number,
                title: "CTA amount",
                defaultValue: ThreeDCard.defaultProps.tiltShift.ctaAmount,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p) => !p.enabled,
            },
        },
    },
})
