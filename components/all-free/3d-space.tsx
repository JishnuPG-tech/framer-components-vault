// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import ThreeDViewer from "./Three_dee_space.tsx"
import {
    PROPERTY_CONTROLS,
    DEFAULT_PROPS,
    ThreeDViewerProps,
} from "./Types_controls.tsx"
//

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function ThreeDeeSpaceFramer(props: ThreeDViewerProps) {
    return <ThreeDViewer {...props} />
}

addPropertyControls(
    ThreeDeeSpaceFramer,
    PROPERTY_CONTROLS as PropertyControls<ThreeDViewerProps>
)

ThreeDeeSpaceFramer.defaultProps = DEFAULT_PROPS
ThreeDeeSpaceFramer.displayName = "3D Space"
