// 3D Carousel/Helix with animated cards, customizable content, and responsive layout
import { useRef, useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const defaultImages = [
  { type: "image", src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Card 1" },
  { type: "image", src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Card 2" },
  { type: "image", src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Card 3" },
  { type: "image", src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Card 4" },
  { type: "image", src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Card 5" },
  { type: "image", src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Card 6" },
]

function getDefaultCards(n) {
  const arr = []
  for (let i = 0; i < n; i++) {
    arr.push(defaultImages[i % defaultImages.length])
  }
  return arr
}

/**
 * 3D Carousel/Helix Animated Cards
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RadialCarousel3D(props) {
  const {
    numCards,
    rotationSpeed,
    tiltAngle,
    cards,
    style,
  } = props

  const isStatic = useIsStaticRenderer()
  const [rotation, setRotation] = useState(0)
  const requestRef = useRef(null)
  const lastTimestamp = useRef(null)

  // Responsive sizing
  const width = style?.width && typeof style.width === "number" ? style.width : 500
  const height = style?.height && typeof style.height === "number" ? style.height : 400
  const cardW = Math.max(120, Math.min(width * 0.32, 240))
  const cardH = Math.max(160, Math.min(height * 0.5, 320))
  const radius = Math.max(cardW * 1.2, Math.min(width * 0.38, 0.5 * width - cardW / 2))

  // Card size adjustment
  const cardWidth = props.cardWidth || cardW
  const cardHeight = props.cardHeight || cardH

  // Animation loop
  useEffect(() => {
    if (isStatic || RenderTarget.current() === RenderTarget.thumbnail) return
    let running = true
    function animate(ts) {
      if (!running) return
      if (lastTimestamp.current == null) lastTimestamp.current = ts
      const dt = ts - lastTimestamp.current
      lastTimestamp.current = ts
      // rotationSpeed is degrees per second
      startTransition(() => setRotation(r => (r + (rotationSpeed * dt) / 1000) % 360))
      requestRef.current = requestAnimationFrame(animate)
    }
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      lastTimestamp.current = null
    }
  }, [rotationSpeed, isStatic])

  // Card content fallback
  const cardList = (Array.isArray(cards) && cards.length > 0 ? cards : getDefaultCards(numCards)).slice(0, numCards)

  // 3D transform helpers
  const deg2rad = deg => (deg * Math.PI) / 180
  const tilt = tiltAngle
  const angleStep = 360 / numCards

  return (
    <div
      style={{
        ...style,
        width: "100%",
        height: "100%",
        background: props.backgroundColor || "#000",
        position: "relative",
        perspective: Math.max(width, height) * 2,
        overflow: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: width,
          height: height,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation}deg)`,
          transition: isStatic ? "transform 0.6s cubic-bezier(.4,0,.2,1)" : undefined,
        }}
      >
        {cardList.map((card, i) => {
          const theta = i * angleStep
          const rad = deg2rad(theta)
          const x = Math.sin(rad) * radius
          const z = Math.cos(rad) * radius
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: cardWidth,
                height: cardHeight,
                transformStyle: "preserve-3d",
                transform: `translate(-50%,-50%) rotateX(${theta}deg) translateZ(${radius}px) rotateY(${-tilt}deg)`,
                boxShadow: "0 6px 32px rgba(0,0,0,0.22)",
                borderRadius: props.cardRadius,
                background: "#181818",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                willChange: "transform",
                // border: "1px solid #e0e0e0", // Removed white stroke from cards
                padding: props.cardPadding,
              }}
              aria-label={card.alt || `Card ${i + 1}`}
              role="group"
            >
              {card.type === "video" ? (
                <video
                  src={card.upload || card.src}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label={card.alt || `Video Card ${i + 1}`}
                />
              ) : (
                <img
                  src={card.upload || card.src}
                  alt={card.alt || `Image Card ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: card.imagePosition ? `${card.imagePosition.x || 50}% ${card.imagePosition.y || 50}%` : "50% 50%",
                  }}
                  draggable={false}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

addPropertyControls(RadialCarousel3D, {
  numCards: {
    type: ControlType.Number,
    title: "Cards",
    min: 3,
    max: 12,
    step: 1,
    defaultValue: 6,
    displayStepper: true,
  },
  rotationSpeed: {
    type: ControlType.Number,
    title: "Speed (deg/s)",
    min: 5,
    max: 90,
    step: 1,
    defaultValue: 24,
    displayStepper: true,
  },
  tiltAngle: {
    type: ControlType.Number,
    title: "Tilt (deg)",
    min: 0,
    max: 45,
    step: 1,
    defaultValue: 18,
    displayStepper: true,
  },
  cards: {
    type: ControlType.Array,
    title: "Cards",
    control: {
      type: ControlType.Object,
      controls: {
        type: {
          type: ControlType.Enum,
          options: ["image", "video"],
          optionTitles: ["Image", "Video"],
          defaultValue: "image",
        },
        src: {
          type: ControlType.String,
          title: "Source",
          defaultValue: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        },
        alt: {
          type: ControlType.String,
          title: "Alt Text",
          defaultValue: "Card",
        },
        upload: {
          type: ControlType.File,
          allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg", "mp4", "webm", "mov"],
        },
        imagePosition: {
          type: ControlType.Object,
          title: "Image Position",
          controls: {
            x: { type: ControlType.Number, title: "X (%)", min: 0, max: 100, defaultValue: 50 },
            y: { type: ControlType.Number, title: "Y (%)", min: 0, max: 100, defaultValue: 50 },
          },
        },
      },
    },
    maxCount: 12,
    defaultValue: getDefaultCards(6),
  },
  cardRadius: {
    type: ControlType.Number,
    title: "Card Radius",
    min: 0,
    max: 48,
    step: 1,
    defaultValue: 16,
    displayStepper: true,
  },
  cardPadding: {
    type: ControlType.Number,
    title: "Card Padding",
    min: 0,
    max: 48,
    step: 1,
    defaultValue: 0,
    displayStepper: true,
  },
  cardWidth: {
    type: ControlType.Number,
    title: "Card Width",
    min: 60,
    max: 480,
    step: 1,
    defaultValue: 0,
    displayStepper: true,
  },
  cardHeight: {
    type: ControlType.Number,
    title: "Card Height",
    min: 60,
    max: 640,
    step: 1,
    defaultValue: 0,
    displayStepper: true,
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#000000",
  },
})
