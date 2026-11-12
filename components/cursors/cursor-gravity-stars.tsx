// Custom cursor component that spawns falling star particles based on cursor movement speed
// Stars fall with gravity-like animation and fade out smoothly
// Disabled on mobile devices for performance

import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface StarfallCursorProps {
	density: number
	gravity: number
	starSize: number
	duration: number
	starColor: string
	glowIntensity: number
	showCursor: boolean
	cursorStyle: "default" | "pointer" | "text" | "move" | "wait" | "help" | "not-allowed" | "grab" | "grabbing" | "zoom-in" | "zoom-out" | "cell" | "context-menu" | "copy" | "alias" | "progress" | "no-drop" | "vertical-text" | "all-scroll" | "col-resize" | "row-resize" | "n-resize" | "e-resize" | "s-resize" | "w-resize" | "ne-resize" | "nw-resize" | "se-resize" | "sw-resize" | "ew-resize" | "ns-resize" | "nesw-resize" | "nwse-resize" | "crosshair" | "none"
	style?: CSSProperties
}

interface Star {
	id: number
	x: number
	y: number
	size: number
	velocityX: number
	velocityY: number
	rotation: number
	isTapStar?: boolean
}

/**
 * Starfall Cursor
 *
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function StarfallCursor(props: StarfallCursorProps) {
	const {
		density = 1,
		gravity = 1,
		starSize = 9,
		duration = 0.9,
		starColor = "#ffffff",
		glowIntensity = 0,
		showCursor = true,
		cursorStyle = "default",
		style,
	} = props

	const [stars, setStars] = useState<Star[]>([])
	const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
	const lastPositionRef = useRef({ x: 0, y: 0 })
	const lastTimeRef = useRef(0)
	const starIdRef = useRef(0)
	const isStatic = useIsStaticRenderer()
	const isMobileRef = useRef(false)

	useEffect(() => {
		if (typeof window === "undefined") return

		// Detect mobile devices
		isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		)

		if (isMobileRef.current || isStatic) return

		// Set cursor style
		document.body.style.cursor = showCursor ? cursorStyle : "none"

		const handleMouseMove = (e: MouseEvent) => {
			const currentTime = Date.now()
			const currentX = e.clientX
			const currentY = e.clientY

			// Update cursor position
			startTransition(() => {
				setCursorPosition({ x: currentX, y: currentY })
			})

			// Calculate movement speed
			const deltaX = currentX - lastPositionRef.current.x
			const deltaY = currentY - lastPositionRef.current.y
			const deltaTime = currentTime - lastTimeRef.current

			if (deltaTime === 0) return

			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
			const speed = distance / deltaTime

			// Speed thresholds for star spawning
			const lowThreshold = 0.3
			const mediumThreshold = 0.8
			const highThreshold = 1.5

			let starCount = 0

			if (speed < lowThreshold) {
				starCount = 0
			} else if (speed < mediumThreshold) {
				starCount = Math.floor(1 * density)
			} else if (speed < highThreshold) {
				starCount = Math.floor((2 + Math.random()) * density)
			} else {
				starCount = Math.floor((4 + Math.random() * 2) * density)
			}

			if (starCount > 0) {
				const newStars: Star[] = []

				for (let i = 0; i < starCount; i++) {
					// Size variants: 2px, 3px, 4px
					const sizeOptions = [0.67, 1, 1.33]
					const sizeVariant = sizeOptions[Math.floor(Math.random() * sizeOptions.length)]
					const size = starSize * sizeVariant

					// Spawn slightly below cursor with horizontal randomness
					const offsetX = (Math.random() - 0.5) * 12
					const offsetY = 4 + Math.random() * 8

					newStars.push({
						id: starIdRef.current++,
						x: currentX + offsetX,
						y: currentY + offsetY,
						size,
						velocityX: (Math.random() - 0.5) * 6,
						velocityY: 0,
						rotation: (Math.random() - 0.5) * 20,
						isTapStar: false,
					})
				}

				startTransition(() => {
					setStars((prev) => [...prev, ...newStars])
				})
			}

			lastPositionRef.current = { x: currentX, y: currentY }
			lastTimeRef.current = currentTime
		}

		const handleClick = (e: MouseEvent) => {
			const clickX = e.clientX
			const clickY = e.clientY

			// Spawn burst of stars on tap
			const tapStarCount = Math.floor(8 * density)
			const newStars: Star[] = []

			for (let i = 0; i < tapStarCount; i++) {
				const angle = (Math.PI * 2 * i) / tapStarCount
				const sizeOptions = [0.67, 1, 1.33]
				const sizeVariant = sizeOptions[Math.floor(Math.random() * sizeOptions.length)]
				const size = starSize * sizeVariant

				newStars.push({
					id: starIdRef.current++,
					x: clickX,
					y: clickY,
					size,
					velocityX: Math.cos(angle) * 60,
					velocityY: Math.sin(angle) * 60,
					rotation: (Math.random() - 0.5) * 40,
					isTapStar: true,
				})
			}

			startTransition(() => {
				setStars((prev) => [...prev, ...newStars])
			})
		}

		window.addEventListener("mousemove", handleMouseMove)
		window.addEventListener("click", handleClick)

		return () => {
			window.removeEventListener("mousemove", handleMouseMove)
			window.removeEventListener("click", handleClick)
			document.body.style.cursor = "auto"
		}
	}, [density, starSize, isStatic, showCursor, cursorStyle])

	// Remove stars after animation completes
	useEffect(() => {
		if (stars.length === 0) return

		const timeout = setTimeout(() => {
			startTransition(() => {
				setStars((prev) => prev.slice(Math.min(20, prev.length)))
			})
		}, duration * 1000 + 100)

		return () => clearTimeout(timeout)
	}, [stars, duration])

	if (isMobileRef.current || isStatic) {
		return (
			<div
				style={{
					...style,
					position: "relative",
					width: style?.width || "100%",
					height: style?.height || "100%",
					minWidth: 5,
					minHeight: 5,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "transparent",
				}}
			>
				<div
					style={{
						fontSize: 12,
						color: "#999",
						textAlign: "center",
						userSelect: "none",
					}}
				>
					✦
				</div>
			</div>
		)
	}

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				pointerEvents: "none",
				zIndex: 9999,
				overflow: "hidden",
			}}
		>
			{/* Star Particles */}
			{stars.map((star) => {
				const fallDistance = 40 + Math.random() * 40

				return (
					<motion.div
						key={star.id}
						style={{
							position: "absolute",
							left: star.x,
							top: star.y,
							width: star.size,
							height: star.size,
							color: starColor,
							fontSize: star.size,
							lineHeight: 1,
							textShadow: `0 0 ${glowIntensity}px ${starColor}`,
							filter: `blur(${glowIntensity * 0.1}px)`,
						}}
						initial={{
							opacity: star.isTapStar ? 1 : 0.8,
							scale: star.isTapStar ? 0.5 : 1,
							rotate: star.rotation,
							x: 0,
							y: 0,
						}}
						animate={{
							opacity: 0,
							scale: star.isTapStar ? 1.5 : 0.3,
							rotate: star.rotation + (Math.random() - 0.5) * 20,
							x: star.isTapStar ? star.velocityX : star.velocityX,
							y: star.isTapStar ? star.velocityY : fallDistance * gravity,
						}}
						transition={{
							duration: star.isTapStar ? duration * 0.8 : duration,
							ease: star.isTapStar ? [0.25, 0.46, 0.45, 0.94] : [0.4, 0, 1, 1],
						}}
					>
						✦
					</motion.div>
				)
			})}
		</div>
	)
}

