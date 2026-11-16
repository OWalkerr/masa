// Ekrandaki açıklamalar: kart türünün tek satırlık kuralı, "şu an ne oluyor" cümlesi, içme fiili.
import type { Card } from '../../../engine/cards';
import type { View } from '../../../engine/viewFor';

// Alkolsüz masada "içer" yerine "ceza alır"
export function drinkWord(view: View): { verb: string; noun: string; imp: string } {
  const sober = !view.settings.drinking;
  return sober ? { verb: 'ceza alır', noun: 'ceza', imp: 'ceza al' } : { verb: 'içer', noun: 'yudum', imp: 'iç' };
}

// Kart türünün kuralı: oyuncu bir bakışta ne olacağını anlasın
export function howTo(card: Card, view: View): string {
  const v = drinkWord(view).verb;
  const tags = card.tags ?? [];
  switch (card.type) {
    case 'question':
      return card.target === 'all' ? `Herkes sırayla cevaplar. Cevaplamayanı okuyucu işaretler, o ${v}.` : `Cevapla ya da ${drinkWord(view).imp}. Hükmü okuyucu verir.`;
    case 'dare':
      if (tags.includes('anlat')) return `Gizli kelime yalnızca anlatanın telefonunda. Masa bilemezse anlatan ${v}.`;
      return card.target === 'all' ? `Herkes yapar. Yapmayanı okuyucu işaretler, o ${v}.` : `Yap ya da ${drinkWord(view).imp}. Hükmü okuyucu verir.`;
    case 'mostLikely':
      return `Herkes gizlice birini seçer. En çok oyu alan ${v}.`;
    case 'neverHave':
      return `Dürüst ol: yaptıysan “Yaptım” de. Yapanlar ${v}.`;
    case 'rule':
      return `Kural masada. Bozanı gören “Yakala!” der, masa oylar.`;
    case 'curse':
      return `Lanetli kuralı bozarsa “Yakala!” ile yakalanır.`;
    case 'duel':
      return `İkisi kapışır, kalanlar kazananı oylar. Kaybeden ${v}.`;
    case 'mirror':
      if (tags.includes('yalan')) return `Hedef 2 doğru 1 yalan söyler, yalanı gizlice işaretler. Bulamayan ${v}; herkes bulursa yalancı ${v}.`;
      if (tags.includes('olcek')) return `Hedef gizlice 1–10 arası puan verir, herkes tahmin eder. En uzak tahmin ${v}; tam bilen çıkarsa hedef ${v}.`;
      return `Hedef gizlice seçer, diğerleri tahmin eder. Bilemeyen ${v}.`;
    case 'confession':
      return `Herkes anonim yazar. Biri spot ışığına çıkar, yazarını tahmin edin.`;
    case 'minigame':
      if (card.minigame === 'bomb') return `Bomba sana gelince dokun, başkasına at. Elinde patlayan ${v}.`;
      if (card.minigame === 'reflex') return `Bardak dolunca dokun. En geç kalan da erken dokunan da ${v}.`;
      return `İçinden 10 say ve dokun. 10'a en uzak kalan ${v}.`;
    case 'mission':
      return `Biri gizli görev aldı. Ajanı fark eden “Yakala!” der. Ajan başarırsa herkes ${v}.`;
    case 'golden':
      return 'Altın kart: kartın dediği olur.';
    case 'tableEvent':
      return 'Masa olayı: herkesi ilgilendirir.';
  }
}

export interface NowLine {
  text: string;
  mine: boolean; // sıra bende mi (vurgulu gösterilir)
}

// "Şu an ne oluyor?" cümlesi
export function nowLine(view: View): NowLine | null {
  const g = view.game;
  if (!g) return null;
  const me = view.you?.id;
  const name = (id: string | null | undefined) => view.players.find((p) => p.id === id)?.name ?? '?';
  const reader = name(g.readerId);
  const isReader = !!me && me === g.readerId;
  const waitNames = (ids: string[]) => {
    const n = ids.map(name);
    return n.length <= 3 ? n.join(', ') : `${n.slice(0, 2).join(', ')} ve ${n.length - 2} kişi`;
  };
  switch (view.phase) {
    case 'actIntro':
      return { text: `Perde ${g.act} başlıyor…`, mine: false };
    case 'choose':
      if (g.step === 'target') return isReader ? { text: 'Kartı kime oynuyorsun? Seç.', mine: true } : { text: `${reader} kurbanını seçiyor…`, mine: false };
      return isReader ? { text: 'Sıra sende: elindeki 3 karttan birini oyna.', mine: true } : { text: `${reader} elindeki kartlara bakıyor…`, mine: false };
    case 'reveal':
      return { text: g.system ? 'Masaya bir olay düştü!' : `${reader} kartı açtı!`, mine: false };
    case 'action': {
      if (g.mg) return { text: g.mg.stage === 'wait' ? 'Hazır ol…' : 'Şimdi!', mine: true };
      const mineToDo = !!me && g.waitingOn.includes(me);
      if (g.input === 'judge') {
        if (isReader) return { text: 'Görev bitince hükmünü ver.', mine: true };
        if (me && g.targets.includes(me)) return { text: `Sahne senin! Bitince ${reader} hüküm verecek.`, mine: true };
        return { text: `${waitNames(g.targets)} sahnede. Hükmü ${reader} verecek.`, mine: false };
      }
      if (mineToDo) {
        const what =
          g.input === 'votePlayer' ? 'Oyunu ver.' : g.input === 'yesNo' ? 'Dürüstçe cevapla.' : g.input === 'choice' ? (me === g.targets[0] ? 'Gizli seçimini yap.' : 'Tahminini yap.')
            : g.stage === 'write' ? 'Anonim cevabını yaz.' : 'Kim yazdı? Tahmin et.';
        return { text: `Sıra sende: ${what}`, mine: true };
      }
      if (g.waitingOn.length) return { text: `Bekleniyor: ${waitNames(g.waitingOn)}`, mine: false };
      return { text: 'Sonuç açılıyor…', mine: false };
    }
    case 'resolve':
      return { text: 'Sonuç masada. Konuşun, gülün; hazır olunca devam.', mine: false };
    case 'tableEvent':
      return { text: 'Masa olayı herkes için geçerli.', mine: false };
    case 'finale':
      return { text: 'Son kart. Kadehler havaya!', mine: false };
    default:
      return null;
  }
}
