/**
 * MorphText — Variable Font Scroll Reveal for Framer
 * ====================================================
 * Scroll-triggered typography component. Each word morphs through
 * a dramatic font-weight arc: hairline → black → settled.
 *
 * SETUP:
 *   1. Drop into your Framer project's /code folder
 *   2. Insert from the Components panel
 *   3. Pick a variable-weight font via the Font picker in the panel
 *
 * @version 1.0.0
 * @author Arsalan Ali
 * @website https://www.framer.com/@devarsalanali
 */

// // Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// import { useEffect, useRef, useState, CSSProperties } from "react"

// // ─────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────

// type AnimationMode =
//     | "default"
//     | "glitch"
//     | "wave"
//     | "blur"
//     | "expand"
//     | "stamp"
//     | "flip"
//     | "rise"

// interface MorphTextProps {
//     text: string
//     mode: AnimationMode
//     stagger: number
//     duration: number
//     settledWeight: number
//     triggerOnce: boolean
//     // Issue 2 fix: single fontSize, no mobileFontSize — Framer handles responsive sizing natively
//     fontSize: number
//     lineHeight: number
//     textAlign: "left" | "center" | "right"
//     accentColor: string
//     textColor: string
//     settledColor: string
//     // Issue 4 fix: font is now a ControlType.Font object from Framer's native font picker
//     font: any
//     padding: number
// }

// // ─────────────────────────────────────────────────────────────────
// // Keyframe states per animation mode
// // ─────────────────────────────────────────────────────────────────

// interface WordAnimState {
//     fontWeight: number
//     color: string
//     opacity: number
//     y: number
//     x: number
//     skewX: number
//     scaleY: number
//     letterSpacing: string
// }

// function getKeyframes(
//     mode: AnimationMode,
//     accentColor: string,
//     textColor: string,
//     settledColor: string,
//     settledWeight: number
// ): {
//     peak: WordAnimState
//     exit: WordAnimState
//     settled: WordAnimState
// } {
//     // Issue 1 fix: removed `enter` from here — words start hidden via inline
//     // style, then jump DIRECTLY to `peak` with no intermediate `entering` phase.
//     // That dead frame was the source of the lag on every animation.

//     const base = {
//         peak: {
//             fontWeight: 900,
//             color: textColor,
//             opacity: 1,
//             y: 0,
//             x: 0,
//             skewX: 0,
//             scaleY: 1,
//             letterSpacing: "-0.03em",
//         },
//         exit: {
//             fontWeight: 900,
//             color: accentColor,
//             opacity: 1,
//             y: 0,
//             x: 0,
//             skewX: 0,
//             scaleY: 1,
//             letterSpacing: "-0.03em",
//         },
//         settled: {
//             fontWeight: settledWeight,
//             color: settledColor,
//             opacity: 1,
//             y: 0,
//             x: 0,
//             skewX: 0,
//             scaleY: 1,
//             letterSpacing: "-0.01em",
//         },
//     }

//     if (mode === "glitch")
//         return {
//             peak: { ...base.peak, x: 5, skewX: 4, color: "#ff57a8" },
//             exit: { ...base.exit, x: -3, skewX: -2, color: "#57ffee" },
//             settled: { ...base.settled, x: 0, skewX: 0 },
//         }

//     if (mode === "wave")
//         return {
//             peak: { ...base.peak, y: -6, scaleY: 0.88, color: "#57a8ff" },
//             exit: { ...base.exit, y: 3, scaleY: 1.04, color: accentColor },
//             settled: { ...base.settled, y: 0, scaleY: 1 },
//         }

//     if (mode === "blur")
//         return {
//             peak: { ...base.peak, color: textColor },
//             exit: { ...base.exit, color: accentColor },
//             settled: { ...base.settled },
//         }

//     if (mode === "expand")
//         return {
//             peak: { ...base.peak, letterSpacing: "-0.04em" },
//             exit: {
//                 ...base.exit,
//                 letterSpacing: "-0.04em",
//                 color: accentColor,
//             },
//             settled: { ...base.settled, letterSpacing: "-0.01em" },
//         }

//     if (mode === "stamp")
//         return {
//             peak: { ...base.peak, y: 4, scaleY: 0.95 },
//             exit: { ...base.exit, y: 0, scaleY: 1, color: accentColor },
//             settled: { ...base.settled, y: 0, scaleY: 1 },
//         }

//     if (mode === "flip")
//         return {
//             peak: { ...base.peak, scaleY: 0.92 },
//             exit: { ...base.exit, scaleY: 1, color: accentColor },
//             settled: { ...base.settled, scaleY: 1 },
//         }

//     if (mode === "rise")
//         return {
//             peak: { ...base.peak, y: -3 },
//             exit: { ...base.exit, y: 0, color: accentColor },
//             settled: { ...base.settled, y: 0 },
//         }

