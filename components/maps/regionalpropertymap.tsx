// A regional map showing 25 residential properties for sale. Use different colors for 'Available' vs 'Sold' status. Hover should show price and a thumbnail image.
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
	startTransition,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type MouseEvent,
} from "react"
import { motion, useInView } from "framer-motion"

function clamp(v: number, min: number, max: number) {
	return Math.max(min, Math.min(max, v))
}

function getPropertiesSignature(properties: any): string {
	const safe = Array.isArray(properties) ? properties : []
	return safe
		.map((p) => {
			if (!p) return ""
			const id = String(p.id ?? "")
			const x = String(p.x ?? "")
			const y = String(p.y ?? "")
			const status = String(p.status ?? "")
			const price = String(p.price ?? "")
			const thumb = String(p.thumbnail?.src ?? "")
			return `${id}:${x}:${y}:${status}:${price}:${thumb}`
		})
		.join("|")
}

type Status = "Available" | "Sold"

type FramerImage = {
	src: string
	srcSet?: string
	alt?: string
}

type PropertyItem = {
	id: string
	status: Status
	price: string
	x: number // 0..100
	y: number // 0..100
	thumbnail?: FramerImage
}

type Props = {
	mapImage: FramerImage
	properties: PropertyItem[]

	map: {
		fit: "cover" | "contain"
		background: string
	}

	marker: {
		enableDrag: boolean
		availableColor: string
		soldColor: string
		strokeColor: string
		strokeWidth: number
		size: number
		hoverScale: number
	}

	clustering: {
		enabled: boolean
		radius: number
		fill: string
		textColor: string
		size: number
	}

	tooltip: {
		background: string
		textColor: string
		borderColor: string
		borderWidth: number
		radius: string
		padding: string
		shadow: string
		offset: number
		width: number
		imageRadius: string
		imageHeight: number
		font: any
		priceFont: any
	}

	legend: {
		show: boolean
		background: string
		textColor: string
		radius: string
		padding: string
		font: any
	}

	style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function RegionalPropertyMap(props: Props) {
	const {
		mapImage = {
			src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
			alt: "Regional map",
		},
		properties = defaultProperties,
		map = { fit: "contain", background: "#FFFFFF" },
		marker = {
			enableDrag: true,
			availableColor: "#22CC66",
			soldColor: "#FF5588",
			strokeColor: "#FFFFFF",
			strokeWidth: 2,
			size: 18,
			hoverScale: 1.12,
		},
		clustering = { enabled: true, radius: 4, fill: "#000000", textColor: "#FFFFFF", size: 30 },
		tooltip = {
			background: "#FFFFFF",
			textColor: "#000000",
			borderColor: "#EEEEEE",
			borderWidth: 1,
			radius: "12px",
			padding: "12px",
			shadow: "0 16px 40px rgba(0,0,0,0.18)",
			offset: 14,
			width: 220,
			imageRadius: "10px",
			imageHeight: 110,
			font: {
				fontSize: "13px",
				fontWeight: 500,
				letterSpacing: "-0.01em",
				lineHeight: "1.2em",
			},
			priceFont: {
				fontSize: "16px",
				fontWeight: 600,
				letterSpacing: "-0.02em",
				lineHeight: "1.1em",
			},
		},
		legend = {
			show: true,
			background: "#FFFFFF",
			textColor: "#000000",
			radius: "12px",
			padding: "10px",
			font: {
				fontSize: "12px",
				fontWeight: 500,
				letterSpacing: "-0.01em",
				lineHeight: "1em",
			},
		},
		style,
	} = props

	const mapFit = map?.fit ?? "contain"
	const mapBackground = map?.background ?? "#FFFFFF"

	const enableDrag = marker?.enableDrag ?? true
	const availableColor = marker?.availableColor ?? "#22CC66"
	const soldColor = marker?.soldColor ?? "#FF5588"
	const markerStrokeColor = marker?.strokeColor ?? "#FFFFFF"
	const markerStrokeWidth = marker?.strokeWidth ?? 2
	const markerSize = marker?.size ?? 18
	const markerHoverScale = marker?.hoverScale ?? 1.12

	const enableClustering = clustering?.enabled ?? true
	const clusterRadius = clustering?.radius ?? 4
	const clusterFill = clustering?.fill ?? "#000000"
	const clusterTextColor = clustering?.textColor ?? "#FFFFFF"
	const clusterSize = clustering?.size ?? 30

	const tooltipBackground = tooltip?.background ?? "#FFFFFF"
	const tooltipTextColor = tooltip?.textColor ?? "#000000"
	const tooltipBorderColor = tooltip?.borderColor ?? "#EEEEEE"
	const tooltipBorderWidth = tooltip?.borderWidth ?? 1
	const tooltipRadius = tooltip?.radius ?? "12px"
	const tooltipPadding = tooltip?.padding ?? "12px"
	const tooltipShadow = tooltip?.shadow ?? "0 16px 40px rgba(0,0,0,0.18)"
	const tooltipOffset = tooltip?.offset ?? 14
	const tooltipWidth = tooltip?.width ?? 220
	const tooltipImageRadius = tooltip?.imageRadius ?? "10px"
	const tooltipImageHeight = tooltip?.imageHeight ?? 110
	const tooltipFont = tooltip?.font
	const priceFont = tooltip?.priceFont

	const showLegend = legend?.show ?? true
	const legendBackground = legend?.background ?? "#FFFFFF"
	const legendTextColor = legend?.textColor ?? "#000000"
	const legendRadius = legend?.radius ?? "12px"
	const legendPadding = legend?.padding ?? "10px"
	const legendFont = legend?.font

	const isStatic = useIsStaticRenderer()
	const containerRef = useRef<HTMLDivElement>(null)
	const inView = useInView(containerRef, { margin: "200px 0px 200px 0px", amount: 0.15 })

	const [hoveredId, setHoveredId] = useState<string | null>(null)
	const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null)
	const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
	const [draggingId, setDraggingId] = useState<string | null>(null)
	const lastPropertiesSignature = useRef<string>(getPropertiesSignature(properties))
	const propertiesSignature = useMemo(() => getPropertiesSignature(properties), [properties])
	const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
		const safe = Array.isArray(properties) ? properties : []
		const next: Record<string, { x: number; y: number }> = {}
		for (const p of safe) {
			if (!p?.id) continue
			next[p.id] = {
				x: clamp(Number(p.x ?? 0), 0, 100),
				y: clamp(Number(p.y ?? 0), 0, 100),
			}
		}
		return next
	})

	useEffect(() => {
		if (draggingId) return
		if (lastPropertiesSignature.current === propertiesSignature) return
		const safe = Array.isArray(properties) ? properties : []
		const next: Record<string, { x: number; y: number }> = {}
		for (const p of safe) {
			if (!p?.id) continue
			next[p.id] = {
				x: clamp(Number(p.x ?? 0), 0, 100),
				y: clamp(Number(p.y ?? 0), 0, 100),
			}
		}
		startTransition(() => setPositions(next))
		lastPropertiesSignature.current = propertiesSignature
	}, [properties, propertiesSignature, draggingId])

	const updatePositionPercentFromEvent = useCallback(
		(id: string, clientX: number, clientY: number) => {
			if (!containerRef.current) return
			const rect = containerRef.current.getBoundingClientRect()
			const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
			const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)
			startTransition(() =>
				setPositions((prev) => ({
					...prev,
					[id]: { x, y },
				})),
			)
		},
		[],
	)

	useEffect(() => {
		if (isStatic || !inView) return
		if (!draggingId) return

		const onMove = (e: PointerEvent) => {
			updatePositionPercentFromEvent(draggingId, e.clientX, e.clientY)
		}
		const onUp = () => {
			startTransition(() => setDraggingId(null))
		}

		window.addEventListener("pointermove", onMove, { passive: true })
		window.addEventListener("pointerup", onUp)
		window.addEventListener("pointercancel", onUp)
		return () => {
			window.removeEventListener("pointermove", onMove)
			window.removeEventListener("pointerup", onUp)
			window.removeEventListener("pointercancel", onUp)
		}
	}, [draggingId, inView, isStatic, updatePositionPercentFromEvent])

	const hovered = useMemo(() => {
		if (!hoveredId) return null
		return properties?.find((p) => p?.id === hoveredId) ?? null
	}, [hoveredId, properties])

	const hoveredThumb = useMemo<FramerImage>(() => {
		const fallback = defaultThumb2
		const src = hovered?.thumbnail?.src
		if (!src) return fallback
		return hovered.thumbnail ?? fallback
	}, [hovered])

	const setHover = useCallback((id: string | null) => {
		startTransition(() => setHoveredId(id))
	}, [])

	const updateMouseFromEvent = useCallback((clientX: number, clientY: number) => {
		if (!containerRef.current) return
		const rect = containerRef.current.getBoundingClientRect()
		const x = clamp(clientX - rect.left, 0, rect.width)
		const y = clamp(clientY - rect.top, 0, rect.height)
		startTransition(() => setMouse({ x, y }))
	}, [])

	const onMouseMove = useCallback(
		(e: MouseEvent<HTMLDivElement>) => {
			if (isStatic || !inView) return
			updateMouseFromEvent(e.clientX, e.clientY)
		},
		[isStatic, inView, updateMouseFromEvent]
	)

	useEffect(() => {
		if (!inView) {
			if (hoveredId) setHover(null)
			return
		}
	}, [inView, hoveredId, setHover])

	const markerByStatus = useCallback(
		(status: Status) => {
			return status === "Sold" ? soldColor : availableColor
		},
		[availableColor, soldColor]
	)

	const markerAriaLabel = useCallback((p: PropertyItem) => {
		const status = p.status
		return `Property ${p.id}. Status: ${status}. Price: ${p.price}.`
	}, [])

	const tooltipPosition = useMemo(() => {
		if (!mouse || !containerRef.current) return null
		const rect = containerRef.current.getBoundingClientRect()

		const pad = 8
		const desiredX = mouse.x + tooltipOffset
		const desiredY = mouse.y + tooltipOffset

		const maxX = rect.width - tooltipWidth - pad
		const maxY = rect.height - (tooltipImageHeight + 90) - pad

		return {
			left: clamp(desiredX, pad, Math.max(pad, maxX)),
			top: clamp(desiredY, pad, Math.max(pad, maxY)),
		}
	}, [mouse, tooltipOffset, tooltipWidth, tooltipImageHeight])

	const markers = useMemo(() => {
		const safe = Array.isArray(properties) ? properties : []

		type MarkerNode = {
			type: "property"
			key: string
			items: PropertyItem[]
			x: number
			y: number
		}

		const itemsWithPos = safe
			.filter(Boolean)
			.map((p) => {
				const pos = positions?.[p.id]
				const x = clamp(Number(pos?.x ?? p.x ?? 0), 0, 100)
				const y = clamp(Number(pos?.y ?? p.y ?? 0), 0, 100)
				return { p, x, y }
			})

		const r = clamp(Number(clusterRadius ?? 0), 0, 50)
		const shouldCluster = enableClustering && !draggingId && r > 0

		const nodes: Array<
			| ({ type: "cluster"; key: string; items: PropertyItem[]; x: number; y: number } & { count: number })
			| MarkerNode
		> = []

		if (!shouldCluster) {
			for (const it of itemsWithPos) {
				nodes.push({ type: "property", key: it.p.id, items: [it.p], x: it.x, y: it.y })
			}
		} else {
			const visited = new Set<string>()
			for (const it of itemsWithPos) {
				if (visited.has(it.p.id)) continue
				const cluster: Array<typeof it> = []
				const queue: Array<typeof it> = [it]
				visited.add(it.p.id)
				while (queue.length) {
					const cur = queue.pop()!
					cluster.push(cur)
					for (const other of itemsWithPos) {
						if (visited.has(other.p.id)) continue
						const dx = other.x - cur.x
						const dy = other.y - cur.y
						if (dx * dx + dy * dy <= r * r) {
							visited.add(other.p.id)
							queue.push(other)
						}
					}
				}

				if (cluster.length <= 1) {
					const single = cluster[0]
					nodes.push({ type: "property", key: single.p.id, items: [single.p], x: single.x, y: single.y })
					continue
				}

				let cx = 0
				let cy = 0
				for (const c of cluster) {
					cx += c.x
					cy += c.y
				}
				cx /= cluster.length
				cy /= cluster.length

				const ids = cluster.map((c) => c.p.id).sort()
				const key = ids.join("-")
				nodes.push({ type: "cluster", key, items: cluster.map((c) => c.p), x: cx, y: cy, count: cluster.length })
			}
		}

		return nodes.map((node) => {
			if (node.type === "cluster") {
				const isExpanded = expandedClusterKey === node.key
				return (
					<div key={node.key} style={{ position: "absolute", left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)", pointerEvents: "auto" }}>
						<motion.button
							type="button"
							aria-label={`Cluster of ${node.count} properties`}
							onClick={
								isStatic
									? undefined
									: () => {
											startTransition(() => setExpandedClusterKey(isExpanded ? null : node.key))
										}
							}
							onPointerMove={
								isStatic
									? undefined
									: (e) => {
											// @ts-ignore
											const ev = e?.nativeEvent
											const cx = ev?.clientX
											const cy = ev?.clientY
											if (typeof cx === "number" && typeof cy === "number") updateMouseFromEvent(cx, cy)
										}
							}
							animate={
								isStatic || !inView
									? undefined
									: { scale: isExpanded ? 1.08 : 1 }
							}
							transition={isStatic ? undefined : { type: "spring", stiffness: 500, damping: 34, mass: 0.7 }}
							style={{
								width: clusterSize,
								height: clusterSize,
								borderRadius: 999,
								border: `${markerStrokeWidth}px solid ${markerStrokeColor}`,
								background: clusterFill,
								padding: 0,
								cursor: isStatic ? "default" : "pointer",
								outline: "none",
								boxShadow: "0 10px 22px rgba(0,0,0,0.2)",
								display: "grid",
								placeItems: "center",
								pointerEvents: "auto",
								WebkitTapHighlightColor: "transparent",
								color: clusterTextColor,
								fontSize: 12,
								fontWeight: 700,
								lineHeight: 1,
								userSelect: "none",
							}}
						>
							<span aria-hidden="true">{node.count}</span>
						</motion.button>

						{isExpanded && (
							<div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
								{node.items.map((p, idx) => {
									const n = Math.max(1, node.items.length)
									const a = (idx / n) * Math.PI * 2
									const spread = clamp(r * 0.6, 1.1, 3.2)
									const x = 50 + Math.cos(a) * spread
									const y = 50 + Math.sin(a) * spread
									const pos = positions?.[p.id]
									const px = clamp(Number(pos?.x ?? p.x ?? 0), 0, 100)
									const py = clamp(Number(pos?.y ?? p.y ?? 0), 0, 100)
									const ox = (x - 50)
									const oy = (y - 50)
									const rx = clamp(px + ox, 0, 100)
									const ry = clamp(py + oy, 0, 100)

									const fill = markerByStatus(p.status)
									const isHovered = hoveredId === p.id
									const isDragging = draggingId === p.id

									return (
										<motion.button
											key={p.id}
											type="button"
											aria-label={markerAriaLabel(p)}
											onMouseEnter={isStatic ? undefined : () => setHover(p.id)}
											onMouseLeave={isStatic ? undefined : () => setHover(null)}
											onFocus={isStatic ? undefined : () => setHover(p.id)}
											onBlur={isStatic ? undefined : () => setHover(null)}
											onPointerDown={
												isStatic || !enableDrag
													? undefined
													: (e) => {
															// @ts-ignore
															const ev = e?.nativeEvent
															const cx = ev?.clientX
															const cy = ev?.clientY
															if (typeof cx === "number" && typeof cy === "number") {
																startTransition(() => setDraggingId(p.id))
																updatePositionPercentFromEvent(p.id, cx, cy)
																setHover(p.id)
															}
														}
											}
											onPointerEnter={isStatic ? undefined : () => setHover(p.id)}
											onPointerLeave={isStatic ? undefined : () => setHover(null)}
											onPointerMove={
												isStatic
													? undefined
													: (e) => {
															// @ts-ignore
															const ev = e?.nativeEvent
															const cx = ev?.clientX
															const cy = ev?.clientY
															if (typeof cx === "number" && typeof cy === "number") updateMouseFromEvent(cx, cy)
														}
											}
											animate={
												isStatic || !inView
													? undefined
													: { scale: isHovered ? markerHoverScale : 1 }
											}
											transition={isStatic ? undefined : { type: "spring", stiffness: 500, damping: 30, mass: 0.6 }}
											style={{
												position: "absolute",
												left: `${rx}%`,
												top: `${ry}%`,
												transform: "translate(-50%, -50%)",
												width: markerSize,
												height: markerSize,
												borderRadius: 999,
												border: `${markerStrokeWidth}px solid ${markerStrokeColor}`,
												background: fill,
												padding: 0,
												cursor: isStatic ? "default" : enableDrag ? (isDragging ? "grabbing" : "grab") : "pointer",
												outline: "none",
												boxShadow: "0 8px 16px rgba(0,0,0,0.18)",
												display: "grid",
												placeItems: "center",
												WebkitTapHighlightColor: "transparent",
											}}
										>
											<span
												aria-hidden="true"
												style={{
													width: Math.max(4, Math.round(markerSize * 0.28)),
													height: Math.max(4, Math.round(markerSize * 0.28)),
													borderRadius: 999,
													background: "rgba(255,255,255,0.95)",
													boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
												}}
											/>
										</motion.button>
									)
								})}
							</div>
						)}
					</div>
				)
			}

			const p = node.items[0]
			const pos = positions?.[p.id]
			const x = clamp(Number(pos?.x ?? p.x ?? 0), 0, 100)
			const y = clamp(Number(pos?.y ?? p.y ?? 0), 0, 100)
			// Collapse expanded clusters if the hovered marker is not part of them anymore
			// (keeps UI consistent when properties list changes)

			return (
				<motion.button
					key={p.id}
					type="button"
					aria-label={markerAriaLabel(p)}
					onMouseEnter={isStatic ? undefined : () => setHover(p.id)}
					onMouseLeave={isStatic ? undefined : () => setHover(null)}
					onFocus={isStatic ? undefined : () => setHover(p.id)}
					onBlur={isStatic ? undefined : () => setHover(null)}
					onPointerDown={
						isStatic || !enableDrag
							? undefined
							: (e) => {
									// @ts-ignore
									const ev = e?.nativeEvent
									const cx = ev?.clientX
									const cy = ev?.clientY
									if (typeof cx === "number" && typeof cy === "number") {
										startTransition(() => setDraggingId(p.id))
										updatePositionPercentFromEvent(p.id, cx, cy)
										setHover(p.id)
									}
							  }
					}
					onPointerEnter={isStatic ? undefined : () => setHover(p.id)}
					onPointerLeave={isStatic ? undefined : () => setHover(null)}
					onPointerMove={
						isStatic
							? undefined
							: (e) => {
									// @ts-ignore
									const ev = e?.nativeEvent
									const cx = ev?.clientX
									const cy = ev?.clientY
									if (typeof cx === "number" && typeof cy === "number") {
										updateMouseFromEvent(cx, cy)
									}
							  }
					}
					animate={
						isStatic || !inView
							? undefined
							: {
									scale: hoveredId === p.id ? markerHoverScale : 1,
							  }
					}
					transition={isStatic ? undefined : { type: "spring", stiffness: 500, damping: 30, mass: 0.6 }}
					style={{
						position: "absolute",
						left: `${x}%`,
						top: `${y}%`,
						transform: "translate(-50%, -50%)",
						width: markerSize,
						height: markerSize,
						borderRadius: 999,
						border: `${markerStrokeWidth}px solid ${markerStrokeColor}`,
						background: markerByStatus(p.status),
						padding: 0,
						cursor: isStatic ? "default" : enableDrag ? (draggingId === p.id ? "grabbing" : "grab") : "pointer",
						outline: "none",
						boxShadow: "0 8px 16px rgba(0,0,0,0.18)",
						display: "grid",
						placeItems: "center",
						pointerEvents: "auto",
						WebkitTapHighlightColor: "transparent",
					}}
				>
					<span
						aria-hidden="true"
						style={{
							width: Math.max(4, Math.round(markerSize * 0.28)),
							height: Math.max(4, Math.round(markerSize * 0.28)),
							borderRadius: 999,
							background: "rgba(255,255,255,0.95)",
							boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
						}}
					/>
				</motion.button>
			)
		})
	}, [
		properties,
		positions,
		markerByStatus,
		hoveredId,
		draggingId,
		isStatic,
		inView,
		markerSize,
		markerStrokeColor,
		markerStrokeWidth,
		markerHoverScale,
		markerAriaLabel,
		setHover,
		updateMouseFromEvent,
		enableDrag,
		updatePositionPercentFromEvent,
		enableClustering,
		clusterRadius,
		clusterFill,
		clusterTextColor,
		clusterSize,
		expandedClusterKey,
	])

	const showTooltip = !isStatic && inView && hovered && tooltipPosition && !draggingId

	return (
		<div
			ref={containerRef}
			onMouseMove={onMouseMove}
			onMouseLeave={
				isStatic
					? undefined
					: () => {
							setHover(null)
							startTransition(() => setMouse(null))
					  }
			}
			style={{
				...style,
				position: "relative",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				borderRadius: 12,
				background: mapBackground,
				userSelect: draggingId ? "none" : "none",
				pointerEvents: "auto",
			}}
			role="region"
			aria-label="Regional map of properties"
		>
			<img
				src={mapImage?.src}
				srcSet={mapImage?.srcSet}
				alt={mapImage?.alt ?? "Map"}
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					objectFit: mapFit,
					filter: "saturate(1.02) contrast(1.02)",
				}}
				draggable={false}
			/>

			<div
				style={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
				}}
			>
				{markers}
			</div>

			{showLegend && (
				<div
					style={{
						position: "absolute",
						left: 12,
						bottom: 12,
						background: legendBackground,
						color: legendTextColor,
						borderRadius: legendRadius,
						padding: legendPadding,
						boxShadow: "0 10px 26px rgba(0,0,0,0.14)",
						display: "flex",
						gap: 10,
						alignItems: "center",
						...legendFont,
					}}
					aria-label="Map legend"
				>
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						<span
							aria-hidden="true"
							style={{
								width: 10,
								height: 10,
								borderRadius: 999,
								background: availableColor,
								border: `1px solid ${markerStrokeColor}`,
							}}
						/>
						<span style={{ whiteSpace: "nowrap" }}>Available</span>
					</div>
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						<span
							aria-hidden="true"
							style={{
								width: 10,
								height: 10,
								borderRadius: 999,
								background: soldColor,
								border: `1px solid ${markerStrokeColor}`,
							}}
						/>
						<span style={{ whiteSpace: "nowrap" }}>Sold</span>
					</div>
				</div>
			)}

			{showTooltip && hovered && tooltipPosition && (
				<div
					role="tooltip"
					aria-label={`Price ${hovered.price}`}
					style={{
						position: "absolute",
						left: tooltipPosition.left,
						top: tooltipPosition.top,
						width: tooltipWidth,
						background: tooltipBackground,
						color: tooltipTextColor,
						border: `${tooltipBorderWidth}px solid ${tooltipBorderColor}`,
						borderRadius: tooltipRadius,
						padding: tooltipPadding,
						boxShadow: tooltipShadow,
						pointerEvents: "none",
						backdropFilter: "blur(8px)",
						WebkitBackdropFilter: "blur(8px)",
					}}
				>
					<img
						src={hoveredThumb?.src}
						srcSet={hoveredThumb?.srcSet}
						alt={hoveredThumb?.alt ?? ""}
						style={{
							width: "100%",
							height: tooltipImageHeight,
							objectFit: "cover",
							borderRadius: tooltipImageRadius,
							display: "block",
							marginBottom: 10,
						}}
						draggable={false}
					/>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
							<span style={{ ...tooltipFont, opacity: 0.9 }}>Property {hovered.id}</span>
							<span
								style={{
									width: 10,
									height: 10,
									borderRadius: 999,
									background: markerByStatus(hovered.status),
									border: `1px solid ${markerStrokeColor}`,
									flex: "0 0 auto",
								}}
								aria-hidden="true"
							/>
						</div>
						<div style={{ ...priceFont }}>{hovered.price}</div>
						<div style={{ ...tooltipFont, opacity: 0.8 }}>{hovered.status}</div>
					</div>
				</div>
			)}
		</div>
	)
}

