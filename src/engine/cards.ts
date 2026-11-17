// Kart şeması: zod ile doğrulanır. Hem doğrulama scripti hem motor bunu kullanır.
import { z } from 'zod';

export const DECK_IDS = ['classic', 'who', 'confess', 'chaos', 'duel', 'spicy', 'clean', 'homeland', 'sketch'] as const;
export const CARD_TYPES = [
  'question', 'dare', 'mostLikely', 'neverHave', 'rule', 'duel',
  'mirror', 'confession', 'curse', 'minigame', 'golden', 'tableEvent', 'mission', 'sketch',
] as const;
export const TARGETS = ['all', 'reader', 'picked', 'twoPicked', 'random', 'right', 'left'] as const;
export const INPUTS = ['none', 'judge', 'votePlayer', 'yesNo', 'choice', 'text', 'catch', 'minigame', 'draw'] as const;
export const RARITIES = ['common', 'rare', 'legendary'] as const;
export const MINIGAMES = ['bomb', 'reflex', 'countdown'] as const;

export type DeckId = (typeof DECK_IDS)[number];
export type CardType = (typeof CARD_TYPES)[number];
export type Target = (typeof TARGETS)[number];
export type Input = (typeof INPUTS)[number];
export type Rarity = (typeof RARITIES)[number];
export type MinigameKind = (typeof MINIGAMES)[number];

// Metinde izin verilen jetonlar
export const TEXT_TOKENS = ['okuyucu', 'secilen', 'ikinci', 'sag', 'sol', 'rastgele'] as const;

export const CardSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    deck: z.enum(DECK_IDS),
    type: z.enum(CARD_TYPES),
    intensity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    rarity: z.enum(RARITIES),
    target: z.enum(TARGETS),
    input: z.enum(INPUTS),
    text: z.string().min(5).max(110),
    penalty: z.number().int().min(0).max(3),
    timer: z.number().int().positive().max(120).optional(),
    duration: z.union([z.number().int().positive().max(20), z.literal('act')]).optional(),
    tags: z.array(z.string().regex(/^[a-z]+$/)).optional(),
    quip: z.string().max(90).optional(),
    choices: z.union([z.array(z.string().min(1).max(30)).min(2).max(6), z.literal('$players'), z.literal('$scale')]).optional(),
    // Gizli metin: yalnızca hedefin telefonunda görünür. "|" ile ayrılmış seçeneklerden biri rastgele seçilir.
    secret: z.string().min(2).max(600).optional(),
    minigame: z.enum(MINIGAMES).optional(),
    art: z.string().optional(),
  })
  .strict();

export type Card = z.infer<typeof CardSchema>;

export const DeckFileSchema = z.object({
  deck: z.enum(DECK_IDS),
  cards: z.array(CardSchema),
});
export type DeckFile = z.infer<typeof DeckFileSchema>;

