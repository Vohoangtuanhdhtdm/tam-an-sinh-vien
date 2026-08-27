import { useMemo, useState } from "react";
import type { SchemaField } from "@/lib/api";
import { FieldInput, type AnswerValue } from "./FieldInput";

const GROUP_ORDER = ["Thông tin chung", "Học tập", "Đời sống"];

export interface QuestionnaireResult {
  answers: Record<string, AnswerValue>;
}

export function Questionnaire({
  fields,
  onSubmit,
  onExit,
  submitting,
}: {
  fields: SchemaField[];
  onSubmit: (answers: Record<string, AnswerValue>) => void;
  onExit: () => void;
  submitting: boolean;
}) {
  const groups = useMemo(() => {
    const found = Array.from(new Set(fields.map((f) => f.group)));
    const ordered = [
      ...GROUP_ORDER.filter((g) => found.includes(g)),
      ...found.filter((g) => !GROUP_ORDER.includes(g)),
    ];
    return ordered.map((g) => ({ name: g, fields: fields.filter((f) => f.group === g) }));
  }, [fields]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});

  const current = groups[step];
  if (!current) return null;

  const stepComplete = current.fields.every(
    (f) => skipped[f.key] || (answers[f.key] !== undefined && answers[f.key] !== null),
  );

  const progress = ((step + (stepComplete ? 1 : 0.35)) / groups.length) * 100;

  const finish = () => {
    const payload: Record<string, AnswerValue> = {};
    for (const f of fields) {
      payload[f.key] = skipped[f.key] ? null : (answers[f.key] ?? null);
    }
    onSubmit(payload);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Bước {step + 1} / {groups.length} · {current.name}
        </p>
      </div>

      <div className="card-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">{current.name}</h2>
        <div className="mt-6 space-y-8">
          {current.fields.map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              value={answers[f.key]}
              skipped={!!skipped[f.key]}
              onChange={(v) => setAnswers((a) => ({ ...a, [f.key]: v }))}
              onSkip={() =>
                setSkipped((s) => {
                  const next = { ...s, [f.key]: !s[f.key] };
                  return next;
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => (step === 0 ? onExit() : setStep((s) => s - 1))}
          className="h-11 rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          Quay lại
        </button>
        <button
          type="button"
          disabled={!stepComplete || submitting}
          onClick={() => (step === groups.length - 1 ? finish() : setStep((s) => s + 1))}
          className="h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === groups.length - 1 ? "Xem kết quả" : "Tiếp tục"}
        </button>
      </div>
      {!stepComplete ? (
        <p className="mt-3 text-right text-xs text-muted-foreground">
          Hãy trả lời hoặc bỏ qua tất cả câu hỏi ở bước này.
        </p>
      ) : null}
    </div>
  );
}
