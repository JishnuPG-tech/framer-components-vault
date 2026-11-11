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


/**
 * Momentum Field — a scroll-velocity parallax scene with gentle pointer depth.
 * No network requests, external assets, or third-party animation libraries.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 */
export default function MomentumField(props) {
    const {
        eyebrow = "MOMENTUM FIELD / 001",
        title = "Depth, in\nmotion.",
        subtitle = "A scroll effect that carries its own inertia. Move through the page and watch each layer settle at a different pace.",
        footerLabel = "SCROLL TO FEEL THE AFTERGLOW",
        accent = "#B8FA67",
        background = "#09140F",
        textColor = "#EEF3E9",
        mutedColor = "#9FB2A4",
        height = 640,
        intensity = 1,
        damping = 0.1,
        pointerTilt = true,
        cornerRadius = 26,
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        const reducedMotion =
            window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
            false
        if (reducedMotion) return

        const layers = Array.from(
            root.querySelectorAll<HTMLElement>("[data-depth]")
        )
        const clamp = (value: number, min: number, max: number) =>
            Math.min(max, Math.max(min, value))
        let targetX = 0
        let targetY = 0
        let currentX = 0
        let currentY = 0
        let targetScroll = 0
        let currentScroll = 0
        let momentum = 0
        let frame = 0
        let previousScrollY = window.scrollY

        const measureScroll = () => {
            const rect = root.getBoundingClientRect()
            const range = window.innerHeight + rect.height
            const progress =
                range > 0
                    ? clamp((window.innerHeight - rect.top) / range, 0, 1)
                    : 0.5
            targetScroll = (progress - 0.5) * 2
        }

        const schedule = () => {
            if (!frame) frame = window.requestAnimationFrame(render)
        }

        const onPointerMove = (event: PointerEvent) => {
            if (!pointerTilt || event.pointerType === "touch") return
            const rect = root.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            targetX = clamp(
                ((event.clientX - rect.left) / rect.width - 0.5) * 2,
                -1,
                1
            )
            targetY = clamp(
                ((event.clientY - rect.top) / rect.height - 0.5) * 2,
                -1,
                1
            )
            schedule()
        }

        const onPointerLeave = () => {
            targetX = 0
            targetY = 0
            schedule()
        }

        const onScroll = () => {
            const nextScrollY = window.scrollY
            const delta = nextScrollY - previousScrollY
            previousScrollY = nextScrollY
            momentum = clamp(momentum + delta * 0.006, -1.25, 1.25)
            measureScroll()
            schedule()
        }

        const onResize = () => {
            measureScroll()
            schedule()
        }

        function render() {
            frame = 0
            const ease = clamp(damping, 0.035, 0.25)
            currentX += (targetX - currentX) * ease
            currentY += (targetY - currentY) * ease
            currentScroll += (targetScroll - currentScroll) * ease
            momentum *= 0.91

            const travel = intensity * 30
            layers.forEach((layer) => {
                const depth = Number(layer.dataset.depth || 1)
                const baseRotation = Number(layer.dataset.rotate || 0)
                const x =
                    currentX * depth * travel * 0.42 +
                    currentScroll * depth * travel * 0.08
                const y =
                    currentY * depth * travel * 0.2 +
                    currentScroll * depth * travel * 0.24 +
                    momentum * depth * travel * 0.76
                const rotateX = -currentY * depth * 4.2
                const rotateY = currentX * depth * 5.5
                const rotateZ = baseRotation + currentX * depth * 1.2
                layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg)`
            })

            const moving =
                Math.abs(targetX - currentX) > 0.004 ||
                Math.abs(targetY - currentY) > 0.004 ||
                Math.abs(targetScroll - currentScroll) > 0.004 ||
                Math.abs(momentum) > 0.006
            if (moving) frame = window.requestAnimationFrame(render)
        }

        measureScroll()
        root.addEventListener("pointermove", onPointerMove, { passive: true })
        root.addEventListener("pointerleave", onPointerLeave, { passive: true })
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize, { passive: true })
        schedule()

        return () => {
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerleave", onPointerLeave)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
            if (frame) window.cancelAnimationFrame(frame)
        }
    }, [isStatic, intensity, damping, pointerTilt])

    const styles = `
      .mf-root{width:100%;min-height:var(--mf-height,640px);color:var(--mf-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
      .mf-root *{box-sizing:border-box}.mf-stage{position:relative;isolation:isolate;overflow:hidden;width:100%;min-height:var(--mf-height,640px);height:100%;border-radius:var(--mf-radius,26px);background:radial-gradient(ellipse at 72% 44%,color-mix(in srgb,var(--mf-accent) 11%,transparent),transparent 37%),radial-gradient(ellipse at 16% 92%,#172a23 0%,transparent 48%),var(--mf-bg);perspective:1200px;transform-style:preserve-3d;}
      .mf-stage:before{content:"";position:absolute;inset:0;z-index:10;pointer-events:none;border:1px solid color-mix(in srgb,var(--mf-accent) 20%,transparent);border-radius:inherit;box-shadow:inset 0 0 90px #020b0870}
      .mf-grid{position:absolute;inset:-14%;z-index:0;opacity:.3;background-image:linear-gradient(color-mix(in srgb,var(--mf-accent) 9%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--mf-accent) 9%,transparent) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(ellipse at 66% 46%,#000 0%,transparent 74%);will-change:transform;}
      .mf-glow{position:absolute;border-radius:50%;filter:blur(1px);pointer-events:none;will-change:transform}.mf-glow-a{width:34%;aspect-ratio:1;right:13%;top:18%;background:radial-gradient(circle,color-mix(in srgb,var(--mf-accent) 15%,transparent),transparent 69%)}.mf-glow-b{width:44%;aspect-ratio:1;left:15%;bottom:-28%;background:radial-gradient(circle,#a7c99512,transparent 70%)}
      .mf-contours{position:absolute;inset:4% -4% 0 22%;width:82%;height:96%;z-index:1;opacity:.44;overflow:visible;will-change:transform}.mf-contours path{fill:none;stroke:color-mix(in srgb,var(--mf-accent) 28%,transparent);stroke-width:1}.mf-contours path:nth-child(2n){stroke:color-mix(in srgb,var(--mf-text) 12%,transparent)}
      .mf-orbit{position:absolute;z-index:1;right:9%;top:13%;width:min(45vw,450px);aspect-ratio:1;border:1px solid color-mix(in srgb,var(--mf-accent) 34%,transparent);border-radius:50%;will-change:transform}.mf-orbit:before,.mf-orbit:after{content:"";position:absolute;inset:11%;border:1px solid color-mix(in srgb,var(--mf-text) 12%,transparent);border-radius:50%;transform:rotateX(68deg) rotateZ(-21deg)}.mf-orbit:after{inset:20%;transform:rotateX(68deg) rotateZ(24deg);border-color:color-mix(in srgb,var(--mf-accent) 17%,transparent)}.mf-orbit-b{right:18%;top:20%;width:min(31vw,316px);border-color:color-mix(in srgb,var(--mf-text) 17%,transparent)}
      .mf-copy{position:absolute;left:7.5%;top:18%;z-index:4;width:min(47%,540px)}.mf-eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 25px;color:var(--mf-accent);font-size:10px;font-weight:750;letter-spacing:.2em;text-transform:uppercase}.mf-eyebrow:before{content:"";width:24px;height:1px;background:currentColor}.mf-title{margin:0;max-width:590px;font-size:clamp(42px,7.2vw,92px);line-height:.94;letter-spacing:-.075em;font-weight:560;white-space:pre-line;text-wrap:balance}.mf-title span{color:var(--mf-accent)}.mf-subtitle{max-width:380px;margin:23px 0 0;color:var(--mf-muted);font-size:14px;line-height:1.7}.mf-meta{display:flex;align-items:center;gap:10px;margin-top:31px;color:color-mix(in srgb,var(--mf-text) 64%,transparent);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.mf-meta-dot{width:5px;height:5px;border-radius:50%;background:var(--mf-accent);box-shadow:0 0 14px var(--mf-accent)}
      .mf-art{position:absolute;right:9%;top:12%;z-index:3;width:min(41%,450px);height:76%;display:grid;place-items:center;transform-style:preserve-3d;will-change:transform}.mf-prism-shadow{position:absolute;width:58%;aspect-ratio:1;transform:translateY(15%) rotate(45deg);border-radius:28%;background:color-mix(in srgb,var(--mf-accent) 16%,transparent);filter:blur(38px)}.mf-prism{position:relative;width:61%;aspect-ratio:1;display:grid;place-items:center;transform:rotate(45deg);border:1px solid color-mix(in srgb,var(--mf-accent) 55%,transparent);border-radius:27%;background:linear-gradient(135deg,#ffffff12,#b8fa6712 48%,#ffffff04);box-shadow:inset 1px 1px #ffffff36,inset -18px -20px 45px #03090770,0 25px 80px #0008;backdrop-filter:blur(8px)}.mf-prism:before{content:"";position:absolute;inset:12%;border:1px solid color-mix(in srgb,var(--mf-text) 26%,transparent);border-radius:23%;background:linear-gradient(145deg,#ffffff12,transparent 45%,color-mix(in srgb,var(--mf-accent) 15%,transparent));}.mf-prism:after{content:"";position:absolute;inset:29%;border:1px solid color-mix(in srgb,var(--mf-accent) 72%,transparent);border-radius:50%;box-shadow:0 0 42px color-mix(in srgb,var(--mf-accent) 22%,transparent),inset 0 0 18px color-mix(in srgb,var(--mf-accent) 20%,transparent)}.mf-prism-core{position:relative;z-index:2;width:17%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 34% 28%,#f4ffd9 0%,var(--mf-accent) 43%,#426948 100%);box-shadow:0 0 18px color-mix(in srgb,var(--mf-accent) 86%,transparent),0 0 64px color-mix(in srgb,var(--mf-accent) 36%,transparent)}.mf-prism-line{position:absolute;inset:0;overflow:visible;width:100%;height:100%;transform:rotate(-45deg);pointer-events:none}.mf-prism-line path{fill:none;stroke:color-mix(in srgb,var(--mf-text) 52%,transparent);stroke-width:.7;vector-effect:non-scaling-stroke}
      .mf-chip{position:absolute;z-index:5;padding:9px 12px;border:1px solid color-mix(in srgb,var(--mf-accent) 32%,transparent);border-radius:999px;background:#0b1511cc;color:var(--mf-text);font-size:9px;letter-spacing:.12em;text-transform:uppercase;backdrop-filter:blur(10px);white-space:nowrap;will-change:transform}.mf-chip-a{right:3%;top:25%}.mf-chip-b{left:3%;bottom:24%;color:var(--mf-accent)}.mf-chip-c{right:10%;bottom:8%;opacity:.78}
      .mf-index{position:absolute;left:7.5%;bottom:8%;z-index:4;display:flex;align-items:center;gap:14px;color:var(--mf-muted);font-size:9px;letter-spacing:.17em;text-transform:uppercase}.mf-index-line{height:1px;width:52px;background:linear-gradient(90deg,var(--mf-accent),transparent)}.mf-index strong{color:var(--mf-text);font-weight:550}.mf-crosshair{position:absolute;right:6%;bottom:8%;z-index:2;width:36px;height:36px;border:1px solid color-mix(in srgb,var(--mf-accent) 35%,transparent);border-radius:50%;will-change:transform}.mf-crosshair:before,.mf-crosshair:after{content:"";position:absolute;left:50%;top:50%;background:color-mix(in srgb,var(--mf-accent) 55%,transparent);transform:translate(-50%,-50%)}.mf-crosshair:before{width:1px;height:50px}.mf-crosshair:after{height:1px;width:50px}
      @media(max-width:700px){.mf-stage{min-height:max(var(--mf-height,640px),690px)}.mf-copy{left:7%;right:7%;top:9%;width:auto}.mf-eyebrow{margin-bottom:18px}.mf-title{font-size:clamp(43px,12vw,68px);max-width:460px}.mf-subtitle{font-size:12px;margin-top:15px;max-width:320px}.mf-meta{margin-top:18px}.mf-art{right:9%;top:41%;width:78%;height:48%}.mf-orbit{right:4%;top:40%;width:min(74vw,360px)}.mf-orbit-b{right:16%;top:43%;width:min(50vw,240px)}.mf-contours{inset:32% -18% -3% 4%;width:120%;height:74%}.mf-chip-a{right:0;top:51%}.mf-chip-b{left:0;bottom:12%}.mf-chip-c{right:7%;bottom:2%}.mf-index{left:7%;bottom:5%}.mf-crosshair{right:6%;bottom:5%;width:26px;height:26px}}
      @media(max-width:400px){.mf-stage{min-height:max(var(--mf-height,640px),660px)}.mf-copy{top:8%}.mf-title{font-size:42px}.mf-art{top:42%;height:45%}.mf-chip{font-size:8px;padding:7px 9px}.mf-index{font-size:8px;gap:9px}.mf-index-line{width:30px}}
      @media(prefers-reduced-motion:reduce){.mf-root *, .mf-root *:before,.mf-root *:after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
    `

    const rootStyle = Object.assign(
        { ...style, minHeight: height },
        {
            "--mf-accent": accent,
            "--mf-bg": background,
            "--mf-text": textColor,
            "--mf-muted": mutedColor,
            "--mf-height": `${height}px`,
            "--mf-radius": `${cornerRadius}px`,
        }
    ) as React.CSSProperties
    const titleLines = String(title).split("\n")

    return (
        <div
            ref={rootRef}
            className="mf-root"
            style={rootStyle}
            aria-label="Momentum Field parallax effect"
        >
            <style>{styles}</style>
            <section
                className="mf-stage"
                aria-label="Momentum Field parallax scene"
            >
                <div
                    className="mf-grid"
                    data-depth="-0.18"
                    aria-hidden="true"
                />
                <div
                    className="mf-glow mf-glow-a"
                    data-depth="0.24"
                    aria-hidden="true"
                />
                <div
                    className="mf-glow mf-glow-b"
                    data-depth="-0.32"
                    aria-hidden="true"
                />
                <svg
                    className="mf-contours"
                    data-depth="0.32"
                    viewBox="0 0 1000 620"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path d="M300 20C470 130 100 170 320 270S690 360 480 460 300 540 580 620" />
                    <path d="M350 20C520 130 150 170 370 270S740 360 530 460 350 540 630 620" />
                    <path d="M400 20C570 130 200 170 420 270S790 360 580 460 400 540 680 620" />
                    <path d="M450 20C620 130 250 170 470 270S840 360 630 460 450 540 730 620" />
                    <path d="M500 20C670 130 300 170 520 270S890 360 680 460 500 540 780 620" />
                    <path d="M550 20C720 130 350 170 570 270S940 360 730 460 550 540 830 620" />
                    <path d="M600 20C770 130 400 170 620 270S990 360 780 460 600 540 880 620" />
                </svg>
                <div
                    className="mf-orbit"
                    data-depth="0.42"
                    data-rotate="28"
                    aria-hidden="true"
                />
                <div
                    className="mf-orbit mf-orbit-b"
                    data-depth="0.7"
                    data-rotate="-19"
                    aria-hidden="true"
                />

                <div className="mf-copy">
                    <p className="mf-eyebrow" data-depth="0.36">
                        {eyebrow}
                    </p>
                    <h2 className="mf-title" data-depth="0.58">
                        {titleLines.map((line, index) => (
                            <React.Fragment key={index}>
                                {index === titleLines.length - 1 ? (
                                    <span>{line}</span>
                                ) : (
                                    line
                                )}
                                {index < titleLines.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </h2>
                    <p className="mf-subtitle" data-depth="0.44">
                        {subtitle}
                    </p>
                    <div className="mf-meta" data-depth="0.82">
                        <span className="mf-meta-dot" />
                        SCROLL VELOCITY <span>/</span> SPRING RESPONSE
                    </div>
                </div>

                <div className="mf-art" data-depth="0.92" aria-hidden="true">
                    <div className="mf-prism-shadow" />
                    <div className="mf-prism">
                        <div className="mf-prism-core" data-depth="1.35" />
                        <svg
                            className="mf-prism-line"
                            viewBox="0 0 300 300"
                            aria-hidden="true"
                        >
                            <path d="M35 150 150 35l115 115-115 115L35 150Z" />
                            <path d="M75 150 150 75l75 75-75 75-75-75Z" />
                            <path d="M150 35v230M35 150h230" />
                        </svg>
                    </div>
                </div>

                <div className="mf-chip mf-chip-a" data-depth="1.2">
                    01 — inertia
                </div>
                <div className="mf-chip mf-chip-b" data-depth="1.55">
                    depth / 03
                </div>
                <div className="mf-chip mf-chip-c" data-depth="-0.78">
                    ease into stillness
                </div>
                <div
                    className="mf-crosshair"
                    data-depth="1.9"
                    aria-hidden="true"
                />
                <div className="mf-index">
                    <strong>{footerLabel}</strong>
                    <span className="mf-index-line" />
                    <span>001 / 003</span>
                </div>
            </section>
        </div>
    )
}

MomentumField.defaultProps = {
    eyebrow: "MOMENTUM FIELD / 001",
    title: "Depth, in\nmotion.",
    subtitle:
        "A scroll effect that carries its own inertia. Move through the page and watch each layer settle at a different pace.",
    footerLabel: "SCROLL TO FEEL THE AFTERGLOW",
    accent: "#B8FA67",
    background: "#09140F",
    textColor: "#EEF3E9",
    mutedColor: "#9FB2A4",
    height: 640,
    intensity: 1,
    damping: 0.1,
    pointerTilt: true,
    cornerRadius: 0,
}

addPropertyControls(MomentumField, {
    eyebrow: { type: ControlType.String, title: "Eyebrow" },
    title: { type: ControlType.String, title: "Title", displayTextArea: true },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        displayTextArea: true,
    },
    footerLabel: { type: ControlType.String, title: "Footer label" },
    accent: { type: ControlType.Color, title: "Accent" },
    background: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text" },
    mutedColor: { type: ControlType.Color, title: "Muted" },
    height: {
        type: ControlType.Number,
        title: "Min Height",
        min: 420,
        max: 900,
        step: 10,
        unit: "px",
    },
    intensity: {
        type: ControlType.Number,
        title: "Depth",
        min: 0,
        max: 1.8,
        step: 0.1,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 0.04,
        max: 0.22,
        step: 0.01,
    },
    pointerTilt: {
        type: ControlType.Boolean,
        title: "Cursor Tilt",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        step: 2,
        unit: "px",
    },
})
