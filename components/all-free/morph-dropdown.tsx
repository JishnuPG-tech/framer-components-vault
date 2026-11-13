// @framerDisableUnlink
/**
 * Morph Dropdown — BuiltByKern Marketplace
 *
 * Liquid morph select: silhouette under SVG goo + sharp content overlay.
 * Continuous y travel, stretch bridge, open grow / close squash.
 * Composite-only hover highlight. Canvas-safe via useIsStaticRenderer.
 */
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
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
    useTransform,
    type MotionValue,
} from "framer-motion"
import {
    startTransition,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
} from "react"

interface OptionItem {
    label: string
    link?: string
    /** Framer layer name or HTML id — used when link is empty */
    section?: string
}

interface ContentCtrl {
    options: OptionItem[]
    defaultOption: string
    openInNewTab: boolean
}

interface AppearanceCtrl {
    background: string
    text: string
    muted: string
    highlight: string
    gap: number
}

interface MotionCtrl {
    previewOpen: boolean
}

interface MorphDropdownProps {
    content: ContentCtrl
    appearance: AppearanceCtrl
    font: CSSProperties
    motion: MotionCtrl
    onChange?: (index: number) => void
    style?: CSSProperties
}

const DEFAULT_OPTIONS: OptionItem[] = [
    { label: "All projects", link: "https://www.framer.com/@builtbykern/" },
    { label: "Product", link: "https://www.framer.com/@builtbykern/" },
    { label: "Brand", link: "https://www.framer.com/@builtbykern/" },
    { label: "Motion", link: "https://www.framer.com/@builtbykern/" },
    { label: "Web", link: "https://www.framer.com/@builtbykern/" },
    { label: "Systems", link: "https://www.framer.com/" },
]

const DEFAULT_CONTENT: ContentCtrl = {
    options: DEFAULT_OPTIONS,
    defaultOption: "All projects",
    openInNewTab: false,
}

/** Brand-facing Appearance defaults (panel) */
const DEFAULT_APPEARANCE: AppearanceCtrl = {
    background: "#0F0F0F",
    text: "#FFFFFF",
    muted: "#888888",
    highlight: "#282828",
    gap: 20,
}

/** Craft constants — nested shell geometry (not exposed; Marketplace slim panel) */
const DEFAULT_WIDTH = 278
const TRIGGER_H = 52
const TRIGGER_RADIUS = 999
/** Outer menu corner */
const MENU_RADIUS = 24
/** Equal air between menu edge ↔ highlight on all sides */
const SHELL_INSET = 6
const HIGHLIGHT_INSET = SHELL_INSET
/** Concentric: inner radius = outer − inset */
const HIGHLIGHT_RADIUS = MENU_RADIUS - SHELL_INSET
const MENU_PAD_Y = SHELL_INSET
/** Shared text column — trigger + options */
const TEXT_PAD_X = 20
const ROW_H = 38

const DEFAULT_MOTION: MotionCtrl = {
    previewOpen: false,
}

const DEFAULT_FONT: CSSProperties = {
    fontFamily:
        'system-ui, -apple-system, "SF Pro Text", "Segoe UI", sans-serif',
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: "1.2em",
}

/** BuiltByKern micro ease-out */
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
/** Viscous open travel — time in the morph zone */
const EASE_LIQUID: [number, number, number, number] = [0.37, 0.0, 0.18, 1]

/** One continuous open/close — goo overlay on sharp base (no opacity swap flicker) */
const OPEN_S = 0.84
/** Close: shrink-into-pill — fast + aggressive squash */
const CLOSE_S = 0.28
/** CSS blur only in goo dissolve window — never during stretch (perf) */
const BLUR_PEAK = 2.1
/** No stretch-phase CSS blur — SVG goo alone */
const BLUR_STRETCH = 0
/** Goo full longer → dissolve later (more morph) */
const GOO_FADE_START = 0.4
const GOO_FADE_END = 0.92
/** Close squash — strong suck into the pill */
const CLOSE_SCALE_Y = 0.12
const CLOSE_SCALE_X = 0.52
/** Open emerge grow — stronger liquid emerge */
const OPEN_SCALE_Y0 = 0.4
const OPEN_SCALE_X0 = 0.74
const OPEN_GROW_UNTIL = 0.55
const PRESS_SCALE = 0.97
const PRESS_S = 0.16
const ROW_STAGGER_S = 0.04
const ROW_FADE_S = 0.2
/** Hover ghost — continuous liquid glide (velocity stretch, no snaps) */
const HIGHLIGHT_SPRING = {
    type: "spring" as const,
    stiffness: 280,
    damping: 28,
    mass: 0.95,
}
const HIGHLIGHT_SETTLE = {
    type: "spring" as const,
    stiffness: 340,
    damping: 30,
    mass: 0.85,
}
const HIGHLIGHT_FADE_S = 0.2
/** Map travel speed → transform stretch only (px/s) — no blur/radius paint */
const HIGHLIGHT_VEL_REF = 780
const HIGHLIGHT_STRETCH_MAX = 0.18
const HIGHLIGHT_SQUASH_MAX = 0.09
const ROW_COLOR_S = 0.2
/** Hide squashed text early on close */
const CLOSE_CONTENT_FADE = 0.15

