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
    AnimatePresence,
    useMotionValue,
    useSpring,
    useReducedMotion,
} from "framer-motion"

/**
 * Pricing Showcase — WEBX / Framer Code Component
 * Add as a Code Component in Framer. Configure plans and visuals from the Properties panel.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 760
 * @framerIntrinsicHeight 1090
 */

type Plan = {
    name: string
    title: string
    price: number
    annualPrice?: number
    currency: string
    period: string
    benefits: string
    buttonText: string
    buttonLink: string
    artwork?: string
    hue: string
    feature1: string
    feature2: string
    feature3: string
    feature4: string
    featureImage1?: string
    featureImage2?: string
    featureImage3?: string
    featureImage4?: string
    extraFeatures?: string
}

type Props = {
    heading: string
    plans: Plan[]
    defaultPlan: number
    showBilling: boolean
    annualDiscount: number
    yearlyLabel: string
    monthlyLabel: string
    showEditor: boolean
    background: string
    panelBackground: string
    heroBackground: string
    ink: string
    muted: string
    accent: string
    buttonBackground: string
    buttonColor: string
    borderRadius: number
    maxWidth: number
    gap: number
    shadowStrength: number
    duration: number
    featureImages: string[]
    serifTitle: boolean
    priceFont: string
    fontFamily: string
    hideArtworkOnMobile: boolean
    theme: "light" | "dark"
    showThemeToggle: boolean
    headingFont: string
    cardFont: string
    featureFont: string
    priceWeight: number
    watermarkOpacity: number
    buttonShadowBlur: number
    featureHeading: string
    extraFeaturesPreview: number
    showExtraFeatures: boolean
    featureFadeHeight: number
}

const ease = [0.16, 1, 0.1, 1] as const
const defaultPlans: Plan[] = [
    {
        name: "Free Plan",
        title: "Get started for free",
        price: 0,
        currency: "$",
        period: "/month",
        benefits: "Essential features\nCommunity support",
        buttonText: "Get Started Free",
        buttonLink: "",
        hue: "#a9c9f5",
        feature1: "Core tools included",
        feature2: "Build your first project",
        feature3: "Flexible setup",
        feature4: "Help when you need it",
        extraFeatures:
            "Easy onboarding\nFlexible billing\nRegular updates\nSecure access",
    },
    {
        name: "Pro Plan",
        title: "Upgrade to Pro",
        price: 79,
        currency: "$",
        period: "/month",
        benefits:
            "Unlimited projects and collaborators\nPriority support, faster responses",
        buttonText: "Start Pro Plan",
        buttonLink: "",
        hue: "#a28cf4",
        feature1: "Unlimited Data, Calls and Voice notes.",
        feature2: "Fast international data roaming.",
        feature3: "Full access to additional available lines.",
        feature4: "eSIM protection and VPN support.",
        extraFeatures:
            "Priority onboarding\nAdvanced analytics\nUnlimited history\nMulti-device access\nCustom integrations\nDedicated support",
    },
    {
        name: "Enterprise",
        title: "Built for your business",
        price: 249,
        currency: "$",
        period: "/month",
        benefits: "Everything in Pro\nDedicated account support",
        buttonText: "Contact Sales",
        buttonLink: "",
        hue: "#a1d58c",
        feature1: "Unlimited team members",
        feature2: "Dedicated support",
        feature3: "Advanced administration",
        feature4: "Business-grade security",
        extraFeatures:
            "SSO access\nAudit logging\nCustom integrations\nEnterprise reporting\nTeam permissions\nSLA support",
    },
]

function alpha(hex: string, a: number) {
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
        const n = Number.parseInt(hex.slice(1), 16)
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
    }
    return hex
}

