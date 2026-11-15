// @framerDisableUnlink
import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const CREDIT =
    "[Explore more components](https://www.framer.com/%40builtbykern/)\n[Made in Framer](https://www.framer.com/?via=builtbykern)"

const VARIANT_WEIGHT: Record<string, number> = {
    Thin: 100,
    "Extra Light": 200,
    Light: 300,
    Regular: 400,
    Medium: 500,
    Semibold: 600,
    Bold: 700,
    "Extra Bold": 800,
    Black: 900,
}

interface Settings {
    text: string
    fontFamily: string
    fontStyle: string
    fontWeight: number
    fontSize: number
    letterSpacing: number
    color: string
    accentColor: string
    strokeColor: string
    strokeWidth: number
    selection: boolean
    draggable: boolean
    returnEffect: "spring" | "blur" | "lens"
    amount: number
    inertia: number
}

interface WordMetrics {
    size: number
    baseline: number
    left: number
    right: number
    top: number
    bottom: number
}

interface GlyphBox {
    x1: number
    y1: number
    x2: number
    y2: number
}

interface GlyphSprite {
    image: HTMLCanvasElement
    left: number
    top: number
}

interface GlyphBase {
    char: string
    x: number
    box: GlyphBox
}

interface Glyph extends GlyphBase {
    offset: { x: number; y: number }
    velocity: { x: number; y: number }
    outline: number
    index: number
    fill: GlyphSprite
    dashes: GlyphSprite
}

interface dragdropProps {
    content?: {
        text?: string
        font?: {
            fontFamily?: string
            fontWeight?: number
            fontStyle?: string
            fontSize?: string | number
            letterSpacing?: string | number
            variant?: string
        }
    }
    look?: {
        color?: string
        accentColor?: string
        strokeColor?: string
        strokeWidth?: number
    }
    motion?: {
        selection?: boolean
        draggable?: boolean
        returnEffect?: "spring" | "blur" | "lens"
        amount?: number
        inertia?: number
    }
    className?: string
    style?: CSSProperties
}

const approach = (current: number, target: number, dt: number, seconds: number) =>
    current + (target - current) * (1 - Math.exp(-dt / seconds))

const hexToRgb = (input: string): [number, number, number] => {
    const value = String(input || "").trim()
    const rgb = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
    let h = value.replace("#", "")
    if (h.length === 3) h = h.replace(/./g, (c) => c + c)
    const n = parseInt(h.slice(0, 6), 16)
    return Number.isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const rgba = (hex: string, alpha: number) => {
    const [r, g, b] = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value)

const groupOf = (props: dragdropProps, key: "content" | "look" | "motion"): Record<string, unknown> => {
    const record = props as unknown as Record<string, unknown>
    const direct = record[key]
    const remapped = record[`$control__${key}`]
    if (isRecord(direct)) return direct
    if (isRecord(remapped)) return remapped
    return {}
}

const textOf = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback)

const colorOf = (value: unknown, fallback: string) =>
    typeof value === "string" && value.trim() ? value : fallback

const numberOf = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback

const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback)

const readSize = (value: unknown, fallback: number) => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
        const n = parseFloat(value)
        if (Number.isFinite(n)) return n
    }
    return fallback
}

const readEm = (value: unknown, size: number, fallback: number) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        if (Math.abs(value) > 2 && size > 0) return value / size
        return value
    }
    if (typeof value === "string") {
        const n = parseFloat(value)
        if (!Number.isFinite(n)) return fallback
        if (value.trim().endsWith("px") && size > 0) return n / size
        return n
    }
    return fallback
}

const weightOf = (font: Record<string, unknown>) => {
    if (typeof font.fontWeight === "number" && Number.isFinite(font.fontWeight)) return font.fontWeight
    const variant = typeof font.variant === "string" ? font.variant.replace(/ Italic$/, "") : ""
    if (variant === "Italic") return 400
    return VARIANT_WEIGHT[variant] ?? 600
}

const styleOf = (font: Record<string, unknown>) => {
    if (font.fontStyle === "italic") return "italic"
    if (typeof font.variant === "string" && font.variant.includes("Italic")) return "italic"
    return "normal"
}

const effectOf = (value: unknown): Settings["returnEffect"] =>
    value === "blur" || value === "lens" || value === "spring" ? value : "spring"

