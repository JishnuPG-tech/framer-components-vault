// Create a Framer React component called ReelCarousel. This should be an automatic reel-style carousel with smooth animation transitions, customizable playback, and fully styled controls.

import React, { useState, useEffect, useRef, startTransition, type CSSProperties } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Reel {
  image: {
    src: string
    alt: string
  }
  date: string
  title: string
  description: string
}

interface ReelCarouselProps {
  reels: Reel[]
  autoPlaySpeed: number
  pauseOnHover: boolean
  theme: "dark" | "light" | "brand" | "minimal" | "custom"
  backgroundColor: string
  textColor: string
  dateColor: string
  overlayColor: string
  progressColor: string
  showDate: boolean
  showTitle: boolean
  showDescription: boolean
  showControls: boolean
  titleFont: any
  descriptionFont: any
  dateFont: any
  animationPreset: "smooth" | "quick" | "elegant" | "dynamic"
  animationTiming: number
  sizingMode: "fixed" | "responsive" | "aspectRatio"
  borderRadius: number
  padding: number
  contentAlignment: "bottom" | "top" | "center" | "bottomLeft" | "bottomRight" | "topLeft" | "topRight"
  elementOrder: string
  contentSpacing: number
  elementSpacing: number
  showArrows: boolean
  arrowType: "chevron" | "arrow" | "triangle" | "circle"
  arrowPosition: "sides" | "bottom"
  arrowSize: number
  arrowColor: string
  arrowOpacity: number
  progressBarHeight: number
  progressBarRadius: number
  playPauseIconSize: number
  style?: CSSProperties
}

const defaultReels: Reel[] = [
  {
    image: {
      src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
      alt: "Gradient 1 - Blue"
    },
    date: "2024-01-15",
    title: "Mountain Adventure",
    description: "Exploring the breathtaking peaks and valleys during winter season."
  },
  {
    image: {
      src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
      alt: "Gradient 2 - Purple"
    },
    date: "2024-01-20",
    title: "Ocean Serenity",
    description: "Capturing peaceful moments where the ocean meets the horizon."
  },
  {
    image: {
      src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
      alt: "Gradient 3 - Orange"
    },
    date: "2024-01-25",
    title: "Forest Journey",
    description: "Walking through ancient woodland paths filled with mystery."
  }
]

const themePresets = {
  dark: {
    background: "#1a1a1a",
    text: "#ffffff",
    date: "#cccccc",
    overlay: "rgba(0, 0, 0, 0.6)",
    progress: "#ffffff"
  },
  light: {
    background: "#ffffff",
    text: "#000000",
    date: "#666666",
    overlay: "rgba(255, 255, 255, 0.6)",
    progress: "#000000"
  },
  brand: {
    background: "#0066ff",
    text: "#ffffff",
    date: "#e6f2ff",
    overlay: "rgba(0, 102, 255, 0.6)",
    progress: "#ffffff"
  },
  minimal: {
    background: "#f5f5f5",
    text: "#333333",
    date: "#888888",
    overlay: "rgba(245, 245, 245, 0.6)",
    progress: "#333333"
  },
  custom: {
    background: "#ffffff",
    text: "#000000",
    date: "#666666",
    overlay: "rgba(0, 0, 0, 0.4)",
    progress: "#000000"
  }
}