//     return base
// }

// // ─────────────────────────────────────────────────────────────────
// // Hidden (initial) state per mode
// // Defined separately so words go STRAIGHT from hidden → peak
// // Issue 1 fix: no "entering" phase that mirrors hidden — that was the lag
// // ─────────────────────────────────────────────────────────────────

// function getHiddenStyle(mode: AnimationMode): CSSProperties {
//     const base: CSSProperties = {
//         opacity: 0,
//         display: "inline-block",
//         fontWeight: 100,
//         letterSpacing: "0.08em",
//         color: "rgba(255,255,255,0.05)",
//     }
//     if (mode === "glitch")
//         return { ...base, transform: "translateY(18px) skewX(-10deg)" }
//     if (mode === "wave")
//         return {
//             ...base,
//             transform: "translateY(32px) scaleY(1.7)",
//             transformOrigin: "bottom center",
//         }
//     if (mode === "blur")
//         return { ...base, transform: "translateY(0)", filter: "blur(18px)" }
//     if (mode === "expand")
//         return {
//             ...base,
//             transform: "translateY(0) scaleX(1.15)",
//             letterSpacing: "0.7em",
//         }
//     if (mode === "stamp")
//         return {
//             ...base,
//             transform: "translateY(-50px) scale(1.6)",
//             transformOrigin: "top center",
//             fontWeight: 900,
//         }
//     if (mode === "flip")
//         return {
//             ...base,
//             transform: "perspective(500px) rotateX(95deg)",
//             transformOrigin: "bottom center",
//         }
//     if (mode === "rise")
//         return {
//             ...base,
//             transform: "translateY(40px)",
//             filter: "blur(8px)",
//             fontWeight: 200,
//         }
//     // default
//     return { ...base, transform: "translateY(18px)" }
// }

// // ─────────────────────────────────────────────────────────────────
// // Single animated word
// // ─────────────────────────────────────────────────────────────────

// interface WordProps {
//     word: string
//     index: number
//     isPlaying: boolean
//     mode: AnimationMode
//     stagger: number
//     duration: number
//     settledWeight: number
//     accentColor: string
//     textColor: string
//     settledColor: string
//     reduceMotion: boolean
// }

// // Issue 1 fix: 3 phases only — hidden, peak, exiting, settled, fadeout
// // "entering" phase removed — it was identical to hidden and caused one frame of lag
// type WordPhase = "hidden" | "peak" | "exiting" | "settled" | "fadeout"

// function AnimatedWord({
//     word,
//     index,
//     isPlaying,
//     mode,
//     stagger,
//     duration,
//     settledWeight,
//     accentColor,
//     textColor,
//     settledColor,
//     reduceMotion,
// }: WordProps) {
//     const [phase, setPhase] = useState<WordPhase>("hidden")
//     const timers = useRef<ReturnType<typeof setTimeout>[]>([])

//     useEffect(() => {
//         timers.current.forEach(clearTimeout)
//         timers.current = []

//         if (!isPlaying) {
//             setPhase("fadeout")
//             timers.current.push(setTimeout(() => setPhase("hidden"), 280))
//             return
//         }

//         const delay = index * stagger
//         const peakDur = duration * 0.38
//         const accentDur = duration * 0.22

//         // Go straight to "peak" — no intermediate entering phase
//         timers.current.push(
//             setTimeout(() => setPhase("peak"), delay),
//             setTimeout(() => setPhase("exiting"), delay + peakDur),
//             setTimeout(() => setPhase("settled"), delay + peakDur + accentDur)
//         )

//         return () => timers.current.forEach(clearTimeout)
//     }, [isPlaying, index, stagger, duration])

//     const kf = getKeyframes(
//         mode,
//         accentColor,
//         textColor,
//         settledColor,
//         settledWeight
//     )

//     if (reduceMotion) {
//         return (
//             <span style={{ display: "inline-block", marginRight: "0.28em" }}>
//                 <span
//                     style={{
//                         display: "inline-block",
//                         opacity:
//                             phase === "hidden" || phase === "fadeout" ? 0 : 1,
//                         fontWeight: settledWeight,
//                         color: settledColor,
//                         transition: "opacity 0.4s ease",
//                     }}
//                 >
//                     {word}
//                 </span>
//             </span>
//         )
//     }

//     // Blur filter logic for blur + rise modes
//     const needsBlur = mode === "blur" || mode === "rise"
//     const filterVal = needsBlur
//         ? phase === "hidden" || phase === "fadeout"
//             ? mode === "blur"
//                 ? "blur(18px)"
//                 : "blur(8px)"
//             : "blur(0px)"
//         : phase === "fadeout"
//           ? "blur(4px)"
//           : "none"

//     // Build the active style based on current phase
//     let activeStyle: CSSProperties

