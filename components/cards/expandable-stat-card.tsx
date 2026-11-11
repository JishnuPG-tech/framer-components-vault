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

import { useReducedMotion } from "framer-motion"

type ResultItem = {
    value: string
    label: string
    category: string
    description: string
    ctaLabel: string
    link: string
    accent: string
}

interface Props {
    items: ResultItem[]
    initialCard: number
    cardHeight: number
    gap: number
    radius: number
    padding: number
    background: string
    ink: string
    mutedInk: string
    buttonBackground: string
    buttonInk: string
    animation: number
    numberFont?: React.CSSProperties
    titleFont?: React.CSSProperties
    detailFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: ResultItem[] = [
    {
        value: "+42%",
        label: "More meaningful sign-ups.",
        category: "01 / GROWTH",
        description: "A clearer experience turns more first visits into lasting connections.",
        ctaLabel: "Explore the result",
        link: "",
        accent: "#D9FC70",
    },
    {
        value: "3.2×",
        label: "Faster from day one.",
        category: "02 / UX",
        description: "Less friction, more flow. Designed to help people get to what matters.",
        ctaLabel: "Explore the result",
        link: "",
        accent: "#C9C8FC",
    },
    {
        value: "18 d",
        label: "From idea to launch.",
        category: "03 / BUILD",
        description: "Thoughtful decisions and a focused process make every day count.",
        ctaLabel: "Explore the result",
        link: "",
        accent: "#F7BAA9",
    },
]

const BASE_NUMBER: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontWeight: 600,
    lineHeight: 0.95,
    letterSpacing: "-0.078em",
}
const BASE_TITLE: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontWeight: 500,
    lineHeight: 1.12,
    letterSpacing: "-0.045em",
}
const BASE_BODY: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.42,
}
const BASE_LABEL: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.075em",
    lineHeight: 1.2,
}

function Arrow({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 19 19 5M8 5h11v11" />
        </svg>
    )
}

function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max)
}

