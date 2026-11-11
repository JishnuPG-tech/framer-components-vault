import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, useMotionValue, useSpring, useInView, animate, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Constants for timing and behavior
const SOUND_THROTTLE_MS = 80
const SNAP_TIMEOUT_MS = 150
const ITEM_ASPECT_RATIO = 16 / 9
const ITEM_HEIGHT_PERCENT = 0.95
const ITEM_WIDTH_PERCENT = 0.95

interface MotionGalleryProps {
    image1?: { src: string; srcSet?: string; alt?: string }
    image2?: { src: string; srcSet?: string; alt?: string }
    image3?: { src: string; srcSet?: string; alt?: string }
    image4?: { src: string; srcSet?: string; alt?: string }
    image5?: { src: string; srcSet?: string; alt?: string }
    image6?: { src: string; srcSet?: string; alt?: string }
    image7?: { src: string; srcSet?: string; alt?: string }
    image8?: { src: string; srcSet?: string; alt?: string }
    image9?: { src: string; srcSet?: string; alt?: string }
    image10?: { src: string; srcSet?: string; alt?: string }
    image11?: { src: string; srcSet?: string; alt?: string }
    image12?: { src: string; srcSet?: string; alt?: string }
    image13?: { src: string; srcSet?: string; alt?: string }
    image14?: { src: string; srcSet?: string; alt?: string }
    image15?: { src: string; srcSet?: string; alt?: string }
    image16?: { src: string; srcSet?: string; alt?: string }
    image17?: { src: string; srcSet?: string; alt?: string }
    image18?: { src: string; srcSet?: string; alt?: string }
    image19?: { src: string; srcSet?: string; alt?: string }
    image20?: { src: string; srcSet?: string; alt?: string }
    image21?: { src: string; srcSet?: string; alt?: string }
    image22?: { src: string; srcSet?: string; alt?: string }
    image23?: { src: string; srcSet?: string; alt?: string }
    image24?: { src: string; srcSet?: string; alt?: string }
    image25?: { src: string; srcSet?: string; alt?: string }
    image26?: { src: string; srcSet?: string; alt?: string }
    image27?: { src: string; srcSet?: string; alt?: string }
    image28?: { src: string; srcSet?: string; alt?: string }
    image29?: { src: string; srcSet?: string; alt?: string }
    image30?: { src: string; srcSet?: string; alt?: string }
    numImages: number
    orientation: "horizontal" | "vertical"
    gap: number
    padding: number
    itemWidth: number
    borderRadius: number
    backgroundColor: string
    showIndicators: boolean
    indicatorColor: string
    indicatorActiveColor: string
    entranceDuration: number
    entranceDelay: number
    autoCentered: boolean
    scrollSpeed: number
    scrollSmoothness: number
    soundEffectType: "mechanical" | "bloop" | "whoosh" | "chime" | "tap" | "softClick" | "snap"
    soundEnabled: boolean
    soundVolume: number
    showScrollHint: boolean
    style?: React.CSSProperties
}

