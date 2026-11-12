// Magnetic effect wrapper for Framer
import { useRef } from "react"
import { motion, useMotionValue, animate } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MagneticWrapperProps {
  strength: number
  radius: number
  children?: React.ReactNode
  style?: React.CSSProperties
  stiffness?: number
  damping?: number
  depth?: number
}

/**
 * MagneticWrapper
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MagneticWrapper(props: MagneticWrapperProps) {
  const { strength, radius, children, style, stiffness = 150, damping = 12, depth = 18 } = props
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = event.clientX - (rect.left + rect.width / 2)
    const relY = event.clientY - (rect.top + rect.height / 2)
    const distance = Math.sqrt(relX * relX + relY * relY)
    if (distance < radius) {
      const magnetX = (relX / distance) * strength
      const magnetY = (relY / distance) * strength
      animate(x, magnetX, { type: "spring", stiffness, damping })
      animate(y, magnetY, { type: "spring", stiffness, damping })
      // 3D effect: rotate based on relative position
      const maxTilt = depth
      const tiltX = (-relY / (rect.height / 2)) * maxTilt
      const tiltY = (relX / (rect.width / 2)) * maxTilt
      animate(rotateX, tiltX, { type: "spring", stiffness, damping })
      animate(rotateY, tiltY, { type: "spring", stiffness, damping })
    } else {
      animate(x, 0, { type: "spring", stiffness, damping })
      animate(y, 0, { type: "spring", stiffness, damping })
      animate(rotateX, 0, { type: "spring", stiffness, damping })
      animate(rotateY, 0, { type: "spring", stiffness, damping })
    }
  }

  function handleMouseLeave() {
    animate(x, 0, { type: "spring", stiffness, damping })
    animate(y, 0, { type: "spring", stiffness, damping })
    animate(rotateX, 0, { type: "spring", stiffness, damping })
    animate(rotateY, 0, { type: "spring", stiffness, damping })
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y, rotateX, rotateY, display: "inline-block", ...style, perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}

addPropertyControls(MagneticWrapper, {
  strength: {
    type: ControlType.Number,
    title: "Strength",
    min: 10,
    max: 200,
    defaultValue: 40,
    description: "How far the element moves towards the cursor (in px) when hovered. Higher = more magnetic."
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    min: 50,
    max: 400,
    defaultValue: 150,
    description: "Distance (in px) from the center where the magnetic effect is active."
  },
  stiffness: {
    type: ControlType.Number,
    title: "Stiffness",
    min: 10,
    max: 500,
    defaultValue: 150,
    description: "Spring stiffness for the movement animation. Higher = snappier."
  },
  damping: {
    type: ControlType.Number,
    title: "Damping",
    min: 1,
    max: 50,
    defaultValue: 12,
    description: "Spring damping for the movement animation. Higher = less bounce."
  },
  depth: {
    type: ControlType.Number,
    title: "Depth",
    min: 0,
    max: 60,
    defaultValue: 18,
    description: "Strength of the 3D tilt effect (degrees)."
  },
  children: {
    type: ControlType.ComponentInstance,
    title: "Child",
    description: "The child element to apply the magnetic effect to."
  },
})