function normalizeOptions(raw: OptionItem[] | undefined): OptionItem[] {
    if (!raw || raw.length === 0) return DEFAULT_OPTIONS
    const cleaned = raw
        .map((o) => ({
            label: (o?.label ?? "").trim(),
            link: typeof o?.link === "string" ? o.link.trim() : "",
            section: typeof o?.section === "string" ? o.section.trim() : "",
        }))
        .filter((o) => o.label.length > 0)
    return cleaned.length > 0 ? cleaned : DEFAULT_OPTIONS
}

function resolveHref(raw: string): string | null {
    const v = raw.trim()
    if (!v) return null
    const lower = v.toLowerCase()
    if (
        lower.startsWith("mailto:") ||
        lower.startsWith("tel:") ||
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("//") ||
        lower.startsWith("/") ||
        lower.startsWith("#")
    ) {
        return v
    }
    return v
}

function isExternalHref(href: string): boolean {
    const lower = href.toLowerCase()
    return (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("//")
    )
}

function openOptionLink(href: string, forceNewTab: boolean) {
    if (typeof window === "undefined" || !href) return
    if (forceNewTab || isExternalHref(href)) {
        window.open(href, "_blank", "noopener,noreferrer")
        return
    }
    window.location.assign(href)
}

function findSectionElement(name: string): Element | null {
    if (typeof document === "undefined" || !name) return null
    const byId = document.getElementById(name)
    if (byId) return byId
    const escaped =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
            ? CSS.escape(name)
            : name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    const byName = document.querySelector(`[data-framer-name="${escaped}"]`)
    if (byName) return byName
    try {
        const byHash = document.querySelector(`#${escaped}`)
        if (byHash) return byHash
    } catch {
        /* invalid selector */
    }
    return null
}

function scrollToSection(name: string, smooth: boolean) {
    if (typeof window === "undefined" || !name) return
    const el = findSectionElement(name)
    if (!el) return
    el.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
    })
}

/** Trigger + menu blobs (+ optional stretch bridge for goo layer) */
function SilhouetteBody({
    background,
    triggerHeight,
    triggerRadius,
    menuHeight,
    menuRadius,
    y,
    yOpen,
    showMenu,
    staticOpen,
    bridgeScale,
    blobScaleX,
    blobScaleY,
    morphing,
}: {
    background: string
    triggerHeight: number
    triggerRadius: number
    menuHeight: number
    menuRadius: number
    y: MotionValue<number>
    yOpen: number
    showMenu: boolean
    staticOpen: boolean
    bridgeScale?: MotionValue<number>
    blobScaleX: MotionValue<number>
    blobScaleY: MotionValue<number>
    morphing?: boolean
}) {
    const layerHint = morphing ? "transform" : undefined
    return (
        <>
            <div
                style={{
                    width: "100%",
                    height: triggerHeight,
                    borderRadius: triggerRadius,
                    background,
                }}
            />
            {showMenu ? (
                <>
                    {bridgeScale ? (
                        <motion.div
                            style={{
                                position: "absolute",
                                left: "10%",
                                width: "80%",
                                top: triggerHeight - 14,
                                height: yOpen + 22,
                                borderRadius: 999,
                                background,
                                scaleY: bridgeScale,
                                scaleX: blobScaleX,
                                transformOrigin: "top center",
                                willChange: layerHint,
                            }}
                        />
                    ) : null}
                    <motion.div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: triggerHeight,
                            width: "100%",
                            height: menuHeight,
                            borderRadius: menuRadius,
                            background,
                            y: staticOpen ? yOpen : y,
                            scaleX: staticOpen ? 1 : blobScaleX,
                            scaleY: staticOpen ? 1 : blobScaleY,
                            transformOrigin: "top center",
                            willChange: layerHint,
                        }}
                    />
                </>
            ) : null}
        </>
    )
}

