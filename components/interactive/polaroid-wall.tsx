import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useReducedMotion } from "framer-motion"

/**
 * Polaroid Wall
 * Prints pinned to a wall at slightly wrong angles. Photos "develop" as they
 * scroll into view, a card straightens and lifts on hover (neighbours shuffle
 * out of the way), videos play while hovered, and a click flips the print to
 * show a handwritten note on the back.
 *
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 720
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Img = string | { src?: string; srcSet?: string; alt?: string } | undefined

type Item = {
    image?: Img
    video?: string
    caption?: string
    note?: string
}

type Props = {
    items: Item[]
    // layout
    autoColumns: boolean
    minCardWidth: number
    columns: number
    gap: number
    padding: number
    aspect: string
    seed: number
    maxTilt: number
    jitter: number
    // print
    paper: string
    ink: string
    framePadding: number
    bottomSpace: number
    radius: number
    shadow: number
    vintage: number
    font: React.CSSProperties
    noteSize: number
    // pin
    pinStyle: "clothespin" | "tape" | "pin" | "none"
    woodColor: string
    pinSize: number
    showString: boolean
    twineColor: string
    strandOffset: number
    printWidth: number
    tapeColor: string
    pinColor: string
    // interaction
    hoverLift: number
    hoverScale: number
    repel: number
    flip: boolean
    flipHint: "none" | "corner" | "icon"
    peek: boolean
    videoMode: "hover" | "always"
    develop: boolean
    // wall
    background: string
    wallRadius: number
    overflowMode: "visible" | "clip" | "scroll"
    style?: React.CSSProperties
}

const HANDWRITING =
    "'Caveat', 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive"

const TONES: [string, string][] = [
    ["#7FA3A6", "#3F5F66"],
    ["#D2B48C", "#8C6A45"],
    ["#8E9BB8", "#46526F"],
    ["#A3B07A", "#58633A"],
    ["#B88CA3", "#6A3F57"],
    ["#E0B070", "#9A6A2A"],
]

const DEFAULT_ITEMS: Item[] = [
    {
        caption: "Day one",
        note: "Borrowed projector, nine people, one very loud fridge. Nobody left early.",
    },
    {
        caption: "First 100 users",
        note: "We counted them by hand and sent every one a thank-you.",
    },
    {
        caption: "Demo night",
        note: "The wifi died at slide 3. We finished from memory.",
    },
    {
        caption: "Whiteboard, 2am",
        note: "This is the diagram that finally made sense.",
    },
    { caption: "Offsite", note: "Two days, one decision. Worth it." },
    { caption: "Shipped", note: "Pressed the button, then went for tacos." },
    {
        caption: "Golden hour",
        note: "Best light of the whole trip, and we almost missed it.",
    },
    { caption: "Home", note: "Keys, couch, quiet. Exactly what we needed." },
]

// small deterministic PRNG so the "mess" is stable between renders
function rng(seed: number) {
    let t = seed >>> 0
    return () => {
        t += 0x6d2b79f5
        let r = Math.imul(t ^ (t >>> 15), 1 | t)
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
}

function useCanHover() {
    const [can, setCan] = useState(true)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const m = window.matchMedia("(hover: hover)")
        const update = () => setCan(m.matches)
        update()
        m.addEventListener?.("change", update)
        return () => m.removeEventListener?.("change", update)
    }, [])
    return can
}

function imgParts(img: Img): { src?: string; srcSet?: string; alt?: string } {
    if (!img) return {}
    if (typeof img === "string") return { src: img }
    return { src: img.src, srcSet: img.srcSet, alt: img.alt }
}

/* ------------------------------------------------------------------ */

type Target = { x: number; y: number; rotate: number; scale: number; z: number }

type Cfg = {
    paper: string
    ink: string
    pad: number
    bottomSpace: number
    radius: number
    shadow: number
    vintage: number
    aspect: string
    font: React.CSSProperties
    noteSize: number
    pinStyle: "clothespin" | "tape" | "pin" | "none"
    woodColor: string
    pinSize: number
    printWidth: number
    stringMode: boolean
    tapeColor: string
    pinColor: string
    flip: boolean
    flipHint: "none" | "corner" | "icon"
    peek: boolean
    videoMode: "hover" | "always"
    develop: boolean
    isStatic: boolean
    canHover: boolean
}

