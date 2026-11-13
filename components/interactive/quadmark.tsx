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
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type GridTheme = {
  background: string;
  stroke: string;
  palette: string[];
};

const DEFAULT_ACCENT_COLORS = [
  "#f54e00",
  "#8b6914",
  "#e07a5f",
  "#ffb700",
  "#1f8a65",
  "#0ea5e9",
  "#2563eb",
  "#a78bfa",
  "#ec4899",
  "#cf2d56",
];

type HitTest = (x: number, y: number) => boolean;
type GridHit = (gx: number, gy: number) => boolean;

type ProdCell = { x: number; y: number; size: number; depth: number };

const BASE_COLS = 18;
const BASE_ROWS = 9;
const MAX_DEPTH = 4;
const SAMPLE_GRID = 5;
const FIT_SCALE = 0.82;
const ALPHA_THRESHOLD = 18;
const HOVER_RADIUS = 1;

const DEFAULT_LOGO = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M5%202.5h10v5h-5Zm0%205h5l5%205H5Zm5%205v5l-5-5Z%22%2F%3E%3C%2Fsvg%3E";

const DEFAULT_ROW_LOGOS = [
  DEFAULT_LOGO,
  DEFAULT_LOGO,
  DEFAULT_LOGO,
  DEFAULT_LOGO,
  DEFAULT_LOGO,
];

const SAMPLE_RADIUS = 2;

function resolveGridStroke(color: string | undefined, mode: "dark" | "light") {
  if (!color?.trim()) {
    return mode === "light"
      ? "rgba(38, 37, 30, 0.12)"
      : "rgba(255, 255, 255, 0.12)";
  }
  const c = color.trim();
  if (/rgba|hsla|color-mix|\/\s*\d/.test(c)) return c;
  if (/^#[0-9a-f]{6}$/i.test(c)) return `${c}1f`;
  if (/^#[0-9a-f]{3}$/i.test(c)) {
    const r = c[1];
    const g = c[2];
    const b = c[3];
    return `#${r}${r}${g}${g}${b}${b}1f`;
  }
  return c;
}

function halfPixel(n: number) {
  return Math.round(n) + 0.5;
}

function sampleAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || iy < 0 || ix >= width || iy >= height) return 0;
  return data[(iy * width + ix) * 4 + 3] ?? 0;
}

function sampleLum(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || iy < 0 || ix >= width || iy >= height) return 255;
  const i = (iy * width + ix) * 4;
  return (
    0.299 * (data[i] ?? 0) +
    0.587 * (data[i + 1] ?? 0) +
    0.114 * (data[i + 2] ?? 0)
  );
}

function countOpaque(data: Uint8ClampedArray) {
  let n = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= ALPHA_THRESHOLD) n++;
  }
  return n;
}

function maxAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  let max = 0;
  for (let dy = -SAMPLE_RADIUS; dy <= SAMPLE_RADIUS; dy++) {
    for (let dx = -SAMPLE_RADIUS; dx <= SAMPLE_RADIUS; dx++) {
      max = Math.max(max, sampleAlpha(data, width, height, x + dx, y + dy));
    }
  }
  return max;
}

function buildHitTest(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): HitTest {
  const total = width * height;
  const opaque = countOpaque(data);
  const useAlpha = opaque < total * 0.02 || opaque < total * 0.92;

  if (useAlpha) {
    return (x, y) =>
      maxAlpha(data, width, height, x, y) >= ALPHA_THRESHOLD;
  }

  let dark = 0;
  let light = 0;
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) < ALPHA_THRESHOLD) continue;
    const lum =
      0.299 * (data[i] ?? 0) +
      0.587 * (data[i + 1] ?? 0) +
      0.114 * (data[i + 2] ?? 0);
    if (lum < 140) dark++;
    else light++;
  }

  const darkOnLight = dark <= light;
  return (x, y) => {
    const lum = sampleLum(data, width, height, x, y);
    return darkOnLight ? lum < 140 : lum > 140;
  };
}

async function resolveImageSrc(url: string): Promise<{ src: string; revoke?: () => void }> {
  if (!url.startsWith("http")) return { src: url };
  try {
    const res = await fetch(url);
    if (!res.ok) return { src: url };
    const blob = await res.blob();
    const src = URL.createObjectURL(blob);
    return { src, revoke: () => URL.revokeObjectURL(src) };
  } catch {
    return { src: url };
  }
}

