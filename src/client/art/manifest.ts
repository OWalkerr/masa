// Görsel manifest'i: /art/manifest.json (scripts/convert-art.ts üretir). Yoksa yer tutucu SVG'ler kullanılır.
import { useEffect, useState } from 'react';
import type { Card } from '../../engine/cards';
import { hashId } from '../components/GameCard/labels';

export interface ArtItem { w800: string; w400: string; w1600?: string; width: number; height: number }
export interface ArtManifest {
  items: Record<string, ArtItem>;
  byType: Record<string, string[]>;
  decks: Record<string, string>;
  avatars: Record<string, string>;
}

let manifest: ArtManifest | null = null;
let loading: Promise<ArtManifest | null> | null = null;
const listeners = new Set<() => void>();

export function loadManifest(): Promise<ArtManifest | null> {
  if (manifest) return Promise.resolve(manifest);
  loading ??= fetch('/art/manifest.json')
    .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : null))
    .then((j: ArtManifest | null) => {
      manifest = j && j.items ? j : { items: {}, byType: {}, decks: {}, avatars: {} };
      listeners.forEach((l) => l());
      return manifest;
    })
    .catch(() => null);
  return loading;
}

export function useManifest(): ArtManifest | null {
  const [m, setM] = useState(manifest);
  useEffect(() => {
    if (manifest) return;
    const l = () => setM(manifest);
    listeners.add(l);
    void loadManifest();
    return () => void listeners.delete(l);
  }, []);
  return m;
}

// Kartın görseli: kendi "art" anahtarı, yoksa türünün varyantlarından id'ye göre deterministik biri
export function artFor(m: ArtManifest | null, card: Pick<Card, 'id' | 'type' | 'art'> & { tags?: string[] }): ArtItem | null {
  if (!m) return null;
  if (card.art && m.items[card.art]) return m.items[card.art]!;
  // Ev Kartları (masanın yazdıkları) kendi görselini taşır
  if (card.tags?.includes('ev') && m.byType.house?.length) return m.items[m.byType.house[hashId(card.id) % m.byType.house.length]!] ?? null;
  // Sistem kartlarının (Su Molası, final) kendi görseli varsa
  if (card.id.startsWith('sys-')) {
    const k = card.id.startsWith('sys-final') ? 'sys-final' : card.id;
    if (m.items[k]) return m.items[k]!;
  }
  // Görseli henüz olmayan türler en yakın türün görselini kullanır (Gizli Görev → Ayna)
  const FALLBACK: Partial<Record<string, string>> = { mission: 'mirror', sketch: 'confession' };
  const vars = m.byType[card.type]?.length ? m.byType[card.type] : m.byType[FALLBACK[card.type] ?? ''];
  if (!vars?.length) return null;
  return m.items[vars[hashId(card.id) % vars.length]!] ?? null;
}

export function keyItem(m: ArtManifest | null, key: string | undefined): ArtItem | null {
  return m && key ? m.items[key] ?? null : null;
}

// Sıradaki elin görsellerini önceden çek
export function preloadCards(cards: (Pick<Card, 'id' | 'type' | 'art'> & { tags?: string[] })[]) {
  void loadManifest().then((m) => {
    for (const c of cards) {
      const a = artFor(m, c);
      if (a) {
        const img = new Image();
        img.src = window.devicePixelRatio > 1.5 ? a.w800 : a.w400;
      }
    }
  });
}