function Arrow({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M4 12h15m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function Check({ accent }: { accent: string }) {
    return (
        <span
            style={{
                display: "inline-grid",
                flexShrink: 0,
                placeItems: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: alpha(accent, 0.13),
                color: accent,
            }}
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="m3.5 8.2 3 3 6-6.4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    )
}

function Price({
    value,
    currency,
    period,
    color,
    delay = 0,
    fontFamily,
    size,
    weight,
    mutedColor,
}: {
    value: number
    currency: string
    period: string
    color: string
    delay?: number
    fontFamily: string
    size: number
    weight: number
    mutedColor: string
}) {
    const reduced = useReducedMotion()
    const isStaticRenderer = useIsStaticRenderer()
    const motionValue = useMotionValue(value)
    const spring = useSpring(motionValue, {
        stiffness: 70,
        damping: 24,
        mass: 1,
    })
    const [display, setDisplay] = React.useState(value)
    React.useEffect(() => {
        if (reduced || isStaticRenderer) {
            motionValue.set(value)
            setDisplay(value)
            return
        }
        const timer = window.setTimeout(
            () => motionValue.set(value),
            delay * 1000
        )
        return () => window.clearTimeout(timer)
    }, [value, delay, motionValue, reduced, isStaticRenderer])
    React.useEffect(() => {
        if (isStaticRenderer) return
        const unsubscribe = spring.on("change", (v) => setDisplay(v))
        return () => unsubscribe()
    }, [spring, isStaticRenderer])
    const formatted = Math.max(
        0,
        Math.round(isStaticRenderer ? value : display)
    ).toLocaleString("en-US")
    return (
        <div
            style={{
                display: "flex",
                alignItems: "baseline",
                gap: 3,
                position: "relative",
                whiteSpace: "nowrap",
                color,
                lineHeight: 0.95,
            }}
            aria-label={`${currency}${value} ${period}`}
        >
            <span
                aria-hidden="true"
                style={{
                    fontFamily,
                    fontSize: Math.round(size * 0.3),
                    fontWeight: 300,
                    alignSelf: "flex-start",
                    marginTop: size * 0.09,
                    letterSpacing: "-.055em",
                }}
            >
                {currency}
            </span>
            <span
                aria-hidden="true"
                style={{
                    fontFamily,
                    fontSize: size,
                    fontWeight: weight,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-.09em",
                }}
            >
                {formatted}
            </span>
            <span
                aria-hidden="true"
                style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    color: mutedColor,
                    fontSize: Math.max(13, size * 0.24),
                    letterSpacing: "-.035em",
                    fontStyle: "italic",
                    fontWeight: 400,
                    marginLeft: Math.max(4, size * 0.04),
                }}
            >
                {period}
            </span>
        </div>
    )
}

function AbstractArtwork({ index, image }: { index: number; image?: string }) {
    if (image)
        return (
            <img
                src={image}
                alt=""
                loading="lazy"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />
        )
    const variants = [
        { base: "#fcf1f5", glow: "#ff8fb7", shade: "#f1b1d9" },
        { base: "#eee9ff", glow: "#bca9fa", shade: "#8a79f0" },
        { base: "#f1ffd7", glow: "#c5f54e", shade: "#7fab2c" },
        { base: "#e8f4ff", glow: "#69bcff", shade: "#2174e9" },
    ]
    const c = variants[index % 4]
    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                background: `radial-gradient(ellipse at 58% 28%,${c.glow}a8,transparent 61%),linear-gradient(145deg,${c.base},#fff)`,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    width: "115%",
                    height: "64%",
                    top: "-15%",
                    left: "-6%",
                    transform: `rotate(${index % 2 ? -19 : 14}deg)`,
                    borderRadius: "45% 55% 63% 38%",
                    background: `linear-gradient(135deg,${c.glow}88 4%,#ffffffaa 37%,${c.shade}b0 68%,${c.base})`,
                    boxShadow: `0 16px 38px ${c.shade}44, inset 0 2px 6px #ffffffaa`,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    width: "95%",
                    height: "52%",
                    top: "22%",
                    left: "27%",
                    transform: `rotate(${index % 2 ? 26 : -18}deg)`,
                    borderRadius: "55% 35% 68% 42%",
                    background: `linear-gradient(155deg,#ffffffb5,${c.glow}a6 35%,${c.shade}9c 75%,#ffffff99)`,
                    boxShadow: `0 16px 28px ${c.shade}33, inset 0 3px 8px #fff9`,
                }}
            />
            {index === 1 && (
                <div
                    style={{
                        position: "absolute",
                        width: "24%",
                        aspectRatio: "1",
                        top: "18%",
                        left: "44%",
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 30% 22%,#fff 0 5%,#ffffff55 10%,${c.glow}bb 42%,${c.shade}77 73%,#ffffffaa)`,
                        boxShadow: `inset -8px -12px 16px ${c.shade}99, 0 15px 20px ${c.shade}33`,
                    }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    inset: "56% 0 0",
                    background: `linear-gradient(0deg,#fafafa 12%,#fafafa00)`,
                }}
            />
        </div>
    )
}

function HeroArtwork({ image }: { image?: string }) {
    if (image)
        return (
            <img
                src={image}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
        )
    return (
        <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, overflow: "hidden" }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: "-20% -26% -25% -22%",
                    filter: "saturate(1.25)",
                    transform: "rotate(-17deg)",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        width: "95%",
                        height: "70%",
                        top: "3%",
                        left: "5%",
                        borderRadius: "19% 69% 18% 61% / 44% 36% 78% 36%",
                        transform: "rotate(32deg)",
                        background:
                            "linear-gradient(145deg,#12aafe 4%,#0976ee 18%,#bc6dfd 37%,#ff90de 55%,#ffd788 69%,#10d8f5 91%)",
                        boxShadow:
                            "inset 7px 9px 13px #ffffffa8, inset -18px -22px 20px #4b2fc088, 0 25px 30px #7c48d838",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: "96%",
                        height: "46%",
                        top: "40%",
                        left: "5%",
                        borderRadius: "85% 25% 65% 29% / 77% 78% 20% 31%",
                        transform: "rotate(-25deg)",
                        background:
                            "linear-gradient(160deg,#fdf8ff 0%,#69dfff 11%,#1576f2 32%,#b15bf8 52%,#f58deb 68%,#22bffd 94%)",
                        boxShadow:
                            "inset 5px 9px 9px #ffffffcc, inset -14px -13px 20px #1954c477, 0 13px 25px #7756ec55",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: "73%",
                        height: "41%",
                        top: "55%",
                        left: "13%",
                        borderRadius: "53% 75% 25% 60%",
                        transform: "rotate(15deg)",
                        background:
                            "linear-gradient(135deg,#86f2ff,#0969e6 29%,#0fe7e6 52%,#a875ef 77%,#ffb9f7)",
                        boxShadow:
                            "inset 9px 7px 12px #ffffffbb, inset -12px -17px 22px #115ed477, 0 10px 16px #066cb244",
                    }}
                />
            </div>
        </div>
    )
}

