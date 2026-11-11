import { useCallback, useEffect, useRef, useState, type CSSProperties, type ElementType, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, type KeyboardEvent as ReactKeyboardEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, useScroll, useMotionValueEvent } from "framer-motion"

interface HelixSlide {
	image?: { src: string; srcSet?: string; alt?: string }
	title?: string
	link?: string
	openInNewTab?: boolean
}

const FALLBACK_IMAGES: { src: string; srcSet?: string; alt?: string }[] = [
	{ src: "https://images.unsplash.com/photo-1558273246-57d22047406d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "multicolored lighted neon signs" },
	{ src: "https://images.unsplash.com/photo-1615828055135-18004ed15196?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "cars on road during night time" },
	{ src: "https://images.unsplash.com/photo-1518656291-ba160b5554e9?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "green, purple, and blue neon lights" },
	{ src: "https://images.unsplash.com/photo-1606614751257-4450f1270130?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "a red neon sign on the side of a building" },
	{ src: "https://images.unsplash.com/photo-1769120062361-0a6469f5d7b3?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "pink neon grid forms a diamond shape on dark background" },
	{ src: "https://images.unsplash.com/photo-1579353174740-9e4e39428d6f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "black flat screen tv turned on displaying static" },
]

interface HelixSpiralProps {
	items: HelixSlide[]
	arcSpan: number
	radius: number
	verticalGap: number
	perspective: number
	itemWidth: number
	itemHeight: number
	cornerRadius: string
	focusScale: number
	depthFalloff: number
	depthBlur: number
	autoRotate: boolean
	autoRotateSpeed: number
	reverseDirection: boolean
	dragEnabled: boolean
	scrollEnabled: boolean
	scrollMode: "wheel" | "page"
	scrollSpan: number
	showTitles: boolean
	edgeFade: number
	backgroundColor: string
	accentColor: string
	titleFont: CSSProperties
	style?: CSSProperties
}

const mod = (value: number, n: number) => ((value % n) + n) % n

function wrappedOffset(index: number, progress: number, count: number) {
	const raw = index - progress
	const half = count / 2
	return mod(raw + half, count) - half
}

/**
 * Helix Spiral
 *
 * A 3D motion gallery: displays media along a helical spiral path with scroll, drag/swipe, and idle auto-rotation. The frontmost item is scaled up and kept in focus while neighbors recede in depth, blur, and opacity.
 *
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function HelixSpiral(props: HelixSpiralProps) {
	const {
		items = [],
		arcSpan = 360,
		radius = 240,
		verticalGap = 42,
		perspective = 1400,
		itemWidth = 190,
		itemHeight = 250,
		cornerRadius = "18px",
		focusScale = 1.2,
		depthFalloff = 3,
		depthBlur = 6,
		autoRotate = true,
		autoRotateSpeed = 0.18,
		reverseDirection = false,
		dragEnabled = true,
		scrollEnabled = true,
		scrollMode = "wheel",
		scrollSpan = 1,
		showTitles = true,
		edgeFade = 22,
		backgroundColor = "#0A0A10",
		accentColor = "#8C6BFF",
		titleFont,
		style,
	} = props

	const isStatic = useIsStaticRenderer()
	const containerRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(containerRef, { amount: 0.2 })
	const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] })

	const count = Math.max(items.length, 1)
	const [displayProgress, setDisplayProgress] = useState(0)

	const targetProgressRef = useRef(0)
	const velocityRef = useRef(0)
	const draggingRef = useRef(false)
	const pointerRef = useRef({ x: 0, t: 0 })
	const lastInteractionRef = useRef(0)
	const lastTimeRef = useRef(0)
	const smoothedRef = useRef(0)
	const rafRef = useRef<number | null>(null)

	useMotionValueEvent(scrollYProgress, "change", (value) => {
		if (scrollMode !== "page") return
		targetProgressRef.current = value * scrollSpan * count
		lastInteractionRef.current = performance.now()
	})

	useEffect(() => {
		if (isStatic) return
		if (!isInView) return
		if (typeof window === "undefined") return

		lastTimeRef.current = performance.now()

		function tick(time: number) {
			const dt = Math.min(0.05, Math.max(0, (time - lastTimeRef.current) / 1000))
			lastTimeRef.current = time

			if (!draggingRef.current) {
				if (Math.abs(velocityRef.current) > 0.0008) {
					targetProgressRef.current += velocityRef.current * dt * 60
					velocityRef.current *= Math.pow(0.92, dt * 60)
				} else {
					velocityRef.current = 0
				}

				const idle = performance.now() - lastInteractionRef.current > 1000
				if (scrollMode === "wheel" && autoRotate && idle) {
					targetProgressRef.current += autoRotateSpeed * dt * (reverseDirection ? -1 : 1)
				}
			}

			smoothedRef.current += (targetProgressRef.current - smoothedRef.current) * Math.min(1, dt * 6)
			setDisplayProgress(smoothedRef.current)

			rafRef.current = requestAnimationFrame(tick)
		}

		rafRef.current = requestAnimationFrame(tick)
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
		}
	}, [isStatic, isInView, autoRotate, autoRotateSpeed, reverseDirection, scrollMode])

	const focusIndex = useCallback(
		(index: number) => {
			const cur = targetProgressRef.current
			const wrapped = wrappedOffset(index, cur, count)
			targetProgressRef.current = cur + wrapped
			velocityRef.current = 0
			lastInteractionRef.current = performance.now()
		},
		[count],
	)

	const handlePointerDown = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			if (!dragEnabled) return
			e.currentTarget.setPointerCapture(e.pointerId)
			draggingRef.current = true
			velocityRef.current = 0
			pointerRef.current = { x: e.clientX, t: performance.now() }
			lastInteractionRef.current = performance.now()
		},
		[dragEnabled],
	)

	const handlePointerMove = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			if (!draggingRef.current) return
			const now = performance.now()
			const dx = e.clientX - pointerRef.current.x
			const dt = Math.max(1, now - pointerRef.current.t)
			const dragSensitivity = 0.012
			const delta = -dx * dragSensitivity
			targetProgressRef.current += delta
			velocityRef.current = (delta / dt) * 16
			pointerRef.current = { x: e.clientX, t: now }
			lastInteractionRef.current = now
		},
		[],
	)

	const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
		draggingRef.current = false
		lastInteractionRef.current = performance.now()
		try {
			e.currentTarget.releasePointerCapture(e.pointerId)
		} catch {
			// pointer capture may already be released
		}
	}, [])

	const handleWheel = useCallback(
		(e: ReactWheelEvent<HTMLDivElement>) => {
			if (scrollMode !== "wheel" || !scrollEnabled) return
			e.preventDefault()
			targetProgressRef.current += e.deltaY * 0.0025
			lastInteractionRef.current = performance.now()
		},
		[scrollEnabled, scrollMode],
	)

	const handleKeyDown = useCallback(
		(e: ReactKeyboardEvent<HTMLDivElement>) => {
			const nearest = Math.round(mod(targetProgressRef.current, count))
			if (e.key === "ArrowRight") {
				e.preventDefault()
				focusIndex(mod(nearest + 1, count))
			} else if (e.key === "ArrowLeft") {
				e.preventDefault()
				focusIndex(mod(nearest - 1, count))
			}
		},
		[count, focusIndex],
	)

	const angleStep = arcSpan / count
	const isFixedSize = style?.width === "100%" || style?.height === "100%"
	const fadePercent = Math.max(0, Math.min(45, edgeFade))
	const fadeMask =
		fadePercent > 0
			? `linear-gradient(to bottom, transparent 0%, black ${fadePercent}%, black ${100 - fadePercent}%, transparent 100%)`
			: undefined

	return (
		<div
			ref={containerRef}
			role="region"
			aria-label="3D spiral gallery"
			tabIndex={0}
			onKeyDown={handleKeyDown}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			onWheel={handleWheel}
			style={{
				position: "relative",
				width: isFixedSize ? "100%" : 700,
				height: isFixedSize ? "100%" : 560,
				...style,
				overflow: "hidden",
				background: backgroundColor,
				perspective,
				perspectiveOrigin: "50% 50%",
				touchAction: dragEnabled ? "none" : scrollMode === "wheel" && scrollEnabled ? "none" : "auto",
				cursor: dragEnabled ? (draggingRef.current ? "grabbing" : "grab") : "default",
				outline: "none",
				WebkitMaskImage: fadeMask,
				maskImage: fadeMask,
				WebkitMaskSize: "100% 100%",
				maskSize: "100% 100%",
				WebkitMaskRepeat: "no-repeat",
				maskRepeat: "no-repeat",
			}}
		>
			<div
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(circle at 50% 42%, ${accentColor}33, transparent 62%)`,
					mixBlendMode: "screen",
					pointerEvents: "none",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					width: 0,
					height: 0,
					transformStyle: "flat",
				}}
			>
				{items.map((item, index) => {
					const wrapped = wrappedOffset(index, displayProgress, count)
					const angle = wrapped * angleStep
					const angleRad = (angle * Math.PI) / 180
					const x = Math.sin(angleRad) * radius
					const z = Math.cos(angleRad) * radius - radius
					const y = wrapped * verticalGap
					const tilt = Math.max(-35, Math.min(35, -angle * 0.55))
					const distance = Math.abs(wrapped)
					const scale = Math.max(0.35, focusScale - (distance * (focusScale - 0.5)) / depthFalloff)
					const opacity = Math.max(0.08, 1 - (distance * 0.9) / depthFalloff)
					const zIndex = Math.round(1000 - distance * 10)
					const isFocused = distance < 0.5
					const image = item.image?.src ? item.image : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
					const blur = Math.min(depthBlur, (distance / depthFalloff) * depthBlur)
					const hasLink = isFocused && Boolean(item.link)
					const Tag: ElementType = hasLink ? "a" : "div"
					const interactionProps = hasLink
						? {
								href: item.link,
								target: item.openInNewTab ? "_blank" : undefined,
								rel: item.openInNewTab ? "noopener noreferrer" : undefined,
							}
						: { onClick: () => focusIndex(index) }

					return (
						<Tag
							key={index}
							{...interactionProps}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: itemWidth,
								height: itemHeight,
								zIndex,
								transform: `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
								opacity,
								filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
								borderRadius: cornerRadius,
								overflow: "hidden",
								background: "rgba(18,18,26,0.9)",
								boxShadow: isFocused ? `0 0 0 1.5px ${accentColor}` : "none",
								cursor: "pointer",
								display: "flex",
								flexDirection: "column",
								textDecoration: "none",
								willChange: "transform, opacity, filter",
							}}
						>
							<div
								style={{
									flex: showTitles ? "1 1 78%" : "1 1 100%",
									minHeight: 0,
									position: "relative",
									backgroundColor: "#26263a",
									overflow: "hidden",
								}}
							>
								<img
									src={image.src}
									srcSet={image.srcSet}
									alt={image.alt ?? item.title ?? `Slide ${index + 1}`}
									style={{
										position: "absolute",
										inset: 0,
										width: "100%",
										height: "100%",
										objectFit: "cover",
									}}
								/>
							</div>
							{showTitles && (
								<div
									style={{
										flex: "0 0 auto",
										padding: "10px 12px",
										textAlign: "center",
										color: "#FFFFFF",
										opacity: isFocused ? 1 : 0.6,
										...titleFont,
									}}
								>
									{item.title ?? ""}
								</div>
							)}
						</Tag>
					)
				})}
			</div>
		</div>
	)
}

addPropertyControls(HelixSpiral, {
	items: {
		type: ControlType.Array,
		title: "Slides",
		control: {
			type: ControlType.Object,
			controls: {
				image: { type: ControlType.ResponsiveImage, title: "Image" },
				title: { type: ControlType.String, title: "Title", defaultValue: "" },
				link: { type: ControlType.Link, title: "Link" },
				openInNewTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false },
			},
		},
		defaultValue: [
			{
				image: { src: "https://images.unsplash.com/photo-1558273246-57d22047406d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "multicolored lighted neon signs" },
				title: "Neon",
			},
			{
				image: { src: "https://images.unsplash.com/photo-1615828055135-18004ed15196?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "cars on road during night time" },
				title: "Nightdrive",
			},
			{
				image: { src: "https://images.unsplash.com/photo-1518656291-ba160b5554e9?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "green, purple, and blue neon lights" },
				title: "Prism",
			},
			{
				image: { src: "https://images.unsplash.com/photo-1606614751257-4450f1270130?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "a red neon sign on the side of a building" },
				title: "Scarlet",
			},
			{
				image: { src: "https://images.unsplash.com/photo-1769120062361-0a6469f5d7b3?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "pink neon grid forms a diamond shape on dark background" },
				title: "Synthwave",
			},
			{
				image: { src: "https://images.unsplash.com/photo-1579353174740-9e4e39428d6f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "black flat screen tv turned on displaying static" },
				title: "Static",
			},
		],
		maxCount: 16,
	},
	arcSpan: {
		type: ControlType.Number,
		title: "Arc Span",
		defaultValue: 360,
		min: 60,
		max: 360,
		step: 5,
		unit: "deg",
	},
	radius: {
		type: ControlType.Number,
		title: "Radius",
		defaultValue: 240,
		min: 100,
		max: 500,
		step: 5,
		unit: "px",
	},
	verticalGap: {
		type: ControlType.Number,
		title: "Path Spacing",
		defaultValue: 42,
		min: 0,
		max: 160,
		step: 2,
		unit: "px",
	},
	perspective: {
		type: ControlType.Number,
		title: "Perspective",
		defaultValue: 1400,
		min: 500,
		max: 3000,
		step: 50,
		unit: "px",
	},
	itemWidth: {
		type: ControlType.Number,
		title: "Card Width",
		defaultValue: 190,
		min: 80,
		max: 400,
		step: 5,
		unit: "px",
	},
	itemHeight: {
		type: ControlType.Number,
		title: "Card Height",
		defaultValue: 250,
		min: 100,
		max: 500,
		step: 5,
		unit: "px",
	},
	cornerRadius: {
		type: ControlType.BorderRadius,
		title: "Corner Radius",
		defaultValue: "18px",
	},
	focusScale: {
		type: ControlType.Number,
		title: "Focus Scale",
		defaultValue: 1.2,
		min: 0.9,
		max: 2,
		step: 0.05,
	},
	depthFalloff: {
		type: ControlType.Number,
		title: "Focus Falloff",
		defaultValue: 3,
		min: 1,
		max: 8,
		step: 0.5,
	},
	depthBlur: {
		type: ControlType.Number,
		title: "Depth Blur",
		defaultValue: 6,
		min: 0,
		max: 20,
		step: 1,
		unit: "px",
	},
	scrollMode: {
		type: ControlType.Enum,
		title: "Scroll Behavior",
		defaultValue: "wheel",
		options: ["wheel", "page"],
		optionTitles: ["Wheel Over Widget", "Page Scroll"],
	},
	scrollSpan: {
		type: ControlType.Number,
		title: "Scroll Loops",
		defaultValue: 1,
		min: 0.2,
		max: 5,
		step: 0.1,
		hidden: (fields) => fields.scrollMode !== "page",
	},
	autoRotate: {
		type: ControlType.Boolean,
		title: "Auto Rotation",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
		hidden: (fields) => fields.scrollMode === "page",
	},
	autoRotateSpeed: {
		type: ControlType.Number,
		title: "Rotation Speed",
		defaultValue: 0.18,
		min: 0,
		max: 1.2,
		step: 0.01,
		hidden: (fields) => !fields.autoRotate || fields.scrollMode === "page",
	},
	reverseDirection: {
		type: ControlType.Boolean,
		title: "Reverse",
		defaultValue: false,
		hidden: (fields) => !fields.autoRotate || fields.scrollMode === "page",
	},
	dragEnabled: {
		type: ControlType.Boolean,
		title: "Drag & Swipe",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	scrollEnabled: {
		type: ControlType.Boolean,
		title: "Scroll Control",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
		hidden: (fields) => fields.scrollMode === "page",
	},
	showTitles: {
		type: ControlType.Boolean,
		title: "Show Titles",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	edgeFade: {
		type: ControlType.Number,
		title: "Edge Fade",
		defaultValue: 22,
		min: 0,
		max: 45,
		step: 1,
		unit: "%",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#0A0A10",
	},
	accentColor: {
		type: ControlType.Color,
		title: "Accent",
		defaultValue: "#8C6BFF",
	},
	titleFont: {
		type: ControlType.Font,
		title: "Title Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1.3em",
			textAlign: "center",
		},
	},
})
