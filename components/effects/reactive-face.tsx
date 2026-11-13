import { motion, useMotionValue, useSpring } from "framer-motion"
import { useState, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ------------------------------------------------------------------
   One eye. Hooks live inside this child so the parent's hook count
   never changes. In a static context it renders a plain, frozen eye.
------------------------------------------------------------------- */
function Eye(props) {
    const eyeRef = useRef(null)
    const isStatic = props.isStatic

    const pupilX = useSpring(0, {
        stiffness: props.speed,
        damping: 16,
        mass: 0.4,
    })
    const pupilY = useSpring(0, {
        stiffness: props.speed,
        damping: 16,
        mass: 0.4,
    })

    const mouseX = props.mouseX
    const mouseY = props.mouseY
    const range = props.range

    useEffect(
        function () {
            // No cursor tracking while rendering statically
            if (isStatic) return

            function update() {
                const node = eyeRef.current
                if (!node) return

                const rect = node.getBoundingClientRect()
                if (!rect.width) return

                const centerX = rect.left + rect.width / 2
                const centerY = rect.top + rect.height / 2

                const dx = mouseX.get() - centerX
                const dy = mouseY.get() - centerY
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 1) {
                    pupilX.set(0)
                    pupilY.set(0)
                    return
                }

                const angle = Math.atan2(dy, dx)
                const reach = Math.min(dist / 90, 1) * range

                pupilX.set(Math.cos(angle) * reach)
                pupilY.set(Math.sin(angle) * reach)
            }

            const stopX = mouseX.on("change", update)
            const stopY = mouseY.on("change", update)
            update()

            return function () {
                stopX()
                stopY()
            }
        },
        [mouseX, mouseY, range, isStatic]
    )

    const size = props.size
    const pupilSize = props.pupilSize
    const lidClosed = props.blinking
    const squint = props.squint

    const eyeStyle = {
        position: "relative",
        width: size,
        height: size * props.eyeShape,
        borderRadius: "50%",
        background: props.eyeColor,
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.12)",
    }

    const highlight = (
        <div
            style={{
                position: "absolute",
                top: "18%",
                left: "20%",
                width: "32%",
                height: "32%",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.85)",
            }}
        />
    )

    /* ---- static: plain divs, no motion, no springs ---- */
    if (isStatic) {
        const offsetX = range * 0.35
        const offsetY = range * 0.15

        return (
            <div style={eyeStyle}>
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: pupilSize,
                        height: pupilSize,
                        marginLeft: -pupilSize / 2 + offsetX,
                        marginTop: -pupilSize / 2 + offsetY,
                        borderRadius: "50%",
                        background: props.pupilColor,
                    }}
                >
                    {highlight}
                </div>
            </div>
        )
    }

    /* ---- live ---- */
    return (
        <motion.div
            ref={eyeRef}
            initial={false}
            animate={{ scaleY: squint ? 0.5 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={eyeStyle}
        >
            <motion.div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: pupilSize,
                    height: pupilSize,
                    marginLeft: -pupilSize / 2,
                    marginTop: -pupilSize / 2,
                    borderRadius: "50%",
                    background: props.pupilColor,
                    x: pupilX,
                    y: pupilY,
                }}
                animate={{ scale: props.excited ? 1.18 : 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
            >
                {highlight}
            </motion.div>

            {/* Eyelid, drops down on blink */}
            <motion.div
                initial={false}
                animate={{ y: lidClosed ? 0 : -size * 1.1 }}
                transition={{ duration: 0.09, ease: "easeOut" }}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "110%",
                    background: props.lidColor,
                    borderBottomLeftRadius: "40%",
                    borderBottomRightRadius: "40%",
                }}
            />
        </motion.div>
    )
}

/* ------------------------------------------------------------------
   A single falling droplet. Never rendered in a static context.
------------------------------------------------------------------- */
function Droplet(props) {
    const active = props.active

    return (
        <motion.div
            initial={false}
            animate={
                active
                    ? {
                          y: [0, props.fall],
                          opacity: [0, 1, 1, 0],
                          scaleY: [0.7, 1, 1.25, 1.4],
                          scaleX: [1.1, 1, 0.85, 0.7],
                      }
                    : { y: 0, opacity: 0, scaleY: 0.7, scaleX: 1.1 }
            }
            transition={
                active
                    ? {
                          duration: props.duration,
                          repeat: Infinity,
                          delay: props.delay,
                          ease: "easeIn",
                          times: [0, 0.15, 0.7, 1],
                      }
                    : { duration: 0.18 }
            }
            style={{
                position: "absolute",
                left: "50%",
                top: props.top,
                width: props.size,
                height: props.size * 1.25,
                marginLeft: -props.size / 2,
                background: props.color,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                pointerEvents: "none",
            }}
        />
    )
}