//     if (phase === "hidden") {
//         // No transition on hidden — snap instantly
//         activeStyle = {
//             ...getHiddenStyle(mode),
//             transition: "none",
//             filter: filterVal,
//         }
//     } else if (phase === "fadeout") {
//         activeStyle = {
//             display: "inline-block",
//             opacity: 0,
//             transform: "translateY(-10px)",
//             filter: "blur(4px)",
//             transition:
//                 "opacity 240ms ease, transform 240ms ease, filter 240ms ease",
//         }
//     } else {
//         const s =
//             phase === "peak"
//                 ? kf.peak
//                 : phase === "exiting"
//                   ? kf.exit
//                   : kf.settled
//         const dur = duration

//         // Mode-specific transform string
//         let transform = `translateY(${s.y}px) translateX(${s.x}px) skewX(${s.skewX}deg) scaleY(${s.scaleY})`
//         if (mode === "flip") {
//             transform = `perspective(500px) rotateX(${phase === "peak" ? "-10deg" : "0deg"})`
//         }

//         activeStyle = {
//             display: "inline-block",
//             fontWeight: s.fontWeight,
//             color: s.color,
//             opacity: s.opacity,
//             transform,
//             letterSpacing: s.letterSpacing,
//             filter: filterVal,
//             transformOrigin:
//                 mode === "wave"
//                     ? "bottom center"
//                     : mode === "stamp"
//                       ? "top center"
//                       : mode === "flip"
//                         ? "bottom center"
//                         : "center",
//             transition: `
//                 font-weight    ${dur * 0.42}ms cubic-bezier(0.16,1,0.3,1),
//                 color          ${dur * 0.36}ms ease,
//                 opacity        ${dur * 0.28}ms ease,
//                 transform      ${dur * 0.42}ms cubic-bezier(0.16,1,0.3,1),
//                 letter-spacing ${dur * 0.42}ms cubic-bezier(0.16,1,0.3,1),
//                 filter         ${dur * 0.32}ms ease
//             `,
//             willChange: "font-weight, color, transform, opacity, filter",
//         }
//     }

//     return (
//         <span style={{ display: "inline-block", marginRight: "0.28em" }}>
//             <span style={activeStyle}>{word}</span>
//         </span>
//     )
// }

// // ─────────────────────────────────────────────────────────────────
// // Main MorphText component
// // ─────────────────────────────────────────────────────────────────

// /**
//  * MorphText
//  * @framerSupportedLayoutWidth any
//  * @framerSupportedLayoutHeight auto
//  * @framerIntrinsicWidth 600
//  * @framerIntrinsicHeight 160
//  */
// export function MorphText({
//     text = "Words that breathe weight.",
//     mode = "default",
//     stagger = 80,
//     duration = 900,
//     settledWeight = 300,
//     triggerOnce = true,
//     fontSize = 40,
//     lineHeight = 1.2,
//     textAlign = "left",
//     accentColor = "#c8ff57",
//     textColor = "#ffffff",
//     settledColor = "rgba(255,255,255,0.65)",
//     font = undefined,
//     padding = 0,
// }: MorphTextProps) {
//     const containerRef = useRef<HTMLDivElement>(null)
//     const reduceMotion = useReducedMotion() ?? false
//     const [isPlaying, setIsPlaying] = useState(false)
//     const hasPlayed = useRef(false)

//     // In Framer canvas preview — show settled state immediately, no scroll needed
//     const isCanvas = RenderTarget.current() === RenderTarget.canvas

//     const isInView = useInView(containerRef, {
//         once: triggerOnce,
//         margin: "-10% 0px -10% 0px",
//     })

//     useEffect(() => {
//         if (isCanvas) {
//             setIsPlaying(true)
//             return
//         }
//         if (isInView) {
//             if (triggerOnce && hasPlayed.current) return
//             setIsPlaying(false)
//             const t = setTimeout(() => {
//                 setIsPlaying(true)
//                 hasPlayed.current = true
//             }, 320)
//             return () => clearTimeout(t)
//         } else if (!triggerOnce) {
//             setIsPlaying(false)
//         }
//     }, [isInView, triggerOnce, isCanvas])

//     // Split text into lines.
//     // Framer passes the raw string value from the textarea — the user types \n
//     // but it arrives as the TWO characters backslash + n (char 92 + char 110),
//     // not a real newline (char 10). We replace both so either works.
//     const safeLines = text
//         .split(/\n|\\n/) // split on real newline OR literal backslash-n
//         .map((l) => l.replace(/\\n/g, "")) // strip any leftover \n fragments
//         .filter((l) => l.trim().length > 0)
//     const allWords: { word: string; lineIndex: number }[] = []
//     safeLines.forEach((line, li) => {
//         line.split(/\s+/)
//             .filter(Boolean)
//             .forEach((w) => {
//                 allWords.push({ word: w, lineIndex: li })
//             })
//     })

