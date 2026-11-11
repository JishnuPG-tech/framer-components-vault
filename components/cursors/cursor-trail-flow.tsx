import { useEffect, useCallback, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CursorTrailProps {
  images: {
    src: string
    alt?: string
  }[]
  trailSize: number
  spawnRate: number
  fadeDuration: number
  effect: boolean
  quality: "high" | "medium" | "low"
}

const QUALITY_SETTINGS = {
  high: { w: 1400, q: 95 },
  medium: { w: 200, q: 50 },
  low: { w: 80, q: 40 },
}

const HEAVY_IMAGE_THRESHOLD = 1000
const imageDimensionCache = new Map<string, { width: number; height: number }>()

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  if (imageDimensionCache.has(src)) {
    return Promise.resolve(imageDimensionCache.get(src)!)
  }
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight }
      imageDimensionCache.set(src, dims)
      resolve(dims)
    }
    img.onerror = () => {
      imageDimensionCache.set(src, { width: 0, height: 0 })
      resolve({ width: 0, height: 0 })
    }
    img.src = src
  })
}

/**
 * Cursor Trail Flow
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CursorTrailFlow(props: CursorTrailProps) {
  const { images: imagesProp, trailSize = 180, spawnRate = 80, fadeDuration = 0.5, effect = true, quality = "medium" } = props

  const images = imagesProp?.length ? imagesProp.filter(img => img?.src) : [
    { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "1" },
    { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "2" },
    { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "3" },
  ]

  const containerRef = useRef<HTMLDivElement>(null)
  const lastSpawnTime = useRef(0)
  const idCounter = useRef(0)
  const itemsRef = useRef<Map<number, { el: HTMLImageElement; remove: () => void }>>(new Map())
  const isStatic = useIsStaticRenderer()

  const removeItem = useCallback((id: number) => {
    const item = itemsRef.current.get(id)
    if (item) {
      item.remove()
      itemsRef.current.delete(id)
    }
  }, [])

  const spawnItem = useCallback((x: number, y: number) => {
    if (!containerRef.current || !images.length) return

    const id = idCounter.current++

    // Remove oldest if >= 6
    if (itemsRef.current.size >= 6) {
      const oldestId = itemsRef.current.keys().next().value
      if (oldestId !== undefined) {
        const oldest = itemsRef.current.get(oldestId)
        if (oldest) {
          if (effect) {
            oldest.el.style.transition = `opacity ${fadeDuration}s`
            oldest.el.style.opacity = '0'
            window.setTimeout(() => removeItem(oldestId), fadeDuration * 1000)
          } else {
            removeItem(oldestId)
          }
        }
      }
    }

    const imgData = images[Math.floor(Math.random() * images.length)]
    if (!imgData?.src) return

    // Check cached dimensions and apply quality
    const checkAndCreate = async () => {
      let effectiveQuality = quality
      const cached = imageDimensionCache.get(imgData.src)
      
      if (cached) {
        if (cached.width > HEAVY_IMAGE_THRESHOLD || cached.height > HEAVY_IMAGE_THRESHOLD) {
          effectiveQuality = 'medium'
        }
      } else {
        // Start loading dimensions in background for future spawns
        getImageDimensions(imgData.src).then(dims => {
          if (dims.width > HEAVY_IMAGE_THRESHOLD || dims.height > HEAVY_IMAGE_THRESHOLD) {
            // Next spawn will use cached value
          }
        })
      }

      const { w, q } = QUALITY_SETTINGS[effectiveQuality]
      let src = imgData.src
      if (src.includes('framerusercontent.com')) {
        const separator = src.includes('?') ? '&' : '?'
        src = `${src}${separator}w=${w}&q=${q}`
      }

      const el = document.createElement('img')
      el.src = src
      el.loading = 'lazy'
      el.decoding = 'async'
      el.style.cssText = `position:absolute;width:${trailSize}px;height:${trailSize}px;left:${x - trailSize/2}px;top:${y - trailSize/2}px;pointer-events:none;border-radius:4px;object-fit:cover;opacity:1;`
      
      if (containerRef.current) {
        containerRef.current.appendChild(el)

        const remove = () => {
          el.remove()
          itemsRef.current.delete(id)
        }

        const timeout = window.setTimeout(() => {
          if (effect) {
            el.style.transition = `opacity ${fadeDuration}s`
            el.style.opacity = '0'
            window.setTimeout(remove, fadeDuration * 1000)
          } else {
            remove()
          }
        }, 1000)

        itemsRef.current.set(id, { 
          el, 
          remove: () => {
            clearTimeout(timeout)
            remove()
          }
        })
      }
    }

    checkAndCreate()
  }, [images, trailSize, fadeDuration, effect, quality, removeItem])

  useEffect(() => () => {
    itemsRef.current.forEach(item => item.remove())
    itemsRef.current.clear()
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || isStatic) return
    const now = performance.now()
    if (now - lastSpawnTime.current > spawnRate) {
      lastSpawnTime.current = now
      const rect = containerRef.current.getBoundingClientRect()
      spawnItem(e.clientX - rect.left, e.clientY - rect.top)
    }
  }, [spawnRate, isStatic, spawnItem])

  if (isStatic) {
    return (
      <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[0, 1, 2].map(i => {
          const img = images[i % images.length]
          return img?.src ? (
            <img key={i} src={img.src} alt="" style={{ position: "absolute", width: trailSize, height: trailSize, left: 30 + i * 25, top: 40 + Math.sin(i) * 10, opacity: 0.6 - i * 0.15, pointerEvents: "none", borderRadius: 4, objectFit: "cover" }} />
          ) : null
        })}
      </div>
    )
  }

  return <div ref={containerRef} onMouseMove={handleMouseMove} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", borderRadius: 8, cursor: "crosshair" }} />
}

addPropertyControls(CursorTrailFlow, {
  images: {
    type: ControlType.Array,
    title: "Trail Images",
    description: "9 images fit the best",
    control: {
      type: ControlType.ResponsiveImage,
    },
    maxCount: 10,
  },
  trailSize: {
    type: ControlType.Number,
    title: "Size",
    defaultValue: 180,
    min: 10,
    max: 300,
    step: 5,
    unit: "px",
  },
  spawnRate: {
    type: ControlType.Number,
    title: "Spawn Rate",
    defaultValue: 80,
    min: 30,
    max: 500,
    step: 10,
    unit: "ms",
  },
  fadeDuration: {
    type: ControlType.Number,
    title: "Fade Duration",
    defaultValue: 0.5,
    min: 0.1,
    max: 3,
    step: 0.1,
    unit: "s",
  },
  effect: {
    type: ControlType.Boolean,
    title: "Effect",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
  },
  quality: {
    type: ControlType.Enum,
    title: "Quality",
    description: "Medium quality is recommended",
    defaultValue: "medium",
    options: ["high", "medium", "low"],
    optionTitles: ["High", "Medium", "Low"],
  },
})

CursorTrailFlow.displayName = "Cursor Trail Flow"
