// Create a brutalist-style navigation bar in Framer.
// Design:
// - Background: #F5F0E8 (warm off-white)
// - Height: 90px, full width, padding 0 40px
// - Left: Giant logo text — font-size 52px, font-weight 900, font-family: "Impact" or condensed, color #111, line-height 1
// - Right: Nav items in condensed bold uppercase — font-size 13px, letter-spacing 0.2em
//   - Active item: yellow (#FFE600) rectangle background behind text
//   - Hover: text shifts down 2px (transform translateY)
// - A thick 3px black bottom border
// - Across top: a 6px stripe in yellow (#FFE600)
// - No rounded corners anywhere
// - Mobile: same bold styling, hamburger → block overlay with giant vertical text links
// - The logo should have a hover effect: color fills with yellow from left

import React, {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type NavItem = {
    label: string
    href: string
    active: boolean
}

type MobileNavItem = NavItem & {
    variant?: "link" | "cta"
}

type Props = {
    logoText: string
    logoHref: string
    items: NavItem[]
    mobileMenuItems: MobileNavItem[]
    background: string
    accent: string
    textColor: string
    borderColor: string
    height: number
    horizontalPadding: number
    stripeHeight: number
    borderBottomWidth: number
    gap: number
    mobileBreakpoint: number
    logoFont: any
    itemFont: any
    overlayFont: any
    overlayBackground: string
    showOverlayClose: boolean
    mobileMenuGap: number
    mobileMenuPadding: number
    enablePerformanceMonitoring: boolean
    style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

// Performance monitoring utilities
function usePerformanceMonitor(componentName: string, enabled: boolean) {
    const renderCount = useRef(0)
    const renderTimes = useRef<number[]>([])
    const mountTime = useRef<number>(0)

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return
        mountTime.current = performance.now()

        return () => {
            if (enabled && typeof window !== "undefined") {
                const lifetime = performance.now() - mountTime.current
                console.log(`[Performance] ${componentName} lifetime: ${lifetime.toFixed(2)}ms`)
            }
        }
    }, [componentName, enabled])

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return

        const startTime = performance.now()
        renderCount.current += 1

        return () => {
            const renderTime = performance.now() - startTime
            renderTimes.current.push(renderTime)

            // Keep only last 10 renders
            if (renderTimes.current.length > 10) {
                renderTimes.current.shift()
            }

            const avgRenderTime =
                renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length

            if (renderCount.current % 5 === 0) {
                console.log(
                    `[Performance] ${componentName} - Renders: ${renderCount.current}, Avg: ${avgRenderTime.toFixed(2)}ms, Last: ${renderTime.toFixed(2)}ms`
                )
            }
        }
    })

    return {
        renderCount: renderCount.current,
        avgRenderTime:
            renderTimes.current.length > 0
                ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
                : 0,
    }
}

function useResourceMonitor(enabled: boolean) {
    const [metrics, setMetrics] = useState<{
        memory?: number
        connection?: string
        devicePixelRatio?: number
        cores?: number
    }>({})

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return

        const updateMetrics = () => {
            const newMetrics: typeof metrics = {
                devicePixelRatio: window.devicePixelRatio,
            }

            // @ts-ignore - performance.memory is non-standard
            if (performance.memory) {
                // @ts-ignore
                newMetrics.memory = performance.memory.usedJSHeapSize / 1048576 // MB
            }

            // @ts-ignore - navigator.connection is experimental
            if (navigator.connection) {
                // @ts-ignore
                newMetrics.connection = navigator.connection.effectiveType
            }

            if (navigator.hardwareConcurrency) {
                newMetrics.cores = navigator.hardwareConcurrency
            }

            startTransition(() => setMetrics(newMetrics))
        }

        updateMetrics()
        const interval = setInterval(updateMetrics, 5000)

        return () => clearInterval(interval)
    }, [enabled])

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return

        if (Object.keys(metrics).length > 0) {
            console.log("[Performance] Resource Metrics:", {
                memory: metrics.memory ? `${metrics.memory.toFixed(2)} MB` : "N/A",
                connection: metrics.connection || "N/A",
                devicePixelRatio: metrics.devicePixelRatio || "N/A",
                cores: metrics.cores || "N/A",
            })
        }
    }, [metrics, enabled])

    return metrics
}

