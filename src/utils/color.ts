export interface RGB { r: number; g: number; b: number; }

const VIOLET: RGB = { r: 0.71, g: 0.47, b: 1.0 };
const WHITE: RGB = { r: 1.0, g: 1.0, b: 1.0 };
const RED: RGB = { r: 1.0, g: 0.3, b: 0.3 };
const GOLD: RGB = { r: 1.0, g: 0.8, b: 0.4 };
const GOLDEN_ANGLE_DEG = 137.508;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function attentionToColor(intensity: number): RGB {
  return {
    r: lerp(VIOLET.r, WHITE.r, intensity),
    g: lerp(VIOLET.g, WHITE.g, intensity),
    b: lerp(VIOLET.b, WHITE.b, intensity),
  };
}

export function ffnToColor(energy: number): RGB {
  if (energy < 0.5) {
    const t = energy * 2;
    return { r: lerp(RED.r, GOLD.r, t), g: lerp(RED.g, GOLD.g, t), b: lerp(RED.b, GOLD.b, t) };
  }
  const t = (energy - 0.5) * 2;
  return { r: lerp(GOLD.r, WHITE.r, t), g: lerp(GOLD.g, WHITE.g, t), b: lerp(GOLD.b, WHITE.b, t) };
}

export function hueForToken(index: number): number {
  return (index * GOLDEN_ANGLE_DEG) % 360;
}
