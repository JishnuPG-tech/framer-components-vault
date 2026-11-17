// Adjustable animated grid lines with pulsing opacity effect
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useMemo } from "react"

interface GridLinesProps {
  color: string
  lineWidth: number
  showHorizontal: boolean
  showVertical: boolean
  numVertical: number
  numHorizontal: number
  speed: number
  style?: React.CSSProperties
  animationOn: boolean
  reverse: boolean
  sequential: boolean
}

/**
 * Adjustable animated grid lines with pulsing traveling opacity effect
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GridLines(props: GridLinesProps) {
  const {
    color,
    lineWidth,
    showHorizontal,
    showVertical,
    numVertical,
    numHorizontal,
    speed,
    style = {},
    animationOn,
    reverse,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const isStatic = useIsStaticRenderer()

  // Fixed positioning support
  const isFixedPosition = props?.style && props.style.position === "fixed"

  // Calculate positions for lines
  const verticalLines = showVertical && numVertical > 0 ? Array.from({ length: numVertical }, (_, i) => i) : []
  const horizontalLines = showHorizontal && numHorizontal > 0 ? Array.from({ length: numHorizontal }, (_, i) => i) : []

  // Animation keyframes
  const animDuration = Math.max(0.5, speed)
  const pulseAnimName = `pulse-flow-${animDuration}-${numVertical}-${numHorizontal}`

  // Fix: Generate keyframes only with valid name (integers), and recreate if animDuration changes
  function keyframeSafeName(val) {
    // Keyframes don't like decimal points, replace with underscore
    return String(val).replace(/\./g,"_")
  }
  const safeAnimDurationStr = keyframeSafeName(animDuration)
  const pulseAnimNameSafe = `pulse-flow-${safeAnimDurationStr}-${numVertical}-${numHorizontal}`

  // Generate keyframes for traveling pulse FLOW ALONG the line, not whole-line opacity.
  function makeTravelingPulse(direction: "vertical" | "horizontal") {
    const lineID = `${pulseAnimNameSafe}-${direction}`
    if (direction === "vertical") {
      return `@keyframes ${lineID}-bg {\n`+
        `  0% { background-position: 0% ${reverse ? '200%' : '0%'}; }\n`+
        ` 100% { background-position: 0% ${reverse ? '0%' : '200%'}; }\n`+
        `}`
    } else {
      return `@keyframes ${lineID}-bg {\n`+
        `  0% { background-position: ${reverse ? '200%' : '0%'} 0%; }\n`+
        ` 100% { background-position: ${reverse ? '0%' : '200%'} 0%; }\n`+
        `}`
    }
  }

  // Dynamic style for animation
  useEffect(() => {
    if (typeof window === "undefined") return
    // Remove previous keyframe
    const existing = document.getElementById(pulseAnimNameSafe)
    if (existing) existing.remove()
    const styleTag = document.createElement("style")
    styleTag.id = pulseAnimNameSafe
    // Unique keyframes for each direction
    const verticalKF = makeTravelingPulse("vertical")
    const horizontalKF = makeTravelingPulse("horizontal")
    styleTag.innerHTML = `${verticalKF}\n${horizontalKF}`
    document.head.appendChild(styleTag)
    return () => { styleTag.remove() }
  }, [pulseAnimNameSafe, numVertical, numHorizontal])

  // For auto layout
  const w = typeof style.width === "number" ? style.width : 800
  const h = typeof style.height === "number" ? style.height : 400

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        position: isFixedPosition ? "fixed" : "relative",
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {/* Vertical Lines */}
      {verticalLines.map((_, i) => {
        const x = ((i + 0.5) / numVertical) * 100
        // The pulse phase is offset per line, and lines animate traveling along y axis
        const delay = props.sequential ? ((i / numVertical) * animDuration).toFixed(3) : "0"
        const pulseLineID = `${pulseAnimNameSafe}-vertical-bg`
        return (
          <div
            key={"v-" + i}
            style={{
              position: "absolute",
              top: 0,
              left: `${x}%`,
              width: lineWidth,
              height: "100%",
              // Gradient: flowing vertical band
              background: `linear-gradient(to bottom, transparent 0%, ${color} 23%, ${color} 42%, transparent 59%, transparent 100%)`,
              backgroundRepeat: "repeat-y",
              backgroundSize: `100% 200%`, // Pulser is 200% for smooth loop
              opacity: 1,
              borderRadius: 2,
              willChange: "background-position",
              transition: isStatic ? undefined : "none",
              animation: animationOn && !isStatic
                ? `${pulseLineID} ${animDuration}s linear infinite`
                : undefined,
              animationDelay: animationOn && !isStatic ? `-${delay}s` : undefined,
            }}
          />
        )
      })}
      {/* Horizontal Lines */}
      {horizontalLines.map((_, i) => {
        const y = ((i + 0.5) / numHorizontal) * 100
        // Phase offset for flow along x for horizontals
        const delay = props.sequential ? ((i / numHorizontal) * animDuration).toFixed(3) : "0"
        const pulseLineID = `${pulseAnimNameSafe}-horizontal-bg`
        return (
          <div
            key={"h-" + i}
            style={{
              position: "absolute",
              left: 0,
              top: `${y}%`,
              height: lineWidth,
              width: "100%",
              background: `linear-gradient(to right, transparent 0%, ${color} 23%, ${color} 42%, transparent 59%, transparent 100%)`,
              backgroundRepeat: "repeat-x",
              backgroundSize: `200% 100%`, // Pulser is 200% for smooth loop
              opacity: 1,
              borderRadius: 2,
              willChange: "background-position",
              transition: isStatic ? undefined : "none",
              animation: animationOn && !isStatic
                ? `${pulseLineID} ${animDuration}s linear infinite`
                : undefined,
              animationDelay: animationOn && !isStatic ? `-${delay}s` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

addPropertyControls(GridLines, {
  color: {
    type: ControlType.Color,
    title: "Line Color",
    defaultValue: "#23c2ff",
  },
  lineWidth: {
    type: ControlType.Number,
    title: "Line Width",
    defaultValue: 2,
    min: 1,
    max: 12,
    unit: "px",
  },
  showVertical: {
    type: ControlType.Boolean,
    title: "Vertical Lines",
    defaultValue: true,
  },
  showHorizontal: {
    type: ControlType.Boolean,
    title: "Horizontal Lines",
    defaultValue: true,
  },
  numVertical: {
    type: ControlType.Number,
    title: "# Vertical",
    defaultValue: 5,
    min: 0,
    max: 20,
    step: 1,
    hidden: ({ showVertical }) => !showVertical,
  },
  numHorizontal: {
    type: ControlType.Number,
    title: "# Horizontal",
    defaultValue: 5,
    min: 0,
    max: 20,
    step: 1,
    hidden: ({ showHorizontal }) => !showHorizontal,
  },
  speed: {
    type: ControlType.Number,
    title: "Pulse Speed",
    defaultValue: 4,
    min: 0.5,
    max: 20,
    step: 0.1,
    unit: "s",
  },
  animationOn: {
    type: ControlType.Boolean,
    title: "Animation",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
  },
  reverse: {
    type: ControlType.Boolean,
    title: "Reverse Flow",
    defaultValue: false,
    enabledTitle: "On",
    disabledTitle: "Off"
  },
  sequential: {
    type: ControlType.Boolean,
    title: "Sequential Mode",
    defaultValue: true,
    enabledTitle: "Sequential",
    disabledTitle: "Together",
  },
})
