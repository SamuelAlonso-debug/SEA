import { Input } from "@/components/ui/input";

interface LabeledInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function LabeledInput({ label, id, className, ...props }: LabeledInputProps) {
  const inputId = id ?? props.name ?? label;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <label
        htmlFor={inputId}
        className="font-semibold text-muted-foreground/90"
      >
        {label}
      </label>
      <Input
        id={inputId}
        className={`h-9 text-xs bg-background ${className ?? ""}`}
        {...props}
      />
    </div>
  );
}