/**
 * Motion Gallery
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 340
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MotionGallery(props: MotionGalleryProps) {
    const {
        image1, image2, image3, image4, image5,
        image6, image7, image8, image9, image10,
        image11, image12, image13, image14, image15,
        image16, image17, image18, image19, image20,
        image21, image22, image23, image24, image25,
        image26, image27, image28, image29, image30,
        numImages = 10,
        orientation = "horizontal",
        gap = 16,
        padding = 16,
        itemWidth = 100,
        borderRadius = 12,
        backgroundColor = "#000000",
        showIndicators = true,
        indicatorColor = "rgba(255, 255, 255, 0.4)",
        indicatorActiveColor = "#FFFFFF",
        entranceDuration = 0.6,
        entranceDelay = 0.1,
        autoCentered = true,
        scrollSpeed = 0.5,
        scrollSmoothness = 0.5,
        soundEffectType = "tap",
        soundEnabled = true,
        soundVolume = 0.6,
        showScrollHint = true,
        style,
    } = props

    const images = useMemo(() => {
        const allImages = [image1, image2, image3, image4, image5, image6, image7, image8, image9, image10, image11, image12, image13, image14, image15, image16, image17, image18, image19, image20, image21, image22, image23, image24, image25, image26, image27, image28, image29, image30]
        return allImages.slice(0, numImages).filter((img): img is { src: string; srcSet?: string; alt?: string } => 
            !!img?.src
        )
    }, [image1, image2, image3, image4, image5, image6, image7, image8, image9, image10, image11, image12, image13, image14, image15, image16, image17, image18, image19, image20, image21, image22, image23, image24, image25, image26, image27, image28, image29, image30, numImages])

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })
    const isStatic = useIsStaticRenderer()

    // Touch handling refs
    const touchStartRef = useRef<{ x: number; y: number } | null>(null)
    const touchStartOffsetRef = useRef(0)

    const [containerSize, setContainerSize] = useState({ width: 600, height: 340 })
    const [hasEntered, setHasEntered] = useState(isStatic)
    const [currentIndex, setCurrentIndex] = useState(0)

    const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const lastSoundTimeRef = useRef(0)
    const lastScrollDeltaRef = useRef(0)
    const scrollVelocityRef = useRef(0)

    const isHorizontal = orientation === "horizontal"

    // Reset scroll position when images change
    useEffect(() => {
        if (images.length > 0 && !isStatic) {
            baseOffset.set(0)
            setCurrentIndex(0)
        }
    }, [images.length, isStatic])

    useEffect(() => {
        if (!isStatic && isInView && !hasEntered) setHasEntered(true)
    }, [isInView, hasEntered, isStatic])

    useEffect(() => {
        if (isStatic) return
        const updateSize = () => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            setContainerSize({ width: Math.max(rect.width, 5), height: Math.max(rect.height, 5) })
        }
        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
    }, [isStatic])

    // Calculate base dimensions at 100% scale
    const baseItemHeight = isHorizontal 
        ? containerSize.height * ITEM_HEIGHT_PERCENT 
        : containerSize.height * ITEM_HEIGHT_PERCENT
    const baseItemWidth = isHorizontal 
        ? baseItemHeight * ITEM_ASPECT_RATIO 
        : containerSize.width * ITEM_WIDTH_PERCENT
    
    // Apply itemWidth as a scale factor to width only
    const scaleFactor = itemWidth / 100
    const finalItemWidth = baseItemWidth * scaleFactor
    const itemHeight = baseItemHeight
    
    const itemSize = Math.max(isHorizontal ? finalItemWidth + gap : itemHeight + gap, 1)

    const baseOffset = useMotionValue(0)
    
    const springConfig = useMemo(() => ({
        stiffness: 500 - scrollSmoothness * 450,
        damping: 15 + scrollSmoothness * 25,
        mass: 0.6 + scrollSmoothness * 0.4,
    }), [scrollSmoothness])
    
    const springOffset = useSpring(baseOffset, springConfig)

    // Track previous index to detect item transitions
    const prevIndexRef = useRef(0)
    const hasInitializedRef = useRef(false)

    // Track previous position for half-item sound triggering
    const prevHalfPosRef = useRef(0)

    useEffect(() => {
        if (isStatic || !itemSize) return
        
        unsubscribeRef.current?.()
        unsubscribeRef.current = springOffset.on("change", (v) => {
            if (images.length === 0) return
            
            // Calculate position in items (can be fractional)
            const pos = -v / itemSize
            
            // Calculate current half-position (every 0.5 items)
            const halfPos = Math.floor(pos * 2)
            
            // Play sound when crossing a 0.5 item boundary
            if (hasInitializedRef.current && halfPos !== prevHalfPosRef.current) {
                playItemScrollSound(scrollVelocityRef.current)
            }
            
            prevHalfPosRef.current = halfPos
            hasInitializedRef.current = true
            
            // Update current index for UI
            const idx = Math.round(pos)
            const newIndex = ((idx % images.length) + images.length) % images.length
            setCurrentIndex(newIndex)
        })
        
        return () => {
            unsubscribeRef.current?.()
            unsubscribeRef.current = null
        }
    }, [springOffset, images.length, itemSize, isStatic])

    useEffect(() => () => {
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current)
        if (audioContextRef.current) audioContextRef.current.close()
    }, [])

    const playItemScrollSound = useCallback((velocity: number = 1) => {
        if (isStatic || !soundEnabled) return
        const now = Date.now()
        if (now - lastSoundTimeRef.current < SOUND_THROTTLE_MS) return
        lastSoundTimeRef.current = now

        // Velocity factor: 0.1 (slow) to 1.0 (fast), scaled by soundVolume (max volume)
        const velocityFactor = Math.min(1, Math.max(0.1, velocity * 2))
        const finalVolume = Math.min(1, soundVolume * velocityFactor)

        try {
            if (!audioContextRef.current || audioContextRef.current.state === "closed") {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            }
            const ctx = audioContextRef.current
            if (ctx.state === "suspended") ctx.resume()

            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const filter = ctx.createBiquadFilter()

            osc.connect(filter)
            filter.connect(gain)
            gain.connect(ctx.destination)

            switch (soundEffectType) {
                case "mechanical":
                    // Mechanical click sound
                    osc.type = "square"
                    osc.frequency.setValueAtTime(1200, ctx.currentTime)
                    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03)
                    filter.type = "highpass"
                    filter.frequency.setValueAtTime(600, ctx.currentTime)
                    gain.gain.setValueAtTime(0, ctx.currentTime)
                    gain.gain.linearRampToValueAtTime(0.3 * finalVolume, ctx.currentTime + 0.005)
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)
                    osc.start(ctx.currentTime)
                    osc.stop(ctx.currentTime + 0.04)
                    break

                case "bloop":
                    // Soft bloop
                    osc.type = "triangle"
                    osc.frequency.setValueAtTime(300, ctx.currentTime)
                    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.08)
                    filter.type = "lowpass"
                    filter.frequency.setValueAtTime(600, ctx.currentTime)
                    filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08)
                    gain.gain.setValueAtTime(0, ctx.currentTime)
                    gain.gain.linearRampToValueAtTime(0.25 * finalVolume, ctx.currentTime + 0.01)
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
                    osc.start(ctx.currentTime)
                    osc.stop(ctx.currentTime + 0.13)
                    break

                case "whoosh":
                    // Subtle whoosh using filtered noise
                    const bufferSize = ctx.sampleRate * 0.1
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
                    const data = buffer.getChannelData(0)
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1
                    }
                    const noise = ctx.createBufferSource()
                    noise.buffer = buffer
                    noise.connect(filter)
                    filter.connect(gain)
                    filter.type = "bandpass"
                    filter.frequency.setValueAtTime(200, ctx.currentTime)
                    filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1)
                    filter.Q.setValueAtTime(1, ctx.currentTime)
                    gain.gain.setValueAtTime(0, ctx.currentTime)
                    gain.gain.linearRampToValueAtTime(0.2 * finalVolume, ctx.currentTime + 0.02)
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
                    noise.start(ctx.currentTime)
                    noise.stop(ctx.currentTime + 0.12)
                    break

                case "chime":
                    // Musical chime
                    osc.type = "sine"
                    osc.frequency.setValueAtTime(880, ctx.currentTime)
                    filter.type = "lowpass"
                    filter.frequency.setValueAtTime(2000, ctx.currentTime)
                    gain.gain.setValueAtTime(0, ctx.currentTime)
                    gain.gain.linearRampToValueAtTime(0.3 * finalVolume, ctx.currentTime + 0.005)
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
                    osc.start(ctx.currentTime)
                    osc.stop(ctx.currentTime + 0.3)
                    break

                case "tap":
                    // Percussive tap
                    osc.type = "sine"
                    osc.frequency.setValueAtTime(600, ctx.currentTime)
                    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.02)
                    filter.type = "lowpass"
                    filter.frequency.setValueAtTime(1500, ctx.currentTime)
                    gain.gain.setValueAtTime(0, ctx.currentTime)
                    gain.gain.linearRampToValueAtTime(0.4 * finalVolume, ctx.currentTime + 0.003)
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
                    osc.start(ctx.currentTime)
                    osc.stop(ctx.currentTime + 0.05)
                    break

                case "softClick":
                    // Soft click - gentle, subtle sound
                    osc.type = "sine"
                    osc.frequency.setValueAtTime(800, ctx.currentTime)
                    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.015)
                    filter.type = "lowpass"
                    filter.frequency.setValueAtTime(2000, ctx.currentTime)
                    gain.gain.setValueAtTime(0, ctx.currentTime)
                    gain.gain.linearRampToValueAtTime(0.15 * finalVolume, ctx.currentTime + 0.002)
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
                    osc.start(ctx.currentTime)
                    osc.stop(ctx.currentTime + 0.035)
                    break
            }
        } catch {
            // Silent fail
        }
    }, [isStatic, soundEffectType, soundEnabled, soundVolume])

    const snapToNearest = () => {
        if (itemSize < 2 || images.length <= 1) return
        const target = -Math.round(-baseOffset.get() / itemSize) * itemSize
        animate(baseOffset, target, { type: "spring", ...springConfig })
    }

    const handleWheel = (e: React.WheelEvent) => {
        if (isStatic || images.length <= 1 || itemSize < 2) return
        e.preventDefault()
        const delta = isHorizontal ? e.deltaX || e.deltaY : e.deltaY
        
        // Calculate scroll velocity
        const now = Date.now()
        const timeDelta = Math.max(1, now - lastSoundTimeRef.current)
        const velocity = Math.abs(delta) / timeDelta
        scrollVelocityRef.current = velocity
        lastScrollDeltaRef.current = delta
        
        baseOffset.set(baseOffset.get() - delta * scrollSpeed)
        // Sound is now triggered by index change in the useEffect above
        if (!autoCentered) return
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current)
        snapTimeoutRef.current = setTimeout(snapToNearest, SNAP_TIMEOUT_MS)
    }

    useEffect(() => {
        if (isStatic) return () => {}
        
        const el = containerRef.current
        if (!el) return () => {}

        // Manual touch event listeners with passive: false to prevent page scroll
        const onTouchStart = (e: TouchEvent) => {
            if (images.length <= 1 || itemSize < 2) return
            const touch = e.touches[0]
            touchStartRef.current = { x: touch.clientX, y: touch.clientY }
            touchStartOffsetRef.current = baseOffset.get()
            
            // Initialize/resume audio context on mobile during user gesture
            if (soundEnabled) {
                try {
                    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
                    }
                    if (audioContextRef.current.state === "suspended") {
                        audioContextRef.current.resume()
                    }
                } catch {
                    // Silent fail
                }
            }
        }

        const onTouchMove = (e: TouchEvent) => {
            if (!touchStartRef.current || images.length <= 1 || itemSize < 2) return
            e.preventDefault()
            
            const touch = e.touches[0]
            const deltaX = touch.clientX - touchStartRef.current.x
            const deltaY = touch.clientY - touchStartRef.current.y
            const delta = isHorizontal ? deltaX : deltaY
            
            // Calculate scroll velocity
            const now = Date.now()
            const timeDelta = Math.max(1, now - lastSoundTimeRef.current)
            const velocity = Math.abs(delta) / timeDelta
            scrollVelocityRef.current = velocity
            
            baseOffset.set(touchStartOffsetRef.current + delta)
        }

        const onTouchEnd = () => {
            touchStartRef.current = null
            if (autoCentered && images.length > 1 && itemSize >= 2) {
                snapToNearest()
            }
        }

        el.addEventListener("touchstart", onTouchStart, { passive: true })
        el.addEventListener("touchmove", onTouchMove, { passive: false })
        el.addEventListener("touchend", onTouchEnd, { passive: true })
        el.addEventListener("touchcancel", onTouchEnd, { passive: true })

        return () => {
            el.removeEventListener("touchstart", onTouchStart)
            el.removeEventListener("touchmove", onTouchMove)
            el.removeEventListener("touchend", onTouchEnd)
            el.removeEventListener("touchcancel", onTouchEnd)
        }
    }, [isStatic, images.length, itemSize, isHorizontal, autoCentered, baseOffset, springConfig, soundEnabled])

    const goToIndex = (index: number) => {
        if (images.length <= 1 || itemSize < 2 || isStatic) return
        const current = Math.round(-springOffset.get() / itemSize)
        const wrapped = ((current % images.length) + images.length) % images.length
        let diff = index - wrapped
        if (diff > images.length / 2) diff -= images.length
        if (diff < -images.length / 2) diff += images.length
        animate(baseOffset, springOffset.get() - diff * itemSize, { type: "spring", ...springConfig })
    }

    // Empty state - works for both static and animated
    if (!images.length) {
        return (
            <motion.div 
                ref={containerRef} 
                initial={isStatic ? false : { opacity: 0 }} 
                animate={{ opacity: 1 }} 
                style={{ ...style, backgroundColor, borderRadius, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}
            >
                Add images to the carousel
            </motion.div>
        )
    }

    // Static renderer with images
    if (isStatic) {
        const h = isHorizontal ? 200 : 180
        const w = isHorizontal ? h * (16 / 9) : 280
        return (
            <div ref={containerRef} style={{ ...style, backgroundColor, borderRadius, overflow: "hidden", display: "flex", flexDirection: isHorizontal ? "row" : "column", gap, padding, overflowX: isHorizontal ? "auto" : "hidden", overflowY: isHorizontal ? "hidden" : "auto" }}>
                {images.map((img, i) => (
                    <div key={i} style={{ width: w, height: h, borderRadius, overflow: "hidden", flexShrink: 0 }}>
                        <img src={img.src} alt={img.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
                    </div>
                ))}
            </div>
        )
    }

    const containerStyle = { 
        ...style, 
        position: "relative" as const, 
        backgroundColor, 
        overflow: "hidden", 
        borderRadius, 
        overscrollBehavior: "contain",
        touchAction: "none",
        padding
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", width: style?.width ?? "100%", height: style?.height ?? "100%" }}>
            <motion.div
                ref={containerRef}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={hasEntered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: entranceDuration, delay: entranceDelay, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={containerStyle}
                onWheel={handleWheel}
            >
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                    {images.map((img, i) => (
                        <GalleryItem
                            key={`${i}-${finalItemWidth}-${itemHeight}`}
                            itemIndex={i}
                            image={img}
                            itemWidth={finalItemWidth}
                            itemHeight={itemHeight}
                            itemSize={itemSize}
                            borderRadius={borderRadius}
                            isHorizontal={isHorizontal}
                            containerSize={containerSize}
                            springOffset={springOffset}
                            hasEntered={hasEntered}
                            entranceDelay={entranceDelay}
                            totalImages={images.length}
                        />
                    ))}
                </div>

                {showIndicators && images.length > 1 && hasEntered && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: entranceDelay + 0.4 }} style={{ position: "absolute", bottom: isHorizontal ? padding + 8 : "auto", right: isHorizontal ? "auto" : padding + 8, top: isHorizontal ? "auto" : "50%", left: isHorizontal ? "50%" : "auto", transform: isHorizontal ? "translateX(-50%)" : "translateY(-50%)", display: "flex", flexDirection: isHorizontal ? "row" : "column", gap: 8, zIndex: 10, pointerEvents: "auto" }}>
                        {images.map((_, i) => (
                            <button key={i} onClick={() => goToIndex(i)} style={{ width: isHorizontal ? 8 : 6, height: isHorizontal ? 6 : 8, borderRadius: 4, border: "none", backgroundColor: i === currentIndex ? indicatorActiveColor : indicatorColor, cursor: "pointer", transition: "background-color 0.3s", padding: 0 }} aria-label={`Go to image ${i + 1}`} />
                        ))}
                    </motion.div>
                )}
            </motion.div>
            {showScrollHint && (
                <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 12, fontFamily: "sans-serif", letterSpacing: "0.05em", marginTop: 8, paddingLeft: 4 }}>
                    ( Scroll {isHorizontal ? "horizontally" : "vertically"} )
                </div>
            )}
        </div>
    )
}

/**
 * GalleryItem Component
 * Renders individual carousel items with infinite scroll positioning
 */
