// User instructions: Create a premium interactive “Content Showcase / Dynamic Category Preview” component for Framer with split-screen layout, interactive categories (Architecture..Digital Fashion), cinematic futuristic luxury styling, Framer Motion transitions, 3D parallax, cursor-follow glow, particles, animated grid, ambient orb, progress line, number spring, background ambient color shifts, responsive, CMS-friendly editable content, dark/light theme variants, optimized 60fps, sound interaction structure, layered preview stacking effect, cinematic switching.

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
    AnimatePresence,
    motion,
    useInView,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion"

type ThemeMode = "dark" | "light"

type MediaType = "image" | "video"

type InteractionMode = "hover" | "click" | "hover+click"

type Item = {
    title: string
    number: string
    tag: string
    mediaType: MediaType
    image?: { src: string; srcSet?: string; alt?: string }
    video?: string
    accent: string
}

interface Props {
    items: Item[]
    theme: ThemeMode
    interactionMode: InteractionMode

    enableSearch: boolean
    searchPlaceholder: string

    sectionLabel: string
    sectionFont: any

    titleFont: any
    metaFont: any

    backgroundColor: string
    surfaceColor: string
    textColor: string
    mutedTextColor: string
    borderColor: string
    neonColor: string

    radius: number
    gap: number
    listWidth: number

    enableParticles: boolean
    enableGrid: boolean
    enableCursorLight: boolean
    enableOrb: boolean

    enableDrag: boolean
    dragRange: number
    dragToReveal: boolean

    enableSound: boolean
    hoverSound: string
    selectSound: string

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n))
}

type BezierEase = [number, number, number, number]
const EASE_LUX: BezierEase = [0.22, 1, 0.36, 1]
const EASE_STD: BezierEase = [0.4, 0, 0.2, 1]

function usePrefersReducedMotionSafe() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(!!mq.matches)
        update()
        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", update)
            return () => mq.removeEventListener("change", update)
        }
        // Safari
        // @ts-ignore
        mq.addListener(update)
        // @ts-ignore
        return () => mq.removeListener(update)
    }, [])
    return reduced
}

function safePlay(url: string, volume = 0.25) {
    if (!url) return
    if (typeof window === "undefined") return
    try {
        const a = new Audio(url)
        a.volume = volume
        // Fire and forget; user gesture required in most browsers.
        void a.play()
    } catch {
        // ignore
    }
}

