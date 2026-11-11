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


type Fit = "cover" | "contain" | "fill"
type Resolution = "light" | "balanced" | "sharp"

interface Props {
    imageStack?: React.ReactNode
    frameOrder?: "name" | "layer"
    triggerType?: "viewport" | "page"
    scrollTrack?: "auto" | "self"
    startOffset?: number
    endOffset?: number
    playOrder?: "forward" | "reverse"
    frameRateFactor?: number
    smoothing?: number
    objectFit?: Fit
    resolution?: Resolution
    previewFrame?: number
    showHudOnCanvas?: boolean
    altText?: string
    style?: React.CSSProperties
}

interface Frame {
    key: string
    url: string
}

const MAX_PARALLEL_LOADS = 6
const DPR_CAP: Record<Resolution, number> = { light: 1, balanced: 1.5, sharp: 2 }
const BG_URL = /url\((['"]?)(.*?)\1\)/i

const clamp = (v: number, min: number, max: number) =>
    v < min ? min : v > max ? max : v

/** Picks the smallest srcset candidate that is at least "target" px wide. */
function pickFromSrcset(srcset: string, target: number): string {
    let best = ""
    let bestW = Infinity
    let largest = ""
    let largestW = 0
    for (const part of srcset.split(",")) {
        const [url, descriptor] = part.trim().split(/\s+/)
        if (!url || !descriptor || !descriptor.endsWith("w")) continue
        const w = parseFloat(descriptor)
        if (!isFinite(w)) continue
        if (w >= target && w < bestW) {
            best = url
            bestW = w
        }
        if (w > largestW) {
            largest = url
            largestW = w
        }
    }
    return best || largest
}

/** Reads image URLs from the hidden copy of the connected layer. */
function collectFrames(
    source: HTMLElement,
    targetPx: number,
    order: "name" | "layer"
): Frame[] {
    const frames: Frame[] = []
    const seen = new Set<string>()
    const nodes = source.querySelectorAll<HTMLElement>(
        "img, [style*='background-image']"
    )

    nodes.forEach((el) => {
        let url = ""
        if (el instanceof HTMLImageElement) {
            const srcset = el.getAttribute("srcset")
            url =
                (srcset && pickFromSrcset(srcset, targetPx)) ||
                el.getAttribute("src") ||
                ""
        } else {
            url = el.style.backgroundImage.match(BG_URL)?.[2] || ""
        }
        if (!url) return

        // The same image at different sizes counts once.
        const id = url.split("?")[0]
        if (seen.has(id)) return
        seen.add(id)

        const host = el.closest<HTMLElement>("[data-framer-name]")
        const name =
            host && source.contains(host)
                ? host.getAttribute("data-framer-name")
                : null
        const alt = el instanceof HTMLImageElement ? el.alt : ""
        frames.push({ key: name || alt || id, url })
    })

    if (order === "name") {
        // Array.sort is stable, so frames with the same name keep layer order.
        frames.sort((a, b) =>
            a.key.localeCompare(b.key, undefined, {
                numeric: true,
                sensitivity: "base",
            })
        )
    }
    return frames
}

/** Load order: first frame, last frame, then coarse-to-fine so fast scrubbing always has a nearby frame. */
function buildLoadOrder(count: number, first: number): number[] {
    const order: number[] = []
    const seen = new Uint8Array(count)
    const add = (i: number) => {
        if (i >= 0 && i < count && !seen[i]) {
            seen[i] = 1
            order.push(i)
        }
    }
    add(first)
    add(count - 1)
    for (let step = 16; step >= 1; step >>= 1) {
        for (let i = 0; i < count; i += step) add(i)
    }
    return order
}

/**
 * Sequencer
 * Scroll-driven image sequence drawn on a <canvas> from a connected Stack.
 *
 * Fixed or Fill only: every child is absolute, so "Fit Content" would collapse to 0.
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 560
 */
export default function Sequencer(props: Props) {
    const {
        imageStack = null,
        frameOrder = "name",
        triggerType = "viewport",
        scrollTrack = "auto",
        startOffset = 0,
        endOffset = 0,
        playOrder = "forward",
        frameRateFactor = 1,
        smoothing = 0.5,
        objectFit = "cover",
        resolution = "balanced",
        previewFrame = 1,
        showHudOnCanvas = true,
        altText = "",
        style,
    } = props

    const renderTarget = RenderTarget.current()
    const isCanvas = renderTarget === RenderTarget.canvas
    const isStatic =
        renderTarget === RenderTarget.export ||
        renderTarget === RenderTarget.thumbnail
    const hasStack = React.Children.count(imageStack) > 0

    const rootRef = React.useRef<HTMLDivElement>(null)
    const sourceRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const refreshRef = React.useRef<() => void>(() => {})
    // Kept across effect runs so a re-render with the same images doesn't restart the engine.
    const signatureRef = React.useRef("")
    const [frames, setFrames] = React.useState<Frame[]>([])

    // Latest settings, read by the engine without restarting it.
    const settings = {
        triggerType,
        scrollTrack,
        startOffset,
        endOffset,
        playOrder,
        frameRateFactor,
        smoothing,
        objectFit,
        resolution,
        previewFrame,
    }
    const settingsRef = React.useRef(settings)
    settingsRef.current = settings

    // 1. Read frame URLs from the hidden layer. Only updates state when the list changes.
    React.useEffect(() => {
        const source = sourceRef.current
        const root = rootRef.current
        if (isStatic || !hasStack || !source || !root) {
            signatureRef.current = ""
            setFrames((prev) => (prev.length ? [] : prev))
            return
        }

        let timer = 0

        const run = () => {
            timer = 0
            // offsetWidth ignores canvas zoom, unlike getBoundingClientRect.
            const size = Math.max(root.offsetWidth, root.offsetHeight) || 1200
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                DPR_CAP[settingsRef.current.resolution] || 1.5
            )
            const next = collectFrames(source, size * dpr, frameOrder)
            const nextSignature = next.map((f) => f.url).join("|")
            if (nextSignature !== signatureRef.current) {
                signatureRef.current = nextSignature
                setFrames(next)
            }
            // The published site never edits the layer, so stop watching once found.
            if (!isCanvas && next.length > 0) observer.disconnect()
        }

        const observer = new MutationObserver(() => {
            if (!timer) timer = window.setTimeout(run, 120)
        })
        observer.observe(source, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "srcset", "style"],
        })
        run()

        return () => {
            observer.disconnect()
            window.clearTimeout(timer)
        }
    }, [hasStack, imageStack, frameOrder, resolution, isCanvas, isStatic])

    // 2. Loader + scroll engine. Draws to canvas without React re-renders.
    React.useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        const count = frames.length
        if (!root || !canvas || count === 0) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const images: (HTMLImageElement | null)[] = new Array(count).fill(null)
        const requested = new Uint8Array(count)
        const created: HTMLImageElement[] = []
        const queue: number[] = []
        const reduceMotion =
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
            false

        let disposed = false
        let inFlight = 0
        let fullLoadStarted = false
        let visible = isCanvas
        let current = -1
        let drawn = -1
        let raf = 0
        let lastTime = 0
        let track: HTMLElement | null = null

        // Loading
        const pump = () => {
            while (!disposed && inFlight < MAX_PARALLEL_LOADS && queue.length) {
                const i = queue.shift()!
                if (requested[i]) continue
                requested[i] = 1
                inFlight++
                const img = new Image()
                img.decoding = "async"
                created.push(img)
                const done = (ok: boolean) => {
                    inFlight--
                    if (disposed) return
                    if (ok) {
                        images[i] = img
                        if (drawn !== Math.round(current)) requestTick()
                    }
                    pump()
                }
                img.src = frames[i].url
                img.decode().then(
                    () => done(true),
                    () => done(img.complete && img.naturalWidth > 0)
                )
            }
        }

        const want = (i: number, urgent: boolean) => {
            if (requested[i]) return
            if (urgent) queue.unshift(i)
            else queue.push(i)
            pump()
        }

        const startFullLoad = (first: number) => {
            if (fullLoadStarted) return
            fullLoadStarted = true
            for (const i of buildLoadOrder(count, first)) want(i, false)
        }

        // Drawing
        const nearestReady = (i: number) => {
            if (images[i]) return i
            for (let d = 1; d < count; d++) {
                if (i - d >= 0 && images[i - d]) return i - d
                if (i + d < count && images[i + d]) return i + d
            }
            return -1
        }

        const draw = (i: number) => {
            const j = nearestReady(i)
            if (j < 0 || j === drawn) return
            const img = images[j]!
            const W = canvas.width
            const H = canvas.height
            const iw = img.naturalWidth || W
            const ih = img.naturalHeight || H
            let dw = W
            let dh = H
            const fit = settingsRef.current.objectFit
            if (fit !== "fill") {
                const scale =
                    fit === "cover"
                        ? Math.max(W / iw, H / ih)
                        : Math.min(W / iw, H / ih)
                dw = iw * scale
                dh = ih * scale
            }
            ctx.clearRect(0, 0, W, H)
            ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
            if (drawn < 0) canvas.style.opacity = "1"
            drawn = j
        }

        // Scroll position → frame
        const findTrack = (): HTMLElement | null => {
            if (settingsRef.current.scrollTrack === "self") return null
            let el = root.parentElement
            for (let depth = 0; el && el !== document.body && depth < 12; depth++) {
                if (getComputedStyle(el).position === "sticky") {
                    return el.parentElement
                }
                el = el.parentElement
            }
            return null
        }

        const targetFrame = (): number => {
            const s = settingsRef.current
            if (isCanvas) return clamp(Math.round(s.previewFrame) - 1, 0, count - 1)

            const vh = window.innerHeight
            let raw = 0
            if (s.triggerType === "page") {
                const max = document.documentElement.scrollHeight - vh
                raw = max > 0 ? window.scrollY / max : 0
            } else {
                const trackRect = track?.getBoundingClientRect()
                const pinned = trackRect ? trackRect.height - vh : 0
                if (trackRect && pinned > 1) {
                    // Sticky: track top hits viewport top → track bottom hits viewport bottom.
                    raw = -trackRect.top / pinned
                } else {
                    // Not sticky: element enters at the bottom → leaves at the top.
                    const r = root.getBoundingClientRect()
                    raw = (vh - r.top) / (vh + r.height)
                }
            }

            const start = clamp(s.startOffset / 100, 0, 1)
            const end = clamp(s.endOffset / 100, 0, 1)
            const span = 1 - start - end
            let p = span > 0.001 ? (raw - start) / span : raw >= start ? 1 : 0
            p = clamp(p, 0, 1)
            p = Math.min(1, p * Math.max(0.01, s.frameRateFactor))

            const f = p * (count - 1)
            return s.playOrder === "reverse" ? count - 1 - f : f
        }

        const tick = (time: number) => {
            raf = 0
            const target = targetFrame()
            const s = settingsRef.current
            const smooth =
                isCanvas || reduceMotion ? 0 : clamp(s.smoothing, 0, 0.95)

            if (current < 0 || smooth === 0) {
                current = target
            } else {
                const dt = lastTime ? Math.min(64, time - lastTime) : 16.67
                const k = 1 - Math.pow(smooth, dt / 16.67)
                current += (target - current) * k
                if (Math.abs(target - current) < 0.02) current = target
            }

            const index = clamp(Math.round(current), 0, count - 1)
            want(index, true)
            draw(index)

            if (current !== target) {
                lastTime = time
                raf = requestAnimationFrame(tick)
            } else {
                lastTime = 0
            }
        }

        function requestTick() {
            if (!disposed && visible && !raf) raf = requestAnimationFrame(tick)
        }

        const resize = () => {
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                DPR_CAP[settingsRef.current.resolution] || 1.5
            )
            const w = Math.max(1, Math.round(root.offsetWidth * dpr))
            const h = Math.max(1, Math.round(root.offsetHeight * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
                ctx.imageSmoothingQuality = "high"
                drawn = -1
            }
            track = findTrack()
            requestTick()
        }

        refreshRef.current = () => {
            drawn = -1
            resize()
        }

        // Start
        resize()
        want(clamp(Math.round(targetFrame()), 0, count - 1), true)

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(root)

        let io: IntersectionObserver | null = null
        if (!isCanvas) {
            // Only load the full set and track scroll near the viewport.
            io = new IntersectionObserver(
                (entries) => {
                    visible = entries.some((e) => e.isIntersecting)
                    if (visible) {
                        startFullLoad(clamp(Math.round(targetFrame()), 0, count - 1))
                        requestTick()
                    }
                },
                { rootMargin: "100% 0px" }
            )
            io.observe(root)
            window.addEventListener("scroll", requestTick, { passive: true })
            window.addEventListener("resize", resize)
        }

        return () => {
            disposed = true
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            io?.disconnect()
            window.removeEventListener("scroll", requestTick)
            window.removeEventListener("resize", resize)
            refreshRef.current = () => {}
            for (const img of created) img.removeAttribute("src")
        }
    }, [frames, isCanvas])

    // 3. Redraw when a setting changes (no reload).
    React.useEffect(() => {
        refreshRef.current()
    }, [
        triggerType,
        scrollTrack,
        startOffset,
        endOffset,
        playOrder,
        frameRateFactor,
        objectFit,
        resolution,
        previewFrame,
    ])

    if (isStatic) {
        // Thumbnails/exports: show the connected layer stretched to fill.
        const child = React.Children.toArray(imageStack)[0]
        return (
            <div style={{ ...rootStyle, ...style }}>
                {React.isValidElement(child)
                    ? React.cloneElement(child as React.ReactElement<any>, {
                          style: {
                              ...(child.props as any).style,
                              width: "100%",
                              height: "100%",
                          },
                      })
                    : null}
            </div>
        )
    }

    const showPlaceholder = isCanvas && !hasStack
    const showEmpty = isCanvas && hasStack && frames.length === 0
    const shownFrame = clamp(Math.round(previewFrame), 1, Math.max(1, frames.length))

    return (
        <div ref={rootRef} style={{ ...rootStyle, ...style }}>
            {hasStack ? (
                <div ref={sourceRef} aria-hidden="true" style={sourceStyle}>
                    {imageStack}
                </div>
            ) : null}

            <canvas
                ref={canvasRef}
                role={altText ? "img" : undefined}
                aria-label={altText || undefined}
                aria-hidden={altText ? undefined : true}
                style={canvasStyle}
            />

            {showPlaceholder ? <Placeholder /> : null}
            {showEmpty ? (
                <Placeholder message="No images found in the connected layer. Make sure it contains image layers or frames with image fills." />
            ) : null}

            {isCanvas && showHudOnCanvas && frames.length > 0 ? (
                <div style={hudStyle}>
                    <div style={{ fontWeight: 700, color: "#00d2ff" }}>
                        SEQUENCER
                    </div>
                    <div style={{ marginTop: 4 }}>
                        Frame{" "}
                        <b style={{ color: "#FFF" }}>{shownFrame}</b> /{" "}
                        <b style={{ color: "#FFF" }}>{frames.length}</b>
                        {playOrder === "reverse" ? " · REV" : ""}
                    </div>
                    <div style={{ marginTop: 2, opacity: 0.7 }}>
                        Canvas only
                    </div>
                </div>
            ) : null}
        </div>
    )
}

