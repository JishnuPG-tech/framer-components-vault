// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"
import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

type IconName =
    | "instagram"
    | "tiktok"
    | "linkedin"
    | "facebook"
    | "youtube"
    | "custom"
    | "none"

type MarqueeItem = {
    icon?: IconName
    image?: { src: string; srcSet?: string; alt?: string }
    label: string
    link?: string
    newTab: boolean
}

interface InfiniteBannerProps {
    items: MarqueeItem[]
    backgroundColor: string
    textColor: string
    font: any
    fontSize: number
    iconSize: number
    gap: number
    speed: number // px/s
    height: number
    direction: "left" | "right"
    pauseOnHover: boolean
    respectReducedMotion: boolean
    ariaLabel: string
    style?: CSSProperties
}

// Built-in icons are rendered as inline SVG rather than fed through the
// image control: ControlType.ResponsiveImage only accepts assets from
// Framer's own pipeline, so a data-URI defaultValue silently arrives empty.
// Inline markup is plain code — it survives a remix, needs no request, and
// picks up the Text colour through currentColor.
function BrandIcon({ name, size }: { name: IconName; size: number }) {
    const common = {
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        "aria-hidden": true,
        focusable: "false",
        style: {
            width: size,
            height: size,
            display: "block",
            flexShrink: 0,
        } as CSSProperties,
    }

    if (name === "instagram") {
        return (
            <svg
                {...common}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.9}
            >
                <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.4" />
                <circle cx="12" cy="12" r="4.6" />
                <circle
                    cx="17.6"
                    cy="6.4"
                    r="1.25"
                    fill="currentColor"
                    stroke="none"
                />
            </svg>
        )
    }

    if (name === "tiktok") {
        return (
            <svg {...common} fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
        )
    }

    if (name === "facebook") {
        return (
            <svg {...common} fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        )
    }

    if (name === "youtube") {
        return (
            <svg {...common} fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        )
    }

    if (name === "linkedin") {
        return (
            <svg {...common} fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
            </svg>
        )
    }

    return null
}

const ICON_NAMES: string[] = [
    "instagram",
    "tiktok",
    "linkedin",
    "facebook",
    "youtube",
    "custom",
    "none",
]

/**
 * Framer's canvas merges the property-control schema into each item, so a
 * missing `icon` field is invisible while editing. A published build
 * serialises only what is actually stored on the instance, which is why items
 * created before this control existed lose their icon exactly there — in
 * preview they look fine, live they render nothing.
 *
 * An explicit "none" is honoured; only an absent or unknown value falls back.
 */
function resolveIcon(item: any): IconName {
    const raw =
        typeof item?.icon === "string" ? item.icon.trim().toLowerCase() : ""
    if (ICON_NAMES.indexOf(raw) !== -1) return raw as IconName

    if (item?.image?.src) return "custom"

    // Migration shim for items stored under the older schema: recover the
    // icon from the label so an existing published banner keeps working
    // without re-picking every item by hand.
    const label =
        typeof item?.label === "string" ? item.label.toLowerCase() : ""
    if (label.indexOf("instagram") !== -1) return "instagram"
    if (label.indexOf("tiktok") !== -1) return "tiktok"
    if (label.indexOf("linkedin") !== -1) return "linkedin"
    if (label.indexOf("facebook") !== -1) return "facebook"
    if (label.indexOf("youtube") !== -1) return "youtube"

    return "none"
}

const defaultItems: MarqueeItem[] = [
    {
        icon: "instagram",
        label: "More Projects on Instagram",
        link: "https://www.instagram.com",
        newTab: true,
    },
    {
        icon: "tiktok",
        label: "More Inspiration on TikTok",
        link: "https://www.tiktok.com",
        newTab: true,
    },
    {
        icon: "linkedin",
        label: "More Information on LinkedIn",
        link: "https://www.linkedin.com",
        newTab: true,
    },
    {
        icon: "facebook",
        label: "More Updates on Facebook",
        link: "https://www.facebook.com",
        newTab: true,
    },
    {
        icon: "youtube",
        label: "More Videos on YouTube",
        link: "https://www.youtube.com",
        newTab: true,
    },
]

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

/** Media query hook without layout thrash; SSR-safe. */
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const mq = window.matchMedia(query)
        const update = () => setMatches(mq.matches)
        update()

        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", update)
            return () => mq.removeEventListener("change", update)
        }
        // Safari < 14
        mq.addListener(update)
        return () => mq.removeListener(update)
    }, [query])

    return matches
}