type CardProps = {
    item: Item
    index: number
    col: number
    target: Target
    tapeAngle: number
    tapeShift: number
    clipAngle: number
    tone: [string, string]
    hovered: boolean
    flipped: boolean
    onHover: (on: boolean) => void
    onFlip: () => void
    cfg: Cfg
}

const DARK_FILTER =
    "blur(14px) brightness(1.7) saturate(0) sepia(0) contrast(0.7)"
const CLEAR_FILTER = "blur(0px) brightness(1) saturate(1) sepia(0) contrast(1)"

function Card({
    item,
    index,
    col,
    target,
    tapeAngle,
    tapeShift,
    clipAngle,
    tone,
    hovered,
    flipped,
    onHover,
    onFlip,
    cfg,
}: CardProps) {
    const ref = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const seenOnce = useInView(ref, { once: true, amount: 0.3 })
    const seenLive = useInView(ref, { amount: 0.6 })
    const [settled, setSettled] = useState(false)
    const [focusRing, setFocusRing] = useState(false)
    const [peeking, setPeeking] = useState(false)
    const peeked = useRef(false)
    const interacted = useRef(false)
    const hintOn = cfg.flip && cfg.flipHint !== "none"

    useEffect(() => {
        if (hovered || flipped) interacted.current = true
    }, [hovered, flipped])

    // First print gives a single half-turn once everything has settled,
    // so people learn the cards turn over. Skipped if they've already touched one.
    useEffect(() => {
        if (
            !cfg.peek ||
            index !== 0 ||
            !cfg.flip ||
            cfg.isStatic ||
            peeked.current
        )
            return
        const ready = cfg.develop ? settled : seenOnce
        if (!ready || !seenLive) return
        const t1 = setTimeout(() => {
            peeked.current = true
            if (!interacted.current) setPeeking(true)
        }, 1000)
        const t2 = setTimeout(() => setPeeking(false), 2400)
        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [
        cfg.peek,
        cfg.flip,
        cfg.isStatic,
        cfg.develop,
        index,
        settled,
        seenOnce,
        seenLive,
    ])

    const { src, srcSet, alt } = imgParts(item.image)
    const caption = item.caption || ""
    const note = item.note || item.caption || ""
    const lifted = hovered || flipped

    // --- develop-on-scroll -------------------------------------------------
    const developed = !cfg.develop || cfg.isStatic || seenOnce
    const t = cfg.vintage
    const idleFilter = `blur(0px) brightness(1) saturate(${1 - 0.24 * t}) sepia(${0.24 * t}) contrast(${1 - 0.12 * t})`
    const filterTarget = !developed
        ? DARK_FILTER
        : lifted
          ? CLEAR_FILTER
          : idleFilter
    const filterInitial =
        cfg.develop && !cfg.isStatic ? DARK_FILTER : idleFilter

    // --- video -------------------------------------------------------------
    const wantPlay =
        !!item.video &&
        !flipped &&
        !cfg.isStatic &&
        (cfg.videoMode === "always" || hovered || (!cfg.canHover && seenLive))

    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        if (wantPlay) {
            const p = v.play()
            if (p && p.catch) p.catch(() => {})
        } else {
            v.pause()
        }
    }, [wantPlay])

    // --- shadows -----------------------------------------------------------
    const s = cfg.shadow
    const restShadow = `0 1px 1px rgba(20,24,28,${0.16 * s + 0.02}), 0 6px 14px -4px rgba(20,24,28,${0.3 * s})`
    const liftShadow = `0 2px 3px rgba(20,24,28,${0.12 * s + 0.02}), 0 22px 30px -10px rgba(20,24,28,${0.42 * s})`
    const ring = focusRing ? ", 0 0 0 3px #2F6BFF" : ""

    const face: React.CSSProperties = {
        background: `linear-gradient(180deg, rgba(255,255,255,0.45), rgba(0,0,0,0.025)), ${cfg.paper}`,
        borderRadius: cfg.radius,
        boxShadow: (lifted ? liftShadow : restShadow) + ring,
        transition: "box-shadow 0.3s ease",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        boxSizing: "border-box",
    }

    const noteLine = cfg.noteSize * 1.45

    return (
        <motion.div
            ref={ref}
            role={cfg.flip ? "button" : "group"}
            tabIndex={0}
            aria-label={caption || "Photo"}
            aria-pressed={cfg.flip ? flipped : undefined}
            onClick={(e) => {
                e.stopPropagation()
                if (cfg.flip) onFlip()
            }}
            onKeyDown={(e) => {
                if (cfg.flip && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    onFlip()
                }
            }}
            onHoverStart={() => onHover(true)}
            onHoverEnd={() => onHover(false)}
            onFocus={(e) => {
                onHover(true)
                setFocusRing(
                    e.target === e.currentTarget &&
                        e.currentTarget.matches(":focus-visible")
                )
            }}
            onBlur={() => {
                onHover(false)
                setFocusRing(false)
            }}
            animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotate,
                scale: target.scale,
            }}
            transition={
                cfg.isStatic
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 260, damping: 22, mass: 0.8 }
            }
            style={{
                position: "relative",
                zIndex: target.z,
                perspective: 1400,
                originX: 0.5,
                originY: cfg.stringMode ? 0 : 0.5,
                width: `${cfg.printWidth}%`,
                justifySelf: "center",
                cursor: cfg.flip ? "pointer" : "default",
                outline: "none",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <motion.div
                animate={{
                    rotateY: flipped
                        ? 180
                        : peeking
                          ? [0, -50, 0]
                          : hintOn && hovered && cfg.canHover && !cfg.isStatic
                            ? -12
                            : 0,
                }}
                transition={
                    cfg.isStatic
                        ? { duration: 0 }
                        : peeking
                          ? { duration: 1.3, ease: "easeInOut" }
                          : { duration: 0.7, ease: [0.3, 0.1, 0.2, 1] }
                }
                style={{ position: "relative", transformStyle: "preserve-3d" }}
            >
                {/* FRONT */}
                <div
                    style={{
                        ...face,
                        position: "relative",
                        padding: `${cfg.pad}px ${cfg.pad}px 0`,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: cfg.aspect,
                            overflow: "hidden",
                            borderRadius: 2,
                            background: "#1b1d1f",
                        }}
                    >
                        <motion.div
                            initial={{ filter: filterInitial }}
                            animate={{ filter: filterTarget }}
                            transition={
                                cfg.isStatic
                                    ? { duration: 0 }
                                    : settled
                                      ? { duration: 0.35, ease: "easeOut" }
                                      : {
                                            duration: 1.5,
                                            delay: col * 0.12,
                                            ease: [0.2, 0.6, 0.2, 1],
                                        }
                            }
                            onAnimationComplete={() => {
                                if (developed) setSettled(true)
                            }}
                            style={{ position: "absolute", inset: 0 }}
                        >
                            {item.video ? (
                                <video
                                    ref={videoRef}
                                    src={
                                        item.video.includes("#")
                                            ? item.video
                                            : item.video + "#t=0.001"
                                    }
                                    poster={src}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : src ? (
                                <img
                                    src={src}
                                    srcSet={srcSet}
                                    alt={alt || caption}
                                    draggable={false}
                                    loading="lazy"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <div
                                    aria-hidden
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        background: `linear-gradient(160deg, ${tone[0]}, ${tone[1]})`,
                                        display: "grid",
                                        placeItems: "center",
                                    }}
                                >
                                    <svg
                                        width="38%"
                                        viewBox="0 0 48 32"
                                        fill="none"
                                        style={{ opacity: 0.35 }}
                                    >
                                        <circle
                                            cx="35"
                                            cy="9"
                                            r="4"
                                            fill="#fff"
                                        />
                                        <path
                                            d="M0 32 L16 12 L26 24 L33 17 L48 32 Z"
                                            fill="#fff"
                                        />
                                    </svg>
                                </div>
                            )}
                        </motion.div>

                        {/* gloss + inner edge */}
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 38%)",
                                boxShadow:
                                    "inset 0 0 0 1px rgba(0,0,0,0.12), inset 0 3px 8px rgba(0,0,0,0.22)",
                            }}
                        />

                        {item.video && (
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    right: 8,
                                    bottom: 8,
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    background: "rgba(0,0,0,0.5)",
                                    display: "grid",
                                    placeItems: "center",
                                    opacity: wantPlay ? 0 : 1,
                                    transition: "opacity 0.25s ease",
                                }}
                            >
                                <svg
                                    width="9"
                                    height="10"
                                    viewBox="0 0 9 10"
                                    fill="#fff"
                                >
                                    <path d="M1 0.8 L8.2 5 L1 9.2 Z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            height: cfg.bottomSpace,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            color: cfg.ink,
                            padding: "0 4px",
                            boxSizing: "border-box",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: HANDWRITING,
                                fontSize: 18,
                                lineHeight: 1.1,
                                ...cfg.font,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {caption}
                        </span>
                    </div>

                    {cfg.flip && cfg.flipHint === "corner" && (
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                right: 0,
                                bottom: 0,
                                width: lifted ? 30 : 20,
                                height: lifted ? 30 : 20,
                                transition: "width 0.3s ease, height 0.3s ease",
                                filter: "drop-shadow(-2px -2px 3px rgba(0,0,0,0.22))",
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    clipPath:
                                        "polygon(100% 0, 0 100%, 100% 100%)",
                                    background:
                                        "linear-gradient(135deg, #ffffff 0%, #ddd6c6 100%)",
                                    borderBottomRightRadius: cfg.radius,
                                }}
                            />
                        </div>
                    )}

                    {cfg.flip && cfg.flipHint === "icon" && (
                        <svg
                            aria-hidden
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                position: "absolute",
                                right: cfg.pad + 2,
                                bottom: Math.max(4, (cfg.bottomSpace - 14) / 2),
                                color: cfg.ink,
                                opacity: lifted ? 0.8 : 0.4,
                                transform: lifted ? "rotate(180deg)" : "none",
                                transition:
                                    "opacity 0.3s ease, transform 0.5s ease",
                                pointerEvents: "none",
                            }}
                        >
                            <path d="M3 8a5 5 0 0 1 8.5-3.5L13 6" />
                            <path d="M13 2v4h-4" />
                            <path d="M13 8a5 5 0 0 1-8.5 3.5L3 10" />
                            <path d="M3 14v-4h4" />
                        </svg>
                    )}
                </div>

                {/* BACK */}
                <div
                    style={{
                        ...face,
                        position: "absolute",
                        inset: 0,
                        transform: "rotateY(180deg)",
                        padding: cfg.pad + 6,
                        overflow: "hidden",
                        color: cfg.ink,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            fontFamily: HANDWRITING,
                            ...cfg.font,
                            fontSize: cfg.noteSize,
                            lineHeight: `${noteLine}px`,
                            textAlign: "left",
                            letterSpacing: "normal",
                            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${noteLine - 1}px, rgba(60,90,140,0.2) ${noteLine - 1}px, rgba(60,90,140,0.2) ${noteLine}px)`,
                        }}
                    >
                        {note}
                    </div>
                </div>
            </motion.div>

            {/* CLOTHESPIN / TAPE / PIN (sits on the wall, so it doesn't flip) */}
            {cfg.pinStyle === "clothespin" && (
                <svg
                    aria-hidden
                    viewBox="0 0 20 56"
                    style={{
                        position: "absolute",
                        top: -cfg.pinSize * 40 * 0.58,
                        left: cfg.stringMode
                            ? "50%"
                            : `calc(50% + ${tapeShift * 0.5}%)`,
                        width: cfg.pinSize * 40 * (20 / 56),
                        height: cfg.pinSize * 40,
                        marginLeft: -(cfg.pinSize * 40 * (20 / 56)) / 2,
                        transform: `rotate(${clipAngle}deg)`,
                        transformOrigin: "50% 58%",
                        filter: "drop-shadow(0 2px 1.5px rgba(0,0,0,0.3))",
                        pointerEvents: "none",
                        zIndex: 3,
                        overflow: "visible",
                    }}
                >
                    <rect
                        x="9.2"
                        y="0"
                        width="1.6"
                        height="56"
                        fill="rgba(60,40,20,0.6)"
                    />
                    <path
                        d="M2 3Q2 0 5 0H9.4V52Q9.4 56 6.5 56H4.5Q3 56 3.2 54Z"
                        fill={cfg.woodColor}
                    />
                    <path
                        d="M18 3Q18 0 15 0H10.6V52Q10.6 56 13.5 56H15.5Q17 56 16.8 54Z"
                        fill={cfg.woodColor}
                    />
                    <path
                        d="M3.6 4V50"
                        stroke="rgba(255,255,255,0.38)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M16.4 4V50"
                        stroke="rgba(60,35,10,0.22)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M6.2 8V20M6.6 34V46M13.8 10V22M14 36V47"
                        stroke="rgba(90,55,20,0.28)"
                        strokeWidth="0.6"
                    />
                    <rect
                        x="0.8"
                        y="23"
                        width="18.4"
                        height="7"
                        rx="1.6"
                        fill="#8D949A"
                    />
                    <rect
                        x="0.8"
                        y="23"
                        width="18.4"
                        height="2.4"
                        rx="1.2"
                        fill="rgba(255,255,255,0.4)"
                    />
                    <path
                        d="M3 23V30M6.5 23V30M13.5 23V30M17 23V30"
                        stroke="rgba(0,0,0,0.25)"
                        strokeWidth="0.6"
                    />
                </svg>
            )}
            {cfg.pinStyle === "tape" && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: -11,
                        left: `calc(50% + ${tapeShift}%)`,
                        width: "34%",
                        height: 24,
                        transform: `translateX(-50%) rotate(${tapeAngle}deg)`,
                        background: `linear-gradient(90deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 40%, rgba(255,255,255,0.2)), ${cfg.tapeColor}`,
                        opacity: 0.85,
                        clipPath:
                            "polygon(0% 0%, 3% 12%, 0% 25%, 3% 38%, 0% 50%, 3% 62%, 0% 75%, 3% 88%, 0% 100%, 100% 100%, 97% 88%, 100% 75%, 97% 62%, 100% 50%, 97% 38%, 100% 25%, 97% 12%, 100% 0%)",
                        pointerEvents: "none",
                        zIndex: 3,
                    }}
                />
            )}
            {cfg.pinStyle === "pin" && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: -7,
                        left: `calc(50% + ${tapeShift * 0.4}%)`,
                        width: 16,
                        height: 16,
                        marginLeft: -8,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.75), ${cfg.pinColor} 45%, rgba(0,0,0,0.45) 130%)`,
                        boxShadow:
                            "0 3px 4px rgba(0,0,0,0.35), 0 1px 1px rgba(0,0,0,0.3)",
                        pointerEvents: "none",
                        zIndex: 3,
                    }}
                />
            )}
        </motion.div>
    )
}

