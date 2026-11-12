import * as React from "react"
import { useEffect, useRef, useState } from "react"
import {
    motion,
    useTransform,
    animate,
    useMotionValue,
    MotionValue,
    useSpring,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- Types ---

interface NodeData {
    id: number
    x: number
    y: number
    size: number
    imageUrl: string
}

interface MotionNodeData extends NodeData {
    xMv: MotionValue<number>
    yMv: MotionValue<number>
    xOffset: MotionValue<number>
    yOffset: MotionValue<number>
}

interface EdgeData {
    source: number
    target: number
}

// --- Default images (Framer-hosted, no external dependencies) ---
const DEFAULT_IMAGES = [
    {
        src: "https://framerusercontent.com/images/3Byw8sBC7ASWNhvkwPP56V3s5Ro.webp",
    },
    {
        src: "https://framerusercontent.com/images/sJ24fNPNyoSFYbT4Hjqx3AqLsE.webp",
    },
    {
        src: "https://framerusercontent.com/images/3U5csPL2KQGeddjfFA3RHkrrs.webp",
    },
    {
        src: "https://framerusercontent.com/images/p3qlnvJUACEpGIJbPQE19IleOc.webp",
    },
    {
        src: "https://framerusercontent.com/images/JFf3x0coRdNFcObhfOSCsK549w.webp",
    },
]

// --- Utils ---

const random = (min: number, max: number) => Math.random() * (max - min) + min

const generateGraphData = (
    count: number,
    width: number,
    height: number,
    minSize: number,
    maxSize: number,
    images: any[]
): { nodes: NodeData[]; edges: EdgeData[] } => {
    const nodes: NodeData[] = []
    const edges: EdgeData[] = []

    // Resolve images, falling back to defaults if none provided
    const resolvedImages = images && images.length > 0 ? images : DEFAULT_IMAGES

    for (let i = 0; i < count; i++) {
        const imgItem = resolvedImages[i % resolvedImages.length]
        const imgUrl =
            typeof imgItem === "string" ? imgItem : imgItem?.src || ""

        nodes.push({
            id: i,
            x: random(50, width - 50),
            y: random(50, height - 50),
            size: random(minSize, maxSize),
            imageUrl: imgUrl,
        })
    }

    nodes.forEach((node, i) => {
        const neighbors = nodes
            .map((n, index) => ({
                index,
                distance: Math.hypot(n.x - node.x, n.y - node.y),
            }))
            .filter((n) => n.index !== i)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 2)

        neighbors.forEach((neighbor) => {
            if (i < neighbor.index)
                edges.push({ source: i, target: neighbor.index })
        })
    })

    return { nodes, edges }
}

// --- Subcomponents ---

interface ConnectionProps {
    sourceNode: MotionNodeData
    targetNode: MotionNodeData
    mouseX: MotionValue<number>
    mouseY: MotionValue<number>
    color: string
    width: number
    opacity: number
    repulsionRadius: number
}

const Connection = ({
    sourceNode,
    targetNode,
    mouseX,
    mouseY,
    color,
    width,
    opacity,
    repulsionRadius,
}: ConnectionProps) => {
    const path = useTransform(
        [
            sourceNode.xMv,
            sourceNode.xOffset,
            sourceNode.yMv,
            sourceNode.yOffset,
            targetNode.xMv,
            targetNode.xOffset,
            targetNode.yMv,
            targetNode.yOffset,
            mouseX,
            mouseY,
        ],
        () => {
            const sX =
                sourceNode.xMv.get() +
                sourceNode.xOffset.get() +
                sourceNode.size / 2
            const sY =
                sourceNode.yMv.get() +
                sourceNode.yOffset.get() +
                sourceNode.size / 2
            const tX =
                targetNode.xMv.get() +
                targetNode.xOffset.get() +
                targetNode.size / 2
            const tY =
                targetNode.yMv.get() +
                targetNode.yOffset.get() +
                targetNode.size / 2

            const mx = mouseX.get()
            const my = mouseY.get()

            let midX = (sX + tX) / 2
            let midY = (sY + tY) / 2

            const dx = midX - mx
            const dy = midY - my
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < repulsionRadius) {
                const force = Math.pow(1 - dist / repulsionRadius, 2) * 40
                midX += (dx / dist) * force
                midY += (dy / dist) * force
            }

            return `M ${sX} ${sY} Q ${midX} ${midY} ${tX} ${tY}`
        }
    )

    return (
        <motion.path
            d={path}
            fill="transparent"
            stroke={color}
            strokeWidth={width}
            strokeOpacity={opacity}
            strokeLinecap="round"
        />
    )
}

