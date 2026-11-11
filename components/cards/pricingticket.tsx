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
 * PRICING TICKET
 * Torn-receipt pricing card. Drop three instances and set Variant to
 * Left / Middle / Right. Left tilts left, Right tilts right, Middle sits
 * upright in front. Middle auto-shows the RECOMMENDED tag, Right auto-shows
 * the LIMITED SLOTS badge. All variants keep the same width. Hover lifts
 * the ticket, straightens the tilt slightly and deepens the shadow.
 *
 * On the Framer canvas and during export the component renders as a plain
 * static ticket: no motion values, no hover effects, no transitions.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 540
 */
export default function PricingTicket(props) {
    const {
        variant,
        cardWidth,
        tilt,
        sideOffset,
        labelMode,
        name,
        price,
        period,
        features,
        buttonLabel,
        buttonLink,
        paper,
        ink,
        muted,
        accent,
        buttonBg,
        buttonText,
        nameFont,
        priceFont,
        bodyFont,
        onTap,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const isLeft = variant === "left"
    const isRight = variant === "right"
    const isMiddle = variant === "middle"

    const rotate = isLeft ? -Math.abs(tilt) : isRight ? Math.abs(tilt) : 0
    const drop = isMiddle ? 0 : Math.abs(sideOffset)
    const z = isMiddle ? 2 : 1

    let label = labelMode
    if (labelMode === "auto") {
        label = isMiddle ? "recommended" : isRight ? "limited" : "none"
    }

    // Scalloped torn-receipt edge (top + bottom)
    const scallop =
        "radial-gradient(circle 7px at 12px 0px, transparent 7px, #000 7.5px) repeat-x 0 0 / 24px 51%," +
        "radial-gradient(circle 7px at 12px 100%, transparent 7px, #000 7.5px) repeat-x 0 100% / 24px 51%"

    const handleClick = () => {
        if (isStatic) return
        onTap?.()
        if (buttonLink && typeof window !== "undefined") {
            window.open(buttonLink, "_blank", "noopener")
        }
    }

    const hairline = (w, mt, mb) => (
        <div
            style={{
                width: w,
                height: 1,
                background: muted,
                margin: `${mt}px auto ${mb}px`,
            }}
        />
    )

    // Static rendering: plain elements, transform baked in, no animation.
    const Root: any = isStatic ? "div" : motion.div
    const Button: any = isStatic ? "div" : motion.div

    const rootMotion = isStatic
        ? {}
        : {
              initial: {
                  rotate,
                  y: drop,
                  filter: "drop-shadow(0px 14px 24px rgba(0,0,0,0.10))",
              },
              whileHover: {
                  rotate: rotate * 0.4,
                  y: drop - 10,
                  scale: 1.02,
                  filter: "drop-shadow(0px 26px 40px rgba(0,0,0,0.18))",
              },
              transition: { type: "spring", stiffness: 280, damping: 22 },
          }

    const rootStatic = isStatic
        ? {
              transform: `translateY(${drop}px) rotate(${rotate}deg)`,
              filter: "drop-shadow(0px 14px 24px rgba(0,0,0,0.10))",
          }
        : {}

    const buttonMotion = isStatic
        ? {}
        : {
              whileHover: { scale: 1.05 },
              whileTap: { scale: 0.96 },
              transition: { type: "spring", stiffness: 400, damping: 20 },
          }

    return (
        <Root
            {...rootMotion}
            style={{
                width: cardWidth,
                transformOrigin: "center top",
                zIndex: z,
                ...rootStatic,
                ...style,
            }}
        >
            <div
                style={{
                    boxSizing: "border-box",
                    width: "100%",
                    background: paper,
                    padding: "34px 26px 30px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    WebkitMask: scallop,
                    mask: scallop,
                }}
            >
                {/* Top label */}
                <div style={{ height: 26, marginBottom: 8 }}>
                    {label === "recommended" && (
                        <div
                            style={{
                                fontSize: 11,
                                letterSpacing: 1.5,
                                fontWeight: 600,
                                color: ink,
                                textTransform: "uppercase",
                            }}
                        >
                            Recommended
                            <div
                                style={{
                                    width: "100%",
                                    height: 2,
                                    background: accent,
                                    marginTop: 3,
                                    borderRadius: 2,
                                }}
                            />
                        </div>
                    )}
                    {label === "limited" && (
                        <div
                            style={{
                                fontSize: 10,
                                letterSpacing: 1.4,
                                fontWeight: 600,
                                color: ink,
                                textTransform: "uppercase",
                                border: `1px solid ${ink}`,
                                borderRadius: 999,
                                padding: "5px 12px",
                            }}
                        >
                            Limited Slots
                        </div>
                    )}
                </div>

                {/* Name */}
                <div style={{ ...nameFont, color: ink, textAlign: "center" }}>
                    {name}
                </div>

                {hairline(40, 14, 24)}

                {/* Price */}
                <div style={{ ...priceFont, color: ink }}>{price}</div>
                <div
                    style={{
                        fontSize: 13,
                        color: muted,
                        marginTop: 10,
                        letterSpacing: 0.5,
                    }}
                >
                    / {period}
                </div>

                {hairline("100%", 26, 22)}

                {/* Features */}
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                    }}
                >
                    {(features || []).map((f, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start",
                            }}
                        >
                            <div
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 999,
                                    background: ink,
                                    marginTop: 7,
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ ...bodyFont, color: ink }}>{f}</div>
                        </div>
                    ))}
                </div>

                {/* Button */}
                <Button
                    role="button"
                    tabIndex={0}
                    onClick={handleClick}
                    {...buttonMotion}
                    style={{
                        marginTop: 30,
                        background: buttonBg,
                        color: buttonText,
                        borderRadius: 999,
                        padding: "13px 40px",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        userSelect: "none",
                    }}
                >
                    {buttonLabel}
                </Button>
            </div>
        </Root>
    )
}

