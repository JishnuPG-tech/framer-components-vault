/**
 * CollageSpread
 * Made by RF Studio
 * Copyright © 2026 RF Studio
 */
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import Core from "https://framerusercontent.com/modules/SSJ8v7EsNWoYKZgq6XQI/5ZqXBAgGPAV9NEQIT474/CollageSpread.js"

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerDisableUnlink
 */
export default function CollageSpread(props) {
    return <Core {...props} />
}

const inheritedControls = { ...((Core as any).propertyControls ?? {}) }
const controlKeys = Object.keys(inheritedControls)
const creditControlKey = [...controlKeys].reverse().find(key => !inheritedControls[key].hidden) || controlKeys[controlKeys.length - 1]
if (creditControlKey) {
    const control = inheritedControls[creditControlKey]
    delete inheritedControls[creditControlKey]
    inheritedControls[creditControlKey] = { ...control, description: [control.description, "Made with ❤️ by [@riccardofala](https://www.riccardofala.com/)"].filter(Boolean).join("\n\n") }
}
addPropertyControls(CollageSpread, inheritedControls)
