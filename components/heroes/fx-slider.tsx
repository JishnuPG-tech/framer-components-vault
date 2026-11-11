// Category slider with custom sound effects and dynamic GSAP-style transitions
import { useEffect, useState, useRef, useCallback, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useInView } from "framer-motion"

interface CategoryItem {
	artist: string
	category: string
	featured: string
	image: {
		src: string
		alt: string
	}
}

interface FXSliderProps {
	categories: CategoryItem[]
	headerText: string
	footerText: string
	backgroundColor: string
	textColor: string
	enableSound: boolean
	hoverSoundUrl: string
	clickSoundUrl: string
	textChangeSoundUrl: string
	hoverVolume: number
	clickVolume: number
	textChangeVolume: number
	transitionDuration: number
	parallaxAmount: number
	itemSpacing: number
	headerFont: CSSProperties
	bodyFont: CSSProperties
	featuredFont: CSSProperties
	style?: CSSProperties
}

class SoundManager {
	sounds: Record<string, HTMLAudioElement> = {}
	isEnabled = false

	loadSound(name: string, url: string, volume: number) {
		if (typeof window === "undefined") return
		const audio = new Audio(url)
		audio.preload = "auto"
		audio.volume = volume
		this.sounds[name] = audio
	}

	enableAudio() {
		this.isEnabled = true
	}

	play(soundName: string, delay = 0) {
		if (!this.isEnabled || !this.sounds[soundName]) return
		if (delay > 0) {
			setTimeout(() => {
				this.sounds[soundName].currentTime = 0
				this.sounds[soundName].play().catch(() => {})
			}, delay)
		} else {
			this.sounds[soundName].currentTime = 0
			this.sounds[soundName].play().catch(() => {})
		}
	}
}

