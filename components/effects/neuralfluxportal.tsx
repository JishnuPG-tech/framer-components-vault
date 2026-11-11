import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Neural Flux Portal - Premium Interactive Showcase Card

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

const colors = {
  primary: "#00D4FF",
  secondary: "#7B61FF",
  accent: "#FF2D78",
  dark: "#0A0A0F",
  darker: "#050507",
  glass: "rgba(255, 255, 255, 0.03)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  glow: "rgba(0, 212, 255, 0.5)",
}

const gradients = {
  mesh: [
    "radial-gradient(ellipse at 20% 30%, rgba(0, 212, 255, 0.15) 0%, transparent 50%)",
    "radial-gradient(ellipse at 80% 20%, rgba(123, 97, 255, 0.12) 0%, transparent 50%)",
    "radial-gradient(ellipse at 60% 80%, rgba(255, 45, 120, 0.1) 0%, transparent 50%)",
    "radial-gradient(ellipse at 30% 70%, rgba(0, 212, 255, 0.08) 0%, transparent 50%)",
  ].join(", "),
}

// Particle System
function Particles({ count = 20, isHovered = false, buttonColors }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        borderRadius: "inherit",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: `linear-gradient(135deg, ${buttonColors.primary}, ${buttonColors.secondary})`,
            borderRadius: "50%",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: "blur(0.5px)",
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Floating Light Streaks
function LightStreaks({ buttonColors }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        borderRadius: "inherit",
      }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: "2px",
            height: "60px",
            background: `linear-gradient(to bottom, transparent, ${buttonColors.primary}, transparent)`,
            left: `${20 + i * 30}%`,
            top: "-60px",
            opacity: 0.6,
            filter: "blur(1px)",
          }}
          animate={{
            top: ["-60px", "calc(100% + 60px)"],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 2,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

// Magnetic Button Component
function MagneticButton({ children, primary = false, onClick, buttonColors, ...props }: { 
  children: any
  primary?: boolean
  onClick?: any
  buttonColors: { primary: string; secondary: string }
  [x: string]: any
}) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.3)
    y.set((e.clientY - centerY) * 0.3)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      style={{
        x: springX,
        y: springY,
        padding: "14px 32px",
        borderRadius: "12px",
        border: primary ? "none" : `1px solid ${colors.glassBorder}`,
        background: primary
          ? `linear-gradient(135deg, ${buttonColors.primary}, ${buttonColors.secondary})`
          : "rgba(255, 255, 255, 0.05)",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      <motion.span
        style={{
          position: "absolute",
          inset: 0,
          background: primary
            ? `linear-gradient(135deg, ${buttonColors.secondary}, ${buttonColors.primary})`
            : "rgba(255, 255, 255, 0.1)",
          opacity: 0,
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </motion.button>
  )
}

// Icon Dock Item with Bounce
function IconDockItem({ icon: Icon, delay = 0, buttonColors }) {
  return (
    <motion.div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: `1px solid ${colors.glassBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "rgba(255, 255, 255, 0.6)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -8,
        background: `${buttonColors.primary}20`,
        borderColor: `${buttonColors.primary}50`,
        color: buttonColors.primary,
        boxShadow: `0 0 20px ${buttonColors.primary}50`,
      }}
      whileTap={{ scale: 0.95 }}
    >
      {Icon}
    </motion.div>
  )
}

// Animated Border
function AnimatedBorder() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        padding: "1px",
        background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`,
        backgroundSize: "300% 100%",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "gradientFlow 3s linear infinite",
        opacity: 0.5,
      }}
    >
      <style>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </div>
  )
}

// Main Component
export default function NeuralFluxPortal(props) {
  const {
    title = "Neural Flux",
    subtitle = "Next-Generation AI Interface",
    description = "Experience the future of human-computer interaction with our revolutionary neural network technology.",
    primaryCta = "Launch Portal",
    secondaryCta = "Learn More",
    showParticles = true,
    showGlow = true,
    ...rest
  } = props

  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [buttonColors, setButtonColors] = useState({
    primary: colors.primary,
    secondary: colors.secondary,
  })

  const colorSets = [
    { primary: "#00D4FF", secondary: "#7B61FF" },
    { primary: "#FF2D78", secondary: "#FF8A2D" },
    { primary: "#22CC66", secondary: "#00D4AA" },
    { primary: "#8855FF", secondary: "#E155FF" },
    { primary: "#FFBB00", secondary: "#FF5500" },
  ]

  const handleButtonClick = () => {
    const randomIndex = Math.floor(Math.random() * colorSets.length)
    setButtonColors(colorSets[randomIndex])
  }

  // Mouse tracking for 3D tilt and glow
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePosition({ x, y })
  }, [])

  // 3D transform values
  const rotateX = useTransform(
    () => (mousePosition.y - 0.5) * -20
  )
  const rotateY = useTransform(
    () => (mousePosition.x - 0.5) * 20
  )

  const springConfig = { damping: 20, stiffness: 300 }
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  // Glow position
  const glowX = useTransform(() => mousePosition.x * 100)
  const glowY = useTransform(() => mousePosition.y * 100)
  const springGlowX = useSpring(glowX, springConfig)
  const springGlowY = useSpring(glowY, springConfig)

  // Icon components
  const icons = [
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>,
  ]

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: colors.darker,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Mesh Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            `radial-gradient(ellipse at 20% 30%, ${buttonColors.primary}25 0%, transparent 50%)`,
            `radial-gradient(ellipse at 80% 20%, ${buttonColors.secondary}20 0%, transparent 50%)`,
            `radial-gradient(ellipse at 60% 80%, rgba(255, 45, 120, 0.1) 0%, transparent 50%)`,
            `radial-gradient(ellipse at 30% 70%, ${buttonColors.primary}15 0%, transparent 50%)`,
          ].join(", "),
        }}
      />

      {/* Morphing Background Shapes */}
      <motion.div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${buttonColors.primary}20 0%, transparent 70%)`,
          filter: "blur(60px)",
          top: "10%",
          right: "-10%",
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${buttonColors.secondary}18 0%, transparent 70%)`,
          filter: "blur(50px)",
          bottom: "10%",
          left: "-5%",
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main Card Container */}
      <motion.div
        ref={cardRef}
        style={{
          width: "100%",
          maxWidth: "480px",
          position: "relative",
          perspective: 1000,
          transformStyle: "preserve-3d",
          rotateX: springRotateX,
          rotateY: springRotateY,
        }}
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glass Card */}
        <div
          style={{
            position: "relative",
            background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: `1px solid ${colors.glassBorder}`,
            padding: "40px",
            overflow: "hidden",
          }}
        >
          {/* Animated Border with dynamic colors */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              padding: "1px",
              background: `linear-gradient(90deg, ${buttonColors.primary}, ${buttonColors.secondary}, ${buttonColors.primary})`,
              backgroundSize: "300% 100%",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              animation: "gradientFlow 3s linear infinite",
              opacity: 0.5,
            }}
          >
            <style>{`
              @keyframes gradientFlow {
                0% { background-position: 0% 50%; }
                100% { background-position: 300% 50%; }
              }
            `}</style>
          </div>

          {/* Dynamic Glow Effect */}
          {showGlow && (
            <motion.div
              style={{
                position: "absolute",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${buttonColors.primary}40 0%, transparent 70%)`,
                filter: "blur(40px)",
                pointerEvents: "none",
                left: springGlowX,
                top: springGlowY,
                transform: "translate(-50%, -50%)",
                opacity: isHovered ? 1 : 0.3,
              }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Particles & Light Streaks */}
          {showParticles && <Particles count={15} isHovered={isHovered} buttonColors={buttonColors} />}
          <LightStreaks buttonColors={buttonColors} />

          {/* Content Layer */}
          <div style={{ position: "relative", zIndex: 10 }}>
            {/* Icon Dock */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "32px",
              }}
            >
              {icons.map((icon, i) => (
                <IconDockItem key={i} icon={icon} delay={0.1 + i * 0.1} buttonColors={buttonColors} />
              ))}
            </div>

            {/* Title with Text Reveal */}
            <motion.h1
              style={{
                fontSize: "clamp(32px, 5vw, 40px)",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: "12px",
                background: `linear-gradient(135deg, #fff 0%, ${buttonColors.primary} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: buttonColors.primary,
                letterSpacing: "0.02em",
                marginBottom: "16px",
                textTransform: "uppercase",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              style={{
                fontSize: "16px",
                lineHeight: 1.6,
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: "32px",
                letterSpacing: "-0.01em",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {description}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <MagneticButton primary buttonColors={buttonColors} onClick={handleButtonClick}>
                {primaryCta}
              </MagneticButton>
              <MagneticButton buttonColors={buttonColors} onClick={handleButtonClick}>
                {secondaryCta}
              </MagneticButton>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              style={{
                display: "flex",
                gap: "32px",
                marginTop: "40px",
                paddingTop: "24px",
                borderTop: `1px solid ${colors.glassBorder}`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              {[
                { value: "99.9%", label: "Uptime" },
                { value: "50ms", label: "Latency" },
                { value: "10K+", label: "Users" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  style={{ flex: 1 }}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.4)",
                      marginTop: "4px",
                    }}
                  >
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Reflection/Gloss Effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50%",
              background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)`,
              borderRadius: "24px 24px 0 0",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Shadow */}
        <motion.div
          style={{
            position: "absolute",
            bottom: "-20px",
            left: "10%",
            right: "10%",
            height: "40px",
            background: `radial-gradient(ellipse, ${buttonColors.primary}30 0%, transparent 70%)`,
            filter: "blur(20px)",
            borderRadius: "50%",
            zIndex: -1,
          }}
          animate={{
            scale: isHovered ? 1.1 : 1,
            opacity: isHovered ? 0.8 : 0.5,
          }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    </div>
  )
}

// Property Controls
addPropertyControls(NeuralFluxPortal, {
  title: {
    type: ControlType.String,
    title: "Title",
    defaultValue: "Neural Flux",
  },
  subtitle: {
    type: ControlType.String,
    title: "Subtitle",
    defaultValue: "Next-Generation AI Interface",
  },
  description: {
    type: ControlType.String,
    title: "Description",
    defaultValue: "Experience the future of human-computer interaction with our revolutionary neural network technology.",
    displayTextArea: true,
  },
  primaryCta: {
    type: ControlType.String,
    title: "Primary CTA",
    defaultValue: "Launch Portal",
  },
  secondaryCta: {
    type: ControlType.String,
    title: "Secondary CTA",
    defaultValue: "Learn More",
  },
  showParticles: {
    type: ControlType.Boolean,
    title: "Show Particles",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
  },
  showGlow: {
    type: ControlType.Boolean,
    title: "Show Glow",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
  },
})