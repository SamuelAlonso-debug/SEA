interface MiniKpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export function MiniKpiCard({ title, value, subtitle }: MiniKpiCardProps) {
  return (
    <div className="rounded-2xl bg-card px-4 py-3 shadow-soft">
      <p className="text-[11px] font-semibold text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-lg font-extrabold text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
