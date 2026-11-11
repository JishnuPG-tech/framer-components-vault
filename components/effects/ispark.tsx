import * as React from "react"
import { useRef, useEffect, useCallback, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ================================================================
╭─╴╷ ╷╭─╮╭─╮╭─╴
│  │ ││ ││╮│├╴ 
╰─╴╰─╯╰─╯╰┴╯╰─╴
Craft Beyond Convention.

    Module: iSpark V2.2
==================================================================*/

/* ------------------------------------------------------------------
    [TYPE DEFINITIONS]
-------------------------------------------------------------------*/

type Easing = "linear" | "ease in" | "ease out" | "ease in out"

interface Spark {
    x: number
    y: number
    angle: number
    startTime: number
}

/* ------------------------------------------------------------------
    [PROPS]
-------------------------------------------------------------------*/

interface Props {
    sparkColor: string
    sparkSize: number
    sparkRadius: number
    sparkCount: number
    duration: number
    easing: Easing
    extraScale: number
}

/* ------------------------------------------------------------------
    [MAIN COMPONENT]
-------------------------------------------------------------------*/

export default function iSpark(props: Props) {
    const {
        sparkColor,
        sparkSize,
        sparkRadius,
        sparkCount,
        duration,
        easing,
        extraScale,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sparksRef = useRef<Spark[]>([])
    const requestRef = useRef<number>()
    const isStatic = useIsStaticRenderer()
    const [isVisible, setIsVisible] = useState(true)

    /* ================================================================
        [PERFORMANCE & VISIBILITY]
     =================================================================*/

    useEffect(() => {
        if (isStatic || !containerRef.current) return
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.01 }
        )
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [isStatic])

    /* ================================================================
        [CANVAS RESIZE]
     =================================================================*/

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const resize = () => {
            const rect = container.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
        }

        resize()

        const ro = new ResizeObserver(resize)
        ro.observe(container)

        return () => ro.disconnect()
    }, [])

    /* ================================================================
        [EASING]
     =================================================================*/

    const easeFunc = useCallback(
        (t: number) => {
            const mode = easing.toLowerCase()

            switch (mode) {
                case "linear":
                    return t
                case "ease in":
                    return t * t
                case "ease in out":
                    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
                case "ease out":
                default:
                    return t * (2 - t)
            }
        },
        [easing]
    )

    /* ================================================================
        [RENDER LOOP]
     =================================================================*/

    const draw = useCallback(
        (timestamp: number) => {
            const canvas = canvasRef.current
            if (!canvas || !isVisible) return

            const ctx = canvas.getContext("2d")
            if (!ctx) return

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            sparksRef.current = sparksRef.current.filter((spark) => {
                const elapsed = timestamp - spark.startTime
                if (elapsed >= duration) return false

                const progress = elapsed / duration
                const eased = easeFunc(progress)
                const pulse = Math.sin(progress * Math.PI)
                const pulseBoost = 1 + pulse * 0.3
                const distance = eased * sparkRadius * extraScale * pulseBoost
                const lineLength = sparkSize * (1 - eased)

                const x1 = spark.x + distance * Math.cos(spark.angle)
                const y1 = spark.y + distance * Math.sin(spark.angle)
                const x2 =
                    spark.x + (distance + lineLength) * Math.cos(spark.angle)
                const y2 =
                    spark.y + (distance + lineLength) * Math.sin(spark.angle)

                ctx.strokeStyle = sparkColor
                ctx.lineWidth = 2
                ctx.shadowBlur = 14
                ctx.shadowColor = sparkColor
                ctx.globalAlpha = 1 - eased * 0.3

                ctx.beginPath()
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.stroke()
                ctx.globalAlpha = 1

                return true
            })

            if (sparksRef.current.length > 0) {
                requestRef.current = requestAnimationFrame(draw)
            } else {
                requestRef.current = undefined
            }
        },
        [
            sparkColor,
            sparkSize,
            sparkRadius,
            duration,
            easeFunc,
            extraScale,
            isVisible,
        ]
    )

    /* ================================================================
        [CLICK SYSTEM]
     =================================================================*/

    useEffect(() => {
        const node = containerRef.current
        if (isStatic || !node) return

        const handleClick = (e: MouseEvent) => {
            const canvas = canvasRef.current
            if (!canvas) return

            const rect = node.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            const now = performance.now()
            const newSparks: Spark[] = Array.from(
                { length: sparkCount },
                (_, i) => ({
                    x,
                    y,
                    angle: (2 * Math.PI * i) / sparkCount,
                    startTime: now,
                })
            )

            sparksRef.current.push(...newSparks)

            if (!requestRef.current) {
                requestRef.current = requestAnimationFrame(draw)
            }
        }

        node.addEventListener("click", handleClick)
        return () => node.removeEventListener("click", handleClick)
    }, [sparkCount, draw, isStatic])

    /* ================================================================
        [RENDER]
     =================================================================*/

    if (isStatic)
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                }}
            />
        )

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                pointerEvents: "auto",
                background: "transparent",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

/* ================================================================
    [FRAMER CONTROLS]
==================================================================*/

addPropertyControls(iSpark, {
    sparkColor: {
        type: ControlType.Color,
        title: "Spark Color",
        defaultValue: "#fffdf5",
    },
    sparkSize: {
        type: ControlType.Number,
        title: "Spark Size",
        defaultValue: 10,
        min: 1,
        max: 50,
        description: "Length of the individual lines.",
    },
    sparkRadius: {
        type: ControlType.Number,
        title: "Spark Radius",
        defaultValue: 15,
        min: 0,
        max: 200,
        description: "Expansion distance from center.",
    },
    sparkCount: {
        type: ControlType.Number,
        title: "Spark Count",
        defaultValue: 8,
        min: 1,
        max: 30,
        description: "Number of lines per click.",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 400,
        min: 100,
        max: 2000,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "ease in", "ease out", "ease in out"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out"],
        defaultValue: "ease out",
    },
    extraScale: {
        type: ControlType.Number,
        title: "Extra Scale",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        description:
            "Keep this component below everything in your project hierarchy.\n\nFor product support, help, or a warm chat, [click here](https://whop.com/cuoqe/cuoqe-ispark). \n For more components, visit [CuoQe](https://cuoqe.framer.media)",
    },
})

/**
 * ─────────────────────────────────────────────────────────────
 * LEGAL / LICENSING
 * ─────────────────────────────────────────────────────────────
 *
 * This component includes portions derived from React Bits
 * (https://reactbits.dev), modified for Framer-native use.
 *
 * Original source component: [User to Provide]
 * Source: [User to Provide URL]
 *
 * Original work Copyright (c) React Bits
 * Modifications, Framer integration, property controls,
 * packaging, and additional functionality
 * Copyright (c) 2026 CuoQe
 *
 * Portions of this file are derived from software licensed
 * under the MIT License:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 * ─────────────────────────────────────────────────────────────
 */
