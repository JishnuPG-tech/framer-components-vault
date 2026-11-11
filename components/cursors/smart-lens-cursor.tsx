/**
 * Smart Lens Cursor - Premium Magnifying Glass Component
 * 
 * A sophisticated cursor replacement that provides a magnifying lens experience
 * with intelligent content detection, dynamic zoom levels, and glassmorphism design.
 * 
 * Use Cases:
 * - Portfolio websites for detailed image inspection
 * - Documentation sites for reading small text
 * - E-commerce for product detail viewing
 * - Creative agencies for interactive storytelling
 * 
 * Features:
 * - Smooth spring physics following
 * - Automatic content type detection (text/images/buttons)
 * - Dynamic zoom based on content size
 * - Smart viewport edge detection
 * - Contextual tooltips
 * - Full keyboard navigation
 * - Reduced motion support
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

import { 
  useMotionValue, 
  useSpring, 
  motion,
  useTransform,
  animate,
  useMotionTemplate
} from "framer-motion"
import { 
  useEffect, 
  useRef, 
  useState, 
  useCallback,
  startTransition,
  type CSSProperties
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Types
interface ZoomLevels {
  text: number
  image: number
  default: number
}

interface SpringConfig {
  damping: number
  stiffness: number
}

interface SmartLensCursorProps {
  lensSize?: number
  zoomLevels?: ZoomLevels
  glassOpacity?: number
  enableTooltips?: boolean
  springConfig?: SpringConfig
  showCrosshair?: boolean
  crosshairColor?: string
  crosshairOpacity?: number
  pulseAnimation?: boolean
  style?: CSSProperties
  useCustomCursor?: boolean
  customCursorImage?: string
  cursorVisibility?: "hidden" | "visible" | "auto"
  magnificationMode?: "clone" | "viewport" | "none"
  syncScroll?: boolean
  preserveInteraction?: boolean
  zoomWordOnHover?: boolean
  enableFullscreen?: boolean
  fullscreenHintText?: string
  fullscreenHintBgColor?: string
  fullscreenHintTextColor?: string
  fullscreenTextBgColor?: string
  fullscreenTextColor?: string
}

type ElementType = "text" | "image" | "button" | "link" | "default"

interface DetectedElement {
  type: ElementType
  element: Element | null
  rect: DOMRect | null
  content: string
  metadata: {
    fontSize?: number
    wordCount?: number
    imageSize?: string
    isInteractive?: boolean
    hoveredWord?: string
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    letterSpacing?: string
    lineHeight?: string
  }
}

// Utility functions
const getElementType = (element: Element | null, x: number, y: number): ElementType => {
  if (!element) return "default"
  
  const tagName = element.tagName.toLowerCase()
  const computedStyle = window.getComputedStyle(element)
  
  // Check if element is actually visible
  if (computedStyle.display === "none" || computedStyle.visibility === "hidden" || computedStyle.opacity === "0") {
    return "default"
  }
  
  // Check for empty or near-invisible text
  const textContent = element.textContent?.trim() || ""
  const fontSize = parseFloat(computedStyle.fontSize)
  const rect = element.getBoundingClientRect()
  
  // Skip elements with no dimensions
  if (rect.width === 0 || rect.height === 0) {
    return "default"
  }
  
  if (tagName === "img" || tagName === "picture" || element.closest("img")) {
    return "image"
  }
  
  if (tagName === "button" || element.getAttribute("role") === "button" || 
      element.closest("button") || computedStyle.cursor === "pointer") {
    return "button"
  }
  
  if (tagName === "a" || element.closest("a")) {
    return "link"
  }

  // Robust Text Detection Strategy
  // 1. Check if the element itself has text content
  // 2. Check if we are hovering over a text node specifically (using Caret API if available)
  // 3. Traverse up to find a meaningful text container if we are on a child span/em/strong

  // Helper to check if an element is a text container
  const isTextContainer = (el: Element) => {
    const style = window.getComputedStyle(el)
    const hasText = el.textContent?.trim().length! > 0
    const isVisible = style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0"
    // Exclude common non-text containers unless they have direct text
    const isContainer = ["div", "section", "article", "main", "header", "footer"].includes(el.tagName.toLowerCase())
    
    if (isContainer) {
        // For containers, check if they have direct text nodes that are not just whitespace
        return Array.from(el.childNodes).some(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim().length! > 0
        )
    }
    return hasText && isVisible
  }

  // Try to find the closest text block
  let currentEl: Element | null = element
  while (currentEl && currentEl !== document.body) {
      if (isTextContainer(currentEl)) {
          // Verify font size is reasonable for reading
          const style = window.getComputedStyle(currentEl)
          const size = parseFloat(style.fontSize)
          if (size > 0) return "text"
      }
      currentEl = currentEl.parentElement
  }
  
  return "default"
}

const getElementMetadata = (element: Element | null, type: ElementType, x: number, y: number) => {
  const metadata: any = {}
  
  if (!element) return metadata
  
  if (type === "text") {
    // Find the actual text element if we bubbled up
    let targetEl = element
    const isTextContainer = (el: Element) => {
        const isContainer = ["div", "section", "article", "main", "header", "footer"].includes(el.tagName.toLowerCase())
        if (isContainer) {
            return Array.from(el.childNodes).some(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent?.trim().length! > 0
            )
        }
        return el.textContent?.trim().length! > 0
    }

    while (targetEl && targetEl !== document.body && !isTextContainer(targetEl)) {
        if (targetEl.parentElement) targetEl = targetEl.parentElement
        else break
    }

    const computedStyle = window.getComputedStyle(targetEl)
    metadata.fontSize = parseFloat(computedStyle.fontSize)
    metadata.fontFamily = computedStyle.fontFamily
    metadata.fontWeight = computedStyle.fontWeight
    metadata.fontStyle = computedStyle.fontStyle
    metadata.letterSpacing = computedStyle.letterSpacing
    metadata.lineHeight = computedStyle.lineHeight
    // Count words in the specific text block
    metadata.wordCount = targetEl.textContent?.trim().split(/\s+/).length || 0

    // Detect specific word under cursor
    if (document.caretPositionFromPoint || (document as any).caretRangeFromPoint) {
        let range: Range | null = null;
        let textNode: Node | null = null;
        let offset = 0;

        if (document.caretPositionFromPoint) {
            const caret = document.caretPositionFromPoint(x, y);
            if (caret) {
                textNode = caret.offsetNode;
                offset = caret.offset;
            }
        } else if ((document as any).caretRangeFromPoint) {
            range = (document as any).caretRangeFromPoint(x, y);
            if (range) {
                textNode = range.startContainer;
                offset = range.startOffset;
            }
        }

        if (textNode && textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
            const text = textNode.textContent;
            // Find word boundaries
            let start = offset;
            let end = offset;
            
            // Look back
            while (start > 0 && /\S/.test(text[start - 1])) {
                start--;
            }
            // Look forward
            while (end < text.length && /\S/.test(text[end])) {
                end++;
            }
            
            const word = text.slice(start, end).trim();
            // Filter out punctuation only matches if desired, but keeping simple for now
            if (word.length > 0) {
                metadata.hoveredWord = word;
            }
        }
    }
  }
  
  if (type === "image") {
    const img = element.tagName.toLowerCase() === "img" ? element : element.querySelector("img")
    if (img) {
      const imgEl = img as HTMLImageElement
      metadata.imageSize = `${imgEl.naturalWidth}x${imgEl.naturalHeight}`
    }
  }
  
  if (type === "button" || type === "link") {
    metadata.isInteractive = true
  }
  
  return metadata
}

const getOverlayColor = (type: ElementType): string => {
  switch (type) {
    case "text": return "rgba(59, 130, 246, 0.1)"
    case "image": return "rgba(34, 197, 94, 0.1)"
    case "button":
    case "link": return "rgba(168, 85, 247, 0.1)"
    default: return "transparent"
  }
}

const getZoomLevel = (type: ElementType, zoomLevels: ZoomLevels, metadata: any): number => {
  switch (type) {
    case "text":
      if (metadata.fontSize && metadata.fontSize < 14) return zoomLevels.text * 1.67
      return zoomLevels.text
    case "image":
      return zoomLevels.image
    default:
      return zoomLevels.default
  }
}

export default function SmartLensCursor(props: SmartLensCursorProps) {
  const {
    lensSize = 120,
    zoomLevels = { text: 2.5, image: 1.5, default: 1.5 },
    glassOpacity = 0.1,
    enableTooltips = true,
    springConfig = { damping: 35, stiffness: 200 },
    showCrosshair = true,
    crosshairColor = "#ffffff",
    crosshairOpacity = 0.6,
    pulseAnimation = true,
    useCustomCursor = false,
    customCursorImage = "",
    cursorVisibility = "hidden",
    magnificationMode = "clone",
    syncScroll = false,
    preserveInteraction = true,
    zoomWordOnHover = true,
    enableFullscreen = true,
    fullscreenHintText = "Click anywhere to close",
    fullscreenHintBgColor = "rgba(0, 0, 0, 0.5)",
    fullscreenHintTextColor = "#fff",
    fullscreenTextBgColor = "rgba(255, 255, 255, 0.95)",
    fullscreenTextColor = "#000",
  } = props

  const isStatic = useIsStaticRenderer()
  const containerRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  
  // Motion values for smooth tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Spring physics
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)
  
  // State
  const [detectedElement, setDetectedElement] = useState<DetectedElement>({
    type: "default",
    element: null,
    rect: null,
    content: "",
    metadata: {}
  })
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [keyboardPosition, setKeyboardPosition] = useState({ x: 0, y: 0 })
  const [isKeyboardMode, setIsKeyboardMode] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fullscreenContent, setFullscreenContent] = useState<{
    type: "image" | "text"
    content: string
    metadata?: any
  } | null>(null)
  
  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      startTransition(() => setReducedMotion(e.matches))
    }
    
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])
  
  // Calculate viewport bounds for smart positioning
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])
  
  // Mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isKeyboardMode || showFullscreen) return
    
    const x = e.clientX
    const y = e.clientY
    
    const halfSize = lensSize / 2
    const margin = 20
    
    // Calculate raw position (centered on cursor)
    let targetX = x - halfSize
    let targetY = y - halfSize
    
    // Clamp to viewport bounds with 20px margin
    const minX = margin
    const maxX = viewport.width - lensSize - margin
    const minY = margin
    const maxY = viewport.height - lensSize - margin
    
    targetX = Math.max(minX, Math.min(maxX, targetX))
    targetY = Math.max(minY, Math.min(maxY, targetY))
    
    mouseX.set(targetX)
    mouseY.set(targetY)
    
    // Element detection
    if (containerRef.current) {
      containerRef.current.style.pointerEvents = "none"
      const element = document.elementFromPoint(x, y)
      containerRef.current.style.pointerEvents = "auto"
      
      if (element && element !== lensRef.current && !lensRef.current?.contains(element)) {
        const type = getElementType(element, x, y)
        const rect = element.getBoundingClientRect()
        const metadata = getElementMetadata(element, type, x, y)
        
        startTransition(() => {
          setDetectedElement({
            type,
            element,
            rect,
            content: element.textContent || "",
            metadata
          })
        })
      }
    }
    
    if (!isVisible) {
      startTransition(() => setIsVisible(true))
    }
  }, [mouseX, mouseY, lensSize, viewport, isVisible, isKeyboardMode, showFullscreen])
  
  const handleMouseLeave = useCallback(() => {
    startTransition(() => setIsVisible(false))
  }, [])
  
  const handleMouseDown = useCallback(() => {
    if (showFullscreen) {
      startTransition(() => {
        setShowFullscreen(false)
        setFullscreenContent(null)
      })
      return
    }
    
    startTransition(() => setIsClicking(true))
    
    // Show fullscreen for images and text
    if (detectedElement.type === "image" && detectedElement.element) {
      const imgSrc = (detectedElement.element as HTMLImageElement).src || 
                     (detectedElement.element.querySelector("img") as HTMLImageElement)?.src
      if (imgSrc) {
        startTransition(() => {
          setFullscreenContent({
            type: "image",
            content: imgSrc,
            metadata: detectedElement.metadata
          })
          setShowFullscreen(true)
        })
      }
    } else if (detectedElement.type === "text" && detectedElement.element) {
      const textContent = detectedElement.element.textContent || ""
      if (textContent.trim()) {
        startTransition(() => {
          setFullscreenContent({
            type: "text",
            content: textContent,
            metadata: detectedElement.metadata
          })
          setShowFullscreen(true)
        })
      }
    } else {
      // Trigger click on detected element for other types
      if (detectedElement.element && detectedElement.type !== "default") {
        const element = detectedElement.element as HTMLElement
        if (typeof element.click === "function") {
          element.click()
        }
      }
    }
  }, [detectedElement, showFullscreen])
  
  const handleMouseUp = useCallback(() => {
    startTransition(() => setIsClicking(false))
  }, [])
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const step = 20
    
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        setIsKeyboardMode(true)
        setKeyboardPosition(prev => {
          const newY = Math.max(20, prev.y - step)
          return { ...prev, y: newY }
        })
        break
      case "ArrowDown":
        e.preventDefault()
        setIsKeyboardMode(true)
        setKeyboardPosition(prev => {
          const maxY = viewport.height - lensSize - 20
          const newY = Math.min(maxY, prev.y + step)
          return { ...prev, y: newY }
        })
        break
      case "ArrowLeft":
        e.preventDefault()
        setIsKeyboardMode(true)
        setKeyboardPosition(prev => {
          const newX = Math.max(20, prev.x - step)
          return { ...prev, x: newX }
        })
        break
      case "ArrowRight":
        e.preventDefault()
        setIsKeyboardMode(true)
        setKeyboardPosition(prev => {
          const maxX = viewport.width - lensSize - 20
          const newX = Math.min(maxX, prev.x + step)
          return { ...prev, x: newX }
        })
        break
      case "Enter":
        e.preventDefault()
        if (detectedElement.element) {
          const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
          })
          detectedElement.element.dispatchEvent(clickEvent)
        }
        break
      case "Escape":
        setIsKeyboardMode(false)
        break
    }
  }, [viewport, lensSize, detectedElement])
  
  // Update position for keyboard mode
  useEffect(() => {
    if (isKeyboardMode) {
      mouseX.set(keyboardPosition.x)
      mouseY.set(keyboardPosition.y)
      startTransition(() => setIsVisible(true))
    }
  }, [keyboardPosition, isKeyboardMode, mouseX, mouseY])
  
  // Store event handlers in refs to avoid dependency issues
  const handleMouseMoveRef = useRef(handleMouseMove)
  const handleMouseLeaveRef = useRef(handleMouseLeave)
  const handleMouseDownRef = useRef(handleMouseDown)
  const handleMouseUpRef = useRef(handleMouseUp)
  const handleKeyDownRef = useRef(handleKeyDown)
  
  // Update refs when handlers change
  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove
    handleMouseLeaveRef.current = handleMouseLeave
    handleMouseDownRef.current = handleMouseDown
    handleMouseUpRef.current = handleMouseUp
    handleKeyDownRef.current = handleKeyDown
  }, [handleMouseMove, handleMouseLeave, handleMouseDown, handleMouseUp, handleKeyDown])
  
  // Event listeners
  useEffect(() => {
    if (isStatic || typeof window === "undefined") return
    
    // Store original cursor
    const originalCursor = document.body.style.cursor
    
    // Apply cursor visibility setting
    if (cursorVisibility === "hidden") {
      document.body.style.cursor = "none"
    } else if (cursorVisibility === "visible") {
      document.body.style.cursor = "auto"
    }
    
    const onMouseMove = (e: MouseEvent) => handleMouseMoveRef.current(e)
    const onMouseLeave = () => handleMouseLeaveRef.current()
    const onMouseDown = () => handleMouseDownRef.current()
    const onMouseUp = () => handleMouseUpRef.current()
    const onKeyDown = (e: KeyboardEvent) => handleKeyDownRef.current(e)
    
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseleave", onMouseLeave)
    window.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("keydown", onKeyDown)
    
    return () => {
      // Restore original cursor on cleanup
      document.body.style.cursor = originalCursor
      
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseleave", onMouseLeave)
      window.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isStatic, cursorVisibility])
  
  // Calculate current zoom
  const currentZoom = getZoomLevel(detectedElement.type, zoomLevels, detectedElement.metadata)
  
  // Generate tooltip content
  const getTooltipContent = () => {
    if (!enableTooltips) return null
    
    // Return empty string for empty/default elements
    if (detectedElement.type === "default") return ""
    
    // Validate text elements have real content
    if (detectedElement.type === "text") {
      const hasValidText = detectedElement.metadata.wordCount && detectedElement.metadata.wordCount > 0
      const hasValidFontSize = detectedElement.metadata.fontSize && detectedElement.metadata.fontSize > 8
      if (!hasValidText || !hasValidFontSize) return ""
    }
    
    switch (detectedElement.type) {
      case "text":
        return detectedElement.metadata.wordCount 
          ? `${detectedElement.metadata.wordCount} words`
          : ""
      case "image":
        return detectedElement.metadata.imageSize 
          ? `${detectedElement.metadata.imageSize}`
          : "Image"
      case "button":
      case "link":
        return "Click to interact"
      default:
        return ""
    }
  }
  
  const tooltipContent = getTooltipContent()
  
  // Animation variants
  const lensVariants = {
    default: {
      scale: pulseAnimation && !reducedMotion ? [1, 1.02, 1] : 1,
      transition: {
        scale: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const
        }
      }
    },
    hover: {
      scale: reducedMotion ? 1 : 1.05,
      transition: { type: "spring" as const, damping: 20, stiffness: 400 }
    },
    click: {
      scale: reducedMotion ? 1 : 1.1,
      transition: { type: "spring" as const, damping: 15, stiffness: 500 }
    }
  }
  
  const rippleVariants = {
    initial: { scale: 0, opacity: 0.8 },
    animate: { 
      scale: 2, 
      opacity: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  }
  
  if (isStatic) {
    return (
      <div 
        style={{
          width: useCustomCursor && customCursorImage ? "auto" : lensSize,
          height: useCustomCursor && customCursorImage ? "auto" : lensSize,
          borderRadius: useCustomCursor && customCursorImage ? 0 : "50%",
          background: useCustomCursor && customCursorImage ? "transparent" : `linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))`,
          border: useCustomCursor && customCursorImage ? "none" : `1px solid rgba(255,255,255,0.3)`,
          boxShadow: useCustomCursor && customCursorImage ? "none" : `inset 0 0 20px rgba(0,0,0,0.1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...props.style
        }}
      >
        {useCustomCursor && customCursorImage ? (
          <img 
            src={customCursorImage} 
            alt="Custom cursor preview"
            style={{ width: lensSize, height: lensSize, objectFit: "contain" }}
          />
        ) : (
          <div style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
            Smart Lens
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9999,
        ...props.style
      }}
      role="application"
      aria-label="Smart Lens Cursor - Use arrow keys to move, Enter to interact, Escape to exit keyboard mode"
    >
      {/* Fullscreen Preview Modal */}
      {showFullscreen && fullscreenContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            pointerEvents: "auto",
            cursor: "pointer"
          }}
          onClick={() => {
            startTransition(() => {
              setShowFullscreen(false)
              setFullscreenContent(null)
            })
          }}
        >
          {fullscreenContent.type === "image" ? (
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={fullscreenContent.content}
              alt="Fullscreen preview"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: 8,
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"
              }}
            />
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                maxWidth: "80vw",
                maxHeight: "80vh",
                backgroundColor: fullscreenTextBgColor,
                padding: "40px 60px",
                borderRadius: 12,
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                overflow: "auto",
                fontSize: (fullscreenContent.metadata?.fontSize || 16) * 1.5,
                fontFamily: fullscreenContent.metadata?.fontFamily || "inherit",
                fontWeight: fullscreenContent.metadata?.fontWeight || "normal",
                fontStyle: fullscreenContent.metadata?.fontStyle || "normal",
                letterSpacing: fullscreenContent.metadata?.letterSpacing || "normal",
                lineHeight: fullscreenContent.metadata?.lineHeight || 1.6,
                color: fullscreenTextColor,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
            >
              {fullscreenContent.content}
            </motion.div>
          )}
          
          {/* Close hint */}
          <div
            style={{
              position: "absolute",
              top: 30,
              right: 30,
              color: fullscreenHintTextColor,
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: fullscreenHintBgColor,
              padding: "8px 16px",
              borderRadius: 6,
              pointerEvents: "none"
            }}
          >
            {fullscreenHintText}
          </div>
        </motion.div>
      )}

      <motion.div
        ref={lensRef}
        style={{
          position: "absolute",
          width: useCustomCursor && customCursorImage ? lensSize : lensSize,
          height: useCustomCursor && customCursorImage ? lensSize : lensSize,
          x: springX,
          y: springY,
          opacity: isVisible ? 1 : 0,
          cursor: "none"
        }}
        animate={isClicking ? "click" : detectedElement.type !== "default" ? "hover" : "default"}
        variants={lensVariants}
      >
        {useCustomCursor && customCursorImage ? (
          // Custom cursor image
          <motion.img
            src={customCursorImage}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none"
            }}
            animate={{
              scale: isClicking ? 0.9 : detectedElement.type !== "default" ? 1.1 : 1
            }}
            transition={{ type: "spring", damping: 20, stiffness: 400 }}
          />
        ) : (
          // Default lens container
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              position: "relative",
              overflow: "hidden",
              background: `rgba(255, 255, 255, ${glassOpacity})`,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid rgba(255, 255, 255, 0.3)`,
              boxShadow: `
                inset 0 0 20px rgba(0, 0, 0, 0.1),
                0 4px 30px rgba(0, 0, 0, 0.1)
              `,
            }}
          >
            {/* Gradient border overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                padding: "1px",
                background: `linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))`,
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                pointerEvents: "none"
              }}
            />
            
            {/* Content tint overlay */}
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backgroundColor: getOverlayColor(detectedElement.type),
                pointerEvents: "none"
              }}
              animate={{
                opacity: detectedElement.type !== "default" ? 1 : 0
              }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Crosshair lines */}
            {showCrosshair && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: crosshairColor,
                    opacity: crosshairOpacity,
                    transform: "translateY(-50%)",
                    pointerEvents: "none"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: crosshairColor,
                    opacity: crosshairOpacity,
                    transform: "translateX(-50%)",
                    pointerEvents: "none"
                  }}
                />
              </>
            )}
            
            {/* Center dot */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 4,
                height: 4,
                borderRadius: "50%",
                backgroundColor: crosshairColor,
                opacity: crosshairOpacity * 1.5,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none"
              }}
            />
            
            {/* Magnified content preview */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${currentZoom})`,
                fontSize: 10,
                color: "#333",
                textAlign: "center",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%"
              }}
            >
              {detectedElement.type === "image" && detectedElement.element && (
                <img
                  src={(detectedElement.element as HTMLImageElement).src || 
                       (detectedElement.element.querySelector("img") as HTMLImageElement)?.src}
                  alt=""
                  style={{
                    width: lensSize * 0.4,
                    height: lensSize * 0.3,
                    objectFit: "cover",
                    borderRadius: 4
                  }}
                />
              )}
              
              {detectedElement.type === "text" && zoomWordOnHover && detectedElement.metadata.hoveredWord && (
                 <span style={{ 
                    fontSize: (detectedElement.metadata.fontSize || 16) * 1.5, 
                    fontWeight: "bold",
                    color: "#000",
                    background: "rgba(255,255,255,0.9)",
                    padding: "4px 8px",
                    borderRadius: 4,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    border: "1px solid rgba(0,0,0,0.05)"
                 }}>
                    {detectedElement.metadata.hoveredWord}
                 </span>
              )}
            </div>
            
            {/* Click ripple effect */}
            {isClicking && !reducedMotion && (
              <motion.div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: lensSize * 0.5,
                  height: lensSize * 0.5,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none"
                }}
                variants={rippleVariants}
                initial="initial"
                animate="animate"
              />
            )}
          </div>
        )}
        
        {/* Tooltip - only show for default lens or when custom cursor with tooltips enabled */}
        {tooltipContent && enableTooltips && (
          <motion.div
            style={{
              position: "absolute",
              bottom: -35,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            role="tooltip"
          >
            {tooltipContent}
          </motion.div>
        )}
        
        {/* Keyboard mode indicator */}
        {isKeyboardMode && (
          <div
            style={{
              position: "absolute",
              top: -25,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(59, 130, 246, 0.9)",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}
          >
            Keyboard Mode
          </div>
        )}
      </motion.div>
      
      {/* Hidden live region for screen readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0
        }}
      >
        {detectedElement.type !== "default" && `Detected ${detectedElement.type} element. ${tooltipContent || ""}`}
      </div>
    </div>
  )
}

// Property Controls
addPropertyControls(SmartLensCursor, {
  useCustomCursor: {
    type: ControlType.Boolean,
    title: "Custom Cursor",
    defaultValue: false,
    enabledTitle: "Image",
    disabledTitle: "Default",
    description: "Use a custom image or SVG as the cursor instead of the default lens"
  },
  customCursorImage: {
    type: ControlType.File,
    title: "Cursor Image",
    allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    hidden: ({ useCustomCursor }) => !useCustomCursor,
    description: "Upload a custom image or SVG to use as the cursor. Recommended size: 120x120px"
  },
  lensSize: {
    type: ControlType.Number,
    title: "Cursor Size",
    defaultValue: 120,
    min: 20,
    max: 300,
    step: 10,
    unit: "px",
    description: "Size of the custom cursor image or lens diameter"
  },
  zoomLevels: {
    type: ControlType.Object,
    title: "Zoom Levels",
    buttonTitle: "Configure Zoom",
    controls: {
      text: {
        type: ControlType.Number,
        title: "Text Zoom",
        defaultValue: 2.5,
        min: 1,
        max: 5,
        step: 0.1
      },
      image: {
        type: ControlType.Number,
        title: "Image Zoom",
        defaultValue: 1.5,
        min: 1,
        max: 5,
        step: 0.1
      },
      default: {
        type: ControlType.Number,
        title: "Default Zoom",
        defaultValue: 1.5,
        min: 1,
        max: 5,
        step: 0.1
      }
    },
    defaultValue: {
      text: 2.5,
      image: 1.5,
      default: 1.5
    },
    description: "Magnification levels for different content types"
  },
  glassOpacity: {
    type: ControlType.Number,
    title: "Glass Opacity",
    defaultValue: 0.1,
    min: 0,
    max: 1,
    step: 0.05,
    description: "Opacity of the glassmorphism background"
  },
  enableTooltips: {
    type: ControlType.Boolean,
    title: "Tooltips",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
    description: "Show contextual tooltips for detected elements"
  },
  springConfig: {
    type: ControlType.Object,
    title: "Spring Physics",
    buttonTitle: "Configure Spring",
    controls: {
      damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 35,
        min: 1,
        max: 100,
        step: 1
      },
      stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 200,
        min: 50,
        max: 500,
        step: 10
      }
    },
    defaultValue: {
      damping: 35,
      stiffness: 200
    },
    description: "Spring physics configuration for smooth following"
  },
  showCrosshair: {
    type: ControlType.Boolean,
    title: "Crosshair",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide",
    description: "Display crosshair lines dividing the lens into quadrants"
  },
  crosshairColor: {
    type: ControlType.Color,
    title: "Crosshair Color",
    defaultValue: "#ffffff",
    hidden: ({ showCrosshair }) => !showCrosshair,
    description: "Color of the crosshair lines"
  },
  crosshairOpacity: {
    type: ControlType.Number,
    title: "Crosshair Opacity",
    defaultValue: 0.6,
    min: 0,
    max: 1,
    step: 0.1,
    hidden: ({ showCrosshair }) => !showCrosshair,
    description: "Opacity of the crosshair lines"
  },
  pulseAnimation: {
    type: ControlType.Boolean,
    title: "Pulse Animation",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
    hidden: ({ useCustomCursor }) => useCustomCursor,
    description: "Enable subtle pulse animation when idle (default lens only)"
  },
  zoomWordOnHover: {
    type: ControlType.Boolean,
    title: "Zoom Word",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
    description: "Display and magnify the specific word under the cursor"
  },
  enableFullscreen: {
    type: ControlType.Boolean,
    title: "Enable Fullscreen",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
    description: "Enable the fullscreen preview feature"
  },
  fullscreenHintText: {
    type: ControlType.String,
    title: "Fullscreen Hint Text",
    defaultValue: "Click anywhere to close",
    hidden: ({ enableFullscreen }) => !enableFullscreen,
    description: "Text to display in the fullscreen close hint"
  },
  fullscreenHintBgColor: {
    type: ControlType.Color,
    title: "Fullscreen Hint Background Color",
    defaultValue: "rgba(0, 0, 0, 0.5)",
    hidden: ({ enableFullscreen }) => !enableFullscreen,
    description: "Background color for the fullscreen close hint"
  },
  fullscreenHintTextColor: {
    type: ControlType.Color,
    title: "Fullscreen Hint Text Color",
    defaultValue: "#fff",
    hidden: ({ enableFullscreen }) => !enableFullscreen,
    description: "Text color for the fullscreen close hint"
  },
  fullscreenTextBgColor: {
    type: ControlType.Color,
    title: "Fullscreen Text Background",
    defaultValue: "rgba(255, 255, 255, 0.95)",
    hidden: ({ enableFullscreen }) => !enableFullscreen,
    description: "Background color for the fullscreen text preview"
  },
  fullscreenTextColor: {
    type: ControlType.Color,
    title: "Fullscreen Text Color",
    defaultValue: "#000",
    hidden: ({ enableFullscreen }) => !enableFullscreen,
    description: "Text color for the fullscreen text preview"
  }
})

SmartLensCursor.displayName = "Smart Lens Cursor"
