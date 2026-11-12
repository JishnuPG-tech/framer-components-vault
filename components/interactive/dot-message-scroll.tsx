// Horizontally scrolling message bar with dot matrix text format - carousel mode with custom patterns
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


interface DotMatrixScrollProps {
    messages: Array<{
        text: string
        link: string
    }>
    scrollMode: "carousel" | "continuous"
    dotSize: number
    dotSpacing: number
    messageSpacing: number
    scrollSpeed: number
    transitionDuration: number
    pauseDuration: number
    backgroundColor: string
    dotColor: string
    inactiveDotColor: string
    hoverDotColor: string
    borderRadius: number
    borderWidth: number
    borderStyle: "solid" | "dashed" | "dotted" | "double" | "none"
    borderColor: string
    padding: number
    dotShape: "circle" | "square" | "triangle" | "custom"
    customSvgPath: string
    style?: CSSProperties
}

/**
 * Dot Matrix Scrolling Message Bar - Carousel Mode
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 60
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DotMatrixScroll(props: DotMatrixScrollProps) {
    const {
        messages = [
            { text: "HELLO WORLD", link: "" },
            { text: "MESSAGE 2", link: "" },
            { text: "MESSAGE 3", link: "" },
            { text: "MESSAGE 4", link: "" },
            { text: "MESSAGE 5", link: "" },
        ],
        scrollMode = "carousel",
        dotSize = 4,
        dotSpacing = 2,
        messageSpacing = 50,
        scrollSpeed = 50,
        transitionDuration = 1000,
        pauseDuration = 2000,
        backgroundColor = "#000000",
        dotColor = "#FF0000",
        inactiveDotColor = "#333333",
        hoverDotColor = "#00FF00",
        borderRadius = 0,
        borderWidth = 0,
        borderStyle = "solid",
        borderColor = "#FFFFFF",
        padding = 0,
        dotShape = "circle",
        customSvgPath = "",
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number | null>(null)
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
    const [transitionProgress, setTransitionProgress] = useState(0)
    const transitionStartTimeRef = useRef<number>(0)
    const pauseStartTimeRef = useRef<number>(0)
    const isTransitioningRef = useRef(false)
    const isPausingRef = useRef(true)
    const [isHovering, setIsHovering] = useState(false)
    const [mousePos, setMousePos] = useState({ x: -1, y: -1 })
    const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number>(-1)
    const scrollOffsetRef = useRef(0)
    const animationTimeRef = useRef(0)

    // Calculate initial scroll offset to start with messages visible
    useEffect(() => {
        if (scrollMode === "continuous") {
            // Start with messages at the left edge (offset = 0)
            scrollOffsetRef.current = 0
        }
    }, [scrollMode, messages, dotSize, dotSpacing, messageSpacing])

    // 5x7 dot matrix font definition
    const dotMatrixFont: Record<string, number[][]> = {
        A: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        B: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
        ],
        C: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        D: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
        ],
        E: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
        ],
        F: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
        ],
        G: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        H: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        I: [
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [1, 1, 1, 1, 1],
        ],
        J: [
            [0, 0, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 0, 0],
        ],
        K: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 1, 0],
            [1, 0, 1, 0, 0],
            [1, 1, 0, 0, 0],
            [1, 0, 1, 0, 0],
            [1, 0, 0, 1, 0],
            [1, 0, 0, 0, 1],
        ],
        L: [
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
        ],
        M: [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 1, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        N: [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        O: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        P: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
        ],
        Q: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 0],
            [0, 1, 1, 0, 1],
        ],
        R: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 1, 0, 0],
            [1, 0, 0, 1, 0],
            [1, 0, 0, 0, 1],
        ],
        S: [
            [0, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
        ],
        T: [
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
        ],
        U: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        V: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
        ],
        W: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 1, 0, 1, 1],
            [1, 0, 0, 0, 1],
        ],
        X: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        Y: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        Z: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
        ],
        "0": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "1": [
            [0, 0, 1, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
        ],
        "2": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "3": [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "4": [
            [0, 0, 0, 1, 0],
            [0, 0, 1, 1, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 1, 0],
            [1, 1, 1, 1, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
        ],
        "5": [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "6": [
            [0, 0, 1, 1, 0],
            [0, 1, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "7": [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
        ],
        "8": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        "9": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 1, 1, 0, 0],
        ],
        " ": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ],
        "!": [
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
        ],
        ".": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 1, 1, 0, 0],
        ],
        ",": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1],
            [0, 0, 0, 1, 1],
            [0, 0, 1, 1, 0],
        ],
    }

    // Get character matrix
    const getCharMatrix = (char: string): number[][] => {
        const upperChar = char.toUpperCase()
        return dotMatrixFont[upperChar] || dotMatrixFont[" "]
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr

        ctx.scale(dpr, dpr)

        const charWidth = 5
        const charHeight = 7
        const charSpacing = 1.024
        const totalDotSize = dotSize + dotSpacing

        const animate = (timestamp: number) => {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, rect.width, rect.height)

            // Update animation time
            animationTimeRef.current = timestamp

            const totalDotSize = dotSize + dotSpacing

            // Calculate available space after padding
            const availableWidth = rect.width - padding * 2
            const availableHeight = rect.height - padding * 2

            // Calculate max character height
            const maxCharHeight = 7

            // Draw background grid of dots
            const numCols = Math.ceil(availableWidth / totalDotSize)
            const numRows = Math.ceil(availableHeight / totalDotSize)
            const startY = padding + (availableHeight - maxCharHeight * totalDotSize) / 2

            ctx.fillStyle = inactiveDotColor
            for (let row = 0; row < maxCharHeight; row++) {
                for (let col = 0; col < numCols; col++) {
                    const x = padding + col * totalDotSize
                    const y = startY + row * totalDotSize

                    drawDot(ctx, x + dotSize / 2, y + dotSize / 2, dotSize / 2, inactiveDotColor, 1)
                }
            }

            // Handle animation based on mode
            if (scrollMode === "carousel") {
                // Handle carousel transitions
                if (!isHovering) {
                    if (isPausingRef.current) {
                        if (pauseStartTimeRef.current === 0) {
                            pauseStartTimeRef.current = timestamp
                        }
                        
                        if (timestamp - pauseStartTimeRef.current >= pauseDuration) {
                            isPausingRef.current = false
                            isTransitioningRef.current = true
                            transitionStartTimeRef.current = timestamp
                            pauseStartTimeRef.current = 0
                        }
                    } else if (isTransitioningRef.current) {
                        const elapsed = timestamp - transitionStartTimeRef.current
                        const progress = Math.min(elapsed / transitionDuration, 1)
                        
                        startTransition(() => setTransitionProgress(progress))
                        
                        if (progress >= 1) {
                            isTransitioningRef.current = false
                            isPausingRef.current = true
                            startTransition(() => {
                                setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
                                setTransitionProgress(0)
                            })
                            transitionStartTimeRef.current = 0
                        }
                    }
                }
            } else {
                // Continuous scrolling mode
                if (!isHovering) {
                    scrollOffsetRef.current -= scrollSpeed / 60
                }
            }

            // Calculate message positions
            const getCurrentMessageX = (msgIndex: number, progress: number) => {
                const messageChars = messages[msgIndex].text.toUpperCase().split("")
                let messageWidth = 0

                for (let i = 0; i < messageChars.length; i++) {
                    const char = messageChars[i]
                    const charMatrix = getCharMatrix(char)
                    messageWidth += charMatrix[0].length * totalDotSize + charSpacing * totalDotSize
                }
                messageWidth -= charSpacing * totalDotSize

                if (scrollMode === "continuous") {
                    // Calculate total width of all messages
                    let totalWidth = 0
                    for (let i = 0; i < messages.length; i++) {
                        const chars = messages[i].text.toUpperCase().split("")
                        let width = 0
                        for (let j = 0; j < chars.length; j++) {
                            const char = chars[j]
                            const charMatrix = getCharMatrix(char)
                            width += charMatrix[0].length * totalDotSize + charSpacing * totalDotSize
                        }
                        width -= charSpacing * totalDotSize
                        totalWidth += width + messageSpacing
                    }

                    // Calculate position for this message
                    let messageOffset = 0
                    for (let i = 0; i < msgIndex; i++) {
                        const chars = messages[i].text.toUpperCase().split("")
                        let width = 0
                        for (let j = 0; j < chars.length; j++) {
                            const char = chars[j]
                            const charMatrix = getCharMatrix(char)
                            width += charMatrix[0].length * totalDotSize + charSpacing * totalDotSize
                        }
                        width -= charSpacing * totalDotSize
                        messageOffset += width + messageSpacing
                    }

                    // Apply scroll offset and wrap around - start from left (padding) instead of right
                    let x = padding + messageOffset + (scrollOffsetRef.current % totalWidth)
                    
                    // Ensure smooth wrapping
                    if (x < padding - messageWidth - messageSpacing) {
                        x += totalWidth
                    }
                    
                    return x
                }

                const centerX = padding + (availableWidth - messageWidth) / 2
                
                if (isTransitioningRef.current) {
                    // Current message moves left
                    if (msgIndex === currentMessageIndex) {
                        return centerX - (availableWidth + messageWidth) * progress
                    }
                    // Next message comes from right
                    const nextIndex = (currentMessageIndex + 1) % messages.length
                    if (msgIndex === nextIndex) {
                        return rect.width + (centerX - rect.width) * progress
                    }
                }
                
                return centerX
            }

            // Draw messages
            const messagesToDraw = scrollMode === "continuous"
                ? messages.map((_, i) => i)
                : isTransitioningRef.current 
                    ? [currentMessageIndex, (currentMessageIndex + 1) % messages.length]
                    : [currentMessageIndex]

            const messageDots: Array<{ x: number; y: number; messageIndex: number }> = []

            for (const msgIndex of messagesToDraw) {
                const messageChars = messages[msgIndex].text.toUpperCase().split("")
                let currentX = getCurrentMessageX(msgIndex, transitionProgress)

                for (let i = 0; i < messageChars.length; i++) {
                    const char = messageChars[i]
                    const charMatrix = getCharMatrix(char)

                    for (let row = 0; row < charMatrix.length; row++) {
                        for (let col = 0; col < charMatrix[row].length; col++) {
                            if (charMatrix[row][col] === 1) {
                                const x = currentX + col * totalDotSize
                                const y = startY + row * totalDotSize

                                if (x >= padding - totalDotSize && x <= rect.width - padding) {
                                    messageDots.push({ x, y, messageIndex: msgIndex })
                                }
                            }
                        }
                    }

                    currentX += charMatrix[0].length * totalDotSize + charSpacing * totalDotSize
                }
            }

            // Detect which message is being hovered
            let newHoveredIndex = -1
            if (isHovering) {
                // Check if hovering over any message dot (active)
                for (const dot of messageDots) {
                    const isHovered =
                        mousePos.x >= dot.x &&
                        mousePos.x <= dot.x + dotSize &&
                        mousePos.y >= dot.y &&
                        mousePos.y <= dot.y + dotSize

                    if (isHovered) {
                        newHoveredIndex = dot.messageIndex
                        break
                    }
                }

                // If not hovering over active dot, check if hovering in the message area (inactive dots)
                if (newHoveredIndex === -1) {
                    // Check if mouse is in the vertical range of the message
                    if (mousePos.y >= startY && mousePos.y <= startY + maxCharHeight * totalDotSize) {
                        // Check each visible message
                        for (const msgIndex of messagesToDraw) {
                            const messageChars = messages[msgIndex].text.toUpperCase().split("")
                            let messageWidth = 0

                            for (let i = 0; i < messageChars.length; i++) {
                                const char = messageChars[i]
                                const charMatrix = getCharMatrix(char)
                                messageWidth += charMatrix[0].length * totalDotSize + charSpacing * totalDotSize
                            }
                            messageWidth -= charSpacing * totalDotSize

                            const messageX = getCurrentMessageX(msgIndex, transitionProgress)

                            // Check if mouse is within this message's horizontal bounds
                            if (mousePos.x >= messageX && mousePos.x <= messageX + messageWidth) {
                                newHoveredIndex = msgIndex
                                break
                            }
                        }
                    }
                }
            }

            if (newHoveredIndex !== hoveredMessageIndex) {
                startTransition(() => setHoveredMessageIndex(newHoveredIndex))
            }

            // Draw message dots with hover detection
            for (const dot of messageDots) {
                const isMessageHovered = hoveredMessageIndex === dot.messageIndex

                ctx.fillStyle = isMessageHovered ? hoverDotColor : dotColor
                
                const color = isMessageHovered ? hoverDotColor : dotColor
                drawDot(ctx, dot.x + dotSize / 2, dot.y + dotSize / 2, dotSize / 2, color, 1)
            }

            animationRef.current = requestAnimationFrame(animate)
        }

        // Helper function to draw dots in different shapes
        const drawDot = (
            ctx: CanvasRenderingContext2D,
            centerX: number,
            centerY: number,
            radius: number,
            color: string,
            alpha: number
        ) => {
            // Apply alpha to color
            if (alpha < 1) {
                if (color.startsWith('#')) {
                    const r = parseInt(color.slice(1, 3), 16)
                    const g = parseInt(color.slice(3, 5), 16)
                    const b = parseInt(color.slice(5, 7), 16)
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
                } else {
                    ctx.fillStyle = color
                    ctx.globalAlpha = alpha
                }
            } else {
                ctx.fillStyle = color
            }

            ctx.beginPath()

            switch (dotShape) {
                case "circle":
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                    break

                case "square":
                    const size = radius * 2
                    ctx.rect(centerX - radius, centerY - radius, size, size)
                    break

                case "triangle":
                    const height = radius * 2
                    const width = radius * 1.732 // sqrt(3) for equilateral triangle
                    ctx.moveTo(centerX, centerY - height / 2)
                    ctx.lineTo(centerX + width / 2, centerY + height / 2)
                    ctx.lineTo(centerX - width / 2, centerY + height / 2)
                    ctx.closePath()
                    break

                case "custom":
                    if (customSvgPath) {
                        try {
                            const path = new Path2D(customSvgPath)
                            ctx.save()
                            // Scale and translate to center the custom path
                            const scale = (radius * 2) / 100 // Assume SVG is in 100x100 viewBox
                            ctx.translate(centerX - 50 * scale, centerY - 50 * scale)
                            ctx.scale(scale, scale)
                            ctx.fill(path)
                            ctx.restore()
                            ctx.globalAlpha = 1
                            return
                        } catch (e) {
                            // Fall back to circle if path is invalid
                            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                        }
                    } else {
                        // Default to circle if no custom path provided
                        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                    }
                    break

                default:
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
            }

            ctx.fill()
            ctx.globalAlpha = 1
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [messages, scrollMode, dotSize, dotSpacing, messageSpacing, scrollSpeed, transitionDuration, pauseDuration, backgroundColor, dotColor, inactiveDotColor, isHovering, mousePos, hoverDotColor, hoveredMessageIndex, currentMessageIndex, transitionProgress, padding, dotShape, customSvgPath])

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        startTransition(() => setMousePos({ x, y }))
    }

    const handleMouseEnter = () => {
        startTransition(() => setIsHovering(true))
    }

    const handleMouseLeave = () => {
        startTransition(() => {
            setIsHovering(false)
            setMousePos({ x: -1, y: -1 })
            setHoveredMessageIndex(-1)
        })
    }

    const handleClick = () => {
        if (hoveredMessageIndex >= 0 && hoveredMessageIndex < messages.length) {
            const message = messages[hoveredMessageIndex]
            const link = message.link
            
            if (link && typeof window !== "undefined") {
                window.open(link, "_blank")
            }
        }
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
                border: borderStyle === "none" ? "none" : `${borderWidth}px ${borderStyle} ${borderColor}`,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    cursor: hoveredMessageIndex >= 0 && messages[hoveredMessageIndex]?.link ? "pointer" : "default",
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            />
        </div>
    )
}

addPropertyControls(DotMatrixScroll, {
    messages: {
        type: ControlType.Array,
        title: "Messages",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "HELLO WORLD",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            { text: "HELLO WORLD", link: "" },
            { text: "MESSAGE 2", link: "" },
            { text: "MESSAGE 3", link: "" },
            { text: "MESSAGE 4", link: "" },
            { text: "MESSAGE 5", link: "" },
        ],
        maxCount: 5,
    },
    scrollMode: {
        type: ControlType.Enum,
        title: "Scroll Mode",
        options: ["carousel", "continuous"],
        optionTitles: ["Interval", "Carousel"],
        defaultValue: "carousel",
        displaySegmentedControl: true,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 4,
        min: 2,
        max: 12,
        step: 1,
        unit: "px",
    },
    dotSpacing: {
        type: ControlType.Number,
        title: "Dot Spacing",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 1,
        unit: "px",
    },
    messageSpacing: {
        type: ControlType.Number,
        title: "Message Spacing",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 5,
        hidden: (props) => props.scrollMode === "carousel",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 5,
        hidden: (props) => props.scrollMode === "carousel",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    dotShape: {
        type: ControlType.Enum,
        title: "Dot Shape",
        options: ["circle", "square", "triangle", "custom"],
        optionTitles: ["Circle", "Square", "Triangle", "Custom SVG"],
        defaultValue: "circle",
    },
    customSvgPath: {
        type: ControlType.String,
        title: "Custom SVG Path",
        defaultValue: "",
        displayTextArea: true,
        hidden: (props) => props.dotShape !== "custom",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Active Dot Color",
        defaultValue: "#FF0000",
    },
    inactiveDotColor: {
        type: ControlType.Color,
        title: "Inactive Dot Color",
        defaultValue: "#333333",
    },
    hoverDotColor: {
        type: ControlType.Color,
        title: "Hover Dot Color",
        defaultValue: "#00FF00",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border Style",
        options: ["none", "solid", "dashed", "dotted", "double"],
        optionTitles: ["None", "Solid", "Dashed", "Dotted", "Double"],
        defaultValue: "solid",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
    },
})