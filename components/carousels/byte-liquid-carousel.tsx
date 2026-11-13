// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    useTransform,
} from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"

const PLACEHOLDERS = [
    "linear-gradient(145deg, #2F4858, #86BBD8)",
    "linear-gradient(145deg, #7A3E48, #E8A87C)",
    "linear-gradient(145deg, #1B4332, #95D5B2)",
    "linear-gradient(145deg, #3C3163, #B8A1E3)",
    "linear-gradient(145deg, #6B4E16, #F2C572)",
]
const SIDE_CARDS = 2
const SWIPE_PX = 40
const DEFAULT_SHADOW =
    "0px 30px 60px -12px rgba(0,0,0,0.55), 0px 12px 24px -8px rgba(0,0,0,0.4)"
// How much of the frame the middle card may take up.
const HEIGHT_SHARE = 0.64
const WIDTH_SHARE = 0.66
const MAX_FIT = 1.6
// Where a card waits, out of sight behind its neighbour, before it loops round.
const TUCK_X = 1
const TUCK_SCALE = 0.55
// Slides per second at which the liquid effect reaches full strength.
const LIQUID_SPEED = 2.5
// How quickly a card eases into and out of the effect, per frame.
const LIQUID_EASE = 0.18
const MAX_LIQUID_TEXTURE = 1024
// Gap between the name and position text and the card edge, in screen pixels.
const INFO_PADDING = 20
const FONT_FALLBACK = "Inter, system-ui, -apple-system, sans-serif"

const LIQUID_VERTEX = [
    "attribute vec2 p;",
    "varying vec2 vUv;",
    "void main() {",
    "    vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);",
    "    gl_Position = vec4(p, 0.0, 1.0);",
    "}",
].join("\n")

// Liquid: layered waves warp the photo while a ripple spreads from the centre,
// and the surface catches light. The card edges stay put, and at amount 0 the
// result matches the plain image.
const LIQUID_FRAGMENT = [
    "precision mediump float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex;",
    "uniform float uAmount;",
    "uniform float uScale;",
    "uniform float uTime;",
    "vec3 img(vec2 uv) { return texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb; }",
    "void main() {",
    "    vec2 c = vUv - 0.5;",
    "    vec2 w = vUv * uScale;",
    "    float t = uTime;",
    "    vec2 q = vec2(sin(w.y * 1.7 + t * 1.3) + sin(w.y * 3.1 + w.x - t * 0.9),",
    "                  cos(w.x * 1.9 - t * 1.1) + cos(w.x * 3.7 + w.y + t * 0.7));",
    "    vec2 r = vec2(sin(w.x * 2.3 + q.y * 1.6 + t), cos(w.y * 2.1 + q.x * 1.6 - t));",
    "    vec2 flow = q * 0.5 + r;",
    "    float d = length(c);",
    "    vec2 ripple = (c / max(d, 0.001)) * sin(d * 26.0 - t * 7.0) * exp(-d * 2.5);",
    "    float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));",
    "    float mask = smoothstep(0.0, 0.14, e);",
    "    vec2 move = (flow * 0.045 + ripple * 0.02) * uAmount * mask;",
    "    vec2 split = move * 0.16;",
    "    vec3 col = vec3(img(vUv + move + split).r, img(vUv + move).g, img(vUv + move - split).b);",
    "    vec3 n = normalize(vec3((flow + ripple) * 0.9, 1.0));",
    "    float spec = pow(max(0.0, dot(n, normalize(vec3(-0.45, -0.55, 0.7)))), 22.0);",
    "    col += spec * 0.42 * uAmount * mask;",
    "    gl_FragColor = vec4(col, 1.0);",
    "}",
].join("\n")

const mix = (from: number, to: number, t: number) => from + (to - from) * t

/** Shortest signed distance from the active card, so the row loops. */
function offsetFrom(index: number, active: number, count: number) {
    let d = (index - active) % count
    if (d > count / 2) d -= count
    if (d < -count / 2) d += count
    return d
}

