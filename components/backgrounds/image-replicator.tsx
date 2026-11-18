// Image Replicator Component
// Allows users to create unique visual experiences by replicating an image with full customization
import { useMemo, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageReplicatorProps {
  image: { src: string; alt: string }
  count: number
  layout: "grid" | "row" | "column"
  gap: number
  columns: number
  rotation: number
  scale: number
  opacity: number
  borderRadius: number
  shadow: boolean
  background: string
  style?: CSSProperties
}

/**
 * Image Replicator
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageReplicator(props: ImageReplicatorProps) {
  const {
    image = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
    count,
    layout,
    gap,
    columns,
    rotation,
    scale,
    opacity,
    borderRadius,
    shadow,
    background,
    style,
  } = props

  const items = useMemo(() => {
    return Array.from({ length: count }, (_, i) => (
      <img
        key={i}
        src={image.src}
        alt={image.alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius,
          boxShadow: shadow ? "0 4px 16px rgba(0,0,0,0.12)" : undefined,
          transform: `rotate(${rotation * i}deg) scale(${scale})`,
          opacity,
          background,
          transition: "box-shadow 0.2s, transform 0.2s, opacity 0.2s",
        }}
      />
    ))
  }, [count, image, rotation, scale, opacity, borderRadius, shadow, background])

  let containerStyle: CSSProperties = {
    display: layout === "grid" ? "grid" : "flex",
    flexDirection: layout === "row" ? "row" : layout === "column" ? "column" : undefined,
    gridTemplateColumns: layout === "grid" ? `repeat(${columns}, 1fr)` : undefined,
    gap,
    width: "100%",
    height: "100%",
    background,
    ...style,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  }

  return <div style={containerStyle}>{items}</div>
}

addPropertyControls(ImageReplicator, {
  image: {
    type: ControlType.ResponsiveImage,
    title: "Image",
  },
  count: {
    type: ControlType.Number,
    title: "Count",
    defaultValue: 6,
    min: 1,
    max: 24,
    step: 1,
    displayStepper: true,
  },
  layout: {
    type: ControlType.Enum,
    title: "Layout",
    options: ["grid", "row", "column"],
    optionTitles: ["Grid", "Row", "Column"],
    defaultValue: "grid",
  },
  columns: {
    type: ControlType.Number,
    title: "Columns",
    defaultValue: 3,
    min: 1,
    max: 12,
    step: 1,
    displayStepper: true,
    hidden: ({ layout }) => layout !== "grid",
  },
  gap: {
    type: ControlType.Number,
    title: "Gap",
    defaultValue: 0,
    min: 0,
    max: 64,
    step: 1,
    unit: "px",
  },
  rotation: {
    type: ControlType.Number,
    title: "Rotation",
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: "deg",
  },
  scale: {
    type: ControlType.Number,
    title: "Scale",
    defaultValue: 1,
    min: 0.1,
    max: 2,
    step: 0.05,
  },
  opacity: {
    type: ControlType.Number,
    title: "Opacity",
    defaultValue: 1,
    min: 0.1,
    max: 1,
    step: 0.05,
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: 8,
    min: 0,
    max: 64,
    step: 1,
    unit: "px",
  },
  shadow: {
    type: ControlType.Boolean,
    title: "Shadow",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide",
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#000000",
  },
})
