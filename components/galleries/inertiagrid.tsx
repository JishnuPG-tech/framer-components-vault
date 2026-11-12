// @framerDisableUnlink
// @framerSupportedLayoutWidth: any
// @framerSupportedLayoutHeight: auto
// @framerIntrinsicWidth: 800
// @framerIntrinsicHeight: 600

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
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
    useInView,
    type MotionValue,
} from "framer-motion"
import {
    useEffect,
    useLayoutEffect,
    useState,
    useMemo,
    useCallback,
    startTransition,
    useRef,
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent,
    type RefObject,
} from "react"

// ─── TYPES ─────────────────────────────────────────────────────────────

interface MediaItem {
    /** ResponsiveImage object from Framer, or a legacy string URL */
    src: unknown
    alt: string
    borderRadius?: string
    href?: string
}

interface NormalizedMediaItem {
    src: string | undefined
    srcSet: string | undefined
    alt: string
    borderRadius?: string
    href?: string
}

interface LayoutConfig {
    columns: number
    columnsTablet: number
    columnsMobile: number
    gap: number
    gapTablet: number
    gapMobile: number
    itemSize: number
    itemSizeTablet: number
    itemSizeMobile: number
}

interface BackgroundConfig {
    mode: "solid" | "transparent" | "gradient"
    solidColor: string
    gradientStart: string
    gradientEnd: string
    gradientAngle: number
    placeholderBorder?: {
        borderColor?: string
        borderStyle?: "solid" | "dashed" | "dotted" | "double"
        borderWidth?: number
    }
    placeholderColor: string
}

interface ResponsiveConfig {
    breakpointTablet: number
    breakpointMobile: number
}

interface EntranceConfig {
    preset: "fade-up" | "scale-in" | "stagger-wave" | "stagger-spiral"
    duration: number
    staggerDelay: number
}

interface Props {
    items: MediaItem[]
    preset?: "drift" | "repel" | "glitch"
    amount?: number
    layout?: LayoutConfig
    background?: BackgroundConfig
    responsive?: ResponsiveConfig
    entrance?: EntranceConfig
    alignment?: {
        verticalAlign: "top" | "center" | "bottom"
        horizontalAlign: "left" | "center" | "right"
    }
    ariaLabel: string
    onItemTap?: () => void
    style?: CSSProperties
}

type PhysicsPreset = "drift" | "repel" | "glitch"

interface TilePhysicsEntry {
    el: HTMLElement | null
    x: MotionValue<number>
    y: MotionValue<number>
    rotate: MotionValue<number>
    itemScale: MotionValue<number>
    itemSize: number
    maxDisp: number
    rotationRange: number
    preset: PhysicsPreset
    cx: number
    cy: number
}

function normalizeImageSrc(src: unknown): string | undefined {
    if (!src) return undefined
    if (typeof src === "string") return src
    if (typeof src === "object") {
        const srcObj = src as Record<string, unknown>
        const value = srcObj.src ?? srcObj.url
        return typeof value === "string" ? value : undefined
    }
    return undefined
}

function normalizeImageSrcSet(src: unknown): string | undefined {
    if (!src || typeof src !== "object") return undefined
    const value = (src as Record<string, unknown>).srcSet
    return typeof value === "string" && value.length > 0 ? value : undefined
}

function resolveItemAlt(item: MediaItem): string {
    if (item.alt && item.alt.trim().length > 0) return item.alt
    if (item.src && typeof item.src === "object") {
        const alt = (item.src as Record<string, unknown>).alt
        if (typeof alt === "string" && alt.trim().length > 0) return alt
    }
    return ""
}

function normalizeMediaItem(item: MediaItem): NormalizedMediaItem {
    return {
        src: normalizeImageSrc(item.src),
        srcSet: normalizeImageSrcSet(item.src),
        alt: resolveItemAlt(item),
        borderRadius: item.borderRadius,
        href: item.href,
    }
}

function getPlaceholderStyle(
    background: BackgroundConfig,
    borderRadius?: string
): CSSProperties {
    const border = background.placeholderBorder
    return {
        width: "100%",
        height: "100%",
        aspectRatio: "1 / 1",
        backgroundColor:
            background.placeholderColor || "rgba(255, 255, 255, 0.06)",
        border: border
            ? `${border.borderWidth || 1}px ${border.borderStyle || "solid"} ${border.borderColor || "rgba(255, 255, 255, 0.08)"}`
            : "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: borderRadius || "4%",
        pointerEvents: "none",
    }
}

const IMAGE_FADE_MS = 200
const IMAGE_FADE_EASE = "cubic-bezier(0.23, 1, 0.32, 1)"

