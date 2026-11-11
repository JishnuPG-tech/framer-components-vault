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


/**
 * REVEAL — Before / After Comparison Slider
 *
 * Drag the divider to compare two images. Mouse, touch and keyboard,
 * with an optional reveal-on-scroll intro and full sidebar customization.
 *
 * All motion and continuous effects are disabled in static rendering
 * contexts (canvas, exports, thumbnails) via useIsStaticRenderer().
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 450
 * @framerDisableUnlink
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

// Framer stores partial objects when a user edits a single nested field, so
// every object prop is merged against these before any value is read.
const D_LABELS = {
    show: true,
    beforeText: "Before",
    afterText: "After",
    background: "rgba(0,0,0,0.55)",
    text: "#FFFFFF",
    hideBelow: 360,
}

const D_HANDLE = {
    size: 48,
    background: "#FFFFFF",
    iconColor: "#111111",
    accent: "#FF6B35",
    dividerColor: "#FFFFFF",
    dividerWidth: 2,
}

const D_CAPTION = {
    show: true,
    title: "Neon Nights // Tokyo",
    hint: "Drag to compare",
    titleColor: "#FFFFFF",
    hintColor: "rgba(255,255,255,0.5)",
    titleFont: { fontFamily: "Inter", fontWeight: 700, fontSize: 24 },
    hintFont: { fontFamily: "Inter", fontWeight: 400, fontSize: 14 },
}

const D_ZOOM = { enabled: false, amount: 1.15 }
const D_INTRO = {
    enabled: true,
    style: "sweep",
    from: 92,
    duration: 1.2,
    delay: 0.2,
}
const D_ANIMATION = { enabled: true, speed: 0.35 }

const RATIOS = {
    fill: null,
    "16/9": "16 / 9",
    "4/3": "4 / 3",
    "1/1": "1 / 1",
    "3/4": "3 / 4",
}

// Placeholders are pure CSS gradients — no SVG markup is ever generated or
// inserted into the DOM, and nothing is rendered with dangerouslySetInnerHTML.
const PLACEHOLDER_BEFORE = [
    "radial-gradient(circle at 31% 32%, rgba(140,140,140,0.50) 0%, rgba(140,140,140,0) 28%)",
    "radial-gradient(circle at 70% 68%, rgba(96,96,96,0.45) 0%, rgba(96,96,96,0) 34%)",
    "linear-gradient(135deg, #4A4A4A 0%, #111111 100%)",
].join(", ")

const PLACEHOLDER_AFTER = [
    "radial-gradient(circle at 31% 32%, rgba(34,196,166,0.55) 0%, rgba(34,196,166,0) 28%)",
    "radial-gradient(circle at 70% 68%, rgba(242,169,59,0.45) 0%, rgba(242,169,59,0) 34%)",
    "linear-gradient(135deg, #0F5C57 0%, #0A1D2B 100%)",
].join(", ")

const clamp = (v: number) => Math.min(100, Math.max(0, v))

export default function Reveal(props) {
    const {
        beforeImage,
        afterImage,
        aspectRatio = "16/9",
        imageFit = "cover",
        backdrop = "#000000",
        startPosition = 45,
        radius = 16,
        shadow = "0 24px 60px rgba(0,0,0,0.45)",
    } = props

    const L = { ...D_LABELS, ...(props.labels || {}) }
    const H = { ...D_HANDLE, ...(props.handle || {}) }
    const C = { ...D_CAPTION, ...(props.caption || {}) }
    const Z = { ...D_ZOOM, ...(props.zoom || {}) }
    const I = { ...D_INTRO, ...(props.intro || {}) }
    const A = { ...D_ANIMATION, ...(props.animation || {}) }

    // True on the Framer canvas AND during exports / thumbnail generation.
    const isStatic = useIsStaticRenderer()
    const ratio = RATIOS[aspectRatio] ?? null

    const frameRef = React.useRef<HTMLDivElement>(null)
    const draggingRef = React.useRef(false)
    const rafRef = React.useRef<number | null>(null)
    const pendingRef = React.useRef<number | null>(null)
    const timersRef = React.useRef<any[]>([])
    const introSpentRef = React.useRef(false)

    const introReady = I.enabled && I.style === "sweep" && !isStatic

    const [position, setPosition] = React.useState(() =>
        introReady ? clamp(I.from) : clamp(startPosition)
    )
    const [isDragging, setIsDragging] = React.useState(false)
    const [isHovering, setIsHovering] = React.useState(false)
    const [focusRing, setFocusRing] = React.useState(false)
    const [reducedMotion, setReducedMotion] = React.useState(false)
    const [frameW, setFrameW] = React.useState(0)
    const [motionMode, setMotionMode] = React.useState("idle") // idle | intro | key

    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout)
        timersRef.current = []
    }

    // --- Reduced motion ---------------------------------------------------

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => {
            setReducedMotion(mq.matches)
            if (mq.matches) {
                introSpentRef.current = true
                clearTimers()
                setMotionMode("idle")
                setPosition(clamp(startPosition))
            }
        }
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // --- Measure for responsive `sizes` and label auto-hide ---------------

    React.useEffect(() => {
        const el = frameRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width
            if (w) setFrameW(Math.round(w))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // --- Keep the static preview synced to the sidebar --------------------

    React.useEffect(() => {
        if (isStatic) setPosition(clamp(startPosition))
    }, [startPosition, isStatic])

    // --- Reveal on scroll -------------------------------------------------

    React.useEffect(() => {
        if (isStatic || !I.enabled || reducedMotion) return
        const el = frameRef.current
        if (!el) return

        // Without IntersectionObserver the intro can never fire, so settle at
        // the resting position rather than stranding the divider at "From".
        if (typeof IntersectionObserver === "undefined") {
            introSpentRef.current = true
            setPosition(clamp(startPosition))
            return
        }

        const run = () => {
            const delay = Math.max(0, I.delay) * 1000
            const dur = Math.max(0.2, I.duration) * 1000

            if (I.style === "peek") {
                timersRef.current.push(
                    setTimeout(() => {
                        setMotionMode("intro")
                        setPosition(clamp(I.from))
                    }, delay)
                )
                timersRef.current.push(
                    setTimeout(
                        () => setPosition(clamp(startPosition)),
                        delay + dur / 2
                    )
                )
            } else {
                timersRef.current.push(
                    setTimeout(() => {
                        setMotionMode("intro")
                        setPosition(clamp(startPosition))
                    }, delay)
                )
            }
            timersRef.current.push(
                setTimeout(() => setMotionMode("idle"), delay + dur + 60)
            )
        }

        const io = new IntersectionObserver(
            (entries) => {
                for (const en of entries) {
                    if (!en.isIntersecting || introSpentRef.current) continue
                    introSpentRef.current = true
                    io.disconnect()
                    run()
                }
            },
            { threshold: 0.35 }
        )
        io.observe(el)
        return () => io.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isStatic,
        I.enabled,
        I.style,
        I.from,
        I.duration,
        I.delay,
        reducedMotion,
    ])

    React.useEffect(
        () => () => {
            clearTimers()
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
        },
        []
    )

    // --- Pointer interaction ----------------------------------------------

    const positionFromPointer = (e) => {
        const rect = frameRef.current?.getBoundingClientRect()
        if (!rect || !rect.width) return position
        return clamp(((e.clientX - rect.left) / rect.width) * 100)
    }

    // Pointer moves are coalesced to one state update per animation frame.
    const schedule = (val) => {
        pendingRef.current = val
        if (rafRef.current != null) return
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            if (pendingRef.current != null) setPosition(pendingRef.current)
        })
    }

    const cancelIntro = () => {
        introSpentRef.current = true
        clearTimers()
        setMotionMode("idle")
    }

    const onPointerDown = (e) => {
        if (isStatic) return
        cancelIntro()
        frameRef.current?.setPointerCapture?.(e.pointerId)
        // Focus explicitly — preventDefault below would otherwise swallow it.
        frameRef.current?.focus?.({ preventScroll: true })
        e.preventDefault()
        draggingRef.current = true
        setIsDragging(true)
        setPosition(positionFromPointer(e))
    }

    const onPointerMove = (e) => {
        if (draggingRef.current) {
            schedule(positionFromPointer(e))
            return
        }
        if (!Z.enabled || isStatic || reducedMotion) return
        // Zoom origin is written straight to CSS variables — no re-render.
        const el = frameRef.current
        const rect = el?.getBoundingClientRect()
        if (!el || !rect || !rect.width || !rect.height) return
        el.style.setProperty(
            "--rv-zx",
            `${clamp(((e.clientX - rect.left) / rect.width) * 100)}%`
        )
        el.style.setProperty(
            "--rv-zy",
            `${clamp(((e.clientY - rect.top) / rect.height) * 100)}%`
        )
    }

    const endDrag = (e) => {
        if (!draggingRef.current) return
        draggingRef.current = false
        setIsDragging(false)
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            if (pendingRef.current != null) setPosition(pendingRef.current)
        }
        frameRef.current?.releasePointerCapture?.(e.pointerId)
    }

    // --- Keyboard ---------------------------------------------------------

    const onKeyDown = (e) => {
        if (isStatic) return
        const step = e.shiftKey ? 10 : 2
        const dec = e.key === "ArrowLeft" || e.key === "ArrowDown"
        const inc = e.key === "ArrowRight" || e.key === "ArrowUp"
        if (!dec && !inc && e.key !== "Home" && e.key !== "End") return

        e.preventDefault()
        cancelIntro()
        setMotionMode("key")
        if (e.key === "Home") setPosition(0)
        else if (e.key === "End") setPosition(100)
        else setPosition((p) => clamp(p + (inc ? step : -step)))
    }

    const onFocus = (e) => {
        try {
            setFocusRing(e.currentTarget.matches(":focus-visible"))
        } catch {
            setFocusRing(true)
        }
    }

    // --- Derived styles ---------------------------------------------------

    const animationsOn = A.enabled && !reducedMotion && !isStatic

    let dur: number | null = null
    if (isStatic || isDragging) dur = null
    else if (motionMode === "intro") dur = Math.max(0.2, I.duration)
    else if (motionMode === "key") dur = 0.12
    else if (animationsOn) dur = Math.max(0.05, A.speed)

    const posTransition = dur
        ? `left ${dur}s ${EASE}, clip-path ${dur}s ${EASE}`
        : "none"

    // Zoom is gated on reduced motion and static rendering only — never on
    // the Animation toggle, which controls divider easing.
    const zoomActive =
        Z.enabled && isHovering && !isDragging && !isStatic && !reducedMotion

    const zoomStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        transform: `scale(${zoomActive ? Z.amount : 1})`,
        transformOrigin: "var(--rv-zx, 50%) var(--rv-zy, 50%)",
        transition:
            isStatic || reducedMotion ? "none" : `transform 0.45s ${EASE}`,
        willChange: "transform",
    }

    const showLabels = L.show && (frameW === 0 || frameW > L.hideBelow)
    const sizes = frameW ? `${frameW}px` : undefined
    const frameRing = focusRing ? `0 0 0 3px ${H.accent}` : null

    // Rest 1px, hover or keyboard focus 3px, dragging 3px plus scale.
    const handleRing = isDragging || isHovering || focusRing ? 3 : 1

    const labelBase: React.CSSProperties = {
        position: "absolute",
        top: 16,
        padding: "8px 14px",
        borderRadius: 999,
        background: L.background,
        color: L.text,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 3,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        fontFamily: "Inter, system-ui, sans-serif",
    }

    const before = resolveImage(beforeImage)
    const after = resolveImage(afterImage)

    return (
        <div
            style={{
                width: "100%",
                height: ratio ? "auto" : "100%",
                display: "flex",
                flexDirection: "column",
                gap: 16,
            }}
        >
            <div
                ref={frameRef}
                role="slider"
                aria-label="Before and after image comparison"
                aria-orientation="horizontal"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(position)}
                aria-valuetext={`Divider at ${Math.round(position)} percent`}
                tabIndex={isStatic ? -1 : 0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onPointerEnter={() => setIsHovering(true)}
                onPointerLeave={() => setIsHovering(false)}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={() => setFocusRing(false)}
                style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: ratio || undefined,
                    flex: ratio ? "none" : 1,
                    minHeight: 0,
                    borderRadius: radius,
                    overflow: "hidden",
                    boxShadow: [shadow, frameRing].filter(Boolean).join(", "),
                    cursor: isStatic ? "default" : "ew-resize",
                    touchAction: "pan-y",
                    outline: "none",
                    background: imageFit === "contain" ? backdrop : "#000000",
                }}
            >
                {/* BEFORE — full bleed */}
                <div style={{ position: "absolute", inset: 0 }}>
                    <div style={zoomStyle}>
                        <Layer
                            data={before}
                            alt={L.beforeText}
                            sizes={sizes}
                            fit={imageFit}
                            placeholder={PLACEHOLDER_BEFORE}
                        />
                    </div>
                </div>

                {/* AFTER — clipped past the divider */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        clipPath: `inset(0 0 0 ${position}%)`,
                        transition: posTransition,
                    }}
                >
                    <div style={zoomStyle}>
                        <Layer
                            data={after}
                            alt={L.afterText}
                            sizes={sizes}
                            fit={imageFit}
                            placeholder={PLACEHOLDER_AFTER}
                        />
                    </div>
                </div>

                {showLabels && (
                    <>
                        <div style={{ ...labelBase, left: 16 }}>
                            {L.beforeText}
                        </div>
                        <div style={{ ...labelBase, right: 16 }}>
                            {L.afterText}
                        </div>
                    </>
                )}

                {/* Divider */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${position}%`,
                        width: H.dividerWidth,
                        marginLeft: -H.dividerWidth / 2,
                        background: H.dividerColor,
                        zIndex: 2,
                        transition: posTransition,
                        pointerEvents: "none",
                    }}
                />

                {/* Handle */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: `${position}%`,
                        transform: `translate(-50%, -50%) scale(${isDragging ? 1.08 : 1})`,
                        width: H.size,
                        height: H.size,
                        borderRadius: "50%",
                        background: H.background,
                        boxShadow: `0 2px 12px rgba(0,0,0,0.35), 0 0 0 ${handleRing}px ${H.accent}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: H.size * 0.14,
                        zIndex: 4,
                        transition: isStatic
                            ? "none"
                            : posTransition === "none"
                              ? "transform 0.2s ease, box-shadow 0.2s ease"
                              : `${posTransition}, transform 0.2s ease, box-shadow 0.2s ease`,
                        pointerEvents: "none",
                    }}
                >
                    <Chevron dir="left" color={H.iconColor} size={H.size} />
                    <Chevron dir="right" color={H.iconColor} size={H.size} />
                </div>
            </div>

            {C.show && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ color: C.titleColor, ...C.titleFont }}>
                        {C.title}
                    </div>
                    <div style={{ color: C.hintColor, ...C.hintFont }}>
                        {C.hint}
                    </div>
                </div>
            )}
        </div>
    )
}

