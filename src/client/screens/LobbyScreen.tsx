// Lobi: meyhane masası, QR + link, ayarlar (yalnızca host), kişisel tercihler, "Başlat".
import { useState } from 'react';
import { MODES, modeById } from '../../engine/modes';
import { MIN_PLAYERS, type Settings } from '../../engine/types';
import type { View } from '../../engine/viewFor';
import { InkButton } from '../components/InkButton';
import { QrCode } from '../components/QrCode';
import { Segmented, Toggle } from '../components/Segmented';
import { TavernTable } from '../components/TavernTable';
import { Tik } from '../components/Tik';
import { navigate } from '../router';
import { useRoom } from '../store/room';

export function LobbyScreen({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const toast = useRoom((s) => s.toast);
  const you = view.you!;
  const isHost = you.isHost;
  const seated = view.players.filter((p) => !p.left);
  const online = seated.filter((p) => p.connected).length;
  const link = `${location.origin}/m/${view.code}`;
  const [showQr, setShowQr] = useState(false);
  const host = seated.find((p) => p.isHost);

  const set = (patch: Partial<Settings>) => send({ t: 'updateSettings', patch });

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'MASA', text: `Masaya otur: ${view.code}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        toast('Link kopyalandı.');
      }
    } catch {
      /* kullanıcı vazgeçti */
    }
  }

  const enough = seated.length >= MIN_PLAYERS;

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-32 pt-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] text-bone-dim">Masa kodu</p>
          <p className="font-extrabold text-[48px] leading-none tracking-[0.18em]" aria-label={`Masa kodu ${view.code.split('').join(' ')}`}>
            {view.code}
          </p>
          <p className="mt-1 text-[14px] text-bone-dim" aria-live="polite">
            {seated.length} kişi · {online} çevrimiçi
          </p>
        </div>
        <button type="button" onClick={() => setShowQr((v) => !v)} className="min-h-[56px] min-w-[56px]" aria-expanded={showQr} aria-label="QR kodu göster">
          <QrCode value={link} size={showQr ? 150 : 76} />
        </button>
      </header>
      <div className="flex gap-2">
        <InkButton variant="secondary" className="flex-1" onClick={share} seed={31}>
          Linki paylaş
        </InkButton>
        <InkButton variant="secondary" className="w-[64px] px-0" onClick={() => window.open(`/tv/${view.code}`, '_blank')} aria-label="Ana Ekran modunu yeni sekmede aç" seed={32}>
          TV
        </InkButton>
      </div>

      <section aria-label="Masa">
        <TavernTable players={view.players} youId={you.id} />
      </section>

      <section className="ink-panel flex flex-col gap-4 p-4" aria-label="Ayarlar">
        <div className="flex items-center justify-between">
          <h2 className="font-gothic text-[28px]">Ayarlar</h2>
          {!isHost && <span className="text-[14px] text-bone-dim">yalnızca {host?.name ?? 'host'} değiştirir</span>}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[15px] text-bone-dim">Mod</legend>
          <div role="radiogroup" aria-label="Mod" className="grid grid-cols-2 gap-2">
            {MODES.map((m) => {
              const on = view.settings.deck === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!isHost || !m.available}
                  onClick={() => set({ deck: m.id })}
                  className={`flex min-h-[64px] flex-col items-start justify-center rounded-[12px] px-3 py-2 text-left ${
                    on ? 'bg-parchment-200 text-ink-text' : 'bg-ink-950/70 text-bone-100 shadow-[inset_0_0_0_1px_var(--ash-500)]'
                  } ${!m.available ? 'opacity-40' : ''} ${!isHost && !on ? 'opacity-60' : ''}`}
                  style={on ? { boxShadow: `inset 0 0 0 3px ${m.accent}` } : undefined}
                >
                  <span className="flex items-center gap-2 text-[16px]">
                    <span aria-hidden className="inline-block h-3 w-3 rotate-45" style={{ background: m.accent }} />
                    {on ? '✓ ' : ''}
                    {m.name}
                  </span>
                  <span className={`text-[14px] ${on ? 'text-ink-text/80' : 'text-bone-dim'}`}>{m.blurb}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Segmented
          label="İçki"
          value={view.settings.drinking ? 'yes' : 'no'}
          readOnly={!isHost}
          onChange={(v) => set({ drinking: v === 'yes' })}
          options={[
            { value: 'yes', label: 'Alkollü', disabled: !!modeById(view.settings.deck).forceSober },
            { value: 'no', label: 'Alkolsüz' },
          ]}
        />
        <Segmented
          label="Süre"
          value={view.settings.length}
          readOnly={!isHost}
          onChange={(v) => set({ length: v })}
          options={[
            { value: 'short', label: 'Kısa', hint: 'Perde başına 6 tur' },
            { value: 'normal', label: 'Normal', hint: 'Perde başına 10 tur' },
            { value: 'long', label: 'Uzun', hint: 'Perde başına 14 tur' },
          ]}
        />
        {view.settings.drinking && (
          <Segmented
            label="Yudum boyu"
            value={view.settings.sip}
            readOnly={!isHost}
            onChange={(v) => set({ sip: v })}
            options={[
              { value: 'small', label: 'Küçük yudum' },
              { value: 'sip', label: 'Yudum' },
              { value: 'shot', label: 'Shot', hint: 'Yalnızca 1 birimlik bedellerde' },
            ]}
          />
        )}
        <Toggle
          label="18+ kartlar"
          hint="Yalnızca yaş onayı verip katılımı açanlara gelir."
          checked={view.settings.adult}
          disabled={!isHost || view.settings.deck === 'spicy'}
          onChange={(v) => set({ adult: v })}
        />
      </section>

      <ConsentPanel view={view} />

      <div className="text-center">
        <InkButton variant="ghost" onClick={() => { send({ t: 'leave' }); navigate('/'); }}>
          Masadan kalk
        </InkButton>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-4 pt-6 safe-bottom">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Tik size={44} variant={view.settings.drinking ? 'raki' : 'tea'} />
          {isHost ? (
            <InkButton className="flex-1" disabled={!enough} onClick={() => send({ t: 'start' })} seed={41}>
              {enough ? 'Başlat' : `En az ${MIN_PLAYERS} kişi gerek (${seated.length}/${MIN_PLAYERS})`}
            </InkButton>
          ) : (
            <p className="flex-1 text-[16px] text-bone-dim" aria-live="polite">
              {host ? `${host.name} başlatınca perde açılacak.` : 'Masa sahibi bekleniyor.'}
            </p>
          )}
        </div>
      </footer>
    </main>
  );
}

// Kişisel ve gizli tercihler: yaş onayı, 18+ ve temas katılımı, "Ben bıraktım"
function ConsentPanel({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const c = view.you!.consent;
  const needsAge = view.settings.drinking || view.settings.adult;
  if (!needsAge) return null;
  return (
    <section className="ink-panel flex flex-col gap-1 p-4" aria-label="Senin tercihlerin">
      <h2 className="font-gothic text-[24px]">Senin tercihlerin</h2>
      <p className="text-[14px] text-bone-dim">Yalnızca sen görürsün.</p>
      <Toggle
        label="18 yaşından büyüğüm"
        hint={c.ageOk ? undefined : view.settings.drinking ? 'Onaysız: alkolsüz ve 18+ dışı oynarsın.' : 'Onaysız: 18+ kartlar sana gelmez.'}
        checked={c.ageOk}
        onChange={(v) => send({ t: 'consent', consent: { ageOk: v } })}
      />
      {view.settings.adult && (
        <>
          <Toggle label="Ateşli kartlara katılıyorum" checked={c.spicy} disabled={!c.ageOk} onChange={(v) => send({ t: 'consent', consent: { spicy: v } })} />
          <Toggle label="Temas içeren kartlara katılıyorum" checked={c.contact} disabled={!c.ageOk} onChange={(v) => send({ t: 'consent', consent: { contact: v } })} />
        </>
      )}
    </section>
  );
}
