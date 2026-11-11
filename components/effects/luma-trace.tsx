// Luma Trace 1.0.1 — izivizi
// Commercial release. See the supplied license.
import * as React from "react";
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

interface Props {
  flow: string;
  angle: number;
  lean: number;
  easing: string;
  svgFile: string;
  sequence: string;
  shape: string;
  path: string;
  viewBox: string;
  color: string;
  accent: string;
  background: string;
  strands: number;
  depth: number;
  glow: number;
  duration: number;
  playing: boolean;
  progress: number;
  head: number;
  decay: number;
  scale: number;
  label: string;
  style?: React.CSSProperties;
}
const presets: Record<string, { paths: string[]; box: string }> = {
  Orbit: {
    paths: ["M430 250 A180 180 0 1 1 70 250 A180 180 0 1 1 430 250 Z"],
    box: "0 0 500 500",
  },
  Bloom: {
    paths: [
      "M425 280 C390 315 350 300 330 340 C305 390 310 440 250 440 C190 440 195 390 170 340 C145 290 60 295 60 240 C60 190 110 185 160 165 C200 145 200 60 250 60 C300 60 300 145 340 165 C390 185 440 190 440 240 C440 260 435 270 425 280 Z",
    ],
    box: "0 0 500 500",
  },
  Frame: {
    paths: [
      "M435 350 V390 Q435 435 390 435 H110 Q65 435 65 390 V110 Q65 65 110 65 H390 Q435 65 435 110 V350 Z",
    ],
    box: "0 0 500 500",
  },
};
const clamp = (x: number, a: number, b: number) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
type Artwork = { d: string; transform: string; rule: "evenodd" | "nonzero" };
function closedObjects(d: string): string[] {
  const chunks = d.match(/[Mm][^Mm]*/g) || [];
  if (!chunks.length) throw Error("No closed paths found in the SVG.");
  const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const ctx = document.createElement("canvas").getContext("2d")!;
  let previous = { x: 0, y: 0 };
  const parts = chunks.map((chunk) => {
    let path = chunk;
    if (chunk[0] === "m") {
      const values = Array.from(
        chunk.slice(1).matchAll(/[+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?/gi),
      ).slice(0, 2);
      if (values.length < 2)
        throw Error("Unable to read a relative SVG subpath.");
      const rest = chunk.slice(1 + values[1].index! + values[1][0].length);
      path =
        `M${previous.x + Number(values[0][0])} ${previous.y + Number(values[1][0])}` +
        (/^\s*[,\s]*[-+.\d]/.test(rest) ? " l" : " ") +
        rest;
    }
    probe.setAttribute("d", path);
    const length = probe.getTotalLength(),
      first = probe.getPointAtLength(0);
    previous = probe.getPointAtLength(length);
    if (!/[zZ]\s*$/.test(path)) {
      if (Math.hypot(previous.x - first.x, previous.y - first.y) > 0.01)
        throw Error("Close every path before exporting the SVG.");
      path += " Z";
    }
    const points = Array.from({ length: 65 }, (_, i) =>
      probe.getPointAtLength((length * i) / 64),
    );
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y);
    return {
      path,
      first,
      area:
        (Math.max(...xs) - Math.min(...xs)) *
        (Math.max(...ys) - Math.min(...ys)),
      geometry: new Path2D(path),
    };
  });
  const parents = parts.map((part, i) => {
    let parent = -1,
      area = Infinity;
    parts.forEach((other, j) => {
      if (
        i !== j &&
        other.area > part.area &&
        other.area < area &&
        ctx.isPointInPath(other.geometry, part.first.x, part.first.y)
      ) {
        parent = j;
        area = other.area;
      }
    });
    return parent;
  });
  const root = (i: number): number => (parents[i] < 0 ? i : root(parents[i]));
  return parts.flatMap((part, i) =>
    parents[i] < 0
      ? [
          parts
            .filter((_, j) => root(j) === i)
            .map((p) => p.path)
            .join(" "),
        ]
      : [],
  );
}
function parseArtwork(text: string): { items: Artwork[]; box: string } {
  if (text.length > 1000000) throw Error("Use an SVG smaller than 1 MB.");
  const doc = new DOMParser().parseFromString(text, "image/svg+xml"),
    svg = doc.documentElement;
  if (svg.localName !== "svg" || doc.querySelector("parsererror"))
    throw Error("This file is not a valid SVG.");
  if (svg.querySelector("text"))
    throw Error("Convert text to outlines before exporting this SVG.");
  if (svg.querySelector("use,image,foreignObject,clipPath,mask,svg"))
    throw Error(
      "Flatten symbols, masks and clipping paths, and remove embedded images before export.",
    );
  const vb = (svg.getAttribute("viewBox") || "")
    .trim()
    .split(/[ ,]+/)
    .map(Number);
  let box: string;
  if (vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0)
    box = vb.join(" ");
  else {
    const w = parseFloat(svg.getAttribute("width") || ""),
      h = parseFloat(svg.getAttribute("height") || "");
    if (!(w > 0 && h > 0)) throw Error("Export the SVG with a viewBox.");
    box = `0 0 ${w} ${h}`;
  }
  const items: Artwork[] = [];
  function walk(
    el: Element,
    transform: string,
    rule: "evenodd" | "nonzero",
    fill: string,
  ) {
    const tag = el.localName;
    if (["defs", "script", "style", "metadata", "title", "desc"].includes(tag))
      return;
    const styles = Object.fromEntries(
      (el.getAttribute("style") || "")
        .split(";")
        .map((s) => s.split(":").map((x) => x.trim()))
        .filter((a) => a.length === 2),
    );
    if (
      el.getAttribute("display") === "none" ||
      styles.display === "none" ||
      el.getAttribute("visibility") === "hidden" ||
      styles.visibility === "hidden"
    )
      return;
    const nextTransform =
      `${transform} ${el.getAttribute("transform") || ""}`.trim();
    const nextRule =
      (el.getAttribute("fill-rule") || styles["fill-rule"] || rule) ===
      "evenodd"
        ? "evenodd"
        : "nonzero";
    const nextFill = el.getAttribute("fill") || styles.fill || fill;
    const n = (key: string, fallback = 0) => {
      const value = el.getAttribute(key);
      if (value === null) return fallback;
      if (!/^[-+\d.eE]+$/.test(value.trim()))
        throw Error(
          "Use numeric SVG coordinates without units or percentages.",
        );
      return Number(value);
    };
    let d = "";
    if (tag === "path") d = el.getAttribute("d") || "";
    if (tag === "rect") {
      const x = n("x"),
        y = n("y"),
        w = n("width"),
        h = n("height"),
        rx = Math.min(n("rx", n("ry")), w / 2),
        ry = Math.min(n("ry", rx), h / 2);
      d =
        rx && ry
          ? `M${x + rx} ${y} H${x + w - rx} A${rx} ${ry} 0 0 1 ${x + w} ${y + ry} V${y + h - ry} A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h} H${x + rx} A${rx} ${ry} 0 0 1 ${x} ${y + h - ry} V${y + ry} A${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`
          : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
    }
    if (tag === "circle" || tag === "ellipse") {
      const x = n("cx"),
        y = n("cy"),
        rx = tag === "circle" ? n("r") : n("rx"),
        ry = tag === "circle" ? rx : n("ry");
      d = `M${x + rx} ${y} A${rx} ${ry} 0 1 1 ${x - rx} ${y} A${rx} ${ry} 0 1 1 ${x + rx} ${y} Z`;
    }
    if (tag === "polygon") {
      const points = (el.getAttribute("points") || "")
        .trim()
        .split(/[ ,]+/)
        .map(Number);
      if (
        points.length < 6 ||
        points.length % 2 ||
        !points.every(Number.isFinite)
      )
        throw Error("Invalid polygon points.");
      d =
        `M${points[0]} ${points[1]} ` +
        points
          .slice(2)
          .reduce((a, v, i) => a + (i % 2 ? `${v} ` : `L${v} `), "") +
        "Z";
    }
    if (tag === "line" || tag === "polyline")
      throw Error("Outline strokes and close open paths before export.");
    if (d && nextFill !== "none")
      for (const object of closedObjects(d))
        items.push({ d: object, transform: nextTransform, rule: nextRule });
    if (items.length > 40)
      throw Error("Use at most 40 closed objects per component.");
    if (tag === "g" || tag === "svg")
      Array.from(el.children).forEach((child) =>
        walk(child, nextTransform, nextRule, nextFill),
      );
  }
  walk(svg, "", "nonzero", "black");
  if (!items.length)
    throw Error(
      "No filled closed shapes found. Outline strokes before export.",
    );
  return { items, box };
}