//     // Issue 4 fix: extract fontFamily from Framer's ControlType.Font object.
//     // Framer passes font as { family, weight, style, ... } — we only need family
//     // for the morph effect (weight is animated, we manage it ourselves).
//     const fontFamily = font?.family ?? "inherit"

//     let globalIndex = 0

//     return (
//         <div
//             ref={containerRef}
//             style={{
//                 width: "100%",
//                 padding,
//                 fontFamily,
//                 fontSize,
//                 textAlign,
//                 lineHeight,
//                 userSelect: "none",
//                 overflow: "hidden",
//             }}
//         >
//             {safeLines.map((_, li) => {
//                 const lineWords = allWords.filter((w) => w.lineIndex === li)
//                 return (
//                     <div
//                         key={li}
//                         style={{
//                             display: "flex",
//                             flexWrap: "wrap",
//                             justifyContent:
//                                 textAlign === "center"
//                                     ? "center"
//                                     : textAlign === "right"
//                                       ? "flex-end"
//                                       : "flex-start",
//                             lineHeight,
//                             marginBottom:
//                                 li < safeLines.length - 1 ? "0.15em" : 0,
//                         }}
//                     >
//                         {lineWords.map(({ word }) => {
//                             const gi = globalIndex++
//                             return (
//                                 <AnimatedWord
//                                     key={`${li}-${gi}`}
//                                     word={word}
//                                     index={gi}
//                                     isPlaying={isPlaying}
//                                     mode={mode}
//                                     stagger={stagger}
//                                     duration={duration}
//                                     settledWeight={settledWeight}
//                                     accentColor={accentColor}
//                                     textColor={textColor}
//                                     settledColor={settledColor}
//                                     reduceMotion={reduceMotion}
//                                 />
//                             )
//                         })}
//                     </div>
//                 )
//             })}
//         </div>
//     )
// }

// // ─────────────────────────────────────────────────────────────────
// // Property Controls
// // ─────────────────────────────────────────────────────────────────

// addPropertyControls(MorphText, {
//     // ── Content ──────────────────────────────────────────────────
//     text: {
//         type: ControlType.String,
//         title: "Text",
//         defaultValue: "Words that breathe weight.",
//         displayTextArea: true,
//         description: 'Type \\n to create a new line (e.g. "Hello\\nWorld").',
//     },

//     // ── Animation ────────────────────────────────────────────────
//     mode: {
//         type: ControlType.Enum,
//         title: "Mode",
//         options: [
//             "default",
//             "glitch",
//             "wave",
//             "blur",
//             "expand",
//             "stamp",
//             "flip",
//             "rise",
//         ],
//         optionTitles: [
//             "Default",
//             "Glitch",
//             "Wave",
//             "Blur",
//             "Expand",
//             "Stamp",
//             "Flip",
//             "Rise",
//         ],
//         defaultValue: "default",
//         description:
//             "Default = weight morph · Glitch = RGB split · Wave = vertical bounce · Blur = fog dissolve · Expand = letter-spacing burst · Stamp = drop from above · Flip = 3D rotate · Rise = float up",
//     },

//     // Issue 3 fix: stagger max raised to 1000ms — slow word-by-word is a valid use case
//     stagger: {
//         type: ControlType.Number,
//         title: "Stagger",
//         defaultValue: 80,
//         min: 0,
//         max: 1000,
//         step: 10,
//         unit: "ms",
//         description:
//             "Delay between each word's reveal. 0 = all at once. 80 = natural cascade. 500+ = slow dramatic reveal.",
//     },

//     // Issue 3 fix: duration max raised to 5000ms — slow morphs are beautiful
//     duration: {
//         type: ControlType.Number,
//         title: "Duration",
//         defaultValue: 900,
//         min: 100,
//         max: 5000,
//         step: 100,
//         unit: "ms",
//         description:
//             "How long each word's full morph cycle takes. 900ms = default. 3000ms+ = luxurious slow motion.",
//     },

//     settledWeight: {
//         type: ControlType.Number,
//         title: "Settled Weight",
//         defaultValue: 300,
//         min: 100,
//         max: 900,
//         step: 100,
//         description:
//             "Font weight words settle to after the morph. 100 = hairline, 900 = stays black.",
//     },
//     triggerOnce: {
//         type: ControlType.Boolean,
//         title: "Trigger Once",
//         defaultValue: true,
//         description:
//             "On: plays once on scroll. Off: replays every time the component enters the viewport.",
//     },

//     // ── Appearance ───────────────────────────────────────────────

//     // Issue 2 fix: single fontSize, no mobileFontSize
//     // Framer's responsive canvas handles breakpoints natively
//     fontSize: {
//         type: ControlType.Number,
//         title: "Font Size",
//         defaultValue: 40,
//         min: 8,
//         max: 300,
//         step: 1,
//         unit: "px",
//         description:
//             "Text size in pixels. Use Framer's breakpoint tools to set different sizes per viewport.",
//     },