const NetworkNode = ({
    node,
    mouseX,
    mouseY,
    repulsionRadius,
    repulsionStrength,
    borderColor,
    borderWidth,
    dragEnabled,
    hoverScale,
}: any) => {
    const springConfig = { damping: 20, stiffness: 150, mass: 0.5 }
    const xBase = useSpring(node.xMv, springConfig)
    const yBase = useSpring(node.yMv, springConfig)

    const x = useTransform(
        [xBase, node.xOffset, mouseX, mouseY],
        ([base, off, mx, my]: any) => {
            const curX = base + off
            const curY = yBase.get() + node.yOffset.get()
            const dx = curX + node.size / 2 - mx
            const dy = curY + node.size / 2 - my
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < repulsionRadius) {
                const force =
                    Math.pow(1 - dist / repulsionRadius, 2) * repulsionStrength
                return curX + (dx / dist) * force
            }
            return curX
        }
    )

    const y = useTransform(
        [yBase, node.yOffset, mouseX, mouseY],
        ([base, off, mx, my]: any) => {
            const curX = xBase.get() + node.xOffset.get()
            const curY = base + off
            const dx = curX + node.size / 2 - mx
            const dy = curY + node.size / 2 - my
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < repulsionRadius) {
                const force =
                    Math.pow(1 - dist / repulsionRadius, 2) * repulsionStrength
                return curY + (dy / dist) * force
            }
            return curY
        }
    )

    return (
        <motion.div
            drag={dragEnabled}
            dragMomentum={false}
            onDrag={(_, info) => {
                node.xMv.set(node.xMv.get() + info.delta.x)
                node.yMv.set(node.yMv.get() + info.delta.y)
            }}
            style={{
                x,
                y,
                width: node.size,
                height: node.size,
                position: "absolute",
                top: 0,
                left: 0,
                borderRadius: "50%",
                border: `${borderWidth}px solid ${borderColor}`,
                overflow: "hidden",
                zIndex: 10,
                cursor: "grab",
            }}
            whileHover={{ scale: hoverScale }}
        >
            <img
                src={node.imageUrl}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    pointerEvents: "none",
                }}
            />
        </motion.div>
    )
}

