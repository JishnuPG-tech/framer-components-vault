import { useState, useEffect, useMemo, useRef, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface InventoryItem {
	name: string
	weight: string
}

interface PipBoyProps {
	pipColor: string
	bgDark: string
	hpCurrent: number
	hpMax: number
	apCurrent: number
	apMax: number
	showHazardSymbol: boolean
	inventoryItems: InventoryItem[]
	showRadar: boolean
	radarText: string
	showVisualizer: boolean
	chassisColor: string
	borderColor: string
	scanlineOpacity: number
	glowIntensity: number
	fontSize: number
	borderRadius: number
	padding: number
}

/**
 * Pip-Boy Terminal Interface
 * A Fallout-inspired CRT terminal with interactive tabs, scanlines, and retro animations.
 *
 * @framerIntrinsicWidth 650
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PipBoy(props: PipBoyProps) {
	const isStatic = useIsStaticRenderer()
	const {
		pipColor = "#1aff40",
		bgDark = "#020a02",
		hpCurrent = 348,
		hpMax = 450,
		apCurrent = 67,
		apMax = 67,
		showHazardSymbol = true,
		inventoryItems = [
			{ name: "Stimpak (12)", weight: "0.5" },
			{ name: "10mm Pistol", weight: "4.0" },
			{ name: "Nuka-Cola Quantum", weight: "1.0" },
			{ name: "RadAway (5)", weight: "0.5" },
			{ name: "Power Armor Core", weight: "3.0" },
		],
		showRadar = true,
		radarText = "SEARCHING SATELLITE...",
		showVisualizer = true,
		chassisColor = "#1a1a1a",
		borderColor = "#444",
		scanlineOpacity = 0.25,
		glowIntensity = 0.6,
		fontSize = 14,
		borderRadius = 32,
		padding = 40,
	} = props

	const [activeTab, setActiveTab] = useState<"stat" | "inv" | "data">("stat")
	const [mounted, setMounted] = useState(false)
	const [blinkColon, setBlinkColon] = useState(true)
	const [currentTime, setCurrentTime] = useState<string>("")
	const [currentDate, setCurrentDate] = useState<string>("")
	const [selectedItemIndex, setSelectedItemIndex] = useState(0)
	const inventoryRef = useRef<HTMLUListElement>(null)
	const [isInventoryFocused, setIsInventoryFocused] = useState(false)

	useEffect(() => {
		startTransition(() => setMounted(true))
	}, [])

	useEffect(() => {
		if (isStatic) return
		const updateTime = () => {
			const now = new Date()
			const hours = String(now.getHours()).padStart(2, "0")
			const minutes = String(now.getMinutes()).padStart(2, "0")
			const dateStr = now.toLocaleDateString()
			startTransition(() => {
				setCurrentTime(`${hours}:${minutes}`)
				setCurrentDate(dateStr)
			})
		}
		updateTime()
		const interval = setInterval(updateTime, 1000)
		return () => clearInterval(interval)
	}, [isStatic])

	useEffect(() => {
		if (isStatic) return
		const interval = setInterval(() => {
			setBlinkColon((prev) => !prev)
		}, 1000)
		return () => clearInterval(interval)
	}, [isStatic])

	const handleInventoryKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault()
			startTransition(() => {
				setSelectedItemIndex((prev) => Math.min(prev + 1, inventoryItems.length - 1))
			})
		} else if (e.key === "ArrowUp") {
			e.preventDefault()
			startTransition(() => {
				setSelectedItemIndex((prev) => Math.max(prev - 1, 0))
			})
		} else if (e.key === "Home") {
			e.preventDefault()
			startTransition(() => setSelectedItemIndex(0))
		} else if (e.key === "End") {
			e.preventDefault()
			startTransition(() => setSelectedItemIndex(inventoryItems.length - 1))
		}
	}

	const pipGlow = useMemo(() => {
		const hex = pipColor.replace("#", "")
		const r = parseInt(hex.substring(0, 2), 16)
		const g = parseInt(hex.substring(2, 4), 16)
		const b = parseInt(hex.substring(4, 6), 16)
		return `rgba(${r}, ${g}, ${b}, ${glowIntensity})`
	}, [pipColor, glowIntensity])

	const tabTitles: Record<string, string> = {
		stat: "SYS_STATUS",
		inv: "INVENTORY",
		data: "DATA_LINK",
	}

	const handleTabChange = (tab: "stat" | "inv" | "data") => {
		startTransition(() => {
			setActiveTab(tab)
			setSelectedItemIndex(0)
		})
	}

	const screwPositions = [
		{ top: 15, left: 15, rotate: 45 },
		{ top: 15, right: 15, rotate: 135 },
		{ bottom: 15, left: 15, rotate: 225 },
		{ bottom: 15, right: 15, rotate: 315 },
	]

	const containerStyle: React.CSSProperties = {
		width: "100%",
		height: "100%",
		fontFamily: '"Courier New", Courier, monospace',
		textTransform: "uppercase",
		boxSizing: "border-box",
		position: "relative",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		padding: "1rem",
	}

	const chassisStyle: React.CSSProperties = {
		position: "relative",
		width: "100%",
		height: "100%",
		backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(135deg, #2b2b2b, #111, #222)`,
		backgroundSize: "3px 3px, 100% 100%",
		padding: `${padding}px`,
		borderRadius: `${borderRadius}px`,
		boxShadow: `inset 0 0 20px #000, 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 2px #333, 0 5px 15px ${pipGlow}`,
		border: `2px solid ${borderColor}`,
		boxSizing: "border-box",
	}

	const crtScreenStyle: React.CSSProperties = {
		backgroundColor: bgDark,
		borderRadius: "24px",
		position: "relative",
		overflow: "hidden",
		border: "8px solid #0a0a0a",
		boxShadow: "inset 0 0 60px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 0.8)",
		width: "100%",
		height: "100%",
		cursor: "crosshair",
	}

	const screenGlassStyle: React.CSSProperties = {
		position: "absolute",
		inset: 0,
		zIndex: 10,
		pointerEvents: "none",
		background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.4) 80%)",
		boxShadow: "inset 0 0 50px rgba(0, 0, 0, 0.9)",
	}

	const scanlinesStyle: React.CSSProperties = {
		position: "absolute",
		inset: 0,
		zIndex: 9,
		pointerEvents: "none",
		background: `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, ${scanlineOpacity}) 50%)`,
		backgroundSize: "100% 4px",
	}

	const bootSequenceStyle: React.CSSProperties = {
		height: "100%",
		padding: "1.5rem",
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		color: pipColor,
		textShadow: `0 0 4px ${pipGlow}`,
		opacity: isStatic ? 1 : (mounted ? 1 : 0),
		transform: isStatic ? "scale(1, 1)" : (mounted ? "scale(1, 1)" : "scale(1, 0.005)"),
		transition: isStatic ? "none" : "all 1.2s cubic-bezier(0.23, 1, 0.32, 1)",
		fontSize: `${fontSize}px`,
	}

	const topBarStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		fontSize: "0.9rem",
		fontWeight: "bold",
		marginBottom: "1.5rem",
	}

	const bottomBarStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		fontSize: "0.9rem",
		fontWeight: "bold",
		marginTop: "auto",
	}

	const lineStyle: React.CSSProperties = {
		height: "2px",
		backgroundColor: pipColor,
		boxShadow: `0 0 8px ${pipGlow}`,
		opacity: 0.8,
		flexGrow: 1,
		margin: "0 10px",
	}

	const navItemBaseStyle: React.CSSProperties = {
		padding: "4px 10px",
		cursor: "pointer",
		border: "1px solid transparent",
		transition: "all 0.2s",
	}

	const getNavItemStyle = (tab: "stat" | "inv" | "data"): React.CSSProperties => ({
		...navItemBaseStyle,
		backgroundColor: activeTab === tab ? pipColor : "transparent",
		color: activeTab === tab ? bgDark : pipColor,
		textShadow: activeTab === tab ? "none" : `0 0 4px ${pipGlow}`,
		boxShadow: activeTab === tab ? `0 0 10px ${pipGlow}` : "none",
	})

	const middleSectionStyle: React.CSSProperties = {
		flexGrow: 1,
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
	}

	const contentStatStyle: React.CSSProperties = {
		display: activeTab === "stat" ? "flex" : "none",
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
		height: "100%",
	}

	const sideMenuStyle: React.CSSProperties = {
		display: "flex",
		flexDirection: "column",
		gap: "10px",
		fontSize: "1rem",
	}

	const activeBoxStyle: React.CSSProperties = {
		border: `2px solid ${pipColor}`,
		padding: "2px 8px",
		boxShadow: `inset 0 0 10px ${pipGlow}`,
	}

	const clockDisplayStyle: React.CSSProperties = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
	}

	const terminalBlockStyle: React.CSSProperties = {
		backgroundColor: pipColor,
		borderRadius: "6px",
		padding: "10px 20px",
		marginBottom: "5px",
		boxShadow: `0 0 25px ${pipGlow}`,
	}

	const timeStyle: React.CSSProperties = {
		color: bgDark,
		fontSize: "4rem",
		fontWeight: "bold",
		textShadow: "none",
		filter: "drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))",
	}

	const dateStyle: React.CSSProperties = {
		fontSize: "1.2rem",
		fontWeight: "bold",
		letterSpacing: "2px",
	}

	const rightMenuStyle: React.CSSProperties = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "10px",
	}

	const hazardSymbolStyle: React.CSSProperties = {
		width: "50px",
		height: "50px",
		position: "relative",
		background: `conic-gradient(${pipColor} 0deg 60deg, transparent 60deg 120deg, ${pipColor} 120deg 180deg, transparent 180deg 240deg, ${pipColor} 240deg 300deg, transparent 300deg 360deg)`,
		borderRadius: "50%",
		boxShadow: `0 0 15px ${pipGlow}`,
		transform: isStatic ? "rotate(45deg)" : undefined,
	}

	const hazardCoreStyle: React.CSSProperties = {
		position: "absolute",
		inset: "10px",
		background: bgDark,
		borderRadius: "50%",
	}

	const hazardCoreAfterStyle: React.CSSProperties = {
		content: '""',
		position: "absolute",
		inset: "6px",
		background: pipColor,
		borderRadius: "50%",
	}

	const contentInvStyle: React.CSSProperties = {
		display: activeTab === "inv" ? "flex" : "none",
		flexDirection: "column",
		fontSize: "1rem",
		width: "100%",
		justifyContent: "flex-start",
		overflow: "hidden",
	}

	const inventoryListStyle: React.CSSProperties = {
		listStyle: "none",
		padding: 0,
		margin: 0,
		width: "100%",
		overflowY: "auto",
		maxHeight: "200px",
	}

	const getInventoryItemStyle = (index: number): React.CSSProperties => ({
		display: "flex",
		justifyContent: "space-between",
		padding: "6px",
		borderBottom: `1px dashed ${pipGlow}`,
		cursor: "pointer",
		backgroundColor: index === selectedItemIndex ? pipColor : "transparent",
		color: index === selectedItemIndex ? bgDark : pipColor,
		fontWeight: index === selectedItemIndex ? "bold" : "normal",
		textShadow: index === selectedItemIndex ? "none" : `0 0 4px ${pipGlow}`,
		boxShadow: index === selectedItemIndex ? `0 0 10px ${pipGlow}` : "none",
		outline: "none",
	})

	const contentDataStyle: React.CSSProperties = {
		display: activeTab === "data" ? "flex" : "none",
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "column",
		gap: "15px",
	}

	const radarContainerStyle: React.CSSProperties = {
		position: "relative",
		width: "160px",
		height: "160px",
		background: pipGlow.replace(/[\d.]+\)$/, "0.1)"),
		borderRadius: "50%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		boxShadow: `inset 0 0 20px ${pipGlow}`,
		border: `2px solid ${pipColor}`,
	}

	const radarInnerStyle: React.CSSProperties = {
		position: "absolute",
		inset: "20px",
		background: pipGlow.replace(/[\d.]+\)$/, "0.15)"),
		borderRadius: "50%",
		border: `1px dashed ${pipGlow}`,
	}

	const radarCenterStyle: React.CSSProperties = {
		position: "absolute",
		width: "50px",
		height: "50px",
		background: pipGlow.replace(/[\d.]+\)$/, "0.25)"),
		borderRadius: "50%",
		border: `1px solid ${pipColor}`,
	}

	const radarSweepStyle: React.CSSProperties = {
		position: "absolute",
		top: "50%",
		left: "50%",
		width: "100%",
		height: "100%",
		background: "transparent",
		transformOrigin: "top left",
		boxShadow: `6px -100px 40px -30px ${pipColor}`,
		borderTop: `2px solid ${pipColor}`,
		zIndex: 2,
		transform: isStatic ? "rotate(45deg)" : undefined,
	}

	const blipStyle: React.CSSProperties = {
		position: "absolute",
		width: "6px",
		height: "6px",
		background: "#fff",
		borderRadius: "50%",
		top: "35px",
		left: "100px",
		boxShadow: `0 0 10px #fff, 0 0 20px ${pipColor}`,
		zIndex: 3,
		opacity: isStatic ? 1 : undefined,
	}

	const radarTextStyle: React.CSSProperties = {
		fontSize: "1rem",
		fontWeight: "bold",
		letterSpacing: "2px",
	}

	const radioVisualizerStyle: React.CSSProperties = {
		display: "flex",
		gap: "3px",
		alignItems: "flex-end",
		height: "15px",
		marginLeft: "10px",
	}

	const getBarStyle = (height: number): React.CSSProperties => ({
		width: "4px",
		backgroundColor: pipColor,
		height: isStatic ? `${height}px` : "3px",
	})

	const statsInfoStyle: React.CSSProperties = {
		display: "flex",
		gap: "12px",
	}

	const pulseIconStyle: React.CSSProperties = {
		opacity: 0.7,
	}

	const flickerTextStyle: React.CSSProperties = {
		letterSpacing: "1px",
	}

	const flickerFastStyle: React.CSSProperties = {
		letterSpacing: "2px",
	}

	return (
		<div style={containerStyle}>
			<style>{`
				@keyframes eqBounce {
					0% { height: 3px; }
					100% { height: 15px; }
				}
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.3; }
				}
				@keyframes flicker {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.8; }
				}
				@keyframes radarSpin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
				@keyframes blipFade {
					0%, 85% { opacity: 0; }
					90% { opacity: 1; transform: scale(1.5); }
					100% { opacity: 0; }
				}
				@keyframes blockPulse {
					0% { box-shadow: 0 0 15px ${pipGlow}; }
					100% { box-shadow: 0 0 35px ${pipGlow}; }
				}
				/* Custom Pip-Boy Scrollbar */
				.pip-scroll::-webkit-scrollbar {
					width: 8px;
				}
				.pip-scroll::-webkit-scrollbar-track {
					background: ${bgDark};
					border-radius: 4px;
					border: 1px solid ${pipGlow};
					box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.5);
				}
				.pip-scroll::-webkit-scrollbar-thumb {
					background: ${pipColor};
					border-radius: 4px;
					box-shadow: 0 0 8px ${pipGlow};
					border: 1px solid ${pipGlow};
				}
				.pip-scroll::-webkit-scrollbar-thumb:hover {
					background: ${pipColor};
					box-shadow: 0 0 12px ${pipGlow};
				}
				.pip-scroll::-webkit-scrollbar-corner {
					background: ${bgDark};
				}
				/* Firefox scrollbar */
				.pip-scroll {
					scrollbar-width: thin;
					scrollbar-color: ${pipColor} ${bgDark};
				}
			`}</style>

			<div style={chassisStyle}>
				{screwPositions.map((pos, i) => {
					const { rotate, ...positionProps } = pos
					return (
						<div
							key={i}
							style={{
								position: "absolute",
								width: "14px",
								height: "14px",
								background: "linear-gradient(45deg, #555, #111)",
								borderRadius: "50%",
								border: "1px solid #000",
								boxShadow: "inset 1px 1px 2px rgba(255, 255, 255, 0.2)",
								...positionProps,
								transform: `rotate(${rotate}deg)`,
							}}
						>
							<div
								style={{
									position: "absolute",
									top: "50%",
									left: "50%",
									width: "10px",
									height: "2px",
									background: "#000",
									transform: "translate(-50%, -50%) rotate(45deg)",
								}}
							/>
						</div>
					)
				})}

				<div style={crtScreenStyle}>
					<div style={screenGlassStyle} />
					<div style={scanlinesStyle} />

					<div style={bootSequenceStyle}>
						<header style={topBarStyle}>
							<div style={flickerTextStyle}>{tabTitles[activeTab]}</div>
							<div style={lineStyle} />
							<div style={statsInfoStyle}>
								<span>
									HP <span style={{ fontWeight: 900 }}>{hpCurrent}/{hpMax}</span>
								</span>
								<span>
									AP <span style={{ fontWeight: 900 }}>{apCurrent}/{apMax}</span>
								</span>
								<span style={pulseIconStyle}>⚡</span>
							</div>
						</header>

						<main style={middleSectionStyle}>
							<AnimatePresence mode="wait">
								{activeTab === "stat" && (
									<motion.div
										key="stat"
										initial={isStatic ? undefined : { opacity: 0, y: -2 }}
										animate={{ opacity: 1, y: 0 }}
										exit={isStatic ? undefined : { opacity: 0, y: 2 }}
										transition={{ duration: 0.3 }}
										style={contentStatStyle}
									>
										<aside style={sideMenuStyle}>
											<div>CND</div>
											<div>RAD</div>
											<div>EFF</div>
											<div style={activeBoxStyle}>CLK</div>
										</aside>

										<section style={clockDisplayStyle}>
											<motion.div
												style={terminalBlockStyle}
												animate={isStatic ? undefined : {
													boxShadow: [
														`0 0 15px ${pipGlow}`,
														`0 0 35px ${pipGlow}`,
														`0 0 15px ${pipGlow}`,
													],
												}}
												transition={{
													duration: 4,
													repeat: Infinity,
													repeatType: "reverse",
												}}
											>
												<div style={timeStyle}>
													{currentTime ? currentTime.split(":")[0] : "--"}
													<span style={{ opacity: blinkColon ? 1 : 0 }}>:</span>
													{currentTime ? currentTime.split(":")[1] : "--"}
												</div>
											</motion.div>
											<div style={dateStyle}>{currentDate}</div>
										</section>

										{showHazardSymbol && (
											<aside style={rightMenuStyle}>
												<motion.div
													style={hazardSymbolStyle}
													animate={isStatic ? undefined : { rotate: 360 }}
													transition={{
														duration: 8,
														repeat: Infinity,
														ease: "linear",
													}}
												>
													<div style={hazardCoreStyle}>
														<div style={hazardCoreAfterStyle} />
													</div>
												</motion.div>
												<div style={{ fontSize: "1rem", fontWeight: "bold", letterSpacing: "2px" }}>
													RADS
												</div>
											</aside>
										)}
									</motion.div>
								)}

								{activeTab === "inv" && (
									<motion.div
										key="inv"
										initial={isStatic ? undefined : { opacity: 0, y: -2 }}
										animate={{ opacity: 1, y: 0 }}
										exit={isStatic ? undefined : { opacity: 0, y: 2 }}
										transition={{ duration: 0.3 }}
										style={contentInvStyle}
									>
										<ul ref={inventoryRef} style={inventoryListStyle} className="pip-scroll" tabIndex={0} role="listbox" aria-label="Inventory Items">
											{inventoryItems.map((item, index) => (
												<li
													key={index}
													style={getInventoryItemStyle(index)}
													onClick={() => startTransition(() => setSelectedItemIndex(index))}
													role="option"
													aria-selected={index === selectedItemIndex}
													tabIndex={-1}
												>
													<span>{item.name}</span>
													<span>WGT {item.weight}</span>
												</li>
											))}
										</ul>
									</motion.div>
								)}

								{activeTab === "data" && (
									<motion.div
										key="data"
										initial={isStatic ? undefined : { opacity: 0, y: -2 }}
										animate={{ opacity: 1, y: 0 }}
										exit={isStatic ? undefined : { opacity: 0, y: 2 }}
										transition={{ duration: 0.3 }}
										style={contentDataStyle}
									>
										{showRadar && (
											<div style={radarContainerStyle}>
												<div style={radarInnerStyle} />
												<div style={radarCenterStyle} />
												<motion.div
													style={radarSweepStyle}
													animate={isStatic ? undefined : { rotate: 360 }}
													transition={{
														duration: 2,
														repeat: Infinity,
														ease: "linear",
													}}
												/>
												<motion.div
													style={blipStyle}
													animate={isStatic ? undefined : { opacity: [0, 1, 0], scale: [1, 1.5, 1] }}
													transition={{
														duration: 2,
														repeat: Infinity,
														times: [0, 0.9, 1],
													}}
												/>
											</div>
										)}
										<div style={{ ...flickerFastStyle, ...radarTextStyle }}>{radarText}</div>
									</motion.div>
								)}
							</AnimatePresence>
						</main>

						<footer style={bottomBarStyle}>
							<div
								style={getNavItemStyle("stat")}
								onClick={() => handleTabChange("stat")}
								onMouseEnter={(e) => {
									if (activeTab !== "stat") {
										e.currentTarget.style.backgroundColor = pipGlow.replace(
											/[\d.]+\)$/,
											"0.15)"
										)
									}
								}}
								onMouseLeave={(e) => {
									if (activeTab !== "stat") {
										e.currentTarget.style.backgroundColor = "transparent"
									}
								}}
							>
								STAT
							</div>
							<div style={lineStyle} />
							<div
								style={getNavItemStyle("inv")}
								onClick={() => handleTabChange("inv")}
								onMouseEnter={(e) => {
									if (activeTab !== "inv") {
										e.currentTarget.style.backgroundColor = pipGlow.replace(
											/[\d.]+\)$/,
											"0.15)"
										)
									}
								}}
								onMouseLeave={(e) => {
									if (activeTab !== "inv") {
										e.currentTarget.style.backgroundColor = "transparent"
									}
								}}
							>
								INV
							</div>
							<div style={lineStyle} />
							<div
								style={getNavItemStyle("data")}
								onClick={() => handleTabChange("data")}
								onMouseEnter={(e) => {
									if (activeTab !== "data") {
										e.currentTarget.style.backgroundColor = pipGlow.replace(
											/[\d.]+\)$/,
											"0.15)"
										)
									}
								}}
								onMouseLeave={(e) => {
									if (activeTab !== "data") {
										e.currentTarget.style.backgroundColor = "transparent"
									}
								}}
							>
								DATA
							</div>
							<div style={lineStyle} />

							{showVisualizer && (
								<div style={radioVisualizerStyle}>
									<div style={getBarStyle(0.1)} />
									<div style={getBarStyle(0.3)} />
									<div style={getBarStyle(0)} />
									<div style={getBarStyle(0.4)} />
								</div>
							)}
						</footer>
					</div>
				</div>
			</div>
		</div>
	)
}

addPropertyControls(PipBoy, {
	pipColor: {
		type: ControlType.Color,
		title: "Pip-Boy Color",
		defaultValue: "#1aff40",
	},
	bgDark: {
		type: ControlType.Color,
		title: "Screen Background",
		defaultValue: "#020a02",
	},
	chassisColor: {
		type: ControlType.Color,
		title: "Chassis Color",
		defaultValue: "#1a1a1a",
	},
	borderColor: {
		type: ControlType.Color,
		title: "Border Color",
		defaultValue: "#444",
	},
	hpCurrent: {
		type: ControlType.Number,
		title: "HP Current",
		defaultValue: 348,
		min: 0,
		max: 999,
		step: 1,
	},
	hpMax: {
		type: ControlType.Number,
		title: "HP Max",
		defaultValue: 450,
		min: 1,
		max: 999,
		step: 1,
	},
	apCurrent: {
		type: ControlType.Number,
		title: "AP Current",
		defaultValue: 67,
		min: 0,
		max: 999,
		step: 1,
	},
	apMax: {
		type: ControlType.Number,
		title: "AP Max",
		defaultValue: 67,
		min: 1,
		max: 999,
		step: 1,
	},
	showHazardSymbol: {
		type: ControlType.Boolean,
		title: "Show Hazard Symbol",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	showRadar: {
		type: ControlType.Boolean,
		title: "Show Radar",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	radarText: {
		type: ControlType.String,
		title: "Radar Text",
		defaultValue: "SEARCHING SATELLITE...",
	},
	showVisualizer: {
		type: ControlType.Boolean,
		title: "Show Audio Visualizer",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	scanlineOpacity: {
		type: ControlType.Number,
		title: "Scanline Opacity",
		defaultValue: 0.25,
		min: 0,
		max: 1,
		step: 0.05,
	},
	glowIntensity: {
		type: ControlType.Number,
		title: "Glow Intensity",
		defaultValue: 0.6,
		min: 0,
		max: 1,
		step: 0.05,
	},
	fontSize: {
		type: ControlType.Number,
		title: "Font Size",
		defaultValue: 14,
		min: 10,
		max: 24,
		step: 1,
		unit: "px",
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Border Radius",
		defaultValue: 32,
		min: 8,
		max: 64,
		step: 1,
		unit: "px",
	},
	padding: {
		type: ControlType.Number,
		title: "Chassis Padding",
		defaultValue: 40,
		min: 16,
		max: 80,
		step: 4,
		unit: "px",
	},
	inventoryItems: {
		type: ControlType.Array,
		title: "Inventory Items",
		control: {
			type: ControlType.Object,
			controls: {
				name: { type: ControlType.String, defaultValue: "Item Name" },
				weight: { type: ControlType.String, defaultValue: "1.0" },
			},
		},
		defaultValue: [
			{ name: "Stimpak (12)", weight: "0.5" },
			{ name: "10mm Pistol", weight: "4.0" },
			{ name: "Nuka-Cola Quantum", weight: "1.0" },
			{ name: "RadAway (5)", weight: "0.5" },
			{ name: "Power Armor Core", weight: "3.0" },
		],
	},
})