addPropertyControls(StarfallCursor, {
	density: {
		type: ControlType.Number,
		title: "Density",
		defaultValue: 1,
		min: 0.1,
		max: 3,
		step: 0.1,
	},
	gravity: {
		type: ControlType.Number,
		title: "Gravity",
		defaultValue: 1,
		min: 0.5,
		max: 2,
		step: 0.1,
	},
	starSize: {
		type: ControlType.Number,
		title: "Star Size",
		defaultValue: 9,
		min: 2,
		max: 50,
		step: 1,
		unit: "px",
	},
	duration: {
		type: ControlType.Number,
		title: "Duration",
		defaultValue: 0.9,
		min: 0.6,
		max: 2,
		step: 0.1,
		unit: "s",
	},
	starColor: {
		type: ControlType.Color,
		title: "Star Color",
		defaultValue: "#ffffff",
	},
	glowIntensity: {
		type: ControlType.Number,
		title: "Glow Intensity",
		defaultValue: 0,
		min: 0,
		max: 10,
		step: 0.5,
	},
	showCursor: {
		type: ControlType.Boolean,
		title: "Show Cursor",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	cursorStyle: {
		type: ControlType.Enum,
		title: "Cursor Style",
		options: ["default", "pointer", "text", "move", "wait", "help", "not-allowed", "grab", "grabbing", "zoom-in", "zoom-out", "cell", "context-menu", "copy", "alias", "progress", "no-drop", "vertical-text", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "crosshair", "none"],
		optionTitles: ["Default", "Pointer", "Text", "Move", "Wait", "Help", "Not Allowed", "Grab", "Grabbing", "Zoom In", "Zoom Out", "Cell", "Context Menu", "Copy", "Alias", "Progress", "No Drop", "Vertical Text", "All Scroll", "Col Resize", "Row Resize", "N Resize", "E Resize", "S Resize", "W Resize", "NE Resize", "NW Resize", "SE Resize", "SW Resize", "EW Resize", "NS Resize", "NESW Resize", "NWSE Resize", "Crosshair", "None"],
		defaultValue: "default",
		displaySegmentedControl: false,
		hidden: ({ showCursor }) => !showCursor,
	},
})