export default function PricingShowcase(props: Partial<Props>) {
    const {
        heading = "Pick your Plan",
        plans = defaultPlans,
        defaultPlan = 1,
        showBilling = false,
        annualDiscount = 20,
        monthlyLabel = "Monthly",
        yearlyLabel = "Yearly",
        showEditor = false,
        background = "#f7f7fa",
        panelBackground = "#ffffff",
        heroBackground = "#f7f4ff",
        ink = "#111116",
        muted = "#777780",
        accent = "#8a62e6",
        buttonBackground = "#15151a",
        buttonColor = "#ffffff",
        borderRadius = 38,
        maxWidth = 790,
        gap = 14,
        shadowStrength = 22,
        duration = 1.5,
        featureImages = [],
        serifTitle = false,
        priceFont = 'Inter, "Helvetica Neue", Arial, sans-serif',
        fontFamily = 'Inter, "Helvetica Neue", Arial, sans-serif',
        hideArtworkOnMobile = false,
        theme = "light",
        showThemeToggle = false,
        headingFont = 'Inter, "Helvetica Neue", Arial, sans-serif',
        cardFont = 'Inter, "Helvetica Neue", Arial, sans-serif',
        featureFont = 'Inter, "Helvetica Neue", Arial, sans-serif',
        priceWeight = 200,
        watermarkOpacity = 0.025,
        buttonShadowBlur = 48,
        featureHeading = "What’s included",
        extraFeaturesPreview = 4,
        showExtraFeatures = true,
        featureFadeHeight = 70,
    } = props
    const data = Array.isArray(plans) && plans.length ? plans : defaultPlans
    const [active, setActive] = React.useState(() =>
        Math.max(0, Math.min(defaultPlan, data.length - 1))
    )
    const [annual, setAnnual] = React.useState(false)
    const [editorOpen, setEditorOpen] = React.useState(false)
    const [themeOverride, setThemeOverride] = React.useState<
        "light" | "dark" | null
    >(null)
    const currentTheme = themeOverride || theme
    const dark = currentTheme === "dark"
    const ui = {
        outer: dark ? "#101014" : background,
        panel: dark ? "#19191f" : panelBackground,
        hero: dark ? "#22222d" : heroBackground,
        featureSurface: dark ? "#282832" : "#fafafa",
        foreground: dark ? "#f7f7fa" : ink,
        muted: dark ? "#aaaab8" : muted,
        border: dark ? "rgba(255,255,255,.10)" : "rgba(40,32,55,.075)",
        tab: dark ? "#292932" : "#f2f2f5",
        tabSelected: dark ? "#43434e" : "#ffffff",
        button:
            dark && buttonBackground === "#15151a"
                ? "#f6f4ff"
                : buttonBackground,
        buttonInk:
            dark && buttonColor === "#ffffff" && buttonBackground === "#15151a"
                ? "#15151a"
                : buttonColor,
    }
    const safeActive = Math.min(active, data.length - 1)
    const plan = data[safeActive]
    const effectivePrice = annual
        ? plan.annualPrice != null && plan.annualPrice >= 0
            ? plan.annualPrice
            : Math.round(plan.price * (1 - annualDiscount / 100))
        : plan.price
    const [extrasExpanded, setExtrasExpanded] = React.useState(false)
    React.useEffect(() => setExtrasExpanded(false), [safeActive])
    const extraItems = (plan.extraFeatures || "")
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean)
    const visibleExtras = extrasExpanded
        ? extraItems
        : extraItems.slice(0, extraFeaturesPreview)
    const features = [
        { text: plan.feature1, image: plan.featureImage1 || featureImages[0] },
        { text: plan.feature2, image: plan.featureImage2 || featureImages[1] },
        { text: plan.feature3, image: plan.featureImage3 || featureImages[2] },
        { text: plan.feature4, image: plan.featureImage4 || featureImages[3] },
    ].filter((feature) => !!feature.text)
    const benefits = (plan.benefits || "")
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean)
    const reduced = useReducedMotion()
    const isStaticRenderer = useIsStaticRenderer()
    const anim = reduced || isStaticRenderer ? 0 : duration
    const titleFont = serifTitle
        ? 'Georgia, "Times New Roman", serif'
        : headingFont
    const rootRef = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(760)
    React.useEffect(() => {
        if (
            isStaticRenderer ||
            !rootRef.current ||
            typeof ResizeObserver === "undefined"
        )
            return
        const observer = new ResizeObserver((entries) =>
            setWidth(entries[0].contentRect.width)
        )
        observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [isStaticRenderer])
    const compact = width < 530
    const tiny = width < 365
    const priceSize = tiny ? 63 : compact ? 78 : 114
    const heroRadius = Math.max(18, borderRadius - 8)
    const shadow = dark
        ? `0 16px ${shadowStrength * 3}px rgba(0,0,0,.22)`
        : `0 ${Math.round(shadowStrength * 0.5)}px ${shadowStrength * 3}px rgba(30,25,64,.055), 0 2px 10px rgba(30,25,64,.025)`
    const instanceId = React.useId().replace(/:/g, "")
    const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])
    const tabId = (index: number) => `pricing-${instanceId}-tab-${index}`
    const panelId = `pricing-${instanceId}-panel`
    const changePlan = (index: number) =>
        setActive(Math.max(0, Math.min(index, data.length - 1)))
    const handleTabKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        index: number
    ) => {
        let nextIndex: number
        switch (event.key) {
            case "ArrowRight":
                nextIndex = (index + 1) % data.length
                break
            case "ArrowLeft":
                nextIndex = (index - 1 + data.length) % data.length
                break
            case "Home":
                nextIndex = 0
                break
            case "End":
                nextIndex = data.length - 1
                break
            default:
                return
        }
        event.preventDefault()
        changePlan(nextIndex)
        tabRefs.current[nextIndex]?.focus()
    }
    const followLink = () => {
        if (!plan.buttonLink) return
        if (typeof window !== "undefined")
            window.open(plan.buttonLink, "_blank", "noopener,noreferrer")
    }
    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                minHeight: "min-content",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                background: ui.outer,
                color: ui.foreground,
                padding: compact ? 10 : 24,
                boxSizing: "border-box",
                fontFamily,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth,
                    padding: compact ? 13 : 25,
                    background: ui.panel,
                    borderRadius,
                    border: `1px solid ${ui.border}`,
                    boxShadow: `0 15px 60px rgba(36,32,58,.06)`,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <h2
                    style={{
                        margin: "9px 0 22px",
                        fontFamily: titleFont,
                        fontWeight: 400,
                        fontSize: compact ? 38 : 56,
                        letterSpacing: "-.065em",
                        lineHeight: 1.08,
                        textAlign: "center",
                        color: ui.foreground,
                    }}
                >
                    {heading}
                </h2>
                <div
                    role="tablist"
                    aria-label="Available pricing plans"
                    style={{
                        display: "flex",
                        width: "fit-content",
                        maxWidth: "100%",
                        margin: "0 auto 27px",
                        background: ui.tab,
                        borderRadius: 999,
                        padding: 5,
                        boxSizing: "border-box",
                        gap: 0,
                    }}
                >
                    {data.map((item, index) => (
                        <button
                            key={`${item.name}-${index}`}
                            type="button"
                            role="tab"
                            id={tabId(index)}
                            aria-controls={panelId}
                            aria-selected={safeActive === index}
                            tabIndex={safeActive === index ? 0 : -1}
                            ref={(element) => {
                                tabRefs.current[index] = element
                            }}
                            onKeyDown={(event) =>
                                handleTabKeyDown(event, index)
                            }
                            onClick={() => changePlan(index)}
                            style={{
                                WebkitTapHighlightColor: "transparent",
                                position: "relative",
                                zIndex: 1,
                                border: 0,
                                background: "none",
                                borderRadius: 999,
                                padding: compact ? "12px 13px" : "12px 23px",
                                fontFamily,
                                fontSize: compact ? 12 : 15,
                                fontWeight: safeActive === index ? 600 : 400,
                                color:
                                    safeActive === index
                                        ? ui.foreground
                                        : ui.muted,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "color .2s",
                                isolation: "isolate",
                            }}
                        >
                            {safeActive === index &&
                                (isStaticRenderer ? (
                                    <span
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: 999,
                                            background: ui.tabSelected,
                                            border: `1px solid ${ui.border}`,
                                            zIndex: -1,
                                        }}
                                    />
                                ) : (
                                    <motion.span
                                        layoutId={`selected-plan-tab-${instanceId}`}
                                        transition={{
                                            duration: anim * 0.55,
                                            ease,
                                        }}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: 999,
                                            background: ui.tabSelected,
                                            border: `1px solid ${ui.border}`,
                                            boxShadow: `0 6px ${buttonShadowBlur}px ${alpha(accent, 0.1)}`,
                                            zIndex: -1,
                                        }}
                                    />
                                ))}
                            {item.name}
                        </button>
                    ))}
                </div>
                {showBilling && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            columnGap: 11,
                            rowGap: 8,
                            margin: "-8px 0 24px",
                            color: ui.foreground,
                            fontFamily,
                            fontSize: 13,
                            position: "relative",
                            zIndex: 2,
                        }}
                    >
                        <span
                            style={{
                                color: !annual ? ui.foreground : ui.muted,
                                opacity: !annual ? 1 : 0.8,
                                fontWeight: !annual ? 600 : 400,
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {monthlyLabel || "Monthly"}
                        </span>
                        <button
                            type="button"
                            aria-label="Toggle annual billing"
                            aria-pressed={annual}
                            onClick={() => setAnnual((v) => !v)}
                            style={{
                                width: 43,
                                minWidth: 43,
                                height: 25,
                                flexShrink: 0,
                                border: `1px solid ${ui.border}`,
                                background: annual
                                    ? accent
                                    : dark
                                      ? "#45434f"
                                      : "#dedee5",
                                borderRadius: 20,
                                padding: 3,
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: annual
                                    ? "flex-end"
                                    : "flex-start",
                                alignItems: "center",
                                boxSizing: "border-box",
                            }}
                        >
                            <motion.span
                                layout
                                transition={{ duration: 0.3, ease }}
                                style={{
                                    width: 17,
                                    height: 17,
                                    flexShrink: 0,
                                    background: "#fff",
                                    borderRadius: "50%",
                                    boxShadow: "0 1px 4px #0002",
                                }}
                            />
                        </button>
                        <span
                            style={{
                                color: annual ? ui.foreground : ui.muted,
                                opacity: annual ? 1 : 0.85,
                                fontWeight: annual ? 600 : 400,
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {yearlyLabel || "Yearly"}
                        </span>
                        {annualDiscount > 0 && (
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minHeight: 24,
                                    borderRadius: 99,
                                    padding: "4px 10px",
                                    boxSizing: "border-box",
                                    background: dark ? "#302942" : "#eee9fa",
                                    color: dark ? "#e8ddff" : "#6343a2",
                                    border: dark
                                        ? "1px solid #54436a"
                                        : "1px solid #dfd5f3",
                                    fontFamily,
                                    fontWeight: 650,
                                    fontSize: 11,
                                    lineHeight: "16px",
                                    whiteSpace: "nowrap",
                                    opacity: 1,
                                    position: "relative",
                                    zIndex: 3,
                                }}
                            >
                                Save {annualDiscount}%
                            </span>
                        )}
                    </div>
                )}
                {showThemeToggle && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginBottom: 14,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                setThemeOverride(dark ? "light" : "dark")
                            }
                            aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
                            style={{
                                border: `1px solid ${ui.border}`,
                                borderRadius: 100,
                                padding: "9px 14px",
                                background: ui.tab,
                                color: ui.foreground,
                                cursor: "pointer",
                                fontFamily,
                                fontSize: 12,
                            }}
                        >
                            {dark ? "☀ Light mode" : "☾ Dark mode"}
                        </button>
                    </div>
                )}
                <div
                    style={{
                        padding: compact ? 7 : 10,
                        borderRadius: heroRadius + 10,
                        background: dark ? "#202028" : "#f8f7fb",
                        border: `1px solid ${ui.border}`,
                        boxShadow: shadow,
                    }}
                >
                    <section
                        id={panelId}
                        role="tabpanel"
                        aria-labelledby={tabId(safeActive)}
                        tabIndex={0}
                        aria-label={`${plan.name} pricing details`}
                        style={{
                            minHeight: compact ? 445 : 395,
                            position: "relative",
                            overflow: "hidden",
                            background: `radial-gradient(ellipse at 70% 60%,${alpha(plan.hue || accent, dark ? 0.14 : 0.22)},transparent 67%),${ui.hero}`,
                            borderRadius: heroRadius,
                            boxShadow: "none",
                            border: `1px solid ${ui.border}`,
                            isolation: "isolate",
                        }}
                    >
                        {isStaticRenderer ? (
                            <div
                                style={{
                                    position: "absolute",
                                    top: compact ? "41%" : 0,
                                    right: compact ? "-28%" : "-3%",
                                    width: compact ? "80%" : "49%",
                                    height: compact ? "65%" : "100%",
                                    pointerEvents: "none",
                                    opacity:
                                        hideArtworkOnMobile && compact ? 0 : 1,
                                }}
                            >
                                <HeroArtwork image={plan.artwork} />
                            </div>
                        ) : (
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={safeActive}
                                    initial={{ opacity: 0, scale: 1.06, x: 35 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, x: -25 }}
                                    transition={{ duration: anim * 0.65, ease }}
                                    style={{
                                        position: "absolute",
                                        top: compact ? "41%" : 0,
                                        right: compact ? "-28%" : "-3%",
                                        width: compact ? "80%" : "49%",
                                        height: compact ? "65%" : "100%",
                                        pointerEvents: "none",
                                        opacity:
                                            hideArtworkOnMobile && compact
                                                ? 0
                                                : 1,
                                    }}
                                >
                                    <HeroArtwork image={plan.artwork} />
                                </motion.div>
                            </AnimatePresence>
                        )}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                pointerEvents: "none",
                                top: compact ? 85 : 23,
                                left: 24,
                                fontSize: compact ? 134 : 210,
                                fontFamily: priceFont,
                                fontWeight: priceWeight,
                                letterSpacing: "-.10em",
                                lineHeight: 1,
                                color: ui.foreground,
                                opacity: watermarkOpacity,
                                whiteSpace: "nowrap",
                                userSelect: "none",
                            }}
                        >
                            {plan.currency}
                            {effectivePrice.toLocaleString("en-US")}
                        </div>
                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,
                                minHeight: compact ? 445 : 395,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                boxSizing: "border-box",
                                padding: compact ? "28px 22px" : "37px 34px",
                                pointerEvents: "none",
                            }}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={`heading-${safeActive}`}
                                    initial={
                                        isStaticRenderer
                                            ? false
                                            : { opacity: 0, y: 17 }
                                    }
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: anim * 0.57, ease }}
                                    style={{ maxWidth: "72%" }}
                                >
                                    <h3
                                        style={{
                                            margin: "0 0 11px",
                                            fontSize: compact ? 23 : 31,
                                            fontFamily: cardFont,
                                            lineHeight: 1.15,
                                            fontWeight: 400,
                                            letterSpacing: "-.035em",
                                        }}
                                    >
                                        {plan.title}
                                    </h3>
                                </motion.div>
                            </AnimatePresence>
                            <Price
                                value={effectivePrice}
                                currency={plan.currency || "$"}
                                period={
                                    annual ? "/month*" : plan.period || "/month"
                                }
                                color={ui.foreground}
                                mutedColor={ui.muted}
                                fontFamily={priceFont}
                                size={priceSize}
                                weight={priceWeight}
                            />
                            <div
                                style={{
                                    marginTop: "auto",
                                    paddingTop: 28,
                                    width: "100%",
                                    maxWidth: compact ? "83%" : "65%",
                                }}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={`benefits-${safeActive}`}
                                        initial={
                                            isStaticRenderer
                                                ? false
                                                : { opacity: 0, y: 16 }
                                        }
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{
                                            duration: anim * 0.6,
                                            ease,
                                        }}
                                    >
                                        {benefits.map((benefit, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 11,
                                                    marginBottom: 8,
                                                    fontSize: compact ? 12 : 14,
                                                    color: ui.muted,
                                                    lineHeight: 1.35,
                                                }}
                                            >
                                                <Check accent={accent} />
                                                {benefit}
                                            </div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                                <motion.button
                                    type="button"
                                    whileHover={
                                        reduced || isStaticRenderer
                                            ? undefined
                                            : {
                                                  scale: 1.035,
                                                  y: -2,
                                                  boxShadow: `0 18px ${buttonShadowBlur * 1.25}px ${alpha(accent, 0.14)}`,
                                              }
                                    }
                                    whileTap={
                                        reduced || isStaticRenderer
                                            ? undefined
                                            : { scale: 0.97 }
                                    }
                                    transition={{ duration: 0.42, ease }}
                                    onClick={followLink}
                                    aria-label={`${plan.buttonText} — ${plan.name}`}
                                    style={{
                                        pointerEvents: "auto",
                                        cursor: plan.buttonLink
                                            ? "pointer"
                                            : "default",
                                        marginTop: 22,
                                        display: "inline-flex",
                                        gap: 20,
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        border: 0,
                                        borderRadius: 999,
                                        padding: compact
                                            ? "15px 19px"
                                            : "17px 25px",
                                        background: ui.button,
                                        color: ui.buttonInk,
                                        fontFamily,
                                        fontSize: compact ? 14 : 16,
                                        fontWeight: 500,
                                        boxShadow: `0 12px ${buttonShadowBlur}px ${alpha(accent, 0.13)}, 0 4px ${buttonShadowBlur * 0.6}px rgba(0,0,0,.045)`,
                                    }}
                                >
                                    {plan.buttonText}
                                    <Arrow size={19} />
                                </motion.button>
                                {annual && (
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 11,
                                            color: ui.muted,
                                        }}
                                    >
                                        Billed annually · shown as monthly
                                        equivalent
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: compact
                                ? "21px 9px 13px"
                                : "24px 14px 15px",
                        }}
                    >
                        <div
                            style={{ width: 18, height: 1, background: accent }}
                        />
                        <span
                            style={{
                                fontFamily: cardFont,
                                fontSize: compact ? 12 : 13,
                                color: ui.muted,
                                fontWeight: 500,
                                letterSpacing: ".025em",
                            }}
                        >
                            {featureHeading}
                        </span>
                        <div
                            style={{
                                height: 1,
                                flex: 1,
                                background: ui.border,
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                            gap,
                        }}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={`${safeActive}-${index}`}
                                initial={
                                    isStaticRenderer
                                        ? false
                                        : {
                                              opacity: anim ? 0 : 1,
                                              y: anim ? 18 : 0,
                                          }
                                }
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: anim * 0.62,
                                    delay: anim ? index * 0.075 : 0,
                                    ease,
                                }}
                                whileHover={
                                    reduced || isStaticRenderer
                                        ? undefined
                                        : { y: -5, scale: 1.012 }
                                }
                                style={{
                                    position: "relative",
                                    height: tiny ? 172 : compact ? 200 : 245,
                                    borderRadius: Math.max(
                                        14,
                                        borderRadius - 12
                                    ),
                                    overflow: "hidden",
                                    boxShadow: shadow,
                                    border: `1px solid ${ui.border}`,
                                    background: ui.featureSurface,
                                }}
                            >
                                <AbstractArtwork
                                    index={index}
                                    image={feature.image}
                                />
                                {/* Smooth extended fade: images stay cinematic, while captions remain readable. */}
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        pointerEvents: "none",
                                        zIndex: 1,
                                        inset: 0,
                                        background: dark
                                            ? `linear-gradient(to bottom, transparent ${Math.max(0, 100 - featureFadeHeight)}%, rgba(20,20,26,.55) 65%, rgba(20,20,26,.94) 83%, #17171d 100%)`
                                            : `linear-gradient(to bottom, transparent ${Math.max(0, 100 - featureFadeHeight)}%, rgba(255,255,255,.46) 60%, rgba(255,255,255,.94) 81%, #ffffff 100%)`,
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        zIndex: 2,
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        minHeight: tiny
                                            ? 63
                                            : compact
                                              ? 75
                                              : 89,
                                        padding: tiny
                                            ? "12px 14px 15px"
                                            : compact
                                              ? "15px 18px 18px"
                                              : "19px 24px 22px",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <div
                                        style={{
                                            textAlign: "left",
                                            fontSize: tiny
                                                ? 12
                                                : compact
                                                  ? 13
                                                  : 16,
                                            fontWeight: 500,
                                            lineHeight: 1.48,
                                            color: dark ? "#ffffff" : "#252530",
                                            fontFamily: featureFont,
                                            maxWidth: "100%",
                                            textWrap: "pretty",
                                            overflowWrap: "break-word",
                                            textShadow: dark
                                                ? "0 1px 8px rgba(0,0,0,.12)"
                                                : "0 1px 8px rgba(255,255,255,.15)",
                                        }}
                                    >
                                        {feature.text}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {showExtraFeatures && extraItems.length > 0 && (
                        <div
                            style={{
                                marginTop: compact ? 16 : 20,
                                padding: compact ? "16px 13px" : "18px 20px",
                                background: dark
                                    ? "rgba(255,255,255,.035)"
                                    : "rgba(125,108,166,.035)",
                                border: `1px solid ${ui.border}`,
                                borderRadius: Math.max(14, borderRadius - 16),
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 10,
                                    marginBottom: 13,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: cardFont,
                                        fontSize: compact ? 12 : 14,
                                        fontWeight: 600,
                                        color: ui.foreground,
                                    }}
                                >
                                    More included in {plan.name}
                                </span>
                                <span
                                    style={{
                                        fontFamily,
                                        fontSize: 11,
                                        color: ui.muted,
                                    }}
                                >
                                    {extraItems.length} benefits
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: compact
                                        ? "1fr"
                                        : "repeat(2, minmax(0,1fr))",
                                    gap: "11px 16px",
                                }}
                            >
                                {visibleExtras.map((item, index) => (
                                    <div
                                        key={`${safeActive}-extra-${index}`}
                                        style={{
                                            display: "flex",
                                            gap: 9,
                                            alignItems: "flex-start",
                                            minWidth: 0,
                                        }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                color: accent,
                                                flexShrink: 0,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            ✓
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: featureFont,
                                                fontSize: compact ? 12 : 13,
                                                lineHeight: 1.55,
                                                color: ui.foreground,
                                                overflowWrap: "anywhere",
                                            }}
                                        >
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {extraItems.length > extraFeaturesPreview && (
                                <button
                                    type="button"
                                    aria-expanded={extrasExpanded}
                                    onClick={() => setExtrasExpanded((v) => !v)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7,
                                        marginTop: 16,
                                        background: "transparent",
                                        border: "none",
                                        color: accent,
                                        fontFamily,
                                        fontSize: compact ? 12 : 13,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        padding: 0,
                                    }}
                                >
                                    {extrasExpanded
                                        ? "Show less"
                                        : `View all ${extraItems.length} benefits`}{" "}
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            display: "inline-block",
                                            transform: extrasExpanded
                                                ? "rotate(180deg)"
                                                : "none",
                                            transition: "transform .3s",
                                        }}
                                    >
                                        ⌄
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {showEditor && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 16,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setEditorOpen((v) => !v)}
                            style={{
                                border: "1px solid #e4e4e9",
                                background: ui.tabSelected,
                                borderRadius: 99,
                                padding: "9px 13px",
                                fontFamily,
                                fontSize: 12,
                                color: ui.foreground,
                                cursor: "pointer",
                            }}
                        >
                            {editorOpen ? "Close Editor" : "✦ Creative Editor"}
                        </button>
                    </div>
                )}
                {showEditor && editorOpen && (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 12,
                            padding: 16,
                            background: ui.tab,
                            borderRadius: 16,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                color: ui.muted,
                                width: "100%",
                            }}
                        >
                            Explore the pricing experience
                        </span>
                        {data.map((item, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => changePlan(i)}
                                style={{
                                    border: `1px solid ${i === safeActive ? accent : "#dedee5"}`,
                                    background:
                                        i === safeActive
                                            ? alpha(accent, 0.1)
                                            : ui.tabSelected,
                                    borderRadius: 20,
                                    padding: "7px 12px",
                                    color: ui.foreground,
                                    cursor: "pointer",
                                    fontFamily,
                                    fontSize: 12,
                                }}
                            >
                                {item.name}
                            </button>
                        ))}
                        {showBilling && (
                            <button
                                type="button"
                                onClick={() => setAnnual((v) => !v)}
                                style={{
                                    border: "1px solid #dedee5",
                                    background: ui.tabSelected,
                                    borderRadius: 20,
                                    padding: "7px 12px",
                                    color: ui.foreground,
                                    cursor: "pointer",
                                    fontFamily,
                                    fontSize: 12,
                                }}
                            >
                                {annual ? "Annual billing" : "Monthly billing"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

PricingShowcase.defaultProps = {
    heading: "Pick your Plan",
    plans: defaultPlans,
    defaultPlan: 1,
    showBilling: false,
    annualDiscount: 20,
    monthlyLabel: "Monthly",
    yearlyLabel: "Yearly",
    showEditor: false,
    background: "#f7f7fa",
    panelBackground: "#ffffff",
    heroBackground: "#f7f4ff",
    ink: "#111116",
    muted: "#777780",
    accent: "#8a62e6",
    buttonBackground: "#15151a",
    buttonColor: "#ffffff",
    borderRadius: 38,
    maxWidth: 790,
    gap: 14,
    shadowStrength: 22,
    duration: 1.5,
    serifTitle: false,
    priceFont: 'Inter, "Helvetica Neue", Arial, sans-serif',
    fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
    hideArtworkOnMobile: false,
    theme: "light",
    showThemeToggle: false,
    headingFont: 'Inter, "Helvetica Neue", Arial, sans-serif',
    cardFont: 'Inter, "Helvetica Neue", Arial, sans-serif',
    featureFont: 'Inter, "Helvetica Neue", Arial, sans-serif',
    priceWeight: 200,
    watermarkOpacity: 0.025,
    buttonShadowBlur: 48,
    featureHeading: "What’s included",
    extraFeaturesPreview: 4,
    showExtraFeatures: true,
    featureFadeHeight: 70,
}

addPropertyControls(PricingShowcase, {
    heading: { type: ControlType.String, title: "Heading" },
    plans: {
        type: ControlType.Array,
        title: "Plans",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Tab label" },
                title: { type: ControlType.String, title: "Hero title" },
                price: {
                    type: ControlType.Number,
                    title: "Monthly price",
                    min: 0,
                    step: 1,
                },
                annualPrice: {
                    type: ControlType.Number,
                    title: "Annual /mo",
                    min: 0,
                    step: 1,
                    description: "Optional: overrides discount calculation",
                },
                currency: {
                    type: ControlType.String,
                    title: "Currency",
                    defaultValue: "$",
                },
                period: {
                    type: ControlType.String,
                    title: "Period",
                    defaultValue: "/month",
                },
                benefits: {
                    type: ControlType.String,
                    title: "Benefits",
                    displayTextArea: true,
                    description: "One benefit per line",
                },
                buttonText: { type: ControlType.String, title: "CTA label" },
                buttonLink: { type: ControlType.Link, title: "CTA URL" },
                artwork: { type: ControlType.Image, title: "Hero artwork" },
                hue: { type: ControlType.Color, title: "Plan tint" },
                feature1: { type: ControlType.String, title: "Feature 1" },
                featureImage1: {
                    type: ControlType.Image,
                    title: "Feature 1 image",
                },
                feature2: { type: ControlType.String, title: "Feature 2" },
                featureImage2: {
                    type: ControlType.Image,
                    title: "Feature 2 image",
                },
                feature3: { type: ControlType.String, title: "Feature 3" },
                featureImage3: {
                    type: ControlType.Image,
                    title: "Feature 3 image",
                },
                feature4: { type: ControlType.String, title: "Feature 4" },
                featureImage4: {
                    type: ControlType.Image,
                    title: "Feature 4 image",
                },
                extraFeatures: {
                    type: ControlType.String,
                    title: "More features",
                    displayTextArea: true,
                    description:
                        "One benefit per line; shown in compact expandable list",
                },
            },
        },
        defaultValue: defaultPlans,
    },
    defaultPlan: {
        type: ControlType.Number,
        title: "Default plan",
        min: 0,
        max: 7,
        step: 1,
        description: "Zero = first plan",
    },
    showBilling: { type: ControlType.Boolean, title: "Billing toggle" },
    annualDiscount: {
        type: ControlType.Number,
        title: "Annual save %",
        min: 0,
        max: 95,
        step: 1,
        hidden: (p) => !p.showBilling,
    },
    monthlyLabel: {
        type: ControlType.String,
        title: "Monthly label",
        hidden: (p) => !p.showBilling,
    },
    yearlyLabel: {
        type: ControlType.String,
        title: "Yearly label",
        hidden: (p) => !p.showBilling,
    },
    featureImages: {
        type: ControlType.Array,
        title: "Fallback images",
        maxCount: 4,
        control: { type: ControlType.Image },
        description: "Used only where a plan has no individual feature image",
    },
    showEditor: { type: ControlType.Boolean, title: "Creative Editor" },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
    },
    showThemeToggle: {
        type: ControlType.Boolean,
        title: "Visitor theme toggle",
    },
    featureHeading: { type: ControlType.String, title: "Features label" },
    showExtraFeatures: { type: ControlType.Boolean, title: "Extra benefits" },
    extraFeaturesPreview: {
        type: ControlType.Number,
        title: "Initially show",
        min: 0,
        max: 12,
        step: 1,
        hidden: (p) => !p.showExtraFeatures,
    },
    featureFadeHeight: {
        type: ControlType.Number,
        title: "Fade height %",
        min: 45,
        max: 95,
        step: 5,
        description:
            "How far the caption gradient extends up each feature image",
    },
    background: { type: ControlType.Color, title: "Outer BG" },
    panelBackground: { type: ControlType.Color, title: "Panel BG" },
    heroBackground: { type: ControlType.Color, title: "Hero BG" },
    ink: { type: ControlType.Color, title: "Text" },
    muted: { type: ControlType.Color, title: "Muted" },
    accent: { type: ControlType.Color, title: "Accent" },
    buttonBackground: { type: ControlType.Color, title: "Button BG" },
    buttonColor: { type: ControlType.Color, title: "Button text" },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 10,
        max: 64,
        step: 1,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max width",
        min: 320,
        max: 1600,
        step: 10,
    },
    gap: { type: ControlType.Number, title: "Card gap", min: 4, max: 40 },
    shadowStrength: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 60,
    },
    duration: {
        type: ControlType.Number,
        title: "Motion (sec)",
        min: 0.2,
        max: 3,
        step: 0.1,
    },
    serifTitle: {
        type: ControlType.Boolean,
        title: "Serif heading",
        description: "Optional editorial style; disabled by default",
    },
    headingFont: {
        type: ControlType.String,
        title: "Heading font",
        description: "CSS font family, e.g. Inter, Arial, sans-serif",
    },
    cardFont: { type: ControlType.String, title: "Card title font" },
    featureFont: { type: ControlType.String, title: "Feature font" },
    priceWeight: {
        type: ControlType.Number,
        title: "Price weight",
        min: 100,
        max: 600,
        step: 100,
    },
    watermarkOpacity: {
        type: ControlType.Number,
        title: "Price watermark",
        min: 0,
        max: 0.2,
        step: 0.005,
    },
    buttonShadowBlur: {
        type: ControlType.Number,
        title: "Button blur",
        min: 0,
        max: 120,
        step: 2,
    },
    priceFont: { type: ControlType.String, title: "Price font" },
    fontFamily: { type: ControlType.String, title: "Body font" },
    hideArtworkOnMobile: {
        type: ControlType.Boolean,
        title: "Hide mobile art",
    },
})
