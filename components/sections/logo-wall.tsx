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
import { useState, useEffect, useRef } from "react"

const FADE_DURATION = 2.5

const shuffleArray = (array) => {
    let currentIndex = array.length,
        randomIndex
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--
        ;[array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ]
    }
    return array
}

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function LogoWall(props) {
    const { slides = [], rows = 2, columns = 3, gap = 40, interval = 3 } = props

    const totalSlots = rows * columns
    const currentTarget = RenderTarget.current()
    const isStatic =
        currentTarget === RenderTarget.canvas ||
        currentTarget === RenderTarget.export
    const hasContent = slides && slides.length > 0
    const timerRef = useRef(null)

    const slotBag = useRef([])
    const lastSwappedSlot = useRef(null)
    const prevLayout = useRef({ rows, columns })
    const [visibleIndices, setVisibleIndices] = useState(() => {
        if (!hasContent) return []
        return Array.from({ length: totalSlots }).map((_, i) => ({
            id: `initial-${i}`,
            logoIndex: i % slides.length,
        }))
    })

    useEffect(() => {
        if (isStatic || !hasContent || slides.length <= totalSlots) return

        const swapLogo = () => {
            setVisibleIndices((current) => {
                if (!current.length) return current

                if (slotBag.current.length === 0) {
                    const allSlots = Array.from(
                        { length: totalSlots },
                        (_, i) => i
                    )
                    slotBag.current = shuffleArray(allSlots)
                    if (
                        slotBag.current[0] === lastSwappedSlot.current &&
                        totalSlots > 1
                    ) {
                        slotBag.current.push(slotBag.current.shift())
                    }
                }
                const slotToReplace = slotBag.current.pop()
                lastSwappedSlot.current = slotToReplace

                const newItems = [...current]
                // Get currently displayed logo indexes
                const currentIndices = newItems.map((l) => l.logoIndex)
                // Find which logos from the master list aren't currently shown
                const availableIndices = slides
                    .map((_, i) => i)
                    .filter((i) => !currentIndices.includes(i))

                if (availableIndices.length === 0) return current

                const nextLogoIndex =
                    availableIndices[
                        Math.floor(Math.random() * availableIndices.length)
                    ]

                if (nextLogoIndex === undefined) return current

                newItems[slotToReplace] = {
                    id: `swap-${Date.now()}`,
                    logoIndex: nextLogoIndex,
                }
                return newItems
            })

            const totalCycleDelay = (FADE_DURATION * 2 + interval) * 1000
            timerRef.current = setTimeout(swapLogo, totalCycleDelay)
        }

        timerRef.current = setTimeout(swapLogo, interval * 1000)
        return () => clearTimeout(timerRef.current)
    }, [slides.length, totalSlots, interval, isStatic, hasContent])

    useEffect(() => {
        if (!hasContent) return
        if (
            prevLayout.current.rows === rows &&
            prevLayout.current.columns === columns
        ) {
            return
        }
        prevLayout.current = { rows, columns }
        slotBag.current = []
        setVisibleIndices(
            Array.from({ length: totalSlots }).map((_, i) => ({
                id: `reset-${Date.now()}-${i}`,
                logoIndex: i % slides.length,
            }))
        )
    }, [rows, columns, hasContent, totalSlots, slides.length])

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: `${gap}px`,
                color: "inherit",
                ...props.style,
            }}
        >
            {visibleIndices.map((item, index) => {
                const isInitial = item.id.startsWith("initial")
                const content = slides[item.logoIndex]

                return (
                    <div
                        key={index}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "100%",
                            gridTemplateRows: "100%",
                            alignItems: "center",
                            justifyItems: "center",
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                        }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={item.id}
                                initial={
                                    isStatic || isInitial
                                        ? { opacity: 1 }
                                        : { opacity: 0 }
                                }
                                animate={{ opacity: 1 }}
                                exit={isStatic ? {} : { opacity: 0 }}
                                transition={{
                                    duration: FADE_DURATION,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    gridArea: "1 / 1 / 2 / 2",
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "inherit",
                                }}
                            >
                                {content}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )
            })}
        </div>
    )
}

LogoWall.defaultProps = {
    slides: [],
    rows: 2,
    columns: 3,
    gap: 40,
    interval: 3,
}

addPropertyControls(LogoWall, {
    slides: {
        type: ControlType.Array,
        title: "Logos",
        control: {
            type: ControlType.ComponentInstance,
        },
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        min: 1,
        max: 10,
        displayStepper: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        min: 1,
        max: 10,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 100,
    },
    interval: {
        type: ControlType.Number,
        title: "Cycle Time",
        description: "Rest time between animations",
        min: 0.5,
        max: 20,
        unit: "s",
        step: 0.5,
        displayStepper: true,
    },
})