/**
 * infinite-banner
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InfiniteBanner(props: InfiniteBannerProps) {
    const {
        items = defaultItems,
        backgroundColor,
        textColor,
        font,
        fontSize,
        iconSize,
        gap,
        speed,
        height,
        direction,
        pauseOnHover,
        respectReducedMotion,
        ariaLabel,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const groupRef = useRef<HTMLDivElement>(null)

    const isInView = useInView(containerRef as any, { margin: "200px" })
    const isSmallScreen = useMediaQuery("(max-width: 480px)")
    const canHover = useMediaQuery("(hover: hover) and (pointer: fine)")
    const prefersReducedMotion = useMediaQuery(
        "(prefers-reduced-motion: reduce)"
    )

    const effectiveFontSize = useMemo(
        () => Math.max(10, Math.round(fontSize * (isSmallScreen ? 0.92 : 1))),
        [fontSize, isSmallScreen]
    )
    const effectiveIconSize = useMemo(
        () => Math.max(10, Math.round(iconSize * (isSmallScreen ? 0.9 : 1))),
        [iconSize, isSmallScreen]
    )

    const normalizedItems = useMemo(() => {
        const safe = Array.isArray(items) ? items : []
        return safe
            .map((it) => ({
                icon: resolveIcon(it),
                image: it?.image,
                label: typeof it?.label === "string" ? it.label : "",
                link: typeof it?.link === "string" ? it.link.trim() : "",
                newTab: !!it?.newTab,
            }))
            .filter((it) => it.label.trim().length > 0 || it.icon !== "none")
    }, [items])

    // ---------------------------------------------------------------------
    // Measurement
    //
    // `cycle` is the exact distance after which the track repeats itself:
    // width of one group + the gap that separates it from the next group.
    // Everything (copy count, transform wrap-around) derives from it, so the
    // seam is mathematically identical to the spacing inside a group.
    // ---------------------------------------------------------------------
    const cycleRef = useRef(0)
    const [cycle, setCycle] = useState(0)
    const [containerWidth, setContainerWidth] = useState(0)

    const commit = useCallback(
        (groupWidth: number, wrapperWidth: number, precise: boolean) => {
            if (groupWidth > 0) {
                const nextCycle = groupWidth + gap
                // A coarse (integer) reading must never clobber a precise one,
                // otherwise the observer has no size change left to correct it.
                const threshold = precise ? 0.05 : 1.01
                if (Math.abs(nextCycle - cycleRef.current) > threshold) {
                    cycleRef.current = nextCycle
                    setCycle(nextCycle)
                }
            }
            if (wrapperWidth > 0) {
                setContainerWidth((prev) =>
                    Math.abs(prev - wrapperWidth) > 0.5 ? wrapperWidth : prev
                )
            }
        },
        [gap]
    )

    // First paint and no-ResizeObserver fallback. offsetWidth is layout-based,
    // so unlike getBoundingClientRect() it survives a rotated or scaled
    // ancestor untouched — it is merely integer-rounded.
    const measure = useCallback(() => {
        commit(
            groupRef.current?.offsetWidth ?? 0,
            containerRef.current?.offsetWidth ?? 0,
            false
        )
    }, [commit])

    useLayoutEffect(() => {
        measure()
    }, [
        measure,
        normalizedItems,
        effectiveFontSize,
        effectiveIconSize,
        font,
        height,
    ])

    useEffect(() => {
        if (typeof window === "undefined") return

        measure()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }

        // borderBoxSize / contentRect are reported in *layout* pixels:
        // untransformed and sub-pixel accurate. Rotating or scaling the banner
        // (or zooming the Framer canvas) therefore cannot corrupt the cycle
        // length, which getBoundingClientRect() would — it returns the
        // axis-aligned bounding box of the rotated element, and that box grows
        // by a factor that depends on the element's own aspect ratio. Group
        // and container expand differently, so no single scale factor can undo
        // it, and the resulting cycle error tears a strip open at every seam.
        const widthOf = (entry: ResizeObserverEntry) => {
            const box: any = (entry as any).borderBoxSize
            const size = Array.isArray(box) ? box[0] : box
            if (size && typeof size.inlineSize === "number") {
                return size.inlineSize
            }
            return entry.contentRect.width
        }

        // Web fonts landing after first paint change the text width; the
        // observer picks that up on its own, no extra listener needed.
        const ro = new ResizeObserver((entries) => {
            let groupWidth = 0
            let wrapperWidth = 0
            for (const entry of entries) {
                if (entry.target === groupRef.current) {
                    groupWidth = widthOf(entry)
                } else if (entry.target === containerRef.current) {
                    wrapperWidth = widthOf(entry)
                }
            }
            commit(groupWidth, wrapperWidth, true)
        })

        if (containerRef.current) ro.observe(containerRef.current)
        if (groupRef.current) ro.observe(groupRef.current)

        return () => ro.disconnect()
    }, [measure, commit])

    // ---------------------------------------------------------------------
    // Copies
    //
    // Visible window spans [offset, offset + containerWidth] with
    // offset < cycle, so the track must be at least containerWidth + cycle
    // wide. +1 extra copy as headroom while a measurement is in flight.
    // ---------------------------------------------------------------------
    const copies = useMemo(() => {
        if (normalizedItems.length === 0) return 1
        if (cycle <= 0) return 2
        const needed = Math.ceil(containerWidth / cycle) + 2
        // Keep the DOM bounded when a very wide banner meets very short items.
        const maxCopies = Math.max(2, Math.floor(600 / normalizedItems.length))
        return clamp(needed, 2, maxCopies)
    }, [normalizedItems.length, cycle, containerWidth])

    // ---------------------------------------------------------------------
    // Animation — a single rAF loop writing transform directly.
    //
    // No keyframe animation: pausing, resizing or changing speed must never
    // restart from x = 0 (that was the visible jump), and the offset is kept
    // modulo `cycle` so it can never drift out of the covered range.
    // ---------------------------------------------------------------------
    const offsetRef = useRef(0)
    const moveLeft = direction === "left"

    const applyTransform = useCallback(() => {
        const el = trackRef.current
        if (!el) return
        const c = cycleRef.current
        if (c <= 0) {
            el.style.transform = "translate3d(0,0,0)"
            return
        }
        const pos = offsetRef.current % c
        const x = moveLeft ? -pos : pos - c
        el.style.transform = `translate3d(${x.toFixed(3)}px,0,0)`
    }, [moveLeft])

    useLayoutEffect(() => {
        applyTransform()
    }, [applyTransform, cycle, copies])

    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const pausedByHover = pauseOnHover && canHover && hovered
    const reducedMotion = respectReducedMotion && prefersReducedMotion

    const shouldAnimate =
        !isStatic &&
        !reducedMotion &&
        isInView &&
        !pausedByHover &&
        // Always halt while a link inside has keyboard focus, independent of
        // the hover setting — a moving target cannot be activated reliably.
        !focused &&
        cycle > 0 &&
        normalizedItems.length > 0

    const pxPerSecond = useMemo(() => clamp(speed, 1, 5000), [speed])

    useEffect(() => {
        if (!shouldAnimate) return
        if (typeof window === "undefined") return

        let raf = 0
        let last = performance.now()

        const tick = (now: number) => {
            raf = requestAnimationFrame(tick)
            // Clamp dt so a backgrounded tab / long task cannot teleport the
            // track by hundreds of pixels on the next frame.
            const dt = Math.min(now - last, 64) / 1000
            last = now

            const c = cycleRef.current
            if (c <= 0) return

            let next = (offsetRef.current + pxPerSecond * dt) % c
            if (next < 0) next += c
            offsetRef.current = next
            applyTransform()
        }

        const onVisibility = () => {
            last = performance.now()
        }
        document.addEventListener("visibilitychange", onVisibility)
        raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
            document.removeEventListener("visibilitychange", onVisibility)
        }
    }, [shouldAnimate, pxPerSecond, applyTransform])

    // ---------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------
    const textStyle = useMemo(
        (): CSSProperties => ({
            ...font,
            fontSize: effectiveFontSize,
            color: textColor,
            whiteSpace: "nowrap",
            textDecoration: "none",
        }),
        [font, effectiveFontSize, textColor]
    )

    const containerStyles = useMemo(
        (): CSSProperties => ({
            ...style,
            position: "relative",
            width: "100%",
            height,
            overflow: "hidden",
            background: backgroundColor,
            display: "flex",
            alignItems: "center",
        }),
        [style, height, backgroundColor]
    )

    const trackStyles = useMemo(
        (): CSSProperties => ({
            display: "flex",
            alignItems: "center",
            gap,
            width: "max-content",
            flexShrink: 0,
            willChange: "transform",
            backfaceVisibility: "hidden",
            userSelect: "none",
        }),
        [gap]
    )

    const groupStyles = useMemo(
        (): CSSProperties => ({
            display: "flex",
            alignItems: "center",
            gap,
            flexShrink: 0,
            whiteSpace: "nowrap",
        }),
        [gap]
    )

    const innerGap = useMemo(() => Math.max(8, Math.round(gap * 0.4)), [gap])

    const renderItem = useCallback(
        (item: MarqueeItem, index: number, decorative: boolean) => {
            const hasLink = !!item.link && item.link.length > 0
            const Wrapper: any = hasLink ? "a" : "div"

            const linkProps = hasLink
                ? {
                      href: item.link,
                      target: item.newTab ? "_blank" : undefined,
                      rel: item.newTab ? "noopener noreferrer" : undefined,
                      // Duplicated groups must not pollute the tab order.
                      tabIndex: decorative ? -1 : undefined,
                  }
                : {}

            return (
                <Wrapper
                    key={index}
                    {...linkProps}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: innerGap,
                        textDecoration: "none",
                        color: textColor,
                        cursor: hasLink ? "pointer" : "default",
                        WebkitTapHighlightColor: "transparent",
                        flexShrink: 0,
                    }}
                >
                    {item.icon === "custom" ? (
                        item.image?.src ? (
                            <img
                                src={item.image.src}
                                srcSet={item.image.srcSet}
                                alt={item.image.alt || ""}
                                width={effectiveIconSize}
                                height={effectiveIconSize}
                                style={{
                                    width: effectiveIconSize,
                                    height: effectiveIconSize,
                                    objectFit: "contain",
                                    display: "block",
                                    flexShrink: 0,
                                }}
                                draggable={false}
                                decoding="async"
                            />
                        ) : null
                    ) : (
                        <BrandIcon
                            name={item.icon as IconName}
                            size={effectiveIconSize}
                        />
                    )}
                    {item.label ? (
                        <span style={textStyle}>{item.label}</span>
                    ) : null}
                </Wrapper>
            )
        },
        [innerGap, textColor, effectiveIconSize, textStyle]
    )

    const groups = useMemo(() => {
        const out: React.ReactNode[] = []
        for (let i = 0; i < copies; i++) {
            const decorative = i > 0
            out.push(
                <div
                    key={i}
                    ref={i === 0 ? groupRef : undefined}
                    style={groupStyles}
                    aria-hidden={decorative ? true : undefined}
                >
                    {normalizedItems.map((item, index) =>
                        renderItem(item, index, decorative)
                    )}
                </div>
            )
        }
        return out
    }, [copies, groupStyles, normalizedItems, renderItem])

    const handleEnter = useCallback(() => {
        if (pauseOnHover && canHover) setHovered(true)
    }, [pauseOnHover, canHover])

    const handleLeave = useCallback(() => {
        if (pauseOnHover && canHover) setHovered(false)
    }, [pauseOnHover, canHover])

    // React's onFocus/onBlur map to focusin/focusout, so they fire for any
    // link inside the track.
    const handleFocus = useCallback(() => setFocused(true), [])
    const handleBlur = useCallback(() => setFocused(false), [])

    // Focusing a link that currently sits outside the visible strip makes the
    // browser scroll it into view. The container clips with overflow:hidden,
    // so that scroll is invisible but permanent — it shifts the whole track
    // out of alignment for good. Snap it back to zero.
    const handleScroll = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        if (el.scrollLeft !== 0) el.scrollLeft = 0
        if (el.scrollTop !== 0) el.scrollTop = 0
    }, [])

    // A <section> only becomes a landmark once it carries an accessible name.
    // Without a label a plain <div> is the honest choice: the links inside are
    // reachable on their own and the banner adds no landmark noise.
    const label = typeof ariaLabel === "string" ? ariaLabel.trim() : ""
    const Container: any = label ? "section" : "div"

    if (normalizedItems.length === 0) {
        return <div ref={containerRef as any} style={containerStyles} />
    }

    return (
        <Container
            ref={containerRef}
            style={containerStyles}
            aria-label={label || undefined}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onScroll={handleScroll}
        >
            <div ref={trackRef} style={trackStyles}>
                {groups}
            </div>
        </Container>
    )
}

addPropertyControls(InfiniteBanner, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 24,
        defaultValue: defaultItems,
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: [
                        "instagram",
                        "tiktok",
                        "linkedin",
                        "facebook",
                        "youtube",
                        "custom",
                        "none",
                    ],
                    optionTitles: [
                        "Instagram",
                        "TikTok",
                        "LinkedIn",
                        "Facebook",
                        "YouTube",
                        "Custom Image",
                        "None",
                    ],
                    defaultValue: "instagram",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (props: any) => props?.icon !== "custom",
                },
                label: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "More Projects on Instagram",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: true,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#4FA1FF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 10,
        max: 64,
        step: 1,
        unit: "px",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 26,
        min: 10,
        max: 64,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Item Gap",
        defaultValue: 22,
        min: 8,
        max: 80,
        step: 1,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 70,
        min: 5,
        max: 800,
        step: 5,
        unit: "px/s",
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 40,
        min: 36,
        max: 200,
        step: 1,
        unit: "px",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Right → Left", "Left → Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "A11y Label",
        defaultValue: "",
        placeholder: "e.g. Social media",
        description:
            "Names the banner as a landmark for screen readers. Leave empty to keep it out of the landmark list.",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
})