// Şemanın ötesindeki anlamsal kontroller. Boş dizi = sorun yok.
export function lintCard(card: Card): string[] {
  const problems: string[] = [];
  const tokens = [...card.text.matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]!);
  for (const t of tokens) {
    if (!(TEXT_TOKENS as readonly string[]).includes(t)) problems.push(`bilinmeyen jeton {${t}}`);
  }
  if (tokens.includes('secilen') && card.target !== 'picked' && card.target !== 'twoPicked')
    problems.push('{secilen} jetonu picked/twoPicked hedef ister');
  // Not: {rastgele} her hedefle kullanılabilir; motor okuyucu/hedef dışı rastgele birini koyar
  if (tokens.includes('ikinci') && card.target !== 'twoPicked') problems.push('{ikinci} jetonu twoPicked hedef ister');
  if (card.type === 'mirror' && !card.choices) problems.push('mirror kartı choices ister');
  if (card.type !== 'mirror' && card.choices) problems.push('choices yalnızca mirror kartında olur');
  if (card.type === 'minigame' && !card.minigame) problems.push('minigame kartı minigame alanı ister');
  if (card.type !== 'minigame' && card.minigame) problems.push('minigame alanı yalnızca minigame kartında olur');
  if ((card.type === 'rule' || card.type === 'curse' || card.type === 'mission') && card.duration === undefined)
    problems.push('rule/curse kartı duration ister');
  if (card.secret && card.type !== 'dare' && card.type !== 'mission' && card.type !== 'sketch') problems.push('secret yalnızca dare/mission/sketch kartında olur');
  if (card.type === 'sketch' && !card.secret) problems.push('sketch kartı secret (kelime listesi) ister');
  if (card.type === 'sketch' && !['picked', 'random', 'reader', 'right', 'left'].includes(card.target)) problems.push('sketch kartını tek kişi çizer');
  if (card.secret && card.type === 'dare' && !['picked', 'random', 'reader', 'right', 'left'].includes(card.target))
    problems.push('gizli kelimeli cesaret tek kişiye gider');
  if (card.secret?.split('|').some((x) => x.trim().length < 2 || x.length > 110)) problems.push('secret seçenekleri 2–110 karakter olmalı');
  if (card.type === 'mission' && (!card.secret || card.duration === undefined)) problems.push('mission kartı secret ve duration ister');
  if (card.type === 'mission' && card.target !== 'random') problems.push('mission kartı random hedef ister (ajanı sistem seçer)');
  if (card.type === 'mission' && /\{[a-z]+\}/.test(card.text)) problems.push('mission metninde jeton olmaz (ajan ele verilir)');
  if (card.choices === '$scale' && !(card.tags ?? []).includes('olcek')) problems.push('$scale yalnızca olcek etiketli aynada olur');
  if ((card.tags ?? []).includes('yalan') && (!Array.isArray(card.choices) || card.choices.length !== 3)) problems.push('yalan kartı 3 seçenek ister');
  if (card.type === 'duel' && card.target !== 'twoPicked') problems.push('duel kartı twoPicked hedef ister');
  if (card.type === 'golden' && card.rarity !== 'legendary') problems.push('golden kartı legendary olmalı');
  if (card.type === 'golden' && card.deck === 'clean') problems.push('clean destede golden olmaz');
  const expectedInput: Partial<Record<CardType, Input[]>> = {
    question: ['judge'], dare: ['judge'], mostLikely: ['votePlayer'], neverHave: ['yesNo'],
    rule: ['catch'], duel: ['votePlayer'], mirror: ['choice'], confession: ['text'],
    curse: ['catch'], minigame: ['minigame'], tableEvent: ['none', 'catch'], mission: ['catch'], sketch: ['draw'],
  };
  const allowed = expectedInput[card.type];
  if (allowed && !allowed.includes(card.input)) problems.push(`${card.type} için input ${allowed.join('/')} olmalı`);
  for (const b of BANNED_PATTERNS) if (b.re.test(card.text)) problems.push(`yasak kalıp: ${b.why}`);
  return problems;
}

// Güvenlik: kart metinlerinde bulunmaması gereken kalıplar (bölüm 9)
export const BANNED_PATTERNS: { re: RegExp; why: string }[] = [
  { re: /(dışarı|sokağa|balkondan|evden)\s+(çık|koş|git)/i, why: 'dışarı çıkma' },
  { re: /(araba|araç|direksiyon|motosiklet)\s*(sür|kullan)/i, why: 'araç kullanma' },
  { re: /(sabun|kâğıt|kağıt|peçete|toprak|kum|şampuan|diş macunu)\w*\s+(ye|yut|ısır|çiğne)/i, why: 'yiyecek dışı şey yeme' },
  { re: /(içkileri|içkiyi|içecekleri)\s+karıştır|kokteyl\s+yap|karışım\s+iç/i, why: 'içki karıştırma' },
  { re: /(masada olmayan|masa dışından|rehberinden|eski sevgilini|patronunu|anneni|babanı)\s*\w*\s*(ara|mesaj|yaz)/i, why: 'masa dışı kişiyi arama/mesaj' },
  { re: /\b(kır|parçala|yırt|yak)(ın|sın|)\b.*(eşya|bardak|tabak|telefon)|(eşya|bardak|tabak|telefon)\w*\s+(kır|parçala|yırt|yak)\b/i, why: 'eşyaya zarar' },
];