const defaultThumb1 = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Property thumbnail" }
const defaultThumb2 = { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Property thumbnail" }
const defaultThumb3 = { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Property thumbnail" }
const defaultThumb4 = { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Property thumbnail" }
const defaultThumb5 = { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Property thumbnail" }

const defaultProperties: PropertyItem[] = [
	{ id: "01", status: "Available", price: "$425,000", x: 18, y: 22, thumbnail: defaultThumb1 },
	{ id: "02", status: "Sold", price: "$389,000", x: 26, y: 18, thumbnail: defaultThumb2 },
	{ id: "03", status: "Available", price: "$515,000", x: 34, y: 26, thumbnail: defaultThumb3 },
	{ id: "04", status: "Available", price: "$610,000", x: 42, y: 20, thumbnail: defaultThumb4 },
	{ id: "05", status: "Sold", price: "$472,000", x: 51, y: 24, thumbnail: defaultThumb5 },

	{ id: "06", status: "Available", price: "$699,000", x: 62, y: 19, thumbnail: defaultThumb2 },
	{ id: "07", status: "Sold", price: "$350,000", x: 72, y: 26, thumbnail: defaultThumb3 },
	{ id: "08", status: "Available", price: "$540,000", x: 80, y: 22, thumbnail: defaultThumb4 },
	{ id: "09", status: "Available", price: "$465,000", x: 86, y: 32, thumbnail: defaultThumb5 },
	{ id: "10", status: "Sold", price: "$410,000", x: 76, y: 38, thumbnail: defaultThumb1 },

	{ id: "11", status: "Available", price: "$785,000", x: 64, y: 40, thumbnail: defaultThumb2 },
	{ id: "12", status: "Available", price: "$595,000", x: 52, y: 36, thumbnail: defaultThumb3 },
	{ id: "13", status: "Sold", price: "$445,000", x: 40, y: 40, thumbnail: defaultThumb4 },
	{ id: "14", status: "Available", price: "$520,000", x: 30, y: 38, thumbnail: defaultThumb5 },
	{ id: "15", status: "Sold", price: "$375,000", x: 20, y: 44, thumbnail: defaultThumb1 },

	{ id: "16", status: "Available", price: "$640,000", x: 16, y: 56, thumbnail: defaultThumb2 },
	{ id: "17", status: "Sold", price: "$330,000", x: 26, y: 58, thumbnail: defaultThumb3 },
	{ id: "18", status: "Available", price: "$458,000", x: 36, y: 54, thumbnail: defaultThumb4 },
	{ id: "19", status: "Available", price: "$505,000", x: 46, y: 58, thumbnail: defaultThumb5 },
	{ id: "20", status: "Sold", price: "$392,000", x: 56, y: 54, thumbnail: defaultThumb1 },

	{ id: "21", status: "Available", price: "$720,000", x: 66, y: 60, thumbnail: defaultThumb2 },
	{ id: "22", status: "Sold", price: "$405,000", x: 78, y: 56, thumbnail: defaultThumb3 },
	{ id: "23", status: "Available", price: "$560,000", x: 86, y: 52, thumbnail: defaultThumb4 },
	{ id: "24", status: "Sold", price: "$360,000", x: 74, y: 70, thumbnail: defaultThumb5 },
	{ id: "25", status: "Available", price: "$615,000", x: 54, y: 72, thumbnail: defaultThumb1 },
]

const defaultPropertiesForControls = defaultProperties.map(({ thumbnail, ...rest }) => rest)

addPropertyControls(RegionalPropertyMap, {
	mapImage: {
		type: ControlType.ResponsiveImage,
		title: "Map Image",
	},

	map: {
		type: ControlType.Object,
		title: "Map",
		controls: {
			fit: {
				type: ControlType.Enum,
				title: "Fit",
				options: ["cover", "contain"],
				optionTitles: ["Cover", "Contain"],
				defaultValue: "contain",
				displaySegmentedControl: true,
			},
			background: {
				type: ControlType.Color,
				title: "Background",
				defaultValue: "#FFFFFF",
			},
		},
		defaultValue: {
			fit: "contain",
			background: "#FFFFFF",
		},
	},

	properties: {
		type: ControlType.Array,
		title: "Properties",
		maxCount: 50,
		defaultValue: defaultPropertiesForControls,
		control: {
			type: ControlType.Object,
			controls: {
				id: { type: ControlType.String, title: "ID", defaultValue: "01" },
				status: {
					type: ControlType.Enum,
					title: "Status",
					options: ["Available", "Sold"],
					optionTitles: ["Available", "Sold"],
					defaultValue: "Available",
					displaySegmentedControl: true,
				},
				price: { type: ControlType.String, title: "Price", defaultValue: "$425,000" },
				x: { type: ControlType.Number, title: "X", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
				y: { type: ControlType.Number, title: "Y", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
				thumbnail: { type: ControlType.ResponsiveImage, title: "Thumbnail" },
			},
		},
	},

	marker: {
		type: ControlType.Object,
		title: "Markers",
		controls: {
			enableDrag: {
				type: ControlType.Boolean,
				title: "Drag",
				defaultValue: true,
				enabledTitle: "On",
				disabledTitle: "Off",
			},
			availableColor: { type: ControlType.Color, title: "Available", defaultValue: "#22CC66" },
			soldColor: { type: ControlType.Color, title: "Sold", defaultValue: "#FF5588" },
			strokeColor: { type: ControlType.Color, title: "Stroke", defaultValue: "#FFFFFF" },
			strokeWidth: { type: ControlType.Number, title: "Stroke W", defaultValue: 2, min: 0, max: 8, step: 1, unit: "px" },
			size: { type: ControlType.Number, title: "Size", defaultValue: 18, min: 10, max: 40, step: 1, unit: "px" },
			hoverScale: { type: ControlType.Number, title: "Hover Scale", defaultValue: 1.12, min: 1, max: 1.6, step: 0.01 },
		},
		defaultValue: {
			enableDrag: true,
			availableColor: "#22CC66",
			soldColor: "#FF5588",
			strokeColor: "#FFFFFF",
			strokeWidth: 2,
			size: 18,
			hoverScale: 1.12,
		},
	},

	clustering: {
		type: ControlType.Object,
		title: "Clustering",
		controls: {
			enabled: {
				type: ControlType.Boolean,
				title: "Enabled",
				defaultValue: true,
				enabledTitle: "On",
				disabledTitle: "Off",
			},
			radius: {
				type: ControlType.Number,
				title: "Radius",
				defaultValue: 4,
				min: 0,
				max: 15,
				step: 0.5,
				unit: "%",
				hidden: ({ enabled }) => !enabled,
			},
			fill: {
				type: ControlType.Color,
				title: "Fill",
				defaultValue: "#000000",
				hidden: ({ enabled }) => !enabled,
			},
			textColor: {
				type: ControlType.Color,
				title: "Text",
				defaultValue: "#FFFFFF",
				hidden: ({ enabled }) => !enabled,
			},
			size: {
				type: ControlType.Number,
				title: "Size",
				defaultValue: 30,
				min: 18,
				max: 60,
				step: 1,
				unit: "px",
				hidden: ({ enabled }) => !enabled,
			},
		},
		defaultValue: {
			enabled: true,
			radius: 4,
			fill: "#000000",
			textColor: "#FFFFFF",
			size: 30,
		},
	},

	tooltip: {
		type: ControlType.Object,
		title: "Tooltip",
		controls: {
			background: { type: ControlType.Color, title: "BG", defaultValue: "#FFFFFF" },
			textColor: { type: ControlType.Color, title: "Text", defaultValue: "#000000" },
			borderColor: { type: ControlType.Color, title: "Border", defaultValue: "#EEEEEE" },
			borderWidth: { type: ControlType.Number, title: "Border W", defaultValue: 1, min: 0, max: 6, step: 1, unit: "px" },
			radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "12px" },
			padding: { type: ControlType.Padding, title: "Padding", defaultValue: "12px" },
			shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0 16px 40px rgba(0,0,0,0.18)" },
			offset: { type: ControlType.Number, title: "Offset", defaultValue: 14, min: 0, max: 60, step: 1, unit: "px" },
			width: { type: ControlType.Number, title: "Width", defaultValue: 220, min: 160, max: 360, step: 1, unit: "px" },
			imageHeight: { type: ControlType.Number, title: "Img H", defaultValue: 110, min: 60, max: 200, step: 1, unit: "px" },
			imageRadius: { type: ControlType.BorderRadius, title: "Img R", defaultValue: "10px" },
			font: {
				type: ControlType.Font,
				title: "Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "13px",
					variant: "Medium",
					letterSpacing: "-0.01em",
					lineHeight: "1.2em",
				},
			},
			priceFont: {
				type: ControlType.Font,
				title: "Price Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "16px",
					variant: "Semibold",
					letterSpacing: "-0.02em",
					lineHeight: "1.1em",
				},
			},
		},
		defaultValue: {
			background: "#FFFFFF",
			textColor: "#000000",
			borderColor: "#EEEEEE",
			borderWidth: 1,
			radius: "12px",
			padding: "12px",
			shadow: "0 16px 40px rgba(0,0,0,0.18)",
			offset: 14,
			width: 220,
			imageRadius: "10px",
			imageHeight: 110,
		},
	},

	legend: {
		type: ControlType.Object,
		title: "Legend",
		controls: {
			show: { type: ControlType.Boolean, title: "Show", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
			background: { type: ControlType.Color, title: "BG", defaultValue: "#FFFFFF", hidden: ({ show }) => !show },
			textColor: { type: ControlType.Color, title: "Text", defaultValue: "#000000", hidden: ({ show }) => !show },
			radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "12px", hidden: ({ show }) => !show },
			padding: { type: ControlType.Padding, title: "Padding", defaultValue: "10px", hidden: ({ show }) => !show },
			font: {
				type: ControlType.Font,
				title: "Font",
				controls: "extended",
				defaultFontType: "sans-serif",
				defaultValue: {
					fontSize: "12px",
					variant: "Medium",
					letterSpacing: "-0.01em",
					lineHeight: "1em",
				},
				hidden: ({ show }) => !show,
			},
		},
		defaultValue: {
			show: true,
			background: "#FFFFFF",
			textColor: "#000000",
			radius: "12px",
			padding: "10px",
		},
	},
})