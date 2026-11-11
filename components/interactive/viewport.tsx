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

interface Props {
    url: string
    projectName: string
    initialDevice: string
    desktopWidth: number
    tabletWidth: number
    mobileWidth: number
    previewHeight: number
    minWidth: number
    maxWidth: number
    showHeader: boolean
    background: string
    accent: string
    radius: number
    canvasPoster?: { src: string; srcSet?: string; alt?: string }
    font: React.CSSProperties
    style?: React.CSSProperties
}
const limit = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const css = `
.vp-root{position:relative;container-type:inline-size;box-sizing:border-box;width:100%;min-width:0;min-height:240px;display:flex;flex-direction:column;gap:12px;padding:14px;border-radius:20px;overflow:hidden;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}.vp-root *{box-sizing:border-box}.vp-root button,.vp-root input,.vp-root select{font:inherit}.vp-root button,.vp-root select{cursor:pointer}.vp-root :is(button,input,select,a):focus-visible{outline:2px solid var(--vp-accent);outline-offset:3px}.vp-icon{width:15px;height:15px;display:block}.vc-bar{display:flex;gap:8px;align-items:center;flex-shrink:0;min-height:34px}.vc-name{font-size:14px;font-weight:600;letter-spacing:-.025em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:0;margin-right:auto}.vc-select{appearance:none;-webkit-appearance:none;padding-right:34px!important;padding-left:12px!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='m3 4.5 3 3 3-3' fill='none' stroke='%23626269' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-size:12px 12px;font-size:13px!important;border:0;border-radius:9px;background-color:#fff;color:inherit;padding:8px 10px;max-width:132px;min-height:34px}.vp-link{color:inherit;text-decoration:none;display:grid;place-items:center}.vc-open{width:28px;min-height:34px;flex-shrink:0}.vp-reload{border:0;background:transparent;color:#626269;width:28px;height:34px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}.vp-reload:hover,.vc-open:hover{background:#e5e5ea}.vp-stage{position:relative;display:flex;justify-content:center;align-items:center;flex:1;min-width:0;min-height:100px;padding:16px 22px;border-radius:12px;background:#ebebef;overflow:hidden;isolation:isolate}.vp-window{position:relative;flex-shrink:0;background:white;border-radius:var(--vp-radius);max-width:none;transition:width .22s ease,height .22s ease}.vp-screen{position:relative;overflow:hidden;border-radius:inherit;background:#fff}.vp-frame{display:block;border:0;background:white;transform-origin:top left;max-width:none!important;transition:transform .22s ease}.vp-drag-cover{position:absolute;inset:0;z-index:3;cursor:ew-resize;display:none}.vp-root[data-dragging=true] .vp-drag-cover{display:block}.vp-root[data-dragging=true] :is(.vp-window,.vp-frame){transition:none}.vp-handle{position:absolute;top:0;bottom:0;width:22px;background:transparent;border:0;touch-action:none;cursor:ew-resize;display:grid;place-items:center;padding:0;z-index:4}.vp-handle[data-side=right]{right:-22px}.vp-handle[data-side=left]{left:-22px}.vp-handle:before{content:"";width:4px;height:28px;border-radius:99px;background:#b6b6c1}.vp-handle:hover:before{background:var(--vp-accent)}.vp-bottom{display:flex;align-items:center;gap:10px;min-height:24px;flex-shrink:0}.vp-range{accent-color:var(--vp-accent);width:100%;min-width:40px;max-width:160px;margin:0;height:20px;cursor:ew-resize}.vc-value{font-size:11px;color:#676770;font-variant-numeric:tabular-nums;white-space:nowrap;margin-left:auto}.vc-help{font-size:12px;color:inherit;text-decoration:none;background:#e5e5ea;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}.vp-editor{height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;padding:16px;text-align:center;color:#626269}.vp-editor strong{font-size:18px;letter-spacing:-.025em;color:#1d1d1f}.vp-editor p{font-size:13px;line-height:1.5;margin:0}.vp-poster{width:100%;height:100%;object-fit:cover;object-position:top;display:block}.vp-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.vp-invalid{padding:16px;margin:auto;font-size:14px;line-height:1.5}@container(max-width:340px){.vc-name{font-size:12px}.vc-bar{gap:3px}.vc-select{max-width:110px;padding:7px}.vc-value{font-size:10px}.vp-range{max-width:110px}}@media(prefers-reduced-motion:reduce){.vp-root *{transition:none!important}}
`
function Icon({ kind }: { kind: string }) {
    return (
        <svg
            className="vp-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {kind === "reload" ? (
                <path d="M4 10a8 8 0 1 1 .8 6M4 4v6h6" />
            ) : (
                <>
                    <path d="M14 3h7v7M21 3 10 14" />
                    <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
                </>
            )}
        </svg>
    )
}
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 420
 */
