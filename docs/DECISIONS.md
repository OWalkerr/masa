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
