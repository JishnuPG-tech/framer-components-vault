// Responsive page preloader with venetian window blinds animation
// Supports both horizontal and vertical orientations
// Fills container and works as a full page preloader

import { useEffect, useState, startTransition, useRef } from "react"
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


interface VenetianPreloaderProps {
	orientation: "horizontal" | "vertical"
	direction: "forward" | "reverse"
	blindCount: number
	animationDuration: number
	staggerDelay: number
	preloadingDelay: number
	backgroundColor: string
	blindColor: string
	showLogo: boolean
	logoText: string
	logoColor: string
	logoFont: any
	enableSound: boolean
	soundType: "default" | "custom"
	customSound: string
	easingFunction: string
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function VenetianPreloader(props: VenetianPreloaderProps) {
	const {
		orientation = "horizontal",
		direction = "forward",
		blindCount = 8,
		animationDuration = 0.8,
		staggerDelay = 0.08,
		preloadingDelay = 0,
		backgroundColor = "#000000",
		blindColor = "#FFFFFF",
		showLogo = true,
		logoText = "Loading...",
		logoColor = "#000000",
		logoFont,
		enableSound = false,
		soundType = "default",
		customSound = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3",
		easingFunction = "easeInOut",
	} = props

	const [isLoading, setIsLoading] = useState(true)
	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		const timer = setTimeout(() => {
			startTransition(() => {
				setIsLoading(false)
			})
		}, (preloadingDelay + blindCount * staggerDelay + animationDuration) * 1000)

		return () => clearTimeout(timer)
	}, [blindCount, staggerDelay, animationDuration, preloadingDelay])

	useEffect(() => {
		if (enableSound && typeof window !== "undefined") {
			const soundUrl =
				soundType === "default"
					? "https://framerusercontent.com/assets/gMe4DkNWIbSLdRE0EGIaRLKjTCo.mp3"
					: customSound

			audioRef.current = new Audio(soundUrl)
			audioRef.current.volume = 0.5

			const playTimer = setTimeout(() => {
				audioRef.current?.play().catch((error) => {
					console.log("Audio playback failed:", error)
				})
			}, preloadingDelay * 1000)

			return () => {
				clearTimeout(playTimer)
				if (audioRef.current) {
					audioRef.current.pause()
					audioRef.current = null
				}
			}
		}
	}, [enableSound, soundType, customSound, preloadingDelay])

	const isHorizontal = orientation === "horizontal"

	const easingMap = {
		linear: [0, 0, 1, 1],
		easeIn: [0.42, 0, 1, 1],
		easeOut: [0, 0, 0.58, 1],
		easeInOut: [0.43, 0.13, 0.23, 0.96],
		easeInQuad: [0.55, 0.085, 0.68, 0.53],
		easeOutQuad: [0.25, 0.46, 0.45, 0.94],
		easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
		easeInCubic: [0.55, 0.055, 0.675, 0.19],
		easeOutCubic: [0.215, 0.61, 0.355, 1],
		easeInOutCubic: [0.645, 0.045, 0.355, 1],
		easeInQuart: [0.895, 0.03, 0.685, 0.22],
		easeOutQuart: [0.165, 0.84, 0.44, 1],
		easeInOutQuart: [0.77, 0, 0.175, 1],
		easeInBack: [0.6, -0.28, 0.735, 0.045],
		easeOutBack: [0.175, 0.885, 0.32, 1.275],
		easeInOutBack: [0.68, -0.55, 0.265, 1.55],
	}

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				backgroundColor: backgroundColor,
				overflow: "hidden",
			}}
		>
			<AnimatePresence>
				{isLoading && (
					<>
						{/* Logo */}
						{showLogo && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.3, delay: preloadingDelay }}
								style={{
									position: "absolute",
									top: "50%",
									left: "50%",
									transform: "translate(-50%, -50%)",
									zIndex: 2,
									color: logoColor,
									...logoFont,
									whiteSpace: "nowrap",
								}}
							>
								{logoText}
							</motion.div>
						)}

						{/* Venetian Blinds */}
						{Array.from({ length: blindCount }).map((_, index) => {
							const blindSize = 100 / blindCount
							const blindIndex = direction === "reverse" ? blindCount - 1 - index : index

							return (
								<motion.div
									key={index}
									initial={{
										[isHorizontal ? "scaleY" : "scaleX"]: 1,
									}}
									animate={{
										[isHorizontal ? "scaleY" : "scaleX"]: 0,
									}}
									exit={{
										[isHorizontal ? "scaleY" : "scaleX"]: 0,
									}}
									transition={{
										duration: animationDuration,
										delay: preloadingDelay + blindIndex * staggerDelay,
										ease: easingMap[easingFunction] || easingMap.easeInOut,
									}}
									style={{
										position: "absolute",
										backgroundColor: blindColor,
										...(isHorizontal
											? {
													top: `${index * blindSize}%`,
													left: 0,
													width: "100%",
													height: `${blindSize}%`,
													transformOrigin: direction === "forward" ? "top" : "bottom",
											  }
											: {
													left: `${index * blindSize}%`,
													top: 0,
													width: `${blindSize}%`,
													height: "100%",
													transformOrigin: direction === "forward" ? "left" : "right",
											  }),
										zIndex: 1,
									}}
								/>
							)
						})}
					</>
				)}
			</AnimatePresence>
		</div>
	)
}