function GalleryItem({ itemIndex, image, itemWidth, itemHeight, itemSize, borderRadius, isHorizontal, containerSize, springOffset, hasEntered, entranceDelay, totalImages }: {
    itemIndex: number
    image: { src: string; srcSet?: string; alt?: string }
    itemWidth: number
    itemHeight: number
    itemSize: number
    borderRadius: number
    isHorizontal: boolean
    containerSize: { width: number; height: number }
    springOffset: any
    hasEntered: boolean
    entranceDelay: number
    totalImages: number
}) {
    /**
     * Calculates the wrapped position for infinite scroll effect.
     * 
     * The math works as follows:
     * 1. Calculate raw position: itemIndex * itemSize + offset
     * 2. Wrap position within total range using modulo: ((pos % total) + total) % total
     *    - This handles both positive and negative offsets correctly
     * 3. If position is beyond halfway point, subtract total to keep items near center
     *    - This ensures we always render the shortest path (left or right of center)
     * 
     * Example with 3 items (itemSize=100, total=300):
     * - Item 0 at offset 0: pos = 0 + 0 = 0, wrapped = 0
     * - Item 0 at offset -400 (scrolled left): pos = 0 - 400 = -400
     *   wrapped = ((-400 % 300) + 300) % 300 = ((-100) + 300) % 300 = 200
     *   Since 200 > 150 (total/2), subtract 300: pos = -100 (rendered just left of center)
     */
    const getPosition = (offset: number) => {
        const total = totalImages * itemSize
        if (!total) return 0
        
        let pos = itemIndex * itemSize + offset
        // Wrap within total range using positive modulo
        pos = ((pos % total) + total) % total
        // Keep items within ±half total for shortest-path positioning
        if (pos > total / 2) pos -= total
        
        return pos
    }

    // Calculate X position: center of container minus half item width plus wrapped offset
    const x = useTransform(springOffset, (v: number) => 
        isHorizontal ? containerSize.width / 2 - itemWidth / 2 + getPosition(v) : containerSize.width / 2 - itemWidth / 2
    )

    // Calculate Y position: center of container minus half item height plus wrapped offset
    const y = useTransform(springOffset, (v: number) => 
        isHorizontal ? containerSize.height / 2 - itemHeight / 2 : containerSize.height / 2 - itemHeight / 2 + getPosition(v)
    )

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={hasEntered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: entranceDelay + itemIndex * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ width: itemWidth, height: itemHeight, borderRadius, overflow: "hidden", position: "absolute", x, y, top: 0, left: 0, willChange: "transform" }}
        >
            <img src={image.src} alt={image.alt || ""} srcSet={image.srcSet} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", userSelect: "none" }} draggable={false} />
        </motion.div>
    )
}

