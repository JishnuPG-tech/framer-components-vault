import {
    useCallback,
    useEffect,
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

import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    animate,
    AnimatePresence,
} from "framer-motion"

// ---------------------------------------------------------------------------
// Helpers (ported from the original Codrops demo)
// ---------------------------------------------------------------------------

const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz.:,^".split("")

const getRandomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

// Equation of a line (y = mx + b) — used for the reveal stagger.
const lineEq = (
    y2: number,
    y1: number,
    x2: number,
    x1: number,
    currentVal: number
) => {
    const m = (y2 - y1) / (x2 - x1)
    const b = y1 - m * x1
    return m * currentVal + b
}

const EASE_INOUT: [number, number, number, number] = [0.77, 0, 0.175, 1]

interface SlideData {
    image?: { src: string; srcSet?: string; alt?: string }
    title?: string
    paragraph?: string
    sideText?: string
    link?: string
}

interface DiagonalSlideshowProps {
    slides?: SlideData[]
    backgroundColor?: string
    textColor?: string
    sideTextColor?: string
    titleFont?: CSSProperties
    paragraphFont?: CSSProperties
    paragraphMaxWidth?: number
    sideFont?: CSSProperties
    arrowColor?: string
    slideWidth?: number
    slideHeight?: number
    sidePeek?: number
    slideRadius?: string
    duration?: number
    navStyle?: "classic" | "directional"
    infiniteLoop?: boolean
    loopCount?: number
    enableTilt?: boolean
    enableScramble?: boolean
    textBlend?: boolean
    showDeco?: boolean
    decoColor?: string
    showNavArrows?: boolean
    enableCursor?: boolean
    cursorText?: string
    scrollReveal?: boolean
    revealDelay?: number
    cursorColor?: string
    cursorTextColor?: string
    cursorSize?: number
    style?: CSSProperties
}

// Neutral inline-SVG placeholders — no external image dependency.
const makePlaceholder = (label: string) =>
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>` +
            `<rect width='800' height='1000' fill='#E5E5E5'/>` +
            `<g stroke='#A3A3A3' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'>` +
            `<rect x='280' y='390' width='240' height='180' rx='10'/>` +
            `<circle cx='348' cy='448' r='18'/>` +
            `<path d='M304 546 L388 462 L436 510 L470 476 L496 502 L496 546 Z' fill='#C9C9C9' stroke='none'/>` +
            `</g>` +
            `<text x='400' y='630' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='26' letter-spacing='6' fill='#9E9E9E'>${label}</text>` +
            `</svg>`
    )

const FALLBACK_IMAGES = [
    makePlaceholder("SLIDE 1"),
    makePlaceholder("SLIDE 2"),
    makePlaceholder("SLIDE 3"),
    makePlaceholder("SLIDE 4"),
]

// ---------------------------------------------------------------------------
// Scrambling text — recreates the charming.js + randomizeLetters effect
// ---------------------------------------------------------------------------

