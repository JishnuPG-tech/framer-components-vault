import { useEffect, useState, type PropsWithChildren } from "react"
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
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart as RechartsLineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "https://esm.sh/recharts?external=react"

type YAxis = {
    dataKey: string
    color: string
}

export type Props = PropsWithChildren<{
    data: string
    style: "barChart" | "lineChart"
    xAxis: string
    yAxis: YAxis[]
    showYAxis: boolean
    showXAxis: boolean
    showLegend: boolean
    showGrid: boolean
    strokeWidth: number
    stacked: boolean
}>

const defaultData = `[
  {
    "name": "Page A",
    "value1": 400,
    "value2": 150
  },
  {
    "name": "Page B",
    "value1": 300,
    "value2": 500
  },
  {
    "name": "Page C",
    "value1": 200,
    "value2": 350
  },
  {
    "name": "Page D",
    "value1": 278,
    "value2": 600
  },
  {
    "name": "Page E",
    "value1": 189,
    "value2": 232
  },
  {
    "name": "Page F",
    "value1": 323,
    "value2": 468
  },
  {
    "name": "Page G",
    "value1": 98,
    "value2": 309
  }
]
`

/**
 * @framerDisableUnlink
 */
export default function WFChartsLite(props: Props) {
    return (
        <div style={{ width: "100%", height: "100%" }}>
            {props.style === "barChart" && <BarChart {...props} />}
            {props.style === "lineChart" && <LineChart {...props} />}
        </div>
    )
}

WFChartsLite.defaultProps = {
    data: defaultData,
    style: "barChart",
    xAxis: "name",
    yAxis: [
        { dataKey: "value1", color: "#f94144" },
        { dataKey: "value2", color: "#f3722c" },
    ],
    showYAxis: false,
    showXAxis: true,
    showLegend: true,
    showGrid: true,
    strokeWidth: 3,
    stacked: false,
} satisfies Props

addPropertyControls(WFChartsLite, {
    data: {
        title: "Data",
        description: "Paste your JSON data here as an array of objects.",
        type: ControlType.String,
        displayTextArea: true,
    },
    xAxis: {
        title: "X Axis",
        type: ControlType.String,
    },
    yAxis: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                dataKey: { type: ControlType.String },
                color: { type: ControlType.Color },
            },
        },
    },
    showYAxis: {
        title: "Show Y Axis labels",
        type: ControlType.Boolean,
    },
    showXAxis: {
        title: "Show X Axis labels",
        type: ControlType.Boolean,
    },
    showLegend: {
        title: "Show Legend",
        type: ControlType.Boolean,
    },
    showGrid: {
        title: "Show Grid",
        type: ControlType.Boolean,
    },
    style: {
        title: "Style",
        type: ControlType.Enum,
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        options: ["barChart", "lineChart"],
        optionTitles: ["Bar Chart", "Line Chart"],
    },
    strokeWidth: {
        title: "Stroke width",
        type: ControlType.Number,
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
        hidden(props) {
            return props.style !== "lineChart"
        },
    },
    stacked: {
        title: "Stacked",
        type: ControlType.Boolean,
        hidden(props) {
            return props.style !== "barChart"
        },
    },
})

function BarChart(props: Props) {
    const parsedData = JSON.parse(props.data)

    return (
        <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={200}
            minHeight={100}
        >
            <RechartsBarChart data={parsedData}>
                {props.showGrid && <CartesianGrid vertical={false} />}
                {props.showXAxis && (
                    <XAxis
                        dataKey={props.xAxis}
                        tickLine={false}
                        axisLine={false}
                    />
                )}
                {props.showYAxis && <YAxis />}
                <Tooltip cursor={{ fill: "transparent" }} />
                {props.showLegend && (
                    <Legend
                        wrapperStyle={{ paddingTop: props.showXAxis ? 0 : 15 }}
                    />
                )}
                {props.yAxis.map((a, i) => {
                    return (
                        <Bar
                            stackId={props.stacked ? "stack" : i}
                            dataKey={a.dataKey}
                            fill={a.color}
                        />
                    )
                })}
            </RechartsBarChart>
        </ResponsiveContainer>
    )
}

function LineChart(props: Props) {
    const parsedData = JSON.parse(props.data)

    return (
        <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={200}
            minHeight={100}
        >
            <RechartsLineChart data={parsedData}>
                {props.showGrid && <CartesianGrid vertical={false} />}
                {props.showXAxis && (
                    <XAxis
                        dataKey={props.xAxis}
                        tickLine={false}
                        axisLine={false}
                    />
                )}
                {props.showYAxis && <YAxis />}
                <Tooltip cursor={{ fill: "transparent" }} />
                {props.showLegend && (
                    <Legend
                        wrapperStyle={{ paddingTop: props.showXAxis ? 0 : 15 }}
                    />
                )}
                {props.yAxis.map((a) => {
                    return (
                        <Line
                            type="monotone"
                            dataKey={a.dataKey}
                            stroke={a.color}
                            strokeWidth={props.strokeWidth}
                        />
                    )
                })}
            </RechartsLineChart>
        </ResponsiveContainer>
    )
}
