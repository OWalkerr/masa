# MASA

Telefonlardan oynanan, gotik masal görselli parti kart oyunu. Tasarım: [`docs/GDD.md`](docs/GDD.md) · Kararlar: [`docs/DECISIONS.md`](docs/DECISIONS.md)

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Yerel geliştirme (Vite + Cloudflare Worker + Durable Object) |
| `npm run build` | Kartları doğrular, tip denetler, derler (`dist/`) |
| `npx wrangler deploy` | Derlenmiş Worker'ı Cloudflare'e yükler |
| `npm test` | Motor testleri (Vitest) |
| `npm run test:e2e` | Uçtan uca test; önce `npx vite preview --port 4173` çalışmalı |
| `npm run validate:cards` | Kart şeması + yasak kalıp denetimi |

## Yollar

- `/` giriş · `/m/KOD` masa · `/tv/KOD` Ana Ekran · `/dev/table` tek sekmede 4 telefon
- `/?bots=N` ile kurulan masaya ilk oyuncu oturunca N bot gelir.

## Görseller

1. PNG'leri `assets-raw/` altına koy (adlar için `assets-raw/README.md`).
2. `npm run convert:art` → `public/art/*.webp` + `public/art/manifest.json`.
3. Commit + push. Görseli olmayan her şey SVG yer tutucuda kalır.

## Ana Ekran

Lobideki **TV** düğmesi `/tv/KOD` adresini yeni sekmede açar (laptop/TV). Ana Ekran koltuğa oturmaz; müzik orada çalar.