function ScrambleText(props: {
    text: string
    animateIn: boolean
    style?: CSSProperties
}) {
    const { text, animateIn, style } = props
    const chars = useMemo(() => Array.from(text), [text])
    const spansRef = useRef<(HTMLSpanElement | null)[]>([])

    useEffect(() => {
        if (!animateIn || typeof window === "undefined") return
        const reveals: number[] = []
        const loops: number[] = []
        const order = chars.map((_, i) => i).sort(() => 0.5 - Math.random())
        const stagger = Math.max(18, lineEq(40, 0, 8, 200, chars.length))
        order.forEach((idx, pos) => {
            const el = spansRef.current[idx]
            if (!el || chars[idx] === " ") return
            const loop = () => {
                el.textContent =
                    SCRAMBLE_CHARS[getRandomInt(0, SCRAMBLE_CHARS.length - 1)]
                loops[idx] = window.setTimeout(loop, getRandomInt(50, 500))
            }
            loop()
            reveals.push(
                window.setTimeout(() => {
                    window.clearTimeout(loops[idx])
                    el.textContent = chars[idx]
                    el.style.opacity = "1"
                }, pos * stagger)
            )
        })
        return () => {
            reveals.forEach((t) => window.clearTimeout(t))
            loops.forEach((t) => window.clearTimeout(t))
            // Restore the real characters if interrupted mid-scramble.
            chars.forEach((c, i) => {
                const el = spansRef.current[i]
                if (el) {
                    el.textContent = c === " " ? " " : c
                    el.style.opacity = "1"
                }
            })
        }
    }, [animateIn, chars])

    return (
        <span style={style} aria-label={text}>
            {chars.map((c, i) => (
                <span
                    key={i}
                    ref={(el) => {
                        spansRef.current[i] = el
                    }}
                    style={{ display: "inline-block" }}
                >
                    {c === " " ? " " : c}
                </span>
            ))}
        </span>
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Diagonal Slideshow
 *
 * A recreation of the Codrops-style "diagonal slideshow" (CodePen KKGJpyV):
 * previous slide peeks from the top-left, next from the bottom-right.
 * The centered slide tilts in 3D on mouse move, titles animate in with a
 * letter-scramble effect, and clicking the current slide opens a content
 * panel while the deco frame expands to fill the view.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DiagonalSlideshow(props: DiagonalSlideshowProps) {
    const {
        slides = [],
        backgroundColor = "#000000",
        textColor = "#fff8dc",
        sideTextColor = "#ff4500",
        titleFont,
        paragraphFont,
        paragraphMaxWidth = 480,
        sideFont,
        arrowColor = "#FFFFFF",
        slideWidth = 27,
        slideHeight = 62,
        sidePeek = 33,
        slideRadius = "0px",
        duration = 0.8,
        navStyle = "classic",
        infiniteLoop = true,
        loopCount = 1,
        enableTilt = true,
        enableScramble = true,
        textBlend = true,
        showDeco = true,
        decoColor = "rgba(254, 246, 225, 0.15)",
        showNavArrows = true,
        enableCursor = true,
        cursorText = "READ\nMORE",
        cursorColor = "#FFFFFF",
        cursorTextColor = "#999999",
        cursorSize = 120,
        scrollReveal = true,
        revealDelay = 2,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState<{ w: number; h: number } | null>(null)

    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState<"next" | "prev">("next")
    const [navCount, setNavCount] = useState(0)
    const [lastNavFrom, setLastNavFrom] = useState(-1)
    const [lastEntering, setLastEntering] = useState<{
        index: number
        role: "next" | "prev"
    } | null>(null)
    const lockRef = useRef(false)
    const cyclesRef = useRef(0)

    // Custom cursor that follows the mouse over the current slide.
    const [cursorActive, setCursorActive] = useState(false)
    const curX = useMotionValue(0)
    const curY = useMotionValue(0)
    const cursorSpringCfg = { stiffness: 350, damping: 30, mass: 0.6 }
    const sCurX = useSpring(curX, cursorSpringCfg)
    const sCurY = useSpring(curY, cursorSpringCfg)

    // Scroll reveal: the side slides stay off-screen until the current
    // image has been fully visible in the viewport for `revealDelay`s.
    const [sidesRevealed, setSidesRevealed] = useState(false)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const revealed = sidesRevealed || isStatic || !scrollReveal

    // Entrance: the current slide slides up into place once the component
    // scrolls into view; deco and texts follow it.
    const [enteredView, setEnteredView] = useState(false)
    const heroEntered = enteredView || isStatic || !scrollReveal

    useEffect(() => {
        if (
            isStatic ||
            !scrollReveal ||
            enteredView ||
            typeof window === "undefined"
        )
            return
        const el = containerRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].intersectionRatio >= 0.35) {
                    startTransition(() => setEnteredView(true))
                    io.disconnect()
                }
            },
            { threshold: [0.35] }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, scrollReveal, enteredView])

    useEffect(() => {
        if (
            isStatic ||
            !scrollReveal ||
            sidesRevealed ||
            !enteredView ||
            typeof window === "undefined"
        )
            return
        const el = sentinelRef.current
        if (!el) return
        let timer = 0
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].intersectionRatio >= 0.99) {
                    window.clearTimeout(timer)
                    timer = window.setTimeout(() => {
                        startTransition(() => setSidesRevealed(true))
                    }, revealDelay * 1000)
                } else {
                    window.clearTimeout(timer)
                }
            },
            { threshold: [0.99, 1] }
        )
        io.observe(el)
        return () => {
            window.clearTimeout(timer)
            io.disconnect()
        }
    }, [isStatic, scrollReveal, sidesRevealed, enteredView, revealDelay])

    // Deco bounce motion values (separate layer from the open/close scale).
    const decoBx = useMotionValue(0)
    const decoBy = useMotionValue(0)

    // Tilt motion values for the current slide.
    const tiltX = useMotionValue(0)
    const tiltY = useMotionValue(0)
    const tiltRx = useMotionValue(0)
    const tiltRy = useMotionValue(0)
    const spring = { stiffness: 70, damping: 18, mass: 1 }
    const sTiltX = useSpring(tiltX, spring)
    const sTiltY = useSpring(tiltY, spring)
    const sTiltRx = useSpring(tiltRx, spring)
    const sTiltRy = useSpring(tiltRy, spring)
    const counterX = useTransform(sTiltX, (v) => -v)
    const counterY = useTransform(sTiltY, (v) => -v)
    const imgScale = useMotionValue(1)

    // While the container is being resized, reposition slides instantly —
    // re-animating the last navigation's choreography on every resize tick
    // looks broken.
    const [isResizing, setIsResizing] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        const el = containerRef.current
        if (!el) return
        let settleTimer = 0
        let measured = false
        const measure = () =>
            startTransition(() =>
                setSize({ w: el.offsetWidth, h: el.offsetHeight })
            )
        measure()
        const ro = new ResizeObserver(() => {
            if (!measured) {
                // First observer callback fires on observe() — not a resize.
                measured = true
                measure()
                return
            }
            startTransition(() => setIsResizing(true))
            measure()
            window.clearTimeout(settleTimer)
            settleTimer = window.setTimeout(
                () => startTransition(() => setIsResizing(false)),
                200
            )
        })
        ro.observe(el)
        return () => {
            ro.disconnect()
            window.clearTimeout(settleTimer)
        }
    }, [])

    const cw = size?.w ?? 1200
    const ch = size?.h ?? 800
    const slideW = (cw * slideWidth) / 100
    const slideH = (ch * slideHeight) / 100
    const total = slides.length

    // The six slide positions from the original demo.
    const peekF = sidePeek / 100
    // Image sits slightly above center so the title/description fit below it.
    const imgTop = Math.max(0, (ch - slideH) * 0.35)
    // The slides sit at imgTop, not vertically centered, so every transform
    // is computed relative to the image's actual center line.
    const baseCY = imgTop + slideH / 2
    const positions = useMemo(
        () => ({
            offTL: {
                x: -(cw / 2 + slideW),
                y: -slideH - baseCY,
                rotate: -30,
            },
            prev: {
                x: -(cw / 2 - slideW * peekF),
                y: slideH * peekF - baseCY,
                rotate: 0,
            },
            center: { x: 0, y: 0, rotate: 0 },
            next: {
                x: cw / 2 - slideW * peekF,
                y: ch - slideH * peekF - baseCY,
                rotate: 0,
            },
            offBR: {
                x: cw / 2 + slideW,
                y: ch + slideH - baseCY,
                rotate: 30,
            },
        }),
        [cw, ch, slideW, slideH, peekF, baseCY]
    )

    type Role = "current" | "next" | "prev" | "offBR" | "offTL" | "hidden"

    const roleFor = useCallback(
        (i: number): Role => {
            if (total === 0) return "hidden"
            const d = (i - current + total) % total
            if (d === 0) return "current"
            if (d === 1) return "next"
            if (d === total - 1) return "prev"
            // With exactly 4 slides the same slide is both "two ahead" and
            // "two behind"; park it on the side the last exit went to.
            if (d === 2 && total - 2 === 2)
                return direction === "next" ? "offTL" : "offBR"
            if (d === 2) return "offBR"
            if (d === total - 2) return "offTL"
            return "hidden"
        },
        [current, total, direction]
    )

    const targetFor = (role: Role) => {
        switch (role) {
            case "current":
                return heroEntered
                    ? positions.center
                    : { x: 0, y: ch, rotate: 0 }
            case "prev":
                return revealed ? positions.prev : positions.offTL
            case "next":
                return revealed ? positions.next : positions.offBR
            case "offTL":
                return positions.offTL
            case "offBR":
            case "hidden":
                return positions.offBR
        }
    }

    // Choreography delays from the original demo (0 / 0.07 / 0.14 / 0.21).
    const delayFor = (role: Role) => {
        if (navCount === 0) return 0
        if (direction === "next") {
            if (role === "offTL") return 0
            if (role === "prev") return 0.07
            if (role === "current") return 0.14
            if (role === "next") return 0.21
        } else {
            if (role === "offBR") return 0
            if (role === "next") return 0.07
            if (role === "current") return 0.14
            if (role === "prev") return 0.21
        }
        return 0
    }

    const resetTilt = useCallback(() => {
        tiltX.set(0)
        tiltY.set(0)
        tiltRx.set(0)
        tiltRy.set(0)
        animate(imgScale, 1, { duration: 0.9, ease: "easeOut" })
    }, [tiltX, tiltY, tiltRx, tiltRy, imgScale])

    const navigate = useCallback(
        (dir: "next" | "prev") => {
            if (lockRef.current || total < 3 || isStatic || !revealed) return
            // Loop gating: when not infinite, stop at the ends once the
            // configured number of passes has been played.
            if (dir === "next" && current === total - 1) {
                if (!infiniteLoop && cyclesRef.current + 1 >= loopCount) return
                cyclesRef.current += 1
            }
            if (dir === "prev" && current === 0) {
                if (!infiniteLoop) return
                cyclesRef.current = Math.max(0, cyclesRef.current - 1)
            }
            lockRef.current = true
            resetTilt()
            startTransition(() => {
                // Hide the follow cursor while slides are in flight.
                setCursorActive(false)
                setDirection(dir)
                setNavCount((n) => n + 1)
                setLastNavFrom(current)
                // The slide that enters the vacated peek position must start
                // from the matching corner, no matter where it was parked —
                // otherwise it visibly flies across the viewport.
                if (total >= 4) {
                    setLastEntering(
                        dir === "next"
                            ? { index: (current + 2) % total, role: "next" }
                            : {
                                  index: (current - 2 + total) % total,
                                  role: "prev",
                              }
                    )
                }
                setCurrent((c) =>
                    dir === "next" ? (c + 1) % total : (c - 1 + total) % total
                )
            })
            // Deco bounce, like bounceDeco() in the demo.
            const off = dir === "next" ? -40 : 40
            animate(decoBx, off, {
                duration: 0.4,
                ease: "easeIn",
                delay: 0.084,
            }).then(() =>
                animate(decoBx, 0, { duration: 0.6, ease: "easeOut" })
            )
            animate(decoBy, off, {
                duration: 0.4,
                ease: "easeIn",
                delay: 0.084,
            }).then(() =>
                animate(decoBy, 0, { duration: 0.6, ease: "easeOut" })
            )
            // The fly-out path runs longer than a regular transition, so keep
            // the navigation locked until it has fully settled.
            window.setTimeout(
                () => {
                    lockRef.current = false
                },
                (navStyle === "directional"
                    ? duration * 1.8 + 0.15
                    : duration + 0.21) * 1000
            )
        },
        [
            total,
            isStatic,
            duration,
            resetTilt,
            decoBx,
            decoBy,
            current,
            infiniteLoop,
            loopCount,
            navStyle,
            revealed,
        ]
    )

    // The current slide's link renders as a real <a> so Framer resolves
    // internal page references itself. This handler only intercepts
    // same-page anchors to scroll smoothly instead of jumping.
    const handleLinkClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (isStatic) {
                e.preventDefault()
                return
            }
            if (typeof window === "undefined") return
            try {
                const url = new URL(e.currentTarget.href, window.location.href)
                if (
                    url.hash &&
                    url.origin === window.location.origin &&
                    url.pathname === window.location.pathname
                ) {
                    const el = document.querySelector(url.hash)
                    if (el) {
                        e.preventDefault()
                        el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        })
                    }
                }
            } catch {
                // fall through to default navigation
            }
        },
        [isStatic]
    )

    // Mouse handlers for the current slide: tilt + custom cursor.
    const updateCursor = useCallback(
        (e: React.MouseEvent, jump: boolean) => {
            if (!enableCursor || isStatic) return
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            if (jump) {
                curX.jump(x)
                curY.jump(y)
            } else {
                curX.set(x)
                curY.set(y)
            }
        },
        [enableCursor, isStatic, curX, curY]
    )

    const handleTiltMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            updateCursor(e, false)
            // Re-arm the cursor after a navigation ends while the mouse is
            // already resting on the (new) current slide.
            if (enableCursor && !isStatic && !lockRef.current) {
                startTransition(() => setCursorActive(true))
            }
            if (!enableTilt || isStatic || lockRef.current) return
            const bounds = e.currentTarget.getBoundingClientRect()
            const rx = e.clientX - bounds.left
            const ry = e.clientY - bounds.top
            tiltX.set((40 / bounds.width) * rx - 20)
            tiltY.set((40 / bounds.height) * ry - 20)
            tiltRx.set((30 / bounds.height) * ry - 15)
            tiltRy.set((30 / bounds.width) * rx - 15)
        },
        [
            enableTilt,
            enableCursor,
            isStatic,
            updateCursor,
            tiltX,
            tiltY,
            tiltRx,
            tiltRy,
        ]
    )

    const handleTiltEnter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (enableCursor) {
                updateCursor(e, true)
                if (!lockRef.current) {
                    startTransition(() => setCursorActive(true))
                }
            }
            if (!enableTilt || lockRef.current) return
            animate(imgScale, 1.1, { duration: 0.8, ease: "easeOut" })
        },
        [enableTilt, enableCursor, isStatic, updateCursor, imgScale]
    )

    const handleTiltLeave = useCallback(() => {
        if (isStatic) return
        startTransition(() => setCursorActive(false))
        if (!enableTilt) return
        resetTilt()
    }, [enableTilt, isStatic, resetTilt])

    if (RenderTarget.current() === RenderTarget.thumbnail) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: backgroundColor,
                }}
            />
        )
    }

    const textTop = imgTop + slideH + 24
    // Deco frame matches the active slide's image exactly.
    const decoW = slideW
    const decoH = slideH

    const titleFontStyle: CSSProperties = {
        fontFamily: "'Oswald', 'Arial Narrow', sans-serif",
        fontWeight: 600,
        fontSize: "1.6em",
        letterSpacing: "0.12em",
        ...titleFont,
    }
    const paragraphFontStyle: CSSProperties = {
        fontFamily: "'Oswald', 'Arial Narrow', sans-serif",
        fontWeight: 300,
        fontSize: "0.8em",
        lineHeight: 1.5,
        ...paragraphFont,
    }
    const sideFontStyle: CSSProperties = {
        fontFamily: "'Oswald', 'Arial Narrow', sans-serif",
        fontWeight: 300,
        fontSize: "0.8em",
        letterSpacing: "0.05em",
        ...sideFont,
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                color: textColor,
                ...style,
            }}
            tabIndex={0}
            role="region"
            aria-label="Slideshow"
            onKeyDown={(e) => {
                if (e.key === "ArrowRight") navigate("next")
                if (e.key === "ArrowLeft") navigate("prev")
            }}
        >
            {/* Deco frame behind the current slide */}
            {showDeco && (
                <motion.div
                    style={{
                        position: "absolute",
                        left: (cw - decoW) / 2,
                        top: imgTop,
                        width: decoW,
                        height: decoH,
                        zIndex: 0,
                    }}
                    initial={false}
                    animate={{ opacity: heroEntered ? 1 : 0 }}
                    transition={
                        isStatic
                            ? { duration: 0 }
                            : { duration: 0.8, delay: 0.4 }
                    }
                >
                    <motion.div
                        style={{
                            width: "100%",
                            height: "100%",
                            x: decoBx,
                            y: decoBy,
                            background: `linear-gradient(transparent, ${decoColor})`,
                            borderRadius: slideRadius,
                        }}
                    />
                </motion.div>
            )}

            {/* Invisible sentinel matching the current image rect, used by
                the scroll-reveal IntersectionObserver */}
            <div
                ref={sentinelRef}
                style={{
                    position: "absolute",
                    left: (cw - slideW) / 2,
                    top: imgTop,
                    width: slideW,
                    height: slideH,
                    pointerEvents: "none",
                }}
                aria-hidden
            />

            {/* Slides */}
            {slides.map((slide, i) => {
                const role = roleFor(i)
                const target = targetFor(role)
                const isCurrent = role === "current"
                const isSide = role === "prev" || role === "next"
                const clickable = isSide || (isCurrent && Boolean(slide.link))
                const image =
                    slide.image?.src != null
                        ? slide.image
                        : {
                              src: FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
                              alt: slide.title ?? "",
                          }
                const hidden = role === "hidden"

                // "Fly Out" navigation: the slide the user navigates away
                // from exits the viewport in the direction of travel
                // (bottom-right on "next", top-left on "prev"), then re-enters
                // its new peek position from the opposite corner.
                const isDirectionalExit =
                    navStyle === "directional" &&
                    navCount > 0 &&
                    i === lastNavFrom &&
                    ((direction === "next" && role === "prev") ||
                        (direction === "prev" && role === "next"))
                const exitVia =
                    direction === "next" ? positions.offBR : positions.offTL
                const enterVia =
                    direction === "next" ? positions.offTL : positions.offBR
                // The slide entering the vacated peek position always starts
                // from its own corner (offTL for prev, offBR for next),
                // regardless of where it was parked.
                const isEntering =
                    !isDirectionalExit &&
                    navCount > 0 &&
                    lastEntering !== null &&
                    lastEntering.index === i &&
                    lastEntering.role === role
                const enterFrom =
                    role === "prev" ? positions.offTL : positions.offBR
                const animateTarget = isDirectionalExit
                    ? {
                          // null = start from the current value, so an
                          // interrupted transition never snaps. The repeated
                          // time (0.5, 0.5) makes the corner-to-corner jump
                          // instant and invisible instead of streaking across
                          // the viewport.
                          x: [null, exitVia.x, enterVia.x, target.x],
                          y: [null, exitVia.y, enterVia.y, target.y],
                          rotate: [
                              null,
                              exitVia.rotate,
                              enterVia.rotate,
                              target.rotate,
                          ],
                      }
                    : isEntering
                      ? {
                            x: [enterFrom.x, target.x],
                            y: [enterFrom.y, target.y],
                            rotate: [enterFrom.rotate, target.rotate],
                        }
                      : { x: target.x, y: target.y, rotate: target.rotate }
                const animateTransition =
                    isStatic || hidden || size === null || isResizing
                        ? { duration: 0 }
                        : isDirectionalExit
                          ? {
                                duration: duration * 1.8,
                                times: [0, 0.5, 0.5, 1],
                                ease: EASE_INOUT,
                                delay: delayFor(role),
                            }
                          : {
                                duration:
                                    isCurrent && navCount === 0
                                        ? duration * 1.4
                                        : duration,
                                ease: EASE_INOUT,
                                delay: delayFor(role),
                            }

                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: (cw - slideW) / 2,
                            top: 0,
                            width: slideW,
                            height: "100%",
                            pointerEvents: "none",
                            zIndex: isCurrent ? 2 : isDirectionalExit ? 3 : 1,
                        }}
                    >
                        {/* Image wrap: gets the position + navigation animation */}
                        <motion.div
                            style={{
                                position: "absolute",
                                left: 0,
                                top: imgTop,
                                width: "100%",
                                height: slideH,
                                perspective: 1000,
                                pointerEvents:
                                    isCurrent || isSide ? "auto" : "none",
                                cursor:
                                    isCurrent && enableCursor && !isStatic
                                        ? "none"
                                        : clickable
                                          ? "pointer"
                                          : "default",
                                opacity: hidden ? 0 : 1,
                            }}
                            initial={false}
                            animate={animateTarget}
                            transition={animateTransition}
                            onClick={() => {
                                if (role === "next") navigate("next")
                                else if (role === "prev") navigate("prev")
                            }}
                            onMouseMove={isCurrent ? handleTiltMove : undefined}
                            onMouseEnter={
                                isCurrent ? handleTiltEnter : undefined
                            }
                            onMouseLeave={
                                isCurrent ? handleTiltLeave : undefined
                            }
                            role={isSide ? "button" : undefined}
                            aria-label={
                                role === "next"
                                    ? "Next slide"
                                    : role === "prev"
                                      ? "Previous slide"
                                      : slide.title
                            }
                        >
                            <motion.div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    x: isCurrent ? sTiltX : 0,
                                    y: isCurrent ? sTiltY : 0,
                                    rotateX: isCurrent ? sTiltRx : 0,
                                    rotateY: isCurrent ? sTiltRy : 0,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        overflow: "hidden",
                                        borderRadius: slideRadius,
                                    }}
                                >
                                    <motion.img
                                        src={image.src}
                                        srcSet={image.srcSet}
                                        alt={image.alt ?? ""}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            scale: isCurrent ? imgScale : 1,
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            </motion.div>

                            {/* Real anchor so Framer resolves internal page
                                links and section anchors natively */}
                            {isCurrent && slide.link ? (
                                <a
                                    href={slide.link}
                                    aria-label={slide.title || "Slide link"}
                                    onClick={handleLinkClick}
                                    draggable={false}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 3,
                                        cursor: "inherit",
                                    }}
                                />
                            ) : null}

                            {/* Thin diagonal arrow on the peeking slides.
                                Fades and drifts in after the slide settles,
                                and eases out when the role changes. */}
                            <AnimatePresence initial={false}>
                                {showNavArrows && isSide && (
                                    <motion.div
                                        key={`arrow-${role}`}
                                        initial={{
                                            opacity: 0,
                                            scale: 0.5,
                                            x: role === "prev" ? 14 : -14,
                                            y: role === "prev" ? 14 : -14,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            x: 0,
                                            y: 0,
                                            transition: isStatic
                                                ? { duration: 0 }
                                                : {
                                                      duration: 0.45,
                                                      ease: "easeOut",
                                                      delay: duration * 0.75,
                                                  },
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.5,
                                            transition: isStatic
                                                ? { duration: 0 }
                                                : {
                                                      duration: 0.2,
                                                      ease: "easeIn",
                                                  },
                                        }}
                                        style={{
                                            position: "absolute",
                                            ...(role === "prev"
                                                ? {
                                                      right: "10%",
                                                      bottom: "8%",
                                                  }
                                                : { left: "10%", top: "8%" }),
                                            pointerEvents: "none",
                                            zIndex: 2,
                                        }}
                                        aria-hidden
                                    >
                                        <svg
                                            width="40"
                                            height="40"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={arrowColor}
                                            strokeWidth={1.25}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ display: "block" }}
                                        >
                                            {role === "prev" ? (
                                                <>
                                                    <path d="M18 18 L6 6" />
                                                    <path d="M6 13 L6 6 L13 6" />
                                                </>
                                            ) : (
                                                <>
                                                    <path d="M6 6 L18 18" />
                                                    <path d="M18 11 L18 18 L11 18" />
                                                </>
                                            )}
                                        </svg>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Texts: only on the current slide */}
                        <AnimatePresence initial={false}>
                            {isCurrent && heroEntered && (
                                <motion.div
                                    key={`texts-${i}`}
                                    initial={{ opacity: 0, y: 36 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{
                                        opacity: 0,
                                        transition: { duration: 0.25 },
                                    }}
                                    transition={
                                        isStatic
                                            ? { duration: 0 }
                                            : navCount === 0
                                              ? {
                                                  // On load: wait for the
                                                  // image entrance to finish,
                                                  // then rise in.
                                                  duration: 0.7,
                                                  ease: "easeOut",
                                                  delay: scrollReveal
                                                      ? duration * 1.4 + 0.3
                                                      : 0.2,
                                              }
                                              : {
                                                    duration: 0.4,
                                                    ease: "easeOut",
                                                    delay: 0.3,
                                                }
                                    }
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 2,
                                        pointerEvents: "none",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        // Keeps the text readable when the
                                        // tilting image passes behind it.
                                        mixBlendMode: textBlend
                                            ? "difference"
                                            : "normal",
                                    }}
                                >
                                    {/* Vertical side text */}
                                    {slide.sideText ? (
                                        <div
                                            style={{
                                                ...sideFontStyle,
                                                position: "absolute",
                                                top: imgTop,
                                                left: "-2.5em",
                                                maxHeight: "70%",
                                                color: sideTextColor,
                                                writingMode: "vertical-rl",
                                                transform: "rotate(180deg)",
                                                mixBlendMode: textBlend
                                                    ? "difference"
                                                    : "normal",
                                            }}
                                        >
                                            <ScrambleText
                                                text={slide.sideText}
                                                animateIn={
                                                    enableScramble &&
                                                    !isStatic &&
                                                    navCount > 0
                                                }
                                            />
                                        </div>
                                    ) : null}

                                    {/* Title wrap (counter-moves with the tilt) */}
                                    <motion.div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            top: textTop,
                                            x: counterX,
                                            y: counterY,
                                            display: "flex",
                                            // Keep the text within the image
                                            // width; the paragraph drops to
                                            // the next line when the title
                                            // leaves too little room.
                                            flexWrap: "wrap",
                                            alignItems: "flex-start",
                                            gap: "1em 2em",
                                        }}
                                    >
                                        {slide.title ? (
                                            <h3
                                                style={{
                                                    ...titleFontStyle,
                                                    margin: 0,
                                                    color: textColor,
                                                    flexShrink: 0,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                <ScrambleText
                                                    text={slide.title}
                                                    animateIn={
                                                        enableScramble &&
                                                        !isStatic &&
                                                        navCount > 0
                                                    }
                                                />
                                            </h3>
                                        ) : null}
                                        {slide.paragraph ? (
                                            <div
                                                style={{
                                                    ...paragraphFontStyle,
                                                    margin: 0,
                                                    paddingTop: "0.4em",
                                                    color: textColor,
                                                    // Wraps below the title
                                                    // when less than ~10em of
                                                    // row width remains.
                                                    flex: "1 1 10em",
                                                    minWidth: 0,
                                                    maxWidth: paragraphMaxWidth,
                                                    whiteSpace: "pre-line",
                                                }}
                                            >
                                                {slide.paragraph}
                                            </div>
                                        ) : null}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}

            {/* Custom cursor following the mouse over the current slide */}
            {enableCursor && !isStatic && (
                <motion.div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        x: sCurX,
                        y: sCurY,
                        width: cursorSize,
                        height: cursorSize,
                        marginLeft: -cursorSize / 2,
                        marginTop: -cursorSize / 2,
                        borderRadius: "50%",
                        background: cursorColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        pointerEvents: "none",
                        zIndex: 6,
                    }}
                    initial={false}
                    animate={{
                        opacity: cursorActive ? 1 : 0,
                        scale: cursorActive ? 1 : 0.4,
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    aria-hidden
                >
                    <span
                        style={{
                            fontFamily: "'Oswald', 'Arial Narrow', sans-serif",
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: cursorTextColor,
                            whiteSpace: "pre-line",
                            lineHeight: 1.6,
                        }}
                    >
                        {cursorText}
                    </span>
                </motion.div>
            )}

            {total < 3 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        ...paragraphFontStyle,
                        color: textColor,
                        opacity: 0.6,
                    }}
                >
                    Add at least 3 slides in the properties panel
                </div>
            )}
        </div>
    )
}

