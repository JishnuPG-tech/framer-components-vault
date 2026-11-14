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


/**
 * AURA PRICING CARD — accessible
 * Grouped controls + Correct semantics (heading level, readable price),
 * Focusable button, Safari persistent list.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 520
 * @framerDisableUnlink
 */

type ContentGroup = {
    planName: string
    headingLevel: "h2" | "h3" | "h4"
    price: string
    period: string
    periodSpoken: string
    caption: string
    features: string[]
    buttonLabel: string
    buttonLink: string
}

type TypeGroup = {
    headingFont: React.CSSProperties
    bodyFont: React.CSSProperties
    planSize: number
    priceSize: number
    priceWeight: number
    priceTracking: number
    bodySize: number
}

type AuraGroup = {
    enabled: boolean
    mode: "snake" | "full"
    colors: string[]
    head: string
    tail: number
    fade: number
    count: number
    reverse: boolean
    speed: number
    blur: number
    spread: number
    opacity: number
    ring: number
    ringBase: string
    previewAngle: number
}

type ThemeGroup = {
    cardBg: string
    text: string
    muted: string
    divider: string
    buttonBg: string
    buttonText: string
    focusRing: string
    radius: number
    padding: number
}

type InteractionGroup = {
    hoverBg: string
    hoverText: string
    lift: number
    hoverScale: number
    pressScale: number
    shadow: boolean
    shadowColor: string
    duration: number
    showArrow: boolean
}

type Props = {
    content: Partial<ContentGroup>
    typography: Partial<TypeGroup>
    aura: Partial<AuraGroup>
    theme: Partial<ThemeGroup>
    interaction: Partial<InteractionGroup>
    style?: React.CSSProperties
}

