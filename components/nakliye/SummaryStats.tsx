"use client";

import {
    Package,
    Clock,
    CircleDollarSign,
    AlertTriangle,
    type LucideIcon,
} from "lucide-react";
import { formatPrice, ShipmentSummary } from "./constants";

// ── Stat Card ─────────────────────────────────────────────

const STAT_STYLES = {
    neutral: {
        shell: "border-sky-200/70 bg-gradient-to-br from-sky-200/45 via-blue-100/20 to-indigo-100/20",
        card: "border-sky-100/80 bg-white/76",
        edge: "bg-sky-400/70",
        halo: "bg-sky-300/35",
        iconWrap: "border-sky-200/60 bg-sky-100/75",
        iconColor: "text-sky-700",
        divider: "bg-sky-200/80",
        fallbackDetail: "Tüm kayıtların genel görünümü",
    },
    warn: {
        shell: "border-amber-200/80 bg-gradient-to-br from-amber-200/45 via-orange-100/20 to-yellow-100/20",
        card: "border-amber-100/80 bg-white/76",
        edge: "bg-amber-500/75",
        halo: "bg-amber-300/35",
        iconWrap: "border-amber-200/70 bg-amber-100/75",
        iconColor: "text-amber-700",
        divider: "bg-amber-200/80",
        fallbackDetail: "Ödeme bekleyen nakliyeler",
    },
    success: {
        shell: "border-emerald-200/80 bg-gradient-to-br from-emerald-200/40 via-teal-100/20 to-cyan-100/15",
        card: "border-emerald-100/80 bg-white/76",
        edge: "bg-emerald-500/75",
        halo: "bg-emerald-300/35",
        iconWrap: "border-emerald-200/70 bg-emerald-100/75",
        iconColor: "text-emerald-700",
        divider: "bg-emerald-200/80",
        fallbackDetail: "Ödemesi tamamlananlar",
    },
    danger: {
        shell: "border-rose-200/80 bg-gradient-to-br from-rose-200/45 via-red-100/20 to-orange-100/15",
        card: "border-rose-100/80 bg-white/76",
        edge: "bg-rose-500/80",
        halo: "bg-rose-300/35",
        iconWrap: "border-rose-200/70 bg-rose-100/75",
        iconColor: "text-rose-700",
        divider: "bg-rose-200/80",
        fallbackDetail: "Vadesi geçen ödemeler",
    },
} as const;

function StatCard({
    title,
    value,
    tone,
    icon: Icon,
    detail,
}: {
    title: string;
    value: number;
    tone: "neutral" | "warn" | "success" | "danger";
    icon: LucideIcon;
    detail?: string;
}) {
    const s = STAT_STYLES[tone];
    const detailText = detail || s.fallbackDetail;

    return (
        <article
            className={[
                "group relative overflow-hidden rounded-2xl border p-[1px] transition-all duration-200",
                "hover:shadow-[0_8px_22px_rgba(15,23,42,0.08)]",
                s.shell,
            ].join(" ")}
        >
            <div className={["relative rounded-[15px] border px-4 py-3 backdrop-blur-[2px]", s.card].join(" ")}>
                <span className={["pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full", s.edge].join(" ")} />
                <span className={["pointer-events-none absolute -right-7 -top-8 h-20 w-20 rounded-full blur-2xl", s.halo].join(" ")} />

                <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--home-muted)]">{title}</p>
                        <p className="mt-1 text-2xl font-black tabular-nums text-[var(--home-text)]">{value}</p>
                        <div className={["mt-2 h-px w-full", s.divider].join(" ")} />
                        <p className="mt-1.5 truncate text-[11px] font-medium text-[var(--home-muted)]">{detailText}</p>
                    </div>
                    <div className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", s.iconWrap].join(" ")}>
                        <Icon className={["h-5 w-5", s.iconColor].join(" ")} />
                    </div>
                </div>
            </div>
        </article>
    );
}

// ── Summary Stats Grid ────────────────────────────────────

interface SummaryStatsProps {
    summary: ShipmentSummary;
}

export function SummaryStats({ summary }: SummaryStatsProps) {
    return (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
                title="Toplam"
                value={summary.totalCount}
                tone="neutral"
                icon={Package}
                detail={`Ödenen: ${formatPrice(summary.paidAmountTotal)}`}
            />
            <StatCard title="Bekleyen" value={summary.waitingCount} tone="warn" icon={Clock} />
            <StatCard title="Ödendi" value={summary.paidCount} tone="success" icon={CircleDollarSign} />
            <StatCard title="Geciken" value={summary.overdueCount} tone="danger" icon={AlertTriangle} detail="Takip gerektiriyor" />
        </section>
    );
}
