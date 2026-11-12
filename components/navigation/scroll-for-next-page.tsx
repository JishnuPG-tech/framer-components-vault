import * as React from "react"
import { useRef, useEffect, useCallback, useState } from "react"
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


// @framerDisableUnlink
// @framerIntrinsicWidth 400
// @framerIntrinsicHeight 300
// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any

type TriggerMode = "scroll" | "click" | "both"
type TransitionStyle =
    | "none"
    | "fade"
    | "slideUp"
    | "slideDown"
    | "slideLeft"
    | "slideRight"
    | "zoomIn"
    | "blur"
    | "iris"
    | "splitH"
    | "splitV"
    | "diagonalWipe"
    | "vortex"
    | "shutterBlinds"

const SHUTTER_STRIPES = 8
const SHUTTER_STAGGER_FACTOR = 0.07

function effectiveDuration(variant: TransitionStyle, duration: number): number {
    if (variant === "shutterBlinds") {
        return (
            duration + (SHUTTER_STRIPES - 1) * duration * SHUTTER_STAGGER_FACTOR
        )
    }
    return duration
}

interface Props {
    link?: string
    preload: boolean
    triggerMode: TriggerMode
    threshold: number
    triggerOffset: number
    triggerDelay: number
    once: boolean
    transitionStyle: TransitionStyle
    transitionDuration: number
    transitionEasing: string
    overlayColor: string
    accessibleLabel: string
    showEditorHint: boolean
    style?: React.CSSProperties
}

const HINT_ACCENT = "#C9A8FF"
const HINT_ACCENT_SOFT = "#F1E9FF"

const HINT_IDLE_FRAMES = 12

function useLayerRect(
    ref: React.RefObject<HTMLElement>,
    active: boolean,
    isStatic: boolean
) {
    const [rect, setRect] = useState<DOMRect | null>(null)
    useEffect(() => {
        if (!active) {
            setRect(null)
            return
        }
        const node = ref.current
        if (!node) return

        if (isStatic) {
            setRect(node.getBoundingClientRect())
            return
        }

        let frameId = 0
        let idleFrames = 0
        let last: DOMRect | null = null

        const tick = () => {
            frameId = 0
            const r = node.getBoundingClientRect()
            const changed =
                !last ||
                last.left !== r.left ||
                last.top !== r.top ||
                last.width !== r.width ||
                last.height !== r.height
            if (changed) {
                last = r
                idleFrames = 0
                setRect(r)
            } else {
                idleFrames += 1
            }
            if (idleFrames < HINT_IDLE_FRAMES) {
                frameId = requestAnimationFrame(tick)
            }
        }

        const kick = () => {
            idleFrames = 0
            if (!frameId) frameId = requestAnimationFrame(tick)
        }
        const onPointerMove = (e: PointerEvent) => {
            if (e.buttons) kick()
        }

        const opts = { capture: true, passive: true } as const
        const kickEvents = [
            "pointerdown",
            "pointerup",
            "wheel",
            "keydown",
            "keyup",
            "input",
            "scroll",
            "resize",
        ]
        kickEvents.forEach((name) => window.addEventListener(name, kick, opts))
        window.addEventListener("pointermove", onPointerMove, opts)

        let resizeObserver: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(kick)
            resizeObserver.observe(node)
        }

        kick()

        return () => {
            if (frameId) cancelAnimationFrame(frameId)
            kickEvents.forEach((name) =>
                window.removeEventListener(name, kick, opts)
            )
            window.removeEventListener("pointermove", onPointerMove, opts)
            resizeObserver?.disconnect()
        }
    }, [ref, active, isStatic])
    return rect
}

