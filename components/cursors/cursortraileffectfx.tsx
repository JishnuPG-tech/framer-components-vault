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


// ── Constants ──────────────────────────────────────────────────────────────
const TRAIL_IMAGES = [
    "https://i.ibb.co.com/Cs8cwFTP/Serene-Portrait-Outdoors.png",
    "https://i.ibb.co.com/0yWZKcM6/Smiling-Man-Portrait.png",
    "https://i.ibb.co.com/2YvKtrYg/visualelectric-1759560765488.png",
    "https://i.ibb.co.com/Z6bz0qss/visualelectric-1759560770609.png",
    "https://i.ibb.co.com/Y4pb4Bbx/visualelectric-1760165065844.jpg",
    "https://i.ibb.co.com/PsL75TgK/visualelectric-1760165086031.png",
    "https://i.ibb.co.com/ZR4SyfRB/Woman-in-Green-Jacket.png",
    "https://i.ibb.co.com/kgQhD7QS/visualelectric-1771663523750.png",
    "https://i.ibb.co.com/NnSzLT32/Joyful-Portrait-Outdoors.png",
    "https://i.ibb.co.com/mCCVNWQc/Man-Relaxing-Outdoors.png",
    "https://i.ibb.co.com/whtHQDTQ/Playful-Starry-Portrait.png",
    "https://i.ibb.co.com/HTSTYBCt/Neutral-Portrait.png",
    "https://i.ibb.co.com/G4KFgXJC/Futuristic-Portrait.png",
    "https://i.ibb.co.com/DDg9CmcY/Cheerful-Sunglasses-Portrait.png",
]

const EFFECTS = [
    { id: "flame", label: "Flame" },
    { id: "venetian", label: "Venetian" },
    { id: "curtain", label: "Curtain" },
    { id: "hexagon", label: "Hexagon" },
    { id: "liquid", label: "Liquid" },
    { id: "zoomsplit", label: "Zoom Split" },
]

