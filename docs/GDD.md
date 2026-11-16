# MASA — Oyun Tasarım Belgesi (GDD)

> Bu belge Code oturumu ana promptunun bağlayıcı kopyasıdır. Değişiklikler `docs/DECISIONS.md` içinde gerekçesiyle kaydedilir.
> Kaynaklar: `docs/source/` (tasarım belgesi, Gemini görsel promptları, orijinal seed kartları).


Sen bu projenin baş geliştiricisisin. Görevin, arkadaşların kendi telefonlarından aynı odaya girdiği, Tim Burton esintili gotik masal görsellerine sahip, tarayıcıda çalışan bir parti kart oyunu olan **MASA**'yı sıfırdan, yayına hazır hale getirmek. Aşağıdaki her şey bağlayıcı tasarım kararıdır; bir karara itirazın olursa gerekçesini yaz, ama onay almadan değiştirme.

## 0. Benim durumum ve çalışma kuralları

- Şirket bilgisayarındayım, hiçbir şey kuramıyorum. Projeyi **yalnızca tarayıcıdan** test edebilirim. Bu yüzden her kilometre taşının sonunda bana tıklayabileceğim canlı bir adres ver.
- Arkadaşlarım oyuna **hesap açmadan, hiçbir şey kurmadan**, yalnızca link ya da 4 harfli kodla girecek.
- Benimle **Türkçe** konuş. Kod tanımlayıcıları **İngilizce**, kod yorumları **Türkçe**.
- Ekte `cards.seed.json` varsa onu `content/cards/` altına destelere bölerek kullan. Yoksa bölüm 10'daki örneklerle aynı tonda kartları sen üret.
- İşe başlamadan önce kısa bir plan çıkar, sonra M0'dan başla. Her kilometre taşının sonunda dur ve bölüm 12'deki formatta rapor ver.
- Kararlarını `docs/DECISIONS.md` dosyasına tarih ve gerekçeyle yaz. Bu promptun özetini `docs/GDD.md` olarak repoya koy ve güncel tut.

## 1. Oyun özeti

- 3–12 oyuncu. Her oyuncu kendi telefonundan katılır. İsteğe bağlı TV/laptop "Ana Ekran" modu da vardır.
- Sırası gelen oyuncu (Okuyucu) **3 kart** alır, birini seçer ve yüksek sesle okur. Kalanlar kartı yapar. Okuyucu hakemdir.
- Seçilmeyen kartlardan yoğunluğu en yüksek olan, sonraki okuyucuya **miras** kalır.
- Oyun **alkollü** ya da **alkolsüz** oynanır. Aynı kart iki modda farklı bedel gösterir: "2 yudum" ya da "2 ceza".
- 3 perde vardır: Isınma, Kızışma, Kaos. Ardından final kartı ("Son Kadeh" ya da "Son Çay") ve Gecenin Özeti gelir.
- Maskot ve sunucu **TIK**'tir: alkollü modda lale biçimli rakı kadehi, alkolsüz modda ince belli çay bardağı. İnce çöp kolları, iri oyuk gözleri, dikişli bir gülümsemesi var, kara mizah yapar.

## 2. Kurallar

### Oda ve lobi

- "Masa Kur" 4 harfli bir kod üretir. Alfabe: `ABCDEFGHJKLMNPRSTUVYZ`; I, O, Q ve Türkçe harfler yok. Ekranda QR kod ve paylaşım linki (`/m/KOD`) görünür.
- Katılım: isim (en fazla 14 karakter) ve 12 avatardan biri. Aynı isim varsa sonuna sayı eklenir.
- Lobide çevrimiçi durumu canlı görünür. Ayarları yalnızca host değiştirir: mod, alkollü/alkolsüz, süre (Kısa 6 / Normal 10 / Uzun 14 tur/perde), yudum boyu (Küçük yudum / Yudum (varsayılan) / Shot (kapalı gelir)), 18+ kilidi.
- Alkollü mod ya da 18+ açıksa her oyuncu kendi telefonunda yaş onayı verir. Onay vermeyen alkolsüz ve 18+ dışı oynar. Ateşli kartlara ve `temas` etiketine katılım kişisel ve gizlidir.
- Oyun başladıktan sonra katılan, sıranın sonuna eklenir.

### Tur

