import { useMemo, useState } from "react";
import type { SchemaField } from "@/lib/api";
import { FieldInput, type AnswerValue } from "./FieldInput";
import { CompactScaleList, scaleLegend } from "./CompactScaleList";

const GROUP_ORDER = [
  "Thông tin chung",
  "Cảm nhận về cuộc sống",
  "Mức độ căng thẳng (PSS-10)",
  "Mức độ lo âu (GAD-7)",
];

const GROUP_INTRO: Record<string, string> = {
  "Mức độ căng thẳng (PSS-10)": "Những câu sau hỏi về cảm nhận của bạn trong tháng vừa qua.",
  "Mức độ lo âu (GAD-7)": "Những câu sau hỏi về hai tuần vừa qua.",
};

interface Page {
  groupIndex: number;
  groupName: string;
  pageInGroup: number;
  pagesInGroup: number;
  fields: SchemaField[];
  battery: boolean;
}

function isBattery(fields: SchemaField[]) {
  if (fields.length < 5) return false;
  if (!fields.every((f) => f.type === "scale")) return false;
  const min = fields[0]?.min ?? 0;
  const max = fields[0]?.max ?? 5;
  return fields.every((f) => (f.min ?? 0) === min && (f.max ?? 5) === max);
}

function chunk(items: SchemaField[], size: number) {
  const out: SchemaField[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
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
  const { pages, groupCount } = useMemo(() => {
    const found: string[] = [];
    for (const f of fields) if (!found.includes(f.group)) found.push(f.group);
    const ordered = [
      ...GROUP_ORDER.filter((g) => found.includes(g)),
      ...found.filter((g) => !GROUP_ORDER.includes(g)),
    ];
    const result: Page[] = [];
    ordered.forEach((name, groupIndex) => {
      const groupFields = fields.filter((f) => f.group === name);
      const battery = isBattery(groupFields);
      const perPage = battery ? 5 : 10;
      const chunks = groupFields.length > perPage ? chunk(groupFields, perPage) : [groupFields];
      chunks.forEach((c, i) =>
        result.push({
          groupIndex,
          groupName: name,
          pageInGroup: i + 1,
          pagesInGroup: chunks.length,
          fields: c,
          battery,
        }),
      );
    });
    return { pages: result, groupCount: ordered.length };
  }, [fields]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});

  const current = pages[step];
  if (!current) return null;

  const progress = ((step + 1) / pages.length) * 100;
  const last = step === pages.length - 1;

  const setAnswer = (key: string, v: AnswerValue) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    setSkipped((s) => (s[key] ? { ...s, [key]: false } : s));
  };
  const toggleSkip = (key: string) => setSkipped((s) => ({ ...s, [key]: !s[key] }));

  const finish = () => {
    const payload: Record<string, AnswerValue> = {};
    for (const f of fields) payload[f.key] = skipped[f.key] ? null : (answers[f.key] ?? null);
    onSubmit(payload);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4">
        <div className="flex gap-1.5">
          {Array.from({ length: groupCount }).map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width:
                    i < current.groupIndex
                      ? "100%"
                      : i === current.groupIndex
                        ? `${(current.pageInGroup / current.pagesInGroup) * 100}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Phần {current.groupIndex + 1}/{groupCount}
          {current.pagesInGroup > 1 ? ` · trang ${current.pageInGroup}` : ""} · {current.groupName} ·{" "}
          {Math.round(progress)}%
        </p>
      </div>

      <div className="card-surface p-5 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">{current.groupName}</h2>
        {GROUP_INTRO[current.groupName] ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {GROUP_INTRO[current.groupName]}
          </p>
        ) : null}

        {current.battery ? (
          <CompactScaleList
            fields={current.fields}
            legend={scaleLegend(current.groupName, current.fields[0]?.min ?? 0, current.fields[0]?.max ?? 4)}
            answers={answers}
            skipped={skipped}
            onChange={setAnswer}
            onSkip={toggleSkip}
          />
        ) : (
          <div className="mt-6 space-y-8">
            {current.fields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={answers[f.key]}
                skipped={!!skipped[f.key]}
                onChange={(v) => setAnswer(f.key, v)}
                onSkip={() => toggleSkip(f.key)}
              />
            ))}
          </div>
        )}
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
          disabled={submitting}
          onClick={() => (last ? finish() : setStep((s) => s + 1))}
          className="h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {last ? "Xem kết quả" : "Tiếp tục"}
        </button>
      </div>
      <p className="mt-3 text-right text-xs text-muted-foreground">
        Bạn có thể bỏ qua bất kỳ câu nào; câu trả lời được giữ lại khi quay lại.
      </p>
    </div>
  );
}
