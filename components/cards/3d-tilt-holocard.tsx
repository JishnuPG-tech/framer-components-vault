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
 * HoloCard — Holographic Tilt Card
 *
 * A metallic card with a living holographic finish. At rest it breathes:
 * a slow 3D tilt loop while the iridescent gradient and a light sweep move
 * AGAINST the tilt — that counter-parallax is what makes it read as light
 * on foil instead of a printed gradient. On hover the tilt follows the
 * cursor with a tracking glare, then eases back into the idle loop.
 *
 * Five built-in content arrangements, or drop in your own Framer frame and
 * the shell applies the holographic treatment over it.
 *
 * All motion is disabled in static rendering contexts (canvas, exports,
 * thumbnails) and for reduced-motion visitors, which both render a frozen
 * but visually complete holographic state.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 640
 * @framerDisableUnlink
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NATIVE_W = 400
const NATIVE_H = 640

const SANS_FALLBACK =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const MONO_FALLBACK =
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

// The sweep's resting position for every still state.
const FROZEN_SWEEP = "translateX(38%) skewX(-18deg)"

const SPECTRA = {
    aurora: ["#5EEAD4", "#A78BFA", "#F0ABFC", "#FCD34D"],
    chrome: ["#E2E8F0", "#94A3B8", "#F8FAFC", "#CBD5E1"],
    sunset: ["#FCA5A5", "#FCD34D", "#F0ABFC", "#FDBA74"],
    neon: ["#4ADE80", "#22D3EE", "#A78BFA", "#F472B6"],
}
const CYCLE_ORDER = ["aurora", "chrome", "sunset", "neon"]

