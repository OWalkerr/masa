# Ham görseller

Görseller bu klasöre gelir; `npm run convert:art` hepsini `public/art/` altına 800 ve 400 px WebP olarak çevirir ve görsel listesini (`manifest.json`) günceller.

Kolay yol: görselleri [MASA Görsel Teslimi](https://claude.ai/artifact/L2f7NQjwCp24QUcaZp1wZk) sayfasına sürükle (tarayıcıda küçültülüp yüklenir), sonra sohbette "yükledim" de.

Adlandırma:
- Kart türü görseli: `type-question-01`, `type-mostLikely-02` … (her türün birden çok varyantı olabilir; kart kimliğine göre biri seçilir)
- Tek bir karta özel görsel: kartın kimliği (`gold-01`) ya da kartın `art` alanı
- Mod görseli: `deck-chaos`, `deck-classic` … (lobideki mod seçiminde görünür)
- `avatar-01` … `avatar-12`, `bg-phone`, `bg-tv`, `card-back`
- `tik-sheet`: TIK poz sayfası (3 sütun × 2 sıra: önden, yarı yandan, yandan; üst sıra rakı, alt sıra çay)
- `style-*`: yalnızca stil referansı, oyuna girmez
