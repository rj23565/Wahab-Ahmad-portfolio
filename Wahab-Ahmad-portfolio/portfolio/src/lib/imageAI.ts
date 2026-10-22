"use client";

import type { AssetFrame } from "@/types";

/* ---------------------------------------------------------------------------
 * Client-side image A.I. toolkit for the AddMine panel.
 * All operations run in the browser using Canvas — zero cloud calls.
 * ------------------------------------------------------------------------- */

export interface ImageAnalysis {
  dominant: string;
  secondary: string;
  accent: string;
  brightness: number;  // 0..1
  contrast: number;    // 0..1
  saturation: number;  // 0..1
  entropy: number;     // rough detail density
  frame: AssetFrame;
  suggestedCategory: "screen-printing" | "textile" | "web-app" | "social-media";
  aiTitle: string;
  aiDescription: string;
  aiTags: string[];
}

/** Analyze an image (data URL) and produce AI metadata. */
export function analyzeImage(dataUrl: string): Promise<ImageAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const size = Math.min(80, Math.max(40, Math.round(80 * Math.min(1, 600 / Math.max(w, h)))));
      const cw = size;
      const ch = Math.max(1, Math.round((h / w) * size));
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(fallback(w, h));
      ctx.drawImage(img, 0, 0, cw, ch);
      const data = ctx.getImageData(0, 0, cw, ch).data;

      let rSum = 0, gSum = 0, bSum = 0, n = 0;
      const buckets = new Map<string, number>();
      let minL = 255, maxL = 0;
      let rVar = 0, gVar = 0, bVar = 0;
      const hist = new Array(64).fill(0);

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 100) continue;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        rSum += r; gSum += g; bSum += b; n++;
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        if (l < minL) minL = l;
        if (l > maxL) maxL = l;
        const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
        hist[Math.min(63, Math.floor(l / 4))]++;
      }
      if (n === 0) return resolve(fallback(w, h));

      const rAvg = rSum / n, gAvg = gSum / n, bAvg = bSum / n;

      // variance pass
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]; if (a < 100) continue;
        rVar += Math.pow(data[i] - rAvg, 2);
        gVar += Math.pow(data[i + 1] - gAvg, 2);
        bVar += Math.pow(data[i + 2] - bAvg, 2);
      }
      const variance = (rVar + gVar + bVar) / (3 * n * 255 * 255);
      const contrast = Math.min(1, (maxL - minL) / 255);
      const brightness = Math.min(1, (0.299 * rAvg + 0.587 * gAvg + 0.114 * bAvg) / 255);

      // sort buckets
      const sorted = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]);
      const toHex = (key: string) => {
        const [br, bg, bb] = key.split("-").map((x) => parseInt(x) * 32);
        return `#${[br, bg, bb].map((x) => Math.min(255, x + 8).toString(16).padStart(2, "0")).join("")}`;
      };
      const dominant = toHex(sorted[0][0]);
      const secondary = sorted[1] ? toHex(sorted[1][0]) : shift(dominant, -30);
      const accent = pickAccent(sorted, dominant);

      // entropy from histogram
      let entropy = 0;
      for (const v of hist) {
        if (!v) continue;
        const p = v / n;
        entropy -= p * Math.log2(p);
      }
      entropy = Math.min(1, entropy / 6);

      // saturation (avg chroma)
      let satSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]; if (a < 100) continue;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        satSum += max === 0 ? 0 : (max - min) / max;
      }
      const saturation = Math.min(1, satSum / n);

      const frame = detectFrame(w, h);
      const category = guessCategory(frame, saturation, contrast, dominant);
      const { aiTitle, aiDescription, aiTags } = writeCopy(
        frame, category, dominant, saturation, contrast, entropy
      );

      resolve({
        dominant, secondary, accent,
        brightness, contrast, saturation, entropy,
        frame, suggestedCategory: category,
        aiTitle, aiDescription, aiTags,
      });
    };
    img.onerror = () => resolve(fallback(0, 0));
    img.src = dataUrl;
  });
}

/** Produce a thumbnail at <= 720px longest edge, JPEG, for storage efficiency. */
export function makeThumbnail(dataUrl: string, maxEdge = 720, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const scale = Math.min(1, maxEdge / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, cw, ch);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Sharpen & enhance: returns a new high-resolution data URL. */
export function enhanceImage(dataUrl: string, opts = { sharpen: 0.8, contrast: 0.12, brightness: 0.03 }): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Work at native resolution but cap for safety
      const maxDim = 2400;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const cw = Math.max(1, Math.round(img.naturalWidth * scale));
      const ch = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, cw, ch);

      try {
        const imgData = ctx.getImageData(0, 0, cw, ch);
        const d = imgData.data;
        // Mild USM-like convolution via contrast/brightness + 3x3 sharpen
        const copy = new Uint8ClampedArray(d);
        const w = cw;
        const k = opts.sharpen;
        for (let y = 1; y < ch - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            for (let c = 0; c < 3; c++) {
              const i = (y * w + x) * 4 + c;
              const v =
                -copy[i - 4 - w * 4] * 0 - copy[i - w * 4] * k - copy[i + 4 - w * 4] * 0 +
                -copy[i - 4] * k       + copy[i] * (1 + 4 * k)    - copy[i + 4] * k +
                -copy[i - 4 + w * 4] * 0 - copy[i + w * 4] * k - copy[i + 4 + w * 4] * 0;
              d[i] = clamp(v * (1 + opts.contrast) + 255 * opts.brightness);
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // tainted canvas - leave as is
      }
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Read file into a data URL and gather dimensions. */
export function readFile(file: File): Promise<{ dataUrl: string; width: number; height: number; mime: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          mime: file.type || "image/jpeg",
          size: file.size,
        });
      };
      img.onerror = () => reject(new Error("bad image"));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Trigger client download of a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ---------- helpers ---------- */