function Placeholder({ message }: { message?: string }) {
    return (
        <div style={placeholderStyle}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#FFFFFF" }}>
                Sequencer
            </div>
            <div style={placeholderTextStyle}>
                {message ?? (
                    <>
                        1. Drop your numbered frames onto the canvas.
                        <br />
                        2. Wrap them in a <strong>Stack</strong> (Shift + A).
                        <br />
                        3. Pick that Stack in <strong>Connect Stack</strong>.
                    </>
                )}
            </div>
        </div>
    )
}

const rootStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
}

// display:none keeps the source out of layout and stops its lazy images from downloading twice.
const sourceStyle: React.CSSProperties = { display: "none" }

const canvasStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    opacity: 0,
    transition: "opacity 0.3s ease",
    pointerEvents: "none",
}

const hudStyle: React.CSSProperties = {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(19, 19, 21, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    padding: "10px 14px",
    borderRadius: 8,
    color: "#8A8A93",
    fontSize: 12,
    fontFamily: "Inter, system-ui, sans-serif",
    zIndex: 2,
    pointerEvents: "none",
}

const placeholderStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 24,
    border: "2px dashed rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    backgroundColor: "#131315",
    fontFamily: "Inter, system-ui, sans-serif",
}

const placeholderTextStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#8A8A93",
    marginTop: 8,
    maxWidth: 320,
    lineHeight: 1.6,
}

