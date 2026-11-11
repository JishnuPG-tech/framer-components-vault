/**
 * ENDLESS GALLERY — Framer component.
 *
 * Draggable infinite image grid:
 * grab the grid and the whole scene zooms out — the faster you
 * drag, the more it shrinks — then eases back to full scale when
 * you release. Optional 3D arc, cursor parallax and throw inertia.
 *
 * Built by PONCE DE LEON STUDIO — https://linktr.ee/poncedeleon.studio
 */

import React, {
    useRef,
    useState,
    useEffect,
    useCallback,
    useId,
    startTransition,
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


interface GalleryItem {
    title: string
    image: { src: string; alt: string }
    year: number
    link?: string
}

const DEFAULT_ITEMS: GalleryItem[] = [
    {
        title: "Motion Study",
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Motion Study",
        },
        year: 2024,
    },
    {
        title: "Idle Form",
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Idle Form",
        },
        year: 2023,
    },
    {
        title: "Blur Signal",
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Blur Signal",
        },
        year: 2024,
    },
    {
        title: "Still Drift",
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Still Drift",
        },
        year: 2023,
    },
    {
        title: "Tidewalk",
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Tidewalk",
        },
        year: 2024,
    },
]

const DRAG_THRESHOLD = 4 // px
const WARP_MIN_SCALE = 0.25
const IDLE_VEL_DECAY_MS = 80
// Drag speed (px/s) that produces full speed-shrink influence
const SPEED_FULL_INFLUENCE = 2000
const AR_RATIOS: { [k: string]: number } = {
    "1:1": 1,
    "4:5": 0.8,
    "3:4": 0.75,
    "16:9": 16 / 9,
}

function computePinnedOffset(
    prevSize: number,
    nextSize: number,
    pivot: { x: number; y: number },
    prevOffset: { x: number; y: number }
) {
    const worldX = (pivot.x - prevOffset.x) / prevSize
    const worldY = (pivot.y - prevOffset.y) / prevSize
    return {
        x: pivot.x - worldX * nextSize,
        y: pivot.y - worldY * nextSize,
    }
}

function toRadians(deg: number) {
    return (deg * Math.PI) / 180
}

function calcArcTransform(opts: {
    cellCenterX: number
    cellCenterY: number
    viewportW: number
    viewportH: number
    arcAxis: "horizontal" | "vertical"
    arcMaxAngleDeg: number
    arcAmount: number
}) {
    const {
        cellCenterX,
        cellCenterY,
        viewportW,
        viewportH,
        arcAxis,
        arcMaxAngleDeg,
        arcAmount,
    } = opts

    const maxAngle =
        toRadians(arcMaxAngleDeg) * Math.max(0, Math.min(1, arcAmount))
    if (maxAngle === 0) return { z: 0, yawDeg: 0, pitchDeg: 0, edgeFactor: 0 }

    if (arcAxis === "horizontal") {
        const dx = (cellCenterX - viewportW / 2) / (viewportW / 2) // -1..1
        const angle = dx * maxAngle
        const radius = viewportW / (2 * Math.sin(Math.max(0.001, maxAngle)))
        const z = -radius * (Math.cos(angle) - 1)
        const yawDeg = -(angle * 180) / Math.PI
        const edgeFactor = Math.min(1, Math.abs(dx)) // 0 center → 1 edges
        return { z, yawDeg, pitchDeg: 0, edgeFactor }
    } else {
        const dy = (cellCenterY - viewportH / 2) / (viewportH / 2)
        const angle = dy * maxAngle
        const radius = viewportH / (2 * Math.sin(Math.max(0.001, maxAngle)))
        const z = -radius * (Math.cos(angle) - 1)
        const pitchDeg = (angle * 180) / Math.PI
        const edgeFactor = Math.min(1, Math.abs(dy))
        return { z, yawDeg: 0, pitchDeg, edgeFactor }
    }
}