/**
 * Premium Content Showcase / Dynamic Category Preview
 *
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 620
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PremiumContentShowcase(props: Props) {
    const isStatic = useIsStaticRenderer()
    const reducedMotion = usePrefersReducedMotionSafe()

    const {
        items = defaultItems,
        theme = "dark",
        interactionMode = "hover+click",

        enableSearch = true,
        searchPlaceholder = "Search categories…",

        sectionLabel = "Selected Practices",
        sectionFont,
        titleFont,
        metaFont,

        backgroundColor,
        surfaceColor,
        textColor,
        mutedTextColor,
        borderColor,
        neonColor,

        radius = 26,
        gap = 26,
        listWidth = 360,

        enableParticles = true,
        enableGrid = true,
        enableCursorLight = true,
        enableOrb = true,

        enableDrag = true,
        dragRange = 64,
        dragToReveal = true,

        enableSound = false,
        hoverSound = defaultAudio,
        selectSound = defaultAudio,
    } = props

    const safeItems = React.useMemo(() => {
        const cleaned = (items || []).filter(Boolean) as Partial<Item>[]
        const source = cleaned.length ? cleaned : (defaultItems as Partial<Item>[])
        return source.map((it, idx) => normalizeItem(it || {}, idx))
    }, [items])

    const [activeIndex, setActiveIndex] = React.useState(0)
    const [lockedIndex, setLockedIndex] = React.useState<number | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")

    const filtered = React.useMemo(() => {
        const q = (searchQuery || "").trim().toLowerCase()
        const all = safeItems.map((it, i) => ({ it, i }))
        if (!enableSearch || !q) return all
        return all.filter(({ it }) => {
            const hay = `${it.title} ${it.tag} ${it.number}`.toLowerCase()
            return hay.includes(q)
        })
    }, [enableSearch, safeItems, searchQuery])

    React.useEffect(() => {
        if (!enableSearch) return
        if (!filtered.length) return
        const visible = new Set(filtered.map((x) => x.i))
        if (!visible.has(activeIndex)) {
            React.startTransition(() => setActiveIndex(filtered[0].i))
        }
        if (lockedIndex !== null && !visible.has(lockedIndex)) {
            React.startTransition(() => setLockedIndex(null))
        }
    }, [activeIndex, enableSearch, filtered, lockedIndex])

    const containerRef = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, {
        amount: 0.35,
        margin: "-10% 0px -10% 0px",
        once: true,
    })

    const active = safeItems[clamp(activeIndex, 0, safeItems.length - 1)]
    const accent = active?.accent || neonColor

    // Preload all media for instant hover switching
    React.useEffect(() => {
        if (typeof window === "undefined") return
        safeItems.forEach((it) => {
            if (it?.mediaType === "video" && it.video) {
                try {
                    const v = document.createElement("video")
                    v.preload = "auto"
                    v.src = it.video
                    v.muted = true
                    v.playsInline = true
                    // Trigger network request
                    void v.load()
                } catch {
                    // ignore
                }
                return
            }
            const src = it?.image?.src
            if (!src) return
            try {
                const img = new Image()
                img.decoding = "async"
                img.loading = "eager"
                img.src = src
            } catch {
                // ignore
            }
        })
    }, [safeItems])

    // Cursor-follow light (motion values; no React re-renders)
    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const mxSpring = useSpring(mx, { stiffness: 240, damping: 40, mass: 0.7 })
    const mySpring = useSpring(my, { stiffness: 240, damping: 40, mass: 0.7 })

    const tiltX = useTransform(mySpring, [0, 1], [8, -8])
    const tiltY = useTransform(mxSpring, [0, 1], [-10, 10])

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (!enableCursorLight) return
            if (!containerRef.current) return
            const r = containerRef.current.getBoundingClientRect()
            const nx = clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1)
            const ny = clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1)
            mx.set(nx)
            my.set(ny)
        },
        [enableCursorLight, mx, my],
    )

    const commitActive = React.useCallback(
        (idx: number, reason: "hover" | "click") => {
            const next = clamp(idx, 0, safeItems.length - 1)
            if (reason === "hover" && interactionMode === "click") return
            if (reason === "click" && interactionMode === "hover") return

            React.startTransition(() => setActiveIndex(next))
            if (reason === "click") {
                React.startTransition(() => setLockedIndex(next))
            }

            if (enableSound && !isStatic) {
                if (reason === "hover") safePlay(hoverSound, 0.18)
                if (reason === "click") safePlay(selectSound, 0.24)
            }
        },
        [enableSound, hoverSound, interactionMode, isStatic, safeItems.length, selectSound],
    )

    const onItemEnter = React.useCallback(
        (idx: number) => {
            if (lockedIndex !== null && interactionMode !== "hover") return
            commitActive(idx, "hover")
        },
        [commitActive, interactionMode, lockedIndex],
    )

    const onItemClick = React.useCallback(
        (idx: number) => {
            commitActive(idx, "click")
        },
        [commitActive],
    )

    const themeDefaults = React.useMemo(() => {
        if (theme === "light") {
            return {
                background: backgroundColor || "#FFFFFF",
                surface: surfaceColor || "rgba(255,255,255,0.70)",
                text: textColor || "#0B0D12",
                muted: mutedTextColor || "rgba(11,13,18,0.62)",
                border: borderColor || "rgba(11,13,18,0.10)",
                neon: neonColor || "#6C5CE7",
            }
        }
        return {
            background: backgroundColor || "#07080C",
            surface: surfaceColor || "rgba(255,255,255,0.06)",
            text: textColor || "#F5F7FF",
            muted: mutedTextColor || "rgba(245,247,255,0.62)",
            border: borderColor || "rgba(255,255,255,0.10)",
            neon: neonColor || "#8A5CFF",
        }
    }, [backgroundColor, borderColor, mutedTextColor, neonColor, surfaceColor, textColor, theme])

    const reveal = !isStatic && !reducedMotion

    // Preview stack: keep previous for an "opacity trail" feel.
    const [prevIndex, setPrevIndex] = React.useState(0)
    React.useEffect(() => {
        React.startTransition(() => setPrevIndex(activeIndex))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex])

    const showMotion = !isStatic && !reducedMotion && RenderTarget.current() !== RenderTarget.thumbnail

    return (
        <section
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                color: themeDefaults.text,
                background: themeDefaults.background,
                borderRadius: radius,
                isolation: "isolate",
                boxShadow:
                    theme === "dark"
                        ? "0 30px 80px rgba(0,0,0,0.55)"
                        : "0 30px 80px rgba(10,12,16,0.12)",
            }}
            onPointerMove={showMotion ? onPointerMove : undefined}
            aria-label="Content showcase"
        >
            <style>{css}</style>

            {/* Ambient, theme-aware lighting layer */}
            <motion.div
                aria-hidden
                className="pcs_ambient"
                animate={
                    showMotion
                        ? {
                              background:
                                  theme === "dark"
                                      ? [
                                            `radial-gradient(60% 70% at 12% 12%, ${accent}22 0%, transparent 55%), radial-gradient(70% 70% at 90% 30%, ${themeDefaults.neon}16 0%, transparent 58%), radial-gradient(80% 90% at 50% 110%, rgba(255,255,255,0.06) 0%, transparent 55%)`,
                                            `radial-gradient(60% 70% at 18% 16%, ${accent}26 0%, transparent 55%), radial-gradient(70% 70% at 84% 28%, ${themeDefaults.neon}1A 0%, transparent 58%), radial-gradient(80% 90% at 50% 110%, rgba(255,255,255,0.06) 0%, transparent 55%)`,
                                        ]
                                      : [
                                            `radial-gradient(60% 70% at 12% 12%, ${accent}1A 0%, transparent 55%), radial-gradient(70% 70% at 92% 30%, ${themeDefaults.neon}10 0%, transparent 58%), radial-gradient(80% 90% at 50% 110%, rgba(0,0,0,0.04) 0%, transparent 55%)`,
                                            `radial-gradient(60% 70% at 18% 16%, ${accent}22 0%, transparent 55%), radial-gradient(70% 70% at 84% 28%, ${themeDefaults.neon}12 0%, transparent 58%), radial-gradient(80% 90% at 50% 110%, rgba(0,0,0,0.04) 0%, transparent 55%)`,
                                        ],
                          }
                        : {
                              background:
                                  theme === "dark"
                                      ? `radial-gradient(60% 70% at 12% 12%, ${accent}22 0%, transparent 55%), radial-gradient(70% 70% at 90% 30%, ${themeDefaults.neon}16 0%, transparent 58%), radial-gradient(80% 90% at 50% 110%, rgba(255,255,255,0.06) 0%, transparent 55%)`
                                      : `radial-gradient(60% 70% at 12% 12%, ${accent}1A 0%, transparent 55%), radial-gradient(70% 70% at 92% 30%, ${themeDefaults.neon}10 0%, transparent 58%), radial-gradient(80% 90% at 50% 110%, rgba(0,0,0,0.04) 0%, transparent 55%)`,
                          }
                }
                transition={{ duration: 1.1, ease: EASE_LUX }}
            />

            {/* Animated grid (subtle) */}
            {enableGrid && (
                <div
                    aria-hidden
                    className={"pcs_grid" + (theme === "dark" ? " pcs_gridDark" : " pcs_gridLight")}
                    style={{
                        maskImage:
                            "radial-gradient(120% 70% at 40% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 55%, transparent 88%)",
                    }}
                />
            )}

            {/* Rotating ambient orb */}
            {enableOrb && (
                <motion.div
                    aria-hidden
                    className="pcs_orb"
                    style={{
                        background:
                            theme === "dark"
                                ? `radial-gradient(circle at 30% 30%, ${accent} 0%, rgba(0,0,0,0) 60%), radial-gradient(circle at 70% 70%, ${themeDefaults.neon} 0%, rgba(0,0,0,0) 55%)`
                                : `radial-gradient(circle at 30% 30%, ${accent} 0%, rgba(255,255,255,0) 60%), radial-gradient(circle at 70% 70%, ${themeDefaults.neon} 0%, rgba(255,255,255,0) 55%)`,
                    }}
                    animate={showMotion ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 24, ease: "linear", repeat: showMotion ? Infinity : 0 }}
                />
            )}

            {/* Particles (CSS-only, low cost) */}
            {enableParticles && <div aria-hidden className="pcs_particles" />}

            {/* Cursor-follow light */}
            {enableCursorLight && showMotion && (
                <motion.div
                    aria-hidden
                    className="pcs_cursorLight"
                    style={{
                        left: useTransform(mxSpring, (v) => `${v * 100}%`),
                        top: useTransform(mySpring, (v) => `${v * 100}%`),
                        background:
                            theme === "dark"
                                ? `radial-gradient(circle at center, ${accent}55 0%, ${accent}1A 38%, transparent 70%)`
                                : `radial-gradient(circle at center, ${accent}35 0%, ${accent}12 38%, transparent 70%)`,
                    }}
                />
            )}

            {/* Layout */}
            <motion.div
                className="pcs_shell"
                initial={reveal ? { opacity: 0, y: 18 } : false}
                animate={reveal && isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE_LUX }}
                style={{
                    gap,
                    padding: Math.max(18, Math.min(36, gap)),
                }}
            >
                {/* Left list */}
                <div
                    className="pcs_left"
                    style={{
                        width: "min(46%, " + listWidth + "px)",
                        minWidth: 240,
                    }}
                >
                    <div className="pcs_topMeta" style={{ ...sectionFont }}>
                        <span className="pcs_dot" style={{ background: accent }} />
                        <span style={{ opacity: 0.9 }}>{sectionLabel}</span>
                    </div>

                    {enableSearch && (
                        <div className="pcs_search">
                            <input
                                className="pcs_searchInput"
                                value={searchQuery}
                                onChange={(e) => {
                                    const v = e.target.value
                                    React.startTransition(() => setSearchQuery(v))
                                }}
                                placeholder={searchPlaceholder}
                                aria-label="Search categories"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="pcs_searchClear"
                                    onClick={() => React.startTransition(() => setSearchQuery(""))}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    )}

                    <div className="pcs_list" role="list">
                        {(filtered.length ? filtered : safeItems.map((it, i) => ({ it, i }))).map(({ it, i }) => {
                            const isActive = i === activeIndex
                            const dim = lockedIndex !== null && lockedIndex !== i

                            return (
                                <CategoryRow
                                    key={i}
                                    item={it}
                                    idx={i}
                                    active={isActive}
                                    dim={dim}
                                    theme={theme}
                                    text={themeDefaults.text}
                                    muted={themeDefaults.muted}
                                    border={themeDefaults.border}
                                    accent={isActive ? accent : themeDefaults.neon}
                                    titleFont={titleFont}
                                    metaFont={metaFont}
                                    showMotion={showMotion}
                                    onEnter={() => onItemEnter(i)}
                                    onClick={() => onItemClick(i)}
                                />
                            )
                        })}
                    </div>

                    <div className="pcs_hint" style={{ ...metaFont, color: themeDefaults.muted }}>
                        {interactionMode === "click"
                            ? "Click a category to pin it."
                            : interactionMode === "hover"
                              ? "Hover a category to preview."
                              : "Hover to preview, click to pin."}
                    </div>
                </div>

                {/* Right preview */}
                <div className="pcs_right">
                    <div className="pcs_previewWrap">
                        {/* Layered stacking behind card */}
                        <div
                            aria-hidden
                            className="pcs_stack pcs_stackA"
                            style={{ borderColor: themeDefaults.border }}
                        />
                        <div
                            aria-hidden
                            className="pcs_stack pcs_stackB"
                            style={{ borderColor: themeDefaults.border }}
                        />

                        <PreviewCard
                            item={active}
                            prevItem={safeItems[clamp(prevIndex, 0, safeItems.length - 1)]}
                            theme={theme}
                            radius={radius}
                            surface={themeDefaults.surface}
                            text={themeDefaults.text}
                            muted={themeDefaults.muted}
                            border={themeDefaults.border}
                            accent={accent}
                            metaFont={metaFont}
                            showMotion={showMotion}
                            tiltX={tiltX}
                            tiltY={tiltY}
                            enableDrag={enableDrag}
                            dragRange={dragRange}
                            dragToReveal={dragToReveal}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Subtle noise overlay */}
            <div aria-hidden className="pcs_noise" />
        </section>
    )
}