export default function Viewport(props: Partial<Props>) {
    const {
        url = "https://brandplayground.framer.website/",
        projectName = "Viewport",
        initialDevice = "desktop",
        desktopWidth = 1440,
        tabletWidth = 810,
        mobileWidth = 390,
        previewHeight = 820,
        minWidth = 320,
        maxWidth = 1440,
        showHeader = true,
        background = "#f5f5f7",
        accent = "#0071e3",
        radius = 14,
        canvasPoster,
        font = {},
        style,
    } = props
    const lower = limit(Number(minWidth) || 320, 240, 1600),
        upper = limit(Number(maxWidth) || 1440, lower, 2560),
        heights = limit(Number(previewHeight) || 820, 320, 1600)
    const presetWidths = {
        desktop: limit(Number(desktopWidth) || 1440, lower, upper),
        tablet: limit(Number(tabletWidth) || 810, lower, upper),
        mobile: limit(Number(mobileWidth) || 390, lower, upper),
    }
    const [width, setWidth] = React.useState(presetWidths.desktop),
        [stageWidth, setStageWidth] = React.useState(0),
        [stageHeightAvailable, setStageHeightAvailable] = React.useState(0),
        [dragging, setDragging] = React.useState(false),
        [reload, setReload] = React.useState(0)
    const stage = React.useRef<HTMLDivElement>(null),
        drag = React.useRef<{
            id: number
            x: number
            value: number
            scale: number
            side: number
        } | null>(null),
        initialApplied = React.useRef(false),
        initialSignature = React.useRef(""),
        frame = React.useRef<number | null>(null),
        nextWidth = React.useRef(width)
    const isStatic = useIsStaticRenderer()
    let target = "",
        valid = false
    try {
        const parsed = new URL(url)
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
            target = parsed.href
            valid = true
        }
    } catch {}
    React.useEffect(() => {
        const element = stage.current
        if (!element) return
        const observer = new ResizeObserver((entries) => {
            setStageWidth(entries[0].contentRect.width)
            setStageHeightAvailable(entries[0].contentRect.height)
        })
        observer.observe(element)
        return () => {
            observer.disconnect()
            if (frame.current !== null) cancelAnimationFrame(frame.current)
        }
    }, [valid])
    React.useEffect(() => {
        const signature = [
            initialDevice,
            presetWidths.desktop,
            presetWidths.tablet,
            presetWidths.mobile,
        ].join(":")
        if (signature !== initialSignature.current) {
            initialApplied.current = false
            initialSignature.current = signature
        }
        if (stageWidth <= 0 || initialApplied.current) return
        const device =
            initialDevice === "auto"
                ? stageWidth < 600
                    ? "mobile"
                    : stageWidth < 1000
                      ? "tablet"
                      : "desktop"
                : initialDevice
        setWidth(
            presetWidths[device as keyof typeof presetWidths] ??
                presetWidths.desktop
        )
        initialApplied.current = true
    }, [
        stageWidth,
        initialDevice,
        presetWidths.desktop,
        presetWidths.tablet,
        presetWidths.mobile,
    ])
    React.useEffect(
        () => setWidth((value) => limit(value, lower, upper)),
        [lower, upper]
    )
    const actualWidth = Math.round(limit(width, lower, upper)),
        scale = Math.max(
            0.01,
            Math.min(
                1,
                (stageWidth || 480) / actualWidth,
                (stageHeightAvailable || 280) / heights
            )
        ),
        displayWidth = Math.max(1, actualWidth * scale),
        screenHeight = Math.round(heights * scale),
        custom = !Object.values(presetWidths).includes(actualWidth)
    const updateWidth = (value: number) => {
        nextWidth.current = limit(value, lower, upper)
        if (frame.current !== null) return
        frame.current = requestAnimationFrame(() => {
            setWidth(nextWidth.current)
            frame.current = null
        })
    }
    const finish = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (drag.current?.id !== event.pointerId) return
        drag.current = null
        setDragging(false)
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const handleKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        const delta = event.shiftKey ? 50 : 10
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault()
            setWidth((value) =>
                limit(
                    value + (event.key === "ArrowRight" ? delta : -delta),
                    lower,
                    upper
                )
            )
        } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault()
            setWidth(event.key === "Home" ? lower : upper)
        }
    }
    return (
        <div
            className="vp-root"
            data-dragging={dragging}
            style={
                {
                    height: 420,
                    background,
                    ...font,
                    ...style,
                    "--vp-accent": accent,
                    "--vp-radius": limit(Number(radius) || 0, 0, 32) + "px",
                } as React.CSSProperties
            }
        >
            <style>{css}</style>
            <header className="vc-bar">
                {showHeader ? (
                    <span className="vc-name" title={projectName}>
                        {projectName}
                    </span>
                ) : (
                    <span className="vc-name" />
                )}
                <select
                    className="vc-select"
                    aria-label="Preview device"
                    value={
                        custom
                            ? "custom"
                            : Object.keys(presetWidths).find(
                                  (device) =>
                                      presetWidths[
                                          device as keyof typeof presetWidths
                                      ] === actualWidth
                              )
                    }
                    onChange={(event) => {
                        const value =
                            presetWidths[
                                event.target.value as keyof typeof presetWidths
                            ]
                        if (value) setWidth(value)
                    }}
                >
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                    <option value="mobile">Mobile</option>
                    {custom && <option value="custom">Custom</option>}
                </select>
                <button
                    type="button"
                    className="vp-reload"
                    aria-label="Reload embedded site"
                    onClick={() => setReload((value) => value + 1)}
                >
                    <Icon kind="reload" />
                </button>
                {valid && (
                    <a
                        className="vp-link vc-open"
                        href={target}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open live site"
                    >
                        <Icon kind="external" />
                    </a>
                )}
            </header>
            {!valid ? (
                <div className="vp-invalid">
                    Add a complete website URL starting with https:// in the
                    component properties.
                </div>
            ) : (
                <>
                    <div className="vp-stage" ref={stage}>
                        <div
                            className="vp-window"
                            style={{
                                width: displayWidth,
                                height: screenHeight,
                            }}
                        >
                            <div
                                className="vp-screen"
                                style={{ height: screenHeight }}
                            >
                                {isStatic ? (
                                    <div className="vp-editor">
                                        {canvasPoster?.src ? (
                                            <img
                                                className="vp-poster"
                                                src={canvasPoster.src}
                                                srcSet={canvasPoster.srcSet}
                                                alt={
                                                    canvasPoster.alt ||
                                                    "Website preview"
                                                }
                                            />
                                        ) : (
                                            <>
                                                <strong>{projectName}</strong>
                                                <p>Live website in Preview</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <iframe
                                        key={target + reload}
                                        className="vp-frame"
                                        src={target}
                                        title={
                                            projectName +
                                            " live website preview"
                                        }
                                        width={actualWidth}
                                        height={heights}
                                        style={{
                                            width: actualWidth,
                                            height: heights,
                                            transform: "scale(" + scale + ")",
                                        }}
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        loading="lazy"
                                    />
                                )}
                                <div
                                    className="vp-drag-cover"
                                    aria-hidden="true"
                                />
                            </div>
                            {["left", "right"].map((side) => (
                                <button
                                    key={side}
                                    className="vp-handle"
                                    type="button"
                                    data-side={side}
                                    role="slider"
                                    aria-label={
                                        "Resize preview from " + side + " edge"
                                    }
                                    aria-valuemin={lower}
                                    aria-valuemax={upper}
                                    aria-valuenow={actualWidth}
                                    aria-valuetext={
                                        actualWidth + " pixels wide"
                                    }
                                    aria-orientation="horizontal"
                                    onKeyDown={handleKey}
                                    onPointerDown={(event) => {
                                        if (event.button !== 0) return
                                        drag.current = {
                                            id: event.pointerId,
                                            x: event.clientX,
                                            value: actualWidth,
                                            scale,
                                            side: side === "right" ? 1 : -1,
                                        }
                                        event.currentTarget.setPointerCapture(
                                            event.pointerId
                                        )
                                        setDragging(true)
                                    }}
                                    onPointerMove={(event) => {
                                        const d = drag.current
                                        if (d?.id === event.pointerId)
                                            updateWidth(
                                                d.value +
                                                    ((event.clientX - d.x) *
                                                        2 *
                                                        d.side) /
                                                        d.scale
                                            )
                                    }}
                                    onPointerUp={finish}
                                    onPointerCancel={finish}
                                    onLostPointerCapture={() => {
                                        drag.current = null
                                        setDragging(false)
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="vp-bottom">
                        <input
                            className="vp-range"
                            aria-label="Preview width"
                            type="range"
                            min={lower}
                            max={upper}
                            step="1"
                            value={actualWidth}
                            onChange={(event) =>
                                setWidth(Number(event.target.value))
                            }
                        />
                        <span className="vc-value">
                            {actualWidth} × {heights} ·{" "}
                            {Math.round(scale * 100)}%
                        </span>
                        <a
                            className="vc-help"
                            href={target}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Preview blocked? Open the live site"
                            title="Some websites block embedded previews. Open the live site."
                        >
                            ?
                        </a>
                    </div>
                    <span className="vp-live" aria-live="polite" role="status">
                        {dragging
                            ? "Resizing preview"
                            : actualWidth + " pixels wide"}
                    </span>
                </>
            )}
        </div>
    )
}
addPropertyControls(Viewport, {
    url: {
        type: ControlType.String,
        title: "Website URL",
        defaultValue: "https://brandplayground.framer.website/",
        description:
            "Use a published website that allows embedding. Some sites block iframe previews.",
    },
    projectName: {
        type: ControlType.String,
        title: "Project name",
        defaultValue: "Viewport",
    },
    initialDevice: {
        type: ControlType.Enum,
        title: "Start view",
        options: ["auto", "desktop", "tablet", "mobile"],
        optionTitles: ["Auto", "Desktop", "Tablet", "Mobile"],
        defaultValue: "desktop",
    },
    desktopWidth: {
        type: ControlType.Number,
        title: "Desktop width",
        min: 320,
        max: 2560,
        defaultValue: 1440,
        step: 10,
        unit: "px",
    },
    tabletWidth: {
        type: ControlType.Number,
        title: "Tablet width",
        min: 320,
        max: 1600,
        defaultValue: 810,
        step: 10,
        unit: "px",
    },
    mobileWidth: {
        type: ControlType.Number,
        title: "Mobile width",
        min: 240,
        max: 800,
        defaultValue: 390,
        step: 1,
        unit: "px",
    },
    previewHeight: {
        type: ControlType.Number,
        title: "Site height",
        min: 320,
        max: 1600,
        defaultValue: 820,
        step: 10,
        unit: "px",
    },
    minWidth: {
        type: ControlType.Number,
        title: "Min width",
        min: 240,
        max: 1600,
        defaultValue: 320,
        step: 10,
        unit: "px",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max width",
        min: 320,
        max: 2560,
        defaultValue: 1440,
        step: 10,
        unit: "px",
    },
    canvasPoster: {
        type: ControlType.ResponsiveImage,
        title: "Canvas poster",
        description:
            "Optional screenshot for the editor. The live site appears in Preview and on the published page.",
    },
    showHeader: {
        type: ControlType.Boolean,
        title: "Project title",
        defaultValue: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f5f5f7",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0071e3",
    },
    radius: {
        type: ControlType.Number,
        title: "Window radius",
        min: 0,
        max: 32,
        defaultValue: 14,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
