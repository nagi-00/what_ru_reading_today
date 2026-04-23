/**
 * Derive a full neumorphism palette from a single seed color.
 * The seed hex becomes the accent; the surface is a very light/desaturated
 * tint of the seed (or its dark counterpart in dark mode) so that
 * inset/outset shadows feel native on the background.
 */

export type Palette = {
  surface: string;        // main background
  surfaceAlt: string;     // slightly different background for panels
  shadowDark: string;     // outer dark shadow for outset
  shadowLight: string;    // outer light highlight for outset
  accent: string;         // primary accent (user-picked)
  accentSoft: string;     // lighter accent for subtle tints
  accentStrong: string;   // darker accent for hover/pressed
  text: string;           // primary text
  textSoft: string;       // muted text
  border: string;         // subtle divider
};

function clamp(n: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(v, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l] as const;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

function adjust(hex: string, sMul: number, lDelta: number) {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [nr, ng, nb] = hslToRgb(h, clamp(s * sMul, 0, 1) as number, clamp(l + lDelta, 0, 1) as number);
  return rgbToHex(nr, ng, nb);
}

export function buildPalette(seedHex: string, dark: boolean): Palette {
  const [h, s] = rgbToHsl(...hexToRgb(seedHex));
  if (dark) {
    // dark surface tinted with the accent hue
    const [sr, sg, sb] = hslToRgb(h, Math.min(s, 0.2), 0.14);
    const surface = rgbToHex(sr, sg, sb);
    const surfaceAlt = adjust(surface, 1, 0.03);
    return {
      surface,
      surfaceAlt,
      shadowDark: adjust(surface, 1, -0.08),
      shadowLight: adjust(surface, 1, 0.06),
      accent: seedHex,
      accentSoft: adjust(seedHex, 0.8, 0.08),
      accentStrong: adjust(seedHex, 1.05, -0.08),
      text: "#e9ebf2",
      textSoft: "#9fa4b3",
      border: adjust(surface, 1, 0.08),
    };
  }
  // light surface: very high lightness, lightly tinted with the accent hue
  const [sr, sg, sb] = hslToRgb(h, Math.min(s, 0.12), 0.94);
  const surface = rgbToHex(sr, sg, sb);
  const surfaceAlt = adjust(surface, 1, -0.015);
  return {
    surface,
    surfaceAlt,
    shadowDark: adjust(surface, 1, -0.12),
    shadowLight: "#ffffff",
    accent: seedHex,
    accentSoft: adjust(seedHex, 0.7, 0.2),
    accentStrong: adjust(seedHex, 1.05, -0.12),
    text: "#1f2230",
    textSoft: "#6a6f80",
    border: adjust(surface, 1, -0.06),
  };
}

export function applyPalette(p: Palette) {
  const r = document.documentElement;
  r.style.setProperty("--surface", p.surface);
  r.style.setProperty("--surface-alt", p.surfaceAlt);
  r.style.setProperty("--shadow-dark", p.shadowDark);
  r.style.setProperty("--shadow-light", p.shadowLight);
  r.style.setProperty("--accent", p.accent);
  r.style.setProperty("--accent-soft", p.accentSoft);
  r.style.setProperty("--accent-strong", p.accentStrong);
  r.style.setProperty("--text", p.text);
  r.style.setProperty("--text-soft", p.textSoft);
  r.style.setProperty("--border", p.border);
}
