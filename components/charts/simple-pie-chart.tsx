// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"
import { Chart, PieController, ArcElement, Tooltip, Legend } from "chart.js"

Chart.register(PieController, ArcElement, Tooltip, Legend)

function PieChartComponent(props) {
    const { labels, values, colors } = props
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const chartRef = useRef<Chart | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        // Destroy old chart
        if (chartRef.current) {
            chartRef.current.destroy()
        }

        chartRef.current = new Chart(canvasRef.current, {
            type: "pie",
            data: {
                labels,
                datasets: [
                    {
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            },
        })
    }, [labels, values, colors])

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <canvas ref={canvasRef}></canvas>
        </div>
    )
}

addPropertyControls(PieChartComponent, {
    labels: {
        type: ControlType.Array,
        propertyControl: { type: ControlType.String },
        defaultValue: ["Design", "Development", "Marketing"],
        title: "Labels",
    },
    values: {
        type: ControlType.Array,
        propertyControl: { type: ControlType.Number },
        defaultValue: [40, 35, 25],
        title: "Values",
    },
    colors: {
        type: ControlType.Array,
        propertyControl: { type: ControlType.Color },
        defaultValue: ["#ff6384", "#36a2eb", "#ffce56"],
        title: "Colors",
    },
})

export default PieChartComponent
