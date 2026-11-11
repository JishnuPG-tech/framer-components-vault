import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// lottie-web and fflate are npm dependencies bundled by Framer; they are imported lazily inside
// effects so server rendering never touches window/document.
const FIT: Record<string, string> = { contain: "xMidYMid meet", cover: "xMidYMid slice", fill: "none" }
const BG: Record<string, string | undefined> = { none: undefined, white: "#ffffff", dark: "#0e1118" }
const SPEEDS = [0.25, 0.5, 1, 2]

interface Props {
    source: "url" | "file"
    link: string
    file: string
    play: "auto" | "load" | "hover" | "click" | "off"
    replay: "once" | "every"
    leave: "pause" | "reverse"
    offset: number
    loop: boolean
    speed: number
    direction: "forward" | "reverse"
    progress: number
    controls: boolean
    background: "none" | "white" | "dark" | "custom"
    color: string
    fit: "contain" | "cover" | "fill"
    renderer: "svg" | "canvas"
    radius: number
    style?: CSSProperties
}

/**
 * Lottie player: .json + .lottie, URL or file, play in view / on load / hover / click,
 * replay once or every time, pause or reverse on leave, speed 0.1–5x, direction, progress,
 * background presets, optional on-site controls (play/pause, timeline, frame counter, speed),
 * SVG/Canvas renderer with sub-frame interpolation for smooth motion.
 * Static frame on the Framer canvas and for prefers-reduced-motion.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 * @framerDisableUnlink
 */