function fallback(w: number, h: number): ImageAnalysis {
  return {
    dominant: "#1c2750",
    secondary: "#e0b86c",
    accent: "#e0b86c",
    brightness: 0.2, contrast: 0.6, saturation: 0.4, entropy: 0.5,
    frame: detectFrame(w || 4, h || 5),
    suggestedCategory: "screen-printing",
    aiTitle: "Untitled Work",
    aiDescription: "Uploaded design asset.",
    aiTags: ["Design", "Uploaded"],
  };
}

function clamp(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function shift(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function pickAccent(buckets: [string, number][], dominant: string) {
  for (const [k] of buckets) {
    const hex = toHexAbs(k);
    const dr = Math.abs(hex.r - domRGB(dominant).r);
    const dg = Math.abs(hex.g - domRGB(dominant).g);
    const db = Math.abs(hex.b - domRGB(dominant).b);
    if (dr + dg + db > 120) return `#${[hex.r, hex.g, hex.b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }
  return "#e0b86c";
}
function toHexAbs(k: string) {
  const [r, g, b] = k.split("-").map((x) => Math.min(255, parseInt(x) * 32 + 8));
  return { r, g, b };
}
function domRGB(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function detectFrame(w: number, h: number): AssetFrame {
  if (!w || !h) return "auto";
  const r = w / h;
  if (Math.abs(r - 1) < 0.08) return "square";
  if (r > 1.7 && r < 2.0) return "web";
  if (r > 1.4 && r < 1.8) return "landscape";
  if (r > 2.2) return "textile";
  if (r < 0.55) return "mobile";
  if (r < 0.75 && r > 0.6) return "tshirt";
  if (r < 0.85 && r >= 0.75) return "social";
  if (r < 0.75) return "poster";
  return "landscape";
}

function guessCategory(
  frame: AssetFrame,
  sat: number,
  contrast: number,
  dominant: string
): ImageAnalysis["suggestedCategory"] {
  const c = domRGB(dominant);
  // blues/teals -> web
  if (c.b > c.r + 20 && frame === "web") return "web-app";
  // mobile/social aspect -> social
  if (frame === "mobile" || frame === "social" || frame === "square")
    return "social-media";
  // high saturation textile/wide -> textile
  if (frame === "textile" || (sat > 0.45 && frame === "landscape")) return "textile";
  // portrait high contrast -> print / tee
  if (contrast > 0.5 && (frame === "tshirt" || frame === "poster")) return "screen-printing";
  return "screen-printing";
}

function writeCopy(
  frame: AssetFrame,
  category: ImageAnalysis["suggestedCategory"],
  dominant: string,
  sat: number,
  contrast: number,
  entropy: number
) {
  const frameLabel: Record<AssetFrame, string> = {
    tshirt: "tee composition",
    poster: "poster layout",
    landscape: "landscape composition",
    square: "square asset",
    textile: "repeat/textile layout",
    web: "web layout",
    mobile: "mobile/social story",
    social: "social feed asset",
    auto: "composition",
  };
  const titles: Record<string, string> = {
    "screen-printing": "Screen Print Composition",
    textile: "Textile Pattern Study",
    "web-app": "Digital Product Preview",
    "social-media": "Social Feed Concept",
  };
  const descs: Record<string, string> = {
    "screen-printing": `High-contrast ${frameLabel[frame]} detected with palette ${dominant}. Optimized for multi-color separation and crisp registration — vector-ready outlines and high-impact silhouettes.`,
    textile: `${frameLabel[frame]} detected with a ${sat > 0.5 ? "rich" : "refined"} palette anchored in ${dominant}. Pattern repeat engineered for digital textile printing and embroidery crosswalks.`,
    "web-app": `Digital ${frameLabel[frame]} detected at ${contrast > 0.5 ? "strong" : "balanced"} contrast. UI-forward composition tuned for staging preview and interactive deployment.`,
    "social-media": `High-retention ${frameLabel[frame]} in ${dominant}. Designed for ${frame === "mobile" ? "story / reel" : "feed"} placement with bold typographic hierarchy.`,
  };
  const tagMap: Record<string, string[]> = {
    "screen-printing": ["Print", "Separation", "High-Contrast"],
    textile: ["Textile", "Pattern", "Repeat"],
    "web-app": ["Web", "UI", "Preview"],
    "social-media": ["Social", "Campaign", "Feed"],
  };
  const tags = new Set<string>(tagMap[category]);
  if (entropy > 0.7) tags.add("Detail-Dense");
  if (contrast > 0.6) tags.add("High-Contrast");
  if (sat > 0.5) tags.add("Saturated");
  return {
    aiTitle: titles[category],
    aiDescription: descs[category],
    aiTags: Array.from(tags),
  };
}
