// LeverToggle.tsx
// A fully customizable circuit-breaker style lever toggle for Framer.
// Original CSS design by njesenberger (Uiverse.io), rebuilt as a Framer code component.

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


/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 180
 */
export default function LeverToggle(props) {
    const {
        size,
        defaultOn,
        disabled,

        // Knob (the round lever cap)
        knobHighlight,
        knobMain,
        knobDark,

        // Bar (the lever shaft)
        barEdge,
        barMid,
        barCenter,

        // Base off state (slot when OFF)
        baseOffLight,
        baseOffDark,

        // Base on state (slot when ON)
        baseOnLight,
        baseOnDark,

        // Base housing (outer shell)
        baseShellLight,
        baseShellDark,

        // Motion
        duration,

        onChange,
        style,
    } = props

    // Unique id so multiple instances do not share or collide on CSS.
    const uid = React.useId().replace(/[:]/g, "")
    const cls = `lvt-${uid}`

    const [isOn, setIsOn] = React.useState(Boolean(defaultOn))

    // Keep internal state in sync if the canvas default changes.
    React.useEffect(() => {
        setIsOn(Boolean(defaultOn))
    }, [defaultOn])

    const handleToggle = (e) => {
        if (disabled) return
        const next = e.target.checked
        setIsOn(next)
        if (typeof onChange === "function") onChange(next)
    }

    const dur = `${duration}s`

    const css = `
.${cls}-root {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: visible;
  opacity: ${disabled ? 0.5 : 1};
  pointer-events: ${disabled ? "none" : "auto"};
}

.${cls}-stage {
  font-size: ${size}px;
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  padding-top: 5.5em;
  overflow: visible;
}

.${cls}-container {
  --knob-size: 1.75em;
  display: flex;
  justify-content: center;
  position: relative;
}

.${cls}-input {
  position: absolute;
  z-index: 2;
  bottom: 132.5%;
  border-radius: 50%;
  transform: rotate(-25deg);
  transform-origin: 50% 4.75em;
  width: var(--knob-size);
  height: var(--knob-size);
  opacity: 0;
  font: inherit;
  margin: 0;
  transition: transform ${dur} cubic-bezier(.65, 1.35, .5, 1);
  cursor: pointer;
}
.${cls}-input:checked {
  transform: rotate(25deg);
}

.${cls}-handle-wrapper {
  position: absolute;
  z-index: 1;
  bottom: -135%;
  -webkit-mask-image: linear-gradient(to bottom, #000 62.125%, transparent 50%);
  mask-image: linear-gradient(to bottom, #000 62.125%, transparent 50%);
  width: 200%;
  overflow: hidden;
}

.${cls}-handle {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: rotate(-25deg);
  transform-origin: bottom center;
  transition: transform ${dur} cubic-bezier(.65, 1.35, .5, 1);
}
.${cls}-input:checked + .${cls}-handle-wrapper > .${cls}-handle {
  transform: rotate(25deg);
}

.${cls}-knob {
  position: relative;
  z-index: 1;
  border-radius: 50%;
  width: var(--knob-size);
  height: var(--knob-size);
  background-image: radial-gradient(farthest-corner at 70% 30%,
    ${knobHighlight} 4%,
    ${knobMain} 12% 24%,
    ${knobDark} 50% 65%,
    ${knobMain} 75%);
  transition: transform ${dur} cubic-bezier(.65, 1.35, .5, 1);
}
.${cls}-input:checked + .${cls}-handle-wrapper .${cls}-knob {
  transform: rotate(-90deg);
}

.${cls}-knob::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  border-radius: inherit;
  width: 100%;
  height: 100%;
  box-shadow: inset 0 0 8px 2px rgb(255 255 255 / .4);
  opacity: 0;
  transition: opacity .2s;
}
@media (hover: hover) {
  .${cls}-input:hover + .${cls}-handle-wrapper .${cls}-knob::after,
  .${cls}-input:focus-visible + .${cls}-handle-wrapper .${cls}-knob::after {
    opacity: 1;
  }
}

.${cls}-bar-wrapper {
  position: relative;
  width: .5em;
  height: 3em;
}

.${cls}-bar {
  position: absolute;
  top: calc(var(--knob-size) / 2 * -1);
  left: 0;
  width: 100%;
  height: calc(100% + var(--knob-size) / 2);
  background-image: linear-gradient(to right,
    ${barEdge}, ${barMid}, ${barCenter} 45% 55%, ${barMid}, ${barEdge});
  background-position-x: .06125em;
  transition: background-position-x ${dur} cubic-bezier(.65, 1.35, .5, 1);
  box-shadow: inset 0 1em .25em rgb(0 0 0 / .4);
}
.${cls}-input:checked + .${cls}-handle-wrapper .${cls}-bar {
  background-position-x: -.06125em;
}

.${cls}-base {
  position: relative;
  border-radius: 3.125em;
  padding: .25em;
  width: 3.5em;
  height: 1.125em;
  background-color: ${baseShellLight};
  background-image: linear-gradient(to bottom, ${baseShellLight}, ${baseShellDark});
  box-shadow: 0 -.25em .5em ${baseShellLight}, 0 .25em .5em ${baseShellDark};
}

.${cls}-base-inside {
  position: relative;
  border-radius: inherit;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, ${baseOffLight}, ${baseOffDark});
  box-shadow: inset 0 .0625em rgb(255 255 255 / .2),
              inset 0 -.03125em rgb(255 255 255 / 1),
              inset 0 -.0625em .25em rgb(0 0 0 / .1);
}

.${cls}-base-inside::after {
  content: '';
  position: absolute;
  border-radius: inherit;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, ${baseOnLight}, ${baseOnDark});
  box-shadow: inherit;
  opacity: 0;
  transition: opacity ${dur} cubic-bezier(.65, 1.35, .5, 1);
}
.${cls}-input:checked ~ .${cls}-base .${cls}-base-inside::after {
  opacity: 1;
}
`

    return (
        <div className={`${cls}-root`} style={style}>
            <style>{css}</style>
            <div className={`${cls}-stage`}>
                <div className={`${cls}-container`}>
                    <input
                        className={`${cls}-input`}
                        type="checkbox"
                        checked={isOn}
                        disabled={disabled}
                        onChange={handleToggle}
                        aria-label="toggle"
                    />
                    <div className={`${cls}-handle-wrapper`}>
                        <div className={`${cls}-handle`}>
                            <div className={`${cls}-knob`} />
                            <div className={`${cls}-bar-wrapper`}>
                                <div className={`${cls}-bar`} />
                            </div>
                        </div>
                    </div>
                    <div className={`${cls}-base`}>
                        <div className={`${cls}-base-inside`} />
                    </div>
                </div>
            </div>
        </div>
    )
}

