// WebSocket protokolü (JSON). Mesajlar zod ile doğrulanır.
import { z } from 'zod';
import { DECK_IDS } from './cards';
import type { View } from './viewFor';

export const MAX_MESSAGE_BYTES = 4096;
export const RATE_LIMIT_PER_SEC = 10;

const SettingsPatch = z
  .object({
    deck: z.enum(DECK_IDS),
    drinking: z.boolean(),
    length: z.enum(['short', 'normal', 'long']),
    sip: z.enum(['small', 'sip', 'shot']),
    adult: z.boolean(),
    pace: z.enum(['relaxed', 'timed']),
  })
  .partial()
  .strict();

const ConsentPatch = z.object({ ageOk: z.boolean(), spicy: z.boolean(), contact: z.boolean() }).partial().strict();

export const ClientMessage = z.discriminatedUnion('t', [
  // Yeni koltuk ya da yeniden bağlanma (playerId+secret varsa)
  z.object({
    t: z.literal('join'),
    name: z.string().max(40),
    avatar: z.number().int().min(0).max(11),
    consent: ConsentPatch.optional(),
  }),
  z.object({ t: z.literal('resume'), playerId: z.string().max(40), secret: z.string().max(80) }),
  z.object({ t: z.literal('updateSettings'), patch: SettingsPatch }),
  z.object({ t: z.literal('consent'), consent: ConsentPatch }),
  z.object({ t: z.literal('profile'), name: z.string().max(40).optional(), avatar: z.number().int().min(0).max(11).optional() }),
  z.object({ t: z.literal('start') }),
  z.object({ t: z.literal('kick'), playerId: z.string().max(40) }),
  z.object({ t: z.literal('quitDrinking') }),
  z.object({ t: z.literal('playCard'), cardId: z.string().max(60) }),
  z.object({ t: z.literal('pickTarget'), playerIds: z.array(z.string().max(40)).min(1).max(2) }),
  z.object({ t: z.literal('vote'), playerId: z.string().max(40) }),
  z.object({ t: z.literal('answer'), yes: z.boolean() }),
  z.object({ t: z.literal('judge'), done: z.boolean().optional(), payers: z.array(z.string().max(40)).max(12).optional() }),
  z.object({ t: z.literal('restart'), keep: z.boolean().optional() }),
  z.object({ t: z.literal('choose'), index: z.number().int().min(0).max(20) }),
  z.object({ t: z.literal('answerText'), text: z.string().max(200) }),
  z.object({ t: z.literal('catch'), effectId: z.string().max(40), accused: z.string().max(40) }),
  z.object({ t: z.literal('catchVote'), yes: z.boolean() }),
  z.object({
    t: z.literal('usePower'),
    power: z.enum(['shield', 'mirror', 'swap', 'sabotage']),
    targetId: z.string().max(40).optional(),
    cardId: z.string().max(60).optional(),
  }),
  z.object({ t: z.literal('decree'), text: z.string().max(200) }),
  z.object({ t: z.literal('pass') }),
  z.object({ t: z.literal('drawSeg'), s: z.array(z.number().int().min(0).max(1000)).max(160), n: z.boolean().optional() }),
  z.object({ t: z.literal('drawUndo') }),
  z.object({ t: z.literal('drawClear') }),
  z.object({ t: z.literal('guess'), text: z.string().max(120) }),
  z.object({ t: z.literal('galDone') }),
  z.object({ t: z.literal('houseAdd'), kind: z.enum(['question', 'dare', 'mostLikely', 'neverHave']), text: z.string().max(200) }),
  z.object({ t: z.literal('houseRemove'), id: z.string().max(40) }),
  z.object({ t: z.literal('galVote'), index: z.number().int().min(0).max(20) }),
  z.object({ t: z.literal('advance'), at: z.string().max(80).optional() }),
  z.object({ t: z.literal('missionDone'), effectId: z.string().max(40) }),
  z.object({ t: z.literal('veto') }),
  z.object({ t: z.literal('rate'), v: z.union([z.literal(-1), z.literal(0), z.literal(1)]) }),
  z.object({ t: z.literal('leave') }),
  z.object({ t: z.literal('ping'), clientTime: z.number(), rtt: z.number().min(0).max(10_000).optional() }),
  z.object({ t: z.literal('minigameInput'), action: z.enum(['tap', 'throw']), bomb: z.number().int().min(0).max(3).optional() }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

export type ServerMessage =
  | { t: 'snapshot'; view: View; rev: number }
  | { t: 'fx'; kind: string; payload?: unknown }
  | { t: 'error'; code: string; message: string }
  | { t: 'pong'; serverTime: number; clientTime: number }
  | { t: 'seat'; playerId: string; secret: string };