// ── Pattern factory ────────────────────────────────────────────────────────
function makePatterns(inDur: number, easScale: string, easReveal: string) {
    const makeBg = (src: string) => {
        const el = document.createElement("div")
        el.style.position = "absolute"
        el.style.top = "0"
        el.style.left = "0"
        el.style.width = "100%"
        el.style.height = "100%"
        el.style.backgroundImage = `url(${src})`
        el.style.backgroundSize = "cover"
        el.style.backgroundPosition = "center"
        return el
    }

    return {
        flame: {
            create(src: string, size: number) {
                const img = document.createElement("img") as HTMLImageElement
                img.src = src
                img.style.position = "absolute"
                img.style.objectFit = "cover"
                img.style.transformOrigin = "center"
                img.style.pointerEvents = "none"
                img.style.willChange = "transform"
                img.style.zIndex = "12"
                img.style.width = `${size}px`
                img.style.height = `${size}px`
                return [
                    {
                        element: img,
                        index: 0,
                        reveal: () => {},
                        collapse: () => {},
                    },
                ]
            },
            revealTiming: () => 0,
            collapseTiming: () => 0,
        },
        venetian: {
            create(src: string) {
                const count = 12
                const sh = 100 / count
                return Array.from({ length: count }, (_, i) => {
                    const frag = document.createElement("div")
                    frag.appendChild(makeBg(src))
                    const y = i * sh
                    frag.style.position = "absolute"
                    frag.style.top = "0"
                    frag.style.left = "0"
                    frag.style.width = "100%"
                    frag.style.height = "100%"
                    frag.style.overflow = "hidden"
                    frag.style.willChange = "transform"
                    frag.style.backfaceVisibility = "hidden"
                    frag.style.transform = "translate3d(0,0,0) rotateX(90deg)"
                    frag.style.transformOrigin = `50% ${y + sh / 2}%`
                    frag.style.clipPath = `polygon(0% ${y}%,100% ${y}%,100% ${y + sh}%,0% ${y + sh}%)`
                    frag.style.transition = `transform ${inDur}ms ${easReveal}`
                    return {
                        element: frag,
                        index: i,
                        reveal: () => {
                            frag.style.transform =
                                "translate3d(0,0,0) rotateX(0deg)"
                        },
                        collapse: () => {
                            frag.style.transform =
                                "translate3d(0,0,0) rotateX(-90deg)"
                        },
                    }
                })
            },
            revealTiming: (i: number, t: number) => Math.abs(i - t / 2) * 0.08,
            collapseTiming: (i: number) => i * 0.04,
        },
        curtain: {
            create(src: string) {
                const count = 10
                return Array.from({ length: count }, (_, i) => {
                    const frag = document.createElement("div")
                    frag.appendChild(makeBg(src))
                    const x = (i / count) * 100
                    const w = 100 / count
                    frag.style.position = "absolute"
                    frag.style.top = "0"
                    frag.style.left = "0"
                    frag.style.width = "100%"
                    frag.style.height = "100%"
                    frag.style.overflow = "hidden"
                    frag.style.willChange = "clip-path"
                    frag.style.clipPath = `polygon(${x + w / 2}% 0%,${x + w / 2}% 0%,${x + w / 2}% 100%,${x + w / 2}% 100%)`
                    frag.style.transition = `clip-path ${inDur}ms ${easReveal}`
                    return {
                        element: frag,
                        index: i,
                        reveal: () => {
                            frag.style.clipPath = `polygon(${x}% 0%,${x + w}% 0%,${x + w}% 100%,${x}% 100%)`
                        },
                        collapse: () => {
                            frag.style.clipPath = `polygon(${x + w / 2}% 0%,${x + w / 2}% 0%,${x + w / 2}% 100%,${x + w / 2}% 100%)`
                        },
                    }
                })
            },
            revealTiming: (i: number, t: number) => (i / t) * 0.6,
            collapseTiming: (i: number, t: number) => ((t - 1 - i) / t) * 0.3,
        },
        hexagon: {
            create(src: string) {
                const defs = [
                    { x: 50, y: 50, s: 20 },
                    { x: 25, y: 25, s: 15 },
                    { x: 75, y: 25, s: 15 },
                    { x: 85, y: 50, s: 15 },
                    { x: 75, y: 75, s: 15 },
                    { x: 25, y: 75, s: 15 },
                    { x: 15, y: 50, s: 15 },
                ]
                return defs.map(({ x, y, s }, i) => {
                    const frag = document.createElement("div")
                    frag.appendChild(makeBg(src))
                    const hex = `polygon(${x - s * 0.5}% ${y - s * 0.87}%,${x + s * 0.5}% ${y - s * 0.87}%,${x + s}% ${y}%,${x + s * 0.5}% ${y + s * 0.87}%,${x - s * 0.5}% ${y + s * 0.87}%,${x - s}% ${y}%)`
                    frag.style.position = "absolute"
                    frag.style.top = "0"
                    frag.style.left = "0"
                    frag.style.width = "100%"
                    frag.style.height = "100%"
                    frag.style.overflow = "hidden"
                    frag.style.willChange = "clip-path"
                    frag.style.clipPath = `polygon(${x}% ${y}%,${x}% ${y}%,${x}% ${y}%)`
                    frag.style.transition = `clip-path ${inDur}ms ${easReveal}`
                    return {
                        element: frag,
                        index: i,
                        reveal: () => {
                            frag.style.clipPath = hex
                        },
                        collapse: () => {
                            frag.style.clipPath = `polygon(${x}% ${y}%,${x}% ${y}%,${x}% ${y}%)`
                        },
                    }
                })
            },
            revealTiming: (i: number) => (i === 0 ? 0 : 0.2 + (i - 1) * 0.06),
            collapseTiming: (i: number) => (i === 0 ? 0.3 : (i - 1) * 0.04),
        },
        liquid: {
            create(src: string) {
                const positions = [
                    { x: 25, y: 20, r: 16 },
                    { x: 70, y: 15, r: 12 },
                    { x: 45, y: 35, r: 18 },
                    { x: 15, y: 55, r: 14 },
                    { x: 80, y: 45, r: 15 },
                    { x: 55, y: 70, r: 20 },
                    { x: 30, y: 80, r: 13 },
                    { x: 75, y: 75, r: 17 },
                ]
                return positions.map(({ x, y, r }, i) => {
                    const frag = document.createElement("div")
                    frag.appendChild(makeBg(src))
                    frag.style.position = "absolute"
                    frag.style.top = "0"
                    frag.style.left = "0"
                    frag.style.width = "100%"
                    frag.style.height = "100%"
                    frag.style.overflow = "hidden"
                    frag.style.willChange = "clip-path"
                    frag.style.clipPath = `circle(0% at ${x}% ${y}%)`
                    frag.style.transition = `clip-path ${inDur}ms ${easReveal}`
                    return {
                        element: frag,
                        index: i,
                        reveal: () => {
                            frag.style.clipPath = `circle(${r}% at ${x}% ${y}%)`
                        },
                        collapse: () => {
                            frag.style.clipPath = `circle(0% at ${x}% ${y}%)`
                        },
                    }
                })
            },
            revealTiming: (i: number, t: number) => (i / t) * 0.4,
            collapseTiming: (i: number, t: number) => ((t - 1 - i) / t) * 0.25,
        },
        zoomsplit: {
            create(src: string) {
                const g = 3
                const frags: any[] = []
                for (let row = 0; row < g; row++) {
                    for (let col = 0; col < g; col++) {
                        const frag = document.createElement("div")
                        frag.appendChild(makeBg(src))
                        const x = (col / g) * 100,
                            y = (row / g) * 100
                        const w = 100 / g,
                            h = 100 / g
                        const cx = x + w / 2,
                            cy = y + h / 2
                        frag.style.position = "absolute"
                        frag.style.top = "0"
                        frag.style.left = "0"
                        frag.style.width = "100%"
                        frag.style.height = "100%"
                        frag.style.overflow = "hidden"
                        frag.style.willChange = "clip-path"
                        frag.style.clipPath = `polygon(${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%)`
                        frag.style.transition = `clip-path ${inDur}ms ${easScale}`
                        frags.push({
                            element: frag,
                            index: row * g + col,
                            reveal: () => {
                                frag.style.clipPath = `polygon(${x}% ${y}%,${x + w}% ${y}%,${x + w}% ${y + h}%,${x}% ${y + h}%)`
                            },
                            collapse: () => {
                                frag.style.clipPath = `polygon(${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%)`
                            },
                        })
                    }
                }
                return frags
            },
            revealTiming: (i: number, t: number) => {
                const g = Math.sqrt(t)
                return (
                    Math.hypot(
                        (i % g) - (g - 1) / 2,
                        Math.floor(i / g) - (g - 1) / 2
                    ) * 0.15
                )
            },
            collapseTiming: (i: number, t: number) => {
                const g = Math.sqrt(t)
                return (
                    Math.hypot(
                        (i % g) - (g - 1) / 2,
                        Math.floor(i / g) - (g - 1) / 2
                    ) * 0.08
                )
            },
        },
    }
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function CursorTrailEffect(props: any) {
    const {
        defaultEffect = "flame",
        minImageSize = 160,
        maxImageSize = 340,
        imageLifespan = 600,
        titleText = "FLAME",
        titleColor = "#ffffff",
        titleFont,
        trailImages,
        showModeOptions = true,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const [activeEffect, setActiveEffect] =
        React.useState<string>(defaultEffect)

    // Ref so the RAF closure always reads the latest active effect
    const effectRef = React.useRef(activeEffect)
    React.useEffect(() => {
        effectRef.current = activeEffect
    }, [activeEffect])

    // Ref so the RAF closure always reads the latest image list
    const imagesRef = React.useRef<string[]>(TRAIL_IMAGES)
    React.useEffect(() => {
        imagesRef.current =
            trailImages && trailImages.length > 0 ? trailImages : TRAIL_IMAGES
    }, [trailImages])

    // Sync prop → state (allows Framer property panel to drive it)
    React.useEffect(() => {
        setActiveEffect(defaultEffect)
    }, [defaultEffect])

    // ── Trail interaction ────────────────────────────────────────────────
    React.useEffect(() => {
        const container = containerRef.current
        if (!container || RenderTarget.current() === RenderTarget.canvas) return

        const cfg = {
            inDur: 600,
            outDur: 800,
            stagger: 50,
            mouseThresh: 40,
            minMove: 5,
            touchInterval: 40,
            speedSmooth: 0.25,
            inEase: "cubic-bezier(.07,.5,.5,1)",
            outEase: "cubic-bezier(.87,0,.13,1)",
            easScale: "cubic-bezier(0.34,1.56,0.64,1)",
            easReveal: "cubic-bezier(0.87,0,0.13,1)",
        }

        const PATTERNS = makePatterns(cfg.inDur, cfg.easScale, cfg.easReveal)

        // Mutable loop state — plain vars for perf (no re-render needed)
        const trail: any[] = []
        const pool: HTMLElement[] = []
        let mx = 0,
            my = 0,
            lx = 0,
            ly = 0,
            px = 0,
            py = 0
        let isMoving = false,
            isTouching = false,
            inCont = false
        let lastRemove = 0,
            lastTouch = 0,
            lastMoveTime = Date.now()
        let smoothSpeed = 0,
            maxSpeed = 0,
            imgIdx = 0
        let rafId: number
        let moveTO: ReturnType<typeof setTimeout>

        const inBounds = (x: number, y: number) => {
            const r = container.getBoundingClientRect()
            return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
        }
        const movedEnough = () => Math.hypot(mx - lx, my - ly) > cfg.mouseThresh
        const movedAtAll = () => Math.hypot(mx - px, my - py) > cfg.minMove

        const calcSpeed = () => {
            const now = Date.now(),
                dt = now - lastMoveTime
            if (dt <= 0) return 0
            const raw = Math.hypot(mx - px, my - py) / dt
            if (raw > maxSpeed) maxSpeed = raw
            smoothSpeed =
                smoothSpeed * (1 - cfg.speedSmooth) +
                Math.min(raw / (maxSpeed || 0.5), 1) * cfg.speedSmooth
            lastMoveTime = now
            return smoothSpeed
        }

        // Wrapper element pool
        const getWrap = (): HTMLElement => {
            if (pool.length) return pool.pop()!
            const el = document.createElement("div")
            el.style.position = "absolute"
            el.style.overflow = "hidden"
            el.style.willChange = "transform"
            el.style.transformOrigin = "center"
            el.style.backfaceVisibility = "hidden"
            el.style.zIndex = "12"
            return el
        }
        const clearChildren = (el: HTMLElement) => {
            while (el.firstChild) el.removeChild(el.firstChild)
        }
        const recycle = (el: HTMLElement) => {
            el.parentNode?.removeChild(el)
            clearChildren(el)
            el.removeAttribute("style")
            el.style.position = "absolute"
            el.style.overflow = "hidden"
            el.style.willChange = "transform"
            el.style.transformOrigin = "center"
            el.style.backfaceVisibility = "hidden"
            el.style.zIndex = "12"
            if (pool.length < 20) pool.push(el)
        }

        const spawnImage = (speed = 0.5) => {
            const imgs = imagesRef.current
            const src = imgs[imgIdx]
            imgIdx = (imgIdx + 1) % imgs.length
            const size = minImageSize + (maxImageSize - minImageSize) * speed
            const eff = effectRef.current as keyof typeof PATTERNS
            const pat = PATTERNS[eff]
            const rect = container.getBoundingClientRect()
            const x = mx - rect.left
            const y = my - rect.top

            if (eff === "flame") {
                const img = document.createElement("img") as HTMLImageElement
                const rot = (Math.random() - 0.5) * 30 * (1 + speed * 2)
                img.src = src
                img.style.position = "absolute"
                img.style.objectFit = "cover"
                img.style.transformOrigin = "center"
                img.style.pointerEvents = "none"
                img.style.willChange = "transform"
                img.style.zIndex = "12"
                img.style.width = `${size}px`
                img.style.height = `${size}px`
                img.style.left = `${x}px`
                img.style.top = `${y}px`
                img.style.transform = `translate(-50%,-50%) rotate(${rot}deg) scale(0)`
                img.style.transition = `transform ${cfg.inDur}ms ${cfg.inEase}`
                container.appendChild(img)
                setTimeout(() => {
                    img.style.transform = `translate(-50%,-50%) rotate(${rot}deg) scale(1)`
                }, 10)
                trail.push({
                    element: img,
                    rotation: rot,
                    removeTime: Date.now() + imageLifespan,
                    isFlame: true,
                })
            } else {
                const wrap = getWrap()
                wrap.style.left = `${x}px`
                wrap.style.top = `${y}px`
                wrap.style.width = `${size}px`
                wrap.style.height = `${size}px`
                wrap.style.transform = "translate3d(-50%,-50%,0) scale(0)"
                wrap.style.transition = `transform ${cfg.inDur}ms ${cfg.easScale}`
                const frags = pat.create(src, size)
                frags.forEach((f: any) => wrap.appendChild(f.element))
                container.appendChild(wrap)
                requestAnimationFrame(() => {
                    wrap.style.transform = "translate3d(-50%,-50%,0) scale(1)"
                    frags.forEach((f: any) => {
                        setTimeout(
                            () => f.reveal(),
                            pat.revealTiming(f.index, frags.length) *
                                cfg.stagger
                        )
                    })
                })
                trail.push({
                    element: wrap,
                    fragments: frags,
                    pattern: eff,
                    removeTime: Date.now() + imageLifespan,
                })
            }
        }

        const trySpawn = () => {
            if (!inCont) return
            if ((isMoving || isTouching) && movedEnough() && movedAtAll()) {
                lx = mx
                ly = my
                spawnImage(calcSpeed())
                px = mx
                py = my
            }
        }

        const cleanOld = () => {
            const now = Date.now()
            if (
                now - lastRemove < 16 ||
                !trail.length ||
                now < trail[0].removeTime
            )
                return
            const obj = trail.shift()!
            if (obj.isFlame) {
                obj.element.style.transition = `transform ${cfg.outDur}ms ${cfg.outEase}`
                obj.element.style.transform = `translate(-50%,-50%) rotate(${obj.rotation + 360}deg) scale(0)`
                setTimeout(() => obj.element.remove(), cfg.outDur)
            } else {
                const { element, fragments, pattern: p } = obj
                const pat = PATTERNS[p as keyof typeof PATTERNS]
                fragments?.forEach((f: any) => {
                    setTimeout(
                        () => f.collapse(),
                        pat.collapseTiming(f.index, fragments.length) *
                            cfg.stagger
                    )
                })
                element.style.transition = `transform ${cfg.outDur}ms ${cfg.outEase}`
                element.style.transform = "translate3d(-50%,-50%,0) scale(0)"
                setTimeout(() => recycle(element), cfg.outDur)
            }
            lastRemove = now
        }

        // ── Event handlers ────────────────────────────────────────────────
        const onMouseMove = (e: MouseEvent) => {
            px = mx
            py = my
            mx = e.clientX
            my = e.clientY
            inCont = inBounds(mx, my)
            if (inCont && movedAtAll()) {
                isMoving = true
                clearTimeout(moveTO)
                moveTO = setTimeout(() => {
                    isMoving = false
                }, 100)
            }
        }

        const onTouchStart = (e: TouchEvent) => {
            const t = e.touches[0]
            px = mx
            py = my
            mx = t.clientX
            my = t.clientY
            lx = mx
            ly = my
            inCont = true
            isTouching = true
            lastMoveTime = Date.now()
        }

        const onTouchMove = (e: TouchEvent) => {
            const t = e.touches[0]
            const dx = Math.abs(t.clientX - px),
                dy = Math.abs(t.clientY - py)
            px = mx
            py = my
            mx = t.clientX
            my = t.clientY
            inCont = true
            if (dy > dx) return
            const now = Date.now()
            if (now - lastTouch < cfg.touchInterval) return
            lastTouch = now
            if (movedAtAll()) {
                spawnImage(calcSpeed())
                px = mx
                py = my
            }
        }

        const onTouchEnd = () => {
            isTouching = false
        }
        const onDocTouch = (e: TouchEvent) => {
            const t = e.touches[0]
            if (!inBounds(t.clientX, t.clientY)) {
                inCont = false
                isTouching = false
            }
        }

        const loop = () => {
            if (isMoving || isTouching) trySpawn()
            cleanOld()
            rafId = requestAnimationFrame(loop)
        }

        document.addEventListener("mousemove", onMouseMove)
        container.addEventListener("touchstart", onTouchStart, {
            passive: true,
        })
        container.addEventListener("touchmove", onTouchMove, { passive: true })
        container.addEventListener("touchend", onTouchEnd)
        document.addEventListener("touchstart", onDocTouch, { passive: true })
        rafId = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(rafId)
            clearTimeout(moveTO)
            document.removeEventListener("mousemove", onMouseMove)
            container.removeEventListener("touchstart", onTouchStart)
            container.removeEventListener("touchmove", onTouchMove)
            container.removeEventListener("touchend", onTouchEnd)
            document.removeEventListener("touchstart", onDocTouch)
            trail.forEach((o) => o.element?.parentNode?.removeChild(o.element))
        }
    }, [minImageSize, maxImageSize, imageLifespan])

    // ── Canvas placeholder ─────────────────────────────────────────────────
    if (RenderTarget.current() === RenderTarget.canvas) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    overflow: "hidden",
                    background:
                        "linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#0a0a0a 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        pointerEvents: "none",
                        textAlign: "center",
                        userSelect: "none",
                        ...titleFont,
                        color: titleColor,
                    }}
                >
                    {titleText}
                </div>
            </div>
        )
    }

    // ── Live render ────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background:
                    "linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#0a0a0a 100%)",
            }}
        >
            {/* Noise texture */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    backgroundImage:
                        "url(https://assets.codepen.io/7558/noise-002.png)",
                    backgroundRepeat: "repeat",
                    backgroundSize: "200px 200px",
                    opacity: 0.05,
                    pointerEvents: "none",
                    zIndex: 9999,
                    mixBlendMode: "screen",
                }}
            />

            {/* ── Title — characters with alternating z-indexes for depth layering.    */}
            {/* The wrapper uses position:absolute with NO z-index and NO transform,     */}
            {/* so it does NOT create a stacking context. Each character span with       */}
            {/* position:relative + z-index participates in the same stacking context    */}
            {/* as the trail images (z-index 12). Even-indexed chars (0,2,4… = 1st,3rd, */}
            {/* 5th) get z-index 13 (above trail); odd-indexed get z-index 11 (below).   */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        ...titleFont,
                        color: titleColor,
                    }}
                >
                    {titleText.split("").map((char, i) => (
                        <span
                            key={i}
                            style={{
                                position: "relative",
                                zIndex: i % 2 === 0 ? 13 : 11,
                                color: titleColor,
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Effect selector — bottom center, horizontal ────────────── */}
            {showModeOptions && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 32,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 28,
                        zIndex: 100,
                    }}
                >
                    {EFFECTS.map(({ id, label }) => (
                        <span
                            key={id}
                            onClick={() => setActiveEffect(id)}
                            style={{
                                cursor: "pointer",
                                color: "#fff",
                                fontFamily: "monospace",
                                fontSize: 10,
                                textTransform: "uppercase",
                                userSelect: "none",
                                letterSpacing: "0.08em",
                                opacity: activeEffect === id ? 1 : 0.4,
                                borderBottom:
                                    activeEffect === id
                                        ? "1px solid rgba(255,255,255,0.8)"
                                        : "1px solid transparent",
                                paddingBottom: 2,
                                transition: "opacity 0.2s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

CursorTrailEffect.defaultProps = {
    defaultEffect: "flame",
    minImageSize: 160,
    maxImageSize: 340,
    imageLifespan: 600,
    titleText: "FRAMER",
    titleColor: "#ffffff",
    trailImages: [],
    showModeOptions: true,
    // titleFont intentionally omitted — ControlType.Font defaultValue handles it
}

addPropertyControls(CursorTrailEffect, {
    // ── Title ──────────────────────────────────────────────────────────────
    titleText: {
        title: "Title",
        type: ControlType.String,
        defaultValue: "FRAMER",
        placeholder: "Enter title…",
    },
    titleFont: {
        title: "Font",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "245px",
            fontWeight: 900,
            letterSpacing: "0.08em",
            lineHeight: "1",
        },
    },
    titleColor: {
        title: "Color",
        type: ControlType.Color,
        defaultValue: "#ffffff",
    },
    // ── Trail images ──────────────────────────────────────────────────────
    trailImages: {
        title: "Images",
        type: ControlType.Array,
        control: { type: ControlType.Image },
        description:
            "Upload trail images. Leave empty to use the default orange blur set.",
    },
    // ── Trail ─────────────────────────────────────────────────────────────
    defaultEffect: {
        title: "Effect",
        type: ControlType.Enum,
        options: [
            "flame",
            "venetian",
            "curtain",
            "hexagon",
            "liquid",
            "zoomsplit",
        ],
        optionTitles: [
            "Flame",
            "Venetian",
            "Curtain",
            "Hexagon",
            "Liquid",
            "Zoom Split",
        ],
        defaultValue: "flame",
    },
    minImageSize: {
        title: "Min Image",
        type: ControlType.Number,
        defaultValue: 160,
        min: 60,
        max: 300,
        step: 10,
        unit: "px",
    },
    maxImageSize: {
        title: "Max Image",
        type: ControlType.Number,
        defaultValue: 340,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
    },
    imageLifespan: {
        title: "Lifespan",
        type: ControlType.Number,
        defaultValue: 600,
        min: 200,
        max: 3000,
        step: 100,
        unit: "ms",
        description: "How long each trail image stays visible",
    },
    showModeOptions: {
        title: "Show Modes",
        type: ControlType.Boolean,
        defaultValue: true,
        description: "Show effect selector at bottom of component",
    },
})