/**
 * FX Slider - Interactive category slider with sound effects and dynamic transitions
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FXSlider(props: FXSliderProps) {
	const {
		categories = [],
		headerText = "EXPLORE",
		footerText = "DISCOVER",
		backgroundColor = "#000000",
		textColor = "#F5F5F5",
		enableSound = true,
		hoverSoundUrl = "https://assets.codepen.io/7558/click-reverb-001.mp3",
		clickSoundUrl = "https://assets.codepen.io/7558/shutter-fx-001.mp3",
		textChangeSoundUrl = "https://assets.codepen.io/7558/whoosh-fx-001.mp3",
		hoverVolume = 0.15,
		clickVolume = 0.3,
		textChangeVolume = 0.3,
		transitionDuration = 0.64,
		parallaxAmount = 5,
		itemSpacing = 0.25,
		headerFont,
		bodyFont,
		featuredFont,
	} = props

	// Ensure categories have default image values
	const categoriesWithDefaults = useMemo(() => {
		return categories.map((cat) => ({
			...cat,
			image: cat.image || {
				src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
				alt: "Default image",
			},
		}))
	}, [categories])

	const [currentSection, setCurrentSection] = useState(0)
	const [isAnimating, setIsAnimating] = useState(false)
	const [direction, setDirection] = useState<"up" | "down">("down")
	const soundManagerRef = useRef<SoundManager | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(containerRef)
	const isStatic = useIsStaticRenderer()

	useEffect(() => {
		if (typeof window === "undefined" || !enableSound) return
		soundManagerRef.current = new SoundManager()
		soundManagerRef.current.loadSound("hover", hoverSoundUrl, hoverVolume)
		soundManagerRef.current.loadSound("click", clickSoundUrl, clickVolume)
		soundManagerRef.current.loadSound("textChange", textChangeSoundUrl, textChangeVolume)
	}, [enableSound, hoverSoundUrl, clickSoundUrl, textChangeSoundUrl, hoverVolume, clickVolume, textChangeVolume])

	const navigateToSection = useCallback(
		(index: number) => {
			if (index === currentSection || isAnimating || index < 0 || index >= categoriesWithDefaults.length) return

			soundManagerRef.current?.enableAudio()
			soundManagerRef.current?.play("click")

			startTransition(() => {
				setIsAnimating(true)
				setDirection(index > currentSection ? "down" : "up")
				setCurrentSection(index)
			})

			soundManagerRef.current?.play("textChange", 250)

			setTimeout(() => {
				startTransition(() => setIsAnimating(false))
			}, transitionDuration * 1000)
		},
		[currentSection, isAnimating, categoriesWithDefaults.length, transitionDuration]
	)

	const handleItemClick = useCallback(
		(index: number) => {
			navigateToSection(index)
		},
		[navigateToSection]
	)

	const handleItemHover = useCallback(() => {
		soundManagerRef.current?.enableAudio()
		soundManagerRef.current?.play("hover")
	}, [])

	const progressWidth = useMemo(() => {
		if (categoriesWithDefaults.length <= 1) return 0
		return (currentSection / (categoriesWithDefaults.length - 1)) * 100
	}, [currentSection, categoriesWithDefaults.length])

	const textVariants = {
		enter: (direction: "up" | "down") => ({
			y: direction === "down" ? "100%" : "-100%",
			opacity: 0,
		}),
		center: {
			y: 0,
			opacity: 1,
		},
		exit: (direction: "up" | "down") => ({
			y: direction === "down" ? "-100%" : "100%",
			opacity: 0,
		}),
	}

	const imageVariants = {
		enter: (direction: "up" | "down") => ({
			clipPath: direction === "down" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)",
			opacity: 1,
		}),
		center: {
			clipPath: "inset(0% 0 0% 0)",
			opacity: 1,
		},
		exit: (direction: "up" | "down") => ({
			y: direction === "down" ? `${parallaxAmount}%` : `-${parallaxAmount}%`,
			opacity: 0,
		}),
	}

	if (categoriesWithDefaults.length === 0) {
		return (
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor,
					color: textColor,
					...bodyFont,
				}}
			>
				Add categories to get started
			</div>
		)
	}

	return (
		<div
			ref={containerRef}
			style={{
				width: "100%",
				height: "100%",
				position: "relative",
				overflow: "hidden",
				backgroundColor,
				color: textColor,
			}}
			onClick={() => soundManagerRef.current?.enableAudio()}
		>
			{/* Background Images */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					zIndex: 1,
				}}
			>
				{isStatic ? (
					<img
						src={categoriesWithDefaults[currentSection].image.src}
						alt={categoriesWithDefaults[currentSection].image.alt}
						style={{
							position: "absolute",
							top: "-10%",
							left: 0,
							width: "100%",
							height: "120%",
							objectFit: "cover",
							filter: "brightness(0.8)",
						}}
					/>
				) : (
					<AnimatePresence initial={false} custom={direction}>
						{isInView && (
							<motion.img
								key={currentSection}
								src={categoriesWithDefaults[currentSection].image.src}
								alt={categoriesWithDefaults[currentSection].image.alt}
								custom={direction}
								variants={imageVariants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{
									duration: transitionDuration,
									ease: [0.86, 0, 0.07, 1],
								}}
								style={{
									position: "absolute",
									top: "-10%",
									left: 0,
									width: "100%",
									height: "120%",
									objectFit: "cover",
									filter: "brightness(0.8)",
								}}
							/>
						)}
					</AnimatePresence>
				)}
			</div>

			{/* Content Grid */}
			<div
				style={{
					position: "relative",
					zIndex: 2,
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "5vh 2rem",
				}}
			>
				{/* Header */}
				<div
					style={{
						fontSize: "10vw",
						lineHeight: 0.8,
						textAlign: "center",
						...headerFont,
					}}
				>
					{headerText}
				</div>

				{/* Main Content */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "100%",
						gap: "2rem",
					}}
				>
					{/* Left Column - Artists */}
					<div
						style={{
							width: "40%",
							display: "flex",
							flexDirection: "column",
							gap: `${itemSpacing}rem`,
							textAlign: "left",
						}}
					>
						{categoriesWithDefaults.map((item, index) => (
							<div
								key={`artist-${index}`}
								onClick={() => handleItemClick(index)}
								onMouseEnter={handleItemHover}
								className="artist-item"
								style={{
									opacity: index === currentSection ? 1 : 0.3,
									cursor: "pointer",
									position: "relative",
									paddingLeft: index === currentSection ? "15px" : 0,
									transform: index === currentSection ? "translateX(10px)" : "translateX(0)",
									transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
									...bodyFont,
								}}
							>
								{index === currentSection && (
									<span
										style={{
											position: "absolute",
											left: 0,
											top: "50%",
											transform: "translateY(-50%)",
											width: "4px",
											height: "4px",
											backgroundColor: textColor,
											borderRadius: "50%",
										}}
									/>
								)}
								{item.artist}
							</div>
						))}
					</div>

					{/* Center - Featured */}
					<div
						style={{
							width: "20%",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							textAlign: "center",
							fontSize: "1.5vw",
							position: "relative",
							height: "10vh",
							overflow: "hidden",
						}}
					>
						<AnimatePresence initial={false} custom={direction} mode="wait">
							<motion.div
								key={currentSection}
								custom={direction}
								variants={textVariants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{
									duration: transitionDuration,
									ease: [0.86, 0, 0.07, 1],
								}}
								style={{
									position: "absolute",
									whiteSpace: "nowrap",
									...featuredFont,
								}}
							>
								{categoriesWithDefaults[currentSection].featured}
							</motion.div>
						</AnimatePresence>
					</div>

					{/* Right Column - Categories */}
					<div
						style={{
							width: "40%",
							display: "flex",
							flexDirection: "column",
							gap: `${itemSpacing}rem`,
							textAlign: "right",
						}}
					>
						{categoriesWithDefaults.map((item, index) => (
							<div
								key={`category-${index}`}
								onClick={() => handleItemClick(index)}
								onMouseEnter={handleItemHover}
								className="category-item"
								style={{
									opacity: index === currentSection ? 1 : 0.3,
									cursor: "pointer",
									position: "relative",
									paddingRight: index === currentSection ? "15px" : 0,
									transform: index === currentSection ? "translateX(-10px)" : "translateX(0)",
									transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
									...bodyFont,
								}}
							>
								{item.category}
								{index === currentSection && (
									<span
										style={{
											position: "absolute",
											right: 0,
											top: "50%",
											transform: "translateY(-50%)",
											width: "4px",
											height: "4px",
											backgroundColor: textColor,
											borderRadius: "50%",
										}}
									/>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div
					style={{
						fontSize: "10vw",
						lineHeight: 0.8,
						textAlign: "center",
						...headerFont,
					}}
				>
					{footerText}
					<div
						style={{
							width: "160px",
							height: "1px",
							margin: "2vh auto 0",
							position: "relative",
							backgroundColor: `${textColor}4D`,
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								height: "100%",
								width: `${progressWidth}%`,
								backgroundColor: textColor,
								transition: "width 0.3s cubic-bezier(0.65, 0, 0.35, 1)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								right: 0,
								display: "flex",
								justifyContent: "space-between",
								fontSize: "0.7rem",
								transform: "translateY(-50%)",
								margin: "0 -25px",
							}}
						>
							<span>{String(currentSection + 1).padStart(2, "0")}</span>
							<span>{String(categoriesWithDefaults.length).padStart(2, "0")}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Hover Styles */}
			<style>{`
				.artist-item:hover,
				.category-item:hover {
					opacity: 1 !important;
					color: ${textColor} !important;
				}
			`}</style>
		</div>
	)
}

addPropertyControls(FXSlider, {
	categories: {
		type: ControlType.Array,
		control: {
			type: ControlType.Object,
			controls: {
				artist: {
					type: ControlType.String,
					defaultValue: "Artist Name",
				},
				category: {
					type: ControlType.String,
					defaultValue: "Category",
				},
				featured: {
					type: ControlType.String,
					defaultValue: "Featured",
				},
				image: {
					type: ControlType.ResponsiveImage,
				},
			},
		},
		defaultValue: [
			{
				artist: "Miles Davis",
				category: "Jazz",
				featured: "Kind of Blue",
				image: {
					src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
					alt: "Jazz",
				},
			},
			{
				artist: "Daft Punk",
				category: "Electronic",
				featured: "Random Access",
				image: {
					src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
					alt: "Electronic",
				},
			},
			{
				artist: "Radiohead",
				category: "Alternative",
				featured: "OK Computer",
				image: {
					src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
					alt: "Alternative",
				},
			},
			{
				artist: "Kendrick Lamar",
				category: "Hip Hop",
				featured: "Good Kid",
				image: {
					src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
					alt: "Hip Hop",
				},
			},
			{
				artist: "Pink Floyd",
				category: "Rock",
				featured: "Dark Side",
				image: {
					src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
					alt: "Rock",
				},
			},
		],
	},
	headerText: {
		type: ControlType.String,
		defaultValue: "EXPLORE",
	},
	footerText: {
		type: ControlType.String,
		defaultValue: "DISCOVER",
	},
	backgroundColor: {
		type: ControlType.Color,
		defaultValue: "#000000",
	},
	textColor: {
		type: ControlType.Color,
		defaultValue: "#F5F5F5",
	},
	enableSound: {
		type: ControlType.Boolean,
		title: "Enable Sound",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	hoverSoundUrl: {
		type: ControlType.String,
		title: "Hover Sound URL",
		defaultValue: "https://assets.codepen.io/7558/click-reverb-001.mp3",
		hidden: ({ enableSound }) => !enableSound,
	},
	clickSoundUrl: {
		type: ControlType.String,
		title: "Click Sound URL",
		defaultValue: "https://assets.codepen.io/7558/shutter-fx-001.mp3",
		hidden: ({ enableSound }) => !enableSound,
	},
	textChangeSoundUrl: {
		type: ControlType.String,
		title: "Text Change Sound URL",
		defaultValue: "https://assets.codepen.io/7558/whoosh-fx-001.mp3",
		hidden: ({ enableSound }) => !enableSound,
	},
	hoverVolume: {
		type: ControlType.Number,
		title: "Hover Volume",
		defaultValue: 0.15,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: ({ enableSound }) => !enableSound,
	},
	clickVolume: {
		type: ControlType.Number,
		title: "Click Volume",
		defaultValue: 0.3,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: ({ enableSound }) => !enableSound,
	},
	textChangeVolume: {
		type: ControlType.Number,
		title: "Text Change Volume",
		defaultValue: 0.3,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: ({ enableSound }) => !enableSound,
	},
	transitionDuration: {
		type: ControlType.Number,
		title: "Transition Duration",
		defaultValue: 0.64,
		min: 0.2,
		max: 2,
		step: 0.1,
		unit: "s",
	},
	parallaxAmount: {
		type: ControlType.Number,
		title: "Parallax Amount",
		description: "Controls the vertical movement of background images during transitions",
		defaultValue: 5,
		min: 0,
		max: 20,
		step: 1,
		unit: "%",
	},
	itemSpacing: {
		type: ControlType.Number,
		title: "Item Spacing",
		defaultValue: 0.25,
		min: 0,
		max: 5,
		step: 0.25,
		unit: "rem",
	},
	headerFont: {
		type: ControlType.Font,
		title: "Header Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "10vw",
			variant: "Medium",
			letterSpacing: "-0.02em",
			lineHeight: "0.8em",
		},
	},
	bodyFont: {
		type: ControlType.Font,
		title: "Body Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "15px",
			variant: "Medium",
			letterSpacing: "-0.02em",
			lineHeight: "1em",
		},
	},
	featuredFont: {
		type: ControlType.Font,
		title: "Featured Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "1.5vw",
			variant: "Medium",
			letterSpacing: "-0.02em",
			lineHeight: "1em",
		},
	},
})