function usePreload(
    link: string | undefined,
    enabled: boolean,
    isCanvas: boolean,
    isStatic: boolean
) {
    useEffect(() => {
        if (isCanvas || isStatic || !enabled || !link) return
        if (typeof document === "undefined") return

        let prefetchEl: HTMLLinkElement | null = null
        if (!document.querySelector(`link[rel="prefetch"][href="${link}"]`)) {
            const el = document.createElement("link")
            prefetchEl = el
            el.rel = "prefetch"
            el.href = link
            try {
                el.setAttribute("as", "document")
            } catch {}
            if (el.relList?.supports?.("prefetch")) {
                prefetchReady.set(
                    link,
                    new Promise<void>((resolve) => {
                        el.addEventListener("load", () => resolve(), {
                            once: true,
                        })
                        el.addEventListener("error", () => resolve(), {
                            once: true,
                        })
                    })
                )
            }
            document.head.appendChild(el)
        }

        let speculationEl: HTMLScriptElement | null = null
        try {
            const supportsSpeculationRules =
                typeof HTMLScriptElement !== "undefined" &&
                "supports" in HTMLScriptElement &&
                (
                    HTMLScriptElement as unknown as {
                        supports: (t: string) => boolean
                    }
                ).supports("speculationrules")
            if (supportsSpeculationRules) {
                speculationEl = document.createElement("script")
                speculationEl.type = "speculationrules"
                speculationEl.text = JSON.stringify({
                    prerender: [{ source: "list", urls: [link] }],
                })
                document.head.appendChild(speculationEl)
            }
        } catch {}

        return () => {
            if (prefetchEl) prefetchReady.delete(link)
            prefetchEl?.remove()
            speculationEl?.remove()
        }
    }, [link, enabled, isCanvas, isStatic])
}

const MAX_EXTRA_WAIT_MS = 1500

const prefetchReady = new Map<string, Promise<void>>()

function overlayStyle(
    variant: TransitionStyle,
    active: boolean,
    duration: number,
    easing: string,
    color: string
): React.CSSProperties {
    const base: React.CSSProperties = {
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
        background: color,
    }
    const t = (prop: string) => `${prop} ${duration}s ${easing}`

    switch (variant) {
        case "slideUp":
            return {
                ...base,
                transform: active ? "translateY(0%)" : "translateY(100%)",
                transition: t("transform"),
            }
        case "slideDown":
            return {
                ...base,
                transform: active ? "translateY(0%)" : "translateY(-100%)",
                transition: t("transform"),
            }
        case "slideLeft":
            return {
                ...base,
                transform: active ? "translateX(0%)" : "translateX(100%)",
                transition: t("transform"),
            }
        case "slideRight":
            return {
                ...base,
                transform: active ? "translateX(0%)" : "translateX(-100%)",
                transition: t("transform"),
            }
        case "zoomIn":
            return {
                ...base,
                opacity: active ? 1 : 0,
                transform: active ? "scale(1)" : "scale(1.08)",
                transition: `${t("opacity")}, ${t("transform")}`,
            }
        case "blur":
            return {
                ...base,
                opacity: active ? 0.98 : 0,
                backdropFilter: active ? "blur(26px)" : "blur(0px)",
                WebkitBackdropFilter: active ? "blur(26px)" : "blur(0px)",
                transition: `${t("opacity")}, ${t("backdrop-filter")}`,
            } as React.CSSProperties
        case "iris":
            return {
                ...base,
                clipPath: active
                    ? "circle(150% at 50% 50%)"
                    : "circle(0% at 50% 50%)",
                transition: t("clip-path"),
            }
        case "diagonalWipe":
            return {
                position: "fixed",
                top: "-70%",
                left: "-70%",
                width: "240%",
                height: "240%",
                zIndex: 2147483647,
                pointerEvents: "none",
                background: color,
                transformOrigin: "50% 50%",
                transform: active
                    ? "translate(0%, 0%) rotate(-10deg)"
                    : "translate(-65%, -65%) rotate(-10deg)",
                transition: t("transform"),
            }
        case "vortex":
            return {
                ...base,
                borderRadius: active ? "0%" : "50%",
                transform: active
                    ? "scale(1) rotate(0deg)"
                    : "scale(0.04) rotate(-560deg)",
                transition: `${t("transform")}, ${t("border-radius")}`,
            }
        case "fade":
        default:
            return {
                ...base,
                opacity: active ? 1 : 0,
                transform: active ? "scale(1)" : "scale(1.015)",
                filter: active ? "blur(0px)" : "blur(10px)",
                transition: `${t("opacity")}, ${t("transform")}, ${t("filter")}`,
            } as React.CSSProperties
    }
}

