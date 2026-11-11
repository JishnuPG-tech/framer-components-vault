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

import * as THREE from "three"

/**
 * AIRCORD-style cylindrical carousel with interactive fluid water floor.
 *
 * Reconstruction from the supplied recording, using custom curved geometry.
 * The fluid simulation runs in the background and applies a rippling water
 * effect and specular highlights to the reflection area.
 * Added property controls to customize the fluid simulation natively in Framer.
 */

type FramerImage = string | { src: string; srcSet?: string; alt?: string }

type Slide = {
    title: string
    media?: string
    image?: FramerImage
    video?: string
    videoURL?: string
    link?: string | null
}

type MotionSettings = {
    autoRotate?: boolean
    speed?: number
    pauseOnHover?: boolean
    playVideos?: boolean
}

type VisualSettings = {
    panelHeight?: number
    gap?: number
    reflection?: number
    titleSize?: number
    fontURL?: string
    background?: string
    saturation?: number
    brightness?: number
    contrast?: number
}

type WaterSettings = {
    waterRefraction?: number
    waterHighlight?: number
    waterFadeSpeed?: number
    waterMotionFade?: number
    waterCurl?: number
    waterTouchSize?: number
    waterPressureIterations?: number
}

type NavigationSettings = {
    showControls?: boolean
    openNewTab?: boolean
}

type Props = MotionSettings &
    VisualSettings &
    NavigationSettings &
    WaterSettings & {
        livePreview?: boolean
        slides?: Slide[]
        initialSlide?: number
        motion?: MotionSettings
        visual?: VisualSettings
        water?: WaterSettings
        navigation?: NavigationSettings
        style?: React.CSSProperties
    }

const DEFAULT_SLIDES: Slide[] = []

function safeAssetURL(value?: string): string {
    if (!value || typeof window === "undefined") return ""
    try {
        const url = new URL(value, window.location.href)
        if (url.username || url.password) return ""
        if (url.protocol === "blob:") {
            return url.origin === window.location.origin ? url.href : ""
        }
        if (
            url.protocol !== "https:" &&
            !(url.protocol === "http:" && url.origin === window.location.origin)
        ) {
            return ""
        }
        if (url.origin === window.location.origin) return url.href
        if (
            url.protocol === "https:" &&
            (url.hostname === "framerusercontent.com" ||
                url.hostname.endsWith(".framerusercontent.com"))
        )
            return url.href
    } catch {
        /* Untrusted or malformed asset URL. */
    }
    return ""
}

function slideImageURL(image?: FramerImage): string {
    return safeAssetURL(typeof image === "string" ? image : image?.src)
}

function isVideoAsset(value: string): boolean {
    try {
        const pathname = new URL(value).pathname.toLowerCase()
        return /\.(mp4|webm|mov|ogg|m4v)$/.test(pathname)
    } catch {
        return false
    }
}

function resolveSlideMedia(item: Slide) {
    const media = safeAssetURL(item.media)
    const legacyImage = slideImageURL(item.image)
    const legacyVideo = safeAssetURL(item.video || item.videoURL)
    if (media) {
        if (isVideoAsset(media)) {
            return {
                imageSource: legacyImage,
                videoSource: media,
                fallbackVideo: "",
            }
        }
        return {
            imageSource: media,
            videoSource: legacyVideo,
            fallbackVideo: legacyVideo ? "" : media,
        }
    }
    return {
        imageSource: legacyImage,
        videoSource: legacyVideo,
        fallbackVideo: "",
    }
}

const VERTEX = `
    varying vec2 vUv;
    varying vec3 vWorld;
    varying vec3 vNormal;

    void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`

const SCREEN_FRAGMENT = `
    precision highp float;

    uniform sampler2D uImage;
    uniform sampler2D uVideo;
    uniform sampler2D uTitle;

    uniform vec2 uImageScale;
    uniform vec2 uVideoScale;

    uniform float uVideoReady;
    uniform float uHover;
    uniform float uReflection;
    uniform float uSaturation;
    uniform float uBrightness;
    uniform float uContrast;
    
    uniform vec2 uViewport;
    uniform sampler2D uFluid;
    uniform vec2 uFluidTexelSize;
    
    uniform float uWaterRefraction;
    uniform float uWaterHighlight;

    varying vec2 vUv;
    varying vec3 vWorld;
    varying vec3 vNormal;

    vec3 media(vec2 uv) {
        if (uVideoReady > 0.5) {
            return texture2D(
                uVideo,
                (uv - 0.5) * uVideoScale + 0.5
            ).rgb;
        }

        return texture2D(
            uImage,
            (uv - 0.5) * uImageScale + 0.5
        ).rgb;
    }

    void main() {
        vec3 color = media(vUv);

        if (uReflection > 0.0) {
            vec2 screenUv = gl_FragCoord.xy / max(uViewport, vec2(1.0));
            
            float FL = texture2D(uFluid, screenUv - vec2(uFluidTexelSize.x, 0.0)).r;
            float FR = texture2D(uFluid, screenUv + vec2(uFluidTexelSize.x, 0.0)).r;
            float FT = texture2D(uFluid, screenUv + vec2(0.0, uFluidTexelSize.y)).r;
            float FB = texture2D(uFluid, screenUv - vec2(0.0, uFluidTexelSize.y)).r;
            
            vec2 grad = vec2(FR - FL, FT - FB);
            vec2 distort = vec2(grad.x, grad.y);
            
            vec2 baseUv = vUv - distort * uWaterRefraction;

            vec2 blur = vec2(0.003, 0.006) * (0.3 + vUv.y);

            color = media(baseUv) * 0.40
                + media(baseUv + vec2(blur.x, 0.0)) * 0.15
                + media(baseUv - vec2(blur.x, 0.0)) * 0.15
                + media(baseUv + vec2(0.0, blur.y)) * 0.15
                + media(baseUv - vec2(0.0, blur.y)) * 0.15;
                
            vec3 fNormal = normalize(vec3(-grad.x, -grad.y, 0.02));
            vec3 fLightDir = normalize(vec3(1.0, 1.0, 1.0));
            float spec = pow(max(dot(fNormal, fLightDir), 0.0), 30.0) * uWaterHighlight;
            float densityMask = texture2D(uFluid, screenUv).r;
            float smoothMask = smoothstep(0.0, 0.1, densityMask);
            color += spec * smoothMask;
        }

        // Grade only source media, leaving the title and arrow graphics intact.
        color = (color - vec3(0.5)) * uContrast + vec3(0.5);
        color *= uBrightness;
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = max(vec3(0.0), mix(vec3(luma), color, uSaturation));

        vec3 viewDirection = normalize(cameraPosition - vWorld);
        vec3 n = normalize(vNormal);
        float facing = abs(dot(n, viewDirection));
        float sideLight = mix(0.60, 1.0, pow(facing, 0.45));
        float brightness = mix(0.58, 1.0, uHover);

        color *= brightness * sideLight;

        vec3 t = normalize(cross(vec3(0.0, 1.0, 0.0), n));
        vec3 b = normalize(cross(n, t));
        vec2 parallax = vec2(dot(viewDirection, t), dot(viewDirection, b));
        vec2 titleUv = vUv - parallax * 0.035;

        vec4 title = texture2D(uTitle, titleUv);
        float titleAlpha = title.a * (1.0 - uHover) * 0.96;
        color = mix(color, title.rgb * sideLight, titleAlpha);

        if (!gl_FrontFacing) {
            color *= 0.055;
        }

        float edge = smoothstep(
            0.0,
            0.0015,
            min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y))
        );

        color *= edge;

        float alpha = 1.0;

        if (uReflection > 0.0) {
            alpha = min(1.0, uReflection * pow(1.0 - vUv.y, 2.6));
            color *= vec3(0.78, 0.84, 0.85);
        }

        // Textures intentionally use NoColorSpace. Samples are display-encoded;
        // this custom shader outputs those values without a second conversion.
        gl_FragColor = vec4(color, alpha);
    }
`

const BACKGROUND_VERTEX = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.999, 1.0);
    }
`

const BACKGROUND_FRAGMENT = `
    precision highp float;

    uniform float uTime;
    uniform float uAspect;
    uniform vec3 uBackground;

    varying vec2 vUv;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x),
            f.y
        );
    }

    float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;

        for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p = mat2(1.6, -1.2, 1.2, 1.6) * p + 7.3;
            amplitude *= 0.5;
        }

        return value;
    }

    void main() {
        vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
        float mist = fbm(p * 5.0 + vec2(uTime * 0.012, 0.0));
        float upper = exp(-pow((vUv.y - 0.83) * 5.0, 2.0));
        float lower = exp(-pow((vUv.y - 0.12) * 7.0, 2.0));
        float vignette = 1.0 - smoothstep(0.25, 1.35, length(p));

        vec3 atmospheric = vec3(0.055, 0.071, 0.077)
            * pow(mist, 2.5)
            * (upper + lower * 0.18)
            * vignette;

        float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.003;
        vec3 color = uBackground + atmospheric + grain;

        gl_FragColor = vec4(max(color, 0.0), 1.0);
    }
