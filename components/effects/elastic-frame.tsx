/* ElasticFrame.tsx (video url priority over upload) */

import React, { useEffect, useId, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { Matter } from "https://framerusercontent.com/modules/RSJpycBYqeWLwStQ4ICt/Ql2qB4my3p5dZPWanLxj/MatterBundle.js"
import { useSharedBreakpoint } from "../Shared/Hooks/useSharedBreakpoint.ts"

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 240
 * @framerDisableUnlink
 */
export default function ElasticFrame(props: Props) {
    const {
        image,
        videoFile,
        videoUrl,
        debug,
        subdivisions,
        cursorSize,
        borderBuffer,
        renderMode,
    } = props

    const isOnFramerCanvas = RenderTarget.hasRestrictions()
    const breakpoint = useSharedBreakpoint()
    const instanceId = useId()
    const clipId = `clip-${instanceId.replace(/[:]/g, "")}`

    // --- debug (mesh)
    const [debugMesh, setDebugMesh] = useState<DebugMesh>({
        bodies: [],
        anchors: [],
        links: [],
    })
    const lastDebugTickRef = useRef(0)

    // --- media
    const urlSrc = normalizeUrl(videoUrl)
    const fileSrc = resolveFileSrc(videoFile)
    // Priority: URL > uploaded file
    const videoSrc = urlSrc || fileSrc

    const imageSrc = image?.src || ""
    const mediaMode: "video" | "image" | "none" = videoSrc
        ? "video"
        : imageSrc
          ? "image"
          : "none"

    // --- render mode resolution
    // Smart: interactive on desktop, static on tablet/mobile
    // Static: always static
    // Interactive: always interactive (except Framer canvas)
    const wantsStatic =
        renderMode === "static" ||
        (renderMode === "smart" && breakpoint === "mobile")

    const wantsInteractive =
        renderMode === "interactive" || renderMode === "smart"

    // Refs
    const containerRef = useRef<HTMLDivElement | null>(null)
    const svgRef = useRef<SVGSVGElement | null>(null)
    const pathRef = useRef<SVGPathElement | null>(null)

    const engineRef = useRef<any>(null)
    const runnerRef = useRef<any>(null)
    const runnerActiveRef = useRef(false)
    const cursorRef = useRef<any>(null)
    const pointsRef = useRef<Point[]>([])

    const animationFrameIdRef = useRef<number | null>(null)
    const isInteractingRef = useRef(false)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)

    // ---- sizing
    const getContainerDims = () => {
        if (!containerRef.current) return { width: 0, height: 0 }
        const r = containerRef.current.getBoundingClientRect()
        return {
            width: r.width - borderBuffer * 2,
            height: r.height - borderBuffer * 2,
        }
    }
    const getPhysicsDims = () => {
        const { width, height } = getContainerDims()
        return {
            width: width + borderBuffer * 2,
            height: height + borderBuffer * 2,
        }
    }

    // ---- engine
    const initEngine = () => {
        engineRef.current = Matter.Engine.create({ enableSleeping: false })
        engineRef.current.gravity.x = 0
        engineRef.current.gravity.y = 0
    }
    const initRunner = () => {
        runnerRef.current = Matter.Runner.create({ isFixed: true })
        runnerActiveRef.current = false
    }
    const startRunner = () => {
        if (!runnerRef.current || !engineRef.current) return
        if (runnerActiveRef.current) return
        Matter.Runner.run(runnerRef.current, engineRef.current)
        runnerActiveRef.current = true
    }
    const stopRunner = () => {
        if (!runnerRef.current) return
        if (!runnerActiveRef.current) return
        Matter.Runner.stop(runnerRef.current)
        runnerActiveRef.current = false
    }
    const initCursor = () => {
        cursorRef.current = Matter.Bodies.circle(0, 0, cursorSize, {
            isStatic: true,
            collisionFilter: { category: 0x0001 },
        })
        Matter.Composite.add(engineRef.current.world, cursorRef.current)
    }

    // ---- points
    class Point {
        body: any
        anchor: any
        originConstraint: any
        neighbourConstraint: any
        constructor(x: number, y: number) {
            this.body = Matter.Bodies.circle(x, y, 1, {
                collisionFilter: { mask: 1, category: 2 },
                friction: 0.1,
                frictionAir: 0.02,
            })
            this.anchor = Matter.Bodies.circle(x, y, 1, { isStatic: true })
        }
    }

    const createBox = () => {
        const { width: W, height: H } = getContainerDims()
        const X = borderBuffer,
            Y = borderBuffer

        const ptsTop = Math.max(3, Math.ceil(W / subdivisions) + 1)
        const ptsRight = Math.max(3, Math.ceil(H / subdivisions) + 1)
        const ptsBottom = ptsTop
        const ptsLeft = ptsRight

        const points: Point[] = []
        for (let i = 0; i <= ptsTop - 1; i++)
            points.push(new Point(X + (i * W) / (ptsTop - 1), Y))
        for (let i = 1; i <= ptsRight - 1; i++)
            points.push(new Point(X + W, Y + (i * H) / (ptsRight - 1)))
        for (let i = 1; i <= ptsBottom - 1; i++)
            points.push(new Point(X + W - (i * W) / (ptsBottom - 1), Y + H))
        for (let i = 1; i < ptsLeft; i++)
            points.push(new Point(X, Y + H - (i * H) / (ptsLeft - 1)))

        for (let i = 0; i < points.length; i++) {
            const p = points[i]
            p.originConstraint = Matter.Constraint.create({
                bodyA: p.body,
                bodyB: p.anchor,
                stiffness: 0.03,
                damping: 0.1,
                render: { lineWidth: 1, strokeStyle: "rgba(255,255,255,0.25)" },
            })
            const next =
                i === points.length - 1 ? points[0].body : points[i + 1].body
            p.neighbourConstraint = Matter.Constraint.create({
                bodyA: p.body,
                bodyB: next,
                stiffness: 1,
                damping: 1,
                render: { lineWidth: 1, strokeStyle: "rgba(255,255,255,0.25)" },
            })
        }

        Matter.Composite.add(
            engineRef.current.world,
            points.map((p) => p.body)
        )
        Matter.Composite.add(
            engineRef.current.world,
            points.map((p) => p.originConstraint)
        )
        Matter.Composite.add(
            engineRef.current.world,
            points.map((p) => p.neighbourConstraint)
        )
        pointsRef.current = points
    }

    // ---- debug mesh update (throttled)
    const updateDebugMesh = () => {
        if (!debug) return
        if (pointsRef.current.length === 0) return

        const now = performance.now()
        // ~12 fps
        if (now - lastDebugTickRef.current < 80) return
        lastDebugTickRef.current = now

        const pts = pointsRef.current

        const bodies = pts.map((p) => ({
            x: p.body.position.x,
            y: p.body.position.y,
        }))

        const anchors = pts.map((p) => ({
            x: p.anchor.position.x,
            y: p.anchor.position.y,
        }))

        const links: DebugMesh["links"] = []
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i]
            const next = pts[i === pts.length - 1 ? 0 : i + 1]

            // body -> anchor
            links.push({
                x1: p.body.position.x,
                y1: p.body.position.y,
                x2: p.anchor.position.x,
                y2: p.anchor.position.y,
            })

            // body -> next body (loop)
            links.push({
                x1: p.body.position.x,
                y1: p.body.position.y,
                x2: next.body.position.x,
                y2: next.body.position.y,
            })
        }

        setDebugMesh({ bodies, anchors, links })
    }

    // ---- path
    const updatePath = () => {
        if (!pathRef.current || pointsRef.current.length === 0) return
        const pts = pointsRef.current.map((p) => ({
            x: p.body.position.x,
            y: p.body.position.y,
        }))
        const d = catmullRomClosedPath(pts, 0.5)
        pathRef.current.setAttribute("d", d)
        updateDebugMesh()
    }

    // ---- events
    const onMouseMove = (e: React.MouseEvent) => {
        if (!cursorRef.current || !containerRef.current) return
        isInteractingRef.current = true
        startRunner()
        const rect = containerRef.current.getBoundingClientRect()
        Matter.Body.setPosition(cursorRef.current, {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
        if (animationFrameIdRef.current === null) animate()
    }
    const onMouseLeave = () => {
        isInteractingRef.current = false
        if (cursorRef.current)
            Matter.Body.setPosition(cursorRef.current, { x: -1e4, y: -1e4 })
        startRunner()
        if (animationFrameIdRef.current === null) animate()
    }

    // ---- loop
    const animate = () => {
        updatePath()
        const moving = pointsRef.current.some((p) => {
            const v = p.body.velocity
            const pos = p.body.position
            const anc = p.anchor.position
            return (
                Math.abs(v.x) > 0.01 ||
                Math.abs(v.y) > 0.01 ||
                Math.abs(pos.x - anc.x) > 0.1 ||
                Math.abs(pos.y - anc.y) > 0.1
            )
        })
        if (isInteractingRef.current || moving) {
            animationFrameIdRef.current = requestAnimationFrame(animate)
        } else {
            animationFrameIdRef.current = null
            stopRunner()
        }
    }

    // ---- resize
    const handleResize = () => {
        if (!svgRef.current || !pathRef.current) return
        if (engineRef.current) {
            Matter.World.clear(engineRef.current.world, false)
            pointsRef.current = []
        }
        const { width, height } = getPhysicsDims()
        svgRef.current.setAttribute("width", String(width))
        svgRef.current.setAttribute("height", String(height))
        if (engineRef.current) {
            createBox()
            initCursor()
            if (cursorRef.current && !isInteractingRef.current) {
                Matter.Body.setPosition(cursorRef.current, { x: -1e4, y: -1e4 })
            }
        }
        updatePath()
        if (isInteractingRef.current && animationFrameIdRef.current === null) {
            startRunner()
            animate()
        }
    }

    // ---- mount
    useEffect(() => {
        // Skip physics entirely if: no media, static mode, canvas, or breakpoint not ready
        if (mediaMode === "none") return
        if (!breakpoint) return
        if (isOnFramerCanvas) return
        if (!wantsInteractive) return
        if (wantsStatic) return

        const cleanup = () => {
            if (animationFrameIdRef.current)
                cancelAnimationFrame(animationFrameIdRef.current)
            animationFrameIdRef.current = null
            if (runnerRef.current) {
                stopRunner()
                runnerRef.current = null
            }
            if (engineRef.current) {
                Matter.World.clear(engineRef.current.world, false)
                Matter.Engine.clear(engineRef.current)
                engineRef.current = null
            }
            pointsRef.current = []
            setDebugMesh({ bodies: [], anchors: [], links: [] })
        }

        const init = () => {
            if (!containerRef.current || !svgRef.current || !pathRef.current)
                return
            const { width, height } = getContainerDims()
            if (width === 0 || height === 0) return

            initEngine()
            initRunner()
            createBox()
            initCursor()
            if (cursorRef.current) {
                Matter.Body.setPosition(cursorRef.current, { x: -1e4, y: -1e4 })
            }
            const { width: W, height: H } = getPhysicsDims()
            svgRef.current.setAttribute("width", String(W))
            svgRef.current.setAttribute("height", String(H))
            updatePath()
        }

        let t: any
        resizeObserverRef.current = new ResizeObserver(() => {
            clearTimeout(t)
            t = setTimeout(handleResize, 120)
        })
        if (containerRef.current)
            resizeObserverRef.current.observe(containerRef.current)

        cleanup()
        init()
        return () => {
            clearTimeout(t)
            resizeObserverRef.current?.disconnect()
            cleanup()
        }
    }, [
        videoSrc,
        imageSrc,
        subdivisions,
        cursorSize,
        borderBuffer,
        breakpoint,
        isOnFramerCanvas,
        renderMode,
        wantsStatic,
        wantsInteractive,
        mediaMode,
    ])

    /* ---------- RENDER ---------- */

    // 0) No media -> placeholder
    if (mediaMode === "none") {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    color: "#777",
                    textAlign: "center",
                    padding: 12,
                }}
            >
                Add an image or upload a video, or paste a video URL.
            </div>
        )
    }

    // Helper: plain media (no effects)
    const PlainMedia = () => {
        if (mediaMode === "video") {
            const isPreview = isOnFramerCanvas
            return (
                <video
                    src={videoSrc}
                    poster={imageSrc || undefined}
                    autoPlay={!isPreview}
                    loop={!isPreview}
                    muted
                    playsInline
                    controls={false}
                    crossOrigin="anonymous"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                    }}
                />
            )
        }
        return (
            <img
                src={imageSrc}
                alt={image?.alt ?? "Image"}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    objectPosition: `${image?.positionX} ${image?.positionY}`,
                }}
            />
        )
    }

    // 1) Static render (Render Mode: Static OR Smart on tablet/mobile) -> always plain media
    if (!breakpoint || wantsStatic) {
        return <PlainMedia />
    }

    // 2) Framer canvas -> plain media (avoid physics in canvas)
    if (isOnFramerCanvas) {
        return <PlainMedia />
    }

    // 3) Effects version (interactive)
    const { width: viewW, height: viewH } = getPhysicsDims()

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "visible",
            }}
        >
            <div
                ref={containerRef}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                style={{
                    position: "absolute",
                    top: -borderBuffer,
                    left: -borderBuffer,
                    width: `calc(100% + ${borderBuffer * 2}px)`,
                    height: `calc(100% + ${borderBuffer * 2}px)`,
                    pointerEvents: "auto",
                    zIndex: 10,
                    overflow: "visible",
                }}
            />

            <svg
                ref={svgRef}
                style={{
                    position: "absolute",
                    top: -borderBuffer,
                    left: -borderBuffer,
                    width: `calc(100% + ${borderBuffer * 2}px)`,
                    height: `calc(100% + ${borderBuffer * 2}px)`,
                    pointerEvents: "none",
                    overflow: "visible",
                }}
                aria-hidden
            >
                <defs>
                    <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                        <path ref={pathRef} d="" />
                    </clipPath>
                </defs>
            </svg>

            {/* Debug mesh overlay */}
            {debug && (
                <svg
                    style={{
                        position: "absolute",
                        top: -borderBuffer,
                        left: -borderBuffer,
                        width: `calc(100% + ${borderBuffer * 2}px)`,
                        height: `calc(100% + ${borderBuffer * 2}px)`,
                        pointerEvents: "none",
                        overflow: "visible",
                        zIndex: 9999,
                    }}
                    viewBox={`0 0 ${viewW} ${viewH}`}
                    aria-hidden
                >
                    {/* links */}
                    {debugMesh.links.map((l, i) => (
                        <line
                            key={`l-${i}`}
                            x1={l.x1}
                            y1={l.y1}
                            x2={l.x2}
                            y2={l.y2}
                            stroke="rgba(255,0,0,0.35)"
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}

                    {/* anchors (fixed) */}
                    {debugMesh.anchors.map((p, i) => (
                        <circle
                            key={`a-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={2.5}
                            fill="rgba(255,0,0,0.9)"
                        />
                    ))}

                    {/* bodies (moving) */}
                    {debugMesh.bodies.map((p, i) => (
                        <circle
                            key={`b-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={3}
                            fill="rgba(255,0,0,0.95)"
                        />
                    ))}
                </svg>
            )}

            <div
                style={{
                    position: "absolute",
                    top: -borderBuffer,
                    left: -borderBuffer,
                    width: `calc(100% + ${borderBuffer * 2}px)`,
                    height: `calc(100% + ${borderBuffer * 2}px)`,
                    clipPath: `url(#${clipId})`,
                    WebkitClipPath: `url(#${clipId})`,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                {mediaMode === "video" ? (
                    <video
                        src={videoSrc}
                        poster={imageSrc || undefined}
                        autoPlay={!isOnFramerCanvas}
                        loop={!isOnFramerCanvas}
                        muted
                        playsInline
                        controls={false}
                        crossOrigin="anonymous"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: `${image?.positionX} ${image?.positionY}`,
                            display: "block",
                        }}
                    />
                ) : (
                    <img
                        src={imageSrc}
                        alt={image?.alt ?? "Image"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            objectPosition: `${image?.positionX} ${image?.positionY}`,
                        }}
                    />
                )}
            </div>
        </div>
    )
}