function Chevron({
    up,
    color,
    instant,
}: {
    up: boolean
    color: string
    instant?: boolean
}) {
    const rotated = up ? 180 : 0
    return (
        <motion.svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
            initial={false}
            animate={instant ? false : { rotate: rotated }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            style={{
                display: "block",
                flexShrink: 0,
                transform: instant ? `rotate(${rotated}deg)` : undefined,
            }}
        >
            <path
                d="M2.5 4.25 L6 7.75 L9.5 4.25"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </motion.svg>
    )
}

function GooFilter({ id }: { id: string }) {
    return (
        <svg width={0} height={0} aria-hidden style={{ position: "absolute" }}>
            <defs>
                <filter
                    id={id}
                    x="-60%"
                    y="-60%"
                    width="220%"
                    height="220%"
                    colorInterpolationFilters="sRGB"
                >
                    <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation="10"
                        result="blur"
                    />
                    <feColorMatrix
                        in="blur"
                        mode="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
                        result="goo"
                    />
                    <feBlend in="SourceGraphic" in2="goo" />
                </filter>
            </defs>
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 278
 * @framerIntrinsicHeight 52
 * @framerDisableUnlink
 */
export default function MorphDropdown(props: MorphDropdownProps) {
    const {
        content: contentProp,
        appearance: appearanceProp,
        font: fontProp,
        motion: motionProp,
        onChange,
        style,
    } = props

    const content = { ...DEFAULT_CONTENT, ...contentProp }
    const appearance = { ...DEFAULT_APPEARANCE, ...appearanceProp }
    const motionCtrl = { ...DEFAULT_MOTION, ...motionProp }
    const options = useMemo(
        () => normalizeOptions(content.options),
        [content.options]
    )
    const defaultOption = content.defaultOption
    const openInNewTab = Boolean(content.openInNewTab)
    const optionsRef = useRef(options)
    optionsRef.current = options
    const openInNewTabRef = useRef(openInNewTab)
    openInNewTabRef.current = openInNewTab
    const reduceMotionRef = useRef(false)
    const navigateTimerRef = useRef<number | null>(null)

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    reduceMotionRef.current = Boolean(reduceMotion)
    const rootRef = useRef<HTMLDivElement>(null)
    const listId = useId()
    const gooId = useId().replace(/:/g, "")

    useEffect(() => {
        return () => {
            if (
                navigateTimerRef.current != null &&
                typeof window !== "undefined"
            ) {
                window.clearTimeout(navigateTimerRef.current)
            }
        }
    }, [])
    const initialIndex = useMemo(() => {
        const i = options.findIndex((o) => o.label === defaultOption)
        return i >= 0 ? i : 0
    }, [options, defaultOption])

    const [selectedIndex, setSelectedIndex] = useState(initialIndex)
    const [open, setOpen] = useState(false)
    const [hovered, setHovered] = useState<number | null>(null)
    const [menuMounted, setMenuMounted] = useState(false)
    const [morphing, setMorphing] = useState(false)
    /** Goo layer always filtered; opacity crossfades — never hard-kill mid-flight */
    const softBlur = useMotionValue(0)
    const gooOpacity = useMotionValue(0)
    const contentOpacity = useMotionValue(1)
    const blobScaleX = useMotionValue(1)
    const blobScaleY = useMotionValue(1)
    const gooFilter = useMotionTemplate`url(#${gooId}) blur(${softBlur}px)`
    /** Option hover — composite-only liquid (y + scale; no blur/radius paint) */
    const hiY = useMotionValue(0)
    const hiScaleX = useMotionValue(1)
    const hiScaleY = useMotionValue(1)
    const hiPlacedRef = useRef(false)
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
    const focusListOnOpenRef = useRef(false)
    const seqRef = useRef(0)

    useEffect(() => {
        setSelectedIndex(initialIndex)
    }, [initialIndex])

    const showOpen = isStatic ? motionCtrl.previewOpen : open
    const selectedLabel =
        options[selectedIndex]?.label ?? options[0]?.label ?? ""
    const useGoo = !reduceMotion && !isStatic

    const menuPadY = MENU_PAD_Y
    const menuHeight = menuPadY * 2 + options.length * ROW_H
    /**
     * Closed tuck — full-size panel, y only (no scaleY on menu).
     * Bridge height stretches under goo for the liquid neck.
     */
    const yClosed = -Math.round(TRIGGER_H * 0.72)
    const yOpen = appearance.gap

    const y = useMotionValue(showOpen ? yOpen : yClosed)
    const bridgeMax = yOpen + 14
    const bridgeScale = useTransform(y, (v) =>
        Math.max(0, Math.min(1, (v + 14) / bridgeMax))
    )
    const itemsOpacity = useTransform(
        y,
        [yClosed, yOpen * 0.62, yOpen * 0.88, yOpen],
        [0, 0, 0.15, 1]
    )
    const listOpacity = useTransform(
        [itemsOpacity, contentOpacity],
        (vals) => (vals[0] as number) * (vals[1] as number)
    )

    useEffect(() => {
        if (isStatic || reduceMotion) {
            y.set(showOpen ? yOpen : yClosed)
            softBlur.set(0)
            gooOpacity.set(0)
            contentOpacity.set(1)
            blobScaleX.set(1)
            blobScaleY.set(1)
            setMorphing(false)
            setMenuMounted(showOpen)
            return
        }

        const id = ++seqRef.current
        const alive = () => seqRef.current === id
        const span = yOpen - yClosed
        const progress = (v: number) =>
            span === 0 ? 1 : (v - yClosed) / span

        function syncLiquid(t: number) {
            if (t <= GOO_FADE_START) {
                gooOpacity.set(1)
                softBlur.set(BLUR_STRETCH)
                return
            }
            if (t >= GOO_FADE_END) {
                gooOpacity.set(0)
                softBlur.set(0)
                return
            }
            const raw =
                (t - GOO_FADE_START) / (GOO_FADE_END - GOO_FADE_START)
            // Smoothstep dissolve — avoids hard edge flicker vs sharp base
            const u = raw * raw * (3 - 2 * raw)
            gooOpacity.set(1 - u)
            softBlur.set(
                BLUR_STRETCH +
                    (BLUR_PEAK - BLUR_STRETCH) * Math.sin(u * Math.PI)
            )
        }

        function settleMorphing() {
            // Defer layer demotion one frame past settle — kills end flicker
            if (typeof requestAnimationFrame === "undefined") {
                setMorphing(false)
                return
            }
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (alive()) setMorphing(false)
                })
            })
        }

        /** Open: grow from squash into full size for first OPEN_GROW_UNTIL */
        function syncOpenGrow(t: number) {
            if (t >= OPEN_GROW_UNTIL) {
                blobScaleX.set(1)
                blobScaleY.set(1)
                return
            }
            const g = t / OPEN_GROW_UNTIL
            const e = 1 - (1 - g) * (1 - g)
            blobScaleY.set(OPEN_SCALE_Y0 + e * (1 - OPEN_SCALE_Y0))
            blobScaleX.set(OPEN_SCALE_X0 + e * (1 - OPEN_SCALE_X0))
        }

        /** Close 0→1: fast aggressive squash into the pill */
        function syncCloseSquash(closeT: number) {
            const u = Math.max(0, Math.min(1, closeT))
            // Power >1 = more squash early, snaps into the pill
            const s = Math.pow(u, 1.35)
            blobScaleY.set(1 - s * (1 - CLOSE_SCALE_Y))
            blobScaleX.set(1 - s * (1 - CLOSE_SCALE_X))
        }

        function syncCloseContent(closeT: number) {
            if (closeT < CLOSE_CONTENT_FADE) {
                contentOpacity.set(1)
                return
            }
            const u = Math.min(
                1,
                (closeT - CLOSE_CONTENT_FADE) / 0.2
            )
            contentOpacity.set(1 - u)
        }

        async function runOpen() {
            // Motion values first so first paint already has goo (no sharp flash)
            softBlur.set(useGoo ? BLUR_STRETCH : 0)
            contentOpacity.set(1)
            blobScaleX.set(OPEN_SCALE_X0)
            blobScaleY.set(OPEN_SCALE_Y0)
            gooOpacity.set(useGoo ? 1 : 0)
            setMorphing(true)
            setMenuMounted(true)
            await animate(y, yOpen, {
                duration: OPEN_S,
                ease: EASE_LIQUID,
                onUpdate: (v) => {
                    const t = progress(v)
                    syncOpenGrow(t)
                    if (useGoo) syncLiquid(t)
                },
            })
            if (!alive()) return
            softBlur.set(0)
            gooOpacity.set(0)
            contentOpacity.set(1)
            blobScaleX.set(1)
            blobScaleY.set(1)
            settleMorphing()
        }

        async function runClose() {
            softBlur.set(useGoo ? BLUR_PEAK * 0.35 : 0)
            gooOpacity.set(useGoo ? 1 : 0)
            contentOpacity.set(1)
            blobScaleX.set(1)
            blobScaleY.set(1)
            setMorphing(true)
            await animate(y, yClosed, {
                duration: CLOSE_S,
                ease: EASE_OUT,
                onUpdate: (v) => {
                    const closeT = 1 - progress(v)
                    syncCloseSquash(closeT)
                    syncCloseContent(closeT)
                    if (!useGoo) return
                    // Soft dissolve goo near end — avoid hard kill flicker
                    if (closeT < 0.72) {
                        gooOpacity.set(1)
                        softBlur.set(
                            closeT < 0.25
                                ? BLUR_PEAK * 0.35 * (1 - closeT / 0.25)
                                : BLUR_STRETCH * 0.4
                        )
                    } else {
                        const u = (closeT - 0.72) / 0.28
                        const s = u * u * (3 - 2 * u)
                        gooOpacity.set(1 - s)
                        softBlur.set(BLUR_STRETCH * 0.4 * (1 - s))
                    }
                },
            })
            if (!alive()) return
            softBlur.set(0)
            gooOpacity.set(0)
            contentOpacity.set(1)
            blobScaleX.set(1)
            blobScaleY.set(1)
            setMenuMounted(false)
            settleMorphing()
        }

        if (showOpen) {
            void runOpen()
        } else if (menuMounted || Math.abs(y.get() - yClosed) > 1) {
            void runClose()
        }

        return () => {
            seqRef.current += 1
        }
    }, [
        showOpen,
        isStatic,
        reduceMotion,
        y,
        yOpen,
        yClosed,
        useGoo,
        softBlur,
        gooOpacity,
        contentOpacity,
        blobScaleX,
        blobScaleY,
    ])

    const close = useCallback(() => {
        startTransition(() => {
            setOpen(false)
            setHovered(null)
        })
    }, [])

    const toggle = useCallback(() => {
        if (isStatic) return
        startTransition(() => setOpen((v) => !v))
    }, [isStatic])

    const select = useCallback(
        (index: number) => {
            if (isStatic) return
            const opt = optionsRef.current[index]
            const href = resolveHref(opt?.link ?? "")
            const section = (opt?.section ?? "").trim()
            startTransition(() => {
                setSelectedIndex(index)
                onChange?.(index)
                setOpen(false)
                setHovered(null)
            })
            if (!href && !section) return
            const delayMs = reduceMotionRef.current
                ? 0
                : Math.round(CLOSE_S * 1000)
            if (typeof window === "undefined") return
            const t = window.setTimeout(() => {
                if (href) {
                    openOptionLink(href, openInNewTabRef.current)
                    return
                }
                scrollToSection(section, !reduceMotionRef.current)
            }, delayMs)
            navigateTimerRef.current = t
        },
        [isStatic, onChange]
    )

    useEffect(() => {
        if (isStatic || !open) return
        if (typeof document === "undefined") return
        const onPointer = (e: MouseEvent | PointerEvent) => {
            const el = rootRef.current
            if (el && e.target instanceof Node && !el.contains(e.target))
                close()
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
        }
        document.addEventListener("pointerdown", onPointer)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onPointer)
            document.removeEventListener("keydown", onKey)
        }
    }, [close, isStatic, open])

    useEffect(() => {
        if (isStatic || !open || !menuMounted || !focusListOnOpenRef.current)
            return
        focusListOnOpenRef.current = false
        const i = hovered ?? selectedIndex
        optionRefs.current[i]?.focus()
    }, [open, menuMounted, hovered, selectedIndex, isStatic])

    const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (!open) {
                focusListOnOpenRef.current = true
                startTransition(() => {
                    setOpen(true)
                    setHovered(selectedIndex)
                })
            }
        }
    }

    const onOptionKeyDown = (
        e: ReactKeyboardEvent<HTMLButtonElement>,
        index: number
    ) => {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            const next = Math.min(index + 1, options.length - 1)
            setHovered(next)
            optionRefs.current[next]?.focus()
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            if (index === 0) close()
            else {
                const prev = index - 1
                setHovered(prev)
                optionRefs.current[prev]?.focus()
            }
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            select(index)
        } else if (e.key === "Escape") {
            e.preventDefault()
            close()
        }
    }

    const activeHover = hovered ?? (showOpen ? selectedIndex : null)
    // Highlight lives inside padded content box — do NOT re-add menuPadY
    const highlightTop =
        activeHover === null ? 0 : activeHover * ROW_H

    useEffect(() => {
        if (reduceMotion || isStatic) {
            hiY.set(highlightTop)
            hiScaleX.set(1)
            hiScaleY.set(1)
            hiPlacedRef.current = activeHover !== null
            return
        }

        if (activeHover === null) {
            hiPlacedRef.current = false
            const settleX = animate(hiScaleX, 1, HIGHLIGHT_SETTLE)
            const settleY = animate(hiScaleY, 1, HIGHLIGHT_SETTLE)
            return () => {
                settleX.stop()
                settleY.stop()
            }
        }

        // First appear: place in situ (no leap from y=0)
        if (!hiPlacedRef.current) {
            hiPlacedRef.current = true
            hiY.set(highlightTop)
            hiScaleX.set(1)
            hiScaleY.set(1)
            return
        }

        let lastY = hiY.get()
        let lastT =
            typeof performance !== "undefined" ? performance.now() : 0

        const controls = animate(hiY, highlightTop, {
            ...HIGHLIGHT_SPRING,
            onUpdate: (v) => {
                const now =
                    typeof performance !== "undefined"
                        ? performance.now()
                        : lastT + 16
                const dt = Math.max(0.008, (now - lastT) / 1000)
                const speed = Math.abs(v - lastY) / dt
                lastY = v
                lastT = now
                const t = Math.min(1, speed / HIGHLIGHT_VEL_REF)
                const u = t * t * (3 - 2 * t)
                hiScaleY.set(1 + u * HIGHLIGHT_STRETCH_MAX)
                hiScaleX.set(1 - u * HIGHLIGHT_SQUASH_MAX)
            },
        })

        void controls.then(() => {
            void animate(hiScaleX, 1, HIGHLIGHT_SETTLE)
            void animate(hiScaleY, 1, HIGHLIGHT_SETTLE)
        })

        return () => {
            controls.stop()
        }
    }, [
        activeHover,
        highlightTop,
        isStatic,
        reduceMotion,
        hiY,
        hiScaleX,
        hiScaleY,
    ])

    const fontStyle: CSSProperties = {
        ...DEFAULT_FONT,
        ...fontProp,
    }

    const showMenu = Boolean(menuMounted || showOpen)
    const staticOpen = Boolean((isStatic || reduceMotion) && showOpen)
    const pressTap =
        reduceMotion || isStatic ? undefined : { scale: PRESS_SCALE }
    const pressTransition = { duration: PRESS_S, ease: EASE_OUT }

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                overflow: "visible",
                zIndex: showMenu ? 20 : 1,
                ...style,
                width: style?.width ?? DEFAULT_WIDTH,
                height: style?.height ?? TRIGGER_H,
            }}
        >
            {useGoo ? <GooFilter id={gooId} /> : null}

            {/* Sharp base — always opaque; goo overlays (avoids swap flicker) */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            >
                <SilhouetteBody
                    background={appearance.background}
                    triggerHeight={TRIGGER_H}
                    triggerRadius={TRIGGER_RADIUS}
                    menuHeight={menuHeight}
                    menuRadius={MENU_RADIUS}
                    y={y}
                    yOpen={yOpen}
                    showMenu={showMenu}
                    staticOpen={staticOpen}
                    blobScaleX={blobScaleX}
                    blobScaleY={blobScaleY}
                    morphing={morphing}
                />
            </div>

            {/* Goo overlay + stretch bridge — continuous liquid morph */}
            {useGoo ? (
                <motion.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "visible",
                        pointerEvents: "none",
                        filter: gooFilter,
                        opacity: gooOpacity,
                        zIndex: 0,
                    }}
                >
                    <SilhouetteBody
                        background={appearance.background}
                        triggerHeight={TRIGGER_H}
                        triggerRadius={TRIGGER_RADIUS}
                        menuHeight={menuHeight}
                        menuRadius={MENU_RADIUS}
                        y={y}
                        yOpen={yOpen}
                        showMenu={showMenu}
                        staticOpen={staticOpen}
                        bridgeScale={bridgeScale}
                        blobScaleX={blobScaleX}
                        blobScaleY={blobScaleY}
                        morphing={morphing}
                    />
                </motion.div>
            ) : null}

            {/* Sharp content — same y so text rides inside the liquid body */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            >
                <motion.button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={showOpen}
                    aria-controls={listId}
                    onClick={toggle}
                    onKeyDown={onTriggerKeyDown}
                    whileTap={pressTap}
                    transition={pressTransition}
                    style={{
                        all: "unset",
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        height: TRIGGER_H,
                        padding: `0 ${TEXT_PAD_X}px`,
                        color: appearance.text,
                        cursor: "pointer",
                        userSelect: "none",
                        pointerEvents: "auto",
                        ...fontStyle,
                    }}
                >
                    <span
                        style={{
                            position: "relative",
                            flex: 1,
                            minWidth: 0,
                            height: "1.2em",
                            overflow: "hidden",
                            paddingRight: 12,
                        }}
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                                key={selectedLabel}
                                initial={
                                    reduceMotion || isStatic
                                        ? false
                                        : { y: 8, opacity: 0 }
                                }
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -8, opacity: 0 }}
                                transition={{
                                    duration: 0.22,
                                    ease: EASE_OUT,
                                }}
                                style={{
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {selectedLabel}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                    <Chevron
                        up={showOpen}
                        color={appearance.text}
                        instant={Boolean(isStatic || reduceMotion)}
                    />
                </motion.button>

                {showMenu ? (
                    <motion.div
                        id={listId}
                        role="listbox"
                        aria-label="Options"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: TRIGGER_H,
                            width: "100%",
                            height: menuHeight,
                            boxSizing: "border-box",
                            padding: `${menuPadY}px 0`,
                            overflow: "hidden",
                            pointerEvents: "auto",
                            y: staticOpen ? yOpen : y,
                            scaleX: staticOpen ? 1 : blobScaleX,
                            scaleY: staticOpen ? 1 : blobScaleY,
                            transformOrigin: "top center",
                            willChange: morphing ? "transform" : undefined,
                        }}
                        onMouseLeave={() => {
                            if (!isStatic) setHovered(null)
                        }}
                    >
                        <motion.div
                            style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                opacity: staticOpen ? 1 : listOpacity,
                            }}
                        >
                            <motion.div
                                aria-hidden
                                initial={false}
                                animate={{
                                    opacity: activeHover === null ? 0 : 1,
                                }}
                                transition={
                                    reduceMotion || isStatic
                                        ? { duration: 0 }
                                        : {
                                              duration: HIGHLIGHT_FADE_S,
                                              ease: EASE_OUT,
                                          }
                                }
                                style={{
                                    position: "absolute",
                                    left: HIGHLIGHT_INSET,
                                    right: HIGHLIGHT_INSET,
                                    height: ROW_H,
                                    borderRadius: HIGHLIGHT_RADIUS,
                                    background: appearance.highlight,
                                    pointerEvents: "none",
                                    y: hiY,
                                    scaleX: hiScaleX,
                                    scaleY: hiScaleY,
                                    transformOrigin: "center center",
                                }}
                            />
                            {options.map((opt, index) => {
                                const isHot = activeHover === index
                                const stagger =
                                    reduceMotion || isStatic || !showOpen
                                        ? 0
                                        : Math.min(index, 5) * ROW_STAGGER_S
                                return (
                                    <motion.button
                                        key={`${opt.label}-${index}`}
                                        ref={(el) => {
                                            optionRefs.current[index] = el
                                        }}
                                        type="button"
                                        role="option"
                                        aria-selected={
                                            selectedIndex === index
                                        }
                                        tabIndex={
                                            showOpen && isHot ? 0 : -1
                                        }
                                        onMouseEnter={() => {
                                            if (!isStatic) setHovered(index)
                                        }}
                                        onFocus={() => {
                                            if (!isStatic) setHovered(index)
                                        }}
                                        onClick={() => select(index)}
                                        onKeyDown={(e) =>
                                            onOptionKeyDown(e, index)
                                        }
                                        initial={
                                            reduceMotion || isStatic
                                                ? false
                                                : { opacity: 0 }
                                        }
                                        animate={{
                                            opacity: 1,
                                            color: isHot
                                                ? appearance.text
                                                : appearance.muted,
                                        }}
                                        transition={{
                                            opacity: {
                                                duration: ROW_FADE_S,
                                                ease: EASE_OUT,
                                                delay: stagger,
                                            },
                                            color: {
                                                duration:
                                                    reduceMotion || isStatic
                                                        ? 0
                                                        : ROW_COLOR_S,
                                                ease: EASE_OUT,
                                            },
                                            scale: pressTransition,
                                        }}
                                        whileTap={pressTap}
                                        style={{
                                            all: "unset",
                                            boxSizing: "border-box",
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            width: "100%",
                                            height: ROW_H,
                                            padding: `0 ${TEXT_PAD_X}px`,
                                            cursor: "pointer",
                                            userSelect: "none",
                                            ...fontStyle,
                                        }}
                                    >
                                        {opt.label}
                                    </motion.button>
                                )
                            })}
                        </motion.div>
                    </motion.div>
                ) : null}
            </div>
        </div>
    )
}