/** Position and size for a card at distance d, which can be fractional mid-move. */
function poseFor(d: number, spread: number, centerScale: number, edge: number) {
    const a = Math.abs(d)
    let x = a <= 1 ? a * spread : spread + (a - 1) * spread * 0.72
    let scale = a <= 1 ? mix(centerScale, 0.9, a) : 1 - 0.1 * a
    const tuckStart = edge - 0.5
    if (a > tuckStart) {
        const t = Math.min(1, (a - tuckStart) / 0.5)
        const eased = t * t * (3 - 2 * t)
        x = mix(x, spread * TUCK_X, eased)
        scale = mix(scale, TUCK_SCALE, eased)
    }
    return { x: Math.sign(d) * x, scale }
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

/** Focal point from a Framer image position such as "50%", as 0 to 1. */
function focal(position) {
    const value = parseFloat(position)
    return isNaN(value) ? 0.5 : value / 100
}

/**
 * Draws the photo heading to the middle through the liquid shader while the
 * row is moving. The canvas is hidden the rest of the time, and if WebGL or
 * the image is unavailable the plain image underneath stays on show.
 */
function useLiquid(canvasRef, opts) {
    const { enabled, image, liquid, isActive, strength, waveSize } = opts
    const { cardWidth, cardHeight } = opts
    const src = image?.src
    const positionX = image?.positionX
    const positionY = image?.positionY
    const activeRef = useRef(isActive)
    activeRef.current = isActive

    useEffect(() => {
        const canvas = canvasRef.current
        if (!enabled || !canvas || !src) return
        const gl = canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
        })
        if (!gl) return
        const vertex = compileShader(gl, gl.VERTEX_SHADER, LIQUID_VERTEX)
        const fragment = compileShader(gl, gl.FRAGMENT_SHADER, LIQUID_FRAGMENT)
        if (!vertex || !fragment) return
        const program = gl.createProgram()
        gl.attachShader(program, vertex)
        gl.attachShader(program, fragment)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
        gl.useProgram(program)

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )
        const position = gl.getAttribLocation(program, "p")
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

        const uAmount = gl.getUniformLocation(program, "uAmount")
        const uScale = gl.getUniformLocation(program, "uScale")
        const uTime = gl.getUniformLocation(program, "uTime")

        const scale = Math.min(
            2,
            MAX_LIQUID_TEXTURE / Math.max(cardWidth, cardHeight)
        )
        const width = Math.round(cardWidth * scale)
        const height = Math.round(cardHeight * scale)
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)

        let ready = false
        let cancelled = false
        const picture = new Image()
        picture.crossOrigin = "anonymous"
        picture.onload = () => {
            if (cancelled) return
            try {
                // Crop to the card like object-fit: cover, so the texture
                // lines up with the image underneath and stays small.
                const scratch = document.createElement("canvas")
                scratch.width = width
                scratch.height = height
                const cover = Math.max(
                    width / picture.naturalWidth,
                    height / picture.naturalHeight
                )
                const cropW = width / cover
                const cropH = height / cover
                scratch
                    .getContext("2d")
                    .drawImage(
                        picture,
                        (picture.naturalWidth - cropW) * focal(positionX),
                        (picture.naturalHeight - cropH) * focal(positionY),
                        cropW,
                        cropH,
                        0,
                        0,
                        width,
                        height
                    )
                gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR
                )
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGB,
                    gl.RGB,
                    gl.UNSIGNED_BYTE,
                    scratch
                )
                ready = true
            } catch (_) {
                ready = false
            }
        }
        picture.src = src

        // Eased per card, so a card that stops being the incoming one melts
        // back to the plain photo instead of snapping.
        let current = 0
        const unsubscribe = liquid.on("change", (speed: number) => {
            if (!ready) return
            const target = activeRef.current ? speed : 0
            current =
                speed === 0 ? 0 : current + (target - current) * LIQUID_EASE
            const resting = current < 0.01
            canvas.style.display = resting ? "none" : "block"
            if (resting) return
            gl.uniform1f(uAmount, current * strength)
            gl.uniform1f(uScale, waveSize)
            gl.uniform1f(uTime, (performance.now() / 1000) % 100)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        })

        return () => {
            cancelled = true
            unsubscribe()
            canvas.style.display = "none"
        }
    }, [
        enabled,
        src,
        positionX,
        positionY,
        liquid,
        strength,
        waveSize,
        cardWidth,
        cardHeight,
    ])
}

