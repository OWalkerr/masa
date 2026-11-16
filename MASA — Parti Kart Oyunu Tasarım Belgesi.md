# MASA — Parti Kart Oyunu Tasarım Belgesi

Nov 16, 2026 · @Oğuzhan

## Özet

MASA, arkadaşların kendi telefonlarından link ya da 4 harfli kodla aynı odaya girdiği, sırası gelen kişinin 3 karttan birini seçip okuduğu, kalanların görevi yaptığı tarayıcı tabanlı bir parti kart oyunudur. Alkollü ve alkolsüz oynanır; aynı kartlar iki modda farklı bedel gösterir. Kurulum yok, hesap yok, oyun 20–60 dakikalık üç perdeden oluşur.

Hedef his: "Masada bir sunucu var ve gece giderek kızışıyor." Okuyan kişi hem seçen hem hakemdir; seçmediği kartlardan biri bir sonraki oyuncuya miras kalır, bu da her seçimi küçük bir strateji kararı yapar.

**Tasarım ilkeleri**

1. **Bir anda tek iş.** Her ekranda tek bir ana buton ve tek bir soru vardır; kural anlatımı 2 cümleyi geçmez.
2. **Telefon kumanda, masa sahne.** Herkes aynı kartı aynı anda görür; gizli bilgi (el, oy, anonim cevap) yalnızca ilgili telefona gider.
3. **Seçim her zaman oyuncuda.** Her kartın bir "yapmazsam" yolu (bedel) ve her oyuncunun pas ve veto hakkı vardır.
4. **Kademeli kızışma.** Isınma, Kızışma ve Kaos perdeleriyle yoğunluk kendiliğinden artar.
5. **Okunabilirlik süsten önce gelir.** Kart metni sanatın üstüne binmez, en az 20 px'tir, efektler metni asla örtmez.
6. **Yerel ve özgün.** Tim Burton esintili gotik masal çizimleri, çarpık İstanbul ahşap evleri, meyhane ve çay bahçesi kültürü, Türkçe kara mizah; maskot TIK alkollü modda kadeh, alkolsüz modda ince belli çay bardağıdır.

## Araştırma: referans oyunlar

Pazardaki en iyi örnekler ya tek telefondan okunuyor ya da kartı kişiye özel bilgiye bağlamıyor; MASA'nın boşluğu, Jackbox'ın "herkesin telefonu oyunda" modelini içme/cesaret kartlarıyla birleştirmek.