addPropertyControls(DiagonalSlideshow, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "CASE STUDY TITLE",
                },
                paragraph: {
                    type: ControlType.String,
                    title: "Paragraph",
                    displayTextArea: true,
                    defaultValue:
                        "DESCRIBE THE CHALLENGE, THE WORK, AND THE RESULTS.",
                },
                sideText: {
                    type: ControlType.String,
                    title: "Side Text",
                    defaultValue: "ADD A KEY OUTCOME",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            {
                title: "NOVA COMMERCE",
                paragraph:
                    "WE REBUILT THE CHECKOUT EXPERIENCE FROM THE GROUND UP, CUTTING FRICTION ACROSS EVERY STEP. IN THREE MONTHS, MOBILE CONVERSION ROSE 38% AND CART ABANDONMENT DROPPED TO AN ALL-TIME LOW.",
                sideText: "+38% MOBILE CONVERSION IN 90 DAYS",
            },
            {
                title: "ORBIT ANALYTICS",
                paragraph:
                    "A CLUTTERED DASHBOARD WAS SLOWING TEAMS DOWN. WE REDESIGNED THE DATA LAYER AND INTERFACE SO INSIGHTS SURFACE INSTANTLY — REDUCING TIME-TO-REPORT FROM HOURS TO MINUTES.",
                sideText: "FROM HOURS TO MINUTES, PER REPORT",
            },
            {
                title: "LUMEN HEALTH",
                paragraph:
                    "WE SHAPED A CALM, ACCESSIBLE PATIENT PORTAL TRUSTED BY CLINICS NATIONWIDE. SUPPORT TICKETS FELL 45% WHILE PATIENT SATISFACTION SCORES REACHED THEIR HIGHEST EVER.",
                sideText: "45% FEWER SUPPORT TICKETS",
            },
            {
                title: "FLEETWISE",
                paragraph:
                    "SCALING A LOGISTICS PLATFORM MEANT RETHINKING REAL-TIME TRACKING AT VOLUME. OUR REBUILD NOW HANDLES MILLIONS OF DAILY EVENTS WITH SUB-SECOND UPDATES AND 99.9% UPTIME.",
                sideText: "99.9% UPTIME AT MILLIONS OF EVENTS/DAY",
            },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#fff8dc",
    },
    sideTextColor: {
        type: ControlType.Color,
        title: "Side Text Color",
        defaultValue: "#ff4500",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "26px",
            variant: "Semibold",
            letterSpacing: "0.12em",
            lineHeight: "1.2em",
        },
    },
    paragraphFont: {
        type: ControlType.Font,
        title: "Paragraph Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Light",
            letterSpacing: "0.03em",
            lineHeight: "1.5em",
        },
    },
    paragraphMaxWidth: {
        type: ControlType.Number,
        title: "Paragraph Width",
        description: "Maximum width of the paragraph column.",
        defaultValue: 480,
        min: 120,
        max: 1200,
        step: 10,
        unit: "px",
    },
    sideFont: {
        type: ControlType.Font,
        title: "Side Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Light",
            letterSpacing: "0.05em",
            lineHeight: "1.3em",
        },
    },
    slideWidth: {
        type: ControlType.Number,
        title: "Slide Width",
        defaultValue: 27,
        min: 15,
        max: 50,
        unit: "%",
    },
    slideHeight: {
        type: ControlType.Number,
        title: "Slide Height",
        defaultValue: 62,
        min: 40,
        max: 95,
        unit: "%",
    },
    slideRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
    },
    sidePeek: {
        type: ControlType.Number,
        title: "Side Peek",
        description:
            "How far the previous/next images reach into the view. Lower or negative values move them further out, giving the active slide more room (useful on mobile).",
        defaultValue: 33,
        min: -50,
        max: 50,
        step: 1,
        unit: "%",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    navStyle: {
        type: ControlType.Enum,
        title: "Nav Style",
        options: ["classic", "directional"],
        optionTitles: ["Slide Back", "Fly Out"],
        defaultValue: "classic",
        displaySegmentedControl: true,
    },
    infiniteLoop: {
        type: ControlType.Boolean,
        title: "Loop",
        enabledTitle: "Infinite",
        disabledTitle: "Count",
        defaultValue: true,
    },
    loopCount: {
        type: ControlType.Number,
        title: "Loop Count",
        defaultValue: 1,
        min: 1,
        max: 99,
        step: 1,
        displayStepper: true,
        hidden: (props) => props.infiniteLoop !== false,
    },
    enableTilt: {
        type: ControlType.Boolean,
        title: "Tilt",
        defaultValue: true,
    },
    enableScramble: {
        type: ControlType.Boolean,
        title: "Scramble Text",
        defaultValue: true,
    },
    textBlend: {
        type: ControlType.Boolean,
        title: "Text Blend",
        description:
            "Blends the slide texts with 'difference' so they invert against the image tilting behind them. Works best with white text.",
        defaultValue: true,
    },
    showDeco: {
        type: ControlType.Boolean,
        title: "Deco Frame",
        defaultValue: true,
    },
    decoColor: {
        type: ControlType.Color,
        title: "Deco Color",
        defaultValue: "rgba(254, 246, 225, 0.15)",
        hidden: (props) => props.showDeco === false,
    },
    showNavArrows: {
        type: ControlType.Boolean,
        title: "Nav Arrows",
        defaultValue: true,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.showNavArrows === false,
    },
    enableCursor: {
        type: ControlType.Boolean,
        title: "Custom Cursor",
        defaultValue: true,
    },
    cursorText: {
        type: ControlType.String,
        title: "Cursor Text",
        defaultValue: "READ\nMORE",
        displayTextArea: true,
        hidden: (props) => props.enableCursor === false,
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Fill",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.enableCursor === false,
    },
    cursorTextColor: {
        type: ControlType.Color,
        title: "Cursor Text Color",
        defaultValue: "#999999",
        hidden: (props) => props.enableCursor === false,
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 120,
        min: 40,
        max: 240,
        step: 2,
        unit: "px",
        hidden: (props) => props.enableCursor === false,
    },
    scrollReveal: {
        type: ControlType.Boolean,
        title: "Scroll Reveal",
        defaultValue: true,
    },
    revealDelay: {
        type: ControlType.Number,
        title: "Reveal Delay",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: (props) => props.scrollReveal === false,
    },
})