function Arrow({ direction, size, inset, color, onClick }) {
    const isLeft = direction === "left"
    return (
        <motion.button
            type="button"
            aria-label={isLeft ? "Previous slide" : "Next slide"}
            onClick={onClick}
            onPointerDown={(e) => e.stopPropagation()}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            style={{
                position: "absolute",
                top: "50%",
                marginTop: -size / 2,
                ...(isLeft ? { left: inset } : { right: inset }),
                width: size,
                height: size,
                padding: 0,
                border: "1.5px solid " + color,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
                background: "transparent",
                cursor: "pointer",
                zIndex: 2000,
            }}
        >
            <svg
                width={size * 0.42}
                height={size * 0.42}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <polyline
                    points={isLeft ? "15 5 8 12 15 19" : "9 5 16 12 9 19"}
                />
            </svg>
        </motion.button>
    )
}

/**
 * Name and position over the middle card. The card is scaled to fit the frame,
 * so this cancels that scale to keep the text the same size on every screen.
 */
function CardInfo(props) {
    const {
        name,
        role,
        visible,
        fit,
        centerScale,
        cardWidth,
        nameFont,
        roleFont,
        color,
        reduceMotion,
    } = props
    const cardScale = useTransform(fit, (f: number) =>
        Math.max(f * centerScale, 0.01)
    )
    const scale = useTransform(cardScale, (s: number) => 1 / s)
    const inset = useTransform(cardScale, (s: number) => INFO_PADDING / s)
    const width = useTransform(
        cardScale,
        (s: number) => cardWidth * s - INFO_PADDING * 2
    )
    const fade = { duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={fade}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                    "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.38) 26%, rgba(0,0,0,0) 52%)",
            }}
        >
            <motion.div
                initial={false}
                animate={{ y: visible || reduceMotion ? 0 : 12 }}
                transition={fade}
                style={{
                    position: "absolute",
                    left: inset,
                    bottom: inset,
                    width,
                    scale,
                    transformOrigin: "0% 100%",
                    color,
                }}
            >
                {name ? (
                    <div
                        style={{
                            fontFamily: FONT_FALLBACK,
                            fontSize: 22,
                            fontWeight: 600,
                            lineHeight: 1.25,
                            ...nameFont,
                        }}
                    >
                        {name}
                    </div>
                ) : null}
                {role ? (
                    <div
                        style={{
                            fontFamily: FONT_FALLBACK,
                            fontSize: 14,
                            fontWeight: 400,
                            lineHeight: 1.4,
                            marginTop: 4,
                            ...roleFont,
                        }}
                    >
                        {role}
                    </div>
                ) : null}
            </motion.div>
        </motion.div>
    )
}

