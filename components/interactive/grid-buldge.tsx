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


const defaults = {
    radius: 150,
    spacing: 26,
    pixelSize: 3,
    growth: 4.4,
    baseColor: "rgba(19,19,22,0.15)",
    color1: "#7CC4F2",
    color2: "#8EDB94",
    color3: "#F2C230",
    color4: "#D39BF0",
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function PixelBloom(
    props: Partial<typeof defaults> & {
        style?: React.CSSProperties
    }
) {
    const p = { ...defaults, ...props }
    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const isStatic = useIsStaticRenderer()
    const patternId = React.useId()

    React.useEffect(() => {
        if (isStatic) return

        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const context = canvas.getContext("2d")
        if (!context) return
        const ctx = context

        let width = 0
        let height = 0
        let raf = 0
        let active = false

        let mx = 0
        let my = 0
        let sx = 0
        let sy = 0

        const colors = [p.color1, p.color2, p.color3, p.color4]

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches

        function kick() {
            if (!raf) raf = requestAnimationFrame(draw)
        }

        function draw() {
            raf = 0
            if (width <= 0 || height <= 0) return

            if (active) {
                sx += (mx - sx) * 0.18
                sy += (my - sy) * 0.18
            }

            ctx.clearRect(0, 0, width, height)

            // Scale the grid on narrow containers.
            const scale = Math.max(0.65, Math.min(1, width / 600))

            const gap = Math.max(8, p.spacing * scale)
            const pixel = p.pixelSize * scale
            const growth = p.growth * scale
            const radius = Math.max(1, p.radius * scale)

            for (let y = gap / 2 + 0.5; y < height + gap; y += gap) {
                for (let x = gap / 2 + 0.5; x < width + gap; x += gap) {
                    const dx = x - sx
                    const dy = y - sy

                    const k =
                        active && !reduced
                            ? Math.max(0, 1 - Math.hypot(dx, dy) / radius)
                            : 0

                    const half = pixel / 2 + (k * k * growth) / 2

                    ctx.globalAlpha = 1
                    ctx.fillStyle = p.baseColor
                    ctx.fillRect(x - half, y - half, half * 2, half * 2)

                    if (k > 0.02) {
                        const quadrant =
                            Math.floor(
                                (Math.atan2(dy, dx) + Math.PI) / (Math.PI / 2)
                            ) % 4

                        ctx.clearRect(x - half, y - half, half * 2, half * 2)

                        ctx.fillStyle = colors[quadrant]
                        ctx.globalAlpha = 0.42 + k * 0.5

                        ctx.fillRect(x - half, y - half, half * 2, half * 2)
                    }
                }
            }

            ctx.globalAlpha = 1

            if (active && Math.abs(mx - sx) + Math.abs(my - sy) > 0.5) {
                kick()
            }
        }

        function resize() {
            const rect = container.getBoundingClientRect()

            const nextWidth = Math.max(0, rect.width)
            const nextHeight = Math.max(0, rect.height)

            const dpr = Math.min(2, window.devicePixelRatio || 1)

            width = nextWidth
            height = nextHeight

            const pixelWidth = Math.round(width * dpr)
            const pixelHeight = Math.round(height * dpr)

            if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
                canvas.width = pixelWidth
                canvas.height = pixelHeight
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            kick()
        }

        function deactivate() {
            if (!active) return
            active = false
            kick()
        }

        function move(e: PointerEvent) {
            const rect = container.getBoundingClientRect()

            const inside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom

            if (!inside || rect.width <= 0 || rect.height <= 0) {
                deactivate()
                return
            }

            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            // Prevent the first frame jumping from
            // a distant offscreen position.
            if (!active) {
                sx = x
                sy = y
            }

            active = true
            mx = x
            my = y
            kick()
        }

        function pointerEnd(e: PointerEvent) {
            if (e.pointerType === "touch") {
                deactivate()
            }
        }

        const observer = new ResizeObserver(resize)
        observer.observe(container)

        if (!reduced) {
            // Global tracking works over hero text
            // without blocking links or buttons.
            window.addEventListener("pointermove", move, {
                passive: true,
            })
            window.addEventListener("pointerdown", move, {
                passive: true,
            })
            window.addEventListener("pointerup", pointerEnd)
            window.addEventListener("pointercancel", pointerEnd)
            window.addEventListener("blur", deactivate)
            document.addEventListener("mouseleave", deactivate)
        }

        window.addEventListener("resize", resize)
        resize()

        return () => {
            observer.disconnect()

            if (raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }

            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerdown", move)
            window.removeEventListener("pointerup", pointerEnd)
            window.removeEventListener("pointercancel", pointerEnd)
            window.removeEventListener("blur", deactivate)
            document.removeEventListener("mouseleave", deactivate)
            window.removeEventListener("resize", resize)
        }
    }, [
        isStatic,
        p.radius,
        p.spacing,
        p.pixelSize,
        p.growth,
        p.baseColor,
        p.color1,
        p.color2,
        p.color3,
        p.color4,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                ...props.style,
            }}
        >
            {isStatic ? (
                <svg
                    aria-hidden="true"
                    width="100%"
                    height="100%"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                >
                    <defs>
                        <pattern
                            id={patternId}
                            width={Math.max(8, p.spacing)}
                            height={Math.max(8, p.spacing)}
                            patternUnits="userSpaceOnUse"
                        >
                            <rect
                                x={(Math.max(8, p.spacing) - p.pixelSize) / 2}
                                y={(Math.max(8, p.spacing) - p.pixelSize) / 2}
                                width={p.pixelSize}
                                height={p.pixelSize}
                                fill={p.baseColor}
                            />
                        </pattern>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill={`url(#${patternId})`}
                    />
                </svg>
            ) : (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "block",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

PixelBloom.defaultProps = defaults

addPropertyControls(PixelBloom, {
    radius: {
        type: ControlType.Number,
        title: "Bulge Radius",
        min: 30,
        max: 500,
        step: 5,
        unit: "px",
        defaultValue: 150,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        min: 8,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 26,
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        min: 1,
        max: 12,
        step: 0.5,
        unit: "px",
        defaultValue: 3,
    },
    growth: {
        type: ControlType.Number,
        title: "Size Growth",
        min: 0,
        max: 20,
        step: 0.2,
        unit: "px",
        defaultValue: 4.4,
    },
    baseColor: {
        type: ControlType.Color,
        title: "Resting Color",
        defaultValue: defaults.baseColor,
    },
    color1: {
        type: ControlType.Color,
        title: "Upper Left",
        defaultValue: defaults.color1,
    },
    color2: {
        type: ControlType.Color,
        title: "Upper Right",
        defaultValue: defaults.color2,
    },
    color3: {
        type: ControlType.Color,
        title: "Lower Right",
        defaultValue: defaults.color3,
    },
    color4: {
        type: ControlType.Color,
        title: "Lower Left",
        defaultValue: defaults.color4,
    },
})
