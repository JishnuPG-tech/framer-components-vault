// ============================================================
//  Letter3DSwap v2 — Premium Framer Marketplace Component
// ============================================================
//
//  NEW IN V2
//  ✦ Scramble effect  — chars cipher-decode before the 3D flip
//  ✦ Motion blur      — CSS filter:blur peaks at flip midpoint
//  ✦ Easing presets   — Snappy · Elastic · Cinematic · Butter · Custom
//  ✦ Perspective      — tune vanishing point for dramatic vs subtle 3D
//  ✦ Min-char-width   — narrow chars (i l 1 .) no longer clip on L/R flips
//  ✦ Mobile touch     — tap-to-toggle on touch devices (hover trigger)
//  ✦ Canvas adaptive  — preview visible on both light and dark canvases
//
//  EXISTING FEATURES
//  ✦ Canvas preview   — alternating-color preview in the Framer editor
//  ✦ Trigger system   → hover · click · inView · loop
//  ✦ Color reveal     → independent front / back face colors
//  ✦ Dual text        → back face shows a different word
//  ✦ 6 directions     → top · bottom · left · right · random · cycle
//  ✦ 5 stagger modes  → first · last · center · random · custom index
//  ✦ Full typography  → size · weight · family · tracking · leading · word-gap
//  ✦ Text case        → UPPER · lower · as-typed
//  ✦ Accessible       → role="text" + aria-label
//
// ============================================================

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useAnimate, useInView } from "framer-motion"
import { useCallback, useEffect, useMemo, useRef } from "react"

// ─── Constants ───────────────────────────────────────────────────────────────

type Direction = "top" | "bottom" | "left" | "right"
const ALL_DIRS: Direction[] = ["top", "bottom", "left", "right"]

const CHAR_SETS: Record<string, string> = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers  : "0123456789",
    symbols  : "@#!&%*$^~|<>?",
    matrix   : "アイウエオカキクケコサシスセソタチツテトナニヌネノ",
    mixed    : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#!&%",
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface FaceSet {
    container: string
    front: string
    back: string
    target: string
}

interface WordEntry {
    chars: string[]
    reveal: string[]
    space: boolean
    start: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitChars(str: string): string[] {
    if (!str) return []
    try {
        // @ts-ignore — Intl.Segmenter not in older TS lib targets; safe at runtime
        const seg = new Intl.Segmenter("en", { granularity: "grapheme" })
        // @ts-ignore
        return Array.from(seg.segment(str)).map((s: any) => s.segment as string)
    } catch (_) { return Array.from(str) }
}

function buildFaces(dir: Direction): FaceSet {
    switch (dir) {
        case "top":    return { container: "translateZ(-0.5lh)", front: "translateZ(0.5lh)",  back: "rotateX(-90deg) translateZ(0.5lh)", target: "rotateX(90deg)"  }
        case "bottom": return { container: "translateZ(-0.5lh)", front: "translateZ(0.5lh)",  back: "rotateX(90deg) translateZ(0.5lh)",  target: "rotateX(-90deg)" }
        case "left":   return { container: "translateZ(-0.4em)", front: "translateZ(0.4em)",  back: "rotateY(-90deg) translateZ(0.4em)", target: "rotateY(90deg)"  }
        case "right":  return { container: "translateZ(-0.4em)", front: "translateZ(0.4em)",  back: "rotateY(90deg) translateZ(0.4em)",  target: "rotateY(-90deg)" }
    }
}

function getTransition(
    preset: string,
    customEngine: string,
    customDamping: number,
    customStiffness: number,
    customDuration: number
): any {
    switch (preset) {
        case "snappy":    return { type: "spring", damping: 35,  stiffness: 500 }
        case "elastic":   return { type: "spring", damping: 8,   stiffness: 100 }
        case "cinematic": return { type: "tween",  duration: 0.55, ease: [0.76, 0, 0.24, 1] }
        case "butter":    return { type: "tween",  duration: 0.40, ease: [0.34, 1.56, 0.64, 1] }
        case "custom":
            return customEngine === "spring"
                ? { type: "spring", damping: customDamping, stiffness: customStiffness }
                : { type: "tween",  duration: customDuration, ease: "easeInOut" }
        default: return { type: "spring", damping: 35, stiffness: 500 }
    }
}

/**
 * Returns perceived luminance [0–1] for any hex or rgb/rgba color string.
 * Used by the canvas preview to stay visible on both light and dark canvases.
 */
function getLuminance(color: string): number {
    const hex = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (hex) {
        const r = parseInt(hex[1], 16) / 255
        const g = parseInt(hex[2], 16) / 255
        const b = parseInt(hex[3], 16) / 255
        return 0.299 * r + 0.587 * g + 0.114 * b
    }
    const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgb) {
        const r = parseInt(rgb[1]) / 255
        const g = parseInt(rgb[2]) / 255
        const b = parseInt(rgb[3]) / 255
        return 0.299 * r + 0.587 * g + 0.114 * b
    }
    return 0.5
}

