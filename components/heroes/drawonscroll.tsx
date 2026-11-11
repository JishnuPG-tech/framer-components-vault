// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"
import {
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"

interface PathItem {
    name?: string
    d: string
    x?: number
    y?: number
    scale?: number
    direction?: "inherit" | "forward" | "reverse"
    strokeColor?: string
    strokeWidth?: number
    delay?: number
    duration?: number
}

interface DrawOnScrollProps {
    paths: PathItem[]
    viewBoxWidth: number
    viewBoxHeight: number
    sizing: "fit" | "fill" | "stretch"
    strokeColor: string
    strokeWidth: number
    strokeLinecap: "butt" | "round" | "square"
    strokeLinejoin: "miter" | "round" | "bevel"
    direction: "forward" | "reverse"
    fillEnabled: boolean
    fillColor: string
    duration: number
    delay: number
    stagger: number
    easing: string
    triggerPosition: number
    triggerAmount: number
    replay: boolean
    loop: boolean
    loopStyle: "loop" | "mirror"
    loopDelay: number
    fadeOut: number
    highlightPath: number
    style?: CSSProperties
}

const EASINGS: Record<string, string | number[]> = {
    linear: "linear",
    easeIn: "easeIn",
    easeOut: "easeOut",
    easeInOut: "easeInOut",
    circOut: "circOut",
    backOut: [0.34, 1.56, 0.64, 1],
}

/**
 * Draw On Scroll
 *
 * Animates ("draws") one or more SVG paths when the component enters the
 * viewport. The trigger position is configurable, so the stroke starts drawing
 * when the element reaches a chosen point in the viewport instead of instantly.
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 240
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DrawOnScroll(props: DrawOnScrollProps) {
    const {
        paths = [{ d: "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80" }],
        viewBoxWidth = 200,
        viewBoxHeight = 160,
        sizing = "fit",
        strokeColor = "#0099FF",
        strokeWidth = 6,
        strokeLinecap = "round",
        strokeLinejoin = "round",
        direction = "forward",
        fillEnabled = false,
        fillColor = "#0099FF",
        duration = 1.5,
        delay = 0,
        stagger = 0.2,
        easing = "easeInOut",
        triggerPosition = 20,
        triggerAmount = 0,
        replay = false,
        loop = false,
        loopStyle = "mirror",
        loopDelay = 0,
        fadeOut = 0.4,
        highlightPath = -1,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement>(null)

    // Two observers with different jobs:
    // 1) `triggered` uses a shrunk region — triggerPosition (0–100%) pulls the
    //    detection line up from the bottom of the viewport, so a higher value
    //    makes the element scroll further up before the draw STARTS. amount
    //    controls how much of the element must be visible to fire.
    const triggered = useInView(ref, {
        amount: triggerAmount,
        margin: `0px 0px -${triggerPosition}% 0px` as any,
    })
    // 2) `onScreen` watches the full viewport — used only to decide when to
    //    reset for Replay, so the path stays drawn while any part is visible.
    const onScreen = useInView(ref)

    const [drawn, setDrawn] = useState(false)
    useEffect(() => {
        if (triggered) {
            startTransition(() => setDrawn(true))
        } else if (replay && !onScreen) {
            // Only reset once the element has fully left the viewport, so
            // scrolling past the trigger point never makes a drawn path vanish.
            startTransition(() => setDrawn(false))
        }
    }, [triggered, onScreen, replay])

    const ease = EASINGS[easing] ?? "easeInOut"

    // Loop as a whole component: sync every path's timing to the full
    // composition length, so all paths draw in their staggered order, then the
    // entire drawing cycles together (instead of each path cycling on its own
    // short period). `compLen` is when the last path finishes = max over paths
    // of (its start offset + its own duration), relative to the global delay.
    const compLen = paths.reduce(
        (max, p, i) =>
            Math.max(max, (p.delay ?? i * stagger) + (p.duration ?? duration)),
        0
    )

    // Restart = clear the whole drawing to blank and redraw from scratch each
    // cycle; Yoyo = draw then erase (handled by framer-motion's mirror repeat).
    const restartLoop = loop && loopStyle === "loop"
    const mirrorLoop = loop && loopStyle === "mirror"

    // Restart loop is driven here (not by per-path repeat) so all paths blank
    // at the same instant: after the drawing completes and holds, the whole
    // composition fades out together (`fadingOut`), then bumping `loopTick`
    // remounts every path — resetting them to blank so they redraw from scratch.
    const [loopTick, setLoopTick] = useState(0)
    const [fadingOut, setFadingOut] = useState(false)
    useEffect(() => {
        // Pause the loop (and its DOM remounts) whenever the element is
        // off-screen; it resumes when scrolled back into view.
        if (!restartLoop || !drawn || !onScreen || isStatic) {
            // Never leave the drawing stuck faded-out while paused.
            setFadingOut(false)
            return
        }
        setFadingOut(false)
        // Draw phase = initial delay + whole composition draw + the pause after.
        // Each redraw re-applies the global delay, so include it.
        const drawMs = (delay + compLen + loopDelay) * 1000
        const fadeMs = fadeOut * 1000
        if (drawMs <= 0) return
        let fadeTimer = 0
        let remountTimer = 0
        const cycle = () => {
            fadeTimer = window.setTimeout(() => {
                startTransition(() => setFadingOut(true))
                remountTimer = window.setTimeout(() => {
                    startTransition(() => {
                        setFadingOut(false)
                        setLoopTick((t) => t + 1)
                    })
                    cycle()
                }, fadeMs)
            }, drawMs)
        }
        cycle()
        return () => {
            window.clearTimeout(fadeTimer)
            window.clearTimeout(remountTimer)
        }
    }, [
        restartLoop,
        drawn,
        onScreen,
        isStatic,
        delay,
        compLen,
        loopDelay,
        fadeOut,
    ])

    // Per-path stroke overrides fall back to the global stroke when unset.
    const sharedPathProps = (path: PathItem) => ({
        d: path.d,
        stroke: path.strokeColor ?? strokeColor,
        strokeWidth: path.strokeWidth ?? strokeWidth,
        strokeLinecap,
        strokeLinejoin,
        fill: fillEnabled ? fillColor : "none",
    })

    // Sizing controls how the artwork fills the instance when its proportions
    // don't match the viewBox: fit = letterbox (contain), fill = crop (cover),
    // stretch = distort to fill.
    const preserveAspectRatio =
        sizing === "fill"
            ? "xMidYMid slice"
            : sizing === "stretch"
              ? "none"
              : "xMidYMid meet"

    // Key that drives remounts of the whole-composition wrapper. Restart bumps
    // it each cycle; Yoyo changes it on viewport enter/leave so the loop pauses
    // off-screen and restarts cleanly on return; otherwise it stays stable.
    const wrapperKey = restartLoop
        ? `restart-${loopTick}`
        : mirrorLoop
          ? `mirror-${onScreen}`
          : "static"

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                // Responsive: when only one dimension is constrained (e.g. Fill
                // width with auto height), derive the other from the viewBox so
                // the component keeps the artwork's proportions. Ignored when
                // both width and height are already fixed by Framer.
                aspectRatio: `${viewBoxWidth} / ${viewBoxHeight}`,
                ...style,
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                preserveAspectRatio={preserveAspectRatio}
                fill="none"
                style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
            >
                {/* Wrapper fades the whole composition out together at the end
                    of each Restart cycle; remounting it (key = loopTick) resets
                    to blank so every path redraws from scratch, in sync. */}
                <motion.g
                    key={wrapperKey}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: fadingOut ? 0 : 1 }}
                    transition={{ duration: fadeOut, ease: "easeInOut" }}
                >
                {paths.map((path, index) => {
                    const { x = 0, y = 0, scale = 1 } = path
                    const transform = `translate(${x} ${y}) scale(${scale})`
                    // Resolve this path's draw direction (per-path override, else
                    // the global Direction). Reverse anchors the visible segment
                    // at the path end and grows it back toward the start.
                    const pathDir =
                        !path.direction || path.direction === "inherit"
                            ? direction
                            : path.direction
                    const emptyOffset = pathDir === "reverse" ? 1 : 0
                    // Per-path delay overrides the auto-stagger for this path;
                    // the global delay still offsets everything.
                    const startDelay =
                        delay + (path.delay ?? index * stagger)
                    // Per-path duration override, else the global Duration.
                    const dur = path.duration ?? duration
                    // Repeat period is shared across all paths (the whole
                    // composition), so each path's repeatDelay fills the gap
                    // between its own tween length and that master period.
                    const loopGap = compLen + loopDelay - dur
                    // On the Framer canvas / export there is no animation loop,
                    // so render a plain, fully drawn path as the static preview.
                    // Highlight dimming is canvas-only, so it never reaches the
                    // published site. Path names are metadata for the panel only
                    // and are intentionally not drawn on the canvas.
                    if (isStatic) {
                        const dimmed =
                            highlightPath >= 0 && highlightPath !== index
                        return (
                            <g key={index} transform={transform}>
                                <path
                                    {...sharedPathProps(path)}
                                    opacity={dimmed ? 0.12 : 1}
                                />
                            </g>
                        )
                    }
                    return (
                        <g key={index} transform={transform}>
                        <motion.path
                            {...sharedPathProps(path)}
                            initial={{
                                pathLength: 0,
                                pathOffset: emptyOffset,
                                opacity: 0,
                                fillOpacity: fillEnabled ? 0 : undefined,
                            }}
                            animate={
                                drawn
                                    ? {
                                          pathLength: 1,
                                          pathOffset: 0,
                                          opacity: 1,
                                          fillOpacity: fillEnabled ? 1 : undefined,
                                      }
                                    : {
                                          pathLength: 0,
                                          pathOffset: emptyOffset,
                                          opacity: 0,
                                          fillOpacity: fillEnabled ? 0 : undefined,
                                      }
                            }
                            transition={
                                drawn
                                    ? {
                                          pathLength: {
                                              duration: dur,
                                              delay: startDelay,
                                              ease: ease as any,
                                              ...(mirrorLoop && onScreen
                                                  ? {
                                                        repeat: Infinity,
                                                        repeatType: loopStyle,
                                                        repeatDelay: loopGap,
                                                    }
                                                  : {}),
                                          },
                                          pathOffset: {
                                              duration: dur,
                                              delay: startDelay,
                                              ease: ease as any,
                                              ...(mirrorLoop && onScreen
                                                  ? {
                                                        repeat: Infinity,
                                                        repeatType: loopStyle,
                                                        repeatDelay: loopGap,
                                                    }
                                                  : {}),
                                          },
                                          // Reveal exactly when the stroke starts
                                          // drawing so the round-cap "dot" at
                                          // pathLength 0 stays hidden while idle.
                                          opacity: {
                                              duration: 0.001,
                                              delay: startDelay,
                                          },
                                          fillOpacity: {
                                              duration: dur * 0.4,
                                              delay: startDelay + dur * 0.6,
                                              ease: "easeIn",
                                              // Keep the fill fade in step with the
                                              // stroke's whole-component loop period
                                              // so they don't drift apart over repeats.
                                              ...(mirrorLoop && onScreen
                                                  ? {
                                                        repeat: Infinity,
                                                        repeatType: loopStyle,
                                                        repeatDelay:
                                                            loopGap + dur * 0.6,
                                                    }
                                                  : {}),
                                          },
                                      }
                                    : {
                                          // Instant reset (Replay): snap back to
                                          // pathLength 0 the moment the element is
                                          // off-screen, so the next entry always
                                          // draws from scratch instead of just
                                          // reappearing fully drawn.
                                          pathLength: { duration: 0 },
                                          pathOffset: { duration: 0 },
                                          opacity: { duration: 0 },
                                          fillOpacity: { duration: 0 },
                                      }
                            }
                        />
                        </g>
                    )
                })}
                </motion.g>
            </svg>
        </div>
    )
}

