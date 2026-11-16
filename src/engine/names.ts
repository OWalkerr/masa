// İsim temizleme ve tekilleştirme
import { MAX_NAME } from './types';

export function cleanName(raw: string): string {
  // Kontrol karakterlerini at, boşlukları sadeleştir
  const s = raw.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮]/g, '').replace(/\s+/g, ' ').trim();
  return [...s].slice(0, MAX_NAME).join('').trim();
}

// Aynı isim varsa sonuna sayı eklenir: "Ayşe" -> "Ayşe 2"
export function uniqueName(name: string, taken: string[]): string {
  const lower = new Set(taken.map((n) => n.toLocaleLowerCase('tr')));
  if (!lower.has(name.toLocaleLowerCase('tr'))) return name;
  for (let i = 2; i < 100; i++) {
    const suffix = ` ${i}`;
    const base = [...name].slice(0, MAX_NAME - suffix.length).join('').trim();
    const candidate = base + suffix;
    if (!lower.has(candidate.toLocaleLowerCase('tr'))) return candidate;
  }
  return name;
}

export const BOT_NAMES = [
  'Hortlak Hüsnü', 'Baykuş Bedia', 'Kuzgun Kader', 'Gölge Gönül', 'Tabut Tarık', 'Fener Ferhat',
  'Zifir Zeki', 'Sis Sibel', 'Mumcu Mehmet', 'Ay Ayten', 'Mezar Melek', 'Örümcek Ömer',
];