// Presets are proportion changes, not separate components. Each sets the
// Fit-mode aspect ratio, title treatment, value hierarchy and vertical
// weight — the things that make a gift card read differently from a ticket.
// They never touch the buyer's content or their Barcode/Seal toggles.
const PRESETS = {
    ticket: {
        ratio: [400, 640],
        valueMode: "pairArrow",
        heroScale: 1,
        titleScale: 1,
        align: "center",
        valuePos: "center",
        padY: 1,
        blockScale: 1,
    },
    membership: {
        ratio: [400, 252],
        valueMode: "single",
        heroScale: 0.8,
        titleScale: 0.42,
        align: "left",
        valuePos: "end",
        padY: 0.6,
        blockScale: 0.62,
    },
    gift: {
        ratio: [400, 252],
        valueMode: "single",
        heroScale: 1.6,
        titleScale: 0.42,
        align: "left",
        valuePos: "center",
        padY: 0.6,
        blockScale: 0.62,
    },
    event: {
        ratio: [400, 640],
        valueMode: "pair",
        heroScale: 1,
        titleScale: 1,
        align: "center",
        valuePos: "center",
        padY: 1,
        blockScale: 1.3,
    },
    stat: {
        ratio: [400, 400],
        valueMode: "single",
        heroScale: 1.9,
        titleScale: 0.5,
        align: "center",
        valuePos: "center",
        padY: 0.8,
        blockScale: 0.8,
    },
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/** Deterministic bar units from the id string. */
function barUnits(id, count) {
    const out = []
    let h = 2166136261
    const src = id || "0"
    for (let i = 0; i < src.length; i++) {
        h ^= src.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    for (let i = 0; i < count; i++) {
        h ^= h << 13
        h ^= h >>> 17
        h ^= h << 5
        out.push(1 + (Math.abs(h) % 4))
    }
    return out
}

function useMedia(query) {
    const [match, setMatch] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia(query)
        const update = () => setMatch(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [query])
    return match
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HoloCard(props) {
    const {
        // Sizing
        sizing = "fit",
        cardWidth = NATIVE_W,
        cardHeight = NATIVE_H,
        borderRadius = 18,
        // Content
        contentMode = "preset",
        preset = "ticket",
        customFrame,
        title = "NACHTZUG",
        titleSize = 58,
        subtitle = "ALPINE SLEEPER · ZÜRICH — VENEZIA",
        leftValue = "23:40",
        leftLabel = "ZÜRICH HB",
        rightValue = "08:15",
        rightLabel = "VENEZIA S.L.",
        detailsLine = "GLEIS/BINARIO 4 · WAGEN/CARROZZA 12 · ABTEIL/CABINA 7B",
        showBarcode = true,
        barcodeId = "AS-2317-0642",
        showSeal = true,
        sealText = "VALID",
        // Effect
        spectrum = "aurora",
        customA = "#5EEAD4",
        customB = "#A78BFA",
        customC = "#F0ABFC",
        customD = "#FCD34D",
        cycleOnTap = false,
        holoIntensity = 0.75,
        motion = "both",
        tiltAmount = 7,
        idleSpeed = 1,
        // Style
        baseColor = "#14121F",
        textColor = "#C8CDD6",
        font,
        monoFont,
        // Interaction
        link,
        linkNewTab = false,
        style,
    } = props

    // -- Render context -------------------------------------------------
    // Covers the Framer canvas, exports and thumbnail generation.
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useMedia("(prefers-reduced-motion: reduce)")

    const motionOn = motion !== "off" && !reducedMotion && !isStatic
    const idleOn = motionOn && (motion === "both" || motion === "idle")
    const hoverOn = motionOn && (motion === "both" || motion === "hover")
    const animate = idleOn || hoverOn

    // -- Spectrum -------------------------------------------------------
    const [spectrumStep, setSpectrumStep] = React.useState(0)
    // Changing the base spectrum in the sidebar resets any tap offset.
    React.useEffect(() => setSpectrumStep(0), [spectrum])

    const isCustomSpectrum = spectrum === "custom"
    const activeKey = isCustomSpectrum
        ? "custom"
        : CYCLE_ORDER[
              (Math.max(0, CYCLE_ORDER.indexOf(spectrum)) + spectrumStep) %
                  CYCLE_ORDER.length
          ]
    const colors = isCustomSpectrum
        ? [customA, customB, customC, customD]
        : (SPECTRA[activeKey] ?? SPECTRA.aurora)

    const holoGradient = `linear-gradient(115deg, ${colors[0]} 0%, ${colors[1]} 30%, ${colors[2]} 55%, ${colors[3]} 80%, ${colors[0]} 100%)`
    const accent = colors[1] || colors[0]

    // -- Interaction model ----------------------------------------------
    // Link wins over Tap Cycles so the two never fight for the same gesture.
    const hasLink = !!link
    // Also excluded on a custom spectrum: the control is hidden there, but a
    // stale prop on an existing instance would otherwise leave a focusable
    // button that claims to change a finish it cannot change.
    const tapCycles = cycleOnTap && !hasLink && !isStatic && !isCustomSpectrum
    const interactive = hasLink || tapCycles

    const cycle = React.useCallback(() => {
        if (tapCycles) setSpectrumStep((s) => s + 1)
    }, [tapCycles])

    // -- Refs -----------------------------------------------------------
    const rootRef = React.useRef(null)
    const cardRef = React.useRef(null)
    const holoRef = React.useRef(null)
    const sweepRef = React.useRef(null)
    const glareRef = React.useRef(null)
    const titleRef = React.useRef(null)
    const titleWrapRef = React.useRef(null)
    const pointer = React.useRef({ x: 0, y: 0, over: false })
    const tilt = React.useRef({ x: 0, y: 0 })

    const [measured, setMeasured] = React.useState({ w: NATIVE_W, h: NATIVE_H })
    const [hoverActive, setHoverActive] = React.useState(false)
    const [onScreen, setOnScreen] = React.useState(true)
    const [pageVisible, setPageVisible] = React.useState(true)
    const [focusRing, setFocusRing] = React.useState(false)
    const [titleFit, setTitleFit] = React.useState(1)

    // -- Measure card width for adaptive type and layout -----------------
    React.useEffect(() => {
        const el = cardRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (r?.width && r?.height)
                setMeasured({ w: Math.round(r.width), h: Math.round(r.height) })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Scale factor drives every size in the card, so nothing is hardcoded
    // to a 400px-wide card.
    const cfg = PRESETS[preset] ?? PRESETS.ticket
    const isCustomContent = contentMode === "custom"

    // Each preset has its own native size, so the scale factor is measured
    // against that rather than always against the portrait ticket. Reading
    // both axes means an off-ratio card in Fixed mode scales its type down
    // instead of overflowing.
    const [natW, natH] = isCustomContent ? [NATIVE_W, NATIVE_H] : cfg.ratio
    const s = clamp(Math.min(measured.w / natW, measured.h / natH), 0.55, 1.8)
    const padX = Math.round(36 * s)
    const padTop = Math.round(44 * s * cfg.padY)
    const padBottom = Math.round(36 * s * cfg.padY)
    const contentW = Math.max(40, measured.w - padX * 2)

    // -- Shrink long titles to fit instead of clipping or wrapping -------
    React.useLayoutEffect(() => {
        const el = titleRef.current
        const wrap = titleWrapRef.current
        if (!el || !wrap) return
        setTitleFit(1)
        const measure = () => {
            const avail = wrap.clientWidth
            const needed = el.scrollWidth
            setTitleFit(
                needed > avail && avail > 0
                    ? clamp((avail / needed) * 0.98, 0.45, 1)
                    : 1
            )
        }
        const id = requestAnimationFrame(measure)
        // Re-measure once webfonts settle — the first pass can measure a
        // fallback face and under- or over-shrink the title.
        try {
            document.fonts?.ready?.then(() => requestAnimationFrame(measure))
        } catch {}
        return () => cancelAnimationFrame(id)
    }, [
        title,
        titleSize,
        measured.w,
        contentMode,
        preset,
        font?.fontFamily,
        font?.fontWeight,
        font?.fontStyle,
        font?.letterSpacing,
    ])

    // -- Pause work when off-screen or the tab is hidden -----------------
    React.useEffect(() => {
        const el = cardRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
            { rootMargin: "120px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    React.useEffect(() => {
        if (typeof document === "undefined") return
        const update = () => setPageVisible(!document.hidden)
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])

    // Hover Only requests no frames while nobody is interacting — it spins up
    // on a fine pointer and shuts down once the tilt has settled back to rest.
    const running =
        (idleOn || (hoverOn && hoverActive)) && onScreen && pageVisible

    // -- The clock -------------------------------------------------------
    React.useEffect(() => {
        if (!running) return
        let raf = 0
        const t0 = performance.now()
        const tick = (now) => {
            raf = requestAnimationFrame(tick)
            const t = ((now - t0) / 1000) * idleSpeed
            const p = pointer.current

            const idleX = idleOn
                ? Math.sin((t * Math.PI * 2) / 6.5) * tiltAmount * 0.55
                : 0
            const idleY = idleOn
                ? Math.cos((t * Math.PI * 2) / 8.2) * tiltAmount * 0.4
                : 0
            const following = hoverOn && p.over
            const tx = following ? p.y * -tiltAmount : idleY
            const ty = following ? p.x * tiltAmount : idleX

            tilt.current.x += (tx - tilt.current.x) * 0.08
            tilt.current.y += (ty - tilt.current.y) * 0.08
            const rx = tilt.current.x
            const ry = tilt.current.y

            const card = cardRef.current
            if (card)
                card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`

            // Counter-parallax: the foil moves against the tilt.
            const holo = holoRef.current
            if (holo)
                holo.style.backgroundPosition = `${50 - ry * 4}% ${50 - rx * 4}%`
            const titleEl = titleRef.current
            if (titleEl)
                titleEl.style.backgroundPosition = `${50 - ry * 6}% ${50 - rx * 6}%`

            const sweep = sweepRef.current
            if (sweep && idleOn) {
                const travel = ((t / 7) % 1) * 260 - 80
                sweep.style.transform = `translateX(${travel - ry * 3}%) skewX(-18deg)`
            }

            // Hover Only: once the pointer is gone and the tilt has eased back
            // to rest, snap to exact zero and stop requesting frames.
            if (
                !idleOn &&
                !following &&
                Math.abs(rx) < 0.02 &&
                Math.abs(ry) < 0.02
            ) {
                tilt.current.x = 0
                tilt.current.y = 0
                if (card) card.style.transform = "rotateX(0deg) rotateY(0deg)"
                if (holo) holo.style.backgroundPosition = "50% 50%"
                if (titleEl) titleEl.style.backgroundPosition = "50% 50%"
                setHoverActive(false)
            }
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [running, idleOn, hoverOn, tiltAmount, idleSpeed])

    // -- Reset the directly-written DOM state whenever motion stops --------
    // The loop writes transforms and background positions outside React, so
    // React will not clear them on its own. Without this, switching Motion to
    // Off or triggering reduced motion would freeze the card mid-tilt.
    React.useEffect(() => {
        if (animate) return
        tilt.current.x = 0
        tilt.current.y = 0
        pointer.current.over = false
        setHoverActive(false)
        const card = cardRef.current
        if (card) card.style.transform = "rotateX(0deg) rotateY(0deg)"
        const holo = holoRef.current
        if (holo) holo.style.backgroundPosition = "50% 50%"
        const titleEl = titleRef.current
        if (titleEl) titleEl.style.backgroundPosition = "50% 50%"
        const glare = glareRef.current
        if (glare) glare.style.opacity = "0"
        const sweep = sweepRef.current
        if (sweep) sweep.style.transform = FROZEN_SWEEP
    }, [animate])

    // -- Pointer ---------------------------------------------------------
    // Only mouse and pen drive the tilt. Touch keeps the idle loop so page
    // scrolling is never intercepted.
    const isFinePointer = (e) =>
        e.pointerType === "mouse" || e.pointerType === "pen"

    const onPointerEnter = (e) => {
        if (hoverOn && isFinePointer(e)) setHoverActive(true)
    }

    const onPointerMove = (e) => {
        if (!hoverOn || !isFinePointer(e)) return
        if (!hoverActive) setHoverActive(true)
        const el = cardRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) return
        const px = ((e.clientX - r.left) / r.width) * 2 - 1
        const py = ((e.clientY - r.top) / r.height) * 2 - 1
        pointer.current.x = px
        pointer.current.y = py
        pointer.current.over = true
        // Written here rather than every frame — the gradient only changes
        // when the pointer actually moves.
        const glare = glareRef.current
        if (glare) {
            glare.style.opacity = "0.35"
            glare.style.background = `radial-gradient(circle at ${(px + 1) * 50}% ${(py + 1) * 50}%, rgba(255,255,255,0.8), transparent 55%)`
        }
    }

    const onPointerLeave = () => {
        pointer.current.over = false
        const glare = glareRef.current
        if (glare) glare.style.opacity = "0"
    }

    const onKeyDown = (e) => {
        if (!tapCycles) return
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            cycle()
        }
    }

    const onFocus = (e) => {
        if (!interactive) return
        try {
            setFocusRing(e.currentTarget.matches(":focus-visible"))
        } catch {
            setFocusRing(true)
        }
    }

    // -- Derived layout --------------------------------------------------
    const intensity = clamp(holoIntensity, 0, 1)
    // The buyer's own frame sits under the foil so it actually receives the
    // treatment. Preset content sits above it, because the preset title
    // carries its own foil fill.
    const foilAbove = isCustomContent

    const sealSize = Math.round(54 * s * cfg.blockScale)
    const sansFamily = font?.fontFamily ? undefined : SANS_FALLBACK
    const monoStyle = { fontFamily: MONO_FALLBACK, ...monoFont }

    // Barcode fits the available width exactly and reserves room for the seal.
    const barcode = React.useMemo(() => {
        const reserve = showSeal ? sealSize + 14 * s : 0
        const avail = Math.max(40, contentW - reserve)
        const gap = Math.max(1, 2 * s)
        const count = clamp(Math.round(avail / (7 * s)), 18, 64)
        const units = barUnits(barcodeId, count)
        const total = units.reduce((a, b) => a + b, 0)
        const unitPx = Math.max(0.5, (avail - (count - 1) * gap) / total)
        return { units, gap, unitPx, avail }
    }, [barcodeId, contentW, showSeal, sealSize, s])

    // -- Static / frozen presentation ------------------------------------
    // A still card that still reads as holographic: foil centred, sweep
    // parked mid-card, no tilt.
    const frozen = !motionOn

    // -- Shell styles ----------------------------------------------------
    const rootStyle =
        sizing === "fit"
            ? { width: "100%", aspectRatio: `${natW} / ${natH}` }
            : { width: cardWidth, height: cardHeight }

    const Tag = hasLink ? "a" : "div"
    // A non-interactive card carries no role, so its own content provides the
    // semantics. A Custom Frame must never be announced with preset text the
    // buyer replaced, and a link's <a> is already correct natively.
    const role = tapCycles ? "button" : undefined
    const label = tapCycles
        ? isCustomContent
            ? "Change the card finish"
            : `${title} — ${subtitle}. Activate to change the finish.`
        : undefined

    const foilLayers = (
        <>
            <div
                ref={holoRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    background: holoGradient,
                    backgroundSize: "220% 220%",
                    backgroundPosition: "50% 50%",
                    opacity: 0.16 * intensity,
                    mixBlendMode: "screen",
                    pointerEvents: "none",
                }}
            />
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                <div
                    ref={sweepRef}
                    style={{
                        position: "absolute",
                        top: "-20%",
                        bottom: "-20%",
                        left: 0,
                        width: "34%",
                        transform: frozen
                            ? FROZEN_SWEEP
                            : "translateX(-80%) skewX(-18deg)",
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
                        opacity: intensity,
                    }}
                />
            </div>
            <div
                ref={glareRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                    mixBlendMode: "overlay",
                    pointerEvents: "none",
                }}
            />
        </>
    )

    // -- Preset content --------------------------------------------------
    const valueBlock = (value, lbl, scale) => (
        <div style={{ textAlign: cfg.align, minWidth: 0 }}>
            <div
                style={{
                    fontSize: Math.round(44 * s * scale),
                    fontWeight: 700,
                    lineHeight: 1.05,
                    color: "#EDEFF3",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.01em",
                    // Values are single tokens — never break inside "23:40".
                    whiteSpace: "nowrap",
                }}
            >
                {value}
            </div>
            {lbl ? (
                <div
                    style={{
                        marginTop: Math.round(10 * s),
                        fontSize: Math.max(8, 11 * s),
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        color: textColor,
                        opacity: 0.75,
                        overflowWrap: "anywhere",
                    }}
                >
                    {lbl}
                </div>
            ) : null}
        </div>
    )

    const presetContent = (
        <div
            style={{
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                padding: `${padTop}px ${padX}px ${padBottom}px`,
                boxSizing: "border-box",
            }}
        >
            <div
                ref={titleWrapRef}
                style={{ width: "100%", overflow: "hidden" }}
            >
                <div
                    ref={titleRef}
                    style={{
                        fontSize: Math.round(
                            titleSize * s * cfg.titleScale * titleFit
                        ),
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                        lineHeight: 0.95,
                        textAlign: cfg.align,
                        whiteSpace: "nowrap",
                        backgroundImage: holoGradient,
                        backgroundSize: "240% 240%",
                        backgroundPosition: "50% 50%",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
                    }}
                >
                    {title}
                </div>
            </div>

            {subtitle ? (
                <div
                    style={{
                        marginTop: Math.round(16 * s * cfg.padY),
                        textAlign: cfg.align,
                        fontSize: Math.max(8.5, 11.5 * s),
                        fontWeight: 700,
                        letterSpacing: "0.22em",
                        color: textColor,
                        opacity: 0.85,
                        overflowWrap: "anywhere",
                        ...monoStyle,
                    }}
                >
                    {subtitle}
                </div>
            ) : null}

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: cfg.valuePos === "end" ? "flex-end" : "center",
                    justifyContent:
                        cfg.align === "left" ? "flex-start" : "center",
                    gap: Math.round(26 * s),
                    minHeight: 0,
                }}
            >
                {cfg.valueMode === "single" ? (
                    valueBlock(leftValue, leftLabel, cfg.heroScale)
                ) : (
                    <>
                        {valueBlock(leftValue, leftLabel, cfg.heroScale)}
                        {cfg.valueMode === "pairArrow" ? (
                            <div
                                aria-hidden="true"
                                style={{
                                    color: textColor,
                                    opacity: 0.5,
                                    fontSize: Math.round(22 * s),
                                }}
                            >
                                →
                            </div>
                        ) : null}
                        {valueBlock(rightValue, rightLabel, cfg.heroScale)}
                    </>
                )}
            </div>

            {detailsLine ? (
                <div
                    style={{
                        padding: `${Math.round(14 * s * cfg.padY)}px 0`,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        textAlign: cfg.align,
                        fontSize: Math.max(8, 10.5 * s),
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: textColor,
                        opacity: 0.8,
                        overflowWrap: "anywhere",
                    }}
                >
                    {detailsLine}
                </div>
            ) : null}

            {showBarcode || showSeal ? (
                <div
                    style={{
                        marginTop: Math.round(26 * s * cfg.padY),
                        position: "relative",
                        minHeight: showBarcode ? undefined : sealSize,
                    }}
                >
                    {showBarcode ? (
                        <>
                            <div
                                aria-hidden="true"
                                style={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    gap: barcode.gap,
                                    height: Math.round(54 * s * cfg.blockScale),
                                    width: barcode.avail,
                                }}
                            >
                                {barcode.units.map((u, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: u * barcode.unitPx,
                                            flex: "0 0 auto",
                                            background:
                                                "linear-gradient(180deg, #F4F6F8, #B9C0CA)",
                                            borderRadius: 0.5,
                                            opacity: 0.92,
                                        }}
                                    />
                                ))}
                            </div>
                            <div
                                style={{
                                    marginTop: Math.round(12 * s * cfg.padY),
                                    width: barcode.avail,
                                    textAlign: "center",
                                    fontSize: Math.max(9, 13 * s),
                                    fontWeight: 700,
                                    letterSpacing: "0.28em",
                                    color: textColor,
                                    overflowWrap: "anywhere",
                                    ...monoStyle,
                                }}
                            >
                                {barcodeId}
                            </div>
                        </>
                    ) : null}

                    {showSeal ? (
                        <div
                            style={{
                                position: "absolute",
                                right: 0,
                                bottom: 0,
                                width: sealSize,
                                height: sealSize,
                                borderRadius: "50%",
                                background: holoGradient,
                                backgroundSize: "300% 300%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: Math.max(7, 9.5 * s),
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: "#17141F",
                                textAlign: "center",
                                lineHeight: 1.2,
                                boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                                opacity: 0.95,
                                padding: 4,
                                boxSizing: "border-box",
                                ...monoStyle,
                            }}
                        >
                            {sealText}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )

    // The buyer's frame is stretched to the card so it works at any card
    // size, rather than rendering at whatever size they happened to draw it.
    const customContent = (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {React.Children.map(customFrame, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(child, {
                          style: {
                              ...(child.props?.style || {}),
                              width: "100%",
                              height: "100%",
                          },
                      })
                    : child
            )}
        </div>
    )

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                ...rootStyle,
                perspective: 1100,
                display: sizing === "fit" ? "block" : "inline-block",
            }}
        >
            <Tag
                ref={cardRef}
                href={hasLink ? link : undefined}
                target={hasLink && linkNewTab ? "_blank" : undefined}
                rel={hasLink && linkNewTab ? "noopener noreferrer" : undefined}
                onPointerEnter={hoverOn ? onPointerEnter : undefined}
                onPointerMove={hoverOn ? onPointerMove : undefined}
                onPointerLeave={hoverOn ? onPointerLeave : undefined}
                onClick={tapCycles ? cycle : undefined}
                onKeyDown={tapCycles ? onKeyDown : undefined}
                onFocus={interactive ? onFocus : undefined}
                onBlur={() => setFocusRing(false)}
                tabIndex={tapCycles ? 0 : undefined}
                role={role}
                aria-label={label}
                style={{
                    position: "relative",
                    display: "block",
                    width: "100%",
                    height: "100%",
                    borderRadius,
                    background: baseColor,
                    overflow: "hidden",
                    // Contains the overlay blend modes so Safari does not
                    // composite them against the page behind the card.
                    isolation: "isolate",
                    transformStyle: "preserve-3d",
                    willChange: running ? "transform" : "auto",
                    backfaceVisibility: "hidden",
                    cursor: interactive ? "pointer" : "default",
                    outline: "none",
                    textDecoration: "none",
                    boxSizing: "border-box",
                    boxShadow: [
                        "0 30px 80px rgba(0,0,0,0.55)",
                        "0 8px 24px rgba(0,0,0,0.4)",
                        focusRing ? `0 0 0 3px ${accent}` : null,
                    ]
                        .filter(Boolean)
                        .join(", "),
                    border: "1px solid rgba(255,255,255,0.14)",
                    fontFamily: sansFamily,
                    ...font,
                }}
            >
                {/* brushed metal sheen */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                            "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 25%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.05) 100%)",
                    }}
                />

                {!foilAbove && foilLayers}

                {isCustomContent ? customContent : presetContent}

                {foilAbove && foilLayers}

                {/* bevel edge light */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius,
                        boxShadow:
                            "inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(0,0,0,0.4)",
                        pointerEvents: "none",
                    }}
                />
            </Tag>
        </div>
    )
}

HoloCard.displayName = "HoloCard"

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
// Property Control defaults only apply to instances configured on the Canvas.
// These cover instances created in code, per Framer's guidance. The
// destructured defaults above remain the runtime safety net.
HoloCard.defaultProps = {
    sizing: "fit",
    cardWidth: NATIVE_W,
    cardHeight: NATIVE_H,
    borderRadius: 18,
    contentMode: "preset",
    preset: "ticket",
    title: "NACHTZUG",
    titleSize: 58,
    subtitle: "ALPINE SLEEPER · ZÜRICH — VENEZIA",
    leftValue: "23:40",
    leftLabel: "ZÜRICH HB",
    rightValue: "08:15",
    rightLabel: "VENEZIA S.L.",
    detailsLine: "GLEIS/BINARIO 4 · WAGEN/CARROZZA 12 · ABTEIL/CABINA 7B",
    showBarcode: true,
    barcodeId: "AS-2317-0642",
    showSeal: true,
    sealText: "VALID",
    spectrum: "aurora",
    customA: "#5EEAD4",
    customB: "#A78BFA",
    customC: "#F0ABFC",
    customD: "#FCD34D",
    cycleOnTap: false,
    holoIntensity: 0.75,
    motion: "both",
    tiltAmount: 7,
    idleSpeed: 1,
    baseColor: "#14121F",
    textColor: "#C8CDD6",
    linkNewTab: false,
}

// ---------------------------------------------------------------------------
// Property controls
// ---------------------------------------------------------------------------

const isCustom = (p) => p.contentMode === "custom"
const noBarcode = (p) => isCustom(p) || !p.showBarcode
const singleValue = (p) =>
    isCustom(p) || (PRESETS[p.preset] ?? PRESETS.ticket).valueMode === "single"

addPropertyControls(HoloCard, {
    // --- Layout -------------------------------------------------------
    sizing: {
        type: ControlType.Enum,
        title: "Sizing",
        options: ["fit", "fixed"],
        optionTitles: ["Fit to Frame", "Fixed"],
        displaySegmentedControl: true,
        defaultValue: "fit",
        description:
            "Fit to Frame fills the width and keeps the ratio set by the Layout preset — set the frame height to Fit.",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 260,
        max: 640,
        step: 10,
        defaultValue: NATIVE_W,
        unit: "px",
        hidden: (p) => p.sizing !== "fixed",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 160,
        max: 900,
        step: 10,
        defaultValue: NATIVE_H,
        unit: "px",
        hidden: (p) => p.sizing !== "fixed",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 18,
    },

    // --- Content ------------------------------------------------------
    contentMode: {
        type: ControlType.Enum,
        title: "Content",
        options: ["preset", "custom"],
        optionTitles: ["Preset", "Custom Frame"],
        displaySegmentedControl: true,
        defaultValue: "preset",
    },
    preset: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["ticket", "membership", "gift", "event", "stat"],
        optionTitles: [
            "Ticket",
            "Membership",
            "Gift Card",
            "Event Pass",
            "Stat",
        ],
        defaultValue: "ticket",
        hidden: isCustom,
        description:
            "Sets the proportions, title treatment and value hierarchy. Ticket and Event Pass are portrait, Membership and Gift Card are credit-card landscape, Stat is square. Your text and the Barcode/Seal toggles are never changed.",
    },
    customFrame: {
        type: ControlType.ComponentInstance,
        title: "Frame",
        hidden: (p) => !isCustom(p),
        description:
            "Your own design, stretched to fill the card with the full holographic treatment applied over it. Draw it at any size.",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "NACHTZUG",
        hidden: isCustom,
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 24,
        max: 96,
        step: 1,
        defaultValue: 58,
        unit: "px",
        description:
            "Base size — the Layout preset scales it, and long titles shrink automatically to fit.",
        hidden: isCustom,
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "ALPINE SLEEPER · ZÜRICH — VENEZIA",
        hidden: isCustom,
    },
    leftValue: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "23:40",
        hidden: isCustom,
    },
    leftLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "ZÜRICH HB",
        hidden: isCustom,
    },
    rightValue: {
        type: ControlType.String,
        title: "Value R",
        defaultValue: "08:15",
        hidden: singleValue,
    },
    rightLabel: {
        type: ControlType.String,
        title: "Label R",
        defaultValue: "VENEZIA S.L.",
        hidden: singleValue,
    },
    detailsLine: {
        type: ControlType.String,
        title: "Details",
        defaultValue: "GLEIS/BINARIO 4 · WAGEN/CARROZZA 12 · ABTEIL/CABINA 7B",
        description: "Leave empty to hide the etched row",
        hidden: isCustom,
    },
    showBarcode: {
        type: ControlType.Boolean,
        title: "Barcode",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: isCustom,
    },
    barcodeId: {
        type: ControlType.String,
        title: "Card ID",
        defaultValue: "AS-2317-0642",
        description:
            "Decorative barcode graphic generated from this text — not scannable.",
        hidden: noBarcode,
    },
    showSeal: {
        type: ControlType.Boolean,
        title: "Seal",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: isCustom,
    },
    sealText: {
        type: ControlType.String,
        title: "Seal Text",
        defaultValue: "VALID",
        hidden: (p) => isCustom(p) || !p.showSeal,
    },

    // --- Finish -------------------------------------------------------
    spectrum: {
        type: ControlType.Enum,
        title: "Spectrum",
        options: ["aurora", "chrome", "sunset", "neon", "custom"],
        optionTitles: ["Aurora", "Chrome", "Sunset", "Neon", "Custom"],
        defaultValue: "aurora",
    },
    customA: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#5EEAD4",
        hidden: (p) => p.spectrum !== "custom",
    },
    customB: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#A78BFA",
        hidden: (p) => p.spectrum !== "custom",
    },
    customC: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#F0ABFC",
        hidden: (p) => p.spectrum !== "custom",
    },
    customD: {
        type: ControlType.Color,
        title: "Color 4",
        defaultValue: "#FCD34D",
        hidden: (p) => p.spectrum !== "custom",
    },
    holoIntensity: {
        type: ControlType.Number,
        title: "Holo",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.75,
        description: "Strength of the iridescent layer and sweep",
    },
    baseColor: {
        type: ControlType.Color,
        title: "Metal",
        defaultValue: "#14121F",
    },
    textColor: {
        type: ControlType.Color,
        title: "Etch Text",
        defaultValue: "#C8CDD6",
        hidden: isCustom,
    },

    // --- Motion -------------------------------------------------------
    motion: {
        type: ControlType.Enum,
        title: "Motion",
        options: ["both", "hover", "idle", "off"],
        optionTitles: ["Both", "Hover Only", "Idle Only", "Off"],
        defaultValue: "both",
        description:
            "Static rendering and reduced-motion visitors always get a still card.",
    },
    tiltAmount: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 16,
        step: 0.5,
        defaultValue: 7,
        unit: "°",
        hidden: (p) => p.motion === "off",
    },
    idleSpeed: {
        type: ControlType.Number,
        title: "Idle Speed",
        min: 0.3,
        max: 2,
        step: 0.1,
        defaultValue: 1,
        description: "Pace of the breathing loop and sweep",
        hidden: (p) => p.motion === "off" || p.motion === "hover",
    },

    // --- Interaction --------------------------------------------------
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    linkNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => !p.link,
    },
    cycleOnTap: {
        type: ControlType.Boolean,
        title: "Tap Cycles",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Tapping the card advances to the next spectrum",
        hidden: (p) => !!p.link || p.spectrum === "custom",
    },

    // --- Typography ---------------------------------------------------
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultFontType: "sans-serif",
        displayFontSize: false,
        displayTextAlignment: false,
    },
    monoFont: {
        type: ControlType.Font,
        title: "Etched Font",
        defaultFontType: "monospace",
        displayFontSize: false,
        displayTextAlignment: false,
        description: "Used for the subtitle, card ID and seal",
        hidden: isCustom,
    },
})