function Card(props) {
    const {
        slide,
        index,
        count,
        progress,
        fit,
        liquid,
        liquidOn,
        liquidStrength,
        liquidSize,
        spread,
        centerScale,
        edge,
        tilt,
        sideTilt,
        cardWidth,
        cardHeight,
        radius,
        shadow,
        isActive,
        onSelect,
        swiped,
        showInfo,
        alwaysShowInfo,
        nameFont,
        roleFont,
        infoColor,
        reduceMotion,
    } = props
    const image = slide.image
    const [hovered, setHovered] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const d = useTransform(progress, (p: number) => offsetFrom(index, p, count))
    const x = useTransform([d, fit], ([v, f]: number[]) => {
        return poseFor(v, spread, centerScale, edge).x * f
    })
    const scale = useTransform([d, fit], ([v, f]: number[]) => {
        return poseFor(v, spread, centerScale, edge).scale * f
    })
    const clamped = (v: number) =>
        Math.max(-SIDE_CARDS, Math.min(SIDE_CARDS, v))
    const rotateY = useTransform(d, (v: number) => -clamped(v) * tilt)
    const rotateZ = useTransform(d, (v: number) => clamped(v) * sideTilt)
    const zIndex = useTransform(d, (v: number) =>
        Math.round(1000 - Math.abs(v) * 100)
    )
    const visibility = useTransform(d, (v: number) =>
        Math.abs(v) >= edge - 0.001 ? "hidden" : "visible"
    )

    useLiquid(canvasRef, {
        enabled: liquidOn,
        image,
        liquid,
        isActive,
        strength: liquidStrength / 100,
        waveSize: liquidSize,
        cardWidth,
        cardHeight,
    })

    return (
        <motion.div
            aria-hidden={!isActive}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={() => {
                if (swiped.current || isActive) return
                onSelect()
            }}
            style={{
                x,
                scale,
                rotateY,
                rotateZ,
                zIndex,
                visibility,
                transformPerspective: 1200,
                position: "absolute",
                left: "50%",
                top: "50%",
                width: cardWidth,
                height: cardHeight,
                marginLeft: -cardWidth / 2,
                marginTop: -cardHeight / 2,
                borderRadius: radius,
                overflow: "hidden",
                boxShadow: shadow || DEFAULT_SHADOW,
                cursor: isActive ? "default" : "pointer",
                background: PLACEHOLDERS[index % PLACEHOLDERS.length],
                userSelect: "none",
                willChange: "transform",
            }}
        >
            {image?.src ? (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes="(max-width: 810px) 70vw, 640px"
                    alt={image.alt || slide.title || ""}
                    draggable={false}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition:
                            image.positionX && image.positionY
                                ? image.positionX + " " + image.positionY
                                : "center",
                    }}
                />
            ) : null}
            {liquidOn && image?.src ? (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        display: "none",
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            ) : null}
            {showInfo && (slide.title || slide.role) ? (
                <CardInfo
                    name={slide.title}
                    role={slide.role}
                    visible={isActive && (hovered || alwaysShowInfo)}
                    fit={fit}
                    centerScale={centerScale}
                    cardWidth={cardWidth}
                    nameFont={nameFont}
                    roleFont={roleFont}
                    color={infoColor}
                    reduceMotion={reduceMotion}
                />
            ) : null}
            {isActive && slide.link ? (
                <a
                    href={slide.link}
                    aria-label={slide.title || "Open"}
                    draggable={false}
                    onClick={(e) => {
                        if (swiped.current) e.preventDefault()
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        cursor: "pointer",
                    }}
                />
            ) : null}
        </motion.div>
    )
}

