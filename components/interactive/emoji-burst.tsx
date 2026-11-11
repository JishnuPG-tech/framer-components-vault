import { useEffect, useState, useRef, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface EmojiParticle {
  id: number
  x: number
  y: number
  angle: number
  speed: number
  rotation: number
  rotationSpeed: number
  scale: number
}

interface EmojiBurstProps {
  emoji: string
  particleCount: number
  particleSize: number
  duration: number
  style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function EmojiBurst(props: EmojiBurstProps) {
  const {
    emoji,
    particleCount,
    particleSize,
    duration,
    style
  } = props

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<EmojiParticle[]>([])
  const nextId = useRef(0)
  const isStatic = useIsStaticRenderer()
  const containerRef = useRef<HTMLDivElement>(null)

  // Track mouse position within the component
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setMousePosition({ 
        x: e.clientX, 
        y: e.clientY 
      })
    }
  }

  // Handle click to create particles
  const handleClick = (e: React.MouseEvent) => {
    if (isStatic) return
    
    const newParticles: EmojiParticle[] = []
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 5
      
      newParticles.push({
        id: nextId.current++,
        x: e.clientX,
        y: e.clientY,
        angle,
        speed,
        rotation: Math.random() * 360,
        rotationSpeed: -10 + Math.random() * 20,
        scale: 0.5 + Math.random() * 0.5
      })
    }
    
    startTransition(() => {
      setParticles(prev => [...prev, ...newParticles])
      
      // Remove particles after duration
      setTimeout(() => {
        startTransition(() => {
          setParticles(prev => prev.filter(p => !newParticles.includes(p)))
        })
      }, duration)
    })
  }

  // Static preview for canvas
  if (isStatic) {
    return (
      <div 
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...style
        }}
      >
        {/* Empty container for canvas preview */}
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: "pointer",
        ...style
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}>
        <AnimatePresence>
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              initial={{
                x: particle.x,
                y: particle.y,
                scale: 0,
                rotate: 0,
                opacity: 1
              }}
              animate={{
                x: particle.x + Math.cos(particle.angle) * particle.speed * 100,
                y: particle.y + Math.sin(particle.angle) * particle.speed * 100,
                scale: particle.scale,
                rotate: particle.rotation + particle.rotationSpeed * 20,
                opacity: 0
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: duration / 1000,
                ease: "easeOut"
              }}
              style={{
                position: "absolute",
                fontSize: particleSize,
                transformOrigin: "center center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                willChange: "transform, opacity"
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

addPropertyControls(EmojiBurst, {
  emoji: {
    type: ControlType.String,
    title: "Emoji",
    defaultValue: "🎉",
  },
  particleCount: {
    type: ControlType.Number,
    title: "Particles",
    defaultValue: 15,
    min: 1,
    max: 100,
    step: 1,
  },
  particleSize: {
    type: ControlType.Number,
    title: "Size",
    defaultValue: 24,
    min: 10,
    max: 100,
    step: 1,
    unit: "px",
  },
  duration: {
    type: ControlType.Number,
    title: "Duration",
    defaultValue: 1000,
    min: 500,
    max: 5000,
    step: 100,
    unit: "ms",
  },
})