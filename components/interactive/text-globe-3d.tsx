import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type NativeFont = React.CSSProperties & { variant?: string }
type Geometry = { scale: number; density: number; depth: number }
type Motion = {
    autoRotate: boolean
    speed: number
    dragRotate: boolean
    cursorSteer: boolean
}
type Appearance = {
    textColor: string
    background: string
    transparent: boolean
    depthSoftness: number
}
type Props = {
    words?: string
    font?: NativeFont
    geometry?: Partial<Geometry>
    motion?: Partial<Motion>
    appearance?: Partial<Appearance>
    livePreview?: boolean
    editorPreview?: boolean
    style?: React.CSSProperties
    id?: string
    className?: string
}
type Vector = { x: number; y: number; z: number }
type Label = {
    text: string
    position: Vector
    width: number
    element: HTMLSpanElement | null
    order: number
    opacity: number
}
const nativeFont: NativeFont = {
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: "28px",
    fontWeight: 400,
    fontStyle: "normal",
    lineHeight: "1em",
    letterSpacing: "-0.035em",
}
const referenceWords =
    "SUNDAY\nGHOST\nDRIFT\nPING\nPRAYER\nWEATHER\nSEED\nLOOP\nRELAY\nCACHE\nGOODNIGHT\nRECEIPT\nSILENCE\nSIGNAL\nORBIT\nROOT\nNULL\nBOOT\nECHO\nMIRROR\nARGUMENT\nBIRTHDAY\nHOMESICK\nSTATIC\nBACKUP\nQINNNNN"
const defaults = {
    words: referenceWords,
    font: nativeFont,
    livePreview: true,
    geometry: { scale: 82, density: 100, depth: 75 } as Geometry,
    motion: {
        autoRotate: true,
        speed: 32,
        dragRotate: true,
        cursorSteer: true,
    } as Motion,
    appearance: {
        textColor: "#FFFFFF",
        background: "#000EFF",
        transparent: false,
        depthSoftness: 55,
    } as Appearance,
}
const TAU = Math.PI * 2
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const numeric = (v: unknown, d: number, a: number, b: number) =>
    typeof v === "number" && Number.isFinite(v) ? clamp(v, a, b) : d
