import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue } from "framer-motion"
import {
    DEFAULT_DESK,
    DEFAULT_DROP,
    DEFAULT_GRAB,
    DEFAULT_ITEMS,
    DEFAULT_SHELF,
    SLOT_LAYOUTS,
} from "./Desk_data.tsx"
import { ARRANGE_DESK_CONTROLS } from "./Desk_controls.tsx"
import {
    clamp,
    getBreakpoint,
    useDragSounds,
    useElementSize,
} from "./Desk_utils.tsx"
import type {
    ArrangeDeskProps,
    Breakpoint,
    DeskItemControl,
    Layout,
    PositionOverride,
} from "./Desk_types.tsx"

type DeskObjectProps = {
    id: string
    item: DeskItemControl
    layout: Layout
    zIndex: number
    settled: boolean
    wobbleEnabled: boolean
    isStaticRenderer: boolean

    stageWidth: number
    stageHeight: number
    stageRef: React.RefObject<HTMLDivElement>

    onSelect: () => void
    onMove: (position: PositionOverride) => void

    playGrab: () => void
    playDrop: () => void
}

function DeskObject({
    id,
    item,
    layout,
    zIndex,
    settled,
    wobbleEnabled,
    isStaticRenderer,
    stageWidth,
    stageHeight,
    stageRef,
    onSelect,
    onMove,
    playGrab,
    playDrop,
}: DeskObjectProps) {
    const [isDragging, setIsDragging] = React.useState(false)

    const scale = item.scale ?? 1

    const width = layout.w * scale
    const height = layout.h * scale

    const initialX = layout.xPct * stageWidth
    const initialY = layout.yPct * stageHeight

    const x = useMotionValue(initialX)
    const y = useMotionValue(initialY)

    React.useEffect(() => {
        if (isDragging) return

        x.set(initialX)
        y.set(initialY)
    }, [initialX, initialY, isDragging, x, y])

    const seed = id
        .split("")
        .reduce((total, character) => total + character.charCodeAt(0), 0)

    const wobbleX = ((seed % 5) - 2) * 1.3
    const wobbleY = (((seed + 3) % 5) - 2) * 1.3
    const wobbleRotate = (((seed + 7) % 5) - 2) * 0.5
    const duration = 4 + (seed % 4) * 0.5

    const shouldWobble =
        !isStaticRenderer && wobbleEnabled && !settled && !isDragging

    const fallback = SLOT_LAYOUTS[item.slot].image
    const image = item.image?.src || fallback

    // Framer Canvas / export: render a plain static element.
    // This intentionally skips drag, wobble, Motion transitions, and sounds.
    if (isStaticRenderer) {
        return (
            <div
                style={{
                    position: "absolute",
                    left: initialX,
                    top: initialY,
                    width,
                    height,
                    zIndex,
                    userSelect: "none",
                    pointerEvents: "none",
                    transform: `rotate(${item.rotate ?? 0}deg)`,
                    transformOrigin: "50% 50%",
                }}
            >
                <img
                    src={image}
                    srcSet={item.image?.srcSet}
                    alt={item.image?.alt || item.label}
                    draggable={false}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        pointerEvents: "none",
                    }}
                />
            </div>
        )
    }

    return (
        <motion.div
            drag
            dragConstraints={stageRef}
            dragElastic={0}
            dragMomentum={false}
            onPointerDown={onSelect}
            onDragStart={() => {
                setIsDragging(true)
                playGrab()
            }}
            onDragEnd={() => {
                setIsDragging(false)
                playDrop()

                if (!stageWidth || !stageHeight) return

                const maxX = Math.max(0, stageWidth - width)
                const maxY = Math.max(0, stageHeight - height)

                const finalX = clamp(x.get(), 0, maxX)
                const finalY = clamp(y.get(), 0, maxY)

                x.set(finalX)
                y.set(finalY)

                onMove({
                    xPct: finalX / stageWidth,
                    yPct: finalY / stageHeight,
                })
            }}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                x,
                y,
                width,
                height,
                zIndex,
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
                touchAction: "none",
            }}
        >
            <motion.div
                animate={
                    shouldWobble
                        ? {
                              x: [0, wobbleX, 0, -wobbleX, 0],
                              y: [0, -wobbleY, 0, wobbleY, 0],
                              rotate: [
                                  item.rotate ?? 0,
                                  (item.rotate ?? 0) + wobbleRotate,
                                  item.rotate ?? 0,
                                  (item.rotate ?? 0) - wobbleRotate,
                                  item.rotate ?? 0,
                              ],
                          }
                        : {
                              x: 0,
                              y: 0,
                              rotate: item.rotate ?? 0,
                          }
                }
                transition={
                    shouldWobble
                        ? {
                              duration,
                              repeat: Infinity,
                              ease: "easeInOut",
                          }
                        : {
                              duration: 0.15,
                              ease: "easeOut",
                          }
                }
                style={{
                    width: "100%",
                    height: "100%",
                }}
            >
                <img
                    src={image}
                    srcSet={item.image?.srcSet}
                    alt={item.image?.alt || item.label}
                    draggable={false}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        pointerEvents: "none",
                    }}
                />
            </motion.div>
        </motion.div>
    )
}