`

const CURSOR_FRAGMENT = `
    precision highp float;

    uniform float uOpacity;
    uniform sampler2D uScene;
    uniform vec2 uViewport;
    varying vec2 vUv;

    float segment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
    }

    void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r2 = dot(p, p);
        if (r2 > 1.0) discard;

        vec3 n = normalize(vec3(p, sqrt(max(0.0, 1.0 - r2))));
        float fresnel = pow(1.0 - max(n.z, 0.0), 2.8);
        vec2 screenUV = gl_FragCoord.xy / max(uViewport, vec2(1.0));
        vec2 refraction = -p * (0.012 + 0.018 * (1.0 - r2));
        vec2 sampleUV = clamp(screenUV + refraction, vec2(0.002), vec2(0.998));
        vec2 dispersion = p * 0.0028;

        vec3 refracted = vec3(
            texture2D(uScene, clamp(sampleUV + dispersion, vec2(0.002), vec2(0.998))).r,
            texture2D(uScene, sampleUV).g,
            texture2D(uScene, clamp(sampleUV - dispersion, vec2(0.002), vec2(0.998))).b
        );

        vec3 light = normalize(vec3(-0.55, 0.75, 1.0));
        float highlight = pow(max(dot(n, light), 0.0), 36.0);
        float rim = smoothstep(0.72, 0.99, sqrt(r2));
        vec3 color = refracted * (1.07 + 0.05 * n.z);
        color = mix(color, vec3(0.88, 0.95, 1.0), fresnel * 0.48);
        color += vec3(0.9, 0.96, 1.0) * (highlight * 0.75 + rim * 0.20);

        float arrow = min(
            segment(p, vec2(-0.45, 0.0), vec2(0.43, 0.0)),
            min(
                segment(p, vec2(0.09, 0.31), vec2(0.43, 0.0)),
                segment(p, vec2(0.09, -0.31), vec2(0.43, 0.0))
            )
        );
        float arrowAlpha = 1.0 - smoothstep(0.028, 0.048, arrow);
        color = mix(color, vec3(0.97, 0.99, 1.0), arrowAlpha * 0.93);

        float alpha = (1.0 - smoothstep(0.975, 1.0, sqrt(r2))) * uOpacity;
        gl_FragColor = vec4(color, alpha * 0.96);
    }
`

const FLUID_VERTEX = `
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;
    void main () {
        vUv = uv;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(position, 1.0);
    }
`

const CLEAR_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`

const SPLAT_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`

const ADVECTION_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;
    void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
        gl_FragColor.a = 1.0;
    }
`

const ADVECTION_MANUAL_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;
    vec4 bilerp (in sampler2D sam, in vec2 p) {
        vec4 st;
        st.xy = floor(p - 0.5) + 0.5;
        st.zw = st.xy + 1.0;
        vec4 uv = st * texelSize.xyxy;
        vec4 a = texture2D(sam, uv.xy);
        vec4 b = texture2D(sam, uv.zy);
        vec4 c = texture2D(sam, uv.xw);
        vec4 d = texture2D(sam, uv.zw);
        vec2 f = p - st.xy;
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    void main () {
        vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
        gl_FragColor = dissipation * bilerp(uSource, coord);
        gl_FragColor.a = 1.0;
    }
`

const DIVERGENCE_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    vec2 sampleVelocity (in vec2 uv) {
        vec2 multiplier = vec2(1.0, 1.0);
        if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
        if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
        if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
        if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
        return multiplier * texture2D(uVelocity, uv).xy;
    }
    void main () {
        float L = sampleVelocity(vL).x;
        float R = sampleVelocity(vR).x;
        float T = sampleVelocity(vT).y;
        float B = sampleVelocity(vB).y;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`

const CURL_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
    }
`

const VORTICITY_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main () {
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = vec2(abs(T) - abs(B), 0.0);
        force *= 1.0 / length(force + 0.00001) * curl * C;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
`

