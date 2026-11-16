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
  z.object({ t: z.literal('leave') }),
  z.object({ t: z.literal('ping'), clientTime: z.number() }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

export type ServerMessage =
  | { t: 'snapshot'; view: View; rev: number }
  | { t: 'fx'; kind: string; payload?: unknown }
  | { t: 'error'; code: string; message: string }
  | { t: 'pong'; serverTime: number; clientTime: number }
  | { t: 'seat'; playerId: string; secret: string };
