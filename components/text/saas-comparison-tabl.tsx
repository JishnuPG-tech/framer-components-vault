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

import { motion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function SaasComparisonTablePro(props) {
    const {
        // Theme
        theme = "light",
        accentColor,
        ctaTextColor,
        checkColor,
        crossColor,
        bgPrimary,
        bgSecondary,
        bgCategory,
        bgHighlight,
        borderHighlight,
        textPrimary,
        textSecondary,
        borderColor,

        // Layout
        borderRadius = 12,
        borderWidth = 1,
        shadow = "md",
        spacing = 20,

        // Typography
        fontSize = 15,
        textAlign = "center",

        // Advanced Effects (V3)
        hoverEffect = true,
        stickyHeader = true,
        mobileStack = true,

        // Plans
        plan1,
        plan2,
        plan3,
        plan4,
        plan5,
        plan6,

        // Features
        features = [],
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [hoveredRow, setHoveredRow] = React.useState<number | null>(null)

    // Use individual plan objects, with fallback values
    const p1 = plan1 || {
        show: true,
        name: "Starter",
        price: "$15",
        desc: "Perfect for starting out",
        cta: "Get Started",
        ctaLink: "https://www.framer.com/@ted-design/$0",
        highlight: false,
        badge: "",
    }
    const p2 = plan2 || {
        show: true,
        name: "Pro",
        price: "$49",
        desc: "Perfect for starting out",
        cta: "Get Started",
        ctaLink: "https://www.framer.com/@ted-design/$0",
        highlight: true,
        badge: "Most Popular",
    }
    const p3 = plan3 || {
        show: true,
        name: "Enterprise",
        price: "$99",
        desc: "Perfect for starting out",
        cta: "Get Started",
        ctaLink: "https://www.framer.com/@ted-design/$0",
        highlight: false,
        badge: "",
    }
    const p4 = plan4 || {
        show: false,
        name: "Plan 4",
        price: "$0",
        desc: "",
        cta: "Get Started",
        ctaLink: "https://www.framer.com/@ted-design/$0",
        highlight: false,
        badge: "",
    }
    const p5 = plan5 || {
        show: false,
        name: "Plan 5",
        price: "$0",
        desc: "",
        cta: "Get Started",
        ctaLink: "https://www.framer.com/@ted-design/$0",
        highlight: false,
        badge: "",
    }
    const p6 = plan6 || {
        show: false,
        name: "Plan 6",
        price: "$0",
        desc: "",
        cta: "Get Started",
        ctaLink: "https://www.framer.com/@ted-design/$0",
        highlight: false,
        badge: "",
    }

    const allPlans = [p1, p2, p3, p4, p5, p6]
    const planVisibility = allPlans.map((p) => p.show !== false)
    const activePlans = allPlans.filter((p) => p.show !== false)
    const planCount = activePlans.length

    const colors = React.useMemo(() => {
        switch (theme) {
            case "dark":
                return {
                    accent: "#ffffff",
                    ctaText: "#000000",
                    check: "#34D399",
                    cross: "#4B5563",
                    bg1: "#111827",
                    bg2: "#1F2937",
                    bgCat: "#374151",
                    bgHighlight: "rgba(255, 255, 255, 0.03)",
                    borderHighlight: "#ffffff",
                    text1: "#F9FAFB",
                    text2: "#9CA3AF",
                    border: "#374151",
                    backdrop: "none",
                }
            case "glass":
                return {
                    accent: "#ffffff",
                    ctaText: "#000000",
                    check: "#10B981",
                    cross: "rgba(255,255,255,0.2)",
                    bg1: "rgba(255, 255, 255, 0.05)",
                    bg2: "rgba(255, 255, 255, 0.02)",
                    bgCat: "rgba(255, 255, 255, 0.1)",
                    bgHighlight: "rgba(255, 255, 255, 0.08)",
                    borderHighlight: "#ffffff",
                    text1: "#ffffff",
                    text2: "rgba(255, 255, 255, 0.7)",
                    border: "rgba(255, 255, 255, 0.1)",
                    backdrop: "blur(24px)",
                }
            case "custom":
                return {
                    accent: accentColor,
                    ctaText: ctaTextColor,
                    check: checkColor,
                    cross: crossColor,
                    bg1: bgPrimary,
                    bg2: bgSecondary,
                    bgCat: bgCategory,
                    bgHighlight: bgHighlight || "#F0F9FF",
                    borderHighlight: borderHighlight || accentColor,
                    text1: textPrimary,
                    text2: textSecondary,
                    border: borderColor,
                    backdrop: "none",
                }
            case "light":
            default:
                return {
                    accent: "#111827",
                    ctaText: "#ffffff",
                    check: "#10B981",
                    cross: "#D1D5DB",
                    bg1: "#ffffff",
                    bg2: "#F9FAFB",
                    bgCat: "#F3F4F6",
                    bgHighlight: "#F9FAFB",
                    borderHighlight: "#111827",
                    text1: "#111827",
                    text2: "#6B7280",
                    border: "#E5E7EB",
                    backdrop: "none",
                }
        }
    }, [
        theme,
        accentColor,
        ctaTextColor,
        checkColor,
        crossColor,
        bgPrimary,
        bgSecondary,
        bgCategory,
        bgHighlight,
        borderHighlight,
        textPrimary,
        textSecondary,
        borderColor,
    ])

    const getShadow = (type) => {
        switch (type) {
            case "sm":
                return "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
            case "md":
                return "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            case "lg":
                return "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
            case "xl":
                return "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            case "none":
            default:
                return "none"
        }
    }

    const rootStyles = {
        "--tb-accent": colors.accent,
        "--tb-cta-text": colors.ctaText,
        "--tb-check": colors.check,
        "--tb-cross": colors.cross,
        "--tb-bg1": colors.bg1,
        "--tb-bg2": colors.bg2,
        "--tb-bgCat": colors.bgCat,
        "--tb-bgHighlight": colors.bgHighlight,
        "--tb-borderHighlight": colors.borderHighlight,
        "--tb-text1": colors.text1,
        "--tb-text2": colors.text2,
        "--tb-border": colors.border,
        "--tb-backdrop": colors.backdrop,
        "--tb-hover-bg":
            theme === "dark"
                ? "rgba(255,255,255,0.04)"
                : theme === "glass"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.03)",

        "--tb-radius": `${borderRadius}px`,
        "--tb-border-width": `${borderWidth}px`,
        "--tb-shadow": getShadow(shadow),
        "--tb-spacing": `${spacing}px`,
        "--tb-font-size": `${fontSize}px`,
        "--tb-flex-align":
            textAlign === "left"
                ? "flex-start"
                : textAlign === "right"
                  ? "flex-end"
                  : "center",
        "--tb-text-align": textAlign,

        ...containerStyle,
        ...style,
    }

    if (planCount === 0) {
        return (
            <div
                style={{
                    ...containerStyle,
                    ...style,
                    background: colors.bg1,
                    border: `1px dashed ${colors.border}`,
                    padding: 40,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <h3 style={{ color: colors.text1 }}>No Plans Enabled</h3>
                <p style={{ color: colors.text2 }}>
                    Please enable at least one plan in the property controls.
                </p>
            </div>
        )
    }

    return (
        <div style={rootStyles}>
            <style>{cssStyles}</style>

            {/* DESKTOP TABLE VIEW */}
            <div
                className={`table-scroll-container ${mobileStack ? "hide-on-mobile" : ""}`}
            >
                <div
                    className="table-grid"
                    style={{
                        gridTemplateColumns: `minmax(200px, 1.25fr) repeat(${planCount}, 1fr)`,
                    }}
                >
                    {/* Empty Header Cell */}
                    <div
                        className={`table-header-cell empty-header ${stickyHeader ? "sticky-header" : ""}`}
                    ></div>

                    {/* Plan Headers */}
                    {activePlans.map((plan, i) => (
                        <div
                            key={`header-${i}`}
                            className={`table-header-cell ${stickyHeader ? "sticky-header" : ""} ${plan.highlight ? "highlight-col" : ""}`}
                        >
                            {plan.badge && (
                                <span className="plan-badge">{plan.badge}</span>
                            )}
                            <h3 className="plan-name">{plan.name}</h3>
                            <div className="plan-price">{plan.price}</div>
                            <p className="plan-desc">{plan.desc}</p>

                            {plan.ctaLink ? (
                                <motion.a
                                    className="plan-cta"
                                    href={plan.ctaLink}
                                    whileHover={
                                        !isStatic ? { scale: 1.05 } : {}
                                    }
                                    whileTap={!isStatic ? { scale: 0.95 } : {}}
                                >
                                    {plan.cta}
                                </motion.a>
                            ) : (
                                <motion.button
                                    className="plan-cta"
                                    whileHover={
                                        !isStatic ? { scale: 1.05 } : {}
                                    }
                                    whileTap={!isStatic ? { scale: 0.95 } : {}}
                                >
                                    {plan.cta}
                                </motion.button>
                            )}
                        </div>
                    ))}

                    {/* Features Rows */}
                    {features.map((row, i) => {
                        if (row.isCategory) {
                            return (
                                <div
                                    key={`cat-${i}`}
                                    className="table-category-row"
                                    style={{ gridColumn: `1 / -1` }}
                                >
                                    {row.label}
                                </div>
                            )
                        }

                        // Fallback to safely handle old data structure from Framer UI
                        const vals = row.values || {
                            val1: row.val1,
                            val2: row.val2,
                            val3: row.val3,
                            val4: row.val4,
                            val5: row.val5,
                            val6: row.val6,
                        }

                        // Only map feature values for plans that are actively shown!
                        const valuesArray = [
                            vals.val1,
                            vals.val2,
                            vals.val3,
                            vals.val4,
                            vals.val5,
                            vals.val6,
                        ].filter((_, idx) => planVisibility[idx])

                        const isHovered = hoverEffect && hoveredRow === i

                        return (
                            <React.Fragment key={`row-${i}`}>
                                {/* Row Label */}
                                <div
                                    className="table-row-label"
                                    onMouseEnter={
                                        !isStatic
                                            ? () => setHoveredRow(i)
                                            : undefined
                                    }
                                    onMouseLeave={
                                        !isStatic
                                            ? () => setHoveredRow(null)
                                            : undefined
                                    }
                                    style={{
                                        background: isHovered
                                            ? "var(--tb-hover-bg)"
                                            : "var(--tb-bg1)",
                                    }}
                                >
                                    {row.label}
                                </div>

                                {/* Row Cells */}
                                {valuesArray.map((val, colIndex) => {
                                    const plan = activePlans[colIndex]
                                    const isHighlighted = plan?.highlight

                                    return (
                                        <div
                                            key={`cell-${i}-${colIndex}`}
                                            className={`table-row-cell ${isHighlighted ? "highlight-cell" : ""}`}
                                            onMouseEnter={
                                                !isStatic
                                                    ? () => setHoveredRow(i)
                                                    : undefined
                                            }
                                            onMouseLeave={
                                                !isStatic
                                                    ? () => setHoveredRow(null)
                                                    : undefined
                                            }
                                            style={{
                                                background: isHovered
                                                    ? "var(--tb-hover-bg)"
                                                    : isHighlighted
                                                      ? "var(--tb-bgHighlight)"
                                                      : "var(--tb-bg1)",
                                            }}
                                        >
                                            {renderCellValue(val, colors)}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>

            {/* MOBILE STACK VIEW (Only renders if enabled and on mobile) */}
            {mobileStack && (
                <div className="mobile-stack-table hide-on-desktop">
                    {activePlans.map((plan, planIndex) => {
                        const originalIndex = allPlans.findIndex(
                            (p) => p === plan
                        )

                        return (
                            <div
                                key={`mobile-plan-${planIndex}`}
                                className="mobile-plan-card"
                            >
                                <div
                                    className={`mobile-plan-header ${plan.highlight ? "highlight-header" : ""} ${stickyHeader ? "sticky-header" : ""}`}
                                >
                                    {plan.badge && (
                                        <span className="plan-badge">
                                            {plan.badge}
                                        </span>
                                    )}
                                    <h3 className="plan-name">{plan.name}</h3>
                                    <div className="plan-price">
                                        {plan.price}
                                    </div>
                                    <p className="plan-desc">{plan.desc}</p>
                                    {plan.ctaLink ? (
                                        <motion.a
                                            className="plan-cta"
                                            href={plan.ctaLink}
                                            whileHover={
                                                !isStatic ? { scale: 1.05 } : {}
                                            }
                                            whileTap={
                                                !isStatic ? { scale: 0.95 } : {}
                                            }
                                        >
                                            {plan.cta}
                                        </motion.a>
                                    ) : (
                                        <motion.button
                                            className="plan-cta"
                                            whileHover={
                                                !isStatic ? { scale: 1.05 } : {}
                                            }
                                            whileTap={
                                                !isStatic ? { scale: 0.95 } : {}
                                            }
                                        >
                                            {plan.cta}
                                        </motion.button>
                                    )}
                                </div>

                                <div className="mobile-plan-features">
                                    {features.map((row, rowIndex) => {
                                        if (row.isCategory) {
                                            return (
                                                <div
                                                    key={`mob-cat-${rowIndex}`}
                                                    className="table-category-row"
                                                >
                                                    {row.label}
                                                </div>
                                            )
                                        }

                                        const vals = row.values || {
                                            val1: row.val1,
                                            val2: row.val2,
                                            val3: row.val3,
                                            val4: row.val4,
                                            val5: row.val5,
                                            val6: row.val6,
                                        }
                                        const valKey = `val${originalIndex + 1}`
                                        const val = vals[valKey]

                                        return (
                                            <div
                                                key={`mob-row-${rowIndex}`}
                                                className="mobile-feature-row"
                                            >
                                                <span className="mobile-feature-label">
                                                    {row.label}
                                                </span>
                                                <span className="mobile-feature-value">
                                                    {renderCellValue(
                                                        val,
                                                        colors
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
            )}
        </div>
    )
}

interface TableColors {
    accent: string
    ctaText: string
    check: string
    cross: string
    bg1: string
    bg2: string
    bgCat: string
    bgHighlight: string
    borderHighlight: string
    text1: string
    text2: string
    border: string
    backdrop: string
}

function renderCellValue(value: string, colors: TableColors) {
    if (!value) return null

    const lowerVal = value.toLowerCase().trim()
    if (lowerVal === "check" || lowerVal === "true" || lowerVal === "yes") {
        return (
            <svg
                width="1.5em"
                height="1.5em"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: colors.check }}
            >
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        )
    }
    if (lowerVal === "cross" || lowerVal === "false" || lowerVal === "no") {
        return (
            <svg
                width="1.5em"
                height="1.5em"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: colors.cross }}
            >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        )
    }
    return <span>{value}</span>
}

const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    overflow: "hidden",
}

const cssStyles = `
  /* Responsive Display Toggles */
  .hide-on-mobile { display: block; }
  .hide-on-desktop { display: none; }
  
  @media (max-width: 768px) {
    .hide-on-mobile { display: none !important; }
    .hide-on-desktop { display: flex !important; }
  }

  /* Desktop Grid Container */
  .table-scroll-container {
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    border: var(--tb-border-width) solid var(--tb-border);
    border-radius: var(--tb-radius);
    background: var(--tb-bg1);
    box-shadow: var(--tb-shadow);
    backdrop-filter: var(--tb-backdrop);
    -webkit-backdrop-filter: var(--tb-backdrop);
    position: relative;
  }
  .table-grid {
    display: grid;
    min-width: 800px;
    font-size: var(--tb-font-size);
  }
  .table-header-cell {
    padding: calc(var(--tb-spacing) * 2) var(--tb-spacing) var(--tb-spacing);
    border-bottom: var(--tb-border-width) solid var(--tb-border);
    background: var(--tb-bg2);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .empty-header {
    background: var(--tb-bg1);
  }
  
  /* Highlight Column Styles */
  .highlight-col {
    background: var(--tb-bgHighlight);
    border-top: 4px solid var(--tb-borderHighlight);
  }
  .highlight-cell {
    background: var(--tb-bgHighlight);
  }
  .plan-badge {
    position: absolute;
    top: 0;
    transform: translateY(-50%);
    background: var(--tb-accent);
    color: var(--tb-cta-text);
    font-size: 0.75em;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Typography */
  .plan-name {
    margin: 0 0 calc(var(--tb-spacing) * 0.4) 0;
    font-size: 1.1em;
    font-weight: 600;
    color: var(--tb-text1);
  }
  .plan-price {
    font-size: 2.4em;
    font-weight: 800;
    margin: 0 0 calc(var(--tb-spacing) * 0.4) 0;
    letter-spacing: -0.02em;
    color: var(--tb-text1);
  }
  .plan-desc {
    font-size: 0.95em;
    color: var(--tb-text2);
    margin: 0 0 calc(var(--tb-spacing) * 1.2) 0;
    line-height: 1.4;
  }
  .plan-cta {
    padding: calc(var(--tb-spacing) * 0.6) var(--tb-spacing);
    background: var(--tb-accent);
    color: var(--tb-cta-text);
    border: none;
    border-radius: calc(var(--tb-radius) * 0.5);
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    margin-top: auto;
    text-decoration: none;
    display: inline-block;
    box-sizing: border-box;
  }

  /* Row Cells */
  .table-category-row {
    background: var(--tb-bgCat);
    padding: calc(var(--tb-spacing) * 0.8) var(--tb-spacing);
    font-size: 0.9em;
    font-weight: 700;
    color: var(--tb-text1);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: var(--tb-border-width) solid var(--tb-border);
    text-align: left;
  }
  .table-row-label {
    padding: var(--tb-spacing);
    border-bottom: var(--tb-border-width) solid var(--tb-border);
    font-size: 1em;
    font-weight: 500;
    display: flex;
    align-items: center;
    color: var(--tb-text1);
    text-align: left;
    transition: background-color 0.2s ease;
  }
  .table-row-cell {
    padding: var(--tb-spacing);
    border-bottom: var(--tb-border-width) solid var(--tb-border);
    display: flex;
    align-items: center;
    justify-content: var(--tb-flex-align);
    text-align: var(--tb-text-align);
    font-size: 1em;
    color: var(--tb-text2);
    transition: background-color 0.2s ease;
  }

  /* Mobile Stack Card Styles */
  .mobile-stack-table {
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
    font-size: var(--tb-font-size);
  }
  .mobile-plan-card {
    border: var(--tb-border-width) solid var(--tb-border);
    border-radius: var(--tb-radius);
    background: var(--tb-bg1);
    box-shadow: var(--tb-shadow);
    overflow: hidden;
  }
  .mobile-plan-header {
    padding: calc(var(--tb-spacing) * 2) var(--tb-spacing) var(--tb-spacing);
    background: var(--tb-bg2);
    text-align: center;
    border-bottom: var(--tb-border-width) solid var(--tb-border);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .mobile-plan-header.highlight-header {
    background: var(--tb-bgHighlight);
    border-top: 4px solid var(--tb-borderHighlight);
  }
  .mobile-plan-features {
    display: flex;
    flex-direction: column;
  }
  .mobile-feature-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--tb-spacing);
    border-bottom: var(--tb-border-width) solid var(--tb-border);
    background: var(--tb-bg1);
  }
  .mobile-feature-row:last-child {
    border-bottom: none;
  }
  .mobile-feature-label {
    font-weight: 500;
    color: var(--tb-text1);
    text-align: left;
    margin-right: 16px;
  }
  .mobile-feature-value {
    color: var(--tb-text2);
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
`

const createPlanControls = (index: number) => ({
    [`plan${index}`]: {
        type: ControlType.Object,
        title: `Plan ${index}`,
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show Plan",
                defaultValue: index <= 3,
            },
            name: {
                type: ControlType.String,
                title: "Name",
                hidden: (p: any) => p.show === false,
            },
            price: {
                type: ControlType.String,
                title: "Price",
                hidden: (p: any) => p.show === false,
            },
            desc: {
                type: ControlType.String,
                title: "Desc",
                hidden: (p: any) => p.show === false,
            },
            cta: {
                type: ControlType.String,
                title: "CTA Text",
                hidden: (p: any) => p.show === false,
            },
            ctaLink: {
                type: ControlType.Link,
                title: "CTA Link",
                hidden: (p: any) => p.show === false,
            },
            highlight: {
                type: ControlType.Boolean,
                title: "Highlight (Featured)",
                hidden: (p: any) => p.show === false,
            },
            badge: {
                type: ControlType.String,
                title: "Badge Text",
                hidden: (p: any) => p.show === false,
            },
        },
        defaultValue: {
            show: index <= 3,
            name:
                index === 1
                    ? "Starter"
                    : index === 2
                      ? "Pro"
                      : index === 3
                        ? "Enterprise"
                        : `Plan ${index}`,
            price:
                index === 1
                    ? "$15"
                    : index === 2
                      ? "$49"
                      : index === 3
                        ? "$99"
                        : "$0",
            desc: "Perfect for starting out",
            cta: "Get Started",
            ctaLink: "",
            highlight: index === 2,
            badge: index === 2 ? "Most Popular" : "",
        },
    },
})

addPropertyControls(SaasComparisonTablePro, {
    // ----------------------
    // THEME & STYLES
    // ----------------------
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "glass", "custom"],
        optionTitles: ["Light", "Dark", "Glass", "Custom"],
        defaultValue: "light",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#3B82F6",
        hidden: (props: any) => props.theme !== "custom",
    },
    ctaTextColor: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#FFFFFF",
        hidden: (props: any) => props.theme !== "custom",
    },
    checkColor: {
        type: ControlType.Color,
        title: "Check Icon",
        defaultValue: "#10B981",
        hidden: (props: any) => props.theme !== "custom",
    },
    crossColor: {
        type: ControlType.Color,
        title: "Cross Icon",
        defaultValue: "#D1D5DB",
        hidden: (props: any) => props.theme !== "custom",
    },

    // Custom Table Colors
    bgPrimary: {
        type: ControlType.Color,
        title: "List Table BG",
        defaultValue: "#FFFFFF",
        hidden: (props: any) => props.theme !== "custom",
    },
    bgSecondary: {
        type: ControlType.Color,
        title: "Plan Header BG",
        defaultValue: "#F9FAFB",
        hidden: (props: any) => props.theme !== "custom",
    },
    bgHighlight: {
        type: ControlType.Color,
        title: "Highlight BG",
        defaultValue: "#F0F9FF",
        hidden: (props: any) => props.theme !== "custom",
    },
    borderHighlight: {
        type: ControlType.Color,
        title: "Highlight Border",
        defaultValue: "#3B82F6",
        hidden: (props: any) => props.theme !== "custom",
    },

    bgCategory: {
        type: ControlType.Color,
        title: "Category BG",
        defaultValue: "#F3F4F6",
        hidden: (props: any) => props.theme !== "custom",
    },
    textPrimary: {
        type: ControlType.Color,
        title: "Primary Text",
        defaultValue: "#111827",
        hidden: (props: any) => props.theme !== "custom",
    },
    textSecondary: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "#6B7280",
        hidden: (props: any) => props.theme !== "custom",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#E5E7EB",
        hidden: (props: any) => props.theme !== "custom",
    },

    // ----------------------
    // LAYOUT
    // ----------------------
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 5,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 20,
        min: 8,
        max: 48,
    },
    shadow: {
        type: ControlType.Enum,
        title: "Shadow",
        options: ["none", "sm", "md", "lg", "xl"],
        optionTitles: ["None", "Small", "Medium", "Large", "Extra Large"],
        defaultValue: "md",
    },

    // ----------------------
    // TYPOGRAPHY
    // ----------------------
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 15,
        min: 10,
        max: 24,
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },

    // ----------------------
    // ADVANCED EFFECTS (V3)
    // ----------------------
    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Highlight",
        defaultValue: true,
    },
    stickyHeader: {
        type: ControlType.Boolean,
        title: "Sticky Header",
        defaultValue: true,
    },
    mobileStack: {
        type: ControlType.Boolean,
        title: "Mobile Stack",
        defaultValue: true,
    },

    // ----------------------
    // CONTENT
    // ----------------------
    ...createPlanControls(1),
    ...createPlanControls(2),
    ...createPlanControls(3),
    ...createPlanControls(4),
    ...createPlanControls(5),
    ...createPlanControls(6),

    features: {
        type: ControlType.Array,
        title: "Features (Rows)",
        control: {
            type: ControlType.Object,
            controls: {
                isCategory: {
                    type: ControlType.Boolean,
                    title: "Is Category?",
                    defaultValue: false,
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Feature",
                },
                values: {
                    type: ControlType.Object,
                    title: "Plan Values",
                    hidden: (props: any) => props.isCategory,
                    controls: {
                        val1: {
                            type: ControlType.String,
                            title: "Plan 1",
                            defaultValue: "check",
                        },
                        val2: {
                            type: ControlType.String,
                            title: "Plan 2",
                            defaultValue: "check",
                        },
                        val3: {
                            type: ControlType.String,
                            title: "Plan 3",
                            defaultValue: "check",
                        },
                        val4: {
                            type: ControlType.String,
                            title: "Plan 4",
                            defaultValue: "cross",
                        },
                        val5: {
                            type: ControlType.String,
                            title: "Plan 5",
                            defaultValue: "cross",
                        },
                        val6: {
                            type: ControlType.String,
                            title: "Plan 6",
                            defaultValue: "cross",
                        },
                    },
                },
            },
        },
        defaultValue: [
            { isCategory: true, label: "Core Features" },
            {
                isCategory: false,
                label: "Users",
                values: {
                    val1: "1",
                    val2: "5",
                    val3: "Unlimited",
                    val4: "Unlimited",
                    val5: "Unlimited",
                    val6: "Unlimited",
                },
            },
            {
                isCategory: false,
                label: "Projects",
                values: {
                    val1: "3",
                    val2: "10",
                    val3: "Unlimited",
                    val4: "Unlimited",
                    val5: "Unlimited",
                    val6: "Unlimited",
                },
            },
            {
                isCategory: false,
                label: "Analytics",
                values: {
                    val1: "cross",
                    val2: "check",
                    val3: "check",
                    val4: "check",
                    val5: "check",
                    val6: "check",
                },
            },
            { isCategory: true, label: "Support" },
            {
                isCategory: false,
                label: "Email Support",
                values: {
                    val1: "check",
                    val2: "check",
                    val3: "check",
                    val4: "check",
                    val5: "check",
                    val6: "check",
                },
            },
            {
                isCategory: false,
                label: "Priority Support",
                values: {
                    val1: "cross",
                    val2: "check",
                    val3: "check",
                    val4: "check",
                    val5: "check",
                    val6: "check",
                },
            },
            {
                isCategory: false,
                label: "24/7 Phone",
                values: {
                    val1: "cross",
                    val2: "cross",
                    val3: "check",
                    val4: "check",
                    val5: "check",
                    val6: "check",
                },
            },
        ],
    },
})