/**
 * Coverflow Gallery
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CoverflowGallery(props) {
    const {
        slides,
        cardWidth,
        cardHeight,
        centerSize,
        radius,
        shadow,
        tilt,
        sideTilt,
        gap,
        liquidEffect,
        liquidStrength,
        liquidSize,
        showArrows,
        arrowSize,
        arrowInset,
        arrowColor,
        autoplay,
        autoplayDirection,
        interval,
        transition,
        showInfo,
        nameFont,
        roleFont,
        infoColor,
        background,
        style,
    } = props

    const items = slides && slides.length ? slides : [{}]
    const count = items.length
    const [active, setActive] = useState(0)
    const [ready, setReady] = useState(false)
    const [noHover, setNoHover] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const hovering = useRef(false)
    const pointerStart = useRef<number | null>(null)
    const swiped = useRef(false)
    const reduceMotion = useReducedMotion()
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const current = ((active % count) + count) % count
    const progress = useMotionValue(0)
    const fit = useMotionValue(1)
    const liquid = useMotionValue(0)
    const liquidOn = liquidEffect && !onCanvas && !reduceMotion
    const centerScale = centerSize / 100

    const go = useCallback((step: number) => setActive((a) => a + step), [])

    // Touch screens can't hover, so they keep the middle card's details on show.
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(hover: none)")
        setNoHover(query.matches)
        const onChange = (e) => setNoHover(e.matches)
        query.addEventListener("change", onChange)
        return () => query.removeEventListener("change", onChange)
    }, [])

    // Size the cards from the frame, so they follow any screen.
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") {
            setReady(true)
            return
        }
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            if (!width || !height) return
            fit.set(
                Math.min(
                    MAX_FIT,
                    (height * HEIGHT_SHARE) / (cardHeight * centerScale),
                    (width * WIDTH_SHARE) / (cardWidth * centerScale)
                )
            )
            setReady(true)
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [cardWidth, cardHeight, centerScale, fit])

    // One spring drives every card, so they all move together and a new
    // move carries on from the current speed instead of restarting. The liquid
    // follows the speed, so it builds and settles with the move.
    useEffect(() => {
        if (onCanvas || reduceMotion) {
            progress.set(active)
            return
        }
        const controls = animate(progress, active, {
            ...transition,
            onUpdate: () => {
                const speed = Math.abs(progress.getVelocity())
                liquid.set(Math.min(1, speed / LIQUID_SPEED))
            },
            onComplete: () => liquid.set(0),
        })
        return () => controls.stop()
    }, [active, onCanvas, reduceMotion, progress, liquid])

    useEffect(() => {
        if (!autoplay || onCanvas || reduceMotion || count < 2) return
        const step = autoplayDirection === "leftToRight" ? -1 : 1
        const timer = setInterval(
            () => {
                if (!hovering.current) go(step)
            },
            Math.max(1, interval) * 1000
        )
        return () => clearInterval(timer)
    }, [
        autoplay,
        autoplayDirection,
        interval,
        onCanvas,
        reduceMotion,
        count,
        go,
    ])

    const onKeyDown = (e) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            go(1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            go(-1)
        }
    }

    const onPointerUp = (e) => {
        if (pointerStart.current === null) return
        const moved = e.clientX - pointerStart.current
        pointerStart.current = null
        swiped.current = Math.abs(moved) > SWIPE_PX
        if (swiped.current) go(moved < 0 ? 1 : -1)
    }

    const spread = cardWidth * 0.42 + gap
    const edge = Math.min(SIDE_CARDS + 0.5, count / 2)
    const layoutKey = [
        count,
        cardWidth,
        cardHeight,
        centerScale,
        gap,
        tilt,
        sideTilt,
    ].join("-")

    return (
        <div
            ref={rootRef}
            role="group"
            aria-roledescription="carousel"
            aria-label="Image gallery"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={(e) => {
                pointerStart.current = e.clientX
                swiped.current = false
            }}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (pointerStart.current = null)}
            onMouseEnter={() => (hovering.current = true)}
            onMouseLeave={() => (hovering.current = false)}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                touchAction: "pan-y",
                outline: "none",
                visibility: ready ? "visible" : "hidden",
            }}
        >
            {items.map((slide, i) => (
                <Card
                    key={i + "-" + layoutKey}
                    slide={slide}
                    index={i}
                    count={count}
                    progress={progress}
                    fit={fit}
                    liquid={liquid}
                    liquidOn={liquidOn}
                    liquidStrength={liquidStrength}
                    liquidSize={liquidSize}
                    spread={spread}
                    centerScale={centerScale}
                    edge={edge}
                    tilt={tilt}
                    sideTilt={sideTilt}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    radius={radius}
                    shadow={shadow}
                    isActive={i === current}
                    onSelect={() => go(offsetFrom(i, current, count))}
                    swiped={swiped}
                    showInfo={showInfo}
                    alwaysShowInfo={noHover}
                    nameFont={nameFont}
                    roleFont={roleFont}
                    infoColor={infoColor}
                    reduceMotion={reduceMotion}
                />
            ))}
            {showArrows && count > 1 ? (
                <>
                    <Arrow
                        direction="left"
                        size={arrowSize}
                        inset={arrowInset}
                        color={arrowColor}
                        onClick={() => go(-1)}
                    />
                    <Arrow
                        direction="right"
                        size={arrowSize}
                        inset={arrowInset}
                        color={arrowColor}
                        onClick={() => go(1)}
                    />
                </>
            ) : null}
        </div>
    )
}

CoverflowGallery.defaultProps = {
    slides: [
        { title: "Name", role: "Position" },
        { title: "Name", role: "Position" },
        { title: "Name", role: "Position" },
        { title: "Name", role: "Position" },
        { title: "Name", role: "Position" },
    ],
    cardWidth: 400,
    cardHeight: 400,
    centerSize: 112,
    radius: 24,
    shadow: DEFAULT_SHADOW,
    tilt: 12,
    sideTilt: 8,
    gap: 8,
    liquidEffect: true,
    liquidStrength: 100,
    liquidSize: 4,
    showArrows: true,
    arrowSize: 48,
    arrowInset: 24,
    arrowColor: "#8A8A8A",
    autoplay: false,
    autoplayDirection: "rightToLeft",
    interval: 3,
    transition: { type: "spring", stiffness: 110, damping: 24, mass: 1 },
    showInfo: true,
    infoColor: "#FFFFFF",
    background: "rgba(0,0,0,0)",
}

addPropertyControls(CoverflowGallery, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Name",
                },
                role: {
                    type: ControlType.String,
                    title: "Position",
                    defaultValue: "Position",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: CoverflowGallery.defaultProps.slides,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 120,
        max: 900,
        step: 10,
        unit: "px",
        defaultValue: 400,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 120,
        max: 900,
        step: 10,
        unit: "px",
        defaultValue: 400,
    },
    centerSize: {
        type: ControlType.Number,
        title: "Center Size",
        min: 100,
        max: 150,
        step: 1,
        unit: "%",
        defaultValue: 112,
    },
    radius: {
        type: ControlType.Number,
        title: "Rounded",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: DEFAULT_SHADOW,
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 60,
        step: 1,
        unit: "°",
        defaultValue: 12,
    },
    sideTilt: {
        type: ControlType.Number,
        title: "Sideways Tilt",
        min: -30,
        max: 30,
        step: 1,
        unit: "°",
        defaultValue: 8,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: -100,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },
    liquidEffect: {
        type: ControlType.Boolean,
        title: "Liquid",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    liquidStrength: {
        type: ControlType.Number,
        title: "Liquid Strength",
        min: 10,
        max: 200,
        step: 5,
        unit: "%",
        defaultValue: 100,
        hidden: (p) => !p.liquidEffect,
    },
    liquidSize: {
        type: ControlType.Number,
        title: "Wave Density",
        min: 1,
        max: 12,
        step: 0.5,
        defaultValue: 4,
        hidden: (p) => !p.liquidEffect,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        min: 28,
        max: 96,
        step: 1,
        unit: "px",
        defaultValue: 48,
        hidden: (p) => !p.showArrows,
    },
    arrowInset: {
        type: ControlType.Number,
        title: "Arrow Inset",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 24,
        hidden: (p) => !p.showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Stroke",
        defaultValue: "#8A8A8A",
        hidden: (p) => !p.showArrows,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    autoplayDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["rightToLeft", "leftToRight"],
        optionTitles: ["Right to left", "Left to right"],
        defaultValue: "rightToLeft",
        hidden: (p) => !p.autoplay,
    },
    interval: {
        type: ControlType.Number,
        title: "Every",
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
        defaultValue: 3,
        hidden: (p) => !p.autoplay,
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: CoverflowGallery.defaultProps.transition,
    },
    showInfo: {
        type: ControlType.Boolean,
        title: "Hover Info",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 22, fontWeight: 600, lineHeight: 1.25 },
        hidden: (p) => !p.showInfo,
    },
    roleFont: {
        type: ControlType.Font,
        title: "Position Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14, fontWeight: 400, lineHeight: 1.4 },
        hidden: (p) => !p.showInfo,
    },
    infoColor: {
        type: ControlType.Color,
        title: "Info Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showInfo,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },
})
