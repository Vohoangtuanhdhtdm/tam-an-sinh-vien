import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ApiError, getSchema, postPredict, type PredictResponse, type SchemaResponse } from "@/lib/api";
import { ErrorState, SchemaSkeleton, Spinner } from "@/components/ErrorState";
import { Questionnaire } from "@/components/Questionnaire";
import { ResultView } from "@/components/ResultView";
import type { AnswerValue } from "@/components/FieldInput";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sàng lọc sức khỏe tinh thần sinh viên" },
      {
        name: "description",
        content:
          "Công cụ sàng lọc tham khảo giúp sinh viên ước lượng mức nguy cơ về sức khỏe tinh thần trong khoảng hai phút.",
      },
      { property: "og:title", content: "Sàng lọc sức khỏe tinh thần sinh viên" },
      {
        property: "og:description",
        content: "Sàng lọc tham khảo bằng mô hình học máy, ẩn danh, không lưu trữ câu trả lời.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "landing" | "form" | "result";

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="card-surface fade-in-soft mx-auto w-full max-w-xl p-8 text-center sm:p-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Sàng lọc sức khỏe tinh thần
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Đây là công cụ sàng lọc mang tính tham khảo, sử dụng một mô hình học máy. Bài khảo sát gồm
        31 câu hỏi, mất khoảng 5 phút và câu trả lời của bạn không được lưu lại ở bất kỳ đâu.
      </p>
      <button
        onClick={onStart}
        className="mt-8 h-12 w-full rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
      >
        Bắt đầu
      </button>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Kết quả không thay thế cho chẩn đoán của chuyên gia sức khỏe tâm thần.
      </p>
    </div>
  );
}

function Index() {
  const [stage, setStage] = useState<Stage>("landing");
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [pending, setPending] = useState<Record<string, AnswerValue> | null>(null);

  const loadSchema = useCallback(async () => {
    setLoadingSchema(true);
    setError(null);
    try {
      setSchema(await getSchema());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoadingSchema(false);
    }
  }, []);

  useEffect(() => {
    if (stage === "form" && !schema && !loadingSchema && !error) void loadSchema();
  }, [stage, schema, loadingSchema, error, loadSchema]);

  const submit = useCallback(async (answers: Record<string, AnswerValue>) => {
    setPending(answers);
    setSubmitting(true);
    setError(null);
    try {
      const res = await postPredict(answers);
      setResult(res);
      setStage("result");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  const restart = () => {
    setResult(null);
    setPending(null);
    setError(null);
    setStage("landing");
  };

  const retry = () => {
    setError(null);
    if (stage === "form" && !schema) void loadSchema();
    else if (pending) void submit(pending);
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto mb-8 flex w-full max-w-2xl items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Sàng lọc sức khỏe tinh thần sinh viên
        </span>
        <Link to="/quan-tri" className="text-xs text-muted-foreground hover:text-primary">
          Quản trị
        </Link>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : stage === "landing" ? (
        <Landing onStart={() => setStage("form")} />
      ) : stage === "form" ? (
        submitting ? (
          <div className="card-surface mx-auto w-full max-w-2xl p-8">
            <Spinner label="Đang phân tích câu trả lời của bạn…" />
          </div>
        ) : !schema ? (
          <SchemaSkeleton />
        ) : (
          <Questionnaire
            fields={schema.fields}
            submitting={submitting}
            onExit={() => setStage("landing")}
            onSubmit={submit}
          />
        )
      ) : result ? (
        <ResultView result={result} onRestart={restart} />
      ) : null}
    </main>
  );
}