addPropertyControls(MotionGallery, {
    numImages: { type: ControlType.Number, title: "Number of Images", defaultValue: 10, min: 2, max: 30, step: 1, displayStepper: true },
    image1: { type: ControlType.ResponsiveImage, title: "Image 1", hidden: ({ numImages }) => numImages < 1 },
    image2: { type: ControlType.ResponsiveImage, title: "Image 2", hidden: ({ numImages }) => numImages < 2 },
    image3: { type: ControlType.ResponsiveImage, title: "Image 3", hidden: ({ numImages }) => numImages < 3 },
    image4: { type: ControlType.ResponsiveImage, title: "Image 4", hidden: ({ numImages }) => numImages < 4 },
    image5: { type: ControlType.ResponsiveImage, title: "Image 5", hidden: ({ numImages }) => numImages < 5 },
    image6: { type: ControlType.ResponsiveImage, title: "Image 6", hidden: ({ numImages }) => numImages < 6 },
    image7: { type: ControlType.ResponsiveImage, title: "Image 7", hidden: ({ numImages }) => numImages < 7 },
    image8: { type: ControlType.ResponsiveImage, title: "Image 8", hidden: ({ numImages }) => numImages < 8 },
    image9: { type: ControlType.ResponsiveImage, title: "Image 9", hidden: ({ numImages }) => numImages < 9 },
    image10: { type: ControlType.ResponsiveImage, title: "Image 10", hidden: ({ numImages }) => numImages < 10 },
    image11: { type: ControlType.ResponsiveImage, title: "Image 11", hidden: ({ numImages }) => numImages < 11 },
    image12: { type: ControlType.ResponsiveImage, title: "Image 12", hidden: ({ numImages }) => numImages < 12 },
    image13: { type: ControlType.ResponsiveImage, title: "Image 13", hidden: ({ numImages }) => numImages < 13 },
    image14: { type: ControlType.ResponsiveImage, title: "Image 14", hidden: ({ numImages }) => numImages < 14 },
    image15: { type: ControlType.ResponsiveImage, title: "Image 15", hidden: ({ numImages }) => numImages < 15 },
    image16: { type: ControlType.ResponsiveImage, title: "Image 16", hidden: ({ numImages }) => numImages < 16 },
    image17: { type: ControlType.ResponsiveImage, title: "Image 17", hidden: ({ numImages }) => numImages < 17 },
    image18: { type: ControlType.ResponsiveImage, title: "Image 18", hidden: ({ numImages }) => numImages < 18 },
    image19: { type: ControlType.ResponsiveImage, title: "Image 19", hidden: ({ numImages }) => numImages < 19 },
    image20: { type: ControlType.ResponsiveImage, title: "Image 20", hidden: ({ numImages }) => numImages < 20 },
    image21: { type: ControlType.ResponsiveImage, title: "Image 21", hidden: ({ numImages }) => numImages < 21 },
    image22: { type: ControlType.ResponsiveImage, title: "Image 22", hidden: ({ numImages }) => numImages < 22 },
    image23: { type: ControlType.ResponsiveImage, title: "Image 23", hidden: ({ numImages }) => numImages < 23 },
    image24: { type: ControlType.ResponsiveImage, title: "Image 24", hidden: ({ numImages }) => numImages < 24 },
    image25: { type: ControlType.ResponsiveImage, title: "Image 25", hidden: ({ numImages }) => numImages < 25 },
    image26: { type: ControlType.ResponsiveImage, title: "Image 26", hidden: ({ numImages }) => numImages < 26 },
    image27: { type: ControlType.ResponsiveImage, title: "Image 27", hidden: ({ numImages }) => numImages < 27 },
    image28: { type: ControlType.ResponsiveImage, title: "Image 28", hidden: ({ numImages }) => numImages < 28 },
    image29: { type: ControlType.ResponsiveImage, title: "Image 29", hidden: ({ numImages }) => numImages < 29 },
    image30: { type: ControlType.ResponsiveImage, title: "Image 30", hidden: ({ numImages }) => numImages < 30 },
    soundEnabled: { type: ControlType.Boolean, title: "Sound Effect", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    soundVolume: { type: ControlType.Number, title: "Sound Volume", defaultValue: 0.6, min: 0, max: 1, step: 0.1, hidden: ({ soundEnabled }) => !soundEnabled },
    soundEffectType: {
        type: ControlType.Enum,
        title: "Sound Effect",
        options: ["mechanical", "bloop", "whoosh", "chime", "tap", "softClick"],
        optionTitles: ["Mechanical Click", "Soft Bloop", "Subtle Whoosh", "Musical Chime", "Percussive Tap", "Soft Click"],
        defaultValue: "tap",
        hidden: ({ soundEnabled }) => !soundEnabled,
    },
    autoCentered: { type: ControlType.Boolean, title: "Auto Centered", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    scrollSpeed: { type: ControlType.Number, title: "Scroll Speed", defaultValue: 0.5, min: 0.1, max: 2, step: 0.1 },
    scrollSmoothness: { type: ControlType.Number, title: "Scroll Smoothness", defaultValue: 0.5, min: 0, max: 1, step: 0.1, description: "Higher values create smoother, more fluid scrolling with more inertia" },
    orientation: { type: ControlType.Enum, title: "Orientation", options: ["horizontal", "vertical"], optionTitles: ["Horizontal", "Vertical"], defaultValue: "horizontal", displaySegmentedControl: true },
    gap: { type: ControlType.Number, title: "Item Gap", defaultValue: 16, min: 0, max: 64, step: 4, unit: "px" },
    padding: { type: ControlType.Number, title: "Container Padding", defaultValue: 16, min: 0, max: 64, step: 4, unit: "px" },
    itemWidth: { type: ControlType.Number, title: "Item Width", defaultValue: 100, min: 20, max: 150, step: 5, unit: "%", description: "Width of items relative to default size (100% = default)" },
    borderRadius: { type: ControlType.Number, title: "Border Radius", defaultValue: 12, min: 0, max: 40, step: 2, unit: "px" },
    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#000000" },
    showIndicators: { type: ControlType.Boolean, title: "Indicators", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    indicatorColor: { type: ControlType.Color, title: "Indicator Color", defaultValue: "rgba(255, 255, 255, 0.4)", hidden: ({ showIndicators }) => !showIndicators },
    indicatorActiveColor: { type: ControlType.Color, title: "Active Indicator", defaultValue: "#FFFFFF", hidden: ({ showIndicators }) => !showIndicators },
    entranceDuration: { type: ControlType.Number, title: "Entrance Duration", defaultValue: 0.6, min: 0.1, max: 2, step: 0.1, unit: "s" },
    entranceDelay: { type: ControlType.Number, title: "Entrance Delay", defaultValue: 0.1, min: 0, max: 1, step: 0.05, unit: "s" },
    showScrollHint: { type: ControlType.Boolean, title: "Scroll Hint", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
})

MotionGallery.displayName = "Motion Gallery"