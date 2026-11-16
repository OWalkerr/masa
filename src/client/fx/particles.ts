// Hafif canvas partikül sistemi: en fazla 150 partikül, sekme gizliyken durur, hareketi azaltta kapalı.
import { getReduceMotion } from './motionPref';

type Kind = 'dust' | 'glint' | 'bat' | 'ink';

interface P {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rot: number;
  vr: number;
}

const MAX = 150;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const parts: P[] = [];
let raf = 0;
let last = 0;

export function attachParticles(el: HTMLCanvasElement) {
  canvas = el;
  ctx = el.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (parts.length) start();
  });
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function emit(kind: Kind, x: number, y: number, count: number) {
  if (!ctx || getReduceMotion()) return;
  for (let i = 0; i < count && parts.length < MAX; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = kind === 'bat' ? 3 + Math.random() * 6 : kind === 'dust' ? 0.2 + Math.random() * 0.8 : 1 + Math.random() * 3;
    parts.push({
      kind,
      x: x + (kind === 'dust' ? (Math.random() - 0.5) * 300 : 0),
      y: y + (kind === 'dust' ? (Math.random() - 0.5) * 300 : 0),
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - (kind === 'bat' ? 3 : kind === 'dust' ? 0.4 : 0),
      life: 0,
      max: kind === 'dust' ? 160 + Math.random() * 120 : kind === 'bat' ? 90 + Math.random() * 40 : 50 + Math.random() * 30,
      size: kind === 'bat' ? 10 + Math.random() * 10 : kind === 'dust' ? 1 + Math.random() * 2.2 : 2 + Math.random() * 2,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }
  start();
}

// Ekranın ortasından (ya da bir elemanın merkezinden) yay
export function emitAt(kind: Kind, el: Element | null, count: number) {
  const r = el?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
  emit(kind, x, y, count);
}

function start() {
  if (raf || document.hidden) return;
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

function stop() {
  cancelAnimationFrame(raf);
  raf = 0;
}

function loop(now: number) {
  const dt = Math.min(3, (now - last) / 16.67);
  last = now;
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]!;
    p.life += dt;
    if (p.life >= p.max) {
      parts.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    if (p.kind === 'bat') {
      p.vy += 0.12 * dt;
      p.vx *= 0.99;
    } else if (p.kind === 'ink') p.vy += 0.15 * dt;
    const alpha = 1 - p.life / p.max;
    draw(ctx, p, alpha, now);
  }
  if (parts.length) raf = requestAnimationFrame(loop);
  else {
    raf = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

function draw(c: CanvasRenderingContext2D, p: P, alpha: number, now: number) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(p.x, p.y);
  c.rotate(p.rot);
  if (p.kind === 'dust') {
    c.fillStyle = '#D4AF37';
    c.beginPath();
    c.arc(0, 0, p.size * (0.8 + 0.2 * Math.sin(now / 200 + p.x)), 0, Math.PI * 2);
    c.fill();
  } else if (p.kind === 'glint') {
    c.strokeStyle = '#E4E8EE';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-p.size * 2, 0);
    c.lineTo(p.size * 2, 0);
    c.moveTo(0, -p.size * 2);
    c.lineTo(0, p.size * 2);
    c.stroke();
  } else if (p.kind === 'ink') {
    c.fillStyle = '#EDE6D6';
    c.beginPath();
    c.arc(0, 0, p.size, 0, Math.PI * 2);
    c.fill();
  } else {
    // yarasa konfetisi: kanat çırpar (8 fps)
    const flap = Math.floor(now / 125) % 2 ? 0.5 : 1;
    const s = p.size;
    c.fillStyle = '#0D0B10';
    c.strokeStyle = '#EDE6D6';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-s * 0.6, -s * 0.6 * flap, -s, -s * 0.1 * flap);
    c.quadraticCurveTo(-s * 0.6, 0, -s * 0.5, s * 0.25);
    c.quadraticCurveTo(-s * 0.2, s * 0.1, 0, s * 0.35);
    c.quadraticCurveTo(s * 0.2, s * 0.1, s * 0.5, s * 0.25);
    c.quadraticCurveTo(s * 0.6, 0, s, -s * 0.1 * flap);
    c.quadraticCurveTo(s * 0.6, -s * 0.6 * flap, 0, 0);
    c.fill();
    c.stroke();
  }
  c.restore();
}
