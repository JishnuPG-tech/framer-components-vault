// Animated noise overlay component with configurable grain pattern
import { useRef, useEffect, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface NoiseProps {
  patternSize: number
  patternAlpha: number
  density: number
  borderRadius: number
  blendMode: string
  style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Noise(props: NoiseProps) {
  const {
    patternSize = 250,
    patternAlpha = 15,
    borderRadius = 0,
    blendMode = "multiply"
  } = props

  const grainRef = useRef<HTMLCanvasElement | null>(null)
  const isStatic = useIsStaticRenderer()

  useEffect(() => {
    if (isStatic) return

    const canvas = grainRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let frame = 0
    let animationId: number
    const canvasSize = 1024

    const resize = () => {
      if (!canvas) return
      canvas.width = canvasSize
      canvas.height = canvasSize
    }

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255
        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
        data[i + 3] = patternAlpha
      }
      
      ctx.putImageData(imageData, 0, 0)
    }

    const loop = () => {
      drawGrain()
      animationId = window.requestAnimationFrame(loop)
    }

    resize()
    loop()

    return () => {
      if (typeof window !== "undefined") {
        window.cancelAnimationFrame(animationId)
      }
    }
  }, [patternSize, patternAlpha, isStatic])

  // Static preview for canvas/export
  useEffect(() => {
    if (!isStatic) return

    const canvas = grainRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const canvasSize = 1024
    canvas.width = canvasSize
    canvas.height = canvasSize

    const imageData = ctx.createImageData(canvasSize, canvasSize)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
      data[i + 3] = patternAlpha
    }
    
    ctx.putImageData(imageData, 0, 0)
  }, [patternAlpha, isStatic])

  return (
    <canvas
      ref={grainRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        imageRendering: "pixelated",
        borderRadius: `${borderRadius}px`,
        mixBlendMode: blendMode as any,
        ...props.style
      }}
    />
  )
}

addPropertyControls(Noise, {
  patternSize: {
    type: ControlType.Number,
    title: "Pattern Size",
    defaultValue: 100,
    min: 10,
    max: 100,
    step: 5,
    unit: "%"
  },
  patternAlpha: {
    type: ControlType.Number,
    title: "Opacity",
    defaultValue: 15,
    min: 1,
    max: 255,
    step: 1
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    defaultValue: 8,
    min: 0,
    max: 100,
    step: 1
  },
  blendMode: {
    type: ControlType.Enum,
    title: "Blend Mode",
    defaultValue: "multiply",
    options: ["multiply", "overlay", "screen", "soft-light"],
    optionTitles: ["Multiply", "Overlay", "Screen", "Soft Light"]
  }
})