// 3D Logo Rotator - 6 images rotating in a 360° tilted orbit with drag and scroll interaction
import { useEffect, useRef, useState, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageRotator360Props {
  logo1: { src: string; alt?: string }
  logo2: { src: string; alt?: string }
  logo3: { src: string; alt?: string }
  logo4: { src: string; alt?: string }
  logo5: { src: string; alt?: string }
  logo6: { src: string; alt?: string }
  mediaType1: "image" | "video"
  mediaType2: "image" | "video"
  mediaType3: "image" | "video"
  mediaType4: "image" | "video"
  mediaType5: "image" | "video"
  mediaType6: "image" | "video"
  video1: string
  video2: string
  video3: string
  video4: string
  video5: string
  video6: string
  speed: number
  imageWidth: number
  aspectRatio: number
  imageRadius: number
  style?: CSSProperties
}

/**
 * Image Rotator 360°
 * 
 * A 3D carousel component that displays up to 6 images rotating in a tilted orbital path.
 * Features interactive drag controls, scroll-based rotation, and smooth momentum physics.
 * 
 * Features:
 * - Drag to manually rotate the carousel
 * - Automatic continuous rotation
 * - Scroll-based interaction when in viewport
 * - Touch-enabled for mobile devices
 * - Customizable speed and image dimensions
 * - Multiple aspect ratio options
 * - Smooth momentum and physics
 * 
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageRotator360(props: ImageRotator360Props) {
  const {
    logo1 = {
      src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
      alt: "Logo 1",
    },
    logo2 = {
      src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
      alt: "Logo 2",
    },
    logo3 = {
      src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
      alt: "Logo 3",
    },
    logo4 = {
      src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
      alt: "Logo 4",
    },
    logo5 = {
      src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
      alt: "Logo 5",
    },
    logo6 = {
      src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
      alt: "Logo 6",
    },
    mediaType1 = "image",
    mediaType2 = "image",
    mediaType3 = "image",
    mediaType4 = "image",
    mediaType5 = "image",
    mediaType6 = "image",
    video1 = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
    video2 = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
    video3 = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
    video4 = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
    video5 = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
    video6 = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
    speed = 14,
    imageWidth = 300,
    aspectRatio = 1,
    imageRadius = 10,
  } = props

  const logos = [logo1, logo2, logo3, logo4, logo5, logo6].filter(
    (l): l is { src: string; alt?: string } => !!l?.src
  )

  const mediaTypes = [mediaType1, mediaType2, mediaType3, mediaType4, mediaType5, mediaType6]
  const videos = [video1, video2, video3, video4, video5, video6]

  const angleRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [, forceRender] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastMouseX = useRef(0)
  const lastTouchX = useRef(0)
  const autoSpeed = useRef(1)
  const dragVelocity = useRef(0)
  const scrollVelocity = useRef(0)
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)

  // Responsive breakpoints
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      startTransition(() => setWindowWidth(window.innerWidth))
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate responsive scale factor
  const getScaleFactor = () => {
    if (windowWidth <= 480) return 0.4 // Mobile - reduced further
    if (windowWidth <= 768) return 0.6 // Tablet
    return 1 // Desktop
  }

  const scaleFactor = getScaleFactor()
  const responsiveImageWidth = imageWidth * scaleFactor
  const responsiveImageHeight = responsiveImageWidth / aspectRatio

  const count = logos.length || 1
  const gap = 20
  const imageHeight = imageWidth / aspectRatio
  const radiusX = Math.max((count * (responsiveImageWidth + gap)) / (2 * Math.PI), 200 * scaleFactor)
  const radiusZ = radiusX * 0.85
  const radiusY = 40 * scaleFactor

  // Add padding for mobile to prevent cropping - increased for better fit
  const containerPadding = windowWidth <= 480 ? 80 : windowWidth <= 768 ? 80 : 100

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastMouseX.current = e.clientX
    autoSpeed.current = 0
    dragVelocity.current = 0
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastMouseX.current
    lastMouseX.current = e.clientX
    const sensitivity = 0.3
    angleRef.current = (angleRef.current + dx * sensitivity) % 360
    dragVelocity.current = dx * sensitivity
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    autoSpeed.current = 1
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      autoSpeed.current = 1
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true
    lastTouchX.current = e.touches[0].clientX
    autoSpeed.current = 0
    dragVelocity.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - lastTouchX.current
    lastTouchX.current = e.touches[0].clientX
    const sensitivity = 0.3
    angleRef.current = (angleRef.current + dx * sensitivity) % 360
    dragVelocity.current = dx * sensitivity
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    autoSpeed.current = 1
  }, [])

  // Global page scroll listener
  useEffect(() => {
    if (typeof window === "undefined") return

    const el = sectionRef.current
    if (!el) return

    let lastScrollY = window.scrollY

    const onScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY
      lastScrollY = currentScrollY

      const rect = el.getBoundingClientRect()
      const viewH = window.innerHeight
      const isNearViewport = rect.bottom > -viewH * 0.5 && rect.top < viewH * 1.5

      if (isNearViewport) {
        const sensitivity = 0.03
        scrollVelocity.current += delta * sensitivity
        scrollVelocity.current = Math.max(-3, Math.min(3, scrollVelocity.current))
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (logos.length === 0) return

    const degreesPerSecond = 360 / speed
    let lastTime: number | null = null

    const animate = (time: number) => {
      if (lastTime === null) lastTime = time
      const delta = (time - lastTime) / 1000
      lastTime = time

      // Apply scroll velocity
      if (Math.abs(scrollVelocity.current) > 0.01) {
        angleRef.current = (angleRef.current + scrollVelocity.current) % 360
        scrollVelocity.current *= 0.97
      } else {
        scrollVelocity.current = 0
      }

      if (!isDragging.current) {
        if (Math.abs(dragVelocity.current) > 0.1) {
          angleRef.current = (angleRef.current + dragVelocity.current) % 360
          dragVelocity.current *= 0.92
        } else {
          dragVelocity.current = 0
          angleRef.current = (angleRef.current + degreesPerSecond * delta * autoSpeed.current) % 360
        }
      }

      startTransition(() => forceRender((v) => v + 1))
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [logos.length, speed])

  if (logos.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          color: "#808083",
        }}
      >
        Add images in the settings panel
      </div>
    )
  }

  const baseAngle = angleRef.current

  const items = logos.map((logo, i) => {
    const itemAngle = (baseAngle + (360 / count) * i) % 360
    const rad = (itemAngle * Math.PI) / 180
    const x = Math.sin(rad) * radiusX
    const z = Math.cos(rad) * radiusZ
    const depthNorm = (z + radiusZ) / (2 * radiusZ)
    const scale = 0.35 + depthNorm * 0.65
    const y = -Math.cos(rad) * radiusY

    return { logo, x, y, z, scale, depthNorm, index: i }
  })

  const sorted = [...items].sort((a, b) => a.z - b.z)

  return (
    <div
      ref={sectionRef}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: isDragging.current ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "pan-y",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          position: "relative",
          width: `${radiusX * 2 + responsiveImageWidth + containerPadding}px`,
          height: `${radiusY * 2 + responsiveImageHeight + containerPadding}px`,
        }}
      >
        {sorted.map((item) => (
          <div
            key={item.index}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              willChange: "transform",
              transform: `translate(-50%, -50%) translateX(${item.x}px) translateY(${item.y}px) scale(${item.scale})`,
              zIndex: Math.round(item.depthNorm * 100),
            }}
          >
            {mediaTypes[item.index] === "video" ? (
              <video
                src={videos[item.index]}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: `${responsiveImageWidth}px`,
                  height: `${responsiveImageHeight}px`,
                  objectFit: "cover",
                  display: "block",
                  borderRadius: `${imageRadius}px`,
                  pointerEvents: "none",
                }}
              />
            ) : (
              <img
                src={item.logo.src}
                alt={item.logo.alt || ""}
                style={{
                  width: `${responsiveImageWidth}px`,
                  height: `${responsiveImageHeight}px`,
                  objectFit: "cover",
                  display: "block",
                  borderRadius: `${imageRadius}px`,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

addPropertyControls(ImageRotator360, {
  mediaType1: {
    type: ControlType.Enum,
    title: "Media Type 1",
    options: ["image", "video"],
    optionTitles: ["Image", "Video"],
    defaultValue: "image",
    displaySegmentedControl: true,
  },
  logo1: {
    type: ControlType.ResponsiveImage,
    title: "Image 1",
    description: "First image in the rotation",
    hidden: ({ mediaType1 }) => mediaType1 === "video",
  },
  video1: {
    type: ControlType.File,
    title: "Video 1",
    allowedFileTypes: ["mp4", "webm", "mov"],
    hidden: ({ mediaType1 }) => mediaType1 === "image",
  },
  mediaType2: {
    type: ControlType.Enum,
    title: "Media Type 2",
    options: ["image", "video"],
    optionTitles: ["Image", "Video"],
    defaultValue: "image",
    displaySegmentedControl: true,
  },
  logo2: {
    type: ControlType.ResponsiveImage,
    title: "Image 2",
    description: "Second image in the rotation",
    hidden: ({ mediaType2 }) => mediaType2 === "video",
  },
  video2: {
    type: ControlType.File,
    title: "Video 2",
    allowedFileTypes: ["mp4", "webm", "mov"],
    hidden: ({ mediaType2 }) => mediaType2 === "image",
  },
  mediaType3: {
    type: ControlType.Enum,
    title: "Media Type 3",
    options: ["image", "video"],
    optionTitles: ["Image", "Video"],
    defaultValue: "image",
    displaySegmentedControl: true,
  },
  logo3: {
    type: ControlType.ResponsiveImage,
    title: "Image 3",
    description: "Third image in the rotation",
    hidden: ({ mediaType3 }) => mediaType3 === "video",
  },
  video3: {
    type: ControlType.File,
    title: "Video 3",
    allowedFileTypes: ["mp4", "webm", "mov"],
    hidden: ({ mediaType3 }) => mediaType3 === "image",
  },
  mediaType4: {
    type: ControlType.Enum,
    title: "Media Type 4",
    options: ["image", "video"],
    optionTitles: ["Image", "Video"],
    defaultValue: "image",
    displaySegmentedControl: true,
  },
  logo4: {
    type: ControlType.ResponsiveImage,
    title: "Image 4",
    description: "Fourth image in the rotation",
    hidden: ({ mediaType4 }) => mediaType4 === "video",
  },
  video4: {
    type: ControlType.File,
    title: "Video 4",
    allowedFileTypes: ["mp4", "webm", "mov"],
    hidden: ({ mediaType4 }) => mediaType4 === "image",
  },
  mediaType5: {
    type: ControlType.Enum,
    title: "Media Type 5",
    options: ["image", "video"],
    optionTitles: ["Image", "Video"],
    defaultValue: "image",
    displaySegmentedControl: true,
  },
  logo5: {
    type: ControlType.ResponsiveImage,
    title: "Image 5",
    description: "Fifth image in the rotation",
    hidden: ({ mediaType5 }) => mediaType5 === "video",
  },
  video5: {
    type: ControlType.File,
    title: "Video 5",
    allowedFileTypes: ["mp4", "webm", "mov"],
    hidden: ({ mediaType5 }) => mediaType5 === "image",
  },
  mediaType6: {
    type: ControlType.Enum,
    title: "Media Type 6",
    options: ["image", "video"],
    optionTitles: ["Image", "Video"],
    defaultValue: "image",
    displaySegmentedControl: true,
  },
  logo6: {
    type: ControlType.ResponsiveImage,
    title: "Image 6",
    description: "Sixth image in the rotation",
    hidden: ({ mediaType6 }) => mediaType6 === "video",
  },
  video6: {
    type: ControlType.File,
    title: "Video 6",
    allowedFileTypes: ["mp4", "webm", "mov"],
    hidden: ({ mediaType6 }) => mediaType6 === "image",
  },
  speed: {
    type: ControlType.Number,
    title: "Rotation Speed",
    description: "Time in seconds for one complete rotation",
    defaultValue: 14,
    min: 2,
    max: 30,
    step: 1,
    unit: "s",
  },
  imageWidth: {
    type: ControlType.Number,
    title: "Image Width",
    description: "Width of each image in pixels",
    defaultValue: 300,
    min: 50,
    max: 600,
    step: 10,
    unit: "px",
  },
  aspectRatio: {
    type: ControlType.Enum,
    title: "Aspect Ratio",
    description: "Image aspect ratio (width:height)",
    options: [1, 1.33, 1.5, 1.78, 0.75, 0.67],
    optionTitles: ["1:1 (Square)", "4:3", "3:2", "16:9", "3:4 (Portrait)", "2:3 (Portrait)"],
    defaultValue: 1,
  },
  imageRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    description: "Corner radius of the images",
    defaultValue: 10,
    min: 0,
    max: 100,
    step: 1,
    unit: "px",
  },
})
