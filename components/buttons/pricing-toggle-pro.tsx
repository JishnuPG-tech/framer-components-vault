import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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
export default function PricingToggle(props) {
    const {
        styleVariant = "dark",
        demoMode = false,
        performanceMode = false,
        planCount = 3,
        planNames = {},
        planPrices = {},
        planFeatures = {},
        planCTAs = {},
        planLinks = {},
        planHighlights = {},
        planNotes = {},
        content = {},
        spacing = {},
        colorOverrides = {},
        typography = {},
        usageSlider = {},
        effectPriceCounter: ePC = {},
        effectParticles: ePart = {},
        effectTilt: eTilt = {},
        effectHoverLift: eHover = {},
        effectShimmer: eShim = {},
        effectPulse: ePulse = {},
        effectFloatIn: eFloat = {},
        effectFeatureSlide: eFeat = {},
        effectBadge: eBadge = {},
        effectGlow: eGlow = {},
    } = props

    // ─── DESTRUCTURE GROUPS ───
    const {
        plan1Name = "Essential",
        plan1Desc = "For creators just starting out",
        plan2Name = "Signature",
        plan2Desc = "For professionals who mean business",
        plan3Name = "Bespoke",
        plan3Desc = "For studios and agencies",
        plan4Name = "Enterprise",
        plan4Desc = "For large organizations",
    } = planNames

    const {
        plan1Monthly = 29,
        plan1Annual = 19,
        plan2Monthly = 79,
        plan2Annual = 59,
        plan3Monthly = 149,
        plan3Annual = 109,
        plan4Monthly = 299,
        plan4Annual = 229,
    } = planPrices

    const {
        plan1Features:
            f1 = "3 active projects\nBasic analytics\nEmail support\n2GB storage\nCommunity access",
        plan2Features:
            f2 = "Unlimited projects\nAdvanced analytics\nPriority support\n50GB storage\nCustom domain\nTeam collaboration",
        plan3Features:
            f3 = "Everything in Signature\nWhite-label exports\nDedicated manager\n500GB storage\nAPI access\nCustom contracts",
        plan4Features:
            f4 = "Everything in Bespoke\nUnlimited seats\nSLA guarantee\nCustom integrations\nDedicated infra\nSecurity review",
    } = planFeatures

    const {
        plan1CTA = "Start Free Trial",
        plan2CTA = "Get Started",
        plan3CTA = "Contact Us",
        plan4CTA = "Talk to Sales",
    } = planCTAs

    const {
        plan1Link = "",
        plan2Link = "",
        plan3Link = "",
        plan4Link = "",
    } = planLinks

    const {
        plan1Highlight = false,
        plan2Highlight = true,
        plan3Highlight = false,
        plan4Highlight = false,
    } = planHighlights

    const {
        plan1AnnualNote = "Billed $228/year",
        plan2AnnualNote = "Billed $708/year",
        plan3AnnualNote = "Billed $1,308/year",
        plan4AnnualNote = "Billed $2,748/year",
    } = planNotes

    const {
        eyebrowText = "PRICING",
        headlineText = "Simple, transparent pricing.",
        headlineItalicWord = "",
        subtitleText = "No hidden fees. No surprises. Cancel anytime.",
        footerText = "All plans include a 14-day free trial · No credit card required",
        monthlyLabel = "Monthly",
        annualLabel = "Annual",
        saveBadgeText = "Save 25%",
        currencySymbol = "$",
        perPeriodLabel = "/mo",
        popularBadgeText = "MOST POPULAR",
        featureIcon = "✦",
    } = content

    const {
        paddingTop = 60,
        paddingBottom = 60,
        paddingH = 24,
        cardGap = 24,
        cardPaddingH = 30,
        cardPaddingV = 34,
        headerGap = 48,
        toggleGap = 52,
        cardBorderRadius = 18,
        cardWidth = 280,
        scale = 1,
    } = spacing

    const {
        bgColor = "",
        accentColor = "",
        accentColorLight = "",
        headlineColor = "",
        subtextColor = "",
        eyebrowColor = "",
        cardBgColor = "",
        cardBorderColor = "",
        highlightCardBgColor = "",
        highlightCardBorderColor = "",
        priceHighlightColor = "",
        priceDefaultColor = "",
        featureIconColor = "",
        featureTextColor = "",
        highlightBtnColor = "",
        ghostBtnColor = "",
        saveBadgeColor = "#8A9E8C",
        // FIX: separate tokens for things that were all using accent
        italicWordColor = "",
        toggleKnobColor = "",
        sliderThumbColor = "",
        usageSliderTrackColor = "",
        planDescColor = "",
    } = colorOverrides

    const {
        displayFont = {},
        bodyFont = {},
        eyebrowSize = 11,
        headlineSize = 44,
        subtitleSize = 14,
        planNameSize = 21,
        // FIX: added planDescSize
        planDescSize = 12,
        priceSize = 54,
        featureSize = 12,
        ctaSize = 12,
    } = typography

    const displayFontFamily = displayFont?.fontFamily || "Playfair Display"
    const displayFontWeight = displayFont?.fontWeight || 400
    const bodyFontFamily = bodyFont?.fontFamily || "Inter"
    const bodyFontWeight = bodyFont?.fontWeight || 300

    const {
        showUsageSlider = false,
        usageSliderLabel = "Team size",
        usageSliderMin = 1,
        usageSliderMax = 100,
        usageSliderDefault = 1,
        usageSliderUnit = "seats",
        usageMultiplier = "linear",
    } = usageSlider

    const {
        enabled: pcEnabled = true,
        duration: pcDuration = 400,
        easing: pcEasing = "easeOut",
        steps: pcSteps = 20,
    } = ePC
    const {
        enabled: partEnabled = true,
        count: partCount = 12,
        color: partColor = "#C9A96E",
        minSize: partMinSize = 3,
        maxSize: partMaxSize = 7,
        minDist: partMinDist = 30,
        maxDist: partMaxDist = 50,
        duration: partDuration = 600,
    } = ePart
    const {
        enabled: tiltEnabled = true,
        maxAngle: tiltAngle = 8,
        speed: tiltSpeedKey = "fast",
    } = eTilt
    const {
        enabled: hoverEnabled = true,
        height: hoverHeight = 6,
        scale: hoverScale = 1.01,
        borderGlow: hoverGlow = true,
    } = eHover
    const cardShadow = eHover?.cardShadow || "none"
    const {
        enabled: shimEnabled = true,
        color: shimColor = "#C9A96E",
        speed: shimSpeed = 1.5,
        angle: shimAngle = 105,
        intensity: shimIntensity = 8,
    } = eShim
    const {
        enabled: pulseEnabled = true,
        innerColor: pulseInner = "#C9A96E",
        outerColor: pulseOuter = "#C9A96E",
        innerIntensity: pulseInnerInt = 15,
        outerIntensity: pulseOuterInt = 30,
        speed: pulseSpeed = 3,
    } = ePulse
    const {
        enabled: floatEnabled = true,
        distance: floatDist = 30,
        duration: floatDur = 600,
        stagger: floatStagger = 70,
    } = eFloat
    const {
        enabled: featEnabled = true,
        distance: featDist = 8,
        duration: featDur = 300,
        stagger: featStagger = 40,
    } = eFeat
    const { enabled: badgeEnabled = true, stiffness: badgeStiff = "medium" } =
        eBadge
    const {
        enabled: glowEnabled = true,
        color: glowColor = "#C9A96E",
        size: glowSize = 600,
        intensity: glowIntensity = 8,
        top: glowTop = 20,
    } = eGlow

    const isStatic = useIsStaticRenderer()

    const _partEnabled = performanceMode || isStatic ? false : partEnabled
    const _tiltEnabled = performanceMode || isStatic ? false : tiltEnabled
    const _shimEnabled = performanceMode || isStatic ? false : shimEnabled

    // ─── VARIANTS ───
    const variants = {
        dark: {
            bg: "#0a0a0c",
            accent: "#C9A96E",
            accentLight: "#E8C98A",
            headline: "#F0EDE8",
            subtext: "rgba(240,237,232,0.5)",
            eyebrow: "#C9A96E",
            cardBg: "rgba(255,255,255,0.03)",
            cardBorder: "rgba(240,237,232,0.08)",
            highlightCardBg: "rgba(201,169,110,0.06)",
            highlightCardBorder: "rgba(201,169,110,0.25)",
            priceHighlight: "#C9A96E",
            priceDefault: "#F0EDE8",
            featureIcon: "#C9A96E",
            featureText: "rgba(240,237,232,0.7)",
            highlightBtn: "#0a0a0c",
            ghostBtn: "#F0EDE8",
            sliderTrack: "rgba(240,237,232,0.12)",
        },
        glass: {
            bg: "linear-gradient(135deg, rgba(15,15,35,0.75) 0%, rgba(10,10,25,0.85) 100%)",
            accent: "#a78bfa",
            accentLight: "#c4b5fd",
            headline: "#ffffff",
            subtext: "rgba(255,255,255,0.65)",
            eyebrow: "#c4b5fd",
            cardBg: "rgba(255,255,255,0.06)",
            cardBorder: "rgba(255,255,255,0.15)",
            highlightCardBg: "rgba(167,139,250,0.12)",
            highlightCardBorder: "rgba(167,139,250,0.4)",
            priceHighlight: "#c4b5fd",
            priceDefault: "#ffffff",
            featureIcon: "#a78bfa",
            featureText: "rgba(255,255,255,0.8)",
            highlightBtn: "#0f0a1e",
            ghostBtn: "#ffffff",
            sliderTrack: "rgba(255,255,255,0.15)",
        },
        minimal: {
            bg: "#fafafa",
            accent: "#18181b",
            accentLight: "#3f3f46",
            headline: "#18181b",
            subtext: "#71717a",
            eyebrow: "#18181b",
            cardBg: "#ffffff",
            cardBorder: "rgba(0,0,0,0.1)",
            highlightCardBg: "#18181b",
            highlightCardBorder: "#18181b",
            priceHighlight: "#ffffff",
            priceDefault: "#18181b",
            featureIcon: "#18181b",
            featureText: "#52525b",
            highlightBtn: "#ffffff",
            ghostBtn: "#18181b",
            sliderTrack: "rgba(0,0,0,0.12)",
        },
        saas: {
            bg: "#f8fafc",
            accent: "#2563eb",
            accentLight: "#3b82f6",
            headline: "#0f172a",
            subtext: "#64748b",
            eyebrow: "#2563eb",
            cardBg: "#ffffff",
            cardBorder: "rgba(15,23,42,0.08)",
            highlightCardBg: "#2563eb",
            highlightCardBorder: "#2563eb",
            priceHighlight: "#ffffff",
            priceDefault: "#0f172a",
            featureIcon: "#2563eb",
            featureText: "#475569",
            highlightBtn: "#ffffff",
            ghostBtn: "#0f172a",
            sliderTrack: "rgba(15,23,42,0.1)",
        },
        bold: {
            bg: "#0f0a1e",
            accent: "#e879f9",
            accentLight: "#f0abfc",
            headline: "#faf5ff",
            subtext: "rgba(250,245,255,0.6)",
            eyebrow: "#e879f9",
            cardBg: "rgba(232,121,249,0.04)",
            cardBorder: "rgba(232,121,249,0.15)",
            highlightCardBg: "rgba(232,121,249,0.1)",
            highlightCardBorder: "rgba(232,121,249,0.4)",
            priceHighlight: "#e879f9",
            priceDefault: "#faf5ff",
            featureIcon: "#e879f9",
            featureText: "rgba(250,245,255,0.75)",
            highlightBtn: "#0f0a1e",
            ghostBtn: "#faf5ff",
            sliderTrack: "rgba(232,121,249,0.15)",
        },
        editorial: {
            bg: "#F5F0E8",
            accent: "#1a1a1a",
            accentLight: "#3d3d3d",
            headline: "#0d0d0d",
            subtext: "#6b6560",
            eyebrow: "#1a1a1a",
            cardBg: "#FDFAF4",
            cardBorder: "rgba(0,0,0,0.09)",
            highlightCardBg: "#0d0d0d",
            highlightCardBorder: "#0d0d0d",
            priceHighlight: "#F5F0E8",
            priceDefault: "#0d0d0d",
            featureIcon: "#1a1a1a",
            featureText: "#4a4540",
            highlightBtn: "#F5F0E8",
            ghostBtn: "#0d0d0d",
            sliderTrack: "rgba(0,0,0,0.1)",
        },
        slate: {
            bg: "#0f1923",
            accent: "#94a3b8",
            accentLight: "#cbd5e1",
            headline: "#f1f5f9",
            subtext: "rgba(241,245,249,0.5)",
            eyebrow: "#94a3b8",
            cardBg: "rgba(148,163,184,0.04)",
            cardBorder: "rgba(148,163,184,0.1)",
            highlightCardBg: "rgba(148,163,184,0.1)",
            highlightCardBorder: "rgba(148,163,184,0.3)",
            priceHighlight: "#cbd5e1",
            priceDefault: "#f1f5f9",
            featureIcon: "#94a3b8",
            featureText: "rgba(241,245,249,0.65)",
            highlightBtn: "#0f1923",
            ghostBtn: "#f1f5f9",
            sliderTrack: "rgba(148,163,184,0.15)",
        },
    }

    const v = variants[styleVariant] || variants.dark

    const C = {
        bg: bgColor || v.bg,
        accent: accentColor || v.accent,
        accentLight: accentColorLight || v.accentLight,
        headline: headlineColor || v.headline,
        subtext: subtextColor || v.subtext,
        eyebrow: eyebrowColor || v.eyebrow,
        cardBg: cardBgColor || v.cardBg,
        cardBorder: cardBorderColor || v.cardBorder,
        highlightCardBg: highlightCardBgColor || v.highlightCardBg,
        highlightCardBorder: highlightCardBorderColor || v.highlightCardBorder,
        priceHighlight: priceHighlightColor || v.priceHighlight,
        priceDefault: priceDefaultColor || v.priceDefault,
        featureIcon: featureIconColor || v.featureIcon,
        featureText: featureTextColor || v.featureText,
        highlightBtn: highlightBtnColor || v.highlightBtn,
        ghostBtn: ghostBtnColor || v.ghostBtn,
        // FIX: separate tokens — these default to accent but can be overridden independently
        italicWord: italicWordColor || accentColor || v.accent,
        toggleKnob: toggleKnobColor || accentColor || v.accent,
        sliderThumb: sliderThumbColor || accentColor || v.accent,
        // FIX: slider track no longer uses cardBorder — uses its own variant token
        sliderTrack: usageSliderTrackColor || v.sliderTrack,
        planDesc: planDescColor || subtextColor || v.subtext,
    }

    // FIX: memoize plans so getTargetPrices / demo useEffect don't re-fire every render
    const plans = useMemo(
        () =>
            [
                {
                    name: plan1Name,
                    desc: plan1Desc,
                    monthly: plan1Monthly,
                    annual: plan1Annual,
                    annualNote: plan1AnnualNote,
                    features: f1.split("\n").filter((f) => f.trim()),
                    cta: plan1CTA,
                    link: plan1Link,
                    highlight: plan1Highlight,
                },
                {
                    name: plan2Name,
                    desc: plan2Desc,
                    monthly: plan2Monthly,
                    annual: plan2Annual,
                    annualNote: plan2AnnualNote,
                    features: f2.split("\n").filter((f) => f.trim()),
                    cta: plan2CTA,
                    link: plan2Link,
                    highlight: plan2Highlight,
                },
                {
                    name: plan3Name,
                    desc: plan3Desc,
                    monthly: plan3Monthly,
                    annual: plan3Annual,
                    annualNote: plan3AnnualNote,
                    features: f3.split("\n").filter((f) => f.trim()),
                    cta: plan3CTA,
                    link: plan3Link,
                    highlight: plan3Highlight,
                },
                {
                    name: plan4Name,
                    desc: plan4Desc,
                    monthly: plan4Monthly,
                    annual: plan4Annual,
                    annualNote: plan4AnnualNote,
                    features: f4.split("\n").filter((f) => f.trim()),
                    cta: plan4CTA,
                    link: plan4Link,
                    highlight: plan4Highlight,
                },
            ].slice(0, Math.max(1, Math.min(4, planCount))),
        [
            plan1Name,
            plan1Desc,
            plan1Monthly,
            plan1Annual,
            plan1AnnualNote,
            f1,
            plan1CTA,
            plan1Link,
            plan1Highlight,
            plan2Name,
            plan2Desc,
            plan2Monthly,
            plan2Annual,
            plan2AnnualNote,
            f2,
            plan2CTA,
            plan2Link,
            plan2Highlight,
            plan3Name,
            plan3Desc,
            plan3Monthly,
            plan3Annual,
            plan3AnnualNote,
            f3,
            plan3CTA,
            plan3Link,
            plan3Highlight,
            plan4Name,
            plan4Desc,
            plan4Monthly,
            plan4Annual,
            plan4AnnualNote,
            f4,
            plan4CTA,
            plan4Link,
            plan4Highlight,
            planCount,
        ]
    )

    const [billing, setBilling] = useState("monthly")
    const [animatingCards, setAnimatingCards] = useState(false)
    const [particles, setParticles] = useState([])
    const [hoveredCard, setHoveredCard] = useState(null)
    const [tilt, setTilt] = useState({})
    const [usageSeats, setUsageSeats] = useState(usageSliderDefault)
    const [reducedMotion, setReducedMotion] = useState(false)
    const [knobActive, setKnobActive] = useState(false)
    const [countingPrices, setCountingPrices] = useState([])
    const [annualNoteVisible, setAnnualNoteVisible] = useState(false)
    // FIX: featKey forces feature list remount on toggle so slide-in animation replays
    const [featKey, setFeatKey] = useState(0)

    const countingRef = useRef([])
    const intervalRef = useRef(null)
    const cardRefs = useRef([])
    const rafRef = useRef(null)
    const demoRef = useRef(null)
    // FIX: stable ref for billing so demo closure doesn't go stale
    const billingRef = useRef("monthly")

    const getMultiplier = useCallback(
        (seats) => {
            if (!showUsageSlider) return 1
            if (usageMultiplier === "linear") return seats
            if (usageMultiplier === "tiered")
                return seats <= 5
                    ? seats
                    : seats <= 20
                      ? Math.round(seats * 0.85)
                      : Math.round(seats * 0.7)
            return 1
        },
        [showUsageSlider, usageMultiplier]
    )

    const getTargetPrices = useCallback(
        (bill, seats) => {
            const mult = getMultiplier(seats)
            return plans.map((p) =>
                Math.round((bill === "monthly" ? p.monthly : p.annual) * mult)
            )
        },
        [plans, getMultiplier]
    )

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReducedMotion(mq.matches)
        const handler = (e) => setReducedMotion(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])

    useEffect(() => {
        const initial = getTargetPrices("monthly", usageSliderDefault)
        countingRef.current = initial
        setCountingPrices(initial)
    }, [planCount])

    const easings = {
        easeOut: (t) => 1 - Math.pow(1 - t, 3),
        easeIn: (t) => t * t * t,
        spring: (t) => 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2.5),
        linear: (t) => t,
    }

    const animatePrices = useCallback(
        (from, to) => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (reducedMotion || !pcEnabled || isStatic) {
                countingRef.current = to
                setCountingPrices([...to])
                return
            }
            const easeFn = easings[pcEasing] || easings.easeOut
            let step = 0
            const fromSnap = [...from]
            intervalRef.current = setInterval(() => {
                step++
                const eased = easeFn(Math.min(step / pcSteps, 1))
                const next = fromSnap.map((f, i) =>
                    Math.round(f + ((to[i] ?? f) - f) * eased)
                )
                countingRef.current = next
                setCountingPrices([...next])
                if (step >= pcSteps) clearInterval(intervalRef.current)
            }, pcDuration / pcSteps)
        },
        [reducedMotion, pcEnabled, pcEasing, pcSteps, pcDuration]
    )

    // FIX: demo useEffect now uses billingRef (stable) instead of billing state, so no stale closure
    useEffect(() => {
        if (!demoMode || isStatic) return
        demoRef.current = setInterval(() => {
            const next = billingRef.current === "monthly" ? "annual" : "monthly"
            billingRef.current = next
            setBilling(next)
            const targets = getTargetPrices(next, usageSeats)
            animatePrices(countingRef.current, targets)
            if (next === "annual") {
                setAnnualNoteVisible(false)
                setTimeout(() => setAnnualNoteVisible(true), pcDuration + 50)
            } else {
                setAnnualNoteVisible(false)
            }
        }, 4000)
        return () => clearInterval(demoRef.current)
    }, [
        demoMode,
        isStatic,
        getTargetPrices,
        animatePrices,
        usageSeats,
        pcDuration,
    ])

    useEffect(
        () => () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (demoRef.current) clearInterval(demoRef.current)
        },
        []
    )

    const spawnParticles = () => {
        if (!_partEnabled || reducedMotion) return
        setParticles(
            Array.from({ length: partCount }, (_, i) => ({
                id: Date.now() + i,
                angle: (i / partCount) * 360,
                distance:
                    partMinDist + Math.random() * (partMaxDist - partMinDist),
                size: partMinSize + Math.random() * (partMaxSize - partMinSize),
            }))
        )
        setTimeout(() => setParticles([]), partDuration)
    }

    const toggle = (value) => {
        if (value === billing) return
        spawnParticles()
        setKnobActive(true)
        setTimeout(() => setKnobActive(false), 150)
        setAnnualNoteVisible(false)
        const targets = getTargetPrices(value, usageSeats)
        setAnimatingCards(true)
        setTimeout(() => {
            billingRef.current = value
            setBilling(value)
            animatePrices(countingRef.current, targets)
            setAnimatingCards(false)
            // FIX: bump featKey so feature slide-in replays
            setFeatKey((k) => k + 1)
            if (value === "annual")
                setTimeout(() => setAnnualNoteVisible(true), pcDuration + 50)
        }, 200)
    }

    const handleUsageChange = (seats) => {
        setUsageSeats(seats)
        animatePrices(countingRef.current, getTargetPrices(billing, seats))
        if (billing === "annual") {
            setAnnualNoteVisible(false)
            setTimeout(() => setAnnualNoteVisible(true), pcDuration + 50)
        }
    }

    const handleMouseMove = useCallback(
        (e, i) => {
            if (!_tiltEnabled || reducedMotion) return
            if (rafRef.current) return
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null
                const card = cardRefs.current[i]
                if (!card) return
                const rect = card.getBoundingClientRect()
                setTilt((prev) => ({
                    ...prev,
                    [i]: {
                        rotateX:
                            ((e.clientY - rect.top - rect.height / 2) /
                                rect.height) *
                            -tiltAngle,
                        rotateY:
                            ((e.clientX - rect.left - rect.width / 2) /
                                rect.width) *
                            tiltAngle,
                    },
                }))
            })
        },
        [_tiltEnabled, reducedMotion, tiltAngle]
    )

    const handleMouseLeave = (i) => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        setTilt((prev) => ({ ...prev, [i]: { rotateX: 0, rotateY: 0 } }))
        setHoveredCard(null)
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            toggle(billing === "monthly" ? "annual" : "monthly")
        }
        if (e.key === "ArrowLeft") toggle("monthly")
        if (e.key === "ArrowRight") toggle("annual")
    }

    const handleCTA = (link) => {
        if (!link) return
        try {
            const url = new URL(link, window.location.href)
            if (url.protocol === "https:" || url.protocol === "http:")
                window.open(url.toString(), "_blank", "noopener,noreferrer")
        } catch {}
    }

    const tiltSpeeds = { fast: 0.1, medium: 0.25, slow: 0.5 }
    const tiltSpeedVal = tiltSpeeds[tiltSpeedKey] || 0.1

    const badgeSprings = {
        soft: "all 0.5s cubic-bezier(0.34,1.4,0.64,1)",
        medium: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        bouncy: "all 0.4s cubic-bezier(0.34,2,0.64,1)",
    }

    const toHex = (n) =>
        Math.round(n * 2.55)
            .toString(16)
            .padStart(2, "0")

    const shouldAnimate = !reducedMotion && !isStatic
    const isGlass = styleVariant === "glass"
    const needsLightTextOnHighlight =
        styleVariant === "minimal" ||
        styleVariant === "saas" ||
        styleVariant === "editorial"

    const renderHeadline = () => {
        const phrase = (headlineItalicWord || "").trim()
        if (!phrase)
            return <span style={{ color: C.headline }}>{headlineText}</span>
        const idx = headlineText.toLowerCase().indexOf(phrase.toLowerCase())
        if (idx === -1)
            return <span style={{ color: C.headline }}>{headlineText}</span>
        const before = headlineText.slice(0, idx)
        const match = headlineText.slice(idx, idx + phrase.length)
        const after = headlineText.slice(idx + phrase.length)
        return (
            <>
                {before && <span style={{ color: C.headline }}>{before}</span>}
                {/* FIX: uses C.italicWord not C.accent */}
                <em
                    style={{
                        fontStyle: "italic",
                        color: C.italicWord,
                        fontFamily: `'${displayFontFamily}', serif`,
                    }}
                >
                    {match}
                </em>
                {after && <span style={{ color: C.headline }}>{after}</span>}
            </>
        )
    }

    // FIX: slider fill percent for the track gradient
    const sliderFillPct =
        ((usageSeats - usageSliderMin) / (usageSliderMax - usageSliderMin)) *
        100

    return (
        <div
            className="pt-wrap"
            style={{
                background: C.bg,
                width: "100%",
                height: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: `${paddingTop}px 0 ${paddingBottom}px`,
                fontFamily: `'${bodyFontFamily}', sans-serif`,
                boxSizing: "border-box",
                overflow: "visible",
                position: "relative",
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: "top center",
            }}
        >
            <style>{`
                *, *::before, *::after { box-sizing:border-box !important; }
                .pt-wrap * { margin:0; padding:0; }
                ${shouldAnimate && floatEnabled ? `@keyframes ptFI{from{opacity:0;transform:translateY(${floatDist}px)}to{opacity:1;transform:translateY(0)}}` : ""}
                ${shouldAnimate && _partEnabled ? `@keyframes ptPt{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0}}` : ""}
                ${shouldAnimate && pulseEnabled ? `@keyframes ptPu{0%,100%{box-shadow:0 0 20px ${pulseInner}${toHex(pulseInnerInt)}}50%{box-shadow:0 0 50px ${pulseOuter}${toHex(pulseOuterInt)}}}` : ""}
                ${shouldAnimate && _shimEnabled ? `@keyframes ptSh{0%{background-position:-200% 0}100%{background-position:200% 0}}` : ""}
                ${shouldAnimate && featEnabled ? `@keyframes ptFe{from{opacity:0;transform:translateX(-${featDist}px)}to{opacity:1;transform:translateX(0)}}` : ""}
                ${
                    shouldAnimate && floatEnabled
                        ? `
                .pt-float{animation:ptFI ${floatDur}ms cubic-bezier(0.34,1.2,0.64,1) both}
                .pt-d0{animation-delay:0ms}.pt-d1{animation-delay:${floatStagger}ms}.pt-d2{animation-delay:${floatStagger * 2}ms}
                .pt-d3{animation-delay:${floatStagger * 3}ms}.pt-d4{animation-delay:${floatStagger * 4}ms}.pt-d5{animation-delay:${floatStagger * 5}ms}
                `
                        : ""
                }
                ${shouldAnimate && featEnabled ? `.pt-feat{animation:ptFe ${featDur}ms ease both}` : ""}
                .pt-btn{transition:opacity 0.2s,transform 0.2s,box-shadow 0.2s !important}
                .pt-btn:hover{opacity:0.82 !important;transform:translateY(-2px) scale(1.01) !important;box-shadow:0 8px 24px ${C.accent}40 !important}
                .pt-track:focus{outline:2px solid ${C.accent};outline-offset:3px;border-radius:100px}
                .pt-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:100px;outline:none;cursor:pointer}
                .pt-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${C.sliderThumb};box-shadow:0 2px 8px ${C.sliderThumb}60;cursor:pointer;transition:transform 0.15s}
                .pt-slider::-webkit-slider-thumb:active{transform:scale(1.2)}
                .pt-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:${C.sliderThumb};border:none;cursor:pointer}
                @supports (backdrop-filter:blur(1px)){.pt-glass-card{backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}}
            `}</style>

            {glowEnabled && (
                <div
                    style={{
                        position: "absolute",
                        top: `${glowTop}%`,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: glowSize,
                        height: glowSize * 0.5,
                        background: `radial-gradient(ellipse,${glowColor}${toHex(glowIntensity)} 0%,transparent 70%)`,
                        pointerEvents: "none",
                        borderRadius: "50%",
                        zIndex: 0,
                    }}
                />
            )}

            {/* Header */}
            <div
                style={{
                    textAlign: "center",
                    marginBottom: headerGap,
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    paddingLeft: paddingH,
                    paddingRight: paddingH,
                    boxSizing: "border-box",
                }}
                className={
                    shouldAnimate && floatEnabled ? "pt-float pt-d0" : ""
                }
            >
                <p
                    style={{
                        fontSize: eyebrowSize,
                        letterSpacing: "0.22em",
                        color: C.eyebrow,
                        fontWeight: 500,
                        marginBottom: 14,
                    }}
                >
                    {eyebrowText}
                </p>
                <h2
                    style={{
                        fontFamily: `'${displayFontFamily}',serif`,
                        fontSize: headlineSize,
                        fontWeight: displayFontWeight,
                        lineHeight: 1.15,
                        marginBottom: 14,
                    }}
                >
                    {renderHeadline()}
                </h2>
                <p
                    style={{
                        fontSize: subtitleSize,
                        color: C.subtext,
                        fontWeight: 300,
                    }}
                >
                    {subtitleText}
                </p>
            </div>

            {/* Toggle row — FIX: position:relative here so badge is positioned relative to this row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: showUsageSlider ? 24 : toggleGap,
                    position: "relative",
                    zIndex: 1,
                    justifyContent: "center",
                    paddingLeft: paddingH,
                    paddingRight: paddingH,
                    width: "100%",
                    boxSizing: "border-box",
                }}
                className={
                    shouldAnimate && floatEnabled ? "pt-float pt-d1" : ""
                }
            >
                <span
                    onClick={() => toggle("monthly")}
                    style={{
                        fontSize: 13,
                        color: billing === "monthly" ? C.headline : C.subtext,
                        cursor: "pointer",
                        transition: "color 0.3s",
                        fontWeight: billing === "monthly" ? 500 : 300,
                    }}
                >
                    {monthlyLabel}
                </span>

                <div
                    className="pt-track"
                    role="switch"
                    aria-checked={billing === "annual"}
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    onClick={() =>
                        toggle(billing === "monthly" ? "annual" : "monthly")
                    }
                    style={{
                        width: 54,
                        height: 28,
                        // FIX: toggle track uses C.toggleKnob (not C.accent) so they can be split
                        background: `${C.toggleKnob}18`,
                        border: `1px solid ${C.toggleKnob}35`,
                        borderRadius: 100,
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 4px",
                        boxShadow: `0 0 20px ${C.toggleKnob}25`,
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: "-40px",
                            pointerEvents: "none",
                            zIndex: 10,
                        }}
                    >
                        {_partEnabled &&
                            particles.map((p) => (
                                <div
                                    key={p.id}
                                    style={{
                                        position: "absolute",
                                        width: p.size,
                                        height: p.size,
                                        borderRadius: "50%",
                                        background: partColor,
                                        top: "50%",
                                        left: "50%",
                                        "--tx": `${Math.cos((p.angle * Math.PI) / 180) * p.distance}px`,
                                        "--ty": `${Math.sin((p.angle * Math.PI) / 180) * p.distance}px`,
                                        animation: `ptPt ${partDuration}ms ease-out forwards`,
                                    }}
                                />
                            ))}
                    </div>
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            // FIX: toggle knob uses C.toggleKnob
                            background: `linear-gradient(135deg,${C.toggleKnob},${C.accentLight})`,
                            boxShadow: `0 2px 16px ${C.toggleKnob}60`,
                            transition:
                                "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
                            transform: `translateX(${billing === "annual" ? 26 : 0}px) scale(${knobActive ? 0.85 : 1})`,
                            flexShrink: 0,
                        }}
                    />
                </div>

                <span
                    onClick={() => toggle("annual")}
                    style={{
                        fontSize: 13,
                        color: billing === "annual" ? C.headline : C.subtext,
                        cursor: "pointer",
                        transition: "color 0.3s",
                        fontWeight: billing === "annual" ? 500 : 300,
                    }}
                >
                    {annualLabel}
                </span>

                {/*
                  FIX: Save badge was using position:absolute left:"calc(100% + 10px)"
                  but that tried to be relative to the toggle track div, not the row.
                  Now it just sits inline in the flex row with marginLeft so it stays
                  visually attached to the "Annual" label without overflowing.
                */}
                <span
                    style={{
                        background: `${saveBadgeColor}18`,
                        border: `1px solid ${saveBadgeColor}30`,
                        color: saveBadgeColor,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        padding: "4px 12px",
                        borderRadius: 100,
                        opacity: billing === "annual" ? 1 : 0,
                        transform: badgeEnabled
                            ? billing === "annual"
                                ? "scale(1) rotate(0deg)"
                                : "scale(0.8) rotate(-5deg)"
                            : "none",
                        transition: badgeEnabled
                            ? badgeSprings[badgeStiff]
                            : "opacity 0.3s",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        marginLeft: 2,
                        display: "inline-block",
                    }}
                >
                    {saveBadgeText}
                </span>
            </div>

            {/* Usage Slider */}
            {showUsageSlider && (
                <div
                    style={{
                        width: "100%",
                        maxWidth: 480,
                        marginBottom: toggleGap,
                        zIndex: 1,
                        paddingLeft: paddingH,
                        paddingRight: paddingH,
                        boxSizing: "border-box",
                    }}
                    className={
                        shouldAnimate && floatEnabled ? "pt-float pt-d2" : ""
                    }
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 10,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                color: C.subtext,
                                fontWeight: 300,
                            }}
                        >
                            {usageSliderLabel}
                        </span>
                        <span
                            style={{
                                fontSize: 13,
                                color: C.headline,
                                fontWeight: 500,
                            }}
                        >
                            {usageSeats} {usageSliderUnit}
                        </span>
                    </div>
                    <input
                        type="range"
                        className="pt-slider"
                        min={usageSliderMin}
                        max={usageSliderMax}
                        value={usageSeats}
                        onChange={(e) =>
                            handleUsageChange(Number(e.target.value))
                        }
                        style={{
                            // FIX: uses C.sliderThumb for fill, C.sliderTrack for empty — not C.accent or C.cardBorder
                            background: `linear-gradient(to right,${C.sliderThumb} 0%,${C.sliderThumb} ${sliderFillPct}%,${C.sliderTrack} ${sliderFillPct}%,${C.sliderTrack} 100%)`,
                        }}
                    />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 6,
                        }}
                    >
                        <span style={{ fontSize: 11, color: C.subtext }}>
                            {usageSliderMin}
                        </span>
                        <span style={{ fontSize: 11, color: C.subtext }}>
                            {usageSliderMax}
                        </span>
                    </div>
                </div>
            )}

            {/* Cards */}
            <div
                style={{
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "visible",
                    position: "relative",
                    zIndex: 1,
                    boxSizing: "border-box",
                    marginTop: -24,
                    paddingTop: 24,
                    marginBottom: -32,
                    paddingBottom: 32,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        gap: cardGap,
                        paddingLeft: paddingH,
                        paddingRight: paddingH,
                        paddingTop: 24,
                        paddingBottom: 32,
                        boxSizing: "border-box",
                        width: "max-content",
                        minWidth: "100%",
                    }}
                >
                    {plans.map((plan, i) => {
                        const t = tilt[i] || { rotateX: 0, rotateY: 0 }
                        const isHovered = hoveredCard === i
                        const price =
                            countingPrices[i] ??
                            (billing === "monthly" ? plan.monthly : plan.annual)
                        const highlightTextOverride =
                            needsLightTextOnHighlight && plan.highlight
                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    cardRefs.current[i] = el
                                }}
                                className={
                                    shouldAnimate && floatEnabled
                                        ? `pt-float pt-d${i + (showUsageSlider ? 3 : 2)}`
                                        : ""
                                }
                                onMouseMove={(e) => handleMouseMove(e, i)}
                                onMouseEnter={() => setHoveredCard(i)}
                                onMouseLeave={() => handleMouseLeave(i)}
                                style={{
                                    flex: `0 0 ${cardWidth}px`,
                                    width: cardWidth,
                                    perspective: _tiltEnabled ? 1000 : "none",
                                    opacity: animatingCards ? 0 : 1,
                                    transform: animatingCards
                                        ? "translateY(12px)"
                                        : "translateY(0)",
                                    transition: `opacity 0.22s ease ${i * 0.05}s, transform 0.22s ease ${i * 0.05}s`,
                                    zIndex: plan.highlight ? 2 : 1,
                                }}
                            >
                                <div
                                    className={isGlass ? "pt-glass-card" : ""}
                                    style={{
                                        background: plan.highlight
                                            ? C.highlightCardBg
                                            : C.cardBg,
                                        border: `1px solid ${plan.highlight ? C.highlightCardBorder : hoverEnabled && hoverGlow && isHovered ? `${C.accent}35` : C.cardBorder}`,
                                        borderRadius: cardBorderRadius,
                                        padding: `${cardPaddingV}px ${cardPaddingH}px`,
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative",
                                        height: "auto",
                                        transform: shouldAnimate
                                            ? [
                                                  _tiltEnabled
                                                      ? `rotateX(${t.rotateX}deg) rotateY(${t.rotateY}deg)`
                                                      : "",
                                                  hoverEnabled && isHovered
                                                      ? `translateY(-${hoverHeight}px) scale(${hoverScale})`
                                                      : "",
                                              ]
                                                  .filter(Boolean)
                                                  .join(" ") || "none"
                                            : "none",
                                        transition: `transform ${isHovered ? `${tiltSpeedVal}s` : "0.5s cubic-bezier(0.34,1.2,0.64,1)"}, box-shadow 0.3s, border-color 0.3s`,
                                        boxShadow:
                                            plan.highlight && !pulseEnabled
                                                ? isHovered
                                                    ? `0 30px 80px ${C.accent}25`
                                                    : `0 0 60px ${C.accent}10`
                                                : cardShadow,
                                        animation:
                                            plan.highlight &&
                                            pulseEnabled &&
                                            shouldAnimate
                                                ? `ptPu ${pulseSpeed}s ease infinite`
                                                : "none",
                                    }}
                                >
                                    {plan.highlight && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: -12,
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                background: `linear-gradient(135deg,${C.accent},${C.accentLight})`,
                                                color: C.highlightBtn,
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: "0.15em",
                                                padding: "5px 16px",
                                                borderRadius: 100,
                                                boxShadow: `0 4px 20px ${C.accent}50`,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {popularBadgeText}
                                            {shouldAnimate && _shimEnabled && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: `linear-gradient(${shimAngle}deg,transparent 30%,rgba(255,255,255,0.4) 50%,transparent 70%)`,
                                                        backgroundSize:
                                                            "200% 100%",
                                                        animation: `ptSh ${shimSpeed * 2}s infinite`,
                                                        borderRadius: 100,
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {shouldAnimate &&
                                        _shimEnabled &&
                                        plan.highlight &&
                                        isHovered && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    borderRadius:
                                                        cardBorderRadius,
                                                    background: `linear-gradient(${shimAngle}deg,transparent 40%,${shimColor}${toHex(shimIntensity)} 50%,transparent 60%)`,
                                                    backgroundSize: "200% 100%",
                                                    animation: `ptSh ${shimSpeed}s infinite`,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}

                                    <p
                                        style={{
                                            fontFamily: `'${displayFontFamily}',serif`,
                                            fontSize: planNameSize,
                                            fontWeight: displayFontWeight,
                                            color: highlightTextOverride
                                                ? "#ffffff"
                                                : C.headline,
                                            marginBottom: 6,
                                        }}
                                    >
                                        {plan.name}
                                    </p>

                                    {/* FIX: plan desc now uses C.planDesc color and planDescSize */}
                                    <p
                                        style={{
                                            fontSize: planDescSize,
                                            color: highlightTextOverride
                                                ? "rgba(255,255,255,0.7)"
                                                : C.planDesc,
                                            fontWeight: 300,
                                            marginBottom: 26,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {plan.desc}
                                    </p>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 3,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 18,
                                                color: highlightTextOverride
                                                    ? "rgba(255,255,255,0.6)"
                                                    : C.subtext,
                                                fontWeight: 300,
                                                marginTop: 10,
                                            }}
                                        >
                                            {currencySymbol}
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: `'${displayFontFamily}',serif`,
                                                fontSize: priceSize,
                                                fontWeight: 600,
                                                lineHeight: 1,
                                                letterSpacing: "-0.02em",
                                                color: plan.highlight
                                                    ? C.priceHighlight
                                                    : C.priceDefault,
                                                transition: "color 0.3s",
                                            }}
                                        >
                                            {price}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: highlightTextOverride
                                                    ? "rgba(255,255,255,0.6)"
                                                    : C.subtext,
                                                fontWeight: 300,
                                                alignSelf: "flex-end",
                                                marginBottom: 10,
                                            }}
                                        >
                                            {perPeriodLabel}
                                        </span>
                                    </div>

                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: highlightTextOverride
                                                ? "rgba(255,255,255,0.5)"
                                                : `${C.headline}50`,
                                            marginBottom: 2,
                                            opacity: annualNoteVisible ? 1 : 0,
                                            transition: `opacity ${pcDuration * 0.6}ms ease`,
                                            height: 14,
                                        }}
                                    >
                                        {plan.annualNote}
                                    </p>

                                    {showUsageSlider && (
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: C.accent,
                                                marginBottom: 2,
                                                height: 14,
                                            }}
                                        >
                                            for {usageSeats} {usageSliderUnit}
                                        </p>
                                    )}

                                    <div
                                        style={{
                                            height: 1,
                                            background: highlightTextOverride
                                                ? "rgba(255,255,255,0.15)"
                                                : `${C.headline}08`,
                                            margin: "20px 0",
                                        }}
                                    />

                                    {/* FIX: featKey forces remount so slide-in animation replays on billing toggle */}
                                    <ul
                                        key={featKey}
                                        style={{
                                            listStyle: "none",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                            marginBottom: 28,
                                            padding: 0,
                                        }}
                                    >
                                        {plan.features.map((f, j) => (
                                            <li
                                                key={j}
                                                className={
                                                    shouldAnimate && featEnabled
                                                        ? "pt-feat"
                                                        : ""
                                                }
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 9,
                                                    fontSize: featureSize,
                                                    color: highlightTextOverride
                                                        ? "rgba(255,255,255,0.85)"
                                                        : C.featureText,
                                                    fontWeight: 300,
                                                    animationDelay: `${j * featStagger}ms`,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: highlightTextOverride
                                                            ? "rgba(255,255,255,0.9)"
                                                            : C.featureIcon,
                                                        fontSize: 7,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {featureIcon}
                                                </span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className="pt-btn"
                                        onClick={() => handleCTA(plan.link)}
                                        aria-label={`${plan.cta} — ${plan.name} plan`}
                                        style={{
                                            width: "100%",
                                            padding: "14px",
                                            borderRadius: 10,
                                            fontSize: ctaSize,
                                            fontWeight: 500,
                                            letterSpacing: "0.07em",
                                            cursor: "pointer",
                                            border: "none",
                                            fontFamily: `'${bodyFontFamily}',sans-serif`,
                                            background: plan.highlight
                                                ? `linear-gradient(135deg,${C.accent},${C.accentLight})`
                                                : `${C.headline}06`,
                                            color: plan.highlight
                                                ? C.highlightBtn
                                                : C.ghostBtn,
                                            outline: plan.highlight
                                                ? "none"
                                                : `1px solid ${C.headline}12`,
                                            boxShadow: plan.highlight
                                                ? `0 4px 20px ${C.accent}30`
                                                : "none",
                                        }}
                                    >
                                        {plan.cta}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <p
                style={{
                    marginTop: 44,
                    fontSize: 12,
                    color: `${C.headline}25`,
                    fontWeight: 300,
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                    paddingLeft: paddingH,
                    paddingRight: paddingH,
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                {footerText}
            </p>
        </div>
    )
}

addPropertyControls(PricingToggle, {
    styleVariant: {
        type: ControlType.Enum,
        title: "🎨 Style",
        options: [
            "dark",
            "glass",
            "minimal",
            "saas",
            "bold",
            "editorial",
            "slate",
        ],
        optionTitles: [
            "Dark Luxury",
            "Glass",
            "Minimal",
            "SaaS Clean",
            "Bold",
            "Editorial",
            "Slate",
        ],
        defaultValue: "dark",
    },
    demoMode: {
        type: ControlType.Boolean,
        title: "🎬 Demo Mode",
        defaultValue: false,
    },
    performanceMode: {
        type: ControlType.Boolean,
        title: "⚡ Performance Mode",
        defaultValue: false,
    },
    planCount: {
        type: ControlType.Number,
        title: "📦 Plan Count",
        defaultValue: 3,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    planNames: {
        type: ControlType.Object,
        title: "Plan Names",
        controls: {
            plan1Name: {
                type: ControlType.String,
                title: "Plan 1 Name",
                defaultValue: "Essential",
            },
            plan1Desc: {
                type: ControlType.String,
                title: "Plan 1 Desc",
                defaultValue: "For creators just starting out",
            },
            plan2Name: {
                type: ControlType.String,
                title: "Plan 2 Name",
                defaultValue: "Signature",
            },
            plan2Desc: {
                type: ControlType.String,
                title: "Plan 2 Desc",
                defaultValue: "For professionals who mean business",
            },
            plan3Name: {
                type: ControlType.String,
                title: "Plan 3 Name",
                defaultValue: "Bespoke",
            },
            plan3Desc: {
                type: ControlType.String,
                title: "Plan 3 Desc",
                defaultValue: "For studios and agencies",
            },
            plan4Name: {
                type: ControlType.String,
                title: "Plan 4 Name",
                defaultValue: "Enterprise",
            },
            plan4Desc: {
                type: ControlType.String,
                title: "Plan 4 Desc",
                defaultValue: "For large organizations",
            },
        },
    },
    planPrices: {
        type: ControlType.Object,
        title: "Plan Prices",
        controls: {
            plan1Monthly: {
                type: ControlType.Number,
                title: "Plan 1 Monthly",
                defaultValue: 29,
                min: 0,
            },
            plan1Annual: {
                type: ControlType.Number,
                title: "Plan 1 Annual",
                defaultValue: 19,
                min: 0,
            },
            plan2Monthly: {
                type: ControlType.Number,
                title: "Plan 2 Monthly",
                defaultValue: 79,
                min: 0,
            },
            plan2Annual: {
                type: ControlType.Number,
                title: "Plan 2 Annual",
                defaultValue: 59,
                min: 0,
            },
            plan3Monthly: {
                type: ControlType.Number,
                title: "Plan 3 Monthly",
                defaultValue: 149,
                min: 0,
            },
            plan3Annual: {
                type: ControlType.Number,
                title: "Plan 3 Annual",
                defaultValue: 109,
                min: 0,
            },
            plan4Monthly: {
                type: ControlType.Number,
                title: "Plan 4 Monthly",
                defaultValue: 299,
                min: 0,
            },
            plan4Annual: {
                type: ControlType.Number,
                title: "Plan 4 Annual",
                defaultValue: 229,
                min: 0,
            },
        },
    },
    planNotes: {
        type: ControlType.Object,
        title: "Annual Notes",
        controls: {
            plan1AnnualNote: {
                type: ControlType.String,
                title: "Plan 1",
                defaultValue: "Billed $228/year",
            },
            plan2AnnualNote: {
                type: ControlType.String,
                title: "Plan 2",
                defaultValue: "Billed $708/year",
            },
            plan3AnnualNote: {
                type: ControlType.String,
                title: "Plan 3",
                defaultValue: "Billed $1,308/year",
            },
            plan4AnnualNote: {
                type: ControlType.String,
                title: "Plan 4",
                defaultValue: "Billed $2,748/year",
            },
        },
    },
    planFeatures: {
        type: ControlType.Object,
        title: "Plan Features",
        controls: {
            plan1Features: {
                type: ControlType.String,
                title: "Plan 1",
                defaultValue:
                    "3 active projects\nBasic analytics\nEmail support\n2GB storage\nCommunity access",
                displayTextArea: true,
            },
            plan2Features: {
                type: ControlType.String,
                title: "Plan 2",
                defaultValue:
                    "Unlimited projects\nAdvanced analytics\nPriority support\n50GB storage\nCustom domain\nTeam collaboration",
                displayTextArea: true,
            },
            plan3Features: {
                type: ControlType.String,
                title: "Plan 3",
                defaultValue:
                    "Everything in Signature\nWhite-label exports\nDedicated manager\n500GB storage\nAPI access\nCustom contracts",
                displayTextArea: true,
            },
            plan4Features: {
                type: ControlType.String,
                title: "Plan 4",
                defaultValue:
                    "Everything in Bespoke\nUnlimited seats\nSLA guarantee\nCustom integrations\nDedicated infra\nSecurity review",
                displayTextArea: true,
            },
        },
    },
    planCTAs: {
        type: ControlType.Object,
        title: "Plan Buttons",
        controls: {
            plan1CTA: {
                type: ControlType.String,
                title: "Plan 1 Label",
                defaultValue: "Start Free Trial",
            },
            plan2CTA: {
                type: ControlType.String,
                title: "Plan 2 Label",
                defaultValue: "Get Started",
            },
            plan3CTA: {
                type: ControlType.String,
                title: "Plan 3 Label",
                defaultValue: "Contact Us",
            },
            plan4CTA: {
                type: ControlType.String,
                title: "Plan 4 Label",
                defaultValue: "Talk to Sales",
            },
        },
    },
    planLinks: {
        type: ControlType.Object,
        title: "Plan Links",
        controls: {
            plan1Link: {
                type: ControlType.Link,
                title: "Plan 1",
                defaultValue: "",
            },
            plan2Link: {
                type: ControlType.Link,
                title: "Plan 2",
                defaultValue: "",
            },
            plan3Link: {
                type: ControlType.Link,
                title: "Plan 3",
                defaultValue: "",
            },
            plan4Link: {
                type: ControlType.Link,
                title: "Plan 4",
                defaultValue: "",
            },
        },
    },
    planHighlights: {
        type: ControlType.Object,
        title: "Highlighted Plan",
        controls: {
            plan1Highlight: {
                type: ControlType.Boolean,
                title: "Plan 1",
                defaultValue: false,
            },
            plan2Highlight: {
                type: ControlType.Boolean,
                title: "Plan 2",
                defaultValue: true,
            },
            plan3Highlight: {
                type: ControlType.Boolean,
                title: "Plan 3",
                defaultValue: false,
            },
            plan4Highlight: {
                type: ControlType.Boolean,
                title: "Plan 4",
                defaultValue: false,
            },
        },
    },
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            eyebrowText: {
                type: ControlType.String,
                title: "Eyebrow",
                defaultValue: "PRICING",
            },
            headlineText: {
                type: ControlType.String,
                title: "Headline",
                defaultValue: "Simple, transparent pricing.",
                displayTextArea: true,
            },
            headlineItalicWord: {
                type: ControlType.String,
                title: "Italic Word",
                defaultValue: "",
                placeholder: "One word from headline",
            },
            subtitleText: {
                type: ControlType.String,
                title: "Subtitle",
                defaultValue: "No hidden fees. No surprises. Cancel anytime.",
                displayTextArea: true,
            },
            footerText: {
                type: ControlType.String,
                title: "Footer",
                defaultValue:
                    "All plans include a 14-day free trial · No credit card required",
                displayTextArea: true,
            },
            monthlyLabel: {
                type: ControlType.String,
                title: "Monthly Label",
                defaultValue: "Monthly",
            },
            annualLabel: {
                type: ControlType.String,
                title: "Annual Label",
                defaultValue: "Annual",
            },
            saveBadgeText: {
                type: ControlType.String,
                title: "Save Badge Text",
                defaultValue: "Save 25%",
            },
            currencySymbol: {
                type: ControlType.String,
                title: "Currency Symbol",
                defaultValue: "$",
                placeholder: "$ € £ ¥ ₦",
            },
            perPeriodLabel: {
                type: ControlType.String,
                title: "Per Period",
                defaultValue: "/mo",
            },
            popularBadgeText: {
                type: ControlType.String,
                title: "Popular Badge",
                defaultValue: "MOST POPULAR",
            },
            featureIcon: {
                type: ControlType.String,
                title: "Feature Icon",
                defaultValue: "✦",
            },
        },
    },
    usageSlider: {
        type: ControlType.Object,
        title: "Usage Slider",
        controls: {
            showUsageSlider: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: false,
            },
            usageSliderLabel: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Team size",
            },
            usageSliderUnit: {
                type: ControlType.String,
                title: "Unit",
                defaultValue: "seats",
            },
            usageSliderMin: {
                type: ControlType.Number,
                title: "Min",
                defaultValue: 1,
                min: 1,
            },
            usageSliderMax: {
                type: ControlType.Number,
                title: "Max",
                defaultValue: 100,
                min: 2,
            },
            usageSliderDefault: {
                type: ControlType.Number,
                title: "Default",
                defaultValue: 1,
                min: 1,
            },
            usageMultiplier: {
                type: ControlType.Enum,
                title: "Pricing Model",
                options: ["linear", "tiered", "flat"],
                optionTitles: ["Linear (×seats)", "Tiered (discounts)", "Flat"],
                defaultValue: "linear",
            },
        },
    },
    spacing: {
        type: ControlType.Object,
        title: "Spacing",
        controls: {
            paddingTop: {
                type: ControlType.Number,
                title: "Top Padding",
                defaultValue: 60,
                min: 0,
                max: 200,
                unit: "px",
            },
            paddingBottom: {
                type: ControlType.Number,
                title: "Bottom Padding",
                defaultValue: 60,
                min: 0,
                max: 200,
                unit: "px",
            },
            paddingH: {
                type: ControlType.Number,
                title: "Left & Right Padding (text only)",
                defaultValue: 24,
                min: 0,
                max: 200,
                unit: "px",
            },
            cardGap: {
                type: ControlType.Number,
                title: "Gap Between Cards",
                defaultValue: 24,
                min: 0,
                max: 120,
                unit: "px",
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                defaultValue: 280,
                min: 160,
                max: 500,
                unit: "px",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 1,
                min: 0.5,
                max: 1.5,
                step: 0.05,
            },
            cardPaddingH: {
                type: ControlType.Number,
                title: "Inside Card — Left & Right",
                defaultValue: 30,
                min: 0,
                max: 80,
                unit: "px",
            },
            cardPaddingV: {
                type: ControlType.Number,
                title: "Inside Card — Top & Bottom",
                defaultValue: 34,
                min: 0,
                max: 80,
                unit: "px",
            },
            headerGap: {
                type: ControlType.Number,
                title: "Header to Toggle Gap",
                defaultValue: 48,
                min: 0,
                max: 120,
                unit: "px",
            },
            toggleGap: {
                type: ControlType.Number,
                title: "Toggle to Cards Gap",
                defaultValue: 52,
                min: 0,
                max: 120,
                unit: "px",
            },
            cardBorderRadius: {
                type: ControlType.Number,
                title: "Card Corner Radius",
                defaultValue: 18,
                min: 0,
                max: 40,
                unit: "px",
            },
        },
    },
    colorOverrides: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent (global)",
                defaultValue: "",
            },
            accentColorLight: {
                type: ControlType.Color,
                title: "Accent Light",
                defaultValue: "",
            },
            headlineColor: {
                type: ControlType.Color,
                title: "Headline Text",
                defaultValue: "",
            },
            subtextColor: {
                type: ControlType.Color,
                title: "Subtext",
                defaultValue: "",
            },
            eyebrowColor: {
                type: ControlType.Color,
                title: "Eyebrow",
                defaultValue: "",
            },
            cardBgColor: {
                type: ControlType.Color,
                title: "Card Background",
                defaultValue: "",
            },
            cardBorderColor: {
                type: ControlType.Color,
                title: "Card Border",
                defaultValue: "",
            },
            highlightCardBgColor: {
                type: ControlType.Color,
                title: "Highlight Card Bg",
                defaultValue: "",
            },
            highlightCardBorderColor: {
                type: ControlType.Color,
                title: "Highlight Card Border",
                defaultValue: "",
            },
            priceHighlightColor: {
                type: ControlType.Color,
                title: "Price (Highlighted)",
                defaultValue: "",
            },
            priceDefaultColor: {
                type: ControlType.Color,
                title: "Price (Default)",
                defaultValue: "",
            },
            featureIconColor: {
                type: ControlType.Color,
                title: "Feature Icon",
                defaultValue: "",
            },
            featureTextColor: {
                type: ControlType.Color,
                title: "Feature Text",
                defaultValue: "",
            },
            highlightBtnColor: {
                type: ControlType.Color,
                title: "Highlight Button Text",
                defaultValue: "",
            },
            ghostBtnColor: {
                type: ControlType.Color,
                title: "Ghost Button Text",
                defaultValue: "",
            },
            saveBadgeColor: {
                type: ControlType.Color,
                title: "Save Badge",
                defaultValue: "#8A9E8C",
            },
            // FIX: new independent color overrides
            italicWordColor: {
                type: ControlType.Color,
                title: "Italic Word Color",
                defaultValue: "",
            },
            toggleKnobColor: {
                type: ControlType.Color,
                title: "Toggle Knob Color",
                defaultValue: "",
            },
            sliderThumbColor: {
                type: ControlType.Color,
                title: "Slider Fill & Thumb",
                defaultValue: "",
            },
            usageSliderTrackColor: {
                type: ControlType.Color,
                title: "Slider Empty Track",
                defaultValue: "",
            },
            planDescColor: {
                type: ControlType.Color,
                title: "Plan Description Color",
                defaultValue: "",
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            displayFont: {
                type: ControlType.Font,
                title: "Display Font",
                controls: "extended",
                defaultFontType: "serif",
                defaultValue: {
                    fontFamily: "Playfair Display",
                    fontWeight: "400",
                },
            },
            bodyFont: {
                type: ControlType.Font,
                title: "Body Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontFamily: "Inter", fontWeight: "300" },
            },
            eyebrowSize: {
                type: ControlType.Number,
                title: "Eyebrow Size",
                defaultValue: 11,
                min: 8,
                max: 24,
                unit: "px",
            },
            headlineSize: {
                type: ControlType.Number,
                title: "Headline Size",
                defaultValue: 44,
                min: 20,
                max: 80,
                unit: "px",
            },
            subtitleSize: {
                type: ControlType.Number,
                title: "Subtitle Size",
                defaultValue: 14,
                min: 10,
                max: 24,
                unit: "px",
            },
            planNameSize: {
                type: ControlType.Number,
                title: "Plan Name Size",
                defaultValue: 21,
                min: 12,
                max: 40,
                unit: "px",
            },
            // FIX: new plan description size control
            planDescSize: {
                type: ControlType.Number,
                title: "Plan Desc Size",
                defaultValue: 12,
                min: 9,
                max: 20,
                unit: "px",
            },
            priceSize: {
                type: ControlType.Number,
                title: "Price Size",
                defaultValue: 54,
                min: 24,
                max: 100,
                unit: "px",
            },
            featureSize: {
                type: ControlType.Number,
                title: "Feature Size",
                defaultValue: 12,
                min: 10,
                max: 20,
                unit: "px",
            },
            ctaSize: {
                type: ControlType.Number,
                title: "Button Size",
                defaultValue: 12,
                min: 10,
                max: 20,
                unit: "px",
            },
        },
    },
    effectPriceCounter: {
        type: ControlType.Object,
        title: "✨ Price Counter",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 400,
                min: 100,
                max: 2000,
                unit: "ms",
            },
            steps: {
                type: ControlType.Number,
                title: "Steps",
                defaultValue: 20,
                min: 5,
                max: 60,
            },
            easing: {
                type: ControlType.Enum,
                title: "Easing",
                options: ["easeOut", "easeIn", "spring", "linear"],
                optionTitles: ["Ease Out", "Ease In", "Spring", "Linear"],
                defaultValue: "easeOut",
            },
        },
    },
    effectParticles: {
        type: ControlType.Object,
        title: "✨ Particle Burst",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            count: {
                type: ControlType.Number,
                title: "Count",
                defaultValue: 12,
                min: 4,
                max: 30,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#C9A96E",
            },
            minSize: {
                type: ControlType.Number,
                title: "Min Size",
                defaultValue: 3,
                min: 1,
                max: 10,
                unit: "px",
            },
            maxSize: {
                type: ControlType.Number,
                title: "Max Size",
                defaultValue: 7,
                min: 2,
                max: 20,
                unit: "px",
            },
            minDist: {
                type: ControlType.Number,
                title: "Min Distance",
                defaultValue: 30,
                min: 10,
                max: 80,
                unit: "px",
            },
            maxDist: {
                type: ControlType.Number,
                title: "Max Distance",
                defaultValue: 50,
                min: 20,
                max: 120,
                unit: "px",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 600,
                min: 200,
                max: 2000,
                unit: "ms",
            },
        },
    },
    effectTilt: {
        type: ControlType.Object,
        title: "✨ 3D Card Tilt",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            maxAngle: {
                type: ControlType.Number,
                title: "Max Angle",
                defaultValue: 8,
                min: 1,
                max: 20,
                unit: "°",
            },
            speed: {
                type: ControlType.Enum,
                title: "Speed",
                options: ["fast", "medium", "slow"],
                optionTitles: ["Fast", "Medium", "Slow"],
                defaultValue: "fast",
                displaySegmentedControl: true,
            },
        },
    },
    effectHoverLift: {
        type: ControlType.Object,
        title: "✨ Hover Lift",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            height: {
                type: ControlType.Number,
                title: "Lift Height",
                defaultValue: 6,
                min: 0,
                max: 30,
                unit: "px",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 1.01,
                min: 1,
                max: 1.2,
                step: 0.005,
            },
            cardShadow: {
                type: ControlType.BoxShadow,
                title: "Card Shadow",
                defaultValue: "none",
            },
            borderGlow: {
                type: ControlType.Boolean,
                title: "Border Glow",
                defaultValue: true,
            },
        },
    },
    effectShimmer: {
        type: ControlType.Object,
        title: "✨ Shimmer",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#C9A96E",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 8,
                min: 1,
                max: 30,
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 105,
                min: 0,
                max: 180,
                unit: "°",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1.5,
                min: 0.5,
                max: 5,
                step: 0.1,
                unit: "s",
            },
        },
    },
    effectPulse: {
        type: ControlType.Object,
        title: "✨ Pulse Glow",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            innerColor: {
                type: ControlType.Color,
                title: "Inner Color",
                defaultValue: "#C9A96E",
            },
            innerIntensity: {
                type: ControlType.Number,
                title: "Inner Intensity",
                defaultValue: 15,
                min: 1,
                max: 60,
            },
            outerColor: {
                type: ControlType.Color,
                title: "Outer Color",
                defaultValue: "#C9A96E",
            },
            outerIntensity: {
                type: ControlType.Number,
                title: "Outer Intensity",
                defaultValue: 30,
                min: 1,
                max: 80,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 3,
                min: 0.5,
                max: 10,
                step: 0.5,
                unit: "s",
            },
        },
    },
    effectFloatIn: {
        type: ControlType.Object,
        title: "✨ Float In",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            distance: {
                type: ControlType.Number,
                title: "Distance",
                defaultValue: 30,
                min: 5,
                max: 100,
                unit: "px",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 600,
                min: 100,
                max: 2000,
                unit: "ms",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 70,
                min: 0,
                max: 300,
                unit: "ms",
            },
        },
    },
    effectFeatureSlide: {
        type: ControlType.Object,
        title: "✨ Feature Slide",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            distance: {
                type: ControlType.Number,
                title: "Distance",
                defaultValue: 8,
                min: 2,
                max: 40,
                unit: "px",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 300,
                min: 100,
                max: 1000,
                unit: "ms",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 40,
                min: 0,
                max: 200,
                unit: "ms",
            },
        },
    },
    effectBadge: {
        type: ControlType.Object,
        title: "✨ Badge Spring",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            stiffness: {
                type: ControlType.Enum,
                title: "Stiffness",
                options: ["soft", "medium", "bouncy"],
                optionTitles: ["Soft", "Medium", "Bouncy"],
                defaultValue: "medium",
                displaySegmentedControl: true,
            },
        },
    },
    effectGlow: {
        type: ControlType.Object,
        title: "✨ Ambient Glow",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#C9A96E",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 600,
                min: 100,
                max: 1200,
                unit: "px",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 8,
                min: 1,
                max: 40,
            },
            top: {
                type: ControlType.Number,
                title: "Position",
                defaultValue: 20,
                min: 0,
                max: 80,
                unit: "%",
            },
        },
    },
})
