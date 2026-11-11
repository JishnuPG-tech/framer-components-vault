// Full-width media gallery slideshow with liquid spring animations, auto-play, drag support, and video playback

import { useEffect, useRef, useState, useCallback, useMemo, startTransition, type CSSProperties } from "react"
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


interface MediaSlide {
	type: "image" | "video"
	src: string
	alt?: string
	srcSet?: string
}

interface MediaGalleryProps {
	slides: MediaSlide[]
	autoPlayInterval: number
	showArrows: boolean
	showIndicators: boolean
	theme: "light" | "dark" | "custom"
	arrowColor: string
	indicatorColor: string
	arrowBackgroundColor: string
	indicatorBackgroundColor: string
	overlayOpacity: number
	enableLazyLoading: boolean
	preloadAdjacent: boolean
	// Animation customization
	transitionType: "spring" | "tween" | "inertia"
	springStiffness: number
	springDamping: number
	springMass: number
	tweenDuration: number
	tweenEase: string
	enterScale: number
	exitScale: number
	blurIntensity: number
	enableRotation: boolean
	rotationDegrees: number
	opacityTransition: boolean
	enterOpacity: number
	exitOpacity: number
	enableSharing: boolean
	shareButtonPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left"
	shareTitle: string
	shareDescription: string
	style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MediaGallery(props: MediaGalleryProps) {
	const {
		slides = [
			{
				type: "image",
				src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
				alt: "Slide 1",
			},
			{
				type: "image",
				src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
				alt: "Slide 2",
			},
			{
				type: "video",
				src: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
				alt: "Slide 3",
			},
			{
				type: "image",
				src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
				alt: "Slide 4",
			},
		],
		autoPlayInterval = 4000,
		showArrows = true,
		showIndicators = true,
		theme = "dark",
		arrowColor = "#FFFFFF",
		indicatorColor = "#FFFFFF",
		arrowBackgroundColor = "rgba(0, 0, 0, 0.5)",
		indicatorBackgroundColor = "rgba(0, 0, 0, 0.3)",
		overlayOpacity = 0.5,
		enableLazyLoading = true,
		preloadAdjacent = true,
		transitionType = "spring",
		springStiffness = 250,
		springDamping = 25,
		springMass = 0.8,
		tweenDuration = 0.5,
		tweenEase = "easeInOut",
		enterScale = 1.05,
		exitScale = 0.95,
		blurIntensity = 2,
		enableRotation = false,
		rotationDegrees = 0,
		opacityTransition = false,
		enterOpacity = 1,
		exitOpacity = 1,
		enableSharing = true,
		shareButtonPosition = "top-right",
		shareTitle = "Check out this slide!",
		shareDescription = "Amazing content from our gallery",
	} = props

	// Theme configuration
	const themeConfig = useMemo(() => {
		const themes = {
			light: {
				arrowColor: "#000000",
				indicatorColor: "#000000",
				arrowBackground: "rgba(255, 255, 255, 0.8)",
				indicatorBackground: "rgba(255, 255, 255, 0.6)",
			},
			dark: {
				arrowColor: "#FFFFFF",
				indicatorColor: "#FFFFFF",
				arrowBackground: "rgba(0, 0, 0, 0.5)",
				indicatorBackground: "rgba(0, 0, 0, 0.3)",
			},
			custom: {
				arrowColor: arrowColor,
				indicatorColor: indicatorColor,
				arrowBackground: arrowBackgroundColor,
				indicatorBackground: indicatorBackgroundColor,
			},
		}

		return themes[theme]
	}, [theme, arrowColor, indicatorColor, arrowBackgroundColor, indicatorBackgroundColor])

	// Transform slides to handle both old format and new property control format
	const processedSlides = useMemo(() => {
		return slides.map((slide: any) => {
			// If slide already has src, use it as-is
			if (slide.src) {
				return slide
			}
			
			// Handle new property control format
			if (slide.type === "image" && slide.image) {
				return {
					type: "image",
					src: slide.image.src || slide.image,
					srcSet: slide.image.srcSet,
					alt: slide.alt || slide.image.alt || "Slide",
				}
			}
			
			if (slide.type === "video" && slide.video) {
				return {
					type: "video",
					src: typeof slide.video === "string" ? slide.video : slide.video.src || slide.video,
					alt: slide.alt || "Video slide",
				}
			}
			
			// Fallback
			return {
				type: "image",
				src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
				alt: "Slide",
			}
		})
	}, [slides])

	const [currentIndex, setCurrentIndex] = useState(0)
	const [isHovered, setIsHovered] = useState(false)
	const [direction, setDirection] = useState(0)
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
	const [loadedSlides, setLoadedSlides] = useState<Set<number>>(new Set([0]))
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [showShareMenu, setShowShareMenu] = useState(false)
	const [copySuccess, setCopySuccess] = useState(false)
	const [isInView, setIsInView] = useState(true)
	const autoPlayTimerRef = useRef<number | null>(null)
	const transitionResetTimeoutRef = useRef<number | null>(null)
	const copySuccessTimeoutRef = useRef<number | null>(null)
	const isMountedRef = useRef(true)
	const lastInteractionRef = useRef<number>(0)
	const containerRef = useRef<HTMLDivElement>(null)
	const isDraggingRef = useRef(false)

	const isStaticRenderer = useIsStaticRenderer()
	const isStatic = isStaticRenderer || RenderTarget.current() === RenderTarget.thumbnail
	const shouldAnimate = !isStatic

	useEffect(() => {
		isMountedRef.current = true
		return () => {
			isMountedRef.current = false
			if (transitionResetTimeoutRef.current !== null) {
				clearTimeout(transitionResetTimeoutRef.current)
				transitionResetTimeoutRef.current = null
			}
			if (copySuccessTimeoutRef.current !== null) {
				clearTimeout(copySuccessTimeoutRef.current)
				copySuccessTimeoutRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		if (isStatic) return
		if (typeof window === "undefined") return
		const container = containerRef.current
		if (!container) return

		if (typeof window.IntersectionObserver === "undefined") {
			startTransition(() => setIsInView(true))
			return
		}

		const observer = new window.IntersectionObserver(
			(entries) => {
				const entry = entries[0]
				startTransition(() => setIsInView(Boolean(entry?.isIntersecting)))
			},
			{ threshold: 0.2 }
		)

		observer.observe(container)
		return () => observer.disconnect()
	}, [isStatic])

	// Track container size for responsive adjustments
	useEffect(() => {
		if (isStatic || !containerRef.current) return

		const updateSize = () => {
			if (containerRef.current) {
				startTransition(() =>
					setContainerSize({
						width: containerRef.current.offsetWidth,
						height: containerRef.current.offsetHeight,
					})
				)
			}
		}

		updateSize()
		window.addEventListener("resize", updateSize)
		return () => window.removeEventListener("resize", updateSize)
	}, [isStatic])

	// Responsive sizing calculations
	const isMobile = containerSize.width < 640
	const isTablet = containerSize.width >= 640 && containerSize.width < 1024

	const arrowSize = isMobile ? 40 : isTablet ? 44 : 48
	const arrowPadding = isMobile ? 12 : isTablet ? 16 : 20
	const indicatorBottom = isMobile ? 12 : isTablet ? 16 : 20
	const indicatorGap = isMobile ? 6 : 8
	const indicatorActiveWidth = isMobile ? 20 : 24
	const indicatorSize = isMobile ? 5 : 6

	const goToSlide = useCallback(
		(index: number, dir: number) => {
			if (isTransitioning) return
			
			// Normalize index to always be within bounds
			const normalizedIndex = ((index % processedSlides.length) + processedSlides.length) % processedSlides.length
			
			if (normalizedIndex === currentIndex) return
			
			startTransition(() => {
				setDirection(dir)
				setIsTransitioning(true)
			})
			startTransition(() => setCurrentIndex(normalizedIndex))
			lastInteractionRef.current = Date.now()
			
			// Reset transitioning state after animation completes
			if (transitionResetTimeoutRef.current !== null) {
				clearTimeout(transitionResetTimeoutRef.current)
			}
			transitionResetTimeoutRef.current = window.setTimeout(() => {
				if (!isMountedRef.current) return
				startTransition(() => setIsTransitioning(false))
			}, 600)
		},
		[currentIndex, processedSlides.length, isTransitioning]
	)

	const nextSlide = useCallback(() => {
		const nextIndex = (currentIndex + 1) % processedSlides.length
		goToSlide(nextIndex, 1)
	}, [currentIndex, processedSlides.length, goToSlide])

	const prevSlide = useCallback(() => {
		const prevIndex = (currentIndex - 1 + processedSlides.length) % processedSlides.length
		goToSlide(prevIndex, -1)
	}, [currentIndex, processedSlides.length, goToSlide])

	// Auto-play logic
	useEffect(() => {
		if (isStatic || !isInView || isHovered || processedSlides.length <= 1) {
			if (autoPlayTimerRef.current !== null) {
				clearInterval(autoPlayTimerRef.current)
				autoPlayTimerRef.current = null
			}
			return
		}

		const startAutoPlay = () => {
			if (autoPlayTimerRef.current !== null) {
				clearInterval(autoPlayTimerRef.current)
			}

			autoPlayTimerRef.current = window.setInterval(() => {
				const timeSinceInteraction = Date.now() - lastInteractionRef.current
				if (timeSinceInteraction >= 2000) {
					nextSlide()
				}
			}, autoPlayInterval)
		}

		startAutoPlay()

		return () => {
			if (autoPlayTimerRef.current !== null) {
				clearInterval(autoPlayTimerRef.current)
				autoPlayTimerRef.current = null
			}
		}
	}, [isStatic, isInView, isHovered, autoPlayInterval, nextSlide, processedSlides.length])

	// Wheel navigation
	const handleWheel = useCallback(
		(e: WheelEvent) => {
			if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
				e.preventDefault()
				if (e.deltaX > 30) {
					nextSlide()
				} else if (e.deltaX < -30) {
					prevSlide()
				}
			}
		},
		[nextSlide, prevSlide]
	)

	useEffect(() => {
		if (isStatic) return
		const container = containerRef.current
		if (!container) return

		container.addEventListener("wheel", handleWheel, { passive: false })
		return () => container.removeEventListener("wheel", handleWheel)
	}, [handleWheel, isStatic])

	// Touch/drag navigation
	const handleDragStart = useCallback(() => {
		isDraggingRef.current = true
	}, [])

	const handleDragEnd = useCallback(
		(event: any, info: any) => {
			isDraggingRef.current = false
			const dragDistance = info.offset.x
			const velocity = info.velocity.x

			// More sensitive drag detection with velocity consideration
			if (Math.abs(dragDistance) > 50 || Math.abs(velocity) > 500) {
				if (dragDistance < 0 || velocity < -500) {
					nextSlide()
				} else {
					prevSlide()
				}
			}
		},
		[nextSlide, prevSlide]
	)

	const slideVariants = useMemo(
		() => ({
			enter: (direction: number) => ({
				x: direction > 0 ? "100%" : "-100%",
				scale: enterScale,
				opacity: opacityTransition ? enterOpacity : 0,
				rotate: enableRotation ? direction * rotationDegrees : 0,
				filter: "blur(0px)",
			}),
			center: {
				x: 0,
				scale: 1,
				opacity: 1,
				rotate: 0,
				filter: "blur(0px)",
			},
			exit: (direction: number) => ({
				x: direction > 0 ? "-100%" : "100%",
				scale: exitScale,
				opacity: opacityTransition ? exitOpacity : 0,
				rotate: enableRotation ? direction * -rotationDegrees : 0,
				filter: `blur(${blurIntensity}px)`,
			}),
		}),
		[enterScale, exitScale, blurIntensity, opacityTransition, enterOpacity, exitOpacity, enableRotation, rotationDegrees]
	)

	const springTransition = useMemo(
		() => ({
			type: "spring" as const,
			stiffness: springStiffness,
			damping: springDamping,
			mass: springMass,
			restDelta: 0.001,
			restSpeed: 0.001,
		}),
		[springStiffness, springDamping, springMass]
	)

	const slideTransition = useMemo(() => {
		if (transitionType === "tween") {
			return {
				type: "tween" as const,
				duration: tweenDuration,
				ease: tweenEase as any,
			}
		}
		if (transitionType === "inertia") {
			return {
				type: "inertia" as const,
				bounceStiffness: springStiffness,
				bounceDamping: springDamping,
				timeConstant: 300,
			}
		}
		return springTransition
	}, [transitionType, tweenDuration, tweenEase, springStiffness, springDamping, springTransition])

	// Preload adjacent slides for smoother transitions
	useEffect(() => {
		if (!preloadAdjacent || isStatic) return

		const adjacentIndices = [
			(currentIndex - 1 + processedSlides.length) % processedSlides.length,
			(currentIndex + 1) % processedSlides.length,
		]

		startTransition(() => {
			setLoadedSlides((prev) => {
				const newSet = new Set(prev)
				newSet.add(currentIndex)
				adjacentIndices.forEach((idx) => newSet.add(idx))
				return newSet
			})
		})
	}, [currentIndex, processedSlides.length, preloadAdjacent, isStatic])

	// Generate responsive srcSet if not provided
	const generateSrcSet = useCallback((src: string, providedSrcSet?: string) => {
		if (providedSrcSet) return providedSrcSet

		// If it's a Framer asset, generate responsive variants
		if (src.includes("framerusercontent.com/images/")) {
			const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
			return widths.map((w) => `${src}?scale-down-to=${w} ${w}w`).join(", ")
		}

		return undefined
	}, [])

	// Check if browser supports WebP
	const [supportsWebP, setSupportsWebP] = useState(false)

	useEffect(() => {
		if (isStatic) return

		const checkWebPSupport = () => {
			const elem = document.createElement("canvas")
			if (elem.getContext && elem.getContext("2d")) {
				const support = elem.toDataURL("image/webp").indexOf("data:image/webp") === 0
				startTransition(() => setSupportsWebP(support))
			}
		}

		checkWebPSupport()
	}, [isStatic])

	// Optimize image URL for WebP if supported
	const optimizeImageUrl = useCallback(
		(src: string) => {
			if (!supportsWebP || !src) return src

			// For Framer assets, request WebP format
			if (src.includes("framerusercontent.com/images/")) {
				const separator = src.includes("?") ? "&" : "?"
				return `${src}${separator}format=webp`
			}

			return src
		},
		[supportsWebP]
	)

	// Determine if a slide should be loaded
	const shouldLoadSlide = useCallback(
		(index: number) => {
			if (!enableLazyLoading) return true
			return loadedSlides.has(index)
		},
		[enableLazyLoading, loadedSlides]
	)

	// Share functionality
	const getCurrentSlideUrl = useCallback(() => {
		if (typeof window === "undefined") return ""
		// Return the current page URL with slide index as hash
		return `${window.location.href.split("#")[0]}#slide-${currentIndex + 1}`
	}, [currentIndex])

	const getCurrentSlideImage = useCallback(() => {
		const currentSlide = processedSlides[currentIndex]
		if (currentSlide?.type === "image") {
			return currentSlide.src
		}
		// For videos, return a placeholder or thumbnail
		return ""
	}, [currentIndex, processedSlides])

	const shareToTwitter = useCallback(() => {
		const url = getCurrentSlideUrl()
		const text = encodeURIComponent(shareTitle)
		window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, "_blank")
		startTransition(() => setShowShareMenu(false))
	}, [getCurrentSlideUrl, shareTitle])

	const shareToFacebook = useCallback(() => {
		const url = getCurrentSlideUrl()
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
		startTransition(() => setShowShareMenu(false))
	}, [getCurrentSlideUrl])

	const shareToLinkedIn = useCallback(() => {
		const url = getCurrentSlideUrl()
		window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank")
		startTransition(() => setShowShareMenu(false))
	}, [getCurrentSlideUrl])

	const shareToPinterest = useCallback(() => {
		const url = getCurrentSlideUrl()
		const imageUrl = getCurrentSlideImage()
		const description = encodeURIComponent(shareDescription)
		if (imageUrl) {
			window.open(
				`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(imageUrl)}&description=${description}`,
				"_blank"
			)
		}
		startTransition(() => setShowShareMenu(false))
	}, [getCurrentSlideUrl, getCurrentSlideImage, shareDescription])

	const copyLinkToClipboard = useCallback(() => {
		const url = getCurrentSlideUrl()
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(url).then(() => {
				startTransition(() => {
					setCopySuccess(true)
					if (copySuccessTimeoutRef.current !== null) {
						clearTimeout(copySuccessTimeoutRef.current)
					}
					copySuccessTimeoutRef.current = window.setTimeout(() => {
						if (!isMountedRef.current) return
						startTransition(() => setCopySuccess(false))
					}, 2000)
				})
			})
		}
		startTransition(() => setShowShareMenu(false))
	}, [getCurrentSlideUrl])