function SplitOverlay({
    axis,
    active,
    duration,
    easing,
    color,
}: {
    axis: "horizontal" | "vertical"
    active: boolean
    duration: number
    easing: string
    color: string
}) {
    const shared: React.CSSProperties = {
        position: "fixed",
        zIndex: 2147483647,
        pointerEvents: "none",
        background: color,
        transition: `transform ${duration}s ${easing}`,
    }

    if (axis === "horizontal") {
        return (
            <>
                <div
                    style={{
                        ...shared,
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: "50%",
                        transformOrigin: "100% 50%",
                        transform: active ? "scaleX(1)" : "scaleX(0)",
                    }}
                />
                <div
                    style={{
                        ...shared,
                        top: 0,
                        bottom: 0,
                        right: 0,
                        width: "50%",
                        transformOrigin: "0% 50%",
                        transform: active ? "scaleX(1)" : "scaleX(0)",
                    }}
                />
            </>
        )
    }

    return (
        <>
            <div
                style={{
                    ...shared,
                    left: 0,
                    right: 0,
                    top: 0,
                    height: "50%",
                    transformOrigin: "50% 100%",
                    transform: active ? "scaleY(1)" : "scaleY(0)",
                }}
            />
            <div
                style={{
                    ...shared,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "50%",
                    transformOrigin: "50% 0%",
                    transform: active ? "scaleY(1)" : "scaleY(0)",
                }}
            />
        </>
    )
}

function ShutterOverlay({
    active,
    duration,
    easing,
    color,
}: {
    active: boolean
    duration: number
    easing: string
    color: string
}) {
    return (
        <>
            {Array.from({ length: SHUTTER_STRIPES }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: "fixed",
                        top: 0,
                        bottom: 0,
                        left: `${(i / SHUTTER_STRIPES) * 100}%`,
                        width: `${100 / SHUTTER_STRIPES}%`,
                        zIndex: 2147483647,
                        pointerEvents: "none",
                        background: color,
                        transformOrigin: "50% 0%",
                        transform: active ? "scaleY(1)" : "scaleY(0)",
                        transition: `transform ${duration}s ${easing} ${(
                            i *
                            duration *
                            SHUTTER_STAGGER_FACTOR
                        ).toFixed(3)}s`,
                    }}
                />
            ))}
        </>
    )
}

function TransitionOverlay({
    variant,
    active,
    duration,
    easing,
    color,
}: {
    variant: TransitionStyle
    active: boolean
    duration: number
    easing: string
    color: string
}) {
    if (variant === "splitH") {
        return (
            <SplitOverlay
                axis="horizontal"
                active={active}
                duration={duration}
                easing={easing}
                color={color}
            />
        )
    }
    if (variant === "splitV") {
        return (
            <SplitOverlay
                axis="vertical"
                active={active}
                duration={duration}
                easing={easing}
                color={color}
            />
        )
    }
    if (variant === "shutterBlinds") {
        return (
            <ShutterOverlay
                active={active}
                duration={duration}
                easing={easing}
                color={color}
            />
        )
    }
    return (
        <div style={overlayStyle(variant, active, duration, easing, color)} />
    )
}

