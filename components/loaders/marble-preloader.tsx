import * as React from "react"
import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Marble Reveal — a cinematic intro or preloader. Two words rise in, a small mark spins into the gap,
 * then twists open like a lens iris into a window that flashes through
 * an image sequence. It lands on the last frame, draws a breath, and
 * expands to its final size (or full bleed), pushing the words away.
 * Looping videos and an optional camera HUD take over at the end.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function MarbleReveal(props) {
    const {
        text,
        images = [],
        videoFiles = [],
        icon,
        iconColor,
        flashWidth,
        flashHeight,
        frameSpeed,
        endMode,
        finalWidth,
        finalHeight,
        paddingLeft,
        paddingRight,
        initialRadius,
        finalRadius,
        font,
        textColor,
        speed,
        showCounter,
        showHud,
        hudColor,
        hudTopRight,
        hudBottomLeft,
        hudBottomRight,
        enableVideoCrossfade,
        mode = "preloader",
        background,
        exitStyle = "lift",
        oncePerSession,
        onComplete,
    } = props

    const reduceMotion = useReducedMotion()
    const s = 1 / Math.max(0.25, speed || 1)
    // Outside the live site (canvas, thumbnails) show a still of the flash frame; reduced motion jumps to the end
    const isCanvas = RenderTarget.current() !== RenderTarget.preview
    const instant = isCanvas || !!reduceMotion
    // Preloader: covers the viewport, last frame grows full screen, then lifts away
    const preloader = mode === "preloader" && !isCanvas
    const [done, setDone] = useState(false)
    const [skip] = useState(() => {
        if (!preloader || !oncePerSession) return false
        try {
            return sessionStorage.getItem(SEEN_KEY) === "1"
        } catch (e) {
            return false
        }
    })

    // ---------- words ----------
    const spaceIndex = (text || "").indexOf(" ")
    const textLeft = spaceIndex !== -1 ? text.slice(0, spaceIndex) : text
    const textRight = spaceIndex !== -1 ? text.slice(spaceIndex + 1) : ""

    const baseFontSize = parsePx(font?.fontSize, 48)

    // ---------- measuring ----------
    const containerRef = useRef(null)
    const leftRef = useRef(null)
    const rightRef = useRef(null)
    const [box, setBox] = useState({ w: 0, h: 0, lw: 0, rw: 0 })
    // Shrink the wordmark on narrow screens so words + mark always fit
    const [fit, setFit] = useState(1)
    const fitRef = useRef(1)

    const fontSize = baseFontSize * fit
    const iconSize = Math.round(fontSize * 0.82)
    const gapClosed = fontSize * 0.14
    const gapOpen = fontSize * 0.3

    useLayoutEffect(() => {
        if (typeof ResizeObserver === "undefined") return
        const measure = () => {
            const c = containerRef.current
            if (!c) return
            const lw = leftRef.current?.firstChild?.offsetWidth || 0
            const rw = rightRef.current?.firstChild?.offsetWidth || 0
            // Everything scales linearly with font size, so normalise to fit = 1
            const f = fitRef.current || 1
            const needed =
                (lw + rw) / f + baseFontSize * (0.3 * 2 + 0.82 * 2)
            const avail = Math.max(0, c.clientWidth - paddingLeft - paddingRight)
            // Words + gaps may use at most ~62% of the width, leaving room for the flash
            const wordsAndGaps = (lw + rw) / f + baseFontSize * 0.3 * 2
            const nextFit =
                needed > 0 && avail > 0
                    ? Math.min(1, Math.max(0.2, Math.min(avail / needed, (avail * 0.62) / wordsAndGaps)))
                    : 1
            if (Math.abs(nextFit - f) > 0.005) {
                fitRef.current = nextFit
                setFit(nextFit)
            }
            setBox({ w: c.clientWidth, h: c.clientHeight, lw, rw })
        }
        const ro = new ResizeObserver(measure)
        containerRef.current && ro.observe(containerRef.current)
        leftRef.current && ro.observe(leftRef.current)
        rightRef.current && ro.observe(rightRef.current)
        measure()
        return () => ro.disconnect()
    }, [])

    const innerW = Math.max(0, (box.w || finalWidth) - paddingLeft - paddingRight)
    // Keep the flash window between the words, even on narrow screens
    const roomBetween = innerW - box.lw - box.rw - gapOpen * 2
    // Shift the window so the whole word group sits optically centred
    const groupShift = (box.lw - box.rw) / 2
    const flashW = Math.max(
        iconSize * 2,
        Math.min(flashWidth, roomBetween > 0 ? roomBetween : flashWidth)
    )
    // When squeezed (phones), let the window go portrait instead of shrinking to a slit
    const flashH = Math.round(
        Math.max(flashHeight * (flashW / flashWidth), Math.min(flashHeight, flashW * 1.35))
    )
    const endW = preloader ? box.w : endMode === "fill" ? innerW : Math.min(finalWidth, innerW)
    const endH = preloader
        ? box.h
        : endMode === "fill"
          ? Math.max(box.h, flashH)
          : Math.round(finalHeight * (endW / finalWidth))

    // ---------- timeline ----------
    // 0 hidden · 1 words · 2 mark · 3 iris + flash · 4 breath · 5 expand · 6 live
    const [phase, setPhase] = useState(isCanvas ? 3 : 0)
    const [frame, setFrame] = useState(isCanvas ? Math.max(0, images.length - 1) : 0)
    const [videoIndex, setVideoIndex] = useState(0)
    const videoRefs = useRef([])
    const timecodeRef = useRef(null)

    const hasEnteredView = useInView(containerRef, { once: true, margin: "-20% 0px" })
    const isInView = useInView(containerRef)

    const flashMs = Math.max(600, (images.length || 1) * frameSpeed * 1.5)

    const finish = () => {
        setDone(true)
        try {
            sessionStorage.setItem(SEEN_KEY, "1")
        } catch (e) {}
        onComplete && onComplete()
    }

    // Lock page scroll while the preloader covers it
    useEffect(() => {
        if (!preloader || skip || done) return
        const el = document.documentElement
        const prev = el.style.overflow
        el.style.overflow = "hidden"
        return () => {
            el.style.overflow = prev
        }
    }, [preloader, skip, done])

    useEffect(() => {
        if (skip) {
            onComplete && onComplete()
            return
        }
        if ((!hasEnteredView && !preloader) || isCanvas) return
        if (reduceMotion) {
            setFrame(Math.max(0, images.length - 1))
            setPhase(preloader ? 5 : 6)
            if (preloader) {
                const t = setTimeout(finish, 900)
                return () => clearTimeout(t)
            }
            return
        }
        let cancelled = false
        const timers = []
        const at = (fn, ms) => timers.push(setTimeout(fn, ms * s))
        at(() => setPhase(1), 150)
        at(() => setPhase(2), 900)
        // The mark holds until the flash images are loaded (or 4s passes)
        const loaded = preloadImages(images, 4000 * s)
        const minWait = new Promise((r) => at(r, 1700))
        Promise.all([loaded, minWait]).then(() => {
            if (cancelled) return
            setPhase(3)
            at(() => setPhase(4), flashMs)
            at(() => setPhase(5), flashMs + 450)
            if (preloader) {
                // Full-bleed beat, then lift the curtain
                at(() => setPhase(6), flashMs + 450 + 1300 + 450)
                at(finish, flashMs + 450 + 1300 + 450 + 1150)
            } else {
                at(() => setPhase(6), flashMs + 450 + 1250)
            }
        })
        return () => {
            cancelled = true
            timers.forEach(clearTimeout)
        }
    }, [hasEnteredView, reduceMotion])

    // Hard-cut image flashes, landing on the last frame
    useEffect(() => {
        if (!images.length || isCanvas) return
        if (phase === 3) {
            setFrame(0)
            const id = setInterval(
                () => setFrame((f) => (f + 1) % images.length),
                frameSpeed * s
            )
            return () => clearInterval(id)
        }
        if (phase >= 4) setFrame(images.length - 1)
    }, [phase, images.length])

    // Preloader count 0 → 100, timed to land on 100 as the flash lands on the last frame
    const counterRef = useRef(null)
    useEffect(() => {
        const el = counterRef.current
        if (!el) return
        if (isCanvas || phase >= 4) {
            el.textContent = "100"
            return
        }
        if (phase < 3) {
            el.textContent = "0"
            return
        }
        const dur = flashMs * s
        const start = performance.now()
        const id = setInterval(() => {
            const t = Math.min(1, (performance.now() - start) / dur)
            el.textContent = String(Math.round((1 - (1 - t) * (1 - t)) * 100))
            if (t >= 1) clearInterval(id)
        }, 16)
        return () => clearInterval(id)
    }, [phase])

    useEffect(() => {
        if (phase !== 6 || preloader) return
        const v = videoRefs.current[videoIndex]
        if (!v) return
        if (isInView) v.play().catch(() => {})
        else v.pause()
    }, [phase, videoIndex, isInView])

    useEffect(() => {
        if (phase !== 6 || !showHud || preloader) return
        let f = 0
        let sec = 0
        const id = setInterval(() => {
            f = (f + 1) % 24
            if (f === 0) sec++
            if (timecodeRef.current) {
                timecodeRef.current.textContent = "REC 00:00:" + pad(sec % 60) + ":" + pad(f)
            }
        }, 1000 / 24)
        return () => clearInterval(id)
    }, [phase, showHud])

    // ---------- motion ----------
    const tOut = (d, delay = 0): any =>
        instant ? { duration: 0 } : { duration: d * s, ease: EXPO_OUT, delay: delay * s }
    const tInOut = (d, delay = 0): any =>
        instant ? { duration: 0 } : { duration: d * s, ease: EXPO_IN_OUT, delay: delay * s }

    const windowAnim =
        phase <= 1
            ? { width: 0, height: iconSize, scale: 1, x: groupShift }
            : phase === 2
              ? { width: iconSize, height: iconSize, scale: 1, x: groupShift }
              : phase === 3
                ? { width: flashW, height: flashH, scale: 1, x: groupShift }
                : phase === 4
                  ? { width: flashW, height: flashH, scale: 0.94, x: groupShift }
                  : { width: endW, height: endH, scale: 1, x: 0 }

    const windowTransition: any =
        phase <= 1
            ? { duration: 0 }
            : phase === 2
            ? (instant ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 24, mass: 0.9 })
            : phase === 3
              ? tOut(1.15)
              : phase === 4
                ? tInOut(0.45)
                : tInOut(1.3)

    const frameAnim =
        phase <= 2
            ? { rotate: -38, borderRadius: iconSize / 2, opacity: 0 }
            : phase <= 4
              ? { rotate: 0, borderRadius: initialRadius, opacity: 1 }
              : { rotate: 0, borderRadius: preloader ? 0 : finalRadius, opacity: 1 }

    const frameTransition: any =
        phase === 3
            ? { rotate: tOut(1.35), borderRadius: tOut(1.0), opacity: { duration: instant ? 0 : 0.2 * s } }
            : tInOut(1.3)

    const exiting = preloader && phase >= 6
    const mediaAnim =
        phase <= 2
            ? { scale: 1.35, rotate: 24, y: "0%" }
            : phase <= 4
              ? { scale: 1.06, rotate: 0, y: "0%" }
              : exiting
                ? exitStyle === "fade"
                    ? { scale: 1, rotate: 0, y: "0%" }
                    : { scale: 1.04, rotate: 0, y: "38%" }
                : { scale: 1, rotate: 0, y: "0%" }

    const mediaTransition: any = phase === 3 ? tOut(1.35) : exiting ? tInOut(1.1) : tInOut(1.3)

    const shellAnim = !exiting
        ? { y: "0%", opacity: 1 }
        : exitStyle === "fade"
          ? { y: "0%", opacity: 0 }
          : { y: "-100%", opacity: 1 }

    const wordAnim = (side) =>
        phase === 0
            ? { y: "110%", x: 0, opacity: 0, filter: "blur(8px)" }
            : phase < 5
              ? { y: "0%", x: 0, opacity: 1, filter: "blur(0px)" }
              : {
                    y: "0%",
                    x: side === "left" ? "-0.35em" : "0.35em",
                    opacity: 0,
                    filter: "blur(10px)",
                }

    const wordTransition = (side): any =>
        phase >= 5 ? tInOut(0.9) : tOut(1.1, side === "right" ? 0.09 : 0)

    const textStyle: any = {
        letterSpacing: "-0.02em",
        lineHeight: 1,
        ...font,
        fontSize,
        color: textColor,
        margin: 0,
        whiteSpace: "nowrap",
        display: "block",
    }

    const wordWrap = (side): any => ({
        position: "absolute",
        top: 0,
        bottom: 0,
        [side === "left" ? "right" : "left"]: "100%",
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
    })

    const gap = phase >= 2 ? gapOpen : gapClosed

    if (skip || done) return null

    return (
        <motion.div
            ref={containerRef}
            style={{
                ...props.style,
                ...containerStyle,
                ...(preloader ? preloaderStyle : null),
                background: preloader || isCanvas && mode === "preloader" ? background : undefined,
                paddingLeft,
                paddingRight,
            }}
            initial={false}
            animate={shellAnim}
            transition={exiting ? tInOut(1.1) : { duration: 0 }}
        >
            <motion.div
                initial={false}
                animate={windowAnim}
                transition={windowTransition}
                style={{ position: "relative", flexShrink: 0 }}
            >
                {/* LEFT WORD — rides the window's left edge */}
                <motion.div
                    ref={leftRef}
                    style={wordWrap("left")}
                    initial={false}
                    animate={{ paddingRight: gap }}
                    transition={phase === 2 ? windowTransition : tOut(1)}
                >
                    <span style={maskStyle}>
                        <motion.span
                            style={textStyle}
                            initial={false}
                            animate={wordAnim("left")}
                            transition={wordTransition("left")}
                        >
                            {textLeft}
                        </motion.span>
                    </span>
                </motion.div>

                {/* RIGHT WORD — rides the window's right edge */}
                <motion.div
                    ref={rightRef}
                    style={wordWrap("right")}
                    initial={false}
                    animate={{ paddingLeft: gap }}
                    transition={phase === 2 ? windowTransition : tOut(1)}
                >
                    <span style={maskStyle}>
                        <motion.span
                            style={textStyle}
                            initial={false}
                            animate={wordAnim("right")}
                            transition={wordTransition("right")}
                        >
                            {textRight}
                        </motion.span>
                    </span>
                </motion.div>

                {/* MARK — spins in, then twists away as the iris opens */}
                {icon !== "none" && (
                    <motion.div
                        style={iconWrap}
                        initial={false}
                        animate={
                            phase < 2
                                ? { scale: 0, rotate: -120, opacity: 0 }
                                : phase === 2
                                  ? { scale: 1, rotate: 0, opacity: 1 }
                                  : { scale: 0.3, rotate: 140, opacity: 0 }
                        }
                        transition={
                            phase === 2
                                ? (instant ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 16 })
                                : tOut(0.7)
                        }
                    >
                        <Mark kind={icon} size={iconSize} color={iconColor} />
                    </motion.div>
                )}

                {/* FRAME — the iris. Rotates open, then holds square */}
                <motion.div
                    style={frameStyle}
                    initial={false}
                    animate={frameAnim}
                    transition={frameTransition}
                >
                    <motion.div
                        style={fill}
                        initial={false}
                        animate={mediaAnim}
                        transition={mediaTransition}
                    >
                        {images.map((src, i) => (
                            <motion.div
                                key={"img-" + i}
                                style={{
                                    ...fill,
                                    backgroundImage: "url(" + src + ")",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    opacity: frame === i ? 1 : 0,
                                }}
                                initial={false}
                                animate={{ scale: frame === i ? 1 : 1.1 }}
                                transition={
                                    frame === i ? tOut(0.6) : { duration: 0 }
                                }
                            />
                        ))}

                        {!preloader && videoFiles.map((src, i) => (
                            <motion.video
                                key={"vid-" + i}
                                ref={(el) => {
                                    videoRefs.current[i] = el
                                }}
                                src={src}
                                preload="auto"
                                muted
                                playsInline
                                loop={videoFiles.length === 1}
                                onEnded={() => {
                                    if (videoFiles.length < 2) return
                                    const v = videoRefs.current[i]
                                    if (v) {
                                        v.pause()
                                        v.currentTime = 0
                                    }
                                    setVideoIndex((p) => (p + 1) % videoFiles.length)
                                }}
                                style={{ ...fill, objectFit: "cover" }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: phase === 6 && videoIndex === i ? 1 : 0 }}
                                transition={{
                                    duration: enableVideoCrossfade ? 0.8 : phase === 6 ? 0.5 : 0,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </motion.div>

                    {showHud && !preloader && (
                        <motion.div
                            style={{ ...hudStyle, color: hudColor }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: phase === 6 ? 1 : 0 }}
                            transition={{ duration: 0.8 * s, delay: phase === 6 ? 0.3 * s : 0 }}
                        >
                            <Corner pos={{ top: 0, left: 0 }} sides={["Top", "Left"]} />
                            <Corner pos={{ top: 0, right: 0 }} sides={["Top", "Right"]} />
                            <Corner pos={{ bottom: 0, left: 0 }} sides={["Bottom", "Left"]} />
                            <Corner pos={{ bottom: 0, right: 0 }} sides={["Bottom", "Right"]} />
                            <div style={{ ...hudRow, top: 10 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <motion.span
                                        animate={{ opacity: [1, 0.15, 1] }}
                                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                        style={recDot}
                                    />
                                    <span ref={timecodeRef}>REC 00:00:00:00</span>
                                </span>
                                <span>{hudTopRight}</span>
                            </div>
                            <div style={{ ...hudRow, bottom: 10 }}>
                                <span>{hudBottomLeft}</span>
                                <span>{hudBottomRight}</span>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* FRAME COUNTER — film-leader tick under the window */}
                {showCounter && images.length > 0 && (
                    <motion.div
                        style={{ ...counterStyle, color: textColor }}
                        initial={false}
                        animate={{
                            opacity: phase === 3 || phase === 4 ? 0.55 : 0,
                            y: phase === 3 || phase === 4 ? 0 : 6,
                        }}
                        transition={tOut(0.6)}
                    >
                        <span ref={counterRef}>{isCanvas ? "100" : "0"}</span>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    )
}

// Resolves once every image has loaded (or failed), or after the timeout
function preloadImages(srcs, timeout) {
    if (typeof window === "undefined" || !srcs.length) return Promise.resolve()
    const all = Promise.all(
        srcs.map(
            (src) =>
                new Promise((r) => {
                    const img = new Image()
                    img.onload = img.onerror = () => r(null)
                    img.src = src
                })
        )
    )
    return Promise.race([all, new Promise((r) => setTimeout(r, timeout))])
}

// ---------- marks ----------
function Mark({ kind, size, color }) {
    const common = { width: size, height: size, viewBox: "0 0 24 24", style: { display: "block" } }
    if (kind === "play") {
        return (
            <svg {...common} fill={color}>
                <path d="M7 4.6v14.8c0 .9 1 1.5 1.8 1l11.6-7.4a1.2 1.2 0 0 0 0-2L8.8 3.6C8 3.1 7 3.7 7 4.6Z" />
            </svg>
        )
    }
    if (kind === "spark") {
        return (
            <svg {...common} fill={color}>
                <path d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5C11.5 16.9 7.1 12.5 1.5 12 7.1 11.5 11.5 7.1 12 1.5Z" />
            </svg>
        )
    }
    if (kind === "plus") {
        return (
            <svg {...common} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
                <path d="M12 4v16M4 12h16" />
            </svg>
        )
    }
    if (kind === "dot") {
        return (
            <svg {...common} fill={color}>
                <circle cx="12" cy="12" r="6.5" />
            </svg>
        )
    }
    // aperture: six blades around an open hexagon
    const blades = []
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3
        const b = a + Math.PI / 3
        const r = 10
        const h = 4.2
        const p1 = [12 + r * Math.cos(a), 12 + r * Math.sin(a)]
        const p2 = [12 + h * Math.cos(a + Math.PI / 6), 12 + h * Math.sin(a + Math.PI / 6)]
        const p3 = [12 + h * Math.cos(b + Math.PI / 6), 12 + h * Math.sin(b + Math.PI / 6)]
        blades.push("M" + f2(p1[0]) + " " + f2(p1[1]) + "L" + f2(p2[0]) + " " + f2(p2[1]))
        blades.push("M" + f2(p2[0]) + " " + f2(p2[1]) + "L" + f2(p3[0]) + " " + f2(p3[1]))
    }
    return (
        <svg {...common} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d={blades.join("")} />
        </svg>
    )
}

function Corner({ pos, sides }) {
    const st: any = { position: "absolute", width: 10, height: 10, ...pos }
    sides.forEach((side) => (st["border" + side] = "1.5px solid currentColor"))
    return <div style={st} />
}

// ---------- helpers ----------
const EXPO_OUT = [0.16, 1, 0.3, 1]
const EXPO_IN_OUT = [0.87, 0, 0.13, 1]
const SEEN_KEY = "intro-sequence-seen"
const pad = (n) => String(n).padStart(2, "0")
const f2 = (n) => Math.round(n * 100) / 100
function parsePx(v, fallback) {
    if (typeof v === "number") return v
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : fallback
}

// ---------- styles ----------
const containerStyle: any = {
    position: "relative",
    display: "flex",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxSizing: "border-box",
}
const preloaderStyle: any = {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100dvh",
    zIndex: 9999,
    willChange: "transform",
}
const fill: any = { position: "absolute", inset: 0, width: "100%", height: "100%" }
const maskStyle: any = {
    display: "block",
    overflow: "hidden",
    padding: "0.12em 0.04em",
    margin: "-0.12em -0.04em",
}
const iconWrap: any = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    pointerEvents: "none",
}
const frameStyle: any = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    zIndex: 2,
    willChange: "transform",
    backgroundColor: "rgba(127,127,127,0.12)",
}
const hudStyle: any = {
    position: "absolute",
    inset: 16,
    zIndex: 4,
    pointerEvents: "none",
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
}
const hudRow: any = {
    position: "absolute",
    left: 16,
    right: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    whiteSpace: "nowrap",
}
const recDot: any = { width: 6, height: 6, borderRadius: "50%", background: "#ff3b30", display: "block" }
const counterStyle: any = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 14,
    textAlign: "center",
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 11,
    letterSpacing: "0.12em",
    whiteSpace: "nowrap",
    pointerEvents: "none",
}

addPropertyControls(MarbleReveal, {
    mode: {
        title: "Mode",
        type: ControlType.Enum,
        options: ["preloader", "section"],
        optionTitles: ["Preloader", "Section"],
        displaySegmentedControl: true,
        defaultValue: "preloader",
        description: "Preloader covers the page, ends full screen, then reveals the site.",
    },
    background: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#0B0B0B",
        hidden: (p) => p.mode === "section",
    },
    exitStyle: {
        title: "Exit",
        type: ControlType.Enum,
        options: ["lift", "fade"],
        optionTitles: ["Lift", "Fade"],
        displaySegmentedControl: true,
        defaultValue: "lift",
        description: "Fade hands off to a hero that uses the last image.",
        hidden: (p) => p.mode === "section",
    },
    oncePerSession: {
        title: "Once Per Visit",
        type: ControlType.Boolean,
        defaultValue: false,
        hidden: (p) => p.mode === "section",
    },
    onComplete: { title: "On Complete", type: ControlType.EventHandler },
    text: { title: "Text", type: ControlType.String, defaultValue: "MOTION PICTURES ®" },
    font: {
        title: "Font",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 60, letterSpacing: "-0.02em", lineHeight: "1em" },
    },
    textColor: { title: "Text Color", type: ControlType.Color, defaultValue: "#FFFFFF" },
    icon: {
        title: "Mark",
        type: ControlType.Enum,
        options: ["aperture", "play", "spark", "plus", "dot", "none"],
        optionTitles: ["Aperture", "Play", "Spark", "Plus", "Dot", "None"],
        defaultValue: "aperture",
    },
    iconColor: {
        title: "Mark Color",
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        hidden: (p) => p.icon === "none",
    },
    images: {
        title: "Flash Images",
        type: ControlType.Array,
        control: { type: ControlType.Image },
    },
    frameSpeed: {
        title: "Frame Time",
        type: ControlType.Number,
        defaultValue: 130,
        min: 60,
        max: 600,
        step: 10,
        unit: "ms",
    },
    flashWidth: { title: "Flash Width", type: ControlType.Number, defaultValue: 400, min: 80, max: 2000, step: 10 },
    flashHeight: { title: "Flash Height", type: ControlType.Number, defaultValue: 300, min: 60, max: 2000, step: 10 },
    endMode: {
        title: "End Size",
        type: ControlType.Enum,
        options: ["box", "fill"],
        optionTitles: ["Box", "Fill"],
        displaySegmentedControl: true,
        defaultValue: "box",
        description: "Fill expands to the component's full size. Give it a fixed or fill height.",
        hidden: (p) => p.mode === "preloader",
    },
    finalWidth: {
        title: "Final Width",
        type: ControlType.Number,
        defaultValue: 1000,
        min: 100,
        max: 4000,
        step: 10,
        hidden: (p) => p.mode === "preloader" || p.endMode === "fill",
    },
    finalHeight: {
        title: "Final Height",
        type: ControlType.Number,
        defaultValue: 640,
        min: 100,
        max: 4000,
        step: 10,
        hidden: (p) => p.mode === "preloader" || p.endMode === "fill",
    },
    paddingLeft: { title: "Padding Left", type: ControlType.Number, defaultValue: 30, min: 0, max: 500 },
    paddingRight: { title: "Padding Right", type: ControlType.Number, defaultValue: 30, min: 0, max: 500 },
    initialRadius: { title: "Flash Radius", type: ControlType.Number, defaultValue: 4, min: 0, max: 200 },
    finalRadius: { title: "Final Radius", type: ControlType.Number, defaultValue: 0, min: 0, max: 200, hidden: (p) => p.mode === "preloader" },
    videoFiles: {
        title: "End Videos",
        type: ControlType.Array,
        control: { type: ControlType.File, allowedFileTypes: ["mp4", "webm", "mov"] },
        hidden: (p) => p.mode === "preloader",
    },
    enableVideoCrossfade: { title: "Crossfade Videos", type: ControlType.Boolean, defaultValue: true, hidden: (p) => p.mode === "preloader" },
    speed: {
        title: "Speed",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.05,
        displayStepper: true,
    },
    showCounter: { title: "Frame Counter", type: ControlType.Boolean, defaultValue: true },
    showHud: { title: "Camera HUD", type: ControlType.Boolean, defaultValue: true, hidden: (p) => p.mode === "preloader" },
    hudColor: {
        title: "HUD Color",
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.75)",
        hidden: (p) => p.mode === "preloader" || !p.showHud,
    },
    hudTopRight: { title: "HUD Top Right", type: ControlType.String, defaultValue: "4K · 24FPS", hidden: (p) => p.mode === "preloader" || !p.showHud },
    hudBottomLeft: { title: "HUD Bottom Left", type: ControlType.String, defaultValue: "35MM", hidden: (p) => p.mode === "preloader" || !p.showHud },
    hudBottomRight: { title: "HUD Bottom Right", type: ControlType.String, defaultValue: "ISO 800", hidden: (p) => p.mode === "preloader" || !p.showHud },
})
