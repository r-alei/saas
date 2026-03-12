"use client";

import {
    Filter,
    Clock,
    CircleDollarSign,
    AlertTriangle,
    type LucideIcon,
} from "lucide-react";
import { StatusFilter, ShipmentSummary } from "./constants";

// ── FilterTab ─────────────────────────────────────────────

function FilterTab({
    label,
    count,
    icon: Icon,
    active,
    activeClass,
    inactiveClass,
    onClick,
}: {
    label: string;
    count: number;
    icon: LucideIcon;
    active: boolean;
    activeClass: string;
    inactiveClass?: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                active ? activeClass : (inactiveClass || "text-gray-600 hover:bg-gray-100"),
            ].join(" ")}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <span className={[
                "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                active ? "bg-white/25" : "bg-black/5",
            ].join(" ")}>
                {count}
            </span>
        </button>
    );
}

// ── FilterTabs ────────────────────────────────────────────

interface FilterTabsProps {
    statusFilter: StatusFilter;
    onFilterChange: (filter: StatusFilter) => void;
    summary: ShipmentSummary;
}

export function FilterTabs({ statusFilter, onFilterChange, summary }: FilterTabsProps) {
    return (
        <div className="mb-4 inline-flex rounded-xl border border-[var(--home-border)] bg-white/60 p-1 gap-1 flex-wrap">
            <FilterTab
                label="Tümü"
                count={summary.totalCount}
                icon={Filter}
                active={statusFilter === "all"}
                activeClass="bg-[var(--home-accent)] text-white shadow-md"
                onClick={() => onFilterChange("all")}
            />
            <FilterTab
                label="Bekleyen"
                count={summary.waitingCount}
                icon={Clock}
                active={statusFilter === "Bekliyor"}
                activeClass="bg-amber-500 text-white shadow-md"
                inactiveClass="text-amber-700 hover:bg-amber-50"
                onClick={() => onFilterChange("Bekliyor")}
            />
            <FilterTab
                label="Odendi"
                count={summary.paidCount}
                icon={CircleDollarSign}
                active={statusFilter === "Ödendi"}
                activeClass="bg-emerald-500 text-white shadow-md"
                inactiveClass="text-emerald-700 hover:bg-emerald-50"
                onClick={() => onFilterChange("Ödendi")}
            />
            <FilterTab
                label="Geciken"
                count={summary.overdueCount}
                icon={AlertTriangle}
                active={statusFilter === "overdue"}
                activeClass="bg-red-500 text-white shadow-md"
                inactiveClass="text-red-700 hover:bg-red-50"
                onClick={() => onFilterChange("overdue")}
            />
        </div>
    );
}
