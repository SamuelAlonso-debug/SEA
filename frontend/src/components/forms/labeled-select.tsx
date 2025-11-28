"use client";

import * as React from "react";

interface LabeledSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function LabeledSelect({
  label,
  id,
  className,
  children,
  ...props
}: LabeledSelectProps) {
  const selectId = id ?? props.name ?? label;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <label
        htmlFor={selectId}
        className="font-semibold text-muted-foreground/90"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          className ?? ""
        }`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
