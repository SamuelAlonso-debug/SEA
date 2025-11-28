"use client";

interface ProductImageUploadCardProps {
  label?: string;
  helperText?: string;
}

export function ProductImageUploadCard({
  label = "Subir Foto",
  helperText = "Formato permitido: JPG, JPEG y PNG • Tamaño máximo: 2MB",
}: ProductImageUploadCardProps) {
  return (
    <div className="flex h-full min-h-[260px] w-full max-w-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-border bg-muted">
        <span className="text-xs text-muted-foreground">📷</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {helperText.split("•")[0]}
        <br />
        {helperText.split("•")[1]?.trim()}
      </p>
    </div>
  );
}
