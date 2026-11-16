// Bedeller: alkollü yudum / alkolsüz ceza, içki sınırı, mini ceza destesi.
import type { Rng } from './rng';
import { DRINK_LIMIT_UNITS, DRINK_WINDOW_MS, type GameState, type Payment, type Player, type PlayerStats, type TurnResult } from './types';

// Alkolsüzde her 3 cezada çekilen fiziksel mini cezalar (hepsi oturma odasında, güvenli)
export const PENALTY_DECK: string[] = [
  '10 saniye tek ayak üstünde dur.',
  '5 şınav çek ya da 10 saniye duvara yaslanıp otur.',
  'Bir şarkının nakaratını yüksek sesle söyle.',
  'Sağındakine 3 içten iltifat et.',
  '15 saniye robot gibi hareket et.',
  'Masaya kısa bir hava durumu sun, spiker ciddiyetiyle.',
  'Bir sonraki tura kadar yalnızca fısıldayarak konuş.',
  'Masadaki herkesin adını tersten söyle.',
  '10 saniye boyunca gülmeden masaya bak.',
  'En sevdiğin hayvanın sesini çıkar.',
  'Kollarını kanat gibi açıp 10 saniye yarasa ol.',
  'Bir dakika boyunca herkese "efendim" diye hitap et.',
  'Sesli bir şekilde 10’dan geriye doğru say, her sayıda başka bir aksanla.',
  'Bir tekerleme söyle, takılırsan baştan.',
  '10 saniye boyunca bir heykel ol; masa pozunu seçer.',
  'Solundakinin son söylediği cümleyi dramatik biçimde tekrar et.',
  '5 kez çömel kalk ya da 5 kez omuz çevir.',
  'Masaya 20 saniyelik bir reklam spotu oku: ürün sensin.',
  'Bir sonraki kartı kötü adam sesiyle oku.',
  'Gözlerin kapalı, burnuna dokunup 10 saniye dengede dur.',
];

export function emptyStats(): PlayerStats {
  return { courage: 0, paidUnits: 0, soberPenalties: 0, drinkLog: [], autoSober: false, targeted: 0, done: 0, failed: 0, readerTurns: 0, missedTurns: 0 };
}

export function isSober(s: GameState, p: Player): boolean {
  const st = s.stats[p.id];
  return !s.settings.drinking || !p.consent.ageOk || p.quitDrinking || !!st?.autoSober;
}

export function unitLabel(s: GameState, units: number, sober: boolean): string {
  if (sober) return `${units} ceza`;
  if (s.settings.sip === 'small') return `${units} küçük yudum`;
  // Shot yalnızca 1 birimlik bedellere uygulanır; büyükler yudum kalır
  if (s.settings.sip === 'shot' && units <= 1) return `${units} shot`;
  return `${units} yudum`;
}

// Bir bedeli uygula, sonucu result'a yaz
export function applyPayment(s: GameState, rng: Rng, now: number, p: Player, units: number, result: TurnResult) {
  if (units <= 0) return;
  const st = s.stats[p.id]!;
  let sober = isSober(s, p);
  if (!sober) {
    st.drinkLog = st.drinkLog.filter((d) => now - d.at < DRINK_WINDOW_MS);
    const recent = st.drinkLog.reduce((a, d) => a + d.units, 0);
    if (recent + units > DRINK_LIMIT_UNITS) {
      // 1 saatte 12 birimi geçen otomatik alkolsüze döner ve Su Molası alır
      st.autoSober = true;
      sober = true;
      result.waterBreak.push(p.id);
    } else {
      st.drinkLog.push({ at: now, units });
    }
  }
  const pay: Payment = { id: p.id, units, sober, label: unitLabel(s, units, sober) };
  result.payments.push(pay);
  st.paidUnits += units;
  if (sober) {
    const before = Math.floor(st.soberPenalties / 3);
    st.soberPenalties += units;
    const after = Math.floor(st.soberPenalties / 3);
    for (let i = before; i < after; i++) result.mini.push({ id: p.id, text: rng.pick(PENALTY_DECK) });
  }
}
