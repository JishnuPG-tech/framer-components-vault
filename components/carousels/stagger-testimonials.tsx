"use client"

import * as React from "react"
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

const SQRT_5000 = Math.sqrt(5000)

export interface TestimonialInput {
  quote?: string
  name?: string
  role?: string
  avatar?: any
  avatarUrl?: string
  // Backward compatibility with older object schemas
  testimonial?: string
  by?: string
  imgSrc?: string
}

export const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
]

export const DEFAULT_TESTIMONIALS_INPUT: TestimonialInput[] = [
  {
    quote: "The motion fidelity and reactive performance unlocked our highest conversion rate to date.",
    name: "Elena Vance",
    role: "Head of Product Design at Monolith",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote: "Deploying these physics-based interactive components reduced our design-to-code sprint by 60%.",
    name: "Marcus Chen",
    role: "Staff Frontend Architect at Vektor",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote: "A masterclass in modern digital craft. Clients regularly ask what custom agency built our site.",
    name: "Sophia Thorne",
    role: "Creative Director at Hyperion Studio",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote: "The tactile spring feel and typographic precision is unlike anything else in the React ecosystem.",
    name: "Liam O'Connor",
    role: "Design Engineer at Kinetic",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote: "Replaced three bloated animation libraries with one sleek, maintainable component suite.",
    name: "Amara Okafor",
    role: "VP of Engineering at Aura Labs",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote: "Everything feels bespoke, fluid, and dialed in to the exact pixel. Pure satisfaction.",
    name: "Julian Mercer",
    role: "Founder at Northstar Creative",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote: "Our marketing landing pages now feel like native interactive apps rather than static documents.",
    name: "Chloe Rivera",
    role: "Principal UX at Horizon",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
  },
  {
    quote: "Zero layout shift, buttery-smooth 60fps spring transitions, and breathtaking aesthetic depth.",
    name: "Tariq Al-Mansoor",
    role: "Tech Lead at Nexus Dynamic",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
  },
]

function getAvatarUrl(item: TestimonialInput, fallbackUrl: string): string {
  if (typeof item.avatar === "string" && item.avatar.trim().length > 0) {
    return item.avatar.trim()
  }
  if (typeof item.avatar === "object" && item.avatar && "src" in item.avatar && typeof item.avatar.src === "string") {
    return item.avatar.src
  }
  if (typeof item.avatarUrl === "string" && item.avatarUrl.trim().length > 0) {
    return item.avatarUrl.trim()
  }
  if (typeof item.imgSrc === "string" && item.imgSrc.trim().length > 0) {
    return item.imgSrc.trim()
  }
  return fallbackUrl
}

export interface StaggerTestimonialsProps {
  testimonials?: TestimonialInput[]
  backgroundColor?: string
  activeCardBg?: string
  inactiveCardBg?: string
  accentColor?: string
  textColor?: string
  mutedTextColor?: string
  cardSizeDesktop?: number
  height?: string | number
  style?: React.CSSProperties
  className?: string
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function StaggerTestimonials({
  testimonials = DEFAULT_TESTIMONIALS_INPUT,
  backgroundColor = "#07080b",
  activeCardBg = "#0f1118",
  inactiveCardBg = "#16181f",
  accentColor = "#0055ff",
  textColor = "#ffffff",
  mutedTextColor = "#9ca3af",
  cardSizeDesktop = 360,
  height = "620px",
  style,
  className = "",
}: StaggerTestimonialsProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [cardSize, setCardSize] = React.useState(cardSizeDesktop)

  // Normalize user-supplied testimonials
  const sourceList = testimonials && testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS_INPUT
  const parsedItems = sourceList.map((t, idx) => ({
    id: idx,
    quote: t.quote || t.testimonial || "Exceptional speed, polish, and execution.",
    name: t.name || t.by || `Client ${idx + 1}`,
    role: t.role || "",
    avatar: getAvatarUrl(t, DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length]),
  }))

  // Ensure minimum depth of 8 items for smooth circular spring physics
  let activeData = [...parsedItems]
  while (activeData.length < 8) {
    const startId = activeData.length
    activeData = [
      ...activeData,
      ...parsedItems.map((item, i) => ({
        ...item,
        id: startId + i,
      })),
    ]
  }

  const total = activeData.length

