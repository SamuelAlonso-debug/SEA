import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-card px-6 py-4 shadow-soft">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar text-primary">
          {icon}
        </div>
      )}
    </div>
  );
}
