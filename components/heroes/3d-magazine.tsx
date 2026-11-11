import { ThreeDMagazine } from "./ThreeD_magazine.tsx";
import {
  PROPERTY_CONTROLS,
  DEFAULT_PROPS,
  type ThreeDMagazineProps,
} from "./Subcomponents/Types_controls.tsx";
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
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function ThreeDMagazineFramer(props: ThreeDMagazineProps) {
  return <ThreeDMagazine {...props} />;
}

addPropertyControls(
  ThreeDMagazineFramer,
  PROPERTY_CONTROLS as PropertyControls<ThreeDMagazineProps>
);

ThreeDMagazineFramer.defaultProps = DEFAULT_PROPS;
ThreeDMagazineFramer.displayName = "3D Magazine";
