# MASA — Gemini Görsel Promptları

Her blok tek bir görsel içindir: kopyala, Gemini'ye yapıştır, belirtilen dosya adıyla kaydet.
Model: son görseller için Nano Banana Pro, denemeler için Nano Banana 2. Çözünürlük 2K.
Stil çapasından sonraki her görselde `style-anchor.png` dosyasını, TIK'in göründüğü görsellerde ayrıca `tik-sheet.png` dosyasını referans olarak ekle.
Kontrol: silüet 200 px'te okunuyor mu, vurgu rengi yalnızca ışıkta mı, yazı yok mu, bilinen bir karaktere benziyor mu?

## Stil çapası (ilk iş, 4 deneme yap, en iyisini seç)
Dosya: `style-anchor.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
SCENE: A crooked candle-lit meyhane table at midnight on a leaning wooden balcony in old Istanbul, spindly guests with huge hollow eyes raising tulip glasses, a skinny street cat on the railing, the full moon behind them.
FORMAT: 4:3 landscape
```

## TIK karakter sayfası
Dosya: `tik-sheet.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Character turnaround sheet of TIK, the host mascot of a party card game: a small anthropomorphic tulip-shaped raki glass with stick-thin arms and legs, white gloves, huge round hollow eyes, a stitched grin and a tiny bow tie. Show front, three-quarter and side views, plus a second version where TIK is a slim tulip-waisted Turkish tea glass on a small saucer with a curl of steam. Neutral dark background, evenly spaced poses.
FORMAT: 16:9 landscape
```

## Soru — varyant 1
Dosya: `type-question-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A spindly waiter with hollow eyes leans over a crooked meyhane table holding a single candle up to a nervous guest's face, other guests peeking from the shadows.
FORMAT: 4:3 landscape
```

## Soru — varyant 2
Dosya: `type-question-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A spindly waiter with hollow eyes leans over a crooked meyhane table holding a single candle up to a nervous guest's face, other guests peeking from the shadows. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Görev — varyant 1
Dosya: `type-dare-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A lanky performer in striped stockings balances on one leg on a wobbly stool stacked on mezze plates, friends gasping with hands over their mouths.
FORMAT: 4:3 landscape
```

## Görev — varyant 2
Dosya: `type-dare-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A lanky performer in striped stockings balances on one leg on a wobbly stool stacked on mezze plates, friends gasping with hands over their mouths. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Kim Daha? — varyant 1
Dosya: `type-mostLikely-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Long ghostly pointing hands rise from the fog, all pointing at one startled figure standing in a moonbeam.
FORMAT: 4:3 landscape
```

## Kim Daha? — varyant 2
Dosya: `type-mostLikely-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Long ghostly pointing hands rise from the fog, all pointing at one startled figure standing in a moonbeam. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Hiç Yapmadım — varyant 1
Dosya: `type-neverHave-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A row of guests hide behind enormous fans, one guilty face slowly peeking out, a candle glowing between them.
FORMAT: 4:3 landscape
```

## Hiç Yapmadım — varyant 2
Dosya: `type-neverHave-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A row of guests hide behind enormous fans, one guilty face slowly peeking out, a candle glowing between them. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Kural — varyant 1
Dosya: `type-rule-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A heavy blank tavern sign hangs on rusty chains and swings above the table, a lantern glowing beneath it.
FORMAT: 4:3 landscape
```

## Kural — varyant 2
Dosya: `type-rule-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A heavy blank tavern sign hangs on rusty chains and swings above the table, a lantern glowing beneath it. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Düello — varyant 1
Dosya: `type-duel-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Two skinny rivals face each other across the table holding tea glasses like dueling pistols, crows watching from the beam above.
FORMAT: 4:3 landscape
```

## Düello — varyant 2
Dosya: `type-duel-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Two skinny rivals face each other across the table holding tea glasses like dueling pistols, crows watching from the beam above. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Ayna — varyant 1
Dosya: `type-mirror-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: An ornate oval mirror on a crooked wall reflects a grinning, mischievous version of the guest standing in front of it.
FORMAT: 4:3 landscape
```

## Ayna — varyant 2
Dosya: `type-mirror-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: An ornate oval mirror on a crooked wall reflects a grinning, mischievous version of the guest standing in front of it. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## İtiraf — varyant 1
Dosya: `type-confession-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A guest whispers into the window of a tiny leaning wooden Istanbul house; a curl of glowing smoke escapes from the chimney.
FORMAT: 4:3 landscape
```

## İtiraf — varyant 2
Dosya: `type-confession-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A guest whispers into the window of a tiny leaning wooden Istanbul house; a curl of glowing smoke escapes from the chimney. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Lanet — varyant 1
Dosya: `type-curse-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A tiny storm cloud with a crooked face follows a startled guest down a cobblestone street, drizzling on only them.
FORMAT: 4:3 landscape
```

## Lanet — varyant 2
Dosya: `type-curse-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A tiny storm cloud with a crooked face follows a startled guest down a cobblestone street, drizzling on only them. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Mini Oyun — varyant 1
Dosya: `type-minigame-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A round black bomb with a sparking fuse hops between trembling white-gloved hands around the table.
FORMAT: 4:3 landscape
```

## Mini Oyun — varyant 2
Dosya: `type-minigame-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A round black bomb with a sparking fuse hops between trembling white-gloved hands around the table. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Altın Kart — varyant 1
Dosya: `type-golden-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of old gold #D4AF37 that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A grinning street cat wearing a tall crooked crown lounges on a velvet cushion, golden glow and floating dust motes around it.
FORMAT: 4:3 landscape
```