	// Get share button position styles
	const getShareButtonPosition = useCallback(() => {
		const offset = isMobile ? 12 : 16
		const positions = {
			"top-right": { top: offset, right: offset },
			"top-left": { top: offset, left: offset },
			"bottom-right": { bottom: offset + (showIndicators ? 50 : 0), right: offset },
			"bottom-left": { bottom: offset + (showIndicators ? 50 : 0), left: offset },
		}
		return positions[shareButtonPosition]
	}, [shareButtonPosition, isMobile, showIndicators])

	return (
		<div
			ref={containerRef}
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				backgroundColor: "#000",
				touchAction: "pan-y pinch-zoom",
			}}
			onMouseEnter={() => startTransition(() => setIsHovered(true))}
			onMouseLeave={() => startTransition(() => setIsHovered(false))}
		>
			{shouldAnimate ? (
				<AnimatePresence initial={false} custom={direction} mode="popLayout">
					<motion.div
						key={`slide-${currentIndex}`}
						custom={direction}
						variants={slideVariants}
						initial="enter"
						animate="center"
						exit="exit"
						transition={slideTransition}
						drag="x"
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.2}
						dragMomentum={false}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							cursor: isDraggingRef.current ? "grabbing" : "grab",
							willChange: "transform, opacity",
						}}
					>
						{processedSlides[currentIndex]?.type === "video" ? (
							<video
								key={`video-${currentIndex}`}
								src={processedSlides[currentIndex].src}
								autoPlay
								muted
								loop
								playsInline
								preload="metadata"
								style={{
									width: "100%",
									height: "100%",
									objectFit: "cover",
									pointerEvents: "none",
								}}
								aria-label={processedSlides[currentIndex].alt || `Slide ${currentIndex + 1}`}
							/>
						) : (
							<img
								key={`image-${currentIndex}`}
								src={optimizeImageUrl(processedSlides[currentIndex]?.src)}
								srcSet={generateSrcSet(
									processedSlides[currentIndex]?.src,
									processedSlides[currentIndex]?.srcSet
								)}
								sizes="100vw"
								alt={processedSlides[currentIndex]?.alt || `Slide ${currentIndex + 1}`}
								loading="eager"
								decoding="async"
								style={{
									width: "100%",
									height: "100%",
									objectFit: "cover",
									pointerEvents: "none",
									userSelect: "none",
								}}
							/>
						)}
					</motion.div>
				</AnimatePresence>
			) : (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
					}}
				>
					{processedSlides[currentIndex]?.type === "video" ? (
						<video
							key={`video-static-${currentIndex}`}
							src={processedSlides[currentIndex].src}
							controls={false}
							muted
							playsInline
							preload="metadata"
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								pointerEvents: "none",
							}}
							aria-label={processedSlides[currentIndex].alt || `Slide ${currentIndex + 1}`}
						/>
					) : (
						<img
							key={`image-static-${currentIndex}`}
							src={processedSlides[currentIndex]?.src}
							srcSet={processedSlides[currentIndex]?.srcSet}
							sizes="100vw"
							alt={processedSlides[currentIndex]?.alt || `Slide ${currentIndex + 1}`}
							loading="eager"
							decoding="async"
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								pointerEvents: "none",
								userSelect: "none",
							}}
						/>
					)}
				</div>
			)}

			{/* Share Button */}
			{enableSharing && !isStatic && (
				<>
					<motion.button
						style={{
							position: "absolute",
							...getShareButtonPosition(),
							background: themeConfig.arrowBackground,
							border: "none",
							borderRadius: "50%",
							width: isMobile ? 36 : 40,
							height: isMobile ? 36 : 40,
							minWidth: isMobile ? 36 : 40,
							minHeight: isMobile ? 36 : 40,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							zIndex: 20,
							WebkitTapHighlightColor: "transparent",
							backdropFilter: "blur(4px)",
						}}
						initial={shouldAnimate ? { opacity: 0 } : false}
						animate={shouldAnimate ? { opacity: isHovered || isMobile ? overlayOpacity : overlayOpacity * 0.6 } : { opacity: overlayOpacity * 0.6 }}
						whileHover={shouldAnimate ? { scale: 1.1, opacity: overlayOpacity } : undefined}
						whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
						onClick={() => startTransition(() => setShowShareMenu(!showShareMenu))}
						aria-label="Share slide"
					>
						<svg width={isMobile ? 18 : 20} height={isMobile ? 18 : 20} viewBox="0 0 24 24" fill="none">
							<path
								d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08259 9.19346C7.54305 8.46607 6.66491 8 5.66667 8C3.82572 8 2.33333 9.49238 2.33333 11.3333C2.33333 13.1743 3.82572 14.6667 5.66667 14.6667C6.66491 14.6667 7.54305 14.2006 8.08259 13.4732L15.0227 17.2961C15.0077 17.4175 15 17.5412 15 17.6667C15 19.3235 16.3431 20.6667 18 20.6667C19.6569 20.6667 21 19.3235 21 17.6667C21 16.0098 19.6569 14.6667 18 14.6667C16.9017 14.6667 15.9636 15.2006 15.4241 16.0279L8.48398 12.2051C8.49899 12.0836 8.50667 11.9599 8.50667 11.8345C8.50667 11.709 8.49899 11.5853 8.48398 11.4638L15.4241 7.64095C15.9636 8.46833 16.9017 9.00195 18 9.00195V8Z"
								fill={themeConfig.arrowColor}
							/>
						</svg>
					</motion.button>

					{/* Share Menu */}
					<AnimatePresence>
						{showShareMenu && (
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ type: "spring", stiffness: 400, damping: 25 }}
								style={{
									position: "absolute",
									...getShareButtonPosition(),
									[shareButtonPosition.includes("right") ? "right" : "left"]: isMobile ? 56 : 60,
									background: themeConfig.arrowBackground,
									backdropFilter: "blur(8px)",
									borderRadius: 12,
									padding: "8px",
									display: "flex",
									flexDirection: shareButtonPosition.includes("top") ? "column" : "column-reverse",
									gap: 8,
									zIndex: 21,
									boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
								}}
							>
								{/* Twitter */}
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									onClick={shareToTwitter}
									style={{
										background: "transparent",
										border: "none",
										borderRadius: "50%",
										width: 36,
										height: 36,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										cursor: "pointer",
										WebkitTapHighlightColor: "transparent",
									}}
									aria-label="Share on Twitter"
								>
									<svg width={20} height={20} viewBox="0 0 24 24" fill={themeConfig.arrowColor}>
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
								</motion.button>

								{/* Facebook */}
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									onClick={shareToFacebook}
									style={{
										background: "transparent",
										border: "none",
										borderRadius: "50%",
										width: 36,
										height: 36,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										cursor: "pointer",
										WebkitTapHighlightColor: "transparent",
									}}
									aria-label="Share on Facebook"
								>
									<svg width={20} height={20} viewBox="0 0 24 24" fill={themeConfig.arrowColor}>
										<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
									</svg>
								</motion.button>

								{/* LinkedIn */}
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									onClick={shareToLinkedIn}
									style={{
										background: "transparent",
										border: "none",
										borderRadius: "50%",
										width: 36,
										height: 36,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										cursor: "pointer",
										WebkitTapHighlightColor: "transparent",
									}}
									aria-label="Share on LinkedIn"
								>
									<svg width={20} height={20} viewBox="0 0 24 24" fill={themeConfig.arrowColor}>
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
									</svg>
								</motion.button>

								{/* Pinterest (only for images) */}
								{processedSlides[currentIndex]?.type === "image" && (
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={shareToPinterest}
										style={{
											background: "transparent",
											border: "none",
											borderRadius: "50%",
											width: 36,
											height: 36,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											cursor: "pointer",
											WebkitTapHighlightColor: "transparent",
										}}
										aria-label="Share on Pinterest"
									>
										<svg width={20} height={20} viewBox="0 0 24 24" fill={themeConfig.arrowColor}>
											<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
										</svg>
									</motion.button>
								)}

								{/* Copy Link */}
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									onClick={copyLinkToClipboard}
									style={{
										background: "transparent",
										border: "none",
										borderRadius: "50%",
										width: 36,
										height: 36,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										cursor: "pointer",
										WebkitTapHighlightColor: "transparent",
										position: "relative",
									}}
									aria-label="Copy link"
								>
									{copySuccess ? (
										<svg width={20} height={20} viewBox="0 0 24 24" fill={themeConfig.arrowColor}>
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
										</svg>
									) : (
										<svg
											width={20}
											height={20}
											viewBox="0 0 24 24"
											fill="none"
											stroke={themeConfig.arrowColor}
											strokeWidth="2"
										>
											<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
											<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
										</svg>
									)}
								</motion.button>
							</motion.div>
						)}
					</AnimatePresence>
				</>
			)}

			{/* Preload adjacent slides */}
			{preloadAdjacent && !isStatic && (
				<div style={{ display: "none" }} aria-hidden="true">
					{[
						(currentIndex - 1 + processedSlides.length) % processedSlides.length,
						(currentIndex + 1) % processedSlides.length,
					].map((idx) => {
						const slide = processedSlides[idx]
						if (!slide || !shouldLoadSlide(idx)) return null

						return slide.type === "video" ? (
							<video key={`preload-${idx}`} src={slide.src} preload="metadata" />
						) : (
							<link
								key={`preload-${idx}`}
								rel="prefetch"
								as="image"
								href={optimizeImageUrl(slide.src)}
							/>
						)
					})}
				</div>
			)}

			{/* Navigation Arrows */}
			{showArrows && processedSlides.length > 1 && (
				<>
					<motion.button
						style={{
							position: "absolute",
							left: arrowPadding,
							top: "50%",
							transform: "translateY(-50%)",
							background: themeConfig.arrowBackground,
							border: "none",
							borderRadius: "50%",
							width: arrowSize,
							height: arrowSize,
							minWidth: arrowSize,
							minHeight: arrowSize,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							zIndex: 10,
							WebkitTapHighlightColor: "transparent",
							backdropFilter: "blur(4px)",
						}}
						initial={shouldAnimate ? { opacity: 0 } : false}
						animate={shouldAnimate ? { opacity: isHovered || isMobile ? overlayOpacity : overlayOpacity * 0.6 } : { opacity: overlayOpacity * 0.6 }}
						whileHover={shouldAnimate ? { scale: 1.1, opacity: overlayOpacity } : undefined}
						whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
						onClick={prevSlide}
						aria-label="Previous slide"
					>
						<svg
							width={isMobile ? 20 : 24}
							height={isMobile ? 20 : 24}
							viewBox="0 0 24 24"
							fill="none"
						>
							<path d="M15 18l-6-6 6-6" stroke={themeConfig.arrowColor} strokeWidth="2" strokeLinecap="round" />
						</svg>
					</motion.button>

					<motion.button
						style={{
							position: "absolute",
							right: arrowPadding,
							top: "50%",
							transform: "translateY(-50%)",
							background: themeConfig.arrowBackground,
							border: "none",
							borderRadius: "50%",
							width: arrowSize,
							height: arrowSize,
							minWidth: arrowSize,
							minHeight: arrowSize,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							zIndex: 10,
							WebkitTapHighlightColor: "transparent",
							backdropFilter: "blur(4px)",
						}}
						initial={shouldAnimate ? { opacity: 0 } : false}
						animate={shouldAnimate ? { opacity: isHovered || isMobile ? overlayOpacity : overlayOpacity * 0.6 } : { opacity: overlayOpacity * 0.6 }}
						whileHover={shouldAnimate ? { scale: 1.1, opacity: overlayOpacity } : undefined}
						whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
						onClick={nextSlide}
						aria-label="Next slide"
					>
						<svg
							width={isMobile ? 20 : 24}
							height={isMobile ? 20 : 24}
							viewBox="0 0 24 24"
							fill="none"
						>
							<path d="M9 18l6-6-6-6" stroke={themeConfig.arrowColor} strokeWidth="2" strokeLinecap="round" />
						</svg>
					</motion.button>
				</>
			)}

			{/* Indicators */}
			{showIndicators && processedSlides.length > 1 && (
				<div
					style={{
						position: "absolute",
						bottom: indicatorBottom,
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						gap: indicatorGap,
						alignItems: "center",
						zIndex: 10,
						padding: "8px 12px",
						background: themeConfig.indicatorBackground,
						borderRadius: 20,
						backdropFilter: "blur(4px)",
					}}
				>
					{processedSlides.map((_, index) => (
						<motion.button
							key={index}
							style={{
								background: themeConfig.indicatorColor,
								border: "none",
								cursor: "pointer",
								borderRadius: 12,
								padding: 0,
								minWidth: index === currentIndex ? indicatorActiveWidth : indicatorSize,
								WebkitTapHighlightColor: "transparent",
							}}
							animate={shouldAnimate ? {
								width: index === currentIndex ? indicatorActiveWidth : indicatorSize,
								height: indicatorSize,
								opacity: index === currentIndex ? 1 : 0.5,
							} : {
								width: index === currentIndex ? indicatorActiveWidth : indicatorSize,
								height: indicatorSize,
								opacity: index === currentIndex ? 1 : 0.5,
							}}
							transition={shouldAnimate ? springTransition : undefined}
							whileHover={shouldAnimate ? { opacity: 1 } : undefined}
							whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
							onClick={() => goToSlide(index, index > currentIndex ? 1 : -1)}
							aria-label={`Go to slide ${index + 1}`}
							aria-current={index === currentIndex ? "true" : "false"}
						/>
					))}
				</div>
			)}
		</div>
	)
}

