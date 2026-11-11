import * as React from "react"
import { useCallback, useEffect, useState } from "react"
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

type Photo = {
    image?: { src: string; alt?: string } | string
    caption?: string
    note?: string
}

const EASE = [0.22, 1, 0.36, 1] as const
// how each card below the top one sits: offset down, turn, shrink
const DEPTH = [
    { y: 0, r: 0, s: 1 },
    { y: 9, r: -2.2, s: 0.985 },
    { y: 18, r: 1.8, s: 0.97 },
    { y: 26, r: -1, s: 0.955 },
]

const DEFAULTS: Photo[] = [
    {
        image: "https://picsum.photos/id/1060/900/1100",
        caption: "Slow mornings, pour-over first",
        note: "Coffee",
    },
    {
        image: "https://picsum.photos/id/1036/900/1100",
        caption: "Camping above the snowline",
        note: "Trekking",
    },
    {
        image: "https://picsum.photos/id/250/900/1100",
        caption: "Still shooting on film",
        note: "Photography",
    },
    {
        image: "https://picsum.photos/id/452/900/1100",
        caption: "Front row, ears ringing",
        note: "Live music",
    },
    {
        image: "https://picsum.photos/id/1015/900/1100",
        caption: "Chasing views on the road",
        note: "Travel",
    },
]

const srcOf = (p: Photo) =>
    (typeof p.image === "string" ? p.image : p.image?.src) || ""

function Chevron({ dir }: { dir: 1 | -1 }) {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ transform: dir < 0 ? "scaleX(-1)" : undefined }}
        >
            <path
                d="M4.5 2.5 8 6l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * A stack of photographs: the top print flies off to the side and slips under
 * the pile. Arrows, a click on the photo, a swipe or the arrow keys move it.
 *
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 640
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function PhotoStack(props: {
    photos: Photo[]
    cardWidth: number
    mono: boolean
    style?: React.CSSProperties
}) {
    const photos = props.photos?.length ? props.photos : DEFAULTS
    const n = photos.length
    const W = props.cardWidth || 330
    const H = Math.round(W * 1.31)
    const pad = Math.round(W * 0.073)

    const [index, setIndex] = useState(0)
    const [leaving, setLeaving] = useState<{ i: number; dir: number } | null>(
        null
    )

    const go = useCallback(
        (dir: 1 | -1) => {
            if (n < 2) return
            if (dir > 0)
                setLeaving({ i: index, dir: Math.random() > 0.5 ? 1 : -1 })
            setIndex((v) => (v + dir + n) % n)
        },
        [index, n]
    )

    useEffect(() => {
        if (!leaving) return
        const t = window.setTimeout(() => setLeaving(null), 520)
        return () => window.clearTimeout(t)
    }, [leaving])

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") go(1)
        if (e.key === "ArrowLeft") go(-1)
    }

    const current = photos[index]
    const btn: React.CSSProperties = {
        width: 30,
        height: 30,
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,.1)",
        background: "#fff",
        color: "#202020",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        boxShadow: "0 4px 12px -6px rgba(0,0,0,.18)",
        padding: 0,
        flexShrink: 0,
    }

    return (
        <div
            tabIndex={0}
            onKeyDown={onKey}
            aria-roledescription="carousel"
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
                outline: "none",
                fontFamily: "'Inter Tight', sans-serif",
            }}
        >
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#898989",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.02em",
                }}
            >
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(n).padStart(2, "0")}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "clamp(16px, 6vw, 44px)",
                }}
            >
                <motion.button
                    type="button"
                    aria-label="Previous photo"
                    style={btn}
                    onClick={() => go(-1)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                >
                    <Chevron dir={-1} />
                </motion.button>

                <div style={{ position: "relative", width: W, height: H + 30 }}>
                    {photos.map((p, i) => {
                        const depth = (i - index + n) % n
                        const isLeaving = leaving?.i === i
                        const d = DEPTH[Math.min(depth, DEPTH.length - 1)]
                        const shown = depth < DEPTH.length
                        const target = isLeaving
                            ? {
                                  x: leaving!.dir * W * 1.15,
                                  y: -12,
                                  rotate: leaving!.dir * 12,
                                  scale: 1,
                                  opacity: 0,
                              }
                            : {
                                  x: 0,
                                  y: d.y,
                                  rotate: d.r,
                                  scale: d.s,
                                  opacity: shown ? 1 : 0,
                              }
                        return (
                            <motion.div
                                key={i}
                                initial={false}
                                animate={target}
                                transition={{
                                    duration: isLeaving ? 0.5 : 0.7,
                                    ease: EASE,
                                }}
                                drag={depth === 0 && !leaving ? "x" : false}
                                dragSnapToOrigin
                                dragElastic={0.6}
                                onDragEnd={(_, info) => {
                                    if (Math.abs(info.offset.x) > 70)
                                        go(info.offset.x < 0 ? 1 : -1)
                                }}
                                onTap={() => depth === 0 && go(1)}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    height: H,
                                    zIndex: isLeaving ? n + 1 : n - depth,
                                    background: "#fff",
                                    border: "1px solid rgba(0,0,0,.08)",
                                    boxShadow:
                                        depth === 0
                                            ? "0 24px 48px -32px rgba(0,0,0,.35)"
                                            : "0 6px 16px -12px rgba(0,0,0,.2)",
                                    padding: pad,
                                    paddingBottom: pad * 2.6,
                                    boxSizing: "border-box",
                                    cursor: depth === 0 ? "grab" : "default",
                                    pointerEvents:
                                        depth === 0 ? "auto" : "none",
                                    transformOrigin: "50% 60%",
                                }}
                            >
                                <div
                                    role="img"
                                    aria-label={p.caption || ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundImage: `url(${srcOf(p)})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        backgroundColor: "#f2f2f2",
                                        filter: props.mono
                                            ? "grayscale(1) contrast(1.05)"
                                            : undefined,
                                    }}
                                />
                            </motion.div>
                        )
                    })}
                </div>

                <motion.button
                    type="button"
                    aria-label="Next photo"
                    style={btn}
                    onClick={() => go(1)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                >
                    <Chevron dir={1} />
                </motion.button>
            </div>

            <motion.div
                key={index}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: EASE }}
                aria-live="polite"
                style={{
                    textAlign: "center",
                    fontFamily: "'Inter Tight', sans-serif",
                    lineHeight: 1.45,
                }}
            >
                <div
                    style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#202020",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {current?.caption}
                </div>
                <div style={{ fontSize: 14, color: "#898989" }}>
                    {current?.note}
                </div>
            </motion.div>
        </div>
    )
}

PhotoStack.displayName = "Photo Stack"

addPropertyControls(PhotoStack, {
    photos: {
        type: ControlType.Array,
        title: "Photos",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                caption: { type: ControlType.String, title: "Caption" },
                note: { type: ControlType.String, title: "Note" },
            },
        },
        defaultValue: [],
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card width",
        defaultValue: 330,
        min: 200,
        max: 520,
        step: 10,
        unit: "px",
    },
    mono: {
        type: ControlType.Boolean,
        title: "Black & white",
        defaultValue: true,
    },
})
