import type { SchemaField } from "@/lib/api";
import type { AnswerValue } from "./FieldInput";

export function scaleLegend(group: string, min: number, max: number) {
  if (max === 4) return `${min} = không bao giờ … ${max} = rất thường xuyên`;
  if (max === 3) return `${min} = không ngày nào … ${max} = gần như mỗi ngày`;
  if (max === 10) return `${min} = hoàn toàn không … ${max} = rất nhiều`;
  return `${min} = thấp nhất … ${max} = cao nhất`;
}

export function CompactScaleList({
  fields,
  legend,
  answers,
  skipped,
  onChange,
  onSkip,
}: {
  fields: SchemaField[];
  legend: string;
  answers: Record<string, AnswerValue>;
  skipped: Record<string, boolean>;
  onChange: (key: string, value: AnswerValue) => void;
  onSkip: (key: string) => void;
}) {
  return (
    <div className="mt-5">
      <div className="sticky top-0 z-10 -mx-5 border-b border-border bg-card px-5 py-2.5 sm:-mx-8 sm:px-8">
        <p className="text-xs text-muted-foreground">{legend}</p>
      </div>

      <ul className="divide-y divide-border">
        {fields.map((f) => {
          const min = f.min ?? 0;
          const max = f.max ?? 4;
          const items: number[] = [];
          for (let i = min; i <= max; i++) items.push(i);
          const off = !!skipped[f.key];
          return (
            <li
              key={f.key}
              className="flex flex-col gap-2.5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="sm:flex-1">
                <p className="text-sm leading-relaxed text-foreground">{f.label}</p>
                {f.hint ? <p className="mt-0.5 text-xs text-muted-foreground">{f.hint}</p> : null}
                <button
                  type="button"
                  onClick={() => onSkip(f.key)}
                  className="mt-1 text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  {off ? "Trả lời câu này" : "Bỏ qua câu này"}
                </button>
              </div>
              <div className={`flex flex-wrap gap-1.5 ${off ? "pointer-events-none opacity-40" : ""}`}>
                {items.map((n) => {
                  const active = answers[f.key] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChange(f.key, n)}
                      className={[
                        "h-9 w-9 rounded-lg border text-xs font-medium transition-colors",
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
