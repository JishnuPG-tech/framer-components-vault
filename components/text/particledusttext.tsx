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
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
    startTransition,
} from "react"

// Request: Make scroll-based pin spacer work out of the box by defaulting to auto/fit-content height behavior, while keeping width default at 100% and preserving existing visuals/controls/animation behavior.

// ─── Types ───────────────────────────────────────────────────────────────────

interface Particle {
    x: number
    y: number
    baseX: number
    baseY: number
    vx: number
    vy: number
    size: number
    opacity: number
    color: string
    life: number
}

interface WordEntry {
    text: string
    color: string
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDefaultWidth 100%
 * @framerDefaultHeight 100vh
 * @framerDescription Animate words as glowing particles with scroll-driven switching, mouse interaction, and full style control — color, glow, density, animation mode, and more.
 * @framerByline GenQ Solutions
 */
export default function ParticleText(props: {
    wordList: WordEntry[]
    scrollBased: boolean
    scrollPerWord: number
    scrollUnit: string
    scrollMomentum: boolean
    momentumMultiplier: number
    transitionDuration: number

    fontSize: number
    fontWeight: string
    letterSpacing: number
    wordSpacing: number
    textAlign: string

    particleSize: number
    particleDensity: number
    particleOpacity: number
    glowIntensity: number

    animationMode: string
    floatSpeed: number
    floatAmplitude: number
    reformSpeed: number
    explosionForce: number
    autoAnimate: boolean
    autoAnimateInterval: number

    mouseInteraction: string
    mouseRadius: number
    mouseForce: number

    backgroundColor: string
    ambientParticles: boolean
    ambientCount: number
    ambientColor: string

    style?: React.CSSProperties
}) {
    const {
        wordList = [
            { text: "HELLO", color: "#ff5800" },
            { text: "WORLD", color: "#00aaff" },
        ],
        scrollBased = true,
        scrollPerWord = 100,
        scrollUnit = "vh",
        scrollMomentum = true,
        momentumMultiplier = 0.5,
        transitionDuration = 800,

        fontSize = 80,
        fontWeight = "900",
        letterSpacing = 2,
        wordSpacing = 30,
        textAlign = "center",

        particleSize = 3,
        particleDensity = 4,
        particleOpacity = 1,
        glowIntensity = 15,

        animationMode = "float",
        floatSpeed = 1,
        floatAmplitude = 3,
        reformSpeed = 0.08,
        explosionForce = 8,
        autoAnimate = false,
        autoAnimateInterval = 3,

        mouseInteraction = "repel",
        mouseRadius = 80,
        mouseForce = 6,

        backgroundColor = "#000000",
        ambientParticles = true,
        ambientCount = 30,
        ambientColor = "#ff5800",

        style = { width: "100%", height: "100vh" },
    } = props

    // ── Static renderer check (required by Framer for Marketplace) ───────────
    const isStatic = useIsStaticRenderer()
    const renderTarget = RenderTarget.current()
    const isCanvasTarget =
        renderTarget === RenderTarget.canvas ||
        renderTarget === RenderTarget.export ||
        renderTarget === RenderTarget.thumbnail
    const shouldUseScrollSpacer = scrollBased && !isStatic && !isCanvasTarget

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const ambientRef = useRef<Particle[]>([])
    const rafRef = useRef<number>(0)
    const mouseRef = useRef({ x: -9999, y: -9999, down: false })
    const explodedRef = useRef(false)
    const frameRef = useRef(0)
    const sizeRef = useRef({ w: 800, h: 500 })
    const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    )
    const transitioningRef = useRef(false)
    const currentIndexRef = useRef(0)
    const targetIndexRef = useRef(0)
    const lastScrollRef = useRef(0)
    const isVisibleRef = useRef(true)
    const isAnimatingRef = useRef(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [viewportWidth, setViewportWidth] = useState(1200)

    // ── Stable memoized list ────────────────────────────────────────────────
    const safeList = useMemo<WordEntry[]>(() => {
        return Array.isArray(wordList) && wordList.length > 0
            ? wordList
            : [{ text: "HELLO", color: "#ff5800" }]
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(wordList)])

    // ── Pin Spacer Height ───────────────────────────────────────────────────
    const calculatedHeight = useMemo(() => {
        if (!shouldUseScrollSpacer) return "100%"
        const unit = scrollUnit === "vh" ? "vh" : "px"
        return `calc(100vh + ${safeList.length * scrollPerWord}${unit})`
    }, [shouldUseScrollSpacer, safeList.length, scrollPerWord, scrollUnit])

    const effectiveFontSize = useMemo(() => {
        const maxByViewport = viewportWidth * 0.28
        return Math.max(32, Math.min(fontSize, maxByViewport))
    }, [fontSize, viewportWidth])

    const wrapperStyle = useMemo(() => {
        if (!shouldUseScrollSpacer) {
            const rawHeight = style?.height
            const hasExplicitHeight =
                typeof rawHeight === "number" ||
                (typeof rawHeight === "string" &&
                    /(px|%|vh|dvh|svh|lvh|vw|rem|em|calc\()/i.test(rawHeight))

            return {
                ...style,
                height: hasExplicitHeight ? style?.height : "100vh",
                minHeight: hasExplicitHeight
                    ? style?.minHeight || "auto"
                    : "100dvh",
                width: "100%",
                position: "relative" as const,
                display: "block",
            }
        }

        const {
            height: _height,
            minHeight: _minHeight,
            maxHeight: _maxHeight,
            overflow: _overflow,
            ...styleWithoutHeight
        } = style || {}

        return {
            ...styleWithoutHeight,
            height: calculatedHeight,
            minHeight: calculatedHeight,
            maxHeight: "none",
            overflow: "visible",
            width: "100%",
            position: "relative" as const,
            display: "block",
        }
    }, [shouldUseScrollSpacer, style, calculatedHeight])

    // ── Refs for stable callbacks ───────────────────────────────────────────
    const safeListRef = useRef(safeList)
    const scrollPerWordRef = useRef(scrollPerWord)
    const scrollUnitRef = useRef(scrollUnit)
    const buildParticlesRef = useRef<typeof buildParticles | null>(null)
    const explosionForceRef = useRef(explosionForce)
    const transitionDurationRef = useRef(transitionDuration)
    const momentumMultiplierRef = useRef(momentumMultiplier)

    safeListRef.current = safeList
    scrollPerWordRef.current = scrollPerWord
    scrollUnitRef.current = scrollUnit
    explosionForceRef.current = explosionForce
    transitionDurationRef.current = transitionDuration
    momentumMultiplierRef.current = momentumMultiplier

    const resolveScrollPx = useCallback(() => {
        if (scrollUnitRef.current === "vh")
            return (scrollPerWordRef.current / 100) * window.innerHeight
        return scrollPerWordRef.current
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        const updateViewportWidth = () => {
            startTransition(() => setViewportWidth(window.innerWidth))
        }
        updateViewportWidth()
        window.addEventListener("resize", updateViewportWidth)
        return () => window.removeEventListener("resize", updateViewportWidth)
    }, [])

    const sampleTextPixels = useCallback(
        (w: number, h: number, text: string): { x: number; y: number }[] => {
            const off = document.createElement("canvas")
            off.width = w
            off.height = h
            const ctx = off.getContext("2d")!
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = "#fff"
            ctx.font = `${fontWeight} ${effectiveFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
            ctx.letterSpacing = `${letterSpacing}px`
            ctx.textBaseline = "middle"

            const lines = text.split("\n")
            const lineH = effectiveFontSize * 1.3
            const totalH = lines.length * lineH

            lines.forEach((line, li) => {
                const m = ctx.measureText(line)
                let x =
                    textAlign === "center"
                        ? (w - m.width) / 2
                        : textAlign === "right"
                          ? w - m.width - 20
                          : 20
                const y = (h - totalH) / 2 + li * lineH + lineH / 2

                if (wordSpacing !== 0 && line.includes(" ")) {
                    let cx = x
                    line.split(" ").forEach((word, wi) => {
                        if (wi > 0) cx += wordSpacing
                        ctx.fillText(word, cx, y)
                        cx += ctx.measureText(word).width
                    })
                } else {
                    ctx.fillText(line, x, y)
                }
            })

            const img = ctx.getImageData(0, 0, w, h)
            const pixels: { x: number; y: number }[] = []
            const step = Math.max(1, particleDensity)
            for (let py = 0; py < h; py += step) {
                for (let px = 0; px < w; px += step) {
                    if (img.data[(py * w + px) * 4 + 3] > 128)
                        pixels.push({ x: px, y: py })
                }
            }
            return pixels
        },
        [
            effectiveFontSize,
            fontWeight,
            letterSpacing,
            wordSpacing,
            particleDensity,
            textAlign,
        ]
    )

    const buildParticles = useCallback(
        (
            w: number,
            h: number,
            entry: WordEntry,
            scatter = false
        ): Particle[] => {
            const pixels = sampleTextPixels(w, h, entry.text)
            return pixels.map(({ x, y }) => ({
                x: scatter ? Math.random() * w : x,
                y: scatter ? Math.random() * h : y,
                baseX: x,
                baseY: y,
                vx: scatter ? (Math.random() - 0.5) * 8 : 0,
                vy: scatter ? (Math.random() - 0.5) * 8 : 0,
                size: particleSize * (0.7 + Math.random() * 0.6),
                opacity: particleOpacity * (0.6 + Math.random() * 0.4),
                color: entry.color,
                life: Math.random() * 200,
            }))
        },
        [sampleTextPixels, particleSize, particleOpacity]
    )

    const buildAmbient = useCallback(
        (w: number, h: number): Particle[] =>
            Array.from({ length: ambientCount }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                baseX: 0,
                baseY: 0,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: 1 + Math.random() * 1.5,
                opacity: 0.1 + Math.random() * 0.3,
                color: ambientColor,
                life: Math.random() * 300,
            })),
        [ambientCount, ambientColor]
    )

    const transitionTo = useCallback((idx: number) => {
        const list = safeListRef.current
        if (!list[idx]) return
        if (idx === targetIndexRef.current) return

        targetIndexRef.current = idx

        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current)
            transitionTimerRef.current = null
        }

        transitioningRef.current = true
        const { w, h } = sizeRef.current

        explodedRef.current = true
        for (const p of particlesRef.current) {
            const angle = Math.random() * Math.PI * 2
            p.vx +=
                Math.cos(angle) *
                (2 + Math.random() * explosionForceRef.current)
            p.vy +=
                Math.sin(angle) *
                (2 + Math.random() * explosionForceRef.current)
        }

        const target = idx
        transitionTimerRef.current = setTimeout(() => {
            if (buildParticlesRef.current) {
                particlesRef.current = buildParticlesRef.current(
                    w,
                    h,
                    safeListRef.current[target],
                    true
                )
            }
            explodedRef.current = false
            currentIndexRef.current = target
            startTransition(() => setCurrentIndex(target))
            transitioningRef.current = false
            transitionTimerRef.current = null
        }, transitionDurationRef.current)
    }, [])

    // ── All effects bail out early when isStatic = true ─────────────────────

    useEffect(() => {
        if (!shouldUseScrollSpacer || typeof window === "undefined") {
            return
        }
        lastScrollRef.current = window.scrollY

        const onScroll = () => {
            if (!wrapperRef.current) return

            const currentScroll = window.scrollY
            const delta = currentScroll - lastScrollRef.current
            lastScrollRef.current = currentScroll

            const rect = wrapperRef.current.getBoundingClientRect()
            const scrollProgress = Math.max(0, -rect.top)
            const inView = rect.top < window.innerHeight && rect.bottom > 0

            if (
                scrollMomentum &&
                Math.abs(delta) > 0.5 &&
                !transitioningRef.current
            ) {
                if (inView) {
                    const force = delta * momentumMultiplierRef.current * 0.05
                    for (const p of particlesRef.current) {
                        p.vy -= force
                        p.vx += (Math.random() - 0.5) * Math.abs(force) * 0.5
                    }
                }
            }

            const list = safeListRef.current
            if (list.length <= 1) return

            const sectionPx = resolveScrollPx()
            const idx = Math.min(
                Math.floor(scrollProgress / sectionPx),
                list.length - 1
            )
            transitionTo(idx)
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        onScroll()
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [shouldUseScrollSpacer, scrollMomentum, transitionTo, resolveScrollPx])

    useEffect(() => {
        if (isStatic || !autoAnimate) return
        const tick = () => {
            explodedRef.current = true
            for (const p of particlesRef.current) {
                const angle = Math.random() * Math.PI * 2
                p.vx =
                    Math.cos(angle) *
                    (2 + Math.random() * explosionForceRef.current)
                p.vy =
                    Math.sin(angle) *
                    (2 + Math.random() * explosionForceRef.current)
            }
            autoTimerRef.current = setTimeout(() => {
                if (!scrollBased) {
                    const nextIdx =
                        (currentIndexRef.current + 1) %
                        safeListRef.current.length
                    targetIndexRef.current = nextIdx
                    currentIndexRef.current = nextIdx
                    startTransition(() => setCurrentIndex(nextIdx))
                    const { w, h } = sizeRef.current
                    if (buildParticlesRef.current) {
                        particlesRef.current = buildParticlesRef.current(
                            w,
                            h,
                            safeListRef.current[nextIdx],
                            true
                        )
                    }
                }
                explodedRef.current = false
                autoTimerRef.current = setTimeout(
                    tick,
                    autoAnimateInterval * 1000
                )
            }, transitionDurationRef.current)
        }
        autoTimerRef.current = setTimeout(tick, autoAnimateInterval * 1000)
        return () => {
            if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
        }
    }, [isStatic, autoAnimate, autoAnimateInterval, scrollBased])

    const stopAnimation = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
        }
        isAnimatingRef.current = false
    }, [])

    const animate = useCallback(() => {
        if (!isVisibleRef.current) {
            isAnimatingRef.current = false
            rafRef.current = 0
            return
        }

        const canvas = canvasRef.current
        if (!canvas) {
            isAnimatingRef.current = false
            rafRef.current = 0
            return
        }
        const ctx = canvas.getContext("2d")!
        frameRef.current++
        const { w, h } = sizeRef.current

        ctx.clearRect(0, 0, w, h)
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, w, h)

        const mx = mouseRef.current.x
        const my = mouseRef.current.y

        if (ambientParticles) {
            for (const p of ambientRef.current) {
                p.life++
                p.x += p.vx
                p.y += p.vy
                if (p.x < 0) p.x = w
                if (p.x > w) p.x = 0
                if (p.y < 0) p.y = h
                if (p.y > h) p.y = 0
                const pulse =
                    0.5 +
                    0.5 * Math.sin(frameRef.current * 0.02 + p.life * 0.01)
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.globalAlpha = p.opacity * pulse
                ctx.fill()
            }
        }

        for (const p of particlesRef.current) {
            p.life++

            const dx = mx - p.x
            const dy = my - p.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < mouseRadius && mouseInteraction !== "none") {
                const force = (mouseRadius - dist) / mouseRadius
                const angle = Math.atan2(dy, dx)
                const fx = Math.cos(angle) * force * mouseForce
                const fy = Math.sin(angle) * force * mouseForce
                if (mouseInteraction === "repel") {
                    p.vx -= fx
                    p.vy -= fy
                } else if (mouseInteraction === "attract") {
                    p.vx += fx
                    p.vy += fy
                } else if (
                    mouseInteraction === "click" &&
                    mouseRef.current.down
                ) {
                    p.vx -= fx * 2
                    p.vy -= fy * 2
                }
            }

            if (explodedRef.current) {
                p.vx *= 0.97
                p.vy *= 0.97
                p.x += p.vx
                p.y += p.vy
                if (p.x < -50) p.x = w + 50
                if (p.x > w + 50) p.x = -50
                if (p.y < -50) p.y = h + 50
                if (p.y > h + 50) p.y = -50
            } else {
                const bx = p.baseX,
                    by = p.baseY
                if (animationMode === "float") {
                    const t =
                        frameRef.current * 0.015 * floatSpeed + p.life * 0.005
                    p.vx +=
                        (bx + Math.sin(t) * floatAmplitude - p.x) * reformSpeed
                    p.vy +=
                        (by + Math.cos(t * 1.3) * floatAmplitude - p.y) *
                        reformSpeed
                } else if (animationMode === "wave") {
                    const wave =
                        Math.sin(
                            p.baseX * 0.02 +
                                frameRef.current * 0.03 * floatSpeed
                        ) *
                        floatAmplitude *
                        3
                    p.vx += (bx - p.x) * reformSpeed
                    p.vy += (by + wave - p.y) * reformSpeed
                } else if (animationMode === "pulse") {
                    const pulse =
                        1 + 0.1 * Math.sin(frameRef.current * 0.04 * floatSpeed)
                    const cx = w / 2,
                        cy = h / 2
                    p.vx += (cx + (bx - cx) * pulse - p.x) * reformSpeed
                    p.vy += (cy + (by - cy) * pulse - p.y) * reformSpeed
                } else if (animationMode === "scatter") {
                    const t = frameRef.current * 0.01 * floatSpeed
                    p.vx +=
                        (bx +
                            Math.sin(t + p.baseX * 0.01) * floatAmplitude * 2 -
                            p.x) *
                        reformSpeed
                    p.vy +=
                        (by +
                            Math.cos(t + p.baseY * 0.01) * floatAmplitude * 2 -
                            p.y) *
                        reformSpeed
                } else {
                    p.vx += (bx - p.x) * reformSpeed
                    p.vy += (by - p.y) * reformSpeed
                }
                p.vx *= 0.88
                p.vy *= 0.88
                p.x += p.vx
                p.y += p.vy
            }

            if (glowIntensity > 0) {
                ctx.save()
                ctx.shadowColor = p.color
                ctx.shadowBlur = glowIntensity
            }
            const lp = 0.8 + 0.2 * Math.sin(p.life * 0.05)
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * lp, 0, Math.PI * 2)
            ctx.fillStyle = p.color
            ctx.globalAlpha = p.opacity
            ctx.fill()
            if (glowIntensity > 0) ctx.restore()
        }

        ctx.globalAlpha = 1
        rafRef.current = requestAnimationFrame(animate)
    }, [
        backgroundColor,
        glowIntensity,
        mouseRadius,
        mouseForce,
        mouseInteraction,
        animationMode,
        floatSpeed,
        floatAmplitude,
        reformSpeed,
        ambientParticles,
    ])

    const startAnimation = useCallback(() => {
        if (isStatic || !isVisibleRef.current || isAnimatingRef.current) return
        isAnimatingRef.current = true
        rafRef.current = requestAnimationFrame(animate)
    }, [isStatic, animate])

    useEffect(() => {
        buildParticlesRef.current = buildParticles
    }, [buildParticles])

    useEffect(() => {
        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current)
            transitionTimerRef.current = null
        }
        transitioningRef.current = false
        if (currentIndexRef.current >= safeList.length) {
            const clamped = safeList.length - 1
            currentIndexRef.current = clamped
            targetIndexRef.current = clamped
            startTransition(() => setCurrentIndex(clamped))
        }
        const { w, h } = sizeRef.current
        if (w === 0 || h === 0) return
        const entry = safeList[currentIndexRef.current] || safeList[0]
        particlesRef.current = buildParticles(w, h, entry)
        explodedRef.current = false
    }, [safeList, buildParticles])

    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const obs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = Math.round(entry.contentRect.width) || 800
                const h = Math.round(entry.contentRect.height) || 500
                if (canvasRef.current) {
                    canvasRef.current.width = w
                    canvasRef.current.height = h
                }
                sizeRef.current = { w, h }
                const word =
                    safeListRef.current[currentIndexRef.current] ||
                    safeListRef.current[0]
                if (buildParticlesRef.current) {
                    particlesRef.current = buildParticlesRef.current(w, h, word)
                }
                ambientRef.current = buildAmbient(w, h)
                explodedRef.current = false
            }
        })
        obs.observe(el)
        return () => obs.disconnect()
    }, [isStatic, buildAmbient])

    useEffect(() => {
        if (isStatic) return
        const { w, h } = sizeRef.current
        if (w === 0 || h === 0) return
        const entry =
            safeListRef.current[currentIndexRef.current] ||
            safeListRef.current[0]
        particlesRef.current = buildParticles(w, h, entry)
        ambientRef.current = buildAmbient(w, h)
        explodedRef.current = false
    }, [
        isStatic,
        buildParticles,
        buildAmbient,
        fontSize,
        fontWeight,
        letterSpacing,
        wordSpacing,
        particleSize,
        particleDensity,
        particleOpacity,
        ambientCount,
        ambientColor,
        textAlign,
    ])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const target = wrapperRef.current
        if (!target) return

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                const visible = Boolean(entry?.isIntersecting)
                isVisibleRef.current = visible
                if (visible) {
                    startAnimation()
                } else {
                    stopAnimation()
                }
            },
            { root: null, rootMargin: "200px 0px", threshold: 0.01 }
        )

        observer.observe(target)
        startAnimation()

        return () => {
            observer.disconnect()
            stopAnimation()
        }
    }, [isStatic, startAnimation, stopAnimation])

    const onMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        mouseRef.current.x = e.clientX - rect.left
        mouseRef.current.y = e.clientY - rect.top
    }
    const onMouseLeave = () => {
        mouseRef.current.x = -9999
        mouseRef.current.y = -9999
        mouseRef.current.down = false
    }
    const onMouseDown = () => {
        mouseRef.current.down = true
        if (mouseInteraction === "explode") {
            explodedRef.current = !explodedRef.current
            if (explodedRef.current) {
                for (const p of particlesRef.current) {
                    const angle = Math.random() * Math.PI * 2
                    p.vx =
                        Math.cos(angle) * (2 + Math.random() * explosionForce)
                    p.vy =
                        Math.sin(angle) * (2 + Math.random() * explosionForce)
                }
            }
        }
    }
    const onMouseUp = () => {
        mouseRef.current.down = false
    }

    // ── Static renderer fallback (required by Framer Marketplace) ───────────
    if (isStatic) {
        const first = safeList[0]
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        textAlign === "left"
                            ? "flex-start"
                            : textAlign === "right"
                              ? "flex-end"
                              : "center",
                    padding: "0 40px",
                    boxSizing: "border-box",
                    ...style,
                }}
            >
                <span
                    style={{
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: effectiveFontSize,
                        fontWeight,
                        letterSpacing,
                        color: first.color,
                        textShadow:
                            glowIntensity > 0
                                ? `0 0 ${glowIntensity}px ${first.color}`
                                : "none",
                        whiteSpace: "pre-line",
                        textAlign:
                            textAlign as React.CSSProperties["textAlign"],
                    }}
                >
                    {first.text}
                </span>
            </div>
        )
    }

    // ── Live render ──────────────────────────────────────────────────────────
    return (
        <div ref={wrapperRef} style={wrapperStyle}>
            <div
                ref={containerRef}
                style={{
                    position: shouldUseScrollSpacer ? "sticky" : "relative",
                    top: shouldUseScrollSpacer ? 0 : undefined,
                    left: shouldUseScrollSpacer ? 0 : undefined,
                    width: "100%",
                    height: shouldUseScrollSpacer ? "100dvh" : "100%",
                    overflow: "visible",
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        cursor:
                            mouseInteraction !== "none"
                                ? "crosshair"
                                : "default",
                    }}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                />
            </div>
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(ParticleText, {
    wordList: {
        type: ControlType.Array,
        title: "Words",
        defaultValue: [
            { text: "HELLO", color: "#ff5800" },
            { text: "WORLD", color: "#00aaff" },
            { text: "FRAMER", color: "#9b5de5" },
        ],
        control: {
            type: ControlType.Object,
            title: "Word",
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "HELLO",
                    displayTextArea: true,
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#ff5800",
                },
            },
        },
    },

    scrollBased: {
        type: ControlType.Boolean,
        title: "Auto Pin Spacer",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Automatically makes component tall and pins the canvas while scrolling. Set the Component Height to 'Fit Content' in Framer.",
    },
    scrollMomentum: {
        type: ControlType.Boolean,
        title: "Scroll Jolt",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.scrollBased,
        description: "Adds velocity to particles when scrolling quickly.",
    },
    momentumMultiplier: {
        type: ControlType.Number,
        title: "Jolt Force",
        defaultValue: 0.5,
        min: 0.1,
        max: 5,
        step: 0.1,
        hidden: (p) => !p.scrollBased || !p.scrollMomentum,
    },
    scrollPerWord: {
        type: ControlType.Number,
        title: "Scroll / Word",
        defaultValue: 100,
        min: 10,
        max: 500,
        step: 10,
        hidden: (p) => !p.scrollBased,
    },
    scrollUnit: {
        type: ControlType.SegmentedEnum,
        title: "Unit",
        defaultValue: "vh",
        options: ["vh", "px"],
        optionTitles: ["vh", "px"],
        hidden: (p) => !p.scrollBased,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition",
        defaultValue: 800,
        min: 200,
        max: 3000,
        step: 100,
        unit: "ms",
    },

    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 172,
        min: 10,
        max: 300,
        step: 1,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        defaultValue: "900",
        options: ["100", "300", "400", "600", "700", "800", "900"],
        optionTitles: [
            "Thin",
            "Light",
            "Regular",
            "SemiBold",
            "Bold",
            "ExtraBold",
            "Black",
        ],
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 2,
        min: -20,
        max: 50,
        step: 0.5,
        unit: "px",
    },
    wordSpacing: {
        type: ControlType.Number,
        title: "Word Spacing",
        defaultValue: 30,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    textAlign: {
        type: ControlType.SegmentedEnum,
        title: "Align",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
    },

    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 3,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    particleDensity: {
        type: ControlType.Number,
        title: "Density (gap)",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
    },
    particleOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 15,
        min: 0,
        max: 60,
        step: 1,
    },

    animationMode: {
        type: ControlType.Enum,
        title: "Animation",
        defaultValue: "float",
        options: ["static", "float", "wave", "pulse", "scatter"],
        optionTitles: ["Static", "Float", "Wave", "Pulse", "Scatter"],
    },
    floatSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    floatAmplitude: {
        type: ControlType.Number,
        title: "Amplitude",
        defaultValue: 3,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "px",
    },
    reformSpeed: {
        type: ControlType.Number,
        title: "Reform Speed",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.5,
        step: 0.01,
    },
    explosionForce: {
        type: ControlType.Number,
        title: "Explosion Force",
        defaultValue: 8,
        min: 1,
        max: 30,
        step: 0.5,
    },
    autoAnimate: {
        type: ControlType.Boolean,
        title: "Auto Explode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoAnimateInterval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 3,
        min: 0.5,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (p) => !p.autoAnimate,
    },

    mouseInteraction: {
        type: ControlType.Enum,
        title: "Mouse Mode",
        defaultValue: "repel",
        options: ["none", "repel", "attract", "click", "explode"],
        optionTitles: [
            "None",
            "Repel",
            "Attract",
            "Click Repel",
            "Click Explode",
        ],
    },
    mouseRadius: {
        type: ControlType.Number,
        title: "Mouse Radius",
        defaultValue: 80,
        min: 10,
        max: 300,
        step: 5,
        unit: "px",
        hidden: (p) => p.mouseInteraction === "none",
    },
    mouseForce: {
        type: ControlType.Number,
        title: "Mouse Force",
        defaultValue: 6,
        min: 0.5,
        max: 30,
        step: 0.5,
        hidden: (p) => p.mouseInteraction === "none",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    ambientParticles: {
        type: ControlType.Boolean,
        title: "Ambient Dots",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    ambientCount: {
        type: ControlType.Number,
        title: "Ambient Count",
        defaultValue: 30,
        min: 0,
        max: 200,
        step: 5,
        hidden: (p) => !p.ambientParticles,
    },
    ambientColor: {
        type: ControlType.Color,
        title: "Ambient Color",
        defaultValue: "#ff5800",
        hidden: (p) => !p.ambientParticles,
    },
})