addPropertyControls(MediaGallery, {
	slides: {
		type: ControlType.Array,
		title: "Slides",
		control: {
			type: ControlType.Object,
			controls: {
				type: {
					type: ControlType.Enum,
					title: "Type",
					options: ["image", "video"],
					optionTitles: ["Image", "Video"],
					defaultValue: "image",
				},
				image: {
					type: ControlType.ResponsiveImage,
					title: "Image",
					hidden: ({ type }) => type === "video",
				},
				video: {
					type: ControlType.File,
					title: "Video",
					allowedFileTypes: ["mp4", "webm", "mov"],
					hidden: ({ type }) => type === "image",
				},
				alt: {
					type: ControlType.String,
					title: "Alt Text",
					defaultValue: "Slide",
				},
			},
		},
		defaultValue: [
			{
				type: "image",
				image: {
					src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
					alt: "Slide 1",
				},
				alt: "Slide 1",
			},
			{
				type: "image",
				image: {
					src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
					alt: "Slide 2",
				},
				alt: "Slide 2",
			},
			{
				type: "video",
				video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
				alt: "Slide 3",
			},
		],
	},
	enableSharing: {
		type: ControlType.Boolean,
		title: "Enable Sharing",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	shareButtonPosition: {
		type: ControlType.Enum,
		title: "Share Position",
		options: ["top-right", "top-left", "bottom-right", "bottom-left"],
		optionTitles: ["Top Right", "Top Left", "Bottom Right", "Bottom Left"],
		defaultValue: "top-right",
		hidden: ({ enableSharing }) => !enableSharing,
	},
	shareTitle: {
		type: ControlType.String,
		title: "Share Title",
		defaultValue: "Check out this slide!",
		hidden: ({ enableSharing }) => !enableSharing,
	},
	shareDescription: {
		type: ControlType.String,
		title: "Share Description",
		defaultValue: "Amazing content from our gallery",
		displayTextArea: true,
		hidden: ({ enableSharing }) => !enableSharing,
	},
	theme: {
		type: ControlType.Enum,
		title: "Theme",
		options: ["light", "dark", "custom"],
		optionTitles: ["Light", "Dark", "Custom"],
		defaultValue: "dark",
		displaySegmentedControl: true,
	},
	arrowColor: {
		type: ControlType.Color,
		title: "Arrow Color",
		defaultValue: "#FFFFFF",
		hidden: ({ theme }) => theme !== "custom",
	},
	indicatorColor: {
		type: ControlType.Color,
		title: "Indicator Color",
		defaultValue: "#FFFFFF",
		hidden: ({ theme }) => theme !== "custom",
	},
	arrowBackgroundColor: {
		type: ControlType.Color,
		title: "Arrow Background",
		defaultValue: "rgba(0, 0, 0, 0.5)",
		hidden: ({ theme }) => theme !== "custom",
	},
	indicatorBackgroundColor: {
		type: ControlType.Color,
		title: "Indicator Background",
		defaultValue: "rgba(0, 0, 0, 0.3)",
		hidden: ({ theme }) => theme !== "custom",
	},
	overlayOpacity: {
		type: ControlType.Number,
		title: "Overlay Opacity",
		defaultValue: 1,
		min: 0,
		max: 1,
		step: 0.1,
	},
	autoPlayInterval: {
		type: ControlType.Number,
		title: "Auto-Play Interval",
		defaultValue: 4000,
		min: 1000,
		max: 10000,
		step: 500,
		unit: "ms",
	},
	showArrows: {
		type: ControlType.Boolean,
		title: "Show Arrows",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	showIndicators: {
		type: ControlType.Boolean,
		title: "Show Indicators",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	springStiffness: {
		type: ControlType.Number,
		title: "Spring Stiffness",
		defaultValue: 250,
		min: 50,
		max: 500,
		step: 10,
		hidden: ({ transitionType }) => transitionType === "tween",
	},
	springDamping: {
		type: ControlType.Number,
		title: "Spring Damping",
		defaultValue: 25,
		min: 10,
		max: 50,
		step: 1,
		hidden: ({ transitionType }) => transitionType === "tween",
	},
	springMass: {
		type: ControlType.Number,
		title: "Spring Mass",
		defaultValue: 0.8,
		min: 0.1,
		max: 2,
		step: 0.1,
		hidden: ({ transitionType }) => transitionType !== "spring",
	},
	transitionType: {
		type: ControlType.Enum,
		title: "Transition",
		options: ["spring", "tween", "inertia"],
		optionTitles: ["Spring", "Tween", "Inertia"],
		defaultValue: "spring",
	},
	tweenDuration: {
		type: ControlType.Number,
		title: "Tween Duration",
		defaultValue: 0.5,
		min: 0.1,
		max: 2,
		step: 0.1,
		hidden: ({ transitionType }) => transitionType !== "tween",
	},
	tweenEase: {
		type: ControlType.Enum,
		title: "Tween Ease",
		options: ["linear", "easeIn", "easeOut", "easeInOut"],
		optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out"],
		defaultValue: "easeInOut",
		hidden: ({ transitionType }) => transitionType !== "tween",
	},
	enterScale: {
		type: ControlType.Number,
		title: "Enter Scale",
		defaultValue: 1.05,
		min: 1,
		max: 1.2,
		step: 0.01,
	},
	exitScale: {
		type: ControlType.Number,
		title: "Exit Scale",
		defaultValue: 0.95,
		min: 0.8,
		max: 1,
		step: 0.01,
	},
	blurIntensity: {
		type: ControlType.Number,
		title: "Blur Intensity",
		defaultValue: 2,
		min: 0,
		max: 10,
		step: 0.5,
		unit: "px",
	},
	enableRotation: {
		type: ControlType.Boolean,
		title: "Rotation",
		defaultValue: false,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	rotationDegrees: {
		type: ControlType.Number,
		title: "Rotation Degrees",
		defaultValue: 0,
		min: 0,
		max: 30,
		step: 1,
		unit: "deg",
		hidden: ({ enableRotation }) => !enableRotation,
	},
	opacityTransition: {
		type: ControlType.Boolean,
		title: "Opacity Transition",
		defaultValue: false,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	enterOpacity: {
		type: ControlType.Number,
		title: "Enter Opacity",
		defaultValue: 1,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: ({ opacityTransition }) => !opacityTransition,
	},
	exitOpacity: {
		type: ControlType.Number,
		title: "Exit Opacity",
		defaultValue: 1,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: ({ opacityTransition }) => !opacityTransition,
	},
	enableLazyLoading: {
		type: ControlType.Boolean,
		title: "Lazy Loading",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	preloadAdjacent: {
		type: ControlType.Boolean,
		title: "Preload Adjacent",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
})