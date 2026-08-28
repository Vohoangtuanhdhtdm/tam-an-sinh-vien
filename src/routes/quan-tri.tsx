import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, getThresholds, type ThresholdRow } from "@/lib/api";
import { ErrorState, Spinner } from "@/components/ErrorState";

export const Route = createFileRoute("/quan-tri")({
  head: () => ({
    meta: [
      { title: "Quản trị ngưỡng sàng lọc | Sức khỏe tinh thần sinh viên" },
      {
        name: "description",
        content:
          "Bảng ngưỡng theo năng lực mời sinh viên: ngưỡng xác suất, độ chính xác và độ bao phủ.",
      },
      { property: "og:title", content: "Quản trị ngưỡng sàng lọc" },
      {
        property: "og:description",
        content: "Chọn năng lực mời và xem ngưỡng, độ chính xác, độ bao phủ tương ứng.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const num = (n: number, d = 1) => n.toFixed(d).replace(".", ",");
const int = (n: number) => Math.round(n).toLocaleString("vi-VN");

function AdminPage() {
  const [rows, setRows] = useState<ThresholdRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThresholds();
      const sorted = [...data].sort((a, b) => a.capacity_pct - b.capacity_pct);
      setRows(sorted);
      setIndex((prev) => Math.min(prev, Math.max(sorted.length - 1, 0)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(() => rows?.[index] ?? null, [rows, index]);

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto mb-8 flex w-full max-w-3xl items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Bảng ngưỡng theo năng lực</h1>
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          Về trang sàng lọc
        </Link>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="card-surface mx-auto w-full max-w-3xl p-8">
          <Spinner label="Đang tải dữ liệu ngưỡng…" />
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className="card-surface mx-auto w-full max-w-3xl p-8 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu ngưỡng.
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl space-y-5 fade-in-soft">
          <div className="card-surface p-6 sm:p-8">
            <label className="text-sm font-medium text-foreground" htmlFor="capacity">
              Năng lực mời sinh viên
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Kéo để chọn tỷ lệ phần trăm sinh viên mà nhà trường có thể mời tham vấn.
            </p>
            <input
              id="capacity"
              type="range"
              min={0}
              max={rows.length - 1}
              step={1}
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
              className="mt-5 w-full accent-[#5B8C6E]"
            />
            {selected ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground">Năng lực</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {num(selected.capacity_pct)}%
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground">Ngưỡng xác suất</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {num(selected.threshold, 3)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground">Độ bao phủ</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {num(selected.recall * (selected.recall <= 1 ? 100 : 1))}%
                  </p>
                </div>
              </div>
            ) : null}
            {selected ? (
              <p className="mt-5 rounded-xl bg-accent p-4 text-sm leading-relaxed text-accent-foreground">
                Với năng lực mời {num(selected.capacity_pct)}% sinh viên (khoảng{" "}
                {int(selected.n_invited)} người), khoảng{" "}
                {num(selected.precision * (selected.precision <= 1 ? 100 : 1))}% số người được mời
                thực sự thuộc nhóm nguy cơ — phát hiện đúng {int(selected.n_true_positive)} ca.
              </p>
            ) : null}
          </div>

          <div className="card-surface overflow-x-auto p-2 sm:p-4">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Năng lực (%)</th>
                  <th className="px-4 py-3 font-medium">Ngưỡng xác suất</th>
                  <th className="px-4 py-3 font-medium">Số sinh viên được mời</th>
                  <th className="px-4 py-3 font-medium">Số ca phát hiện đúng</th>
                  <th className="px-4 py-3 font-medium">Precision</th>
                  <th className="px-4 py-3 font-medium">Recall</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.capacity_pct}-${i}`}
                    onClick={() => setIndex(i)}
                    className={`cursor-pointer border-t border-border transition-colors hover:bg-secondary/60 ${
                      i === index ? "bg-accent" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{num(r.capacity_pct)}</td>
                    <td className="px-4 py-3 text-foreground">{num(r.threshold, 3)}</td>
                    <td className="px-4 py-3 text-foreground">{int(r.n_invited)}</td>
                    <td className="px-4 py-3 text-foreground">{int(r.n_true_positive)}</td>
                    <td className="px-4 py-3 text-foreground">
                      {num(r.precision * (r.precision <= 1 ? 100 : 1), 2)}%
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {num(r.recall * (r.recall <= 1 ? 100 : 1), 2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
