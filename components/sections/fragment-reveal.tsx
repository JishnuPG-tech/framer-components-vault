// Create a Framer code component that reveals a single uploaded image using a mosaic tile animation.
// Core behavior: ONE image, split into grid tiles using background-position, staggered sequential reveal, final state matches original.
// Animation: tiles start hidden (opacity 0, scale < 1, optional Y offset), animate to visible with random stagger, smooth easing.
// Controls: Image, Columns, Rows, Duration, Delay Spread, Start Scale, Offset Y, Random Order, Replay On View, Trigger Once, Gap, Border Radius.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation, useInView } from "framer-motion"
import * as React from "react"
import { startTransition, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

type ExitType = "fade" | "randomTiles"

type Props = {
    image?: ResponsiveImageLike
    grid?: {
        columns: number
        rows: number
        gap: number
    }
    reveal?: {
        duration: number
        delaySpread: number
        startScale: number
        offsetY: number
        randomOrder: boolean
    }
    columns: number
    rows: number
    duration: number
    delaySpread: number
    startScale: number
    offsetY: number
    randomOrder: boolean
    replayOnView: boolean
    triggerOnce: boolean
    gap: number
    holdDuration: number
    exit: {
        duration: number
        type: ExitType
        delaySpread: number
        offset: number
    }
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FragmentReveal(props: Props) {
    const {
        image = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Image",
        },
        grid,
        reveal,
        columns,
        rows,
        duration,
        delaySpread,
        startScale,
        offsetY,
        randomOrder,
        replayOnView,
        triggerOnce,
        gap,
        holdDuration,
        exit,
        style,
    } = props

    const gridColumns = grid?.columns ?? columns
    const gridRows = grid?.rows ?? rows
    const gridGap = grid?.gap ?? gap

    const revealDuration = reveal?.duration ?? duration
    const revealDelaySpread = reveal?.delaySpread ?? delaySpread
    const revealStartScale = reveal?.startScale ?? startScale
    const revealOffsetY = reveal?.offsetY ?? offsetY
    const revealRandomOrder = reveal?.randomOrder ?? randomOrder

    const exitType = exit?.type ?? "randomTiles"
    const exitDuration = exit?.duration ?? 0.4
    const exitDelaySpread = exit?.delaySpread ?? 0.8
    const exitOffset = exit?.offset ?? 6

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const controls = useAnimation()
    const containerControls = useAnimation()

    const inView = useInView(rootRef, {
        amount: 0.25,
        once: triggerOnce && !replayOnView,
    })

    const [hasPlayed, setHasPlayed] = useState(false)

    useEffect(() => {
        if (isStatic) {
            if (!hasPlayed) startTransition(() => setHasPlayed(true))
            return
        }
        if (!replayOnView && inView && !hasPlayed) {
            startTransition(() => setHasPlayed(true))
        }
    }, [inView, replayOnView, hasPlayed, isStatic])

    const shouldShow = isStatic ? true : replayOnView ? inView : hasPlayed

    const safeColumns = useMemo(() => {
        const n = Number.isFinite(gridColumns) ? Math.round(gridColumns) : 8
        return Math.min(20, Math.max(2, n))
    }, [gridColumns])

    const safeRows = useMemo(() => {
        const n = Number.isFinite(gridRows) ? Math.round(gridRows) : 6
        return Math.min(20, Math.max(2, n))
    }, [gridRows])

    const tileCount = safeColumns * safeRows

    const seed = useMemo(() => {
        const s = String(image?.src || "")
        let h = 2166136261
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i)
            h = Math.imul(h, 16777619)
        }
        h ^= safeColumns + (safeRows << 8) + (Math.floor(gridGap) << 16)
        return (h >>> 0) || 1
    }, [image?.src, safeColumns, safeRows, gridGap])

    const scatterOffsets = useMemo(() => {
        const out = new Array<{ x: number; y: number }>(tileCount)
        let t = (seed ^ 0x9e3779b9) >>> 0
        const rand = () => {
            t += 0x6d2b79f5
            let x = t
            x = Math.imul(x ^ (x >>> 15), x | 1)
            x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
            return ((x ^ (x >>> 14)) >>> 0) / 4294967296
        }
        const dist = 24
        for (let i = 0; i < tileCount; i++) {
            out[i] = {
                x: (rand() * 2 - 1) * dist,
                y: (rand() * 2 - 1) * dist,
            }
        }
        return out
    }, [tileCount, seed])

    const exitDelayByIndex = useMemo(() => {
        const out = new Array<number>(tileCount)
        let t = (seed ^ 0xa5a5a5a5) >>> 0
        const rand = () => {
            t += 0x6d2b79f5
            let x = t
            x = Math.imul(x ^ (x >>> 15), x | 1)
            x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
            return ((x ^ (x >>> 14)) >>> 0) / 4294967296
        }
        const spread = Math.max(0, exitDelaySpread)
        for (let i = 0; i < tileCount; i++) {
            out[i] = rand() * spread
        }
        return out
    }, [tileCount, seed, exitDelaySpread])

    const order = useMemo(() => {
        const indices = Array.from({ length: tileCount }, (_, i) => i)
        if (!revealRandomOrder || tileCount <= 1) return indices

        let t = seed >>> 0
        const rand = () => {
            t += 0x6d2b79f5
            let x = t
            x = Math.imul(x ^ (x >>> 15), x | 1)
            x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
            return ((x ^ (x >>> 14)) >>> 0) / 4294967296
        }

        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1))
            const tmp = indices[i]
            indices[i] = indices[j]
            indices[j] = tmp
        }
        return indices
    }, [tileCount, revealRandomOrder, seed])

    const rankByIndex = useMemo(() => {
        const rank = new Array<number>(tileCount)
        for (let i = 0; i < order.length; i++) rank[order[i]] = i
        return rank
    }, [order, tileCount])

    const backgroundSize = useMemo(() => {
        return `${safeColumns * 100}% ${safeRows * 100}%`
    }, [safeColumns, safeRows])

    const tileVariants = useMemo(() => {
        const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

        return {
            hidden: (i: number) => ({
                opacity: 0,
                scale: Math.max(0.01, revealStartScale),
                y: revealOffsetY,
                x: 0,
                transition: {
                    duration: Math.max(0, revealDuration) * 0.6,
                    ease,
                },
            }),
            visible: (i: number) => {
                const n = Math.max(1, tileCount)
                const rank = rankByIndex[i] ?? 0
                const t = n <= 1 ? 0 : rank / (n - 1)
                const d = Math.max(0, revealDelaySpread) * t
                return {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    x: 0,
                    transition: {
                        delay: d,
                        duration: Math.max(0, revealDuration),
                        ease,
                    },
                }
            },
            exiting: (i: number) => {
                const d = Math.max(0, exitDelayByIndex[i] ?? 0)
                const o = scatterOffsets[i] || { x: 0, y: 0 }
                const move = Math.max(0, exitOffset)
                return {
                    opacity: 0,
                    scale: 0.9,
                    x: o.x === 0 ? 0 : (o.x / 24) * move,
                    y: o.y === 0 ? 0 : (o.y / 24) * move,
                    transition: {
                        delay: d,
                        duration: Math.max(0, exitDuration),
                        ease,
                    },
                }
            },
        }
    }, [revealDelaySpread, revealDuration, revealOffsetY, rankByIndex, revealStartScale, tileCount, exitDelayByIndex, scatterOffsets, exitOffset, exitDuration])

    useEffect(() => {
        if (isStatic) return
        let cancelled = false

        const run = async () => {
            if (!shouldShow) {
                await containerControls.set({ opacity: 1 })
                await controls.set("hidden")
                return
            }

            await containerControls.set({ opacity: 1 })
            await controls.set("hidden")
            if (cancelled) return

            await controls.start("visible")
            if (cancelled) return

            const holdMs = Math.max(0, holdDuration) * 1000
            if (holdMs > 0 && typeof window !== "undefined") {
                await new Promise<void>((resolve) => {
                    window.setTimeout(resolve, holdMs)
                })
            }
            if (cancelled) return

            if (exitType === "fade") {
                await containerControls.start({
                    opacity: 0,
                    transition: {
                        duration: Math.max(0, exitDuration),
                        ease: [0.22, 1, 0.36, 1],
                    },
                })
            } else {
                await controls.start("exiting")
            }
            if (cancelled) return

            if (!replayOnView) {
                await controls.set("hidden")
                await containerControls.set({ opacity: 1 })
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [shouldShow, controls, containerControls, holdDuration, replayOnView, isStatic, exitType, exitDuration])

    const wrapperStyle: CSSProperties = useMemo(() => {
        return {
            ...(style || {}),
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "visible",
        }
    }, [style])

    const gridStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${safeRows}, minmax(0, 1fr))`,
            gap: Math.max(0, gridGap),
        }),
        [safeColumns, safeRows, gridGap]
    )

    const tileBaseStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            willChange: "transform, opacity",
        }),
        []
    )

    const tiles = useMemo(() => {
        const out: React.ReactNode[] = []
        for (let r = 0; r < safeRows; r++) {
            for (let c = 0; c < safeColumns; c++) {
                const i = r * safeColumns + c

                out.push(
                    <motion.div
                        key={i}
                        custom={i}
                        variants={tileVariants}
                        initial="hidden"
                        animate={isStatic ? (shouldShow ? "visible" : "hidden") : controls}
                        style={tileBaseStyle}
                        aria-hidden="true"
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: `${-c * 100}%`,
                                top: `${-r * 100}%`,
                                width: `${safeColumns * 100}%`,
                                height: `${safeRows * 100}%`,
                                backgroundImage: `url(${image?.src || ""})`,
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "cover",
                                backgroundPosition: "center center",
                            }}
                        />
                    </motion.div>
                )
            }
        }
        return out
    }, [safeRows, safeColumns, tileVariants, shouldShow, tileBaseStyle, controls, isStatic, image?.src])

    return (
        <div ref={rootRef} style={wrapperStyle} role="img" aria-label={image?.alt || "Mosaic reveal image"}>
            <motion.div
                style={gridStyle}
                initial={{ opacity: 1 }}
                animate={isStatic ? { opacity: 1 } : containerControls}
            >
                {tiles}
            </motion.div>
        </div>
    )
}

addPropertyControls(FragmentReveal, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    grid: {
        type: ControlType.Object,
        title: "Grid",
        icon: "object",
        controls: {
            columns: {
                type: ControlType.Number,
                title: "Columns",
                defaultValue: 8,
                min: 2,
                max: 20,
                step: 1,
            },
            rows: {
                type: ControlType.Number,
                title: "Rows",
                defaultValue: 6,
                min: 2,
                max: 20,
                step: 1,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 4,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            columns: 8,
            rows: 6,
            gap: 4,
        },
    },
    reveal: {
        type: ControlType.Object,
        title: "Reveal Animation",
        icon: "interaction",
        controls: {
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.5,
                min: 0.05,
                max: 3,
                step: 0.01,
                unit: "s",
            },
            delaySpread: {
                type: ControlType.Number,
                title: "Delay Spread",
                defaultValue: 0.8,
                min: 0,
                max: 5,
                step: 0.01,
                unit: "s",
            },
            startScale: {
                type: ControlType.Number,
                title: "Start Scale",
                defaultValue: 0.9,
                min: 0.2,
                max: 1,
                step: 0.01,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 8,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
            },
            randomOrder: {
                type: ControlType.Boolean,
                title: "Random Order",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
        defaultValue: {
            duration: 0.5,
            delaySpread: 0.8,
            startScale: 0.9,
            offsetY: 8,
            randomOrder: true,
        },
    },
    holdDuration: {
        type: ControlType.Number,
        title: "Hold",
        defaultValue: 1.2,
        min: 0,
        max: 10,
        step: 0.01,
        unit: "s",
    },
    exit: {
        type: ControlType.Object,
        title: "Exit Animation",
        icon: "interaction",
        controls: {
            duration: {
                type: ControlType.Number,
                title: "Exit Dur",
                defaultValue: 0.4,
                min: 0.05,
                max: 3,
                step: 0.01,
                unit: "s",
            },
            type: {
                type: ControlType.Enum,
                title: "Exit Type",
                options: ["fade", "randomTiles"],
                optionTitles: ["Fade", "Random Tiles"],
                defaultValue: "randomTiles",
                displaySegmentedControl: true,
            },
            delaySpread: {
                type: ControlType.Number,
                title: "Exit Spread",
                defaultValue: 0.8,
                min: 0,
                max: 5,
                step: 0.01,
                unit: "s",
                hidden: (p) => p.exit?.type !== "randomTiles",
            },
            offset: {
                type: ControlType.Number,
                title: "Exit Offset",
                defaultValue: 6,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (p) => p.exit?.type !== "randomTiles",
            },
        },
        defaultValue: {
            duration: 0.4,
            type: "randomTiles",
            delaySpread: 0.8,
            offset: 6,
        },
    },
    replayOnView: {
        type: ControlType.Boolean,
        title: "Replay On View",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    triggerOnce: {
        type: ControlType.Boolean,
        title: "Trigger Once",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !!p.replayOnView,
    },
})