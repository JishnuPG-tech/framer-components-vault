// Kinetic Text Motion - Optimized for performance
import { useEffect, useRef, useState, startTransition, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Type declarations for external libraries
declare const THREE: any
declare const gsap: any
declare const WebFont: any


interface KineticTextMotionProps {
	words: string[]
	font: any
	textColor: string
	background: {
		type: "color" | "image"
		color: string
		image: { src: string; srcSet?: string; alt?: string }
		imageSize: "cover" | "contain" | "fill" | "none"
		showBackground: boolean
	}
	animationSpeed: number
	intervalTime: number
	effectType: "none" | "blur" | "distortion" | "ripple"
	effectIntensity: number
	style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 540
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
function KineticTextMotion(props: KineticTextMotionProps) {
	const {
		words = ["IMAGINE", "ANIMATE", "LAUNCH"],
		font,
		textColor = "#FFFFFF",
		background = {
			type: "color",
			color: "#000000",
			image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Background" },
			imageSize: "cover",
			showBackground: true,
		},
		animationSpeed = 0.8,
		intervalTime = 1.0,
		effectType = "none",
		effectIntensity = 1.0,
	} = props

	// Detect if component is in auto-sizing mode
	const isAutoWidth = props.style?.width !== "100%"
	const isAutoHeight = props.style?.height !== "100%"

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const sceneRef = useRef<{
		scene?: any
		camera?: any
		renderer?: any
		titleMeshes?: any[]
		tweens1?: any[]
		tweens2?: any[]
		tweens3?: any[]
		timeline?: any
		animationFrame?: number
	}>({})
	const isStatic = useIsStaticRenderer()
	const [isLoaded, setIsLoaded] = useState(false)
	const [librariesLoaded, setLibrariesLoaded] = useState(false)
	const fontLoadedRef = useRef(false)

	// Load external libraries
	useEffect(() => {
		if (typeof window === "undefined" || isStatic) {
			startTransition(() => setIsLoaded(true))
			return
		}

		const loadScript = (src: string): Promise<void> => {
			return new Promise((resolve, reject) => {
				const existing = document.querySelector(`script[src="${src}"]`)
				if (existing) {
					resolve()
					return
				}
				const script = document.createElement("script")
				script.src = src
				script.onload = () => resolve()
				script.onerror = reject
				document.head.appendChild(script)
			})
		}

		const loadLibraries = async () => {
			try {
				await Promise.all([
					loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"),
					loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js")
				])
				
				startTransition(() => setLibrariesLoaded(true))
			} catch (error) {
				console.error("Failed to load libraries:", error)
				startTransition(() => setLibrariesLoaded(true))
			}
		}

		loadLibraries()
	}, [isStatic])

	useEffect(() => {
		if (isStatic) {
			startTransition(() => setIsLoaded(true))
			return
		}

		if (typeof window === "undefined" || !canvasRef.current || !librariesLoaded) return
		if (typeof THREE === "undefined" || typeof gsap === "undefined") return

		// Calculate canvas size based on font size to maintain text scale
		const baseFontSize = parseFloat(font?.fontSize || "230") || 230
		const width = 960
		const height = 540
		const aspectRatio = width / height
		const sceneWidth = 2
		const sceneHeight = sceneWidth / aspectRatio

		const titleWidth = 2.0
		const titleHeight = 0.5
		const numDivisions = 40

		const vertexShader = `
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform float time;
			uniform float index;
			uniform float divisions;
			uniform float tOffsetX;
			uniform vec4 tween;
			attribute vec3 position;
			attribute vec2 uv;
			varying vec2 vUv;

			mat2 scale2D(vec2 scale) {
				return mat2(scale.x, 0.0, 0.0, scale.y);
			}

			void main() {
				vUv = uv;
				vec3 pos = position;
				float scaleX = tween.x;
				pos.x += tOffsetX;
				pos.xy *= scale2D(vec2(scaleX, 1.0));
				pos.x -= tOffsetX;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
			}
		`

		const fragmentShader = `
			precision highp float;
			uniform sampler2D texture;
			uniform float time;
			uniform float index;
			uniform float divisions;
			uniform vec4 tween;
			uniform float effectType;
			uniform float effectIntensity;
			varying vec2 vUv;

			void main() {
				vec2 uv = vUv;
				float startV = index * (1.0 / divisions);
				vec2 tuv = vec2(uv.x, startV + uv.y * (1.0 / divisions));
				
				// Effect: Blur
				if (effectType == 1.0) {
					vec4 color = vec4(0.0);
					float blurAmount = 0.003 * effectIntensity;
					for(float x = -2.0; x <= 2.0; x += 1.0) {
						for(float y = -2.0; y <= 2.0; y += 1.0) {
							vec2 offset = vec2(x, y) * blurAmount;
							color += texture2D(texture, tuv + offset);
						}
					}
					gl_FragColor = color / 25.0;
				}
				// Effect: Distortion
				else if (effectType == 2.0) {
					float wave = sin(uv.y * 10.0 + time * 2.0) * 0.02 * effectIntensity;
					tuv.x += wave;
					vec4 color = texture2D(texture, tuv);
					gl_FragColor = color;
				}
				// Effect: Ripple
				else if (effectType == 3.0) {
					vec2 center = vec2(0.5, 0.5);
					float dist = distance(uv, center);
					float ripple = sin(dist * 20.0 - time * 3.0) * 0.02 * effectIntensity;
					tuv += normalize(uv - center) * ripple;
					vec4 color = texture2D(texture, tuv);
					gl_FragColor = color;
				}
				// No effect
				else {
					vec4 color = texture2D(texture, tuv);
					gl_FragColor = color;
				}
			}
		`

		const createFontTexture = (text: string) => {
			const canvas = document.createElement("canvas")
			const canvasWidth = 1024
			const canvasHeight = 256
			canvas.width = canvasWidth
			canvas.height = canvasHeight

			const ctx = canvas.getContext("2d")
			if (!ctx) return null

			const fontSize = font?.fontSize || "230px"
			const fontFamily = font?.fontFamily || "sans-serif"
			const fontWeight = font?.fontWeight || 600
			const fontStyle = font?.fontStyle || "normal"

			ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
			ctx.textAlign = "center"
			ctx.textBaseline = "middle"
			ctx.fillStyle = textColor
			ctx.fillText(text, canvasWidth / 2, canvasHeight / 2 + 25)

			const texture = new THREE.CanvasTexture(canvas)
			texture.minFilter = THREE.LinearFilter
			texture.magFilter = THREE.LinearFilter
			texture.format = THREE.RGBAFormat
			texture.needsUpdate = false

			return texture
		}

		const scene = new THREE.Scene()
		const camera = new THREE.OrthographicCamera(
			-sceneWidth / 2,
			sceneWidth / 2,
			sceneHeight / 2,
			-sceneHeight / 2,
			0.01,
			1000
		)
		camera.position.set(0, 0, 1)

		const renderer = new THREE.WebGLRenderer({
			antialias: false,
			alpha: true,
			canvas: canvasRef.current,
			powerPreference: "high-performance",
		})
		renderer.setSize(width, height)
		renderer.setPixelRatio(1)

		const titleMeshes: any[] = []
		const allTweens: any[][] = []

		const createTitle = (texture: any, tweens: any[]) => {
			if (!texture) return

			for (let i = 0; i < numDivisions; i++) {
				const dividedHeight = titleHeight / numDivisions
				const geometry = new THREE.PlaneGeometry(titleWidth, dividedHeight)
				if (geometry.attributes.normal) {
					geometry.deleteAttribute('normal')
				}

				const effectTypeValue = effectType === "blur" ? 1.0 : effectType === "distortion" ? 2.0 : effectType === "ripple" ? 3.0 : 0.0
				
				const material = new THREE.RawShaderMaterial({
					uniforms: {
						texture: { value: texture },
						time: { value: 0 },
						index: { value: i },
						divisions: { value: numDivisions },
						tOffsetX: { value: -1.0 },
						tween: { value: new THREE.Vector4(0, 0, 1, 1) },
						effectType: { value: effectTypeValue },
						effectIntensity: { value: effectIntensity },
					},
					vertexShader,
					fragmentShader,
					transparent: true,
				})

				const y = -titleHeight * 0.5 + i * dividedHeight + dividedHeight * 0.5
				const mesh = new THREE.Mesh(geometry, material)
				mesh.position.y = y

				scene.add(mesh)
				titleMeshes.push(mesh)
				tweens.push(material.uniforms.tween.value)
			}
		}

		// Create textures and titles for each word
		words.forEach((word) => {
			const texture = createFontTexture(word)
			const tweens: any[] = []
			createTitle(texture, tweens)
			allTweens.push(tweens)
		})

		const setTransformOffset = (titleIndex: number, value: number) => {
			const startIndex = titleIndex * numDivisions
			const endIndex = startIndex + numDivisions
			for (let i = startIndex; i < endIndex; i++) {
				if (titleMeshes[i]) {
					titleMeshes[i].material.uniforms.tOffsetX.value = value
				}
			}
		}

		const timeline = gsap.timeline({
			repeat: -1,
			defaults: {
				ease: "power3.inOut",
				duration: animationSpeed,
				stagger: 0.01,
			},
		})

		let currentPosition = 0

		// Dynamically create timeline animations for each word
		allTweens.forEach((tweens, index) => {
			const isFirst = index === 0
			const isLast = index === allTweens.length - 1
			const currentLabel = isFirst ? "start" : `next${index}`
			const nextLabel = isLast ? undefined : `next${index + 1}`

			// Animate in
			timeline.to(tweens, {
				x: 1.0,
				onStart: () => setTransformOffset(index, -1.0),
			}, currentPosition)

			// Add interval delay before animating out
			currentPosition += animationSpeed + intervalTime

			// Animate out
			timeline.to(tweens, {
				x: 0.0,
				onStart: () => setTransformOffset(index, 1.0),
			}, currentPosition)

			// Update position for next word
			currentPosition += animationSpeed
		})

		let lastTime = 0
		const animate = (currentTime: number) => {
			// Throttle to 60fps max
			if (currentTime - lastTime < 16) {
				sceneRef.current.animationFrame = requestAnimationFrame(animate)
				return
			}
			lastTime = currentTime
			
			const time = currentTime * 0.001
			const len = titleMeshes.length
			for (let i = 0; i < len; i++) {
				titleMeshes[i].material.uniforms.time.value = time
			}
			renderer.render(scene, camera)
			sceneRef.current.animationFrame = requestAnimationFrame(animate)
		}

		sceneRef.current.animationFrame = requestAnimationFrame(animate)
		startTransition(() => setIsLoaded(true))

		sceneRef.current = {
			scene,
			camera,
			renderer,
			titleMeshes,
			timeline,
		}

		return () => {
			if (sceneRef.current.animationFrame) {
				cancelAnimationFrame(sceneRef.current.animationFrame)
			}
			if (sceneRef.current.timeline) {
				sceneRef.current.timeline.kill()
			}
			if (sceneRef.current.titleMeshes) {
				sceneRef.current.titleMeshes.forEach((mesh) => {
					if (mesh.geometry) mesh.geometry.dispose()
					if (mesh.material) {
						if (mesh.material.uniforms?.texture?.value) {
							mesh.material.uniforms.texture.value.dispose()
						}
						mesh.material.dispose()
					}
					if (sceneRef.current.scene) {
						sceneRef.current.scene.remove(mesh)
					}
				})
			}
			if (sceneRef.current.renderer) {
				sceneRef.current.renderer.dispose()
			}
		}
	}, [words, font, textColor, animationSpeed, intervalTime, effectType, effectIntensity, isStatic, librariesLoaded])

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				backgroundColor: background.showBackground && background.type === "color" ? background.color : "transparent",
				backgroundImage: background.showBackground && background.type === "image" ? `url(${background.image?.src || "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg"})` : undefined,
				backgroundSize: background.showBackground && background.type === "image" ? background.imageSize : undefined,
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{isStatic ? (
				<div
					style={{
						...font,
						color: textColor,
						whiteSpace: "nowrap",
					}}
				>
					{words[0] || "IMAGINE"}
				</div>
			) : (
				<canvas
					ref={canvasRef}
					style={{
						width: 960,
						height: 540,
					}}
				/>
			)}
		</div>
	)
}

export default KineticTextMotion

KineticTextMotion.displayName = "Kinetic Text Motion"

addPropertyControls(KineticTextMotion, {
	words: {
		type: ControlType.Array,
		title: "Words",
		description: "Add or remove words to cycle through",
		control: {
			type: ControlType.String,
			defaultValue: "WORD",
		},
		defaultValue: ["IMAGINE", "ANIMATE", "LAUNCH"],
		maxCount: 10,
	},
	font: {
		type: ControlType.Font,
		title: "Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "230px",
			variant: "Semibold",
			letterSpacing: "-0.03em",
			lineHeight: "1em",
		},
	},
	textColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#FFFFFF",
	},
	background: {
		type: ControlType.Object,
		title: "Background",
		controls: {
			showBackground: {
				type: ControlType.Boolean,
				title: "Show Background",
				defaultValue: true,
				enabledTitle: "Show",
				disabledTitle: "Hide",
			},
			type: {
				type: ControlType.Enum,
				title: "Type",
				options: ["color", "image"],
				optionTitles: ["Color", "Image"],
				defaultValue: "color",
				displaySegmentedControl: true,
				hidden: (props) => !props.showBackground,
			},
			color: {
				type: ControlType.Color,
				title: "Color",
				defaultValue: "#000000",
				hidden: (props) => props.type === "image" || !props.showBackground,
			},
			image: {
				type: ControlType.ResponsiveImage,
				title: "Image",
				hidden: (props) => props.type === "color" || !props.showBackground,
			},
			imageSize: {
				type: ControlType.Enum,
				title: "Image Size",
				description: "How the image fits the background",
				options: ["cover", "contain", "fill", "none"],
				optionTitles: ["Cover", "Contain", "Fill", "Actual Size"],
				defaultValue: "cover",
				displaySegmentedControl: false,
				hidden: (props) => props.type === "color" || !props.showBackground,
			},
		},
		defaultValue: {
			showBackground: true,
			type: "color",
			color: "#000000",
			image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Background" },
			imageSize: "cover",
		},
	},
	animationSpeed: {
		type: ControlType.Number,
		title: "Speed",
		description: "How fast each word transitions",
		defaultValue: 0.8,
		min: 0.1,
		max: 3,
		step: 0.1,
		unit: "s",
	},
	intervalTime: {
		type: ControlType.Number,
		title: "Interval",
		description: "Pause between word changes",
		defaultValue: 1.0,
		min: 0,
		max: 5,
		step: 0.1,
		unit: "s",
	},
	effectType: {
		type: ControlType.Enum,
		title: "Effect",
		description: "Visual effect applied to text",
		options: ["none", "blur", "distortion", "ripple"],
		optionTitles: ["None", "Blur", "Distortion", "Ripple"],
		defaultValue: "none",
		displaySegmentedControl: false,
	},
	effectIntensity: {
		type: ControlType.Number,
		title: "Intensity",
		description: "Strength of the visual effect",
		defaultValue: 1.0,
		min: 0,
		max: 3,
		step: 0.1,
		hidden: ({ effectType }) => effectType === "none",
	},
})