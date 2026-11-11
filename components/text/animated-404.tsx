// Mood-Driven Minimalist 404 Component
// Shows a large "404" with subtle animation
import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
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

interface NotFoundProps {
  text: string
  textColor: string
  animationType: "wave"
  font: any
  letterSpacing: number
  style?: CSSProperties
}

/**
 * Mood-Driven Minimalist 404
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 320
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NotFound(props: NotFoundProps) {
  const { 
    text = "404",
    textColor, 
    animationType = "wave", 
    font,
    letterSpacing = 0,
    style 
  } = props
  
  const isStatic = useIsStaticRenderer()
  
  // Split 404 into individual characters for wave animation
  const characters = text.split("")

  return (
    <div
      role="region"
      aria-label="404 Not Found Page"
      tabIndex={0}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: 32,
        color: textColor,
        ...font,
      }}
    >
      <div 
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {characters.map((char, index) => (
          <motion.div
            key={index}
            custom={index}
            animate={{ 
              y: [0, -15, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
            style={{
              lineHeight: 1,
              marginRight: index < characters.length - 1 ? letterSpacing : 0,
            }}
            aria-hidden="true"
          >
            {char}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

addPropertyControls(NotFound, {
  text: {
    type: ControlType.String,
    title: "Text",
    defaultValue: "404",
  },
  textColor: {
    type: ControlType.Color,
    title: "Text Color",
    defaultValue: "#333333",
  },
  letterSpacing: {
    type: ControlType.Number,
    title: "Letter Gap",
    defaultValue: 0,
    min: -100,
    max: 50,
    step: 1,
    unit: "px",
  },
  font: {
    type: ControlType.Font,
    title: "Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: "120px",
      variant: "Bold",
      letterSpacing: "-0.01em",
      lineHeight: "1em",
    },
  },
})

NotFound.displayName = "Animated 404"