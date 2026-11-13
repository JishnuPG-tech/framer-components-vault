import { useEffect, useRef, useState, type CSSProperties } from "react"
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

import Lenis from "lenis"

const LENIS_CSS = `
html.lenis { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-scrolling iframe { pointer-events: none; }
`

// Ref-count CSS so multiple instances share one style tag safely
let cssRefCount = 0

function injectCSS() {
    cssRefCount++
    if (cssRefCount > 1) return
    const style = document.createElement("style")
    style.id = "__lenis-css__"
    style.textContent = LENIS_CSS
    document.head.appendChild(style)
}

function removeCSS() {
    cssRefCount--
    if (cssRefCount > 0) return
    document.getElementById("__lenis-css__")?.remove()
}

type EasingPreset = "default" | "gentle" | "linear" | "snappy"
type Orientation = "vertical" | "horizontal"
type EdgePosition = "top" | "bottom"
type Corner = "bottom-right" | "bottom-left" | "bottom-center"

// Easing curves used together with `duration` (Lenis ignores easing when `lerp`
// is set). Each maps progress 0..1 → eased 0..1.
const EASINGS: Record<EasingPreset, (t: number) => number> = {
    default: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    gentle: (t) => 1 - Math.pow(1 - t, 3),
    linear: (t) => t,
    snappy: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -12 * t)),
}

interface SmoothScrollProps {
    intensity: number
    easing: EasingPreset
    orientation: Orientation
    wheelMultiplier: number
    touchMultiplier: number
    smoothTouch: boolean
    respectReducedMotion: boolean
    disableBelow: number
    infinite: boolean
    resetScrollOnPageChange: boolean
    preventSelectors: string
    smoothAnchors: boolean
    anchorOffset: number
    showProgress: boolean
    progressColor: string
    progressHeight: number
    progressPosition: EdgePosition
    showScrollTop: boolean
    scrollTopThreshold: number
    scrollTopCorner: Corner
    scrollTopColor: string
    scrollTopIconColor: string
    scrollTopSize: number
    scrollTopOffset: number
    scrollTopRadius: number
    style?: CSSProperties
}

function getCornerStyle(corner: Corner, offset: number): CSSProperties {
    switch (corner) {
        case "bottom-left":
            return { left: offset, bottom: offset }
        case "bottom-center":
            return { left: "50%", bottom: offset }
        case "bottom-right":
        default:
            return { right: offset, bottom: offset }
    }
}

function getButtonTransform(corner: Corner, visible: boolean): string {
    if (corner === "bottom-center") {
        return visible ? "translate(-50%, 0)" : "translate(-50%, 12px)"
    }
    return visible ? "translateY(0)" : "translateY(12px)"
}

const ChevronUp = ({ color }: { color: string }) => (
    <svg
        width="52%"
        height="52%"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M6 15l6-6 6 6" />
    </svg>
)

