"use client";

import { parseRoute, buildRoute } from "./constants";

// ── Field ─────────────────────────────────────────────────

export function Field({
    label,
    value,
    onChange,
    required,
    placeholder,
    icon,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    placeholder?: string;
    icon?: React.ReactNode;
}) {
    return (
        <label className="flex flex-col gap-0.5 text-xs font-medium">
            <span className="flex items-center gap-1">
                {icon}
                {label}
            </span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-8 rounded-md border border-[var(--home-border)] bg-white/80 px-2 text-sm outline-none focus:ring-2 focus:ring-[var(--home-accent)]/20 transition-shadow"
                required={required}
            />
        </label>
    );
}

// ── RouteSplitField ───────────────────────────────────────

export function RouteSplitField({
    label,
    value,
    onChange,
    required,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}) {
    const { from, to } = parseRoute(value);

    return (
        <label className="flex flex-col gap-0.5 text-xs font-medium sm:col-span-2">
            {label}
            <div className="flex h-8 overflow-hidden rounded-md border border-[var(--home-border)] bg-white/80">
                <input
                    value={from}
                    onChange={(e) => onChange(buildRoute(e.target.value, to))}
                    placeholder="Çıkış şehri"
                    className="h-full w-1/2 border-0 bg-transparent px-2 text-sm outline-none"
                    required={required}
                />
                <div className="w-px bg-[var(--home-border)]" />
                <input
                    value={to}
                    onChange={(e) => onChange(buildRoute(from, e.target.value))}
                    placeholder="Varış şehri"
                    className="h-full w-1/2 border-0 bg-transparent px-2 text-sm outline-none"
                    required={required}
                />
            </div>
        </label>
    );
}

// ── PillSelector ──────────────────────────────────────────

const TONE_STYLES = {
    neutral: {
        ring: "focus-visible:ring-[var(--home-accent)]/30",
        active: "bg-[var(--home-accent)] text-white shadow-sm shadow-[var(--home-accent)]/25",
        idle: "text-slate-600 hover:bg-slate-100",
        wrap: "border-[var(--home-border)] bg-white/85",
    },
    amber: {
        ring: "focus-visible:ring-amber-300/40",
        active: "bg-amber-500 text-white shadow-sm shadow-amber-500/25",
        idle: "text-amber-900/80 hover:bg-amber-100/70",
        wrap: "border-amber-200/70 bg-amber-50/70",
    },
    violet: {
        ring: "focus-visible:ring-violet-300/40",
        active: "bg-violet-500 text-white shadow-sm shadow-violet-500/25",
        idle: "text-violet-900/80 hover:bg-violet-100/70",
        wrap: "border-violet-200/70 bg-violet-50/70",
    },
} as const;

export function PillSelector({
    label,
    value,
    onChange,
    options,
    icon,
    tone = "neutral",
    compact = false,
}: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    options: ReadonlyArray<{ value: string; label: string }>;
    icon?: React.ReactNode;
    tone?: "neutral" | "amber" | "violet";
    compact?: boolean;
}) {
    const s = TONE_STYLES[tone];
    const currentValue = value || "";

    return (
        <label className={["flex flex-col", compact ? "gap-1 text-sm" : "gap-0.5 text-xs", "font-medium"].join(" ")}>
            <span className="flex items-center gap-1">
                {icon}
                {label}
            </span>
            <div
                role="radiogroup"
                aria-label={label}
                className={[
                    "grid gap-1 rounded-xl border p-1",
                    options.length <= 3 ? "grid-cols-2" : "grid-cols-3",
                    s.wrap,
                ].join(" ")}
            >
                {options.map((option) => {
                    const active = option.value === currentValue;
                    return (
                        <button
                            key={`${label}-${option.value || "none"}`}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onChange(option.value)}
                            className={[
                                "rounded-lg px-2.5 py-1.5 text-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2",
                                compact ? "text-xs" : "text-[11px]",
                                s.ring,
                                active ? s.active : s.idle,
                            ].join(" ")}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </label>
    );
}
