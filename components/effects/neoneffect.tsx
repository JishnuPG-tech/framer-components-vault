// Bold neo-style animated text effect with realistic neon sign board lighting
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


interface NeonEffectProps {
  text: string
  color: string
  font: any
  glowingEffect: boolean
  glowingIntensity: number
  animationDuration: number
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function NeonEffect({ text = "DANGER", color = "#EE2211", font, glowingIntensity = 50, animationDuration = 3 }: NeonEffectProps) {
  const intensity = glowingIntensity / 100;
  
  return (
    <div style={{ padding: "20px" }}>
      <motion.div
        style={{
          ...font,
          color: color,
          textShadow: `
            0 0 ${3 * intensity}px ${color},
            0 0 ${8 * intensity}px ${color},
            0 0 ${15 * intensity}px ${color}
          `,
          filter: `drop-shadow(0 0 ${2 * intensity}px ${color})`,
        }}
        animate={{
          textShadow: [
            `0 0 ${3 * intensity}px ${color}, 0 0 ${8 * intensity}px ${color}, 0 0 ${15 * intensity}px ${color}`,
            `0 0 ${2 * intensity}px ${color}, 0 0 ${6 * intensity}px ${color}, 0 0 ${12 * intensity}px ${color}`,
            `0 0 ${3 * intensity}px ${color}, 0 0 ${8 * intensity}px ${color}, 0 0 ${15 * intensity}px ${color}`,
          ],
          filter: [
            `drop-shadow(0 0 ${2 * intensity}px ${color})`,
            `drop-shadow(0 0 ${1 * intensity}px ${color})`,
            `drop-shadow(0 0 ${2 * intensity}px ${color})`,
          ]
        }}
        transition={{
          duration: animationDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}

addPropertyControls(NeonEffect, {
  text: {
    type: ControlType.String,
    title: "Text",
    defaultValue: "DANGER",
  },
  color: {
    type: ControlType.Color,
    title: "Color",
    defaultValue: "#EE2211",
  },
  font: {
    type: ControlType.Font,
    title: "Font",
    defaultValue: {
      fontSize: "5rem",
      variant: "Bold",
    },
    controls: "extended",
    defaultFontType: "sans-serif",
  },
  glowingIntensity: {
    type: ControlType.Number,
    title: "Glow Intensity",
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
  },
  animationDuration: {
    type: ControlType.Number,
    title: "Animation Duration",
    defaultValue: 3,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: "s",
  },
})