const ScrollGlyph = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M10 3.2 12 1.5l2 1.7" />
        <rect x="7.5" y="5.5" width="9" height="13" rx="4.5" />
        <path d="M12 8v2.6" />
        <path d="M10 20.8 12 22.5l2-1.7" />
    </svg>
)

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function SmoothScroll(props: SmoothScrollProps) {
    const {
        intensity = 10,
        easing = "default",
        orientation = "vertical",
        wheelMultiplier = 1,
        touchMultiplier = 1,
        smoothTouch = false,
        respectReducedMotion = true,
        disableBelow = 0,
        infinite = false,
        resetScrollOnPageChange = true,
        preventSelectors = "",
        smoothAnchors = false,
        anchorOffset = 0,
        showProgress = false,
        progressColor = "#6019FE",
        progressHeight = 4,
        progressPosition = "top",
        showScrollTop = false,
        scrollTopThreshold = 400,
        scrollTopCorner = "bottom-right",
        scrollTopColor = "#111111",
        scrollTopIconColor = "#FFFFFF",
        scrollTopSize = 48,
        scrollTopOffset = 24,
        scrollTopRadius = 24,
    } = props

    const isStatic = useIsStaticRenderer()

    const lenisRef = useRef<any>(null)
    const rafRef = useRef<number>(0)
    const scrollRestorationRef = useRef<ScrollRestoration | null>(null)
    const progressFillRef = useRef<HTMLDivElement | null>(null)
    const thresholdRef = useRef<number>(scrollTopThreshold)
    const anchorOffsetRef = useRef<number>(anchorOffset)
    const lastPastRef = useRef<boolean>(false)

    const [mounted, setMounted] = useState(false)
    const [showTopBtn, setShowTopBtn] = useState(false)
    const [enabledByWidth, setEnabledByWidth] = useState(true)
    const [reducedMotion, setReducedMotion] = useState(false)

    // Whether the Lenis smooth-scroll engine should actually run. On the Framer
    // canvas (static), below the breakpoint, or under reduced-motion we fall
    // back to native scrolling while still powering the overlays.
    const useLenis =
        !isStatic && enabledByWidth && !(respectReducedMotion && reducedMotion)

    useEffect(() => {
        thresholdRef.current = scrollTopThreshold
    }, [scrollTopThreshold])

    useEffect(() => {
        anchorOffsetRef.current = anchorOffset
    }, [anchorOffset])

    useEffect(() => {
        setMounted(true)
    }, [])

    // CSS injection with ref counting
    useEffect(() => {
        if (isStatic || typeof document === "undefined") return
        injectCSS()
        return removeCSS
    }, [isStatic])

    // Track the disable-below-width breakpoint
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const check = () =>
            setEnabledByWidth(
                !disableBelow || window.innerWidth >= disableBelow
            )
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [isStatic, disableBelow])

    // Track prefers-reduced-motion
    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !window.matchMedia)
            return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [isStatic])

    // Init Lenis (or a native scroll fallback) and drive the overlays
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const updateOverlays = (progress: number, position: number) => {
            const clamped = Math.min(1, Math.max(0, progress || 0))
            if (progressFillRef.current) {
                progressFillRef.current.style.transform = `scaleX(${clamped})`
            }
            const past = position > thresholdRef.current
            if (past !== lastPastRef.current) {
                lastPastRef.current = past
                setShowTopBtn(past)
            }
        }

        // Opt-in: keep native scrolling inside areas matching these selectors.
        // Evaluated lazily by Lenis per scroll event on the event's own
        // ancestor path — no document scanning and no DOM mutation. Lenis also
        // still honors the standard `data-lenis-prevent` attribute natively.
        const selectors = (preventSelectors || "").trim()
        const preventInside = (node: any): boolean => {
            if (!selectors || !node || typeof node.matches !== "function")
                return false
            try {
                return node.matches(selectors)
            } catch (e) {
                return false
            }
        }

        if (useLenis) {
            const lenis = new Lenis({
                duration: Math.max(0.1, (intensity ?? 10) / 10),
                easing: EASINGS[easing] || EASINGS.default,
                orientation,
                gestureOrientation: orientation,
                smoothWheel: true,
                syncTouch: smoothTouch,
                wheelMultiplier: wheelMultiplier ?? 1,
                touchMultiplier: touchMultiplier ?? 1,
                infinite,
                prevent: preventInside,
            })
            lenisRef.current = lenis

            const onScroll = (e: any) => {
                const progress =
                    typeof e?.progress === "number" ? e.progress : 0
                const position =
                    e?.animatedScroll ?? e?.scroll ?? window.scrollY ?? 0
                updateOverlays(progress, position)
            }
            lenis.on?.("scroll", onScroll)

            const raf = (time: number) => {
                if (lenisRef.current) {
                    lenisRef.current.raf(time)
                    rafRef.current = requestAnimationFrame(raf)
                }
            }
            rafRef.current = requestAnimationFrame(raf)

            updateOverlays(
                lenis.progress ?? 0,
                lenis.animatedScroll ?? window.scrollY ?? 0
            )

            return () => {
                lenis.off?.("scroll", onScroll)
                cancelAnimationFrame(rafRef.current)
                lenis.destroy()
                lenisRef.current = null
            }
        }

        // Native fallback — keep progress bar / scroll-to-top working
        const computeNative = () => {
            const doc = document.documentElement
            const max = doc.scrollHeight - window.innerHeight
            const position = window.scrollY || doc.scrollTop || 0
            updateOverlays(max > 0 ? position / max : 0, position)
        }
        computeNative()
        window.addEventListener("scroll", computeNative, { passive: true })
        window.addEventListener("resize", computeNative)
        return () => {
            window.removeEventListener("scroll", computeNative)
            window.removeEventListener("resize", computeNative)
        }
    }, [
        isStatic,
        useLenis,
        intensity,
        easing,
        orientation,
        smoothTouch,
        wheelMultiplier,
        touchMultiplier,
        infinite,
        preventSelectors,
    ])

    // Manual scroll restoration + force-to-top on first mount
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        if (scrollRestorationRef.current === null) {
            scrollRestorationRef.current = history.scrollRestoration || "auto"
            try {
                history.scrollRestoration = "manual"
            } catch (e) {}
        }

        requestAnimationFrame(() => {
            window.scrollTo(0, 0)
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
            if (lenisRef.current) {
                lenisRef.current.scrollTo(0, { immediate: true })
            }
        })

        return () => {
            if (scrollRestorationRef.current != null) {
                try {
                    history.scrollRestoration = scrollRestorationRef.current
                } catch (e) {}
                scrollRestorationRef.current = null
            }
        }
    }, [isStatic])

    // Reset scroll position on client-side route changes
    useEffect(() => {
        if (
            isStatic ||
            typeof window === "undefined" ||
            !resetScrollOnPageChange
        )
            return
        const routeRef = {
            current: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        }

        const forceScrollToTop = (immediate = true) => {
            requestAnimationFrame(() => {
                if (lenisRef.current) {
                    lenisRef.current.scrollTo(0, { immediate })
                } else {
                    window.scrollTo(0, 0)
                }
            })
        }

        const handleRouteChange = () => {
            const nextRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`
            if (routeRef.current === nextRoute) return
            routeRef.current = nextRoute
            forceScrollToTop(true)
        }

        const patchHistoryMethod = (original: (...args: any[]) => any) => {
            return function (...args: any[]) {
                const value = original.apply(history, args)
                const nextRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`
                if (routeRef.current !== nextRoute) {
                    routeRef.current = nextRoute
                    forceScrollToTop(true)
                }
                return value
            }
        }

        const originalPushState = history.pushState
        const originalReplaceState = history.replaceState
        history.pushState = patchHistoryMethod(
            originalPushState as (...args: any[]) => any
        ) as typeof history.pushState
        history.replaceState = patchHistoryMethod(
            originalReplaceState as (...args: any[]) => any
        ) as typeof history.replaceState
        window.addEventListener("popstate", handleRouteChange)
        window.addEventListener("hashchange", handleRouteChange)

        forceScrollToTop()

        return () => {
            history.pushState = originalPushState
            history.replaceState = originalReplaceState
            window.removeEventListener("popstate", handleRouteChange)
            window.removeEventListener("hashchange", handleRouteChange)
        }
    }, [isStatic, resetScrollOnPageChange])

    // Stop/start observer — pause smoothing while a modal/overlay locks scroll.
    // Scoped to attribute changes on <html>/<body> (where Framer toggles the
    // scroll lock) instead of observing the whole document tree.
    useEffect(() => {
        if (isStatic || typeof document === "undefined") return

        const check = () => {
            if (!lenisRef.current) return
            const htmlHidden =
                document.documentElement?.style?.overflow === "hidden"
            const bodyHidden = document.body?.style?.overflow === "hidden"
            const stopEl = document.querySelector(
                "[data-frameruni-stop-scroll]"
            )
            if (htmlHidden || bodyHidden || stopEl) lenisRef.current.stop()
            else lenisRef.current.start()
        }

        check()

        const obs = new MutationObserver(check)
        const targets = [document.documentElement, document.body].filter(
            Boolean
        ) as HTMLElement[]
        targets.forEach((el) =>
            obs.observe(el, {
                attributes: true,
                attributeFilter: ["style", "class"],
            })
        )

        return () => obs.disconnect()
    }, [isStatic, useLenis])

    // Smooth anchor links — OPT-IN (smoothAnchors). Uses a single delegated
    // click listener for same-page #hash links: no per-anchor handlers, no
    // document scanning, and no MutationObserver. When disabled, native hash
    // navigation is left completely untouched.
    useEffect(() => {
        if (isStatic || typeof document === "undefined" || !smoothAnchors)
            return

        const onClick = (e: MouseEvent) => {
            const lenis = lenisRef.current
            if (!lenis) return
            if (e.defaultPrevented || e.button !== 0) return
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

            const a = (e.target as Element | null)?.closest?.(
                "a[href]"
            ) as HTMLAnchorElement | null
            if (!a) return
            if (a.target && a.target !== "_self") return
            if (a.hasAttribute("data-lenis-prevent")) return

            let url: URL
            try {
                url = new URL(a.href, window.location.href)
            } catch (err) {
                return
            }

            // Only intercept same-document hash links
            if (
                url.origin !== window.location.origin ||
                url.pathname !== window.location.pathname ||
                url.search !== window.location.search ||
                !url.hash
            )
                return

            let el: Element | null = null
            try {
                el = document.querySelector(decodeURIComponent(url.hash))
            } catch (err) {
                el = null
            }
            if (!el) return

            const margin =
                parseInt(window.getComputedStyle(el).scrollMarginTop) || 0
            e.preventDefault()
            lenis.scrollTo(el, {
                offset: -(margin + (anchorOffsetRef.current || 0)),
            })
        }

        document.addEventListener("click", onClick)
        return () => document.removeEventListener("click", onClick)
    }, [isStatic, smoothAnchors])

    const handleScrollTop = () => {
        if (lenisRef.current) {
            lenisRef.current.scrollTo(0)
        } else if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    }

    const progressEdge: CSSProperties =
        progressPosition === "bottom" ? { bottom: 0 } : { top: 0 }

    // ---- Static (Framer canvas / export) preview --------------------------
    if (isStatic) {
        const features = [
            orientation === "horizontal" ? "Horizontal" : "Vertical",
            easing === "default"
                ? "Smooth"
                : easing.charAt(0).toUpperCase() + easing.slice(1),
            smoothTouch && "Touch",
            infinite && "Infinite",
            showProgress && "Progress",
            showScrollTop && "Top Button",
        ]
            .filter(Boolean)
            .join(" · ")

        return (
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    minWidth: 220,
                    maxWidth: 320,
                    background: "#0E0E10",
                    border: "1px solid #232327",
                    borderRadius: 14,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                    color: "#FFFFFF",
                    fontFamily:
                        "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    ...props.style,
                }}
            >
                {showProgress && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            ...progressEdge,
                            width: "62%",
                            height: progressHeight,
                            background: progressColor,
                        }}
                    />
                )}
                <div
                    style={{
                        flexShrink: 0,
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 5,
                        background:
                            "linear-gradient(135deg, #6019FE 0%, #B14BFF 100%)",
                        color: "#FFFFFF",
                    }}
                >
                    <ScrollGlyph />
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 14,
                            fontWeight: 600,
                            lineHeight: 1.2,
                        }}
                    >
                        Next Smooth Scroll
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "#9A9AA2",
                            lineHeight: 1.3,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {features}
                    </span>
                </div>
                {showScrollTop && (
                    <div
                        style={{
                            flexShrink: 0,
                            marginLeft: "auto",
                            width: 34,
                            height: 34,
                            borderRadius: Math.min(scrollTopRadius, 17),
                            background: scrollTopColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                        }}
                    >
                        <ChevronUp color={scrollTopIconColor} />
                    </div>
                )}
            </div>
        )
    }

    // ---- Live (preview / published) ---------------------------------------
    const overlays =
        mounted && typeof document !== "undefined"
            ? createPortal(
                  <>
                      {showProgress && (
                          <div
                              ref={progressFillRef}
                              aria-hidden="true"
                              style={{
                                  position: "fixed",
                                  left: 0,
                                  ...progressEdge,
                                  width: "100%",
                                  height: progressHeight,
                                  background: progressColor,
                                  transformOrigin: "0 50%",
                                  transform: "scaleX(0)",
                                  willChange: "transform",
                                  pointerEvents: "none",
                                  zIndex: 2147483646,
                              }}
                          />
                      )}
                      {showScrollTop && (
                          <button
                              type="button"
                              aria-label="Scroll to top"
                              onClick={handleScrollTop}
                              style={{
                                  position: "fixed",
                                  ...getCornerStyle(
                                      scrollTopCorner,
                                      scrollTopOffset
                                  ),
                                  width: scrollTopSize,
                                  height: scrollTopSize,
                                  borderRadius: scrollTopRadius,
                                  background: scrollTopColor,
                                  color: scrollTopIconColor,
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                                  opacity: showTopBtn ? 1 : 0,
                                  transform: getButtonTransform(
                                      scrollTopCorner,
                                      showTopBtn
                                  ),
                                  transition:
                                      "opacity .25s ease, transform .25s ease",
                                  pointerEvents: showTopBtn ? "auto" : "none",
                                  zIndex: 2147483647,
                                  padding: 0,
                              }}
                          >
                              <ChevronUp color={scrollTopIconColor} />
                          </button>
                      )}
                  </>,
                  document.body
              )
            : null

    return (
        <>
            <div style={props.style} />
            {overlays}
        </>
    )
}