function loadHitTest(
  url: string,
  width: number,
  height: number,
  fit: number,
): Promise<HitTest> {
  if (typeof document === "undefined" || !url) {
    return Promise.resolve(() => false);
  }

  return (async () => {
    const { src, revoke } = await resolveImageSrc(url);

    return new Promise<HitTest>((resolve) => {
      const img = new Image();
      const finish = (hit: HitTest) => {
        revoke?.();
        resolve(hit);
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx || img.naturalWidth <= 0) {
          finish(() => false);
          return;
        }

        const scale =
          Math.min(width / img.naturalWidth, height / img.naturalHeight) * fit;
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (width - dw) / 2;
        const dy = (height - dh) / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, dx, dy, dw, dh);

        try {
          const image = ctx.getImageData(0, 0, width, height);
          if (countOpaque(image.data) === 0) {
            finish(() => false);
            return;
          }
          finish(buildHitTest(image.data, width, height));
        } catch {
          finish(() => false);
        }
      };

      img.onerror = () => finish(() => false);
      img.src = src;
    });
  })();
}

function pixelToGrid(
  hit: HitTest,
  width: number,
  height: number,
): GridHit {
  const sx = width / BASE_COLS;
  const sy = height / BASE_ROWS;
  return (gx, gy) => hit(gx * sx, gy * sy);
}

function cellHits(isInside: GridHit, x: number, y: number, size: number) {
  for (let row = 0; row < SAMPLE_GRID; row++) {
    for (let col = 0; col < SAMPLE_GRID; col++) {
      const gx = x + (size * (col + 0.5)) / SAMPLE_GRID;
      const gy = y + (size * (row + 0.5)) / SAMPLE_GRID;
      if (isInside(gx, gy)) return true;
    }
  }
  return false;
}

function subdivide(
  x: number,
  y: number,
  size: number,
  depth: number,
  isInside: GridHit,
  out: ProdCell[],
  mouse: { gx: number; gy: number } | null,
  reducedMotion: boolean,
) {
  let limit = MAX_DEPTH;
  if (mouse && !reducedMotion) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    if (
      Math.abs(cx - mouse.gx) <= HOVER_RADIUS + size &&
      Math.abs(cy - mouse.gy) <= HOVER_RADIUS + size
    ) {
      limit = MAX_DEPTH + 1;
    }
  }

  if (depth >= limit || !cellHits(isInside, x, y, size)) {
    out.push({ x, y, size, depth });
    return;
  }

  const half = size / 2;
  subdivide(x, y, half, depth + 1, isInside, out, mouse, reducedMotion);
  subdivide(x + half, y, half, depth + 1, isInside, out, mouse, reducedMotion);
  subdivide(x, y + half, half, depth + 1, isInside, out, mouse, reducedMotion);
  subdivide(x + half, y + half, half, depth + 1, isInside, out, mouse, reducedMotion);
}

function generateCells(
  isInside: GridHit,
  mouse: { gx: number; gy: number } | null,
  reducedMotion: boolean,
) {
  const out: ProdCell[] = [];
  for (let row = 0; row < BASE_ROWS; row++) {
    for (let col = 0; col < BASE_COLS; col++) {
      subdivide(col, row, 1, 0, isInside, out, mouse, reducedMotion);
    }
  }
  return out;
}

function buildColorIndices(cellCount: number, paletteLen: number) {
  const indices = new Uint8Array(cellCount);
  const len = Math.max(1, paletteLen);
  for (let i = 0; i < cellCount; i++) {
    let hash = (i + 1) | 0;
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
    hash = (hash ^ (hash >>> 16)) >>> 0;
    indices[i] = hash % len;
  }
  return indices;
}

function findHoveredCellIndices(
  cells: ProdCell[],
  gridX: number,
  gridY: number,
) {
  const hovered = new Set<number>();
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const cx = cell.x + cell.size / 2;
    const cy = cell.y + cell.size / 2;
    if (
      Math.abs(cx - gridX) <= HOVER_RADIUS &&
      Math.abs(cy - gridY) <= HOVER_RADIUS
    ) {
      hovered.add(i);
    }
  }
  return hovered;
}

