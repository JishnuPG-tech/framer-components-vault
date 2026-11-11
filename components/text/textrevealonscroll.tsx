import { useRef, useMemo } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ScrollTextRevealProps {
	text: string
	animationStyle: "word" | "line"
	yOffset: number
	blurAmount: number
	textColor: string
	clientsColor: string
	designColor: string
	font: any
}

/**
 * Scroll Text Reveal
 *
 * Text that reveals on scroll with staggered animations.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollTextReveal(props: ScrollTextRevealProps) {
	const {
		text = "Clients need solved problems and progress. Design chaos gives them doubt. I design to fix that—bridging gaps between vision, collaboration, and use.\n\nWhen design lacks clarity, Teams hesitate, miscommunicate. Users need signals, not puzzles. Poor interfaces make them struggle, stall, leave.",
		animationStyle = "word",
		yOffset = 40,
		blurAmount = 8,
		textColor = "#000000",
		clientsColor = "#3B82F6",
		designColor = "#3B82F6",
		font,
	} = props

	const containerRef = useRef<HTMLDivElement>(null)

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start 0.9", "start 0.1"]
	})

	const lines = useMemo(() => {
		return text.split("\n").filter(line => line.length > 0)
	}, [text])

	const allWords = useMemo(() => {
		return text.split(/\s+/).filter(word => word.length > 0)
	}, [text])

	const content = animationStyle === "line" ? lines : allWords

	return (
		<div
			ref={containerRef}
			style={{
				width: "100%",
				height: "auto",
				padding: "40px 0",
			}}
		>
			<p
				style={{
					margin: 0,
					fontSize: font?.fontSize || "28px",
					fontWeight: font?.fontWeight || 500,
					fontFamily: font?.fontFamily || "inherit",
					lineHeight: font?.lineHeight || "1.4em",
					letterSpacing: font?.letterSpacing || "-0.01em",
					textAlign: font?.textAlign || "left",
					fontStyle: font?.fontStyle || "normal",
				}}
			>
				{animationStyle === "line" ? (
					lines.map((line, lineIndex) => (
						<span key={lineIndex} style={{ display: "block", marginBottom: "1em" }}>
							{line.split(/\s+/).filter(w => w.length > 0).map((word, wordIndex, wordsArray) => {
								const globalIndex = lines.slice(0, lineIndex).reduce((acc, l) => 
									acc + l.split(/\s+/).filter(w => w.length > 0).length, 0
								) + wordIndex
								const totalWords = allWords.length
								const wordStart = globalIndex / totalWords
								const wordEnd = (globalIndex + 1) / totalWords
								
								return (
									<ScrollWord
										key={wordIndex}
										word={word}
										scrollYProgress={scrollYProgress}
										startProgress={wordStart}
										endProgress={wordEnd}
										yOffset={yOffset}
										blurAmount={blurAmount}
										isLast={wordIndex === wordsArray.length - 1}
										clientsColor={clientsColor}
										designColor={designColor}
										textColor={textColor}
									/>
									)
								})}
							</span>
						))
					) : (
						allWords.map((word, index) => {
							const start = index / allWords.length
							const end = (index + 1) / allWords.length
							
							return (
								<ScrollWord
									key={index}
									word={word}
									scrollYProgress={scrollYProgress}
									startProgress={start}
									endProgress={end}
									yOffset={yOffset}
									blurAmount={blurAmount}
									isLast={index === allWords.length - 1}
									clientsColor={clientsColor}
									designColor={designColor}
									textColor={textColor}
								/>
							)
						})
					)}
				</p>
			</div>
		)
	}

	function ScrollWord({
		word,
		scrollYProgress,
		startProgress,
		endProgress,
		yOffset,
		blurAmount,
		isLast,
		clientsColor,
		designColor,
		textColor
	}: {
		word: string
		scrollYProgress: any
		startProgress: number
		endProgress: number
		yOffset: number
		blurAmount: number
		isLast: boolean
		clientsColor: string
		designColor: string
		textColor: string
	}) {
		const wordProgress = useTransform(
			scrollYProgress,
			[startProgress, endProgress],
			[0, 1]
		)
		
		const opacity = useTransform(wordProgress, [0, 1], [0.15, 1])
		const y = useTransform(wordProgress, [0, 1], [yOffset, 0])
		const filter = useTransform(
			wordProgress,
			[0, 1],
			[`blur(${blurAmount}px)`, "blur(0px)"]
		)

		const wordColor = word === "Clients" ? clientsColor : word === "design" ? designColor : textColor

		return (
			<motion.span
				style={{
					display: "inline-block",
					color: wordColor,
					opacity,
					y,
					filter,
					marginRight: isLast ? 0 : "0.25em",
					marginBottom: "0.15em",
				}}
			>
				{word}
			</motion.span>
		)
	}

	addPropertyControls(ScrollTextReveal, {
		text: {
			type: ControlType.String,
			title: "Text",
			defaultValue: "Clients need solved problems and progress. Design chaos gives them doubt. I design to fix that—bridging gaps between vision, collaboration, and use.\n\nWhen design lacks clarity, Teams hesitate, miscommunicate. Users need signals, not puzzles. Poor interfaces make them struggle, stall, leave.",
			displayTextArea: true,
		},
		animationStyle: {
			type: ControlType.Enum,
			title: "Animation Style",
			options: ["word", "line"],
			optionTitles: ["Word by Word", "Line by Line"],
			defaultValue: "word",
			displaySegmentedControl: true,
		},
		yOffset: {
			type: ControlType.Number,
			title: "Y Offset",
			defaultValue: 40,
			min: 0,
			max: 100,
			step: 5,
			unit: "px",
		},
		blurAmount: {
			type: ControlType.Number,
			title: "Blur Amount",
			defaultValue: 8,
			min: 0,
			max: 20,
			step: 1,
			unit: "px",
		},
		textColor: {
			type: ControlType.Color,
			title: "Text Color",
			defaultValue: "#000000",
		},
		clientsColor: {
			type: ControlType.Color,
			title: "Clients Color",
			defaultValue: "#3B82F6",
		},
		designColor: {
			type: ControlType.Color,
			title: "Design Color",
			defaultValue: "#3B82F6",
		},
		font: {
			type: ControlType.Font,
			title: "Font",
			controls: "extended",
			defaultFontType: "sans-serif",
			defaultValue: {
				fontSize: "28px",
				variant: "Medium",
				letterSpacing: "-0.01em",
				lineHeight: "1.4em",
				textAlign: "left",
			},
		},
	})