function CategoryRow(props: {
    item: Item
    idx: number
    active: boolean
    dim: boolean
    theme: ThemeMode
    text: string
    muted: string
    border: string
    accent: string
    titleFont: any
    metaFont: any
    showMotion: boolean
    onEnter: () => void
    onClick: () => void
}) {
    const {
        item,
        idx,
        active,
        dim,
        border,
        accent,
        titleFont,
        metaFont,
        muted,
        showMotion,
        onEnter,
        onClick,
    } = props

    const ref = React.useRef<HTMLButtonElement>(null)

    // Magnetic hover (motion values; local)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const xs = useSpring(x, { stiffness: 420, damping: 42, mass: 0.6 })
    const ys = useSpring(y, { stiffness: 420, damping: 42, mass: 0.6 })

    const onMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (!showMotion) return
            if (!ref.current) return
            const r = ref.current.getBoundingClientRect()
            const dx = (e.clientX - (r.left + r.width / 2)) / Math.max(1, r.width)
            const dy = (e.clientY - (r.top + r.height / 2)) / Math.max(1, r.height)
            x.set(clamp(dx * 14, -14, 14))
            y.set(clamp(dy * 8, -8, 8))
        },
        [showMotion, x, y],
    )

    const onLeave = React.useCallback(() => {
        x.set(0)
        y.set(0)
    }, [x, y])

    const rowOpacity = dim ? 0.38 : active ? 1 : 0.72

    return (
        <motion.button
            ref={ref}
            type="button"
            className={"pcs_row" + (active ? " pcs_rowActive" : "")}
            onPointerEnter={onEnter}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            onClick={onClick}
            role="listitem"
            style={{
                borderColor: active ? accent + "55" : border,
                opacity: rowOpacity,
                x: xs,
                y: ys,
            }}
            whileTap={showMotion ? { scale: 0.985 } : undefined}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            aria-current={active}
        >
            <div className="pcs_rowInner">
                <div className="pcs_rowLeft">
                    <div className="pcs_rowMeta" style={{ ...metaFont, color: muted }}>
                        <motion.span
                            className="pcs_counter"
                            animate={showMotion ? { y: active ? 0 : 2, opacity: 1 } : {}}
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        >
                            {item.number || String(idx + 1).padStart(2, "0")}
                        </motion.span>
                    </div>
                    <div className="pcs_rowTitle" style={{ ...titleFont }}>
                        {item.title}
                    </div>
                </div>

                <div className="pcs_rowRight">
                    <motion.div
                        className="pcs_progress"
                        style={{ background: accent }}
                        initial={false}
                        animate={showMotion ? { scaleY: active ? 1 : 0, opacity: active ? 1 : 0 } : {}}
                        transition={{ duration: 0.38, ease: EASE_LUX }}
                    />

                    <motion.div
                        className="pcs_glowPip"
                        style={{
                            background: accent,
                            boxShadow: `0 0 28px ${accent}55`,
                        }}
                        initial={false}
                        animate={showMotion ? { scale: active ? 1 : 0.6, opacity: active ? 1 : 0.35 } : {}}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                </div>
            </div>

            {/* Active soft glow / pulse */}
            <motion.div
                aria-hidden
                className="pcs_rowAura"
                style={{
                    background: `radial-gradient(120% 90% at 20% 50%, ${accent}30 0%, transparent 65%)`,
                }}
                initial={false}
                animate={showMotion ? { opacity: active ? 1 : 0 } : { opacity: active ? 0.8 : 0 }}
                transition={{ duration: 0.35, ease: EASE_LUX }}
            />

            {/* Animated border shimmer */}
            <div
                aria-hidden
                className="pcs_rowShimmer"
                style={{
                    background: `linear-gradient(120deg, transparent 0%, ${accent}55 30%, transparent 55%)`,
                }}
            />
        </motion.button>
    )
}