function useImageReveal(src: string | undefined) {
    const [ready, setReady] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    useLayoutEffect(() => {
        setReady(false)
        const el = imgRef.current
        if (el && el.complete && el.naturalWidth > 0) {
            setReady(true)
        }
    }, [src])

    const onLoad = useCallback(() => {
        setReady(true)
    }, [])

    const fadeStyle: CSSProperties = {
        opacity: ready ? 1 : 0,
        transition: `opacity ${IMAGE_FADE_MS}ms ${IMAGE_FADE_EASE}`,
    }

    return { imgRef, onLoad, fadeStyle, ready }
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────

const SPRING_POSITION = {
    stiffness: 220,
    damping: 18,
    mass: 0.9,
}

const SPRING_SCALE = {
    stiffness: 80,
    damping: 22,
    mass: 1.2,
}

const PRESET_BASE = {
    drift: {
        maxDisp: 0.12,
        springStiffness: 35,
        rotationRange: 0,
        mass: 2.5,
    },
    repel: {
        maxDisp: 0.4,
        springStiffness: 180,
        rotationRange: 8,
        mass: 1.2,
    },
    glitch: {
        maxDisp: 0.35,
        springStiffness: 140,
        rotationRange: 15,
        mass: 1.4,
    },
}

const DEMO_IMAGE_URLS = [
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
    "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
] as const

const DEMO_IMAGE_ALTS = [
    "Gradient 1 - Blue",
    "Gradient 2 - Purple",
    "Gradient 3 - Orange",
    "Gradient 4 - Yellow",
    "Gradient 5 - Green",
    "Gradient 6 - Blue",
] as const

/** ResponsiveImage-shaped defaults (string URLs alone do not hydrate in Framer). */
const DEFAULT_MEDIA: MediaItem[] = DEMO_IMAGE_URLS.map((url, i) => ({
    src: { src: url, alt: DEMO_IMAGE_ALTS[i] },
    alt: DEMO_IMAGE_ALTS[i],
    borderRadius: "4%",
}))

const DEFAULT_LAYOUT: LayoutConfig = {
    columns: 4,
    columnsTablet: 3,
    columnsMobile: 2,
    gap: 16,
    gapTablet: 12,
    gapMobile: 8,
    itemSize: 160,
    itemSizeTablet: 140,
    itemSizeMobile: 120,
}

const DEFAULT_BACKGROUND: BackgroundConfig = {
    mode: "transparent",
    solidColor: "#0A0A0A",
    gradientStart: "#0A0A0A",
    gradientEnd: "#1A1A1A",
    gradientAngle: 135,
    placeholderBorder: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderStyle: "solid",
        borderWidth: 1,
    },
    placeholderColor: "rgba(255, 255, 255, 0.06)",
}

const DEFAULT_RESPONSIVE: ResponsiveConfig = {
    breakpointTablet: 810,
    breakpointMobile: 390,
}

const DEFAULT_ENTRANCE: EntranceConfig = {
    preset: "fade-up",
    duration: 0.35,
    staggerDelay: 0.04,
}