LeverToggle.defaultProps = {
    size: 16,
    defaultOn: false,
    disabled: false,

    knobHighlight: "#fedee2",
    knobMain: "#d63534",
    knobDark: "#a81a1a",

    barEdge: "#777475",
    barMid: "#a4a4a4",
    barCenter: "#ffffff",

    baseOffLight: "#a6a6a6",
    baseOffDark: "#7d7d7d",

    baseOnLight: "#5ab054",
    baseOnDark: "#438c3c",

    baseShellLight: "#ffffff",
    baseShellDark: "#d7d7d7",

    duration: 0.24,
}

addPropertyControls(LeverToggle, {
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 8,
        max: 64,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    defaultOn: {
        type: ControlType.Boolean,
        title: "Default On",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
    },
    duration: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 2,
        step: 0.02,
        unit: "s",
        displayStepper: true,
    },

    knobHighlight: {
        type: ControlType.Color,
        title: "Knob Light",
    },
    knobMain: {
        type: ControlType.Color,
        title: "Knob Main",
    },
    knobDark: {
        type: ControlType.Color,
        title: "Knob Dark",
    },

    barEdge: {
        type: ControlType.Color,
        title: "Bar Edge",
    },
    barMid: {
        type: ControlType.Color,
        title: "Bar Mid",
    },
    barCenter: {
        type: ControlType.Color,
        title: "Bar Center",
    },

    baseOffLight: {
        type: ControlType.Color,
        title: "Off Top",
    },
    baseOffDark: {
        type: ControlType.Color,
        title: "Off Bottom",
    },

    baseOnLight: {
        type: ControlType.Color,
        title: "On Top",
    },
    baseOnDark: {
        type: ControlType.Color,
        title: "On Bottom",
    },

    baseShellLight: {
        type: ControlType.Color,
        title: "Shell Top",
    },
    baseShellDark: {
        type: ControlType.Color,
        title: "Shell Bottom",
    },

    onChange: {
        type: ControlType.EventHandler,
    },
})