/* A single frozen droplet for the static preview */
function StaticDroplet(props) {
    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: props.top,
                width: props.size,
                height: props.size * 1.25,
                marginLeft: -props.size / 2,
                background: props.color,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                pointerEvents: "none",
            }}
        />
    )
}

/* ------------------------------------------------------------------
   Nose. Sniffs upward when reacting, sits still when static.
------------------------------------------------------------------- */
function Nose(props) {
    const paths = (
        <g>
            <path
                d="M20 2c1.6 0 3 1.1 3.6 2.7l6.2 17.1c1.3 3.6-1.2 7.4-5 7.4h-9.6c-3.8 0-6.3-3.8-5-7.4l6.2-17.1C17 3.1 18.4 2 20 2z"
                fill={props.color}
            />
            <ellipse
                cx="14.5"
                cy="24"
                rx="2.6"
                ry="2"
                fill={props.nostrilColor}
                opacity="0.55"
            />
            <ellipse
                cx="25.5"
                cy="24"
                rx="2.6"
                ry="2"
                fill={props.nostrilColor}
                opacity="0.55"
            />
        </g>
    )

    if (props.isStatic) {
        return (
            <svg
                width={props.width}
                height={props.width * 0.85}
                viewBox="0 0 40 34"
                fill="none"
                aria-hidden="true"
                style={{ display: "block" }}
            >
                {paths}
            </svg>
        )
    }

    return (
        <motion.svg
            width={props.width}
            height={props.width * 0.85}
            viewBox="0 0 40 34"
            fill="none"
            aria-hidden="true"
            initial={false}
            animate={{
                y: props.sniff ? -3 : 0,
                scaleY: props.sniff ? 0.88 : 1,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 14 }}
            style={{ display: "block" }}
        >
            {paths}
        </motion.svg>
    )
}

/* ------------------------------------------------------------------
   Food that drops into the mouth when clicked.
------------------------------------------------------------------- */
function FoodShape(props) {
    const size = props.size
    const name = props.name
    const color = props.color

    if (name === "donut") {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
            >
                <circle cx="20" cy="20" r="18" fill={color} />
                <path
                    d="M4 16c4-4 8 2 12-1s6 3 10 0 8 1 10 3v-2c0-9-8-14-16-14S4 7 4 14z"
                    fill="#F6E3D0"
                    opacity="0.9"
                />
                <circle cx="20" cy="20" r="6" fill="#FFF6EA" />
                <circle cx="12" cy="11" r="1.6" fill="#E8556D" />
                <circle cx="27" cy="12" r="1.6" fill="#5BC0EB" />
                <circle cx="20" cy="8" r="1.6" fill="#6BCB77" />
            </svg>
        )
    }

    if (name === "burger") {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
            >
                <path d="M4 16c0-7 7-11 16-11s16 4 16 11z" fill="#E8A952" />
                <rect
                    x="4"
                    y="17"
                    width="32"
                    height="4"
                    rx="2"
                    fill="#6BCB77"
                />
                <rect
                    x="4"
                    y="21"
                    width="32"
                    height="6"
                    rx="2"
                    fill="#8B4A2B"
                />
                <path d="M4 28c0 5 7 8 16 8s16-3 16-8z" fill="#E8A952" />
                <circle cx="13" cy="11" r="1.2" fill="#FFF3DC" />
                <circle cx="21" cy="9" r="1.2" fill="#FFF3DC" />
                <circle cx="27" cy="12" r="1.2" fill="#FFF3DC" />
            </svg>
        )
    }

    if (name === "candy") {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
            >
                <path d="M4 12l7 8-7 8z" fill={color} opacity="0.75" />
                <path d="M36 12l-7 8 7 8z" fill={color} opacity="0.75" />
                <circle cx="20" cy="20" r="9" fill={color} />
                <path
                    d="M16 14c3 3 5 7 5 12"
                    stroke="#FFF6EA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            </svg>
        )
    }

    /* cookie, the default */
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="20" cy="20" r="17" fill={color} />
            <circle cx="14" cy="15" r="2.6" fill="#4A2B18" />
            <circle cx="26" cy="17" r="2.2" fill="#4A2B18" />
            <circle cx="19" cy="26" r="2.4" fill="#4A2B18" />
            <circle cx="28" cy="27" r="1.7" fill="#4A2B18" />
            <circle cx="11" cy="24" r="1.7" fill="#4A2B18" />
        </svg>
    )
}

