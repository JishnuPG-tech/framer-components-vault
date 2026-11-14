// Użytkownik: sekcja animowana na scroll; start od pliku wektorowego (upload), ręczna kontrola początkowej wielkości; wektor jako maska dla obrazu lub video (upload); w miarę scrollowania maska rośnie odsłaniając media; kontrola start/end size maski; kontrola długości komponentu (scroll length).

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

import {
	motion,
	useReducedMotion,
	useScroll,
	useTransform,
	useMotionTemplate,
	type MotionValue,
} from "framer-motion"

type MediaFit = "cover" | "contain"
type MediaType = "auto" | "image" | "video"

type Props = {
	vectorMaskFile?: string
	mediaFile?: string
	backgroundFile?: string

	mediaType: MediaType
	backgroundType: MediaType
	fit: MediaFit

	startSize: number
	endSize: number
	endHorizontalOffset: number
	ease: "linear" | "easeInOut" | "easeOut" | "easeIn"
	scrollLength: number
	sticky: boolean
	maxSizeAt: number

	backgroundColor: string

	overlayColor: string
	overlayOpacity: number
	overlayFadeAt: number

	debug: boolean
	style?: React.CSSProperties
}

function clamp01(n: number) {
	return Math.min(1, Math.max(0, n))
}

function extFromUrl(url: string) {
	const clean = url.split("#")[0].split("?")[0]
	const idx = clean.lastIndexOf(".")
	if (idx === -1) return ""
	return clean.slice(idx + 1).toLowerCase()
}

function isLikelyVideo(url: string) {
	const ext = extFromUrl(url)
	return ["mp4", "webm", "mov", "m4v", "ogv"].includes(ext)
}

function isLikelyImage(url: string) {
	const ext = extFromUrl(url)
	return ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(ext)
}

function mapEase(ease: Props["ease"]) {
	switch (ease) {
		case "easeInOut":
			return [0.4, 0, 0.2, 1] as const
		case "easeOut":
			return [0, 0, 0.2, 1] as const
		case "easeIn":
			return [0.4, 0, 1, 1] as const
		case "linear":
		default:
			return [0, 0, 1, 1] as const
	}
}

