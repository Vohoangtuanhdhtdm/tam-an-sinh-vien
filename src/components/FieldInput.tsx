import { normalizeOptions, type SchemaField } from "@/lib/api";

export type AnswerValue = string | number | null;

interface Props {
  field: SchemaField;
  value: AnswerValue | undefined;
  skipped: boolean;
  onChange: (value: AnswerValue) => void;
  onSkip: () => void;
}

function ScaleRow({
  min,
  max,
  value,
  onChange,
  disabled,
}: {
  min: number;
  max: number;
  value: AnswerValue | undefined;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const items: number[] = [];
  for (let i = min; i <= max; i++) items.push(i);
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            aria-pressed={active}
            className={[
              "h-11 min-w-11 flex-1 rounded-xl border px-2 text-sm font-medium transition-colors sm:flex-none",
              disabled ? "opacity-40" : "",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
            ].join(" ")}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

export function FieldInput({ field, value, skipped, onChange, onSkip }: Props) {
  const disabled = skipped;

  return (
    <div className="fade-in-soft">
      <label className="block text-[15px] font-medium text-foreground" htmlFor={field.key}>
        {field.label}
      </label>
      {field.hint ? <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p> : null}

      <div className={`mt-3 ${disabled ? "pointer-events-none opacity-45" : ""}`}>
        {field.type === "select" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {normalizeOptions(field).map((opt) => {
              const active = value === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => onChange(opt.value)}
                  aria-pressed={active}
                  className={[
                    "rounded-xl border px-4 py-3.5 text-left text-sm transition-colors",
                    active
                      ? "border-primary bg-accent font-medium text-accent-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : field.type === "scale" ? (
          <ScaleRow
            min={field.min ?? 1}
            max={field.max ?? 5}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        ) : (
          <input
            id={field.key}
            type="number"
            inputMode="decimal"
            min={field.min}
            max={field.max}
            value={value === null || value === undefined ? "" : String(value)}
            placeholder={
              field.default !== undefined && field.default !== null
                ? `Ví dụ: ${field.default}`
                : "Nhập số"
            }
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        )}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-2 text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
      >
        {skipped ? "Trả lời câu này" : "Bỏ qua câu này"}
      </button>
    </div>
  );
}