type InfoPanelProps = {
    activeItem: DeskItemControl | null
    hasSelected: boolean
    prompt: string
    breakpoint: Breakpoint
    showPrompt: boolean
    panelColor: string
    promptColor: string
    textColor: string
    onClose: () => void
    isStaticRenderer: boolean
}

function InfoPanel({
    activeItem,
    hasSelected,
    prompt,
    breakpoint,
    showPrompt,
    panelColor,
    promptColor,
    textColor,
    onClose,
    isStaticRenderer,
}: InfoPanelProps) {
    const mobile = breakpoint === "mobile"

    const showDetail = Boolean(activeItem?.detail)
    const showInitialPrompt = showPrompt && !hasSelected

    if (!showDetail && !showInitialPrompt) return null

    const content = showDetail ? (
        <div
            style={{
                padding: 16,
                borderRadius: 14,
                background: panelColor,
                color: textColor,
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 14,
                            lineHeight: 1.2,
                            fontWeight: 650,
                        }}
                    >
                        {activeItem?.label}
                    </div>

                    <div
                        style={{
                            marginTop: 8,
                            fontSize: 14,
                            lineHeight: 1.5,
                            opacity: 0.75,
                        }}
                    >
                        {activeItem?.detail}
                    </div>
                </div>

                {!isStaticRenderer && (
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        style={{
                            appearance: "none",
                            border: 0,
                            background: "transparent",
                            color: "inherit",
                            cursor: "pointer",
                            fontSize: 18,
                            lineHeight: 1,
                            padding: 0,
                            opacity: 0.6,
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    ) : (
        <div
            style={{
                padding: mobile ? "9px 11px" : "11px 13px",
                borderRadius: mobile ? 8 : 12,
                background: promptColor,
                color: textColor,
                fontSize: 14,
                lineHeight: 1.4,
            }}
        >
            {prompt}
        </div>
    )

    return (
        <div
            style={{
                position: "absolute",
                zIndex: 1000,

                ...(mobile
                    ? showDetail
                        ? {
                              right: 16,
                              top: 16,
                              width: "min(340px, calc(100% - 32px))",
                          }
                        : {
                              bottom: 16,
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: "min(340px, calc(100% - 32px))",
                          }
                    : {
                          right: breakpoint === "desktop" ? 32 : 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 320,
                      }),
            }}
        >
            {isStaticRenderer ? (
                <div>{content}</div>
            ) : (
                <motion.div
                    key={activeItem?.slot ?? "prompt"}
                    initial={
                        mobile
                            ? {
                                  opacity: 0,
                                  x: 30,
                              }
                            : {
                                  opacity: 0,
                              }
                    }
                    animate={{
                        opacity: 1,
                        x: 0,
                    }}
                    transition={{
                        duration: 0.25,
                        ease: "easeOut",
                    }}
                >
                    {content}
                </motion.div>
            )}
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 */
export default function ArrangeMyDesk(props: ArrangeDeskProps) {
    const {
        title = "Arrange my desk",
        prompt = "Click an object to learn more. Drag the items to arrange the desk.",

        deskImage,
        shelfImage,

        items = DEFAULT_ITEMS,

        showDesk = true,
        showShelf = true,
        showPrompt = true,
        showDetails = true,
        wobble = true,
        sounds = true,
        dots = true,

        grabSound = DEFAULT_GRAB,
        dropSound = DEFAULT_DROP,

        backgroundColor = "#FFFFFF",
        textColor = "#111111",
        panelColor = "rgba(253, 230, 138, 0.96)",
        promptColor = "rgba(254, 243, 199, 0.9)",

        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const stageRef = React.useRef<HTMLDivElement>(null)
    const sceneRef = React.useRef<HTMLDivElement>(null)

    const stageSize = useElementSize(stageRef)
    const breakpoint = getBreakpoint(stageSize.width)

    const maxSceneHeight = breakpoint === "mobile" ? 580 : 700
    const sceneHeight =
        stageSize.height > 0
            ? Math.min(stageSize.height, maxSceneHeight)
            : maxSceneHeight

    const [activeId, setActiveId] = React.useState<string | null>(null)
    const [hasSelected, setHasSelected] = React.useState(false)

    const [settled, setSettled] = React.useState<Record<string, boolean>>({})
    const [zIndexes, setZIndexes] = React.useState<Record<string, number>>({})
    const [positions, setPositions] = React.useState<
        Record<string, Partial<Record<Breakpoint, PositionOverride>>>
    >({})

    const itemSignature = React.useMemo(
        () =>
            JSON.stringify(
                items.map((item) => ({
                    slot: item.slot,
                    label: item.label,
                    detail: item.detail,
                    image: item.image?.src,
                    scale: item.scale,
                    rotate: item.rotate,
                }))
            ),
        [items]
    )

    React.useEffect(() => {
        setActiveId(null)
        setHasSelected(false)
        setSettled({})
        setPositions({})

        const nextZ: Record<string, number> = {}

        items.forEach((item, index) => {
            const id = `${item.slot}-${index}`
            nextZ[id] = SLOT_LAYOUTS[item.slot]?.z ?? index + 1
        })

        setZIndexes(nextZ)
    }, [itemSignature])

    React.useEffect(() => {
        if (isStaticRenderer || breakpoint !== "mobile" || !activeId) return

        const timeout = window.setTimeout(() => {
            setActiveId(null)
        }, 4000)

        return () => window.clearTimeout(timeout)
    }, [activeId, breakpoint, isStaticRenderer])

    const audio = useDragSounds(
        !isStaticRenderer && sounds,
        grabSound,
        dropSound
    )

    const activeItem = React.useMemo(() => {
        if (!activeId) return null

        const index = Number(activeId.split("-").at(-1))
        if (!Number.isFinite(index)) return null

        return items[index] ?? null
    }, [activeId, items])

    function bringToFront(id: string) {
        setZIndexes((current) => {
            const existing = Object.values(current)
            const max = existing.length ? Math.max(...existing) : 1

            return {
                ...current,
                [id]: max + 1,
            }
        })
    }

    function selectItem(id: string) {
        setHasSelected(true)

        setSettled((current) => ({
            ...current,
            [id]: true,
        }))

        bringToFront(id)

        if (showDetails) {
            setActiveId(id)
        }
    }

    const deskSource = deskImage?.src || DEFAULT_DESK
    const shelfSource = shelfImage?.src || DEFAULT_SHELF

    const deskWidth =
        breakpoint === "desktop"
            ? "50%"
            : breakpoint === "tablet"
              ? "90%"
              : "100%"

    const shelfWidth =
        breakpoint === "desktop" ? 350 : breakpoint === "tablet" ? 250 : 180

    const headingSize =
        breakpoint === "desktop" ? 48 : breakpoint === "tablet" ? 38 : 30

    return (
        <div
            onPointerDown={isStaticRenderer ? undefined : audio.unlock}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 420,
                overflow: "hidden",
                backgroundColor,
                color: textColor,
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                backgroundImage: dots
                    ? "radial-gradient(rgba(0,0,0,0.13) 1px, transparent 1px)"
                    : undefined,
                backgroundSize: dots ? "16px 16px" : undefined,
                ...style,
            }}
        >
            <div
                ref={stageRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: 420,
                    overflow: "hidden",
                }}
            >
                <div
                    ref={sceneRef}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: sceneHeight,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 900,
                            top:
                                breakpoint === "desktop"
                                    ? 64
                                    : breakpoint === "tablet"
                                      ? 44
                                      : 28,
                            left: "50%",
                            width: "90%",
                            transform: "translateX(-50%)",
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                textAlign: "center",
                                fontSize: headingSize,
                                lineHeight: 1,
                                fontWeight: 700,
                                letterSpacing: "-0.035em",
                                textTransform: "uppercase",
                                color: textColor,
                            }}
                        >
                            {title}
                        </div>
                    </div>

                    <InfoPanel
                        activeItem={activeItem}
                        hasSelected={hasSelected}
                        prompt={prompt}
                        breakpoint={breakpoint}
                        showPrompt={showPrompt}
                        panelColor={panelColor}
                        promptColor={promptColor}
                        textColor={textColor}
                        onClose={() => setActiveId(null)}
                        isStaticRenderer={isStaticRenderer}
                    />

                    {showDesk && (
                        <img
                            src={deskSource}
                            srcSet={deskImage?.srcSet}
                            alt={deskImage?.alt || "Desk"}
                            draggable={false}
                            style={{
                                position: "absolute",
                                pointerEvents: "none",
                                bottom: breakpoint === "desktop" ? -80 : 0,
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: deskWidth,
                                maxWidth: "none",
                                height: "auto",
                                objectFit: "contain",
                                zIndex: 0,
                            }}
                        />
                    )}

                    {showShelf && (
                        <img
                            src={shelfSource}
                            srcSet={shelfImage?.srcSet}
                            alt={shelfImage?.alt || "Shelf"}
                            draggable={false}
                            style={{
                                position: "absolute",
                                pointerEvents: "none",
                                left: 0,
                                top: breakpoint === "tablet" ? "40%" : "50%",
                                transform: "translateY(-50%)",
                                width: shelfWidth,
                                height: "auto",
                                objectFit: "contain",
                                zIndex: 0,
                            }}
                        />
                    )}

                    {items.map((item, index) => {
                        const id = `${item.slot}-${index}`

                        const slot =
                            SLOT_LAYOUTS[item.slot] ?? SLOT_LAYOUTS.plant

                        const defaultLayout = slot[breakpoint]
                        const override = positions[id]?.[breakpoint]

                        const layout: Layout = {
                            ...defaultLayout,
                            ...(override ?? {}),
                        }

                        return (
                            <DeskObject
                                key={id}
                                id={id}
                                item={item}
                                layout={layout}
                                zIndex={zIndexes[id] ?? slot.z}
                                settled={Boolean(settled[id])}
                                wobbleEnabled={wobble}
                                isStaticRenderer={isStaticRenderer}
                                stageWidth={stageSize.width}
                                stageHeight={sceneHeight}
                                stageRef={sceneRef}
                                onSelect={() => selectItem(id)}
                                onMove={(position) => {
                                    setPositions((current) => ({
                                        ...current,
                                        [id]: {
                                            ...current[id],
                                            [breakpoint]: position,
                                        },
                                    }))
                                }}
                                playGrab={audio.playGrab}
                                playDrop={audio.playDrop}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

ArrangeMyDesk.defaultProps = {
    title: "Arrange my desk",
    prompt: "Click an object to learn more. Drag the items to arrange the desk.",
    items: DEFAULT_ITEMS,

    showDesk: true,
    showShelf: true,
    showPrompt: true,
    showDetails: true,

    wobble: true,
    sounds: true,
    dots: true,

    backgroundColor: "#FFFFFF",
    textColor: "#111111",
    panelColor: "rgba(253, 230, 138, 0.96)",
    promptColor: "rgba(254, 243, 199, 0.9)",
}

addPropertyControls(ArrangeMyDesk, ARRANGE_DESK_CONTROLS)
