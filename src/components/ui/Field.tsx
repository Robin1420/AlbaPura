import type { ComponentProps } from "react";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
} & ComponentProps<"input">;

export function Field({ label, error, hint, id, className = "", ...rest }: FieldProps) {
  const fid = id ?? rest.name ?? label;
  const describedBy = error ? `${fid}-err` : hint ? `${fid}-hint` : undefined;
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={fid} className="font-display text-[14px] font-medium">{label}</label>
      <input
        id={fid}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`h-12 rounded-md border bg-white px-4 font-text text-[17px] outline-none transition-shadow placeholder:text-faint focus:ring-2 focus:ring-leaf-500/50 ${
          error ? "border-danger" : "border-line-strong/60 focus:border-leaf-600"
        }`}
        {...rest}
      />
      {error ? (
        <p id={`${fid}-err`} className="text-[14px] text-danger">{error}</p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="text-[14px] italic text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