const PRESSURE_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    vec2 boundary (in vec2 uv) {
        uv = min(max(uv, 0.0), 1.0);
        return uv;
    }
    void main () {
        float L = texture2D(uPressure, boundary(vL)).x;
        float R = texture2D(uPressure, boundary(vR)).x;
        float T = texture2D(uPressure, boundary(vT)).x;
        float B = texture2D(uPressure, boundary(vB)).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`

const GRADIENT_SUBTRACT_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    vec2 boundary (in vec2 uv) {
        uv = min(max(uv, 0.0), 1.0);
        return uv;
    }
    void main () {
        float L = texture2D(uPressure, boundary(vL)).x;
        float R = texture2D(uPressure, boundary(vR)).x;
        float T = texture2D(uPressure, boundary(vT)).x;
        float B = texture2D(uPressure, boundary(vB)).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`

const FONT_CACHE = new Map<
    string,
    Promise<{ family: string; loaded: boolean }>
>()

function loadFont(url: string) {
    url = safeAssetURL(url)
    if (!url || typeof FontFace === "undefined") {
        return Promise.resolve({ family: "Arial", loaded: false })
    }

    if (!FONT_CACHE.has(url)) {
        const family = `CarouselFont${FONT_CACHE.size}`
        const face = new FontFace(family, `url(${JSON.stringify(url)})`)

        FONT_CACHE.set(
            url,
            face
                .load()
                .then((font) => {
                    ;(
                        document.fonts as FontFaceSet & {
                            add: (face: FontFace) => void
                        }
                    ).add(font)
                    return { family, loaded: true }
                })
                .catch(() => ({ family: "Arial", loaded: false }))
        )
    }

    return FONT_CACHE.get(url)!
}

function cover(scale: THREE.Vector2, aspect: number, target: number) {
    if (aspect > target) {
        scale.set(target / aspect, 1)
    } else {
        scale.set(1, aspect / target)
    }
}

function wrap(value: number, length: number) {
    return ((value % length) + length) % length
}

function projectHref(link?: string | null): string {
    if (typeof link !== "string") return ""
    const value = link.trim()
    if (!value || value.startsWith("//") || value.includes("\\")) return ""
    if (/[\x00-\x1F\x7F]/.test(value)) return ""
    if (/^(?:javascript|data|vbscript|file):/i.test(value)) return ""

    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
        if (/^(?:mailto|tel):/i.test(value)) return value
        if (!/^https?:\/\//i.test(value)) return ""
        try {
            const url = new URL(value)
            if (url.username || url.password || !url.hostname) return ""
            return url.href
        } catch {
            return ""
        }
    }

    if (/^(?:\/|\.\.?\/|#|\?)/.test(value)) return value

    if (
        /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?=$|[/?#])/i.test(
            value
        )
    ) {
        try {
            const url = new URL(`https://${value}`)
            if (url.username || url.password) return ""
            return url.href
        } catch {
            return ""
        }
    }

    return value
}

function projectLinkTarget(href: string, forceNewTab: boolean): string {
    if (/^(?:mailto|tel):/i.test(href)) return "_self"
    return forceNewTab || /^https?:/i.test(href) ? "_blank" : "_self"
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1400
 * @framerIntrinsicHeight 634
 * @framerDisableUnlink
 */
export default function AircordCarousel(incomingProps: Props) {
    const props = {
        ...incomingProps,
        ...(incomingProps.motion || {}),
        ...(incomingProps.visual || {}),
        ...(incomingProps.water || {}),
        ...(incomingProps.navigation || {}),
    }
    const {
        livePreview = true,
        slides = DEFAULT_SLIDES,
        autoRotate = true,
        speed = 0.28,
        pauseOnHover = true,
        playVideos = true,
        initialSlide = 1,
        panelHeight = 1.02,
        gap = 0.018,
        reflection = 0.39,
        titleSize = 0.145,
        fontURL = "",
        background = "#020303",
        saturation = 100,
        brightness = 100,
        contrast = 100,
        waterRefraction = 1.0,
        waterHighlight = 1.5,
        waterFadeSpeed = 1.8,
        waterMotionFade = 100,
        waterCurl = 40.0,
        waterTouchSize = 3.0,
        waterPressureIterations = 30,
        showControls = false,
        openNewTab = false,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && livePreview
    const hostRef = React.useRef<HTMLDivElement>(null)
    const linkRef = React.useRef<HTMLAnchorElement>(null)
    const actionRef = React.useRef<{
        step: (direction: number) => void
        open: () => void
    } | null>(null)

    const [error, setError] = React.useState("")
    const [webglFallback, setWebglFallback] = React.useState(false)
    const [generation, setGeneration] = React.useState(0)
    const [activeTitle, setActiveTitle] = React.useState("")

    const motionRef = React.useRef({
        autoRotate,
        speed,
        pauseOnHover,
        playVideos,
    })
    motionRef.current = { autoRotate, speed, pauseOnHover, playVideos }

    const waterSettingsRef = React.useRef({
        fadeSpeed: waterFadeSpeed,
        motionFade: waterMotionFade,
        curl: waterCurl,
        touchSize: waterTouchSize,
        pressureIterations: waterPressureIterations,
    })
    waterSettingsRef.current = {
        fadeSpeed: waterFadeSpeed,
        motionFade: waterMotionFade,
        curl: waterCurl,
        touchSize: waterTouchSize,
        pressureIterations: waterPressureIterations,
    }

    const gradingRef = React.useRef<
        Array<{
            uSaturation: { value: number }
            uBrightness: { value: number }
            uContrast: { value: number }
            uWaterRefraction: { value: number }
            uWaterHighlight: { value: number }
        }>
    >([])
    const requestStaticFrameRef = React.useRef<(() => void) | null>(null)

    React.useEffect(() => {
        gradingRef.current.forEach((uniforms) => {
            uniforms.uSaturation.value = Math.max(0, saturation) / 100
            uniforms.uBrightness.value = Math.max(0, brightness) / 100
            uniforms.uContrast.value = Math.max(0, contrast) / 100
            uniforms.uWaterRefraction.value = waterRefraction
            uniforms.uWaterHighlight.value = waterHighlight
        })
        requestStaticFrameRef.current?.()
    }, [saturation, brightness, contrast, waterRefraction, waterHighlight])

    const serialized = JSON.stringify(slides ?? DEFAULT_SLIDES)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    React.useEffect(() => {
        const host = hostRef.current
        const nativeLink = linkRef.current
        if (!host) return

        setError("")
        setWebglFallback(false)

        const parsed = JSON.parse(serialized) as Slide[]
        const source = Array.isArray(parsed)
            ? parsed.filter(
                  (item) =>
                      item &&
                      (resolveSlideMedia(item).imageSource ||
                          resolveSlideMedia(item).videoSource)
              )
            : []
        if (source.length === 0) {
            setActiveTitle("")
            return
        }
        const count =
            source.length >= 8
                ? source.length
                : source.length * Math.ceil(12 / source.length)

        const items = Array.from(
            { length: count },
            (_, index) => source[index % source.length]
        )

        let disposed = false
        let frame = 0
        let width = 1
        let height = 1
        let inView = true
        let pageVisible = !document.hidden
        let previousTime = 0
        let elapsed = 0
        let lastInput = -10000
        let lastActive = -1
        let dragging = false
        let dragDistance = 0
        let previousX = 0
        let previousY = 0
        let previousDragTime = 0
        let dragVelocity = 0
        let cursorOpacity = 0
        let isHoveringMedia = false
        let fluidPointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false }

        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        let reducedMotion = motionQuery.matches

        const controller = new AbortController()
        const { signal } = controller

        let renderer: THREE.WebGLRenderer

        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: "high-performance",
                alpha: false,
            })
        } catch (firstFailure) {
            try {
                renderer = new THREE.WebGLRenderer({
                    antialias: false,
                    powerPreference: "default",
                    alpha: false,
                })
            } catch (secondFailure) {
                console.warn(
                    "AircordCarousel: WebGL2 renderer initialization failed; displaying a static preview.",
                    firstFailure,
                    secondFailure
                )
                setWebglFallback(true)
                return
            }
        }

        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.NoToneMapping
        renderer.setClearColor(background, 1)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(
            Math.max(1, host.clientWidth),
            Math.max(1, host.clientHeight),
            false
        )

        const canvas = renderer.domElement
        canvas.style.cssText =
            "position:absolute;inset:0;width:100%;height:100%;display:block;"
        canvas.setAttribute("aria-hidden", "true")
        host.prepend(canvas)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 60)
        camera.position.set(0, 0.28, 7)
        camera.lookAt(0, 0, 5)

        const radius = 5
        const step = (Math.PI * 2) / count
        const arc = Math.max(step * 0.65, step - gap)
        const aspect = (radius * arc) / panelHeight

        const start = wrap(initialSlide - 1, count)
        let current = start
        let target = start

        const pointer = {
            x: 0,
            y: 0,
            inside: false,
            ndc: new THREE.Vector2(10, 10),
        }

        const textures = new Set<THREE.Texture>()
        const materials = new Set<THREE.Material>()
        const geometries = new Set<THREE.BufferGeometry>()

        const drawingSize = new THREE.Vector2(1, 1)

        // ---- FLUID SIMULATION SETUP ----
        const simRes = 128
        const texelSize = new THREE.Vector2(1.0 / simRes, 1.0 / simRes)
        const supportLinearFiltering =
            renderer.capabilities.isWebGL2 ||
            renderer.extensions.has("OES_texture_half_float_linear")
        const filter = supportLinearFiltering
            ? THREE.LinearFilter
            : THREE.NearestFilter

        const createFBO = () =>
            new THREE.WebGLRenderTarget(simRes, simRes, {
                type: THREE.HalfFloatType,
                format: THREE.RGBAFormat,
                minFilter: filter,
                magFilter: filter,
                depthBuffer: false,
            })
        const createDoubleFBO = () => {
            let read = createFBO()
            let write = createFBO()
            return {
                get read() {
                    return read
                },
                get write() {
                    return write
                },
                swap: function () {
                    let tmp = read
                    read = write
                    write = tmp
                },
            }
        }

        const density = createDoubleFBO()
        const velocity = createDoubleFBO()
        const divergence = createFBO()
        const curl = createFBO()
        const pressure = createDoubleFBO()

        const fluidScene = new THREE.Scene()
        const fluidCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        const fluidPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
        fluidScene.add(fluidPlane)

        const blit = (
            target: THREE.WebGLRenderTarget | null,
            material: THREE.Material
        ) => {
            fluidPlane.material = material
            const currentTarget = renderer.getRenderTarget()
            renderer.setRenderTarget(target)
            renderer.render(fluidScene, fluidCamera)
            renderer.setRenderTarget(currentTarget)
        }

        const fluidBaseUniforms = { texelSize: { value: texelSize } }
        const clearMat = new THREE.ShaderMaterial({
            vertexShader: FLUID_VERTEX,
            fragmentShader: CLEAR_FRAG,
            uniforms: { uTexture: { value: null }, value: { value: 0 } },
            depthWrite: false,
            depthTest: false,
        })
        const splatMat = new THREE.ShaderMaterial({
            vertexShader: FLUID_VERTEX,
            fragmentShader: SPLAT_FRAG,
            uniforms: {
                uTarget: { value: null },
                aspectRatio: { value: 1 },
                color: { value: new THREE.Vector3() },
                point: { value: new THREE.Vector2() },
                radius: { value: 0.003 },
            },
            depthWrite: false,
            depthTest: false,
        })
        const advectionMat = new THREE.ShaderMaterial({
            vertexShader: FLUID_VERTEX,
            fragmentShader: supportLinearFiltering
                ? ADVECTION_FRAG
                : ADVECTION_MANUAL_FRAG,
            uniforms: {
                ...fluidBaseUniforms,
                uVelocity: { value: null },
                uSource: { value: null },
                dt: { value: 0.016 },
                dissipation: { value: 1.0 },
            },
            depthWrite: false,
            depthTest: false,
        })
        const divergenceMat = new THREE.ShaderMaterial({
            vertexShader: FLUID_VERTEX,
            fragmentShader: DIVERGENCE_FRAG,
            uniforms: { ...fluidBaseUniforms, uVelocity: { value: null } },
            depthWrite: false,
            depthTest: false,
        })
        const curlMat = new THREE.ShaderMaterial({
            vertexShader: FLUID_VERTEX,
            fragmentShader: CURL_FRAG,
            uniforms: { ...fluidBaseUniforms, uVelocity: { value: null } },
            depthWrite: false,
            depthTest: false,
        })
        const vorticityMat = new THREE.ShaderMaterial({
            vertexShader: FLUID_VERTEX,
            fragmentShader: VORTICITY_FRAG,
            uniforms: {
                ...fluidBaseUniforms,
                uVelocity: { value: null },
                uCurl: { value: null },
                curl: { value: 40.0 },
                dt: { value: 0.016 },
            },
            depthWrite: false,
            depthTest: false,
        })
        const pressureMat = new THREE.ShaderMaterial({
            vertexShader: FLUID_VERTEX,
            fragmentShader: PRESSURE_FRAG,
            uniforms: {
                ...fluidBaseUniforms,
                uPressure: { value: null },
                uDivergence: { value: null },
            },
            depthWrite: false,
            depthTest: false,
        })
        const gradientSubtractMat = new THREE.ShaderMaterial({
            vertexShader: FLUID_VERTEX,
            fragmentShader: GRADIENT_SUBTRACT_FRAG,
            uniforms: {
                ...fluidBaseUniforms,
                uPressure: { value: null },
                uVelocity: { value: null },
            },
            depthWrite: false,
            depthTest: false,
        })

        const splatStack: {
            x: number
            y: number
            dx: number
            dy: number
            color: number[]
        }[] = []
        const addSplat = (
            x: number,
            y: number,
            dx: number,
            dy: number,
            color: number[]
        ) => {
            splatStack.push({ x, y, dx, dy, color })
        }
        const applySplat = (
            x: number,
            y: number,
            dx: number,
            dy: number,
            color: number[]
        ) => {
            splatMat.uniforms.uTarget.value = velocity.read.texture
            splatMat.uniforms.aspectRatio.value = width / height
            splatMat.uniforms.point.value.set(x / width, 1.0 - y / height)
            splatMat.uniforms.color.value.set(dx, -dy, 1.0)
            splatMat.uniforms.radius.value =
                waterSettingsRef.current.touchSize / 1000.0
            blit(velocity.write, splatMat)
            velocity.swap()

            splatMat.uniforms.uTarget.value = density.read.texture
            splatMat.uniforms.color.value.set(
                color[0] * 0.3,
                color[1] * 0.3,
                color[2] * 0.3
            )
            blit(density.write, splatMat)
            density.swap()
        }

        const updateFluid = (dt: number) => {
            while (splatStack.length > 0) {
                let s = splatStack.pop()!
                applySplat(s.x, s.y, s.dx, s.dy, s.color)
            }

            advectionMat.uniforms.uVelocity.value = velocity.read.texture
            advectionMat.uniforms.uSource.value = velocity.read.texture
            advectionMat.uniforms.dt.value = dt
            advectionMat.uniforms.dissipation.value =
                waterSettingsRef.current.motionFade / 100.0
            blit(velocity.write, advectionMat)
            velocity.swap()

            advectionMat.uniforms.uVelocity.value = velocity.read.texture
            advectionMat.uniforms.uSource.value = density.read.texture
            advectionMat.uniforms.dissipation.value = Math.max(
                0.0,
                1.0 - waterSettingsRef.current.fadeSpeed / 100.0
            )
            blit(density.write, advectionMat)
            density.swap()

            curlMat.uniforms.uVelocity.value = velocity.read.texture
            blit(curl, curlMat)

            vorticityMat.uniforms.uVelocity.value = velocity.read.texture
            vorticityMat.uniforms.uCurl.value = curl.texture
            vorticityMat.uniforms.curl.value = waterSettingsRef.current.curl
            vorticityMat.uniforms.dt.value = dt
            blit(velocity.write, vorticityMat)
            velocity.swap()

            divergenceMat.uniforms.uVelocity.value = velocity.read.texture
            blit(divergence, divergenceMat)

            clearMat.uniforms.uTexture.value = pressure.read.texture
            clearMat.uniforms.value.value = 0.0
            blit(pressure.write, clearMat)
            pressure.swap()

            pressureMat.uniforms.uDivergence.value = divergence.texture
            const pIters = Math.max(
                1,
                waterSettingsRef.current.pressureIterations
            )
            for (let i = 0; i < pIters; i++) {
                pressureMat.uniforms.uPressure.value = pressure.read.texture
                blit(pressure.write, pressureMat)
                pressure.swap()
            }

            gradientSubtractMat.uniforms.uPressure.value = pressure.read.texture
            gradientSubtractMat.uniforms.uVelocity.value = velocity.read.texture
            blit(velocity.write, gradientSubtractMat)
            velocity.swap()
        }

        const empty = new THREE.DataTexture(
            new Uint8Array([7, 9, 9, 255]),
            1,
            1
        )
        empty.needsUpdate = true
        empty.colorSpace = THREE.NoColorSpace
        textures.add(empty)

        const anisotropy = Math.min(
            16,
            renderer.capabilities.getMaxAnisotropy()
        )

        const configureTexture = (texture: THREE.Texture) => {
            texture.colorSpace = THREE.NoColorSpace
            texture.wrapS = THREE.ClampToEdgeWrapping
            texture.wrapT = THREE.ClampToEdgeWrapping
            texture.anisotropy = anisotropy
            textures.add(texture)
            return texture
        }

        const titleCache = new Map<string, THREE.Texture>()
        const makeTitle = (text: string, family = "Arial") => {
            const titleCanvas = document.createElement("canvas")
            titleCanvas.width = 2048
            titleCanvas.height = Math.round(2048 / aspect)

            const ctx = titleCanvas.getContext("2d")!
            const lines = String(text || "")
                .toUpperCase()
                .split("\n")

            let size = titleCanvas.height * titleSize
            const font = () => {
                ctx.font = `400 ${size}px "${family}", Arial, sans-serif`
            }

            font()

            while (
                size > 14 &&
                Math.max(...lines.map((line) => ctx.measureText(line).width)) >
                    titleCanvas.width * 0.84
            ) {
                size *= 0.95
                font()
            }

            ctx.fillStyle = "#f1f1e6"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"

            const lineHeight = size * 0.96
            const top =
                titleCanvas.height / 2 - ((lines.length - 1) * lineHeight) / 2

            lines.forEach((line, index) => {
                ctx.fillText(
                    line,
                    titleCanvas.width / 2,
                    top + index * lineHeight
                )
            })

            return configureTexture(new THREE.CanvasTexture(titleCanvas))
        }
        const getTitle = (text: string, family = "Arial") => {
            const key = `${family}\u0000${text}`
            let texture = titleCache.get(key)
            if (!texture) {
                texture = makeTitle(text, family)
                titleCache.set(key, texture)
            }
            return texture
        }

        const panelGeometry = new THREE.PlaneGeometry(1, panelHeight, 128, 2)

        const positions = panelGeometry.attributes.position

        for (let index = 0; index < positions.count; index++) {
            const angle = positions.getX(index) * arc
            positions.setXYZ(
                index,
                Math.sin(angle) * radius,
                positions.getY(index),
                Math.cos(angle) * radius
            )
        }

        positions.needsUpdate = true
        panelGeometry.computeVertexNormals()
        panelGeometry.computeBoundingSphere()
        geometries.add(panelGeometry)

        const ring = new THREE.Group()
        const reflectedRing = new THREE.Group()

        reflectedRing.scale.y = -1
        reflectedRing.position.y = -panelHeight - 0.035

        scene.add(ring, reflectedRing)

        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin("anonymous")
        let drawStaticFrame = () => {}

        type SharedUniforms = {
            uImage: { value: THREE.Texture }
            uVideo: { value: THREE.Texture }
            uTitle: { value: THREE.Texture }
            uImageScale: { value: THREE.Vector2 }
            uVideoScale: { value: THREE.Vector2 }
            uVideoReady: { value: number }
            uHover: { value: number }
            uSaturation: { value: number }
            uBrightness: { value: number }
            uContrast: { value: number }
            uViewport: { value: THREE.Vector2 }
            uFluid: { value: THREE.Texture | null }
            uFluidTexelSize: { value: THREE.Vector2 }
            uWaterRefraction: { value: number }
            uWaterHighlight: { value: number }
        }

        const assets = source.map((item) => {
            const { imageSource, videoSource, fallbackVideo } =
                resolveSlideMedia(item)
            return {
                item,
                imageSource,
                videoSource,
                fallbackVideo,
                clients: [] as SharedUniforms[],
                video: null as HTMLVideoElement | null,
                loaded: false,
                failed: false,
                blocked: false,
                pending: false,
                wanted: false,
            }
        })

        const panels = items.map((item, index) => {
            const asset = assets[index % assets.length]
            const shared: SharedUniforms = {
                uImage: { value: empty },
                uVideo: { value: empty },
                uTitle: { value: getTitle(item.title || "") },
                uImageScale: { value: new THREE.Vector2(1, 1) },
                uVideoScale: { value: new THREE.Vector2(1, 1) },
                uVideoReady: { value: 0 },
                uHover: { value: 0 },
                uSaturation: { value: Math.max(0, saturation) / 100 },
                uBrightness: { value: Math.max(0, brightness) / 100 },
                uContrast: { value: Math.max(0, contrast) / 100 },
                uViewport: { value: new THREE.Vector2(1, 1) },
                uFluid: { value: density.read.texture },
                uFluidTexelSize: { value: texelSize },
                uWaterRefraction: { value: waterRefraction },
                uWaterHighlight: { value: waterHighlight },
            }
            asset.clients.push(shared)

            const material = new THREE.ShaderMaterial({
                vertexShader: VERTEX,
                fragmentShader: SCREEN_FRAGMENT,
                uniforms: { ...shared, uReflection: { value: 0 } },
                side: THREE.DoubleSide,
                toneMapped: false,
            })
            const reflectionMaterial = new THREE.ShaderMaterial({
                vertexShader: VERTEX,
                fragmentShader: SCREEN_FRAGMENT,
                uniforms: { ...shared, uReflection: { value: reflection } },
                side: THREE.DoubleSide,
                transparent: true,
                depthWrite: false,
                toneMapped: false,
            })
            materials.add(material)
            materials.add(reflectionMaterial)

            const mesh = new THREE.Mesh(panelGeometry, material)
            mesh.rotation.y = index * step
            mesh.userData.index = index
            mesh.userData.link = item.link
            ring.add(mesh)

            const mirror = new THREE.Mesh(panelGeometry, reflectionMaterial)
            mirror.rotation.y = index * step
            mirror.renderOrder = -1
            reflectedRing.add(mirror)
            return { item, mesh, shared, asset }
        })

        gradingRef.current = panels.map((panel) => panel.shared)

        const initializeVideo = (
            asset: (typeof assets)[number],
            url: string
        ) => {
            if (disposed || asset.video) return
            asset.videoSource = url
            const video = document.createElement("video")
            video.crossOrigin = "anonymous"
            video.muted = true
            video.defaultMuted = true
            video.loop = true
            video.playsInline = true
            video.preload = "none"
            video.disablePictureInPicture = true
            video.setAttribute("playsinline", "")
            video.setAttribute("webkit-playsinline", "")
            asset.video = video
            const videoTexture = configureTexture(new THREE.VideoTexture(video))
            videoTexture.minFilter = THREE.LinearFilter
            videoTexture.magFilter = THREE.LinearFilter
            videoTexture.generateMipmaps = false
            asset.clients.forEach(
                (shared) => (shared.uVideo.value = videoTexture)
            )

            video.addEventListener(
                "loadeddata",
                () => {
                    if (disposed) return
                    if (video.videoWidth && video.videoHeight) {
                        asset.clients.forEach((shared) => {
                            cover(
                                shared.uVideoScale.value,
                                video.videoWidth / video.videoHeight,
                                aspect
                            )
                            shared.uVideoReady.value = 1
                        })
                    }
                    drawStaticFrame()
                },
                { signal }
            )
            video.addEventListener(
                "error",
                () => {
                    if (disposed) return
                    asset.failed = true
                    asset.clients.forEach(
                        (shared) => (shared.uVideoReady.value = 0)
                    )
                    drawStaticFrame()
                },
                { signal }
            )
            if (!shouldAnimate || isCanvas) {
                asset.loaded = true
                video.preload = "auto"
                video.src = url
                video.load()
            }
        }

        assets.forEach((asset) => {
            if (asset.videoSource) initializeVideo(asset, asset.videoSource)
            if (!asset.imageSource) return
            const imageTexture = loader.load(
                asset.imageSource,
                (texture) => {
                    if (disposed) {
                        texture.dispose()
                        return
                    }
                    configureTexture(texture)
                    const image = texture.image as HTMLImageElement
                    const aspectRatio = image.width / Math.max(1, image.height)
                    asset.clients.forEach((shared) => {
                        shared.uImage.value = texture
                        cover(shared.uImageScale.value, aspectRatio, aspect)
                    })
                    drawStaticFrame()
                },
                undefined,
                () => {
                    if (!disposed && asset.fallbackVideo && !asset.video) {
                        initializeVideo(asset, asset.fallbackVideo)
                    }
                }
            )
            textures.add(imageTexture)
        })

        loadFont(fontURL).then(({ family }) => {
            if (disposed) return
            const unused = new Set<THREE.Texture>()
            const currentlyUsed = new Set<THREE.Texture>()
            panels.forEach(({ shared, item }) => {
                const previous = shared.uTitle.value
                const next = getTitle(item.title || "", family)
                shared.uTitle.value = next
                currentlyUsed.add(next)
                if (previous !== next) unused.add(previous)
            })
            unused.forEach((texture) => {
                if (!currentlyUsed.has(texture)) {
                    textures.delete(texture)
                    texture.dispose()
                }
            })
            drawStaticFrame()
        })

        const backgroundGeometry = new THREE.PlaneGeometry(2, 2)
        geometries.add(backgroundGeometry)

        const backgroundMaterial = new THREE.ShaderMaterial({
            vertexShader: BACKGROUND_VERTEX,
            fragmentShader: BACKGROUND_FRAGMENT,
            uniforms: {
                uTime: { value: 0 },
                uAspect: { value: 1 },
                uBackground: {
                    value: new THREE.Color(background).convertLinearToSRGB(),
                },
            },
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
        })

        materials.add(backgroundMaterial)

        const atmosphere = new THREE.Mesh(
            backgroundGeometry,
            backgroundMaterial
        )
        atmosphere.frustumCulled = false
        atmosphere.renderOrder = -1000
        scene.add(atmosphere)

        const refractionTarget = new THREE.WebGLRenderTarget(1, 1, {
            depthBuffer: true,
            stencilBuffer: false,
        })
        refractionTarget.texture.colorSpace = THREE.NoColorSpace

        const cursorGeometry = new THREE.CircleGeometry(0.14, 80)
        geometries.add(cursorGeometry)

        const cursorMaterial = new THREE.ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader: CURSOR_FRAGMENT,
            uniforms: {
                uOpacity: { value: 0 },
                uScene: { value: refractionTarget.texture },
                uViewport: { value: new THREE.Vector2(1, 1) },
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
        })

        materials.add(cursorMaterial)

        const cursor = new THREE.Mesh(cursorGeometry, cursorMaterial)
        cursor.visible = false
        cursor.renderOrder = 10
        scene.add(cursor)

        const raycaster = new THREE.Raycaster()
        const hitMeshes = panels.map((panel) => panel.mesh)
        const zAxis = new THREE.Vector3(0, 0, 1)
        const normal = new THREE.Vector3()
        const viewDirection = new THREE.Vector3()
        const cursorPosition = new THREE.Vector3()

        let initialSplatsAdded = false
        const resize = () => {
            width = Math.max(1, host.clientWidth)
            height = Math.max(1, host.clientHeight)

            if (!initialSplatsAdded) {
                initialSplatsAdded = true
                for (let i = 0; i < 8; i++) {
                    addSplat(
                        Math.random() * width,
                        Math.random() * height,
                        (Math.random() - 0.5) * 1000,
                        (Math.random() - 0.5) * 1000,
                        [3.0, 3.0, 3.0]
                    )
                }
            }

            const ratio = width / height
            const longEdge = Math.max(width, height)
            const nativeDpr = window.devicePixelRatio || 1

            let dpr = Math.max(nativeDpr, 3840 / longEdge)
            if (isCanvas) dpr = Math.min(nativeDpr, 1.5)

            const gl = renderer.getContext()
            const maximum = Math.min(
                renderer.capabilities.maxTextureSize,
                gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
            )

            dpr = Math.min(
                dpr,
                maximum / longEdge,
                Math.sqrt(16_588_800 / (width * height))
            )

            renderer.setPixelRatio(Math.max(0.25, dpr))
            renderer.setSize(width, height, false)
            renderer.getDrawingBufferSize(drawingSize)
            cursorMaterial.uniforms.uViewport.value.copy(drawingSize)

            panels.forEach((panel) => {
                if (panel.shared.uViewport) {
                    panel.shared.uViewport.value.copy(drawingSize)
                }
            })

            camera.aspect = ratio

            const silhouette = radius / Math.sqrt(7 * 7 - radius * radius)
            const horizontalFit = silhouette / (ratio * 0.81)
            const verticalFit = panelHeight / (2 * 2 * 0.43)

            camera.fov = THREE.MathUtils.radToDeg(
                2 * Math.atan(Math.max(horizontalFit, verticalFit))
            )

            camera.updateProjectionMatrix()
            backgroundMaterial.uniforms.uAspect.value = ratio
            drawStaticFrame()
        }

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(host)
        resize()

        const pauseAll = () => {
            assets.forEach((asset) => {
                asset.wanted = false
                asset.video?.pause()
            })
        }

        let resumeAnimation = () => {}
        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                inView = entry.isIntersecting
                if (!inView) {
                    pauseAll()
                    cancelAnimationFrame(frame)
                    frame = 0
                } else {
                    previousTime = 0
                    resumeAnimation()
                    drawStaticFrame()
                }
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(host)

        document.addEventListener(
            "visibilitychange",
            () => {
                pageVisible = !document.hidden
                previousTime = 0
                if (!pageVisible) {
                    pauseAll()
                    cancelAnimationFrame(frame)
                    frame = 0
                } else {
                    resumeAnimation()
                    drawStaticFrame()
                }
            },
            { signal }
        )

        motionQuery.addEventListener(
            "change",
            (event) => {
                reducedMotion = event.matches
                if (reducedMotion) pauseAll()
            },
            { signal }
        )

        const updatePointer = (event: PointerEvent) => {
            const bounds = host.getBoundingClientRect()
            const x = (event.clientX - bounds.left) / bounds.width
            const y = (event.clientY - bounds.top) / bounds.height

            pointer.ndc.set(x * 2 - 1, 1 - y * 2)
            pointer.x = x * 2 - 1
            pointer.y = y * 2 - 1
            pointer.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1

            const fx = event.clientX - bounds.left
            const fy = event.clientY - bounds.top
            fluidPointer.dx = (fx - fluidPointer.x) * 10.0
            fluidPointer.dy = (fy - fluidPointer.y) * 10.0
            fluidPointer.x = fx
            fluidPointer.y = fy
            fluidPointer.moved = true

            drawStaticFrame()
        }

        const hitTest = () => {
            if (!pointer.inside) return null

            camera.updateMatrixWorld()
            ring.updateMatrixWorld(true)
            raycaster.setFromCamera(pointer.ndc, camera)

            const intersections = raycaster.intersectObjects(hitMeshes, false)

            for (const hit of intersections) {
                if (!hit.face) continue

                normal
                    .copy(hit.face.normal)
                    .transformDirection(hit.object.matrixWorld)

                viewDirection.copy(camera.position).sub(hit.point).normalize()

                if (normal.dot(viewDirection) > 0.08) return hit
            }

            return null
        }

        const interact = () => {
            lastInput = performance.now()
            assets.forEach((asset) => {
                asset.blocked = false
            })
        }

        const stepTo = (direction: number) => {
            interact()
            target = Math.round(target) + direction
            drawStaticFrame()
        }

        const setNativeDestination = (link?: string | null) => {
            if (!nativeLink) return
            const href = projectHref(link)
            if (href) {
                if (nativeLink.getAttribute("href") !== href)
                    nativeLink.setAttribute("href", href)
                nativeLink.setAttribute(
                    "target",
                    projectLinkTarget(href, openNewTab)
                )
                if (nativeLink.getAttribute("target") === "_blank")
                    nativeLink.setAttribute("rel", "noopener noreferrer")
                else nativeLink.removeAttribute("rel")
                host.dataset.projectLink = href
            } else {
                nativeLink.removeAttribute("href")
                nativeLink.removeAttribute("target")
                nativeLink.removeAttribute("rel")
                delete host.dataset.projectLink
            }
        }

        actionRef.current = {
            step: stepTo,
            open: () => {
                const href = projectHref(
                    items[wrap(Math.round(current), count)].link
                )
                if (!href || !nativeLink) return
                setNativeDestination(href)
                nativeLink.click()
            },
        }

        nativeLink?.addEventListener(
            "click",
            (event) => {
                if (
                    isCanvas ||
                    dragDistance > 6 ||
                    !nativeLink.hasAttribute("href")
                )
                    event.preventDefault()
            },
            { signal }
        )

        let pointerCaptureElement: HTMLElement | null = null

        host.addEventListener(
            "pointerdown",
            (event) => {
                if (isCanvas || event.button !== 0) return
                if ((event.target as Element).closest("button")) return

                updatePointer(event)
                setNativeDestination(hitTest()?.object.userData.link)
                interact()

                dragging = true
                dragDistance = 0
                dragVelocity = 0
                previousX = event.clientX
                previousY = event.clientY
                previousDragTime = performance.now()

                host.focus({ preventScroll: true })
                pointerCaptureElement =
                    event.target === nativeLink && nativeLink
                        ? nativeLink
                        : host
                pointerCaptureElement.setPointerCapture(event.pointerId)
            },
            { signal }
        )

        host.addEventListener(
            "pointermove",
            (event) => {
                updatePointer(event)

                if (!dragging) return

                const now = performance.now()
                const delta = event.clientX - previousX
                const deltaY = event.clientY - previousY
                const seconds = Math.max(0.008, (now - previousDragTime) / 1000)

                const bounds = host.getBoundingClientRect()
                const movement = (-delta / bounds.width) * 4.5

                target += movement
                dragVelocity = dragVelocity * 0.55 + (movement / seconds) * 0.45

                dragDistance += Math.hypot(delta, deltaY)
                previousX = event.clientX
                previousY = event.clientY
                previousDragTime = now
                lastInput = now
                drawStaticFrame()
            },
            { signal }
        )

        const endDrag = (event: PointerEvent, cancelled = false) => {
            if (!dragging) return

            updatePointer(event)
            dragging = false

            if (pointerCaptureElement?.hasPointerCapture(event.pointerId)) {
                pointerCaptureElement.releasePointerCapture(event.pointerId)
            }
            pointerCaptureElement = null

            lastInput = performance.now()

            if (cancelled) {
                dragVelocity = 0
                return
            }

            if (dragDistance > 6) {
                if (lastInput - previousDragTime < 100 && !reducedMotion) {
                    target += THREE.MathUtils.clamp(
                        dragVelocity * 0.24,
                        -1.6,
                        1.6
                    )
                }
                return
            }

            const hit = hitTest()
            if (!hit) return

            const index = hit.object.userData.index as number
            const linkUrl = projectHref(hit.object.userData.link)
            setNativeDestination(linkUrl)

            if (!linkUrl) {
                const nearestTurn = Math.round((current - index) / count)
                target = index + nearestTurn * count
                drawStaticFrame()
            }
        }

        host.addEventListener("pointerup", (e) => endDrag(e), { signal })
        host.addEventListener("pointercancel", (e) => endDrag(e, true), {
            signal,
        })

        host.addEventListener(
            "lostpointercapture",
            () => {
                dragging = false
            },
            { signal }
        )

        host.addEventListener(
            "pointerleave",
            () => {
                pointer.inside = false
                isHoveringMedia = false
                drawStaticFrame()
            },
            { signal }
        )

        host.addEventListener(
            "wheel",
            (event) => {
                if (isCanvas || event.ctrlKey) return

                event.preventDefault()
                interact()

                const unit =
                    event.deltaMode === 1
                        ? 16
                        : event.deltaMode === 2
                          ? height
                          : 1

                const delta =
                    Math.abs(event.deltaX) > Math.abs(event.deltaY)
                        ? event.deltaX
                        : event.deltaY

                target +=
                    THREE.MathUtils.clamp(delta * unit, -240, 240) * 0.0022
                drawStaticFrame()
            },
            { passive: false, signal }
        )

        host.addEventListener(
            "keydown",
            (event) => {
                if (event.target !== host || isCanvas) return

                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault()
                    stepTo(1)
                }

                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault()
                    stepTo(-1)
                }

                if (event.key === "Enter") {
                    event.preventDefault()
                    actionRef.current?.open()
                }
            },
            { signal }
        )

        canvas.addEventListener(
            "webglcontextlost",
            (event) => {
                event.preventDefault()
                cancelAnimationFrame(frame)
                pauseAll()
                setError("Restoring the graphics context…")
            },
            { signal }
        )

        canvas.addEventListener(
            "webglcontextrestored",
            () => {
                if (!disposed) setGeneration((value) => value + 1)
            },
            { signal }
        )

        const animate = (now: number) => {
            if (disposed) return
            frame = 0
            if (!inView || !pageVisible) return
            if (shouldAnimate) frame = requestAnimationFrame(animate)

            const dt = previousTime
                ? Math.min(0.05, (now - previousTime) / 1000)
                : 1 / 60

            previousTime = now

            elapsed += dt

            if (fluidPointer.moved) {
                addSplat(
                    fluidPointer.x,
                    fluidPointer.y,
                    fluidPointer.dx,
                    fluidPointer.dy,
                    [3.0, 3.0, 3.0]
                )
                fluidPointer.moved = false
            }
            updateFluid(dt)
            panels.forEach((panel) => {
                panel.shared.uFluid.value = density.read.texture
            })

            const idle = now - lastInput > 1100
            const { autoRotate, speed, pauseOnHover, playVideos } =
                motionRef.current
            const hoverPause = pauseOnHover && isHoveringMedia

            if (
                autoRotate &&
                shouldAnimate &&
                !isCanvas &&
                !reducedMotion &&
                !dragging &&
                !hoverPause &&
                idle
            ) {
                target += dt * speed
            }

            const smoothing =
                reducedMotion || !shouldAnimate
                    ? 1
                    : 1 - Math.exp(-(dragging ? 16 : 8.5) * dt)

            current += (target - current) * smoothing

            if (Math.abs(current) > count * 1000) {
                const turns = Math.trunc(current / count) * count
                current -= turns
                target -= turns
            }

            ring.rotation.y = -current * step
            reflectedRing.rotation.y = ring.rotation.y

            const parallax = reducedMotion || isCanvas ? 0 : 1
            const cameraEase = shouldAnimate ? 1 - Math.exp(-3.5 * dt) : 1

            camera.position.x +=
                ((pointer.inside ? pointer.x * 0.1 : 0) * parallax -
                    camera.position.x) *
                cameraEase

            camera.position.y +=
                (0.28 +
                    (pointer.inside ? pointer.y * 0.13 : 0) * parallax -
                    camera.position.y) *
                cameraEase

            camera.lookAt(0, 0, 5)
            camera.updateMatrixWorld()
            scene.updateMatrixWorld(true)

            const hit =
                !isCanvas && !dragging && pointer.inside ? hitTest() : null

            isHoveringMedia = hit !== null

            const hovered = hit ? (hit.object.userData.index as number) : -1
            if (!dragging) setNativeDestination(hit?.object.userData.link)

            const hoverEase = shouldAnimate ? 1 - Math.exp(-7 * dt) : 1

            panels.forEach((panel, index) => {
                panel.shared.uHover.value +=
                    ((index === hovered ? 1 : 0) - panel.shared.uHover.value) *
                    hoverEase
            })

            assets.forEach((asset) => {
                const video = asset.video
                if (!video) return
                const front = panels.some(
                    (panel, index) =>
                        panel.asset === asset &&
                        Math.cos((index - current) * step) > 0.6
                )
                asset.wanted =
                    front &&
                    playVideos &&
                    shouldAnimate &&
                    !isCanvas &&
                    !reducedMotion &&
                    !asset.failed

                if (asset.wanted && !asset.loaded && asset.videoSource) {
                    asset.loaded = true
                    video.src = asset.videoSource
                    video.load()
                }
                if (
                    asset.wanted &&
                    video.paused &&
                    !asset.pending &&
                    !asset.blocked
                ) {
                    asset.pending = true
                    video
                        .play()
                        .catch(() => {
                            if (!disposed && asset.wanted) asset.blocked = true
                        })
                        .finally(() => {
                            asset.pending = false
                        })
                } else if (!asset.wanted && !video.paused) {
                    video.pause()
                }

                const ready = !asset.failed && video.readyState >= 2
                asset.clients.forEach((shared) => {
                    shared.uVideoReady.value = ready ? 1 : 0
                    if (ready && video.videoWidth && video.videoHeight) {
                        cover(
                            shared.uVideoScale.value,
                            video.videoWidth / video.videoHeight,
                            aspect
                        )
                    }
                })
            })

            cursorOpacity +=
                ((hit ? 1 : 0) - cursorOpacity) *
                (shouldAnimate ? 1 - Math.exp(-14 * dt) : 1)

            cursorMaterial.uniforms.uOpacity.value = cursorOpacity
            cursor.visible = cursorOpacity > 0.01

            if (hit?.face) {
                normal
                    .copy(hit.face.normal)
                    .transformDirection(hit.object.matrixWorld)

                cursorPosition.copy(hit.point).addScaledVector(normal, 0.028)
                cursor.position.copy(cursorPosition)
                cursor.quaternion.setFromUnitVectors(zAxis, normal)
            }

            cursor.scale.setScalar(0.82 + cursorOpacity * 0.15)

            host.style.cursor = isCanvas
                ? "default"
                : dragging
                  ? "grabbing"
                  : hit
                    ? "none"
                    : "grab"

            backgroundMaterial.uniforms.uTime.value = reducedMotion
                ? 0
                : elapsed

            const active = wrap(Math.round(current), count)

            if (active !== lastActive) {
                lastActive = active
                setActiveTitle(
                    String(items[active].title || "").replace(/\n/g, " ")
                )
            }

            if (cursor.visible) {
                const captureScale = Math.min(
                    0.5,
                    1536 / Math.max(drawingSize.x, drawingSize.y)
                )
                const desiredWidth = Math.max(
                    1,
                    Math.round(drawingSize.x * captureScale)
                )
                const desiredHeight = Math.max(
                    1,
                    Math.round(drawingSize.y * captureScale)
                )
                if (
                    refractionTarget.width !== desiredWidth ||
                    refractionTarget.height !== desiredHeight
                ) {
                    refractionTarget.setSize(desiredWidth, desiredHeight)
                }

                panels.forEach((p) =>
                    p.shared.uViewport.value.set(desiredWidth, desiredHeight)
                )

                cursor.visible = false
                renderer.setRenderTarget(refractionTarget)
                renderer.render(scene, camera)
                renderer.setRenderTarget(null)
                cursor.visible = true

                panels.forEach((p) =>
                    p.shared.uViewport.value.copy(drawingSize)
                )
            }
            renderer.render(scene, camera)
        }

        drawStaticFrame = () => {
            if (!shouldAnimate && !disposed) animate(performance.now())
        }
        requestStaticFrameRef.current = drawStaticFrame
        resumeAnimation = () => {
            if (shouldAnimate && !disposed && inView && pageVisible && !frame)
                frame = requestAnimationFrame(animate)
        }
        if (shouldAnimate) resumeAnimation()
        else drawStaticFrame()

        return () => {
            disposed = true
            cancelAnimationFrame(frame)
            controller.abort()
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            actionRef.current = null
            gradingRef.current = []
            requestStaticFrameRef.current = null

            assets.forEach(({ video }) => {
                if (!video) return
                video.pause()
                video.removeAttribute("src")
                video.load()
            })

            density.read.dispose()
            density.write.dispose()
            velocity.read.dispose()
            velocity.write.dispose()
            divergence.dispose()
            curl.dispose()
            pressure.read.dispose()
            pressure.write.dispose()

            clearMat.dispose()
            splatMat.dispose()
            advectionMat.dispose()
            divergenceMat.dispose()
            curlMat.dispose()
            vorticityMat.dispose()
            pressureMat.dispose()
            gradientSubtractMat.dispose()

            fluidPlane.geometry.dispose()
            fluidScene.clear()

            textures.forEach((texture) => texture.dispose())
            materials.forEach((material) => material.dispose())
            geometries.forEach((geometry) => geometry.dispose())
            refractionTarget.dispose()
            scene.clear()

            renderer.forceContextLoss()
            renderer.dispose()
            if (host.contains(canvas)) host.removeChild(canvas)
            host.style.cursor = ""
        }
    }, [
        serialized,
        livePreview,
        shouldAnimate,
        initialSlide,
        panelHeight,
        gap,
        reflection,
        titleSize,
        fontURL,
        background,
        openNewTab,
        isCanvas,
        generation,
    ])

    return (
        <div
            ref={hostRef}
            data-aircord-carousel
            role="region"
            aria-roledescription="carousel"
            aria-label={
                slides?.length
                    ? `Project carousel. ${activeTitle}. Use arrow keys to rotate and Enter to open.`
                    : "Empty project carousel. Add images or videos in Framer properties."
            }
            tabIndex={0}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                overflow: "hidden",
                isolation: "isolate",
                background,
                outline: "none",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                overscrollBehavior: "contain",
            }}
        >
            <a
                ref={linkRef}
                aria-label="Open hovered project"
                tabIndex={-1}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    display: "block",
                    background: "transparent",
                    pointerEvents: isCanvas || webglFallback ? "none" : "auto",
                    cursor: "inherit",
                    WebkitTapHighlightColor: "transparent",
                }}
            />
            <style>{`
                [data-aircord-carousel] .ac-controls:focus-within {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }

                [data-aircord-carousel] .ac-control {
                    appearance: none;
                    width: 42px;
                    height: 42px;
                    display: grid;
                    place-items: center;
                    border: 1px solid rgba(240,240,228,.22);
                    border-radius: 50%;
                    background: rgba(8,10,10,.55);
                    color: #f0f0e4;
                    cursor: pointer;
                    backdrop-filter: blur(12px);
                }

                [data-aircord-carousel] .ac-control:hover {
                    background: rgba(240,240,228,.13);
                }

                [data-aircord-carousel] .ac-control:focus-visible {
                    outline: 2px solid #f0f0e4;
                    outline-offset: 4px;
                }
            `}</style>

            <nav
                className="ac-controls"
                aria-label="Carousel controls"
                style={{
                    position: "absolute",
                    zIndex: 2,
                    left: "50%",
                    bottom: 24,
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 12,
                    opacity: showControls ? 1 : 0,
                    pointerEvents: showControls ? "auto" : "none",
                    transition: "opacity 180ms ease",
                }}
            >
                <button
                    type="button"
                    className="ac-control"
                    aria-label="Previous project"
                    onClick={() => actionRef.current?.step(-1)}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24">
                        <path
                            d="M19 12H5m6-6-6 6 6 6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                    </svg>
                </button>

                <button
                    type="button"
                    className="ac-control"
                    aria-label="Next project"
                    onClick={() => actionRef.current?.step(1)}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24">
                        <path
                            d="M5 12h14m-6-6 6 6-6 6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                    </svg>
                </button>
            </nav>

            {webglFallback && slides.length > 0 && (
                <div
                    role="img"
                    aria-label="Static carousel preview. WebGL rendering is unavailable."
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: 24,
                        perspective: "1000px",
                        overflow: "hidden",
                        pointerEvents: isCanvas ? "none" : "auto",
                    }}
                >
                    {slides.slice(0, 3).map((item, index, shown) => {
                        const media = resolveSlideMedia(item)
                        const image = media.imageSource
                        const offset = index - (shown.length - 1) / 2
                        return (
                            <a
                                key={index}
                                href={projectHref(item.link) || undefined}
                                target={
                                    projectHref(item.link)
                                        ? projectLinkTarget(
                                              projectHref(item.link),
                                              openNewTab
                                          )
                                        : undefined
                                }
                                rel="noopener noreferrer"
                                aria-label={
                                    item.link
                                        ? `Open ${item.title || "project"}`
                                        : undefined
                                }
                                style={{
                                    display: "block",
                                    textDecoration: "none",
                                    cursor: item.link ? "pointer" : "default",
                                    position: "relative",
                                    flex: `0 0 ${shown.length === 1 ? 65 : 31}%`,
                                    maxWidth: 740,
                                    aspectRatio: "16 / 9",
                                    overflow: "hidden",
                                    background: "#0b0e10",
                                    transform: `rotateY(${-offset * 23}deg) scale(${1 - Math.abs(offset) * 0.13})`,
                                    boxShadow: "0 30px 75px rgba(0,0,0,.65)",
                                }}
                            >
                                {image && (
                                    <img
                                        src={image}
                                        alt=""
                                        loading="lazy"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            filter: `saturate(${saturation}%) brightness(${brightness}%) contrast(${contrast}%)`,
                                        }}
                                    />
                                )}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "grid",
                                        placeItems: "center",
                                        padding: 18,
                                        color: "#f1f1e6",
                                        fontFamily: "Arial, sans-serif",
                                        fontSize: "clamp(11px, 1.8vw, 27px)",
                                        fontWeight: 500,
                                        textAlign: "center",
                                        lineHeight: 1.05,
                                        whiteSpace: "pre-line",
                                        textShadow:
                                            "0 2px 14px rgba(0,0,0,.85)",
                                    }}
                                >
                                    {String(item.title || "")}
                                </div>
                            </a>
                        )
                    })}
                    <span
                        style={{
                            position: "absolute",
                            left: 16,
                            bottom: 12,
                            color: "#929b9e",
                            font: "11px Arial, sans-serif",
                        }}
                    >
                        Static preview — WebGL2 is unavailable in this browser
                    </span>
                </div>
            )}

            {error && (
                <div
                    role="status"
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        padding: 24,
                        color: "#f0f0e4",
                        font: "13px Arial, sans-serif",
                        textAlign: "center",
                        background,
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    )
}