// @framerDisableUnlink
// @framerIntrinsicWidth 400
// @framerIntrinsicHeight 300
// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any
export default function ScrollForNextPage(props: Props) {
    const {
        link,
        preload,
        triggerMode,
        threshold,
        triggerOffset,
        triggerDelay,
        once,
        transitionStyle,
        transitionDuration,
        transitionEasing,
        overlayColor,
        accessibleLabel,
        showEditorHint,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const anchorRef = useRef<HTMLAnchorElement | null>(null)
    const hasFiredRef = useRef(false)
    const timerRef = useRef<number | undefined>(undefined)
    const delayTimerRef = useRef<number | undefined>(undefined)
    const navTokenRef = useRef(0)
    const rafRefs = useRef<number[]>([])
    const [leaving, setLeaving] = useState(false)
    const [active, setActive] = useState(false)
    const hintRect = useLayerRect(
        anchorRef,
        isCanvas && showEditorHint,
        isStatic
    )

    usePreload(link, preload, isCanvas, isStatic)

    const clearAll = useCallback(() => {
        window.clearTimeout(timerRef.current)
        window.clearTimeout(delayTimerRef.current)
        navTokenRef.current += 1
        rafRefs.current.forEach((id) => cancelAnimationFrame(id))
        rafRefs.current = []
    }, [])

    useEffect(() => clearAll, [clearAll])

    useEffect(() => {
        if (typeof window === "undefined") return
        const onPageShow = (e: PageTransitionEvent) => {
            if (!e.persisted) return
            clearAll()
            hasFiredRef.current = false
            setActive(false)
            setLeaving(false)
        }
        window.addEventListener("pageshow", onPageShow)
        return () => window.removeEventListener("pageshow", onPageShow)
    }, [clearAll])

    const goNow = useCallback(() => {
        if (!link || typeof window === "undefined") return
        window.location.href = link
    }, [link])

    const navigate = useCallback(() => {
        if (!link) return
        if (once && hasFiredRef.current) return
        hasFiredRef.current = true

        const prefersReducedMotion =
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        if (transitionStyle === "none" || prefersReducedMotion || isStatic) {
            goNow()
            return
        }

        setLeaving(true)
        const id1 = requestAnimationFrame(() => {
            const id2 = requestAnimationFrame(() => setActive(true))
            rafRefs.current.push(id2)
        })
        rafRefs.current.push(id1)

        const token = ++navTokenRef.current
        const sweepMs =
            effectiveDuration(transitionStyle, transitionDuration) * 1000 * 0.92

        const sweepDone = new Promise<void>((resolve) => {
            timerRef.current = window.setTimeout(resolve, sweepMs)
        })

        const pendingPrefetch = prefetchReady.get(link)
        const destinationReady: Promise<unknown> = pendingPrefetch
            ? Promise.race([
                  pendingPrefetch,
                  new Promise<void>((resolve) => {
                      window.setTimeout(resolve, sweepMs + MAX_EXTRA_WAIT_MS)
                  }),
              ])
            : Promise.resolve()

        Promise.all([sweepDone, destinationReady]).then(() => {
            if (token === navTokenRef.current) goNow()
        })
    }, [link, once, transitionStyle, transitionDuration, goNow, isStatic])

    useEffect(() => {
        if (isCanvas || isStatic) return
        if (triggerMode === "click") return
        const node = anchorRef.current
        if (!node || !link) return

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue
                    if (triggerDelay > 0) {
                        window.clearTimeout(delayTimerRef.current)
                        delayTimerRef.current = window.setTimeout(
                            navigate,
                            triggerDelay
                        )
                    } else {
                        navigate()
                    }
                }
            },
            { threshold, rootMargin: `0px 0px ${triggerOffset}px 0px` }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [
        isCanvas,
        isStatic,
        triggerMode,
        link,
        threshold,
        triggerOffset,
        triggerDelay,
        navigate,
    ])

    const handleClick = (e: React.MouseEvent) => {
        if (isCanvas) {
            e.preventDefault()
            return
        }
        if (isStatic) return
        if (triggerMode === "scroll") return
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
            return
        if (transitionStyle === "none") return
        e.preventDefault()
        navigate()
    }

    return (
        <a
            ref={anchorRef}
            href={link || "#"}
            aria-label={accessibleLabel}
            onClick={handleClick}
            tabIndex={link ? 0 : -1}
            style={{
                position: "relative",
                display: "block",
                width: "100%",
                height: "100%",
                minWidth: 24,
                minHeight: 24,
                background: "transparent",
                textDecoration: "none",
                cursor: triggerMode === "scroll" ? "default" : "pointer",
                ...style,
            }}
        >
            {!isCanvas &&
                !isStatic &&
                leaving &&
                typeof document !== "undefined" &&
                createPortal(
                    <TransitionOverlay
                        variant={transitionStyle}
                        active={active}
                        duration={transitionDuration}
                        easing={transitionEasing}
                        color={overlayColor}
                    />,
                    document.body
                )}
            {isCanvas &&
                showEditorHint &&
                hintRect &&
                typeof document !== "undefined" &&
                createPortal(
                    <EditorHint
                        link={link}
                        triggerMode={triggerMode}
                        preload={preload}
                        rect={hintRect}
                    />,
                    document.body
                )}
        </a>
    )
}

const HINT_WIDTH = 208

