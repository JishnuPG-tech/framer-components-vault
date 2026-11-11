// Image Wheel Component
// Displays all images in a circular wheel layout, not a carousel, with 3D tilt and push-down effect
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, useState, type CSSProperties } from "react"

interface ImageWheelProps {
    children?: React.ReactNode[]
    wheelRadius: number
    itemWidth: number
    itemHeight: number
    rotateItems?: boolean
    effectFalloff?: number
    perspective?: number
    animationDuration?: number
    animationEasing?: string
    enableTilt?: boolean
    tiltStrength?: number
    raiseAmount?: number
    style?: CSSProperties
}

/**
 * Image Wheel
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageWheel(props: ImageWheelProps) {
    const {
        children,
        wheelRadius = 140,
        itemWidth = 80,
        itemHeight = 80,
        style,
    } = props

    const items = Array.isArray(children)
        ? children
        : children
          ? [children]
          : []
    const count = items.length
    const angleStep = count > 0 ? (2 * Math.PI) / count : 0
    const rotateItems = true

    // Calculate required size
    const size = Math.ceil(wheelRadius * 2 + Math.max(itemWidth, itemHeight))
    const center = useMemo(() => ({ x: size / 2, y: size / 2 }), [size])

    // Flipping effect state
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const maxFlip = 180 // degrees (fixed)
    const maxRise = -(props.raiseAmount ?? 40) // px (now user controlled)
    // effectFalloff: 0 = only hovered, 1 = half of items affected
    const effectFalloff = props.effectFalloff ?? 0.5
    // maxDistance is half the total items when effectFalloff=1, 0 when effectFalloff=0
    const maxDistance =
        effectFalloff === 0 ? 0 : Math.floor((count / 2) * effectFalloff)
    const perspective = 1200
    const animationDuration = props.animationDuration ?? 500
    const animationEasing = props.animationEasing ?? "cubic-bezier(.22,1,.36,1)"

    // For smoothness: track mouse over the wheel and update hoveredIndex to closest item
    const wheelRef = useState(() => ({
        current: null as HTMLDivElement | null,
    }))[0]

    // 3D tilt state
    const [tilt, setTilt] = useState({ x: 0, y: 0, z: 0 })
    const maxTilt = props.tiltStrength ?? 20 // degrees
    const maxPush = 40 // px, how much the wheel "sinks" under the cursor
    const enableTilt = props.enableTilt ?? true

    function getClosestIndexFromMouse(e: React.MouseEvent) {
        if (!wheelRef.current) return null
        const rect = wheelRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const dx = mouseX - center.x
        const dy = mouseY - center.y
        const angle = Math.atan2(dy, dx)
        let idx = Math.round(((angle + Math.PI / 2) / (2 * Math.PI)) * count)
        idx = ((idx % count) + count) % count
        return idx
    }

    function handleMouseMove(e: React.MouseEvent) {
        const idx = getClosestIndexFromMouse(e)
        if (idx !== null) setHoveredIndex(idx)

        // 3D tilt with push-down effect
        if (enableTilt && wheelRef.current) {
            const rect = wheelRef.current.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            const relX = (mouseX - center.x) / (size / 2)
            const relY = (mouseY - center.y) / (size / 2)
            // Clamp between -1 and 1
            const clamp = (v: number) => Math.max(-1, Math.min(1, v))
            const cx = clamp(relX)
            const cy = clamp(relY)
            // Distance from center (0 at center, 1 at edge)
            const dist = Math.sqrt(cx * cx + cy * cy)
            // Push down is strongest at cursor, falls off radially
            const z = -maxPush * (1 - Math.max(0, Math.min(1, dist)))
            setTilt({
                x: cy * maxTilt,
                y: -cx * maxTilt,
                z,
            })
        } else if (!enableTilt) {
            setTilt({ x: 0, y: 0, z: 0 })
        }
    }
    function handleMouseLeave() {
        setHoveredIndex(null)
        setTilt({ x: 0, y: 0, z: 0 })
    }

    return (
        <div
            style={{
                ...style,
                width: style && style.width === "100%" ? "100%" : size,
                height: style && style.height === "100%" ? "100%" : size,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                overflow: "visible",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={wheelRef}
                style={{
                    width: size,
                    height: size,
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotateX(${enableTilt ? tilt.x : 0}deg) rotateY(${enableTilt ? tilt.y : 0}deg) translateZ(${enableTilt ? tilt.z : 0}px)`,
                    borderRadius: "50%",
                    background: "transparent",
                    overflow: "visible",
                    transition: "transform 0.3s cubic-bezier(.22,1,.36,1)",
                    willChange: "transform",
                    perspective,
                }}
            >
                {items.map((child, i) => {
                    const angle = i * angleStep - Math.PI / 2
                    const x =
                        center.x + wheelRadius * Math.cos(angle) - itemWidth / 2
                    const y =
                        center.y +
                        wheelRadius * Math.sin(angle) -
                        itemHeight / 2
                    // Flipping effect
                    let flip = 0
                    if (hoveredIndex !== null) {
                        // Find shortest distance in circular array
                        let d = Math.abs(i - hoveredIndex)
                        if (d > count / 2) d = count - d
                        if (d === 0) {
                            flip = maxFlip
                        } else if (d <= maxDistance) {
                            flip = maxFlip * Math.pow(effectFalloff, d)
                        }
                    }
                    const rotate = rotateItems
                        ? `rotate(${(angle * 180) / Math.PI + 90}deg)`
                        : ""
                    const flipTransform = flip ? ` rotateY(${flip}deg)` : ""
                    // Rising effect: maxRise for hovered, falloff for neighbors
                    let rise = 0
                    if (hoveredIndex !== null) {
                        let d = Math.abs(i - hoveredIndex)
                        if (d > count / 2) d = count - d
                        if (d === 0) {
                            rise = maxRise
                        } else if (d <= maxDistance) {
                            rise = maxRise * Math.pow(effectFalloff, d)
                        }
                    }
                    const riseTransform = rise ? ` translateY(${rise}px)` : ""
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: x,
                                top: y,
                                width: itemWidth,
                                height: itemHeight,
                                borderRadius: "50%",
                                overflow: "visible",
                                background: "transparent",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transform:
                                    rotate + flipTransform + riseTransform,
                                transformOrigin: "center center",
                                transition: `transform ${animationDuration}s ${animationEasing}`,
                                willChange: "transform",
                                perspective,
                            }}
                        >
                            {child &&
                            typeof child === "object" &&
                            "props" in child
                                ? // Clone the child to inject width/height style
                                  // @ts-ignore
                                  {
                                      ...child,
                                      props: {
                                          ...child.props,
                                          style: {
                                              ...(child.props?.style || {}),
                                              width: itemWidth,
                                              height: itemHeight,
                                          },
                                      },
                                  }
                                : child}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ImageWheel, {
    children: {
        type: ControlType.Slot,
        title: "Items",
    },
    wheelRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 250,
        min: 1,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "The main wheel radius",
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 80,
        min: 1,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 80,
        min: 1,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    effectFalloff: {
        type: ControlType.Number,
        title: "Falloff",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description: "How many neighboring items are affected by the hover",
    },
    raiseAmount: {
        type: ControlType.Number,
        title: "Raise",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1,
        min: 0.05,
        step: 0.01,
        unit: "s",
        displayStepper: true,
    },
    animationEasing: {
        type: ControlType.Enum,
        title: "Curves",
        defaultValue: "cubic-bezier(.22,1,.36,1)",
        options: [
            "cubic-bezier(.22,1,.36,1)",
            "ease",
            "ease-in",
            "ease-out",
            "ease-in-out",
            "linear",
        ],
        optionTitles: [
            "Smooth",
            "Ease",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Linear",
        ],
    },
    enableTilt: {
        type: ControlType.Boolean,
        title: "3D Tilt",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 10,
        min: 0,
        max: 90,
        step: 1,
        unit: "deg",
        displayStepper: true,
        hidden: ({ enableTilt }) => !enableTilt,
        description:
            "Follow the creator on [Twitter](https://x.com/Muhammad_maass)",
    },
})