| Oyun | Ne yapıyor | MASA'ya çıkarım |
| --- | --- | --- |
| [Picolo](https://alittlebithuman.com/13-best-drinking-game-apps-for-your-phone-free-and-paid/) | İsimler girilir, tek telefondan kart kart ilerlenir; kurulum çok hızlı ama uzaktan oyun yok, herkes aynı odada tek cihaz | Hızlı başlangıcı koru (30 sn altında), ama her oyuncuya kendi telefonunu ver |
| [Jackbox](https://builtin.com/media-gaming/jackbox-games-design-party-pack) | Oda kodu + tarayıcı, uygulama yok; telefon kumanda, gizli rol telefona gider; "bir anda tek iş", az sayıda girdi türü | Oda kodu/QR ile katılım, kişiye özel görünüm, en fazla 6 girdi türü |
| [Truth or Drink (Cut)](https://cut.com/truth-or-drink-party-games) | 4 samimiyet seviyesi, her kartta 2 soru; okuyan uygun olanı seçer, cevaplamayan içer | Seçerek okuma + seviye sistemi; biz 3 kart verip seçilmeyeni miras yapıyoruz |
| [We're Not Really Strangers](https://mechanicsofmagic.com/?p=17265) | 3 seviye, seviye arttıkça sorular derinleşir ve mekanik hafifçe değişir; "Dig Deeper" joker kartı | Perde sistemi: her perdede hem yoğunluk hem yeni kart türleri açılır |
| TOZ ([karşılaştırma](https://toz-app.com/en/blog/drinking-games/picolo-vs-toz)) | 11 mod, ücretsiz; Picolo'nun 5 modu birkaç partiden sonra tekrar ediyor | İçerik derinliği kritik: ilk sürümde mod başına en az 80 kart, tekrar önleyici çekiliş |
| ["What Is Your Mood?"](https://apps.apple.com/us/app/-/id6751326191) | Türkçe, lobi kodu, 10 sn süreli kart seçimi ve canlı oylama | Yerelde lobi kodu alışılmış; süre sınırı + süre dolunca otomatik seçim iyi bir kalıp |

**Çıkarılan kurallar**

- Jackbox'ın üç ilkesi bizim için de geçerli: temposu koru, oyuncunun seçimine "farkındalıkla" tepki ver (maskot TIK'in yorumları), bu illüzyonu bozma.
- Başarı ölçüsü kazanmak değil kahkaha: puan var ama ödüller komik başlıklar ("Gecenin Yalancısı").
- Picolo'nun zayıf yanı güncellenmeyen içerik; kartları JSON'da tut, yeni deste eklemek kod gerektirmesin.
- Rakiplerde yok: seçilmeyen kartın bir sonrakine miras kalması, kalkan/ayna gibi cepte tutulan güç kartları, herkesin telefonunda "Yakala!" butonu, telefonlar arası dolaşan dijital bomba.

## Oyun döngüsü

Bir oyun 3 perde ve bir finalden oluşur; her tur aynı 6 adımı izler ve her adımda ekranda tek bir ana eylem vardır.

**Oda kurma ve lobi**

- Host "Masa Kur"a basar, 4 harfli kod alır (karışan harfler yok: I, O, Q, Ğ). Ekranda QR ve paylaşılabilir link çıkar.
- Oyuncular linkle ya da kodla girer, isim yazar, 12 avatardan birini seçer. Hesap ve kurulum yok.
- Lobide herkes çevrimiçi noktasıyla görünür. Ayarları yalnızca host değiştirir: mod, alkollü/alkolsüz, süre, yudum boyu, 18+.
- Alkollü mod ya da 18+ açıksa her oyuncu kendi telefonunda yaş onayı verir. Ateşli kartlara katılım kişiseldir ve gizli tutulur.
- En az 3, en çok 12 oyuncu. Oyun başladıktan sonra katılan, sıranın sonuna eklenir.

**Bir tur**

1. **Dağıtım.** Sıradaki oyuncu (Okuyucu) 3 kart alır, biri önceki turdan kalan miras karttır. Diğerleri ekranda kapalı kartları ve "Ayşe kart seçiyor" yazısını görür.
2. **Seçim (15 sn).** Okuyucu bir kartı yukarı kaydırarak oynar. Süre dolarsa en düşük yoğunluklu kart otomatik oynanır. Seçilmeyen kartlardan yoğunluğu en yüksek olan bir sonraki oyuncuya miras kalır, diğeri desteye döner.
3. **Açılış.** Kart tüm telefonlarda aynı anda döner. Okuyucu kartı yüksek sesle okur.
4. **Eylem.** Kart türüne göre herkesin telefonunda tek bir girdi açılır: oy, yaptım/yapmadım, cevap yazma, mini oyun ya da bekleme.
5. **Hüküm.** Okuyucu hakemdir: yaptı/yapmadı kararını verir. Öznel durumlarda masa oylar. Bedeller dağıtılır, yapanlara cesaret puanı yazılır.
6. **Geçiş.** Kısa skor flaşı, aktif kurallar ve lanetler güncellenir, sıra sağdakine geçer.

&#91;embedded content: tur döngüsü · 6 adım, 1 karar\]

Döngü Dağıtım'dan Hüküm'e kadar her turda aynıdır; yalnızca perde bitince Perde geçişi araya girer, üçüncü perdeden sonra oyun Final'e geçer.

**Perdeler ve olaylar**

- 1. Perde "Isınma": yalnızca yoğunluk 1; soru, görev, Kim Daha ve Hiç Yapmadım kartları.
- 2. Perde "Kızışma": yoğunluk 1–2; kural, düello, ayna ve itiraf açılır. Her 4 turda bir Masa Olayı çıkar.
- 3. Perde "Kaos": yoğunluk 2–3; lanet, mini oyunlar ve altın kart şansı artar.
- Perde uzunluğu süre ayarından gelir: Kısa 6, Normal 10, Uzun 14 tur (oyuncu sayısına göre en az 1 tam tur).
- Final "Son Kadeh" (alkolsüz modda "Son Çay"): herkesin aynı anda oynadığı tek kart, ardından Gecenin Özeti.

**Puan, bedel ve gece sonu**

- Cesaret puanı: görevi yapmak +1; daha yoğun kartı seçmek +1; düello kazanmak +2; altın kart +3.
- Bedel kartta birim olarak yazar (1–3). Alkollü modda birim "yudum", alkolsüz modda "ceza" olur ve 3 cezada bir Ceza Destesi'nden fiziksel mini ceza çekilir.
- Gecenin Özeti: komik ödüller (Gecenin Yalancısı, Korkusuz, Kaçak, Kuralların Kölesi), en çok bedel ödeyen, en çok oy alan ve tek tıkla "Tekrar Oyna".

## Modlar ve desteler

Mod, kart havuzunu ve kural ayarlarını seçen bir ön ayardır. Alkollü/alkolsüz anahtarı her modla birlikte çalışır; ilk sürümde Klasik Masa, Kim Daha?, Kaos ve Temiz hazır olur.

| Mod | Ne zaman | Kart karışımı | Vurgu rengi |
| --- | --- | --- | --- |
| Klasik Masa | Her gece, varsayılan | Tüm türler dengeli | Mum sarısı #E8B04A |
| Kim Daha? | Kalabalık, hızlı tempo | %50 oylama, %20 Hiç Yapmadım, kalan soru ve görev | Zehir yeşili #A3E635 |
| İtiraf Gecesi | Yakın arkadaşlar, sakin gece | Soru, ayna ve anonim itiraf; görev az | Ay mavisi #7FB2E5 |
| Kaos | Enerji yüksek, kısa süre | Kural, lanet, mini oyun ve masa olayı ağırlıklı | Kan kırmızısı #D7263D |
| Düello Ligi | 6+ kişi, rekabet | Düello ve takım kartları; masa iki takıma bölünür | Mor #8E6CD8 |
| Ateşli (18+) | Herkes tek tek onay verdiyse | Flörtöz soru ve cesaret; yalnızca katılımı açık oyuncuları hedefler | Gül kızılı #E0457B |
| Temiz (Aile / Ofis) | Bayram masası, iş yemeği | Fiziksel temas ve müstehcenlik yok; alkolsüz sabit | Nane #5ED6B4 |
| Memleket | Herhangi bir moda karıştırılır | Düğün, bayram, askerlik, dizi klişeleri, mahalle kültürü | Balkabağı #F28C28 |

**Genel ayarlar (yalnızca host)**

- Alkollü / Alkolsüz. Oyun içinde her oyuncu kendi telefonundan "Ben bıraktım" diyerek alkolsüz bedele geçebilir.
- Yudum boyu: Küçük yudum, Yudum (varsayılan), Shot. Shot varsayılan olarak kapalıdır ve en fazla 1 birimlik bedellere uygulanır.
- Süre: Kısa (\~20 dk), Normal (\~40 dk), Uzun (\~60 dk).
- 18+ kilidi: açılmadan Ateşli kartlar ve Memleket'in müstehcen kartları havuza girmez.
- Özel kartlar (2. sürüm): host oyun öncesi kendi kartlarını yazar, oda boyunca yaşar.

## Kart sistemi ve derinlik

Derinlik 4 katmandan gelir: 11 kart türü, 3 yoğunluk seviyesi, 3 nadirlik ve oyuncunun cebinde tuttuğu güç kartları. Okuyucunun 3 kart arasından seçimi ve miras kuralı her turu bir karara dönüştürür.

**Kart anatomisi (veri alanları)**

- `id`, `deck` (mod), `type`, `intensity` (1–3), `rarity` (common / rare / legendary)
- `text`: kart metni, en fazla 110 karakter. Jetonlar: `{okuyucu}`, `{secilen}`, `{sag}`, `{sol}`, `{rastgele}`, `{en_cok_bedel}`, `{en_az_bedel}`
- `target`: herkes, okuyucu, seçilen, iki seçilen, rastgele, sağdaki ya da soldaki
- `input`: none, judge, vote\_player, yes\_no, choice, text, minigame
- `penalty`: birim sayısı (1–3). Metin moda göre üretilir: "2 yudum" ya da "2 ceza"
- `duration`: kural ve lanetler için tur sayısı ya da "perde sonuna kadar"
- `tags`: fiziksel, temas, telefon, itiraf, flört, memleket, sessiz. Hedefleme ve filtreleme bu etiketlerle yapılır
- `quip`: maskot TIK'in kartın altındaki tek satırlık kara mizah yorumu (isteğe bağlı)
- `art`: görsel anahtarı. Yoksa türün varsayılan görseli kullanılır
- `choices`: Ayna kartları için 3–4 seçenek

**Kart türleri**

| Tür | Ne olur | Telefondaki girdi | Açıldığı perde |
| --- | --- | --- | --- |
| Soru | Okuyucunun seçtiği kişi ya da herkes sırayla cevaplar; cevaplamayan bedel öder | Okuyucu: hedef seç + hüküm | 1 |
| Görev | Hedef görevi yapar ya da bedel öder | Okuyucu: hüküm; süreliyse geri sayım | 1 |
| Kim Daha? | Herkes gizlice birini oylar, en çok oy alan öder; eşitlikte ikisi de öder | Oyuncu seç (kendisi hariç) | 1 |
| Hiç Yapmadım | Herkes gizlice Yaptım / Yapmadım der, yapanlar öder | Evet / Hayır | 1 |
| Kural | Masaya kural konur (en fazla 3 aktif); bozanı gören "Yakala!" der | Yakala butonu her ekranda | 2 |
| Düello | Okuyucu iki kişi seçer, masa kazananı oylar; kaybeden öder, kazanan +2 | Oyuncu seç | 2 |
| Ayna | Hedef 4 seçenekten birini gizlice seçer, diğerleri tahmin eder; bilemeyen öder, kimse bilemezse hedef öder | Çoktan seçmeli | 2 |
| İtiraf | Herkes anonim cevap yazar; cevaplar karışık gösterilir, biri spot ışığına alınır, masa yazarını tahmin eder | Metin, sonra oyuncu seç | 2 |
| Lanet | Bir oyuncuya 3 turluk lanet (örn. yalnızca soruyla konuşabilir); her ihlal 1 bedel | Yakala butonu | 3 |
| Mini Oyun | Bomba, Refleks ya da Tahmin; kaybeden öder | Oyuna özel dokunmatik ekran | 3 |
| Altın Kart | Efsane kart, büyük ödül ya da büyük kaos (örn. "Sultan: perde sonuna kadar kural koyarsın") | Karta özel | 2 |

Masa Olayı ayrı bir türdür: okuyucu seçmez, sistem her 4 turda bir araya sokar. Örnek: "Bu tur herkes sol eliyle içer" ya da "Sıra ters döndü".

**Yoğunluk seviyeleri**

- 1 Isınma: herkesin rahatça yapabileceği, utandırmayan, güldüren kartlar. Bedel 1.
- 2 Kızışma: hafif utandıran, kişisel ama zararsız kartlar. Bedel 1–2.
- 3 Kaos: cesur, kişisel, sahne gerektiren kartlar. Bedel 2–3, ama mutlaka kaçış yolu vardır.

**Nadirlik**

- Yaygın %80, Nadir %17, Efsane %3. Efsane kartlar 2. perdeden itibaren çıkar ve 3. perdede olasılıkları iki katına çıkar.
- Nadir kartlar gümüş örümcük ağı çerçeveyle, efsane kartlar eski altın çerçeve ve titreyen mum ışığıyla gelir.

**Güç kartları (Cep)**

Her 3 cesaret puanında bir güç kartı kazanılır. Cepte en fazla 2 kart durur ve uygun anda ekranda parlayan bir buton olarak görünür.

- Kalkan: kendine gelen bir bedeli iptal eder.
- Ayna: kendine gelen bedeli başka birine yansıtır. Hedef Kalkan'la karşılık verebilir.
- Takas: okuyucuyken elindeki 3 kartı yeniden çeker.
- Sabotaj: bir sonraki okuyucunun miras kartını sen seçersin.

**Pas ve veto**

- Her oyuncunun perde başına 1 Pas hakkı vardır. Kendisine gelen kartı bedelsiz geçer.
- Her oyuncunun oyun boyunca 1 anonim Vetosu vardır. Kart herkes için iptal olur ve kimin kullandığı gösterilmez. Rahatsız eden kart için tasarlanmıştır.

**Çekiliş kuralları**

1. Bir kart aynı oyunda iki kez çıkmaz. Havuz bitmek üzereyse aynı türden en eski kart geri döner.
2. Eldeki 3 kart en az 2 farklı türden olur; en az biri perdenin en düşük yoğunluğundadır.
3. Son 2 turda oynanan türün ağırlığı yarıya iner, böylece aynı tür üst üste gelmez.
4. Hedef seçimi adildir: rastgele hedeflerde, o ana kadar az hedef olan oyuncunun ağırlığı daha yüksektir.
5. Etiket filtresi: `temas` ve `flört` etiketli kartlar yalnızca katılımı açık oyuncuları hedefler. Yeterli oyuncu yoksa kart havuza girmez.
6. Aktif kural sayısı 3, oyuncu başına aktif lanet 1 ile sınırlıdır. Sınır doluysa o tür elde çıkmaz.

**Kart yazım kuralları**

- Emir kipi, "sen" dili, tek cümle tercih edilir, en fazla 110 karakter.
- Her görev bir oturma odasında yapılabilir, güvenli ve geri alınabilir olmalı. Sokak, yabancılar, araç kullanma, yiyecek dışı şey yeme ve içki karıştırma yasak.
- Masa dışındaki insanlara mesaj atma ya da arama yok. Telefon görevleri yalnızca masadakilerle olur ve oyuncu ne göstereceğini kendisi seçer.
- Kimlik, görünüş, kilo, din ya da etnik köken üzerinden şaka yok. Mizah durumdan ve kişiden gelir, gruptan değil.

## Görsel dil: "Gece Yarısı Meyhanesi"

Tüm oyun tek bir tarza bağlıdır: Tim Burton esintili gotik masal çizimi, stop-motion kukla hissi ve İstanbul gecesi. Kartlar, arka planlar, arayüz, avatarlar ve maskot aynı kurallardan çıkar. Tarz esinlenmedir: Burton'ın karakterleri, film sahneleri ya da isimleri kullanılmaz, bütün karakterler MASA'ya özgüdür.

**Tarzın 8 işareti**

1. İnce, uzun, çarpık uzuvlar; büyük kafa, dar gövde, sivri dizler ve dirsekler.
2. İri, oyuk, altı gölgeli gözler; küçük göz bebekleri; dikişli ya da ince çizgi ağızlar.
3. Spiraller her yerde: kıvrılan tepeler, duman, saç bukleleri, ağaç dalları, kart köşeleri.
4. Siyah-beyaz çizgili desenler: çoraplar, perdeler, kart başlık bantları.
5. Eğik, sallanan mimari: yan yana yaslanmış İstanbul ahşap evleri, kıvrık bacalar, eğri sokak lambaları, iri bir dolunay.
6. Elle mürekkep çizgisi, ince taramalar, kağıt ve hafif sulu boya dokusu, kenarlarda vinyet.
7. Soluk, neredeyse tek renkli palet ve tek bir vurgu rengi; vurgu her zaman bir ışık kaynağıdır (mum, fener, iksir, neon tabela).
8. Sevimli ve ürkütücü arası kara mizah: kemikli kediler, kafesteki baykuşlar, iskelet çalgıcılar, ama kan, yara ve vahşet yok.

**Renk**

| Token | Değer | Kullanım |
| --- | --- | --- |
| `ink-950` Gece siyahı | #0D0B10 | Ana arka plan |
| `ink-800` Kurum | #1B1820 | Paneller, kart arkası |
| `ash-500` Kül | #3A3640 | Çizgiler, pasif durum |
| `bone-100` Kemik | #EDE6D6 | Başlıklar, çizgili bantlar |
| `parchment-200` Parşömen | #D9CFB8 | Kart metin paneli, birincil buton |
| `accent` | Destenin rengi (Modlar tablosu) | Yalnızca ışık, seçim, aktif durum |
| `gold-400` Eski altın | #D4AF37 | Efsane kartlar, ödüller |

Oran kuralı: ekranın %85'i kurum ve kül tonları, %10'u kemik ve parşömen, en fazla %5'i vurgu. Ekranda aynı anda tek vurgu rengi bulunur. Renk tek başına anlam taşımaz, her zaman ikon ve yazıyla eşlenir.

**Tipografi**

- Logo, başlık ve kart türü: [Grenze Gotisch](https://fonts.google.com/specimen/Grenze+Gotisch) (gotik, latin-ext).
- Kart metni ve arayüz: [Alegreya Sans](https://fonts.google.com/specimen/Alegreya+Sans) 700/800. Masal kitabı havası verir ve telefonda çok okunaklıdır.
- TIK'in yorumları: Alegreya Sans italik.
- Kabul testi: "ĞÜŞİÖÇ ğüşıöç İstanbul" iki fontta da doğru çizilmeli; latin-ext alt kümesi yüklenmeli.
- Boyutlar: kart metni 22–26 px (telefon), 48 px+ (TV); buton 18 px; en küçük metin 14 px.

**Kart çerçevesi (5:7 dikey)**

- Dış kenar: hafif titrek, elle çizilmiş mürekkep çizgisi (SVG path), köşelerde küçük spiraller.
- Başlık bandı: siyah-beyaz çizgili şerit üzerinde tür adı (Grenze Gotisch), solda tür ikonu, sağda yoğunluk için 1–3 mum alevi.
- Görsel penceresi: kartın üst %55'i, üstü sivri kemerli gotik pencere şeklinde. Görsel 4:3 üretilir ve kemere kırpılır.
- Metin paneli: parşömen zemin üzerine koyu mürekkep metin. Metin hiçbir zaman görselin üstüne binmez; kontrast en az 7:1.
- Alt satır: solda bedel için sayılı bal mumu mührü, sağda hedef etiketi ("Herkes", "Seçilen"), altında TIK'in italik yorumu.
- Nadirlik: yaygın düz mürekkep; nadir köşelerde gümüş örümcek ağı ve yavaş parıltı; efsane eski altın çerçeve, titreyen mum ışığı ve havada süzülen toz zerreleri.
- Kart arkası: kurum zemin, çizgili kenar, ortada dolunay içinde TIK silueti ve destenin vurgu renginde bir spiral.

**Maskot: TIK**

Alkollü modda lale biçimli bir rakı kadehi, alkolsüz modda tabaklı ince belli bir çay bardağı. İnce çöp kolları ve bacakları, iri oyuk gözleri, dikişli bir gülümsemesi var. Oyunun sunucusudur: tur başlarında konuşma balonlarıyla kara mizah yorumları yapar. Boştayken 12 fps stop-motion titreşimiyle kıpırdar.

**Arayüz**

- Arka plan: katmanlı paralaks gece sahnesi. Gökyüzü, eğik İstanbul çatı siluetleri, dolunay, yerde sürünen sis ve arada bir uçan yarasa ya da karga.
- Lobi: uzun, çarpık bir meyhane masası. Her katılan oyuncu bir sandalyeye oturur, avatarının önünde mum yanar. Host'un sandalyesi yüksek sırtlıdır.
- Üst çubuk: perde ilerlemesi eriyen bir mumla gösterilir, yanında sıra şeridi ve aktif kurallar asma tabelalar olarak sallanır.
- Butonlar: titrek mürekkep kenarlı parşömen birincil buton, sadece çizgi ikincil buton. Basınca ezilip yaylanarak geri gelir, vurgu rengi ışık gibi yanar. Dokunma alanı en az 56 px.
- İkonlar: aynı kalınlıkta elle çizilmiş SVG seti (kadeh, çay bardağı, mum, kalkan, ayna, bomba, taç, kafatası-gül, kum saati).
- Avatarlar (12, 1:1): çöp bacaklı garson, iri gözlü sokak kedisi, simitçi, kahve falı bakan teyze, martı, balıkçı, iskelet kemencìi, uykusuz öğrenci, DJ vampir, kıvırcık saçlı şair, terzi, eski minibüs şoförü.

**Okunabilirlik kuralları**

- Bir ekranda tek birincil buton. Kart üzerinde en fazla 2 metin boyutu.
- Sis, parçacık ve ışık efektleri kart metin panelinin üstüne çıkmaz.
- Gotik font yalnızca 4 kelimeye kadar başlıklarda kullanılır. Cümleler her zaman Alegreya Sans ile yazılır.
- "Hareketi azalt" ayarı açıksa paralaks, titreme ve sarsıntı kapanır, geçişler fade olur.

## Efektler, animasyon, ses ve haptik

Hareket iki ritimde çalışır. Dokunulan her şey 60 fps yumuşak yaylarla tepki verir. Dekoratif her şey (mum, sis, maskot, kart kenarı) 8–12 fps kesik stop-motion ritmindedir. Burton hissini bu kontrast verir.

**Anlar ve efektleri**

| An | Efekt | Süre |
| --- | --- | --- |
| Kart dağıtımı | 3 kart desteden tarot gibi yelpaze açar; 80 ms arayla, yay (stiffness 260, damping 22), ±6° rastgele eğim; kağıt hışırtısı | 600 ms |
| Kartı tutma | Parmağa göre 3D eğim (±10°), mum ışığı yansıması parmağı izler, kart hafifçe kalkar | Sürekli |
| Seçim | 120 px yukarı kaydırma ya da dokun + "Oyna"; kart ortaya uçar (paylaşılan layout), diğerleri sise batar; miras kartı hayaletimsi bir çizgiyle sonraki oyuncunun avatarına süzülür | 500 ms |
| Açılış (tüm telefonlar) | 3D dönme, ortasında mürekkep sıçraması. Nadir: örümcek ağı parıltısı kartı tarar. Efsane: ekran kararır, altın ışık huzmeleri, toz zerreleri, org akoru, 300 ms hafif sarsıntı | 600–1400 ms |
| Zamanlayıcı | Kartın etrafında eriyen mum ve damlayan bal mumu; son 5 sn alev hızlı titrer, kalp atışı sesi | Karta göre |
| Oy verme | Oyuncunun avatarından seçtiği kişiye küçük bir ruh dumanı süzülür. Açılışta dumanlar toplanır, sayı sayarak artar, kaybedene ay ışığı düşer | 1200 ms |
| Hiç Yapmadım sonucu | Tüm avatarlar aynı anda kart çevirir; "yaptım" diyenler vurgu renginde yanar | 800 ms |
| Bedel | Avatarın üstüne sayılı bal mumu mührü basar. Kadeh ikonu sıvıyla dolar (alkolsüzde çay bardağı dolar, buhar çıkar) | 700 ms |
| Kural konunca | Zincire asılı bir tabela yukarıdan düşer, sallanarak üst çubuğa yerleşir | 900 ms |
| Yakala! | Tüm ekranlarda kırmızı fener yanıp söner, karga çığlığı, suçlananın avatarı titrer; masa 5 sn evet/hayır oylar | 5 sn |
| Lanet | Lanetlinin avatarının etrafında mor duman döner, avatarına dikişli bir göz bandı eklenir | Süre boyunca |
| Düello | Ekran ikiye bölünür, iki avatar karşı karşıya, ortada çatlayan şimşek | 800 ms |
| Bomba (mini oyun) | Fitili yanan gotik bomba telefondan telefona zıplar; dokunan pas geçer. 8–20 sn sonra elinde patlayanın ekranında yarasa konfetisi | 8–20 sn |
| Perde geçişi | Siyah-beyaz çizgili tiyatro perdesi kapanır, perde adı ve iplerle sarkıtılmış kukla TIK görünür, perde açılır; müzik kutusu melodisi | 2,5 sn |
| Gecenin Özeti | Ödüller yerden yükselen komik mezar taşları olarak gelir: "Burada yatıyor: Gecenin Yalancısı Ayşe" | Taş başına 1,2 sn |

**Ortam katmanı**

- Farklı hızlarda kayan 2 sis katmanı (opaklık 0,15–0,3), 8 fps titreyen mumlar, 45–90 sn'de bir geçen yarasa ya da karga.
- "Line boil": kart kenarı ve logo için 3 farklı elle çizilmiş SVG çizgisi 8 fps'te sırayla değişir, çizim kaynar gibi görünür. Yalnızca kenarlarda kullanılır.
- Maskot TIK boştayken 12 fps kesik titreşimle kıpırdar, ara sıra göz kırpar.

**Teknik ve performans**

- [Motion for React](https://motion.dev/examples/react-app-store): yaylar, sürükleme, paylaşılan layout geçişleri (`layoutId`), `AnimatePresence`.
- CSS keyframes `steps()` ile stop-motion döngüleri. Parçacıklar için tek bir hafif canvas sistemi: en fazla 150 parçacık, sekme gizliyken durur.
- Yalnızca `transform` ve `opacity` anime edilir. Mobilde ağır SVG filtreleri (`feTurbulence`) canlı çalıştırılmaz, önceden çizilmiş varyantlar kullanılır.
- Bütçe: orta seviye Android'de 60 fps; JS paketi 300 KB (gzip) altı; kart görseli WebP 120 KB altı; 4G'de ilk açılış 3 sn altında. Görseller perde perde yüklenir, sıradaki elin görselleri önceden çekilir.
- `prefers-reduced-motion` ve oyun içi "Hareketi azalt" ayarı desteklenir.

**Ses**

- Howler.js; ilk dokunuşta ses kilidi açılır (iOS kuralı).
- Efekt seti: kağıt hışırtısı, kart çevirme, mühür, kadeh tokuşturma (alkolsüzde çay kaşığı şıngırtısı), karga, org akoru, kalp atışı, fitil, patlama, perde.
- Ortam müziği: düşük sesli müzik kutusu ve akordeon valsi döngüsü. Yalnızca TV ekranında ya da host telefonunda çalar.
- Telefonlar yalnızca kendi eylemlerinin ve açılışların efektlerini çalar. Her ekranda sessiz düğmesi vardır.
- Kaynak: CC0 lisanslı ses paketleri ya da yapay zekâ ile üretilmiş sesler. Lisansı belirsiz ses kullanılmaz.

**Haptik ve ekran**

- Titreşim yalnızca Android'de çalışır: [iOS hiçbir tarayıcıda Vibration API'yi desteklemiyor](https://www.mintlify.com/lochie/web-haptics/advanced/browser-support). iOS'ta titreşimin yerini görsel sarsıntı ve ses alır.
- Oyun başlayınca Screen Wake Lock istenir, sekmeye dönüldüğünde yeniden istenir. [iOS Safari 16.4'ten beri destekliyor](https://firt.dev/notes/pwa-ios/), ana ekrana eklenmiş sürümde 18.4'ten beri.

## Gemini görsel üretim rehberi

Tutarlılığın anahtarı 3 sabit parçadır. Her görselde aynı Stil Kilidi metni kullanılır, aynı iki referans görsel eklenir (stil çapası ve TIK karakter sayfası) ve yalnızca sahne cümlesi değişir. Promptlarda sanatçı adı geçmez; tarzın özellikleri tarif edilir. Böylece sonuç özgün kalır ve bilinen karakterlere kaymaz.

**Model ve ayarlar**

- Son görseller için Nano Banana Pro (Gemini 3 Pro Image), hızlı denemeler için Nano Banana 2 kullanılır. [Bir sahnede en fazla 14 referans görsel eklenebilir](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana) ve her referansa prompt içinde bir görev verilmelidir ("stil için", "karakter için").
- Google'ın önerdiği yapı: özne + eylem + mekân + kompozisyon + stil, anlatı cümlesi olarak. İstenmeyeni değil isteneni yaz: "yazı olmasın" yerine "wordless image, blank signs".
- En-boy oranı: kart görseli 4:3, kart arkası 3:4, avatar 1:1, telefon arka planı 9:16, TV arka planı 16:9, karakter sayfası 16:9.
- Çözünürlük: 2K üret. Kod tarafında 800 px ve 400 px WebP'ye küçültülür.
- Gemini görselleri görünmez bir SynthID filigranı taşır; oyunda kullanımı etkilemez.

**Üretim sırası**

1. **Stil çapası.** Stil Kilidi ve "a crooked candle-lit meyhane table at midnight" sahnesiyle 4 deneme yap. En iyisini `style-anchor.png` olarak kaydet; bundan sonraki her görsele referans olarak ekle.
2. **TIK karakter sayfası.** Önden, üç çeyrek ve yandan pozlar; kadeh ve çay bardağı versiyonları. `tik-sheet.png` olarak kaydet.
3. **Tip görselleri.** 11 kart türü için 2'şer varyant (22 görsel).
4. **Deste kapakları, kart arkası, 12 avatar, 2 arka plan.**
5. **Özel kart görselleri.** Efsane kartlar ve vitrin kartları için tek tek.

MVP için toplam yaklaşık 45 görsel yeterli. Görseli olmayan kart, türünün varyantını kullanır.

**Stil Kilidi (her prompta aynen yapıştır)**

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of {ACCENT} that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only when TIK appears.
SCENE: {SAHNE}
FORMAT: {ORAN}
```

`{ACCENT}` yerine destenin rengi yazılır. Örnek: "candle amber #E8B04A", "poison green #A3E635", "blood red #D7263D", "mint #5ED6B4". `{ORAN}` yerine "4:3 landscape" gibi oran yazılır.

**TIK karakter sayfası**

```text
SCENE: Character turnaround sheet of TIK, the host mascot of a party card game: a small anthropomorphic tulip-shaped raki glass with stick-thin arms and legs, white gloves, huge round hollow eyes, a stitched grin and a tiny bow tie. Show front, three-quarter and side views, plus a second version where TIK is a slim tulip-waisted Turkish tea glass on a small saucer with a curl of steam. Neutral dark background, evenly spaced poses.
FORMAT: 16:9 landscape
```

**Kart türü sahneleri (4:3)**

| Tür | Sahne cümlesi (`{SAHNE}`) |
| --- | --- |
| Soru | A spindly waiter with hollow eyes leans over a crooked meyhane table holding a single candle up to a nervous guest's face, other guests peeking from the shadows. |
| Görev | A lanky performer in striped stockings balances on one leg on a wobbly stool stacked on mezze plates, friends gasping with hands over their mouths. |
| Kim Daha? | Long ghostly pointing hands rise from the fog, all pointing at one startled figure standing in a moonbeam. |
| Hiç Yapmadım | A row of guests hide behind enormous fans, one guilty face slowly peeking out, a candle glowing between them. |
| Kural | A heavy blank tavern sign hangs on rusty chains and swings above the table, a lantern glowing beneath it. |
| Düello | Two skinny rivals face each other across the table holding tea glasses like dueling pistols, crows watching from the beam above. |
| Ayna | An ornate oval mirror on a crooked wall reflects a grinning, mischievous version of the guest standing in front of it. |
| İtiraf | A guest whispers into the window of a tiny leaning wooden Istanbul house; a curl of glowing smoke escapes from the chimney. |
| Lanet | A tiny storm cloud with a crooked face follows a startled guest down a cobblestone street, drizzling on only them. |
| Mini Oyun | A round black bomb with a sparking fuse hops between trembling white-gloved hands around the table. |
| Altın Kart | A grinning street cat wearing a tall crooked crown lounges on a velvet cushion, golden glow and floating dust motes around it. |
| Masa Olayı | The whole crooked table tilts like a ship as plates, glasses and guests slide, the full moon laughing in the window. |

İkinci varyant için aynı sahne kamera açısı değiştirilerek istenir: "same scene from a low angle" ya da "same scene, close-up on the main character".

**Deste kapakları, kart arkası, arka plan**

- Klasik Masa (4:3): A very long crooked meyhane table under a full moon, empty chairs of different heights waiting, dozens of candles glowing amber.
- Kim Daha? (4:3): Silhouettes of friends on a rooftop all pointing at each other in a spiral, green lantern light.
- Kaos (4:3): A crooked stone tower twisting into a spiral during a storm, tables and chairs flying around it, red lightning.
- Temiz (4:3): A quiet tea garden under a twisted moonlit tree, tea glasses glowing mint on small tables, sleepy cats.
- Kart arkası (3:4): Symmetrical card back design, TIK's silhouette inside a full moon, spiral ornaments and a black-and-white striped border, dark background.
- Telefon arka planı (9:16): Night skyline of crooked leaning Istanbul wooden houses climbing a hill, a giant moon, low fog at the bottom third, empty dark sky in the top half for UI.
- TV arka planı (16:9): Wide view of the same skyline with a long empty table in the foreground, empty center area for cards.

**Avatar şablonu (1:1)**

```text
SCENE: Bust portrait avatar of {KARAKTER}, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

`{KARAKTER}` örnekleri: "a spindly old meyhane waiter with a towel on his arm", "a huge-eyed Istanbul street cat with a torn ear", "a simit seller balancing a tray of simit on his head", "an aunt reading coffee grounds in a tiny cup", "a seagull wearing a fisherman's cap", "a skeleton playing a kemençe", "a sleepless student with an enormous scarf", "a vampire DJ with headphones", "a curly-haired poet holding a quill", "a tailor with pins in her mouth", "an old minibus driver twirling worry beads", "a fisherman with a lantern".

**Kontrol listesi (her görsel için)**

- [ ] 200 px boyutunda bile silueti okunuyor.
- [ ] Vurgu rengi yalnızca ışık kaynağından geliyor, görselin %10'unu geçmiyor.
- [ ] Görselde yazı, harf ya da logo yok.
- [ ] Bilinen bir film ya da çizgi film karakterine benzemiyor.
- [ ] Çizgi kalınlığı, doku ve kamera mesafesi stil çapasıyla aynı.
- [ ] Dosya adı kurala uygun: `type-soru-01.png`, `deck-kaos.png`, `avatar-03.png`, `bg-phone.png`, `tik-sheet.png`.

**Oyuna aktarma**

Görseller GitHub'daki `assets-raw/` klasörüne tarayıcıdan sürükle-bırak ile yüklenir. Code oturumu bunları bir script ile 800 px ve 400 px WebP'ye çevirir, `public/art/` klasörüne koyar ve görsel manifestini günceller.

## Teknik mimari

Oda başına bir Cloudflare Durable Object, oyunun tek doğru kaynağıdır. Telefonlar yalnızca niyet gönderir, sunucu kuralları uygular ve her oyuncuya kendi görmesi gereken kadarını yollar. Her şey tek bir Worker olarak, GitHub'a her push'ta otomatik deploy edilir. Bilgisayara hiçbir şey kurmak gerekmez.

&#91;embedded content: mimari · istemciler, Worker, oda başına Durable Object, deploy\]

Telefonlar ve TV aynı Worker üzerinden oda koduna göre doğru Durable Object'e bağlanır; kurallar, süreler ve gizli bilgi yalnızca orada yaşar.

**Yığın**

| Katman | Seçim | Neden |
| --- | --- | --- |
| İstemci | React 19 + Vite + TypeScript | Hızlı geliştirme, tek sayfa uygulama |
| Animasyon | Motion for React + CSS `steps()` + küçük canvas parçacık sistemi | Yay, sürükleme, paylaşılan layout geçişleri |
| Stil | Tailwind CSS v4 + CSS değişkenleriyle tasarım token'ları | Token'lar tek yerde |
| İstemci durumu | Zustand | Sunucu görüntüsü + yerel UI durumu |
| Ses | Howler.js | iOS ses kilidi, sprite desteği |
| Sunucu | Cloudflare Worker + oda başına SQLite tabanlı Durable Object, WebSocket Hibernation | [Durable Objects ücretsiz planda var](https://developers.cloudflare.com/changelog/2025-04-07-durable-objects-free-tier); oda durumu sunucuda yaşar |
| Ortak mantık | `src/engine`: saf TypeScript reducer, hem sunucuda hem testlerde çalışır | Kurallar tek yerde, test edilebilir |
| İçerik | `content/cards/*.json` + zod şeması | Kart eklemek kod gerektirmez |
| Deploy | GitHub repo + [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds) | Panelden bir kez bağlanır, her push'ta otomatik deploy |
| Test | Vitest (motor), Playwright (çoklu istemci), sunucu tarafı botlar | Tek kişi tarayıcıdan test edebilir |

Alternatif olarak düşünülen Supabase Realtime'da durum istemciler arasında yayılır ve gizli bilgi (el, oy) korumak zorlaşır. Bir tarayıcı parti oyunu geliştiricisi, her şeyi broadcast ettiği için [10 günde yaklaşık 50 milyon mesaja ulaştığını ve kotayı %1000 aştığını](https://dev.to/yitao/nextjs-15-supabase-i-accidentally-blew-past-my-quota-by-1000-and-how-local-first-saved-it-1leh) anlatıyor. Sunucu otoriteli oda modeli bu riski taşımaz.

**Klasör yapısı**

```text
masa/
  src/engine/      # saf oyun mantığı: types, reducer, deck, selectors, viewFor
  src/server/      # Worker girişi + RoomDO (Durable Object), bot oyuncular
  src/client/      # React uygulaması: screens/, components/, fx/, audio/, store/
  content/cards/   # klasik.json, kimdaha.json, kaos.json, temiz.json ...
  assets-raw/      # Gemini'den gelen ham PNG'ler
  public/art/      # çevrilmiş WebP'ler + manifest.json
  scripts/         # görsel dönüştürme, kart doğrulama
  docs/GDD.md      # bu belgenin özeti, karar kaydı
  wrangler.jsonc
```

**Durum makinesi (faz)**

`lobby` → `actIntro` → `draw` → `reveal` → `action` → `resolve` → (her 4 turda `tableEvent`) → `draw` … → son perdeden sonra `finale` → `summary`. Zamanlayıcılar sunucuda Durable Object alarmıyla yönetilir. İstemci saati hiçbir zaman kural belirlemez.

**Mesaj protokolü**

- İstemciden sunucuya (niyet): `join`, `updateSettings` (yalnızca host), `start`, `playCard`, `pickTarget`, `vote`, `answer`, `judge`, `catch` (Yakala), `usePower`, `pass`, `veto`, `minigameInput`, `leave`.
- Sunucudan istemciye: `snapshot` (o oyuncuya özel görünüm + `rev` numarası) ve `fx` (animasyon tetikleyici olay: `cardRevealed`, `penaltyApplied`, `ruleAdded`, `caught` …).
- Her niyet sunucuda reducer'dan geçer. Geçersizse `error` döner ve durum değişmez.
- `viewFor(playerId)`: okuyucunun eli, verilen oylar ve anonim cevaplar yalnızca açılma anına kadar gizli tutulur.

**Kopma ve yeniden bağlanma**

- Oyuncu kimliği ve gizli anahtarı `localStorage`'da tutulur. Sayfa yenilense de aynı koltuğa dönülür.
- Her geçerli eylemden sonra durum Durable Object'in SQLite deposuna yazılır. Yeniden bağlanan oyuncu tam snapshot alır.
- Okuyucu 30 sn yoksa en düşük yoğunluklu kart otomatik oynanır. 2 tur yoksa sırası atlanır.
- Host düşerse hostluk en eski bağlı oyuncuya geçer.
- Oda 12 saat işlem görmezse alarm tüm verisini siler.

**Tek başına test (şirket bilgisayarından yalnızca tarayıcıyla)**

- `?bots=5` parametresiyle kurulan odaya 5 sunucu botu katılır. Botlar rastgele gecikmeyle seçer, oylar ve cevap verir.
- `/dev/table` sayfası tek sekmede 4 telefon çerçevesini yan yana açar; her çerçeve ayrı bir oyuncudur.
- Her push'tan sonra Workers Builds, dal için önizleme adresi verir. Ana dal canlı adrestir.

**Deploy kurulumu (bir kez, tarayıcıdan)**

1. GitHub'da `masa` reposu (Code oturumu oluşturabilir).
2. Cloudflare hesabı aç, Workers & Pages → Create → Import a repository → `masa` reposunu seç.
3. Build komutu `npm run build`, deploy komutu `npx wrangler deploy` olarak bırakılır.
4. Adres `masa.<hesap>.workers.dev` olur. Arkadaşlar bu linkle girer; hesap gerekmez.

## Güvenlik ve sorumluluk

Oyun eğlenceyi artırır ama kimseyi içmeye, utanmaya ya da istemediği bir şeye zorlamaz. Bu kurallar tasarımın parçasıdır, sonradan eklenen bir uyarı değildir.

- **Yaş onayı.** Alkollü mod ya da 18+ açıksa her oyuncu kendi telefonunda "18 yaşından büyüğüm" onayı verir. Onay vermeyen otomatik alkolsüz ve 18+ dışı oynar.
- **Kişisel katılım.** Ateşli ve temas kartlarına katılım her oyuncu için ayrı ve gizlidir. Bu kartlar yalnızca katılımı açık oyuncuları hedefler; kimin kapalı olduğu masaya gösterilmez.
- **Kaçış her zaman var.** Her kartın bedeli, her oyuncunun perde başına 1 Pas'ı ve oyun boyunca 1 anonim Vetosu vardır.
- **İçki kontrolü.** Varsayılan birim yudumdur. Shot kapalı gelir. Bir oyuncu 1 saatte 12 birimi geçerse bedelleri otomatik alkolsüze döner ve ekranına "Su Molası" kartı düşer. Her 8 turda bir tüm masaya Su Molası gelir. "Ben bıraktım" düğmesi her an çalışır.
- **Güvenli görevler.** Oturma odası dışına çıkma, araç kullanma, yiyecek dışı şey yeme, içki karıştırma, eşyaya zarar verme ve masa dışındaki kişilerle iletişim içeren görev yoktur. Kart doğrulama scripti yasak kelime listesiyle bunu kontrol eder.
- **Gizlilik.** Hesap yok, e-posta yok, analitik yok. Yalnızca takma ad saklanır. Anonim cevaplar oda bitince silinir, oda verisi 12 saat sonra tamamen silinir. Fotoğraf kanıtı özelliği 1. sürümde yoktur.
- **Yasal not.** Giriş ekranında tek satır: "Alkollü mod 18 yaş üstü içindir. Sorumlu iç. Araba kullanacaksan alkolsüz oyna."

## Code oturumu için master prompt

Aşağıdaki prompt kendi başına yeterlidir; oyunun tüm kurallarını, görsel dili ve teknik kararları içerir. Aynısı sohbette `PROMPT.md` dosyası olarak da gönderildi; 128 kartlık `cards.seed.json` ve 49 hazır Gemini promptu içeren `GEMINI_PROMPTS.md` de yanında.

**Başlamadan önce (5 dakika, hepsi tarayıcıdan)**

1. GitHub'da `masa` adında boş bir repo aç (README ile).
2. Claude'un Code sekmesinde bu repoyla yeni oturum başlat.
3. `cards.seed.json` dosyasını repoya yükle (GitHub'da Add file, sonra Upload files) ya da oturuma ekle.
4. Aşağıdaki promptu yapıştır ve gönder.
5. M0 bitince oturum sana Cloudflare bağlantı adımlarını verecek; Cloudflare panelinden repoyu bir kez bağla.

````markdown
# MASA — Code Oturumu Ana Promptu

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
````

## Örnek kart destesi

Seed destesi 7 destede 128 kart içerir: Klasik 52, Kim Daha? 16, Kaos 16, Temiz 15, Memleket 13, İtiraf 10, Ateşli 6. Tam liste `cards.seed.json` dosyasında; aşağıdaki 20 kart tonu ve tür çeşitliliğini gösterir. Bedel birimdir: alkollüde yudum, alkolsüzde ceza.

| Tür | Deste | Yoğ. | Kart metni | Bedel |
| --- | --- | --- | --- | --- |
| Soru | Klasik | 1 | {secilen}, bu masadan birini ıssız adaya götürecek olsan kimi seçerdin, neden? | 1 |
| Soru | Klasik | 3 | {secilen}, kimseye anlatmadığın utanç verici bir anını anlat. | 3 |
| Görev | Klasik | 1 | {secilen}, masadaki herhangi bir eşyayı 20 saniyede reklam filmi gibi sat. | 1 |
| Görev | Klasik | 3 | {secilen}, 1 dakika boyunca hiç gülmeden stand-up yap. Gülersen öde. | 3 |
| Görev | Temiz | 1 | {secilen}, 20 saniyede bir kaşığı alkış alacak şekilde tanıt. | 1 |
| Kim Daha? | Klasik | 1 | Kim bir zombi kıyametinde ilk elenir? | 1 |
| Kim Daha? | Kim Daha? | 1 | Kim bir korku filminde "Ben bakıp geleyim" diyen kişidir? | 1 |
| Hiç Yapmadım | Klasik | 2 | Hiç gece yarısı eski sevgilimin profiline bakmadım. | 1 |
| Hiç Yapmadım | Memleket | 1 | Hiç "Ben tokum" deyip sonra masada en çok yiyen olmadım. | 1 |
| Kural | Klasik | 2 | Kural: Kimse kimseye ismiyle seslenemez. Bozanı yakala! | 1 |
| Kural | Kaos | 3 | Kural: Okuyucu kartı okurken herkes gözlerini kapatır. Açanı yakala! | 1 |
| Düello | Klasik | 2 | Düello: {secilen} ve {ikinci} birbirine soru soruyor. İlk "evet" ya da "hayır" diyen kaybeder. | 2 |
| Ayna | Klasik | 2 | {secilen} gizlice seçsin: Bu masada en çok kime güvenir? | 2 |
| İtiraf | İtiraf | 2 | Herkes anonim yazsın: Hayatındaki en büyük "keşke". | 1 |
| Lanet | Klasik | 3 | Lanet: {rastgele} 3 tur boyunca yalnızca soru cümlesiyle konuşabilir. | 1 |
| Mini Oyun | Klasik | 3 | Bomba! Fitil yandı. Dokun, bombayı başkasına at. Elinde patlayan öder. | 2 |
| Mini Oyun | Klasik | 2 | İçinden 10 saniye say ve dokun. 10'a en uzak kalan öder. | 1 |
| Altın Kart | Klasik | 2 | Sultan Kedi: Perde sonuna kadar istediğin an masaya bir kural koyabilirsin. | 0 |
| Altın Kart | Memleket | 2 | Ağa Kartı: Perde sonuna kadar herkes sana "Ağam" diye seslenir. Unutanı yakala! | 1 |
| Masa Olayı | Klasik | 2 | Hayalet Saati: Sonraki 2 turda okuyucu kartları kapalı görür ve körlemesine seçer. | 0 |

TIK'in kart altı yorumlarından örnekler: "Masa mezar gibidir. Sessiz ama her şeyi saklar." · "Bakmaya gidenler hep bize gelir." · "Ben zaten hep doluyum."

## Kaynaklar

- [These Design Principles Made Jackbox a Party Game Phenomenon](https://builtin.com/media-gaming/jackbox-games-design-party-pack): Built In
- [13 Best Drinking Game Apps for Your Phone](https://alittlebithuman.com/13-best-drinking-game-apps-for-your-phone-free-and-paid/): A Little Bit Human
- [Picolo vs. TOZ](https://toz-app.com/en/blog/drinking-games/picolo-vs-toz): TOZ
- [Truth or Drink party games](https://cut.com/truth-or-drink-party-games): Cut
- [Critical Play: We're Not Really Strangers](https://mechanicsofmagic.com/?p=17265): Mechanics of Magic
- [What Is Your Mood?](https://apps.apple.com/us/app/-/id6751326191): App Store
- [Ultimate prompting guide for Nano Banana](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana): Google Cloud
- [Durable Objects on Workers Free plan](https://developers.cloudflare.com/changelog/2025-04-07-durable-objects-free-tier): Cloudflare
- [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing): Cloudflare
- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds): Cloudflare
- [Supabase quota story](https://dev.to/yitao/nextjs-15-supabase-i-accidentally-blew-past-my-quota-by-1000-and-how-local-first-saved-it-1leh): DEV Community
- [Motion for React examples](https://motion.dev/examples/react-app-store): Motion
- [Web haptics browser support](https://www.mintlify.com/lochie/web-haptics/advanced/browser-support): WebHaptics
- [iOS PWA compatibility](https://firt.dev/notes/pwa-ios/): firt.dev
- [Grenze Gotisch](https://fonts.google.com/specimen/Grenze+Gotisch) ve [Alegreya Sans](https://fonts.google.com/specimen/Alegreya+Sans): Google Fonts
