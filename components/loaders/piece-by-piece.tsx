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

import { motion, useInView } from "framer-motion"

interface PuzzleImage {
    src: string
    srcSet?: string
    alt?: string
}

interface TileState {
    currentImage: number
    previousImage: number | null
}

interface PieceByPieceProps {
    images: PuzzleImage[]
    columns: number
    rows: number
    tileDelay: number
    transitionDuration: number
    autoplay: boolean
    loop: boolean
    dividerColor: string
    dividerImage?: PuzzleImage
    dividerImageFit: "cover" | "contain"
    dividerImagePosition: string
    dividerWidth: number
    cornerRadius: number
    fit: "cover" | "contain"
    objectPosition: string
    textureEnabled: boolean
    paperTextureIntensity: number
    grainIntensity: number
    tileTilt: number
    tileTiltDuration: number
    tileOverlap: number
    stopMotionSteps: number
    collageScatter: number
    style?: React.CSSProperties
}

/**
 * Piece by Piece
 *
 * Splits each image in `images` into a columns x rows grid of tiles and
 * autoplays through them: the first image assembles tile-by-tile in grid
 * order, then each subsequent image replaces the tiles the same way,
 * looping indefinitely. Every tile crossfades independently with a subtle
 * stop-motion scale/translate settle. Optional crumpled-paper + grain
 * texture overlay.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PieceByPiece(props: PieceByPieceProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
        ],
        columns,
        rows,
        tileDelay,
        transitionDuration,
        autoplay,
        loop,
        dividerColor,
        dividerImage,
        dividerImageFit,
        dividerImagePosition,
        dividerWidth,
        cornerRadius,
        fit,
        objectPosition,
        textureEnabled = true,
        paperTextureIntensity = 0.5,
        grainIntensity = 0.35,
        tileTilt,
        tileTiltDuration,
        tileOverlap,
        stopMotionSteps,
        collageScatter,
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)
    const isStaticRenderer = useIsStaticRenderer()
    const isInView = useInView(rootRef, { amount: 0.2 })

    const safeImages = React.useMemo(() => {
        const filtered = (images || []).filter((item) => item?.src)
        if (filtered.length > 0) return filtered
        return [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
        ]
    }, [images])

    const safeColumns = React.useMemo(
        () => Math.max(1, Math.floor(columns)),
        [columns]
    )
    const safeRows = React.useMemo(() => Math.max(1, Math.floor(rows)), [rows])
    const tileCount = React.useMemo(
        () => safeColumns * safeRows,
        [safeColumns, safeRows]
    )
    const safePaperTextureIntensity = React.useMemo(
        () => Math.max(0, Math.min(paperTextureIntensity, 1)),
        [paperTextureIntensity]
    )
    const safeGrainIntensity = React.useMemo(
        () => Math.max(0, Math.min(grainIntensity, 1)),
        [grainIntensity]
    )
    const safeTileTilt = React.useMemo(
        () => Math.max(0, Math.min(tileTilt, 12)),
        [tileTilt]
    )
    const safeTileTiltDuration = React.useMemo(
        () => Math.max(0.05, tileTiltDuration || transitionDuration),
        [tileTiltDuration, transitionDuration]
    )
    const safeTileOverlap = React.useMemo(
        () => Math.max(0, Math.min(tileOverlap, 24)),
        [tileOverlap]
    )
    const safeStopMotionSteps = React.useMemo(
        () => Math.max(3, Math.min(8, Math.round(stopMotionSteps))),
        [stopMotionSteps]
    )
    const safeCollageScatter = React.useMemo(
        () => Math.max(0, Math.min(collageScatter, 1)),
        [collageScatter]
    )
    const stopMotionTimes = React.useMemo(() => {
        const hold = Math.max(
            0.58,
            Math.min(0.86, (safeStopMotionSteps - 1) / safeStopMotionSteps)
        )
        const snap = Math.min(0.95, hold + 0.06)
        return [0, hold, snap, 1]
    }, [safeStopMotionSteps])

    const makeInitialTiles = React.useCallback(
        (count: number): TileState[] =>
            Array.from({ length: count }, () => ({
                currentImage: -1,
                previousImage: null,
            })),
        []
    )

    const [tiles, setTiles] = React.useState<TileState[]>(() =>
        makeInitialTiles(tileCount)
    )
    const [activeImage, setActiveImage] = React.useState(0)
    const [nextTile, setNextTile] = React.useState(0)
    const [finished, setFinished] = React.useState(false)
    const [pendingFinish, setPendingFinish] = React.useState(false)
    const finishTimerRef = React.useRef<number | null>(null)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        safeImages.forEach((item) => {
            if (!item?.src) return
            const preload = new Image()
            preload.src = item.src
            if (item.srcSet) preload.srcset = item.srcSet
            if (typeof preload.decode === "function") {
                preload.decode().catch(() => undefined)
            }
        })
    }, [safeImages])

    React.useEffect(() => {
        React.startTransition(() => {
            setTiles(makeInitialTiles(tileCount))
            setActiveImage(0)
            setNextTile(0)
            setFinished(false)
            setPendingFinish(false)
        })
    }, [tileCount, safeImages.length, makeInitialTiles])

    const shouldPlay =
        autoplay &&
        !isStaticRenderer &&
        isInView &&
        safeImages.length > 0 &&
        tileCount > 0
    const finalSettleDuration = React.useMemo(
        () => Math.max(safeTileTiltDuration, transitionDuration),
        [safeTileTiltDuration, transitionDuration]
    )
    const dividerImageFadeDuration = React.useMemo(
        () => Math.max(0.1, transitionDuration * 0.8),
        [transitionDuration]
    )

    React.useEffect(() => {
        if (!pendingFinish) return
        if (typeof window === "undefined") {
            React.startTransition(() => {
                setFinished(true)
                setPendingFinish(false)
            })
            return
        }

        finishTimerRef.current = window.setTimeout(() => {
            React.startTransition(() => {
                setFinished(true)
                setPendingFinish(false)
            })
            finishTimerRef.current = null
        }, finalSettleDuration * 1000)

        return () => {
            if (
                typeof window !== "undefined" &&
                finishTimerRef.current !== null
            ) {
                window.clearTimeout(finishTimerRef.current)
                finishTimerRef.current = null
            }
        }
    }, [pendingFinish, finalSettleDuration])

    const advanceOneTile = React.useCallback(() => {
        if (finished || pendingFinish) return

        React.startTransition(() => {
            setTiles((prev) => {
                const next = prev.slice()
                const currentTile = next[nextTile]
                if (!currentTile) return prev
                next[nextTile] = {
                    currentImage: activeImage,
                    previousImage:
                        currentTile.currentImage >= 0
                            ? currentTile.currentImage
                            : null,
                }
                return next
            })

            const isEndOfPass = nextTile >= tileCount - 1
            if (!isEndOfPass) {
                setNextTile((value) => value + 1)
                return
            }

            const isLastImage = activeImage >= safeImages.length - 1
            if (isLastImage) {
                if (loop) {
                    setActiveImage(0)
                    setNextTile(0)
                } else {
                    setPendingFinish(true)
                }
            } else {
                setActiveImage((value) => value + 1)
                setNextTile(0)
            }
        })
    }, [
        activeImage,
        finished,
        loop,
        nextTile,
        pendingFinish,
        safeImages.length,
        tileCount,
    ])

    React.useEffect(() => {
        if (!shouldPlay || finished || pendingFinish) return
        if (typeof window === "undefined") return

        const interval = window.setInterval(
            () => {
                advanceOneTile()
            },
            Math.max(40, tileDelay * 1000)
        )

        return () => window.clearInterval(interval)
    }, [shouldPlay, tileDelay, advanceOneTile, finished, pendingFinish])

    const renderImageLayer = React.useCallback(
        (
            imageIndex: number,
            tileIndex: number,
            layerKey: string,
            layerType: "previous" | "current"
        ) => {
            if (imageIndex < 0 || imageIndex >= safeImages.length) return null

            const image = safeImages[imageIndex]
            const col = tileIndex % safeColumns
            const row = Math.floor(tileIndex / safeColumns)
            const isFirstCol = col === 0
            const isLastCol = col === safeColumns - 1
            const isFirstRow = row === 0
            const isLastRow = row === safeRows - 1
            const tiltDirection = tileIndex % 2 === 0 ? 1 : -1
            const tiltVariance = 0.65 + (tileIndex % 5) * 0.08
            const initialRotate =
                !isStaticRenderer && layerType === "current"
                    ? safeTileTilt * tiltDirection * tiltVariance
                    : 0
            const baseDirX = ((tileIndex % 3) - 1) as -1 | 0 | 1
            const baseDirY = (((Math.floor(tileIndex / 2) % 3) - 1) * 0.75) as
                | -0.75
                | 0
                | 0.75
            const dirX = isFirstCol
                ? 1
                : isLastCol
                  ? -1
                  : baseDirX === 0
                    ? tiltDirection
                    : baseDirX
            const dirY = isFirstRow
                ? 1
                : isLastRow
                  ? -1
                  : baseDirY === 0
                    ? -tiltDirection * 0.6
                    : baseDirY
            const overlapX =
                !isStaticRenderer && layerType === "current"
                    ? dirX * safeTileOverlap
                    : 0
            const overlapY =
                !isStaticRenderer && layerType === "current"
                    ? dirY * safeTileOverlap * 0.65
                    : 0
            const transformDuration = Math.max(
                safeTileTiltDuration,
                transitionDuration * 0.9
            )
            const startScale =
                !isStaticRenderer && layerType === "current" ? 1.018 : 1
            const settledX = !isStaticRenderer
                ? overlapX * 0.26 * safeCollageScatter
                : 0
            const settledY = !isStaticRenderer
                ? overlapY * 0.24 * safeCollageScatter
                : 0
            const settledRotate = !isStaticRenderer
                ? initialRotate * 0.3 * safeCollageScatter
                : 0
            const settledScale = !isStaticRenderer
                ? 1 + 0.008 * safeCollageScatter
                : 1
            const transformXKeyframes =
                !isStaticRenderer && layerType === "current"
                    ? [overlapX, overlapX, settledX, settledX]
                    : [0, 0, 0, 0]
            const transformYKeyframes =
                !isStaticRenderer && layerType === "current"
                    ? [overlapY, overlapY, settledY, settledY]
                    : [0, 0, 0, 0]
            const transformRotateKeyframes =
                !isStaticRenderer && layerType === "current"
                    ? [
                          initialRotate,
                          initialRotate,
                          settledRotate,
                          settledRotate,
                      ]
                    : [0, 0, 0, 0]
            const transformScaleKeyframes =
                !isStaticRenderer && layerType === "current"
                    ? [startScale, startScale, settledScale, settledScale]
                    : [1, 1, 1, 1]
            const cutStart = stopMotionTimes[1]
            const cutEnd = Math.min(0.999, cutStart + 0.001)
            const opacityCutTimes = [0, cutStart, cutEnd, 1]

            if (layerType === "previous") {
                return (
                    <motion.div
                        key={layerKey}
                        initial={{
                            x: settledX,
                            y: settledY,
                            rotate: settledRotate,
                            scale: settledScale,
                        }}
                        animate={{
                            x: settledX,
                            y: settledY,
                            rotate: settledRotate,
                            scale: settledScale,
                        }}
                        transition={{ duration: 0 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    >
                        <motion.img
                            src={image.src}
                            srcSet={image.srcSet}
                            alt={image.alt || ""}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: [1, 1, 0, 0] }}
                            transition={{
                                opacity: {
                                    duration: transitionDuration,
                                    ease: "linear",
                                    times: opacityCutTimes,
                                },
                            }}
                            style={{
                                position: "absolute",
                                width: `${safeColumns * 100}%`,
                                height: `${safeRows * 100}%`,
                                left: `${-col * 100}%`,
                                top: `${-row * 100}%`,
                                objectFit: fit,
                                objectPosition,
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                    </motion.div>
                )
            }

            return (
                <motion.div
                    key={layerKey}
                    initial={{
                        x: transformXKeyframes[0],
                        y: transformYKeyframes[0],
                        rotate: transformRotateKeyframes[0],
                        scale: startScale,
                    }}
                    animate={{
                        x: transformXKeyframes,
                        y: transformYKeyframes,
                        rotate: transformRotateKeyframes,
                        scale: transformScaleKeyframes,
                    }}
                    transition={{
                        duration: transformDuration,
                        ease: "linear",
                        times: stopMotionTimes,
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformOrigin: "50% 50%",
                        pointerEvents: "none",
                        zIndex: 3 + (tileIndex % 3),
                        overflow: "visible",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                        }}
                    >
                        <motion.img
                            src={image.src}
                            srcSet={image.srcSet}
                            alt={image.alt || ""}
                            initial={{ opacity: 0, scale: 1.02, x: 2, y: 2 }}
                            animate={{
                                opacity: [0, 0, 1, 1],
                                scale: [1.02, 1.02, 1.005, 1],
                                x: [2, 2, 0.4, 0],
                                y: [2, 2, 0.35, 0],
                            }}
                            transition={{
                                opacity: {
                                    duration: transitionDuration,
                                    ease: "linear",
                                    times: opacityCutTimes,
                                },
                                scale: {
                                    duration: transitionDuration,
                                    ease: "linear",
                                    times: stopMotionTimes,
                                },
                                x: {
                                    duration: transitionDuration,
                                    ease: "linear",
                                    times: stopMotionTimes,
                                },
                                y: {
                                    duration: transitionDuration,
                                    ease: "linear",
                                    times: stopMotionTimes,
                                },
                            }}
                            style={{
                                position: "absolute",
                                width: `${safeColumns * 100}%`,
                                height: `${safeRows * 100}%`,
                                left: `${-col * 100}%`,
                                top: `${-row * 100}%`,
                                objectFit: fit,
                                objectPosition,
                                backfaceVisibility: "hidden",
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                </motion.div>
            )
        },
        [
            fit,
            isStaticRenderer,
            objectPosition,
            safeColumns,
            safeImages,
            safeRows,
            safeTileTilt,
            safeTileTiltDuration,
            safeTileOverlap,
            safeCollageScatter,
            stopMotionTimes,
            transitionDuration,
        ]
    )

    const staticTiles = React.useMemo(
        () =>
            Array.from({ length: tileCount }, () => ({
                currentImage: 0,
                previousImage: null,
            })),
        [tileCount]
    )

    const tilesToRender = isStaticRenderer ? staticTiles : tiles
    const hasStartedFirstAssembly = React.useMemo(
        () => tiles.some((tile) => tile.currentImage >= 0),
        [tiles]
    )
    const shouldShowDividerImage =
        !!dividerImage?.src && !hasStartedFirstAssembly

    // Deterministic pseudo-random angles/positions for the crumple shading,
    // so the fold pattern is stable across re-renders instead of reshuffling.
    const crumpleSeed = React.useMemo(
        () => `${safeColumns}-${safeRows}`,
        [safeColumns, safeRows]
    )
    const crumpleFolds = React.useMemo(() => {
        let h = 0
        for (let i = 0; i < crumpleSeed.length; i++)
            h = (h * 31 + crumpleSeed.charCodeAt(i)) >>> 0
        const rand = () => {
            h = (h * 1103515245 + 12345) & 0x7fffffff
            return h / 0x7fffffff
        }
        return Array.from({ length: 6 }, () => ({
            angle: Math.round(rand() * 360),
            x: Math.round(20 + rand() * 60),
            y: Math.round(20 + rand() * 60),
            size: Math.round(70 + rand() * 90),
        }))
    }, [crumpleSeed])

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
            role="img"
            aria-label="Piece by Piece animated image reveal"
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    aspectRatio: `${safeColumns} / ${safeRows}`,
                    borderRadius: cornerRadius,
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateColumns: `repeat(${safeColumns}, 1fr)`,
                    gridTemplateRows: `repeat(${safeRows}, 1fr)`,
                    gap: dividerWidth,
                    backgroundColor: dividerColor,
                    boxSizing: "border-box",
                }}
            >
                {!!dividerImage?.src && (
                    <motion.div
                        aria-hidden={true}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: shouldShowDividerImage ? 1 : 0 }}
                        transition={{
                            duration: dividerImageFadeDuration,
                            ease: [0.25, 0.65, 0.3, 1],
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 0,
                            pointerEvents: "none",
                            backgroundImage: `url("${dividerImage.src}")`,
                            backgroundSize: dividerImageFit,
                            backgroundPosition: dividerImagePosition,
                            backgroundRepeat: "no-repeat",
                        }}
                    />
                )}
                {tilesToRender.map((tile, index) => (
                    <div
                        key={index}
                        style={{
                            position: "relative",
                            overflow: "visible",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            transform: "translateZ(0)",
                            zIndex: 1,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "hidden",
                            }}
                        >
                            {tile.previousImage !== null &&
                                tile.previousImage !== tile.currentImage &&
                                renderImageLayer(
                                    tile.previousImage,
                                    index,
                                    `prev-${index}-${tile.previousImage}`,
                                    "previous"
                                )}
                        </div>
                        {tile.currentImage >= 0 &&
                            renderImageLayer(
                                tile.currentImage,
                                index,
                                `cur-${index}-${tile.currentImage}`,
                                "current"
                            )}
                    </div>
                ))}

                {textureEnabled && (
                    <>
                        {/* Crumpled-paper shading: soft directional highlight/shadow
                            folds at varied angles, built from the seeded crumpleFolds
                            so the pattern is stable rather than random per render. */}
                        <div
                            aria-hidden={true}
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                zIndex: 5,
                                mixBlendMode: "soft-light",
                                opacity:
                                    0.55 + safePaperTextureIntensity * 0.45,
                                backgroundImage: crumpleFolds
                                    .map((f, i) => {
                                        const light = i % 2 === 0
                                        const color = light
                                            ? `rgba(255,255,255,${0.16 + safePaperTextureIntensity * 0.14})`
                                            : `rgba(60,50,40,${0.1 + safePaperTextureIntensity * 0.12})`
                                        return `linear-gradient(${f.angle}deg, transparent 0%, ${color} 45%, transparent 90%)`
                                    })
                                    .join(", "),
                                backgroundSize: crumpleFolds
                                    .map((f) => `${f.size}% ${f.size}%`)
                                    .join(", "),
                                backgroundPosition: crumpleFolds
                                    .map((f) => `${f.x}% ${f.y}%`)
                                    .join(", "),
                                backgroundRepeat: "no-repeat",
                            }}
                        />

                        {/* Fine crease lines, thin and sharp, to read as actual folds
                            rather than soft cloud shading. */}
                        <div
                            aria-hidden={true}
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                zIndex: 5,
                                mixBlendMode: "overlay",
                                opacity: 0.4 + safePaperTextureIntensity * 0.35,
                                backgroundImage: `
                                    linear-gradient(72deg, transparent 48%, rgba(0,0,0,0.22) 49.3%, rgba(255,255,255,0.18) 50%, transparent 51.5%),
                                    linear-gradient(158deg, transparent 44%, rgba(0,0,0,0.16) 49.6%, rgba(255,255,255,0.14) 50.2%, transparent 54%),
                                    linear-gradient(21deg, transparent 58%, rgba(0,0,0,0.14) 61%, rgba(255,255,255,0.12) 61.6%, transparent 66%)
                                `,
                            }}
                        />

                        {/* Real grain: SVG feTurbulence noise, not a faked gradient —
                            monochrome, high-frequency, rendered once as a data URI. */}
                        <div
                            aria-hidden={true}
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                zIndex: 5,
                                mixBlendMode: "overlay",
                                opacity: 0.35 + safeGrainIntensity * 0.55,
                                backgroundImage:
                                    'url("data:image/svg+xml;utf8,' +
                                    encodeURIComponent(
                                        `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
                                            <filter id='n'>
                                                <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' result='t'/>
                                                <feColorMatrix in='t' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/>
                                            </filter>
                                            <rect width='100%' height='100%' filter='url(#n)'/>
                                        </svg>`
                                    ) +
                                    '")',
                                backgroundSize: "180px 180px",
                                backgroundRepeat: "repeat",
                            }}
                        />

                        {/* Subtle vignette so the crumple reads as a physical object
                            with edges catching less light than the center. */}
                        <div
                            aria-hidden={true}
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                zIndex: 5,
                                mixBlendMode: "multiply",
                                opacity:
                                    0.25 + safePaperTextureIntensity * 0.25,
                                background:
                                    "radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(40,32,24,0.35) 100%)",
                            }}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

