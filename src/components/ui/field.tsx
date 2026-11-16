import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const controlClass =
  "h-10 w-full rounded-lg bg-surface-2 px-3 text-base text-fg shadow-card outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/70";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(controlClass, "h-20 resize-none py-2", className)}
      {...props}
    />
  );
}