async function runScramble(
    container: Element,
    origChars: string[],
    duration: number,
    charSetKey: string
): Promise<void> {
    const els = Array.from(container.querySelectorAll(".l3ds-front")) as HTMLElement[]
    const n = els.length
    if (!n || duration <= 0) return
    const chars = CHAR_SETS[charSetKey] ?? CHAR_SETS.mixed
    const start = performance.now()
    return new Promise<void>(resolve => {
        function tick() {
            const elapsed  = performance.now() - start
            const progress = Math.min(elapsed / (duration * 1000), 1)
            const settled  = Math.floor(progress * n)
            els.forEach((el, i) => {
                if (!el) return
                el.textContent = i < settled
                    ? origChars[i]
                    : chars[Math.floor(Math.random() * chars.length)]
            })
            if (progress < 1) {
                requestAnimationFrame(tick)
            } else {
                els.forEach((el, i) => { if (el) el.textContent = origChars[i] })
                resolve()
            }
        }
        requestAnimationFrame(tick)
    })
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 580
 * @framerIntrinsicHeight 120
 */
export function Letter3DSwap({
    text            = "THINK",
    revealText      = "BUILD",
    textCase        = "as-typed",
    trigger         = "hover",
    loopInterval    = 3,
    loopPause       = 0.8,
    rotateDirection = "top",
    staggerFrom     = "first",
    staggerIndex    = 0,
    staggerDuration = 0.04,
    scramble         = true,
    scrambleDuration = 0.35,
    scrambleCharSet  = "mixed",
    motionBlur       = true,
    blurAmount       = 2,
    frontColor      = "#ffffff",
    backColor       = "#ff4a03",
    fontSize        = 80,
    fontWeight      = 700,
    fontFamily      = "Inter, sans-serif",
    letterSpacing   = -0.04,
    lineHeight      = 1.1,
    wordSpacing     = 0.28,
    textAlign       = "center",
    easing          = "snappy",
    customEngine    = "spring",
    customDamping   = 25,
    customStiffness = 160,
    customDuration  = 0.3,
    perspectiveDistance = 1000,
    style,
    ...rest
}: any) {

    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas =
        isStaticRenderer || RenderTarget.current() === RenderTarget.canvas

    const [scope, animateEl] = useAnimate()
    const outerRef    = useRef<HTMLDivElement>(null)
    const isAnimating = useRef(false)
    const isFlipped   = useRef(false)
    const prevInView  = useRef(false)
    const inView      = useInView(outerRef, { once: false, amount: 0.5 })

    function applyCase(t: string): string {
        if (!t) return ""
        if (textCase === "uppercase") return t.toUpperCase()
        if (textCase === "lowercase") return t.toLowerCase()
        return t
    }

    const mainStr = applyCase(String(text || ""))
    const revStr  = revealText ? applyCase(String(revealText)) : ""

    const words: WordEntry[] = useMemo(() => {
        if (!mainStr) return []
        const mw = mainStr.split(" ")
        const rw = revStr ? revStr.split(" ") : []
        let idx = 0
        return mw.map((w: string, i: number) => {
            const chars  = splitChars(w)
            const reveal = rw[i] ? splitChars(rw[i]) : chars
            const entry: WordEntry = { chars, reveal, space: i < mw.length - 1, start: idx }
            idx += chars.length
            return entry
        })
    }, [mainStr, revStr])

    const totalChars: number = useMemo(
        () => words.reduce((s: number, w: WordEntry) => s + w.chars.length, 0),
        [words]
    )

    const origChars: string[] = useMemo(
        () => words.flatMap((w: WordEntry) => w.chars),
        [words]
    )

    const randomDirs: Direction[] = useMemo(() => {
        const out: Direction[] = []
        for (let i = 0; i < totalChars; i++) out.push(ALL_DIRS[Math.floor(Math.random() * 4)])
        return out
    }, [totalChars])

    const resolveDir = useCallback((i: number): Direction => {
        if (rotateDirection === "random") return randomDirs[i] ?? "top"
        if (rotateDirection === "cycle")  return ALL_DIRS[i % 4]
        return rotateDirection as Direction
    }, [rotateDirection, randomDirs])

    const delays: number[] = useMemo(() => {
        const n = totalChars
        const out: number[] = []
        for (let i = 0; i < n; i++) {
            let d = 0
            if      (staggerFrom === "last")   d = (n - 1 - i) * staggerDuration
            else if (staggerFrom === "center") d = Math.abs(Math.floor(n / 2) - i) * staggerDuration
            else if (staggerFrom === "random") d = Math.random() * n * staggerDuration
            else if (staggerFrom === "custom") d = Math.abs((staggerIndex ?? 0) - i) * staggerDuration
            else                               d = i * staggerDuration
            out.push(d)
        }
        return out
    }, [totalChars, staggerFrom, staggerDuration, staggerIndex])

    const transition: any = useMemo(
        () => getTransition(easing, customEngine, customDamping, customStiffness, customDuration),
        [easing, customEngine, customDamping, customStiffness, customDuration]
    )

    const play = useCallback(async (forward: boolean) => {
        if (isCanvas) return
        if (isAnimating.current) return
        const container: any = scope.current
        if (!container) return
        isAnimating.current = true

        if (forward && scramble) {
            await runScramble(container, origChars, scrambleDuration, scrambleCharSet)
        }

        const nodeList: any[] = Array.from(container.querySelectorAll(".l3ds"))
        const wrapList: any[] = Array.from(container.querySelectorAll(".l3ds-wrap"))
        if (!nodeList.length) { isAnimating.current = false; return }

        const blurDur = transition.type === "spring" ? 0.45 : (transition.duration ?? 0.4)

        await Promise.all([
            ...nodeList.map((el: any, i: number) => {
                const faces  = buildFaces(resolveDir(i))
                const target = forward ? faces.target : "rotateX(0deg) rotateY(0deg)"
                return animateEl(el, { transform: target }, { ...transition, delay: delays[i] })
            }),
            ...(motionBlur ? wrapList.map((el: any, i: number) =>
                animateEl(
                    el,
                    { filter: ["blur(0px)", `blur(${blurAmount}px)`, "blur(0px)"] },
                    { type: "tween", duration: blurDur, delay: delays[i], times: [0, 0.5, 1] }
                )
            ) : [])
        ])

        isFlipped.current   = forward
        isAnimating.current = false
    }, [isCanvas, animateEl, scope, resolveDir, delays, transition, scramble, origChars, scrambleDuration, scrambleCharSet, motionBlur, blurAmount])

    const flipIn  = useCallback(() => play(true),  [play])
    const flipOut = useCallback(() => play(false), [play])
    const toggle  = useCallback(() => (isFlipped.current ? flipOut() : flipIn()), [flipIn, flipOut])

    useEffect(() => {
        if (isCanvas || trigger !== "inView") return
        if ( inView && !prevInView.current) { flipIn();  prevInView.current = true  }
        if (!inView &&  prevInView.current) { flipOut(); prevInView.current = false }
    }, [inView, trigger, isCanvas, flipIn, flipOut])

    useEffect(() => {
        if (isCanvas || trigger !== "loop") return
        let alive = true
        ;(async () => {
            while (alive) {
                await flipIn()
                await new Promise(r => setTimeout(r, Math.max(loopPause * 1000, 0)))
                await flipOut()
                await new Promise(r => setTimeout(r, Math.max((loopInterval - loopPause) * 1000, 200)))
            }
        })()
        return () => { alive = false }
    }, [isCanvas, trigger, loopInterval, loopPause, flipIn, flipOut])

    // ── Event handlers ────────────────────────────────────────────────────────
    // Hover trigger: mouse on desktop, tap-to-toggle on touch devices.
    // preventDefault on touchStart stops the 300ms synthetic mouseenter
    // that browsers fire after touch — prevents double-triggering.
    const handlers: any = useMemo(() => {
        if (isCanvas) return {}
        if (trigger === "hover") return {
            onMouseEnter: flipIn,
            onMouseLeave: flipOut,
            onTouchStart: (e: any) => { e.preventDefault(); toggle() },
        }
        if (trigger === "click") return { onClick: toggle }
        return {}
    }, [isCanvas, trigger, flipIn, flipOut, toggle])

    const textStyles: any = { fontSize, fontWeight, fontFamily, letterSpacing: `${letterSpacing}em`, lineHeight }
    const justifyContent  = textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center"

    // ── Static renderer preview ───────────────────────────────────────────────
    // useIsStaticRenderer() is true in the Framer canvas and during export.
    // In that context, render a deterministic preview and do not run any
    // scramble, loop, in-view, hover, click, or motion-blur animations.
    // Adaptive: when frontColor is light (e.g. #ffffff), swaps which chars
    // show front vs back color so the component is visible on white canvases.
    if (isCanvas) {
        const charSetStr   = CHAR_SETS[scrambleCharSet] ?? CHAR_SETS.mixed
        const frontIsLight = getLuminance(frontColor) > 0.6

        return (
            <div role="text" aria-label={mainStr} style={{ display:"flex", alignItems:"center", justifyContent, width:"100%", height:"100%", userSelect:"none", WebkitUserSelect:"none", ...style }}>
                <div style={{ display:"flex", flexWrap:"wrap", justifyContent, ...textStyles }}>
                    {words.map((word: WordEntry, wi: number) => (
                        <span key={wi} style={{ display:"inline-flex", whiteSpace:"nowrap", marginRight: word.space ? `${wordSpacing}em` : 0 }}>
                            {word.chars.map((char: string, ci: number) => {
                                const idx            = word.start + ci
                                const isBack         = idx % 2 === 1
                                const isScrambleHint = scramble && idx % 4 === 3
                                // Flip color assignment when frontColor is light
                                const effectiveIsBack = frontIsLight ? !isBack : isBack
                                const glyph  = isScrambleHint
                                    ? charSetStr[idx % charSetStr.length]
                                    : effectiveIsBack ? (word.reveal[ci] ?? char) : char
                                const color  = isScrambleHint ? backColor : effectiveIsBack ? backColor : frontColor
                                const opaque = isScrambleHint ? 0.5 : effectiveIsBack ? 1 : (frontIsLight ? 0.4 : 0.88)
                                return <span key={ci} style={{ color, opacity: opaque }}>{glyph}</span>
                            })}
                        </span>
                    ))}
                </div>
            </div>
        )
    }

    // ── Live render ───────────────────────────────────────────────────────────
    return (
        <div
            ref={outerRef}
            role="text"
            aria-label={mainStr}
            style={{
                display         : "flex",
                alignItems      : "center",
                justifyContent,
                width           : "100%",
                height          : "100%",
                perspective     : `${perspectiveDistance}px`,
                cursor          : trigger === "click" ? "pointer" : "default",
                userSelect      : "none",
                WebkitUserSelect: "none",
                touchAction     : trigger === "hover" ? "none" : "auto",
                ...style,
            }}
            {...handlers}
            {...rest}
        >
            <div ref={scope} style={{ display:"flex", flexWrap:"wrap", justifyContent, ...textStyles }}>
                {words.map((word: WordEntry, wi: number) => (
                    <span key={wi} style={{ display:"inline-flex", whiteSpace:"nowrap", marginRight: word.space ? `${wordSpacing}em` : 0 }}>
                        {word.chars.map((char: string, ci: number) => {
                            const idx   = word.start + ci
                            const faces = buildFaces(resolveDir(idx))
                            const rc    = word.reveal[ci] ?? char
                            return (
                                <span key={ci} style={{ display:"inline-block", transformStyle:"preserve-3d", transform: faces.container }}>
                                    <span className="l3ds-wrap" style={{ display:"inline-block", minWidth:"0.5em" }}>
                                        <span className="l3ds" style={{ display:"inline-block", position:"relative", transformStyle:"preserve-3d" }}>
                                            <span
                                                className="l3ds-front"
                                                style={{
                                                    display                 : "block",
                                                    transform               : faces.front,
                                                    color                   : frontColor,
                                                    backfaceVisibility      : "hidden",
                                                    WebkitBackfaceVisibility: "hidden",
                                                }}
                                            >
                                                {char}
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    position                : "absolute",
                                                    inset                   : 0,
                                                    display                 : "flex",
                                                    alignItems              : "center",
                                                    justifyContent          : "center",
                                                    transform               : faces.back,
                                                    color                   : backColor,
                                                    backfaceVisibility      : "hidden",
                                                    WebkitBackfaceVisibility: "hidden",
                                                }}
                                            >
                                                {rc}
                                            </span>
                                        </span>
                                    </span>
                                </span>
                            )
                        })}
                    </span>
                ))}
            </div>
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(Letter3DSwap, {

    text: {
        type           : ControlType.String,
        title          : "Text",
        defaultValue   : "THINK",
        displayTextArea: true,
        description    : "Front face text. Works best as a short, bold word or phrase.",
    },
    revealText: {
        type           : ControlType.String,
        title          : "Reveal Text",
        defaultValue   : "BUILD",
        displayTextArea: true,
        description    : "Back face text revealed after the flip. Match the character count of Text for best results.",
    },
    textCase: {
        type        : ControlType.Enum,
        title       : "Case",
        options     : ["as-typed", "uppercase", "lowercase"],
        optionTitles: ["As Typed", "UPPERCASE", "lowercase"],
        defaultValue: "as-typed",
        description : "Applied to both Text and Reveal Text.",
    },
    trigger: {
        type        : ControlType.Enum,
        title       : "Trigger",
        options     : ["hover", "click", "inView", "loop"],
        optionTitles: ["Hover", "Click", "In View", "Loop"],
        defaultValue: "hover",
        description : "Hover: mouse on desktop, tap-to-toggle on mobile. In View and Loop activate in Preview / Published only.",
    },
    loopInterval: {
        type        : ControlType.Number,
        title       : "  ↳ Interval",
        defaultValue: 3,
        min         : 0.5,
        max         : 30,
        step        : 0.5,
        unit        : "s",
        description : "Full cycle: scramble → flip-in → hold → flip-out → wait.",
        hidden      : (p: any) => p.trigger !== "loop",
    },
    loopPause: {
        type        : ControlType.Number,
        title       : "  ↳ Hold",
        defaultValue: 0.8,
        min         : 0,
        max         : 10,
        step        : 0.1,
        unit        : "s",
        description : "How long the back face is held before reversing.",
        hidden      : (p: any) => p.trigger !== "loop",
    },
    rotateDirection: {
        type        : ControlType.Enum,
        title       : "Direction",
        options     : ["top", "bottom", "left", "right", "random", "cycle"],
        optionTitles: ["▲ Top", "▼ Bottom", "◀ Left", "▶ Right", "✦ Random", "↺ Cycle"],
        defaultValue: "top",
        description : "Random: each letter picks a different axis (stable per render). Cycle: Top→Bottom→Left→Right.",
    },
    staggerFrom: {
        type        : ControlType.Enum,
        title       : "Stagger From",
        options     : ["first", "last", "center", "random", "custom"],
        optionTitles: ["First", "Last", "Center", "Random", "Custom Index"],
        defaultValue: "first",
        description : "Where the stagger wave originates.",
    },
    staggerIndex: {
        type        : ControlType.Number,
        title       : "  ↳ Index",
        defaultValue: 0,
        min         : 0,
        step        : 1,
        description : "Character index the wave ripples outward from (0 = first).",
        hidden      : (p: any) => p.staggerFrom !== "custom",
    },
    staggerDuration: {
        type        : ControlType.Number,
        title       : "Stagger Delay",
        defaultValue: 0.04,
        min         : 0,
        max         : 0.3,
        step        : 0.005,
        unit        : "s",
        description : "Time offset between each successive character's animation.",
    },
    scramble: {
        type         : ControlType.Boolean,
        title        : "Scramble",
        defaultValue : true,
        enabledTitle : "On",
        disabledTitle: "Off",
        description  : "Characters cycle through random glyphs before the flip. Only fires on flip-in.",
    },
    scrambleDuration: {
        type        : ControlType.Number,
        title       : "  ↳ Speed",
        defaultValue: 0.35,
        min         : 0.1,
        max         : 3,
        step        : 0.05,
        unit        : "s",
        description : "How long the scramble runs before characters settle into the flip.",
        hidden      : (p: any) => !p.scramble,
    },
    scrambleCharSet: {
        type        : ControlType.Enum,
        title       : "  ↳ Char Set",
        options     : ["mixed", "uppercase", "numbers", "symbols", "matrix"],
        optionTitles: ["Mixed", "Uppercase A–Z", "Numbers 0–9", "Symbols @#!&", "Matrix カタカナ"],
        defaultValue: "mixed",
        description : "Character pool used during scramble. Matrix uses Japanese katakana for a cinematic look.",
        hidden      : (p: any) => !p.scramble,
    },
    motionBlur: {
        type         : ControlType.Boolean,
        title        : "Motion Blur",
        defaultValue : true,
        enabledTitle : "On",
        disabledTitle: "Off",
        description  : "CSS blur at the flip midpoint — makes rotation feel physically real.",
    },
    blurAmount: {
        type        : ControlType.Number,
        title       : "  ↳ Intensity",
        defaultValue: 2,
        min         : 1,
        max         : 20,
        step        : 1,
        unit        : "px",
        description : "2–4px: subtle physical depth. 6–10px: dramatic glitch. Above 10px reads as a glow effect.",
        hidden      : (p: any) => !p.motionBlur,
    },
    frontColor: {
        type        : ControlType.Color,
        title       : "Front Color",
        defaultValue: "#ffffff",
        description : "Resting (front) face color. The canvas preview adapts automatically to stay visible on any background.",
    },
    backColor: {
        type        : ControlType.Color,
        title       : "Back Color",
        defaultValue: "#ff4a03",
        description : "Color revealed after the flip.",
    },
    fontSize: {
        type        : ControlType.Number,
        title       : "Size",
        defaultValue: 80,
        min         : 8,
        max         : 400,
        step        : 1,
        unit        : "px",
    },
    fontWeight: {
        type        : ControlType.Number,
        title       : "Weight",
        defaultValue: 700,
        min         : 100,
        max         : 900,
        step        : 100,
    },
    fontFamily: {
        type        : ControlType.String,
        title       : "Font Family",
        defaultValue: "Inter, sans-serif",
        description : "Must be loaded in your project. Editorial grotesques (Inter, PP Neue Montreal, Neue Haas) work best.",
    },
    textAlign: {
        type        : ControlType.Enum,
        title       : "Align",
        options     : ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },
    letterSpacing: {
        type        : ControlType.Number,
        title       : "Tracking",
        defaultValue: -0.04,
        min         : -0.2,
        max         : 0.5,
        step        : 0.005,
        description : "In em. −0.04 = tight editorial. 0 = default. 0.1 = airy.",
    },
    lineHeight: {
        type        : ControlType.Number,
        title       : "Leading",
        defaultValue: 1.1,
        min         : 0.5,
        max         : 3,
        step        : 0.05,
        description : "Unitless multiplier. Also controls 3D depth for Top/Bottom directions.",
    },
    wordSpacing: {
        type        : ControlType.Number,
        title       : "Word Gap",
        defaultValue: 0.28,
        min         : 0,
        max         : 2,
        step        : 0.02,
        description : "Space between words, in em.",
    },
    easing: {
        type        : ControlType.Enum,
        title       : "Easing",
        options     : ["snappy", "elastic", "cinematic", "butter", "custom"],
        optionTitles: ["Snappy", "Elastic", "Cinematic", "Butter", "Custom"],
        defaultValue: "snappy",
        description : "Snappy: fast spring, no bounce. Elastic: bouncy overshoot. Cinematic: luxury slow-out. Butter: smooth with anticipation.",
    },
    customEngine: {
        type        : ControlType.Enum,
        title       : "  ↳ Engine",
        options     : ["spring", "tween"],
        optionTitles: ["Spring", "Tween"],
        defaultValue: "spring",
        hidden      : (p: any) => p.easing !== "custom",
    },
    customDamping: {
        type        : ControlType.Number,
        title       : "  ↳ Damping",
        defaultValue: 25,
        min         : 0,
        max         : 100,
        step        : 1,
        description : "Friction. High = no bounce, low = oscillating overshoot.",
        hidden      : (p: any) => p.easing !== "custom" || p.customEngine !== "spring",
    },
    customStiffness: {
        type        : ControlType.Number,
        title       : "  ↳ Stiffness",
        defaultValue: 160,
        min         : 10,
        max         : 1000,
        step        : 10,
        description : "Tension. High = snappy and fast, low = slow and floaty.",
        hidden      : (p: any) => p.easing !== "custom" || p.customEngine !== "spring",
    },
    customDuration: {
        type        : ControlType.Number,
        title       : "  ↳ Duration",
        defaultValue: 0.3,
        min         : 0.05,
        max         : 3,
        step        : 0.05,
        unit        : "s",
        description : "Flip duration per character.",
        hidden      : (p: any) => p.easing !== "custom" || p.customEngine !== "tween",
    },
    perspectiveDistance: {
        type        : ControlType.Number,
        title       : "Perspective",
        defaultValue: 1000,
        min         : 300,
        max         : 3000,
        step        : 100,
        unit        : "px",
        description : "Vanishing point distance. 300px = dramatic fisheye. 3000px = nearly flat.",
    },
})