//     // Issue 4 fix: ControlType.Font — Framer's native font picker
//     // Shows dropdown of ALL fonts loaded in the project, including Google Fonts,
//     // custom uploads, and system fonts. Weight/style controls are built in.
//     font: {
//         type: ControlType.Font,
//         title: "Font",
//         controls: "extended",
//         defaultValue: {
//             family: "Unbounded",
//             style: "Regular",
//         },
//         description:
//             "Pick any variable-weight font loaded in your project. The morph works best with fonts that have a wide wght axis (100–900).",
//     },

//     lineHeight: {
//         type: ControlType.Number,
//         title: "Line Height",
//         defaultValue: 1.2,
//         min: 0.8,
//         max: 3,
//         step: 0.05,
//     },
//     textAlign: {
//         type: ControlType.SegmentedEnum,
//         title: "Align",
//         options: ["left", "center", "right"],
//         optionTitles: ["Left", "Center", "Right"],
//         defaultValue: "left",
//     },
//     accentColor: {
//         type: ControlType.Color,
//         title: "Accent Color",
//         defaultValue: "#c8ff57",
//         description: "Flash color at the peak of each word's morph.",
//     },
//     textColor: {
//         type: ControlType.Color,
//         title: "Peak Color",
//         defaultValue: "#ffffff",
//         description: "Color at maximum weight, just before the accent flash.",
//     },
//     settledColor: {
//         type: ControlType.Color,
//         title: "Settled Color",
//         defaultValue: "rgba(255,255,255,0.65)",
//         description: "Final resting color once a word finishes animating.",
//     },
//     padding: {
//         type: ControlType.Number,
//         title: "Padding",
//         defaultValue: 0,
//         min: 0,
//         max: 120,
//         step: 4,
//         unit: "px",
//     },
// })

// export default MorphText

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, CSSProperties } from "react"

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type AnimationMode =
    | "default"
    | "glitch"
    | "wave"
    | "blur"
    | "expand"
    | "stamp"
    | "flip"
    | "rise"

interface MorphTextProps {
    text: string
    mode: AnimationMode
    stagger: number
    duration: number
    settledWeight: number
    triggerOnce: boolean
    // Issue 2 fix: single fontSize, no mobileFontSize — Framer handles responsive sizing natively
    fontSize: number
    lineHeight: number
    textAlign: "left" | "center" | "right"
    accentColor: string
    textColor: string
    settledColor: string
    // Issue 4 fix: font is now a ControlType.Font object from Framer's native font picker
    font: any
    padding: number
}

// ─────────────────────────────────────────────────────────────────
// Keyframe states per animation mode
// ─────────────────────────────────────────────────────────────────

interface WordAnimState {
    fontWeight: number
    color: string
    opacity: number
    y: number
    x: number
    skewX: number
    scaleY: number
    letterSpacing: string
}

function getKeyframes(
    mode: AnimationMode,
    accentColor: string,
    textColor: string,
    settledColor: string,
    settledWeight: number
): {
    peak: WordAnimState
    exit: WordAnimState
    settled: WordAnimState
} {
    // Issue 1 fix: removed `enter` from here — words start hidden via inline
    // style, then jump DIRECTLY to `peak` with no intermediate `entering` phase.
    // That dead frame was the source of the lag on every animation.

    const base = {
        peak: {
            fontWeight: 900,
            color: textColor,
            opacity: 1,
            y: 0,
            x: 0,
            skewX: 0,
            scaleY: 1,
            letterSpacing: "-0.03em",
        },
        exit: {
            fontWeight: 900,
            color: accentColor,
            opacity: 1,
            y: 0,
            x: 0,
            skewX: 0,
            scaleY: 1,
            letterSpacing: "-0.03em",
        },
        settled: {
            fontWeight: settledWeight,
            color: settledColor,
            opacity: 1,
            y: 0,
            x: 0,
            skewX: 0,
            scaleY: 1,
            letterSpacing: "-0.01em",
        },
    }

    if (mode === "glitch")
        return {
            peak: { ...base.peak, x: 5, skewX: 4, color: "#ff57a8" },
            exit: { ...base.exit, x: -3, skewX: -2, color: "#57ffee" },
            settled: { ...base.settled, x: 0, skewX: 0 },
        }

    if (mode === "wave")
        return {
            peak: { ...base.peak, y: -6, scaleY: 0.88, color: "#57a8ff" },
            exit: { ...base.exit, y: 3, scaleY: 1.04, color: accentColor },
            settled: { ...base.settled, y: 0, scaleY: 1 },
        }

    if (mode === "blur")
        return {
            peak: { ...base.peak, color: textColor },
            exit: { ...base.exit, color: accentColor },
            settled: { ...base.settled },
        }

    if (mode === "expand")
        return {
            peak: { ...base.peak, letterSpacing: "-0.04em" },
            exit: {
                ...base.exit,
                letterSpacing: "-0.04em",
                color: accentColor,
            },
            settled: { ...base.settled, letterSpacing: "-0.01em" },
        }

    if (mode === "stamp")
        return {
            peak: { ...base.peak, y: 4, scaleY: 0.95 },
            exit: { ...base.exit, y: 0, scaleY: 1, color: accentColor },
            settled: { ...base.settled, y: 0, scaleY: 1 },
        }

    if (mode === "flip")
        return {
            peak: { ...base.peak, scaleY: 0.92 },
            exit: { ...base.exit, scaleY: 1, color: accentColor },
            settled: { ...base.settled, scaleY: 1 },
        }

    if (mode === "rise")
        return {
            peak: { ...base.peak, y: -3 },
            exit: { ...base.exit, y: 0, color: accentColor },
            settled: { ...base.settled, y: 0 },
        }

    return base
}

