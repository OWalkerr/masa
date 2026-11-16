// Seçenek grubu (radyo). Renk tek başına anlam taşımaz: seçili olan çerçeve + işaretle gösterilir.
interface Option<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  hint?: string;
}

export function Segmented<T extends string>({
  label, value, options, onChange, readOnly,
}: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void; readOnly?: boolean }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[15px] text-bone-dim">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={readOnly || o.disabled}
              onClick={() => onChange(o.value)}
              title={o.hint}
              className={`min-h-[48px] flex-1 rounded-[12px] px-3 text-[16px] transition-colors ${
                on ? 'bg-parchment-200 text-ink-text shadow-[inset_0_0_0_2px_var(--accent)]' : 'bg-ink-950/70 text-bone-100 shadow-[inset_0_0_0_1px_var(--ash-500)]'
              } ${o.disabled ? 'opacity-40' : ''} ${readOnly && !on ? 'opacity-50' : ''}`}
            >
              {on ? '✓ ' : ''}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({ label, checked, onChange, disabled, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; hint?: string }) {
  return (
    <label className={`flex min-h-[56px] cursor-pointer items-center justify-between gap-3 ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex flex-col">
        <span className="text-[17px]">{label}</span>
        {hint && <span className="text-[14px] text-bone-dim">{hint}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative h-[32px] w-[56px] shrink-0 rounded-full bg-ink-950 shadow-[inset_0_0_0_2px_var(--ash-500)] transition-colors peer-checked:bg-parchment-200 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--accent)] after:absolute after:left-[4px] after:top-[4px] after:h-[24px] after:w-[24px] after:rounded-full after:bg-bone-dim after:transition-transform peer-checked:after:translate-x-[24px] peer-checked:after:bg-ink-text"
      />
    </label>
  );
}
