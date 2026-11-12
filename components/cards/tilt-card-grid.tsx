// Responsive 3D Card Layout with Inertia Hover Effect
// 3 cards, each with smooth 3D tilt following mouse, inertia, and easing
import { useRef, useState, useCallback, useEffect, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const CARD_COUNT = 3
const CARD_ASPECT = 300 / 200
const CARD_GAP = 24
const CARD_RADIUS = 16
const CARD_SHADOW = "0 8px 32px rgba(0,0,0,0.10)"

const defaultImages = [
  { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
  { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2 - Purple" },
  { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3 - Orange" },
]

const defaultCardSize = { width: 300, height: 200 }

function lerp(a, b, t) {
  return a + (b - a) * t
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/**
 * Responsive 3D Card Layout
 *
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 320
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CardGrid(props) {
  const {
    cardBackground,
    cardShadow,
    cardRadius,
    cardFont,
    cardTextColor,
    cardImages = defaultImages,
    cardTitles = ["Card One", "Card Two", "Card Three"],
    cardDescriptions = [
      "This is the first card.",
      "This is the second card.",
      "This is the third card.",
    ],
    cardSize = defaultCardSize,
    descriptionFontSize,
    textPadding = 20,
    cardGap = CARD_GAP,
    style,
  } = props

  const isStatic = useIsStaticRenderer()

  return (
    <div
      style={{
        ...style,
        width: "100%",
        display: "flex",
        flexDirection: "row",
        gap: cardGap,
        justifyContent: "center",
        alignItems: "stretch",
        boxSizing: "border-box",
        padding: 0,
        background: "transparent",
      }}
    >
      {Array(CARD_COUNT)
        .fill(0)
        .map((_, i) => (
          <Card3D
            key={i}
            image={cardImages[i] || defaultImages[i]}
            title={cardTitles[i]}
            description={cardDescriptions[i]}
            background={cardBackground}
            shadow={cardShadow}
            radius={cardRadius}
            font={cardFont}
            textColor={cardTextColor}
            isStatic={isStatic}
            cardSize={cardSize}
            descriptionFontSize={descriptionFontSize}
            textPadding={textPadding}
          />
        ))}
    </div>
  )
}

function Card3D({ image, title, description, background, shadow, radius, font, textColor, isStatic, cardSize, descriptionFontSize, textPadding }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [target, setTarget] = useState({ x: 0, y: 0 })
  const [isHover, setIsHover] = useState(false)
  const animationRef = useRef(null)

  // Animation loop for inertia
  useEffect(() => {
    if (isStatic) return
    let running = true
    function animate() {
      setTilt((prev) => {
        const t = 0.18 // Easing factor for inertia
        return {
          x: lerp(prev.x, target.x, t),
          y: lerp(prev.y, target.y, t),
        }
      })
      if (running) animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [target.x, target.y, isStatic])

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const px = clamp((x / rect.width) * 2 - 1, -1, 1)
      const py = clamp((y / rect.height) * 2 - 1, -1, 1)
      // Max tilt: 14deg X, 18deg Y
      const maxX = 14
      const maxY = 18
      startTransition(() => setTarget({ x: py * maxX, y: px * maxY }))
    },
    [],
  )

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    setIsHover(false)
    startTransition(() => setTarget({ x: 0, y: 0 }))
  }, [])

  // Mouse enter handler
  const handleMouseEnter = useCallback(() => {
    setIsHover(true)
  }, [])

  // For static render, no tilt
  const transform = isStatic
    ? "none"
    : `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        aspectRatio: cardSize.width / cardSize.height,
        minWidth: 0,
        maxWidth: cardSize.width,
        minHeight: cardSize.height,
        background,
        borderRadius: radius,
        boxShadow: shadow,
        overflow: "hidden",
        position: "relative",
        transition: isStatic ? "box-shadow 0.2s" : "box-shadow 0.2s cubic-bezier(.4,.2,.2,1)",
        transform,
        willChange: "transform",
        cursor: isStatic ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "stretch",
        userSelect: "none",
      }}
      tabIndex={0}
      aria-label={title}
      onMouseMove={isStatic ? undefined : handleMouseMove}
      onMouseLeave={isStatic ? undefined : handleMouseLeave}
      onMouseEnter={isStatic ? undefined : handleMouseEnter}
      role="article"
    >
      <img
        src={image.src}
        alt={image.alt || ""}
        style={{
          width: "100%",
          height: "70%",
          objectFit: "cover",
          display: "block",
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
          pointerEvents: "none",
          background: "#f5f5f5",
        }}
        draggable={false}
      />
      <div
        style={{
          flex: 1,
          padding: `${textPadding}px`,
          background: "rgba(255,255,255,0.92)",
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            ...font,
            color: textColor,
            fontWeight: 600,
            fontSize: font.fontSize || 20,
            marginBottom: 4,
            lineHeight: 1.2,
            letterSpacing: font.letterSpacing || "-0.01em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            ...font,
            color: textColor,
            fontWeight: 400,
            fontSize: descriptionFontSize || (font.fontSize ? font.fontSize * 0.9 : 16),
            opacity: 0.7,
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

addPropertyControls(CardGrid, {
  cardBackground: {
    type: ControlType.Color,
    title: "Card BG",
    defaultValue: "#fff",
  },
  cardShadow: {
    type: ControlType.String,
    title: "Card Shadow",
    defaultValue: CARD_SHADOW,
  },
  cardRadius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: CARD_RADIUS,
    min: 0,
    max: 32,
  },
  cardFont: {
    type: ControlType.Font,
    title: "Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: 20,
      variant: "Semibold",
      letterSpacing: "-0.01em",
      lineHeight: "1.2em",
    },
  },
  cardTextColor: {
    type: ControlType.Color,
    title: "Text Color",
    defaultValue: "#222",
  },
  descriptionFontSize: {
    type: ControlType.Number,
    title: "Description Size",
    defaultValue: 16,
    min: 10,
    max: 24,
    unit: "px",
  },
  cardImages: {
    type: ControlType.Array,
    title: "Images",
    control: {
      type: ControlType.ResponsiveImage,
    },
    maxCount: 3,
    defaultValue: defaultImages,
  },
  cardTitles: {
    type: ControlType.Array,
    title: "Titles",
    control: {
      type: ControlType.String,
      defaultValue: "Card Title",
    },
    maxCount: 3,
    defaultValue: ["Card One", "Card Two", "Card Three"],
  },
  cardDescriptions: {
    type: ControlType.Array,
    title: "Descriptions",
    control: {
      type: ControlType.String,
      defaultValue: "This is a card.",
      displayTextArea: true,
    },
    maxCount: 3,
    defaultValue: [
      "This is the first card.",
      "This is the second card.",
      "This is the third card.",
    ],
  },
  cardSize: {
    type: ControlType.Object,
    title: "Card Size",
    controls: {
      width: { type: ControlType.Number, title: "Width", defaultValue: 300, min: 100, max: 800 },
      height: { type: ControlType.Number, title: "Height", defaultValue: 200, min: 80, max: 600 },
    },
    defaultValue: defaultCardSize,
  },
  textPadding: {
    type: ControlType.Number,
    title: "Text Padding",
    defaultValue: 20,
    min: 8,
    max: 40,
    unit: "px",
  },
  cardGap: {
    type: ControlType.Number,
    title: "Card Gap",
    defaultValue: CARD_GAP,
    min: 0,
    max: 80,
    unit: "px",
  },
})