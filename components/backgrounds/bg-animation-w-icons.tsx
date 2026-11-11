import { useEffect, useRef, useState, useMemo, startTransition } from "react"
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

/**
 * Animated Icon Background
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function IconBackground(props) {
  const {
    icon = "favorite",
    iconCount = 20,
    minSize = 20,
    maxSize = 60,
    minOpacity = 0.2,
    maxOpacity = 0.8,
    iconColor = "#000000",
    hueRotation = 0,
    animationSpeed = 5,
    enableScaleAnimation = false,
    scaleAmount = 2,
    xRotationAmount = 360,
    yRotationAmount = 360,
    zRotationAmount = 360,
    enableSlideEffect = false,
    slideAmount = 100,
    slideDirection = "left",
    randomizationFactor = 5,
    blendMode = "normal",
    style,
  } = props

  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const isStatic = useIsStaticRenderer()

  useEffect(() => {
    if (isStatic || !containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        startTransition(() => {
          setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          })
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    
    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [isStatic])

  const icons = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return []
    
    // Helper function to add randomization based on randomizationFactor
    const randomize = (value, min, max) => {
      const randomRange = ((max - min) * (randomizationFactor / 10))
      const randomOffset = (Math.random() * randomRange) - (randomRange / 2)
      return Math.max(min, Math.min(max, value + randomOffset))
    }
    
    return Array.from({ length: iconCount }).map((_, i) => {
      // Apply randomization to all parameters
      const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize
      const opacity = Math.random() * (maxOpacity - minOpacity) + minOpacity
      const rotX = randomize(Math.random() * xRotationAmount, 0, xRotationAmount)
      const rotY = randomize(Math.random() * yRotationAmount, 0, yRotationAmount)
      const rotZ = randomize(Math.random() * zRotationAmount, 0, zRotationAmount)
      
      // Calculate slide direction and amount
      let slideX = 0
      let slideY = 0
      
      if (slideDirection === "left") slideX = -slideAmount
      else if (slideDirection === "right") slideX = slideAmount
      else if (slideDirection === "top") slideY = -slideAmount
      else if (slideDirection === "bottom") slideY = slideAmount
      const animDuration = randomize((Math.random() * 8 + 7) / animationSpeed, 5 / animationSpeed, 20 / animationSpeed)
      
      // Calculate hue rotation for this icon
      const iconHueRotation = hueRotation > 0 ? Math.random() * hueRotation : 0
      
      // Fade in/out timing
      const fadeDelay = Math.random() * 10
      const fadeDuration = Math.random() * 3 + 2
      const shouldFade = Math.random() > 0.5
      
      return {
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: randomize(size, minSize, maxSize),
        opacity: randomize(opacity, minOpacity, maxOpacity),
        rotateX: rotX,
        rotateY: rotY,
        rotateZ: rotZ,
        animationDuration: animDuration,
        hueRotation: iconHueRotation,
        fadeDelay,
        fadeDuration,
        shouldFade,
      }
    })
  }, [dimensions, iconCount, minSize, maxSize, minOpacity, maxOpacity, iconColor, hueRotation, animationSpeed, scaleAmount, xRotationAmount, yRotationAmount, zRotationAmount, enableSlideEffect, slideAmount, slideDirection, randomizationFactor])

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      {isStatic ? (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          width: "100%", 
          height: "100%",
          color: iconColor,
          opacity: 0.5,
          filter: hueRotation > 0 ? `hue-rotate(${hueRotation/2}deg)` : "none"
        }}>
          <span className="material-icons" style={{ fontSize: 40, pointerEvents: 'none' }}>{icon}</span>
        </div>
      ) : (
        icons.map((iconItem) => (
          <motion.div
            key={iconItem.id}
            style={{
              position: "absolute",
              left: iconItem.x,
              top: iconItem.y,
              color: iconColor,
              opacity: iconItem.opacity,
              transformStyle: "preserve-3d",
              backfaceVisibility: "visible",
              mixBlendMode: blendMode,
              filter: iconItem.hueRotation > 0 ? `hue-rotate(${iconItem.hueRotation}deg)` : "none",
            }}
            initial={{
              rotateX: iconItem.rotateX,
              rotateY: iconItem.rotateY,
              rotateZ: iconItem.rotateZ,
            }}
            animate={{
              rotateX: [iconItem.rotateX, iconItem.rotateX + xRotationAmount],
              rotateY: [iconItem.rotateY, iconItem.rotateY + yRotationAmount],
              rotateZ: [iconItem.rotateZ, iconItem.rotateZ + zRotationAmount],
              scale: enableScaleAnimation ? [1, scaleAmount, 1] : 1,
              x: enableSlideEffect && (slideDirection === "left" || slideDirection === "right") 
                ? [0, slideDirection === "left" ? -slideAmount : slideAmount] 
                : 0,
              y: enableSlideEffect && (slideDirection === "top" || slideDirection === "bottom")
                ? [0, slideDirection === "top" ? -slideAmount : slideAmount]
                : 0,
            }}
            transition={{
              duration: iconItem.animationDuration,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <span className="material-icons" style={{ fontSize: iconItem.size, pointerEvents: 'none' }}>
              {icon}
            </span>
          </motion.div>
        ))
      )}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
    </div>
  )
}

addPropertyControls(IconBackground, {
  icon: {
    type: ControlType.Enum,
    title: "Icon",
    defaultValue: "favorite",
    searchable: true,
    options: [
      "ac_unit", "account_balance", "announcement", "apartment", "attach_money", "audiotrack",
      "backpack", "bathtub", "battery_full", "beach_access", "bedtime", "bluetooth", "bolt", "book", "bookmark", "bookmark_border", "brightness_high", "brightness_low", "build", "business",
      "cake", "camera", "card_giftcard", "castle", "celebration", "chat", "church", "cleaning_services", "cloud", "construction", "credit_card",
      "dark_mode", "desktop_windows", "directions_bike", "directions_boat", "directions_bus", "directions_car", "directions_railway", "directions_run", "directions_subway", "directions_walk", "dry_cleaning",
      "earthquake", "eco", "electric_car", "electric_scooter", "email", "error", "error_outline",
      "face", "face_unlock", "favorite", "fingerprint", "fireplace", "fitness_center", "flight", "flight_land", "flight_takeoff", "flood", "foggy", "forest", "forum",
      "grass",
      "handyman", "hardware", "healing", "headphones", "help", "help_outline", "hiking", "home", "hot_tub", "house", "hurricane",
      "info", "iron",
      "key", "keyboard",
      "landscape", "laptop", "laundry", "library_books", "light", "lightbulb", "light_mode", "local_airport", "local_atm", "local_bar", "local_cafe", "local_fire_department", "local_gas_station", "local_hotel", "local_mall", "local_movies", "local_parking", "local_pharmacy", "local_pizza", "local_post_office", "local_shipping", "local_taxi", "location_city", "lock", "lock_open", "luggage",
      "mail", "medical_services", "medication", "memory", "menu_book", "message", "mic", "mood", "mood_bad", "mouse", "movie", "music_note",
      "nights_stay", "notification_important",
      "park", "password", "payments", "pedal_bike", "pets", "phone", "photo", "plumbing", "pool", "power", "priority_high",
      "rainy", "redeem", "report", "report_problem", "restaurant", "rocket", "rowing",
      "sailing", "sanitizer", "savings", "school", "sd_card", "security", "sell", "sentiment_dissatisfied", "sentiment_neutral", "sentiment_satisfied", "settings", "shield", "shopping_bag", "shopping_cart", "shower", "smartphone", "snowy", "soap", "spa", "speaker", "sports_baseball", "sports_basketball", "sports_football", "sports_golf", "sports_hockey", "sports_soccer", "sports_tennis", "sports_volleyball", "star", "storefront", "subway", "surfing",
      "terrain", "thermostat", "thunderstorm", "tools", "tornado", "train", "tv",
      "umbrella", "usb",
      "vaccines", "videocam", "volcano",
      "watch", "water_drop", "waves", "wb_cloudy", "wb_sunny", "wifi"
    ],
    optionTitles: [
      "❄ ac_unit", "🏦 account_balance", "📢 announcement", "🏢 apartment", "💰 attach_money", "🎵 audiotrack",
      "🎒 backpack", "🛁 bathtub", "🔋 battery_full", "🏖 beach_access", "🌙 bedtime", "📶 bluetooth", "⚡ bolt", "📚 book", "🔖 bookmark", "🔖 bookmark_border", "☀ brightness_high", "☀ brightness_low", "🔧 build", "🏢 business",
      "🎂 cake", "📷 camera", "🎁 card_giftcard", "🏰 castle", "🎉 celebration", "💬 chat", "⛪ church", "🧹 cleaning_services", "☁ cloud", "🚧 construction", "💳 credit_card",
      "🌙 dark_mode", "🖥 desktop_windows", "🚲 directions_bike", "🚢 directions_boat", "🚌 directions_bus", "🚗 directions_car", "🚆 directions_railway", "🏃 directions_run", "🚇 directions_subway", "🚶 directions_walk", "👔 dry_cleaning",
      "🌍 earthquake", "🍃 eco", "🚗 electric_car", "🛴 electric_scooter", "📧 email", "⛔ error", "⚠ error_outline",
      "☺ face", "👤 face_unlock", "♥ favorite", "👆 fingerprint", "🔥 fireplace", "🏋 fitness_center", "✈ flight", "✈ flight_land", "✈ flight_takeoff", "🌊 flood", "🌫 foggy", "🌲 forest", "💬 forum",
      "🌿 grass",
      "🔧 handyman", "🔨 hardware", "🏥 healing", "🎧 headphones", "❓ help", "❓ help_outline", "🥾 hiking", "🏠 home", "♨ hot_tub", "🏠 house", "🌀 hurricane",
      "ℹ info", "🔥 iron",
      "🔑 key", "⌨ keyboard",
      "🏞 landscape", "💻 laptop", "🧺 laundry", "📚 library_books", "💡 light", "💡 lightbulb", "☀ light_mode", "✈ local_airport", "🏧 local_atm", "🍸 local_bar", "☕ local_cafe", "🔥 local_fire_department", "⛽ local_gas_station", "🏨 local_hotel", "🛍 local_mall", "🎬 local_movies", "🅿 local_parking", "💊 local_pharmacy", "🍕 local_pizza", "📯 local_post_office", "🚚 local_shipping", "🚕 local_taxi", "🏙 location_city", "🔒 lock", "🔓 lock_open", "🧳 luggage",
      "✉ mail", "🏥 medical_services", "💊 medication", "🧠 memory", "📖 menu_book", "💬 message", "🎤 mic", "😊 mood", "☹ mood_bad", "🖱 mouse", "🎬 movie", "♪ music_note",
      "🌙 nights_stay", "🔔 notification_important",
      "🌳 park", "🔑 password", "💳 payments", "🚲 pedal_bike", "🐾 pets", "📞 phone", "🖼 photo", "🔧 plumbing", "🏊 pool", "⚡ power", "❗ priority_high",
      "🌧 rainy", "🎁 redeem", "⚠ report", "⚠ report_problem", "🍽 restaurant", "🚀 rocket", "🚣 rowing",
      "⛵ sailing", "🧴 sanitizer", "💰 savings", "🏫 school", "💾 sd_card", "🔒 security", "💰 sell", "🙁 sentiment_dissatisfied", "😐 sentiment_neutral", "🙂 sentiment_satisfied", "⚙ settings", "🛡 shield", "🛍 shopping_bag", "🛒 shopping_cart", "🚿 shower", "📱 smartphone", "❄ snowy", "🧼 soap", "🌿 spa", "🔊 speaker", "⚾ sports_baseball", "🏀 sports_basketball", "🏈 sports_football", "⛳ sports_golf", "🏒 sports_hockey", "⚽ sports_soccer", "🎾 sports_tennis", "🏐 sports_volleyball", "★ star", "🏪 storefront", "🚇 subway", "🏄 surfing",
      "⛰ terrain", "🌡 thermostat", "⛈ thunderstorm", "🔧 tools", "🌪 tornado", "🚆 train", "📺 tv",
      "☂ umbrella", "📀 usb",
      "💉 vaccines", "📹 videocam", "🌋 volcano",
      "⌚ watch", "💧 water_drop", "〰 waves", "☁ wb_cloudy", "☀ wb_sunny", "📶 wifi"
    ]
  },
  iconCount: {
    type: ControlType.Number,
    title: "Icon Count",
    defaultValue: 20,
    min: 5,
    max: 100,
    step: 1,
  },
  minSize: {
    type: ControlType.Number,
    title: "Min Size",
    defaultValue: 20,
    min: 10,
    max: 50,
    step: 1,
  },
  maxSize: {
    type: ControlType.Number,
    title: "Max Size",
    defaultValue: 60,
    min: 20,
    max: 100,
    step: 1,
  },
  minOpacity: {
    type: ControlType.Number,
    title: "Min Opacity",
    defaultValue: 0.2,
    min: 0.1,
    max: 0.9,
    step: 0.1,
  },
  maxOpacity: {
    type: ControlType.Number,
    title: "Max Opacity",
    defaultValue: 0.8,
    min: 0.2,
    max: 1,
    step: 0.1,
  },
  iconColor: {
    type: ControlType.Color,
    title: "Icon Color",
    defaultValue: "#000000",
  },
  hueRotation: {
    type: ControlType.Number,
    title: "Hue Variation",
    defaultValue: 0,
    min: 0,
    max: 360,
    step: 10,
    description: "Randomizes hue rotation for each icon",
  },
  animationSpeed: {
    type: ControlType.Number,
    title: "Animation Speed",
    defaultValue: 5,
    min: 0.1,
    max: 10,
    step: 0.1,
  },
  enableScaleAnimation: {
    type: ControlType.Boolean,
    title: "Scale Animation",
    defaultValue: false,
    enabledTitle: "On",
    disabledTitle: "Off"
  },
  scaleAmount: {
    type: ControlType.Number,
    title: "Scale Amount",
    defaultValue: 2,
    min: 1,
    max: 10,
    step: 0.5,
    hidden: ({ enableScaleAnimation }) => !enableScaleAnimation,
  },
  xRotationAmount: {
    type: ControlType.Number,
    title: "X Rotation",
    defaultValue: 360,
    min: 0,
    max: 360,
    step: 10,
  },
  yRotationAmount: {
    type: ControlType.Number,
    title: "Y Rotation",
    defaultValue: 360,
    min: 0,
    max: 360,
    step: 10,
  },
  zRotationAmount: {
    type: ControlType.Number,
    title: "Z Rotation",
    defaultValue: 360,
    min: 0,
    max: 360,
    step: 10,
  },
  enableSlideEffect: {
    type: ControlType.Boolean,
    title: "Slide Effect",
    defaultValue: false,
    enabledTitle: "On",
    disabledTitle: "Off"
  },
  slideAmount: {
    type: ControlType.Number,
    title: "Slide Amount",
    defaultValue: 100,
    min: 10,
    max: 500,
    step: 10,
    hidden: ({ enableSlideEffect }) => !enableSlideEffect,
  },
  slideDirection: {
    type: ControlType.Enum,
    title: "Slide Direction",
    defaultValue: "left",
    options: ["left", "right", "top", "bottom"],
    optionTitles: ["←", "→", "↑", "↓"],
    displaySegmentedControl: true,
    hidden: ({ enableSlideEffect }) => !enableSlideEffect,
  },
  randomizationFactor: {
    type: ControlType.Number,
    title: "Randomization",
    defaultValue: 5,
    min: 1,
    max: 10,
    step: 1,
  },
  blendMode: {
    type: ControlType.Enum,
    title: "Blend Mode",
    defaultValue: "normal",
    options: ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"],
    optionTitles: ["Normal", "Multiply", "Screen", "Overlay", "Darken", "Lighten", "Color Dodge", "Color Burn", "Hard Light", "Soft Light", "Difference", "Exclusion", "Hue", "Saturation", "Color", "Luminosity"],
  },

})