export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card-surface fade-in-soft mx-auto w-full max-w-md p-8 text-center">
      <h2 className="text-base font-semibold text-foreground">Đã xảy ra sự cố</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Thử lại
      </button>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}

export function SchemaSkeleton() {
  return (
    <div className="card-surface mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-8">
      <div className="h-2 w-full animate-pulse rounded-full bg-secondary" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-secondary" />
        </div>
      ))}
    </div>
  );
}