// --- Helpers --------------------------------------------------------------

function resolveImage(img) {
    if (!img?.src) return null
    return {
        src: img.src,
        srcSet: img.srcSet,
        alt: img.alt,
        position: `${img.positionX ?? "center"} ${img.positionY ?? "center"}`,
    }
}

function Layer({ data, alt, sizes, fit, placeholder }) {
    const base: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        userSelect: "none",
    }

    if (!data) {
        // CSS-gradient stand-in so the component reads as a real product the
        // moment it is dropped in, and never renders as an empty black box.
        return (
            <div
                aria-hidden="true"
                style={{ ...base, backgroundImage: placeholder }}
            />
        )
    }

    return (
        <img
            src={data.src}
            srcSet={data.srcSet}
            sizes={data.srcSet ? sizes : undefined}
            alt={data.alt || alt || ""}
            decoding="async"
            draggable={false}
            style={{
                ...base,
                objectFit: fit === "contain" ? "contain" : "cover",
                objectPosition: data.position,
            }}
        />
    )
}

function Chevron({ dir, color, size }) {
    const s = Math.max(10, size * 0.24)
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: "block" }}
        >
            <path
                d={
                    dir === "left"
                        ? "M14 6 L8 12 L14 18"
                        : "M10 6 L16 12 L10 18"
                }
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// --- Defaults -------------------------------------------------------------

