// ─────────────────────────────────────────────────────────────────────────────
// AKPreloader — Framer Code Component
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO INSTALL:
//   Framer → Assets → Code → + New File → paste this file → Publish
//   Then drag AKPreloader onto your canvas — it auto-covers the full screen.
// ─────────────────────────────────────────────────────────────────────────────

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImageItem {
    src: string
}

interface Props {
    preloaderBg: string
    progressTrackColor: string
    progressFillColor: string
    images: ImageItem[]
    splashBg: string
    splashText: string
    font: any
    splashTextColor: string
    openDuration: number
    cycleDuration: number
    closeDuration: number
    blackDuration: number
    textHold: number
    whiteDuration: number
    replay: boolean
}

// ─── Easing ───────────────────────────────────────────────────────────────────
const ease = {
    outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
    inQuart: (t: number) => t * t * t * t,
    outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
    outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
}

// ─── rAF animator ─────────────────────────────────────────────────────────────
// Returns a cancel function. Call it to stop the animation mid-flight.
function rafAnimate(
    dur: number,
    easeFn: (t: number) => number,
    onTick: (v: number) => void,
    onDone?: () => void
): () => void {
    const t0 = performance.now()
    let frameId = 0
    let cancelled = false

    const frame = (now: number) => {
        if (cancelled) return
        const t = Math.min((now - t0) / dur, 1)
        onTick(easeFn(t))
        if (t < 1) {
            frameId = requestAnimationFrame(frame)
        } else {
            onDone?.()
        }
    }

    frameId = requestAnimationFrame(frame)
    return () => {
        cancelled = true
        cancelAnimationFrame(frameId)
    }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AKPreloader(props: Props) {
    const {
        preloaderBg,
        progressTrackColor,
        progressFillColor,
        images,
        splashBg,
        splashText,
        font,
        splashTextColor,
        openDuration,
        cycleDuration,
        closeDuration,
        blackDuration,
        textHold,
        whiteDuration,
        replay,
    } = props

    // ── Static / canvas detection ───────────────────────────────────────────
    // useIsStaticRenderer returns true in SSR, export, thumbnail, and all other
    // non-interactive Framer contexts. No timers or rAF must run there.
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Flatten srcs
    const srcs = (images || []).map((i) => i?.src).filter(Boolean)

    // ── State ───────────────────────────────────────────────────────────────
    const [runKey, setRunKey] = useState(0)
    const [visible, setVisible] = useState(true)

    // Replay toggle (canvas only)
    const prevReplay = useRef(replay)
    useEffect(() => {
        if (isStatic) return
        if (prevReplay.current !== replay) {
            prevReplay.current = replay
            setVisible(true)
            setRunKey((k) => k + 1)
        }
    }, [replay, isStatic])

    // ── DOM refs ────────────────────────────────────────────────────────────
    const wrapRef = useRef<HTMLDivElement>(null)
    const preRef = useRef<HTMLDivElement>(null)
    const splashRef = useRef<HTMLDivElement>(null)
    const fillRef = useRef<HTMLDivElement>(null)
    const imgRefs = useRef<(HTMLImageElement | null)[]>([])
    const curIdx = useRef(0)

    // ── Cancellation bookkeeping ────────────────────────────────────────────
    // Every rAF cancel fn is stored here so we can abort all loops at once.
    const rafCancels = useRef<Array<() => void>>([])
    // setTimeout IDs
    const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
    // Guards DOM writes after unmount or before a new run starts
    const mountedRef = useRef(true)
    // Live page-ready flag — readable from inside any closure
    const pageReadyRef = useRef(false)

    const cancelAll = useCallback(() => {
        rafCancels.current.forEach((fn) => fn())
        rafCancels.current = []
        timerIds.current.forEach(clearTimeout)
        timerIds.current = []
    }, [])

    const trackRaf = (cancelFn: () => void) => {
        rafCancels.current.push(cancelFn)
    }

    // Wraps setTimeout: auto-registers for bulk cancel, guards against unmount
    const later = (fn: () => void, ms: number) => {
        const id = setTimeout(() => {
            if (mountedRef.current) fn()
        }, ms)
        timerIds.current.push(id)
    }

    // ── Animation sequence ──────────────────────────────────────────────────
    const runSequence = useCallback(() => {
        const wrap = wrapRef.current
        const pre = preRef.current
        const splash = splashRef.current
        const fill = fillRef.current
        const imgs = imgRefs.current.filter(Boolean) as HTMLImageElement[]

        if (!wrap || !pre || !splash || !fill || !imgs.length) return

        const IMG_H = 195
        const START_DELAY = 400
        const AFTER_OPEN = 300
        const BEFORE_SLIDE = 200

        const TOTAL_CYCLES = imgs.length - 1
        const TOTAL_DUR =
            START_DELAY +
            openDuration +
            AFTER_OPEN +
            TOTAL_CYCLES * cycleDuration +
            cycleDuration * 0.5 +
            closeDuration +
            BEFORE_SLIDE

        // Reset DOM to starting state
        wrap.style.height = "0px"
        pre.style.transform = "translateY(0%)"
        pre.style.display = "flex"
        splash.style.transform = "translateY(0%)"
        splash.style.display = "flex"
        fill.style.width = "0%"
        curIdx.current = 0
        imgs.forEach((img, i) => {
            img.style.opacity = i === 0 ? "1" : "0"
        })

        // ── Progress bar ──
        // Uses rafAnimate so its frame ID is tracked and cancellable.
        trackRaf(
            rafAnimate(TOTAL_DUR, ease.inOutSine, (v) => {
                if (mountedRef.current && fill) fill.style.width = v * 100 + "%"
            })
        )

        // ── Open image box ──
        const open = (cb: () => void) =>
            trackRaf(
                rafAnimate(
                    openDuration,
                    ease.outQuart,
                    (v) => {
                        if (mountedRef.current && wrap)
                            wrap.style.height = IMG_H * v + "px"
                    },
                    cb
                )
            )

        // ── Cycle images ──
        // Reads pageReadyRef.current live on every call, so it correctly exits
        // the loop as soon as the page finishes loading — regardless of how many
        // images are in the array.
        const cycle = (idx: number, done: () => void) => {
            if (!mountedRef.current) return
            const cur = curIdx.current
            if (imgs[cur]) imgs[cur].style.opacity = "0"
            const next = idx % imgs.length
            curIdx.current = next
            if (imgs[next]) imgs[next].style.opacity = "1"

            const isLast = idx + 1 >= imgs.length
            if (isLast && !pageReadyRef.current) {
                later(() => cycle(0, done), cycleDuration) // loop — still loading
            } else if (isLast) {
                later(done, cycleDuration) // done — proceed
            } else {
                later(() => cycle(idx + 1, done), cycleDuration)
            }
        }

        // ── Close image box ──
        const close = (cb: () => void) =>
            trackRaf(
                rafAnimate(
                    closeDuration,
                    ease.inQuart,
                    (v) => {
                        if (mountedRef.current && wrap)
                            wrap.style.height = IMG_H * (1 - v) + "px"
                    },
                    cb
                )
            )

        // ── Slide dark layer up ──
        const slideBlack = (cb: () => void) =>
            trackRaf(
                rafAnimate(
                    blackDuration,
                    ease.outExpo,
                    (v) => {
                        if (mountedRef.current && pre)
                            pre.style.transform = `translateY(-${v * 100}%)`
                    },
                    () => {
                        if (!mountedRef.current) return
                        pre.style.display = "none"
                        cb()
                    }
                )
            )

        // ── Slide splash up → content appears ──
        const slideWhite = () =>
            trackRaf(
                rafAnimate(
                    whiteDuration,
                    ease.outCubic,
                    (v) => {
                        if (mountedRef.current && splash)
                            splash.style.transform = `translateY(-${v * 100}%)`
                    },
                    () => {
                        if (!mountedRef.current) return
                        splash.style.display = "none"
                        setVisible(false)
                    }
                )
            )

        // ── Run the full sequence ──
        later(() => {
            open(() => {
                later(() => {
                    cycle(1, () => {
                        later(() => {
                            close(() => {
                                later(() => {
                                    slideBlack(() => {
                                        later(slideWhite, textHold)
                                    })
                                }, BEFORE_SLIDE)
                            })
                        }, cycleDuration * 0.5)
                    })
                }, AFTER_OPEN)
            })
        }, START_DELAY)
    }, [
        openDuration,
        cycleDuration,
        closeDuration,
        blackDuration,
        textHold,
        whiteDuration,
    ])

    // ── Main effect ─────────────────────────────────────────────────────────
    useEffect(() => {
        // Never run animation logic in static/export contexts
        if (isStatic) return
        // Canvas shows a frozen preview — no animation needed
        if (isCanvas) return
        if (srcs.length === 0) return

        // Kill any previous run before starting fresh
        mountedRef.current = true
        cancelAll()
        setVisible(true)
        pageReadyRef.current = document.readyState === "complete"

        const pre = preRef.current
        const splash = splashRef.current
        if (pre) {
            pre.style.transform = "translateY(0%)"
            pre.style.display = "flex"
        }
        if (splash) {
            splash.style.transform = "translateY(0%)"
            splash.style.display = "flex"
        }

        runSequence()

        // If the page is still loading, set the flag when it finishes
        if (!pageReadyRef.current) {
            const onLoad = () => {
                pageReadyRef.current = true
            }
            window.addEventListener("load", onLoad, { once: true })
            return () => {
                window.removeEventListener("load", onLoad)
                mountedRef.current = false
                cancelAll()
            }
        }

        return () => {
            mountedRef.current = false
            cancelAll()
        }
    }, [runKey, srcs.length, isStatic])

    // Final unmount cleanup (catches edge cases the main effect misses)
    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            cancelAll()
        }
    }, [])

    // ── Font style ──────────────────────────────────────────────────────────
    const fontStyle: React.CSSProperties = {
        fontFamily: font?.fontFamily ?? "Georgia, serif",
        fontSize: font?.fontSize ?? 72,
        fontWeight: font?.fontWeight ?? 400,
        fontStyle: font?.fontStyle ?? "normal",
        letterSpacing: font?.letterSpacing ?? "-0.03em",
        lineHeight: font?.lineHeight ?? 1.1,
    }

    // ── Static fallback ─────────────────────────────────────────────────────
    // Shown in SSR, thumbnail, export, and every other non-interactive context.
    // Clean dark screen with the splash text — no timers, no rAF, no side effects.
    if (isStatic) {
        return (
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: preloaderBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                }}
            >
                <span style={{ ...fontStyle, color: splashTextColor }}>
                    {splashText}
                </span>
            </div>
        )
    }

    // Fully hidden once the sequence completes
    if (!visible && !isCanvas) return null

    const showFrozen = isCanvas

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                zIndex: 9999,
                pointerEvents: visible ? "all" : "none",
            }}
        >
            {/* ── LAYER 2 — Splash ── */}
            <div
                ref={splashRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: splashBg,
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    willChange: "transform",
                }}
            >
                <span
                    style={{
                        ...fontStyle,
                        color: splashTextColor,
                        userSelect: "none",
                    }}
                >
                    {splashText}
                </span>
            </div>

            {/* ── LAYER 3 — Preloader (dark) ── */}
            <div
                ref={preRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: preloaderBg,
                    zIndex: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    willChange: "transform",
                }}
            >
                {/* Progress bar */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: 2,
                        background: progressTrackColor,
                    }}
                >
                    <div
                        ref={fillRef}
                        style={{
                            height: "100%",
                            width: showFrozen ? "45%" : "0%",
                            background: progressFillColor,
                        }}
                    />
                </div>

                {/* Image slideshow */}
                <div
                    ref={wrapRef}
                    style={{
                        width: 150,
                        height: showFrozen ? 195 : 0,
                        overflow: "hidden",
                        position: "relative",
                        borderRadius: 2,
                        flexShrink: 0,
                    }}
                >
                    {srcs.map((src, i) => (
                        <img
                            key={i}
                            ref={(el) => {
                                imgRefs.current[i] = el
                            }}
                            src={src}
                            alt=""
                            draggable={false}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: 150,
                                height: 195,
                                objectFit: "cover",
                                objectPosition: "center top",
                                opacity: i === 0 ? 1 : 0,
                                transition: "opacity 0.22s ease",
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                    ))}

                    {/* Placeholder shown on canvas when no images uploaded yet */}
                    {showFrozen && srcs.length === 0 && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(255,255,255,0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "rgba(255,255,255,0.3)",
                                fontSize: 11,
                                fontFamily: "sans-serif",
                                textAlign: "center",
                                padding: 8,
                            }}
                        >
                            Add images →<br />
                            right panel
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Default Props ────────────────────────────────────────────────────────────
AKPreloader.defaultProps = {
    preloaderBg: "#0d0d0d",
    progressTrackColor: "rgba(255,255,255,0.15)",
    progressFillColor: "#ffffff",
    images: [
        {
            src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80",
        },
        {
            src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
        },
        {
            src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
        },
    ],
    splashBg: "#ffffff",
    splashText: "Hello World.",
    font: {
        fontFamily: "Georgia, serif",
        fontSize: 72,
        fontWeight: 400,
        fontStyle: "normal",
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
    },
    splashTextColor: "#111111",
    openDuration: 700,
    cycleDuration: 420,
    closeDuration: 480,
    blackDuration: 1500,
    textHold: 1400,
    whiteDuration: 800,
    replay: false,
}