addPropertyControls(DrawOnScroll, {
    paths: {
        type: ControlType.Array,
        title: "Paths",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    description:
                        "A label to identify this path while editing (e.g. arm, leaf, underline). For your reference in this panel only — not drawn on the canvas or the published site.",
                    placeholder: "e.g. arm, leaf, underline",
                    defaultValue: "",
                },
                d: {
                    type: ControlType.String,
                    title: "Path (d)",
                    defaultValue:
                        "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80",
                    displayTextArea: true,
                },
                x: {
                    type: ControlType.Number,
                    title: "X",
                    description:
                        "Horizontal offset in viewBox units (moves this path right).",
                    defaultValue: 0,
                    min: -2000,
                    max: 2000,
                    step: 1,
                },
                y: {
                    type: ControlType.Number,
                    title: "Y",
                    description:
                        "Vertical offset in viewBox units (moves this path down).",
                    defaultValue: 0,
                    min: -2000,
                    max: 2000,
                    step: 1,
                },
                scale: {
                    type: ControlType.Number,
                    title: "Scale",
                    defaultValue: 1,
                    min: 0.1,
                    max: 5,
                    step: 0.1,
                },
                direction: {
                    type: ControlType.Enum,
                    title: "Direction",
                    description:
                        "Global uses the component's Direction; otherwise overrides it for this path.",
                    options: ["inherit", "forward", "reverse"],
                    optionTitles: ["Global", "Forward", "Reverse"],
                    defaultValue: "inherit",
                    displaySegmentedControl: true,
                },
                strokeColor: {
                    type: ControlType.Color,
                    title: "Stroke",
                    description: "Overrides the global stroke color for this path.",
                    optional: true,
                },
                strokeWidth: {
                    type: ControlType.Number,
                    title: "Width",
                    description: "Overrides the global stroke width for this path.",
                    min: 0,
                    max: 100,
                    step: 0.5,
                    optional: true,
                },
                delay: {
                    type: ControlType.Number,
                    title: "Delay",
                    description:
                        "Hand-timed start delay for this path (added to the global Delay). Overrides the auto Stagger when set.",
                    min: 0,
                    max: 10,
                    step: 0.1,
                    unit: "s",
                    optional: true,
                },
                duration: {
                    type: ControlType.Number,
                    title: "Duration",
                    description:
                        "How long this path takes to draw. Overrides the global Duration when set.",
                    min: 0,
                    max: 10,
                    step: 0.1,
                    unit: "s",
                    optional: true,
                },
            },
        },
        defaultValue: [
            { d: "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80", x: 0, y: 0, scale: 1 },
        ],
    },
    viewBoxWidth: {
        type: ControlType.Number,
        title: "View W",
        defaultValue: 200,
        min: 1,
        max: 4000,
        step: 1,
    },
    viewBoxHeight: {
        type: ControlType.Number,
        title: "View H",
        defaultValue: 160,
        min: 1,
        max: 4000,
        step: 1,
    },
    sizing: {
        type: ControlType.Enum,
        title: "Sizing",
        description:
            "How the artwork fills the instance when their proportions differ: Fit = show all (letterbox), Fill = crop to cover, Stretch = distort to fill.",
        options: ["fit", "fill", "stretch"],
        optionTitles: ["Fit", "Fill", "Stretch"],
        defaultValue: "fit",
        displaySegmentedControl: true,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke",
        defaultValue: "#0099FF",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 6,
        min: 0,
        max: 100,
        step: 0.5,
    },
    strokeLinecap: {
        type: ControlType.Enum,
        title: "Cap",
        options: ["butt", "round", "square"],
        optionTitles: ["Butt", "Round", "Square"],
        defaultValue: "round",
        displaySegmentedControl: true,
    },
    strokeLinejoin: {
        type: ControlType.Enum,
        title: "Join",
        options: ["miter", "round", "bevel"],
        optionTitles: ["Miter", "Round", "Bevel"],
        defaultValue: "round",
        displaySegmentedControl: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        description:
            "Forward draws from the path's start; Reverse draws from its end back to the start.",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        defaultValue: "forward",
        displaySegmentedControl: true,
    },
    fillEnabled: {
        type: ControlType.Boolean,
        title: "Fill",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#0099FF",
        hidden: ({ fillEnabled }) => !fillEnabled,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.5,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description: "Extra delay per path when using multiple paths.",
        defaultValue: 0.2,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "circOut", "backOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out", "Circ Out", "Back Out"],
        defaultValue: "easeInOut",
    },
    triggerPosition: {
        type: ControlType.Enum,
        title: "Trigger At",
        description:
            "Viewport position where drawing starts. 0% = as it enters the bottom, 50% = screen center, higher = must scroll further up.",
        options: [0, 25, 50, 75, 100],
        optionTitles: ["0%", "25%", "50%", "75%", "100%"],
        defaultValue: 25,
        displaySegmentedControl: true,
    },
    triggerAmount: {
        type: ControlType.Number,
        title: "Visible",
        description:
            "How much of the element must be visible to trigger (0 = any pixel, 1 = fully visible).",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        description: "Redraw every time the element re-enters the viewport.",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "Once",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        description:
            "Continuously repeat the draw animation while the element is in view.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loopStyle: {
        type: ControlType.Enum,
        title: "Loop Style",
        description:
            "Restart re-draws from the start each cycle; Yoyo draws then erases back.",
        options: ["loop", "mirror"],
        optionTitles: ["Restart", "Yoyo"],
        defaultValue: "mirror",
        displaySegmentedControl: true,
        hidden: ({ loop }) => !loop,
    },
    loopDelay: {
        type: ControlType.Number,
        title: "Loop Delay",
        description: "Pause between loop cycles.",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: ({ loop }) => !loop,
    },
    fadeOut: {
        type: ControlType.Number,
        title: "Fade Out",
        description:
            "Restart loop only: fade the whole drawing out over this time before it blanks and redraws. Set to 0 for an instant cut.",
        defaultValue: 0.4,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        hidden: ({ loop, loopStyle }) => !loop || loopStyle !== "loop",
    },
    highlightPath: {
        type: ControlType.Number,
        title: "Highlight #",
        description:
            "Canvas aid: dims every path except this index so you can identify it. Set to -1 to show all. Ignored in Preview and on the published site.",
        defaultValue: -1,
        min: -1,
        max: 100,
        step: 1,
        displayStepper: true,
    },
})
