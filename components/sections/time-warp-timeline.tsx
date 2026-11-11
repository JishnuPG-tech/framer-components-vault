/**
 * Time Warp Timeline - A cinematic sci-fi timeline component
 * Features glowing energy beam, glassmorphism cards, particle effects,
 * holographic text, magnetic hover, and time distortion animations.
 */
import { useEffect, useRef, useState, useMemo, useCallback, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView } from "framer-motion"

// Types
interface TimelineItem {
  id: number
  year: string
  title: string
  description: string
  color: string
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

interface TimeWarpTimelineProps {
  title: string
  subtitle: string
  energyColor: string
  glowColor: string
  cardColor: string
  cardOpacity: number
  titleFont: any
  contentFont: any
  yearFont: any
  cardCount: number
  particleDensity: number
  beamIntensity: number
  enableParallax: boolean
  magneticStrength: number
  blurAmount: number
  enableFog: boolean
  enablePulse: boolean
  rippleColor: string
  cardSpacing: number
  startYear: number
  style?: CSSProperties
}

// Default data generator
const generateTimelineData = (count: number, baseColor: string, startYear: number): TimelineItem[] => {
  const titles = [
    "Neural Link Established",
    "Quantum Computing Breakthrough",
    "Interstellar Colonization",
    "Digital Consciousness Transfer",
    "Universal Translation Matrix",
    "Time Dilation Control",
    "Dimensional Gateway Open",
    "Singularity Achieved"
  ]
  const descriptions = [
    "First successful brain-computer interface connects human consciousness to the digital realm.",
    "Qubit stability reaches 99.999%, enabling unlimited parallel processing capabilities.",
    "Human settlements established on Kepler-186f with sustainable eco-systems.",
    "First human consciousness successfully uploaded to quantum storage matrix.",
    "Instant communication across all known languages and alien dialects achieved.",
    "Controlled time manipulation allows for temporal exploration without paradox.",
    "Stable wormholes connect Earth to 12 distant galaxies simultaneously.",
    "Humanity merges with artificial superintelligence, transcending biological limitations."
  ]
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    year: String(startYear + i * 20),
    title: titles[i % titles.length],
    description: descriptions[i % descriptions.length],
    color: baseColor
  }))
}