const radians = (v: number) => (v * Math.PI) / 180
const wrap = (v: number) => ((((v + Math.PI) % TAU) + TAU) % TAU) - Math.PI
function settings(p: Record<string, any>) {
    return {
        words:
            typeof p.words === "string"
                ? p.words.slice(0, 12000)
                : referenceWords,
        scale: numeric(p.scale, 82, 30, 105),
        density: numeric(p.density, 100, 45, 160),
        depth: numeric(p.depth, 75, 0, 100),
        autoRotate: p.autoRotate ?? true,
        speed: numeric(p.speed, 32, -90, 90),
        dragRotate: p.dragRotate ?? true,
        cursorSteer: p.cursorSteer ?? true,
        textColor: typeof p.textColor === "string" ? p.textColor : "#FFFFFF",
        background: typeof p.background === "string" ? p.background : "#000EFF",
        transparent: p.transparent ?? false,
        depthSoftness: numeric(p.depthSoftness, 55, 0, 100),
    }
}
function parseWords(text: string) {
    const lines = text
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    return (lines.length === 1 ? lines[0].split(/\s+/) : lines)
        .map((s) => Array.from(s).slice(0, 40).join(""))
        .slice(0, 100)
}
function hash(a: number, b: number) {
    const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
    return n - Math.floor(n)
}
function rotated(p: Vector, pitch: number, yaw: number): Vector {
    const cy = Math.cos(yaw),
        sy = Math.sin(yaw),
        cp = Math.cos(pitch),
        sp = Math.sin(pitch)
    const x = p.x * cy + p.z * sy,
        z = p.z * cy - p.x * sy
    return { x, y: p.y * cp - z * sp, z: p.y * sp + z * cp }
}
function project(p: Vector, radius: number, depth: number) {
    const d = depth / 100
    const front = Math.max(0, p.z),
        edge = 0.65 - 0.35 * d,
        size = edge + (1 - edge) * Math.pow(front, 0.65)
    const visible = clamp((p.z + 0.035) / 0.12, 0, 1)
    const rear = 0.32 * clamp((-p.z - 0.04) / 0.35, 0, 1)
    return {
        x: p.x * radius,
        y: -p.y * radius * 0.94,
        scale: size,
        opacity:
            p.z < -0.035 ? rear : visible * (0.66 + 0.34 * Math.sqrt(front)),
        z: p.z,
    }
}
function buildLabels(
    words: string[],
    fontSize: number,
    density: number,
    measure: (text: string) => number
): Label[] {
    if (!words.length) return []
    // Layout lives in a 720px reference space. Resizing only scales this space.
    const radius = 295,
        average =
            words.reduce((sum, word) => sum + measure(word), 0) / words.length
    const rows = Math.round(
            clamp((((25 * density) / 100) * 28) / fontSize, 8, 42)
        ),
        labels: Label[] = []
    for (let row = 0; row < rows; row++) {
        const y = ((row + 0.5) / rows - 0.5) * 2,
            ring = Math.sqrt(Math.max(0, 1 - y * y))
        const count = Math.round(
            clamp(
                (TAU * radius * ring) /
                    Math.max(fontSize * 1.7, average + fontSize * 0.7),
                3,
                Math.min(25, Math.floor(440 / rows))
            )
        )
        const phase = row * 2.39996323
        for (let col = 0; col < count && labels.length < 440; col++) {
            const theta = ((col + 0.18 * hash(row, 7)) / count) * TAU + phase
            const index =
                    (row * 7 + col * 11 + Math.floor(hash(row, col) * 13)) %
                    words.length,
                text = words[index]
            labels.push({
                text,
                position: {
                    x: ring * Math.sin(theta),
                    y,
                    z: ring * Math.cos(theta),
                },
                width: measure(text),
                element: null,
                order: labels.length,
                opacity: NaN,
            })
        }
    }
    return labels
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 720
 * @framerDisableUnlink
 */
export default function WordSphere(incomingProps: Props) {
    const props = {
        ...incomingProps,
        ...(incomingProps.geometry || {}),
        ...(incomingProps.motion || {}),
        ...(incomingProps.appearance || {}),
    }
    const isStatic = useIsStaticRenderer()
    const shouldAnimate =
        !isStatic && (props.editorPreview ?? props.livePreview ?? true)
    const config = settings(props),
        latest = useRef({ ...config, shouldAnimate })
    latest.current = { ...config, shouldAnimate }
    const font = { ...nativeFont, ...(props.font || {}) },
        fontKey = JSON.stringify(font)
    const mountRef = useRef<HTMLDivElement>(null),
        layerRef = useRef<HTMLDivElement>(null),
        probeRef = useRef<HTMLSpanElement>(null),
        emptyRef = useRef<HTMLDivElement>(null)
    const controller = useRef<{ update: () => void } | null>(null),
        isIntersecting = useRef(true)
    useEffect(() => {
        const container = mountRef.current,
            layer = layerRef.current,
            probe = probeRef.current
        if (!container || !layer || !probe) return
        let disposed = false,
            frameId = 0,
            previous = 0,
            width = 720,
            height = 720,
            layoutKey = "",
            labels: Label[] = []
        let resizeObserver: ResizeObserver | null = null,
            intersectionObserver: IntersectionObserver | null = null
        let pitch = radians(0),
            yaw = radians(12),
            targetPitch = pitch,
            targetYaw = yaw,
            velocityX = 0,
            velocityY = 0
        let steerX = 0,
            steerY = 0,
            steerTargetX = 0,
            steerTargetY = 0,
            hovering = false,
            pressed = false,
            pointerId = -1,
            lastX = 0,
            lastY = 0,
            lastMove = 0
        let dragging = false,
            pressX = 0,
            pressY = 0,
            referenceFontSize = 28
        const removers: (() => void)[] = [],
            reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
        const canvas = document.createElement("canvas"),
            context = canvas.getContext("2d")
        const backLayer = document.createElement("div"),
            frontLayer = document.createElement("div")
        backLayer.style.cssText =
            "position:absolute;inset:0;pointer-events:none;z-index:0;"
        frontLayer.style.cssText =
            "position:absolute;inset:0;pointer-events:none;z-index:1;"
        const active = () =>
            !disposed && isIntersecting.current && !document.hidden
        const animate = () => latest.current.shouldAnimate && !reduced.matches
        const listen = (
            target: EventTarget,
            name: string,
            fn: EventListener,
            options?: AddEventListenerOptions
        ) => {
            target.addEventListener(name, fn, options)
            removers.push(() => target.removeEventListener(name, fn, options))
        }
        function stop() {
            if (frameId) cancelAnimationFrame(frameId)
            frameId = 0
            previous = 0
        }
        function rebuild() {
            const c = latest.current,
                css = getComputedStyle(probe!)
            referenceFontSize = clamp(parseFloat(css.fontSize) || 28, 6, 200)
            const key = JSON.stringify([
                c.words,
                c.density,
                css.fontFamily,
                css.fontWeight,
                css.fontStyle,
                css.fontSize,
                css.fontStretch,
                css.letterSpacing,
                css.fontVariationSettings,
                css.fontFeatureSettings,
                css.textTransform,
            ])
            if (layoutKey === key) return
            layoutKey = key
            if (context) {
                context.font = `${css.fontStyle || "normal"} ${css.fontWeight || "400"} ${referenceFontSize}px ${css.fontFamily || "serif"}`
                context.fontKerning = "normal"
            }
            const spacing = parseFloat(css.letterSpacing) || 0
            const transform = (text: string) =>
                css.textTransform === "uppercase"
                    ? text.toLocaleUpperCase()
                    : css.textTransform === "lowercase"
                      ? text.toLocaleLowerCase()
                      : text
            const measure = (text: string) => {
                const rendered = transform(text)
                return Math.max(
                    1,
                    (context?.measureText(rendered).width ??
                        rendered.length * referenceFontSize * 0.55) +
                        Math.max(0, Array.from(rendered).length - 1) * spacing
                )
            }
            labels = buildLabels(
                parseWords(c.words),
                referenceFontSize,
                c.density,
                measure
            )
            backLayer.replaceChildren()
            frontLayer.replaceChildren()
            layer!.replaceChildren(backLayer, frontLayer)
            const fragment = document.createDocumentFragment()
            for (const label of labels) {
                const element = document.createElement("span")
                element.textContent = label.text
                element.setAttribute("aria-hidden", "true")
                element.style.cssText =
                    "position:absolute;left:50%;top:50%;display:block;white-space:pre;pointer-events:none;transform-origin:center center;backface-visibility:hidden;"
                label.element = element
                fragment.appendChild(element)
            }
            frontLayer.appendChild(fragment)
            if (emptyRef.current)
                emptyRef.current.style.display = labels.length ? "none" : "grid"
            container!.dataset.wordCount = String(labels.length)
        }
        function frame(now = performance.now()) {
            frameId = 0
            if (!active()) return
            const c = latest.current,
                animated = animate(),
                dt = previous
                    ? Math.min(0.05, Math.max(0, (now - previous) / 1000))
                    : 1 / 60
            previous = now
            if (animated && !pressed) {
                const decay = Math.exp(-5.4 * dt),
                    integral = (1 - decay) / 5.4
                targetYaw += velocityY * integral
                targetPitch += velocityX * integral
                velocityY *= decay
                velocityX *= decay
                if (c.autoRotate)
                    targetYaw += radians(c.speed) * dt * (hovering ? 0.48 : 1)
            } else if (!animated) {
                velocityX = velocityY = 0
            }
            targetPitch = clamp(targetPitch, -Math.PI * 0.49, Math.PI * 0.49)
            const follow = animated
                ? 1 - Math.exp(-(pressed ? 24 : 10) * dt)
                : 1
            pitch += (targetPitch - pitch) * follow
            yaw += (targetYaw - yaw) * follow
            const sx = c.cursorSteer && hovering && !pressed ? steerTargetX : 0,
                sy = c.cursorSteer && hovering && !pressed ? steerTargetY : 0
            steerX += (sx - steerX) * follow
            steerY += (sy - steerY) * follow
            const radius = (Math.min(width, height) * c.scale) / 200,
                responsive = radius / 295
            const projected = labels
                .map((label) => {
                    const p = rotated(
                        label.position,
                        pitch + steerX,
                        yaw + steerY
                    )
                    return { label, p, out: project(p, radius, c.depth) }
                })
                .sort((a, b) => b.p.z - a.p.z)
            const occupied: {
                l: number
                r: number
                t: number
                b: number
                w: number
                h: number
            }[] = []
            let labelMoving = false
            for (const { label, p, out } of projected) {
                const e = label.element!,
                    scale = out.scale * responsive
                const w = label.width * scale + 3 * responsive,
                    h = referenceFontSize * scale * 0.78
                const box = {
                    l: out.x - w / 2,
                    r: out.x + w / 2,
                    t: out.y - h / 2,
                    b: out.y + h / 2,
                    w,
                    h,
                }
                let clearance = 1
                for (const other of occupied) {
                    const x =
                            Math.min(box.r, other.r) - Math.max(box.l, other.l),
                        y = Math.min(box.b, other.b) - Math.max(box.t, other.t)
                    if (x > 0 && y > 0)
                        clearance = Math.min(
                            clearance,
                            clamp(
                                1 -
                                    4 *
                                        Math.min(
                                            x / Math.min(w, other.w),
                                            y / Math.min(h, other.h)
                                        ),
                                0,
                                1
                            )
                        )
                }
                const opacity = out.opacity * clearance
                if (!animated || !Number.isFinite(label.opacity))
                    label.opacity = opacity
                else
                    label.opacity +=
                        (opacity - label.opacity) * (1 - Math.exp(-18 * dt))
                labelMoving ||= Math.abs(label.opacity - opacity) > 0.002
                if (opacity > 0.48) occupied.push(box)
                e.style.transform = `translate3d(${out.x.toFixed(3)}px,${out.y.toFixed(3)}px,0) translate(-50%,-50%) scale(${(out.scale * responsive).toFixed(5)})`
                e.style.opacity = label.opacity.toFixed(3)
                e.style.zIndex = String(Math.round((p.z + 1) * 1000))
                // One shared distant-text filter avoids hundreds of filtered layers.
                const parent = p.z < 0.16 ? backLayer : frontLayer
                if (e.parentNode !== parent) parent.appendChild(e)
            }
            if (Math.abs(targetYaw) > TAU * 100) {
                const shift = Math.round(targetYaw / TAU) * TAU
                targetYaw -= shift
                yaw -= shift
            }
            const moving =
                labelMoving ||
                Math.abs(targetPitch - pitch) +
                    Math.abs(targetYaw - yaw) +
                    Math.abs(sx - steerX) +
                    Math.abs(sy - steerY) >
                    0.00005 ||
                Math.abs(velocityX) + Math.abs(velocityY) > 0.0001
            if (
                animated &&
                labels.length &&
                (moving || (c.autoRotate && c.speed !== 0 && !pressed))
            )
                frameId = requestAnimationFrame(frame)
        }
        function push() {
            if (!active()) return
            if (!animate()) {
                stop()
                frame()
            } else if (!frameId) frameId = requestAnimationFrame(frame)
        }
        function resize() {
            width = Math.max(1, container!.clientWidth)
            height = Math.max(1, container!.clientHeight)
            const diameter =
                (Math.min(width, height) * latest.current.scale) / 100
            backLayer.style.filter =
                latest.current.depthSoftness > 0
                    ? `blur(${((0.75 * latest.current.depthSoftness) / 100).toFixed(2)}px)`
                    : "none"
            layer!.style.clipPath = `circle(${diameter / 2}px at 50% 50%)`
            rebuild()
            push()
        }
        function update() {
            if (disposed) return
            if (!latest.current.dragRotate && pressed) cancel()
            rebuild()
            resize()
            push()
        }
        function pointer(e: PointerEvent) {
            const r = container!.getBoundingClientRect(),
                nx = ((e.clientX - r.left) / Math.max(r.width, 1) - 0.5) * 2,
                ny = ((e.clientY - r.top) / Math.max(r.height, 1) - 0.5) * 2
            steerTargetX = clamp(ny, -1, 1) * 0.025
            steerTargetY = clamp(nx, -1, 1) * 0.12
        }
        function down(e: PointerEvent) {
            if (
                !latest.current.dragRotate ||
                e.isPrimary === false ||
                e.button !== 0
            )
                return
            const r = container!.getBoundingClientRect(),
                radius =
                    (Math.min(r.width, r.height) * latest.current.scale) / 200
            if (
                Math.hypot(
                    e.clientX - r.left - r.width / 2,
                    e.clientY - r.top - r.height / 2
                ) > radius
            )
                return
            pressed = true
            dragging = false
            pointerId = e.pointerId
            pressX = lastX = e.clientX
            pressY = lastY = e.clientY
            lastMove = performance.now()
            velocityX = velocityY = 0
            container!.setPointerCapture?.(pointerId)
            container!.focus({ preventScroll: true })
            pointer(e)
            push()
        }
        function move(e: PointerEvent) {
            if (pressed && e.pointerId !== pointerId) return
            pointer(e)
            if (pressed) {
                const now = performance.now(),
                    elapsed = clamp((now - lastMove) / 1000, 1 / 120, 0.05),
                    sensitivity = 2.6 / Math.max(160, Math.min(width, height))
                const dx = e.clientX - lastX,
                    dy = e.clientY - lastY
                dragging ||=
                    Math.hypot(e.clientX - pressX, e.clientY - pressY) > 3
                if (dragging) {
                    targetYaw += dx * sensitivity
                    targetPitch += dy * sensitivity
                    velocityY = clamp((dx * sensitivity) / elapsed, -2.6, 2.6)
                    velocityX = clamp((dy * sensitivity) / elapsed, -1.8, 1.8)
                }
                lastX = e.clientX
                lastY = e.clientY
                lastMove = now
            }
            if (pressed || latest.current.cursorSteer) push()
        }
        function up(e: PointerEvent) {
            if (!pressed || e.pointerId !== pointerId) return
            const id = pointerId
            pressed = false
            pointerId = -1
            if (!dragging || performance.now() - lastMove > 100)
                velocityX = velocityY = 0
            if (container!.hasPointerCapture?.(id))
                container!.releasePointerCapture(id)
            push()
        }
        function cancel() {
            const id = pointerId
            pressed = false
            pointerId = -1
            hovering = false
            dragging = false
            velocityX = velocityY = 0
            if (id >= 0 && container!.hasPointerCapture?.(id))
                container!.releasePointerCapture(id)
            push()
        }
        function key(e: KeyboardEvent) {
            if (!latest.current.dragRotate) return
            const step = e.shiftKey ? 0.28 : 0.12
            if (e.key === "ArrowLeft") targetYaw -= step
            else if (e.key === "ArrowRight") targetYaw += step
            else if (e.key === "ArrowUp") targetPitch -= step
            else if (e.key === "ArrowDown") targetPitch += step
            else if (e.key === "Home" || e.key === "Escape") {
                targetPitch = radians(0)
                targetYaw = yaw + wrap(radians(12) - yaw)
                velocityX = velocityY = 0
            } else return
            e.preventDefault()
            push()
        }
        function activity() {
            stop()
            if (!active()) cancel()
            else push()
        }
        listen(container, "pointerenter", ((e: PointerEvent) => {
            hovering = e.pointerType !== "touch"
            pointer(e)
            push()
        }) as EventListener)
        listen(container, "pointerleave", (() => {
            if (!pressed) hovering = false
            push()
        }) as EventListener)
        listen(container, "pointerdown", down as EventListener)
        listen(container, "pointermove", move as EventListener)
        listen(container, "pointerup", up as EventListener)
        listen(container, "pointercancel", cancel)
        listen(container, "lostpointercapture", (() => {
            if (pressed) cancel()
        }) as EventListener)
        listen(container, "keydown", key as EventListener)
        listen(window, "blur", cancel)
        listen(
            window,
            "scroll",
            (() => {
                if (!pressed) hovering = false
                push()
            }) as EventListener,
            { passive: true }
        )
        listen(document, "visibilitychange", activity)
        listen(reduced, "change", activity)
        if (document.fonts) {
            listen(document.fonts, "loadingdone", () => {
                if (!disposed) {
                    layoutKey = ""
                    rebuild()
                    push()
                }
            })
            document.fonts.ready
                .then(() => {
                    if (!disposed) {
                        layoutKey = ""
                        rebuild()
                        push()
                    }
                })
                .catch(() => {})
        }
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(resize)
            resizeObserver.observe(container)
            resizeObserver.observe(probe)
        } else listen(window, "resize", resize)
        if (typeof IntersectionObserver !== "undefined") {
            intersectionObserver = new IntersectionObserver((entries) => {
                isIntersecting.current = entries[0]?.isIntersecting ?? true
                activity()
            })
            intersectionObserver.observe(container)
        }
        controller.current = { update }
        resize()
        container.dataset.wordSphere = "ready"
        return () => {
            disposed = true
            stop()
            const id = pointerId
            pressed = false
            pointerId = -1
            if (id >= 0 && container.hasPointerCapture?.(id))
                container.releasePointerCapture(id)
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            removers.forEach((remove) => remove())
            layer.replaceChildren()
            labels = []
            canvas.width = canvas.height = 1
            if (controller.current?.update === update) controller.current = null
        }
    }, [])
    useEffect(() => {
        controller.current?.update()
    }, [
        shouldAnimate,
        config.words,
        config.scale,
        config.density,
        config.depth,
        config.autoRotate,
        config.speed,
        config.dragRotate,
        config.cursorSteer,
        config.depthSoftness,
        fontKey,
    ])
    const { id, className, style } = incomingProps
    return (
        <div
            {...{ id, className }}
            ref={mountRef}
            role="group"
            tabIndex={config.dragRotate ? 0 : undefined}
            aria-label={`Rotating word sphere. ${parseWords(config.words).join(", ")}`}
            aria-roledescription={
                config.dragRotate
                    ? "Drag or use arrow keys to rotate. Home resets."
                    : "Rotating typography"
            }
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                ...style,
                overflow: "hidden",
                background: config.transparent
                    ? "transparent"
                    : config.background,
                touchAction: config.dragRotate ? "none" : "pan-y",
                cursor: config.dragRotate ? "grab" : "default",
                userSelect: "none",
                WebkitUserSelect: "none",
                outlineOffset: 4,
            }}
        >
            <div
                ref={layerRef}
                aria-hidden="true"
                style={{
                    ...font,
                    position: "absolute",
                    inset: 0,
                    color: config.textColor,
                    pointerEvents: "none",
                }}
            />
            <span
                ref={probeRef}
                aria-hidden="true"
                style={{
                    ...font,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    visibility: "hidden",
                    pointerEvents: "none",
                    whiteSpace: "pre",
                }}
            >
                M
            </span>
            <div
                ref={emptyRef}
                style={{
                    display: "none",
                    position: "absolute",
                    inset: 0,
                    placeItems: "center",
                    font: "14px/1.5 system-ui",
                    color: config.textColor,
                    opacity: 0.7,
                    pointerEvents: "none",
                }}
            >
                Add words to create your sphere.
            </div>
        </div>
    )
}
WordSphere.defaultProps = defaults
addPropertyControls(WordSphere, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
    },
    words: {
        type: ControlType.String,
        title: "Words",
        defaultValue: referenceWords,
        displayTextArea: true,
        description: "One word or phrase per line.",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        defaultValue: nativeFont,
        defaultFontType: "serif",
        defaultFontSize: "28px",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: false,
    },
    geometry: {
        type: ControlType.Object,
        title: "Sphere",
        controls: {
            scale: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 82,
                min: 30,
                max: 105,
                step: 1,
                unit: "%",
            },
            density: {
                type: ControlType.Number,
                title: "Density",
                defaultValue: 100,
                min: 45,
                max: 160,
                step: 1,
                unit: "%",
                description: "More rows of words.",
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                defaultValue: 75,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "Size difference from front to back.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 32,
                min: -90,
                max: 90,
                step: 1,
                unit: "°/s",
                description: "Negative reverses rotation.",
                hidden: (p: Motion) => p.autoRotate === false,
            },
            dragRotate: {
                type: ControlType.Boolean,
                title: "Drag Rotate",
                defaultValue: true,
            },
            cursorSteer: {
                type: ControlType.Boolean,
                title: "Cursor Steer",
                defaultValue: true,
                description: "Gently follows pointer position.",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Words",
                defaultValue: "#FFFFFF",
            },
            depthSoftness: {
                type: ControlType.Number,
                title: "Depth Softness",
                defaultValue: 55,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "Softens the distant words.",
            },
            transparent: {
                type: ControlType.Boolean,
                title: "Transparent",
                defaultValue: false,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000EFF",
                hidden: (p: Appearance) => p.transparent,
            },
        },
        description:
            "More components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
    },
})
