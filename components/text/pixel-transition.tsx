// Pixel transition component with animated grid overlay between two content states
import React, { useRef, useEffect, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface PixelTransitionProps {
  firstContent: string
  secondContent: string
  gridSize: number
  pixelColor: string
  animationDuration: number
  backgroundColor: string
  borderColor: string
  borderRadius: number
  borderWidth: number
  firstFont: any
  secondFont: any
  firstTextColor: string
  secondTextColor: string
  style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PixelTransition(props: PixelTransitionProps) {
  const {
    firstContent = "First Content",
    secondContent = "Second Content", 
    gridSize = 7,
    pixelColor = "#FFFFFF",
    animationDuration = 300,
    backgroundColor = "#222222",
    borderColor = "#FFFFFF",
    borderRadius = 15,
    borderWidth = 2,
    firstFont,
    secondFont,
    firstTextColor = "#FFFFFF",
    secondTextColor = "#FFFFFF"
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const pixelGridRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number>()
  
  const [isActive, setIsActive] = useState(false)
  const isStatic = useIsStaticRenderer()

  const isTouchDevice = typeof window !== "undefined" && (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  )

  useEffect(() => {
    const pixelGridEl = pixelGridRef.current
    if (!pixelGridEl) return

    pixelGridEl.innerHTML = ""

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement("div")
        pixel.style.backgroundColor = pixelColor
        pixel.style.position = "absolute"
        pixel.style.display = "none"

        const size = 100 / gridSize
        pixel.style.width = `${size}%`
        pixel.style.height = `${size}%`
        pixel.style.left = `${col * size}%`
        pixel.style.top = `${row * size}%`
        pixelGridRef.current?.appendChild(pixel)
      }
    }
  }, [gridSize, pixelColor])

  const animatePixels = (activate: boolean) => {
    if (isStatic) return
    
    startTransition(() => setIsActive(activate))

    const pixelGridEl = pixelGridRef.current
    const activeEl = activeRef.current
    const defaultEl = containerRef.current?.querySelector('[data-default-content]') as HTMLDivElement
    if (!pixelGridEl || !activeEl) return

    const pixels = pixelGridEl.querySelectorAll<HTMLDivElement>("div")
    if (!pixels.length) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Show pixels in random order
    const pixelArray = Array.from(pixels)
    const shuffled = [...pixelArray].sort(() => Math.random() - 0.5)
    
    shuffled.forEach((pixel, index) => {
      setTimeout(() => {
        pixel.style.display = "block"
      }, (index * animationDuration) / pixels.length)
    })

    // Switch content in the middle of animation
    timeoutRef.current = window.setTimeout(() => {
      if (activate) {
        // Hide first content and show second content
        if (defaultEl) defaultEl.style.display = "none"
        activeEl.style.display = "flex"
        activeEl.style.pointerEvents = "none"
      } else {
        // Hide second content and show first content
        activeEl.style.display = "none"
        activeEl.style.pointerEvents = ""
        if (defaultEl) defaultEl.style.display = "flex"
      }
    }, animationDuration / 2)

    // Hide pixels in random order
    shuffled.forEach((pixel, index) => {
      setTimeout(() => {
        pixel.style.display = "none"
      }, animationDuration + (index * animationDuration) / pixels.length)
    })
  }

  const handleMouseEnter = () => {
    if (!isActive && !isTouchDevice) animatePixels(true)
  }

  const handleMouseLeave = () => {
    if (isActive && !isTouchDevice) animatePixels(false)
  }

  const handleClick = () => {
    if (isTouchDevice) animatePixels(!isActive)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor,
        color: firstTextColor,
        borderRadius: `${borderRadius}px`,
        border: `${borderWidth}px solid ${borderColor}`,
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        cursor: isTouchDevice ? "pointer" : "default",
        ...props.style
      }}
      onMouseEnter={isStatic ? undefined : handleMouseEnter}
      onMouseLeave={isStatic ? undefined : handleMouseLeave}
      onClick={isStatic ? undefined : handleClick}
    >
      {/* Default Content */}
      <div
        data-default-content
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          textAlign: "center",
          color: firstTextColor,
          ...firstFont
        }}
      >
        {firstContent}
      </div>

      {/* Active Content */}
      <div
        ref={activeRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 2,
          display: isStatic && isActive ? "flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          textAlign: "center",
          color: secondTextColor,
          ...secondFont
        }}
      >
        {secondContent}
      </div>

      {/* Pixel Grid */}
      <div
        ref={pixelGridRef}
        style={{
          pointerEvents: "none",
          position: "absolute",
          zIndex: 3,
          top: 0,
          left: 0,
          width: "100%",
          height: "100%"
        }}
      />
      
      {/* Instruction Text */}
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#888888",
          fontSize: "14px",
          textAlign: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none"
        }}
      >
        {isTouchDevice ? "Tap the card!" : "Hover the card!"}
      </div>
    </div>
  )
}

addPropertyControls(PixelTransition, {
  firstContent: {
    type: ControlType.String,
    title: "First Content",
    defaultValue: "First Content",
    displayTextArea: true
  },
  secondContent: {
    type: ControlType.String,
    title: "Second Content", 
    defaultValue: "Second Content",
    displayTextArea: true
  },
  gridSize: {
    type: ControlType.Number,
    title: "Grid Size",
    defaultValue: 7,
    min: 3,
    max: 20,
    step: 1
  },
  pixelColor: {
    type: ControlType.Color,
    title: "Pixel Color",
    defaultValue: "#FFFFFF"
  },
  animationDuration: {
    type: ControlType.Number,
    title: "Animation Duration",
    defaultValue: 300,
    min: 100,
    max: 1000,
    step: 50,
    unit: "ms"
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#222222"
  },
  borderColor: {
    type: ControlType.Color,
    title: "Border Color",
    defaultValue: "#FFFFFF"
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    defaultValue: 15,
    min: 0,
    max: 50,
    step: 1,
    unit: "px"
  },
  borderWidth: {
    type: ControlType.Number,
    title: "Border Width",
    defaultValue: 2,
    min: 0,
    max: 10,
    step: 1,
    unit: "px"
  },
  firstTextColor: {
    type: ControlType.Color,
    title: "First Text Color",
    defaultValue: "#FFFFFF"
  },
  secondTextColor: {
    type: ControlType.Color,
    title: "Second Text Color", 
    defaultValue: "#FFFFFF"
  },
  firstFont: {
    type: ControlType.Font,
    title: "First Font",
    defaultValue: {
      fontSize: "16px",
      variant: "Medium",
      letterSpacing: "-0.01em",
      lineHeight: "1.3em"
    },
    controls: "extended",
    defaultFontType: "sans-serif"
  },
  secondFont: {
    type: ControlType.Font,
    title: "Second Font",
    defaultValue: {
      fontSize: "16px", 
      variant: "Medium",
      letterSpacing: "-0.01em",
      lineHeight: "1.3em"
    },
    controls: "extended",
    defaultFontType: "sans-serif"
  }
})