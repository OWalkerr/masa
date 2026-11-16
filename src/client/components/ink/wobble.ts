// Elle çizilmiş görünüm için titrek SVG path üretimi (deterministik).
import { makeRng } from '../../../engine/rng';

// Yuvarlatılmış dikdörtgenin çevresinde titrek bir path (viewBox 0..w, 0..h)
export function wobblyRect(w: number, h: number, seed: number, amp = 1.6, r = 12): string {
  const rng = makeRng(seed);
  const j = () => (rng.next() - 0.5) * 2 * amp;
  const pts: [number, number][] = [];
  const step = 18;
  const pad = 2;
  const L = pad, T = pad, R = w - pad, B = h - pad;
  for (let x = L + r; x < R - r; x += step) pts.push([x, T + j()]);
  pts.push([R - r * 0.3 + j(), T + r * 0.3 + j()]);
  for (let y = T + r; y < B - r; y += step) pts.push([R + j(), y]);
  pts.push([R - r * 0.3 + j(), B - r * 0.3 + j()]);
  for (let x = R - r; x > L + r; x -= step) pts.push([x, B + j()]);
  pts.push([L + r * 0.3 + j(), B - r * 0.3 + j()]);
  for (let y = B - r; y > T + r; y -= step) pts.push([L + j(), y]);
  pts.push([L + r * 0.3 + j(), T + r * 0.3 + j()]);
  return smoothClosed(pts);
}

// Catmull-Rom -> kübik Bezier, kapalı eğri
export function smoothClosed(pts: [number, number][]): string {
  const n = pts.length;
  const p = (i: number) => pts[(i + n) % n]!;
  let d = `M${p(0)[0].toFixed(1)},${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

// Spiral (köşe süsü) — merkez (cx,cy), tur sayısı
export function spiral(cx: number, cy: number, maxR: number, turns = 2.5, startAngle = 0): string {
  let d = '';
  const steps = Math.round(turns * 24);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startAngle + t * turns * Math.PI * 2;
    const r = t * maxR;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }
  return d;
}