/**
 * Brutalist Navbar
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 90
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function BrutalistNavbar(props: Props) {
    const {
        logoText = "BRUT",
        logoHref = "#",
        items = [
            { label: "WORK", href: "#", active: true },
            { label: "ABOUT", href: "#", active: false },
            { label: "CONTACT", href: "#", active: false },
        ],
        mobileMenuItems = [
            { label: "WORK", href: "#", active: true, variant: "link" },
            { label: "ABOUT", href: "#", active: false, variant: "link" },
            { label: "CONTACT", href: "#", active: false, variant: "link" },
            { label: "GET STARTED", href: "#", active: false, variant: "cta" },
        ],
        background = "#F5F0E8",
        accent = "#FFE600",
        textColor = "#111111",
        borderColor = "#000000",
        height = 90,
        horizontalPadding = 40,
        stripeHeight = 6,
        borderBottomWidth = 3,
        gap = 26,
        mobileBreakpoint = 768,
        overlayBackground = "#F5F0E8",
        showOverlayClose = true,
        mobileMenuGap = 18,
        mobileMenuPadding = 30,
        enablePerformanceMonitoring = false,
        logoFont,
        itemFont,
        overlayFont,
        style,
    } = props

    // Performance monitoring hooks
    const perfMetrics = usePerformanceMonitor("BrutalistNavbar", enablePerformanceMonitoring)
    const resourceMetrics = useResourceMonitor(enablePerformanceMonitoring)

    const id = useId().replace(/:/g, "")
    const rootClass = useMemo(() => `brutnav_${id}`, [id])
    const isStatic = useIsStaticRenderer()

    const [isMobile, setIsMobile] = useState(false)
    const [open, setOpen] = useState(false)

    const safeGap = clamp(gap, 0, 80)

    const computeIsMobile = useCallback(() => {
        if (typeof window === "undefined") return false
        return window.innerWidth <= mobileBreakpoint
    }, [mobileBreakpoint])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        const update = () => {
            const next = computeIsMobile()
            startTransition(() => setIsMobile(next))
            if (!next) startTransition(() => setOpen(false))
        }

        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [computeIsMobile, isStatic])

    const toggleOpen = useCallback(() => {
        startTransition(() => setOpen((v) => !v))
    }, [])

    const close = useCallback(() => {
        startTransition(() => setOpen(false))
    }, [])

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") close()
        },
        [close]
    )

    const itemNodes = useMemo(() => {
        return (items || []).map((item, idx) => {
            const label = item?.label ?? `ITEM ${idx + 1}`
            const href = item?.href ?? "#"
            const active = !!item?.active

            return (
                <a
                    key={`${label}_${idx}`}
                    className={`${rootClass}__item ${active ? `${rootClass}__item--active` : ""}`}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={isMobile ? close : undefined}
                >
                    {label}
                </a>
            )
        })
    }, [items, rootClass, isMobile, close])

    const canShowOverlay = isMobile && open && RenderTarget.current() !== RenderTarget.thumbnail

    const logoFontFamily =
        "Impact, Haettenschweiler, 'Arial Narrow Bold', 'DIN Condensed', 'Arial Narrow', system-ui, sans-serif"

    return (
        <nav
            className={rootClass}
            aria-label="Primary"
            onKeyDown={onKeyDown}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: height,
                background,
                borderBottom: `${borderBottomWidth}px solid ${borderColor}`,
                overflow: "hidden",
            }}
            data-perf-renders={enablePerformanceMonitoring ? perfMetrics.renderCount : undefined}
            data-perf-avg-time={
                enablePerformanceMonitoring ? perfMetrics.avgRenderTime.toFixed(2) : undefined
            }
        >
            <style>{`
                .${rootClass} { box-sizing: border-box; }
                .${rootClass} *, .${rootClass} *::before, .${rootClass} *::after { box-sizing: border-box; }

                .${rootClass}__stripe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: ${stripeHeight}px;
                    background: ${accent};
                    pointer-events: none;
                }

                .${rootClass}__inner {
                    height: 100%;
                    padding: 0 ${horizontalPadding}px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                }

                .${rootClass}__logo {
                    display: inline-block;
                    text-decoration: none;
                    line-height: 1;
                    white-space: nowrap;
                    user-select: none;
                    text-transform: uppercase;

                    /* Hover fill effect */
                    background-image: linear-gradient(90deg, ${accent} 50%, ${textColor} 50%);
                    background-size: 200% 100%;
                    background-position: 100% 0;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    -webkit-text-fill-color: transparent;
                    transition: background-position 180ms cubic-bezier(.2,.8,.2,1);
                }
                .${rootClass}__logo:hover { background-position: 0% 0; }

                .${rootClass}__right {
                    display: flex;
                    align-items: center;
                    gap: ${safeGap}px;
                }

                .${rootClass}__item {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    color: ${textColor};
                    text-transform: uppercase;
                    letter-spacing: inherit;
                    font: inherit;
                    padding: 10px 0;
                    transform: translateY(0px);
                    transition: transform 120ms ease;
                    white-space: nowrap;
                }

                .${rootClass}__item:hover { transform: translateY(2px); }

                .${rootClass}__item--active {
                    background: ${accent};
                    padding: 10px 12px;
                }

                .${rootClass}__hamburger {
                    appearance: none;
                    background: transparent;
                    border: 0;
                    padding: 10px;
                    margin: -10px;
                    cursor: pointer;
                    color: ${textColor};
                }

                .${rootClass}__hamburgerLines {
                    width: 28px;
                    height: 18px;
                    display: grid;
                    grid-template-rows: repeat(3, 1fr);
                    gap: 3px;
                }

                .${rootClass}__hamburgerLines span {
                    display: block;
                    height: 3px;
                    background: ${borderColor};
                    width: 100%;
                }

                .${rootClass}__overlay {
                    position: fixed;
                    inset: 0;
                    background: ${overlayBackground};
                    display: flex;
                    flex-direction: column;
                    padding: ${stripeHeight + 20}px ${mobileMenuPadding}px 30px;
                    z-index: 9999;
                }

                .${rootClass}__overlayTop {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    padding-bottom: 30px;
                }

                .${rootClass}__close {
                    appearance: none;
                    background: transparent;
                    border: 3px solid ${borderColor};
                    border-radius: 0;
                    padding: 10px 14px;
                    cursor: pointer;
                    color: ${textColor};
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                }

                .${rootClass}__overlayNav {
                    display: flex;
                    flex-direction: column;
                    gap: ${mobileMenuGap}px;
                    overflow: auto;
                    padding-bottom: 20px;
                }

                .${rootClass}__overlayLink {
                    text-decoration: none;
                    color: ${textColor};
                    text-transform: uppercase;
                    letter-spacing: inherit;
                    font: inherit;
                    line-height: 1;
                    display: inline-block;
                    width: max-content;
                }

                .${rootClass}__overlayLink:hover { transform: translateY(2px); }

                .${rootClass}__overlayLink--active {
                    background: ${accent};
                    padding: 8px 10px;
                }

                .${rootClass}__overlayLink--cta {
                    background: ${accent};
                    padding: 10px 12px;
                }
            `}</style>

            <div className={`${rootClass}__stripe`} aria-hidden="true" />

            <div className={`${rootClass}__inner`}>
                <a
                    className={`${rootClass}__logo`}
                    href={logoHref}
                    aria-label="Home"
                    style={{
                        fontFamily: logoFontFamily,
                        fontSize: "52px",
                        fontWeight: 900,
                        lineHeight: 1,
                        ...(logoFont || {}),
                    }}
                >
                    {logoText}
                </a>

                <div className={`${rootClass}__right`} aria-label="Navigation">
                    {isMobile ? (
                        <button
                            type="button"
                            className={`${rootClass}__hamburger`}
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                            onClick={toggleOpen}
                        >
                            <span className={`${rootClass}__hamburgerLines`} aria-hidden="true">
                                <span />
                                <span />
                                <span />
                            </span>
                        </button>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: safeGap }}>
                            {itemNodes.map((node, i) => (
                                <span
                                    key={i}
                                    style={{
                                        display: "inline-flex",
                                        fontFamily:
                                            "'Arial Narrow Bold', 'DIN Condensed', 'Impact', system-ui, sans-serif",
                                        fontWeight: 800,
                                        fontSize: "13px",
                                        ...(itemFont || {}),
                                    }}
                                >
                                    {node}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {canShowOverlay && (
                <div className={`${rootClass}__overlay`} role="dialog" aria-modal="true" aria-label="Menu">
                    <div className={`${rootClass}__stripe`} aria-hidden="true" />
                    <div className={`${rootClass}__overlayTop`}>
                        <a
                            className={`${rootClass}__logo`}
                            href={logoHref}
                            aria-label="Home"
                            onClick={close}
                            style={{
                                fontFamily: logoFontFamily,
                                fontSize: "52px",
                                fontWeight: 900,
                                lineHeight: 1,
                                ...(logoFont || {}),
                            }}
                        >
                            {logoText}
                        </a>

                        {showOverlayClose && (
                            <button type="button" className={`${rootClass}__close`} onClick={close}>
                                Close
                            </button>
                        )}
                    </div>

                    <div className={`${rootClass}__overlayNav`} aria-label="Menu links">
                        {(mobileMenuItems || []).map((item, idx) => {
                            const label = item?.label ?? `ITEM ${idx + 1}`
                            const href = item?.href ?? "#"
                            const active = !!item?.active
                            const variant = item?.variant ?? "link"
                            return (
                                <a
                                    key={`${label}_${idx}_overlay`}
                                    href={href}
                                    onClick={close}
                                    className={`${rootClass}__overlayLink ${
                                        active ? `${rootClass}__overlayLink--active` : ""
                                    } ${variant === "cta" ? `${rootClass}__overlayLink--cta` : ""}`}
                                    aria-current={active ? "page" : undefined}
                                    style={{
                                        fontFamily:
                                            "'Arial Narrow Bold', 'DIN Condensed', 'Impact', system-ui, sans-serif",
                                        fontWeight: 900,
                                        fontSize: "56px",
                                        ...(overlayFont || {}),
                                    }}
                                >
                                    {label}
                                </a>
                            )
                        })}
                    </div>
                </div>
            )}
        </nav>
    )
}

addPropertyControls(BrutalistNavbar, {
    logoText: {
        type: ControlType.String,
        title: "Logo",
        defaultValue: "BRUT",
    },
    logoHref: {
        type: ControlType.Link,
        title: "Logo Link",
        defaultValue: "#",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 8,
        defaultValue: [
            { label: "WORK", href: "#", active: true },
            { label: "ABOUT", href: "#", active: false },
            { label: "CONTACT", href: "#", active: false },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "LINK" },
                href: { type: ControlType.Link, title: "Href", defaultValue: "#" },
                active: {
                    type: ControlType.Boolean,
                    title: "Active",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
            },
        },
    },
    mobileMenuItems: {
        type: ControlType.Array,
        title: "Mobile Menu",
        maxCount: 10,
        defaultValue: [
            { label: "WORK", href: "#", active: true, variant: "link" },
            { label: "ABOUT", href: "#", active: false, variant: "link" },
            { label: "CONTACT", href: "#", active: false, variant: "link" },
            { label: "GET STARTED", href: "#", active: false, variant: "cta" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "LINK" },
                href: { type: ControlType.Link, title: "Href", defaultValue: "#" },
                active: {
                    type: ControlType.Boolean,
                    title: "Active",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                variant: {
                    type: ControlType.Enum,
                    title: "Style",
                    options: ["link", "cta"],
                    optionTitles: ["Link", "CTA"],
                    defaultValue: "link",
                    displaySegmentedControl: true,
                },
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F0E8",
    },
    overlayBackground: {
        type: ControlType.Color,
        title: "Overlay BG",
        defaultValue: "#F5F0E8",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#FFE600",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#111111",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#000000",
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 90,
        min: 50,
        max: 160,
        step: 1,
        unit: "px",
    },
    horizontalPadding: {
        type: ControlType.Number,
        title: "Pad X",
        defaultValue: 40,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Item Gap",
        defaultValue: 26,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    stripeHeight: {
        type: ControlType.Number,
        title: "Stripe",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    borderBottomWidth: {
        type: ControlType.Number,
        title: "Bottom",
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile ≤",
        defaultValue: 768,
        min: 320,
        max: 1200,
        step: 1,
        unit: "px",
    },
    mobileMenuGap: {
        type: ControlType.Number,
        title: "Menu Gap",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    mobileMenuPadding: {
        type: ControlType.Number,
        title: "Menu Pad X",
        defaultValue: 30,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    showOverlayClose: {
        type: ControlType.Boolean,
        title: "Close Btn",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "52px",
            variant: "Black",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    itemFont: {
        type: ControlType.Font,
        title: "Item Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Bold",
            letterSpacing: "0.2em",
            lineHeight: "1em",
        },
    },
    overlayFont: {
        type: ControlType.Font,
        title: "Overlay Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "56px",
            variant: "Black",
            letterSpacing: "0.08em",
            lineHeight: "1em",
        },
    },
})
