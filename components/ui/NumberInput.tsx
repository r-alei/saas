import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    error?: string;
    compact?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
    ({ className, value, onChange, min = 0, max = 999999, step = 1, label, error, compact, ...props }, ref) => {

        // Internal string state to handle typing decimals (e.g. "1.") without losing the dot
        const [localValue, setLocalValue] = React.useState(value?.toString() || "0");

        React.useEffect(() => {
            if (Number(localValue) !== value) {
                setLocalValue(value?.toString() || "0");
            }
        }, [localValue, value]);

        const handleDecrement = () => {
            const current = Number(value || 0);
            const precision = step.toString().split(".")[1]?.length || 0;
            const newValue = Math.max(min, Number((current - step).toFixed(precision)));

            onChange(newValue);
            setLocalValue(newValue.toString());
        };

        const handleIncrement = () => {
            const current = Number(value || 0);
            const precision = step.toString().split(".")[1]?.length || 0;
            const newValue = Math.min(max, Number((current + step).toFixed(precision)));

            onChange(newValue);
            setLocalValue(newValue.toString());
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newVal = e.target.value;
            setLocalValue(newVal);

            if (newVal === "") {
                onChange(0);
                return;
            }

            const parsed = parseFloat(newVal);
            if (!isNaN(parsed)) {
                onChange(parsed);
            }
        };

        const handleBlur = () => {
            setLocalValue(value?.toString() || "0");
        };

        return (
            <div className="w-full">
                {label && (
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--home-muted)]">
                        {label}
                    </label>
                )}
                <div className="flex items-center gap-2">
                    {!compact && (
                        <button
                            type="button"
                            onClick={handleDecrement}
                            disabled={value <= min}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--home-surface-soft)] text-[var(--home-muted)] transition-all hover:bg-[var(--home-accent)] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-[var(--home-surface-soft)] disabled:hover:text-[var(--home-muted)]"
                        >
                            <Minus size={15} strokeWidth={2.5} />
                        </button>
                    )}
                    <input
                        type="number"
                        className={cn(
                            "h-10 w-full rounded-xl bg-[var(--home-surface-soft)] px-3 text-sm font-semibold text-[var(--home-text)] outline-none transition-all placeholder:text-[var(--home-muted)] focus:bg-[var(--home-surface)] focus:ring-2 focus:ring-[var(--home-accent)]/40 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
                            compact ? "text-left" : "text-center",
                            error && "ring-2 ring-red-400/50 bg-red-50",
                            className
                        )}
                        value={localValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        ref={ref}
                        min={min}
                        max={max}
                        step={step}
                        {...props}
                    />
                    {!compact && (
                        <button
                            type="button"
                            onClick={handleIncrement}
                            disabled={value >= max}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--home-surface-soft)] text-[var(--home-muted)] transition-all hover:bg-[var(--home-accent)] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-[var(--home-surface-soft)] disabled:hover:text-[var(--home-muted)]"
                        >
                            <Plus size={15} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
