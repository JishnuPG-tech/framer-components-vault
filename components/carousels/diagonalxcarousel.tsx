// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useId, useMemo, type CSSProperties } from "react"

interface Image {
  src: string
  srcSet?: string
  alt?: string
}

interface DiagonalXCarouselProps {
  strip1Images: Image[]
  strip2Images: Image[]
  speed: number
  imageWidth: number
  imageHeight: number
  gap: number
  angle: number
  imageRadius: number
  backgroundColor: string
  showVignette: boolean
  vignetteStrength: number
  stripOffset: number
  borderColor: string
  borderWidth: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DiagonalXCarousel(props: DiagonalXCarouselProps) {
  const {
    strip1Images = [],
    strip2Images = [],
    speed = 28,
    imageWidth = 300,
    imageHeight = 190,
    gap = 20,
    angle = 34,
    imageRadius = 14,
    backgroundColor = "#080808",
    showVignette = true,
    vignetteStrength = 60,
    stripOffset = 0,
    borderColor = "rgba(255,255,255,0.07)",
    borderWidth = 1,
  } = props

  const uid = useId().replace(/:/g, "")
  const [paused1, setPaused1] = useState(false)
  const [paused2, setPaused2] = useState(false)

  const track1 = useMemo(() => {
    const srcs = strip1Images.map((img) => img.src)
    return [...srcs, ...srcs, ...srcs]
  }, [strip1Images])

  const track2 = useMemo(() => {
    const srcs = strip2Images.map((img) => img.src)
    return [...srcs, ...srcs, ...srcs]
  }, [strip2Images])

  const stride1 = useMemo(() => {
    return strip1Images.length * (imageWidth + gap)
  }, [strip1Images.length, imageWidth, gap])

  const stride2 = useMemo(() => {
    return strip2Images.length * (imageWidth + gap)
  }, [strip2Images.length, imageWidth, gap])

  const vignette = useMemo(() => {
    const pct = vignetteStrength
    return `radial-gradient(ellipse at center, transparent 0%, ${backgroundColor} ${pct}%)`
  }, [vignetteStrength, backgroundColor])

  const kfLeft = `dxc_left_${uid}`
  const kfRight = `dxc_right_${uid}`
  const hoverClass = `dxc_img_${uid}`

  const cssText = `
    @keyframes ${kfLeft} {
      0%   { transform: translateX(0px); }
      100% { transform: translateX(-${stride1}px); }
    }
    @keyframes ${kfRight} {
      0%   { transform: translateX(-${stride2}px); }
      100% { transform: translateX(0px); }
    }
    .${hoverClass} {
      transition: transform 0.45s cubic-bezier(0.23, 1, 0.32, 1),
                  box-shadow 0.45s cubic-bezier(0.23, 1, 0.32, 1),
                  filter 0.45s ease;
    }
    .${hoverClass}:hover {
      transform: scale(1.04);
      box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.15);
      filter: brightness(1.08);
      z-index: 2;
    }
  `

  const stripWrapStyle = (rotationDeg: number, offset: number): CSSProperties => ({
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "240%",
    display: "flex",
    alignItems: "center",
    transform: `translate(-50%, calc(-50% + ${offset}px)) rotate(${rotationDeg}deg)`,
    cursor: "default",
    padding: `${imageHeight * 0.18}px 0`,
  })

  const trackStyle = (kfName: string, paused: boolean): CSSProperties => ({
    display: "flex",
    gap: `${gap}px`,
    willChange: "transform",
    animation: `${kfName} ${speed}s linear infinite`,
    animationPlayState: paused ? "paused" : "running",
  })

  const imageCardStyle: CSSProperties = {
    flexShrink: 0,
    width: imageWidth,
    height: imageHeight,
    borderRadius: imageRadius,
    overflow: "hidden",
    border: `${borderWidth}px solid ${borderColor}`,
    boxShadow: "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
    position: "relative",
  }

  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
    userSelect: "none",
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: backgroundColor,
        overflow: "hidden",
      }}
    >
      <style>{cssText}</style>

      <div
        style={stripWrapStyle(angle, stripOffset)}
        onMouseEnter={() => setPaused1(true)}
        onMouseLeave={() => setPaused1(false)}
      >
        <div style={trackStyle(kfLeft, paused1)}>
          {track1.map((src, i) => (
            <div key={i} className={hoverClass} style={imageCardStyle}>
              <img src={src} alt="" style={imgStyle} draggable={false} />
            </div>
          ))}
        </div>
      </div>

      <div
        style={stripWrapStyle(-angle, -stripOffset)}
        onMouseEnter={() => setPaused2(true)}
        onMouseLeave={() => setPaused2(false)}
      >
        <div style={trackStyle(kfRight, paused2)}>
          {track2.map((src, i) => (
            <div key={i} className={hoverClass} style={imageCardStyle}>
              <img src={src} alt="" style={imgStyle} draggable={false} />
            </div>
          ))}
        </div>
      </div>

      {showVignette && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: vignette,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </div>
  )
}

addPropertyControls(DiagonalXCarousel, {
  strip1Images: {
    type: ControlType.Array,
    title: "Strip 1 Images",
    control: { type: ControlType.ResponsiveImage },
    maxCount: 10,
    defaultValue: [
      { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "" },
    ],
  },
  strip2Images: {
    type: ControlType.Array,
    title: "Strip 2 Images",
    control: { type: ControlType.ResponsiveImage },
    maxCount: 10,
    defaultValue: [
      { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "" },
      { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "" },
    ],
  },
  speed: {
    type: ControlType.Number,
    title: "Speed (s)",
    defaultValue: 28,
    min: 5,
    max: 120,
    step: 1,
    displayStepper: true,
  },
  angle: {
    type: ControlType.Number,
    title: "X Angle",
    defaultValue: 34,
    min: 15,
    max: 60,
    step: 1,
    unit: "°",
  },
  stripOffset: {
    type: ControlType.Number,
    title: "Strip Offset",
    defaultValue: 0,
    min: -200,
    max: 200,
    step: 4,
  },
  imageWidth: {
    type: ControlType.Number,
    title: "Image Width",
    defaultValue: 300,
    min: 120,
    max: 600,
    step: 10,
  },
  imageHeight: {
    type: ControlType.Number,
    title: "Image Height",
    defaultValue: 190,
    min: 80,
    max: 400,
    step: 10,
  },
  gap: {
    type: ControlType.Number,
    title: "Gap",
    defaultValue: 20,
    min: 0,
    max: 80,
    step: 4,
  },
  imageRadius: {
    type: ControlType.Number,
    title: "Corner Radius",
    defaultValue: 14,
    min: 0,
    max: 48,
    step: 2,
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#080808",
  },
  borderColor: {
    type: ControlType.Color,
    title: "Image Border",
    defaultValue: "rgba(255,255,255,0.07)",
  },
  borderWidth: {
    type: ControlType.Number,
    title: "Border Width",
    defaultValue: 1,
    min: 0,
    max: 4,
    step: 1,
  },
  showVignette: {
    type: ControlType.Boolean,
    title: "Vignette",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
  },
  vignetteStrength: {
    type: ControlType.Number,
    title: "Vignette %",
    defaultValue: 60,
    min: 10,
    max: 90,
    step: 5,
    hidden: (props) => !props.showVignette,
  },
})