const animationPresets = {
  smooth: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  quick: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  elegant: { duration: 1.2, ease: [0.23, 1, 0.32, 1] },
  dynamic: { duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ReelCarousel(props: ReelCarouselProps) {
  const {
    reels = defaultReels,
    autoPlaySpeed = 4000,
    pauseOnHover = true,
    theme = "dark",
    backgroundColor,
    textColor,
    dateColor,
    overlayColor,
    progressColor,
    showDate = true,
    showTitle = true,
    showDescription = true,
    showControls = true,
    titleFont,
    descriptionFont,
    dateFont,
    animationPreset = "smooth",
    animationTiming = 800,
    sizingMode = "responsive",
    borderRadius = 12,
    padding = 24,
    contentAlignment = "bottom",
    elementOrder = "date,title,description",
    contentSpacing = 16,
    elementSpacing = 8,
    showArrows = true,
    arrowType = "chevron",
    arrowPosition = "sides",
    arrowSize = 40,
    arrowColor = "#ffffff",
    arrowOpacity = 0.7,
    progressBarHeight = 4,
    progressBarRadius = 2,
    style
  } = props

  const [currentReel, setCurrentReel] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const progressRef = useRef<number | null>(null)

  const currentTheme = theme === "custom" ? {
    background: backgroundColor,
    text: textColor,
    date: dateColor,
    overlay: overlayColor,
    progress: progressColor
  } : themePresets[theme]

  const animation = animationPresets[animationPreset]

  const startProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current)
    progressRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextReel()
          return 0
        }
        return prev + (100 / (autoPlaySpeed / 16))
      })
    }, 16)
  }

  const stopProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }
  }

  const nextReel = () => {
    startTransition(() => {
      setCurrentReel(prev => (prev + 1) % reels.length)
      setProgress(0)
    })
  }

  const prevReel = () => {
    startTransition(() => {
      setCurrentReel(prev => (prev - 1 + reels.length) % reels.length)
      setProgress(0)
    })
  }

  const jumpToReel = (index: number) => {
    startTransition(() => {
      setCurrentReel(index)
      setProgress(0)
    })
  }

  const togglePlayPause = () => {
    startTransition(() => {
      setIsPlaying(!isPlaying)
      setIsPaused(!isPaused)
    })
  }

  useEffect(() => {
    if (isPlaying && !isPaused) {
      startProgress()
    } else {
      stopProgress()
    }

    return () => stopProgress()
  }, [isPlaying, isPaused, autoPlaySpeed, currentReel])

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      startTransition(() => setIsPaused(true))
    }
  }

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      startTransition(() => setIsPaused(false))
    }
  }

  const getContentAlignmentStyles = (): CSSProperties => {
    const alignmentMap = {
      bottom: { justifyContent: "flex-end", alignItems: "flex-start" },
      top: { justifyContent: "flex-start", alignItems: "flex-start" },
      center: { justifyContent: "center", alignItems: "center" },
      bottomLeft: { justifyContent: "flex-end", alignItems: "flex-start" },
      bottomRight: { justifyContent: "flex-end", alignItems: "flex-end" },
      topLeft: { justifyContent: "flex-start", alignItems: "flex-start" },
      topRight: { justifyContent: "flex-start", alignItems: "flex-end" }
    }
    return alignmentMap[contentAlignment]
  }

  const renderArrowIcon = (direction: "left" | "right") => {
    const size = arrowSize * 0.6
    const iconStyle: CSSProperties = {
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const
    }

    switch (arrowType) {
      case "chevron":
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <polyline points={direction === "left" ? "15,18 9,12 15,6" : "9,18 15,12 9,6"} />
          </svg>
        )
      case "arrow":
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <line x1={direction === "left" ? "19" : "5"} y1="12" x2={direction === "left" ? "5" : "19"} y2="12" />
            <polyline points={direction === "left" ? "12,19 5,12 12,5" : "12,5 19,12 12,19"} />
          </svg>
        )
      case "triangle":
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <polygon points={direction === "left" ? "15,18 9,12 15,6" : "9,6 15,12 9,18"} />
          </svg>
        )
      case "circle":
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points={direction === "left" ? "14,8 10,12 14,16" : "10,8 14,12 10,16"} />
          </svg>
        )
      default:
        return null
    }
  }

  const renderContent = () => {
    const currentReelData = reels[currentReel]
    if (!currentReelData) return null
    
    const elements = elementOrder.split(",").map((element, index) => {
      const trimmedElement = element.trim()
      switch (trimmedElement) {
        case "date":
          return showDate ? (
            <motion.div
              key="date"
              style={{
                ...dateFont,
                color: currentTheme.date,
                margin: 0
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ ...animation, delay: 0.1 }}
            >
              {new Date(currentReelData.date).toLocaleDateString()}
            </motion.div>
          ) : null
        case "title":
          return showTitle ? (
            <motion.h2
              key="title"
              style={{
                ...titleFont,
                color: currentTheme.text,
                margin: 0
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ ...animation, delay: 0.2 }}
            >
              {currentReelData.title}
            </motion.h2>
          ) : null
        case "description":
          return showDescription ? (
            <motion.p
              key="description"
              style={{
                ...descriptionFont,
                color: currentTheme.text,
                opacity: 0.9,
                margin: 0
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ ...animation, delay: 0.3 }}
            >
              {currentReelData.description}
            </motion.p>
          ) : null
        default:
          return null
      }
    }).filter(Boolean)

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: contentSpacing }}>
        <div style={{ display: "flex", flexDirection: "column", gap: elementSpacing }}>
          {elements}
        </div>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius,
        backgroundColor: "#f5f5f5",
        color: "#888888",
        ...titleFont
      }}>
        No reels available
      </div>
    )
  }

  return (
    <div 
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
        borderRadius
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentReel}
          style={{
            position: "absolute",
            inset: 0
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={animation}
        >
          <img
            src={reels[currentReel]?.image?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"}
            alt={reels[currentReel]?.image?.alt || "Reel image"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${currentTheme.overlay}, transparent)`
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Progress Bars */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        zIndex: 20
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          gap: 4
        }}>
          {reels.map((_, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: progressBarHeight,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                borderRadius: progressBarRadius,
                cursor: "pointer"
              }}
              onClick={() => jumpToReel(index)}
            >
              <div
                style={{
                  height: "100%",
                  width: index === currentReel ? `${progress}%` : 
                         index < currentReel ? "100%" : "0%",
                  backgroundColor: currentTheme.progress,
                  borderRadius: progressBarRadius,
                  transition: index === currentReel ? "none" : "width 0.3s ease"
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Play/Pause Button */}
        {showControls && (
          <button
            onClick={togglePlayPause}
            style={{
              padding: 8,
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(4px)",
              border: "none",
              color: arrowColor,
              opacity: arrowOpacity,
              cursor: "pointer",
              transition: "opacity 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = arrowOpacity.toString()}
          >
            {isPlaying && !isPaused ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        padding,
        zIndex: 10,
        ...getContentAlignmentStyles()
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentReel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={animation}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      {showControls && (
        <>
          {/* Navigation Arrows */}
          {showArrows && arrowPosition === "sides" && (
            <>
              <button
                onClick={prevReel}
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 20,
                  width: arrowSize,
                  height: arrowSize,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(4px)",
                  border: "none",
                  color: arrowColor,
                  opacity: arrowOpacity,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = arrowOpacity.toString()}
              >
                {renderArrowIcon("left")}
              </button>
              <button
                onClick={nextReel}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 20,
                  width: arrowSize,
                  height: arrowSize,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(4px)",
                  border: "none",
                  color: arrowColor,
                  opacity: arrowOpacity,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = arrowOpacity.toString()}
              >
                {renderArrowIcon("right")}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

addPropertyControls(ReelCarousel, {
  reels: {
    type: ControlType.Array,
    title: "Reels",
    control: {
      type: ControlType.Object,
      controls: {
        image: {
          type: ControlType.ResponsiveImage,
          title: "Image"
        },
        date: {
          type: ControlType.String,
          title: "Date",
          defaultValue: "2024-01-15"
        },
        title: {
          type: ControlType.String,
          title: "Title",
          defaultValue: "Reel Title"
        },
        description: {
          type: ControlType.String,
          title: "Description",
          defaultValue: "Reel description text",
          displayTextArea: true
        }
      }
    },
    defaultValue: defaultReels,
    maxCount: 10
  },
  autoPlaySpeed: {
    type: ControlType.Number,
    title: "Auto Play Speed",
    defaultValue: 4000,
    min: 1000,
    max: 10000,
    step: 500,
    unit: "ms"
  },
  pauseOnHover: {
    type: ControlType.Boolean,
    title: "Pause on Hover",
    defaultValue: true,
    enabledTitle: "Yes",
    disabledTitle: "No"
  },
  theme: {
    type: ControlType.Enum,
    title: "Theme",
    options: ["dark", "light", "brand", "minimal", "custom"],
    optionTitles: ["Dark", "Light", "Brand", "Minimal", "Custom"],
    defaultValue: "dark"
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background Color",
    defaultValue: "#FFFFFF",
    hidden: ({ theme }) => theme !== "custom"
  },
  textColor: {
    type: ControlType.Color,
    title: "Text Color",
    defaultValue: "#000000",
    hidden: ({ theme }) => theme !== "custom"
  },
  dateColor: {
    type: ControlType.Color,
    title: "Date Color",
    defaultValue: "#CCCCCC",
    hidden: ({ theme }) => theme !== "custom"
  },
  overlayColor: {
    type: ControlType.Color,
    title: "Overlay Color",
    defaultValue: "rgba(0, 0, 0, 0.4)",
    hidden: ({ theme }) => theme !== "custom"
  },
  progressColor: {
    type: ControlType.Color,
    title: "Progress Color",
    defaultValue: "#000000",
    hidden: ({ theme }) => theme !== "custom"
  },
  showDate: {
    type: ControlType.Boolean,
    title: "Show Date",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide"
  },
  showTitle: {
    type: ControlType.Boolean,
    title: "Show Title",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide"
  },
  showDescription: {
    type: ControlType.Boolean,
    title: "Show Description",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide"
  },
  showControls: {
    type: ControlType.Boolean,
    title: "Show Controls",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide"
  },
  titleFont: {
    type: ControlType.Font,
    title: "Title Font",
    defaultValue: {
      fontSize: "32px",
      variant: "Semibold",
      letterSpacing: "-0.03em",
      lineHeight: "1em"
    },
    controls: "extended",
    defaultFontType: "sans-serif"
  },
  descriptionFont: {
    type: ControlType.Font,
    title: "Description Font",
    defaultValue: {
      fontSize: "15px",
      variant: "Medium",
      letterSpacing: "-0.01em",
      lineHeight: "1.3em"
    },
    controls: "extended",
    defaultFontType: "sans-serif"
  },
  dateFont: {
    type: ControlType.Font,
    title: "Date Font",
    defaultValue: {
      fontSize: "14px",
      variant: "Medium",
      letterSpacing: "-0.01em",
      lineHeight: "1em"
    },
    controls: "extended",
    defaultFontType: "sans-serif"
  },
  animationPreset: {
    type: ControlType.Enum,
    title: "Animation Preset",
    options: ["smooth", "quick", "elegant", "dynamic"],
    optionTitles: ["Smooth", "Quick", "Elegant", "Dynamic"],
    defaultValue: "smooth"
  },
  animationTiming: {
    type: ControlType.Number,
    title: "Animation Timing",
    defaultValue: 800,
    min: 200,
    max: 2000,
    step: 100,
    unit: "ms"
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    defaultValue: 12,
    min: 0,
    max: 50,
    step: 1,
    unit: "px"
  },
  padding: {
    type: ControlType.Number,
    title: "Content Padding",
    defaultValue: 24,
    min: 0,
    max: 60,
    step: 4,
    unit: "px"
  },
  contentAlignment: {
    type: ControlType.Enum,
    title: "Content Alignment",
    options: ["bottom", "top", "center", "bottomLeft", "bottomRight", "topLeft", "topRight"],
    optionTitles: ["Bottom", "Top", "Center", "Bottom Left", "Bottom Right", "Top Left", "Top Right"],
    defaultValue: "bottom"
  },
  elementOrder: {
    type: ControlType.String,
    title: "Element Order",
    defaultValue: "date,title,description",
    placeholder: "date,title,description"
  },
  contentSpacing: {
    type: ControlType.Number,
    title: "Content Spacing",
    defaultValue: 16,
    min: 0,
    max: 40,
    step: 4,
    unit: "px"
  },
  elementSpacing: {
    type: ControlType.Number,
    title: "Element Spacing",
    defaultValue: 8,
    min: 0,
    max: 20,
    step: 2,
    unit: "px"
  },
  showArrows: {
    type: ControlType.Boolean,
    title: "Show Arrows",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide"
  },
  arrowType: {
    type: ControlType.Enum,
    title: "Arrow Type",
    options: ["chevron", "arrow", "triangle", "circle"],
    optionTitles: ["Chevron", "Arrow", "Triangle", "Circle"],
    defaultValue: "chevron",
    hidden: ({ showArrows }) => !showArrows
  },
  arrowPosition: {
    type: ControlType.Enum,
    title: "Arrow Position",
    options: ["sides", "bottom"],
    optionTitles: ["Sides", "Bottom"],
    defaultValue: "sides",
    displaySegmentedControl: true,
    hidden: ({ showArrows }) => !showArrows
  },
  arrowSize: {
    type: ControlType.Number,
    title: "Arrow Size",
    defaultValue: 40,
    min: 20,
    max: 80,
    step: 4,
    unit: "px",
    hidden: ({ showArrows }) => !showArrows
  },
  arrowColor: {
    type: ControlType.Color,
    title: "Arrow Color",
    defaultValue: "#FFFFFF",
    hidden: ({ showArrows }) => !showArrows
  },
  arrowOpacity: {
    type: ControlType.Number,
    title: "Arrow Opacity",
    defaultValue: 0.7,
    min: 0,
    max: 1,
    step: 0.1,
    hidden: ({ showArrows }) => !showArrows
  },
  progressBarHeight: {
    type: ControlType.Number,
    title: "Progress Bar Height",
    defaultValue: 4,
    min: 1,
    max: 10,
    step: 1,
    unit: "px"
  },
  progressBarRadius: {
    type: ControlType.Number,
    title: "Progress Bar Radius",
    defaultValue: 2,
    min: 0,
    max: 10,
    step: 1,
    unit: "px"
  }
})