export default function LottiePlus(props: Props) {
    const {
        source,
        link,
        file,
        play,
        replay,
        leave,
        offset,
        loop,
        speed,
        direction,
        progress,
        controls,
        background,
        color,
        fit,
        renderer,
        radius,
        style,
    } = props
    const src = source === "url" ? link : file
    const root = useRef<HTMLDivElement>(null)
    const box = useRef<HTMLDivElement>(null) // lottie-web owns this element (destroy() wipes its innerText)
    const anim = useRef<any>(null)
    const scrub = useRef<HTMLInputElement>(null)
    const counter = useRef<HTMLElement>(null)
    const [data, setData] = useState<any>(null)
    const [playing, setPlaying] = useState(false)
    const [ready, setReady] = useState(0) // bumps once the lottie-web instance exists
    const [liveSpeed, setLiveSpeed] = useState(speed)
    const isStaticRenderer = useIsStaticRenderer()
    const reducedMotion = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
    const isStatic = isStaticRenderer || reducedMotion // either way: show the start frame, never play

    useEffect(() => setLiveSpeed(speed), [speed])

    // Load once per URL. Zip signature "PK" → .lottie, otherwise plain JSON.
    useEffect(() => {
        setData(null)
        if (!src) return
        let alive = true
        let urls: string[] = [] // blob URLs of images unzipped from a .lottie
        const revoke = () => urls.forEach((u) => URL.revokeObjectURL(u))
        fetch(src)
            .then((r) => r.arrayBuffer())
            .then(async (buf) => {
                const bytes = new Uint8Array(buf)
                const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b
                let json
                if (isZip) ({ data: json, urls } = await unpackDotLottie(bytes))
                else json = JSON.parse(new TextDecoder().decode(bytes))
                if (alive) setData(json)
                else revoke() // replaced or unmounted while loading
            })
            .catch((e) => console.warn("LottiePlus: failed to load", src, e))
        return () => {
            alive = false
            revoke()
        }
    }, [src])

    // One lottie-web instance per (data, renderer, fit). Everything else is applied live.
    useEffect(() => {
        const el = box.current
        if (!el || !data) return
        let a: any = null
        let ro: ResizeObserver | null = null
        let cancelled = false
        import("lottie-web").then((m) => {
            if (cancelled) return
            a = m.default.loadAnimation({
                container: el,
                renderer,
                loop,
                autoplay: false,
                animationData: structuredClone(data), // lottie-web mutates it
                rendererSettings: {
                    preserveAspectRatio: FIT[fit],
                    progressiveLoad: false,
                    hideOnTransparent: true,
                    dpr: window.devicePixelRatio || 1,
                },
            })
            a.setSubframe(true) // fractional frames → motion is interpolated at display refresh rate
            a.addEventListener("enterFrame", () => {
                const f = Math.floor(a.currentFrame)
                if (scrub.current) scrub.current.value = String(f)
                if (counter.current) counter.current.textContent = `${f} / ${a.totalFrames - 1}`
            })
            a.addEventListener("complete", () => setPlaying(false))
            anim.current = a
            if (renderer === "canvas") {
                ro = new ResizeObserver(() => a.resize())
                ro.observe(el)
            }
            setReady((n) => n + 1)
        })
        return () => {
            cancelled = true
            ro?.disconnect()
            a?.destroy()
            anim.current = null
        }
    }, [data, renderer, fit])

    useEffect(() => {
        const a = anim.current
        if (!a) return
        a.setSpeed(liveSpeed)
        a.setDirection(direction === "reverse" ? -1 : 1)
        a.setLoop(loop)
    }, [ready, liveSpeed, direction, loop])

    useEffect(() => {
        const a = anim.current
        const el = root.current
        if (!a || !el) return
        const dir = direction === "reverse" ? -1 : 1
        const start = (progress / 100) * (a.totalFrames - 1)
        a.goToAndStop(start, true)
        setPlaying(false)
        if (isStatic || play === "off") return
        // Reverse on leave = play back to the first frame, so the next play starts without a jump
        const back = leave === "reverse" && (play === "hover" || (play === "auto" && replay === "every"))
        const go = () => {
            a.setLoop(loop)
            a.setDirection(dir)
            a.play()
            setPlaying(true)
        }
        const halt = () => {
            if (back) {
                a.setLoop(false)
                a.setDirection(-dir)
                a.play()
                return
            }
            a.pause()
            setPlaying(false)
        }
        if (play === "load") return go()
        if (play === "auto") {
            // play only while on screen — no CPU burned by off-screen loops
            let seen = false
            const io = new IntersectionObserver(
                ([e]) => {
                    if (!e.isIntersecting) return seen && halt()
                    if (replay === "every" && !back) a.goToAndStop(start, true)
                    seen = true
                    go()
                },
                { rootMargin: `-${offset}% 0px -${offset}% 0px` }
            )
            io.observe(el)
            return () => io.disconnect()
        }
        if (play === "hover") {
            el.addEventListener("mouseenter", go)
            el.addEventListener("mouseleave", halt)
            return () => {
                el.removeEventListener("mouseenter", go)
                el.removeEventListener("mouseleave", halt)
            }
        }
        const toggle = (e: Event) => {
            if ((e.target as HTMLElement).closest("[data-bar]")) return
            a.isPaused ? go() : halt()
        }
        el.addEventListener("click", toggle)
        return () => el.removeEventListener("click", toggle)
    }, [ready, play, replay, leave, offset, loop, direction, progress, isStatic])

    const toggle = () => {
        const a = anim.current
        if (!a || isStatic) return
        if (!a.isPaused) {
            a.pause()
            setPlaying(false)
            return
        }
        a.setLoop(loop) // undo a reverse-on-leave run
        a.setDirection(direction === "reverse" ? -1 : 1)
        if (a.currentFrame >= a.totalFrames - 1) a.goToAndStop(0, true)
        a.play()
        setPlaying(true)
    }
    const seek = (frame: number) => {
        const a = anim.current
        if (!a) return
        a.goToAndStop(frame, true)
        setPlaying(false)
    }

    const bg = background === "custom" ? color : BG[background]
    return (
        <div
            ref={root}
            style={{
                ...style,
                position: "relative",
                background: bg,
                borderRadius: radius,
                overflow: "hidden",
                cursor: play === "click" ? "pointer" : undefined,
                transform: "translateZ(0)", // own compositor layer: repaints stay inside the player
            }}
        >
            <div ref={box} style={{ position: "absolute", inset: 0 }} />
            {!src && RenderTarget.current() === RenderTarget.canvas && (
                <div style={placeholder}>Add a .json or .lottie file in the properties panel</div>
            )}
            {controls && (
                <div data-bar style={bar} onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={toggle} style={btn} aria-label={playing ? "Pause" : "Play"}>
                        {playing ? "❚❚" : "▶"}
                    </button>
                    <input
                        ref={scrub}
                        type="range"
                        min={0}
                        max={data ? Math.round(data.op - data.ip) - 1 : 0}
                        step={1}
                        defaultValue={0}
                        onInput={(e) => seek(+e.currentTarget.value)}
                        style={range}
                        aria-label="Frame"
                    />
                    <code ref={counter} style={mono}>
                        0 / {data ? Math.round(data.op - data.ip) - 1 : 0}
                    </code>
                    {SPEEDS.map((s) => (
                        <button
                            type="button"
                            key={s}
                            onClick={() => setLiveSpeed(s)}
                            style={{ ...btn, opacity: liveSpeed === s ? 1 : 0.5, fontWeight: liveSpeed === s ? 700 : 500 }}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// .lottie = zip: manifest.json + animations/<id>.json (+ images/). Zipped images become blob URLs,
// returned so the caller can revoke them.
async function unpackDotLottie(bytes: Uint8Array) {
    const { unzipSync } = await import("fflate")
    const files: Record<string, Uint8Array> = unzipSync(bytes)
    const text = (f: Uint8Array) => new TextDecoder().decode(f)
    const names = Object.keys(files)
    const manifest = files["manifest.json"] ? JSON.parse(text(files["manifest.json"])) : null
    const id = manifest?.animations?.[0]?.id
    const entry = files[`animations/${id}.json`] ?? files[names.find((n) => /^animations\/.+\.json$/.test(n)) ?? ""]
    if (!entry) throw new Error("no animation inside .lottie")
    const data = JSON.parse(text(entry))
    const urls: string[] = []
    for (const asset of data.assets ?? []) {
        if (!asset.p) continue
        const file = files[`${asset.u ?? ""}${asset.p}`] ?? files[`images/${asset.p}`]
        if (!file) continue
        asset.u = ""
        asset.e = 1
        asset.p = URL.createObjectURL(new Blob([new Uint8Array(file)]))
        urls.push(asset.p)
    }
    return { data, urls }
}

const bar: CSSProperties = {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 10,
    background: "rgba(20,24,36,0.6)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#fff",
    font: "500 11px/1 system-ui, -apple-system, sans-serif",
    cursor: "default",
}
const placeholder: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    padding: 24,
    textAlign: "center",
    color: "rgba(20,24,36,0.45)",
    font: "500 13px/1.4 system-ui, -apple-system, sans-serif",
    border: "1px dashed rgba(20,24,36,0.2)",
    borderRadius: "inherit",
}
const btn: CSSProperties = {
    background: "none",
    border: 0,
    color: "inherit",
    font: "inherit",
    padding: "4px 5px",
    cursor: "pointer",
}
const range: CSSProperties = { flex: "1 1 60px", minWidth: 60, margin: 0, accentColor: "#fff", cursor: "ew-resize" }
const mono: CSSProperties = { font: "500 11px/1 ui-monospace, Menlo, monospace", opacity: 0.85, minWidth: 64, textAlign: "right" }

addPropertyControls(LottiePlus, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["file", "url"],
        optionTitles: ["File", "URL"],
        defaultValue: "file",
        displaySegmentedControl: true,
    },
    file: { type: ControlType.File, title: "File", allowedFileTypes: [".lottie", ".json"], hidden: (p) => p.source !== "file" },
    link: {
        type: ControlType.String,
        title: "Link",
        placeholder: "https://…/animation.json",
        hidden: (p) => p.source !== "url",
    },
    play: {
        type: ControlType.Enum,
        title: "Play",
        options: ["auto", "load", "hover", "click", "off"],
        optionTitles: ["In View", "On Load", "Hover", "Click", "Off"],
        defaultValue: "auto",
        description: "In View plays only while the layer is on screen and pauses off-screen. On Load starts right away.",
    },
    replay: {
        type: ControlType.Enum,
        title: "Replay",
        options: ["once", "every"],
        optionTitles: ["Once", "Every Time"],
        defaultValue: "once",
        displaySegmentedControl: true,
        hidden: (p) => p.play !== "auto",
        description: "Every Time restarts the animation each time it scrolls into view.",
    },
    leave: {
        type: ControlType.Enum,
        title: "On Leave",
        options: ["pause", "reverse"],
        optionTitles: ["Pause", "Reverse"],
        defaultValue: "pause",
        displaySegmentedControl: true,
        hidden: (p) => !(p.play === "hover" || (p.play === "auto" && p.replay === "every")),
        description: "Reverse plays back to the first frame when the layer leaves the view or the cursor, so the next play starts without a jump.",
    },
    offset: {
        type: ControlType.Number,
        title: "Offset",
        min: 0,
        max: 45,
        step: 1,
        unit: "%",
        defaultValue: 0,
        hidden: (p) => p.play !== "auto",
        description: "How far into the screen the layer must scroll before it counts as in view.",
    },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 5,
        step: 0.05,
        defaultValue: 1,
        displayStepper: true,
        description: "0.1x to 5x. Visitors can switch speed in the Controls bar too.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        defaultValue: "forward",
        displaySegmentedControl: true,
    },
    progress: {
        type: ControlType.Number,
        title: "Progress",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 0,
        description: "Start position. Also the still frame shown on the canvas.",
    },
    controls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
        description: "Play/pause, frame scrubber and speed buttons on the live site.",
    },
    background: {
        type: ControlType.Enum,
        title: "Background",
        options: ["none", "white", "dark", "custom"],
        optionTitles: ["None", "White", "Dark", "Custom"],
        defaultValue: "none",
    },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#0055FF", hidden: (p) => p.background !== "custom" },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["contain", "cover", "fill"],
        optionTitles: ["Fit", "Fill", "Stretch"],
        defaultValue: "contain",
        displaySegmentedControl: true,
    },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 200, defaultValue: 0 },
    renderer: {
        type: ControlType.Enum,
        title: "Renderer",
        options: ["svg", "canvas"],
        optionTitles: ["SVG", "Canvas"],
        defaultValue: "svg",
        displaySegmentedControl: true,
        description: "SVG stays sharp at any size. Canvas is lighter for very complex files.",
    },
})