// Property Control defaults only apply to instances configured on the Canvas.
// These cover instances created in code, per Framer's guidance. The destructured
// defaults inside the component remain the runtime safety net, since they also
// handle partially-filled object props, which defaultProps cannot.
Reveal.defaultProps = {
    aspectRatio: "16/9",
    imageFit: "cover",
    backdrop: "#000000",
    startPosition: 45,
    radius: 16,
    shadow: "0 24px 60px rgba(0,0,0,0.45)",
    labels: D_LABELS,
    handle: D_HANDLE,
    caption: D_CAPTION,
    zoom: D_ZOOM,
    intro: D_INTRO,
    animation: D_ANIMATION,
}

// --- Property controls ----------------------------------------------------

addPropertyControls(Reveal, {
    beforeImage: { type: ControlType.ResponsiveImage, title: "Before" },
    afterImage: { type: ControlType.ResponsiveImage, title: "After" },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Size",
        options: ["16/9", "4/3", "1/1", "3/4", "fill"],
        optionTitles: ["16 : 9", "4 : 3", "1 : 1", "3 : 4", "Fill Height"],
        defaultValue: "16/9",
        description:
            "Use a ratio with the frame height set to Fit. Choose Fill Height only when the frame has a fixed height.",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        displaySegmentedControl: true,
        defaultValue: "cover",
    },
    backdrop: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "#000000",
        hidden: (p) => p.imageFit !== "contain",
    },
    startPosition: {
        type: ControlType.Number,
        title: "Start At",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 45,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        defaultValue: 16,
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 24px 60px rgba(0,0,0,0.45)",
    },
    intro: {
        type: ControlType.Object,
        title: "Reveal on Scroll",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["sweep", "peek"],
                optionTitles: ["Sweep", "Peek"],
                displaySegmentedControl: true,
                defaultValue: "sweep",
                hidden: (p) => !p.enabled,
            },
            from: {
                type: ControlType.Number,
                title: "From",
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: 92,
                hidden: (p) => !p.enabled,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.3,
                max: 3,
                step: 0.1,
                unit: "s",
                defaultValue: 1.2,
                hidden: (p) => !p.enabled,
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                min: 0,
                max: 2,
                step: 0.05,
                unit: "s",
                defaultValue: 0.2,
                hidden: (p) => !p.enabled,
            },
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            beforeText: {
                type: ControlType.String,
                title: "Before",
                defaultValue: "Before",
                hidden: (p) => !p.show,
            },
            afterText: {
                type: ControlType.String,
                title: "After",
                defaultValue: "After",
                hidden: (p) => !p.show,
            },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgba(0,0,0,0.55)",
                hidden: (p) => !p.show,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
                hidden: (p) => !p.show,
            },
            hideBelow: {
                type: ControlType.Number,
                title: "Hide Below",
                min: 0,
                max: 800,
                unit: "px",
                defaultValue: 360,
                hidden: (p) => !p.show,
            },
        },
    },
    handle: {
        type: ControlType.Object,
        title: "Handle",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 32,
                max: 80,
                defaultValue: 48,
            },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
            },
            iconColor: {
                type: ControlType.Color,
                title: "Arrows",
                defaultValue: "#111111",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent Ring",
                defaultValue: "#FF6B35",
            },
            dividerColor: {
                type: ControlType.Color,
                title: "Divider",
                defaultValue: "#FFFFFF",
            },
            dividerWidth: {
                type: ControlType.Number,
                title: "Divider Width",
                min: 1,
                max: 8,
                defaultValue: 2,
            },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Caption",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Neon Nights // Tokyo",
                hidden: (p) => !p.show,
            },
            hint: {
                type: ControlType.String,
                title: "Hint",
                defaultValue: "Drag to compare",
                hidden: (p) => !p.show,
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 24, fontWeight: 700 },
                hidden: (p) => !p.show,
            },
            hintFont: {
                type: ControlType.Font,
                title: "Hint Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 14 },
                hidden: (p) => !p.show,
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#FFFFFF",
                hidden: (p) => !p.show,
            },
            hintColor: {
                type: ControlType.Color,
                title: "Hint Color",
                defaultValue: "rgba(255,255,255,0.5)",
                hidden: (p) => !p.show,
            },
        },
    },
    zoom: {
        type: ControlType.Object,
        title: "Hover Zoom",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: false,
            },
            amount: {
                type: ControlType.Number,
                title: "Amount",
                min: 1.05,
                max: 1.6,
                step: 0.05,
                defaultValue: 1.15,
                hidden: (p) => !p.enabled,
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.1,
                max: 1,
                step: 0.05,
                unit: "s",
                defaultValue: 0.35,
                hidden: (p) => !p.enabled,
            },
        },
    },
})
