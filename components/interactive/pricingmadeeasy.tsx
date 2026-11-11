import * as React from "react"
import { createPortal } from "react-dom"
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
 * PricingMadeEasy_Interactive — Interactive pricing component
 *
 * Configurable pricing plans, billing periods, currencies, and feature comparisons.
 * Designed for responsive layouts in Framer.
 */

type Row = { label: string; values: string[]; hint: string }
type Group = { name: string; rows: Row[] }

// Feature definitions and parsing

const featureDefaults = `# Core features
Projects | 1 | 5 | Unlimited | Unlimited | Number of active projects
Cloud storage | 1 GB | 20 GB | 100 GB | Unlimited
Team members | 1 | 3 | 10 | Unlimited
# Advanced
API access | No | No | Yes | Yes
Automations | No | 5/month | 25/month | Unlimited
Custom integrations | No | No | Yes | Yes
# Support
Email support | Yes | Yes | Yes | Yes
Priority support | No | No | Yes | Yes
Dedicated manager | No | No | No | Yes`

const parseFeatures = (input: string, retry = true): Group[] => {
    const groups: Group[] = []
    for (const raw of String(input || featureDefaults).split(/\r?\n/)) {
        const line = raw.trim()
        if (!line) continue
        if (line.startsWith("#")) {
            groups.push({ name: line.replace(/^#+\s*/, ""), rows: [] })
        } else {
            const parts = line.split("|").map((x) => x.trim())
            if (parts.length >= 5) {
                if (!groups.length) groups.push({ name: "Features", rows: [] })
                groups[groups.length - 1].rows.push({
                    label: parts[0],
                    values: parts.slice(1, 5),
                    hint: parts.slice(5).join(" | ") || "",
                })
            }
        }
    }
    const filled = groups.filter((g) => g.rows.length)
    return filled.length || !retry
        ? filled
        : parseFeatures(featureDefaults, false)
}

// Theme palettes and shared utilities

type Palette = {
    bg: string
    card: string
    text: string
    muted: string
    border: string
    accent: string
    accent2: string
}

const palettes: Record<string, Palette> = {
    Midnight: {
        bg: "#100E18",
        card: "#1B1728",
        text: "#F8F5FF",
        muted: "#B6AFC8",
        border: "#3A314B",
        accent: "#9A5DF2",
        accent2: "#E64AAE",
    },
    Aurora: {
        bg: "#071C24",
        card: "#102A32",
        text: "#F0FFFC",
        muted: "#B5D5D2",
        border: "#2A5258",
        accent: "#14B8A6",
        accent2: "#4C9FFF",
    },
    Sunset: {
        bg: "#21121A",
        card: "#2F1C28",
        text: "#FFF8F7",
        muted: "#E1BBC6",
        border: "#68404E",
        accent: "#E65B8B",
        accent2: "#F5A64A",
    },
    Frost: {
        bg: "#F4F5FA",
        card: "#FFFFFF",
        text: "#17172B",
        muted: "#5B6172",
        border: "#DDE0EB",
        accent: "#6755E8",
        accent2: "#C050B8",
    },
}

const clamp = (n: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, n))

/** Number coercion that treats empty / null / non-numeric values as "missing". */
const valid = (n: any, fallback: number) => {
    if (n === "" || n === null || n === undefined || typeof n === "boolean")
        return fallback
    const x = Number(n)
    return Number.isFinite(x) ? x : fallback
}

/** Returns true/false for light/dark, or null when the colour can't be parsed. */
const isLightColor = (input: any, depth = 0): boolean | null => {
    const s = String(input ?? "").trim()
    if (!s) return null
    let channels: number[] | null = null
    const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s)
    if (hex) {
        let h = hex[1]
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
    } else {
        const m = /^rgba?\(\s*([^)]*)\)$/i.exec(s)
        if (m) {
            const raw = m[1]
                .replace(/\s*\/\s*/, " ")
                .replace(/,/g, " ")
                .trim()
                .split(/\s+/)
            if (
                raw.length >= 3 &&
                raw
                    .slice(0, 3)
                    .every((v) => /^(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(v))
            ) {
                channels = raw
                    .slice(0, 3)
                    .map((v) =>
                        v.endsWith("%")
                            ? Number(v.slice(0, -1)) * 2.55
                            : Number(v)
                    )
            }
        }
        if (!channels) {
            const v = /^var\([^,]+,\s*(.+)\)$/i.exec(s)
            return v && depth < 3 ? isLightColor(v[1], depth + 1) : null
        }
    }
    if (!channels || channels.some((v) => !Number.isFinite(v))) return null
    const linear = channels.map((v) => {
        const c = clamp(v, 0, 255) / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722 > 0.45
}

/** Allow http(s), mailto, tel, anchors and relative paths. Block script-like schemes. */
const safeHref = (value: any): string => {
    const s = typeof value === "string" ? value.trim() : ""
    if (!s || s === "#" || /[\u0000-\u001f\u007f]/.test(s)) return ""
    if (/^https?:\/\/[^\s/]+/i.test(s)) return s
    if (/^(mailto:[^\s@]+@[^\s@]+|tel:\+?[0-9(). -]+)$/i.test(s)) return s
    if (/^#[^\s#]+$/.test(s)) return s
    // Relative routes only. Reject protocol-relative URLs and all unrecognised schemes.
    if (
        !s.startsWith("//") &&
        !s.startsWith("\\") &&
        !/^[a-z][a-z0-9+.-]*:/i.test(s) &&
        !/^[^/?#]*\\/.test(s) &&
        !/\s/.test(s)
    )
        return s
    return ""
}

const isExternal = (href: string) => /^https?:\/\//i.test(href)

/** Framer uses React 18+; useId provides stable instance-scoped CSS and ARIA IDs. */
const useUid = () => React.useId()

/** Classify common feature-availability values without altering custom text. */
const isUnavailable = (value: string): boolean =>
    ["no", "false", "—", "-", "none", "✕"].includes(
        String(value ?? "")
            .trim()
            .toLowerCase()
    )

const isAvailable = (value: string): boolean =>
    ["yes", "true", "included", "✓"].includes(
        String(value ?? "")
            .trim()
            .toLowerCase()
    )

// Editable interface labels

const labelDefs: Array<[string, string, string]> = [
    ["labelMonthly", "Monthly", "Monthly"],
    ["labelYearly", "Yearly", "Yearly"],
    ["labelSave", "Save prefix", "SAVE"],
    ["labelBillingFrequency", "Billing group (a11y)", "Billing frequency"],
    ["labelAnnualBilling", "Annual switch (a11y)", "Annual billing"],
    ["labelCurrency", "Currency", "Currency"],
    ["labelPerMonth", "Per month", "/mo"],
    ["labelBilled", "Billed prefix", "Billed"],
    ["labelAnnually", "Annually", "annually"],
    ["labelBilledMonthly", "Billed monthly", "Billed monthly"],
    ["labelIncludes", "Includes", "Includes"],
    [
        "labelAdditionalSeats",
        "Extra seats note",
        "Additional seats are priced per plan.",
    ],
    ["labelNumberOf", "Slider (a11y)", "Number of"],
    ["labelOptionalAddons", "Add-ons group (a11y)", "Optional add-ons"],
    ["labelAnnualRate", "Annual rate", "annual rate"],
    [
        "labelBeforeAnnualDiscount",
        "Add-on list price note",
        "before annual discount",
    ],
    ["labelChoosePlan", "Choose plan (a11y)", "Choose plan"],
    ["labelValueScore", "Value score", "VALUE SCORE"],
    ["labelBase", "Breakdown base", "Base"],
    ["labelExtraSeats", "Breakdown seats", "Extra seats"],
    ["labelAddons", "Breakdown add-ons", "Add-ons"],
    ["labelAnnualDiscount", "Breakdown discount", "Annual discount"],
    ["labelTotal", "Breakdown total", "Total"],
    ["labelBreakdown", "Breakdown (a11y)", "Price breakdown"],
    ["labelIncluded", "Included", "Included"],
    ["labelNotIncluded", "Not included (a11y)", "Not included"],
    ["labelAbout", "About (a11y)", "About"],
    ["labelFeatures", "Features column", "Features"],
    ["labelCompareFeatures", "Compare button", "Compare all features"],
    ["labelHideComparison", "Hide compare button", "Hide full comparison"],
    ["labelCustom", "Custom price", "Custom"],
]

const labelDefaults: Record<string, string> = Object.fromEntries(
    labelDefs.map(([k, , d]) => [k, d])
)

// Pricing component

/**
 * Framer layout metadata. The component supports fixed and fill widths,
 * while its internal layout responds to the available container width.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 1350
 */
export default function PricingMadeEasy_Interactive(props: any) {
    const defined: Record<string, any> = {}
    Object.keys(props || {}).forEach((k) => {
        if (props[k] !== undefined) defined[k] = props[k]
    })
    const p = { ...DEFAULTS, ...defined }

    const uid = useUid().replace(/[^a-zA-Z0-9_-]/g, "")
    const instanceClass = `pricingmadeeasy-${uid}`
    const scope = `.${instanceClass}`
    // Scope selectors to prevent styles leaking between component instances.
    const css = (s: string) => s.replace(/&(?=\s|[.#:[>+~*]|$)/g, scope)

    // Normalize configuration values.
    const discountPct = clamp(valid(p.discount, 20), 0, 100)
    // The site owner selects the featured tier in Framer's property panel.
    // Accept legacy numeric values (1–4) for existing instances as well.
    const featuredOptions = ["Free", "Basic", "Pro", "Enterprise"]
    const featuredChoice = String(p.featuredPlan ?? "Pro")
    const featuredIndex = featuredOptions.indexOf(featuredChoice)
    const recommended =
        featuredIndex >= 0
            ? featuredIndex
            : clamp(Math.round(valid(p.featuredPlan, 3)) - 1, 0, 3)
    const minSeats = clamp(Math.round(valid(p.minSeats, 1)), 1, 100000)
    const maxSeats = clamp(Math.round(valid(p.maxSeats, 100)), minSeats, 100000)
    const seatStep = clamp(Math.round(valid(p.seatStep, 1)), 1, 100000)
    const reachableMax =
        minSeats + Math.floor((maxSeats - minSeats) / seatStep) * seatStep
    const normalizeSeats = (n: number) => {
        const snapped =
            minSeats +
            Math.round(
                (clamp(n, minSeats, reachableMax) - minSeats) / seatStep
            ) *
                seatStep
        return clamp(snapped, minSeats, reachableMax)
    }
    const includedSeats = clamp(
        Math.round(valid(p.includedSeats, 1)),
        0,
        100000
    )

    // Interactive state.
    const [yearly, setYearly] = React.useState(Boolean(p.defaultYearly))
    React.useEffect(
        () => setYearly(Boolean(p.defaultYearly)),
        [p.defaultYearly]
    )

    const [seats, setSeats] = React.useState(() => valid(p.defaultSeats, 5))
    React.useEffect(() => setSeats(valid(p.defaultSeats, 5)), [p.defaultSeats])

    const [currencyIndex, setCurrencyIndex] = React.useState(0)
    const [addons, setAddons] = React.useState<Record<number, boolean>>({})
    // Store accordion expansion independently for each plan and group.
    const [open, setOpen] = React.useState<Record<string, boolean>>({})
    const [comparison, setComparison] = React.useState(false)
    const closeButtonRef = React.useRef<HTMLButtonElement>(null)
    const compareButtonRef = React.useRef<HTMLButtonElement>(null)
    React.useEffect(() => {
        if (comparison) closeButtonRef.current?.focus()
        else compareButtonRef.current?.focus()
    }, [comparison])
    React.useEffect(() => {
        if (!comparison || typeof document === "undefined") return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setComparison(false)
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [comparison])
    const [mobilePlan, setMobilePlan] = React.useState(recommended)
    React.useEffect(() => setMobilePlan(recommended), [recommended])
    const [help, setHelp] = React.useState("")

    // Resolve the selected theme and contrast-dependent colors.
    const theme =
        p.theme === "Custom"
            ? {
                  bg: p.background,
                  card: p.cardColor,
                  text: p.textColor,
                  muted: p.mutedColor,
                  border: p.borderColor,
                  accent: p.accent,
                  accent2: p.accent2,
              }
            : palettes[p.theme] || palettes.Midnight
    const lightBackground =
        p.theme === "Custom"
            ? (isLightColor(theme.bg) ?? false)
            : p.theme === "Frost"
    const lightCard = isLightColor(theme.card) ?? lightBackground
    const positiveColor = lightCard ? "#07866F" : "#89E5C6"

    const groups = React.useMemo(
        () => parseFeatures(p.featureData),
        [p.featureData]
    )

    // Convert from the configured base currency using editable rates.
    const positiveRate = (value: any, fallback: number) => {
        const rate = valid(value, fallback)
        return rate > 0 ? rate : fallback
    }
    // Exchange rates are configured manually relative to USD.
    const usdRates = [
        { symbol: "$", code: "USD", rate: 1 },
        { symbol: "€", code: "EUR", rate: positiveRate(p.eurRate, 0.92) },
        { symbol: "£", code: "GBP", rate: positiveRate(p.gbpRate, 0.79) },
        { symbol: "A$", code: "AUD", rate: positiveRate(p.audRate, 1.5) },
        { symbol: "৳", code: "BDT", rate: positiveRate(p.bdtRate, 120) },
        { symbol: "₹", code: "INR", rate: positiveRate(p.inrRate, 85) },
    ]
    const requestedBaseCode = String(p.currencyCode || "USD")
        .trim()
        .toUpperCase()
    // Unsupported currency codes resolve to USD.
    const baseCode = usdRates.some((c) => c.code === requestedBaseCode)
        ? requestedBaseCode
        : "USD"
    const knownBase = usdRates.find((c) => c.code === baseCode)
    const baseUsdRate = knownBase?.rate ?? 1
    const customSymbol = String(p.currencySymbol ?? "").trim()
    const currencies = [
        {
            code: baseCode,
            symbol: customSymbol || knownBase?.symbol || `${baseCode} `,
            rate: 1,
        },
        ...usdRates
            .filter((c) => c.code !== baseCode)
            .map((c) => ({ ...c, rate: c.rate / baseUsdRate })),
    ]
    const currency = currencies[currencyIndex] || currencies[0]

    const locale = React.useMemo(() => {
        try {
            return Intl.NumberFormat(p.locale || "en-US").resolvedOptions()
                .locale
        } catch {
            return "en-US"
        }
    }, [p.locale])

    /** One formatting rule everywhere: whole numbers unless cents are on or needed. */
    const fmt = (cents: number) => {
        const whole = !p.showCents && Math.abs(cents) % 100 === 0
        return `${currency.symbol}${(cents / 100).toLocaleString(locale, {
            minimumFractionDigits: whole ? 0 : 2,
            maximumFractionDigits: whole ? 0 : 2,
        })}`
    }
    const toCents = (value: number) =>
        Math.round((value * currency.rate + Number.EPSILON) * 100)

    // Calculate plan prices from the selected billing options.
    const effectiveSeats = normalizeSeats(seats)
    const extraSeats = Math.max(0, effectiveSeats - includedSeats)
    const discountFactor = yearly ? 1 - discountPct / 100 : 1

    const addonList = [
        {
            id: 0,
            name: p.addon1Name,
            price: clamp(valid(p.addon1Price, 0), 0, 100000000),
        },
        {
            id: 1,
            name: p.addon2Name,
            price: clamp(valid(p.addon2Price, 0), 0, 100000000),
        },
    ].filter((a) => Boolean(a.name && String(a.name).trim()))

    const names = [p.freeName, p.basicName, p.proName, p.enterpriseName]
    const descriptions = [
        p.freeDescription,
        p.basicDescription,
        p.proDescription,
        p.enterpriseDescription,
    ]
    const bases = [
        p.freePrice,
        p.basicPrice,
        p.proPrice,
        p.enterprisePrice,
    ].map((x) => clamp(valid(x, 0), 0, 100000000))
    const perSeats = [
        p.freeSeatPrice,
        p.basicSeatPrice,
        p.proSeatPrice,
        p.enterpriseSeatPrice,
    ].map((x) => clamp(valid(x, 0), 0, 100000000))
    const links = [p.freeLink, p.basicLink, p.proLink, p.enterpriseLink].map(
        safeHref
    )
    const buttons = [
        p.freeButton,
        p.basicButton,
        p.proButton,
        p.enterpriseButton,
    ]
    const scores = [
        p.freeScore,
        p.basicScore,
        p.proScore,
        p.enterpriseScore,
    ].map((x) => clamp(valid(x, 50), 0, 100))
    const customPlan = (i: number) =>
        i === 3 && Boolean(p.enterpriseCustomPrice)
    // Custom enterprise pricing does not display a numeric quote.

    /** Single source of truth for headline price, breakdown and annual billing. */
    const breakdown = (i: number) => {
        const baseCents = toCents(bases[i])
        const seatCents =
            i !== 0 && p.showSeatSlider ? toCents(extraSeats * perSeats[i]) : 0
        // Round individual add-ons before summing displayed amounts.
        const addonCents =
            i !== 0 && p.showAddons
                ? addonList.reduce(
                      (sum, addon) =>
                          sum + (addons[addon.id] ? toCents(addon.price) : 0),
                      0
                  )
                : 0
        const subtotalCents = baseCents + seatCents + addonCents
        const totalCents = Math.round(subtotalCents * discountFactor)
        return {
            baseCents,
            seatCents,
            addonCents,
            subtotalCents,
            totalCents,
            discountCents: subtotalCents - totalCents,
        }
    }

    // Announce user-initiated price changes after rapid input settles.
    const summary = names
        .map((n, i) =>
            customPlan(i)
                ? `${n} ${p.labelCustom}`
                : `${n} ${fmt(breakdown(i).totalCents)}${p.labelPerMonth}`
        )
        .join(", ")
    const [announce, setAnnounce] = React.useState("")
    // Avoid announcements during initial rendering and rapid slider updates.
    const visitorChangedPricing = React.useRef(false)
    React.useEffect(() => {
        if (!visitorChangedPricing.current) return
        const t = setTimeout(() => {
            setAnnounce(summary)
            visitorChangedPricing.current = false
        }, 700)
        return () => clearTimeout(t)
    }, [summary])

    // Render feature availability consistently across cards and comparison.
    const featureValue = (value: string) =>
        isUnavailable(value) ? (
            <span
                role="img"
                style={{ color: theme.muted, opacity: 0.65 }}
                aria-label={p.labelNotIncluded}
            >
                —
            </span>
        ) : isAvailable(value) ? (
            <span style={{ color: positiveColor, fontWeight: 750 }}>
                ✓ {p.labelIncluded}
            </span>
        ) : (
            <span>{value}</span>
        )

    const rootStyle = {
        // Follow the dimensions provided by the Framer frame.
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        height: "auto",
        background: theme.bg,
        color: theme.text,
        borderRadius: p.radius,
        fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        containerType: "inline-size",
        // Preserve Framer-injected style properties.
        ...(p.style || {}),
    } as React.CSSProperties

    // Instance-scoped styles use container queries for responsive card layouts.
    const stylesheet = css(`
        & *{box-sizing:border-box}
        & .pp-inner{width:100%;min-width:0;max-width:1460px;margin:0 auto;padding:54px 38px 55px;position:relative}
        & .pp-title{font-size:clamp(30px,3.8vw,50px);line-height:1.13;letter-spacing:-1.7px;margin:10px 0;font-weight:850}
        & .pp-muted{color:var(--pp-muted)}
        & .pp-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        & .pp-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;margin:24px auto 0}
        & .pp-pill{border:1px solid var(--pp-border);border-radius:100px;background:var(--pp-card);padding:6px 12px;display:inline-flex;gap:8px;align-items:center;font-size:13px}
        & .pp-button{cursor:pointer;color:inherit;background:transparent;border:0;font:inherit}
        & .pp-button:focus-visible,& input:focus-visible,& a:focus-visible,& select:focus-visible,& .pp-cta:focus-visible{outline:3px solid var(--pp-accent);outline-offset:3px}
        & .pp-seatbox{max-width:690px;margin:27px auto 0;background:var(--pp-card);border:1px solid var(--pp-border);border-radius:16px;padding:19px 23px}
        & .pp-seatbox input{width:100%;accent-color:var(--pp-accent);cursor:pointer;margin:15px 0 7px}
        & .pp-addonrow{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:14px}
        & .pp-addon{display:flex;align-items:center;gap:8px;background:var(--pp-card);border:1px solid var(--pp-border);border-radius:11px;padding:10px 13px;font-size:13px;cursor:pointer}
        & .pp-addon input{accent-color:var(--pp-accent)}
        & .pp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:32px;min-width:0}
        & .pp-card{min-width:0;background:var(--pp-card);border:1px solid var(--pp-border);border-radius:20px;padding:27px 23px;display:flex;flex-direction:column;transition:transform .2s ease,box-shadow .2s ease;position:relative}
        & .pp-card:hover{transform:translateY(-3px);box-shadow:0 20px 55px #0002}
        & .pp-card.featured{border:1.5px solid var(--pp-accent);background:linear-gradient(145deg,color-mix(in srgb,var(--pp-accent) 19%,var(--pp-card)),var(--pp-card) 73%);box-shadow:0 0 0 1px color-mix(in srgb,var(--pp-accent) 22%,transparent)}
        & .pp-badge{position:absolute;top:-14px;right:15px;padding:7px 11px;font-size:10px;font-weight:850;border-radius:8px;background:linear-gradient(110deg,var(--pp-accent),var(--pp-accent2));color:#fff}
        & .pp-planname{font-size:22px;font-weight:800;margin:3px 0 8px;letter-spacing:-.4px}
        & .pp-desc{font-size:13px;line-height:1.55;min-height:40px;color:var(--pp-muted)}
        & .pp-price{font-size:clamp(33px,3.2vw,45px);font-weight:850;letter-spacing:-1.7px;line-height:1.2}
        & .pp-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:46px;text-decoration:none;font-family:inherit;cursor:pointer;color:var(--pp-text);background:color-mix(in srgb,var(--pp-text) 8%,var(--pp-card));border:1px solid var(--pp-border);border-radius:10px;font-size:13px;font-weight:800;margin-top:19px;padding:8px}
        & .pp-cta-placeholder{cursor:default;opacity:.7;user-select:none}
        & .pp-cta.featured{background:linear-gradient(105deg,var(--pp-accent),var(--pp-accent2));color:#fff;border-color:transparent}
        & .pp-group{border-top:1px solid var(--pp-border);margin-top:12px}
        & .pp-grouphead{width:100%;padding:12px 0;display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:800;letter-spacing:.4px}
        & .pp-feature{display:flex;align-items:start;justify-content:space-between;gap:9px;padding:10px 0;border-bottom:1px solid var(--pp-border);font-size:12px;line-height:1.45}
        & .pp-feature > span:last-child{font-weight:750;text-align:right;max-width:50%;overflow-wrap:anywhere}
        & .pp-scoretrack{height:5px;border-radius:9px;overflow:hidden;background:var(--pp-border);margin-top:7px}
        & .pp-scorefill{height:100%;background:linear-gradient(90deg,var(--pp-accent),var(--pp-accent2))}
        & .pp-compare{width:100%;overflow:auto;border:1px solid var(--pp-border);border-radius:14px;margin-top:15px;max-height:calc(100dvh - 160px);overscroll-behavior:contain}
        & .pp-dialog-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.76);display:flex;align-items:center;justify-content:center;padding:clamp(12px,3vw,36px)}
        & .pp-dialog{width:min(1100px,100%);max-height:calc(100dvh - 24px);min-height:0;display:flex;flex-direction:column;background:var(--pp-bg);color:var(--pp-text);border:1px solid var(--pp-border);border-radius:18px;padding:clamp(12px,2.5vw,26px);box-shadow:0 28px 90px #0009}
        & .pp-dialog-header{display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left}
        & .pp-dialog .pp-compare{flex:1;min-height:0;max-height:none}
        & .pp-dialog-close{border:1px solid var(--pp-border);border-radius:9px;background:var(--pp-card);color:var(--pp-text);font:inherit;padding:9px 13px;cursor:pointer}
        & .pp-compare table{width:100%;min-width:600px;border-collapse:collapse;font-size:13px}
        & .pp-compare td,& .pp-compare th{padding:13px 14px;border-bottom:1px solid var(--pp-border);text-align:center}
        & .pp-compare td:first-child,& .pp-compare th:first-child{text-align:left}
        & .pp-compare th{background:var(--pp-card)}
        & .pp-breakdown{display:grid;gap:5px;margin-top:12px;padding:10px 0;border-top:1px solid var(--pp-border);font-size:11px;color:var(--pp-muted)}
        & .pp-breakdownrow{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
        & .pp-breakdownrow > span:last-child{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
        & .pp-breakdowntotal{padding-top:6px;border-top:1px solid var(--pp-border);font-weight:800;color:var(--pp-text)}
        & .pp-mobiletabs{display:none}
        @container (max-width:860px){& .pp-inner{padding:42px 20px} & .pp-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px} & .pp-card{padding:21px 17px} & .pp-planname{font-size:19px} & .pp-feature{font-size:11px}}
        @container (max-width:640px){& .pp-grid{grid-template-columns:minmax(0,1fr);max-width:440px;margin:22px auto} & .pp-card:last-child{grid-column:auto} & .pp-card{padding:25px 22px} & .pp-card:hover{transform:none} & .pp-card.pp-mobilehide{display:none} & .pp-mobiletabs{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin-top:20px} & .pp-mobiletabs button{border:1px solid var(--pp-border);background:var(--pp-card);border-radius:99px;padding:9px 12px;font-size:12px;font-family:inherit;cursor:pointer} & .pp-mobiletabs button[aria-pressed="true"]{border-color:var(--pp-accent);font-weight:800} & .pp-desc{min-height:0} & .pp-title{font-size:32px} & .pp-price{font-size:43px}}
        @container (max-width:390px){& .pp-inner{padding:32px 12px} & .pp-card{padding:20px 16px} & .pp-seatbox{padding:15px} & .pp-toolbar{gap:8px} & .pp-pill{padding:6px 9px}}
        @media (prefers-reduced-motion:reduce){& *{transition:none!important;animation:none!important}}
    `)

    // Share palette tokens with the component and its portalled dialog.
    const themeVars = {
        "--pp-bg": theme.bg,
        "--pp-card": theme.card,
        "--pp-text": theme.text,
        "--pp-muted": theme.muted,
        "--pp-border": theme.border,
        "--pp-accent": theme.accent,
        "--pp-accent2": theme.accent2,
    } as React.CSSProperties

    return (
        <section
            className={`pricingmadeeasy-root ${instanceClass}`}
            style={rootStyle}
        >
            <style>{stylesheet}</style>
            <div className="pp-inner" style={themeVars}>
                <div className="pp-sr" aria-live="polite" aria-atomic="true">
                    {announce}
                </div>
                <header style={{ textAlign: "center" }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 2,
                            color: theme.accent2,
                        }}
                    >
                        ✦ {p.eyebrow}
                    </div>
                    <h2 className="pp-title">{p.heading}</h2>
                    <p className="pp-muted" style={{ fontSize: 15, margin: 0 }}>
                        {p.subtitle}
                    </p>
                    <div className="pp-toolbar">
                        <div
                            className="pp-pill"
                            role="group"
                            aria-label={p.labelBillingFrequency}
                        >
                            <button
                                type="button"
                                className="pp-button"
                                aria-pressed={!yearly}
                                onClick={() => {
                                    visitorChangedPricing.current = true
                                    setYearly(false)
                                }}
                                style={{ fontWeight: yearly ? 450 : 800 }}
                            >
                                {p.labelMonthly}
                            </button>
                            <button
                                type="button"
                                className="pp-button"
                                aria-label={p.labelAnnualBilling}
                                role="switch"
                                aria-checked={yearly}
                                onClick={() => {
                                    visitorChangedPricing.current = true
                                    setYearly((v) => !v)
                                }}
                                style={{
                                    width: 40,
                                    height: 23,
                                    borderRadius: 20,
                                    background: theme.accent,
                                    padding: 3,
                                    display: "flex",
                                    justifyContent: yearly
                                        ? "flex-end"
                                        : "flex-start",
                                }}
                            >
                                <span
                                    style={{
                                        width: 17,
                                        height: 17,
                                        background: "white",
                                        borderRadius: "50%",
                                    }}
                                />
                            </button>
                            <button
                                type="button"
                                className="pp-button"
                                aria-pressed={yearly}
                                onClick={() => {
                                    visitorChangedPricing.current = true
                                    setYearly(true)
                                }}
                                style={{ fontWeight: yearly ? 800 : 450 }}
                            >
                                {p.labelYearly}
                            </button>
                            {discountPct > 0 && (
                                <span
                                    style={{
                                        color: lightBackground
                                            ? "#087B63"
                                            : "#87E8CF",
                                        fontWeight: 750,
                                        fontSize: 11,
                                    }}
                                >
                                    {p.labelSave} {discountPct}%
                                </span>
                            )}
                        </div>
                        {p.showCurrency && (
                            <label className="pp-pill">
                                {p.labelCurrency}{" "}
                                <select
                                    aria-label={p.labelCurrency}
                                    value={currencyIndex}
                                    onChange={(e) => {
                                        visitorChangedPricing.current = true
                                        setCurrencyIndex(Number(e.target.value))
                                    }}
                                    style={{
                                        background: "transparent",
                                        color: theme.text,
                                        border: 0,
                                        fontWeight: 750,
                                        fontSize: 12,
                                        fontFamily: "inherit",
                                    }}
                                >
                                    {currencies.map((c, i) => (
                                        <option
                                            key={`${c.code}-${i}`}
                                            value={i}
                                            style={{ color: "black" }}
                                        >
                                            {c.code}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                    </div>
                    {p.showSeatSlider && (
                        <div
                            className="pp-seatbox"
                            style={{ textAlign: "left" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <strong style={{ fontSize: 15 }}>
                                    {p.seatLabel}
                                </strong>
                                <span
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 850,
                                        color: theme.accent2,
                                    }}
                                >
                                    {effectiveSeats.toLocaleString(locale)}{" "}
                                    {effectiveSeats === 1
                                        ? p.seatSingular
                                        : p.seatPlural}
                                </span>
                            </div>
                            <input
                                aria-label={`${p.labelNumberOf} ${p.seatPlural}`}
                                type="range"
                                disabled={reachableMax === minSeats}
                                min={minSeats}
                                max={reachableMax}
                                step={seatStep}
                                value={effectiveSeats}
                                onChange={(e) => {
                                    visitorChangedPricing.current = true
                                    setSeats(Number(e.target.value))
                                }}
                            />
                            <div
                                className="pp-muted"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 11,
                                }}
                            >
                                <span>{minSeats.toLocaleString(locale)}</span>
                                <span>
                                    {reachableMax.toLocaleString(locale)}{" "}
                                    {p.seatPlural}
                                </span>
                            </div>
                            <div
                                className="pp-muted"
                                style={{ marginTop: 9, fontSize: 12 }}
                            >
                                {p.labelIncludes} {includedSeats}{" "}
                                {includedSeats === 1
                                    ? p.seatSingular
                                    : p.seatPlural}
                                . {p.labelAdditionalSeats}
                            </div>
                        </div>
                    )}
                    {p.showAddons && addonList.length > 0 && (
                        <div
                            className="pp-addonrow"
                            role="group"
                            aria-label={p.labelOptionalAddons}
                        >
                            {addonList.map((a) => (
                                <label className="pp-addon" key={a.id}>
                                    <input
                                        type="checkbox"
                                        checked={!!addons[a.id]}
                                        onChange={(e) => {
                                            visitorChangedPricing.current = true
                                            const checked = e.target.checked
                                            setAddons((prev) => ({
                                                ...prev,
                                                [a.id]: checked,
                                            }))
                                        }}
                                    />
                                    {a.name}{" "}
                                    <strong>
                                        +{fmt(toCents(a.price))}
                                        {p.labelPerMonth}
                                        {yearly && discountPct > 0
                                            ? ` (${p.labelBeforeAnnualDiscount})`
                                            : ""}
                                    </strong>
                                </label>
                            ))}
                        </div>
                    )}
                </header>

                {p.mobileTabs && (
                    <div
                        className="pp-mobiletabs"
                        role="group"
                        aria-label={p.labelChoosePlan}
                    >
                        {names.map((n, i) => (
                            <button
                                type="button"
                                key={i}
                                aria-pressed={mobilePlan === i}
                                onClick={() => {
                                    setMobilePlan(i)
                                    setHelp("")
                                }}
                                style={{ color: theme.text }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                )}

                <div className="pp-grid">
                    {names.map((name, i) => {
                        const b = breakdown(i)
                        const custom = customPlan(i)
                        const href = links[i]
                        const external = isExternal(href)
                        const newTab = Boolean(p.openLinksNewTab) && external
                        const ctaClass = `pp-cta ${i === recommended ? "featured" : ""}`
                        const lines = [
                            [p.labelBase, b.baseCents],
                            ...(b.seatCents
                                ? [[p.labelExtraSeats, b.seatCents]]
                                : []),
                            ...(b.addonCents
                                ? [[p.labelAddons, b.addonCents]]
                                : []),
                            ...(b.discountCents
                                ? [
                                      [
                                          `${p.labelAnnualDiscount} (${discountPct}%)`,
                                          -b.discountCents,
                                      ],
                                  ]
                                : []),
                        ] as Array<[string, number]>
                        const showBreakdown =
                            p.showBreakdown &&
                            !custom &&
                            (b.seatCents !== 0 ||
                                b.addonCents !== 0 ||
                                b.discountCents !== 0)
                        return (
                            <article
                                key={i}
                                className={`pp-card ${i === recommended ? "featured" : ""} ${
                                    i !== mobilePlan && p.mobileTabs
                                        ? "pp-mobilehide"
                                        : ""
                                }`}
                            >
                                {i === recommended && (
                                    <span className="pp-badge">
                                        ✦ {p.featuredLabel}
                                    </span>
                                )}
                                <h3 className="pp-planname">{name}</h3>
                                <div className="pp-desc">{descriptions[i]}</div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 4,
                                        marginTop: 18,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span className="pp-price">
                                        {custom
                                            ? p.labelCustom
                                            : fmt(b.totalCents)}
                                    </span>
                                    {!custom && (
                                        <span
                                            className="pp-muted"
                                            style={{ fontSize: 12 }}
                                        >
                                            {p.labelPerMonth}
                                        </span>
                                    )}
                                </div>
                                {!custom && (
                                    <div
                                        className="pp-muted"
                                        style={{ fontSize: 12, marginTop: 5 }}
                                    >
                                        {yearly
                                            ? `${p.labelBilled} ${fmt(b.totalCents * 12)} ${p.labelAnnually}`
                                            : p.labelBilledMonthly}
                                    </div>
                                )}
                                {showBreakdown && (
                                    <div
                                        className="pp-breakdown"
                                        role="group"
                                        aria-label={p.labelBreakdown}
                                    >
                                        {lines.map(([label, amount], j) => (
                                            <div
                                                className="pp-breakdownrow"
                                                key={j}
                                            >
                                                <span>{label}</span>
                                                <span>
                                                    {amount < 0 ? "−" : ""}
                                                    {fmt(Math.abs(amount))}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="pp-breakdownrow pp-breakdowntotal">
                                            <span>{p.labelTotal}</span>
                                            <span>
                                                {fmt(b.totalCents)}
                                                {p.labelPerMonth}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {p.showScores && (
                                    <div style={{ marginTop: 17 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: 10,
                                                fontWeight: 850,
                                                letterSpacing: 0.7,
                                            }}
                                        >
                                            <span className="pp-muted">
                                                {p.labelValueScore}
                                            </span>
                                            <span>{scores[i]}%</span>
                                        </div>
                                        <div className="pp-scoretrack">
                                            <div
                                                className="pp-scorefill"
                                                style={{
                                                    width: `${scores[i]}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {href ? (
                                    <a
                                        className={ctaClass}
                                        href={href}
                                        target={newTab ? "_blank" : undefined}
                                        rel={
                                            newTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                    >
                                        {buttons[i]} {newTab ? "↗" : "→"}
                                    </a>
                                ) : (
                                    // Render an inactive CTA when no destination is configured.
                                    <span
                                        className={`${ctaClass} pp-cta-placeholder`}
                                        title="Link not configured"
                                    >
                                        {buttons[i]}
                                    </span>
                                )}
                                <div style={{ marginTop: 18 }}>
                                    {groups.map((g, gi) => {
                                        const groupKey = `${i}-${gi}`
                                        const isOpen =
                                            open[groupKey] ?? gi === 0
                                        return (
                                            <div className="pp-group" key={gi}>
                                                <button
                                                    type="button"
                                                    className="pp-button pp-grouphead"
                                                    aria-expanded={isOpen}
                                                    aria-controls={`${instanceClass}-features-${groupKey}`}
                                                    onClick={() =>
                                                        setOpen((prev) => ({
                                                            ...prev,
                                                            [groupKey]: !(
                                                                prev[
                                                                    groupKey
                                                                ] ?? gi === 0
                                                            ),
                                                        }))
                                                    }
                                                >
                                                    <span>
                                                        ✦ {g.name.toUpperCase()}
                                                    </span>
                                                    <span aria-hidden="true">
                                                        {isOpen ? "⌄" : "›"}
                                                    </span>
                                                </button>
                                                <div
                                                    id={`${instanceClass}-features-${groupKey}`}
                                                    hidden={!isOpen}
                                                >
                                                    {g.rows.map((r, ri) => {
                                                        const hid = `${i}-${gi}-${ri}`
                                                        const tooltipId = `${instanceClass}-tip-${hid}`
                                                        return (
                                                            <div
                                                                className="pp-feature"
                                                                key={ri}
                                                            >
                                                                <span className="pp-muted">
                                                                    {r.label}
                                                                    {r.hint &&
                                                                        p.showTooltips && (
                                                                            <button
                                                                                type="button"
                                                                                className="pp-button"
                                                                                aria-label={`${p.labelAbout} ${r.label}`}
                                                                                aria-expanded={
                                                                                    help ===
                                                                                    hid
                                                                                }
                                                                                aria-controls={
                                                                                    help ===
                                                                                    hid
                                                                                        ? tooltipId
                                                                                        : undefined
                                                                                }
                                                                                onKeyDown={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        e.key ===
                                                                                        "Escape"
                                                                                    )
                                                                                        setHelp(
                                                                                            ""
                                                                                        )
                                                                                }}
                                                                                onClick={() =>
                                                                                    setHelp(
                                                                                        help ===
                                                                                            hid
                                                                                            ? ""
                                                                                            : hid
                                                                                    )
                                                                                }
                                                                                style={{
                                                                                    marginLeft: 5,
                                                                                    color: theme.accent2,
                                                                                }}
                                                                            >
                                                                                ⓘ
                                                                            </button>
                                                                        )}
                                                                    {p.showTooltips &&
                                                                        r.hint &&
                                                                        help ===
                                                                            hid && (
                                                                            <span
                                                                                id={
                                                                                    tooltipId
                                                                                }
                                                                                style={{
                                                                                    display:
                                                                                        "block",
                                                                                    fontSize: 11,
                                                                                    color: theme.text,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    r.hint
                                                                                }
                                                                            </span>
                                                                        )}
                                                                </span>
                                                                <span>
                                                                    {featureValue(
                                                                        r
                                                                            .values[
                                                                            i
                                                                        ]
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </article>
                        )
                    })}
                </div>

                {p.showComparison && (
                    <div style={{ textAlign: "center", marginTop: 25 }}>
                        <button
                            type="button"
                            className="pp-button"
                            aria-expanded={comparison}
                            ref={compareButtonRef}
                            aria-controls={`${instanceClass}-comparison`}
                            onClick={() => setComparison((x) => !x)}
                            style={{
                                padding: "12px 20px",
                                border: `1px solid ${theme.border}`,
                                borderRadius: 10,
                                background: theme.card,
                                fontWeight: 750,
                                fontSize: 13,
                            }}
                        >
                            {comparison
                                ? `${p.labelHideComparison} ↑`
                                : `${p.labelCompareFeatures} ↓`}
                        </button>
                    </div>
                )}
                {comparison &&
                    p.showComparison &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <div
                            className={`pricingmadeeasy-root ${instanceClass}`}
                            style={{
                                ...themeVars,
                                fontFamily:
                                    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
                            }}
                        >
                            <style>{stylesheet}</style>
                            <div
                                className="pp-dialog-backdrop"
                                onMouseDown={(e) => {
                                    if (e.target === e.currentTarget)
                                        setComparison(false)
                                }}
                            >
                                <div
                                    className="pp-dialog"
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label={p.labelCompareFeatures}
                                >
                                    <div className="pp-dialog-header">
                                        <strong>
                                            {p.labelCompareFeatures}
                                        </strong>
                                        <button
                                            type="button"
                                            className="pp-dialog-close"
                                            ref={closeButtonRef}
                                            onClick={() => setComparison(false)}
                                            aria-label={p.labelHideComparison}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div
                                        className="pp-compare"
                                        id={`${instanceClass}-comparison`}
                                    >
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th scope="col">
                                                        {p.labelFeatures}
                                                    </th>
                                                    {names.map((n, i) => (
                                                        <th scope="col" key={i}>
                                                            {n}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groups.map((g, gi) => (
                                                    <React.Fragment key={gi}>
                                                        <tr>
                                                            <th
                                                                colSpan={
                                                                    names.length
                                                                }
                                                                style={{
                                                                    textAlign:
                                                                        "left",
                                                                    fontWeight: 850,
                                                                    color: theme.accent2,
                                                                    background:
                                                                        "transparent",
                                                                }}
                                                            >
                                                                {g.name}
                                                            </th>
                                                        </tr>
                                                        {g.rows.map((r, ri) => (
                                                            <tr key={ri}>
                                                                <th
                                                                    scope="row"
                                                                    style={{
                                                                        fontWeight: 500,
                                                                        background:
                                                                            "transparent",
                                                                    }}
                                                                >
                                                                    {r.label}
                                                                </th>
                                                                {r.values.map(
                                                                    (v, vi) => (
                                                                        <td
                                                                            key={
                                                                                vi
                                                                            }
                                                                        >
                                                                            {featureValue(
                                                                                v
                                                                            )}
                                                                        </td>
                                                                    )
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                {p.showFootnote && (
                    <p
                        className="pp-muted"
                        style={{
                            textAlign: "center",
                            marginTop: 25,
                            fontSize: 11,
                        }}
                    >
                        {p.footnote}
                    </p>
                )}
            </div>
        </section>
    )
}

// Default configuration

const DEFAULTS: Record<string, any> = {
    theme: "Midnight",
    background: "#100E18",
    cardColor: "#1B1728",
    textColor: "#F8F5FF",
    mutedColor: "#B6AFC8",
    borderColor: "#3A314B",
    accent: "#9A5DF2",
    accent2: "#E64AAE",
    radius: 22,
    eyebrow: "PREMIUM PRICING EXPERIENCE",
    heading: "The right plan. The right price.",
    subtitle: "Choose the plan that fits your team — with transparent pricing.",
    freeName: "Free",
    basicName: "Basic",
    proName: "Pro",
    enterpriseName: "Enterprise",
    freeDescription: "For trying things out",
    basicDescription: "For individuals and small projects",
    proDescription: "For growing teams and ambitious work",
    enterpriseDescription: "For organizations scaling up",
    freePrice: 0,
    basicPrice: 19,
    proPrice: 49,
    enterprisePrice: 149,
    freeSeatPrice: 0,
    basicSeatPrice: 3,
    proSeatPrice: 6,
    enterpriseSeatPrice: 9,
    enterpriseCustomPrice: false,
    freeButton: "Get Started Free",
    basicButton: "Get Started",
    proButton: "Start Free Trial",
    enterpriseButton: "Contact Sales",
    freeLink: "",
    basicLink: "",
    proLink: "",
    enterpriseLink: "",
    openLinksNewTab: false,
    featuredPlan: "Pro",
    featuredLabel: "MOST POPULAR",
    defaultYearly: false,
    discount: 20,
    showCurrency: true,
    currencySymbol: "",
    currencyCode: "USD",
    eurRate: 0.92,
    gbpRate: 0.79,
    audRate: 1.5,
    bdtRate: 120,
    inrRate: 85,
    locale: "en-US",
    showCents: false,
    showSeatSlider: true,
    seatLabel: "How many people are on your team?",
    seatSingular: "user",
    seatPlural: "users",
    minSeats: 1,
    maxSeats: 100,
    defaultSeats: 5,
    seatStep: 1,
    includedSeats: 1,
    showAddons: true,
    addon1Name: "Advanced analytics",
    addon1Price: 9,
    addon2Name: "Priority onboarding",
    addon2Price: 15,
    showScores: true,
    freeScore: 20,
    basicScore: 38,
    proScore: 76,
    enterpriseScore: 100,
    showBreakdown: true,
    showTooltips: true,
    showComparison: true,
    mobileTabs: true,
    featureData: featureDefaults,
    showFootnote: true,
    footnote:
        "Illustrative pricing. Configure plans, seats, add-ons and links in Framer properties.",
    ...labelDefaults,
}

// Framer property controls

const notCustom = (p: any) => p.theme !== "Custom"
const noSeats = (p: any) => !p.showSeatSlider
const noAddons = (p: any) => !p.showAddons
const noCurrency = (p: any) => !p.showCurrency

const str = (title: string, defaultValue: string, extra: any = {}) => ({
    title,
    type: ControlType.String,
    defaultValue,
    ...extra,
})
const num = (title: string, defaultValue: number, extra: any = {}) => ({
    title,
    type: ControlType.Number,
    defaultValue,
    min: 0,
    ...extra,
})
const bool = (title: string, defaultValue: boolean, extra: any = {}) => ({
    title,
    type: ControlType.Boolean,
    defaultValue,
    ...extra,
})
const color = (title: string, defaultValue: string) => ({
    title,
    type: ControlType.Color,
    defaultValue,
    hidden: notCustom,
})

const labelControls: Record<string, any> = Object.fromEntries(
    labelDefs.map(([key, title, def]) => [key, str(`Label · ${title}`, def)])
)

addPropertyControls(PricingMadeEasy_Interactive, {
    theme: {
        title: "Theme",
        type: ControlType.Enum,
        options: ["Midnight", "Aurora", "Sunset", "Frost", "Custom"],
        defaultValue: "Midnight",
    },
    background: color("Background", "#100E18"),
    cardColor: color("Card Color", "#1B1728"),
    textColor: color("Text Color", "#F8F5FF"),
    mutedColor: color("Muted Text", "#B6AFC8"),
    borderColor: color("Border", "#3A314B"),
    accent: color("Accent", "#9A5DF2"),
    accent2: color("Accent 2", "#E64AAE"),
    radius: num("Radius", 22, { max: 50 }),

    eyebrow: str("Eyebrow", "PREMIUM PRICING EXPERIENCE"),
    heading: str("Headline", "The right plan. The right price."),
    subtitle: str(
        "Subtitle",
        "Choose the plan that fits your team — with transparent pricing."
    ),

    freeName: str("Free Name", "Free"),
    basicName: str("Basic Name", "Basic"),
    proName: str("Pro Name", "Pro"),
    enterpriseName: str("Enterprise Name", "Enterprise"),
    freeDescription: str("Free Text", "For trying things out"),
    basicDescription: str("Basic Text", "For individuals and small projects"),
    proDescription: str("Pro Text", "For growing teams and ambitious work"),
    enterpriseDescription: str(
        "Enterprise Text",
        "For organizations scaling up"
    ),

    freePrice: num("Free Base", 0),
    basicPrice: num("Basic Base", 19),
    proPrice: num("Pro Base", 49),
    enterprisePrice: num("Enterprise Base", 149),
    freeSeatPrice: num("Free / Seat", 0, { hidden: noSeats }),
    basicSeatPrice: num("Basic / Seat", 3, { hidden: noSeats }),
    proSeatPrice: num("Pro / Seat", 6, { hidden: noSeats }),
    enterpriseSeatPrice: num("Enterprise / Seat", 9, { hidden: noSeats }),
    enterpriseCustomPrice: bool("Enterprise: Custom", false),

    freeButton: str("Free CTA", "Get Started Free"),
    basicButton: str("Basic CTA", "Get Started"),
    proButton: str("Pro CTA", "Start Free Trial"),
    enterpriseButton: str("Enterprise CTA", "Contact Sales"),
    freeLink: { title: "Free URL", type: ControlType.Link },
    basicLink: { title: "Basic URL", type: ControlType.Link },
    proLink: { title: "Pro URL", type: ControlType.Link },
    enterpriseLink: { title: "Enterprise URL", type: ControlType.Link },
    openLinksNewTab: bool("External: New Tab", false),

    featuredPlan: {
        title: "Most Popular Plan",
        type: ControlType.Enum,
        options: ["Free", "Basic", "Pro", "Enterprise"],
        optionTitles: ["Free", "Basic", "Pro", "Enterprise"],
        defaultValue: "Pro",
        description: "Choose the plan to highlight automatically.",
    },
    featuredLabel: str("Featured Badge", "MOST POPULAR"),

    defaultYearly: bool("Default Yearly", false),
    discount: num("Yearly Discount %", 20, { max: 100 }),

    showCurrency: bool("Currency Switch", true),
    currencySymbol: str("Base Symbol", "", {
        placeholder: "Auto from code",
        description: "Leave empty to use the symbol for the Base Code.",
        hidden: noCurrency,
    }),
    currencyCode: str("Base Code", "USD", {
        description:
            "Choose USD, EUR, GBP, AUD, BDT or INR. Unsupported codes fall back to USD. Rates below are manually configured per 1 USD, not live.",
        hidden: noCurrency,
    }),
    eurRate: num("EUR Rate", 0.92, { hidden: noCurrency }),
    gbpRate: num("GBP Rate", 0.79, { hidden: noCurrency }),
    audRate: num("AUD Rate", 1.5, { hidden: noCurrency }),
    bdtRate: num("BDT Rate", 120, { step: 0.01, hidden: noCurrency }),
    inrRate: num("INR Rate", 85, { step: 0.01, hidden: noCurrency }),
    locale: str("Number Locale", "en-US"),
    showCents: bool("Always Show Cents", false),

    showSeatSlider: bool("Seat Slider", true),
    seatLabel: str("Seat Question", "How many people are on your team?", {
        hidden: noSeats,
    }),
    seatSingular: str("Unit Singular", "user", { hidden: noSeats }),
    seatPlural: str("Unit Plural", "users", { hidden: noSeats }),
    minSeats: num("Minimum Seats", 1, { min: 1, hidden: noSeats }),
    maxSeats: num("Maximum Seats", 100, { min: 2, hidden: noSeats }),
    defaultSeats: num("Default Seats", 5, { min: 1, hidden: noSeats }),
    seatStep: num("Seat Step", 1, { min: 1, hidden: noSeats }),
    includedSeats: num("Included Seats", 1, { hidden: noSeats }),

    showAddons: bool("Optional Add-ons", true),
    addon1Name: str("Add-on 1 Name", "Advanced analytics", {
        hidden: noAddons,
    }),
    addon1Price: num("Add-on 1 Price", 9, { hidden: noAddons }),
    addon2Name: str("Add-on 2 Name", "Priority onboarding", {
        hidden: noAddons,
    }),
    addon2Price: num("Add-on 2 Price", 15, { hidden: noAddons }),

    showScores: bool("Value Scores", true),
    freeScore: num("Free Score", 20, {
        max: 100,
        hidden: (p: any) => !p.showScores,
    }),
    basicScore: num("Basic Score", 38, {
        max: 100,
        hidden: (p: any) => !p.showScores,
    }),
    proScore: num("Pro Score", 76, {
        max: 100,
        hidden: (p: any) => !p.showScores,
    }),
    enterpriseScore: num("Enterprise Score", 100, {
        max: 100,
        hidden: (p: any) => !p.showScores,
    }),

    showBreakdown: bool("Cost Breakdown", true),
    showTooltips: bool("Feature Tooltips", true),
    showComparison: bool("Full Comparison", true),
    mobileTabs: bool("Mobile Tabs", true),
    featureData: {
        title: "Feature Rows",
        type: ControlType.String,
        displayTextArea: true,
        defaultValue: featureDefaults,
        description:
            "# Group name, then: Label | Free | Basic | Pro | Enterprise | optional hint",
    },
    showFootnote: bool("Show Footnote", true),
    footnote: str(
        "Footnote",
        "Illustrative pricing. Configure plans, seats, add-ons and links in Framer properties.",
        { hidden: (p: any) => !p.showFootnote }
    ),

    // Keep editable interface labels together in the properties panel.
    ...labelControls,
})

// Default values for newly inserted component instances.
PricingMadeEasy_Interactive.defaultProps = { ...DEFAULTS }