function numericFontSize(style: React.CSSProperties | undefined, fallback: number) {
    const numeric = Number.parseFloat(String(style?.fontSize ?? fallback))
    return Number.isFinite(numeric) ? clamp(numeric, 10, 180) : fallback
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 376
 */
export default function ExpandableStatsCards(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        initialCard = 0,
        cardHeight = 360,
        gap = 12,
        radius = 24,
        padding = 28,
        background = "#FFFFFF",
        ink = "#171917",
        mutedInk = "#363A35",
        buttonBackground = "#171917",
        buttonInk = "#FFFFFF",
        animation = 0.55,
        numberFont,
        titleFont,
        detailFont,
        labelFont,
        style,
    } = props

    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const safeItems = Array.isArray(items) && items.length > 0 ? items : DEFAULT_ITEMS
    const [active, setActive] = React.useState(
        () => clamp(Math.round(initialCard || 0), 0, safeItems.length - 1)
    )
    React.useEffect(() => {
        setActive(clamp(Math.round(initialCard || 0), 0, safeItems.length - 1))
    }, [initialCard, safeItems.length])

    const rootId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const scope = "impact-rail-" + rootId
    const selector = "." + scope
    const duration = staticRenderer || reducedMotion ? 0 : clamp(animation, 0.1, 1.5)
    const numSize = numericFontSize(numberFont, 88)
    const titleSize = numericFontSize(titleFont, 27)
    const pad = Math.max(14, padding)

    // Container queries use the actual component width in every Framer render target.
    // No viewport-width guesses, ResizeObserver, hydration measurement or desktop-first fallback.
    const css = [
        selector + " .ir-rail {display:flex;flex-direction:row;align-items:stretch;gap:var(--ir-gap);width:100%;min-width:0}",
        selector + " .ir-card {position:relative;isolation:isolate;overflow:hidden;min-width:0;flex:1 1 0%;height:var(--ir-height);box-sizing:border-box;transition:flex-grow var(--ir-duration) cubic-bezier(.22,1,.36,1),height var(--ir-duration) cubic-bezier(.22,1,.36,1)}",
        selector + " .ir-card.ir-active {flex-grow:2.15}",
        selector + " .ir-head {position:absolute;top:var(--ir-pad);left:var(--ir-pad);right:var(--ir-pad);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:0;pointer-events:none}",
        selector + " .ir-arrow {width:34px;height:34px;min-width:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--ir-arrow-border);transform:rotate(45deg);transition:transform var(--ir-duration) cubic-bezier(.22,1,.36,1)}",
        selector + " .ir-active .ir-arrow {transform:rotate(0)}",
        selector + " .ir-main {position:absolute;left:var(--ir-pad);right:var(--ir-pad);bottom:var(--ir-pad);pointer-events:none;transform:translateY(0);transition:transform var(--ir-duration) cubic-bezier(.22,1,.36,1)}",
        selector + " .ir-active .ir-main {transform:translateY(-115px)}",
        selector + " .ir-number {white-space:nowrap;font-variant-numeric:tabular-nums;font-size:var(--ir-num-open);margin-bottom:13px;transform:scale(.75);transform-origin:left bottom;transition:transform var(--ir-duration) cubic-bezier(.22,1,.36,1)}",
        selector + " .ir-active .ir-number {transform:scale(1)}",
        selector + " .ir-title {margin:0;max-width:210px;font-size:var(--ir-title-closed);transition:font-size var(--ir-duration) cubic-bezier(.22,1,.36,1),max-width var(--ir-duration) cubic-bezier(.22,1,.36,1)}",
        selector + " .ir-active .ir-title {max-width:420px;font-size:var(--ir-title-open)}",
        selector + " .ir-toggle {position:absolute;inset:0;z-index:1;padding:0;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:inherit}",
        
        selector + " .ir-toggle:focus-visible,.ir-link:focus-visible {outline:3px solid currentColor;outline-offset:-5px}",
        selector + " .ir-link {position:absolute;z-index:2;inset:0;padding:0 var(--ir-pad) var(--ir-pad);box-sizing:border-box;cursor:pointer;display:flex;flex-direction:row;align-items:flex-end;justify-content:space-between;gap:14px;color:inherit;text-decoration:none;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(8px);transition:opacity var(--ir-duration) ease,transform var(--ir-duration) cubic-bezier(.22,1,.36,1),visibility 0s linear var(--ir-duration)}",
        selector + " .ir-active .ir-link {opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0);transition:opacity var(--ir-duration) ease,transform var(--ir-duration) cubic-bezier(.22,1,.36,1),visibility 0s}",
        selector + " .ir-desc {max-width:250px;min-width:0;margin:0}",
        selector + " .ir-pill {display:inline-flex;align-items:center;justify-content:space-between;gap:20px;white-space:nowrap;min-height:43px;box-sizing:border-box;border-radius:100px;padding:0 16px;font:550 12px/1 Inter,Arial,sans-serif;transition:transform var(--ir-duration) cubic-bezier(.22,1,.36,1)}",
        selector + " .ir-link:hover .ir-pill {transform:translateY(-3px)}",
        "@container impactRail (max-width: 899px) {" +
            selector + " .ir-link {flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:10px}" +
            
            selector + " .ir-active .ir-main {transform:translateY(-137px)}" +
            selector + " .ir-number {font-size:var(--ir-num-open-tablet);transform:scale(.69)}" +
            selector + " .ir-active .ir-number {transform:scale(1)}" +
            selector + " .ir-title {font-size:var(--ir-title-tablet)}" +
            selector + " .ir-active .ir-title {font-size:var(--ir-title-open)}" +
        "}",
        "@container impactRail (max-width: 699px) {" +
            selector + " .ir-rail {flex-direction:column}" +
            selector + " .ir-card {flex:0 0 auto;height:204px}" +
            selector + " .ir-card.ir-active {height:320px}" +
            selector + " .ir-main {bottom:var(--ir-pad)}" +
            selector + " .ir-active .ir-main {transform:translateY(-130px)}" +
            selector + " .ir-number {font-size:var(--ir-num-open-mobile);transform:scale(.70)}" +
            selector + " .ir-active .ir-number {transform:scale(1)}" +
            selector + " .ir-title {font-size:var(--ir-title-mobile)}" +
            selector + " .ir-active .ir-title {font-size:var(--ir-title-open)}" +
            
            
        "}",
        "@container impactRail (max-width: 419px) {" +
            selector + " .ir-card.ir-active {height:390px}" +
            selector + " .ir-active .ir-main {transform:translateY(-155px)}" +
            selector + " .ir-number {font-size:var(--ir-num-open-narrow);transform:scale(.8)}" +
            selector + " .ir-active .ir-number {transform:scale(1)}" +
            selector + " .ir-active .ir-title {font-size:var(--ir-title-open-narrow)}" +
            
            
        "}",
        "@media(prefers-reduced-motion: reduce) {" +
            selector + " .ir-card," + selector + " .ir-main," + selector + " .ir-number," +
            selector + " .ir-title," + selector + " .ir-arrow," +
            selector + " .ir-link," + selector + " .ir-pill {transition:none!important}" +
        "}"
    ].join("\n")

    const rootStyle = {
        ...style,
        width: "100%",
        height: "auto",
        minWidth: 0,
        boxSizing: "border-box" as const,
        background,
        containerType: "inline-size" as const,
        containerName: "impactRail",
        "--ir-duration": duration + "s",
        "--ir-height": Math.max(280, cardHeight) + "px",
        "--ir-pad": pad + "px",
        "--ir-gap": Math.max(0, gap) + "px",
        "--ir-border": ink + "45",
        "--ir-arrow-border": ink + "75",
        "--ir-num-closed": Math.round(numSize * 0.75) + "px",
        "--ir-num-open": Math.round(numSize) + "px",
        "--ir-num-tablet": Math.round(numSize * 0.6) + "px",
        "--ir-num-open-tablet": Math.round(numSize * 0.88) + "px",
        "--ir-num-mobile": Math.round(numSize * 0.61) + "px",
        "--ir-num-open-mobile": Math.round(numSize * 0.88) + "px",
        "--ir-num-open-narrow": Math.round(numSize * 0.77) + "px",
        "--ir-title-closed": Math.round(titleSize * 0.75) + "px",
        "--ir-title-open": Math.round(titleSize * 1.07) + "px",
        "--ir-title-tablet": Math.round(titleSize * 0.74) + "px",
        "--ir-title-mobile": Math.round(titleSize * 0.78) + "px",
        "--ir-title-open-narrow": Math.round(titleSize * 0.9) + "px",
    } as React.CSSProperties

    return (
        <div className={scope} style={rootStyle}>
            <style>{css}</style>
            <div className="ir-rail" role="group" aria-label="Key results">
                {safeItems.map((item, index) => {
                    const expanded = index === active
                    const link = typeof item.link === "string" ? item.link.trim() : ""
                    const details = (
                        <>
                            <p className="ir-desc" style={{ ...BASE_BODY, ...detailFont, color: mutedInk }}>
                                {item.description}
                            </p>
                            {link && <span className="ir-pill" style={{ background: buttonBackground, color: buttonInk }}>
                                {item.ctaLabel || "Explore the result"}
                                <Arrow size={14} />
                            </span>}
                        </>
                    )
                    return (
                        <article key={index}
                            className={"ir-card" + (expanded ? " ir-active" : "")}
                            style={{
                                backgroundColor: item.accent || "#D9FC70",
                                color: ink,
                                borderRadius: Math.max(0, radius),
                            }}>
                            {!expanded && <button
                                type="button"
                                className="ir-toggle"
                                aria-pressed={expanded}
                                aria-label={(expanded ? "Selected result: " : "Show result: ") + (item.label || item.value)}
                                onClick={() => { if (!staticRenderer) setActive(index) }}
                            />}
                            <div className="ir-head">
                                <span style={{ ...BASE_LABEL, ...labelFont, color: ink }}>
                                    {item.category || String(index + 1).padStart(2, "0") + " / RESULT"}
                                </span>
                                <span className="ir-arrow" aria-hidden="true"><Arrow size={17} /></span>
                            </div>
                            <div className="ir-main">
                                <div className="ir-number"
                                    style={{ ...BASE_NUMBER, ...numberFont, fontSize: undefined, color: ink }}>
                                    {item.value || "42%"}
                                </div>
                                <h3 className="ir-title"
                                    style={{ ...BASE_TITLE, ...titleFont, fontSize: undefined, color: ink }}>
                                    {item.label || "Your result."}
                                </h3>
                            </div>
                            {link ? (
                                <a className="ir-link" href={link}
                                    target="_blank" rel="noopener noreferrer"
                                    tabIndex={expanded ? 0 : -1}
                                    aria-hidden={!expanded}
                                    aria-label={(item.ctaLabel || "View result") + ": " + (item.label || item.value)}>
                                    {details}
                                </a>
                            ) : (
                                <div className="ir-link" aria-hidden={!expanded} style={{ cursor: "default", pointerEvents: "none" }}>{details}</div>
                            )}
                        </article>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ExpandableStatsCards, {
    items: {
        type: ControlType.Array, title: "Results", maxCount: 4,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                value: { type: ControlType.String, title: "Value", defaultValue: "+42%" },
                label: { type: ControlType.String, title: "Headline", defaultValue: "More meaningful sign-ups." },
                category: { type: ControlType.String, title: "Eyebrow", defaultValue: "01 / GROWTH" },
                description: { type: ControlType.String, title: "Detail", displayTextArea: true, defaultValue: "A little more context behind the number." },
                ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "Explore the result" },
                link: { type: ControlType.Link, title: "CTA Link", defaultValue: "" },
                accent: { type: ControlType.Color, title: "Card Color", defaultValue: "#D9FC70" },
            },
        },
    },
    initialCard: { type: ControlType.Number, title: "Open Card", defaultValue: 0, min: 0, max: 7, step: 1 },
    cardHeight: { type: ControlType.Number, title: "Height", defaultValue: 360, min: 280, max: 560, step: 10, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 12, min: 0, max: 40, step: 1, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 24, min: 0, max: 60, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 28, min: 14, max: 48, step: 1, unit: "px" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    ink: { type: ControlType.Color, title: "Text Color", defaultValue: "#171917" },
    mutedInk: { type: ControlType.Color, title: "Detail Color", defaultValue: "#363A35" },
    buttonBackground: { type: ControlType.Color, title: "CTA Background", defaultValue: "#171917" },
    buttonInk: { type: ControlType.Color, title: "CTA Text", defaultValue: "#FFFFFF" },
    animation: { type: ControlType.Number, title: "Animation", defaultValue: 0.55, min: 0.1, max: 1.5, step: 0.05, unit: "s" },
    numberFont: { type: ControlType.Font, title: "Number Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "88px", variant: "Semibold", letterSpacing: "-0.08em", lineHeight: "0.95em" } },
    titleFont: { type: ControlType.Font, title: "Headline Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "27px", variant: "Medium", letterSpacing: "-0.05em", lineHeight: "1.12em" } },
    detailFont: { type: ControlType.Font, title: "Detail Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "14px", variant: "Regular", lineHeight: "1.42em" } },
    labelFont: { type: ControlType.Font, title: "Eyebrow Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "11px", variant: "Semibold", letterSpacing: "0.07em" } },
})
