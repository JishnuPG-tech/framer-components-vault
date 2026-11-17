// Sparkling star sky background with pulsing dots in 3 sizes
import { useEffect, useState, useMemo, useRef, startTransition } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Star {
  id: number
  x: number
  y: number
  size: "small" | "medium" | "large"
  shouldPulse: boolean
  delay: number
}

interface ShootingStar {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  duration: number
}

interface StellarProps {
  backgroundColor: string
  starColor: string
  pulseColor: string
  numberOfStars: number
  pulsePercentage: number
  animationSpeed: number
  shootingStarColor: string
  shootingStarEnabled: boolean
  shootingStarInterval: number
  shootingStarLength: number
  style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Stellar(props: StellarProps) {
  const {
    backgroundColor,
    starColor,
    pulseColor,
    numberOfStars,
    pulsePercentage,
    animationSpeed,
    shootingStarColor,
    shootingStarEnabled,
    shootingStarInterval,
    shootingStarLength,
  } = props

  const isStatic = useIsStaticRenderer()
  const containerRef = useRef<HTMLDivElement>(null)
  const [stars, setStars] = useState<Star[]>([])
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 })
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([])

  const starSizes = {
    small: 2,
    medium: 3,
    large: 4,
  }

  // Track component dimensions using ResizeObserver and window resize
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        startTransition(() => {
          setDimensions({ 
            width: Math.max(rect.width, 5), 
            height: Math.max(rect.height, 5) 
          })
        })
      }
    }

    // Initial measurement
    updateDimensions()

    const cleanupFunctions: (() => void)[] = []

    // Set up ResizeObserver for element size changes
    if (typeof window !== "undefined" && window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        updateDimensions()
      })
      
      resizeObserver.observe(containerRef.current)
      cleanupFunctions.push(() => resizeObserver.disconnect())
    }

    // Set up window resize listener for viewport changes
    if (typeof window !== "undefined") {
      const handleWindowResize = () => {
        updateDimensions()
      }
      
      window.addEventListener("resize", handleWindowResize)
      cleanupFunctions.push(() => window.removeEventListener("resize", handleWindowResize))
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [])

  // Generate stars based on component size
  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = []
      for (let i = 0; i < numberOfStars; i++) {
        const sizes: Array<"small" | "medium" | "large"> = ["small", "medium", "large"]
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)]
        const shouldPulse = Math.random() < pulsePercentage / 100
        
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: randomSize,
          shouldPulse,
          delay: Math.random() * 2,
        })
      }
      return newStars
    }

    startTransition(() => {
      setStars(generateStars())
    })
  }, [numberOfStars, pulsePercentage])

  // Shooting stars effect
  useEffect(() => {
    if (!shootingStarEnabled || isStatic) return

    const createShootingStar = () => {
      const id = Date.now() + Math.random()
      const startX = Math.random() * 100
      const startY = Math.random() * 50 // Start from upper half
      const endX = startX + (Math.random() * shootingStarLength + shootingStarLength * 0.5) * (Math.random() > 0.5 ? 1 : -1)
      const endY = startY + Math.random() * (shootingStarLength * 0.5) + shootingStarLength * 0.5
      const duration = Math.random() * 1 + 1.5 // 1.5-2.5 seconds

      const newShootingStar: ShootingStar = {
        id,
        startX,
        startY,
        endX,
        endY,
        duration,
      }

      startTransition(() => {
        setShootingStars(prev => [...prev, newShootingStar])
      })

      // Remove shooting star after animation completes
      setTimeout(() => {
        startTransition(() => {
          setShootingStars(prev => prev.filter(star => star.id !== id))
        })
      }, duration * 1000 + 500)
    }

    const interval = setInterval(createShootingStar, shootingStarInterval * 1000) // Convert seconds to milliseconds

    return () => clearInterval(interval)
  }, [shootingStarEnabled, isStatic, shootingStarInterval, shootingStarLength])

  const pulseAnimation = useMemo(() => ({
    scale: [1, 1.5, 1],
    opacity: [0.7, 1, 0.7],
    backgroundColor: [starColor, pulseColor, starColor],
  }), [starColor, pulseColor])

  const pulseTransition = useMemo(() => ({
    duration: animationSpeed,
    repeat: Infinity,
    ease: "easeInOut",
  }), [animationSpeed])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minWidth: "5px",
        minHeight: "5px",
        backgroundColor,
        position: "relative",
        overflow: "hidden",
        ...props.style,
      }}
    >
      {stars.map((star) => (
        <motion.div
          key={star.id}
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: starSizes[star.size],
            height: starSizes[star.size],
            backgroundColor: starColor,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={!isStatic && star.shouldPulse ? pulseAnimation : {}}
          transition={
            !isStatic && star.shouldPulse
              ? {
                  ...pulseTransition,
                  delay: star.delay,
                }
              : {}
          }
        />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((shootingStar) => (
        <motion.div
          key={shootingStar.id}
          style={{
            position: "absolute",
            left: `${shootingStar.startX}%`,
            top: `${shootingStar.startY}%`,
            width: 2,
            height: 2,
            backgroundColor: shootingStarColor,
            borderRadius: "50%",
            boxShadow: `0 0 6px ${shootingStarColor}`,
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: `${shootingStar.endX - shootingStar.startX}vw`,
            y: `${shootingStar.endY - shootingStar.startY}vh`,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: shootingStar.duration,
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* Left fade overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "10%",
          height: "100%",
          background: `linear-gradient(to right, ${backgroundColor}, transparent)`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      
      {/* Right fade overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "10%",
          height: "100%",
          background: `linear-gradient(to left, ${backgroundColor}, transparent)`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      
      {/* Top fade overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "10%",
          background: `linear-gradient(to bottom, ${backgroundColor}, transparent)`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      
      {/* Bottom fade overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "10%",
          background: `linear-gradient(to top, ${backgroundColor}, transparent)`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </div>
  )
}

addPropertyControls(Stellar, {
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#000000",
  },
  starColor: {
    type: ControlType.Color,
    title: "Star Color",
    defaultValue: "rgba(255, 255, 255, 0.12)",
  },
  pulseColor: {
    type: ControlType.Color,
    title: "Pulse Color",
    defaultValue: "#FFFFFF",
  },
  numberOfStars: {
    type: ControlType.Number,
    title: "Number of Stars",
    defaultValue: 100,
    min: 10,
    max: 200,
    step: 5,
  },
  pulsePercentage: {
    type: ControlType.Number,
    title: "Pulse %",
    defaultValue: 10,
    min: 0,
    max: 100,
    step: 5,
    unit: "%",
  },
  animationSpeed: {
    type: ControlType.Number,
    title: "Animation Speed",
    defaultValue: 2,
    min: 0.5,
    max: 5,
    step: 0.1,
    unit: "s",
  },
  shootingStarEnabled: {
    type: ControlType.Boolean,
    title: "Shooting Stars",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
  },
  shootingStarColor: {
    type: ControlType.Color,
    title: "Shooting Star Color",
    defaultValue: "#FFFFFF",
    hidden: ({ shootingStarEnabled }) => !shootingStarEnabled,
  },
  shootingStarInterval: {
    type: ControlType.Number,
    title: "Shooting Star Interval",
    defaultValue: 5,
    min: 1,
    max: 60,
    step: 1,
    unit: "s",
    hidden: ({ shootingStarEnabled }) => !shootingStarEnabled,
  },
  shootingStarLength: {
    type: ControlType.Number,
    title: "Shooting Star Length",
    defaultValue: 50,
    min: 1,
    max: 100,
    step: 1,
    unit: "vw",
    hidden: ({ shootingStarEnabled }) => !shootingStarEnabled,
  },
})