SmoothScroll.displayName = "Next Smooth Scroll"

addPropertyControls(SmoothScroll, {
    intensity: {
        title: "Intensity",
        type: ControlType.Number,
        defaultValue: 10,
        min: 0,
        max: 20,
        step: 0.5,
        displayStepper: false,
    },
    easing: {
        title: "Easing",
        type: ControlType.Enum,
        defaultValue: "default",
        options: ["default", "gentle", "linear", "snappy"],
        optionTitles: ["Smooth", "Gentle", "Linear", "Snappy"],
    },
    orientation: {
        title: "Direction",
        type: ControlType.Enum,
        defaultValue: "vertical",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        displaySegmentedControl: true,
    },
    wheelMultiplier: {
        title: "Wheel Speed",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    touchMultiplier: {
        title: "Touch Speed",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    smoothTouch: {
        title: "Smooth Touch",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    respectReducedMotion: {
        title: "Reduced Motion",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
    disableBelow: {
        title: "Disable Below",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 1200,
        step: 10,
        unit: "px",
        description: "Use native scroll under this viewport width (0 = never)",
    },
    infinite: {
        title: "Infinite Scroll",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    resetScrollOnPageChange: {
        title: "Reset on Page",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    preventSelectors: {
        title: "Native Areas",
        type: ControlType.String,
        defaultValue: "",
        placeholder: ".my-scroll, [data-scroll]",
        description:
            "CSS selectors for areas that should keep native scrolling (comma-separated). Empty = none.",
    },
    smoothAnchors: {
        title: "Smooth Anchors",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Smoothly scroll to same-page #anchor links (opt-in).",
    },
    anchorOffset: {
        title: "Anchor Offset",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        hidden: (props: Partial<SmoothScrollProps>) => !props.smoothAnchors,
    },
    showProgress: {
        title: "Progress Bar",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    progressColor: {
        title: "Bar Color",
        type: ControlType.Color,
        defaultValue: "#6019FE",
        hidden: (props: Partial<SmoothScrollProps>) => !props.showProgress,
    },
    progressHeight: {
        title: "Bar Height",
        type: ControlType.Number,
        defaultValue: 4,
        min: 1,
        max: 12,
        step: 1,
        unit: "px",
        hidden: (props: Partial<SmoothScrollProps>) => !props.showProgress,
    },
    progressPosition: {
        title: "Bar Position",
        type: ControlType.Enum,
        defaultValue: "top",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        displaySegmentedControl: true,
        hidden: (props: Partial<SmoothScrollProps>) => !props.showProgress,
    },
    showScrollTop: {
        title: "Top Button",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scrollTopThreshold: {
        title: "Show After",
        type: ControlType.Number,
        defaultValue: 400,
        min: 0,
        max: 2000,
        step: 50,
        unit: "px",
        hidden: (props: Partial<SmoothScrollProps>) => !props.showScrollTop,
    },
    scrollTopCorner: {
        title: "Position",
        type: ControlType.Enum,
        defaultValue: "bottom-right",
        options: ["bottom-left", "bottom-center", "bottom-right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        hidden: (props: Partial<SmoothScrollProps>) => !props.showScrollTop,
    },
    scrollTopColor: {
        title: "Button Color",
        type: ControlType.Color,
        defaultValue: "#111111",
        hidden: (props: Partial<SmoothScrollProps>) => !props.showScrollTop,
    },
    scrollTopIconColor: {
        title: "Icon Color",
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        hidden: (props: Partial<SmoothScrollProps>) => !props.showScrollTop,
    },
    scrollTopSize: {
        title: "Button Size",
        type: ControlType.Number,
        defaultValue: 48,
        min: 28,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (props: Partial<SmoothScrollProps>) => !props.showScrollTop,
    },
    scrollTopRadius: {
        title: "Roundness",
        type: ControlType.Number,
        defaultValue: 24,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (props: Partial<SmoothScrollProps>) => !props.showScrollTop,
    },
    scrollTopOffset: {
        title: "Edge Offset",
        type: ControlType.Number,
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (props: Partial<SmoothScrollProps>) => !props.showScrollTop,
    },
})