// Deterministic per-cell randomness so the scatter stays stable while panning
function cellHash(x: number, y: number, seed: number) {
    let h = (x * 374761393 + y * 668265263 + seed * 69069) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h = h ^ (h >>> 16)
    return (h >>> 0) / 4294967295
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */
export default function EndlessGallery(props: any) {
    const {
        items = DEFAULT_ITEMS,
        cellSize = 200,
        backgroundColor = "#000000",
        textColor = "#808080",
        cellPadding = 0,
        gap = 12,
        zoomValue = 0.7,
        warpSpeedShrink = 0.15,
        warpEase = 0.12,
        morphEnabled = true,
        morphSquash = 0.22,
        morphSkew = 6,
        rgbAmount = 8,
        scatter = 0.6,
        sizeVariation = 0.6,
        density = 0.75,
        labels = "none",
        clickAction = "lightbox",
        lightboxAR = "fit",
        showArrows = true,
        wheelEnabled = true,
        introEnabled = true,
        introDuration = 0.8,
        introStagger = 1.2,
        arcAmount = 0.6,
        arcMaxAngleDeg = 28,
        arcAxis = "horizontal",
        edgeFade = 0.25,
        parallaxEnabled = true,
        parallaxStrength = 0.1,
        parallaxEase = 0.12,
        parallaxWhileDragging = false,
        inertiaEnabled = true,
        throwFriction = 0.92,
        throwVelocityScale = 1.0,
        throwMinSpeed = 80,
        throwMaxSpeed = 2500,
        style,
    } = props

    const list: GalleryItem[] = items && items.length ? items : DEFAULT_ITEMS

    const containerRef = useRef<HTMLDivElement>(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [targetOffset, setTargetOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [currentCellSize, setCurrentCellSize] = useState(cellSize)
    const [targetCellSize, setTargetCellSize] = useState(cellSize)
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
    const [targetMouseOffset, setTargetMouseOffset] = useState({ x: 0, y: 0 })

    // Static renderer (Framer canvas + export): render a resting frame with
    // no animation loop, no intro, no continuous effects.
    const isStatic = useIsStaticRenderer()
    const introSkip = !introEnabled || isStatic
    const [introT, setIntroT] = useState(0)

    // Madrepunk warp: scale of the whole grid, eased in the RAF loop
    // (starts shrunk so the intro zooms the whole scene in)
    const [dragScale, setDragScale] = useState(() => (introSkip ? 1 : 0.5))

    // Velocity morph: squash + skew + RGB split, all driven by drag speed
    const [morphFx, setMorphFx] = useState({ sx: 1, sy: 1, skew: 0, rgb: 0 })
    const reactId = useId()
    const rgbFilterId = "idg-rgb-" + reactId.replace(/[^a-zA-Z0-9_-]/g, "")

    // Lightbox: click a photo to view it large, then browse like a carousel
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const lightboxOpenRef = useRef(false)
    const pressedItemRef = useRef<GalleryItem | null>(null)
    const lightboxRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        lightboxOpenRef.current = lightboxIndex !== null
    }, [lightboxIndex])
    // Keyboard is scoped to the dialog: focus it on open so arrows and Escape
    // only act here, never on the page or the Framer editor.
    useEffect(() => {
        if (lightboxIndex !== null) lightboxRef.current?.focus()
    }, [lightboxIndex])
    const onLightboxKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                setLightboxIndex(null)
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                setLightboxIndex((p: number | null) =>
                    p === null ? p : (p + 1) % list.length
                )
            } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                setLightboxIndex((p: number | null) =>
                    p === null ? p : (p - 1 + list.length) % list.length
                )
            }
        },
        [list.length]
    )

    // Inertia delta (added on top of base offset)
    const [inertia, setInertia] = useState({ x: 0, y: 0 })
    const inertiaRef = useRef(inertia)
    useEffect(() => {
        inertiaRef.current = inertia
    }, [inertia])

    // Pointer velocity in px/s
    const velocityRef = useRef({ x: 0, y: 0 })
    const lastMoveRef = useRef({ x: 0, y: 0, t: 0 })
    const inertiaActiveRef = useRef(false)

    const pointerIdRef = useRef<number | null>(null)
    const isPressingRef = useRef(false)
    const draggingRef = useRef(false)
    useEffect(() => {
        draggingRef.current = isDragging
    }, [isDragging])

    const offsetRef = useRef(offset)
    useEffect(() => {
        offsetRef.current = offset
    }, [offset])

    const targetOffsetRef = useRef(targetOffset)
    useEffect(() => {
        targetOffsetRef.current = targetOffset
    }, [targetOffset])

    const targetMouseOffsetRef = useRef(targetMouseOffset)
    useEffect(() => {
        targetMouseOffsetRef.current = targetMouseOffset
    }, [targetMouseOffset])

    const pressPosRef = useRef({ x: 0, y: 0 })
    const startOffsetRef = useRef({ x: 0, y: 0 })
    const didDragRef = useRef(false)

    // frame timing
    const lastTimeRef = useRef(performance.now())

    const clamp = (v: number, min: number, max: number) =>
        Math.max(min, Math.min(max, v))

    // Commit inertia into base offset (prevents jumps when grabbing mid-throw)
    const commitInertiaToBase = useCallback(() => {
        const currentOffset = offsetRef.current
        const currentInertia = inertiaRef.current || { x: 0, y: 0 }

        const committed = {
            x: currentOffset.x + currentInertia.x,
            y: currentOffset.y + currentInertia.y,
        }

        setOffset(committed)
        setTargetOffset(committed)
        setInertia({ x: 0, y: 0 })

        inertiaActiveRef.current = false
    }, [])

    // Small velocity kick at load so the RGB/squash morph shimmers once
    useEffect(() => {
        if (introSkip) return
        velocityRef.current.x = 700
    }, []) // eslint-disable-line

    // Track container size
    const [viewport, setViewport] = useState({ w: 0, h: 0 })
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const cr = entry.contentRect
            setViewport({ w: cr.width, h: cr.height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Mouse wheel pans the gallery horizontally only
    useEffect(() => {
        const el = containerRef.current
        if (!el || !wheelEnabled || isStatic) return
        const onWheel = (e: WheelEvent) => {
            if (lightboxOpenRef.current) return
            // Vertical scroll falls through to the page; only horizontal pans
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
            e.preventDefault()
            const delta = e.deltaX
            setTargetOffset((prev: { x: number; y: number }) => ({
                x: prev.x - delta,
                y: prev.y,
            }))
            // kick the velocity so the warp and RGB react to scrolling too
            velocityRef.current.x = clamp(
                velocityRef.current.x - delta * 25,
                -throwMaxSpeed,
                throwMaxSpeed
            )
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [wheelEnabled, throwMaxSpeed, isStatic]) // eslint-disable-line

    // Main RAF animator — never runs in a static context (canvas / export)
    useEffect(() => {
        if (isStatic) return
        let raf = 0
        let running = false
        const tick = () => {
            const now = performance.now()
            const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000)
            lastTimeRef.current = now

            // Intro clock (stops accumulating once the intro is over)
            setIntroT((p: number) => (p > 10 ? p : p + dt))

            // Lerp cell size (for cellSize prop changes)
            setCurrentCellSize((prev: number) => {
                const next = prev + (targetCellSize - prev) * 0.15
                return Math.abs(next - targetCellSize) < 0.05
                    ? targetCellSize
                    : next
            })

            // Lerp base offset only when NOT dragging
            if (!draggingRef.current) {
                setOffset((prev: { x: number; y: number }) => {
                    const tx = targetOffsetRef.current.x
                    const ty = targetOffsetRef.current.y
                    const nx = prev.x + (tx - prev.x) * 0.15
                    const ny = prev.y + (ty - prev.y) * 0.15
                    return {
                        x: Math.abs(nx - tx) < 0.1 ? tx : nx,
                        y: Math.abs(ny - ty) < 0.1 ? ty : ny,
                    }
                })
            }

            // Inertia update (independent of base offset)
            if (inertiaEnabled && inertiaActiveRef.current) {
                const f = Math.pow(throwFriction, dt * 60)
                velocityRef.current.x *= f
                velocityRef.current.y *= f

                const speed = Math.hypot(
                    velocityRef.current.x,
                    velocityRef.current.y
                )
                if (speed < 1) {
                    // Keep a whisper of drift instead of a hard stop
                    const direction = Math.atan2(
                        velocityRef.current.y,
                        velocityRef.current.x
                    )
                    velocityRef.current.x = Math.cos(direction) * 0.0001
                    velocityRef.current.y = Math.sin(direction) * 0.0001
                }

                setInertia((prev: { x: number; y: number }) => ({
                    x: prev.x + velocityRef.current.x * dt,
                    y: prev.y + velocityRef.current.y * dt,
                }))
            }

            // While pressed but not moving, bleed off stale velocity so the
            // warp relaxes and releasing from a hold doesn't throw the grid
            if (
                isPressingRef.current &&
                now - lastMoveRef.current.t > IDLE_VEL_DECAY_MS
            ) {
                const decay = Math.pow(0.85, dt * 60)
                velocityRef.current.x *= decay
                velocityRef.current.y *= decay
            }

            // Decay wheel-kicked velocity when idle so the morph settles
            if (!isPressingRef.current && !inertiaActiveRef.current) {
                const idleDecay = Math.pow(0.9, dt * 60)
                velocityRef.current.x *= idleDecay
                velocityRef.current.y *= idleDecay
            }

            // Madrepunk drag warp: shrink while grabbed, extra with speed,
            // settle back to 1 as the throw decays
            const speedNow = Math.hypot(
                velocityRef.current.x,
                velocityRef.current.y
            )
            const influence = Math.min(1, speedNow / SPEED_FULL_INFLUENCE)
            const pressed = isPressingRef.current || draggingRef.current
            let warpTarget = pressed
                ? zoomValue - warpSpeedShrink * influence
                : 1 - warpSpeedShrink * influence * 0.5
            warpTarget = clamp(warpTarget, WARP_MIN_SCALE, 1)
            setDragScale((prev: number) => {
                const next = prev + (warpTarget - prev) * warpEase
                return Math.abs(next - warpTarget) < 0.001 ? warpTarget : next
            })

            // Squash perpendicular to the motion, lean into it, split RGB
            const infX = clamp(
                velocityRef.current.x / SPEED_FULL_INFLUENCE,
                -1,
                1
            )
            const infY = clamp(
                velocityRef.current.y / SPEED_FULL_INFLUENCE,
                -1,
                1
            )
            const tSx = morphEnabled ? 1 - morphSquash * Math.abs(infY) : 1
            const tSy = morphEnabled ? 1 - morphSquash * Math.abs(infX) : 1
            const tSkew = morphEnabled ? -infX * morphSkew : 0
            const tRgb = morphEnabled
                ? infX * rgbAmount + infY * rgbAmount * 0.35
                : 0
            setMorphFx(
                (prev: {
                    sx: number
                    sy: number
                    skew: number
                    rgb: number
                }) => {
                    const k = 0.18
                    const nsx = prev.sx + (tSx - prev.sx) * k
                    const nsy = prev.sy + (tSy - prev.sy) * k
                    const nsk = prev.skew + (tSkew - prev.skew) * k
                    const nrgb = prev.rgb + (tRgb - prev.rgb) * k
                    return {
                        sx: Math.abs(nsx - tSx) < 0.001 ? tSx : nsx,
                        sy: Math.abs(nsy - tSy) < 0.001 ? tSy : nsy,
                        skew: Math.abs(nsk - tSkew) < 0.01 ? tSkew : nsk,
                        rgb: Math.abs(nrgb - tRgb) < 0.01 ? tRgb : nrgb,
                    }
                }
            )

            // Eased parallax
            if (
                parallaxEnabled &&
                (parallaxWhileDragging || !draggingRef.current)
            ) {
                setMouseOffset((prev: { x: number; y: number }) => {
                    const tx = targetMouseOffsetRef.current.x
                    const ty = targetMouseOffsetRef.current.y
                    const nx = prev.x + (tx - prev.x) * parallaxEase
                    const ny = prev.y + (ty - prev.y) * parallaxEase
                    return {
                        x: Math.abs(nx - tx) < 0.1 ? tx : nx,
                        y: Math.abs(ny - ty) < 0.1 ? ty : ny,
                    }
                })
            } else {
                setMouseOffset((prev: { x: number; y: number }) => {
                    const nx = prev.x + (0 - prev.x) * parallaxEase
                    const ny = prev.y + (0 - prev.y) * parallaxEase
                    return {
                        x: Math.abs(nx) < 0.1 ? 0 : nx,
                        y: Math.abs(ny) < 0.1 ? 0 : ny,
                    }
                })
            }

            if (running) raf = requestAnimationFrame(tick)
        }

        // Run the loop only while the component is visible in the viewport
        const startLoop = () => {
            if (running) return
            running = true
            lastTimeRef.current = performance.now()
            raf = requestAnimationFrame(tick)
        }
        const stopLoop = () => {
            running = false
            cancelAnimationFrame(raf)
        }
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) startLoop()
            else stopLoop()
        })
        if (containerRef.current) io.observe(containerRef.current)
        return () => {
            io.disconnect()
            stopLoop()
        }
    }, [
        inertiaEnabled,
        throwFriction,
        targetCellSize,
        parallaxEnabled,
        parallaxWhileDragging,
        parallaxEase,
        zoomValue,
        warpSpeedShrink,
        warpEase,
        morphEnabled,
        morphSquash,
        morphSkew,
        rgbAmount,
        isStatic,
    ])

    // When cellSize prop changes externally, keep the view stable
    useEffect(() => {
        const rect = containerRef.current?.getBoundingClientRect()
        const pivot = rect
            ? { x: rect.width / 2, y: rect.height / 2 }
            : { x: 0, y: 0 }

        const visibleOffset = {
            x: offsetRef.current.x + (inertiaRef.current?.x || 0),
            y: offsetRef.current.y + (inertiaRef.current?.y || 0),
        }
        const newTargetOffset = computePinnedOffset(
            currentCellSize,
            cellSize,
            pivot,
            visibleOffset
        )

        setTargetCellSize(cellSize)
        setTargetOffset(newTargetOffset)
    }, [cellSize]) // eslint-disable-line

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            // Commit any running inertia first to avoid a jump
            if (
                inertiaActiveRef.current ||
                (inertiaRef.current?.x || 0) !== 0 ||
                (inertiaRef.current?.y || 0) !== 0
            ) {
                commitInertiaToBase()
            }

            pointerIdRef.current = e.pointerId
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

            isPressingRef.current = true
            didDragRef.current = false
            setIsDragging(false)

            lastMoveRef.current = {
                x: e.clientX,
                y: e.clientY,
                t: performance.now(),
            }
            velocityRef.current = { x: 0, y: 0 }

            pressPosRef.current = { x: e.clientX, y: e.clientY }
            startOffsetRef.current = offsetRef.current
        },
        [commitInertiaToBase]
    )

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            // Velocity tracking (only while pressing/dragging)
            if (isPressingRef.current) {
                const now = performance.now()
                const dt = Math.max(0.001, (now - lastMoveRef.current.t) / 1000)
                const dx = e.clientX - lastMoveRef.current.x
                const dy = e.clientY - lastMoveRef.current.y

                const vx = clamp(
                    (dx / dt) * throwVelocityScale,
                    -throwMaxSpeed,
                    throwMaxSpeed
                )
                const vy = clamp(
                    (dy / dt) * throwVelocityScale,
                    -throwMaxSpeed,
                    throwMaxSpeed
                )
                velocityRef.current.x = vx * 0.6 + velocityRef.current.x * 0.4
                velocityRef.current.y = vy * 0.6 + velocityRef.current.y * 0.4

                lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now }
            }

            // Disable parallax while pressing/dragging to avoid "yank"
            const suppressParallax = isPressingRef.current || isDragging

            if (
                parallaxEnabled &&
                (parallaxWhileDragging || !draggingRef.current) &&
                containerRef.current &&
                !suppressParallax
            ) {
                const rect = containerRef.current.getBoundingClientRect()
                const mouseX = e.clientX - rect.left
                const mouseY = e.clientY - rect.top
                const centerX = rect.width / 2
                const centerY = rect.height / 2

                const reverseX = (centerX - mouseX) * parallaxStrength
                const reverseY = (centerY - mouseY) * parallaxStrength

                setTargetMouseOffset({ x: reverseX, y: reverseY })
            }

            if (!isPressingRef.current) return

            const dx = e.clientX - pressPosRef.current.x
            const dy = e.clientY - pressPosRef.current.y

            // Start actual drag only after threshold
            if (!isDragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
                setIsDragging(true)
                draggingRef.current = true
                didDragRef.current = true
                startOffsetRef.current = offsetRef.current
            }

            if (draggingRef.current) {
                const nx = startOffsetRef.current.x + dx
                const ny = startOffsetRef.current.y + dy
                startTransition(() => {
                    setOffset({ x: nx, y: ny })
                    setTargetOffset({ x: nx, y: ny })
                })
            }
        },
        [
            isDragging,
            parallaxEnabled,
            parallaxWhileDragging,
            parallaxStrength,
            throwVelocityScale,
            throwMaxSpeed,
        ]
    )

    const handlePointerUp = useCallback(() => {
        isPressingRef.current = false

        // Start inertia only if fast enough
        const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y)
        if (inertiaEnabled && speed >= throwMinSpeed) {
            inertiaActiveRef.current = true
        } else {
            inertiaActiveRef.current = false
            velocityRef.current = { x: 0, y: 0 }
            setInertia({ x: 0, y: 0 })
        }

        setIsDragging(false)
        draggingRef.current = false

        setTargetMouseOffset({ x: 0, y: 0 })

        // Resolve tile clicks here: pointer capture on the container means
        // click events never reach the tiles themselves
        const pressed = pressedItemRef.current
        pressedItemRef.current = null
        if (!didDragRef.current && pressed) {
            if (clickAction === "lightbox" && pressed.image?.src) {
                const idx = list.indexOf(pressed)
                setLightboxIndex(idx >= 0 ? idx : 0)
            } else if (clickAction === "link" && pressed.link) {
                window.open(pressed.link, "_blank", "noopener")
            }
        }
    }, [inertiaEnabled, throwMinSpeed, clickAction, list])

    const handlePointerLeave = useCallback(() => {
        setTargetMouseOffset({ x: 0, y: 0 })
    }, [])

    // Prev / next arrows pan the gallery one cell at a time
    const stepBy = useCallback(
        (dir: number) => {
            commitInertiaToBase()
            setTargetOffset((prev: { x: number; y: number }) => ({
                x: prev.x - dir * cellSize,
                y: prev.y,
            }))
        },
        [cellSize, commitInertiaToBase]
    )

    const rgbActive = Math.abs(morphFx.rgb) > 0.15

    // Generate grid cells — range accounts for the warp scale so the
    // shrunken view never runs out of tiles at the edges
    const gridCells: any[] = []
    const cellWithGap = currentCellSize
    const vw = viewport.w || 800
    const vh = viewport.h || 600
    const panX = offset.x + mouseOffset.x + inertia.x
    const panY = offset.y + mouseOffset.y + inertia.y
    const effScaleX = Math.max(dragScale * morphFx.sx, WARP_MIN_SCALE)
    const effScaleY = Math.max(dragScale * morphFx.sy, WARP_MIN_SCALE)
    const skewPad =
        (Math.abs(Math.tan((morphFx.skew * Math.PI) / 180)) * vh) / 2
    const halfVisW = vw / (2 * effScaleX) + skewPad
    const halfVisH = vh / (2 * effScaleY)
    const minX = Math.floor((vw / 2 - halfVisW - panX) / cellWithGap) - 2
    const maxX = Math.ceil((vw / 2 + halfVisW - panX) / cellWithGap) + 2
    const minY = Math.floor((vh / 2 - halfVisH - panY) / cellWithGap) - 2
    const maxY = Math.ceil((vh / 2 + halfVisH - panY) / cellWithGap) + 2

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const hSkip = cellHash(x, y, 1)
            // Messy collage: some cells stay empty black space
            if (hSkip > density) continue

            const hPick = cellHash(x, y, 2)
            const hSize = cellHash(x, y, 3)
            const hJx = cellHash(x, y, 4)
            const hJy = cellHash(x, y, 5)
            const hAspect = cellHash(x, y, 6)
            const hLabel = cellHash(x, y, 7)
            const hDepth = cellHash(x, y, 8)
            const hIntro = cellHash(x, y, 9)

            const item = list[Math.floor(hPick * list.length) % list.length]

            const sizeF =
                1 - sizeVariation * 0.55 + hSize * sizeVariation * 0.85
            const tileW = currentCellSize * sizeF
            const tileH = tileW * (0.72 + hAspect * 0.62)
            const jx = (hJx - 0.5) * scatter * cellWithGap * 1.3
            const jy = (hJy - 0.5) * scatter * cellWithGap * 1.3
            const zJitter = (hDepth - 0.5) * scatter * 140
            const tileLeft =
                x * cellWithGap + panX + jx + (cellWithGap - tileW) / 2
            const tileTop =
                y * cellWithGap + panY + jy + (cellWithGap - tileH) / 2

            const cellCenterX = tileLeft + tileW / 2
            const cellCenterY = tileTop + tileH / 2

            const { z, yawDeg, pitchDeg, edgeFactor } = calcArcTransform({
                cellCenterX,
                cellCenterY,
                viewportW: vw,
                viewportH: vh,
                arcAxis,
                arcMaxAngleDeg,
                arcAmount,
            })

            const scale = 1 - edgeFade * (edgeFactor * edgeFactor)
            const opacity = 1 - 0.4 * (edgeFactor * arcAmount)

            // Staggered intro: each tile fades, rises and scales in
            const introDelay = hIntro * introStagger
            const rawT = introSkip
                ? 1
                : clamp(
                      (introT - introDelay) / Math.max(0.1, introDuration),
                      0,
                      1
                  )
            const introEase = 1 - Math.pow(1 - rawT, 3)
            const introY = (1 - introEase) * 40
            const introScale = 0.7 + 0.3 * introEase

            gridCells.push(
                <div
                    key={`${x}-${y}`}
                    style={{
                        position: "absolute",
                        left: tileLeft,
                        top: tileTop,
                        width: tileW,
                        height: tileH,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        padding: `${cellPadding}px`,
                        boxSizing: "border-box",
                        transformStyle: "preserve-3d",
                        transform: `translate3d(0, ${introY}px, ${z + zJitter}px) rotateY(${yawDeg}deg) rotateX(${pitchDeg}deg) scale(${scale * introScale})`,
                        opacity: opacity * introEase,
                        filter: rgbActive ? `url(#${rgbFilterId})` : "none",
                    }}
                    onPointerDown={() => {
                        pressedItemRef.current = item
                    }}
                    onMouseEnter={(e) => {
                        const img = e.currentTarget
                            .firstElementChild as HTMLElement | null
                        if (img) img.style.filter = "brightness(0.6)"
                    }}
                    onMouseLeave={(e) => {
                        const img = e.currentTarget
                            .firstElementChild as HTMLElement | null
                        if (img) img.style.filter = "none"
                    }}
                >
                    <div
                        role="img"
                        aria-label={
                            item?.image?.alt || item?.title || "Gallery image"
                        }
                        style={{
                            flex: 1,
                            backgroundImage: `url(${item?.image?.src || DEFAULT_ITEMS[0].image.src})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            marginBottom: labels === "under" ? `${gap}px` : 0,
                            borderRadius: "4px",
                            transition: "filter 0.25s ease",
                        }}
                    />
                    {labels === "under" && (
                        <div
                            style={{
                                color: textColor,
                                fontSize: "12px",
                                fontFamily: "monospace",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span
                                style={{
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                }}
                            >
                                {item?.title || "Project"}
                            </span>
                            <span>{item?.year || 2024}</span>
                        </div>
                    )}
                </div>
            )

            // Stray floating labels, like scattered captions in a moodboard
            if (labels === "floating" && hLabel > 0.72) {
                gridCells.push(
                    <span
                        key={`${x}-${y}-label`}
                        style={{
                            position: "absolute",
                            left: tileLeft + tileW + 10,
                            top: tileTop + hAspect * tileH * 0.6,
                            color: textColor,
                            fontFamily: "monospace",
                            fontSize: "12px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            zIndex: 2,
                            opacity: introEase,
                        }}
                    >
                        {item?.title || "Project"}
                    </span>
                )
            }
        }
    }

    // Lightbox viewer sizing for the selected aspect ratio
    const lbItem = lightboxIndex !== null ? list[lightboxIndex] : null
    const lbRatio = AR_RATIOS[lightboxAR]
    let lbW = vw * 0.86
    let lbH = vh * 0.66
    if (lbRatio) {
        if (lbW / lbH > lbRatio) lbW = lbH * lbRatio
        else lbH = lbW / lbRatio
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
                touchAction: "pan-y",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
                perspective: "1000px",
                transformStyle: "preserve-3d",
                ...style,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerLeave}
        >
            {/* RGB split filter: identical image at rest, channels drift with speed */}
            <svg
                width="0"
                height="0"
                style={{ position: "absolute" }}
                aria-hidden="true"
            >
                <defs>
                    <filter
                        id={rgbFilterId}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                            result="r"
                        />
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                            result="g"
                        />
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                            result="b"
                        />
                        <feOffset in="r" dx={morphFx.rgb} dy="0" result="r2" />
                        <feOffset in="b" dx={-morphFx.rgb} dy="0" result="b2" />
                        <feBlend in="r2" in2="g" mode="screen" result="rg" />
                        <feBlend in="rg" in2="b2" mode="screen" />
                    </filter>
                </defs>
            </svg>

            {/* Grid container — the madrepunk warp scales this whole layer */}
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: `scale(${dragScale}) scaleX(${morphFx.sx}) scaleY(${morphFx.sy}) skewX(${morphFx.skew}deg)`,
                    transformOrigin: "center center",
                    willChange: "transform",
                    opacity: lbItem ? 0.5 : 1,
                    transition: "opacity 0.35s ease",
                }}
            >
                {gridCells}
            </div>

            {/* Vignette overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.8) 90%, rgba(0,0,0,1) 100%)`,
                }}
            />

            {showArrows && (
                <>
                    <button
                        aria-label="Previous"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => stepBy(-1)}
                        style={{
                            position: "absolute",
                            left: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.5)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            fontSize: 16,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                        }}
                    >
                        ←
                    </button>
                    <button
                        aria-label="Next"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => stepBy(1)}
                        style={{
                            position: "absolute",
                            right: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.5)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            fontSize: 16,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                        }}
                    >
                        →
                    </button>
                </>
            )}

            {lbItem && (
                <div
                    ref={lightboxRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={lbItem.image?.alt || lbItem.title || "Image"}
                    tabIndex={-1}
                    onKeyDown={onLightboxKeyDown}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setLightboxIndex(null)}
                    style={{
                        outline: "none",
                        position: "absolute",
                        inset: 0,
                        zIndex: 30,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 14,
                        cursor: "zoom-out",
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                    }}
                >
                    {/* Image, cropped to the chosen aspect ratio */}
                    {lbRatio ? (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: lbW,
                                height: lbH,
                                overflow: "hidden",
                                borderRadius: 6,
                                boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
                                cursor: "default",
                            }}
                        >
                            <img
                                src={lbItem.image?.src}
                                alt={lbItem.image?.alt || lbItem.title || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </div>
                    ) : (
                        <img
                            src={lbItem.image?.src}
                            alt={lbItem.image?.alt || lbItem.title || ""}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: lbW,
                                maxHeight: lbH,
                                objectFit: "contain",
                                borderRadius: 6,
                                boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
                                cursor: "default",
                            }}
                        />
                    )}

                    {/* Caption + counter */}
                    <div
                        style={{
                            color: textColor,
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            display: "flex",
                            gap: 16,
                            alignItems: "center",
                        }}
                    >
                        <span>{lbItem.title}</span>
                        <span>{lbItem.year}</span>
                        <span style={{ opacity: 0.6 }}>
                            {(lightboxIndex ?? 0) + 1} / {list.length}
                        </span>
                        {lbItem.link && (
                            <a
                                href={lbItem.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    color: "#fff",
                                    textDecoration: "underline",
                                }}
                            >
                                View project
                            </a>
                        )}
                    </div>

                    {/* Carousel navigation */}
                    <button
                        aria-label="Previous image"
                        onClick={(e) => {
                            e.stopPropagation()
                            setLightboxIndex((p: number | null) =>
                                p === null
                                    ? p
                                    : (p - 1 + list.length) % list.length
                            )
                        }}
                        style={{
                            position: "absolute",
                            left: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            fontSize: 16,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        ←
                    </button>
                    <button
                        aria-label="Next image"
                        onClick={(e) => {
                            e.stopPropagation()
                            setLightboxIndex((p: number | null) =>
                                p === null ? p : (p + 1) % list.length
                            )
                        }}
                        style={{
                            position: "absolute",
                            right: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            fontSize: 16,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        →
                    </button>
                    <button
                        aria-label="Close"
                        onClick={(e) => {
                            e.stopPropagation()
                            setLightboxIndex(null)
                        }}
                        style={{
                            position: "absolute",
                            top: 14,
                            right: 14,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            fontSize: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    )
}

EndlessGallery.displayName = "Endless Gallery"

addPropertyControls(EndlessGallery, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, defaultValue: "Project" },
                image: { type: ControlType.ResponsiveImage },
                year: {
                    type: ControlType.Number,
                    defaultValue: 2024,
                    min: 1900,
                    max: 2100,
                    displayStepper: true,
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        min: 100,
        max: 400,
        step: 10,
        defaultValue: 200,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Image Gap",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 12,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#808080",
    },
    cellPadding: {
        type: ControlType.Number,
        title: "Cell Padding",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        unit: "px",
    },
    scatter: {
        type: ControlType.Number,
        title: "Scatter",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.6,
        description: "How far tiles drift off the grid (0 = clean grid)",
    },
    sizeVariation: {
        type: ControlType.Number,
        title: "Size Variation",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.6,
        description: "Random tile size range",
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        min: 0.2,
        max: 1,
        step: 0.01,
        defaultValue: 0.75,
        description: "How many cells show an image (rest stay empty)",
    },
    labels: {
        type: ControlType.Enum,
        title: "Labels",
        options: ["floating", "under", "none"],
        optionTitles: ["Floating", "Under", "None"],
        defaultValue: "none",
    },
    clickAction: {
        type: ControlType.Enum,
        title: "On Click",
        options: ["lightbox", "link", "none"],
        optionTitles: ["Lightbox", "Open Link", "None"],
        defaultValue: "lightbox",
        description: "What happens when a photo is clicked",
    },
    lightboxAR: {
        type: ControlType.Enum,
        title: "Viewer Ratio",
        options: ["fit", "1:1", "4:5", "3:4", "16:9"],
        optionTitles: ["Fit", "1:1", "4:5", "3:4", "16:9"],
        defaultValue: "fit",
        description: "Aspect ratio of the enlarged photo",
        hidden: (p: any) => p.clickAction !== "lightbox",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        description: "Prev / next buttons",
    },
    wheelEnabled: {
        type: ControlType.Boolean,
        title: "Scroll Pan",
        defaultValue: true,
        description: "Horizontal scroll pans the gallery",
    },
    introEnabled: {
        type: ControlType.Boolean,
        title: "Intro",
        defaultValue: true,
        description: "Zoom-in + staggered reveal on load",
    },
    introDuration: {
        type: ControlType.Number,
        title: "Intro Duration",
        min: 0.2,
        max: 2,
        step: 0.05,
        defaultValue: 0.8,
        unit: "s",
        description: "Per-tile reveal time",
        hidden: (p: any) => !p.introEnabled,
    },
    introStagger: {
        type: ControlType.Number,
        title: "Intro Stagger",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1.2,
        unit: "s",
        description: "Spread of the tile reveals",
        hidden: (p: any) => !p.introEnabled,
    },
    zoomValue: {
        type: ControlType.Number,
        title: "Drag Zoom",
        min: 0.3,
        max: 1.0,
        step: 0.01,
        defaultValue: 0.7,
        description: "Scale of the grid while grabbed (1 = no zoom)",
    },
    warpSpeedShrink: {
        type: ControlType.Number,
        title: "Speed Shrink",
        min: 0,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.15,
        description: "Extra shrink added by drag speed",
    },
    warpEase: {
        type: ControlType.Number,
        title: "Warp Ease",
        min: 0.03,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.12,
        description: "How fast the zoom follows (lower = softer)",
    },
    morphEnabled: {
        type: ControlType.Boolean,
        title: "Drag Morph",
        defaultValue: true,
        description: "Squash, skew and RGB split driven by drag speed",
    },
    morphSquash: {
        type: ControlType.Number,
        title: "Squash",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.22,
        description: "Compression perpendicular to the drag",
        hidden: (p: any) => !p.morphEnabled,
    },
    morphSkew: {
        type: ControlType.Number,
        title: "Skew",
        min: 0,
        max: 15,
        step: 0.5,
        defaultValue: 6,
        unit: "deg",
        description: "Lean into the drag direction",
        hidden: (p: any) => !p.morphEnabled,
    },
    rgbAmount: {
        type: ControlType.Number,
        title: "RGB Split",
        min: 0,
        max: 20,
        step: 0.5,
        defaultValue: 8,
        unit: "px",
        description: "Chromatic aberration at full drag speed",
        hidden: (p: any) => !p.morphEnabled,
    },
    arcAmount: {
        type: ControlType.Number,
        title: "Arc Amount",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.6,
    },
    arcMaxAngleDeg: {
        type: ControlType.Number,
        title: "Arc Max Angle",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 28,
    },
    arcAxis: {
        type: ControlType.Enum,
        title: "Arc Axis",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
    },
    edgeFade: {
        type: ControlType.Number,
        title: "Edge Fade",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.25,
    },
    parallaxEnabled: {
        type: ControlType.Boolean,
        title: "Parallax",
        defaultValue: true,
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax Strength",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
    },
    parallaxEase: {
        type: ControlType.Number,
        title: "Parallax Ease",
        min: 0.01,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.12,
    },
    parallaxWhileDragging: {
        type: ControlType.Boolean,
        title: "Parallax While Drag",
        defaultValue: false,
    },
    inertiaEnabled: {
        type: ControlType.Boolean,
        title: "Throw/Inertia",
        defaultValue: true,
    },
    throwFriction: {
        type: ControlType.Number,
        title: "Friction",
        min: 0.85,
        max: 0.99,
        step: 0.001,
        defaultValue: 0.92,
    },
    throwVelocityScale: {
        type: ControlType.Number,
        title: "Velocity Scale",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1.0,
    },
    throwMinSpeed: {
        type: ControlType.Number,
        title: "Min Speed (px/s)",
        min: 0,
        max: 500,
        step: 10,
        defaultValue: 80,
    },
    throwMaxSpeed: {
        type: ControlType.Number,
        title: "Max Speed (px/s)",
        min: 500,
        max: 6000,
        step: 100,
        defaultValue: 2500,
    },
})