function drawHoverEdges(
  ctx: CanvasRenderingContext2D,
  cells: ProdCell[],
  hovered: Set<number>,
  colorIndices: Uint8Array,
  palette: string[],
  scaleX: number,
  scaleY: number,
) {
  if (hovered.size === 0 || palette.length === 0) return;

  const fine = 1 << MAX_DEPTH;
  const horizStride = BASE_COLS * fine;
  const vertStride = BASE_ROWS * fine;
  const lineScaleX = scaleX / fine;
  const lineScaleY = scaleY / fine;
  const buckets: number[][] = Array.from({ length: palette.length }, () => []);

  for (const index of hovered) {
    const bucketIndex = colorIndices[index] ?? 0;
    buckets[bucketIndex]?.push(index);
  }

  for (let paletteIndex = 0; paletteIndex < palette.length; paletteIndex++) {
    const indices = buckets[paletteIndex];
    if (!indices?.length) continue;

    const horiz = new Set<number>();
    const vert = new Set<number>();

    for (const index of indices) {
      const cell = cells[index];
      if (!cell) continue;
      const col = Math.round(cell.x * fine);
      const row = Math.round(cell.y * fine);
      const size = Math.round(cell.size * fine);
      for (let i = 0; i < size; i++) {
        horiz.add(row * horizStride + (col + i));
        horiz.add((row + size) * horizStride + (col + i));
        vert.add(col * vertStride + (row + i));
        vert.add((col + size) * vertStride + (row + i));
      }
    }

    if (horiz.size === 0 && vert.size === 0) continue;

    ctx.beginPath();
    ctx.strokeStyle = palette[paletteIndex] ?? palette[0];
    ctx.lineWidth = 1;

    for (const key of horiz) {
      const row = Math.floor(key / horizStride);
      const col = key - row * horizStride;
      const y = halfPixel(row * lineScaleY);
      ctx.moveTo(col * lineScaleX, y);
      ctx.lineTo((col + 1) * lineScaleX, y);
    }

    for (const key of vert) {
      const col = Math.floor(key / vertStride);
      const row = key - col * vertStride;
      const x = halfPixel(col * lineScaleX);
      ctx.moveTo(x, row * lineScaleY);
      ctx.lineTo(x, (row + 1) * lineScaleY);
    }

    ctx.stroke();
  }
}

function drawLattice(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  cells: ProdCell[],
  theme: GridTheme,
  mouseGrid: { gx: number; gy: number } | null,
  reducedMotion: boolean,
) {
  const scaleX = cssW / BASE_COLS;
  const scaleY = cssH / BASE_ROWS;

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.beginPath();
  ctx.strokeStyle = theme.stroke;
  ctx.lineWidth = 1;
  for (let col = 1; col < BASE_COLS; col++) {
    const x = halfPixel(col * scaleX);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cssH);
  }
  for (let row = 1; row < BASE_ROWS; row++) {
    const y = halfPixel(row * scaleY);
    ctx.moveTo(0, y);
    ctx.lineTo(cssW, y);
  }
  ctx.stroke();

  ctx.lineWidth = 1;
  const strokeLine = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.strokeStyle = theme.stroke;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  for (const cell of cells) {
    if (cell.depth === 0) continue;
    const x0 = cell.x * scaleX;
    const y0 = cell.y * scaleY;
    const x1 = (cell.x + cell.size) * scaleX;
    const y1 = (cell.y + cell.size) * scaleY;

    strokeLine(halfPixel(x0), halfPixel(y0), halfPixel(x1), halfPixel(y0));
    strokeLine(halfPixel(x0), halfPixel(y1), halfPixel(x1), halfPixel(y1));
    strokeLine(halfPixel(x0), halfPixel(y0), halfPixel(x0), halfPixel(y1));
    strokeLine(halfPixel(x1), halfPixel(y0), halfPixel(x1), halfPixel(y1));
  }

  if (mouseGrid && !reducedMotion) {
    const hovered = findHoveredCellIndices(cells, mouseGrid.gx, mouseGrid.gy);
    const colorIndices = buildColorIndices(cells.length, theme.palette.length);
    drawHoverEdges(
      ctx,
      cells,
      hovered,
      colorIndices,
      theme.palette,
      scaleX,
      scaleY,
    );
  }
}