1. **draw**: Okuyucuya 3 kart verilir (miras kart varsa biri odur). Diğerleri kapalı kartları ve "X kart seçiyor" yazısını görür.
2. **choose (15 sn)**: Okuyucu kartı yukarı kaydırarak ya da dokunup "Oyna" diyerek seçer. Süre dolarsa en düşük yoğunluklu kart oynanır. Hedef gerekiyorsa (`picked`, `twoPicked`) okuyucu oyuncuları seçer.
3. **reveal**: Kart tüm telefonlarda aynı anda döner.
4. **action**: Kart türüne göre herkesin telefonunda tek bir girdi açılır.
5. **resolve**: Okuyucu "Yaptı / Yapmadı" hükmünü verir ya da oylama sonucu uygulanır. Bedeller dağıtılır, cesaret puanı yazılır.
6. **next**: Kısa skor flaşı, kural ve lanet sayaçları düşer, sıra sağdakine geçer.

### Perdeler ve olaylar

- Perde 1 (yoğunluk 1): question, dare, mostLikely, neverHave.
- Perde 2 (yoğunluk 1–2): rule, duel, mirror, confession, golden açılır. Her 4 turda bir `tableEvent` gelir.
- Perde 3 (yoğunluk 2–3): curse ve minigame açılır. Legendary olasılığı iki katına çıkar.
- Her perde en az 1 tam tur sürer (her oyuncu en az bir kez okuyucu olur).
- Perde geçişinde 2,5 sn'lik perde animasyonu oynar.

### Puan, bedel, güç kartları

- Cesaret puanı: görevi yapmak +1, elindeki en yoğun kartı seçmek +1, düello kazanmak +2, golden +3.
- Bedel birimi alkollüde yudum, alkolsüzde cezadır. Alkolsüzde her 3 cezada "Ceza Destesi"nden fiziksel bir mini ceza çekilir (10 sn tek ayakta dur, 5 şınav ya da kibar bir alternatif, bir şarkının nakaratını söyle vb.; kendin 20 tane yaz).
- Her 3 cesaret puanında bir güç kartı kazanılır, cepte en fazla 2 tane durur:
  - **Kalkan**: bir bedeli iptal eder.
  - **Ayna**: bedeli başkasına yansıtır; hedef kendi Kalkan'ıyla karşılık verebilir.
  - **Takas**: okuyucuyken eli yeniden çeker.
  - **Sabotaj**: sonraki okuyucunun miras kartını sen seçersin.
- **Pas**: her oyuncunun perde başına 1 hakkı var, kendine gelen kartı bedelsiz geçer.
- **Veto**: her oyuncunun oyun boyunca 1 anonim hakkı var. Kart herkes için iptal olur, kimin kullandığı gösterilmez.

### Çekiliş kuralları

1. Aynı kart bir oyunda iki kez çıkmaz. Havuz tükenirse aynı türün en eski kartı geri döner.
2. Eldeki 3 kart en az 2 farklı türden olur, en az biri perdenin en düşük yoğunluğundadır.
3. Son 2 turda oynanan türün ağırlığı yarıya iner.
4. `random` hedeflerde az hedef olmuş oyuncunun ağırlığı daha yüksektir.
5. `flort` ve `temas` etiketli kartlar yalnızca katılımı açık oyuncuları hedefler. Yeterli oyuncu yoksa havuza girmez.
6. En fazla 3 aktif kural ve oyuncu başına 1 aktif lanet olur. Sınır doluysa o tür elde çıkmaz.
7. Çekiliş tohumlu (seeded) bir RNG ile yapılır. Testlerde tekrarlanabilir olmalı.

### Güvenlik kuralları (oyun mantığında)

- Bir oyuncu 1 saatte 12 birimi geçerse bedelleri otomatik alkolsüze döner ve ekranına "Su Molası" kartı düşer. Her 8 turda bir masaya Su Molası olayı gelir.
- Her oyuncunun ekranında "Ben bıraktım" düğmesi bulunur; basan alkolsüz bedele geçer.
- Shot seçiliyse en fazla 1 birimlik bedellere uygulanır, büyük bedeller yudum olarak kalır.

## 3. Kart türleri ve girdiler

Kart şeması (zod ile doğrula; `scripts/validate-cards.ts` build öncesi çalışsın):