/* ---------- Controls ---------- */

type RenderMode = "smart" | "static" | "interactive"

type ResponsiveImage = {
    src: string
    alt?: string
    srcSet?: string
    sizes?: string
    positionX?: string
    positionY?: string
}

type FileLike =
    | string
    | { url?: string; src?: string; file?: string }
    | Array<any>
    | null
    | undefined

type DebugMesh = {
    bodies: { x: number; y: number }[]
    anchors: { x: number; y: number }[]
    links: { x1: number; y1: number; x2: number; y2: number }[]
}

type Props = {
    image?: ResponsiveImage
    videoUrl?: string
    videoFile?: FileLike
    renderMode: RenderMode
    debug: boolean
    subdivisions: number
    cursorSize: number
    borderBuffer: number
}

ElasticFrame.displayName = "Elastic Frame"

addPropertyControls(ElasticFrame, {
    image: { type: ControlType.ResponsiveImage, title: "Image (poster)" },
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        placeholder: "https://.../video.mp4",
        defaultValue: "",
    },
    videoFile: {
        type: ControlType.File as any,
        title: "Video (upload)",
        allowedFileTypes: ["mp4", "webm", "ogg", "mov"],
    } as any,
    subdivisions: {
        type: ControlType.Number,
        title: "Subdivisions",
        min: 6,
        max: 80,
        step: 1,
        defaultValue: 25,
        displayStepper: true,
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor",
        min: 10,
        max: 140,
        step: 1,
        defaultValue: 50,
        displayStepper: true,
    },
    borderBuffer: {
        type: ControlType.Number,
        title: "Border",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 60,
        description: "Interaction overflow",
        displayStepper: true,
    },
    debug: {
        type: ControlType.Boolean,
        title: "Debug",
        defaultValue: false,
    },
    renderMode: {
        type: ControlType.Enum,
        title: "Render Mode",
        options: ["smart", "static", "interactive"],
        optionTitles: ["Smart", "Static", "Interactive"],
        defaultValue: "smart",
        description:
            "Controls how the component renders across devices. Smart enables interaction on desktop and automatically falls back to a static render on tablet and mobile. Static always disables interaction. Interactive always enables it.",
    },
})