/* ------------------------------------------------------------------
   Mouth. Resting smile, open laugh, chewing, and a frozen
   open-mouth version for static rendering.
------------------------------------------------------------------- */
function Mouth(props) {
    const open = props.open
    const chewing = props.chewing
    const width = props.width
    const height = width * 0.72
    const isStatic = props.isStatic

    const openPaths = (
        <g>
            <path
                d="M8 12 Q40 6 72 12 Q72 54 40 54 Q8 54 8 12 Z"
                fill={props.mouthColor}
            />
            <path
                d="M8 12 Q40 6 72 12 Q60 20 40 20 Q20 20 8 12 Z"
                fill={props.teethColor}
            />
            <path
                d="M26 40 Q40 30 54 40 Q54 54 40 54 Q26 54 26 40 Z"
                fill={props.tongueColor}
            />
        </g>
    )

    /* ---- static: a single frozen open mouth ---- */
    if (isStatic) {
        return (
            <div style={{ position: "relative", width: width, height: height }}>
                <svg
                    width={width}
                    height={height}
                    viewBox="0 0 80 58"
                    fill="none"
                    aria-hidden="true"
                    style={{ position: "absolute", left: 0, top: 0 }}
                >
                    {openPaths}
                </svg>
            </div>
        )
    }

    const showOpen = open || chewing

    const openAnimation = chewing
        ? {
              opacity: 1,
              scale: 1,
              scaleY: [1, 0.45, 1, 0.5, 1, 0.45, 1],
              y: 0,
          }
        : {
              opacity: showOpen ? 1 : 0,
              scale: showOpen ? 1 : 0.75,
              scaleY: 1,
              y: showOpen ? 0 : 4,
          }

    const openTransition = chewing
        ? { duration: 1.5, ease: "easeInOut", repeat: Infinity }
        : { type: "spring", stiffness: 340, damping: 18 }

    return (
        <div
            style={{
                position: "relative",
                width: width,
                height: height,
                cursor: props.clickable ? "pointer" : "default",
            }}
            onClick={props.onClick}
        >
            {/* Resting smile */}
            <motion.svg
                width={width}
                height={height}
                viewBox="0 0 80 58"
                fill="none"
                aria-hidden="true"
                initial={false}
                animate={{
                    opacity: showOpen ? 0 : 1,
                    scale: showOpen ? 0.85 : 1,
                }}
                transition={{ duration: 0.16 }}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                }}
            >
                <path
                    d="M10 16 Q40 42 70 16"
                    stroke={props.lineColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                />
            </motion.svg>

            {/* Open laugh, also used while chewing */}
            <motion.svg
                width={width}
                height={height}
                viewBox="0 0 80 58"
                fill="none"
                aria-hidden="true"
                initial={false}
                animate={openAnimation}
                transition={openTransition}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transformOrigin: "50% 15%",
                    pointerEvents: "none",
                }}
            >
                {openPaths}
            </motion.svg>

            {/* Tongue lick at the end of a chew */}
            <motion.svg
                width={width}
                height={height}
                viewBox="0 0 80 58"
                fill="none"
                aria-hidden="true"
                initial={false}
                animate={
                    props.licking
                        ? { opacity: 1, y: [0, 6, 0], rotate: [0, -12, 0] }
                        : { opacity: 0, y: 0, rotate: 0 }
                }
                transition={
                    props.licking
                        ? { duration: 0.55, ease: "easeInOut" }
                        : { duration: 0.15 }
                }
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transformOrigin: "50% 40%",
                    pointerEvents: "none",
                }}
            >
                <path
                    d="M30 34 Q40 26 50 34 Q52 48 40 50 Q28 48 30 34 Z"
                    fill={props.tongueColor}
                />
            </motion.svg>
        </div>
    )
}

/**
 * Reactive Face
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 340
 * @framerDisableUnlink
 */