const readSettings = (props: dragdropProps): Settings => {
    const content = groupOf(props, "content")
    const look = groupOf(props, "look")
    const motion = groupOf(props, "motion")
    const font = isRecord(content.font) ? content.font : {}
    const fontSize = Math.max(1, readSize(font.fontSize, 150))
    return {
        text: textOf(content.text, "BuiltByKern").trim() || "BuiltByKern",
        fontFamily: typeof font.fontFamily === "string" ? font.fontFamily : "",
        fontStyle: styleOf(font),
        fontWeight: weightOf(font),
        fontSize,
        letterSpacing: readEm(font.letterSpacing, fontSize, -0.05),
        color: colorOf(look.color, "#1C1B19"),
        accentColor: colorOf(look.accentColor, "#1C1B19"),
        strokeColor: colorOf(look.strokeColor, "#1C1B19"),
        strokeWidth: numberOf(look.strokeWidth, 1.5),
        selection: flag(motion.selection, true),
        draggable: flag(motion.draggable, true),
        returnEffect: effectOf(motion.returnEffect),
        amount: Math.min(1, Math.max(0, numberOf(motion.amount, 1))),
        inertia: Math.min(1, Math.max(0, numberOf(motion.inertia, 0.65))),
    }
}

/**
 * dragdrop
 * Grab a letter. A line stays tied to its place, and it springs home.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 480
 * @framerDisableUnlink
 */