// Generate particles
const generateParticles = (density: number): Particle[] => {
  return Array.from({ length: density }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.6 + 0.2
  }))
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TimeWarpTimeline(props: TimeWarpTimelineProps) {
  const {
    title = "CHRONOS ARCHIVE",
    subtitle = "Navigate through the streams of time",
    energyColor = "#00f0ff",
    glowColor = "#7000ff",
    cardColor = "#0a0a1a",
    cardOpacity = 0.7,
    titleFont = {
      fontSize: "48px",
      variant: "Bold",
      letterSpacing: "0.3em",
      lineHeight: "1.2em",
    },
    contentFont = {
      fontSize: "15px",
      variant: "Medium",
      letterSpacing: "0.02em",
      lineHeight: "1.6em",
    },
    yearFont = {
      fontSize: "64px",
      variant: "Bold",
      letterSpacing: "0.05em",
      lineHeight: "1em",
    },
    cardCount = 6,
    particleDensity = 30,
    beamIntensity = 1,
    enableParallax = true,
    magneticStrength = 0.3,
    blurAmount = 8,
    enableFog = true,
    enablePulse = true,
    rippleColor = "#00f0ff",
    cardSpacing = 400,
    startYear = 2025,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const isStatic = useIsStaticRenderer()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const timelineData = useMemo(() => generateTimelineData(cardCount, energyColor, startYear), [cardCount, energyColor, startYear])
  const particles = useMemo(() => generateParticles(particleDensity), [particleDensity])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  // Scroll progress for time warp effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !enableParallax) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    
    mouseX.set(x * magneticStrength * 20)
    mouseY.set(y * magneticStrength * 20)
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [enableParallax, magneticStrength, mouseX, mouseY])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newRipple = { id: Date.now(), x, y }
    setRipples(prev => [...prev, newRipple])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 1000)
  }, [])

  // Generate beam segments
  const beamSegments = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => i)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #050510 0%, #0a0a20 50%, #050510 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "100px 0",
        ...props.style
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Animated Fog Background */}
      {enableFog && !isStatic && (
        <div style={fogContainerStyle}>
          <motion.div
            style={fogStyle}
            animate={{
              x: [0, 100, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            style={{ ...fogStyle, top: "30%" }}
            animate={{
              x: [0, -100, 0],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            style={{ ...fogStyle, top: "60%" }}
            animate={{
              x: [0, 80, 0],
              opacity: [0.1, 0.18, 0.1]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      )}

      {/* Neon Particles */}
      {!isStatic && particles.map((particle) => (
        <motion.div
          key={particle.id}
          style={{
            position: "absolute",
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: energyColor,
            borderRadius: "50%",
            boxShadow: `0 0 ${particle.size * 4}px ${energyColor}, 0 0 ${particle.size * 8}px ${glowColor}`,
            pointerEvents: "none"
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [particle.opacity, particle.opacity * 2, particle.opacity],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          style={{
            position: "absolute",
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            borderRadius: "50%",
            border: `2px solid ${rippleColor}`,
            boxShadow: `0 0 20px ${rippleColor}`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none"
          }}
          animate={{
            width: [0, 300],
            height: [0, 300],
            opacity: [1, 0]
          }}
          transition={{
            duration: 1,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Header Section */}
      <motion.div
        style={headerStyle}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          style={{
            ...titleFont,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: energyColor,
            textShadow: `0 0 20px ${energyColor}, 0 0 40px ${glowColor}`,
            margin: 0,
            textAlign: "center",
            background: `linear-gradient(90deg, ${energyColor}, #fff, ${energyColor})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundSize: "200% auto"
          }}
          animate={!isStatic ? {
            backgroundPosition: ["0% center", "200% center"]
          } : {}}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {title}
        </motion.h1>
        <p
          style={{
            ...contentFont,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            marginTop: "16px",
            letterSpacing: "0.2em"
          }}
        >
          {subtitle}
        </p>
      </motion.div>

      {/* Timeline Cards */}
      <div style={{ position: "relative", marginTop: "100px" }}>
        {timelineData.map((item, index) => (
          <TimelineCard
            key={item.id}
            item={item}
            index={index}
            totalCards={timelineData.length}
            cardColor={cardColor}
            cardOpacity={cardOpacity}
            energyColor={energyColor}
            glowColor={glowColor}
            contentFont={contentFont}
            yearFont={yearFont}
            mouseX={enableParallax ? smoothMouseX : null}
            mouseY={enableParallax ? smoothMouseY : null}
            isHovered={hoveredCard === index}
            onHover={() => setHoveredCard(index)}
            onLeave={() => setHoveredCard(null)}
            scrollYProgress={scrollYProgress}
            cardSpacing={cardSpacing}
            blurAmount={blurAmount}
            isStatic={isStatic}
          />
        ))}
      </div>

      {/* Electric Pulse Waves */}
      {enablePulse && !isStatic && (
        <ElectricPulses energyColor={energyColor} glowColor={glowColor} />
      )}

      {/* Motion Blur Trail Effect */}
      <div style={blurTrailStyle} />
    </div>
  )
}

// Timeline Card Component
interface TimelineCardProps {
  item: TimelineItem
  index: number
  totalCards: number
  cardColor: string
  cardOpacity: number
  energyColor: string
  glowColor: string
  contentFont: any
  yearFont: any
  mouseX: any
  mouseY: any
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  scrollYProgress: any
  cardSpacing: number
  blurAmount: number
  isStatic: boolean
}

function TimelineCard({
  item,
  index,
  cardColor,
  cardOpacity,
  energyColor,
  glowColor,
  contentFont,
  yearFont,
  mouseX,
  mouseY,
  isHovered,
  onHover,
  onLeave,
  scrollYProgress,
  cardSpacing,
  blurAmount,
  isStatic
}: TimelineCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true, margin: "-100px" })
  const isLeft = index % 2 === 0
  
  // Parallax transforms
  const parallaxX = mouseX ? useTransform(mouseX, [-20, 20], isLeft ? [-15, 15] : [15, -15]) : null
  const parallaxY = mouseY ? useTransform(mouseY, [-20, 20], [-10, 10]) : null
  
  // Scroll-based transforms for time distortion
  const cardY = useTransform(
    scrollYProgress,
    [0, 1],
    [100 + index * 50, -100 - index * 50]
  )
  
  const cardScale = useTransform(
    scrollYProgress,
    [0, 0.3 + index * 0.1, 0.7 + index * 0.05],
    [0.8, 1, 0.95]
  )
  
  const cardBlur = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [blurAmount, 0, blurAmount]
  )
  
  const cardRotate = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    isLeft ? [5, 0, -5] : [-5, 0, 5]
  )

  return (
    <motion.div
      ref={cardRef}
      style={{
        display: "flex",
        justifyContent: isLeft ? "flex-start" : "flex-end",
        padding: "0 10%",
        marginBottom: cardSpacing,
        position: "relative",
        y: cardY
      }}
    >
      {/* Connection line to beam */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          [isLeft ? "left" : "right"]: "50%",
          width: "15%",
          height: "2px",
          background: `linear-gradient(${isLeft ? 90 : 270}deg, ${energyColor}, transparent)`,
          boxShadow: `0 0 10px ${energyColor}`,
          transform: "translateY(-50%)"
        }}
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />

      {/* Timeline node */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: energyColor,
          boxShadow: `0 0 30px ${energyColor}, 0 0 60px ${glowColor}`,
          transform: "translate(-50%, -50%)",
          zIndex: 10
        }}
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      />

      {/* Card */}
      <motion.div
        style={{
          width: "40%",
          minWidth: "300px",
          maxWidth: "500px",
          background: `${cardColor}${Math.round(cardOpacity * 255).toString(16).padStart(2, '0')}`,
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "32px",
          border: `1px solid ${energyColor}30`,
          boxShadow: isHovered 
            ? `0 25px 50px rgba(0,0,0,0.5), 0 0 40px ${energyColor}40, inset 0 1px 0 rgba(255,255,255,0.1)`
            : `0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
          position: "relative",
          overflow: "hidden",
          x: parallaxX || 0,
          y: parallaxY || 0,
          scale: cardScale,
          rotateY: cardRotate,
          filter: isStatic ? "none" : useTransform(cardBlur, (v: number) => `blur(${v}px)`)
        }}
        initial={{ opacity: 0, x: isLeft ? -100 : 100, filter: `blur(${blurAmount}px)` }}
        animate={isInView ? { 
          opacity: 1, 
          x: 0, 
          filter: "blur(0px)" 
        } : { 
          opacity: 0, 
          x: isLeft ? -100 : 100,
          filter: `blur(${blurAmount}px)`
        }}
        transition={{ 
          duration: 0.8, 
          delay: index * 0.15,
          ease: [0.16, 1, 0.3, 1]
        }}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        whileHover={!isStatic ? { 
          scale: 1.02,
          transition: { duration: 0.3 }
        } : {}}
      >
        {/* Holographic overlay */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${energyColor}10 0%, transparent 50%, ${glowColor}10 100%)`,
            opacity: 0,
            pointerEvents: "none"
          }}
          animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Scan line effect */}
        {!isStatic && (
          <motion.div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${energyColor}, transparent)`,
              boxShadow: `0 0 10px ${energyColor}`
            }}
            animate={{
              top: ["0%", "100%", "0%"]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}

        {/* Year */}
        <motion.span
          style={{
            ...yearFont,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: energyColor,
            textShadow: `0 0 20px ${energyColor}60`,
            display: "block",
            marginBottom: "16px"
          }}
        >
          {item.year}
        </motion.span>

        {/* Title */}
        <h3
          style={{
            ...contentFont,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "20px",
            color: "#ffffff",
            margin: "0 0 12px 0",
            fontWeight: 600
          }}
        >
          {item.title}
        </h3>

        {/* Description */}
        <p
          style={{
            ...contentFont,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "rgba(255,255,255,0.7)",
            margin: 0
          }}
        >
          {item.description}
        </p>

        {/* Bottom glow */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${energyColor}, transparent)`,
            boxShadow: `0 0 20px ${energyColor}`
          }}
        />
      </motion.div>
    </motion.div>
  )
}

// Electric Pulses Component
function ElectricPulses({ energyColor, glowColor }: { energyColor: string; glowColor: string }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: `${20 + i * 15}%`,
            width: 100,
            height: 100,
            border: `1px solid ${energyColor}40`,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none"
          }}
          animate={{
            scale: [1, 3, 1],
            opacity: [0.5, 0, 0.5],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Horizontal energy waves */}
      {Array.from({ length: 3 }, (_, i) => (
        <motion.div
          key={`wave-${i}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${energyColor}, transparent)`,
            top: `${30 + i * 25}%`,
            boxShadow: `0 0 20px ${energyColor}, 0 0 40px ${glowColor}`,
            pointerEvents: "none"
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scaleY: [1, 3, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </>
  )
}

// Styles
const fogContainerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none"
}

const fogStyle: CSSProperties = {
  position: "absolute",
  width: "200%",
  height: "300px",
  background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.1), transparent)",
  filter: "blur(40px)",
  top: 0
}

const beamContainerStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  top: 0,
  bottom: 0,
  width: 4,
  transform: "translateX(-50%)",
  zIndex: 5,
  pointerEvents: "none"
}

const coreBeamStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: 0,
  bottom: 0,
  width: 4,
  transform: "translateX(-50%)",
  borderRadius: 2
}

const pulseRingStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "1px solid",
  transform: "translate(-50%, -50%)"
}

const headerStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: "80px",
  position: "relative",
  zIndex: 10
}

const blurTrailStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "linear-gradient(180deg, rgba(5,5,16,0.5) 0%, transparent 50%, rgba(5,5,16,0.5) 100%)",
  pointerEvents: "none",
  zIndex: 1
}

// Property Controls
addPropertyControls(TimeWarpTimeline, {
  title: {
    type: ControlType.String,
    title: "Title",
    defaultValue: "CHRONOS ARCHIVE"
  },
  subtitle: {
    type: ControlType.String,
    title: "Subtitle",
    defaultValue: "Navigate through the streams of time"
  },
  energyColor: {
    type: ControlType.Color,
    title: "Energy Color",
    defaultValue: "#00f0ff"
  },
  glowColor: {
    type: ControlType.Color,
    title: "Glow Color",
    defaultValue: "#7000ff"
  },
  cardColor: {
    type: ControlType.Color,
    title: "Card Color",
    defaultValue: "#0a0a1a"
  },
  cardOpacity: {
    type: ControlType.Number,
    title: "Card Opacity",
    defaultValue: 0.7,
    min: 0,
    max: 1,
    step: 0.1
  },
  titleFont: {
    type: ControlType.Font,
    title: "Title Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: "48px",
      variant: "Bold",
      letterSpacing: "0.3em",
      lineHeight: "1.2em"
    }
  },
  contentFont: {
    type: ControlType.Font,
    title: "Content Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: "15px",
      variant: "Medium",
      letterSpacing: "0.02em",
      lineHeight: "1.6em"
    }
  },
  yearFont: {
    type: ControlType.Font,
    title: "Year Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: "64px",
      variant: "Bold",
      letterSpacing: "0.05em",
      lineHeight: "1em"
    }
  },
  cardCount: {
    type: ControlType.Number,
    title: "Card Count",
    defaultValue: 6,
    min: 2,
    max: 10,
    step: 1,
    displayStepper: true
  },
  particleDensity: {
    type: ControlType.Number,
    title: "Particles",
    defaultValue: 30,
    min: 0,
    max: 100,
    step: 5
  },
  beamIntensity: {
    type: ControlType.Number,
    title: "Beam Intensity",
    defaultValue: 1,
    min: 0.5,
    max: 3,
    step: 0.1
  },
  enableParallax: {
    type: ControlType.Boolean,
    title: "Parallax",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off"
  },
  magneticStrength: {
    type: ControlType.Number,
    title: "Magnetic Strength",
    defaultValue: 0.3,
    min: 0,
    max: 1,
    step: 0.1
  },
  blurAmount: {
    type: ControlType.Number,
    title: "Blur Amount",
    defaultValue: 8,
    min: 0,
    max: 20,
    step: 1
  },
  enableFog: {
    type: ControlType.Boolean,
    title: "Fog Effect",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off"
  },
  enablePulse: {
    type: ControlType.Boolean,
    title: "Pulse Waves",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off"
  },
  rippleColor: {
    type: ControlType.Color,
    title: "Ripple Color",
    defaultValue: "#00f0ff"
  },
  cardSpacing: {
    type: ControlType.Number,
    title: "Card Spacing",
    defaultValue: 400,
    min: 200,
    max: 800,
    step: 50,
    unit: "px"
  },
  startYear: {
    type: ControlType.Number,
    title: "Start Year",
    defaultValue: 2025,
    min: 1900,
    max: 3000,
    step: 1,
    displayStepper: true
  }
})

TimeWarpTimeline.displayName = "Time Warp Timeline"
