// Snowfall component with customizable snow particles using framer-motion
import { motion } from "framer-motion"
import { useState, useEffect, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SnowflakeProps {
  x: number
  delay: number
  duration: number
  size: number
  opacity: number
  color: string
  wind: number
  flakeStyle: "circle" | "star" | "snowflake"
}

function Snowflake({ x, delay, duration, size, opacity, color, wind, flakeStyle }: SnowflakeProps) {
  const renderFlake = () => {
    if (flakeStyle === "star") {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    } else if (flakeStyle === "snowflake") {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 1l1.5 4.5L18 7l-4.5 1.5L15 13l-3-3-3 3 1.5-4.5L6 7l4.5-1.5L12 1z"/>
          <path d="M12 11l4.5-1.5L18 17l-4.5-1.5L12 23l-1.5-4.5L6 17l4.5-1.5L12 11z"/>
          <circle cx="12" cy="12" r="1"/>
        </svg>
      )
    } else {
      return (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: "50%",
          }}
        />
      )
    }
  }

  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: -10,
        opacity,
        pointerEvents: "none",
      }}
      initial={{ y: -10, rotate: 0 }}
      animate={{
        y: "100vh",
        rotate: 360,
        x: wind * duration,
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {renderFlake()}
    </motion.div>
  )
}

interface SnowfallProps {
  snowflakeCount: number
  snowflakeColor: string
  minSize: number
  maxSize: number
  minSpeed: number
  maxSpeed: number
  minOpacity: number
  maxOpacity: number
  wind: number
  flakeStyle: "circle" | "star" | "snowflake" | "random"
  style?: React.CSSProperties
}

/**
 * Snowfall Effect
 * 
 * Creates an animated snowfall effect with customizable particles
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Snowfall(props: SnowfallProps) {
  const {
    snowflakeCount = 50,
    snowflakeColor = "#FFFFFF",
    minSize = 2,
    maxSize = 8,
    minSpeed = 3,
    maxSpeed = 8,
    minOpacity = 0.3,
    maxOpacity = 1,
    wind = 0,
    flakeStyle = "random",
  } = props

  const isStatic = useIsStaticRenderer()
  const [snowflakes, setSnowflakes] = useState<SnowflakeProps[]>([])

  const generateSnowflakes = useMemo(() => {
    return Array.from({ length: snowflakeCount }, (_, i) => ({
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: minSpeed + Math.random() * (maxSpeed - minSpeed),
      size: minSize + Math.random() * (maxSize - minSize),
      opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
      color: snowflakeColor,
      wind: wind,
      flakeStyle: flakeStyle === "random" 
        ? (["circle", "star", "snowflake"] as const)[Math.floor(Math.random() * 3)]
        : flakeStyle,
    }))
  }, [snowflakeCount, minSize, maxSize, minSpeed, maxSpeed, minOpacity, maxOpacity, snowflakeColor, wind, flakeStyle])

  useEffect(() => {
    startTransition(() => {
      setSnowflakes(generateSnowflakes)
    })
  }, [generateSnowflakes])

  if (isStatic) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: "24px",
            fontWeight: "bold",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          ❄️ Snowfall Effect ❄️
        </div>
        {Array.from({ length: Math.min(snowflakeCount, 20) }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: minSize + Math.random() * (maxSize - minSize),
              height: minSize + Math.random() * (maxSize - minSize),
              backgroundColor: snowflakeColor,
              borderRadius: "50%",
              opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        ...props.style,
      }}
    >
      {snowflakes.map((snowflake, index) => (
        <Snowflake key={index} {...snowflake} />
      ))}
    </div>
  )
}

addPropertyControls(Snowfall, {
  snowflakeCount: {
    type: ControlType.Number,
    title: "Snowflake Count",
    defaultValue: 50,
    min: 10,
    max: 200,
    step: 1,
  },
  snowflakeColor: {
    type: ControlType.Color,
    title: "Snowflake Color",
    defaultValue: "#FFFFFF",
  },
  flakeStyle: {
    type: ControlType.Enum,
    title: "Flake Style",
    defaultValue: "random",
    options: ["random", "circle", "star", "snowflake"],
    optionTitles: ["Random", "Circle", "Star", "Snowflake"],
    displaySegmentedControl: true,
  },
  minSize: {
    type: ControlType.Number,
    title: "Min Size",
    defaultValue: 2,
    min: 1,
    max: 20,
    step: 1,
    unit: "px",
  },
  maxSize: {
    type: ControlType.Number,
    title: "Max Size",
    defaultValue: 8,
    min: 1,
    max: 20,
    step: 1,
    unit: "px",
  },
  minSpeed: {
    type: ControlType.Number,
    title: "Min Speed",
    defaultValue: 3,
    min: 1,
    max: 20,
    step: 0.5,
    unit: "s",
  },
  maxSpeed: {
    type: ControlType.Number,
    title: "Max Speed",
    defaultValue: 8,
    min: 1,
    max: 20,
    step: 0.5,
    unit: "s",
  },
  minOpacity: {
    type: ControlType.Number,
    title: "Min Opacity",
    defaultValue: 0.3,
    min: 0,
    max: 1,
    step: 0.1,
  },
  maxOpacity: {
    type: ControlType.Number,
    title: "Max Opacity",
    defaultValue: 1,
    min: 0,
    max: 1,
    step: 0.1,
  },
  wind: {
    type: ControlType.Number,
    title: "Wind",
    defaultValue: 0,
    min: -100,
    max: 100,
    step: 1,
    unit: "px",
  },
})