// --- Main Component ---

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 */
export default function StoriesNetwork(props: any) {
    const {
        width,
        height,
        style,
        images,
        nodeCount,
        nodeMinSize,
        nodeMaxSize,
        backgroundColor,
        lineColor,
        lineWidth,
        lineOpacity,
        repulsionRadius,
        repulsionStrength,
        dragEnabled,
        hoverScale,
        borderColor,
        borderWidth,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const [dims, setDims] = useState({ w: 0, h: 0 })
    const [graph, setGraph] = useState<{
        nodes: MotionNodeData[]
        edges: EdgeData[]
    }>({ nodes: [], edges: [] })

    const mouseX = useMotionValue(-1000)
    const mouseY = useMotionValue(-1000)

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                setDims({
                    w: containerRef.current.offsetWidth,
                    h: containerRef.current.offsetHeight,
                })
            }
        }
        window.addEventListener("resize", update)
        update()
        return () => window.removeEventListener("resize", update)
    }, [])

    // Stable image key so the graph only regenerates when the image list
    // actually changes (avoids unnecessary re-layouts on unrelated prop changes)
    const imageKey = React.useMemo(
        () =>
            JSON.stringify(
                (images && images.length > 0 ? images : DEFAULT_IMAGES).map(
                    (img: any) =>
                        typeof img === "string" ? img : img?.src || ""
                )
            ),
        [images]
    )

    useEffect(() => {
        if (dims.w === 0) return

        const data = generateGraphData(
            nodeCount,
            dims.w,
            dims.h,
            nodeMinSize,
            nodeMaxSize,
            images
        )

        const mNodes = data.nodes.map((n) => ({
            ...n,
            xMv: new MotionValue(n.x - n.size / 2),
            yMv: new MotionValue(n.y - n.size / 2),
            xOffset: new MotionValue(0),
            yOffset: new MotionValue(0),
        }))

        setGraph({ nodes: mNodes, edges: data.edges })

        // Skip continuous animations in static contexts
        if (isStatic) return

        const anims = mNodes.flatMap((n) => [
            animate(n.xOffset, [0, (Math.random() - 0.5) * 30, 0], {
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
            }),
            animate(n.yOffset, [0, (Math.random() - 0.5) * 30, 0], {
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random(),
            }),
        ])
        return () => anims.forEach((a) => a.stop())
    }, [dims, nodeCount, nodeMinSize, nodeMaxSize, imageKey, isStatic])

    return (
        <div
            ref={containerRef}
            style={{
                width: width ?? 800,
                height: height ?? 800,
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
                ...style,
            }}
            onMouseMove={
                isStatic
                    ? undefined
                    : (e) => {
                          const rect =
                              containerRef.current?.getBoundingClientRect()
                          if (rect) {
                              mouseX.set(e.clientX - rect.left)
                              mouseY.set(e.clientY - rect.top)
                          }
                      }
            }
            onMouseLeave={
                isStatic
                    ? undefined
                    : () => {
                          mouseX.set(-1000)
                          mouseY.set(-1000)
                      }
            }
        >
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            >
                {graph.edges.map((edge, i) => (
                    <Connection
                        key={i}
                        sourceNode={graph.nodes[edge.source]}
                        targetNode={graph.nodes[edge.target]}
                        mouseX={mouseX}
                        mouseY={mouseY}
                        color={lineColor}
                        width={lineWidth}
                        opacity={lineOpacity}
                        repulsionRadius={repulsionRadius}
                    />
                ))}
            </svg>
            {graph.nodes.map((node) => (
                <NetworkNode
                    key={node.id}
                    node={node}
                    mouseX={mouseX}
                    mouseY={mouseY}
                    repulsionRadius={repulsionRadius}
                    repulsionStrength={repulsionStrength}
                    borderColor={borderColor}
                    borderWidth={borderWidth}
                    dragEnabled={isStatic ? false : dragEnabled}
                    hoverScale={hoverScale}
                />
            ))}
        </div>
    )
}

StoriesNetwork.defaultProps = {
    width: 800,
    height: 800,
}

addPropertyControls(StoriesNetwork, {
    images: {
        type: ControlType.Array,
        control: { type: ControlType.ResponsiveImage },
        title: "Images",
        defaultValue: DEFAULT_IMAGES,
    },
    nodeCount: {
        type: ControlType.Number,
        title: "Node Count",
        defaultValue: 25,
        min: 5,
        max: 60,
    },
    nodeMinSize: {
        type: ControlType.Number,
        title: "Min Size",
        defaultValue: 40,
    },
    nodeMaxSize: {
        type: ControlType.Number,
        title: "Max Size",
        defaultValue: 60,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.2,
        min: 1,
        max: 2,
        step: 0.1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#eeeeee",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 2,
        min: 1,
        max: 10,
    },
    lineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.1,
    },
    repulsionRadius: {
        type: ControlType.Number,
        title: "Mouse Radius",
        defaultValue: 150,
        min: 50,
        max: 500,
    },
    repulsionStrength: {
        type: ControlType.Number,
        title: "Repulsion",
        defaultValue: 100,
        min: 10,
        max: 300,
    },
    dragEnabled: {
        type: ControlType.Boolean,
        title: "Enable Drag",
        defaultValue: true,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#ffffff",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 0,
        max: 10,
    },
})