addPropertyControls(Sequencer, {
    imageStack: {
        type: ControlType.ComponentInstance,
        title: "Connect Stack",
        description: "The Stack or Frame that holds your sequence frames.",
    },
    frameOrder: {
        type: ControlType.Enum,
        title: "Frame Order",
        options: ["name", "layer"],
        optionTitles: ["Layer Name", "Layer Order"],
        displaySegmentedControl: true,
        defaultValue: "name",
    },
    triggerType: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["viewport", "page"],
        optionTitles: ["Section", "Whole Page"],
        displaySegmentedControl: true,
        defaultValue: "viewport",
    },
    scrollTrack: {
        type: ControlType.Enum,
        title: "Track",
        options: ["auto", "self"],
        optionTitles: ["Auto", "Self"],
        displaySegmentedControl: true,
        defaultValue: "auto",
        description:
            "Auto: if the component (or a parent) is sticky, the sequence plays across the tall section around it.",
        hidden: (p: Props) => p.triggerType === "page",
    },
    startOffset: {
        type: ControlType.Number,
        title: "Start Delay",
        min: 0,
        max: 90,
        step: 1,
        unit: "%",
        defaultValue: 0,
    },
    endOffset: {
        type: ControlType.Number,
        title: "End Early",
        min: 0,
        max: 90,
        step: 1,
        unit: "%",
        defaultValue: 0,
    },
    playOrder: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        displaySegmentedControl: true,
        defaultValue: "forward",
    },
    frameRateFactor: {
        type: ControlType.Number,
        title: "Scrub Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0,
        max: 0.95,
        step: 0.05,
        defaultValue: 0.5,
        description: "0 = instant. Set to 0 if you already use Lenis.",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        displaySegmentedControl: true,
        defaultValue: "cover",
    },
    resolution: {
        type: ControlType.Enum,
        title: "Quality",
        options: ["light", "balanced", "sharp"],
        optionTitles: ["Light", "Balanced", "Sharp"],
        displaySegmentedControl: true,
        defaultValue: "balanced",
        description: "Lower quality loads smaller images and saves memory.",
    },
    previewFrame: {
        type: ControlType.Number,
        title: "Canvas Frame",
        min: 1,
        max: 2000,
        step: 1,
        displayStepper: true,
        defaultValue: 1,
        description: "Which frame to show in the editor.",
    },
    showHudOnCanvas: {
        type: ControlType.Boolean,
        title: "HUD",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
        description: "Frame counter. Canvas only, never on your live site.",
    },
    altText: {
        type: ControlType.String,
        title: "Alt Text",
        placeholder: "Describe the animation",
        defaultValue: "",
        // Last control, so its description closes the panel as the credit.
        // "@" is encoded as %40: Framer won't parse a link URL containing "@".
        description: "Created by [*Jeeth*](https://www.framer.com/%40jeeth/)",
    },
})