  const handleMove = (direction: number) => {
    setActiveIndex((prev) => {
      let next = (prev + direction) % total
      if (next < 0) next += total
      return next
    })
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const updateSize = () => {
      const isDesktop = window.innerWidth >= 640
      setCardSize(isDesktop ? cardSizeDesktop : Math.min(290, window.innerWidth - 40))
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [cardSizeDesktop])

  return (
    <div
      className={"relative w-full overflow-hidden select-none " + className}
      style={{
        height,
        backgroundColor,
        position: "relative",
        ...style,
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 440,
          height: 320,
          borderRadius: 9999,
          backgroundColor: accentColor,
          filter: "blur(120px)",
          opacity: 0.18,
          pointerEvents: "none",
        }}
      />

      {/* Cards Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {activeData.map((testimonial, index) => {
          let diff = index - activeIndex
          while (diff > total / 2) diff -= total
          while (diff < -total / 2) diff += total
          const position = diff
          const isCenter = position === 0
          const absPos = Math.abs(position)

          // Off-screen buffer slots keep entering/exiting cards in fluid motion
          if (absPos > 5) return null

          const xOffset = position * (cardSize * 0.72)
          const yOffset = isCenter ? -45 : Math.min(absPos * 14, 32)
          const scale = isCenter ? 1.04 : Math.max(0.66, 1 - absPos * 0.08)
          const rotate = isCenter ? 0 : position > 0 ? 2.5 + (absPos - 1) * 1.5 : -2.5 - (absPos - 1) * 1.5
          const zIndex = Math.max(1, 30 - absPos * 5)
          const opacity = isCenter ? 1 : absPos >= 4 ? 0 : Math.max(0.2, 1 - absPos * 0.26)
          const isInteractive = isCenter || absPos <= 3

          return (
            <motion.div
              key={testimonial.id}
              onClick={() => {
                if (position !== 0 && isInteractive) handleMove(position)
              }}
              initial={false}
              animate={{
                x: xOffset,
                y: yOffset,
                scale,
                rotate,
                opacity,
                zIndex,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 24,
                mass: 0.8,
              }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -cardSize / 2,
                marginTop: -cardSize / 2,
                cursor: isCenter ? "default" : isInteractive ? "pointer" : "default",
                pointerEvents: isInteractive ? "auto" : "none",
                padding: 32,
                width: cardSize,
                height: cardSize,
                backgroundColor: isCenter ? activeCardBg : inactiveCardBg,
                color: isCenter ? textColor : mutedTextColor,
                border: `1.5px solid ${isCenter ? accentColor : "rgba(255, 255, 255, 0.08)"}`,
                clipPath: "polygon(44px 0%, calc(100% - 44px) 0%, 100% 44px, 100% 100%, calc(100% - 44px) 100%, 44px 100%, 0 100%, 0 0)",
                boxShadow: isCenter
                  ? `0px 14px 32px -4px rgba(0, 85, 255, 0.35), 0px 6px 0px 2px ${accentColor}`
                  : "0px 4px 14px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* Clipped corner accent fold */}
              <span
                style={{
                  position: "absolute",
                  right: -2,
                  top: 42,
                  width: SQRT_5000,
                  height: 2,
                  backgroundColor: isCenter ? accentColor : "rgba(255, 255, 255, 0.15)",
                  transform: "rotate(45deg)",
                  transformOrigin: "top right",
                }}
              />

              {/* Avatar image with offset shadow */}
              <div style={{ position: "relative", marginBottom: 20, display: "inline-block" }}>
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  style={{
                    height: 54,
                    width: 54,
                    objectFit: "cover",
                    objectPosition: "center",
                    borderRadius: 4,
                    boxShadow: isCenter ? `3px 3px 0px ${accentColor}` : "3px 3px 0px #09090b",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                />
              </div>

              {/* Testimonial Quote */}
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.45,
                  letterSpacing: "-0.01em",
                  color: isCenter ? textColor : mutedTextColor,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </h3>

              {/* Author and Role */}
              <div
                style={{
                  position: "absolute",
                  bottom: 28,
                  left: 32,
                  right: 32,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isCenter ? textColor : mutedTextColor,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {testimonial.name}
                </p>
                {testimonial.role && (
                  <p
                    style={{
                      margin: "3px 0 0 0",
                      fontSize: 12,
                      fontWeight: 500,
                      color: isCenter ? "rgba(255, 255, 255, 0.7)" : "rgba(156, 163, 175, 0.7)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {testimonial.role}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 14,
          zIndex: 40,
        }}
      >
        <button
          type="button"
          onClick={() => handleMove(-1)}
          aria-label="Previous testimonial"
          style={{
            height: 48,
            width: 48,
            borderRadius: 12,
            backgroundColor: "#13151b",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleMove(1)}
          aria-label="Next testimonial"
          style={{
            height: 48,
            width: 48,
            borderRadius: 12,
            backgroundColor: "#13151b",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

addPropertyControls(StaggerTestimonials, {
  testimonials: {
    type: ControlType.Array,
    title: "Testimonials",
    control: {
      type: ControlType.Object,
      controls: {
        quote: {
          type: ControlType.String,
          title: "Quote",
          defaultValue: "The motion fidelity and reactive performance unlocked our highest conversion rate to date.",
          displayTextArea: true,
        },
        name: {
          type: ControlType.String,
          title: "Name",
          defaultValue: "Elena Vance",
        },
        role: {
          type: ControlType.String,
          title: "Role",
          defaultValue: "Head of Product Design at Monolith",
        },
        avatar: {
          type: ControlType.ResponsiveImage,
          title: "Avatar",
        },
        avatarUrl: {
          type: ControlType.String,
          title: "Avatar URL",
          defaultValue: "",
        },
      },
    },
    defaultValue: DEFAULT_TESTIMONIALS_INPUT,
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#07080b",
  },
  accentColor: {
    type: ControlType.Color,
    title: "Accent",
    defaultValue: "#0055ff",
  },
  activeCardBg: {
    type: ControlType.Color,
    title: "Active Card",
    defaultValue: "#0f1118",
  },
  inactiveCardBg: {
    type: ControlType.Color,
    title: "Inactive Card",
    defaultValue: "#16181f",
  },
  cardSizeDesktop: {
    type: ControlType.Number,
    title: "Card Size",
    min: 240,
    max: 480,
    step: 10,
    defaultValue: 360,
  },
  height: {
    type: ControlType.String,
    title: "Height",
    defaultValue: "620px",
  },
})