export default function dragdrop(props: dragdropProps) {
    const isStatic = useIsStaticRenderer()
    const settings = readSettings(props)
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const settingsRef = useRef<Settings | null>(null)
    const wakeRef = useRef<() => void>(() => {})

    useEffect(() => {
        settingsRef.current = settings
        wakeRef.current()
    })

    useEffect(() => {
        if (typeof window === "undefined") return
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const scratch = document.createElement('canvas');
        const scratchCtx = scratch.getContext('2d');
        if (!container || !canvas || !ctx || !scratchCtx) return undefined;

        const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        let reducedMotion = motionQuery?.matches ?? false;
        const frozen = isStatic;
        let width = 1;
        let height = 1;
        let dpr = 1;
        let raf = 0;
        let last = performance.now();
        let visible = true;
        let alive = true;
        let layoutKey = '';
        let requestedFont = '';
        let word: WordMetrics | null = null;
        let glyphs: Glyph[] = [];
        let placed = false;
        let dragging = -1;
        let keyLetter = 0;
        const pointer = { x: 0, y: 0, inside: false };
        const grab = { x: 0, y: 0 };
        const lens = { x: 0, y: 0 };
        const frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };

        const refreshFonts = () => {
          layoutKey = '';
          wakeRef.current();
        };

        const family = (s: Settings) => s.fontFamily || getComputedStyle(container).fontFamily || 'sans-serif';
        const fontFor = (s: Settings, size: number) => `${s.fontStyle === 'italic' ? 'italic ' : ''}${s.fontWeight} ${size}px ${family(s)}`;

        const setFont = (target: CanvasRenderingContext2D, s: Settings, size: number) => {
          target.font = fontFor(s, size);
          if ('letterSpacing' in target) target.letterSpacing = `${s.letterSpacing * size}px`;
          target.textAlign = 'left';
          target.textBaseline = 'alphabetic';
        };

        const sprite = (s: Settings, view: WordMetrics, glyph: GlyphBase, stroke: boolean): GlyphSprite => {
          const pad = Math.ceil(s.strokeWidth * 2 + 4);
          const left = glyph.box.x1 - pad;
          const top = glyph.box.y1 - pad;
          const w = glyph.box.x2 - glyph.box.x1 + pad * 2;
          const h = glyph.box.y2 - glyph.box.y1 + pad * 2;
          const image = document.createElement('canvas');
          image.width = Math.max(1, Math.ceil(w * dpr));
          image.height = Math.max(1, Math.ceil(h * dpr));
          const c = image.getContext('2d');
          if (!c) return { image, left, top };
          c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr);
          setFont(c, s, view.size);
          if (stroke) {
            c.lineJoin = 'round';
            c.lineWidth = s.strokeWidth * 2;
            c.lineCap = 'butt';
            c.strokeStyle = s.strokeColor;
            c.strokeText(glyph.char, glyph.x, view.baseline);
            c.globalCompositeOperation = 'destination-out';
            c.fillStyle = '#000000';
            c.fillText(glyph.char, glyph.x, view.baseline);
            c.globalCompositeOperation = 'source-over';
          } else {
            c.fillStyle = s.color;
            c.fillText(glyph.char, glyph.x, view.baseline);
          }
          return { image, left, top };
        };

        const ensureLayout = (s: Settings): WordMetrics => {
          const key = [
            s.text,
            family(s),
            s.fontStyle,
            s.fontWeight,
            s.fontSize,
            s.letterSpacing,
            s.color,
            s.strokeColor,
            s.strokeWidth,
            width,
            height,
            dpr
          ].join('|');
          if (key === layoutKey && word) return word;
          layoutKey = key;
          const wanted = fontFor(s, 64);
          if (document.fonts && wanted !== requestedFont) {
            requestedFont = wanted;
            document.fonts.load(wanted, s.text).then(refreshFonts, refreshFonts);
          }

          const probe = scratchCtx;
          setFont(probe, s, s.fontSize);
          let m = probe.measureText(s.text);
          const fit = Math.min(
            1,
            (width * 0.9) / Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1),
            (height * 0.66) / Math.max(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, 1)
          );
          const size = s.fontSize * fit;
          setFont(probe, s, size);
          m = probe.measureText(s.text);
          const inkWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
          const inkHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
          const x = (width - inkWidth) / 2 + m.actualBoundingBoxLeft;
          const baseline = (height - inkHeight) / 2 + m.actualBoundingBoxAscent;
          const next = {
            size,
            baseline,
            left: x - m.actualBoundingBoxLeft,
            right: x + m.actualBoundingBoxRight,
            top: baseline - m.actualBoundingBoxAscent,
            bottom: baseline + m.actualBoundingBoxDescent
          };
          word = next;

          const chars = Array.from(s.text);
          const previous = glyphs;
          glyphs = [];
          let prefix = '';
          chars.forEach((char, i) => {
            prefix += char;
            const own = probe.measureText(char);
            const gx = x + probe.measureText(prefix).width - own.width;
            if (!char.trim()) return;
            const base = {
              char,
              x: gx,
              box: {
                x1: gx - own.actualBoundingBoxLeft,
                y1: baseline - own.actualBoundingBoxAscent,
                x2: gx + own.actualBoundingBoxRight,
                y2: baseline + own.actualBoundingBoxDescent
              }
            };
            const kept = previous[glyphs.length];
            glyphs.push({
              ...base,
              offset: kept?.char === char ? kept.offset : { x: 0, y: 0 },
              velocity: { x: 0, y: 0 },
              outline: 0,
              index: i,
              fill: sprite(s, next, base, false),
              dashes: sprite(s, next, base, true)
            });
          });
          dragging = -1;
          frame.index = -1;
          return next;
        };

        const glyphAt = (x: number, y: number) => {
          if (!word || y < word.top - 24 || y > word.bottom + 24) return -1;
          let best = -1;
          let bestDistance = Infinity;
          glyphs.forEach((glyph, i) => {
            const x1 = glyph.box.x1 + glyph.offset.x;
            const x2 = glyph.box.x2 + glyph.offset.x;
            const d = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
            if (d < bestDistance) {
              bestDistance = d;
              best = i;
            }
          });
          return bestDistance < 28 ? best : -1;
        };

        const blit = (target: CanvasRenderingContext2D, art: GlyphSprite, dx: number, dy: number, originX: number, originY: number) => {
          target.drawImage(
            art.image,
            Math.round((art.left + dx) * dpr - originX),
            Math.round((art.top + dy) * dpr - originY)
          );
        };
        const tintPad = document.createElement("canvas");
        const tintCtx = tintPad.getContext("2d");
        const blitTint = (art: GlyphSprite, dx: number, dy: number, color: string, alpha: number) => {
          if (!tintCtx || alpha < 0.02) return;
          const img = art.image;
          if (tintPad.width !== img.width || tintPad.height !== img.height) {
            tintPad.width = img.width;
            tintPad.height = img.height;
          }
          tintCtx.setTransform(1, 0, 0, 1, 0, 0);
          tintCtx.clearRect(0, 0, tintPad.width, tintPad.height);
          tintCtx.globalCompositeOperation = "source-over";
          tintCtx.globalAlpha = 1;
          tintCtx.drawImage(img, 0, 0);
          tintCtx.globalCompositeOperation = "source-in";
          tintCtx.fillStyle = color;
          tintCtx.fillRect(0, 0, tintPad.width, tintPad.height);
          tintCtx.globalCompositeOperation = "source-over";
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.drawImage(tintPad, Math.round((art.left + dx) * dpr), Math.round((art.top + dy) * dpr));
          ctx.restore();
        };

        const crisp = (value: number) => (Math.round(value * dpr) + 0.5) / dpr;

        const drawLead = (s: Settings) => {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.fillStyle = s.strokeColor;
          const heavy = 3.6 + s.strokeWidth;
          const fine = 0.55;
          const steps = 28;
          for (const glyph of glyphs) {
            const dx = glyph.offset.x;
            const dy = glyph.offset.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= 24) continue;
            const hx = (glyph.box.x1 + glyph.box.x2) / 2;
            const hy = (glyph.box.y1 + glyph.box.y2) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            const halfW = (glyph.box.x2 - glyph.box.x1) / 2;
            const halfH = (glyph.box.y2 - glyph.box.y1) / 2;
            const edge = Math.min(
              Math.abs(nx) > 0.001 ? halfW / Math.abs(nx) : Infinity,
              Math.abs(ny) > 0.001 ? halfH / Math.abs(ny) : Infinity
            );
            const tail = edge + 2;
            const tip = Math.max(0, edge - heavy * 0.35);
            if (dist <= tail + tip + 8) continue;
            const x0 = hx + nx * tail;
            const y0 = hy + ny * tail;
            const x1 = hx + dx - nx * tip;
            const y1 = hy + dy - ny * tip;
            const span = Math.hypot(x1 - x0, y1 - y0);
            if (span < 6) continue;
            const ux = (x1 - x0) / span;
            const uy = (y1 - y0) / span;
            const px = -uy;
            const py = ux;
            const widthAt = (t: number) => {
              const u = Math.max(0, (t - 0.42) / 0.58);
              const swell = u * u * (3 - 2 * u);
              return fine + (heavy - fine) * swell;
            };
            const head = Math.atan2(uy, ux);
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const w = widthAt(t) * 0.5;
              const x = x0 + ux * span * t + px * w;
              const y = y0 + uy * span * t + py * w;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.arc(x1, y1, heavy * 0.5, head + Math.PI / 2, head - Math.PI / 2, true);
            for (let i = steps; i >= 0; i--) {
              const t = i / steps;
              const w = widthAt(t) * 0.5;
              ctx.lineTo(x0 + ux * span * t - px * w, y0 + uy * span * t - py * w);
            }
            ctx.arc(x0, y0, fine * 0.5, head - Math.PI / 2, head + Math.PI / 2);
            ctx.fill();
          }
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        };

        const drawFrame = (s: Settings) => {
          const glyph = glyphs[frame.index];
          if (!glyph || frame.alpha < 0.01) return;
          const a = frame.alpha;
          const x1 = crisp(frame.x1);
          const y1 = crisp(frame.y1);
          const x2 = crisp(frame.x2);
          const y2 = crisp(frame.y2);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          ctx.beginPath();
          ctx.rect(x1, y1, x2 - x1, y2 - y1);
          ctx.lineWidth = 1;
          ctx.strokeStyle = rgba(s.accentColor, 0.5 * a);
          ctx.stroke();

          ctx.beginPath();
          for (const [cx, cy] of [
            [x1, y1],
            [x2, y1],
            [x2, y2],
            [x1, y2]
          ]) {
            ctx.rect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5);
          }
          ctx.fillStyle = rgba(s.accentColor, 0.95 * a);
          ctx.fill();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        };

        const tick = (now: number) => {
          raf = 0;
          const s = settingsRef.current;
          if (!s) return;
          const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
          last = now;
          ensureLayout(s);

          const targetX = pointer.x;
          const targetY = pointer.y;
          const active = pointer.inside || dragging >= 0;
          if (active && !placed) {
            lens.x = targetX;
            lens.y = targetY;
          }
          if (active) {
            const lag = pointer.inside ? 0.05 : 0.22;
            lens.x = approach(lens.x, targetX, dt, lag);
            lens.y = approach(lens.y, targetY, dt, lag);
          }
          placed = active;

          let moving = false;
          glyphs.forEach((glyph, i) => {
            if (i === dragging) {
              glyph.offset.x = approach(glyph.offset.x, pointer.x - grab.x, dt, 0.03);
              glyph.offset.y = approach(glyph.offset.y, pointer.y - grab.y, dt, 0.03);
              glyph.velocity.x = 0;
              glyph.velocity.y = 0;
              moving = true;
              return;
            }
            const { offset, velocity } = glyph;
            if (reducedMotion) {
              offset.x = 0;
              offset.y = 0;
              velocity.x = 0;
              velocity.y = 0;
              return;
            }
            if (Math.abs(offset.x) < 0.05 && Math.abs(offset.y) < 0.05 && Math.hypot(velocity.x, velocity.y) < 0.5) {
              offset.x = 0;
              offset.y = 0;
              velocity.x = 0;
              velocity.y = 0;
              return;
            }
            const inertia = Math.min(1, Math.max(0, s.inertia));
            const spring = 420 - inertia * 180;
            const damping = 40 - inertia * 28;
            velocity.x += (-spring * offset.x - damping * velocity.x) * dt;
            velocity.y += (-spring * offset.y - damping * velocity.y) * dt;
            offset.x += velocity.x * dt;
            offset.y += velocity.y * dt;
            moving = true;
          });

          const focus = dragging >= 0 ? dragging : active ? glyphAt(lens.x, lens.y) : -1;
          if (focus >= 0 && s.selection) {
            const glyph = glyphs[focus];
            const bx1 = glyph.box.x1 + glyph.offset.x - 6;
            const by1 = glyph.box.y1 + glyph.offset.y - 6;
            const bx2 = glyph.box.x2 + glyph.offset.x + 6;
            const by2 = glyph.box.y2 + glyph.offset.y + 6;
            if (frame.index < 0 || frame.alpha < 0.02) {
              frame.x1 = bx1;
              frame.y1 = by1;
              frame.x2 = bx2;
              frame.y2 = by2;
            }
            const glide = focus === dragging ? 0.02 : 0.08;
            frame.x1 = approach(frame.x1, bx1, dt, glide);
            frame.y1 = approach(frame.y1, by1, dt, glide);
            frame.x2 = approach(frame.x2, bx2, dt, glide);
            frame.y2 = approach(frame.y2, by2, dt, glide);
            frame.index = focus;
          }
          frame.alpha = approach(frame.alpha, focus >= 0 && s.selection ? 1 : 0, dt, 0.1);

          glyphs.forEach((glyph, i) => {
            const target = i === focus && i !== dragging ? 1 : 0;
            glyph.outline = approach(glyph.outline, target, dt, 0.09);
            if (Math.abs(glyph.outline - target) > 0.002) moving = true;
            else glyph.outline = target;
          });

          if (!frozen && s.draggable) container.style.cursor = dragging >= 0 ? 'grabbing' : focus >= 0 && pointer.inside ? 'grab' : '';

          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (const glyph of glyphs) {
            const moved = Math.hypot(glyph.offset.x, glyph.offset.y);
            if (moved > 1) {
              ctx.globalAlpha = Math.min(1, moved / 24) * 0.55;
              blit(ctx, glyph.dashes, 0, 0, 0, 0);
              ctx.globalAlpha = 1;
            }
          }
          const amount = Math.min(1, Math.max(0, s.amount));
          drawFrame(s);
          drawLead(s);
          glyphs.forEach((glyph, i) => {
            const displaced = Math.hypot(glyph.offset.x, glyph.offset.y) > 2;
            const returning = i !== dragging && displaced;
            if (glyph.outline < 0.999) {
              const alpha = 1 - glyph.outline;
              if (returning && s.returnEffect === "blur" && amount > 0.02) {
                ctx.save();
                ctx.filter = `blur(${Math.max(1, Math.round(6 * dpr * amount))}px)`;
                const step = 3 * amount;
                for (let y = -2; y <= 2; y++) {
                  for (let x = -2; x <= 2; x++) {
                    ctx.globalAlpha = alpha * 0.14;
                    blit(ctx, glyph.fill, glyph.offset.x + x * step, glyph.offset.y + y * step, 0, 0);
                  }
                }
                ctx.restore();
              } else if (returning && s.returnEffect === "lens" && amount > 0.02) {
                const len = Math.hypot(glyph.offset.x, glyph.offset.y) || 1;
                const nx = glyph.offset.x / len;
                const ny = glyph.offset.y / len;
                const fringe = 24 * amount;
                blitTint(glyph.fill, glyph.offset.x - nx * fringe, glyph.offset.y - ny * fringe, "#ff4b6a", alpha * 0.9 * amount);
                blitTint(glyph.fill, glyph.offset.x + nx * fringe, glyph.offset.y + ny * fringe, "#49d6ff", alpha * 0.8 * amount);
                ctx.globalAlpha = alpha;
                blit(ctx, glyph.fill, glyph.offset.x, glyph.offset.y, 0, 0);
              } else {
                ctx.globalAlpha = alpha;
                blit(ctx, glyph.fill, glyph.offset.x, glyph.offset.y, 0, 0);
              }
            }
            if (glyph.outline > 0.001) {
              ctx.globalAlpha = glyph.outline;
              blit(ctx, glyph.dashes, glyph.offset.x, glyph.offset.y, 0, 0);
            }
            ctx.globalAlpha = 1;
          });
          const settling =
            moving ||
            (frame.alpha > 0.01 && frame.alpha < 0.99);
          if (!frozen && (active || settling) && visible && alive) raf = requestAnimationFrame(tick);
        };

        const wake = () => {
          if (raf || !visible || !alive) return;
          last = performance.now();
          raf = requestAnimationFrame(tick);
        };
        wakeRef.current = wake;

        const resize = () => {
          width = Math.max(1, container.clientWidth);
          height = Math.max(1, container.clientHeight);
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
          layoutKey = '';
          wake();
        };

        const locate = (e: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          pointer.x = e.clientX - rect.left;
          pointer.y = e.clientY - rect.top;
        };
        const onMove = (e: PointerEvent) => {
          locate(e);
          pointer.inside = true;
          wake();
        };
        const onLeave = () => {
          if (dragging >= 0) return;
          pointer.inside = false;
          wake();
        };
        const onDown = (e: PointerEvent) => {
          locate(e);
          pointer.inside = true;
          const s = settingsRef.current;
          if (s?.draggable && (e.pointerType !== 'mouse' || e.button === 0)) {
            const index = glyphAt(pointer.x, pointer.y);
            if (index >= 0) {
              dragging = index;
              grab.x = pointer.x - glyphs[index].offset.x;
              grab.y = pointer.y - glyphs[index].offset.y;
              container.setPointerCapture?.(e.pointerId);
            }
          }
          wake();
        };
        const onUp = (e: PointerEvent) => {
          if (dragging >= 0) {
            dragging = -1;
            container.releasePointerCapture?.(e.pointerId);
            const rect = container.getBoundingClientRect();
            pointer.inside =
              e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
          }
          wake();
        };

        const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
        const onKeyDown = (e: KeyboardEvent) => {
          const s = settingsRef.current;
          if (!s?.draggable || !glyphs.length || !arrows.includes(e.key)) return;
          e.preventDefault();
          if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            keyLetter = e.key === "ArrowRight"
              ? (keyLetter + 1) % glyphs.length
              : (keyLetter - 1 + glyphs.length) % glyphs.length;
            const glyph = glyphs[keyLetter];
            pointer.x = (glyph.box.x1 + glyph.box.x2) / 2;
            pointer.y = (glyph.box.y1 + glyph.box.y2) / 2;
            pointer.inside = true;
            wake();
            return;
          }
          const glyph = glyphs[keyLetter];
          if (!glyph) return;
          const step = 28;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          dragging = keyLetter;
          grab.x = 0;
          grab.y = 0;
          pointer.x = glyph.offset.x + dx;
          pointer.y = glyph.offset.y + dy;
          pointer.inside = true;
          wake();
        };
        const onKeyUp = (e: KeyboardEvent) => {
          if (!arrows.includes(e.key) || dragging < 0) return;
          dragging = -1;
          wake();
        };
        const onMotion = () => {
          reducedMotion = motionQuery?.matches ?? false;
          wake();
        };

        if (!frozen) {
            container.addEventListener('pointermove', onMove, { passive: true });
            container.addEventListener('pointerenter', onMove, { passive: true });
            container.addEventListener('pointerdown', onDown, { passive: true });
            container.addEventListener('pointerup', onUp, { passive: true });
            container.addEventListener('pointercancel', onUp, { passive: true });
            container.addEventListener('pointerleave', onLeave, { passive: true });
            container.addEventListener('keydown', onKeyDown);
            container.addEventListener('keyup', onKeyUp);
            motionQuery?.addEventListener("change", onMotion);
        }

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        const intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          wake();
        });
        intersectionObserver.observe(container);
        if (document.fonts) document.fonts.ready.then(refreshFonts, refreshFonts);

        resize();

        return () => {
          alive = false;
          cancelAnimationFrame(raf);
          wakeRef.current = () => {};
          resizeObserver.disconnect();
          intersectionObserver.disconnect();
          container.removeEventListener('pointermove', onMove);
          container.removeEventListener('pointerenter', onMove);
          container.removeEventListener('pointerdown', onDown);
          container.removeEventListener('pointerup', onUp);
          container.removeEventListener('pointercancel', onUp);
          container.removeEventListener('pointerleave', onLeave);
          container.removeEventListener('keydown', onKeyDown);
          container.removeEventListener('keyup', onKeyUp);
          motionQuery?.removeEventListener("change", onMotion);
        };
    }, [isStatic])

    const interactive = settings.draggable && !isStatic;
    return (
        <div
            ref={containerRef}
            className={props.className}
            style={{
                width: "100%",
                height: "100%",
                touchAction: interactive ? "none" : "pan-y",
                userSelect: "none",
                ...props.style,
                position: "relative",
            }}
            role={interactive ? "group" : "img"}
            aria-roledescription={interactive ? "dragdrop" : undefined}
            aria-label={interactive ? `${settings.text}. Arrow keys pull a letter. Shift and left or right choose it.` : settings.text}
            tabIndex={interactive ? 0 : undefined}
        >
            <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
        </div>
    )
}