/* ---------- helper: pasang alpha ke warna apa pun ---------- */
function withAlpha(color: string, alpha: number): string {
    const c = (color || "").trim()
    if (c.startsWith("#")) {
        let h = c.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        if (h.length >= 6) {
            const r = parseInt(h.slice(0, 2), 16)
            const g = parseInt(h.slice(2, 4), 16)
            const b = parseInt(h.slice(4, 6), 16)
            const baseA = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
            return `rgba(${r}, ${g}, ${b}, ${+(baseA * alpha).toFixed(3)})`
        }
    }
    const m = c.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1]
            .split(/[\s,/]+/)
            .filter(Boolean)
            .map(Number)
        const baseA = p.length > 3 ? p[3] : 1
        return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${+(baseA * alpha).toFixed(3)})`
    }
    return c
}

/* ---------- helper: gradient "ular" ---------- */
function snakeGradient(
    colors: string[],
    head: string,
    tail: number,
    count: number,
    fade: number,
    from: string
): string {
    const seg = 360 / count
    const span = Math.min(tail, seg)
    const stops: string[] = []

    for (let i = 0; i < count; i++) {
        const segStart = i * seg
        const headAt = segStart + seg
        const tailStart = headAt - span

        stops.push(`${withAlpha(colors[0], 0)} ${segStart.toFixed(2)}deg`)
        stops.push(`${withAlpha(colors[0], 0)} ${tailStart.toFixed(2)}deg`)

        colors.forEach((c, j) => {
            const t = (j + 1) / (colors.length + 1)
            stops.push(
                `${withAlpha(c, Math.pow(t, fade))} ${(tailStart + span * t).toFixed(2)}deg`
            )
        })

        stops.push(`${head} ${headAt.toFixed(2)}deg`)
    }
    return `conic-gradient(from ${from}, ${stops.join(", ")})`
}

const srOnly: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

export default function AuraPricingCard(props: Partial<Props>) {
    const {
        content = {},
        typography = {},
        aura = {},
        theme = {},
        interaction = {},
        style,
    } = props

    const {
        planName = "Growth",
        headingLevel = "h3",
        price = "$4,800",
        period = "/mo",
        periodSpoken = "per month",
        caption = "Everything in Starter",
        features = [
            "Unlimited design requests",
            "Two active requests at a time",
            "Brand and design system upkeep",
            "Framer and Webflow build-out",
            "Dedicated Slack channel",
            "Pause or cancel anytime",
        ],
        buttonLabel = "Start with Growth",
        buttonLink = "",
    } = content

    const {
        headingFont = { fontFamily: "Montserrat", fontWeight: 400 },
        bodyFont = { fontFamily: "Inter", fontWeight: 400 },
        planSize = 16,
        priceSize = 40,
        priceWeight = 400,
        priceTracking = -0.5,
        bodySize = 12,
    } = typography

    const {
        enabled: auraOn = true,
        mode = "snake",
        colors: auraColors = ["#9B5CFF", "#3DA9FF", "#3DD68C", "#FFE94A"],
        head: headColor = "#FFFFFF",
        tail: tailLength = 360,
        fade = 1.5,
        count: snakeCount = 1,
        reverse = false,
        speed: auraSpeed = 6,
        blur: auraBlur = 8,
        spread: auraSpread = 3,
        opacity: auraOpacity = 0.9,
        ring: ringWidth = 1.5,
        ringBase = "rgba(255,255,255,0.10)",
        previewAngle = 135,
    } = aura

    const {
        cardBg = "#0C0C10",
        text: textColor = "#FFFFFF",
        muted: mutedColor = "rgba(255,255,255,0.5)",
        divider: lineColor = "rgba(255,255,255,0.12)",
        buttonBg = "#FFFFFF",
        buttonText = "#0A0A0A",
        focusRing = "#8AB4FF",
        radius = 8,
        padding = 48,
    } = theme

    const {
        hoverBg = "#E4E4E7",
        hoverText = "#0A0A0A",
        lift = 2,
        hoverScale = 1,
        pressScale = 0.97,
        shadow = true,
        shadowColor = "rgba(0,0,0,0.4)",
        duration = 180,
        showArrow = false,
    } = interaction

    // true di Canvas Framer DAN saat export — matikan semua animasi di sana
    const isStatic = useIsStaticRenderer()

    const rawId = React.useId()
    const uid = "ap" + rawId.replace(/[^a-zA-Z0-9]/g, "")
    const headingId = `${uid}-title`

    const Heading = headingLevel as any

    // saat static, sudut ditulis literal supaya tidak bergantung pada @property
    const angleFrom = isStatic ? `${previewAngle}deg` : "var(--aura-angle)"

    const gradient =
        mode === "snake"
            ? snakeGradient(
                  auraColors,
                  headColor,
                  tailLength,
                  snakeCount,
                  fade,
                  angleFrom
              )
            : `conic-gradient(from ${angleFrom}, ${[...auraColors, auraColors[0]].join(", ")})`

    const motionCss = isStatic
        ? ""
        : `
    @property --aura-angle {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }
    @keyframes ${uid}-turn { to { --aura-angle: 360deg; } }
    .${uid}-layer {
      animation: ${uid}-turn ${auraSpeed}s linear infinite${reverse ? " reverse" : ""};
    }
    .${uid}-cta {
      transition:
        background-color ${duration}ms ease,
        color ${duration}ms ease,
        box-shadow ${duration}ms ease,
        transform ${duration}ms cubic-bezier(.22,.8,.28,1);
    }
    .${uid}-cta:hover {
      background-color: ${hoverBg};
      color: ${hoverText};
      transform: translateY(-${lift}px) scale(${hoverScale});
      ${shadow ? `box-shadow: 0 ${lift + 4}px ${lift * 4 + 12}px ${shadowColor};` : ""}
    }
    .${uid}-cta:active {
      transform: translateY(0) scale(${pressScale});
      box-shadow: 0 0 0 rgba(0,0,0,0);
      transition-duration: ${Math.round(duration * 0.35)}ms;
    }
    .${uid}-arrow {
      transition: transform ${duration}ms cubic-bezier(.22,.8,.28,1);
    }
    .${uid}-cta:hover .${uid}-arrow { transform: translateX(3px); }
    .${uid}-cta:active .${uid}-arrow { transform: translateX(1px); }
    @media (prefers-reduced-motion: reduce) {
      .${uid}-layer { animation: none; }
      .${uid}-cta,
      .${uid}-arrow { transition-property: background-color, color; }
      .${uid}-cta:hover,
      .${uid}-cta:active { transform: none; }
      .${uid}-cta:hover .${uid}-arrow { transform: none; }
    }
  `

    const css = `
    .${uid}-cta {
      appearance: none;
      border: 0;
      cursor: pointer;
      text-decoration: none;
      background-color: ${buttonBg};
      color: ${buttonText};
      transform: translateY(0) scale(1);
      box-shadow: 0 0 0 rgba(0,0,0,0);
    }
    .${uid}-cta:focus-visible {
      outline: 2px solid ${focusRing};
      outline-offset: 3px;
    }
    ${motionCss}
  `

    const Check = () => (
        <svg
            aria-hidden="true"
            focusable="false"
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke={textColor}
            style={{ flexShrink: 0, marginTop: bodySize * 0.22 }}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4.5 12.5l5 5L19.5 6.5"
            />
        </svg>
    )

    // warna sengaja TIDAK di sini: inline style mengalahkan :hover
    const ctaStyle: React.CSSProperties = {
        ...bodyFont,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "14px 22px",
        borderRadius: 10,
        fontSize: bodySize - 1,
        fontWeight: 600,
    }

    const ctaInner = (
        <>
            <span>{buttonLabel}</span>
            {showArrow && (
                <svg
                    aria-hidden="true"
                    focusable="false"
                    className={`${uid}-arrow`}
                    xmlns="http://www.w3.org/2000/svg"
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h13M13 6l6 6-6 6"
                    />
                </svg>
            )}
        </>
    )

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                width: "100%",
                isolation: "isolate",
                ...style,
            }}
        >
            <style>{css}</style>

            {auraOn && (
                <div
                    aria-hidden="true"
                    className={`${uid}-layer`}
                    style={{
                        position: "absolute",
                        inset: -auraSpread,
                        borderRadius: radius + auraSpread,
                        background: gradient,
                        filter: `blur(${auraBlur}px)`,
                        opacity: auraOpacity,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}

            {auraOn && ringWidth > 0 && (
                <div
                    aria-hidden="true"
                    className={`${uid}-layer`}
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: radius,
                        padding: ringWidth,
                        boxSizing: "border-box",
                        background: `${gradient}, linear-gradient(${ringBase}, ${ringBase})`,
                        WebkitMask:
                            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                />
            )}

            {/* article = satu unit mandiri, dinamai oleh heading-nya */}
            <article
                aria-labelledby={headingId}
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    background: cardBg,
                    borderRadius: radius,
                    padding,
                    display: "flex",
                    flexDirection: "column",
                    color: textColor,
                }}
            >
                <Heading
                    id={headingId}
                    style={{
                        ...headingFont,
                        fontSize: planSize,
                        lineHeight: 1.2,
                        margin: 0,
                    }}
                >
                    {planName}
                </Heading>

                {/* harga: visual dipecah, pembacaan digabung */}
                <p
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                        margin: 0,
                        marginTop: 14,
                    }}
                >
                    <span style={srOnly}>{`${price} ${periodSpoken}`}</span>
                    <span
                        aria-hidden="true"
                        style={{
                            ...headingFont,
                            fontSize: priceSize,
                            fontWeight: priceWeight,
                            letterSpacing: priceTracking,
                            lineHeight: 1,
                        }}
                    >
                        {price}
                    </span>
                    <span
                        aria-hidden="true"
                        style={{
                            ...bodyFont,
                            fontSize: Math.round(priceSize * 0.32),
                            color: mutedColor,
                        }}
                    >
                        {period}
                    </span>
                </p>

                <div
                    aria-hidden="true"
                    style={{
                        height: 1,
                        background: lineColor,
                        marginTop: 28,
                        marginBottom: 24,
                    }}
                />

                <p
                    style={{
                        ...bodyFont,
                        fontSize: bodySize - 1,
                        fontWeight: 600,
                        color: mutedColor,
                        margin: 0,
                        marginBottom: 18,
                    }}
                >
                    {caption}
                </p>

                {/* role="list" wajib: Safari membuang semantik saat list-style none */}
                <ul
                    role="list"
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    {features.map((f, i) => (
                        <li
                            key={i}
                            style={{
                                ...bodyFont,
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                                fontSize: bodySize,
                                lineHeight: 1.45,
                            }}
                        >
                            <Check />
                            <span>{f}</span>
                        </li>
                    ))}
                </ul>

                <div style={{ marginTop: 36 }}>
                    {buttonLink ? (
                        <a
                            className={`${uid}-cta`}
                            href={buttonLink}
                            style={ctaStyle}
                        >
                            {ctaInner}
                        </a>
                    ) : (
                        <button
                            type="button"
                            className={`${uid}-cta`}
                            style={ctaStyle}
                        >
                            {ctaInner}
                        </button>
                    )}
                </div>
            </article>
        </div>
    )
}

addPropertyControls(AuraPricingCard, {
    content: {
        type: ControlType.Object,
        title: "Content",
        buttonTitle: "Edit copy",
        controls: {
            planName: {
                type: ControlType.String,
                title: "Plan",
                defaultValue: "Growth",
            },
            headingLevel: {
                type: ControlType.Enum,
                title: "Heading",
                options: ["h2", "h3", "h4"],
                optionTitles: ["H2", "H3", "H4"],
                defaultValue: "h3",
                displaySegmentedControl: true,
            },
            price: {
                type: ControlType.String,
                title: "Price",
                defaultValue: "$4,800",
            },
            period: {
                type: ControlType.String,
                title: "Period",
                defaultValue: "/mo",
            },
            periodSpoken: {
                type: ControlType.String,
                title: "Spoken As",
                defaultValue: "per month",
                description: "Read by screen reader replaces /mo",
            },
            caption: {
                type: ControlType.String,
                title: "Caption",
                defaultValue: "Everything in Starter",
            },
            features: {
                type: ControlType.Array,
                title: "Features",
                control: { type: ControlType.String },
                defaultValue: [
                    "Unlimited design requests",
                    "Two active requests at a time",
                    "Brand and design system upkeep",
                    "Framer and Webflow build-out",
                    "Dedicated Slack channel",
                    "Pause or cancel anytime",
                ],
            },
            buttonLabel: {
                type: ControlType.String,
                title: "Button",
                defaultValue: "Start with Growth",
            },
            buttonLink: { type: ControlType.Link, title: "Link" },
        },
    },

    typography: {
        type: ControlType.Object,
        title: "Typography",
        buttonTitle: "Edit type",
        controls: {
            headingFont: {
                type: ControlType.Font,
                title: "Heading",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontFamily: "Montserrat", fontWeight: 400 },
            },
            bodyFont: {
                type: ControlType.Font,
                title: "Body",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontFamily: "Inter", fontWeight: 400 },
            },
            planSize: {
                type: ControlType.Number,
                title: "Plan Size",
                min: 12,
                max: 40,
                defaultValue: 16,
            },
            priceSize: {
                type: ControlType.Number,
                title: "Price Size",
                min: 24,
                max: 120,
                defaultValue: 40,
            },
            priceWeight: {
                type: ControlType.Number,
                title: "Price Weight",
                min: 100,
                max: 900,
                step: 100,
                defaultValue: 400,
            },
            priceTracking: {
                type: ControlType.Number,
                title: "Tracking",
                min: -6,
                max: 4,
                step: 0.1,
                defaultValue: -0.5,
            },
            bodySize: {
                type: ControlType.Number,
                title: "Body Size",
                min: 12,
                max: 22,
                defaultValue: 12,
            },
        },
    },

    aura: {
        type: ControlType.Object,
        title: "Aura",
        buttonTitle: "Edit aura",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            mode: {
                type: ControlType.Enum,
                title: "Style",
                options: ["snake", "full"],
                optionTitles: ["Snake", "Full Ring"],
                defaultValue: "snake",
                displaySegmentedControl: true,
                hidden: (a) => !a.enabled,
            },
            colors: {
                type: ControlType.Array,
                title: "Tail Colors",
                control: { type: ControlType.Color },
                defaultValue: ["#9B5CFF", "#3DA9FF", "#3DD68C", "#FFE94A"],
                hidden: (a) => !a.enabled,
            },
            head: {
                type: ControlType.Color,
                title: "Head",
                defaultValue: "#FFFFFF",
                hidden: (a) => !a.enabled || a.mode !== "snake",
            },
            tail: {
                type: ControlType.Number,
                title: "Tail (deg)",
                min: 20,
                max: 360,
                step: 5,
                defaultValue: 360,
                hidden: (a) => !a.enabled || a.mode !== "snake",
            },
            fade: {
                type: ControlType.Number,
                title: "Fade",
                min: 0.5,
                max: 5,
                step: 0.1,
                defaultValue: 1.5,
                hidden: (a) => !a.enabled || a.mode !== "snake",
            },
            count: {
                type: ControlType.Number,
                title: "Count",
                min: 1,
                max: 4,
                step: 1,
                displayStepper: true,
                defaultValue: 1,
                hidden: (a) => !a.enabled || a.mode !== "snake",
            },
            reverse: {
                type: ControlType.Boolean,
                title: "Reverse",
                defaultValue: false,
                hidden: (a) => !a.enabled,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed (s)",
                min: 1,
                max: 30,
                defaultValue: 6,
                hidden: (a) => !a.enabled,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 100,
                defaultValue: 8,
                hidden: (a) => !a.enabled,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: 0,
                max: 60,
                defaultValue: 3,
                hidden: (a) => !a.enabled,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.9,
                hidden: (a) => !a.enabled,
            },
            ring: {
                type: ControlType.Number,
                title: "Ring",
                min: 0,
                max: 6,
                step: 0.5,
                defaultValue: 1.5,
                hidden: (a) => !a.enabled,
            },
            ringBase: {
                type: ControlType.Color,
                title: "Ring Base",
                defaultValue: "rgba(255,255,255,0.10)",
                hidden: (a) => !a.enabled || !a.ring,
            },
            previewAngle: {
                type: ControlType.Number,
                title: "Preview At",
                min: 0,
                max: 360,
                step: 5,
                defaultValue: 135,
                description: "Head position when on canvas & export",
                hidden: (a) => !a.enabled,
            },
        },
    },

    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        buttonTitle: "Edit button",
        controls: {
            hoverBg: {
                type: ControlType.Color,
                title: "Hover BG",
                defaultValue: "#E4E4E7",
            },
            hoverText: {
                type: ControlType.Color,
                title: "Hover Text",
                defaultValue: "#0A0A0A",
            },
            lift: {
                type: ControlType.Number,
                title: "Lift",
                min: 0,
                max: 10,
                step: 1,
                defaultValue: 2,
                description: "How many pixels to raise on hover",
            },
            hoverScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                min: 0.95,
                max: 1.1,
                step: 0.01,
                defaultValue: 1,
            },
            pressScale: {
                type: ControlType.Number,
                title: "Press Scale",
                min: 0.9,
                max: 1,
                step: 0.01,
                defaultValue: 0.97,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: true,
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "rgba(0,0,0,0.4)",
                hidden: (i) => !i.shadow,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0,
                max: 600,
                step: 10,
                unit: "ms",
                defaultValue: 180,
            },
            showArrow: {
                type: ControlType.Boolean,
                title: "Arrow",
                defaultValue: false,
            },
        },
    },

    theme: {
        type: ControlType.Object,
        title: "Theme",
        buttonTitle: "Edit theme",
        controls: {
            cardBg: {
                type: ControlType.Color,
                title: "Card BG",
                defaultValue: "#0C0C10",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: "rgba(255,255,255,0.5)",
            },
            divider: {
                type: ControlType.Color,
                title: "Divider",
                defaultValue: "rgba(255,255,255,0.12)",
            },
            buttonBg: {
                type: ControlType.Color,
                title: "Button BG",
                defaultValue: "#FFFFFF",
            },
            buttonText: {
                type: ControlType.Color,
                title: "Button Text",
                defaultValue: "#0A0A0A",
            },
            focusRing: {
                type: ControlType.Color,
                title: "Focus Ring",
                defaultValue: "#8AB4FF",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 48,
                defaultValue: 8,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 16,
                max: 64,
                defaultValue: 48,
            },
        },
    },
})