function EditorHint({
    link,
    triggerMode,
    preload,
    rect,
}: {
    link?: string
    triggerMode: TriggerMode
    preload: boolean
    rect: DOMRect
}) {
    const modeLabel =
        triggerMode === "scroll"
            ? "Fires on scroll"
            : triggerMode === "click"
              ? "Fires on tap"
              : "Scroll or tap"

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const margin = 12
    const clampedX = Math.min(
        Math.max(centerX, HINT_WIDTH / 2 + margin),
        window.innerWidth - HINT_WIDTH / 2 - margin
    )
    const clampedY = Math.min(
        Math.max(centerY, margin + 40),
        window.innerHeight - margin - 40
    )

    return (
        <div
            style={{
                position: "fixed",
                left: clampedX,
                top: clampedY,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 2147483647,
                width: HINT_WIDTH,
                padding: "13px 16px",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                textAlign: "center",
                background:
                    "linear-gradient(165deg, rgba(28,20,42,0.94), rgba(10,8,16,0.97))",
                backdropFilter: "blur(16px) saturate(160%)",
                WebkitBackdropFilter: "blur(16px) saturate(160%)",
                boxShadow:
                    "0 18px 44px -14px rgba(150, 90, 255, 0.28), 0 1px 0 rgba(255,255,255,0.05) inset",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, ui-sans-serif, sans-serif",
            }}
        >
            <span
                style={{
                    fontSize: 8.5,
                    fontWeight: 600,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    backgroundImage: `linear-gradient(90deg, ${HINT_ACCENT}, ${HINT_ACCENT_SOFT})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                }}
            >
                Scroll for Next Page
            </span>
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#FBFAFF",
                    lineHeight: 1.35,
                }}
            >
                {modeLabel} · {link ? "ready" : "pick a page"}
            </span>
            <span
                style={{
                    fontSize: 9,
                    fontWeight: 400,
                    color: "rgba(251,250,255,0.5)",
                    lineHeight: 1.45,
                }}
            >
                {preload ? "Preloading next page. " : ""}Place at the bottom of
                the page.
            </span>
        </div>
    )
}

ScrollForNextPage.displayName = "Scroll for Next Page"

addPropertyControls(ScrollForNextPage, {
    link: {
        type: ControlType.Link,
        title: "Go To Page",
    },
    preload: {
        type: ControlType.Boolean,
        title: "Preload Next Page",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["scroll", "click", "both"],
        optionTitles: [
            "On Scroll Into View",
            "On Click / Tap",
            "Scroll or Click",
        ],
        defaultValue: "scroll",
    },
    threshold: {
        type: ControlType.Number,
        title: "Trigger Point",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
        hidden: (props: Props) => props.triggerMode === "click",
    },
    triggerOffset: {
        type: ControlType.Number,
        title: "Trigger Margin",
        min: -400,
        max: 400,
        step: 10,
        unit: "px",
        defaultValue: 0,
        hidden: (props: Props) => props.triggerMode === "click",
    },
    triggerDelay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 3000,
        step: 50,
        unit: "ms",
        defaultValue: 0,
        hidden: (props: Props) => props.triggerMode === "click",
    },
    once: {
        type: ControlType.Boolean,
        title: "Fire",
        enabledTitle: "Once",
        disabledTitle: "Every Time",
        defaultValue: true,
    },
    transitionStyle: {
        type: ControlType.Enum,
        title: "Transition",
        options: [
            "none",
            "fade",
            "slideUp",
            "slideDown",
            "slideLeft",
            "slideRight",
            "zoomIn",
            "blur",
            "iris",
            "splitH",
            "splitV",
            "diagonalWipe",
            "vortex",
            "shutterBlinds",
        ],
        optionTitles: [
            "None (Instant)",
            "Fade",
            "Slide Up",
            "Slide Down",
            "Slide Left",
            "Slide Right",
            "Zoom In",
            "Blur",
            "Iris Wipe",
            "Split — Horizontal",
            "Split — Vertical",
            "Diagonal Wipe",
            "Vortex Warp",
            "Shutter Blinds",
        ],
        defaultValue: "fade",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 1.6,
        step: 0.05,
        unit: "s",
        defaultValue: 0.6,
        hidden: (props: Props) => props.transitionStyle === "none",
    },
    transitionEasing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["ease", "ease-in-out", "ease-out", "ease-in", "linear"],
        defaultValue: "ease-in-out",
        hidden: (props: Props) => props.transitionStyle === "none",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Sweep Color",
        defaultValue: "#0A0A12",
        description:
            "For the smoothest result, set this to the background color of the page you're transitioning into. The sweep then blends straight into the next page with no flash.",
        hidden: (props: Props) => props.transitionStyle === "none",
    },
    accessibleLabel: {
        type: ControlType.String,
        title: "A11y Label",
        defaultValue: "Continue to next page",
        placeholder: "Screen-reader label",
    },
    showEditorHint: {
        type: ControlType.Boolean,
        title: "Editor Hint",
        defaultValue: true,
        description:
            "\n\nScroll for Next Page v1.1  \nMade by [Alt3 Studio](https://alt3studio.com/)",
    },
})