## Altın Kart — varyant 2
Dosya: `type-golden-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of old gold #D4AF37 that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A grinning street cat wearing a tall crooked crown lounges on a velvet cushion, golden glow and floating dust motes around it. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Masa Olayı — varyant 1
Dosya: `type-tableEvent-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: The whole crooked table tilts like a ship as plates, glasses and guests slide, the full moon laughing in the window.
FORMAT: 4:3 landscape
```

## Masa Olayı — varyant 2
Dosya: `type-tableEvent-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: The whole crooked table tilts like a ship as plates, glasses and guests slide, the full moon laughing in the window. Same scene from a low angle, closer to the main character.
FORMAT: 4:3 landscape
```

## Deste kapağı — Klasik Masa
Dosya: `deck-classic.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A very long crooked meyhane table under a full moon, empty chairs of different heights waiting, dozens of candles glowing.
FORMAT: 4:3 landscape
```

## Deste kapağı — Kim Daha?
Dosya: `deck-who.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of poison green #A3E635 that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Silhouettes of friends on a rooftop all pointing at each other in a spiral, green lantern light.
FORMAT: 4:3 landscape
```

## Deste kapağı — Kaos
Dosya: `deck-chaos.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of blood red #D7263D that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A crooked stone tower twisting into a spiral during a storm, tables and chairs flying around it, red lightning.
FORMAT: 4:3 landscape
```

## Deste kapağı — Temiz
Dosya: `deck-clean.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of mint #5ED6B4 that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A quiet tea garden under a twisted moonlit tree, tea glasses glowing on small tables, sleepy cats.
FORMAT: 4:3 landscape
```

## Deste kapağı — İtiraf Gecesi
Dosya: `deck-confess.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of moon blue #7FB2E5 that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A leaning wooden confession booth made from an old Istanbul window frame, blue lantern light leaking through the shutters, a crow listening.
FORMAT: 4:3 landscape
```

## Deste kapağı — Memleket
Dosya: `deck-homeland.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of pumpkin orange #F28C28 that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: A lively neighborhood wedding on a crooked street: spindly dancers in a halay line waving napkins, string lights glowing orange.
FORMAT: 4:3 landscape
```

## Deste kapağı — Ateşli 18+
Dosya: `deck-spicy.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of rose crimson #E0457B that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Two shy spindly figures on a moonlit bench, a single rose glowing crimson between them, a cat rolling its eyes.
FORMAT: 4:3 landscape
```

## Kart arkası
Dosya: `card-back.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Symmetrical card back design, TIK's silhouette inside a full moon, spiral ornaments and a black-and-white striped border, dark background.
FORMAT: 3:4 portrait
```

## Telefon arka planı
Dosya: `bg-phone.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Night skyline of crooked leaning Istanbul wooden houses climbing a hill, a giant moon, low fog at the bottom third, empty dark sky in the top half for UI.
FORMAT: 9:16 portrait
```

## TV arka planı
Dosya: `bg-tv.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Wide view of a skyline of crooked leaning Istanbul wooden houses with a long empty meyhane table in the foreground, empty center area for cards, giant moon.
FORMAT: 16:9 landscape
```

## Lobi masası
Dosya: `bg-lobby.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Top-down three-quarter view of one very long crooked wooden table with 12 empty mismatched chairs, a candle in front of each chair, fog on the floor.
FORMAT: 9:16 portrait
```

## Avatar 01
Dosya: `avatar-01.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a spindly old meyhane waiter with a towel on his arm, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 02
Dosya: `avatar-02.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a huge-eyed Istanbul street cat with a torn ear, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 03
Dosya: `avatar-03.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a simit seller balancing a tray of simit on his head, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 04
Dosya: `avatar-04.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of an aunt reading coffee grounds in a tiny cup, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 05
Dosya: `avatar-05.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a seagull wearing a fisherman's cap, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 06
Dosya: `avatar-06.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a skeleton playing a kemençe, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 07
Dosya: `avatar-07.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a sleepless student with an enormous scarf, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 08
Dosya: `avatar-08.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a vampire DJ with headphones, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 09
Dosya: `avatar-09.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a curly-haired poet holding a quill, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 10
Dosya: `avatar-10.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a tailor with pins in her mouth, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 11
Dosya: `avatar-11.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of an old minibus driver twirling worry beads, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```

## Avatar 12
Dosya: `avatar-12.png`

```text
STYLE LOCK: Gothic whimsical storybook illustration in the spirit of handmade stop-motion puppet films. Spindly elongated limbs, oversized heads, huge hollow eyes with dark rings and tiny pupils, stitched seams, pale skin. Curling spirals, black-and-white stripes, crooked leaning wooden Istanbul houses, an enormous full moon. Hand-inked linework with fine cross-hatching, subtle paper grain and soft watercolor wash, gentle vignette. Palette: desaturated charcoal, ash grey, bone white and parchment, with ONE glowing accent color of candle amber #E8B04A that comes only from a light source such as a candle, lantern, tea glass or potion. Darkly funny and charming rather than scary, no blood. Clear silhouette, subject centered, medium shot, generous dark empty margin around the subject. Wordless image: blank signs, blank labels, no lettering.
REFERENCES: Use image 1 (style-anchor) only for line, texture and palette. Use image 2 (tik-sheet) only if TIK appears.
SCENE: Bust portrait avatar of a fisherman holding a lantern, facing the viewer with a strong readable silhouette, centered inside a circular dark vignette, simple dark background.
FORMAT: 1:1 square
```