interface LatticePanelProps {
  logoUrl: string;
  theme: GridTheme;
  fit: number;
  reducedMotion: boolean;
  isStatic: boolean;
  style?: CSSProperties;
}

function LatticePanel({
  logoUrl,
  theme,
  fit,
  reducedMotion,
  isStatic,
  style,
}: LatticePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HitTest>(() => false);
  const mouseRef = useRef<{ x: number; y: number; gx: number; gy: number } | null>(
    null,
  );
  const rafRef = useRef(0);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || typeof window === "undefined") return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridHit = pixelToGrid(hitRef.current, w, h);
    const mouseGrid =
      isStatic || reducedMotion || !mouseRef.current
        ? null
        : { gx: mouseRef.current.gx, gy: mouseRef.current.gy };
    const cells = generateCells(gridHit, mouseGrid, reducedMotion);

    drawLattice(ctx, w, h, cells, theme, mouseGrid, reducedMotion);
  }, [theme, reducedMotion, isStatic]);

  const schedule = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let loadGen = 0;
    let lastW = 0;
    let lastH = 0;

    const reloadHit = async () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;

      const myGen = ++loadGen;
      hitRef.current = () => false;
      schedule();

      const hit = await loadHitTest(logoUrl, w, h, fit);
      if (myGen !== loadGen) return;
      hitRef.current = hit;
      schedule();
    };

    const ro = new ResizeObserver(() => {
      void reloadHit();
      schedule();
    });
    ro.observe(wrap);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void reloadHit();
      });
    });

    return () => {
      loadGen += 1;
      ro.disconnect();
    };
  }, [logoUrl, fit, schedule]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (isStatic || reducedMotion) {
      schedule();
      return;
    }

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      mouseRef.current = {
        x,
        y,
        gx: (x / (rect.width * dpr)) * BASE_COLS,
        gy: (y / (rect.height * dpr)) * BASE_ROWS,
      };
      schedule();
    };
    const onLeave = () => {
      mouseRef.current = null;
      schedule();
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    schedule();

    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [schedule, isStatic, reducedMotion]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        flex: style?.flex ?? 1,
        minWidth: 0,
        height: "100%",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-hidden
      />
    </div>
  );
}

interface QuadMarkProps {
  layout: "single" | "logoRow";
  logo: string;
  logos: string[];
  rowGap: number;
  logoFit: number;
  appearance: "dark" | "light";
  canvasBackground: string;
  lightBackground: string;
  gridLineColor: string;
  lightGridLineColor: string;
  accentColors: string[];
  accessibilityLabel: string;
  style?: CSSProperties;
}