addPropertyControls(PieceByPiece, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
            },
        ],
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
    },
    tileDelay: {
        type: ControlType.Number,
        title: "Tile Delay",
        defaultValue: 0.12,
        min: 0.03,
        max: 2,
        step: 0.01,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition",
        defaultValue: 0.45,
        min: 0.1,
        max: 2,
        step: 0.01,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider",
        defaultValue: "#FFFFFF",
    },
    dividerImage: {
        type: ControlType.ResponsiveImage,
        title: "Divider Image",
    },
    dividerImageFit: {
        type: ControlType.Enum,
        title: "Divider Fit",
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        hidden: (props) => !props.dividerImage,
    },
    dividerImagePosition: {
        type: ControlType.String,
        title: "Divider Pos",
        defaultValue: "center center",
        hidden: (props) => !props.dividerImage,
    },
    dividerWidth: {
        type: ControlType.Number,
        title: "Line",
        defaultValue: 1,
        min: 0,
        max: 12,
        step: 1,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 14,
        min: 0,
        max: 64,
        step: 1,
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        displaySegmentedControl: true,
    },
    objectPosition: {
        type: ControlType.String,
        title: "Position",
        defaultValue: "center center",
    },
    textureEnabled: {
        type: ControlType.Boolean,
        title: "Texture",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    paperTextureIntensity: {
        type: ControlType.Number,
        title: "Paper",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => !props.textureEnabled,
    },
    grainIntensity: {
        type: ControlType.Number,
        title: "Grain",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => !props.textureEnabled,
    },
    tileTilt: {
        type: ControlType.Number,
        title: "Tile Tilt",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.1,
    },
    tileTiltDuration: {
        type: ControlType.Number,
        title: "Tilt Time",
        defaultValue: 0.45,
        min: 0.05,
        max: 2,
        step: 0.01,
    },
    tileOverlap: {
        type: ControlType.Number,
        title: "Overlap",
        defaultValue: 6,
        min: 0,
        max: 24,
        step: 1,
    },
    stopMotionSteps: {
        type: ControlType.Number,
        title: "Steps",
        defaultValue: 4,
        min: 3,
        max: 8,
        step: 1,
    },
    collageScatter: {
        type: ControlType.Number,
        title: "Collage Scatter",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