export default function ReactiveFace(props) {
    const faceSize = props.faceSize
    const faceShape = props.faceShape
    const faceColor = props.faceColor
    const eyeSize = props.eyeSize
    const eyeGap = props.eyeGap
    const eyeShape = props.eyeShape
    const eyeColor = props.eyeColor
    const pupilSize = props.pupilSize
    const pupilColor = props.pupilColor
    const followSpeed = props.followSpeed
    const followRange = props.followRange
    const blinkEnabled = props.blinkEnabled
    const noseWidth = props.noseWidth
    const noseColor = props.noseColor
    const dripEnabled = props.dripEnabled
    const dripColor = props.dripColor
    const dripSize = props.dripSize
    const dripSpeed = props.dripSpeed
    const mouthWidth = props.mouthWidth
    const mouthColor = props.mouthColor
    const tongueColor = props.tongueColor
    const teethColor = props.teethColor
    const lineColor = props.lineColor
    const nearDistance = props.nearDistance
    const faceTilt = props.faceTilt
    const showBlush = props.showBlush
    const blushColor = props.blushColor
    const showOnMobile = props.showOnMobile
    const eatEnabled = props.eatEnabled
    const foodShape = props.foodShape
    const foodColor = props.foodColor
    const foodSize = props.foodSize
    const chewCount = props.chewCount
    const showYum = props.showYum
    const yumText = props.yumText
    const hintEnabled = props.hintEnabled
    const hintText = props.hintText
    const idleWander = props.idleWander
    const idleDelay = props.idleDelay

    // True on the Framer canvas and during export. Every timer,
    // listener and looping animation is switched off when this is set.
    const isStatic = useIsStaticRenderer()

    const containerRef = useRef(null)
    const isTouch = useRef(false)
    const lastMoveAt = useRef(0)

    const mouseX = useMotionValue(-9999)
    const mouseY = useMotionValue(-9999)

    const [isNear, setIsNear] = useState(false)
    const [blinking, setBlinking] = useState(false)

    // Eating sequence: idle -> dropping -> chewing -> licking -> idle
    const [stage, setStage] = useState("idle")
    const [biteId, setBiteId] = useState(0)

    const tiltX = useSpring(0, { stiffness: 120, damping: 18 })
    const tiltY = useSpring(0, { stiffness: 120, damping: 18 })

    /* ---------- cursor tracking + proximity ---------- */
    useEffect(
        function () {
            if (isStatic) return

            isTouch.current =
                typeof window !== "undefined" &&
                ("ontouchstart" in window || navigator.maxTouchPoints > 0)

            if (isTouch.current && !showOnMobile) return

            const node = containerRef.current
            if (!node) return

            const doc = node.ownerDocument

            function handleMove(e) {
                lastMoveAt.current = Date.now()

                mouseX.set(e.clientX)
                mouseY.set(e.clientY)

                const rect = node.getBoundingClientRect()
                if (!rect.width) return

                const cx = rect.left + rect.width / 2
                const cy = rect.top + rect.height / 2
                const dx = e.clientX - cx
                const dy = e.clientY - cy
                const dist = Math.sqrt(dx * dx + dy * dy)

                const threshold = rect.width / 2 + nearDistance
                setIsNear(dist < threshold)

                const tiltReach = rect.width * 2
                const factor = Math.max(0, 1 - dist / tiltReach)
                tiltX.set((dx / rect.width) * faceTilt * factor)
                tiltY.set((dy / rect.height) * faceTilt * factor)
            }

            function handleLeave() {
                setIsNear(false)
                tiltX.set(0)
                tiltY.set(0)
            }

            doc.addEventListener("pointermove", handleMove)
            doc.addEventListener("mouseleave", handleLeave)

            return function () {
                doc.removeEventListener("pointermove", handleMove)
                doc.removeEventListener("mouseleave", handleLeave)
            }
        },
        [nearDistance, faceTilt, showOnMobile, isStatic]
    )

    /* ---------- idle wander ---------- */
    useEffect(
        function () {
            if (isStatic) return
            if (!idleWander) return

            let cancelled = false
            let timer = null
            let phase = 0

            function look() {
                if (cancelled) return

                const node = containerRef.current
                if (!node) {
                    timer = setTimeout(look, 900)
                    return
                }

                const idleFor = Date.now() - lastMoveAt.current
                const waitMs = idleDelay * 1000

                // Real cursor is active, so leave the eyes alone
                if (idleFor < waitMs) {
                    timer = setTimeout(look, 600)
                    return
                }

                const rect = node.getBoundingClientRect()
                if (!rect.width) {
                    timer = setTimeout(look, 900)
                    return
                }

                const cx = rect.left + rect.width / 2
                const cy = rect.top + rect.height / 2

                // A loose circle with a random wobble, so it reads as
                // curiosity rather than a mechanical sweep
                phase = phase + 0.8 + Math.random() * 1.6
                const radius = rect.width * (0.9 + Math.random() * 0.7)

                mouseX.set(cx + Math.cos(phase) * radius)
                mouseY.set(cy + Math.sin(phase) * radius * 0.6)

                timer = setTimeout(look, 1100 + Math.random() * 900)
            }

            timer = setTimeout(look, 1200)

            return function () {
                cancelled = true
                if (timer) clearTimeout(timer)
            }
        },
        [idleWander, idleDelay, isStatic]
    )

    /* ---------- blinking ---------- */
    useEffect(
        function () {
            if (isStatic) return

            if (!blinkEnabled) {
                setBlinking(false)
                return
            }

            let closeTimer = null
            let loopTimer = null
            let cancelled = false

            function scheduleBlink() {
                if (cancelled) return

                const base = isNear ? 900 : 2600
                const spread = isNear ? 700 : 2600
                const wait = base + Math.random() * spread

                loopTimer = setTimeout(function () {
                    if (cancelled) return
                    setBlinking(true)
                    closeTimer = setTimeout(function () {
                        if (cancelled) return
                        setBlinking(false)
                        scheduleBlink()
                    }, 110)
                }, wait)
            }

            scheduleBlink()

            return function () {
                cancelled = true
                if (loopTimer) clearTimeout(loopTimer)
                if (closeTimer) clearTimeout(closeTimer)
            }
        },
        [blinkEnabled, isNear, isStatic]
    )

    /* ---------- eating sequence timing ---------- */
    useEffect(
        function () {
            if (isStatic) return
            if (stage === "idle") return

            let timer = null

            if (stage === "dropping") {
                timer = setTimeout(function () {
                    setStage("chewing")
                }, 450)
            } else if (stage === "chewing") {
                timer = setTimeout(function () {
                    setStage("licking")
                }, 1500 * chewCount)
            } else if (stage === "licking") {
                timer = setTimeout(function () {
                    setStage("idle")
                }, 650)
            }

            return function () {
                if (timer) clearTimeout(timer)
            }
        },
        [stage, chewCount, isStatic]
    )

    function handleBite() {
        if (isStatic) return
        if (!eatEnabled) return
        if (stage !== "idle") return
        setBiteId(function (prev) {
            return prev + 1
        })
        setStage("dropping")
    }

    const shapeRadius =
        faceShape === "circle"
            ? "50%"
            : faceShape === "squircle"
              ? faceSize * 0.3
              : faceSize * 0.12

    const wrapperStyle = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    /* ==================================================================
       STATIC PREVIEW
       Plain divs and SVG only. No motion components, no timers,
       no listeners, no repeating animations.
    ================================================================== */
    if (isStatic) {
        const staticFaceStyle = {
            position: "relative",
            width: faceSize,
            height: faceSize,
            borderRadius: shapeRadius,
            background: faceColor,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        }

        return (
            <div style={wrapperStyle}>
                <div style={staticFaceStyle}>
                    <div
                        style={{
                            display: "flex",
                            gap: eyeGap,
                            marginBottom: faceSize * 0.05,
                        }}
                    >
                        <Eye
                            isStatic={true}
                            size={eyeSize}
                            eyeShape={eyeShape}
                            pupilSize={pupilSize}
                            eyeColor={eyeColor}
                            pupilColor={pupilColor}
                            range={followRange}
                            mouseX={mouseX}
                            mouseY={mouseY}
                            speed={followSpeed}
                        />
                        <Eye
                            isStatic={true}
                            size={eyeSize}
                            eyeShape={eyeShape}
                            pupilSize={pupilSize}
                            eyeColor={eyeColor}
                            pupilColor={pupilColor}
                            range={followRange}
                            mouseX={mouseX}
                            mouseY={mouseY}
                            speed={followSpeed}
                        />
                    </div>

                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <Nose
                            isStatic={true}
                            width={noseWidth}
                            color={noseColor}
                            nostrilColor={lineColor}
                        />

                        {dripEnabled ? (
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: noseWidth * 0.7,
                                    width: 0,
                                    height: 0,
                                }}
                            >
                                <StaticDroplet
                                    top={faceSize * 0.06}
                                    size={dripSize}
                                    color={dripColor}
                                />
                            </div>
                        ) : null}
                    </div>

                    <div style={{ marginTop: faceSize * 0.06 }}>
                        <Mouth
                            isStatic={true}
                            width={mouthWidth}
                            mouthColor={mouthColor}
                            tongueColor={tongueColor}
                            teethColor={teethColor}
                            lineColor={lineColor}
                        />
                    </div>

                    {showBlush ? (
                        <div>
                            <div
                                style={{
                                    position: "absolute",
                                    left: faceSize * 0.1,
                                    top: faceSize * 0.52,
                                    width: faceSize * 0.18,
                                    height: faceSize * 0.1,
                                    borderRadius: "50%",
                                    background: blushColor,
                                    opacity: 0.6,
                                    filter: "blur(6px)",
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    right: faceSize * 0.1,
                                    top: faceSize * 0.52,
                                    width: faceSize * 0.18,
                                    height: faceSize * 0.1,
                                    borderRadius: "50%",
                                    background: blushColor,
                                    opacity: 0.6,
                                    filter: "blur(6px)",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        )
    }

    /* ==================================================================
       LIVE
    ================================================================== */
    if (isTouch.current && !showOnMobile) {
        return null
    }

    const eating = stage !== "idle"
    const chewing = stage === "chewing"
    const licking = stage === "licking"
    const dropping = stage === "dropping"

    const dripping = dripEnabled && !isNear && !eating
    const dropletFall = faceSize * 0.26
    const showHint = hintEnabled && eatEnabled && isNear && !eating

    return (
        <div ref={containerRef} style={wrapperStyle}>
            <motion.div
                style={{
                    position: "relative",
                    width: faceSize,
                    height: faceSize,
                    borderRadius: shapeRadius,
                    background: faceColor,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    x: tiltX,
                    y: tiltY,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                }}
                animate={
                    chewing
                        ? {
                              scale: [1.04, 1.07, 1.04, 1.07, 1.04],
                              rotate: [0, 1.5, 0, -1.5, 0],
                          }
                        : { scale: isNear ? 1.04 : 1, rotate: 0 }
                }
                transition={
                    chewing
                        ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        : { type: "spring", stiffness: 260, damping: 18 }
                }
            >
                {/* ---- eyes ---- */}
                <div
                    style={{
                        display: "flex",
                        gap: eyeGap,
                        marginBottom: faceSize * 0.05,
                    }}
                >
                    <Eye
                        isStatic={false}
                        mouseX={mouseX}
                        mouseY={mouseY}
                        size={eyeSize}
                        eyeShape={eyeShape}
                        pupilSize={pupilSize}
                        eyeColor={eyeColor}
                        pupilColor={pupilColor}
                        lidColor={faceColor}
                        speed={followSpeed}
                        range={followRange}
                        blinking={blinking}
                        excited={isNear}
                        squint={chewing || licking}
                    />
                    <Eye
                        isStatic={false}
                        mouseX={mouseX}
                        mouseY={mouseY}
                        size={eyeSize}
                        eyeShape={eyeShape}
                        pupilSize={pupilSize}
                        eyeColor={eyeColor}
                        pupilColor={pupilColor}
                        lidColor={faceColor}
                        speed={followSpeed}
                        range={followRange}
                        blinking={blinking}
                        excited={isNear}
                        squint={chewing || licking}
                    />
                </div>

                {/* ---- nose with drip ---- */}
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Nose
                        isStatic={false}
                        width={noseWidth}
                        color={noseColor}
                        nostrilColor={lineColor}
                        sniff={isNear}
                    />

                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: noseWidth * 0.7,
                            width: 0,
                            height: 0,
                        }}
                    >
                        <Droplet
                            active={dripping}
                            top={0}
                            size={dripSize}
                            color={dripColor}
                            fall={dropletFall}
                            duration={dripSpeed}
                            delay={0}
                        />
                        <Droplet
                            active={dripping}
                            top={0}
                            size={dripSize * 0.8}
                            color={dripColor}
                            fall={dropletFall * 0.9}
                            duration={dripSpeed * 1.15}
                            delay={dripSpeed * 0.55}
                        />
                        <Droplet
                            active={dripping}
                            top={0}
                            size={dripSize * 0.6}
                            color={dripColor}
                            fall={dropletFall * 0.8}
                            duration={dripSpeed * 1.3}
                            delay={dripSpeed * 1.1}
                        />
                    </div>
                </div>

                {/* ---- mouth ---- */}
                <div
                    style={{
                        marginTop: faceSize * 0.06,
                        position: "relative",
                    }}
                >
                    <Mouth
                        isStatic={false}
                        open={isNear && !eating}
                        chewing={chewing}
                        licking={licking}
                        clickable={eatEnabled && stage === "idle"}
                        onClick={handleBite}
                        width={mouthWidth}
                        mouthColor={mouthColor}
                        tongueColor={tongueColor}
                        teethColor={teethColor}
                        lineColor={lineColor}
                    />

                    {/* Food dropping into the mouth */}
                    {dropping ? (
                        <motion.div
                            key={biteId}
                            initial={{
                                y: -faceSize * 0.42,
                                scale: 1,
                                opacity: 1,
                                rotate: -20,
                            }}
                            animate={{
                                y: 4,
                                scale: 0.25,
                                opacity: 0,
                                rotate: 20,
                            }}
                            transition={{ duration: 0.45, ease: "easeIn" }}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: 0,
                                marginLeft: -foodSize / 2,
                                pointerEvents: "none",
                            }}
                        >
                            <FoodShape
                                name={foodShape}
                                size={foodSize}
                                color={foodColor}
                            />
                        </motion.div>
                    ) : null}

                    {/* Crumbs flying out while chewing */}
                    {chewing ? (
                        <div>
                            <motion.div
                                initial={{ x: 0, y: 0, opacity: 1 }}
                                animate={{
                                    x: -mouthWidth * 0.55,
                                    y: mouthWidth * 0.3,
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "40%",
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: foodColor,
                                    pointerEvents: "none",
                                }}
                            />
                            <motion.div
                                initial={{ x: 0, y: 0, opacity: 1 }}
                                animate={{
                                    x: mouthWidth * 0.5,
                                    y: mouthWidth * 0.34,
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: 0.8,
                                    ease: "easeOut",
                                    delay: 0.08,
                                }}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "40%",
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    background: foodColor,
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    ) : null}
                </div>

                {/* ---- yum bubble ---- */}
                {showYum && licking ? (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.7 }}
                        animate={{ opacity: 1, y: -8, scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 16,
                        }}
                        style={{
                            position: "absolute",
                            top: -faceSize * 0.08,
                            right: -faceSize * 0.06,
                            background: "#FFFFFF",
                            color: lineColor,
                            padding: "7px 14px",
                            borderRadius: 999,
                            fontSize: Math.max(12, faceSize * 0.055),
                            fontWeight: 600,
                            fontFamily: "Inter, sans-serif",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                        }}
                    >
                        {yumText}
                    </motion.div>
                ) : null}

                {/* ---- click hint ---- */}
                {showHint ? (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 0.9, y: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            position: "absolute",
                            bottom: -faceSize * 0.14,
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: Math.max(11, faceSize * 0.045),
                            fontFamily: "Inter, sans-serif",
                            color: lineColor,
                            opacity: 0.7,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                        }}
                    >
                        {hintText}
                    </motion.div>
                ) : null}

                {/* ---- blush ---- */}
                {showBlush ? (
                    <div>
                        <motion.div
                            initial={false}
                            animate={{
                                opacity: isNear || eating ? 0.85 : 0.35,
                            }}
                            transition={{ duration: 0.25 }}
                            style={{
                                position: "absolute",
                                left: faceSize * 0.1,
                                top: faceSize * 0.52,
                                width: faceSize * 0.18,
                                height: faceSize * 0.1,
                                borderRadius: "50%",
                                background: blushColor,
                                filter: "blur(6px)",
                                pointerEvents: "none",
                            }}
                        />
                        <motion.div
                            initial={false}
                            animate={{
                                opacity: isNear || eating ? 0.85 : 0.35,
                            }}
                            transition={{ duration: 0.25 }}
                            style={{
                                position: "absolute",
                                right: faceSize * 0.1,
                                top: faceSize * 0.52,
                                width: faceSize * 0.18,
                                height: faceSize * 0.1,
                                borderRadius: "50%",
                                background: blushColor,
                                filter: "blur(6px)",
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                ) : null}
            </motion.div>
        </div>
    )
}

