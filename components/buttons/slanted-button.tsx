import { useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

/**
 * SLANTED REVEAL BUTTON
 * ----------------------------------------------------------------
 * A button with a dramatic diagonal ("slanted") reveal on hover.
 * The hover layer carries BOTH the background color AND a duplicate
 * label together as one solid sheet — it slides + skews in from the
 * chosen edge and physically covers the base layer, so background
 * and text swap in sync along a hard diagonal seam (not a color
 * cross-fade). A counter-skew on the inner label keeps the hover
 * text upright while the outer sheet stays slanted.
 *
 * A top-level "Enable Hover" toggle lets you turn the whole
 * interaction off and fall back to a single static layer — useful
 * for touch/mobile where hover doesn't apply. The component also
 * detects Framer's static rendering context (canvas thumbnails,
 * exports) via useIsStaticRenderer and disables all animation there
 * too, rendering the same plain static fallback.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SlantedRevealButton(props) {
    const {
        text,
        link,
        openInNewTab,
        font,
        padding,
        radius,
        colors,
        border,
        hover,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [isHovered, setIsHovered] = useState(false)

    // Animation only runs when the user has hover enabled AND we are
    // not in a static rendering context (canvas thumbnail / export).
    const hoverActive = hover.enabled && !isStatic

    const easingMap = {
        linear: [0, 0, 1, 1],
        easeIn: [0.42, 0, 1, 1],
        easeOut: [0, 0, 0.58, 1],
        easeInOut: [0.42, 0, 0.58, 1],
        backOut: [0.34, 1.56, 0.64, 1],
    }

    const isVertical = hover.direction === "top" || hover.direction === "bottom"

    const outerHiddenTransform = {
        top: `translateY(-100%) skewY(${hover.skew}deg)`,
        bottom: `translateY(100%) skewY(${hover.skew}deg)`,
        left: `translateX(-100%) skewX(${hover.skew}deg)`,
        right: `translateX(100%) skewX(${hover.skew}deg)`,
    }[hover.direction]

    const outerVisibleTransform = isVertical
        ? `translateY(0%) skewY(${hover.skew}deg)`
        : `translateX(0%) skewX(${hover.skew}deg)`

    // Cancels the outer sheet's skew so the duplicated hover label
    // renders upright instead of sheared.
    const innerCounterTransform = isVertical
        ? `skewY(${-hover.skew}deg)`
        : `skewX(${-hover.skew}deg)`

    const Wrapper = link ? "a" : "div"
    const wrapperLinkProps = link
        ? {
              href: link,
              target: openInNewTab ? "_blank" : undefined,
              rel: openInNewTab ? "noopener noreferrer" : undefined,
          }
        : {}

    const rootStyle = {
        ...style,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        cursor: hoverActive ? "pointer" : "default",
        userSelect: "none",
        textDecoration: "none",
        boxSizing: "border-box",
        padding: padding,
        borderRadius: radius,
        backgroundColor: colors.baseBackground,
        border: border.enabled
            ? `${border.width}px solid ${border.color}`
            : "none",
        width: "fit-content",
        height: "fit-content",
    }

    const textStyle = {
        position: "relative",
        fontFamily: font.fontFamily,
        fontWeight: font.fontWeight,
        fontSize: font.fontSize,
        lineHeight: font.lineHeight,
        letterSpacing: font.letterSpacing,
        fontStyle: font.fontStyle,
        whiteSpace: "nowrap",
    }

    // ---- Static fallback: no motion, no listeners, single flat layer ----
    if (!hoverActive) {
        return (
            <Wrapper
                {...wrapperLinkProps}
                role={link ? undefined : "button"}
                tabIndex={0}
                style={rootStyle}
            >
                <span
                    style={{ ...textStyle, zIndex: 1, color: colors.baseText }}
                >
                    {text}
                </span>
            </Wrapper>
        )
    }

    // ---- Interactive version ----
    return (
        <Wrapper
            {...wrapperLinkProps}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role={link ? undefined : "button"}
            tabIndex={0}
            style={rootStyle}
        >
            {/* Base layer — background + label, always underneath */}
            <span style={{ ...textStyle, zIndex: 1, color: colors.baseText }}>
                {text}
            </span>

            {/* Sweeping hover sheet — background + duplicate label move as one */}
            <motion.div
                initial={false}
                animate={{
                    transform: isHovered
                        ? outerVisibleTransform
                        : outerHiddenTransform,
                }}
                transition={{
                    duration: hover.duration,
                    ease: easingMap[hover.easing],
                }}
                style={{
                    position: "absolute",
                    width: "160%",
                    height: "160%",
                    top: "-30%",
                    left: "-30%",
                    backgroundColor: colors.hoverBackground,
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: innerCounterTransform,
                    }}
                >
                    <span style={{ ...textStyle, color: colors.hoverText }}>
                        {text}
                    </span>
                </div>
            </motion.div>
        </Wrapper>
    )
}

SlantedRevealButton.defaultProps = {
    text: "Slanted Button",
}

addPropertyControls(SlantedRevealButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Slanted Button",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 0,
            lineHeight: "1.2em",
        },
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "16px 24px 16px 24px",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "4px",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            baseBackground: {
                type: ControlType.Color,
                title: "Base BG",
                defaultValue: "#16A34A", // green-600
            },
            baseText: {
                type: ControlType.Color,
                title: "Base Text",
                defaultValue: "#F0FDF4", // green-50
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover BG",
                defaultValue: "#052E16", // near-black green
            },
            hoverText: {
                type: ControlType.Color,
                title: "Hover Text",
                defaultValue: "#86EFAC", // green-300
            },
        },
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: false,
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 1,
                min: 0,
                max: 20,
                step: 1,
                hidden: (props) => !props.enabled,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#0F5132",
                hidden: (props) => !props.enabled,
            },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover Reveal",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable Hover",
                defaultValue: true,
                description:
                    "Turn off for touch/mobile — renders a static single layer instead.",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["top", "bottom", "left", "right"],
                optionTitles: ["Top", "Bottom", "Left", "Right"],
                defaultValue: "top",
                displaySegmentedControl: true,
                hidden: (props) => !props.enabled,
            },
            skew: {
                type: ControlType.Number,
                title: "Skew",
                defaultValue: 8,
                min: -60,
                max: 60,
                step: 1,
                unit: "°",
                hidden: (props) => !props.enabled,
            },
            duration: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.45,
                min: 0.05,
                max: 2,
                step: 0.05,
                unit: "s",
                hidden: (props) => !props.enabled,
            },
            easing: {
                type: ControlType.Enum,
                title: "Easing",
                options: [
                    "linear",
                    "easeIn",
                    "easeOut",
                    "easeInOut",
                    "backOut",
                ],
                optionTitles: [
                    "Linear",
                    "Ease In",
                    "Ease Out",
                    "Ease In Out",
                    "Back Out",
                ],
                defaultValue: "easeOut",
                hidden: (props) => !props.enabled,
            },
        },
    },
})