// All curves map a phase's normalized time to distance along the outline.
// Smooth has zero velocity and acceleration at both ends (quintic smootherstep).
function timelineEase(value: number, curve: string): number {
  const t = clamp(value, 0, 1);
  if (curve === "Linear") return t;
  if (curve === "Gentle") return (1 - Math.cos(Math.PI * t)) / 2;
  return t * t * t * (t * (t * 6 - 15) + 10);
}
/**
 * Fixed outer shell, inward contours, luminous tracing front and receding afterglow.
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 720
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LumaTrace(props: Partial<Props>) {
  const {
    flow = "Auto",
    angle = -45,
    lean = 0.18,
    easing = "Smooth",
    svgFile = "",
    sequence = "Together",
    shape = "Bloom",
    path = "",
    viewBox = "0 0 840 860",
    color = "#e4f1ff",
    accent = "#8ba8cb",
    background = "#000000",
    strands = 110,
    depth = 0.47,
    glow = 1,
    duration = 5.7,
    playing = true,
    progress = 0.56,
    head = 1.5,
    decay = 0.18,
    scale = 0.88,
    label = "Luminous inward contour reveal",
    style,
  } = props;
  const staticRenderer = useIsStaticRenderer(),
    uid = React.useId().replace(/:/g, "");
  const root = React.useRef<HTMLDivElement>(null),
    sources = React.useRef<Array<SVGPathElement | null>>([]),
    groups = React.useRef<Array<SVGGElement | null>>([]),
    lights = React.useRef<Array<SVGRadialGradientElement | null>>([]),
    hotGroups = React.useRef<Array<SVGGElement | null>>([]);
  const preset = presets[shape] || presets.Bloom;
  const [upload, setUpload] = React.useState<{
    items: Artwork[];
    box: string;
  } | null>(null);
  const [uploadError, setUploadError] = React.useState("");
  React.useEffect(() => {
    if (shape !== "Upload SVG") {
      setUploadError("");
      return;
    }
    setUpload(null);
    if (!svgFile) {
      setUploadError("Upload an SVG to begin.");
      return;
    }
    const abort = new AbortController();
    let active = true;
    setUploadError("Loading SVG…");
    fetch(svgFile, { signal: abort.signal })
      .then((r) => {
        if (!r.ok)
          throw Error("Unable to load SVG. Re-upload the file in Framer.");
        return r.text();
      })
      .then((text) => {
        const result = parseArtwork(text);
        if (active) {
          setUpload(result);
          setUploadError("");
        }
      })
      .catch((e) => {
        if (active)
          setUploadError(
            e instanceof Error ? e.message : "Unable to load SVG.",
          );
      });
    return () => {
      active = false;
      abort.abort();
    };
  }, [shape, svgFile]);
  const artwork = React.useMemo<Artwork[]>(
    () =>
      shape === "Upload SVG"
        ? upload?.items || []
        : shape === "Custom"
          ? [{ d: path, transform: "", rule: "evenodd" }]
          : preset.paths.map((d) => ({ d, transform: "", rule: "nonzero" })),
    [shape, path, preset, upload],
  );
  const paths = React.useMemo(() => artwork.map((a) => a.d), [artwork]);
  const rawBox =
    shape === "Upload SVG"
      ? upload?.box || "0 0 840 860"
      : shape === "Custom"
        ? viewBox
        : preset.box;
  const parts = rawBox.trim().split(/[ ,]+/).map(Number);
  const box =
    parts.length === 4 &&
    parts.every(Number.isFinite) &&
    parts[2] > 0 &&
    parts[3] > 0
      ? parts
      : [0, 0, 840, 860];
  const unit = Math.max(box[2], box[3]) / 860,
    cx = box[0] + box[2] / 2,
    cy = box[1] + box[3] / 2;
  const count = Math.min(
    Math.round(clamp(strands, 12, 140)),
    Math.max(12, Math.floor(1800 / Math.max(1, paths.length))),
  );
  const [centers, setCenters] = React.useState<
    Array<{
      x: number;
      y: number;
      small: boolean;
      size: number;
      axis: number;
      elongation: number;
    }>
  >([]);
  React.useEffect(() => {
    setCenters(
      paths.map((_, i) => {
        try {
          const source = sources.current[i]!,
            b = source.getBBox(),
            length = source.getTotalLength();
          const points = Array.from({ length: 96 }, (_, j) =>
            source.getPointAtLength((length * j) / 96),
          );
          const mx = points.reduce((v, p) => v + p.x, 0) / 96,
            my = points.reduce((v, p) => v + p.y, 0) / 96;
          let xx = 0,
            yy = 0,
            xy = 0;
          for (const p of points) {
            xx += (p.x - mx) ** 2;
            yy += (p.y - my) ** 2;
            xy += (p.x - mx) * (p.y - my);
          }
          const delta = Math.sqrt((xx - yy) ** 2 + 4 * xy * xy),
            ratio = (xx + yy + delta) / Math.max(0.00001, xx + yy - delta);
          let axis = 0.5 * Math.atan2(2 * xy, xx - yy);
          // Orient the principal axis toward the upper tip. Compact objects stay centered.
          if (Math.sin(axis) > 0) axis -= Math.PI;
          return {
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
            small: Math.max(b.width, b.height) < Math.max(box[2], box[3]) * 0.3,
            size: Math.max(b.width, b.height),
            axis,
            elongation: clamp((ratio - 3) / 5, 0, 1),
          };
        } catch {
          return {
            x: cx,
            y: cy,
            small: false,
            size: Math.max(box[2], box[3]),
            axis: 0,
            elongation: 0,
          };
        }
      }),
    );
  }, [paths, rawBox]);
  React.useEffect(() => {
    let raf = 0,
      last = 0,
      elapsed = 0,
      visible = true,
      disposed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lengths = sources.current.map((p) => {
      try {
        return p?.getTotalLength() || 1;
      } catch {
        return 1;
      }
    });
    function draw(p: number) {
      const end = timelineEase(p / 0.49, easing),
        start = timelineEase((p - 0.69) / 0.27, easing);
      paths.forEach((_, i) => {
        const stagger =
          sequence === "Sequence" ? (i / Math.max(1, paths.length)) * 0.28 : 0;
        const localDraw = timelineEase(
          (p - stagger) / (0.49 - stagger),
          easing,
        );
        const e = sequence === "Sequence" ? localDraw : end;
        const s =
          sequence === "Sequence"
            ? timelineEase(
                (p - 0.69 - stagger * 0.5) / (0.27 - stagger * 0.5),
                easing,
              )
            : start;
        const group = groups.current[i];
        if (!group) return;
        group.setAttribute(
          "stroke-dasharray",
          `${Math.max(0, e - s) * 100} 200`,
        );
        group.setAttribute("stroke-dashoffset", `${-s * 100}`);
        group.style.opacity = e > s ? "1" : "0";
        const light = lights.current[i],
          source = sources.current[i],
          hot = hotGroups.current[i];
        if (light && source) {
          try {
            const point = source.getPointAtLength(e * lengths[i]);
            light.setAttribute("cx", String(point.x));
            light.setAttribute("cy", String(point.y));
          } catch {
            group.style.opacity = "0";
          }
        }
        if (hot)
          hot.style.opacity = String(
            (1 - timelineEase((p - 0.49) / 0.09, "Smooth")) * clamp(head, 0, 4),
          );
      });
    }
    function tick(now: number) {
      if (disposed) return;
      if (last) elapsed += Math.min(now - last, 80);
      last = now;
      draw((elapsed / (clamp(duration, 2, 20) * 1000)) % 1);
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(raf);
      last = 0;
      if (
        !staticRenderer &&
        playing &&
        !reduced.matches &&
        visible &&
        !document.hidden
      )
        raf = requestAnimationFrame(tick);
      else draw(clamp(progress, 0, 1));
    }
    const observer = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    if (root.current) observer.observe(root.current);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [
    paths,
    shape,
    staticRenderer,
    playing,
    progress,
    head,
    duration,
    centers,
    sequence,
    easing,
  ]);
  return (
    <div
      ref={root}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={!label || undefined}
      style={{
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        background,
        overflow: "hidden",
      }}
    >
      {uploadError && shape === "Upload SVG" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 24,
            color: "#cbd5e1",
            font: "14px/1.5 sans-serif",
            textAlign: "center",
          }}
        >
          {uploadError}
        </div>
      )}
      <svg
        width="100%"
        height="100%"
        viewBox={box.join(" ")}
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <defs>
          <clipPath id={`${uid}shell`}>
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                transform={artwork[i].transform}
                clipRule={artwork[i].rule}
              />
            ))}
          </clipPath>
          <linearGradient
            id={`${uid}metal`}
            x1="0"
            y1="0"
            x2=".8"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stopColor={color} />
            <stop offset=".22" stopColor={color} />
            <stop offset=".5" stopColor={accent} />
            <stop offset=".75" stopColor={accent} stopOpacity=".45" />
            <stop offset="1" stopColor={color} stopOpacity=".58" />
          </linearGradient>
          <linearGradient id={`${uid}prism`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#89d7ff" />
            <stop offset=".35" stopColor="#fff1a0" />
            <stop offset=".65" stopColor="#ff8059" />
            <stop offset="1" stopColor="#dd5574" />
          </linearGradient>
          <filter
            id={`${uid}bloom`}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              stdDeviation={10 * unit * clamp(glow, 0, 3)}
              result="blur"
            />
            <feComponentTransfer in="blur" result="soft">
              <feFuncA type="linear" slope=".8" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {paths.map((d, i) => (
            <React.Fragment key={i}>
              <clipPath id={`${uid}object${i}`}>
                <path d={d} clipRule={artwork[i].rule} />
              </clipPath>
              <path
                ref={(el) => {
                  sources.current[i] = el;
                }}
                d={d}
              />
              <radialGradient
                ref={(el) => {
                  lights.current[i] = el;
                }}
                id={`${uid}head${i}`}
                gradientUnits="userSpaceOnUse"
                r={
                  (centers[i]?.size || Math.max(box[2], box[3])) *
                  clamp(decay, 0.04, 0.4)
                }
              >
                <stop offset="0" stopColor="#ffffff" />
                <stop offset=".2" stopColor={color} stopOpacity=".95" />
                <stop offset=".55" stopColor={color} stopOpacity=".4" />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </React.Fragment>
          ))}
        </defs>
        <g
          transform={`translate(${cx} ${cy}) scale(${clamp(scale, 0.2, 0.98)}) translate(${-cx} ${-cy})`}
          filter={glow > 0 ? `url(#${uid}bloom)` : undefined}
        >
          <g clipPath={`url(#${uid}shell)`}>
            {paths.map((d, index) => {
              const center = centers[index] || {
                x: cx,
                y: cy,
                small: false,
                size: Math.max(box[2], box[3]),
                axis: 0,
                elongation: 0,
              };
              const direction =
                flow === "Auto" ? center.axis : (angle * Math.PI) / 180;
              const amount =
                flow === "Centered"
                  ? 0
                  : clamp(lean, 0, 0.4) *
                    (flow === "Auto" ? center.elongation : 1);
              const pivotX =
                center.x + Math.cos(direction) * center.size * amount;
              const pivotY =
                center.y + Math.sin(direction) * center.size * amount;
              const spread = clamp(depth, 0.1, 0.8);
              const localUnit =
                shape === "Upload SVG" ? center.size / 650 : unit;
              // A stable, nonuniform depth distribution creates bundles and quiet gaps.
              // Positive cumulative intervals preserve ordering and keep the shell anchored.
              const gaps = Array.from({ length: count - 1 }, (_, i) => {
                const u = (i + 0.5) / (count - 1);
                const wave =
                  0.5 +
                  0.28 * Math.sin(u * 31.7 + 0.4) +
                  0.22 * Math.sin(u * 73.1 + 1.9);
                return 0.28 + 2.3 * Math.pow(clamp(wave, 0, 1), 2);
              });
              const totalGap = gaps.reduce((sum, gap) => sum + gap, 0);
              let distance = 0;
              const accents = [0.17, 0.61].map((u) =>
                Math.round(u * (count - 1)),
              );
              const highlights = [0, 0.075, 0.285, 0.46, 0.73].map((u) =>
                Math.round(u * (count - 1)),
              );
              const contours = Array.from({ length: count }, (_, i) => {
                if (i > 0) distance += gaps[i - 1];
                const t = distance / totalGap;
                const s = 1 - t * spread;
                // Intensity and width have separate smooth profiles, not a repeating nth-line rule.
                const band = clamp(
                  0.5 +
                    0.3 * Math.sin(t * 25.4 + 0.7) +
                    0.2 * Math.sin(t * 59.3 + 2.3),
                  0,
                  1,
                );
                const filament = 0.5 + 0.5 * Math.sin(i * 2.39996 + 0.8);
                const strong = highlights.includes(i);
                const colored = accents.includes(i);
                const intensity = strong
                  ? 0.96
                  : colored
                    ? 0.8
                    : 0.28 + 0.65 * band;
                return {
                  i,
                  t,
                  colored,
                  transform: `translate(${pivotX} ${pivotY}) scale(${s}) translate(${-pivotX} ${-pivotY})`,
                  opacity: intensity * Math.pow(1 - t, 1.15),
                  hotOpacity: (0.22 + 0.78 * intensity) * Math.pow(1 - t, 0.65),
                  width:
                    localUnit *
                    (strong ? 2.05 : colored ? 1.15 : 0.75 + 0.7 * filament),
                };
              });
              return (
                <g key={index} transform={artwork[index].transform}>
                  <g clipPath={`url(#${uid}object${index})`}>
                    <g
                      ref={(el) => {
                        groups.current[index] = el;
                      }}
                      fill="none"
                      strokeLinecap="butt"
                      strokeDasharray="100 200"
                      strokeDashoffset="0"
                    >
                      {contours.map((c) => (
                        <path
                          key={c.i}
                          d={d}
                          pathLength={100}
                          transform={c.transform}
                          opacity={c.opacity}
                          strokeWidth={c.width}
                          stroke={
                            c.colored
                              ? `url(#${uid}prism)`
                              : `url(#${uid}metal)`
                          }
                        />
                      ))}
                      <g
                        ref={(el) => {
                          hotGroups.current[index] = el;
                        }}
                      >
                        {contours.map((c) => (
                          <path
                            key={c.i}
                            d={d}
                            pathLength={100}
                            transform={c.transform}
                            opacity={c.hotOpacity}
                            strokeWidth={
                              c.width * (1 + clamp(head, 0, 4) * 0.3)
                            }
                            stroke={`url(#${uid}head${index})`}
                          />
                        ))}
                      </g>
                    </g>
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
addPropertyControls(LumaTrace, {
  flow: {
    type: ControlType.Enum,
    title: "Layer Direction",
    options: ["Auto", "Centered", "Angled"],
    defaultValue: "Auto",
    description:
      "Auto follows the long axis of elongated objects; compact shapes remain centered.",
  },
  angle: {
    type: ControlType.Number,
    title: "Layer Angle",
    min: -180,
    max: 180,
    step: 1,
    unit: "°",
    defaultValue: -45,
    hidden: (p) => p.flow !== "Angled",
  },
  lean: {
    type: ControlType.Number,
    title: "Layer Lean",
    min: 0,
    max: 0.4,
    step: 0.01,
    defaultValue: 0.18,
    hidden: (p) => p.flow === "Centered",
    description:
      "Shifts the inward convergence point. The outer silhouette stays fixed.",
  },
  easing: {
    type: ControlType.Enum,
    title: "Timing Curve",
    options: ["Smooth", "Gentle", "Linear"],
    defaultValue: "Smooth",
    description:
      "Smooth accelerates and decelerates with zero velocity and acceleration at each endpoint. Applies to drawing and erasing.",
  },
  svgFile: {
    type: ControlType.File,
    title: "SVG File",
    allowedFileTypes: ["svg"],
    hidden: (p) => p.shape !== "Upload SVG",
  },
  sequence: {
    type: ControlType.Enum,
    title: "Objects",
    options: ["Together", "Sequence"],
    defaultValue: "Together",
    description: "Sequence follows the object order in the exported SVG.",
  },
  shape: {
    type: ControlType.Enum,
    title: "Shape",
    options: ["Bloom", "Orbit", "Frame", "Custom", "Upload SVG"],
    defaultValue: "Bloom",
  },
  path: {
    type: ControlType.String,
    title: "SVG Path",
    displayTextArea: true,
    defaultValue: "",
    hidden: (p) => p.shape !== "Custom",
    description:
      "Closed path data. For several separate objects, use Upload SVG instead.",
  },
  viewBox: {
    type: ControlType.String,
    title: "View Box",
    defaultValue: "0 0 840 860",
    hidden: (p) => p.shape !== "Custom",
  },
  color: { type: ControlType.Color, title: "Light", defaultValue: "#e4f1ff" },
  accent: {
    type: ControlType.Color,
    title: "Shadow Tint",
    defaultValue: "#8ba8cb",
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#000000",
  },
  depth: {
    type: ControlType.Number,
    title: "Inward Depth",
    min: 0.1,
    max: 0.8,
    step: 0.01,
    defaultValue: 0.47,
  },
  strands: {
    type: ControlType.Number,
    title: "Strands",
    min: 12,
    max: 140,
    step: 1,
    defaultValue: 110,
  },
  head: {
    type: ControlType.Number,
    title: "Head Brightness",
    min: 0,
    max: 4,
    step: 0.1,
    defaultValue: 1.5,
  },
  decay: {
    type: ControlType.Number,
    title: "Light Falloff",
    min: 0.04,
    max: 0.4,
    step: 0.01,
    defaultValue: 0.18,
  },
  glow: {
    type: ControlType.Number,
    title: "Bloom",
    min: 0,
    max: 3,
    step: 0.1,
    defaultValue: 1,
  },
  duration: {
    type: ControlType.Number,
    title: "Duration",
    min: 2,
    max: 20,
    step: 0.1,
    defaultValue: 5.7,
    unit: "s",
  },
  scale: {
    type: ControlType.Number,
    title: "Size",
    min: 0.2,
    max: 0.98,
    step: 0.01,
    defaultValue: 0.88,
  },
  playing: { type: ControlType.Boolean, title: "Animate", defaultValue: true },
  progress: {
    type: ControlType.Number,
    title: "Preview Frame",
    min: 0,
    max: 1,
    step: 0.001,
    defaultValue: 0.56,
    description: "Scrub the drawing in the editor or when Animate is off.",
  },
  label: {
    type: ControlType.String,
    title: "Accessibility",
    defaultValue: "Luminous inward contour reveal",
  },
});