// Hook do easing scroll progress - zawsze wywoływany
function useEasedScrollProgress(scrollYProgress: MotionValue<number>, ease: Props["ease"], isStatic: boolean) {
	const easedInput = useTransform(scrollYProgress, (t) => {
		if (isStatic) return t
		const p = clamp01(t)
		if (ease === "linear") return p
		// smoothstep
		const s = p * p * (3 - 2 * p)
		if (ease === "easeIn") return p * s
		if (ease === "easeOut") return 1 - (1 - p) * (1 - s)
		// easeInOut
		return s
	})
	return easedInput
}

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 700
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollMaskReveal(props: Props) {
	const {
		vectorMaskFile = `data:image/svg+xml,${encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
				<rect width="800" height="800" fill="black"/>
				<circle cx="400" cy="400" r="240" fill="white"/>
			</svg>`,
		)}`,
		mediaFile = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
		backgroundFile = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",

		mediaType,
		backgroundType,
		fit,

		startSize,
		endSize,
		endHorizontalOffset,
		ease,
		scrollLength,
		sticky,
		maxSizeAt,

		backgroundColor,

		overlayColor,
		overlayOpacity,
		overlayFadeAt,

		debug,
		style,
	} = props

	const isStatic = useIsStaticRenderer()
	const reducedMotion = useReducedMotion()
	const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail

	const scrollContainerRef = React.useRef<HTMLDivElement>(null)
	const viewportContainerRef = React.useRef<HTMLDivElement>(null)
	const foregroundVideoRef = React.useRef<HTMLVideoElement>(null)
	const backgroundVideoRef = React.useRef<HTMLVideoElement>(null)

	const { scrollYProgress } = useScroll({
		target: scrollContainerRef,
		offset: ["start start", "end start"],
	})

	// Zawsze wywołuj hooki, nie warunkowo
	const easedProgress = useEasedScrollProgress(scrollYProgress, ease, isStatic)

	// Transform size based on maxSizeAt - reaches endSize at maxSizeAt% of scroll
	const maxSizeProgress = Math.max(0, Math.min(1, maxSizeAt / 100))
	const sizeMV = useTransform(
		easedProgress,
		[0, maxSizeProgress, 1],
		[startSize, endSize, endSize],
		{ clamp: true }
	)

	// Animate horizontal offset from 0 to endHorizontalOffset during scroll
	const horizontalOffsetMV = useTransform(easedProgress, [0, 1], [0, endHorizontalOffset], { clamp: true })

	// Animate overlay opacity from initial value to 0 during initial scroll phase
	// (Keep it at 0 afterwards and avoid invalid ranges when overlayFadeAt is 0)
	const overlayFadeProgress = Math.max(0, Math.min(1, overlayFadeAt / 100))
	const overlayOpacityInput: number[] = overlayFadeProgress <= 0 ? [0, 1] : overlayFadeProgress >= 1 ? [0, 1] : [0, overlayFadeProgress, 1]
	const overlayOpacityOutput: number[] =
		overlayFadeProgress <= 0 ? [0, 0] : overlayFadeProgress >= 1 ? [overlayOpacity, 0] : [overlayOpacity, 0, 0]
	const vectorOverlayOpacity = useTransform<number, number>(easedProgress, overlayOpacityInput, overlayOpacityOutput, {
		clamp: true,
	})

	// Use single value for mask-size to preserve aspect ratio
	const maskSize = useMotionTemplate`${sizeMV}%`
	
	// Use motion template for mask position with horizontal offset
	// Format: "calc(50% + offset) 50%" for center with offset
	const maskPosition = useMotionTemplate`calc(50% + ${horizontalOffsetMV}%) 50%`

	const resolvedMediaKind = React.useMemo<"video" | "image">(() => {
		if (mediaType === "video") return "video"
		if (mediaType === "image") return "image"
		if (isLikelyVideo(mediaFile) && !isLikelyImage(mediaFile)) return "video"
		return "image"
	}, [mediaType, mediaFile])

	const resolvedBackgroundKind = React.useMemo<"video" | "image">(() => {
		if (backgroundType === "video") return "video"
		if (backgroundType === "image") return "image"
		if (isLikelyVideo(backgroundFile) && !isLikelyImage(backgroundFile)) return "video"
		return "image"
	}, [backgroundType, backgroundFile])

	const showStatic = isStatic || reducedMotion || isThumbnail
	const disableMotion = isStatic || reducedMotion || isThumbnail

	const mediaStyle: React.CSSProperties = React.useMemo(
		() => ({
			position: "absolute",
			inset: 0,
			width: "100%",
			height: "100%",
			objectFit: fit,
			display: "block",
			transform: "translateZ(0)",
			backfaceVisibility: "hidden",
			willChange: "transform",
		}),
		[fit],
	)

	const backgroundStyle: React.CSSProperties = React.useMemo(
		() => ({
			position: "absolute",
			inset: 0,
			width: "100%",
			height: "100%",
			objectFit: fit,
			display: "block",
			transform: "translateZ(0)",
			backfaceVisibility: "hidden",
			willChange: "transform, opacity",
		}),
		[fit],
	)

	const outerHeight = React.useMemo(() => {
		const h = Math.max(1, Math.round(scrollLength))
		return `${h}px`
	}, [scrollLength])

	// Check if backgroundFile is the default placeholder
	const hasCustomBackground = backgroundFile !== "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"

	// Check if mediaFile is the default placeholder
	const hasCustomMedia = mediaFile !== "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"

	// Restart videos when component enters viewport
	React.useEffect(() => {
		if (typeof window === "undefined" || disableMotion) return

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						// Restart foreground video
						if (foregroundVideoRef.current && resolvedMediaKind === "video") {
							foregroundVideoRef.current.currentTime = 0
							foregroundVideoRef.current.play().catch(() => {})
						}
						// Restart background video
						if (backgroundVideoRef.current && resolvedBackgroundKind === "video" && hasCustomBackground) {
							backgroundVideoRef.current.currentTime = 0
							backgroundVideoRef.current.play().catch(() => {})
						}
					}
				})
			},
			{ threshold: 0.1 }
		)

		if (viewportContainerRef.current) {
			observer.observe(viewportContainerRef.current)
		}

		return () => observer.disconnect()
	}, [disableMotion, resolvedMediaKind, resolvedBackgroundKind, hasCustomBackground])

	// If mask file is not supported by browser as mask, user will see full media.
	// Keep it simple: no runtime file validation (CORS, MIME) beyond graceful fallback.
	return (
		<div
			ref={scrollContainerRef}
			style={{
				...(style || {}),
				position: "relative",
				width: "100%",
				height: outerHeight,
				background: backgroundColor,
				overflow: "visible",
			}}
			aria-label="Scroll mask reveal section"
		>
			{/* Viewport-sized sticky container */}
			<div
				ref={viewportContainerRef}
				style={{
					position: sticky ? "sticky" : "relative",
					top: 0,
					width: "100%",
					height: "100vh",
					overflow: "hidden",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: backgroundColor,
				}}
			>
				{/* Background media (image or video) */}
				{hasCustomBackground ? (
					<div
						aria-hidden="true"
						style={{
							position: "absolute",
							inset: 0,
							transform: "translateZ(0)",
							backfaceVisibility: "hidden",
							willChange: "opacity",
						}}
					>
						{resolvedBackgroundKind === "video" ? (
							<video
								ref={backgroundVideoRef}
								src={backgroundFile}
								style={backgroundStyle}
								muted
								playsInline
								loop
								autoPlay
								controls={false}
								preload="metadata"
								aria-label="Background video"
							/>
						) : (
							<img src={backgroundFile} alt="" style={backgroundStyle} />
						)}
					</div>
				) : (
					<div
						aria-hidden="true"
						style={{
							position: "absolute",
							inset: 0,
							background: backgroundColor,
							transform: "translateZ(0)",
							backfaceVisibility: "hidden",
							willChange: "opacity",
						}}
					/>
				)}

				{showStatic ? (
					<div
						style={{
							position: "relative",
							width: "100%",
							height: "100%",
							background: "transparent",
							zIndex: 1,
							maskImage: `url("${vectorMaskFile}")`,
							maskRepeat: "no-repeat",
							maskPosition: "center",
							maskSize: `${startSize}%`,

							WebkitMaskImage: `url("${vectorMaskFile}")`,
							WebkitMaskRepeat: "no-repeat",
							WebkitMaskPosition: "center",
							WebkitMaskSize: `${startSize}%`,
							transform: "translateZ(0)",
							backfaceVisibility: "hidden",
							contain: "paint",
							willChange: "mask-size, mask-position, -webkit-mask-size, -webkit-mask-position",
						}}
					>
						{hasCustomMedia ? (
							resolvedMediaKind === "video" ? (
								<video
									ref={foregroundVideoRef}
									src={mediaFile}
									style={mediaStyle}
									muted
									playsInline
									loop
									autoPlay={false}
									controls={false}
									preload="metadata"
									aria-label="Masked video"
								/>
							) : (
								<img src={mediaFile} alt="" style={mediaStyle} />
							)
						) : (
							<div
								style={{
									position: "absolute",
									inset: 0,
									background: overlayColor,
								}}
							/>
						)}

						{overlayOpacity > 0 && hasCustomMedia ? (
							<div
								aria-hidden="true"
								style={{
									position: "absolute",
									inset: 0,
									background: overlayColor,
									opacity: clamp01(overlayOpacity),
									pointerEvents: "none",
								}}
							/>
						) : null}
					</div>
				) : (
					<>
						<motion.div
							style={{
								position: "relative",
								width: "100%",
								height: "100%",
								background: "transparent",
								zIndex: 1,
								maskImage: `url("${vectorMaskFile}")`,
								maskRepeat: "no-repeat",
								maskPosition,
								maskSize,

								WebkitMaskImage: `url("${vectorMaskFile}")`,
								WebkitMaskRepeat: "no-repeat",
								WebkitMaskPosition: maskPosition,
								WebkitMaskSize: maskSize,
								transform: "translateZ(0)",
								backfaceVisibility: "hidden",
								contain: "paint",
								willChange: "mask-size, mask-position, -webkit-mask-size, -webkit-mask-position, opacity",
							}}
						>
							{hasCustomMedia ? (
								resolvedMediaKind === "video" ? (
									<video
										ref={foregroundVideoRef}
										src={mediaFile}
										style={mediaStyle}
										muted
										playsInline
										loop
										autoPlay
										controls={false}
										preload="metadata"
										aria-label="Masked video"
									/>
								) : (
									<img src={mediaFile} alt="" style={mediaStyle} />
								)
							) : (
								<div
									style={{
										position: "absolute",
										inset: 0,
										background: overlayColor,
									}}
								/>
							)}
						</motion.div>
						{/* Vector overlay that fades out during scroll */}
						{hasCustomMedia && (
							<motion.div
								aria-hidden="true"
								style={{
									position: "absolute",
									inset: 0,
									background: overlayColor,
									opacity: vectorOverlayOpacity,
									pointerEvents: "none",
									zIndex: 2,
									maskImage: `url("${vectorMaskFile}")`,
									maskRepeat: "no-repeat",
									maskPosition,
									maskSize,

									WebkitMaskImage: `url("${vectorMaskFile}")`,
									WebkitMaskRepeat: "no-repeat",
									WebkitMaskPosition: maskPosition,
									WebkitMaskSize: maskSize,
									transform: "translateZ(0)",
									backfaceVisibility: "hidden",
									contain: "paint",
									willChange: "mask-size, mask-position, -webkit-mask-size, -webkit-mask-position, opacity",
								}}
							/>
						)}
					</>
				)}

				{debug ? (
					<div
						style={{
							position: "absolute",
							left: 12,
							bottom: 12,
							padding: "8px 10px",
							borderRadius: 10,
							background: "rgba(0,0,0,0.55)",
							color: "#fff",
							fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
							fontSize: 12,
							lineHeight: 1.2,
							pointerEvents: "none",
							maxWidth: "min(520px, calc(100% - 24px))",
							whiteSpace: "pre-wrap",
						}}
						aria-hidden="true"
					>
						{`mask: ${startSize}% → ${endSize}%\nmedia: ${resolvedMediaKind}\nstatic: ${String(showStatic)}`}
					</div>
				) : null}
			</div>
		</div>
	)
}

addPropertyControls(ScrollMaskReveal, {
	vectorMaskFile: {
		type: ControlType.File,
		title: "Assets: Vector Mask",
		allowedFileTypes: ["svg", "png", "webp", "jpg", "jpeg"],
	},
	mediaFile: {
		type: ControlType.File,
		title: "Assets: Foreground Media",
		allowedFileTypes: ["mp4", "webm", "mov", "jpg", "jpeg", "png", "gif", "webp", "avif"],
	},
	backgroundFile: {
		type: ControlType.File,
		title: "Assets: Background Image / Video",
		allowedFileTypes: ["mp4", "webm", "mov", "jpg", "jpeg", "png", "gif", "webp", "avif"],
	},

	mediaType: {
		type: ControlType.Enum,
		title: "Foreground: Media Type",
		options: ["auto", "image", "video"],
		optionTitles: ["Auto", "Image", "Video"],
		defaultValue: "auto",
		displaySegmentedControl: true,
	},

	backgroundType: {
		type: ControlType.Enum,
		title: "Background: Media Type",
		options: ["auto", "image", "video"],
		optionTitles: ["Auto", "Image", "Video"],
		defaultValue: "auto",
		displaySegmentedControl: true,
	},

	fit: {
		type: ControlType.Enum,
		title: "Media: Fit",
		options: ["cover", "contain"],
		optionTitles: ["Cover", "Contain"],
		defaultValue: "cover",
		displaySegmentedControl: true,
	},

	startSize: {
		type: ControlType.Number,
		title: "Mask Animation: Start Size",
		defaultValue: 35,
		min: 0,
		max: 400,
		step: 1,
		unit: "%",
	},
	endSize: {
		type: ControlType.Number,
		title: "Mask Animation: End Size",
		defaultValue: 220,
		min: 1,
		max: 1600,
		step: 1,
		unit: "%",
	},
	maxSizeAt: {
		type: ControlType.Number,
		title: "Mask Animation: Reach End Size At",
		defaultValue: 100,
		min: 1,
		max: 100,
		step: 1,
		unit: "%",
	},
	endHorizontalOffset: {
		type: ControlType.Number,
		title: "Mask Position: End X Offset",
		defaultValue: 0,
		min: -50,
		max: 50,
		step: 1,
		unit: "%",
	},

	ease: {
		type: ControlType.Enum,
		title: "Timing: Ease",
		options: ["linear", "easeInOut", "easeOut", "easeIn"],
		optionTitles: ["Linear", "Ease In Out", "Ease Out", "Ease In"],
		defaultValue: "easeInOut",
	},

	scrollLength: {
		type: ControlType.Number,
		title: "Timing: Scroll Length",
		defaultValue: 1600,
		min: 200,
		max: 8000,
		step: 10,
		unit: "px",
	},

	sticky: {
		type: ControlType.Boolean,
		title: "Layout: Sticky",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},

	backgroundColor: {
		type: ControlType.Color,
		title: "Appearance: Fallback Background",
		defaultValue: "#FFFFFF",
	},

	overlayColor: {
		type: ControlType.Color,
		title: "Vector Overlay: Color",
		defaultValue: "#000000",
	},
	overlayOpacity: {
		type: ControlType.Number,
		title: "Vector Overlay: Start Opacity",
		defaultValue: 0,
		min: 0,
		max: 1,
		step: 0.01,
	},
	overlayFadeAt: {
		type: ControlType.Number,
		title: "Vector Overlay: Fade Out By",
		defaultValue: 30,
		min: 0,
		max: 100,
		step: 1,
		unit: "%",
	},

	debug: {
		type: ControlType.Boolean,
		title: "Debug: Show HUD",
		defaultValue: false,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
})