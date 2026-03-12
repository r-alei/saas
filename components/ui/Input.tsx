import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[var(--home-muted)] mb-1">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-11 w-full rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-2 text-sm text-[var(--home-text)] ring-offset-[var(--home-surface)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--home-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] focus-visible:ring-offset-1 focus-visible:border-[var(--home-accent)] transition-all disabled:cursor-not-allowed disabled:bg-[var(--home-surface-soft)] disabled:text-[var(--home-muted)]",
                        error && "border-red-500 focus-visible:ring-red-500 bg-red-50",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
