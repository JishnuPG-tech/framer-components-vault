import React, { useMemo, useId } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * SQUARE LOADER
 * A scalable, fully customizable version of the 3-box morphing loader.
 *
 * The whole animation is derived from two values:
 *   unit   = the base box size (original was 48)
 *   border = the border thickness (original was 16)
 *
 * Everything else is computed:
 *   big    = 2 * unit + border   (the container / long-bar length)
 *   off    = unit + border       (the travel offset)
 *
 * @framerSupportedLayoutWidth auto-height
 * @framerSupportedLayoutHeight auto-height
 * @framerIntrinsicWidth 112
 * @framerIntrinsicHeight 112
 */
export default function SquareLoader(props) {
    const {
        unit,
        border,
        color,
        filled,
        fillColor,
        cornerRadius,
        duration,
        delay,
        easing,
        paused,
    } = props

    // Unique id so multiple loaders on one page do not share keyframes
    const rawId = useId()
    const id = useMemo(() => "sl" + rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId])

    // Framer renders static contexts (thumbnails, exports, previews) where
    // continuous CSS animations should not run.
    const isStatic = useIsStaticRenderer()

    const u = unit
    const b = border
    const big = 2 * u + b
    const off = u + b

    const css = useMemo(() => {
        const px = (n) => `${n}px`

        // Each frame: [width, height, marginTop, marginLeft]
        const frame = (pct, w, h, mt, ml) =>
            `${pct}%{width:${px(w)};height:${px(h)};margin-top:${px(
                mt
            )};margin-left:${px(ml)};}`

        const box1 = [
            frame(0, big, u, off, 0),
            frame(12.5, u, u, off, 0),
            frame(25, u, u, off, 0),
            frame(37.5, u, u, off, 0),
            frame(50, u, u, off, 0),
            frame(62.5, u, u, off, 0),
            frame(75, u, big, 0, 0),
            frame(87.5, u, u, 0, 0),
            frame(100, u, u, 0, 0),
        ].join("")

        const box2 = [
            frame(0, u, u, 0, 0),
            frame(12.5, u, u, 0, 0),
            frame(25, u, u, 0, 0),
            frame(37.5, u, u, 0, 0),
            frame(50, big, u, 0, 0),
            frame(62.5, u, u, 0, off),
            frame(75, u, u, 0, off),
            frame(87.5, u, u, 0, off),
            frame(100, u, u, 0, off),
        ].join("")

        const box3 = [
            frame(0, u, u, 0, off),
            frame(12.5, u, u, 0, off),
            frame(25, u, big, 0, off),
            frame(37.5, u, u, off, off),
            frame(50, u, u, off, off),
            frame(62.5, u, u, off, off),
            frame(75, u, u, off, off),
            frame(87.5, u, u, off, off),
            frame(100, big, u, off, 0),
        ].join("")

        return `
@keyframes ${id}b1{${box1}}
@keyframes ${id}b2{${box2}}
@keyframes ${id}b3{${box3}}
`
    }, [id, u, b, big, off])

    const boxBase = {
        border: `${b}px solid ${color}`,
        background: filled ? fillColor : "transparent",
        borderRadius: cornerRadius,
        boxSizing: "border-box",
        position: "absolute",
        display: "block",
    }

    // Build the style for a single box. In static rendering contexts
    // (canvas, exports, thumbnails) the animation properties are omitted
    // entirely, leaving the box in its initial frame. The base inline
    // width / height / margins below already match keyframe 0 of each box,
    // so the loader renders as a clean, correct static fallback.
    const boxStyle = (name, frame) => {
        if (isStatic) {
            return { ...boxBase, ...frame }
        }
        return {
            ...boxBase,
            ...frame,
            animation: `${name} ${duration}s ${delay}s forwards ${easing} infinite`,
            animationPlayState: paused ? "paused" : "running",
        }
    }

    return (
        <div
            style={{
                width: big,
                height: big,
                position: "relative",
            }}
        >
            <style>{isStatic ? "" : css}</style>
            <div
                style={boxStyle(`${id}b1`, {
                    width: big,
                    height: u,
                    marginTop: off,
                    marginLeft: 0,
                })}
            />
            <div
                style={boxStyle(`${id}b2`, {
                    width: u,
                    height: u,
                    marginTop: 0,
                    marginLeft: 0,
                })}
            />
            <div
                style={boxStyle(`${id}b3`, {
                    width: u,
                    height: u,
                    marginTop: 0,
                    marginLeft: off,
                })}
            />
        </div>
    )
}

SquareLoader.defaultProps = {
    unit: 48,
    border: 16,
    color: "#f5f5f5",
    filled: false,
    fillColor: "#f5f5f5",
    cornerRadius: 0,
    duration: 4,
    delay: 1,
    easing: "ease-in-out",
    paused: false,
}

addPropertyControls(SquareLoader, {
    unit: {
        type: ControlType.Number,
        title: "Box Size",
        min: 8,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    border: {
        type: ControlType.Number,
        title: "Thickness",
        min: 1,
        max: 60,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    filled: {
        type: ControlType.Boolean,
        title: "Fill",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        hidden: (props) => !props.filled,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.5,
        max: 12,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["ease-in-out", "ease", "linear", "ease-in", "ease-out"],
        optionTitles: ["Ease In Out", "Ease", "Linear", "Ease In", "Ease Out"],
    },
    paused: {
        type: ControlType.Boolean,
        title: "Paused",
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
