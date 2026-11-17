# Kararlar

Tarih biçimi: YYYY-AA-GG. Her karar kısa gerekçesiyle.

## 2026-11-16 — M0

1. **TypeScript 5.9 sabitlendi** (npm'deki son sürüm 7.0). TS 7 yerel (Go) derleyicidir; `tsc -b` proje referansları ve eklenti ekosistemiyle uyumunu henüz doğrulamadık. M4'te yeniden bakılacak.
2. **Fontlar `@fontsource` paketlerinden** geliyor. Dosyalar build'e kopyalanıp kendi alan adımızdan sunuluyor (self-host); yalnızca `latin` ve `latin-ext` alt kümeleri (ı `latin`, ğ ş İ `latin-ext` içinde).
3. **Oda kodu gotik fontla gösterilmiyor.** Grenze Gotisch'te T/Y/J harfleri birbirine karışıyor; kod bir veri olduğu için Alegreya Sans 800 kullanılıyor. Gotik font yalnızca logo ve başlıklarda.
4. **Protokole `resume`, `consent`, `profile`, `kick` mesajları eklendi.** `resume`: yeniden bağlanan aynı koltuğa döner (`join` yalnızca yeni koltuk açar). `consent`: yaş onayı ve 18+/temas katılımı sonradan da değişebilsin diye (host alkollü modu sonradan açabilir). `kick`: lobide host'un hayalet/bot koltukları kaldırabilmesi için.
5. **Host devri 10 sn bekleme ile yapılır.** Sayfa yenileyen host'un hostluğu hemen kaybetmemesi için. Host lobiden kendisi kalkarsa devir anında olur. Hostluk botlara geçmez.
6. **Botlar ilk insan oturduktan sonra gelir** (`?bots=N`). Böylece host her zaman insan olur.
7. **`{rastgele}` jetonu her hedefle kullanılabilir.** Seed'deki 4 dare kartı `picked` hedefiyle `{rastgele}` kullanıyor ("{secilen}, {rastgele} kişisinin taklidini yap"). Motor buraya okuyucu ve hedef dışından rastgele birini koyacak.
8. **Kaynak belgeler `docs/source/` altına taşındı.** `cards.seed.json` artık yalnızca referans; asıl kartlar `content/cards/<deste>.json`. `npm run split:seed` seed'i yeniden bölebilir, var olan kartları silmez.
9. **Shot ayarı:** yudum boyu varsayılanı `sip`; Shot seçeneği var ama varsayılan değil. Alkolsüze geçilince Shot otomatik Yudum'a döner. "Yalnızca 1 birimlik bedellere uygulanır" kuralı M1 bedel hesabında.
10. **Deste kuralları ayarda zorlanır:** Temiz → alkolsüz sabit; Ateşli → 18+ kilidi açılır; Düello Ligi v2'ye kadar seçilemez.
11. **Uçtan uca test `@playwright/test` yerine düz Playwright betiği** (`tests/e2e/*.e2e.mjs`). Ortamdaki önceden kurulu Playwright sürümüyle çakışma olmasın diye.
12. **Durum saklama:** Durable Object'te tek `game` anahtarı (SQLite tabanlı KV API). Oda durumu küçük; her geçerli eylemden sonra tamamı yazılır.
13. **Zamanlayıcılar motor durumunda tutulur** (`timers[]`); DO alarmı en yakın zamanlayıcıya kurulur ve `tick` niyeti gönderir. Böylece motor saf kalır, testlerde zaman elle ilerletilebilir.
14. **Yayın dalı `claude/masa-party-game-q7w7jz`.** Cloudflare Workers Builds production dalı bu dala ayarlandı; her push otomatik deploy olur. `main` yalnızca ilk yüklenen belgeleri içeriyor.

## 2026-11-16 — M1

15. **`draw` fazı ayrı bir sunucu fazı değil.** Dağıtım anında okuyucuya 3 kart verilip doğrudan `choose` fazına geçilir; dağıtım animasyonu için seçim süresine 1,4 sn eklenir (toplam 16,4 sn). Ağ trafiği ve zamanlayıcı sayısı azalır.
16. **Hassas kartlarda (flört/temas) hedefi sistem seçer.** Okuyucu aday listesini görse kimin 18+ katılımı açık olduğunu öğrenirdi; bu gizlilik kuralını bozar.
17. **Hüküm verilmezse kimse ödemez.** `judge` zaman aşımında "yaptı" sayılır; oylamada oy vermeyen yok sayılır; yesNo'da cevap vermeyen ödemez. Kuşkuda ceza yok.
18. **Kart kataloğu `import.meta.glob` ile yüklenir.** `content/cards/` altına yeni deste dosyası eklemek kod değişikliği gerektirmez. Kartlar istemci paketine girmez; oyuncu yalnızca kendine görünen kartları `snapshot` içinde alır.
19. **Perde tur sayısı** `max(süre ayarı, oyuncu sayısı)`: her perde en az bir tam tur sürer.
20. **M1'de çözümü yazılı türler:** question, dare, mostLikely, neverHave. Perde 2–3 de oynanır ama yalnızca bu türlerle (yoğunluk 1–2 ve 2–3). Diğer türler M2'de havuza girer.
21. **Ödüller (Gecenin Özeti) istemcide hesaplanır**; aynı oyuncu iki mezar taşı almaz. Final kartı ("Son Kadeh / Son Çay") M2'de.
22. **Bağlı insan kalmayınca masa bekler**: faz zamanlayıcısı 30 sn ertelenir, botlar boşuna tur döndürmez.
23. **Bot kararları sunucuda, motorun dışında** (`src/server/bots.ts`), ama saf fonksiyon; motor yalnızca "botun sırası geldi" sinyali verir. Testler aynı fonksiyonu kullanır.

## 2026-11-16 — M2

24. **Altın kartların ve masa olaylarının özel etkileri etiketle tanımlanır, kart id'siyle değil.** Kart yazarları yeni kart eklerken bu etiketleri kullanabilir:
    - `ferman` (altın): perde sonuna kadar bir kez kendi kuralını yazma hakkı (Sultan Kedi).
    - `cep` (altın): cebe bir Kalkan ve bir Ayna (Kemik Bilet).
    - `devir` (altın, `input: votePlayer`): okuyucunun son 3 bedeli seçtiği kişiye geçer (Mezardan Dönüş).
    - `yon` (olay): sıra yönü ters döner. `hayalet` (olay): sonraki 2 tur okuyucu kartları kapalı görür. `tutulma` (olay): en çok ödeyene Ayna.
    - Etiketsiz altın kartlar: `input: catch` → perde boyu kural; `input: judge` → okuyucu hükmü; `none` → yalnızca metin. Her altın kart okuyucuya +3 cesaret verir.
    - Etiketsiz masa olayı: `input: catch` → süreli kural; `none` + `penalty > 0` → herkes öder; aksi hâlde yalnızca metin (onur sistemi).
25. **Yakala! oylaması:** suçlayan ve suçlanan oy vermez. Verilen oyların yarısından fazlası "bozdu" derse suçlanan kuralın bedelini öder; aksi hâlde (eşitlik ya da hiç oy yoksa) suçlayan 1 öder. Aynı kişi 8 sn'de bir fener yakabilir. Aynı anda tek oylama.
26. **Kural sınırı:** en fazla 3 aktif kural (fermanlar ve olay kuralları dahil). Sınır doluyken kural kartı ele gelmez; ferman ya da olay gelirse en eski kural kalkar. Lanetler ayrı sayılır (oyuncu başına 1).
27. **Düelloda eşitlik:** iki düellocu da öder (hiç oy yoksa kimse ödemez).
28. **İtiraf:** en az 2 cevap gelmezse spot ışığı yanmaz, kimse ödemez. Spot ışığındaki cevabın yazarı tahminden muaftır, ekranında "Belli etme!" görür. Cevaplar tur sonunda durumdan silinir; yalnızca spot ışığındaki cevap o turun sonucunda kalır.
29. **Kalkan/Ayna bedel anında kullanılır:** cebinde Kalkan ya da Ayna olan bir ödeyen varsa sonuç ekranı 9 sn kalır. Ayna tutulan kişinin Kalkanı varsa süre 5 sn uzar.
30. **Pas:** kartın hedefi olan kullanabilir (herkese gelen kartlarda herkes). Kural, lanet ve altın kartlara pas geçilmez. **Veto** okuyucu dahil herkes, kart açıkken kullanabilir. Daha önce verilen cevaplar silinir ve kimin veto ettiği hiçbir mesajda yer almaz.
31. **Masa olayları okuyucu turu sayılmaz:** perde ilerlemesini ve sırayı değiştirmez. Her 8 turda bir Su Molası gelir (1. perde dahil). Aynı tura masa olayı da denk gelirse Su Molası öncelikli.
32. **Final kartı sistem kartıdır** (Son Kadeh / Son Çay). Kapanış sözünü en çok cesaret puanı olan söyler.
33. **Güç kartı kazanımı:** her 3 cesarette rastgele bir güç kartı. Cep doluysa o hak yanar, birikmez. Altın kart ve olaylarla gelen güçler cep doluysa en eskisinin yerine geçer.

## 2026-11-16 — M3

34. **Gecikme düzeltmesi:** istemci 4 sn'de bir ölçtüğü gidiş-dönüş süresini (RTT, yumuşatılmış) ping ile bildirir. Sunucu bunu sokette saklar ve mini oyun girdisine varış anını ve tek yön gecikmeyi (`lat = RTT/2`, en fazla 400 ms) kendisi ekler; istemci kendi saatini bildiremez. Dokunma anı `varış − lat`. Refleks ve geri sayımda işaretin istemciye varışı da `lat` sürdüğü için tepki `varış − 2·lat − işaret` olarak hesaplanır.
35. **Bomba:** patlama anı gizlidir (zamanlayıcı bitişi de istemciye gönderilmez). Patlamadan sonra 400 ms ağ payı beklenir. Bu payda gelen ama patlamadan önce yapılmış atışlar geçerlidir, sonradan yapılanlar reddedilir. `cift` etiketi iki bomba demektir (en az 3 oyuncu). Dokunan bombayı rastgele birine atar; elinde başka bomba olmayan biri tercih edilir.
36. **Refleks:** dolma anından önce dokunan "erken" sayılır ve öder; en geç dokunan da öder. Hiç dokunmayan en geç sayılır. Dolma işaretinden sonra 4 sn süre var.
37. **Geri sayım:** başlangıç işaretinden sonra 10 saniyeye en uzak kalan öder; 20 sn içinde dokunmayan en uzak sayılır.
38. **Sesler tamamen tarayıcıda sentezlenir** (dışarıdan ses dosyası yok, lisans sorunu yok). İlk dokunuşta OfflineAudioContext ile çizilip WAV'a çevrilir ve Howler ile çalınır. Ortam müziği (müzik kutusu + akordeon valsi, re minör, yaklaşık 20 sn'lik döngü) yalnızca Ana Ekran'da ve host telefonunda çalar. Sessiz tercihi cihazda saklanır.
39. **Partikül tuvali içeriğin arkasında, arka planın önündedir** (z-1). Böylece efektler kart metin panelinin üstüne çıkmaz. En fazla 150 partikül; sekme gizliyken ve "Hareketi azalt" açıkken çalışmaz.
40. **Ana Ekran izleyicidir:** hiçbir koltuğa oturmaz, kayıtlı koltuğa da dönmez (host aynı tarayıcıda TV'yi açsa bile). TV ve dev masası ayrı paketlerdir (lazy), telefonlar bunları indirmez.
41. **Görsel boru hattı:** `npm run convert:art` komutu `assets-raw/` içindekileri 800 ve 400 px WebP'ye çevirir; her biri 120 KB'yi geçmeyene kadar kalite düşürülür. `public/art/manifest.json` güncellenir. İstemci manifest'i bir kez çeker; görseli olmayan her şey SVG yer tutucuda kalır. `tik-sheet.png` için kare düzeni bilinmediğinden TIK şimdilik SVG; sprite düzeni belli olunca bağlanacak.

## 2026-11-16 — Oyun testi geri bildirimi (kullanıcının açık isteğiyle GDD'den sapmalar)

42. **Dil: "öder" yerine "içer".** Arayüzde ve kartlarda ceza her yerde "iç / içer" ya da alkolsüz masada "ceza al / ceza alır" olarak geçer. "Bedel" kelimesi oyuncunun gördüğü metinlerden çıktı (kod içinde `penalty`/`payment` kaldı).
43. **Rahat tempo (varsayılan).** GDD bölüm 2'deki faz süreleri (seçim 15 sn, oylama 30 sn, sonuç 5 sn…) yüz yüze oyunda sohbeti öldürüyordu. Lobiye "Tempo: Rahat / Süreli" ayarı eklendi, varsayılan Rahat.
    - Rahatta süre yalnızca geri sayımın oyunun parçası olduğu yerde var: mini oyunlar, perde perdesi ve kart açılış animasyonu, Yakala! oylaması. Kartlardaki `timer` (örneğin 60 sn stand-up) okuyucu ve hedefin telefonunda elle başlatılan geri sayım olarak kalır.
    - Kart seçimi, hedef seçimi, oylamalar, hüküm, sonuç ekranı, masa olayı ve final süresizdir. Sonuç ekranında yalnızca host'ta "Sonraki kart →" düğmesi çıkar.
    - Biri uyuyakalırsa host 20 sn sonra "Beklemeden geç / Okuyucu yerine kart oynat / Hükümsüz geç" diyebilir. Bu, sunucuda `advance` niyetidir ve faz zaman aşımıyla aynı yolu izler.
    - Host bağlı değilse masadaki herhangi bir insan ilerletebilir. Mini oyun ilerletilemez.
    - Süreli tempoda eski davranış aynen sürer; host yine erken geçebilir.
44. **Yakala! oylaması 5 sn'den 8 sn'ye çıktı.** Masada konuşarak karar verilebilsin.
45. **Yeni mekanik: Yalan Makinesi** (`mirror` + `yalan` etiketi, 3 seçenek). Hedef sesli olarak 2 doğru 1 yalan söyler, yalanı gizlice işaretler. Yalanı bulamayanlar içer. Herkes bulursa yalancı içer. Yutturursa +1 cesaret.
46. **Yeni mekanik: Ölçek** (`mirror` + `olcek` etiketi, `choices: "$scale"` → 1–10). Hedef gizlice puan verir, herkes tahmin eder. En uzak tahmin(ler) içer. Tam bilen çıkarsa hedef de içer. Sonuçta herkesin tahmini görünür.
47. **Yeni kart türü: Gizli Görev** (`mission`, `target: random`, `input: catch`, `secret` + `duration`). Sistem okuyucu dahil herkesten bir ajan seçer.
    - Ajan ve görev yalnızca ajanın telefonuna gider: kart hedefleri, jetonlar ve "hedef olma" istatistiği de ajanı ele vermez.
    - Ajan görevi yapınca "Görevi yaptım!" der. Görev herkese açılır, masa 12 sn oylar. Onaylarsa herkes içer ve ajan +2 cesaret alır, onaylamazsa ajan içer. Eşitlik ajanın lehine.
    - Diğerleri Yakala! ile ajan tahmin eder. Oylama yok, sunucu gerçeği bilir. Doğruysa ajan içer ve görev biter, yanlışsa suçlayan 1 içer.
    - Süre dolarsa ajan içer. Aynı anda tek görev olur, en az 3 oyuncu gerekir. Perde 2'den itibaren gelir.
48. **Yeni mekanik: Anlat Bakalım** (`dare` + `anlat` etiketi + `secret`). Gizli kelime "|" ile ayrılmış listeden oyun anında seçilir ve yalnızca anlatanın telefonuna gider (basılı tutunca görünür). Kartın listesi hiçbir istemciye gönderilmez.
49. **Kart içeriği baştan yazıldı (335 kart).** Yetişkin, kara mizah tonunda: eski sevgililer, aile, iş, para, sarhoşluk, yalanlar. Cinsel içerik yalnızca Ateşli destede ya da `flort` etiketiyle, katılım kurallarına bağlı. GDD bölüm 9–10'daki güvenlik ve "kimlik, görünüş, din, köken üzerinden şaka yok" kuralları aynen geçerli.
50. **Ekran anlaşılırlığı:**
    - Üst çubuğun altında her an "şu an ne oluyor / sen ne yapacaksın" şeridi var; sıra sendeyse vurgulu.
    - Kart açılışta görselli ve büyük gelir. Eylem ve sonuçta okunaklı kompakt karta döner; altında kartın kuralı tek satır yazar ("En çok oyu alan içer").
    - Sonuç ekranında "İçiyor!" başlığıyla içenler büyük avatarla listelenir. Ana Ekran da aynı kural satırını gösterir.
51. **Yakala! sonuç kartı takılı kalıyordu.** Her yeni görünümde zamanlayıcı yeniden kuruluyordu ve 6 sn'den sonra kart ekranda kalıyordu. Artık yalnızca yeni sonuçta açılıyor, 6 sn sonra ya da dokununca kapanıyor. Kart alta taşındı, kural tabelalarını örtmüyor.

## 2026-11-17 — M4 (cila)

52. **Erişilebilirlik denetimi axe-core ile yapılır** (`tests/e2e/a11y.e2e.mjs`). Giriş, katılım, lobi, oyunun her fazı ve Ana Ekran denetlenir; WCAG 2.1 AA ve iyi uygulama kurallarında ihlal kalmaz.
    - Her ekranda bir h1 var. Oyunda bu "Perde N" başlığı, lobide "Masa kodu".
    - Kaydırılabilir sıra şeridi klavyeyle odaklanabilir.
    - "Şu an ne oluyor" şeridi `role=status` ile ekran okuyucuya duyurulur.
    - Odak çerçevesi her yerde görünür (`:focus-visible`).
53. **PWA:** `manifest.webmanifest` + 192/512 ikon + maskable ikon + Apple ikonu (`scripts/make-icons.ts`, favicon.svg'den üretilir).
    - Service worker sayfalarda önce ağa gider (her yayın anında görünür); internet yoksa son kabuk açılır. Adı içeriğinin özetiyle değişen `/assets/*`, görseller ve ikonlar önbellekten gelir. `/api` ve WebSocket hiç önbelleğe alınmaz. Yalnızca yayında kaydedilir.
    - Girişte Android'de "Ana ekrana ekle" düğmesi, iPhone Safari'de kısa bir tarif çıkar; kapatılınca bir daha görünmez.
54. **TIK replikleri** (`src/client/tik/lines.ts`, 47 satır). Lobi, bekleme, sonuç (kimse içmedi / içti / çok içti / alkolsüz), perde girişleri ve gecenin özetinde çıkar. Oda kodu + tur numarasıyla seçilir; böylece masadaki herkes ve Ana Ekran aynı repliği görür. Kart üstündeki `quip` alanı ayrıca durur.
55. **Hata durumları:**
    - Çizim hatasında beyaz ekran yerine "Bir şey devrildi · Yeniden yükle" ekranı çıkar. Oyun sunucuda sürer; yenileyen koltuğuna döner.
    - İnternet yoksa üst şerit bunu söyler. Yeniden bağlanma 15 sn'yi geçerse "Yenile" düğmesi çıkar.
56. **"İlerlet" isteği adım anahtarı taşır.** İstemci gördüğü adımı (`faz:tur:perde:aşama:adım:kart`) gönderir; sunucudaki adım farklıysa istek sessizce yok sayılır. Böylece çift dokunma ya da host yokken iki kişinin aynı anda basması bir kartı atlatmaz.
57. **Dayanıklılık testi** (`tests/e2e/m4.e2e.mjs`). 6 telefon rahat tempoda tam oyun oynar; oyun sırasında:
    - iki sayfa yenilenir,
    - bir oyuncu 25 sn kopup döner,
    - host 15 sn kaybolur (10 sn sonra hostluk devredilir, yeni host ilerletir) ve geri döner.
    Herkes özete ulaşmalı, sayfa hatası olmamalı.

## 2026-11-17 — İlk görseller

58. **Görsel teslimi Claude yükleme sayfasıyla.** Kullanıcı hiçbir şey kuramadığı için görseller bir yükleme sayfasıyla geliyor (yalnızca sahibine açık). Sayfa görseli tarayıcıda en uzun kenarı 2048 px olacak şekilde WebP'ye küçültüp yüklüyor. Böylece sohbetin 5 dosya sınırı ve GitHub'ın boyut sınırı aşılıyor. Dosyalar buradan indirilip `assets-raw/` altına kaydediliyor (kaynak olarak depoda duruyor).
59. **İlk teslimde 31 dosya geldi:**
    - 12 kart türü × 2 varyant.
    - 5 mod görseli: classic, who, confess, chaos, clean.
    - TIK poz sayfası ve stil referansı.
    Görseli olmayan tür (Gizli Görev) Ayna görselini kullanıyor. Görseli olmayan mod (Ateşli, Memleket) lobide vurgu renginde bir şeritle görünüyor.
60. **TIK çizimi:** Poz sayfasından önden ve yarı yandan pozlar (rakı + çay) 200:260 kesiliyor. Arka plan parşömen olduğu için TIK gotik kemer biçimli, kenarı yumuşak bir madalyonda gösteriliyor. "smirk" ruh hâli yarı yandan pozu kullanıyor. Görsel yoksa eski SVG TIK çiziliyor.
61. **Service worker görsel listesini (`/art/manifest.json`) her açılışta ağdan alıyor.** Görseller önbellekten hemen geliyor ve arka planda tazeleniyor; aynı adla güncellenen görsel bir sonraki açılışta görünüyor.
