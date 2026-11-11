// Built by OceanDevs
/**
 * @framerLockCode
 */
import * as React from "react"
import {
    motion,
    animate,
    useMotionValue,
    useTransform,
    useSpring,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const magneticSpring = { damping: 40, stiffness: 400 }
const FIXED_SIZE = 300

// ---------------- MAGNET HOOK ----------------
function useMagnet(isEnabled: boolean, power: number, area: number) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const sx = useSpring(x, magneticSpring)
    const sy = useSpring(y, magneticSpring)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (!isEnabled) {
            x.set(0)
            y.set(0)
            return
        }

        const move = (e: MouseEvent) => {
            if (!ref.current) return
            const r = ref.current.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const dx = e.clientX - cx
            const dy = e.clientY - cy
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < area) {
                const pull = (1 - dist / area) * power
                x.set(dx * pull)
                y.set(dy * pull)
            } else {
                sx.set(0)
                sy.set(0)
            }
        }

        document.addEventListener("mousemove", move)
        return () => document.removeEventListener("mousemove", move)
    }, [isEnabled, power, area])

    return { ref, sx, sy }
}

/**
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 * @framerDisableUnlink
 * @framerDisableRename
 */
// ---------------- XOrbit COMPONENT ----------------
export default function XOrbit({
    orbitPathShape = {
        src: "https://i.ibb.co/FbhhWCfp/Orbit-Border.png",
        alt: "Orbit Path",
        focalPoint: { x: 0.5, y: 0.5 },
    },
    orbitPathColor = "rgba(130,108,233,0.35)",
    orbitPathMode = true,
    orbitPathSpread = 130,
    orbitIcon01,
    orbitIcon02,
    orbitIcon03,
    orbitIcon04,
    orbitIconSize = 52,
    orbitIconRadius = 0,
    orbitIconPadding = 8,
    orbitObjectBackground = "#070417",
    orbitObjectRadius = 50,
    coreIcon,
    coreIconSize = 100,
    coreIconRadius = 0,
    coreIconPadding = 2,
    coreObjectBackground = "#070417",
    coreObjectRadius = 50,
    rotationDurationMs = 14000,
    pulseDurationMs = 2000,
    pulseColor = "#805FFF",
    ResponsiveScale = 1,
    LayerAnimation = true,
    iconsAppearingDelayMs = 150,
    magneticEnabled = true,
    magneticPower = 0.12,
    magneticArea = 180,
    showOrbitIcons = true,
}: any) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [frameSize, setFrameSize] = React.useState(FIXED_SIZE)

    React.useLayoutEffect(() => {
        if (!containerRef.current) return
        const ro = new ResizeObserver(([e]) => {
            setFrameSize(Math.min(e.contentRect.width, e.contentRect.height))
        })
        ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [])

    const autoScale = frameSize / FIXED_SIZE
    const radius = orbitPathSpread * ResponsiveScale * autoScale
    const scaledCoreSize = coreIconSize * ResponsiveScale * autoScale
    const scaledOrbitSize = orbitIconSize * ResponsiveScale * autoScale

    const defaultIcons = [
        { src: "https://i.ibb.co/MKDRvkT/Orbit-Icon01.png" },
        { src: "https://i.ibb.co/gZZd63Bg/Orbit-Icon02.png" },
        { src: "https://i.ibb.co/JwM4LyRB/Vector-1.png" },
        { src: "https://i.ibb.co/203hX6rs/Orbit-Icon04.png" },
    ]

    const icons = [
        orbitIcon01 || defaultIcons[0],
        orbitIcon02 || defaultIcons[1],
        orbitIcon03 || defaultIcons[2],
        orbitIcon04 || defaultIcons[3],
    ]

    const fixedAngles = [225, 315, 45, 135]

    // Rotation for orbit icons
    const rotation = useMotionValue(0)
    React.useEffect(() => {
        const c = animate(rotation, 360, {
            duration: rotationDurationMs / 1000,
            repeat: Infinity,
            ease: "linear",
        })
        return () => c.stop()
    }, [rotationDurationMs])

    const {
        ref: magnetRef,
        sx,
        sy,
    } = useMagnet(magneticEnabled, magneticPower, magneticArea)

    const transforms = fixedAngles.map((base) => ({
        x: useTransform(
            rotation,
            (r: number) => Math.cos(((base + r) * Math.PI) / 180) * radius
        ),
        y: useTransform(
            rotation,
            (r: number) => Math.sin(((base + r) * Math.PI) / 180) * radius
        ),
        rotate: useTransform(rotation, (r: number) => -(base + r)),
    }))

    // Pulse
    const pulseValue = useMotionValue(0)
    const pulseShadow = useTransform(
        pulseValue,
        (v) => `0 0 ${v}px ${pulseColor}`
    )
    React.useEffect(() => {
        const controls = animate(pulseValue, [10, 40, 10], {
            duration: pulseDurationMs / 1000,
            repeat: Infinity,
            ease: "easeInOut",
        })
        return () => controls.stop()
    }, [pulseDurationMs, pulseValue])

    return (
        <motion.div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: FIXED_SIZE,
                minHeight: FIXED_SIZE,
                aspectRatio: "1/1",
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "visible",
            }}
        >
            {/* Orbit Paths */}
            {[radius * 2.05, radius * 1.42].map((s, i) => (
                <motion.div
                    key={i}
                    initial={
                        LayerAnimation && !isCanvas
                            ? { opacity: 0 }
                            : { opacity: 1 }
                    }
                    animate={LayerAnimation && !isCanvas ? { opacity: 1 } : {}}
                    transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: LayerAnimation ? 0.2 + i * 0.1 : 0,
                    }}
                    style={{
                        position: "absolute",
                        width: s,
                        height: s,
                        left: `calc(50% - ${s / 2}px)`,
                        top: `calc(50% - ${s / 2}px)`,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: !orbitPathMode
                            ? `1px solid ${orbitPathColor}`
                            : "none",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    {orbitPathMode && orbitPathShape && (
                        <img
                            src={orbitPathShape.src}
                            alt={orbitPathShape.alt || "Orbit Path"}
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: orbitPathShape?.focalPoint
                                    ? `${orbitPathShape.focalPoint.x * 100}% ${orbitPathShape.focalPoint.y * 100}%`
                                    : "50% 50%",
                                pointerEvents: "none",
                                userSelect: "none",
                            }}
                        />
                    )}
                </motion.div>
            ))}

            {/* Center Core */}
            <motion.div
                ref={magnetRef}
                initial={
                    LayerAnimation && !isCanvas
                        ? { opacity: 0, filter: "blur(12px)" }
                        : {}
                }
                animate={
                    LayerAnimation && !isCanvas
                        ? { opacity: 1, filter: "blur(0px)" }
                        : {}
                }
                transition={{ duration: 0.8 }}
                style={{
                    x: sx,
                    y: sy,
                    width: scaledCoreSize,
                    height: scaledCoreSize,
                    borderRadius: `${coreObjectRadius}%`,
                    background: coreObjectBackground,
                    position: "absolute",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    pointerEvents: "auto", // core stays interactive
                    userSelect: "none",
                }}
            >
                {/* Pulse */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: `${coreObjectRadius}%`,
                        pointerEvents: "none",
                        userSelect: "none",
                        boxShadow: pulseShadow,
                    }}
                />

                <img
                    src={
                        coreIcon?.src ||
                        "https://i.ibb.co/zhWzpXLw/Core-Icon.png"
                    }
                    alt={coreIcon?.alt || "Core Icon"}
                    draggable={false}
                    style={{
                        width: scaledCoreSize - coreIconPadding * 2,
                        height: scaledCoreSize - coreIconPadding * 2,
                        objectFit: "cover",
                        borderRadius: `${coreIconRadius}%`,
                        zIndex: 1,
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                />
            </motion.div>

            {/* Orbit Icons */}
            {showOrbitIcons &&
                icons.map((icon, i) => {
                    const t = transforms[i]
                    return (
                        <motion.div
                            key={i}
                            initial={
                                LayerAnimation && !isCanvas
                                    ? { scale: 0, opacity: 0 }
                                    : { scale: 1, opacity: 1 }
                            }
                            animate={
                                LayerAnimation && !isCanvas
                                    ? { scale: 1, opacity: 1 }
                                    : {}
                            }
                            transition={{
                                duration: 0.6,
                                ease: "easeOut",
                                delay: LayerAnimation
                                    ? 0.6 + i * (iconsAppearingDelayMs / 1000)
                                    : 0,
                            }}
                            style={{
                                x: t.x,
                                y: t.y,
                                rotate: t.rotate,
                                width: scaledOrbitSize,
                                height: scaledOrbitSize,
                                borderRadius: `${orbitObjectRadius}%`,
                                background: orbitObjectBackground,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                pointerEvents: "none",
                                userSelect: "none",
                            }}
                        >
                            <img
                                src={icon?.src}
                                alt={icon?.alt || `Orbit Icon ${i + 1}`}
                                draggable={false}
                                style={{
                                    width:
                                        scaledOrbitSize - orbitIconPadding * 2,
                                    height:
                                        scaledOrbitSize - orbitIconPadding * 2,
                                    objectFit: "cover",
                                    borderRadius: `${orbitIconRadius}%`,
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                            />
                        </motion.div>
                    )
                })}
        </motion.div>
    )
}

XOrbit.displayName = "XOrbit"

// ---------------- PROPERTY CONTROLS ----------------
addPropertyControls(XOrbit, {
    orbitPathMode: { type: ControlType.Boolean, defaultValue: true },
    orbitPathShape: {
        type: ControlType.ResponsiveImage,
        hidden: (props) => !props.orbitPathMode,
        title: "Orbit Path Image",
    },
    orbitPathColor: {
        type: ControlType.Color,
        defaultValue: "#898FD0",
        hidden: (props) => props.orbitPathMode,
    },

    orbitPathSpread: {
        type: ControlType.Number,
        defaultValue: 120,
        min: 52,
        max: 200,
    },
    showOrbitIcons: {
        type: ControlType.Boolean,
        title: "Show Orbit Icons",
        defaultValue: true,
    },
    orbitObjectBackground: {
        type: ControlType.Color,
        defaultValue: "#120E24",
        hidden: (props) => !props.showOrbitIcons,
    },

    orbitObjectRadius: {
        type: ControlType.Number,
        defaultValue: 50,
        min: 0,
        max: 100,
        hidden: (props) => !props.showOrbitIcons,
    },

    orbitIcon01: {
        type: ControlType.ResponsiveImage,
        hidden: (props) => !props.showOrbitIcons,
    },
    orbitIcon02: {
        type: ControlType.ResponsiveImage,
        hidden: (props) => !props.showOrbitIcons,
    },
    orbitIcon03: {
        type: ControlType.ResponsiveImage,
        hidden: (props) => !props.showOrbitIcons,
    },
    orbitIcon04: {
        type: ControlType.ResponsiveImage,
        hidden: (props) => !props.showOrbitIcons,
    },
    orbitIconSize: {
        type: ControlType.Number,
        defaultValue: 50,
        min: 24,
        max: 200,
        hidden: (props) => !props.showOrbitIcons,
    },
    orbitIconPadding: {
        type: ControlType.Number,
        defaultValue: 8,
        min: 0,
        max: 100,
        hidden: (props) => !props.showOrbitIcons,
    },

    orbitIconRadius: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 100,
        hidden: (props) => !props.showOrbitIcons,
    },
    coreObjectBackground: { type: ControlType.Color, defaultValue: "#826CE9" },
    coreObjectRadius: {
        type: ControlType.Number,
        defaultValue: 50,
        min: 0,
        max: 100,
    },
    coreIcon: { type: ControlType.ResponsiveImage, title: "Center Icon" },
    coreIconSize: {
        type: ControlType.Number,
        defaultValue: 100,
        min: 40,
        max: 300,
    },
    coreIconPadding: {
        type: ControlType.Number,
        defaultValue: 15,
        min: -50,
        max: 100,
    },
    coreIconRadius: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 100,
    },

    pulseColor: { type: ControlType.Color, defaultValue: "#826CE9" },
    pulseDurationMs: {
        type: ControlType.Number,
        title: "Pulse Duration (ms)",
        defaultValue: 2000,
        min: 200,
        max: 10000,
        step: 50,
    },
    rotationDurationMs: {
        type: ControlType.Number,
        title: "Rotation Duration (ms)",
        defaultValue: 14000,
        min: 1000,
        max: 60000,
        step: 100,
    },

    LayerAnimation: { type: ControlType.Boolean, defaultValue: true },
    iconsAppearingDelayMs: {
        type: ControlType.Number,
        title: "Icons Appearing Delay (ms)",
        defaultValue: 150,
        min: 0,
        max: 1000,
        step: 10,
        hidden: (props) => !props.LayerAnimation,
    },
    magneticEnabled: {
        type: ControlType.Boolean,
        title: "Magnetic Center",
        defaultValue: true,
    },
    magneticPower: {
        type: ControlType.Number,
        title: "Magnet Power",
        defaultValue: 0.12,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        hidden: (props) => !props.magneticEnabled,
    },
    magneticArea: {
        type: ControlType.Number,
        title: "Magnet Area",
        defaultValue: 180,
        min: 40,
        max: 300,
        hidden: (props) => !props.magneticEnabled,
    },
    ResponsiveScale: {
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.5,
        max: 10,
        step: 0.1,
        description:
            "Elevating and served by ⋆ [OceanDevs](https://www.framer.com)",
    },
})