dragdrop.displayName = "dragdrop"

addPropertyControls(dragdrop, {
    content: {
        type: ControlType.Object,
        title: "Content",
        icon: "object",
        controls: {
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "BuiltByKern",
                description: "The wordmark.",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayTextAlignment: false,
                defaultValue: {
                    fontSize: "150px",
                    variant: "Semibold",
                    letterSpacing: "-0.05em",
                    lineHeight: "1em",
                },
                description: "Largest size. The wordmark shrinks to fit the frame.",
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        icon: "color",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: "#1C1B19",
                description: "Colors the letters.",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#1C1B19",
                description: "Colors the frame.",
            },
            strokeColor: {
                type: ControlType.Color,
                title: "Stroke",
                defaultValue: "#1C1B19",
                description: "Colors the line back to its place. The line stays when the frame is off.",
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 1.5,
                min: 0.5,
                max: 8,
                step: 0.1,
                unit: "px",
                description: "Weight of the line, and of the outline left in its place.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        controls: {
            selection: {
                type: ControlType.Boolean,
                title: "Frame",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Square around the letter under the pointer.",
            },
            draggable: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Letters spring back when released.",
            },
            returnEffect: {
                type: ControlType.Enum,
                title: "Return",
                options: ["spring", "blur", "lens"],
                optionTitles: ["Spring", "Blur", "Lens"],
                defaultValue: "spring",
                description: "Spring stays sharp. Blur softens the letter. Lens splits it red and cyan.",
                hidden: (group: { draggable?: boolean }) => group.draggable === false,
            },
            amount: {
                type: ControlType.Number,
                title: "Amount",
                defaultValue: 1,
                min: 0,
                max: 1,
                step: 0.05,
                description: "How much of that return you see.",
                hidden: (group: { draggable?: boolean; returnEffect?: string }) =>
                    group.draggable === false || !group.returnEffect || group.returnEffect === "spring",
            },
            inertia: {
                type: ControlType.Number,
                title: "Inertia",
                defaultValue: 0.65,
                min: 0,
                max: 1,
                step: 0.05,
                description: "How far it overshoots before it settles.",
                hidden: (group: { draggable?: boolean }) => group.draggable === false,
            },
        },
        description: CREDIT,
    },
})

