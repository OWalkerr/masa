// Katılım: isim, avatar ızgarası, yaş onayı, kişisel 18+ katılımı
import { useState } from 'react';
import { MAX_NAME } from '../../engine/types';
import type { View } from '../../engine/viewFor';
import { Avatar, AVATAR_NAMES } from '../components/Avatar';
import { InkButton } from '../components/InkButton';
import { Logo } from '../components/Logo';
import { Toggle } from '../components/Segmented';
import { loadProfile, saveProfile } from '../net/identity';
import { useRoom } from '../store/room';

export function JoinScreen({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const saved = loadProfile();
  const taken = new Set(view.players.filter((p) => !p.left).map((p) => p.avatar));
  const [name, setName] = useState(saved?.name ?? '');
  const [avatar, setAvatar] = useState(saved?.avatar ?? firstFree(taken));
  const [ageOk, setAgeOk] = useState(false);
  const [spicy, setSpicy] = useState(false);
  const [contact, setContact] = useState(false);
  const needsAge = view.settings.drinking || view.settings.adult;
  const host = view.players.find((p) => p.isHost);
  const started = view.phase !== 'lobby';

  function submit() {
    const n = name.trim();
    if (!n) return;
    saveProfile({ name: n, avatar });
    send({ t: 'join', name: n, avatar, consent: { ageOk, spicy: ageOk && spicy, contact: ageOk && contact } });
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-8 pt-6">
      <div className="text-center">
        <Logo size={56} />
        <p className="mt-2 text-bone-dim">
          <span className="font-extrabold text-[26px] tracking-[0.2em] text-bone-100">{view.code}</span>
          {host ? ` · ${host.name} masası` : ''}
          {started ? ' · oyun sürüyor, sıranın sonuna oturursun' : ''}
        </p>
      </div>

      <form
        className="ink-panel flex flex-col gap-5 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[16px] text-bone-dim">
            Masadaki adın
          </label>
          <div className="relative">
            <input
              id="name"
              autoFocus
              autoComplete="nickname"
              maxLength={MAX_NAME}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
              className="h-[56px] w-full rounded-[12px] bg-ink-950 px-4 pr-14 text-[20px] text-bone-100 shadow-[inset_0_0_0_2px_var(--ash-500)] outline-none focus:shadow-[inset_0_0_0_2px_var(--accent)]"
              placeholder="Örn. Ayşe"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-bone-dim">
              {[...name].length}/{MAX_NAME}
            </span>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-[16px] text-bone-dim">Yüzünü seç</legend>
          <div role="radiogroup" className="grid grid-cols-4 gap-2">
            {AVATAR_NAMES.map((label, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={avatar === i}
                aria-label={label}
                onClick={() => setAvatar(i)}
                className={`flex aspect-square min-h-[56px] items-center justify-center rounded-[14px] transition-transform active:scale-95 ${
                  avatar === i ? 'bg-parchment-200/15 shadow-[inset_0_0_0_3px_var(--accent)]' : 'shadow-[inset_0_0_0_1px_var(--ash-500)]'
                }`}
              >
                <Avatar index={i} size={60} dim={taken.has(i) && avatar !== i} />
              </button>
            ))}
          </div>
        </fieldset>

        {(needsAge || view.settings.adult) && (
          <div className="flex flex-col gap-1 border-t border-ash-500 pt-3">
            <Toggle
              label="18 yaşından büyüğüm"
              hint={view.settings.drinking ? 'Onay vermezsen alkolsüz ve 18+ dışı oynarsın.' : 'Onay vermezsen 18+ kartlar sana gelmez.'}
              checked={ageOk}
              onChange={setAgeOk}
            />
            {view.settings.adult && (
              <>
                <Toggle label="Ateşli kartlara katılıyorum" hint="Bu tercihi kimse görmez." checked={spicy && ageOk} disabled={!ageOk} onChange={setSpicy} />
                <Toggle label="Temas içeren kartlara katılıyorum" hint="Bu tercihi kimse görmez." checked={contact && ageOk} disabled={!ageOk} onChange={setContact} />
              </>
            )}
          </div>
        )}

        <InkButton type="submit" disabled={!name.trim()} seed={21}>
          Masaya Otur
        </InkButton>
      </form>
    </main>
  );
}

function firstFree(taken: Set<number>): number {
  for (let i = 0; i < 12; i++) if (!taken.has(i)) return i;
  return 0;
}