```ts
type CardType = 'question' | 'dare' | 'mostLikely' | 'neverHave' | 'rule' | 'duel'
  | 'mirror' | 'confession' | 'curse' | 'minigame' | 'golden' | 'tableEvent';
type Target = 'all' | 'reader' | 'picked' | 'twoPicked' | 'random' | 'right' | 'left';
type Input = 'none' | 'judge' | 'votePlayer' | 'yesNo' | 'choice' | 'text' | 'catch' | 'minigame';
interface Card {
  id: string; deck: DeckId; type: CardType;
  intensity: 1 | 2 | 3; rarity: 'common' | 'rare' | 'legendary';
  target: Target; input: Input;
  text: string;            // <= 110 karakter; jetonlar: {okuyucu} {secilen} {ikinci} {sag} {sol} {rastgele}
  penalty: number;         // birim, 0–3
  timer?: number;          // saniye
  duration?: number | 'act'; // kural/lanet süresi (tur) ya da perde sonu
  tags?: string[];         // flort, temas, telefon, sessiz, memleket...
  quip?: string;           // TIK'in tek satırlık yorumu
  choices?: string[] | '$players'; // mirror için
  minigame?: 'bomb' | 'reflex' | 'countdown';
  art?: string;            // görsel anahtarı; yoksa türün varyantı
}
```

| Tür | Mantık | Girdi |
| --- | --- | --- |
| question | Hedef cevaplar; cevaplamazsa bedel öder. `all` ise okuyucu ödeyenleri listeden işaretler. | judge |
| dare | Hedef yapar ya da bedel öder; `timer` varsa geri sayım. | judge |
| mostLikely | Herkes gizlice birini oylar (kendisi hariç). En çok oy alan öder, eşitlikte hepsi öder. | votePlayer |
| neverHave | Herkes gizlice Yaptım / Yapmadım der; "yaptım" diyenler öder. | yesNo |
| rule | Masaya kural konur. Herkesin ekranında "Yakala!" düğmesi çıkar. Suçlanan için masa 5 sn evet/hayır oylar; çoğunluk evet derse suçlanan öder. Yanlış suçlama yapan 1 öder. | catch |
| duel | Okuyucu iki kişi seçer. Masa (ikisi hariç) kazananı oylar. Kaybeden öder, kazanan +2. | votePlayer |
| mirror | Hedef gizlice seçer, diğerleri tahmin eder. Bilemeyenler öder; kimse bilemezse hedef öder. | choice |
| confession | Herkes anonim yazar (en fazla 80 karakter). Cevaplar karışık gösterilir, sunucu birini spot ışığına alır, masa yazarını tahmin eder. Çoğunluk bilirse yazar öder, bilemezse yanlış tahmin edenler öder. | text, sonra votePlayer |
| curse | Bir oyuncuya N turluk lanet. İhlal "Yakala!" ile bildirilir. | catch |
| minigame | `bomb`: bomba telefonlar arasında zıplar, dokunan rastgele birine atar, 8–20 sn sonra patlar, elinde patlayan öder. `reflex`: TIK'in bardağı rastgele 2–6 sn sonra dolar; en geç dokunan da erken dokunan da öder. `countdown`: herkes içinden 10 sn sayıp dokunur, 10'a en uzak kalan öder. Süre ölçümü sunucu zamanıyla yapılır, ağ gecikmesi her istemci için ölçülüp düzeltilir. | minigame |
| golden | Legendary; karta özel etki. | karta göre |
| tableEvent | Okuyucu seçmez, her 4 turda sistem araya sokar. | none / catch |

## 4. Modlar (desteler)

| Mod (`deck`) | İçerik | Vurgu rengi |
| --- | --- | --- |
| Klasik Masa (`classic`) | Tüm türler dengeli (varsayılan) | Mum sarısı #E8B04A |
| Kim Daha? (`who`) | %50 mostLikely, %20 neverHave | Zehir yeşili #A3E635 |
| İtiraf Gecesi (`confess`) | question, mirror, confession | Ay mavisi #7FB2E5 |
| Kaos (`chaos`) | rule, curse, minigame, tableEvent ağırlıklı | Kan kırmızısı #D7263D |
| Düello Ligi (`duel`) — v2 | duel + takım kartları | Mor #8E6CD8 |
| Ateşli 18+ (`spicy`) | flörtöz, yalnızca katılımı açık oyuncular | Gül kızılı #E0457B |
| Temiz (`clean`) | Aile/ofis, alkolsüz sabit | Nane #5ED6B4 |
| Memleket (`homeland`) | Karışım destesi, diğer modlara eklenir | Balkabağı #F28C28 |