/* ---------- Utils ---------- */

// Normalize a potentially empty/whitespace URL
function normalizeUrl(input?: string) {
    const v = (input ?? "").trim()
    return v.length ? v : ""
}

// Robustly resolve file src from Framer File control (string | object | array)
function resolveFileSrc(input: FileLike): string {
    if (!input) return ""
    if (typeof input === "string") return input
    if (Array.isArray(input)) {
        for (const item of input) {
            const s = resolveFileSrc(item as any)
            if (s) return s
        }
        return ""
    }
    return (
        (input.url as string) ||
        (input.src as string) ||
        (input.file as string) ||
        ""
    )
}

// Catmull-Rom closed path -> SVG cubic path
function catmullRomClosedPath(
    points: { x: number; y: number }[],
    tension = 0.5
) {
    if (points.length < 3) {
        const d =
            "M " +
            points
                .map((p, i) => `${i === 0 ? "" : "L "}${p.x} ${p.y}`)
                .join(" ") +
            " Z"
        return d
    }
    const pts = [...points]
    pts.unshift(points[points.length - 1])
    pts.push(points[0], points[1])

    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < pts.length - 2; i++) {
        const p0 = pts[i - 1],
            p1 = pts[i],
            p2 = pts[i + 1],
            p3 = pts[i + 2]
        const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension
        const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension
        const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension
        const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    d += " Z"
    return d
}
