import {
    startTransition,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
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

import { motion } from "framer-motion"

interface MeltyHeroTextProps {
    text: string
    font: any
    color: string
    fitWidth: boolean
    trigger: "always" | "hover"
    intensity: number
    gooeyness: number
    melt: number
    speed: number
    scale: number
    hoverSurge: number
    appearEnabled: boolean
    appearStyle: "Melt In" | "Rise" | "Blur"
    appearBy: "Character" | "Word"
    appearStagger: number
    appearDuration: number
    appearReplay: boolean
    style?: CSSProperties
}

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const f = (n: number) => n.toFixed(5)

/**
 * Melty Hero Text
 *
 * Display heading where the letters wobble and drip like warm liquid —
 * an animated turbulence/displacement filter wobbles the edges while a
 * gooey threshold merges neighbouring strokes into blobs. Supports
 * multi-line text; each line auto-fits the container width.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 160
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MeltyHeroText(props: MeltyHeroTextProps) {
    const {
        text = "liquid",
        font,
        color = "#0A0A0A",
        fitWidth = true,
        trigger = "hover",
        intensity = 22,
        gooeyness = 6,
        melt = 0.45,
        speed = 1,
        scale = 1,
        hoverSurge = 0.6,
        appearEnabled = true,
        appearStyle = "Melt In",
        appearBy = "Character",
        appearStagger = 0.04,
        appearDuration = 0.7,
        appearReplay = false,
    } = props

    const isStatic = useIsStaticRenderer()
    const [isInView, setIsInView] = useState(true)
    const [isHovered, setIsHovered] = useState(false)
    const [isMeltEffectActive, setIsMeltEffectActive] = useState(false)
    const isMeltEffectActiveRef = useRef(false)
    const [appearDone, setAppearDone] = useState(false)
    // Framer SSR and the client can disagree on useId (hidden breakpoint
    // copies shift the counter), and hydration never patches the stale ids.
    // The span's filter style must only ever be written client-side (gated on
    // `mounted`), with the def's id stamped to match in a layout effect —
    // otherwise the reference points at a dead id and the melt never renders.
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return false
        }
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    })
    // Touch devices fire mouseenter on tap and never mouseleave, so a hover
    // trigger would stick half-melted; fall back to always-on there.
    const [canHover] = useState(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return true
        }
        return window.matchMedia("(hover: hover)").matches
    })
    const effectiveTrigger =
        trigger === "hover" && !canHover ? "always" : trigger

    // --- Melt amount (0 = crisp, 1 = full liquid) --------------------------
    // "always" eases up to a constant 1; "hover" eases between 0 and 1 as the
    // pointer enters/leaves. To reduce flicker/jank, easing writes directly to
    // SVG primitive attributes via refs instead of re-rendering each frame.
    const progressRef = useRef(0)
    const targetRef = useRef(0)
    const rafRef = useRef(0)
    const lastTsRef = useRef(0)
    const tauMsRef = useRef(200)
    const wobbleMapRef = useRef<SVGFEDisplacementMapElement>(null)
    const swayMapRef = useRef<SVGFEDisplacementMapElement>(null)
    const wobbleTurbRef = useRef<SVGFETurbulenceElement>(null)
    const swayTurbRef = useRef<SVGFETurbulenceElement>(null)
    const blurRef = useRef<SVGFEGaussianBlurElement>(null)
    const colorMatrixRef = useRef<SVGFEColorMatrixElement>(null)

    const paramsRef = useRef({
        maxAmpWobble: intensity * scale,
        maxAmpSway: intensity * scale * (0.32 + melt * 0.25),
        gooeyness,
    })

    const applyProgress = useCallback((p: number) => {
        const clamped = Math.max(0, p)
        const { maxAmpWobble, maxAmpSway, gooeyness: currentGooeyness } =
            paramsRef.current
        const ampWobble = maxAmpWobble * clamped
        const ampSway = maxAmpSway * clamped
        const blur = currentGooeyness * clamped
        const crisp = clamped <= 0.0009

        if (wobbleMapRef.current) {
            wobbleMapRef.current.scale.baseVal = crisp ? 0 : ampWobble
        }
        if (swayMapRef.current) {
            swayMapRef.current.scale.baseVal = crisp ? 0 : ampSway
        }
        if (blurRef.current) {
            blurRef.current.setStdDeviation(crisp ? 0 : blur, crisp ? 0 : blur)
        }

        const nextActive = !crisp
        if (isMeltEffectActiveRef.current !== nextActive) {
            isMeltEffectActiveRef.current = nextActive
            startTransition(() => setIsMeltEffectActive(nextActive))
        }
    }, [])

    const easeTo = useCallback((v: number, tauMs = 200) => {
        targetRef.current = v
        tauMsRef.current = tauMs
        if (rafRef.current) return
        lastTsRef.current = 0
        const step = (ts: number) => {
            // Frame-rate independent exponential smoothing.
            const dt = lastTsRef.current > 0 ? ts - lastTsRef.current : 0
            lastTsRef.current = ts
            const alpha = 1 - Math.exp(-dt / tauMsRef.current)

            const diff = targetRef.current - progressRef.current
            if (Math.abs(diff) < 0.002) {
                progressRef.current = targetRef.current
                applyProgress(progressRef.current)
                rafRef.current = 0
                lastTsRef.current = 0
                return
            }
            progressRef.current += diff * alpha
            applyProgress(progressRef.current)
            rafRef.current = requestAnimationFrame(step)
        }
        rafRef.current = requestAnimationFrame(step)
    }, [applyProgress])

    useEffect(() => {
        if (isStatic || prefersReducedMotion) {
            cancelAnimationFrame(rafRef.current)
            progressRef.current = 0
            targetRef.current = 0
            applyProgress(0)
            return
        }
        easeTo(effectiveTrigger === "always" ? 1 : 0)
        return () => cancelAnimationFrame(rafRef.current)
    }, [applyProgress, easeTo, effectiveTrigger, isStatic, prefersReducedMotion])

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return
        }
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const onChange = (event: MediaQueryListEvent) => {
            startTransition(() => setPrefersReducedMotion(event.matches))
        }

        startTransition(() => setPrefersReducedMotion(mediaQuery.matches))
        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", onChange)
            return () => mediaQuery.removeEventListener("change", onChange)
        }

        mediaQuery.addListener(onChange)
        return () => mediaQuery.removeListener(onChange)
    }, [])

    useEffect(() => {
        if (isStatic || prefersReducedMotion) {
            startTransition(() => setIsInView(true))
            return
        }

        const node = rootRef.current
        if (!node || typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
            startTransition(() => setIsInView(true))
            return
        }

        let mounted = true
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry || !mounted) return
                startTransition(() => setIsInView(entry.isIntersecting))
            },
            { threshold: 0.01 }
        )
        observer.observe(node)

        return () => {
            mounted = false
            observer.disconnect()
        }
    }, [isStatic, prefersReducedMotion])

    const canRunMelt = !isStatic && !prefersReducedMotion
    const hoverable =
        canRunMelt &&
        canHover &&
        (effectiveTrigger === "hover" ||
            (effectiveTrigger === "always" && hoverSurge > 0))
    const handleEnter = hoverable
        ? () => {
              startTransition(() => setIsHovered(true))
              if (effectiveTrigger === "hover") {
                  easeTo(1, 100)
                  return
              }
              easeTo(1 + hoverSurge, 100)
          }
        : undefined
    const handleLeave = hoverable
        ? () => {
              startTransition(() => setIsHovered(false))
              if (effectiveTrigger === "hover") {
                  easeTo(0, 100)
                  return
              }
              easeTo(1, 100)
          }
        : undefined

    // Unique, CSS-safe id so multiple instances don't share a filter.
    const filterId = "melt-" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const filterElRef = useRef<SVGFilterElement>(null)
    // Stamp the client id onto the (possibly server-rendered) filter element
    // so the def always matches what the span references.
    useIsoLayoutEffect(() => {
        filterElRef.current?.setAttribute("id", filterId)
    }, [filterId])

    const resolvedFamily = font?.fontFamily || "Inter, sans-serif"
    const fontWeight = font?.fontWeight ?? 800
    const fontStyle = font?.fontStyle ?? "normal"
    const letterSpacing = font?.letterSpacing ?? "-0.02em"
    const textAlign = (font?.textAlign as CSSProperties["textAlign"]) || "left"
    const lineHeight = font?.lineHeight ?? "1em"
    const baseFontSize = parseFloat(String(font?.fontSize ?? 72)) || 72

    // --- Auto-fit to container width ---------------------------------------
    // Text splits on line breaks; each line is measured and fitted on its own.
    const rootRef = useRef<HTMLDivElement>(null)
    const measureRefs = useRef<(HTMLSpanElement | null)[]>([])
    const [fontSizes, setFontSizes] = useState<number[]>([])

    const lines = useMemo(() => text.split("\n"), [text])

    const w = props.style?.width
    const widthIsConstrained = w === "100%" || typeof w === "number"
    const shouldFit = fitWidth && widthIsConstrained

    const measureToFit = useCallback(() => {
        const root = rootRef.current
        if (!root) return
        const avail = root.clientWidth
        if (avail <= 0) return
        const next = lines.map((line, index) => {
            const node = measureRefs.current[index]
            const natural = node?.scrollWidth ?? 0
            if (natural <= 0 || !line.trim()) return baseFontSize
            return Math.max(
                1,
                Math.round(((baseFontSize * avail) / natural) * 100) / 100
            )
        })
        startTransition(() =>
            setFontSizes((prev) =>
                prev.length === next.length &&
                prev.every((p, i) => Math.abs(p - next[i]) < 0.15)
                    ? prev
                    : next
            )
        )
    }, [baseFontSize, lines])

    useIsoLayoutEffect(() => {
        if (!shouldFit) return
        const root = rootRef.current
        if (!root) return

        measureToFit()

        let ro: ResizeObserver | undefined
        let cancelled = false
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => measureToFit())
            ro.observe(root)
        }

        if (
            typeof document !== "undefined" &&
            "fonts" in document &&
            document.fonts?.ready
        ) {
            document.fonts.ready
                .then(() => {
                    if (cancelled) return
                    measureToFit()
                })
                .catch(() => {
                    // Ignore font loading errors; fallback measurement already ran.
                })
        }

        return () => {
            cancelled = true
            ro?.disconnect()
        }
    }, [
        text,
        shouldFit,
        baseFontSize,
        resolvedFamily,
        letterSpacing,
        fontWeight,
        fontStyle,
        measureToFit,
    ])

    // --- Liquid filter ------------------------------------------------------
    // Two layered turbulence fields drive the melt:
    //   • a fine, faster field churns the letter edges (the "wobble"), and
    //   • a slow, low-frequency field gently sways whole letters so the loop
    //     reads as flowing liquid instead of jiggling in place.
    // Vertical noise frequency is lowered by `melt` to stretch the
    // displacement into tall downward drips; horizontal stays tighter for a
    // jelly-like wobble. WebKit ignores SMIL <animate> on baseFrequency, so
    // the wander is driven from a rAF loop instead — each field drifts on its
    // own period, and incommensurate periods keep the layers from resyncing.

    // Fine wobble layer.
    const durA = Math.max(1.5, 20 / Math.max(0.05, speed))
    const fx = 0.009 + intensity * 0.00018
    const fyBase = fx * (1 - Math.min(0.85, melt * 0.9))

    // Slow sway layer — lower frequency means larger, drifting features. A
    // touch more vertical drift with `melt` nudges the letters downward.
    const durB = durA * 2.37
    const sx = fx * 0.4
    const syBase = sx * (1 - Math.min(0.85, melt * 0.9))

    // Gooey alpha threshold: higher blur + this matrix fuses strokes into blobs.
    const gooMatrix = useMemo(
        () =>
            `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${(
                12 +
                gooeyness * 1.6
            ).toFixed(1)} -7`,
        [gooeyness]
    )

    useEffect(() => {
        paramsRef.current = {
            maxAmpWobble: intensity * scale,
            maxAmpSway: intensity * scale * (0.32 + melt * 0.25),
            gooeyness,
        }
        applyProgress(progressRef.current)
    }, [applyProgress, gooeyness, intensity, melt, scale])

    useEffect(() => {
        if (colorMatrixRef.current) {
            colorMatrixRef.current.setAttribute("values", gooMatrix)
        }
    }, [gooMatrix])

    // Attach the filter only while the melt is actually active: a filtered
    // element holds its own raster layer even when the filter is a no-op,
    // which softens idle text. "hover" attaches on the first eased frame
    // (amplitude ~0, so nothing pops) and detaches once progress settles.
    const filterAttached =
        mounted &&
        canRunMelt &&
        (effectiveTrigger === "always" || isMeltEffectActive)

    const rowStyle = (index: number): CSSProperties => ({
        display: "block",
        whiteSpace: "pre",
        fontSize: shouldFit ? (fontSizes[index] ?? baseFontSize) : baseFontSize,
        lineHeight,
        color,
        fontFamily: resolvedFamily,
        fontWeight,
        fontStyle,
        letterSpacing,
        filter: filterAttached ? `url(#${filterId})` : undefined,
    })

    const rootStyle: CSSProperties = {
        ...props.style,
        position: "relative",
        width: props.style?.width ?? "100%",
        textAlign,
        // overflow visible lets the wobble/drip spill past the box without
        // reserving extra layout space below the text.
        overflow: "visible",
    }

    const { lineTokens, lastAnimIndex } = useMemo(() => {
        let animIndex = 0
        const lineTokens = lines.map((line, lineIndex) => {
            const parts =
                appearBy === "Word"
                    ? line.split(/(\s+)/).filter((value) => value.length > 0)
                    : Array.from(line)
            return parts.map((value, index) => {
                const isSpace = /^\s+$/.test(value)
                return {
                    key: `${lineIndex}-${index}-${value}`,
                    value,
                    isSpace,
                    animIndex: isSpace ? -1 : animIndex++,
                }
            })
        })
        return { lineTokens, lastAnimIndex: animIndex - 1 }
    }, [appearBy, lines])

    // Once the appear has finished (and won't replay), swap the per-character
    // spans back to plain text: inline-block tokens disable kerning pairs
    // (AV, To, ...). The filter stays attached, so nothing visually pops.
    const shouldAnimateAppear =
        appearEnabled && !isStatic && !prefersReducedMotion && !appearDone
    const shouldRunTurbulence =
        canRunMelt &&
        isInView &&
        (effectiveTrigger === "always" || isHovered || isMeltEffectActive)

    useEffect(() => {
        if (!shouldRunTurbulence) return
        const wobble = wobbleTurbRef.current
        const sway = swayTurbRef.current
        if (!wobble || !sway) return
        let raf = 0
        const step = (ts: number) => {
            const t = ts / 1000
            const wp = (2 * Math.PI * t) / durA
            const sp = (2 * Math.PI * t) / durB
            wobble.setAttribute(
                "baseFrequency",
                `${f(fx * (1.2 + 0.25 * Math.sin(wp)))} ${f(
                    fyBase * (1.3 + 0.3 * Math.sin(wp * 1.31 + 2))
                )}`
            )
            sway.setAttribute(
                "baseFrequency",
                `${f(sx * (1.25 + 0.25 * Math.sin(sp)))} ${f(
                    syBase * (1.4 + 0.4 * Math.sin(sp * 1.17 + 4))
                )}`
            )
            raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [shouldRunTurbulence, durA, durB, fx, fyBase, sx, syBase])

    // Per-token delay via `custom` keeps the stagger flowing across line
    // breaks (per-line staggerChildren would restart each row at zero).
    const tokenVariants = useMemo(() => {
        const transitionFor = (index: number) => ({
            duration: appearDuration,
            delay: Math.max(0, index) * appearStagger,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        })
        if (appearStyle === "Rise") {
            return {
                hidden: { opacity: 0, y: 16 },
                show: (index: number) => ({
                    opacity: 1,
                    y: 0,
                    transition: transitionFor(index),
                }),
            }
        }
        if (appearStyle === "Blur") {
            return {
                hidden: { opacity: 0, filter: "blur(10px)" },
                show: (index: number) => ({
                    opacity: 1,
                    filter: "blur(0px)",
                    transition: transitionFor(index),
                }),
            }
        }
        return {
            hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
            show: (index: number) => ({
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: transitionFor(index),
            }),
        }
    }, [appearDuration, appearStagger, appearStyle])

    return (
        <div
            ref={rootRef}
            style={rootStyle}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            // Keyboard access: focus triggers the same surge/melt as hover.
            tabIndex={hoverable ? 0 : undefined}
            onFocus={handleEnter}
            onBlur={handleLeave}
        >
            {/* Filter defs — zero-size, just carries the filter. */}
            <svg
                aria-hidden
                width="0"
                height="0"
                style={{ position: "absolute" }}
            >
                <defs>
                    <filter
                        ref={filterElRef}
                        id={filterId}
                        x="-35%"
                        y="-35%"
                        width="170%"
                        height="190%"
                        colorInterpolationFilters="sRGB"
                    >
                        {/* Fine churn — wobbles the letter edges. */}
                        <feTurbulence
                            ref={wobbleTurbRef}
                            type="fractalNoise"
                            baseFrequency={`${f(fx)} ${f(fyBase)}`}
                            numOctaves={2}
                            seed={4}
                            result="noiseFine"
                        />
                        <feDisplacementMap
                            ref={wobbleMapRef}
                            in="SourceGraphic"
                            in2="noiseFine"
                            scale={0}
                            xChannelSelector="R"
                            yChannelSelector="G"
                            result="wobbled"
                        />

                        {/* Slow sway — drifts whole letters for a flowing feel. */}
                        <feTurbulence
                            ref={swayTurbRef}
                            type="fractalNoise"
                            baseFrequency={`${f(sx)} ${f(syBase)}`}
                            numOctaves={1}
                            seed={9}
                            result="noiseSlow"
                        />
                        <feDisplacementMap
                            ref={swayMapRef}
                            in="wobbled"
                            in2="noiseSlow"
                            scale={0}
                            xChannelSelector="R"
                            yChannelSelector="G"
                            result="liquid"
                        />

                        <feGaussianBlur
                            ref={blurRef}
                            in="liquid"
                            stdDeviation={0}
                            result="blur"
                        />
                        <feColorMatrix
                            ref={colorMatrixRef}
                            in="blur"
                            type="matrix"
                            values={gooMatrix}
                        />
                    </filter>
                </defs>
            </svg>

            {lines.map((line, index) => (
                <span
                    key={index}
                    ref={(el) => {
                        measureRefs.current[index] = el
                    }}
                    aria-hidden
                    style={{
                        position: "absolute",
                        visibility: "hidden",
                        pointerEvents: "none",
                        whiteSpace: "pre",
                        fontSize: baseFontSize,
                        lineHeight,
                        fontFamily: resolvedFamily,
                        fontWeight,
                        fontStyle,
                        letterSpacing,
                    }}
                >
                    {line}
                </span>
            ))}

            {shouldAnimateAppear ? (
                <span style={{ display: "block" }} aria-label={text}>
                    {/* aria-hidden: the split characters would be announced
                        one by one; the wrapper's aria-label carries the text. */}
                    <motion.span
                        aria-hidden
                        initial="hidden"
                        whileInView="show"
                        viewport={{ amount: 0.45, once: !appearReplay }}
                        style={{ display: "block" }}
                    >
                        {lineTokens.map((tokens, lineIndex) => (
                            <span key={lineIndex} style={rowStyle(lineIndex)}>
                                {tokens.length === 0
                                    ? " "
                                    : tokens.map((token) => {
                                          if (token.isSpace) {
                                              return (
                                                  <span
                                                      key={token.key}
                                                      style={{
                                                          whiteSpace: "pre",
                                                      }}
                                                  >
                                                      {token.value}
                                                  </span>
                                              )
                                          }
                                          return (
                                              <motion.span
                                                  key={token.key}
                                                  custom={token.animIndex}
                                                  variants={tokenVariants}
                                                  onAnimationComplete={
                                                      token.animIndex ===
                                                      lastAnimIndex
                                                          ? (definition) => {
                                                                if (
                                                                    definition ===
                                                                        "show" &&
                                                                    !appearReplay
                                                                ) {
                                                                    startTransition(
                                                                        () =>
                                                                            setAppearDone(
                                                                                true
                                                                            )
                                                                    )
                                                                }
                                                            }
                                                          : undefined
                                                  }
                                                  style={{
                                                      display: "inline-block",
                                                      willChange:
                                                          "transform, opacity, filter",
                                                  }}
                                              >
                                                  {token.value}
                                              </motion.span>
                                          )
                                      })}
                            </span>
                        ))}
                    </motion.span>
                </span>
            ) : (
                lines.map((line, index) => (
                    <span key={index} style={rowStyle(index)}>
                        {line || " "}
                    </span>
                ))
            )}
        </div>
    )
}

