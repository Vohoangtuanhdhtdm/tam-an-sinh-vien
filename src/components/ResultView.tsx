import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { RISK_COLOR, type PredictResponse } from "@/lib/api";

function fmtPercent(n: number) {
  return n.toFixed(1).replace(".", ",");
}

function Ring({ percent, color }: { percent: number; color: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(percent * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFEEE9" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(shown, 100)) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold" style={{ color }}>
          {fmtPercent(shown)}%
        </span>
        <span className="mt-1 text-xs text-muted-foreground">chỉ số nguy cơ</span>
      </div>
    </div>
  );
}

function ContributionBars({ items }: { items: PredictResponse["contributions"] }) {
  const max = Math.max(...items.map((i) => Math.abs(i.contribution)), 0.0001);
  return (
    <div className="space-y-5">
      {items.map((item, i) => {
        const pct = (Math.abs(item.contribution) / max) * 50;
        const inc = item.direction === "increase";
        return (
          <div key={`${item.feature}-${i}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{item.feature}</span>
              <span className="text-xs text-muted-foreground">
                {inc ? "+" : "−"}
                {Math.abs(item.contribution).toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="relative mt-2 h-3 w-full rounded-full bg-secondary">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              <div
                className="absolute inset-y-0 rounded-full"
                style={{
                  width: `${pct}%`,
                  left: inc ? "50%" : undefined,
                  right: inc ? undefined : "50%",
                  backgroundColor: inc ? RISK_COLOR.high : RISK_COLOR.low,
                }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export function ResultView({
  result,
  onRestart,
}: {
  result: PredictResponse;
  onRestart: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const color = RISK_COLOR[result.risk_level] ?? RISK_COLOR.low;

  const download = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const url = await toPng(cardRef.current, { backgroundColor: "#FAFAF8", pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = "ket-qua-sang-loc.png";
      a.click();
    } catch {
      /* im lặng bỏ qua, người dùng có thể chụp màn hình */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl fade-in-soft">
      <div ref={cardRef} className="space-y-5">
        <div className="card-surface flex flex-col items-center p-6 text-center sm:p-10">
          <Ring percent={result.percent} color={color} />
          <p className="mt-6 text-lg font-semibold text-foreground">
            Mức nguy cơ: <span style={{ color }}>{result.risk_label}</span>
          </p>

          {result.pss10_total != null || result.gad7_total != null ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {result.pss10_total != null ? (
                <span className="rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-medium text-foreground">
                  Điểm căng thẳng PSS-10: {fmtPercent(result.pss10_total)}/40
                </span>
              ) : null}
              {result.gad7_total != null ? (
                <span className="rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-medium text-foreground">
                  Điểm lo âu GAD-7: {fmtPercent(result.gad7_total)}/21
                </span>
              ) : null}
            </div>
          ) : null}

          <div
            className="mt-4 w-full rounded-xl p-4 text-left text-sm leading-relaxed text-foreground"
            style={{ backgroundColor: `${color}14` }}
          >
            {result.recommendation}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Mô hình: {result.model_used}
            {result.model_reason ? ` · ${result.model_reason}` : ""}
          </p>
          {result.n_missing > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Bạn đã bỏ qua {result.n_missing} câu. Hệ thống đã ước lượng các giá trị còn thiếu.
            </p>
          ) : null}
        </div>

        {result.contributions?.length ? (
          <div className="card-surface p-6 sm:p-8">
            <h3 className="text-base font-semibold text-foreground">Vì sao có kết quả này</h3>
            <p className="mt-1 mb-6 text-xs text-muted-foreground">
              Thanh sang phải làm tăng mức nguy cơ, thanh sang trái làm giảm.
            </p>
            <ContributionBars items={result.contributions} />
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Kết quả đến từ một mô hình học máy huấn luyện trên 2.992 sinh viên đại học và phản ánh
              mối liên hệ thống kê, không phải quan hệ nhân quả.
            </p>
          </div>
        ) : null}

        {result.risk_level === "high" ? (
          <div className="rounded-xl border border-primary bg-accent/60 p-6">
            <h3 className="text-base font-semibold text-accent-foreground">
              Bạn không phải đối mặt với điều này một mình
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              Phòng Tham vấn tâm lý sinh viên luôn sẵn sàng lắng nghe bạn, hoàn toàn miễn phí và bảo
              mật.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-foreground">
              <li>Phòng Tham vấn tâm lý — Toà nhà A, phòng 105</li>
              <li>Điện thoại: (028) 1234 5678</li>
              <li>Email: thamvan@truongdaihoc.edu.vn</li>
              <li>Giờ làm việc: 8:00 – 17:00, Thứ Hai – Thứ Sáu</li>
            </ul>
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-secondary/60 p-5">
          <p className="text-xs leading-relaxed text-muted-foreground">{result.disclaimer}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onRestart}
          className="h-11 rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Làm lại
        </button>
        <button
          onClick={download}
          disabled={saving}
          className="h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Đang tạo ảnh…" : "Tải kết quả"}
        </button>
      </div>
    </div>
  );
}
