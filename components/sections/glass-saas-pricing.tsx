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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

export default function GlassPricingCards(props) {
    const {
        accent = "#B6FF2E",
        background = "#101214",
        titleColor = "#F7F7F5",
        textColor = "#A8ABB0",
    } = props

    const isStatic = useIsStaticRenderer()
    const [billing, setBilling] = React.useState("monthly")
    const sectionRef = React.useRef(null)
    const [width, setWidth] = React.useState(1200)

    React.useEffect(() => {
        if (isStatic) return

        const element = sectionRef.current
        if (!element) return

        const updateWidth = () => {
            setWidth(element.offsetWidth)
        }

        updateWidth()

        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(updateWidth)
        observer.observe(element)

        return () => observer.disconnect()
    }, [isStatic])

    const isPhone = width <= 620
    const isTablet = width > 620 && width <= 900
    const columns = isPhone ? 1 : isTablet ? 2 : 3

    const plans = [
        {
            name: "Starter",
            description: "Perfect for individuals getting started.",
            monthly: 9,
            yearly: 7,
            features: [
                "Up to 3 projects",
                "Basic analytics",
                "Community support",
            ],
            button: "Get started",
        },
        {
            name: "Pro",
            description: "Everything you need for professional work.",
            monthly: 29,
            yearly: 23,
            popular: true,
            features: [
                "Unlimited projects",
                "Advanced analytics",
                "Priority support",
            ],
            button: "Start free trial",
        },
        {
            name: "Business",
            description: "Advanced features for growing teams.",
            monthly: 64,
            yearly: 51,
            features: [
                "Everything in Pro",
                "Team collaboration",
                "Advanced security",
            ],
            button: "Contact sales",
        },
    ]

    return (
        <section
            ref={sectionRef}
            style={{
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                background,
                padding: isPhone
                    ? "46px 18px 48px"
                    : isTablet
                      ? "54px 24px 56px"
                      : "62px 30px 66px",
                fontFamily:
                    "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                color: titleColor,
                isolation: "isolate",
            }}
        >
            <Blob
                width={isPhone ? 380 : 650}
                height={isPhone ? 360 : 520}
                top={isPhone ? -180 : -350}
                left={isPhone ? -190 : -230}
                background="rgba(42,92,210,.30)"
                blur={115}
            />

            <Blob
                width={isPhone ? 340 : 520}
                height={isPhone ? 340 : 480}
                top={isPhone ? -160 : -300}
                right={isPhone ? -180 : -170}
                background="rgba(182,255,46,.14)"
                blur={120}
            />

            <Blob
                width={440}
                height={420}
                top={isPhone ? 520 : 440}
                left={isPhone ? -190 : -80}
                background="rgba(40,98,235,.30)"
                blur={105}
            />

            <Blob
                width={450}
                height={420}
                top={isPhone ? 850 : 440}
                left={isPhone ? "15%" : "28%"}
                background="rgba(182,255,46,.17)"
                blur={115}
            />

            <Blob
                width={460}
                height={430}
                top={isPhone ? 1250 : 420}
                right={isPhone ? -180 : -90}
                background="rgba(47,101,230,.26)"
                blur={110}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    maxWidth: 1240,
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        maxWidth: 760,
                        margin: "0 auto",
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 15px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,.04)",
                            border: "1px solid rgba(255,255,255,.10)",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: ".12em",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                        }}
                    >
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: accent,
                            }}
                        />
                        PRICING
                    </div>

                    <h1
                        style={{
                            margin: "16px 0 0",
                            fontSize: isPhone
                                ? 42
                                : isTablet
                                  ? 52
                                  : "clamp(40px, 5vw, 66px)",
                            lineHeight: 0.98,
                            letterSpacing: "-.045em",
                            fontWeight: 700,
                        }}
                    >
                        Simple pricing for
                        <br />
                        <span style={{ color: accent }}>growing teams</span>
                    </h1>

                    <p
                        style={{
                            margin: "18px auto 0",
                            color: textColor,
                            fontSize: isPhone ? 14 : 16,
                            lineHeight: 1.5,
                            maxWidth: isPhone ? 330 : 600,
                        }}
                    >
                        Choose the plan that fits your needs. Upgrade or
                        downgrade anytime.
                    </p>

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: isPhone ? 2 : 4,
                            marginTop: 24,
                            padding: 5,
                            borderRadius: 999,
                            background: "rgba(8,10,11,.60)",
                            border: "1px solid rgba(255,255,255,.10)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                        }}
                    >
                        <ToggleButton
                            active={billing === "monthly"}
                            onClick={() => setBilling("monthly")}
                            accent={accent}
                            compact={isPhone}
                        >
                            Monthly
                        </ToggleButton>

                        <ToggleButton
                            active={billing === "yearly"}
                            onClick={() => setBilling("yearly")}
                            accent={accent}
                            compact={isPhone}
                        >
                            Yearly
                        </ToggleButton>

                        <span
                            style={{
                                marginRight: 5,
                                padding: isPhone ? "7px 8px" : "7px 10px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,.06)",
                                color: accent,
                                fontSize: isPhone ? 10 : 12,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Save 20%
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        gap: isPhone ? 16 : 20,
                        width: "100%",
                        marginTop: isPhone ? 26 : 30,
                        alignItems: "stretch",
                    }}
                >
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.name}
                            plan={plan}
                            billing={billing}
                            accent={accent}
                            titleColor={titleColor}
                            textColor={textColor}
                            isPhone={isPhone}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