const ENTRANCE_PRESETS = {
    "fade-up": {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
    },
    "scale-in": {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
    },
    "stagger-wave": {
        initial: { opacity: 0, y: 20, x: -12 },
        animate: { opacity: 1, y: 0, x: 0 },
    },
    "stagger-spiral": {
        initial: { opacity: 0, scale: 0.92, rotate: -8 },
        animate: { opacity: 1, scale: 1, rotate: 0 },
    },
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const IDLE_MS = 150
const SENTINEL = -9999

/** Frozen mid-inertia poses for canvas / export / thumbnail (no rAF). */
const STATIC_INERTIA_POSES: Array<{
    x: number
    y: number
    r: number
    s: number
}> = [
    { x: -48, y: 28, r: -14, s: 1.12 },
    { x: 44, y: -36, r: 12, s: 0.88 },
    { x: -24, y: -42, r: -9, s: 1.1 },
    { x: 52, y: 22, r: 16, s: 0.86 },
    { x: -38, y: 18, r: -12, s: 1.14 },
    { x: 30, y: -28, r: 10, s: 0.9 },
    { x: -18, y: 40, r: -7, s: 1.08 },
    { x: 46, y: -14, r: 8, s: 0.92 },
]

function staticInertiaTransform(index: number): string {
    const pose = STATIC_INERTIA_POSES[index % STATIC_INERTIA_POSES.length]
    return `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.r}deg) scale(${pose.s})`
}

/**
 * Kern_InertiaGrid
 *
 * Interactive grid of media items with physics-based hover animations.
 * Each item responds to cursor proximity and velocity with inertia effects
 * including translation, rotation, and scaling using spring physics.
 *
 * @version 1.2.1
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function Kern_InertiaGrid(props: Partial<Props>) {
    const {
        items = DEFAULT_MEDIA,
        preset = "repel",
        amount = 50,
        layout = DEFAULT_LAYOUT,
        background = DEFAULT_BACKGROUND,
        responsive = DEFAULT_RESPONSIVE,
        entrance = DEFAULT_ENTRANCE,
        alignment = { verticalAlign: "top", horizontalAlign: "center" },
        ariaLabel = "Interactive media grid with physics-based hover effects",
        onItemTap,
        style,
    } = props

    const safeItems = useMemo(() => {
        const raw = items && items.length > 0 ? items : DEFAULT_MEDIA
        // Framer hydrates Array+ResponsiveImage defaults as items without src;
        // treat that as "use demo media" so canvas / thumbnail stay rich.
        const anyImage = raw.some((item) => Boolean(normalizeImageSrc(item.src)))
        return anyImage ? raw : DEFAULT_MEDIA
    }, [items])

    const normalizedItems = useMemo(() => {
        return safeItems.map((item) => normalizeMediaItem(item))
    }, [safeItems])

    const activePhysics = useMemo(() => {
        const base = PRESET_BASE[preset] ?? PRESET_BASE.repel
        const intensity = amount / 100

        return {
            maxDisp: base.maxDisp * intensity,
            springStiffness: base.springStiffness,
            rotationRange: base.rotationRange * intensity,
            mass: base.mass,
        }
    }, [preset, amount])

    const containerRef = useRef<HTMLDivElement>(null)
    const [windowWidth, setWindowWidth] = useState<number>(
        typeof window !== "undefined" ? window.innerWidth : 1440
    )
    const [containerWidth, setContainerWidth] = useState<number>(0)
    const [finePointer, setFinePointer] = useState<boolean>(() => {
        if (typeof window === "undefined") return true
        return window.matchMedia("(hover: hover) and (pointer: fine)").matches
    })

    const isCanvas = useIsOnFramerCanvas()
    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })

    // Official: useIsStaticRenderer covers Canvas + Export (avoids export tiling).
    // KERN: useIsOnFramerCanvas keeps the editor snappy.
    const showStatic = isCanvas || isStatic
    const physicsOk =
        !showStatic && !prefersReduced && isInView && finePointer
    const entranceOk = !showStatic && isInView

    const mouseX = useMotionValue(SENTINEL)
    const mouseY = useMotionValue(SENTINEL)

    const tilesRef = useRef<Map<number, TilePhysicsEntry>>(new Map())
    const layoutDirtyRef = useRef(true)
    const rafRef = useRef<number | null>(null)
    const idleTimerRef = useRef<number | null>(null)
    const velocityRef = useRef({
        prevX: SENTINEL,
        prevY: SENTINEL,
        prevT: 0,
        vx: 0,
        vy: 0,
    })
    const loopingRef = useRef(false)

    const registerTile = useCallback((index: number, entry: TilePhysicsEntry) => {
        tilesRef.current.set(index, entry)
        layoutDirtyRef.current = true
    }, [])

    const unregisterTile = useCallback((index: number) => {
        tilesRef.current.delete(index)
    }, [])

    const refreshCenters = useCallback(() => {
        for (const entry of tilesRef.current.values()) {
            if (!entry.el) continue
            const rect = entry.el.getBoundingClientRect()
            entry.cx = rect.left + rect.width / 2
            entry.cy = rect.top + rect.height / 2
        }
        layoutDirtyRef.current = false
    }, [])

    const writeRestAll = useCallback(() => {
        for (const entry of tilesRef.current.values()) {
            entry.x.set(0)
            entry.y.set(0)
            entry.rotate.set(0)
            entry.itemScale.set(1)
        }
        velocityRef.current.vx = 0
        velocityRef.current.vy = 0
        velocityRef.current.prevX = SENTINEL
        velocityRef.current.prevY = SENTINEL
    }, [])

    const stopLoop = useCallback(() => {
        loopingRef.current = false
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    const tick = useCallback(() => {
        if (!loopingRef.current) return

        if (layoutDirtyRef.current) {
            refreshCenters()
        }

        const mouseXVal = mouseX.get()
        const mouseYVal = mouseY.get()
        const now = performance.now()
        const vel = velocityRef.current

        if (mouseXVal === SENTINEL) {
            writeRestAll()
            stopLoop()
            return
        }

        if (vel.prevX !== SENTINEL) {
            const dt = Math.max((now - vel.prevT) / 1000, 1 / 120)
            vel.vx = (mouseXVal - vel.prevX) / dt
            vel.vy = (mouseYVal - vel.prevY) / dt
        }
        vel.prevX = mouseXVal
        vel.prevY = mouseYVal
        vel.prevT = now

        for (const entry of tilesRef.current.values()) {
            const dx = mouseXVal - entry.cx
            const dy = mouseYVal - entry.cy
            const distance = Math.sqrt(dx * dx + dy * dy)
            const influenceRadius = entry.itemSize * 1.25

            if (distance >= influenceRadius || distance === 0) {
                entry.x.set(0)
                entry.y.set(0)
                entry.rotate.set(0)
                entry.itemScale.set(1)
                continue
            }

            const force = Math.pow(
                (influenceRadius - distance) / influenceRadius,
                2.5
            )
            const targetX = -(dx / distance) * force * entry.maxDisp
            const targetY = -(dy / distance) * force * entry.maxDisp
            let targetRotate =
                -(dx / distance) * force * entry.rotationRange

            if (entry.preset === "glitch") {
                const flicker = (Math.random() - 0.5) * 12
                targetRotate = targetRotate + flicker
            }

            let inertiaX = -(vel.vx / 2400) * entry.maxDisp * 0.35
            let inertiaY = -(vel.vy / 2400) * entry.maxDisp * 0.35
            const cap = entry.maxDisp * 0.5
            inertiaX = Math.max(-cap, Math.min(cap, inertiaX))
            inertiaY = Math.max(-cap, Math.min(cap, inertiaY))

            entry.x.set(targetX + inertiaX)
            entry.y.set(targetY + inertiaY)
            entry.rotate.set(targetRotate)

            if (distance < entry.itemSize * 0.9) {
                entry.itemScale.set(1.06)
            } else {
                entry.itemScale.set(0.94)
            }
        }

        rafRef.current = requestAnimationFrame(tick)
    }, [mouseX, mouseY, refreshCenters, writeRestAll, stopLoop])

    const startLoop = useCallback(() => {
        if (loopingRef.current || !physicsOk) return
        loopingRef.current = true
        rafRef.current = requestAnimationFrame(tick)
    }, [physicsOk, tick])

    const clearIdleTimer = useCallback(() => {
        if (idleTimerRef.current != null) {
            clearTimeout(idleTimerRef.current)
            idleTimerRef.current = null
        }
    }, [])

    const scheduleIdleRest = useCallback(() => {
        clearIdleTimer()
        idleTimerRef.current = window.setTimeout(() => {
            mouseX.set(SENTINEL)
            mouseY.set(SENTINEL)
            writeRestAll()
            stopLoop()
        }, IDLE_MS)
    }, [clearIdleTimer, mouseX, mouseY, writeRestAll, stopLoop])

    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
        const onChange = () => {
            startTransition(() => setFinePointer(mq.matches))
        }
        onChange()
        mq.addEventListener("change", onChange)
        return () => mq.removeEventListener("change", onChange)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleResize = () => {
            startTransition(() => {
                setWindowWidth(window.innerWidth)
            })
            layoutDirtyRef.current = true
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        if (!containerRef.current) return
        if (typeof ResizeObserver === "undefined") return

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                startTransition(() => {
                    setContainerWidth(entry.contentRect.width)
                })
                layoutDirtyRef.current = true
            }
        })

        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    useEffect(() => {
        if (!physicsOk) {
            mouseX.set(SENTINEL)
            mouseY.set(SENTINEL)
            writeRestAll()
            stopLoop()
            clearIdleTimer()
        }
    }, [physicsOk, mouseX, mouseY, writeRestAll, stopLoop, clearIdleTimer])

    useEffect(() => {
        return () => {
            stopLoop()
            clearIdleTimer()
        }
    }, [stopLoop, clearIdleTimer])

    const { activeColumns, activeGap, activeItemSize } = useMemo(() => {
        const isMobile = windowWidth <= responsive.breakpointMobile
        const isTablet = !isMobile && windowWidth <= responsive.breakpointTablet

        return {
            activeColumns: isMobile
                ? layout.columnsMobile
                : isTablet
                  ? layout.columnsTablet
                  : layout.columns,
            activeGap: isMobile
                ? layout.gapMobile
                : isTablet
                  ? layout.gapTablet
                  : layout.gap,
            activeItemSize: isMobile
                ? layout.itemSizeMobile
                : isTablet
                  ? layout.itemSizeTablet
                  : layout.itemSize,
        }
    }, [windowWidth, layout, responsive])

    const { scaledItemSize, scaledGap } = useMemo(() => {
        const gridWidth =
            activeColumns * activeItemSize +
            (activeColumns - 1) * activeGap +
            activeGap * 2
        const shouldScale = containerWidth > 0 && containerWidth < gridWidth

        if (shouldScale) {
            const scale = containerWidth / gridWidth
            return {
                scaledItemSize: activeItemSize * scale,
                scaledGap: activeGap * scale,
            }
        }

        return {
            scaledItemSize: activeItemSize,
            scaledGap: activeGap,
        }
    }, [activeColumns, activeItemSize, activeGap, containerWidth])

    useEffect(() => {
        layoutDirtyRef.current = true
    }, [scaledItemSize, scaledGap, activeColumns, normalizedItems.length])

    const containerStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        ...(background.mode === "transparent"
            ? { background: "transparent" }
            : background.mode === "solid"
              ? { backgroundColor: background.solidColor }
              : {
                    background: `linear-gradient(${background.gradientAngle}deg, ${background.gradientStart}, ${background.gradientEnd})`,
                }),
        position: "relative",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        alignItems:
            alignment.horizontalAlign === "left"
                ? "flex-start"
                : alignment.horizontalAlign === "right"
                  ? "flex-end"
                  : "center",
        justifyContent:
            alignment.verticalAlign === "top"
                ? "flex-start"
                : alignment.verticalAlign === "bottom"
                  ? "flex-end"
                  : "center",
        fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
        ...style,
    }

    const gridWrapperStyle: CSSProperties = {
        display: "inline-flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 1,
    }

    const gridStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: `repeat(${activeColumns}, ${scaledItemSize}px)`,
        gridAutoRows: `${scaledItemSize}px`,
        gap: `${scaledGap}px`,
        padding: scaledGap,
    }

    const onPointerMove =
        physicsOk
            ? (e: PointerEvent<HTMLDivElement>) => {
                  if (e.pointerType !== "mouse" && e.pointerType !== "pen") {
                      return
                  }
                  mouseX.set(e.clientX)
                  mouseY.set(e.clientY)
                  clearIdleTimer()
                  startLoop()
                  scheduleIdleRest()
              }
            : undefined

    const onPointerLeave = physicsOk
        ? () => {
              clearIdleTimer()
              mouseX.set(SENTINEL)
              mouseY.set(SENTINEL)
              writeRestAll()
              stopLoop()
          }
        : undefined

    if (showStatic) {
        return (
            <div
                ref={containerRef}
                style={{ ...containerStyle, overflow: "visible" }}
                role="region"
                aria-label={ariaLabel}
            >
                <div style={gridWrapperStyle}>
                    <div style={{ ...gridStyle, overflow: "visible" }} role="list">
                        {normalizedItems.map((item, index) => (
                            <div
                                key={index}
                                role="listitem"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "relative",
                                    overflow: "visible",
                                }}
                            >
                                {item.src ? (
                                    <img
                                        src={item.src}
                                        srcSet={item.srcSet}
                                        alt={item.alt}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius:
                                                item.borderRadius || "4%",
                                            display: "block",
                                            transform:
                                                staticInertiaTransform(index),
                                            transformOrigin: "center center",
                                            willChange: "transform",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            ...getPlaceholderStyle(
                                                background,
                                                item.borderRadius
                                            ),
                                            transform:
                                                staticInertiaTransform(index),
                                            transformOrigin: "center center",
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            role="region"
            aria-label={ariaLabel}
        >
            <div style={gridWrapperStyle}>
                <div style={gridStyle} role="list">
                    {normalizedItems.map((item, index) => (
                        <div
                            key={index}
                            role="listitem"
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                            }}
                        >
                            <InertiaCard
                                item={item}
                                physics={activePhysics}
                                physicsOk={physicsOk}
                                entranceOk={entranceOk}
                                prefersReduced={!!prefersReduced}
                                index={index}
                                background={background}
                                itemSize={scaledItemSize}
                                preset={preset}
                                entrance={entrance}
                                onItemTap={onItemTap}
                                registerTile={registerTile}
                                unregisterTile={unregisterTile}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── INERTIA CARD ──────────────────────────────────────────────────────

interface InertiaCardProps {
    item: NormalizedMediaItem
    physics: {
        maxDisp: number
        springStiffness: number
        rotationRange: number
        mass: number
    }
    physicsOk: boolean
    entranceOk: boolean
    prefersReduced: boolean
    index: number
    background?: BackgroundConfig
    itemSize: number
    preset: PhysicsPreset
    entrance: EntranceConfig
    onItemTap?: () => void
    registerTile: (index: number, entry: TilePhysicsEntry) => void
    unregisterTile: (index: number) => void
}

function InertiaCard({
    item,
    physics: propsPhysics,
    physicsOk,
    entranceOk,
    prefersReduced,
    index,
    background = DEFAULT_BACKGROUND,
    itemSize,
    preset,
    entrance,
    onItemTap,
    registerTile,
    unregisterTile,
}: InertiaCardProps) {
    const itemRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null)

    const presetConfig = useMemo(() => {
        return {
            maxDisp: itemSize * propsPhysics.maxDisp,
            springStiffness: propsPhysics.springStiffness,
            rotationRange: propsPhysics.rotationRange,
            mass: propsPhysics.mass,
        }
    }, [propsPhysics, itemSize])

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotate = useMotionValue(0)
    const itemScale = useMotionValue(1)

    const springX = useSpring(x, {
        ...SPRING_POSITION,
        stiffness: presetConfig.springStiffness,
        mass: presetConfig.mass,
    })
    const springY = useSpring(y, {
        ...SPRING_POSITION,
        stiffness: presetConfig.springStiffness,
        mass: presetConfig.mass,
    })
    const springRotate = useSpring(rotate, {
        ...SPRING_POSITION,
        stiffness: presetConfig.springStiffness,
        mass: presetConfig.mass,
    })
    const springScale = useSpring(itemScale, SPRING_SCALE)

    const transform = useTransform(
        [springX, springY, springRotate, springScale],
        ([tx, ty, r, s]) =>
            `translate3d(${tx}px, ${ty}px, 0) rotate(${r}deg) scale(${s})`
    )

    useLayoutEffect(() => {
        if (!physicsOk) {
            unregisterTile(index)
            x.set(0)
            y.set(0)
            rotate.set(0)
            itemScale.set(1)
            return
        }

        registerTile(index, {
            el: itemRef.current,
            x,
            y,
            rotate,
            itemScale,
            itemSize,
            maxDisp: presetConfig.maxDisp,
            rotationRange: presetConfig.rotationRange,
            preset,
            cx: 0,
            cy: 0,
        })

        return () => unregisterTile(index)
    }, [
        physicsOk,
        index,
        x,
        y,
        rotate,
        itemScale,
        itemSize,
        preset,
        presetConfig.maxDisp,
        presetConfig.rotationRange,
        registerTile,
        unregisterTile,
    ])

    const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
        if (!item.href && onItemTap && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onItemTap()
        }
    }

    const handleActivate = () => {
        onItemTap?.()
    }

    const buttonStyle: CSSProperties = {
        position: "relative",
        cursor: item.href || onItemTap ? "pointer" : "default",
        padding: 0,
        border: "none",
        background: "transparent",
        display: "block",
        minWidth: 44,
        width: "100%",
        height: "100%",
        textDecoration: "none",
        color: "inherit",
    }

    const imageStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: item.borderRadius || "4%",
        display: "block",
        pointerEvents: "none",
    }

    const { imgRef, onLoad, fadeStyle } = useImageReveal(item.src)

    const placeholderStyle = getPlaceholderStyle(background, item.borderRadius)

    const media = item.src ? (
        physicsOk ? (
            <motion.img
                ref={imgRef}
                src={item.src}
                srcSet={item.srcSet}
                alt={item.alt}
                onLoad={onLoad}
                style={{ ...imageStyle, ...fadeStyle, transform }}
            />
        ) : (
            <img
                ref={imgRef}
                src={item.src}
                srcSet={item.srcSet}
                alt={item.alt}
                onLoad={onLoad}
                style={{ ...imageStyle, ...fadeStyle }}
            />
        )
    ) : physicsOk ? (
        <motion.div style={{ ...placeholderStyle, transform }} />
    ) : (
        <div style={placeholderStyle} />
    )

    // Prefer img alt for the accessible name; label wrappers only when needed.
    const hasImageName = Boolean(item.src && item.alt?.trim())
    const nameProps = hasImageName
        ? {}
        : { "aria-label": item.alt?.trim() || "Media item" }
    // Linked tiles navigate natively — only attach onClick for tap side-effects without href.
    const tapProps =
        onItemTap && !item.href
            ? { onClick: handleActivate, onKeyDown: handleKeyDown }
            : {}

    if (!entranceOk) {
        if (item.href) {
            return (
                <a
                    ref={itemRef as RefObject<HTMLAnchorElement>}
                    href={item.href}
                    style={buttonStyle}
                    {...nameProps}
                >
                    {item.src ? (
                        <img
                            ref={imgRef}
                            src={item.src}
                            srcSet={item.srcSet}
                            alt={item.alt}
                            onLoad={onLoad}
                            style={{ ...imageStyle, ...fadeStyle }}
                        />
                    ) : (
                        <div style={placeholderStyle} />
                    )}
                </a>
            )
        }

        return (
            <button
                ref={itemRef as RefObject<HTMLButtonElement>}
                type="button"
                style={buttonStyle}
                {...nameProps}
                {...tapProps}
            >
                {item.src ? (
                    <img
                        ref={imgRef}
                        src={item.src}
                        srcSet={item.srcSet}
                        alt={item.alt}
                        onLoad={onLoad}
                        style={{ ...imageStyle, ...fadeStyle }}
                    />
                ) : (
                    <div style={placeholderStyle} />
                )}
            </button>
        )
    }

    const entranceAnimation = prefersReduced
        ? {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
          }
        : ENTRANCE_PRESETS[entrance.preset]

    const rawDelay = prefersReduced
        ? Math.min(index * 0.03, 0.24)
        : entrance.preset === "stagger-spiral"
          ? index * entrance.staggerDelay * 1.5
          : index * entrance.staggerDelay
    const staggerDelay = prefersReduced ? rawDelay : Math.min(rawDelay, 0.4)

    const entranceTransition = prefersReduced
        ? {
              duration: 0.2,
              ease: EASE_OUT,
              delay: staggerDelay,
          }
        : {
              type: "spring" as const,
              stiffness: 80,
              damping: 22,
              mass: 1.2,
              delay: staggerDelay,
              duration: entrance.duration,
          }

    const motionInteractiveProps = {
        style: buttonStyle,
        ...nameProps,
        ...tapProps,
        initial: entranceAnimation.initial,
        whileInView: entranceAnimation.animate,
        viewport: { once: true, amount: 0.3 },
        transition: entranceTransition,
        whileTap: prefersReduced
            ? undefined
            : {
                  scale: 0.97,
                  transition: {
                      duration: 0.16,
                      ease: EASE_OUT,
                  },
              },
    }

    if (item.href) {
        return (
            <motion.a
                ref={itemRef as RefObject<HTMLAnchorElement>}
                href={item.href}
                {...motionInteractiveProps}
            >
                {media}
            </motion.a>
        )
    }

    return (
        <motion.button
            ref={itemRef as RefObject<HTMLButtonElement>}
            type="button"
            {...motionInteractiveProps}
        >
            {media}
        </motion.button>
    )
}

// ─── FRAMER PROPERTY CONTROLS ──────────────────────────────────────────

addPropertyControls(Kern_InertiaGrid, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        description:
            "Choose an interaction personality: Drift (gentle float), Repel (magnetic push), or Glitch (chaotic scatter)",
        options: ["drift", "repel", "glitch"],
        optionTitles: ["Drift", "Repel", "Glitch"],
        defaultValue: "repel",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
    },
    amount: {
        type: ControlType.Number,
        title: "Amount",
        description: "Intensity of the physics effect (0-100)",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        unit: "%",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        description: "Media items to display in the grid",
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description:
                        "Select an image. Supports Framer plugins like Lummi and Pexels.",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    description:
                        "Accessible description (overrides image alt when set)",
                    defaultValue: "",
                    placeholder: "Descriptive text for screen readers",
                },
                borderRadius: {
                    type: ControlType.String,
                    title: "Border Radius",
                    description: "Corner rounding (e.g., 4%, 8px, 50%)",
                    defaultValue: "4%",
                    placeholder: "4%",
                },
                href: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Optional destination when this tile is clicked",
                },
            },
        },
        defaultValue: DEFAULT_MEDIA,
    },
    onItemTap: {
        type: ControlType.EventHandler,
        title: "On Item Tap",
    },
    entrance: {
        type: ControlType.Object,
        title: "Entrance",
        description: "Configure how items animate into view",
        optional: true,
        buttonTitle: "Configure Entrance",
        icon: "effect",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Animation Style",
                description: "Choose entrance animation pattern",
                options: [
                    "fade-up",
                    "scale-in",
                    "stagger-wave",
                    "stagger-spiral",
                ],
                optionTitles: [
                    "Fade Up",
                    "Scale In",
                    "Stagger Wave",
                    "Stagger Spiral",
                ],
                defaultValue: "fade-up",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                description: "Animation duration in seconds",
                defaultValue: 0.35,
                min: 0.2,
                max: 2,
                step: 0.1,
                displayStepper: true,
                unit: "s",
            },
            staggerDelay: {
                type: ControlType.Number,
                title: "Stagger Delay",
                description: "Delay between each item's animation",
                defaultValue: 0.04,
                min: 0,
                max: 0.3,
                step: 0.01,
                displayStepper: true,
                unit: "s",
            },
        },
        defaultValue: DEFAULT_ENTRANCE,
    },
    alignment: {
        type: ControlType.Object,
        title: "Alignment",
        description: "Control how the grid is positioned within the frame",
        optional: true,
        buttonTitle: "Configure Alignment",
        icon: "object",
        controls: {
            verticalAlign: {
                type: ControlType.Enum,
                title: "Vertical Align",
                description: "Vertical alignment of the grid",
                options: ["top", "center", "bottom"],
                optionTitles: ["Top", "Center", "Bottom"],
                defaultValue: "top",
                displaySegmentedControl: true,
            },
            horizontalAlign: {
                type: ControlType.Enum,
                title: "Horizontal Align",
                description: "Horizontal alignment of the grid",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "center",
                displaySegmentedControl: true,
            },
        },
        defaultValue: {
            verticalAlign: "top",
            horizontalAlign: "center",
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Grid layout configuration with responsive breakpoints",
        optional: true,
        buttonTitle: "Configure Layout",
        icon: "object",
        controls: {
            columns: {
                type: ControlType.Number,
                title: "Columns (Desktop)",
                description:
                    "Number of columns when width is above the Tablet breakpoint",
                defaultValue: 4,
                min: 2,
                max: 8,
                step: 1,
                displayStepper: true,
                unit: "",
            },
            columnsTablet: {
                type: ControlType.Number,
                title: "Columns (Tablet)",
                description:
                    "Number of columns when width is above Mobile and at or below the Tablet breakpoint",
                defaultValue: 3,
                min: 2,
                max: 6,
                step: 1,
                displayStepper: true,
                unit: "",
            },
            columnsMobile: {
                type: ControlType.Number,
                title: "Columns (Mobile)",
                description:
                    "Number of columns when width is at or below the Mobile breakpoint",
                defaultValue: 2,
                min: 1,
                max: 4,
                step: 1,
                displayStepper: true,
                unit: "",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap (Desktop)",
                description: "Gap when width is above the Tablet breakpoint",
                defaultValue: 16,
                min: 0,
                max: 64,
                step: 4,
                displayStepper: true,
                unit: "px",
            },
            gapTablet: {
                type: ControlType.Number,
                title: "Gap (Tablet)",
                description:
                    "Gap when width is above Mobile and at or below the Tablet breakpoint",
                defaultValue: 12,
                min: 0,
                max: 48,
                step: 4,
                displayStepper: true,
                unit: "px",
            },
            gapMobile: {
                type: ControlType.Number,
                title: "Gap (Mobile)",
                description:
                    "Gap when width is at or below the Mobile breakpoint",
                defaultValue: 8,
                min: 0,
                max: 32,
                step: 4,
                displayStepper: true,
                unit: "px",
            },
            itemSize: {
                type: ControlType.Number,
                title: "Item Size (Desktop)",
                description:
                    "Item size when width is above the Tablet breakpoint",
                defaultValue: 160,
                min: 80,
                max: 400,
                step: 20,
                displayStepper: true,
                unit: "px",
            },
            itemSizeTablet: {
                type: ControlType.Number,
                title: "Item Size (Tablet)",
                description:
                    "Item size when width is above Mobile and at or below the Tablet breakpoint",
                defaultValue: 140,
                min: 80,
                max: 300,
                step: 20,
                displayStepper: true,
                unit: "px",
            },
            itemSizeMobile: {
                type: ControlType.Number,
                title: "Item Size (Mobile)",
                description:
                    "Item size when width is at or below the Mobile breakpoint",
                defaultValue: 120,
                min: 60,
                max: 200,
                step: 20,
                displayStepper: true,
                unit: "px",
            },
        },
        defaultValue: DEFAULT_LAYOUT,
    },
    background: {
        type: ControlType.Object,
        title: "Background",
        description: "Background mode and color configuration",
        optional: true,
        buttonTitle: "Configure Background",
        icon: "color",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                description: "Background rendering mode",
                options: ["solid", "transparent", "gradient"],
                optionTitles: ["Solid", "Transparent", "Gradient"],
                defaultValue: "transparent",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            solidColor: {
                type: ControlType.Color,
                title: "Solid Color",
                description: "Background color when mode is solid",
                defaultValue: "#0A0A0A",
                hidden: (props) => props.mode !== "solid",
            },
            gradientStart: {
                type: ControlType.Color,
                title: "Gradient Start",
                description: "Starting color of the gradient",
                defaultValue: "#0A0A0A",
                hidden: (props) => props.mode !== "gradient",
            },
            gradientEnd: {
                type: ControlType.Color,
                title: "Gradient End",
                description: "Ending color of the gradient",
                defaultValue: "#1A1A1A",
                hidden: (props) => props.mode !== "gradient",
            },
            gradientAngle: {
                type: ControlType.Number,
                title: "Gradient Angle",
                description: "Angle of the gradient in degrees",
                defaultValue: 135,
                min: 0,
                max: 360,
                step: 15,
                unit: "deg",
                hidden: (props) => props.mode !== "gradient",
            },
            placeholderColor: {
                type: ControlType.Color,
                title: "Placeholder Color",
                description: "Background color for empty image slots",
                defaultValue: "rgba(255, 255, 255, 0.06)",
                hidden: (props) => props.mode === "transparent",
            },
            placeholderBorder: {
                type: ControlType.Object,
                title: "Placeholder Border",
                description: "Border style for empty image slots",
                optional: true,
                buttonTitle: "Configure Border",
                icon: "object",
                controls: {
                    borderColor: {
                        type: ControlType.Color,
                        title: "Color",
                        description: "Border color",
                        defaultValue: "rgba(255, 255, 255, 0.08)",
                    },
                    borderStyle: {
                        type: ControlType.Enum,
                        title: "Style",
                        description: "Border style",
                        options: ["solid", "dashed", "dotted", "double"],
                        optionTitles: ["Solid", "Dashed", "Dotted", "Double"],
                        defaultValue: "solid",
                        displaySegmentedControl: true,
                        segmentedControlDirection: "vertical",
                    },
                    borderWidth: {
                        type: ControlType.Number,
                        title: "Width",
                        description: "Border width",
                        defaultValue: 1,
                        min: 0,
                        max: 10,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                },
                defaultValue: {
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    borderStyle: "solid",
                    borderWidth: 1,
                },
                hidden: (props) => props.mode === "transparent",
            },
        },
        defaultValue: DEFAULT_BACKGROUND,
    },
    responsive: {
        type: ControlType.Object,
        title: "Responsive",
        description: "Breakpoint configuration for responsive behavior",
        optional: true,
        buttonTitle: "Configure Breakpoints",
        icon: "object",
        controls: {
            breakpointTablet: {
                type: ControlType.Number,
                title: "Tablet Breakpoint",
                description: "Maximum width for tablet layout",
                defaultValue: 810,
                min: 600,
                max: 1200,
                step: 10,
                displayStepper: true,
                unit: "px",
            },
            breakpointMobile: {
                type: ControlType.Number,
                title: "Mobile Breakpoint",
                description: "Maximum width for mobile layout",
                defaultValue: 390,
                min: 320,
                max: 600,
                step: 10,
                displayStepper: true,
                unit: "px",
            },
        },
        defaultValue: DEFAULT_RESPONSIVE,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        description: "Accessible label for screen readers.\n\nBuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
        defaultValue: "Interactive media grid with physics-based hover effects",
    },
})

Kern_InertiaGrid.displayName = "Kern Inertia Grid"
