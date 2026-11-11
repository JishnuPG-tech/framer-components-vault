// Mosaic Flip Hover Effect – Framer Code Component
// @framerSupportedLayoutWidth fixed
// @framerSupportedLayoutHeight fixed

import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate } from "framer-motion"

interface Props {
    images: string[]
    projectNames: string[]
    tilesX: number
    tilesY: number
    tileSize: number
    backgroundColor: string
    navTextColor: string
    darkFaceColor: string
}

export default function MosaicFlip(props: Props) {
    const {
        images = [
            "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            "https://framerusercontent.com/images/q5NbJYaLpFPl9n3pRKpSzlJZA.jpg",
        ],
        projectNames = [
            "PROJECT ONE",
            "PROJECT TWO",
            "PROJECT THREE",
            "PROJECT FOUR",
        ],
        tilesX = 12,
        tilesY = 9,
        tileSize = 60,
        backgroundColor = "#171717",
        navTextColor = "#FFFFFF",
        darkFaceColor = "#222222",
    } = props

    const gridWidth = tilesX * tileSize
    const gridHeight = tilesY * tileSize
    const totalTiles = tilesX * tilesY
    const half = tileSize / 2

    // Refs for imperative DOM manipulation (avoids re-render mid-animation)
    const tilesRef = useRef<HTMLDivElement[]>([])
    const frontFaceRefs = useRef<HTMLDivElement[]>([])
    const rearFaceRefs = useRef<HTMLDivElement[]>([])

    const activeIndexRef = useRef(0) // tracks current image without re-render
    const flipCountRef = useRef(0) // accumulates to get correct rotation direction
    const isAnimatingRef = useRef(false)
    const queuedIndexRef = useRef<number | null>(null)
    const cancelBreathRef = useRef(false)

    const [activeNavIndex, setActiveNavIndex] = useState<number | null>(null)

    // ─── Helper: set a face's background to an image slice ───────────────────
    const setFaceImage = (
        face: HTMLDivElement,
        col: number,
        row: number,
        imageUrl: string
    ) => {
        face.style.backgroundImage = `url(${imageUrl})`
        face.style.backgroundSize = `${gridWidth}px ${gridHeight}px`
        face.style.backgroundPosition = `-${col * tileSize}px -${row * tileSize}px`
    }

    // ─── Initialize face backgrounds ─────────────────────────────────────────
    useEffect(() => {
        const defaultImg = images[0]
        if (!defaultImg) return

        frontFaceRefs.current.forEach((face, i) => {
            if (!face) return
            setFaceImage(face, i % tilesX, Math.floor(i / tilesX), defaultImg)
        })
        rearFaceRefs.current.forEach((face, i) => {
            if (!face) return
            setFaceImage(face, i % tilesX, Math.floor(i / tilesX), defaultImg)
        })
    }, [images[0], tilesX, tilesY, tileSize])

    // ─── Breathing animation ──────────────────────────────────────────────────
    // Fixed: stagger delay only on first start, not repeated each loop iteration
    useEffect(() => {
        cancelBreathRef.current = false
        const timeouts: ReturnType<typeof setTimeout>[] = []

        const breathe = async (tile: HTMLDivElement) => {
            while (!cancelBreathRef.current) {
                const z = Math.random() * 80 - 40
                const duration = 0.6 + Math.random() * 0.8
                // No delay here – delay was already applied via setTimeout below
                await animate(
                    tile,
                    { z },
                    { duration, ease: [0.45, 0.05, 0.55, 0.95] }
                )
            }
        }

        tilesRef.current.forEach((tile, i) => {
            if (!tile) return
            // Stagger only the start, not every loop cycle
            const t = setTimeout(() => breathe(tile), i * 15)
            timeouts.push(t)
        })

        return () => {
            cancelBreathRef.current = true
            timeouts.forEach(clearTimeout)
        }
    }, [totalTiles])

    // ─── Flip to image ────────────────────────────────────────────────────────
    const flipToImage = (targetIndex: number) => {
        if (targetIndex === activeIndexRef.current && !isAnimatingRef.current)
            return

        if (isAnimatingRef.current) {
            queuedIndexRef.current = targetIndex
            return
        }

        if (targetIndex === activeIndexRef.current) return

        isAnimatingRef.current = true
        flipCountRef.current++
        activeIndexRef.current = targetIndex

        // FIX: accumulative rotation — always spins same direction
        // flip 1 → 180°, flip 2 → 360°, flip 3 → 540°, etc.
        const targetRotation = flipCountRef.current * 180

        // Load new image onto the face that's currently hidden (backface)
        // Odd flips: front face is hidden (rotated away) → load into front
        // Even flips: rear face is hidden → load into rear
        const hiddenFaceRefs =
            flipCountRef.current % 2 === 1 ? rearFaceRefs : frontFaceRefs
        const imageUrl = images[targetIndex] ?? images[0]

        hiddenFaceRefs.current.forEach((face, i) => {
            if (!face) return
            setFaceImage(face, i % tilesX, Math.floor(i / tilesX), imageUrl)
        })

        // FIX: true 2D grid stagger from center (matches GSAP grid behavior)
        const centerRow = (tilesY - 1) / 2
        const centerCol = (tilesX - 1) / 2
        const maxDist = Math.sqrt(centerRow ** 2 + centerCol ** 2)

        const validTiles = tilesRef.current.filter(Boolean)
        let completed = 0

        const onTileComplete = () => {
            completed++
            if (completed >= validTiles.length) {
                isAnimatingRef.current = false
                const queued = queuedIndexRef.current
                if (queued !== null && queued !== activeIndexRef.current) {
                    queuedIndexRef.current = null
                    flipToImage(queued)
                }
            }
        }

        tilesRef.current.forEach((tile, i) => {
            if (!tile) {
                onTileComplete()
                return
            }

            const row = Math.floor(i / tilesX)
            const col = i % tilesX
            const dist = Math.sqrt(
                (row - centerRow) ** 2 + (col - centerCol) ** 2
            )
            const delay = (dist / maxDist) * 0.35 // ~0.35s max stagger spread

            animate(
                tile,
                { rotateY: targetRotation },
                { duration: 0.5, ease: [0.65, 0, 0.35, 1], delay }
            ).then(onTileComplete)
        })
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // perspective on the parent, NOT on the grid itself
                perspective: "800px",
                perspectiveOrigin: "50% 50%",
            }}
        >
            {/* Grid */}
            <div
                style={{
                    position: "relative",
                    width: gridWidth,
                    height: gridHeight,
                    transformStyle: "preserve-3d",
                    flexShrink: 0,
                }}
            >
                {Array.from({ length: totalTiles }).map((_, index) => {
                    const col = index % tilesX
                    const row = Math.floor(index / tilesX)

                    return (
                        <div
                            key={index}
                            ref={(el) => {
                                if (el) tilesRef.current[index] = el
                            }}
                            style={{
                                position: "absolute",
                                left: col * tileSize,
                                top: row * tileSize,
                                width: tileSize,
                                height: tileSize,
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {/* Front face — background set imperatively */}
                            <div
                                ref={(el) => {
                                    if (el) frontFaceRefs.current[index] = el
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: `translateZ(${half}px)`,
                                    backfaceVisibility: "hidden",
                                }}
                            />
                            {/* Rear face — background set imperatively */}
                            <div
                                ref={(el) => {
                                    if (el) rearFaceRefs.current[index] = el
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: `rotateY(180deg) translateZ(${half}px)`,
                                    backfaceVisibility: "hidden",
                                }}
                            />
                            {/* Side faces — dark, just for visual depth */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: darkFaceColor,
                                    transform: `rotateY(90deg) translateZ(${half}px)`,
                                    backfaceVisibility: "hidden",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: darkFaceColor,
                                    transform: `rotateY(-90deg) translateZ(${half}px)`,
                                    backfaceVisibility: "hidden",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: darkFaceColor,
                                    transform: `rotateX(90deg) translateZ(${half}px)`,
                                    backfaceVisibility: "hidden",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: darkFaceColor,
                                    transform: `rotateX(-90deg) translateZ(${half}px)`,
                                    backfaceVisibility: "hidden",
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            {/* Navigation — mouseleave on the whole nav, not individual items */}
            <nav
                onMouseLeave={() => {
                    setActiveNavIndex(null)
                    flipToImage(0)
                }}
                style={{
                    position: "absolute",
                    bottom: 40,
                    right: 40,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    zIndex: 10,
                }}
            >
                {projectNames.map((name, index) => (
                    <div
                        key={index}
                        onMouseEnter={() => {
                            setActiveNavIndex(index)
                            // FIX: index + 1 so project 0 → images[1], not images[0]
                            flipToImage(index + 1)
                        }}
                        style={{
                            fontFamily: "monospace",
                            fontSize: 14,
                            color: navTextColor,
                            opacity: activeNavIndex === index ? 1 : 0.5,
                            cursor: "pointer",
                            transition: "opacity 0.3s ease",
                            textTransform: "uppercase" as const,
                            letterSpacing: "0.1em",
                            textAlign: "right" as const,
                            userSelect: "none" as const,
                        }}
                    >
                        {name}
                    </div>
                ))}
            </nav>
        </div>
    )
}

addPropertyControls(MosaicFlip, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        defaultValue: [
            "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        ],
    },
    projectNames: {
        type: ControlType.Array,
        title: "Project Names",
        control: { type: ControlType.String },
        defaultValue: [
            "PROJECT ONE",
            "PROJECT TWO",
            "PROJECT THREE",
            "PROJECT FOUR",
        ],
    },
    tilesX: {
        type: ControlType.Number,
        title: "Tiles X",
        defaultValue: 12,
        min: 4,
        max: 24,
        step: 1,
        displayStepper: true,
    },
    tilesY: {
        type: ControlType.Number,
        title: "Tiles Y",
        defaultValue: 9,
        min: 3,
        max: 18,
        step: 1,
        displayStepper: true,
    },
    tileSize: {
        type: ControlType.Number,
        title: "Tile Size",
        defaultValue: 60,
        min: 30,
        max: 120,
        step: 10,
        displayStepper: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#171717",
    },
    navTextColor: {
        type: ControlType.Color,
        title: "Nav Text",
        defaultValue: "#FFFFFF",
    },
    darkFaceColor: {
        type: ControlType.Color,
        title: "Dark Faces",
        defaultValue: "#222222",
    },
})