// ─────────────────────────────────────────────────────────────────
// Hidden (initial) state per mode
// Defined separately so words go STRAIGHT from hidden → peak
// Issue 1 fix: no "entering" phase that mirrors hidden — that was the lag
// ─────────────────────────────────────────────────────────────────

function getHiddenStyle(mode: AnimationMode): CSSProperties {
    const base: CSSProperties = {
        opacity: 0,
        display: "inline-block",
        fontWeight: 100,
        letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.05)",
    }
    if (mode === "glitch")
        return { ...base, transform: "translateY(18px) skewX(-10deg)" }
    if (mode === "wave")
        return {
            ...base,
            transform: "translateY(32px) scaleY(1.7)",
            transformOrigin: "bottom center",
        }
    if (mode === "blur")
        return { ...base, transform: "translateY(0)", filter: "blur(18px)" }
    if (mode === "expand")
        return {
            ...base,
            transform: "translateY(0) scaleX(1.15)",
            letterSpacing: "0.7em",
        }
    if (mode === "stamp")
        return {
            ...base,
            transform: "translateY(-50px) scale(1.6)",
            transformOrigin: "top center",
            fontWeight: 900,
        }
    if (mode === "flip")
        return {
            ...base,
            transform: "perspective(500px) rotateX(95deg)",
            transformOrigin: "bottom center",
        }
    if (mode === "rise")
        return {
            ...base,
            transform: "translateY(40px)",
            filter: "blur(8px)",
            fontWeight: 200,
        }
    // default
    return { ...base, transform: "translateY(18px)" }
}

// ─────────────────────────────────────────────────────────────────
// Single animated word
// ─────────────────────────────────────────────────────────────────

interface WordProps {
    word: string
    index: number
    isPlaying: boolean
    mode: AnimationMode
    stagger: number
    duration: number
    settledWeight: number
    accentColor: string
    textColor: string
    settledColor: string
    reduceMotion: boolean
}

// Issue 1 fix: 3 phases only — hidden, peak, exiting, settled, fadeout
// "entering" phase removed — it was identical to hidden and caused one frame of lag
type WordPhase = "hidden" | "peak" | "exiting" | "settled" | "fadeout"