Mod, kart havuzunu ve tür ağırlıklarını belirleyen bir ön ayardır (`src/engine/modes.ts`). Klasik, mod seçilmediğinde `classic` + `homeland` havuzunu kullanır.

## 5. Görsel dil: "Gece Yarısı Meyhanesi" (Tim Burton esintili gotik masal)

Bu bölüm tüm arayüz, kartlar ve oyun içi görseller için bağlayıcıdır. Tarz esinlenmedir: Burton'ın karakterleri, film sahneleri ya da isimleri hiçbir yerde kullanılmaz.

### Tarzın işaretleri

- İnce, uzun, çarpık uzuvlar; iri oyuk gözler; dikiş izleri.
- Her yerde spiraller; siyah-beyaz çizgili desenler.
- Eğik İstanbul ahşap evleri, kıvrık bacalar, eğri sokak lambaları, dev dolunay.
- Elle mürekkep çizgisi, tarama, kâğıt dokusu, vinyet.
- Soluk palet ve yalnızca ışık kaynağından gelen tek bir vurgu rengi.
- Sevimli ve ürkütücü arası kara mizah; kan ve vahşet yok.

### Token'lar (`src/client/styles/tokens.css`)

```css
--ink-950: #0D0B10;   /* ana arka plan */
--ink-800: #1B1820;   /* paneller, kart arkası */
--ash-500: #3A3640;   /* çizgiler, pasif */
--bone-100: #EDE6D6;  /* başlık, çizgili bant */
--parchment-200: #D9CFB8; /* kart metin paneli, birincil buton */
--gold-400: #D4AF37;  /* legendary, ödüller */
--accent: var(--deck-accent); /* aktif destenin rengi */
```

- Oran: ekranın %85'i ink/ash, %10'u bone/parchment, en fazla %5'i accent. Ekranda tek vurgu rengi bulunur.
- Renk tek başına anlam taşımaz; her zaman ikon ve metinle birlikte kullanılır.

### Tipografi

- Logo, başlık ve kart türü adı: **Grenze Gotisch**, en fazla 4 kelime.
- Kart metni ve tüm arayüz: **Alegreya Sans** 700/800. TIK'in yorumları italik.
- Fontlar Google Fonts'tan `latin-ext` alt kümesiyle, kendi sunucumuzdan (self-host) yüklenir.
- Kabul testi: "ĞÜŞİÖÇ ğüşıöç İstanbul" iki fontta da doğru çizilmeli.
- Boyutlar: kart metni telefonda 22–26 px, TV'de 48 px ve üstü; buton 18 px; en küçük metin 14 px.

### Kart bileşeni (`<GameCard>`, 5:7 dikey)

- Dış kenar: titrek, elle çizilmiş SVG mürekkep çizgisi. 3 path varyantı 8 fps'te sırayla değişir ("line boil"). Köşelerde küçük spiraller.
- Başlık bandı: siyah-beyaz çizgili şerit üzerinde türün adı (Grenze Gotisch); solda tür ikonu, sağda yoğunluk için 1–3 mum alevi.
- Görsel penceresi: kartın üst %55'i, sivri kemerli gotik pencere maskesi. Görsel 4:3 gelir ve kemere kırpılır.
- Metin paneli: parşömen zemin üzerine koyu mürekkep metin, HTML olarak (resim değil). Kontrast en az 7:1. Metin hiçbir zaman görselin üstüne binmez.
- Alt satır: solda sayılı bal mumu mührü (bedel), sağda hedef etiketi, altında TIK'in italik yorumu.
- Nadirlik: common düz mürekkep; rare köşelerde gümüş örümcek ağı ve yavaş parıltı; legendary eski altın çerçeve, titreyen mum ışığı, süzülen toz zerreleri.
- Kart arkası: kurum zemin, çizgili kenar, dolunay içinde TIK silueti, destenin vurgu renginde spiral.

### Ekranlar

