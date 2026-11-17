// Kullanıcı metni temizliği: kontrol ve görünmez yön karakterleri atılır, boşluk sadeleşir, uzunluk sınırlanır
export function cleanText(raw: string, max: number): string {
  const s = raw.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim();
  return [...s].slice(0, max).join('').trim();
}
