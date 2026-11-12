// CkewAnimatedCard with editable image that tilts based on cursor position with shadow transform
import React, { useRef, useCallback, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion"

interface CkewAnimatedCardProps {
	image: {
		src: string
		alt: string
	}
	videoFile: string
	videoPoster: {
		src: string
		alt: string
	}
	mediaType: "image" | "video"
	objectFit: "cover" | "contain" | "fill"
	tiltIntensity: number
	enableShadow: boolean
	shadowIntensity: number
	enableLighting: boolean
	lightingIntensity: number
	borderRadius: number
	backgroundColor: string
	stiffness: number
	damping: number
	mass: number
	style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CkewAnimatedCard(props: CkewAnimatedCardProps) {
	const {
		image = {
			src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
			alt: "Card image",
		},
		videoFile = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
		videoPoster = {
			src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
			alt: "Video poster",
		},
		mediaType = "image",
		objectFit = "cover",
		tiltIntensity = 8,
		enableShadow = true,
		shadowIntensity = 20,
		enableLighting = true,
		lightingIntensity = 0.2,
		borderRadius = 16,
		backgroundColor = "#FFFFFF",
		stiffness = 150,
		damping = 15,
		mass = 0.5,
	} = props

	const cardRef = useRef<HTMLDivElement>(null)
	const isStatic = useIsStaticRenderer()

	// Use motion values for instant, hardware-accelerated updates
	const mouseX = useMotionValue(0)
	const mouseY = useMotionValue(0)
	const isHovering = useMotionValue(0)

	// Smooth spring animations - flat structure for better performance
	const springConfig = { stiffness, damping, mass }
	const smoothMouseX = useSpring(mouseX, springConfig)
	const smoothMouseY = useSpring(mouseY, springConfig)
	const smoothHover = useSpring(isHovering, { stiffness: 200, damping: 20 })

	// Calculate shadow offset based on mouse position
	const shadowX = useTransform(smoothMouseX, [-0.5, 0.5], [shadowIntensity, -shadowIntensity])
	const shadowY = useTransform(smoothMouseY, [-0.5, 0.5], [shadowIntensity, -shadowIntensity])
	const shadowBlur = useTransform(smoothHover, [0, 1], [shadowIntensity / 2, shadowIntensity * 2])

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!cardRef.current || isStatic) return

			const rect = cardRef.current.getBoundingClientRect()
			const x = (e.clientX - rect.left) / rect.width - 0.5
			const y = (e.clientY - rect.top) / rect.height - 0.5

			mouseX.set(x)
			mouseY.set(y)
			isHovering.set(1)
		},
		[isStatic, mouseX, mouseY, isHovering],
	)

	const handleMouseLeave = useCallback(() => {
		if (isStatic) return
		mouseX.set(0)
		mouseY.set(0)
		isHovering.set(0)
	}, [isStatic, mouseX, mouseY, isHovering])

	// Shadow is computed directly in render using motion values - no React state
	const shadowMotionValue = useTransform(
		[shadowX, shadowY, shadowBlur],
		([x, y, b]) => `${x}px ${y}px ${b}px rgba(0, 0, 0, 0.2)`
	)

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				perspective: "1000px",
				position: "relative",
				overflow: "visible",
			}}
		>
			<motion.div
				ref={cardRef}
				onMouseMove={isStatic ? undefined : handleMouseMove}
				onMouseLeave={isStatic ? undefined : handleMouseLeave}
				style={{
					width: "100%",
					height: "100%",
					borderRadius,
					backgroundColor,
					overflow: "hidden",
					transformStyle: "preserve-3d",
					position: "relative",
					rotateX: useTransform(smoothMouseY, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]),
					rotateY: useTransform(smoothMouseX, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]),
					boxShadow: enableShadow ? shadowMotionValue : "none",
				}}
			>
				{mediaType === "image" ? (
					<img
						src={image.src}
						alt={image.alt}
						style={{
							width: "100%",
							height: "100%",
							objectFit,
							display: "block",
						}}
					/>
				) : isStatic ? (
					<img
						src={videoPoster.src}
						alt={videoPoster.alt}
						style={{
							width: "100%",
							height: "100%",
							objectFit,
							display: "block",
						}}
					/>
				) : (
					<video
						src={videoFile}
						poster={videoPoster.src}
						autoPlay={!isStatic}
						muted
						loop={!isStatic}
						playsInline
						style={{
							width: "100%",
							height: "100%",
							objectFit,
							display: "block",
						}}
					/>
				)}
				{/* Lighting overlay */}
				{enableLighting && (
					<motion.div
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							pointerEvents: "none",
							background: useTransform(
								[smoothMouseX, smoothMouseY, smoothHover],
								([x, y, h]) => {
									const lightX = ((x as number) + 0.5) * 60 + 20
									const lightY = ((y as number) + 0.5) * 60 + 20
									const opacity = (h as number) * lightingIntensity
									return `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255, 255, 255, ${opacity * 4}) 0%, transparent 50%)`
								},
							),
							opacity: smoothHover,
							mixBlendMode: "soft-light",
						}}
					/>
				)}
			</motion.div>
		</div>
	)
}