function Blob({ width, height, top, bottom, left, right, background, blur }) {
    return (
        <div
            style={{
                position: "absolute",
                width,
                height,
                top,
                bottom,
                left,
                right,
                borderRadius: "50%",
                background,
                filter: `blur(${blur}px)`,
                pointerEvents: "none",
                zIndex: 0,
            }}
        />
    )
}

function ToggleButton({ active, onClick, accent, children, compact }) {
    const [hovered, setHovered] = React.useState(false)

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                border: 0,
                cursor: "pointer",
                padding: compact ? "9px 13px" : "9px 18px",
                borderRadius: 999,
                background: active
                    ? accent
                    : hovered
                      ? "rgba(255,255,255,.07)"
                      : "transparent",
                color: active ? "#111315" : "#D5D7DA",
                fontWeight: 650,
                fontSize: compact ? 12 : 14,
                boxShadow: active
                    ? `0 0 ${hovered ? 28 : 18}px rgba(182,255,46,.25)`
                    : "none",
                transition: "all .2s ease",
            }}
        >
            {children}
        </button>
    )
}

function PricingCard({
    plan,
    billing,
    accent,
    titleColor,
    textColor,
    isPhone,
}) {
    const [hovered, setHovered] = React.useState(false)
    const [buttonHovered, setButtonHovered] = React.useState(false)

    const price = billing === "monthly" ? plan.monthly : plan.yearly

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                minWidth: 0,
                minHeight: isPhone ? 365 : 390,
                padding: isPhone ? "25px 24px 22px" : "27px 28px 24px",
                boxSizing: "border-box",
                borderRadius: 36,
                background:
                    "linear-gradient(145deg, rgba(45,47,49,.64), rgba(21,23,25,.55))",
                backdropFilter: "blur(32px) saturate(125%)",
                WebkitBackdropFilter: "blur(32px) saturate(125%)",
                border: plan.popular
                    ? `1px solid ${accent}`
                    : "1px solid rgba(255,255,255,.14)",
                boxShadow: hovered
                    ? "0 26px 60px rgba(0,0,0,.30)"
                    : "0 18px 45px rgba(0,0,0,.20)",
                transform: hovered ? "translateY(-4px)" : "translateY(0)",
                transition: "all .25s ease",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 36,
                    pointerEvents: "none",
                    background:
                        "linear-gradient(135deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,.015) 35%, transparent 62%)",
                }}
            />

            {plan.popular && (
                <div
                    style={{
                        position: "absolute",
                        right: 24,
                        top: 24,
                        padding: "7px 12px",
                        borderRadius: 999,
                        background: accent,
                        color: "#111315",
                        fontSize: 11,
                        fontWeight: 700,
                        zIndex: 2,
                    }}
                >
                    Most Popular
                </div>
            )}

            <h2
                style={{
                    position: "relative",
                    margin: 0,
                    paddingRight: plan.popular ? 110 : 0,
                    fontSize: 27,
                    letterSpacing: "-.03em",
                }}
            >
                {plan.name}
            </h2>

            <p
                style={{
                    position: "relative",
                    margin: "8px 0 18px",
                    color: textColor,
                    fontSize: 14,
                    lineHeight: 1.45,
                    maxWidth: 245,
                }}
            >
                {plan.description}
            </p>

            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    marginBottom: 18,
                }}
            >
                <span
                    style={{
                        fontSize: 44,
                        fontWeight: 700,
                        letterSpacing: "-.04em",
                    }}
                >
                    ${price}
                </span>
                <span style={{ color: textColor, fontSize: 14 }}>/ month</span>
            </div>

            <div
                style={{
                    height: 1,
                    background: "rgba(255,255,255,.11)",
                    marginBottom: 17,
                }}
            />

            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 11,
                    flex: 1,
                }}
            >
                {plan.features.map((feature) => (
                    <div
                        key={feature}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            color: "#DCDDDF",
                            fontSize: 13,
                        }}
                    >
                        <span
                            style={{
                                width: 24,
                                height: 24,
                                minWidth: 24,
                                minHeight: 24,
                                flexShrink: 0,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#343638",
                                border: "1px solid rgba(255,255,255,.06)",
                                color: "#E9EAEB",
                                fontSize: 13,
                                lineHeight: 1,
                                fontWeight: 800,
                                boxSizing: "border-box",
                            }}
                        >
                            ✓
                        </span>
                        {feature}
                    </div>
                ))}
            </div>

            <button
                onMouseEnter={() => setButtonHovered(true)}
                onMouseLeave={() => setButtonHovered(false)}
                style={{
                    position: "relative",
                    width: "100%",
                    marginTop: 20,
                    padding: "13px 18px",
                    borderRadius: 999,
                    border: plan.popular
                        ? "none"
                        : "1px solid rgba(255,255,255,.16)",
                    background: plan.popular
                        ? accent
                        : buttonHovered
                          ? "rgba(255,255,255,.10)"
                          : "rgba(255,255,255,.055)",
                    color: plan.popular ? "#111315" : titleColor,
                    fontSize: 14,
                    fontWeight: 650,
                    cursor: "pointer",
                    boxShadow: plan.popular
                        ? `0 0 ${
                              buttonHovered ? 36 : 22
                          }px rgba(182,255,46,.27)`
                        : "none",
                    transform: buttonHovered
                        ? "translateY(-2px)"
                        : "translateY(0)",
                    transition: "all .2s ease",
                }}
            >
                {plan.button}
            </button>
        </div>
    )
}

addPropertyControls(GlassPricingCards, {
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#B6FF2E",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#101214",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#F7F7F5",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#A8ABB0",
    },
})