- **Giriş**: logo, "Masa Kur", "Masaya Katıl" (kod girişi), tek satır sorumluluk notu.
- **Katılım**: isim, avatar ızgarası, yaş onayı, kişisel 18+ katılımı.
- **Lobi**: uzun, çarpık bir meyhane masası. Her katılan bir sandalyeye oturur, önünde mum yanar; host'un sandalyesi yüksek sırtlı. QR, link, ayarlar (yalnızca host), "Başlat" (en az 3 oyuncu).
- **Oyun (telefon)**:
  - Üst çubuk: eriyen mum olarak perde ilerlemesi, sıra şeridi (avatarlar), asma tabelalar olarak aktif kurallar ve lanetler, cep (güç kartları), sessiz düğmesi.
  - Orta: kart sahnesi.
  - Alt: bağlama göre tek birincil eylem.
- **Ana Ekran (`/tv/KOD`)**: büyük kart, masa sahnesi, skor ve katılım QR'ı. Telefonlar kumanda olur.
- **Gecenin Özeti**: ödüller, yerden yükselen komik mezar taşları olarak gelir ("Burada yatıyor: Gecenin Yalancısı Ayşe"). İstatistikler ve "Tekrar Oyna".
- Arka plan: katmanlı paralaks gece sahnesi (gökyüzü, eğik çatılar, ay), iki sis katmanı, 45–90 sn'de bir geçen yarasa ya da karga.

### Okunabilirlik

- Her ekranda tek birincil buton. Dokunma alanı en az 56 px.
- Efektler kart metin panelinin üstüne çıkmaz.
- `prefers-reduced-motion` ve oyun içi "Hareketi azalt" ayarı açıkken paralaks, titreme ve sarsıntı kapanır, geçişler fade olur.
- Gotik font cümlelerde kullanılmaz.

## 6. Efektler, animasyon, ses

İki ritim vardır. Dokunulan her şey 60 fps yaylarla tepki verir. Dekoratif her şey (mum, sis, TIK, kart kenarı) `steps()` ile 8–12 fps stop-motion ritmindedir.

| An | Efekt |
| --- | --- |
| Dağıtım | 3 kart tarot gibi yelpaze açar; 80 ms arayla, yay (stiffness 260, damping 22), ±6° eğim |
| Kartı tutma | Parmağa göre 3D eğim ±10°, mum ışığı yansıması parmağı izler |
| Seçim | 120 px yukarı kaydırma; kart `layoutId` ile ortaya uçar, diğerleri sise batar; miras kartı hayaletimsi bir çizgiyle sonraki avatara süzülür |
| Açılış | 600 ms 3D flip, ortasında mürekkep sıçraması. Rare: ağ parıltısı. Legendary: ekran kararır, altın huzmeler, toz, org akoru, 300 ms sarsıntı |
| Zamanlayıcı | Kartın etrafında eriyen mum; son 5 sn alev hızlanır, kalp atışı sesi |
| Oy | Avatardan seçilen kişiye küçük ruh dumanı süzülür; açılışta toplanır, sayı artar, kaybedene ay ışığı düşer |
| Bedel | Avatara sayılı bal mumu mührü basılır; kadeh (ya da çay bardağı) ikonu dolar |
| Kural | Zincire asılı tabela düşer, sallanarak üst çubuğa yerleşir |
| Yakala! | Tüm ekranlarda kırmızı fener yanıp söner, karga çığlığı, suçlanan titrer |
| Lanet | Avatar çevresinde dönen mor duman ve dikişli göz bandı |
| Düello | Ekran ikiye bölünür, ortada çatlayan şimşek |
| Bomba | Fitili yanan gotik bomba telefondan telefona zıplar, patlayınca yarasa konfetisi |
| Perde geçişi | Siyah-beyaz çizgili tiyatro perdesi kapanır, iplerle sarkan kukla TIK ve perde adı görünür, perde açılır |

- **Kütüphaneler**: `motion` (Motion for React) — yaylar, sürükleme, `layoutId`, `AnimatePresence`. Partiküller için tek, hafif bir canvas sistemi yaz: en fazla 150 partikül, sekme gizliyken durur.
- **Performans**: yalnızca `transform` ve `opacity` anime et. Mobilde `feTurbulence` gibi ağır filtreleri canlı çalıştırma.
  - Orta seviye Android'de 60 fps.
  - JS paketi 300 KB (gzip) altında.
  - Kart görseli WebP olarak 120 KB altında.
  - 4G'de ilk açılış 3 sn altında.
  - Görseller perde perde yüklenir; sıradaki elin görselleri önceden çekilir.
