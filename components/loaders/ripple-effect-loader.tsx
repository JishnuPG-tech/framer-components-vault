// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useMemo, type CSSProperties } from "react"

interface RippleDotProps {
  color: string
  scale?: number
  delay?: number
  size: number
  spacing: number
  radius: number
  rippleDuration: number
  rippleScale: number
}

const RippleDot = ({ color, scale = 1, delay = 0, size, spacing, radius, rippleDuration, rippleScale }: RippleDotProps) => {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        width: size,
        height: size,
        margin: `0 ${spacing}px`,
        transform: `scale(${scale})`,
      }}
    >
      {/* Main dot */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: `${radius}%`,
          position: "relative",
          zIndex: 10,
          backgroundColor: color,
        }}
      />
      
      {/* Ripple effect */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: `${radius}%`,
          zIndex: -1,
          backgroundColor: color,
        }}
        animate={{
          scale: [0, 0, rippleScale],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: rippleDuration,
          ease: "easeOut",
          repeat: Infinity,
          delay: delay,
          times: [0, 0.1, 1],
        }}
      />
    </div>
  )
}

interface RippleLoaderProps {
  colors: string[]
  size: "small" | "medium" | "large"
  backgroundColor: string
  compact: boolean
  dotSize: number
  spacing: number
  radius: number
  containerRadius: number
  rippleDuration: number
  rippleScale: number
  style?: CSSProperties
}

/**
 * Ripple Effect Loader
 * 
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 100
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function RippleLoader(props: RippleLoaderProps) {
  const {
    colors = ["#1E90FF", "#40E0D0", "#9370DB", "#FF6F61", "#98FF98"],
    size = "medium",
    backgroundColor = "#222222",
    compact = false,
    dotSize = 36,
    spacing = 6,
    radius = 50,
    containerRadius = 0,
    rippleDuration = 1.5,
    rippleScale = 3,
    style,
  } = props

  const isStatic = useIsStaticRenderer()

  // Size configurations
  const sizeConfig = useMemo(() => ({
    small: { scale: 0.7, spacing: spacing * 0.67 },
    medium: { scale: 1, spacing: spacing },
    large: { scale: 1.3, spacing: spacing * 1.33 },
  }), [spacing])
  
  const config = sizeConfig[size] || sizeConfig.medium
  
  // Scale factors for each dot (decreasing)
  const scales = [1, 0.9, 0.8, 0.7, 0.6]
  
  // Animation delays for staggered effect
  const delays = [0.2, 0.4, 0.6, 0.8, 1.0]

  // For static rendering (thumbnails, etc), show a simpler version
  if (isStatic) {
    return (
      <div 
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: containerRadius,
          ...style,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {colors.slice(0, 5).map((color, index) => (
            <div
              key={index}
              style={{
                width: dotSize * scales[index] * config.scale,
                height: dotSize * scales[index] * config.scale,
                margin: `0 ${config.spacing}px`,
                borderRadius: `${radius}%`,
                backgroundColor: color,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div 
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: containerRadius,
          ...style,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {colors.slice(0, 5).map((color, index) => (
            <RippleDot
              key={index}
              color={color}
              scale={scales[index]}
              delay={delays[index]}
              size={dotSize}
              spacing={config.spacing}
              radius={radius}
              rippleDuration={rippleDuration}
              rippleScale={rippleScale}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div 
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: containerRadius,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {colors.slice(0, 5).map((color, index) => (
          <div
            key={index}
            style={{
              margin: `0 ${config.spacing}px`,
              transform: `scale(${config.scale})`,
            }}
          >
            <RippleDot
              color={color}
              scale={scales[index]}
              delay={delays[index]}
              size={dotSize}
              spacing={0}
              radius={radius}
              rippleDuration={rippleDuration}
              rippleScale={rippleScale}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

addPropertyControls(RippleLoader, {
  colors: {
    type: ControlType.Array,
    title: "Colors",
    control: {
      type: ControlType.Color,
    },
    defaultValue: ["#1E90FF", "#40E0D0", "#9370DB", "#FF6F61", "#98FF98"],
    maxCount: 5,
  },
  size: {
    type: ControlType.Enum,
    title: "Size",
    options: ["small", "medium", "large"],
    optionTitles: ["Small", "Medium", "Large"],
    defaultValue: "medium",
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "transparent",
  },
  compact: {
    type: ControlType.Boolean,
    title: "Compact",
    defaultValue: false,
    enabledTitle: "Yes",
    disabledTitle: "No",
  },
  dotSize: {
    type: ControlType.Number,
    title: "Dot Size",
    defaultValue: 36,
    min: 10,
    max: 100,
    step: 1,
    unit: "px",
  },
  spacing: {
    type: ControlType.Number,
    title: "Dot Spacing",
    defaultValue: 6,
    min: 0,
    max: 30,
    step: 1,
    unit: "px",
  },
  radius: {
    type: ControlType.Number,
    title: "Dot Radius",
    defaultValue: 50,
    min: 0,
    max: 50,
    step: 1,
    unit: "%",
  },
  containerRadius: {
    type: ControlType.Number,
    title: "Container Radius",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
  rippleDuration: {
    type: ControlType.Number,
    title: "Ripple Speed",
    defaultValue: 1.5,
    min: 0.5,
    max: 5,
    step: 0.1,
    unit: "s",
  },
  rippleScale: {
    type: ControlType.Number,
    title: "Ripple Size",
    defaultValue: 3,
    min: 1,
    max: 10,
    step: 0.1,
  },
})