ReactiveFace.defaultProps = {
    faceSize: 260,
    faceShape: "circle",
    faceColor: "#F7D774",
    eyeSize: 56,
    eyeGap: 22,
    eyeShape: 1,
    eyeColor: "#FFFFFF",
    pupilSize: 26,
    pupilColor: "#1E1B16",
    followSpeed: 220,
    followRange: 13,
    blinkEnabled: true,
    noseWidth: 34,
    noseColor: "#E8B84B",
    dripEnabled: true,
    dripColor: "#8ECBF0",
    dripSize: 10,
    dripSpeed: 1.6,
    mouthWidth: 86,
    mouthColor: "#7A2B2B",
    tongueColor: "#E36A6A",
    teethColor: "#FFFFFF",
    lineColor: "#1E1B16",
    nearDistance: 90,
    faceTilt: 10,
    showBlush: true,
    blushColor: "#F08A8A",
    showOnMobile: true,
    eatEnabled: true,
    foodShape: "cookie",
    foodColor: "#D9A05B",
    foodSize: 44,
    chewCount: 2,
    showYum: true,
    yumText: "Yum!",
    hintEnabled: true,
    hintText: "click the mouth",
    idleWander: true,
    idleDelay: 3,
}

addPropertyControls(ReactiveFace, {
    faceSize: {
        type: ControlType.Number,
        title: "Face Size",
        min: 100,
        max: 600,
        step: 10,
        defaultValue: 260,
    },
    faceShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "squircle", "rounded"],
        optionTitles: ["Circle", "Squircle", "Rounded"],
        displaySegmentedControl: true,
        defaultValue: "circle",
    },
    faceColor: {
        type: ControlType.Color,
        title: "Face",
        defaultValue: "#F7D774",
    },
    nearDistance: {
        type: ControlType.Number,
        title: "React Zone",
        min: 0,
        max: 400,
        step: 10,
        defaultValue: 90,
        description:
            "How far outside the face the cursor triggers the reaction.",
    },
    faceTilt: {
        type: ControlType.Number,
        title: "Face Tilt",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 10,
    },
    idleWander: {
        type: ControlType.Boolean,
        title: "Idle Look",
        defaultValue: true,
        description: "Eyes wander when nobody moves the cursor.",
    },
    idleDelay: {
        type: ControlType.Number,
        title: "Idle After",
        min: 1,
        max: 15,
        step: 1,
        unit: "s",
        defaultValue: 3,
        hidden: function (props) {
            return !props.idleWander
        },
    },
    eatEnabled: {
        type: ControlType.Boolean,
        title: "Click to Eat",
        defaultValue: true,
        description: "Clicking the mouth makes the face chew.",
    },
    foodShape: {
        type: ControlType.Enum,
        title: "Food",
        options: ["cookie", "donut", "burger", "candy"],
        optionTitles: ["Cookie", "Donut", "Burger", "Candy"],
        defaultValue: "cookie",
        hidden: function (props) {
            return !props.eatEnabled
        },
    },
    foodColor: {
        type: ControlType.Color,
        title: "Food Colour",
        defaultValue: "#D9A05B",
        hidden: function (props) {
            return !props.eatEnabled
        },
    },
    foodSize: {
        type: ControlType.Number,
        title: "Food Size",
        min: 16,
        max: 120,
        step: 2,
        defaultValue: 44,
        hidden: function (props) {
            return !props.eatEnabled
        },
    },
    chewCount: {
        type: ControlType.Number,
        title: "Chews",
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
        defaultValue: 2,
        hidden: function (props) {
            return !props.eatEnabled
        },
    },
    showYum: {
        type: ControlType.Boolean,
        title: "Yum Bubble",
        defaultValue: true,
        hidden: function (props) {
            return !props.eatEnabled
        },
    },
    yumText: {
        type: ControlType.String,
        title: "Yum Text",
        defaultValue: "Yum!",
        hidden: function (props) {
            return !props.eatEnabled || !props.showYum
        },
    },
    hintEnabled: {
        type: ControlType.Boolean,
        title: "Click Hint",
        defaultValue: true,
        hidden: function (props) {
            return !props.eatEnabled
        },
    },
    hintText: {
        type: ControlType.String,
        title: "Hint Text",
        defaultValue: "click the mouth",
        hidden: function (props) {
            return !props.eatEnabled || !props.hintEnabled
        },
    },
    eyeSize: {
        type: ControlType.Number,
        title: "Eye Size",
        min: 16,
        max: 140,
        step: 2,
        defaultValue: 56,
    },
    eyeShape: {
        type: ControlType.Number,
        title: "Eye Height",
        min: 0.5,
        max: 1.4,
        step: 0.05,
        defaultValue: 1,
        description: "Below 1 makes narrower, sleepier eyes.",
    },
    eyeGap: {
        type: ControlType.Number,
        title: "Eye Gap",
        min: 0,
        max: 120,
        step: 2,
        defaultValue: 22,
    },
    eyeColor: {
        type: ControlType.Color,
        title: "Eye White",
        defaultValue: "#FFFFFF",
    },
    pupilSize: {
        type: ControlType.Number,
        title: "Pupil Size",
        min: 6,
        max: 80,
        step: 2,
        defaultValue: 26,
    },
    pupilColor: {
        type: ControlType.Color,
        title: "Pupil",
        defaultValue: "#1E1B16",
    },
    followSpeed: {
        type: ControlType.Number,
        title: "Follow Speed",
        min: 40,
        max: 500,
        step: 10,
        defaultValue: 220,
    },
    followRange: {
        type: ControlType.Number,
        title: "Follow Range",
        min: 2,
        max: 40,
        step: 1,
        defaultValue: 13,
    },
    blinkEnabled: {
        type: ControlType.Boolean,
        title: "Blinking",
        defaultValue: true,
    },
    noseWidth: {
        type: ControlType.Number,
        title: "Nose Size",
        min: 10,
        max: 100,
        step: 2,
        defaultValue: 34,
    },
    noseColor: {
        type: ControlType.Color,
        title: "Nose",
        defaultValue: "#E8B84B",
    },
    dripEnabled: {
        type: ControlType.Boolean,
        title: "Runny Nose",
        defaultValue: true,
        description: "Stops when the cursor comes close or while eating.",
    },
    dripColor: {
        type: ControlType.Color,
        title: "Drip",
        defaultValue: "#8ECBF0",
        hidden: function (props) {
            return !props.dripEnabled
        },
    },
    dripSize: {
        type: ControlType.Number,
        title: "Drip Size",
        min: 4,
        max: 30,
        step: 1,
        defaultValue: 10,
        hidden: function (props) {
            return !props.dripEnabled
        },
    },
    dripSpeed: {
        type: ControlType.Number,
        title: "Drip Time",
        min: 0.6,
        max: 4,
        step: 0.1,
        defaultValue: 1.6,
        hidden: function (props) {
            return !props.dripEnabled
        },
    },
    mouthWidth: {
        type: ControlType.Number,
        title: "Mouth Size",
        min: 30,
        max: 200,
        step: 2,
        defaultValue: 86,
    },
    mouthColor: {
        type: ControlType.Color,
        title: "Mouth",
        defaultValue: "#7A2B2B",
    },
    tongueColor: {
        type: ControlType.Color,
        title: "Tongue",
        defaultValue: "#E36A6A",
    },
    teethColor: {
        type: ControlType.Color,
        title: "Teeth",
        defaultValue: "#FFFFFF",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line / Detail",
        defaultValue: "#1E1B16",
    },
    showBlush: {
        type: ControlType.Boolean,
        title: "Blush",
        defaultValue: true,
    },
    blushColor: {
        type: ControlType.Color,
        title: "Blush Colour",
        defaultValue: "#F08A8A",
        hidden: function (props) {
            return !props.showBlush
        },
    },
    showOnMobile: {
        type: ControlType.Boolean,
        title: "Show on Mobile",
        defaultValue: true,
        description: "Face stays, cursor tracking is desktop only.",
    },
})
