// TIK'in kara mizah replikleri. Masadaki herkes aynı anda aynı repliği görür (oda kodu + tur ile seçilir).
// Kural: mizah durumdan gelir; kimlik, görünüş, din, köken üzerinden şaka yok.
export type TikMoment = 'lobby' | 'waiting' | 'nobody' | 'drink' | 'heavy' | 'act1' | 'act2' | 'act3' | 'catch' | 'mission' | 'water' | 'summary' | 'sober';

export const TIK_LINES: Record<TikMoment, string[]> = {
  lobby: [
    'Herkes otursun. Ölüler de dahil, yer var.',
    'Bu masaya oturan kalkar. Ama aynı kişi olarak değil.',
    'Ben bekliyorum. Zaten yapacak başka işim yok, öldüm.',
    'Telefonları şarja takın. Benim kalbim çoktan durdu, sizinki dursun istemem.',
    'Masa kuruldu. Mezar kazmaktan kolay, söyleyeyim.',
  ],
  waiting: [
    'Kart seçmek, mezar taşı seçmek gibidir. Acele etmeyin.',
    'Sessizlik… En sevdiğim ses.',
    'Bu arada kadehler doldurulsun. Ben zaten hep doluyum.',
    'Okuyucu düşünüyor. Ya da sadece telefonuna bakıyor, emin değilim.',
    'Bekleyin. Ben 200 yıldır bekliyorum, bir şey olmadı.',
    'Şu an birinin hayatı değişmek üzere. Muhtemelen seninki.',
    'Kartlar fısıldıyor. Duymazdan gelin, hep yalan söylerler.',
    'Bir yudum alın, sinirler yatışsın. Benimkiler çoktan yattı.',
  ],
  nobody: [
    'Kimse içmiyor mu? Bu masa beni hayal kırıklığına uğratıyor.',
    'Temiz bir tur. Şüpheli derecede temiz.',
    'Melekler masası. Ya da çok iyi yalancılar.',
    'Bu tur kimse kaybetmedi. Mezarlık bile bu kadar sakin değil.',
    'Bedava tur. Tadını çıkarın, bir daha olmaz.',
  ],
  drink: [
    'Şerefe. Ya da benim durumumda: şerefsizce dolu.',
    'İç bakalım. Karaciğerin seni affeder. Belki.',
    'Bir yudum, bir anı. Yarın ikisi de silinir.',
    'Kadeh kalksın, utanç insin.',
    'Ben de içerdim ama ben zaten içkiyim.',
    'Buna “kader” diyorlar. Ben “güzel bir başlangıç” diyorum.',
    'Yudumun hafif olsun, itirafın ağır.',
  ],
  heavy: [
    'Bu kadar içen bir masa görmedim. Gurur duydum.',
    'Yavaş. Ben bile bu hızda dolmuyorum.',
    'Toplu cenaze gibi oldu. Herkes içiyor, kimse konuşmuyor.',
  ],
  act1: ['Isınma. Daha kimse kimseye kin tutmuyor.', 'Perde açıldı. Kibar olun, bu son şansınız.'],
  act2: ['Kızışıyor. Şimdi sırlar çıkacak.', 'Kurallar geliyor. Ben kural sevmem, ama sizi izlemeyi severim.'],
  act3: ['Kaos. Ben bu perde için yaşıyorum. Mecazen.', 'Son perde. Ne söylediyseniz yarın unutulsun dersiniz, unutulmaz.'],
  catch: [
    'Yakalandı! Masa mahkemesi toplandı.',
    'Fener yandı. Biri yalan söylüyor, ikisi kahkaha atıyor.',
    'Ben yakalanmam. Hep görünmezim, mezarlıkta özellikle.',
  ],
  mission: [
    'Aranızda bir ajan var. Hiçbiriniz güvenilir değilsiniz zaten.',
    'Gizli görev. Ben 1800’lerden beri birini izliyorum, kimse fark etmedi.',
  ],
  water: ['Su için. Ölmek kolay, akşamdan kalmak zor.', 'Su molası. Ben su içmem, çatlarım.'],
  sober: ['Çay da içkidir. Ruhu ısıtır.', 'Alkolsüz de çıldırılır, merak etme.'],
  summary: [
    'Gece bitti. Sırlar mezara, fotoğraflar telefona.',
    'İyi oynadınız. Kimse ölmedi. Bu sefer.',
    'Yarın birbirinize nasıl bakacaksınız? Ben bakmam, gözüm yok.',
    'Masa kapandı. Ama masa unutmaz.',
  ],
};

// Herkes aynı repliği görsün: oda kodu ve tur numarasından deterministik seçim
export function tikLine(moment: TikMoment, seed: string): string {
  const list = TIK_LINES[moment];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return list[(h >>> 0) % list.length]!;
}