AircordCarousel.defaultProps = {
    livePreview: true,
    slides: DEFAULT_SLIDES,
    initialSlide: 1,
    motion: {
        autoRotate: true,
        speed: 0.28,
        pauseOnHover: true,
        playVideos: true,
    },
    visual: {
        panelHeight: 1.02,
        gap: 0.018,
        reflection: 0.39,
        titleSize: 0.145,
        fontURL: "",
        background: "#020303",
        saturation: 100,
        brightness: 100,
        contrast: 100,
    },
    water: {
        waterRefraction: 1.0,
        waterHighlight: 1.5,
        waterFadeSpeed: 1.8,
        waterMotionFade: 100,
        waterCurl: 40.0,
        waterTouchSize: 3.0,
        waterPressureIterations: 30,
    },
    navigation: { showControls: false, openNewTab: false },
}

addPropertyControls(AircordCarousel, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate the carousel outside static previews.",
    },
    slides: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 24,
        defaultValue: [],
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    displayTextArea: true,
                    defaultValue: "PROJECT\nTITLE",
                },
                media: {
                    type: ControlType.File,
                    title: "Media (Img/Vid)",
                    allowedFileTypes: [
                        "jpg",
                        "jpeg",
                        "png",
                        "webp",
                        "mp4",
                        "mov",
                        "webm",
                        "ogg",
                    ],
                    description: "Upload one image or video.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster (Optional)",
                    description: "Fallback poster or previous image upload.",
                },
                video: {
                    type: ControlType.File,
                    title: "Video (Optional)",
                    allowedFileTypes: ["mp4", "webm"],
                    description: "Upload a video from your computer.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Project Link",
                    description: "Select a site page or enter a valid URL.",
                },
            },
        },
    },
    initialSlide: {
        type: ControlType.Number,
        title: "Start Project",
        min: 1,
        max: 24,
        step: 1,
        defaultValue: 1,
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: -1,
                max: 1,
                step: 0.01,
                unit: "slides/s",
                defaultValue: 0.28,
                hidden: (props) => !props.autoRotate,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                hidden: (props) => !props.autoRotate,
            },
            playVideos: {
                type: ControlType.Boolean,
                title: "Play Videos",
                defaultValue: true,
            },
        },
    },
    visual: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            panelHeight: {
                type: ControlType.Number,
                title: "Screen Height",
                min: 0.65,
                max: 1.8,
                step: 0.01,
                unit: "wu",
                defaultValue: 1.02,
                description: "Panel height in 3D units.",
            },
            gap: {
                type: ControlType.Number,
                title: "Screen Gap",
                min: 0.005,
                max: 0.08,
                step: 0.001,
                unit: "rad",
                defaultValue: 0.018,
                description: "Space between curved panels.",
            },
            reflection: {
                type: ControlType.Number,
                title: "Reflection",
                min: 0,
                max: 2,
                step: 0.01,
                unit: "×",
                defaultValue: 0.39,
                description: "Strength of floor reflections.",
            },
            titleSize: {
                type: ControlType.Number,
                title: "Title Scale",
                min: 0.06,
                max: 0.25,
                step: 0.005,
                unit: "×",
                defaultValue: 0.145,
            },
            saturation: {
                type: ControlType.Number,
                title: "Saturation",
                min: 0,
                max: 200,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Adjust media color intensity.",
            },
            brightness: {
                type: ControlType.Number,
                title: "Brightness",
                min: 0,
                max: 200,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Adjust media lightness.",
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                min: 0,
                max: 200,
                step: 1,
                unit: "%",
                defaultValue: 100,
                description: "Adjust light and dark separation.",
            },
            fontURL: {
                type: ControlType.File,
                title: "Title Font",
                allowedFileTypes: ["woff", "woff2", "ttf", "otf"],
                description: "Optional Framer-uploaded font.",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#020303",
            },
        },
    },
    water: {
        type: ControlType.Object,
        title: "Water Effect",
        controls: {
            waterRefraction: {
                type: ControlType.Number,
                title: "Refraction",
                defaultValue: 1.0,
                min: 0,
                max: 5,
                step: 0.1,
                description: "Strength of the fluid distortion.",
            },
            waterHighlight: {
                type: ControlType.Number,
                title: "Highlight",
                defaultValue: 1.5,
                min: 0,
                max: 5,
                step: 0.1,
                description: "Specular reflection intensity.",
            },
            waterFadeSpeed: {
                type: ControlType.Number,
                title: "Fade Speed",
                defaultValue: 1.8,
                min: 0.1,
                max: 20,
                step: 0.1,
                description: "How fast the liquid returns flat.",
            },
            waterMotionFade: {
                type: ControlType.Number,
                title: "Motion Fade",
                defaultValue: 100,
                min: 0,
                max: 100,
                description: "How fast the water motion stops.",
            },
            waterCurl: {
                type: ControlType.Number,
                title: "Curl",
                defaultValue: 40.0,
                min: 0,
                max: 100,
                description: "Swirl intensity of the water.",
            },
            waterTouchSize: {
                type: ControlType.Number,
                title: "Touch Size",
                defaultValue: 3.0,
                min: 1,
                max: 20,
                description: "Size of the water splash upon interacting.",
            },
            waterPressureIterations: {
                type: ControlType.Number,
                title: "Quality (Iters)",
                defaultValue: 30,
                min: 1,
                max: 100,
                description: "Solver iterations for physics accuracy.",
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            showControls: {
                type: ControlType.Boolean,
                title: "Show Arrows",
                defaultValue: false,
            },
            openNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
            },
        },
    },
})
