// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useRef, useState, startTransition, type CSSProperties } from "react"

interface Image {
	src: string
	alt: string
}

interface ImageSliderScrollProps {
	beforeImage: Image
	afterImage: Image
	dividerColor: string
	dividerWidth: number
	showHandle: boolean
	handleSize: number
	handleIcon?: Image
	showLabels: boolean
	beforeLabel: string
	afterLabel: string
	labelFont: any
	labelFillColor: string
	labelBorderColor: string
	labelTextColor: string
	labelBoxShadow: string
	boxShadow?: string
	borderRadius?: number
	scrollDirection?: "right-to-left" | "left-to-right"
	autoScroll?: boolean
	style?: CSSProperties
}

/**
 * Image Slider Scroll
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageSlider(props: ImageSliderScrollProps) {
	const {
		beforeImage = {
			src: "https://framerusercontent.com/images/iKUBd3PbCQPJ9dE1W5NKLJYsb70.png",
			alt: "Before image",
		},
		afterImage = {
			src: "https://framerusercontent.com/images/HPsmanwSUnOK4BNV8RVUhAuOs.png",
			alt: "After image",
		},
		dividerColor = "#000000",
		dividerWidth = 2,
		showHandle = true,
		handleSize = 40,
		handleIcon = {
			src: "https://framerusercontent.com/images/MWNIPdaMbJ48EdgsVUCfSq3A9Q.png",
			alt: "Handle icon",
		},
		showLabels = true,
		beforeLabel = "Before",
		afterLabel = "After",
		labelFont,
		labelFillColor = "rgba(255, 255, 255, 0.8)",
		labelBorderColor = "transparent",
		labelTextColor = "#000000",
		labelBoxShadow = "none",
		boxShadow = "1px 0px 18px rgba(0, 0, 0, 0.14)",
		borderRadius = 20,
		scrollDirection = "right-to-left",
		autoScroll = true,
	} = props

	const containerRef = useRef<HTMLDivElement>(null)
	const [position, setPosition] = useState(50)
	const [isDragging, setIsDragging] = useState(false)
	const isStatic = useIsStaticRenderer()

	useEffect(() => {
		if (isStatic || !containerRef.current || !autoScroll) return

		const handleScroll = () => {
			if (!containerRef.current || isDragging) return

			const rect = containerRef.current.getBoundingClientRect()
			const viewportHeight = window.innerHeight
			
			const componentCenter = rect.top + rect.height / 2
			const scrollProgress = (componentCenter / viewportHeight)
			
			let newPosition
			if (scrollDirection === "left-to-right") {
				newPosition = Math.max(0, Math.min(100, 100 - (scrollProgress * 100) + 20))
			} else {
				newPosition = Math.max(0, Math.min(100, (scrollProgress * 100) - 20))
			}
			
			startTransition(() => setPosition(newPosition))
		}

		handleScroll()

		window.addEventListener("scroll", handleScroll, { passive: true })
		return () => window.removeEventListener("scroll", handleScroll)
	}, [isStatic, isDragging, scrollDirection, autoScroll])

	const updatePositionFromEvent = useCallback((e) => {
		if (!containerRef.current) return

		const rect = containerRef.current.getBoundingClientRect()
		const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX
		if (clientX === undefined) return
		
		const x = clientX - rect.left
		const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100))
		startTransition(() => setPosition(newPosition))
	}, [])

	const handleClick = useCallback(
		(e) => {
			if (!isDragging) {
				updatePositionFromEvent(e)
			}
		},
		[isDragging, updatePositionFromEvent]
	)

	const handleMouseDown = (e) => {
		e.preventDefault()
		startTransition(() => setIsDragging(true))
	}

	const handleTouchStart = (e) => {
		startTransition(() => setIsDragging(true))
	}

	const handleMouseMove = useCallback(
		(e) => {
			if (!isDragging || !containerRef.current) return
			updatePositionFromEvent(e)
		},
		[isDragging, updatePositionFromEvent]
	)

	const handleTouchMove = useCallback(
		(e) => {
			if (!isDragging || !containerRef.current) return
			e.preventDefault()
			updatePositionFromEvent(e)
		},
		[isDragging, updatePositionFromEvent]
	)

	const handleMouseUp = useCallback(() => {
		startTransition(() => setIsDragging(false))
	}, [])

	const handleTouchEnd = useCallback(() => {
		startTransition(() => setIsDragging(false))
	}, [])

	useEffect(() => {
		if (isStatic) return

		const handleGlobalMouseMove = (e) => handleMouseMove(e)
		const handleGlobalMouseUp = () => handleMouseUp()
		const handleGlobalTouchMove = (e) => handleTouchMove(e)
		const handleGlobalTouchEnd = () => handleTouchEnd()

		if (isDragging) {
			window.addEventListener("mousemove", handleGlobalMouseMove)
			window.addEventListener("mouseup", handleGlobalMouseUp)
			window.addEventListener("touchmove", handleGlobalTouchMove, { passive: false })
			window.addEventListener("touchend", handleGlobalTouchEnd)
		}

		return () => {
			window.removeEventListener("mousemove", handleGlobalMouseMove)
			window.removeEventListener("mouseup", handleGlobalMouseUp)
			window.removeEventListener("touchmove", handleGlobalTouchMove)
			window.removeEventListener("touchend", handleGlobalTouchEnd)
		}
	}, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, isStatic])

	return (
		<div
			ref={containerRef}
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				cursor: isDragging ? "ew-resize" : "pointer",
				userSelect: "none",
				touchAction: "none",
				boxShadow,
				borderRadius,
			}}
			onClick={isStatic ? undefined : handleClick}
			onMouseMove={isStatic ? undefined : handleMouseMove}
			onMouseDown={isStatic ? undefined : handleMouseDown}
			onMouseUp={isStatic ? undefined : handleMouseUp}
			onTouchStart={isStatic ? undefined : handleTouchStart}
			onTouchMove={isStatic ? undefined : handleTouchMove}
			onTouchEnd={isStatic ? undefined : handleTouchEnd}
			role="slider"
			aria-valuenow={position}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label="Before and after image comparison slider"
			tabIndex={0}
		>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundImage: `url(${afterImage.src})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
				aria-label={afterImage.alt}
				role="img"
			/>

			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundImage: `url(${beforeImage.src})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					clipPath: `inset(0 ${100 - position}% 0 0)`,
				}}
				aria-label={beforeImage.alt}
				role="img"
			/>

			<div
				style={{
					position: "absolute",
					top: 0,
					left: `${position}%`,
					width: `${dividerWidth}px`,
					height: "100%",
					backgroundColor: dividerColor,
					transform: `translateX(-${dividerWidth / 2}px)`,
					cursor: "ew-resize",
					zIndex: 2,
				}}
				onMouseDown={isStatic ? undefined : handleMouseDown}
				onTouchStart={isStatic ? undefined : handleTouchStart}
			/>

			{showHandle && (
				<div
					style={{
						position: "absolute",
						top: `calc(50% - ${handleSize / 2}px)`,
						left: `${position}%`,
						width: `${handleSize}px`,
						height: `${handleSize}px`,
						borderRadius: "50%",
						backgroundColor: "transparent",
						border: `3px solid transparent`,
						transform: `translateX(-${handleSize / 2}px)`,
						cursor: "ew-resize",
						zIndex: 3,
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
					onMouseDown={isStatic ? undefined : handleMouseDown}
					onTouchStart={isStatic ? undefined : handleTouchStart}
				>
					{handleIcon ? (
						<img
							src={handleIcon.src}
							alt={handleIcon.alt || "Handle icon"}
							style={{
								width: `${handleSize * 0.6}px`,
								height: `${handleSize * 0.6}px`,
								objectFit: "contain",
							}}
						/>
					) : (
						<svg
							viewBox="0 0 24 24"
							width={handleSize * 0.5}
							height={handleSize * 0.5}
							strokeWidth="3"
							stroke="#000000"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-label="Drag handle"
						>
							<title>Drag handle</title>
							<path d="M15 18l-6-6 6-6" />
							<path d="M9 6l6 6-6 6" />
						</svg>
					)}
				</div>
			)}

			{showLabels && (
				<>
					<div
						style={{
							position: "absolute",
							top: 16,
							left: 16,
							backgroundColor: labelFillColor,
							color: labelTextColor,
							border: `2px solid ${labelBorderColor}`,
							padding: "8px 16px",
							borderRadius: 8,
							boxShadow: labelBoxShadow,
							zIndex: 10,
							pointerEvents: "none",
							opacity: position <= 15 ? 0 : 1,
							transition: "opacity 0.15s ease",
							...labelFont,
						}}
					>
						{beforeLabel}
					</div>
					<div
						style={{
							position: "absolute",
							top: 16,
							right: 16,
							backgroundColor: labelFillColor,
							color: labelTextColor,
							border: `2px solid ${labelBorderColor}`,
							padding: "8px 16px",
							borderRadius: 8,
							boxShadow: labelBoxShadow,
							zIndex: 10,
							pointerEvents: "none",
							opacity: position >= 85 ? 0 : 1,
							transition: "opacity 0.15s ease",
							...labelFont,
						}}
					>
						{afterLabel}
					</div>
				</>
			)}
		</div>
	)
}

addPropertyControls(ImageSlider, {
	scrollDirection: {
		type: ControlType.Enum,
		title: "Scroll Direction",
		options: ["right-to-left", "left-to-right"],
		optionTitles: ["Right to Left", "Left to Right"],
		defaultValue: "right-to-left",
		displaySegmentedControl: true,
	},
	autoScroll: {
		type: ControlType.Boolean,
		title: "Auto Scroll",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	beforeImage: {
		type: ControlType.ResponsiveImage,
		title: "Before Image",
	},
	afterImage: {
		type: ControlType.ResponsiveImage,
		title: "After Image",
	},
	dividerColor: {
		type: ControlType.Color,
		title: "Divider Color",
		defaultValue: "#000000",
	},
	dividerWidth: {
		type: ControlType.Number,
		title: "Divider Width",
		defaultValue: 2,
		min: 1,
		max: 10,
		step: 1,
		unit: "px",
	},
	showHandle: {
		type: ControlType.Boolean,
		title: "Show Handle",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	handleSize: {
		type: ControlType.Number,
		title: "Handle Size",
		defaultValue: 40,
		min: 30,
		max: 80,
		step: 2,
		unit: "px",
		hidden: ({ showHandle }) => !showHandle,
	},
	handleIcon: {
		type: ControlType.ResponsiveImage,
		title: "Handle Icon",
		hidden: ({ showHandle }) => !showHandle,
	},
	showLabels: {
		type: ControlType.Boolean,
		title: "Show Labels",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	beforeLabel: {
		type: ControlType.String,
		title: "Before Label",
		defaultValue: "Before",
		hidden: ({ showLabels }) => !showLabels,
	},
	afterLabel: {
		type: ControlType.String,
		title: "After Label",
		defaultValue: "After",
		hidden: ({ showLabels }) => !showLabels,
	},
	labelFont: {
		type: ControlType.Font,
		title: "Label Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "12px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
		hidden: ({ showLabels }) => !showLabels,
	},
	labelFillColor: {
		type: ControlType.Color,
		title: "Label Fill",
		defaultValue: "rgba(255, 255, 255, 0.8)",
		hidden: ({ showLabels }) => !showLabels,
	},
	labelBorderColor: {
		type: ControlType.Color,
		title: "Label Border",
		defaultValue: "transparent",
		hidden: ({ showLabels }) => !showLabels,
	},
	labelTextColor: {
		type: ControlType.Color,
		title: "Label Text",
		defaultValue: "#000000",
		hidden: ({ showLabels }) => !showLabels,
	},
	labelBoxShadow: {
		type: ControlType.BoxShadow,
		title: "Label Shadow",
		hidden: ({ showLabels }) => !showLabels,
	},
	boxShadow: {
		type: ControlType.BoxShadow,
		title: "Box Shadow",
		defaultValue: "1px 0px 18px rgba(0, 0, 0, 0.14)",
	},
	borderRadius: {
		type: ControlType.BorderRadius,
		title: "Border Radius",
		defaultValue: "20px",
	},
})