function PreviewCard(props: {
    item: Item
    prevItem: Item
    theme: ThemeMode
    radius: number
    surface: string
    text: string
    muted: string
    border: string
    accent: string
    metaFont: any
    showMotion: boolean
    tiltX: any
    tiltY: any
    enableDrag: boolean
    dragRange: number
    dragToReveal: boolean
}) {
    const {
        item,
        prevItem,
        radius,
        surface,
        border,
        accent,
        metaFont,
        muted,
        showMotion,
        tiltX,
        tiltY,
        enableDrag,
        dragRange,
        dragToReveal,
    } = props

    const key = `${item?.title}-${item?.number}-${item?.tag}`

    const transitionIn = React.useMemo(
        () => ({
            duration: 0.18,
            ease: EASE_LUX,
        }),
        [],
    )

    const transitionOut = React.useMemo(
        () => ({
            duration: 0.12,
            ease: EASE_STD,
        }),
        [],
    )

    const dx = useMotionValue(0)
    const dy = useMotionValue(0)

    const [expanded, setExpanded] = React.useState(false)

    const revealProgress = useTransform(dy, (v) => clamp(-v / Math.max(1, dragRange), 0, 1))

    const onDragEnd = React.useCallback(
        (_: any, info: any) => {
            if (!dragToReveal) return
            const offsetY = info?.offset?.y ?? 0
            const shouldExpand = offsetY < -Math.max(12, dragRange * 0.55)
            React.startTransition(() => setExpanded(shouldExpand))
        },
        [dragRange, dragToReveal],
    )

    const onDoubleClick = React.useCallback(() => {
        React.startTransition(() => setExpanded((v) => !v))
    }, [])

    return (
        <motion.div
            className={"pcs_card" + (enableDrag && showMotion ? " pcs_cardDraggable" : "")}
            style={{
                borderRadius: radius,
                background: surface,
                borderColor: border,
                transformStyle: "preserve-3d",
                rotateX: showMotion ? tiltX : 0,
                rotateY: showMotion ? tiltY : 0,
                x: dx,
                y: dy,
            }}
            initial={false}
            animate={showMotion ? { scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            drag={enableDrag && showMotion ? true : false}
            dragConstraints={{
                left: -Math.max(12, dragRange),
                right: Math.max(12, dragRange),
                top: -Math.max(12, dragRange),
                bottom: Math.max(12, dragRange),
            }}
            dragElastic={0.12}
            dragMomentum={false}
        >
            {/* Animated gradient border */}
            <div
                aria-hidden
                className="pcs_cardBorder"
                style={{
                    borderRadius: radius + 1,
                    background: `conic-gradient(from 90deg, ${accent}00, ${accent}66, ${accent}00, rgba(255,255,255,0.10), ${accent}00)`,
                }}
            />

            {/* Corner highlights */}
            <div aria-hidden className="pcs_corner pcs_cornerTL" style={{ borderColor: accent + "66" }} />
            <div aria-hidden className="pcs_corner pcs_cornerBR" style={{ borderColor: accent + "66" }} />

            {/* Media */}
            <div className="pcs_media">
                {/* Opacity trail: previous media faintly behind */}
                <div className="pcs_trail" aria-hidden>
                    <Media item={prevItem} showMotion={false} blurred={true} />
                </div>

                <AnimatePresence mode="sync">
                    <motion.div
                        key={key}
                        className="pcs_mediaInner"
                        initial={showMotion ? { opacity: 0, y: 10, scale: 0.992, filter: "blur(8px)" } : {}}
                        animate={
                            showMotion
                                ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                                : { opacity: 1 }
                        }
                        exit={
                            showMotion
                                ? {
                                      opacity: 0,
                                      y: -10,
                                      scale: 0.995,
                                      filter: "blur(10px)",
                                      transition: transitionOut,
                                  }
                                : {}
                        }
                        transition={showMotion ? transitionIn : undefined}
                    >
                        <Media item={item} showMotion={showMotion} blurred={false} />

                        {/* Subtle motion blur sweep overlay */}
                        {showMotion && <div aria-hidden className="pcs_blurSweep" />}
                    </motion.div>
                </AnimatePresence>

                {/* Dynamic lighting reflection */}
                <motion.div
                    aria-hidden
                    className="pcs_reflection"
                    style={{
                        background: `linear-gradient(120deg, transparent 0%, ${accent}26 35%, rgba(255,255,255,0.14) 55%, transparent 72%)`,
                    }}
                    animate={showMotion ? { x: ["-30%", "130%"] } : { x: "20%" }}
                    transition={{ duration: 2.8, ease: EASE_LUX, repeat: showMotion ? Infinity : 0, repeatDelay: 2.2 }}
                />
            </div>

            {/* Drag-to-reveal panel */}
            {(enableDrag || dragToReveal) && (
                <motion.div
                    aria-hidden
                    className="pcs_reveal"
                    style={{
                        borderColor: border,
                        opacity: expanded ? 1 : revealProgress,
                        y: useTransform(revealProgress, (p) => `${(1 - p) * 18}px`),
                    }}
                >
                    <div className="pcs_revealInner">
                        <div className="pcs_revealTitle" style={{ ...metaFont, color: muted }}>
                            Drag up to reveal
                        </div>
                        <div className="pcs_revealBody" style={{ ...metaFont, color: muted }}>
                            {item?.title} • {item?.tag}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Floating labels */}
            <div className="pcs_badges" aria-hidden>
                <motion.div
                    className="pcs_badge"
                    style={{ borderColor: border }}
                    animate={showMotion ? { y: [0, -6, 0] } : { y: 0 }}
                    transition={{ duration: 4.8, ease: "easeInOut", repeat: showMotion ? Infinity : 0 }}
                >
                    <span className="pcs_badgeDot" style={{ background: accent }} />
                    <span style={{ ...metaFont, color: muted }}>{item?.tag || "Preview"}</span>
                </motion.div>
                <motion.div
                    className="pcs_badge pcs_badgeRight"
                    style={{ borderColor: border }}
                    animate={showMotion ? { y: [0, 7, 0] } : { y: 0 }}
                    transition={{ duration: 6.2, ease: "easeInOut", repeat: showMotion ? Infinity : 0 }}
                >
                    <span className="pcs_badgeChip" style={{ background: accent + "18", borderColor: accent + "55" }}>
                        <span style={{ ...metaFont, color: muted }}>Live</span>
                    </span>
                </motion.div>
            </div>
        </motion.div>
    )
}

function Media({ item, showMotion, blurred }: { item: Item; showMotion: boolean; blurred: boolean }) {
    const image = (item?.image || defaultImage) as { src: string; srcSet?: string; alt?: string }
    const video = item?.video || ""

    if (item?.mediaType === "video" && video) {
        return (
            <video
                className={"pcs_video" + (blurred ? " pcs_videoBlur" : "")}
                src={video}
                autoPlay={showMotion}
                muted
                loop
                playsInline
                preload="auto"
                style={{
                    filter: blurred ? "blur(16px) saturate(1.2)" : "none",
                }}
            />
        )
    }

    return (
        <img
            className={"pcs_img" + (blurred ? " pcs_imgBlur" : "")}
            src={image.src}
            srcSet={image.srcSet || undefined}
            alt={image.alt || ""}
            loading="eager"
            decoding="async"
            style={{
                filter: blurred ? "blur(16px) saturate(1.15)" : "none",
            }}
        />
    )
}

const defaultImage: { src: string; srcSet?: string; alt?: string } = {
    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
    alt: "Gradient 5 - Green",
}

const defaultAudio = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3"

const DEFAULT_MEDIA_BY_TITLE: Record<
    string,
    {
        number: string
        tag: string
        accent: string
        image: { src: string; alt: string }
    }
> = {
    Architecture: {
        number: "01",
        tag: "Spatial Systems",
        accent: "#5BFFB1",
        image: {
            src: "https://images.unsplash.com/photo-1486326658981-ed68abe5868e?auto=format&fit=crop&w=1800&q=80",
            alt: "Futuristic skyscraper architecture",
        },
    },
    "Motion Design": {
        number: "02",
        tag: "Cinematic Kinetics",
        accent: "#FF7A45",
        image: {
            src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1800&q=80",
            alt: "Abstract motion graphics and cinematic VFX",
        },
    },
    "AI Interfaces": {
        number: "03",
        tag: "Adaptive UX",
        accent: "#9A6CFF",
        image: {
            src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1800&q=80",
            alt: "Futuristic AI dashboard interface",
        },
    },
    "Brand Systems": {
        number: "04",
        tag: "Identity Engines",
        accent: "#FFD36C",
        image: {
            src: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1800&q=80",
            alt: "Brand system mockups and typography layouts",
        },
    },
    "Creative Coding": {
        number: "05",
        tag: "Generative Depth",
        accent: "#52A7FF",
        image: {
            src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=80",
            alt: "Creative coding and generative digital experiments",
        },
    },
    "Digital Fashion": {
        number: "06",
        tag: "Future Materials",
        accent: "#FF5CEB",
        image: {
            src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=80",
            alt: "Futuristic fashion model in neon cyberpunk styling",
        },
    },
}

function normalizeItem(input: Partial<Item>, idx: number): Item {
    const titleRaw = (input.title || defaultItems[idx]?.title || "Category").trim()
    const fallback =
        DEFAULT_MEDIA_BY_TITLE[titleRaw] ||
        DEFAULT_MEDIA_BY_TITLE["Architecture"]

    const mediaType = (input.mediaType || "image") as MediaType

    const image =
        input.image && input.image.src
            ? {
                  src: input.image.src,
                  srcSet: input.image.srcSet,
                  alt: input.image.alt || fallback.image.alt,
              }
            : { ...fallback.image }

    return {
        title: titleRaw,
        number: input.number || fallback.number || String(idx + 1).padStart(2, "0"),
        tag: input.tag || fallback.tag,
        mediaType,
        image,
        video: input.video || "",
        accent: input.accent || fallback.accent,
    }
}

const defaultItems: Item[] = [
    {
        title: "Architecture",
        number: "01",
        tag: "Spatial Systems",
        mediaType: "image",
        image: {
            src: DEFAULT_MEDIA_BY_TITLE.Architecture.image.src,
            alt: DEFAULT_MEDIA_BY_TITLE.Architecture.image.alt,
        },
        accent: DEFAULT_MEDIA_BY_TITLE.Architecture.accent,
    },
    {
        title: "Motion Design",
        number: "02",
        tag: "Cinematic Kinetics",
        mediaType: "image",
        image: {
            src: DEFAULT_MEDIA_BY_TITLE["Motion Design"].image.src,
            alt: DEFAULT_MEDIA_BY_TITLE["Motion Design"].image.alt,
        },
        accent: DEFAULT_MEDIA_BY_TITLE["Motion Design"].accent,
    },
    {
        title: "AI Interfaces",
        number: "03",
        tag: "Adaptive UX",
        mediaType: "image",
        image: {
            src: DEFAULT_MEDIA_BY_TITLE["AI Interfaces"].image.src,
            alt: DEFAULT_MEDIA_BY_TITLE["AI Interfaces"].image.alt,
        },
        accent: DEFAULT_MEDIA_BY_TITLE["AI Interfaces"].accent,
    },
    {
        title: "Brand Systems",
        number: "04",
        tag: "Identity Engines",
        mediaType: "image",
        image: {
            src: DEFAULT_MEDIA_BY_TITLE["Brand Systems"].image.src,
            alt: DEFAULT_MEDIA_BY_TITLE["Brand Systems"].image.alt,
        },
        accent: DEFAULT_MEDIA_BY_TITLE["Brand Systems"].accent,
    },
    {
        title: "Creative Coding",
        number: "05",
        tag: "Generative Depth",
        mediaType: "image",
        image: {
            src: DEFAULT_MEDIA_BY_TITLE["Creative Coding"].image.src,
            alt: DEFAULT_MEDIA_BY_TITLE["Creative Coding"].image.alt,
        },
        accent: DEFAULT_MEDIA_BY_TITLE["Creative Coding"].accent,
    },
    {
        title: "Digital Fashion",
        number: "06",
        tag: "Future Materials",
        mediaType: "image",
        image: {
            src: DEFAULT_MEDIA_BY_TITLE["Digital Fashion"].image.src,
            alt: DEFAULT_MEDIA_BY_TITLE["Digital Fashion"].image.alt,
        },
        accent: DEFAULT_MEDIA_BY_TITLE["Digital Fashion"].accent,
    },
]

const css = `
.pcs_shell{display:flex; height:100%; width:100%; position:relative; z-index:2; align-items:stretch;}
.pcs_left{display:flex; flex-direction:column; gap:18px; padding-right:6px;}
.pcs_right{flex:1; min-width:0; display:flex; align-items:stretch; justify-content:center;}

.pcs_search{position:relative; width:100%; display:flex; align-items:center;}
.pcs_searchInput{width:100%; height:44px; border-radius:14px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:inherit; padding:0 42px 0 14px; outline:none; -webkit-appearance:none; appearance:none;}
.pcs_searchInput::placeholder{color:rgba(245,247,255,0.52);}
.pcs_searchInput:focus{box-shadow:0 0 0 3px rgba(138,92,255,0.18); border-color:rgba(138,92,255,0.35);}
.pcs_searchClear{position:absolute; right:10px; width:28px; height:28px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background:rgba(0,0,0,0.18); color:inherit; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1; font-size:18px;}
.pcs_searchClear:focus{outline:none; box-shadow:0 0 0 3px rgba(138,92,255,0.18);}

.pcs_topMeta{display:flex; gap:10px; align-items:center; letter-spacing:-0.01em;}
.pcs_dot{width:8px; height:8px; border-radius:999px;}

.pcs_list{display:flex; flex-direction:column; gap:12px; flex:1; min-height:0;}

.pcs_row{position:relative; width:100%; text-align:left; border:1px solid; border-radius:18px; padding:16px 16px; background:rgba(255,255,255,0.02); cursor:pointer; overflow:hidden; transform:translateZ(0);}
.pcs_row:focus{outline:none; box-shadow:0 0 0 3px rgba(138,92,255,0.25);}
.pcs_rowInner{display:flex; align-items:center; justify-content:space-between; gap:14px; position:relative; z-index:2;}
.pcs_rowLeft{display:flex; flex-direction:column; gap:8px; min-width:0;}
.pcs_rowTitle{white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.03em;}
.pcs_rowMeta{display:flex; align-items:center; gap:10px;}
.pcs_counter{font-variant-numeric:tabular-nums; letter-spacing:0.02em;}

.pcs_rowRight{display:flex; align-items:center; gap:12px;}
.pcs_progress{width:2px; height:28px; border-radius:99px; transform-origin:50% 50%;}
.pcs_glowPip{width:8px; height:8px; border-radius:99px;}

.pcs_rowAura{position:absolute; inset:-1px; pointer-events:none; opacity:0; z-index:1;}
.pcs_rowShimmer{position:absolute; inset:-40% -80%; pointer-events:none; opacity:0.75; transform:rotate(16deg); animation:pcs_shimmer 2.8s linear infinite; mix-blend-mode:screen; z-index:1;}
.pcs_row:hover .pcs_rowShimmer{opacity:1;}

.pcs_hint{opacity:0.9;}

.pcs_previewWrap{position:relative; width:100%; height:100%; min-height:0; display:flex; align-items:stretch; justify-content:stretch;}

.pcs_stack{position:absolute; inset:0; border:1px solid; border-radius:28px; background:rgba(255,255,255,0.02); filter:blur(0px);}
.pcs_stackA{transform:translate3d(14px, 16px, 0); opacity:0.45;}
.pcs_stackB{transform:translate3d(28px, 30px, 0); opacity:0.22;}

.pcs_card{position:relative; width:100%; height:100%; border:1px solid; overflow:hidden; box-shadow:0 22px 70px rgba(0,0,0,0.35);}
.pcs_cardDraggable{cursor:grab;}
.pcs_cardDraggable:active{cursor:grabbing;}

.pcs_reveal{position:absolute; left:18px; right:18px; bottom:18px; border:1px solid; border-radius:18px; background:rgba(0,0,0,0.18); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); pointer-events:none; z-index:4; overflow:hidden;}
.pcs_revealInner{padding:12px 14px; display:flex; flex-direction:column; gap:4px;}
.pcs_revealTitle{opacity:0.85;}
.pcs_revealBody{opacity:0.95;}

.pcs_cardBorder{position:absolute; inset:-1px; filter:blur(0px); opacity:0.72; animation:pcs_border 6.2s linear infinite; mix-blend-mode:screen; pointer-events:none;}

.pcs_corner{position:absolute; width:40px; height:40px; border:1px solid; pointer-events:none; opacity:0.65;}
.pcs_cornerTL{top:16px; left:16px; border-right:none; border-bottom:none; border-top-left-radius:14px;}
.pcs_cornerBR{bottom:16px; right:16px; border-left:none; border-top:none; border-bottom-right-radius:14px;}

.pcs_media{position:absolute; inset:0;}
.pcs_mediaInner{position:absolute; inset:0;}
.pcs_img, .pcs_video{width:100%; height:100%; object-fit:cover; transform:scale(1.03);}
.pcs_trail{position:absolute; inset:0; opacity:0.14; transform:scale(1.06);}

.pcs_reflection{position:absolute; top:-20%; bottom:-20%; width:65%; left:-30%; opacity:0.28; filter:blur(2px); mix-blend-mode:screen; pointer-events:none; transform:skewX(-10deg);}

.pcs_badges{position:absolute; inset:0; pointer-events:none; z-index:4;}
.pcs_badge{position:absolute; top:18px; left:18px; display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:999px; border:1px solid; background:rgba(0,0,0,0.12); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);}
.pcs_badgeRight{left:auto; right:18px;}
.pcs_badgeDot{width:8px; height:8px; border-radius:999px;}
.pcs_badgeChip{display:inline-flex; align-items:center; padding:8px 10px; border-radius:999px; border:1px solid; background:rgba(255,255,255,0.04);}

.pcs_noise{position:absolute; inset:0; z-index:5; pointer-events:none; opacity:0.12; background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="180" height="180" filter="url(%23n)" opacity="0.55"/></svg>'); mix-blend-mode:overlay;}

.pcs_ambient{position:absolute; inset:0; z-index:0; pointer-events:none;}

.pcs_grid{position:absolute; inset:-30%; z-index:1; pointer-events:none; opacity:0.55; background-size: 46px 46px; background-image: linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px); transform:rotate(-10deg); animation:pcs_grid 10s linear infinite;}
.pcs_gridDark{opacity:0.22; filter:drop-shadow(0 0 24px rgba(138,92,255,0.18));}
.pcs_gridLight{opacity:0.14;}

.pcs_orb{position:absolute; width:520px; height:520px; left:-120px; top:-160px; z-index:1; pointer-events:none; filter:blur(28px); opacity:0.55;}

.pcs_cursorLight{position:absolute; width:520px; height:520px; margin-left:-260px; margin-top:-260px; z-index:3; pointer-events:none; filter:blur(16px); opacity:0.55; mix-blend-mode:screen;}

.pcs_particles{position:absolute; inset:0; pointer-events:none; z-index:1; background-image:
radial-gradient(circle at 20% 30%, rgba(255,255,255,0.14) 0 1px, transparent 1px),
radial-gradient(circle at 70% 25%, rgba(255,255,255,0.11) 0 1px, transparent 1px),
radial-gradient(circle at 55% 60%, rgba(255,255,255,0.10) 0 1px, transparent 1px),
radial-gradient(circle at 30% 80%, rgba(255,255,255,0.09) 0 1px, transparent 1px);
background-size: 220px 220px, 260px 260px, 320px 320px, 380px 380px;
animation:pcs_particles 10s ease-in-out infinite;
opacity:0.5;
}

.pcs_blurSweep{position:absolute; inset:-20%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent); transform:rotate(10deg); animation:pcs_sweep 0.72s ease-out 1; mix-blend-mode:screen; pointer-events:none; opacity:0.65;}

@keyframes pcs_border{0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);}}
@keyframes pcs_shimmer{0%{transform:translateX(-25%) rotate(16deg);} 100%{transform:translateX(35%) rotate(16deg);}}
@keyframes pcs_grid{0%{transform:translate3d(0,0,0) rotate(-10deg);} 100%{transform:translate3d(46px,46px,0) rotate(-10deg);}}
@keyframes pcs_particles{0%,100%{transform:translate3d(0,0,0); opacity:0.45;} 50%{transform:translate3d(-10px, -14px, 0); opacity:0.62;}}
@keyframes pcs_sweep{0%{transform:translateX(-25%) rotate(10deg); opacity:0;} 25%{opacity:0.8;} 100%{transform:translateX(35%) rotate(10deg); opacity:0;}}

@media (max-width: 860px){
  .pcs_shell{flex-direction:column;}
  .pcs_left{width:100% !important; padding-right:0;}
  .pcs_right{width:100%;}
  .pcs_previewWrap{height: min(52vh, 520px);}
}
`

addPropertyControls(PremiumContentShowcase, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    interactionMode: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["hover+click", "hover", "click"],
        optionTitles: ["Hover+Click", "Hover", "Click"],
        defaultValue: "hover+click",
    },
    enableSearch: {
        type: ControlType.Boolean,
        title: "Search",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    searchPlaceholder: {
        type: ControlType.String,
        title: "Search Placeholder",
        defaultValue: "Search categories…",
        hidden: ({ enableSearch }) => !enableSearch,
    },

    sectionLabel: {
        type: ControlType.String,
        title: "Section Label",
        defaultValue: "Selected Practices",
    },
    sectionFont: {
        type: ControlType.Font,
        title: "Section Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.1em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 20,
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1.1em",
        },
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },

    items: {
        type: ControlType.Array,
        title: "Categories",
        maxCount: 12,
        defaultValue: defaultItems,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Architecture" },
                number: { type: ControlType.String, title: "Number", defaultValue: "01" },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "Spatial Systems" },
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                accent: { type: ControlType.Color, title: "Accent", defaultValue: "#8A5CFF" },
            },
        },
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#07080C",
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Surface",
        defaultValue: "rgba(255,255,255,0.06)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#F5F7FF",
    },
    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "rgba(245,247,255,0.62)",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255,255,255,0.10)",
    },
    neonColor: {
        type: ControlType.Color,
        title: "Neon",
        defaultValue: "#8A5CFF",
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 26,
        min: 8,
        max: 48,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 26,
        min: 12,
        max: 46,
        step: 1,
        unit: "px",
    },
    listWidth: {
        type: ControlType.Number,
        title: "List Width",
        defaultValue: 360,
        min: 240,
        max: 520,
        step: 1,
        unit: "px",
    },

    enableGrid: {
        type: ControlType.Boolean,
        title: "Grid",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableOrb: {
        type: ControlType.Boolean,
        title: "Orb",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableParticles: {
        type: ControlType.Boolean,
        title: "Particles",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableCursorLight: {
        type: ControlType.Boolean,
        title: "Cursor Light",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    enableDrag: {
        type: ControlType.Boolean,
        title: "Drag Card",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    dragToReveal: {
        type: ControlType.Boolean,
        title: "Drag Reveal",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableDrag }) => !enableDrag,
    },
    dragRange: {
        type: ControlType.Number,
        title: "Drag Range",
        defaultValue: 64,
        min: 12,
        max: 160,
        step: 1,
        unit: "px",
        hidden: ({ enableDrag }) => !enableDrag,
    },

    enableSound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverSound: {
        type: ControlType.File,
        title: "Hover Sound",
        allowedFileTypes: ["mp3", "wav", "ogg"],
        hidden: ({ enableSound }) => !enableSound,
    },
    selectSound: {
        type: ControlType.File,
        title: "Select Sound",
        allowedFileTypes: ["mp3", "wav", "ogg"],
        hidden: ({ enableSound }) => !enableSound,
    },
})