// ─── Property Controls ────────────────────────────────────────────────────────
addPropertyControls(AKPreloader, {
    preloaderBg: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#0d0d0d",
    },
    progressTrackColor: {
        type: ControlType.Color,
        title: "Bar Track",
        defaultValue: "rgba(255,255,255,0.15)",
    },
    progressFillColor: {
        type: ControlType.Color,
        title: "Bar Fill",
        defaultValue: "#ffffff",
    },

    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            title: "Image",
            controls: {
                src: {
                    type: ControlType.Image,
                    title: "Photo",
                },
            },
        },
        defaultValue: [
            {
                src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80",
            },
            {
                src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
            },
            {
                src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
            },
        ],
    },

    splashBg: {
        type: ControlType.Color,
        title: "Splash BG",
        defaultValue: "#ffffff",
    },
    splashText: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hello World.",
        displayTextArea: false,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    splashTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111111",
    },

    openDuration: {
        type: ControlType.Number,
        title: "Open (ms)",
        defaultValue: 700,
        min: 100,
        max: 3000,
        step: 50,
        description: "Image box opens",
    },
    cycleDuration: {
        type: ControlType.Number,
        title: "Cycle (ms)",
        defaultValue: 420,
        min: 80,
        max: 2000,
        step: 20,
        description: "Delay between each image",
    },
    closeDuration: {
        type: ControlType.Number,
        title: "Close (ms)",
        defaultValue: 480,
        min: 100,
        max: 2000,
        step: 50,
        description: "Image box closes",
    },
    blackDuration: {
        type: ControlType.Number,
        title: "Slide Up (ms)",
        defaultValue: 1500,
        min: 300,
        max: 5000,
        step: 50,
        description: "Dark layer slides up",
    },
    textHold: {
        type: ControlType.Number,
        title: "Text Hold (ms)",
        defaultValue: 1400,
        min: 200,
        max: 8000,
        step: 100,
        description: "How long splash text stays",
    },
    whiteDuration: {
        type: ControlType.Number,
        title: "Reveal (ms)",
        defaultValue: 800,
        min: 200,
        max: 3000,
        step: 50,
        description: "White layer slides up → content appears",
    },

    replay: {
        type: ControlType.Boolean,
        title: "▶ Replay",
        defaultValue: false,
        enabledTitle: "Replaying…",
        disabledTitle: "Toggle to replay",
    },
})