function AnimatedWord({
    word,
    index,
    isPlaying,
    mode,
    stagger,
    duration,
    settledWeight,
    accentColor,
    textColor,
    settledColor,
    reduceMotion,
}: WordProps) {
    const [phase, setPhase] = useState<WordPhase>("hidden")
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])

    useEffect(() => {
        timers.current.forEach(clearTimeout)
        timers.current = []

        if (!isPlaying) {
            setPhase("fadeout")
            timers.current.push(setTimeout(() => setPhase("hidden"), 280))
            return
        }

        const delay = index * stagger
        const peakDur = duration * 0.38
        const accentDur = duration * 0.22

        // Go straight to "peak" — no intermediate entering phase
        timers.current.push(
            setTimeout(() => setPhase("peak"), delay),
            setTimeout(() => setPhase("exiting"), delay + peakDur),
            setTimeout(() => setPhase("settled"), delay + peakDur + accentDur)
        )

        return () => timers.current.forEach(clearTimeout)
    }, [isPlaying, index, stagger, duration])

    const kf = getKeyframes(
        mode,
        accentColor,
        textColor,
        settledColor,
        settledWeight
    )

    if (reduceMotion) {
        return (
            <span style={{ display: "inline-block", marginRight: "0.28em" }}>
                <span
                    style={{
                        display: "inline-block",
                        opacity:
                            phase === "hidden" || phase === "fadeout" ? 0 : 1,
                        fontWeight: settledWeight,
                        color: settledColor,
                        transition: "opacity 0.4s ease",
                    }}
                >
                    {word}
                </span>
            </span>
        )
    }

    // Blur filter logic for blur + rise modes
    const needsBlur = mode === "blur" || mode === "rise"
    const filterVal = needsBlur
        ? phase === "hidden" || phase === "fadeout"
            ? mode === "blur"
                ? "blur(18px)"
                : "blur(8px)"
            : "blur(0px)"
        : phase === "fadeout"
          ? "blur(4px)"
          : "none"

    // Build the active style based on current phase
    let activeStyle: CSSProperties

    if (phase === "hidden") {
        // No transition on hidden — snap instantly
        activeStyle = {
            ...getHiddenStyle(mode),
            transition: "none",
            filter: filterVal,
        }
    } else if (phase === "fadeout") {
        activeStyle = {
            display: "inline-block",
            opacity: 0,
            transform: "translateY(-10px)",
            filter: "blur(4px)",
            transition:
                "opacity 240ms ease, transform 240ms ease, filter 240ms ease",
        }
    } else {
        const s =
            phase === "peak"
                ? kf.peak
                : phase === "exiting"
                  ? kf.exit
                  : kf.settled
        const dur = duration

        // Mode-specific transform string
        let transform = `translateY(${s.y}px) translateX(${s.x}px) skewX(${s.skewX}deg) scaleY(${s.scaleY})`
        if (mode === "flip") {
            transform = `perspective(500px) rotateX(${phase === "peak" ? "-10deg" : "0deg"})`
        }

        activeStyle = {
            display: "inline-block",
            fontWeight: s.fontWeight,
            color: s.color,
            opacity: s.opacity,
            transform,
            letterSpacing: s.letterSpacing,
            filter: filterVal,
            transformOrigin:
                mode === "wave"
                    ? "bottom center"
                    : mode === "stamp"
                      ? "top center"
                      : mode === "flip"
                        ? "bottom center"
                        : "center",
            transition: `
                font-weight    ${dur * 0.42}ms cubic-bezier(0.16,1,0.3,1),
                color          ${dur * 0.36}ms ease,
                opacity        ${dur * 0.28}ms ease,
                transform      ${dur * 0.42}ms cubic-bezier(0.16,1,0.3,1),
                letter-spacing ${dur * 0.42}ms cubic-bezier(0.16,1,0.3,1),
                filter         ${dur * 0.32}ms ease
            `,
            willChange: "font-weight, color, transform, opacity, filter",
        }
    }

    return (
        <span style={{ display: "inline-block", marginRight: "0.28em" }}>
            <span style={activeStyle}>{word}</span>
        </span>
    )
}

// ─────────────────────────────────────────────────────────────────
// Main MorphText component
// ─────────────────────────────────────────────────────────────────

/**
 * MorphText
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 160
 */
