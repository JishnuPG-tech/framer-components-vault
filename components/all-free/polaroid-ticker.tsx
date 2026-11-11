// Photo ticker with polaroid-style photos attached by a rope that moves right to left and speeds up on scroll
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

import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from "framer-motion"

interface PhotoItem {
	image: {
		src: string
		alt: string
	}
	caption: string
	link?: string
}

interface PolaroidTickerProps {
	photos: PhotoItem[]
	baseSpeed: number
	scrollMultiplier: number
	polaroidBackground: string
	polaroidPadding: number
	bottomPadding: number
	captionFont: any
	captionColor: string
	photoSize: number
	gap: number
	rotation: number
	shadow: boolean
	hoverScale: number
	hoverRotation: number
	borderRadius: number
	photoRadius: number
	style?: CSSProperties
}

/**
 * Polaroid Photo Ticker
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function PolaroidTicker(props: PolaroidTickerProps) {
	const {
		photos = [],
		baseSpeed,
		scrollMultiplier,
		polaroidBackground,
		polaroidPadding,
		bottomPadding,
		captionFont,
		captionColor,
		photoSize,
		gap,
		rotation,
		shadow,
		hoverScale,
		hoverRotation,
		borderRadius,
		photoRadius,
	} = props

	const containerRef = useRef<HTMLDivElement>(null)
	const x = useMotionValue(0)
	const [scrollVelocity, setScrollVelocity] = useState(0)
	const [hoveredIndex, setHoveredIndex] = useState<string | null>(null)
	const lastScrollY = useRef(0)
	const scrollTimeout = useRef<number | null>(null)

	// Calculate total width needed for seamless loop
	const itemWidth = photoSize + polaroidPadding * 2
	const totalWidth = (itemWidth + gap) * photos.length

	useEffect(() => {
		if (typeof window === "undefined") return

		const handleScroll = () => {
			const currentScrollY = window.scrollY
			const velocity = Math.abs(currentScrollY - lastScrollY.current)
			lastScrollY.current = currentScrollY

			startTransition(() => {
				setScrollVelocity(velocity)
			})

			if (scrollTimeout.current !== null) {
				window.clearTimeout(scrollTimeout.current)
			}

			scrollTimeout.current = window.setTimeout(() => {
				startTransition(() => {
					setScrollVelocity(0)
				})
			}, 150)
		}

		window.addEventListener("scroll", handleScroll, { passive: true })

		return () => {
			window.removeEventListener("scroll", handleScroll)
			if (scrollTimeout.current !== null) {
				window.clearTimeout(scrollTimeout.current)
			}
		}
	}, [])

	useAnimationFrame((time, delta) => {
		const speed = baseSpeed + scrollVelocity * scrollMultiplier
		const movement = (speed * delta) / 1000

		x.set(x.get() - movement)

		if (x.get() <= -totalWidth) {
			x.set(x.get() + totalWidth)
		}
	})

	const renderPhotos = (offset: number = 0) => {
		return photos.map((photo, index) => {
			const randomRotation = (Math.sin(index * 123.456) * rotation - rotation / 2) * 0.5
			const itemKey = `${offset}-${index}`
			const isHovered = hoveredIndex === itemKey
			
			// Add default image if undefined
			const photoImage = photo.image || {
				src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
				alt: "Default photo",
			}

			const polaroidContent = (
				<div
					style={{
						position: "relative",
						backgroundColor: polaroidBackground,
						padding: polaroidPadding,
						paddingBottom: bottomPadding,
						boxShadow: shadow ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
						transform: `rotate(${randomRotation + (isHovered ? hoverRotation : 0)}deg) scale(${isHovered ? hoverScale : 1})`,
						transition: "transform 0.3s ease",
						cursor: photo.link ? "pointer" : "default",
						borderRadius: borderRadius,
					}}
					onMouseEnter={() => startTransition(() => setHoveredIndex(itemKey))}
					onMouseLeave={() => startTransition(() => setHoveredIndex(null))}
				>
					<img
						src={photoImage.src}
						alt={photoImage.alt}
						style={{
							width: photoSize,
							height: photoSize,
							objectFit: "cover",
							display: "block",
							backgroundColor: "#f0f0f0",
							borderRadius: photoRadius,
						}}
					/>
					<div
						style={{
							marginTop: polaroidPadding * 1.5,
							textAlign: "center",
							color: captionColor,
							...captionFont,
						}}
					>
						{photo.caption}
					</div>
				</div>
			)

			return (
				<div
					key={itemKey}
					style={{
						position: "relative",
						flexShrink: 0,
						width: itemWidth,
						marginRight: gap,
					}}
				>
					{photo.link ? (
						<a
							href={photo.link}
							style={{
								textDecoration: "none",
								display: "block",
							}}
							target="_blank"
							rel="noopener noreferrer"
						>
							{polaroidContent}
						</a>
					) : (
						polaroidContent
					)}
				</div>
			)
		})
	}

	if (RenderTarget.current() === RenderTarget.thumbnail) {
		return (
			<div
				style={{
					width: "100%",
					height: "100%",
					position: "relative",
					overflow: "hidden",
					backgroundColor: "transparent",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: gap,
					}}
				>
					{renderPhotos()}
				</div>
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
				backgroundColor: "transparent",
			}}
		>
			<motion.div
				style={{
					display: "flex",
					alignItems: "flex-start",
					paddingTop: 40,
					paddingBottom: 40,
					x,
					willChange: "transform",
				}}
			>
				{renderPhotos(0)}
				{renderPhotos(1)}
				{renderPhotos(2)}
			</motion.div>
		</div>
	)
}

addPropertyControls(PolaroidTicker, {
	photos: {
		type: ControlType.Array,
		control: {
			type: ControlType.Object,
			controls: {
				image: {
					type: ControlType.ResponsiveImage,
					title: "Photo",
				},
				caption: {
					type: ControlType.String,
					title: "Caption",
					defaultValue: "Summer 2024",
				},
				link: {
					type: ControlType.Link,
					title: "Link",
				},
			},
		},
		defaultValue: [
			{
				image: {
					src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
					alt: "Photo 1",
				},
				caption: "Summer 2024",
			},
			{
				image: {
					src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
					alt: "Photo 2",
				},
				caption: "Beach Day",
			},
			{
				image: {
					src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
					alt: "Photo 3",
				},
				caption: "Sunset",
			},
			{
				image: {
					src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
					alt: "Photo 4",
				},
				caption: "Adventure",
			},
			{
				image: {
					src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
					alt: "Photo 5",
				},
				caption: "Memories",
			},
		],
		maxCount: 20,
	},
	baseSpeed: {
		type: ControlType.Number,
		title: "Base Speed",
		defaultValue: 50,
		min: 0,
		max: 200,
		step: 5,
		unit: "px/s",
	},
	scrollMultiplier: {
		type: ControlType.Number,
		title: "Scroll Speed",
		defaultValue: 2,
		min: 0,
		max: 10,
		step: 0.5,
	},
	photoSize: {
		type: ControlType.Number,
		title: "Photo Size",
		defaultValue: 200,
		min: 100,
		max: 400,
		step: 10,
		unit: "px",
	},
	gap: {
		type: ControlType.Number,
		title: "Gap",
		defaultValue: 40,
		min: 0,
		max: 100,
		step: 5,
		unit: "px",
	},
	polaroidPadding: {
		type: ControlType.Number,
		title: "Frame Padding",
		defaultValue: 16,
		min: 8,
		max: 40,
		step: 2,
		unit: "px",
	},
	bottomPadding: {
		type: ControlType.Number,
		title: "Bottom Padding",
		defaultValue: 40,
		min: 8,
		max: 80,
		step: 2,
		unit: "px",
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Border Radius",
		defaultValue: 4,
		min: 0,
		max: 40,
		step: 1,
		unit: "px",
	},
	photoRadius: {
		type: ControlType.Number,
		title: "Photo Radius",
		defaultValue: 0,
		min: 0,
		max: 40,
		step: 1,
		unit: "px",
	},
	rotation: {
		type: ControlType.Number,
		title: "Max Rotation",
		defaultValue: 8,
		min: 0,
		max: 20,
		step: 1,
		unit: "deg",
	},
	hoverScale: {
		type: ControlType.Number,
		title: "Hover Scale",
		defaultValue: 1.05,
		min: 1,
		max: 1.3,
		step: 0.05,
	},
	hoverRotation: {
		type: ControlType.Number,
		title: "Hover Rotation",
		defaultValue: 3,
		min: -10,
		max: 10,
		step: 1,
		unit: "deg",
	},
	polaroidBackground: {
		type: ControlType.Color,
		title: "Frame Color",
		defaultValue: "#FFFFFF",
	},
	captionColor: {
		type: ControlType.Color,
		title: "Caption Color",
		defaultValue: "#000000",
	},
	captionFont: {
		type: ControlType.Font,
		title: "Caption Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Medium",
			letterSpacing: "-0.01em",
			lineHeight: "1.2em",
		},
	},
	shadow: {
		type: ControlType.Boolean,
		title: "Shadow",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
})