addPropertyControls(CkewAnimatedCard, {
	mediaType: {
		type: ControlType.Enum,
		title: "Media Type",
		options: ["image", "video"],
		optionTitles: ["Image", "Video"],
		defaultValue: "image",
		displaySegmentedControl: true,
	},
	image: {
		type: ControlType.ResponsiveImage,
		title: "Image",
		hidden: ({ mediaType }) => mediaType === "video",
	},
	videoFile: {
		type: ControlType.File,
		title: "Video",
		allowedFileTypes: ["mp4", "webm", "mov"],
		hidden: ({ mediaType }) => mediaType === "image",
	},
	videoPoster: {
		type: ControlType.ResponsiveImage,
		title: "Video Poster",
		hidden: ({ mediaType }) => mediaType === "image",
	},
	objectFit: {
		type: ControlType.Enum,
		title: "Object Fit",
		options: ["cover", "contain", "fill"],
		optionTitles: ["Cover", "Contain", "Fill"],
		defaultValue: "cover",
		displaySegmentedControl: true,
	},
	tiltIntensity: {
		type: ControlType.Number,
		title: "Tilt Intensity",
		defaultValue: 8,
		min: 0,
		max: 10,
		step: 0.5,
		unit: "deg",
	},
	enableShadow: {
		type: ControlType.Boolean,
		title: "Shadow",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	shadowIntensity: {
		type: ControlType.Number,
		title: "Shadow Intensity",
		defaultValue: 20,
		min: 0,
		max: 50,
		step: 1,
		unit: "px",
		hidden: ({ enableShadow }) => !enableShadow,
	},
	enableLighting: {
		type: ControlType.Boolean,
		title: "Lighting",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	lightingIntensity: {
		type: ControlType.Number,
		title: "Light Intensity",
		defaultValue: 0.2,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: ({ enableLighting }) => !enableLighting,
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Border Radius",
		defaultValue: 16,
		min: 0,
		max: 50,
		step: 1,
		unit: "px",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#FFFFFF",
	},
	stiffness: {
		type: ControlType.Number,
		title: "Spring Stiffness",
		defaultValue: 150,
		min: 50,
		max: 500,
		step: 10,
	},
	damping: {
		type: ControlType.Number,
		title: "Spring Damping",
		defaultValue: 15,
		min: 5,
		max: 50,
		step: 1,
	},
	mass: {
		type: ControlType.Number,
		title: "Spring Mass",
		defaultValue: 0.5,
		min: 0.1,
		max: 2,
		step: 0.1,
	},
})

CkewAnimatedCard.displayName = "CkewAnimatedCard"