export function MorphText({
    text = "Words that breathe weight.",
    mode = "default",
    stagger = 80,
    duration = 900,
    settledWeight = 300,
    triggerOnce = true,
    fontSize = 40,
    lineHeight = 1.2,
    textAlign = "left",
    accentColor = "#c8ff57",
    textColor = "#ffffff",
    settledColor = "rgba(255,255,255,0.65)",
    font = undefined,
    padding = 0,
}: MorphTextProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const reduceMotion = useReducedMotion() ?? false
    const [isPlaying, setIsPlaying] = useState(false)
    const hasPlayed = useRef(false)

    // In Framer canvas preview — show settled state immediately, no scroll needed
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const isInView = useInView(containerRef, {
        once: triggerOnce,
        margin: "-10% 0px -10% 0px",
    })

    useEffect(() => {
        if (isCanvas) {
            setIsPlaying(true)
            return
        }
        if (isInView) {
            if (triggerOnce && hasPlayed.current) return
            setIsPlaying(false)
            const t = setTimeout(() => {
                setIsPlaying(true)
                hasPlayed.current = true
            }, 320)
            return () => clearTimeout(t)
        } else if (!triggerOnce) {
            setIsPlaying(false)
        }
    }, [isInView, triggerOnce, isCanvas])

    // Split text into lines.
    // Framer passes the raw string value from the textarea — the user types \n
    // but it arrives as the TWO characters backslash + n (char 92 + char 110),
    // not a real newline (char 10). We replace both so either works.
    const safeLines = text
        .split(/\n|\\n/) // split on real newline OR literal backslash-n
        .map((l) => l.replace(/\\n/g, "")) // strip any leftover \n fragments
        .filter((l) => l.trim().length > 0)
    const allWords: { word: string; lineIndex: number }[] = []
    safeLines.forEach((line, li) => {
        line.split(/\s+/)
            .filter(Boolean)
            .forEach((w) => {
                allWords.push({ word: w, lineIndex: li })
            })
    })

    // ControlType.Font returns a CSS-ready style object — spread it directly.
    // Extracting font?.family alone does NOT work in Framer; the full spread is required.
    // We delete fontWeight (we animate it), fontSize and lineHeight (we have our own controls).
    const fontStyle: Record<string, any> = font ? { ...font } : {}
    delete fontStyle.fontWeight
    delete fontStyle.fontSize
    delete fontStyle.lineHeight

    let globalIndex = 0

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                padding,
                ...fontStyle, // picks up fontFamily + any other font CSS properties
                fontSize, // our Number control takes precedence
                lineHeight, // our Number control takes precedence
                fontWeight: 100, // base weight — animation overrides per-word
                textAlign,
                userSelect: "none",
                overflow: "hidden",
            }}
        >
            {safeLines.map((_, li) => {
                const lineWords = allWords.filter((w) => w.lineIndex === li)
                return (
                    <div
                        key={li}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent:
                                textAlign === "center"
                                    ? "center"
                                    : textAlign === "right"
                                      ? "flex-end"
                                      : "flex-start",
                            lineHeight,
                            marginBottom:
                                li < safeLines.length - 1 ? "0.15em" : 0,
                        }}
                    >
                        {lineWords.map(({ word }) => {
                            const gi = globalIndex++
                            return (
                                <AnimatedWord
                                    key={`${li}-${gi}`}
                                    word={word}
                                    index={gi}
                                    isPlaying={isPlaying}
                                    mode={mode}
                                    stagger={stagger}
                                    duration={duration}
                                    settledWeight={settledWeight}
                                    accentColor={accentColor}
                                    textColor={textColor}
                                    settledColor={settledColor}
                                    reduceMotion={reduceMotion}
                                />
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Property Controls
// ─────────────────────────────────────────────────────────────────

addPropertyControls(MorphText, {
    // ── Content ──────────────────────────────────────────────────
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Words that breathe weight.",
        displayTextArea: true,
        description: 'Type \\n to create a new line (e.g. "Hello\\nWorld").',
    },

    // ── Animation ────────────────────────────────────────────────
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: [
            "default",
            "glitch",
            "wave",
            "blur",
            "expand",
            "stamp",
            "flip",
            "rise",
        ],
        optionTitles: [
            "Default",
            "Glitch",
            "Wave",
            "Blur",
            "Expand",
            "Stamp",
            "Flip",
            "Rise",
        ],
        defaultValue: "default",
        description:
            "Default = weight morph · Glitch = RGB split · Wave = vertical bounce · Blur = fog dissolve · Expand = letter-spacing burst · Stamp = drop from above · Flip = 3D rotate · Rise = float up",
    },

    // Issue 3 fix: stagger max raised to 1000ms — slow word-by-word is a valid use case
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 80,
        min: 0,
        max: 1000,
        step: 10,
        unit: "ms",
        description:
            "Delay between each word's reveal. 0 = all at once. 80 = natural cascade. 500+ = slow dramatic reveal.",
    },

    // Issue 3 fix: duration max raised to 5000ms — slow morphs are beautiful
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 900,
        min: 100,
        max: 5000,
        step: 100,
        unit: "ms",
        description:
            "How long each word's full morph cycle takes. 900ms = default. 3000ms+ = luxurious slow motion.",
    },

    settledWeight: {
        type: ControlType.Number,
        title: "Settled Weight",
        defaultValue: 300,
        min: 100,
        max: 900,
        step: 100,
        description:
            "Font weight words settle to after the morph. 100 = hairline, 900 = stays black.",
    },
    triggerOnce: {
        type: ControlType.Boolean,
        title: "Trigger Once",
        defaultValue: true,
        description:
            "On: plays once on scroll. Off: replays every time the component enters the viewport.",
    },

    // ── Appearance ───────────────────────────────────────────────

    // Issue 2 fix: single fontSize, no mobileFontSize
    // Framer's responsive canvas handles breakpoints natively
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 40,
        min: 8,
        max: 300,
        step: 1,
        unit: "px",
        description:
            "Text size in pixels. Use Framer's breakpoint tools to set different sizes per viewport.",
    },

    // Issue 4 fix: ControlType.Font — Framer's native font picker
    // Shows dropdown of ALL fonts loaded in the project, including Google Fonts,
    // custom uploads, and system fonts. Weight/style controls are built in.
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            family: "Unbounded",
            style: "Regular",
        },
        description:
            "Pick any variable-weight font loaded in your project. The morph works best with fonts that have a wide wght axis (100–900).",
    },

    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.2,
        min: 0.8,
        max: 3,
        step: 0.05,
    },
    textAlign: {
        type: ControlType.SegmentedEnum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#c8ff57",
        description: "Flash color at the peak of each word's morph.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Peak Color",
        defaultValue: "#ffffff",
        description: "Color at maximum weight, just before the accent flash.",
    },
    settledColor: {
        type: ControlType.Color,
        title: "Settled Color",
        defaultValue: "rgba(255,255,255,0.65)",
        description: "Final resting color once a word finishes animating.",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
    },
})

export default MorphText