addPropertyControls(MorphDropdown, {
    content: {
        type: ControlType.Object,
        title: "Content",
        icon: "object",
        description: "Menu labels, destinations, and the closed-state value.",
        controls: {
            options: {
                type: ControlType.Array,
                title: "Options",
                maxCount: 24,
                description: "Label + Link and/or Section per row.",
                defaultValue: DEFAULT_OPTIONS,
                control: {
                    type: ControlType.Object,
                    controls: {
                        label: {
                            type: ControlType.String,
                            title: "Label",
                            defaultValue: "Project",
                            placeholder: "Option label",
                        },
                        link: {
                            type: ControlType.Link,
                            title: "Link",
                            description:
                                "Page or URL. Wins over Section when set.",
                        },
                        section: {
                            type: ControlType.String,
                            title: "Section",
                            placeholder: "Pricing",
                            description:
                                "Framer layer name or HTML id. Used when Link is empty.",
                        },
                    },
                },
            },
            defaultOption: {
                type: ControlType.String,
                title: "Default",
                defaultValue: DEFAULT_CONTENT.defaultOption,
                placeholder: "All projects",
                description: "Must match an Options label exactly.",
            },
            openInNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: DEFAULT_CONTENT.openInNewTab,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Force new tab. External http(s) links always open in a new tab.",
            },
        },
        defaultValue: { ...DEFAULT_CONTENT },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "color",
        description: "Surface, type colors, hover row, and menu gap.",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_APPEARANCE.background,
                description: "Pill and menu fill.",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: DEFAULT_APPEARANCE.text,
                description: "Trigger label and active option.",
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: DEFAULT_APPEARANCE.muted,
                description: "Idle options and chevron.",
            },
            highlight: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: DEFAULT_APPEARANCE.highlight,
                description: "Sliding hover / focus row.",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: DEFAULT_APPEARANCE.gap,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
                description: "Space between pill and open menu.",
            },
        },
        defaultValue: { ...DEFAULT_APPEARANCE },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: false,
        description: "Shared type for trigger and options.",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "effect",
        description:
            "Canvas helpers. Live site always starts closed.\n\nBuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
        controls: {
            previewOpen: {
                type: ControlType.Boolean,
                title: "Preview Open",
                defaultValue: DEFAULT_MOTION.previewOpen,
                enabledTitle: "Open",
                disabledTitle: "Closed",
                description: "Show the open menu on the canvas only.",
            },
        },
        defaultValue: { ...DEFAULT_MOTION },
    },
    onChange: {
        type: ControlType.EventHandler,
        title: "On Change",
    },
})

MorphDropdown.displayName = "Morph Dropdown"