- **Ses**: Howler.js. İlk dokunuşta ses kilidi açılır.
  - Efektler: kâğıt hışırtısı, kart çevirme, mühür, kadeh tokuşturma (alkolsüzde çay kaşığı şıngırtısı), karga, org akoru, kalp atışı, fitil, patlama, perde.
  - Ortam müziği (müzik kutusu ve akordeon valsi) yalnızca Ana Ekran'da ya da host telefonunda çalar.
  - Lisansı belirsiz ses kullanma. Yalnızca CC0 kaynaklar; bulamazsan sesleri Web Audio ile sentezle.
- **Haptik**: `navigator.vibrate` yalnızca Android'de çalışır; iOS desteklemez, iOS'ta görsel sarsıntıya düş. Oyun başında Screen Wake Lock iste, `visibilitychange`'de yeniden iste.

## 7. Teknik mimari

### Yığın

React 19, Vite, TypeScript (strict), Tailwind CSS v4 (token'lar CSS değişkeni), Zustand, Motion, Howler. Sunucu: tek bir Cloudflare Worker ve oda başına bir **SQLite tabanlı Durable Object** (WebSocket Hibernation API). Statik dosyalar aynı Worker'dan Workers Static Assets ile sunulur. Tercihen `@cloudflare/vite-plugin` kullan. Test: Vitest ve Playwright.

### Klasör yapısı

```text
src/engine/   # saf TS: types.ts, reducer.ts, deck.ts, modes.ts, rng.ts, viewFor.ts, minigames.ts
src/server/   # worker.ts (yönlendirme), RoomDO.ts, bots.ts
src/client/   # main.tsx, screens/, components/GameCard/, fx/, audio/, store/, net/
content/cards/  # classic.json, who.json, chaos.json, clean.json, confess.json, homeland.json, spicy.json
assets-raw/     # Gemini'den gelen ham PNG'ler
public/art/     # WebP çıktılar + manifest.json
scripts/        # validate-cards.ts, convert-art.ts (sharp)
docs/           # GDD.md, DECISIONS.md
```

### Motor

- `reduce(state, intent, ctx) -> { state, fx[] }`: saf ve deterministik bir fonksiyon. `ctx` içinde `now` ve `rng` bulunur.
- `viewFor(state, playerId)`: oyuncuya özel görünümü üretir. Okuyucunun eli, oylar ve anonim cevaplar açılma anına kadar başkalarına gitmez. Ateşli katılım bilgisi hiçbir zaman gitmez.
- Fazlar: `lobby → actIntro → draw → choose → reveal → action → resolve → (tableEvent) → draw … → finale → summary`.
- Tüm zamanlayıcılar sunucuda Durable Object alarm'ıyla çalışır. İstemci saati kural belirlemez.

### Protokol (JSON, WebSocket `/api/room/:code`)

- İstemciden sunucuya: `join`, `updateSettings`, `start`, `playCard`, `pickTarget`, `vote`, `answer`, `judge`, `catch`, `usePower`, `pass`, `veto`, `minigameInput`, `quitDrinking`, `leave`, `ping`.
- Sunucudan istemciye: `snapshot { view, rev }`, `fx { kind, payload }`, `error { code, message }`, `pong { serverTime }`.
- Geçersiz niyet durumu değiştirmez ve `error` döner. Mesajları zod ile doğrula.

### Dayanıklılık

- `playerId` ve `secret` `localStorage`'da tutulur. Yeniden bağlanan aynı koltuğa döner ve tam snapshot alır.
- Her geçerli eylemden sonra durum DO deposuna yazılır.
- Okuyucu 30 sn yoksa otomatik seçim yapılır; 2 tur yoksa sırası atlanır.
- Host düşerse hostluk en eski bağlı oyuncuya geçer.
- 12 saat işlem görmeyen oda alarmla tamamen silinir.

### Tek başına test (çok önemli)

- `?bots=N` parametresiyle kurulan odaya N sunucu botu katılır. Botlar rastgele 1–4 sn gecikmeyle seçer, oylar, cevap yazar ve mini oyun oynar.
- `/dev/table` sayfası tek sekmede 4 telefon boyutunda iframe açar; her biri ayrı bir oyuncudur. Ben bu sayfayla oyunu tek başıma deneyeceğim.
- Motor için Vitest testleri:
  - Çekiliş kuralları.
  - Miras.
  - Her kart türünün çözümü.
  - Bedel ve alkolsüz dönüşüm.
  - Güç kartı zincirleri (Ayna'ya Kalkan).
  - Kural sınırları.
  - Kopma/yeniden bağlanma.
  - Host devri.
  - Tohumlu tekrar.
- Playwright: 4 tarayıcı bağlamıyla tam bir Kısa oyun uçtan uca oynanır. Ortam izin veriyorsa çalıştır, vermiyorsa nedenini raporla.

### Deploy

- Kod GitHub'daki bu repoda yaşar. Ben Cloudflare panelinde, tarayıcıdan, Workers & Pages → Import a repository ile bu repoyu bağlayacağım. Build komutu `npm run build`, deploy komutu `npx wrangler deploy`.
- `wrangler.jsonc`'yi buna hazır yaz: Durable Object binding'i, `new_sqlite_classes` migration'ı ve assets.
- Bana tıklama tıklama kurulum adımlarını M0 raporunda ver. Her push'ta otomatik deploy olur; dal önizlemelerini de kullan.

## 8. Görsel boru hattı

- Gemini görselleri gelene kadar oyunu **yer tutucu görsellerle** güzel göster. Kendi çizeceğin SVG'ler bu stilde olsun: mürekkep siluetler, dolunay, spiraller, eğik çatılar, tek vurgu ışığı. Asla gri kutu ya da emoji kullanma.
- Gemini görsellerini `assets-raw/` altına şu adlarla yükleyeceğim: `type-question-01.png`, `deck-chaos.png`, `avatar-03.png`, `bg-phone.png`, `bg-tv.png`, `card-back.png`, `tik-sheet.png`.
- `scripts/convert-art.ts` (sharp) bu dosyaları 800 px ve 400 px WebP'ye çevirsin, `public/art/manifest.json` dosyasını güncellesin.
- Kart, kendi `art` anahtarı yoksa türünün varyantlarından birini, id'ye göre deterministik olarak seçer.
- Görsellerin 4:3 olacağını varsay ve kemer maskesine `object-fit: cover` ile yerleştir. Odak noktası ortadır.

## 9. Güvenlik ve gizlilik

- Yaş onayı, kişisel ve gizli 18+/temas katılımı, Pas, anonim Veto, içki sınırı ve Su Molası zorunludur (bölüm 2).
- Kart doğrulama scripti yasak kalıpları kontrol eder: dışarı çıkma, araç, yiyecek dışı şey yeme, içki karıştırma, masa dışı kişiyi arama/mesaj, eşyaya zarar.
- Hesap, e-posta ve analitik yok. Yalnızca takma ad tutulur. Anonim cevaplar oda bitince silinir. Fotoğraf özelliği yok.
- Giriş ekranında tek satır not: "Alkollü mod 18 yaş üstü içindir. Sorumlu iç. Araba kullanacaksan alkolsüz oyna."
- WebSocket mesajlarına boyut sınırı (4 KB) ve oyuncu başına hız sınırı (saniyede 10 mesaj) koy.
- Kullanıcı metinlerini her yerde kaçışla (escape) göster.

## 10. Kart içeriği

- Yazım: emir kipi, "sen" dili, en fazla 110 karakter, Türkçe kara mizah. Mizah durumdan ve kişiden gelir; kimlik, görünüş, kilo, din ya da etnik köken üzerinden şaka yok.
- Her görev bir oturma odasında yapılabilir, güvenli ve geri alınabilir olmalı. Telefon görevlerinde oyuncu ne göstereceğini kendisi seçer.
- Hedef (M1 sonunda): classic ≥ 80, who ≥ 40, chaos ≥ 40, clean ≥ 40 kart. confess, homeland ve spicy ≥ 25'er kart (M3).
- Ekteki `cards.seed.json` 128 kart içerir; tonu ondan al. Ek yoksa örnekler:
  - question: "{secilen}, bu masadan birini ıssız adaya götürecek olsan kimi seçerdin, neden?"
  - dare: "{secilen}, masadaki herhangi bir eşyayı 20 saniyede reklam filmi gibi sat."
  - mostLikely: "Kim bir korku filminde \"Ben bakıp geleyim\" diyen kişidir?"
  - neverHave: "Hiç gece yarısı eski sevgilimin profiline bakmadım."
  - rule: "Kural: Kimse kimseye ismiyle seslenemez. Bozanı yakala!"
  - curse: "Lanet: {rastgele} 3 tur boyunca yalnızca soru cümlesiyle konuşabilir."
  - mirror: "{secilen} gizlice seçsin: Bu masada en çok kime güvenir?" (choices: $players)
  - confession: "Herkes anonim yazsın: Kimsenin bilmediği gizli yeteneğin."
  - minigame: "Bomba! Fitil yandı. Dokun, bombayı başkasına at. Elinde patlayan öder."
  - golden: "Sultan Kedi: Perde sonuna kadar istediğin an masaya bir kural koyabilirsin."
  - TIK yorumu örneği: "Masa mezar gibidir. Sessiz ama her şeyi saklar."

## 11. Kilometre taşları ve kabul kriterleri

**M0 — İskelet ve oda**

- Repo kurulumu, `wrangler.jsonc`, DO, WebSocket.
- Masa Kur / Katıl, QR, lobi, canlı çevrimiçi durumu, yeniden bağlanma, host devri.
- Botlar ve `/dev/table`.
- Token'lar ve fontlar; lobi masası sahnesinin ilk hali.
- Kabul: 4 iframe'li `/dev/table` ile odaya girilir, sayfa yenilenince aynı koltuğa dönülür, deploy adresi çalışır.

**M1 — Temel döngü**

- Motor; 4 tür (question, dare, mostLikely, neverHave); miras; bedel; alkollü/alkolsüz; Perde 1.
- `GameCard` bileşeni ve dağıtım/seçim/açılış animasyonları.
- Classic ve clean desteleri.
- Kabul: botlarla Kısa bir oyun baştan sona oynanır, motor testleri yeşil.

**M2 — Derinlik**

- rule, duel, mirror, confession, curse, golden, tableEvent; Yakala!.
- Güç kartları, Pas, Veto.
- Perde 2–3, perde geçişi, Gecenin Özeti, içki sınırı ve Su Molası.
- Kabul: her tür için en az bir test ve bir uçtan uca senaryo.

**M3 — Şov**

- Mini oyunlar (bomb, reflex, countdown) ve gecikme düzeltmesi.
- Ana Ekran modu; ses; tüm desteler.
- Görsel boru hattı ve manifest; rare/legendary efektleri.
- Kabul: Lighthouse mobil performans ≥ 85; orta seviye Android'de akıcı (Chrome DevTools 4x CPU throttle ile 50+ fps).

**M4 — Cila**

- Erişilebilirlik (odak sırası, `aria-live` duyuruları, kontrast).
- Hareketi azalt; PWA manifest ve ana ekrana ekleme.
- İçerik QA'sı; hata durumları ve boş durumlar; TIK'in kara mizah repliklerinden en az 40 tane.
- Kabul: 6 kişilik gerçek bir oyunda hiç kilitlenme olmaması (bu testi ben yapacağım).

## 12. Rapor formatı (her kilometre taşının sonunda, Türkçe)

1. **Ne yapıldı**: en fazla 6 madde.
2. **Nasıl denerim**: canlı link + `/dev/table` linki + 3 adımlık deneme senaryosu.
3. **Bilinen sorunlar**.
4. **Benden ne lazım**: Cloudflare adımları, görsel dosyaları ya da karar soruları.
5. **Sıradaki adım**.

## 13. İlk adım

Şimdi şunları yap:

1. Bu promptu `docs/GDD.md` olarak kaydet.
2. Ekteki `cards.seed.json` dosyasını `content/cards/` altına destelere böl ve şemayla doğrula.
3. M0 için kısa bir plan yaz ve uygulamaya başla.

Sorularını tek seferde, en fazla 3 tane olarak sor. Cevabımı beklemeden, varsayılanlarla ilerleyebileceğin işlere devam et.