PricingTicket.defaultProps = {
    variant: "middle",
    cardWidth: 260,
    tilt: 7,
    sideOffset: 18,
    labelMode: "auto",
    name: "The Edge",
    price: "$19",
    period: "month",
    features: [
        "Everything in The List",
        "Cold outreach approaches",
        "Founder intel",
        "Full job board access",
    ],
    buttonLabel: "Subscribe",
    buttonLink: "",
    paper: "#F3EFE7",
    ink: "#1A1A1A",
    muted: "#B9B2A4",
    accent: "#D6461E",
    buttonBg: "#141414",
    buttonText: "#FFFFFF",
    nameFont: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 26,
        fontWeight: 500,
        lineHeight: "1.1em",
        letterSpacing: 0,
    },
    priceFont: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 58,
        fontWeight: 500,
        lineHeight: "1em",
        letterSpacing: 0,
    },
    bodyFont: {
        fontFamily: "Inter, sans-serif",
        fontSize: 13.5,
        fontWeight: 400,
        lineHeight: "1.4em",
        letterSpacing: 0,
    },
}

addPropertyControls(PricingTicket, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        defaultValue: "middle",
        options: ["left", "middle", "right"],
        optionTitles: ["Left", "Middle", "Right"],
        displaySegmentedControl: true,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 260,
        min: 180,
        max: 400,
        unit: "px",
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 7,
        min: 0,
        max: 20,
        unit: "deg",
    },
    sideOffset: {
        type: ControlType.Number,
        title: "Side Drop",
        defaultValue: 18,
        min: 0,
        max: 80,
        unit: "px",
        description: "Vertical drop for Left/Right tickets",
    },
    labelMode: {
        type: ControlType.Enum,
        title: "Top Label",
        defaultValue: "auto",
        options: ["auto", "none", "recommended", "limited"],
        optionTitles: ["Auto", "None", "Recommended", "Limited"],
    },
    name: { type: ControlType.String, title: "Name", defaultValue: "The Edge" },
    price: { type: ControlType.String, title: "Price", defaultValue: "$19" },
    period: {
        type: ControlType.String,
        title: "Period",
        defaultValue: "month",
    },
    features: {
        type: ControlType.Array,
        title: "Features",
        control: { type: ControlType.String },
        defaultValue: [
            "Everything in The List",
            "Cold outreach approaches",
            "Founder intel",
            "Full job board access",
        ],
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Subscribe",
    },
    buttonLink: { type: ControlType.Link, title: "Link" },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 26,
            fontWeight: 500,
            lineHeight: "1.1em",
            letterSpacing: 0,
        },
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 58,
            fontWeight: 500,
            lineHeight: "1em",
            letterSpacing: 0,
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Inter, sans-serif",
            fontSize: 13.5,
            fontWeight: 400,
            lineHeight: "1.4em",
            letterSpacing: 0,
        },
    },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#F3EFE7" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#1A1A1A" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#B9B2A4" },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#D6461E",
    },
    buttonBg: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#141414",
    },
    buttonText: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#FFFFFF",
    },
    onTap: { type: ControlType.EventHandler },
})