addPropertyControls(VenetianPreloader, {
	orientation: {
		type: ControlType.Enum,
		title: "Orientation",
		options: ["horizontal", "vertical"],
		optionTitles: ["Horizontal", "Vertical"],
		defaultValue: "horizontal",
		displaySegmentedControl: true,
	},
	direction: {
		type: ControlType.Enum,
		title: "Direction",
		options: ["forward", "reverse"],
		optionTitles: ["Forward", "Reverse"],
		defaultValue: "forward",
		displaySegmentedControl: true,
	},
	blindCount: {
		type: ControlType.Number,
		title: "Blind Count",
		defaultValue: 8,
		min: 3,
		max: 20,
		step: 1,
		displayStepper: true,
	},
	preloadingDelay: {
		type: ControlType.Number,
		title: "Preload Delay",
		defaultValue: 0,
		min: 0,
		max: 5,
		step: 0.1,
		unit: "s",
	},
	animationDuration: {
		type: ControlType.Number,
		title: "Duration",
		defaultValue: 0.8,
		min: 0.2,
		max: 2,
		step: 0.1,
		unit: "s",
	},
	staggerDelay: {
		type: ControlType.Number,
		title: "Stagger Delay",
		defaultValue: 0.08,
		min: 0,
		max: 0.3,
		step: 0.01,
		unit: "s",
	},
	easingFunction: {
		type: ControlType.Enum,
		title: "Easing",
		options: [
			"linear",
			"easeIn",
			"easeOut",
			"easeInOut",
			"easeInQuad",
			"easeOutQuad",
			"easeInOutQuad",
			"easeInCubic",
			"easeOutCubic",
			"easeInOutCubic",
			"easeInQuart",
			"easeOutQuart",
			"easeInOutQuart",
			"easeInBack",
			"easeOutBack",
			"easeInOutBack",
		],
		optionTitles: [
			"Linear",
			"Ease In",
			"Ease Out",
			"Ease In Out",
			"Ease In Quad",
			"Ease Out Quad",
			"Ease In Out Quad",
			"Ease In Cubic",
			"Ease Out Cubic",
			"Ease In Out Cubic",
			"Ease In Quart",
			"Ease Out Quart",
			"Ease In Out Quart",
			"Ease In Back",
			"Ease Out Back",
			"Ease In Out Back",
		],
		defaultValue: "easeInOut",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#000000",
	},
	blindColor: {
		type: ControlType.Color,
		title: "Blind Color",
		defaultValue: "#FFFFFF",
	},
	showLogo: {
		type: ControlType.Boolean,
		title: "Show Logo",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	logoText: {
		type: ControlType.String,
		title: "Logo Text",
		defaultValue: "Loading...",
		hidden: ({ showLogo }) => !showLogo,
	},
	logoColor: {
		type: ControlType.Color,
		title: "Logo Color",
		defaultValue: "#000000",
		hidden: ({ showLogo }) => !showLogo,
	},
	logoFont: {
		type: ControlType.Font,
		title: "Logo Font",
		defaultValue: {
			fontSize: "32px",
			variant: "Bold",
			letterSpacing: "-0.02em",
			lineHeight: "1em",
		},
		controls: "extended",
		defaultFontType: "sans-serif",
		hidden: ({ showLogo }) => !showLogo,
	},
	enableSound: {
		type: ControlType.Boolean,
		title: "Enable Sound",
		defaultValue: false,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	soundType: {
		type: ControlType.Enum,
		title: "Sound Type",
		options: ["default", "custom"],
		optionTitles: ["Default", "Custom"],
		defaultValue: "default",
		displaySegmentedControl: true,
		hidden: ({ enableSound }) => !enableSound,
	},
	customSound: {
		type: ControlType.File,
		title: "Custom Sound",
		allowedFileTypes: ["mp3", "wav", "ogg"],
		hidden: ({ enableSound, soundType }) => !enableSound || soundType !== "custom",
	},
})