/* ------------------------------------------------------------------ */

/**
 * @framerDisableUnlink
 */

export default function PolaroidWall(props: Partial<Props>) {
    const {
        items = DEFAULT_ITEMS,
        autoColumns = true,
        minCardWidth = 160,
        columns = 4,
        gap = 28,
        padding = 40,
        printWidth = 62,
        aspect = "3 / 4",
        seed = 7,
        maxTilt = 4,
        jitter = 10,
        paper = "#FBFAF6",
        ink = "#2B2B2B",
        framePadding = 9,
        bottomSpace = 38,
        radius = 2,
        shadow = 0.5,
        vintage = 0.5,
        font = {},
        noteSize = 15,
        pinStyle = "clothespin",
        woodColor = "#D8B67F",
        pinSize = 1,
        showString = true,
        twineColor = "#B9976A",
        strandOffset = 56,
        tapeColor = "#F0D9A8",
        pinColor = "#D1453B",
        hoverLift = 14,
        hoverScale = 1.06,
        repel = 14,
        flip = true,
        flipHint = "corner",
        peek = true,
        videoMode = "hover",
        develop = true,
        background = "#E8D9C5",
        wallRadius = 0,
        overflowMode = "visible",
        style,
    } = props

    const wallRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0)
    const [hovered, setHovered] = useState<number | null>(null)
    const [flipped, setFlipped] = useState<number | null>(null)
    const reduce = useReducedMotion()
    const canHover = useCanHover()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = isCanvas || !!reduce

    const list = items && items.length ? items : []

    useEffect(() => {
        const el = wallRef.current
        if (!el) return
        const update = () => setWidth(el.clientWidth)
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (flipped === null) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setFlipped(null)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [flipped])

    // --- grid maths --------------------------------------------------------
    const inner = Math.max(0, width - padding * 2)
    const cols =
        width > 0 && autoColumns
            ? Math.max(1, Math.floor((inner + gap) / (minCardWidth + gap)))
            : Math.max(1, Math.round(columns))
    const cellW = Math.max(1, (inner - gap * (cols - 1)) / cols)
    const ratio = (() => {
        const [w, h] = aspect.split("/").map((s) => parseFloat(s))
        return w && h ? w / h : 1
    })()
    const cardW = (cellW * printWidth) / 100
    const cellH =
        framePadding + (cardW - framePadding * 2) / ratio + bottomSpace

    // clothespin + twine mode: every column is a strand the prints hang from
    const stringMode = pinStyle === "clothespin" && showString
    const twineW = 3
    const strands =
        stringMode && width > 0
            ? Array.from({ length: Math.min(cols, list.length) }, (_, c) => {
                  const rows = Math.ceil((list.length - c) / cols)
                  const offset = c % 2 === 1 ? strandOffset : 0
                  const lastPin = padding + (rows - 1) * (cellH + gap) + offset
                  return {
                      left: padding + c * (cellW + gap) + cellW / 2,
                      height: lastPin + 30,
                  }
              })
            : []

    // --- per-card randomness (stable until seed/tilt/jitter change) --------
    const params = useMemo(() => {
        const r = rng(seed * 9973 + 7)
        return list.map(() => ({
            tilt: (r() < 0.5 ? -1 : 1) * (0.3 + 0.7 * r()) * maxTilt,
            jx: (r() * 2 - 1) * jitter,
            jy: (r() * 2 - 1) * jitter,
            tapeAngle: (r() * 2 - 1) * 7,
            tapeShift: (r() * 2 - 1) * 10,
            z: 1 + Math.floor(r() * 8),
            clipAngle: (r() < 0.5 ? -1 : 1) * (10 + r() * 22),
        }))
    }, [list.length, seed, maxTilt, jitter])

    const anchor = flipped !== null ? flipped : hovered

    const targets: Target[] = list.map((_, i) => {
        const p = params[i] || { tilt: 0, jx: 0, jy: 0, z: 1 }
        let x = stringMode ? 0 : p.jx
        let y = p.jy + (stringMode && (i % cols) % 2 === 1 ? strandOffset : 0)
        let rotate = p.tilt
        let scale = 1
        let z = p.z

        if (flipped === i) {
            y -= hoverLift * 1.2
            rotate = 0
            scale = hoverScale + 0.03
            z = 100
        } else if (hovered === i && flipped === null) {
            y -= hoverLift
            rotate = p.tilt * 0.2
            scale = hoverScale
            z = 50
        } else if (
            anchor !== null &&
            repel > 0 &&
            (canHover || flipped !== null)
        ) {
            const ac = anchor % cols
            const ar = Math.floor(anchor / cols)
            const dx = ((i % cols) - ac) * (cellW + gap)
            const dy = (Math.floor(i / cols) - ar) * (cellH + gap)
            const d = Math.hypot(dx, dy)
            const reach = (Math.max(cellW, cellH) + gap) * 1.6
            if (d > 0 && d < reach) {
                const k = (1 - d / reach) * repel
                if (stringMode) {
                    // prints can't leave their string: slide along it and swing
                    y += (dy / d) * k
                    rotate += (dx / d) * k * 0.3
                } else {
                    x += (dx / d) * k
                    y += (dy / d) * k
                }
            }
        }
        return { x, y, rotate, scale, z }
    })

    const cfg: Cfg = {
        paper,
        ink,
        pad: framePadding,
        bottomSpace,
        radius,
        shadow,
        vintage,
        aspect,
        font,
        noteSize,
        pinStyle,
        tapeColor,
        pinColor,
        flip,
        videoMode,
        develop,
        isStatic,
        canHover,
        woodColor,
        pinSize,
        printWidth,
        stringMode,
        flipHint,
        peek,
    }

    return (
        <div
            ref={wallRef}
            onClick={() => setFlipped(null)}
            style={{
                ...style,
                position: "relative",
                isolation: "isolate",
                boxSizing: "border-box",
                padding,
                paddingBottom: padding + (stringMode ? strandOffset : 0),
                background,
                borderRadius: wallRadius,
                ...(overflowMode === "clip"
                    ? { overflow: "hidden" }
                    : overflowMode === "scroll"
                      ? { overflowX: "hidden", overflowY: "auto" }
                      : {}),
            }}
        >
            {list.length === 0 ? (
                <div
                    style={{
                        minHeight: 160,
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "system-ui, sans-serif",
                        fontSize: 14,
                        color: ink,
                        opacity: 0.6,
                    }}
                >
                    Add photos in the Items property to fill the wall.
                </div>
            ) : (
                <>
                    {strands.map((st, c) => (
                        <div
                            key={"strand" + c}
                            aria-hidden
                            style={{
                                position: "absolute",
                                top: 0,
                                left: st.left - twineW / 2,
                                width: twineW,
                                height: st.height,
                                zIndex: 0,
                                pointerEvents: "none",
                                borderRadius: "0 0 2px 2px",
                                backgroundColor: twineColor,
                                backgroundImage:
                                    "repeating-linear-gradient(160deg, rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 3.5px)",
                                boxShadow: "1px 0 2px rgba(0,0,0,0.12)",
                            }}
                        />
                    ))}
                    <div
                        style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            gap,
                            alignItems: "start",
                        }}
                    >
                        {list.map((item, i) => (
                            <Card
                                key={i}
                                item={item}
                                index={i}
                                col={i % cols}
                                target={targets[i]}
                                tapeAngle={params[i]?.tapeAngle ?? 0}
                                tapeShift={params[i]?.tapeShift ?? 0}
                                clipAngle={params[i]?.clipAngle ?? 0}
                                tone={TONES[i % TONES.length]}
                                hovered={hovered === i}
                                flipped={flipped === i}
                                onHover={(on) =>
                                    setHovered((h) =>
                                        on ? i : h === i ? null : h
                                    )
                                }
                                onFlip={() =>
                                    setFlipped((f) => (f === i ? null : i))
                                }
                                cfg={cfg}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

PolaroidWall.defaultProps = {
    width: 960,
    height: 720,
}

/* ------------------------------------------------------------------ */

addPropertyControls(PolaroidWall, {
    items: {
        type: ControlType.Array,
        title: "Prints",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Photo" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                },
                note: {
                    type: ControlType.String,
                    title: "Back note",
                    displayTextArea: true,
                    defaultValue: "",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS as any,
    },

    autoColumns: {
        type: ControlType.Boolean,
        title: "Columns",
        enabledTitle: "Auto",
        disabledTitle: "Fixed",
        defaultValue: true,
    },
    minCardWidth: {
        type: ControlType.Number,
        title: "Min column",
        min: 100,
        max: 480,
        step: 10,
        unit: "px",
        defaultValue: 160,
        hidden: (p) => !p.autoColumns,
    },
    columns: {
        type: ControlType.Number,
        title: "Count",
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        defaultValue: 4,
        hidden: (p) => p.autoColumns,
    },
    printWidth: {
        type: ControlType.Number,
        title: "Print width",
        min: 30,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 62,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 28,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 160,
        step: 4,
        unit: "px",
        defaultValue: 40,
    },
    aspect: {
        type: ControlType.Enum,
        title: "Photo shape",
        options: ["1 / 1", "4 / 5", "3 / 4", "4 / 3"],
        optionTitles: [
            "Square",
            "Portrait 4:5",
            "Portrait 3:4",
            "Landscape 4:3",
        ],
        defaultValue: "3 / 4",
    },
    seed: {
        type: ControlType.Number,
        title: "Shuffle",
        min: 1,
        max: 99,
        step: 1,
        displayStepper: true,
        defaultValue: 7,
    },
    maxTilt: {
        type: ControlType.Number,
        title: "Swing",
        min: 0,
        max: 15,
        step: 0.5,
        unit: "°",
        defaultValue: 4,
    },
    jitter: {
        type: ControlType.Number,
        title: "Scatter",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 10,
    },

    pinStyle: {
        type: ControlType.Enum,
        title: "Hold with",
        options: ["clothespin", "tape", "pin", "none"],
        optionTitles: ["Clothespin", "Tape", "Pushpin", "Nothing"],
        defaultValue: "clothespin",
    },
    showString: {
        type: ControlType.Boolean,
        title: "Twine",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
        hidden: (p) => p.pinStyle !== "clothespin",
    },
    twineColor: {
        type: ControlType.Color,
        title: "Twine color",
        defaultValue: "#B9976A",
        hidden: (p) => p.pinStyle !== "clothespin" || !p.showString,
    },
    strandOffset: {
        type: ControlType.Number,
        title: "Strand offset",
        min: 0,
        max: 160,
        step: 2,
        unit: "px",
        defaultValue: 56,
        hidden: (p) => p.pinStyle !== "clothespin" || !p.showString,
    },
    woodColor: {
        type: ControlType.Color,
        title: "Wood",
        defaultValue: "#D8B67F",
        hidden: (p) => p.pinStyle !== "clothespin",
    },
    pinSize: {
        type: ControlType.Number,
        title: "Pin size",
        min: 0.6,
        max: 1.8,
        step: 0.05,
        defaultValue: 1,
        hidden: (p) => p.pinStyle !== "clothespin",
    },
    tapeColor: {
        type: ControlType.Color,
        title: "Tape",
        defaultValue: "#F0D9A8",
        hidden: (p) => p.pinStyle !== "tape",
    },
    pinColor: {
        type: ControlType.Color,
        title: "Pushpin",
        defaultValue: "#D1453B",
        hidden: (p) => p.pinStyle !== "pin",
    },

    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#FBFAF6" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#2B2B2B" },
    font: {
        type: ControlType.Font,
        title: "Handwriting",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    noteSize: {
        type: ControlType.Number,
        title: "Note size",
        min: 10,
        max: 36,
        step: 1,
        unit: "px",
        defaultValue: 15,
    },
    framePadding: {
        type: ControlType.Number,
        title: "Border",
        min: 4,
        max: 32,
        step: 1,
        unit: "px",
        defaultValue: 9,
    },
    bottomSpace: {
        type: ControlType.Number,
        title: "Caption area",
        min: 20,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 38,
    },
    radius: {
        type: ControlType.Number,
        title: "Corners",
        min: 0,
        max: 16,
        step: 1,
        unit: "px",
        defaultValue: 2,
    },
    shadow: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    vintage: {
        type: ControlType.Number,
        title: "Faded print",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },

    hoverLift: {
        type: ControlType.Number,
        title: "Hover lift",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 14,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover scale",
        min: 1,
        max: 1.3,
        step: 0.01,
        defaultValue: 1.06,
    },
    repel: {
        type: ControlType.Number,
        title: "Neighbour push",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 14,
    },
    flip: {
        type: ControlType.Boolean,
        title: "Click to flip",
        defaultValue: true,
    },
    flipHint: {
        type: ControlType.Enum,
        title: "Flip hint",
        options: ["corner", "icon", "none"],
        optionTitles: ["Folded corner", "Turn icon", "None"],
        defaultValue: "corner",
        hidden: (p) => !p.flip,
    },
    peek: {
        type: ControlType.Boolean,
        title: "First-print peek",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        hidden: (p) => !p.flip,
    },
    videoMode: {
        type: ControlType.Enum,
        title: "Videos",
        options: ["hover", "always"],
        optionTitles: ["Play on hover", "Always play"],
        defaultValue: "hover",
    },
    develop: {
        type: ControlType.Boolean,
        title: "Develop on scroll",
        defaultValue: true,
    },

    background: {
        type: ControlType.Color,
        title: "Wall",
        defaultValue: "#E8D9C5",
    },
    wallRadius: {
        type: ControlType.Number,
        title: "Wall corners",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
    overflowMode: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["visible", "clip", "scroll"],
        optionTitles: ["Let tilt spill", "Clip at edges", "Scroll inside"],
        defaultValue: "visible",
        description: "\n\n[More Components](https://framer.link/DqwW3uJ)",
    },
})