MeltyHeroText.displayName = "Melty Hero Text"

addPropertyControls(MeltyHeroText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "liquid",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "72px",
            variant: "Extra Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
            textAlign: "left",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0A0A0A",
    },
    fitWidth: {
        type: ControlType.Boolean,
        title: "Fit Width",
        enabledTitle: "Fit",
        disabledTitle: "Fixed",
        defaultValue: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["always", "hover"],
        optionTitles: ["Always", "On Hover"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    intensity: {
        type: ControlType.Number,
        title: "Wobble",
        description: "How strongly the letter edges churn.",
        defaultValue: 22,
        min: 0,
        max: 80,
        step: 1,
    },
    gooeyness: {
        type: ControlType.Number,
        title: "Goo",
        description: "Fuses nearby strokes into liquid blobs.",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 0.5,
    },
    melt: {
        type: ControlType.Number,
        title: "Drip",
        description: "Stretches the motion into downward drips.",
        defaultValue: 0.45,
        min: 0,
        max: 1,
        step: 0.01,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 4,
        step: 0.1,
    },
    scale: {
        type: ControlType.Number,
        title: "Displace Scale",
        description: "Multiplies the overall distortion amount.",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
    },
    hoverSurge: {
        type: ControlType.Number,
        title: "Hover Surge",
        description: "Extra melt added while hovered.",
        defaultValue: 0.6,
        min: 0,
        max: 1.5,
        step: 0.05,
        hidden: (props) => props.trigger !== "always",
    },
    appearEnabled: {
        type: ControlType.Boolean,
        title: "Appear",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    appearStyle: {
        type: ControlType.Enum,
        title: "Appear Style",
        options: ["Melt In", "Rise", "Blur"],
        defaultValue: "Melt In",
        hidden: (props) => !props.appearEnabled,
    },
    appearBy: {
        type: ControlType.Enum,
        title: "Appear By",
        options: ["Character", "Word"],
        defaultValue: "Character",
        displaySegmentedControl: true,
        hidden: (props) => !props.appearEnabled,
    },
    appearStagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.04,
        min: 0,
        max: 0.3,
        step: 0.01,
        hidden: (props) => !props.appearEnabled,
    },
    appearDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.7,
        min: 0.1,
        max: 3,
        step: 0.05,
        hidden: (props) => !props.appearEnabled,
    },
    appearReplay: {
        type: ControlType.Boolean,
        title: "Replay In View",
        defaultValue: false,
        enabledTitle: "Replay",
        disabledTitle: "Once",
        hidden: (props) => !props.appearEnabled,
    },
})