/**
 * QuadMark
 *
 * 18×9 quadtree grid mapped to any uploaded logo PNG/JPG/SVG.
 *
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 640
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function QuadMark(props: QuadMarkProps) {
  const {
    layout = "single",
    logo = DEFAULT_LOGO,
    logos = DEFAULT_ROW_LOGOS,
    rowGap = 32,
    logoFit = 0.82,
    appearance = "dark",
    canvasBackground = "#0a0a0a",
    lightBackground = "#f7f7f4",
    gridLineColor = "#ffffff",
    lightGridLineColor = "#26251e",
    accentColors = DEFAULT_ACCENT_COLORS,
    accessibilityLabel = "Interactive QuadMark logo grid",
    style,
  } = props;

  const isStatic = useIsStaticRenderer();
  const labelId = useId();
  const [reducedMotion, setReducedMotion] = useState(false);

  const palette =
    accentColors?.map((c) => c?.trim()).filter(Boolean) ?? DEFAULT_ACCENT_COLORS;
  const resolvedPalette = palette.length > 0 ? palette : DEFAULT_ACCENT_COLORS;

  const theme: GridTheme =
    appearance === "light"
      ? {
          background: lightBackground || "#f7f7f4",
          stroke: resolveGridStroke(lightGridLineColor, "light"),
          palette: resolvedPalette,
        }
      : {
          background: canvasBackground || "#0a0a0a",
          stroke: resolveGridStroke(gridLineColor, "dark"),
          palette: resolvedPalette,
        };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const logoUrl = logo?.trim() || DEFAULT_LOGO;
  const rowUrls = logos.map((u) => u?.trim()).filter(Boolean);
  const rowPanels = rowUrls.length > 0 ? rowUrls : DEFAULT_ROW_LOGOS;
  const panels = layout === "logoRow" ? rowPanels : [logoUrl];

  return (
    <div
      role="img"
      aria-labelledby={labelId}
      style={{
        position: "relative",
        width: style?.width ?? "100%",
        height: style?.height ?? "100%",
        minHeight: layout === "logoRow" ? 180 : 320,
        display: "flex",
        flexDirection: layout === "logoRow" ? "row" : "column",
        gap: layout === "logoRow" ? rowGap : 0,
        overflow: "hidden",
        background: theme.background,
        padding: layout === "logoRow" ? "20px 28px" : "24px 32px",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <span
        id={labelId}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {accessibilityLabel}
      </span>

      {panels.map((url, index) => (
        <LatticePanel
          key={`${url}-${index}`}
          logoUrl={url}
          theme={theme}
          fit={logoFit}
          reducedMotion={reducedMotion}
          isStatic={isStatic}
          style={{ flex: 1, minHeight: 0 }}
        />
      ))}
    </div>
  );
}

QuadMark.displayName = "QuadMark";

addPropertyControls(QuadMark, {
  layout: {
    type: ControlType.Enum,
    title: "Layout",
    options: ["single", "logoRow"],
    optionTitles: ["Single", "Row"],
    defaultValue: "single",
    displaySegmentedControl: true,
  },
  logo: {
    type: ControlType.File,
    title: "Logo",
    allowedFileTypes: ["png", "jpg", "jpeg", "webp", "svg"],
    hidden: (p) => p.layout !== "single",
    description:
      "Upload PNG or JPG. Transparent PNG works best. Default is the Framer logo.",
  },
  logos: {
    type: ControlType.Array,
    title: "Logos",
    hidden: (p) => p.layout !== "logoRow",
    control: {
      type: ControlType.File,
      allowedFileTypes: ["png", "jpg", "jpeg", "webp", "svg"],
    },
    defaultValue: DEFAULT_ROW_LOGOS,
    description:
      "One logo per column. Defaults to five Framer marks for a logo strip section.",
  },
  rowGap: {
    type: ControlType.Number,
    title: "Row gap",
    defaultValue: 32,
    min: 0,
    max: 120,
    step: 4,
    unit: "px",
    hidden: (p) => p.layout !== "logoRow",
  },
  logoFit: {
    type: ControlType.Number,
    title: "Logo size",
    defaultValue: 0.82,
    min: 0.55,
    max: 1,
    step: 0.01,
    description: "How large the logo sits inside the 18×9 grid.",
  },
  appearance: {
    type: ControlType.Enum,
    title: "Appearance",
    options: ["dark", "light"],
    optionTitles: ["Dark", "Light"],
    defaultValue: "dark",
    displaySegmentedControl: true,
  },
  canvasBackground: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#0a0a0a",
    hidden: (p) => p.appearance !== "dark",
  },
  lightBackground: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#f7f7f4",
    hidden: (p) => p.appearance !== "light",
  },
  gridLineColor: {
    type: ControlType.Color,
    title: "Grid lines",
    defaultValue: "#ffffff",
    hidden: (p) => p.appearance !== "dark",
    description: "Neutral grid stroke. Opacity is applied automatically.",
  },
  lightGridLineColor: {
    type: ControlType.Color,
    title: "Grid lines",
    defaultValue: "#26251e",
    hidden: (p) => p.appearance !== "light",
    description: "Dark ink grid on light background. Opacity is applied automatically.",
  },
  accentColors: {
    type: ControlType.Array,
    title: "Accent colors",
    control: { type: ControlType.Color },
    defaultValue: DEFAULT_ACCENT_COLORS,
    maxCount: 12,
    description:
      "Hover palette. Each nearby cell picks a color from this list.",
  },
  accessibilityLabel: {
    type: ControlType.String,
    title: "Aria label",
    defaultValue: "Interactive QuadMark logo grid",
  },
});
