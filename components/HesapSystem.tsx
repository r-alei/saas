"use client";

import * as React from "react";
import { Calculator, Layers, BrickWall, Grid3x3, Package, Ruler, Info } from "lucide-react";
import { NumberInput } from "@/components/ui/NumberInput";
import {
    CalculationMode,
    calculateHesapResult,
    getPackageArea,
} from "@/lib/hesap-calculations";
import { cn } from "@/lib/utils";

type HesapState = {
    mode: CalculationMode;
    width: number;
    length: number;
    height: number;
    includeWalls: boolean;
    manualArea: number;
    manualMetres: number;
    tileWidth: number;
    tileLength: number;
    unitPrice: number;
};

const MODES: { id: CalculationMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dimensions", label: "Ölçülerden", icon: Layers },
    { id: "direct", label: "Direkt m²", icon: Calculator },
];

const PRESETS = [
    [45, 45], [58, 58], [60, 60], [60, 120], [30, 90], [30, 75], [30, 60],
] as const;

const fmt = (v: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(v || 0);
const fmtTL = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(v || 0);

export function HesapSystem() {
    const [s, setS] = React.useState<HesapState>({
        mode: "dimensions", width: 0, length: 0, height: 2.6,
        includeWalls: false, manualArea: 0, manualMetres: 0,
        tileWidth: 60, tileLength: 120, unitPrice: 0,
    });

    const r = React.useMemo(() => calculateHesapResult(s), [s]);
    const pkgArea = React.useMemo(() => getPackageArea(s.tileWidth, s.tileLength), [s.tileWidth, s.tileLength]);

    const isPreset = PRESETS.some(([w, l]) => s.tileWidth === w && s.tileLength === l);

    const ok = React.useMemo(() => {
        if (s.tileWidth <= 0 || s.tileLength <= 0 || s.unitPrice <= 0) return false;
        if (s.mode === "direct") return s.manualArea > 0;
        if (s.width <= 0 || s.length <= 0) return false;
        return !(s.includeWalls && s.height <= 0);
    }, [s]);

    const set = (key: keyof HesapState, v: number) =>
        setS((p) => ({ ...p, [key]: Number.isFinite(v) ? v : 0 }));

    return (
        <div className="max-w-5xl mx-auto rounded-3xl bg-[var(--home-surface)] border border-[var(--home-border)]/40 shadow-sm overflow-hidden">

            {/* ── Mod Seçici ── */}
            <div className="flex border-b border-[var(--home-border)]/30">
                {MODES.map((m) => {
                    const Icon = m.icon;
                    const on = s.mode === m.id;
                    return (
                        <button key={m.id} type="button"
                            onClick={() => setS((p) => ({ ...p, mode: m.id }))}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all relative",
                                on ? "text-[var(--home-accent)]" : "text-[var(--home-muted)] hover:text-[var(--home-text)] hover:bg-[var(--home-surface-soft)]/40"
                            )}>
                            <Icon className="h-4 w-4" />
                            {m.label}
                            {on && (
                                <span className="absolute bottom-0 left-4 right-4 h-[3px] rounded-t-full bg-[var(--home-accent)]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Ana İçerik: Sol girişler + Sağ sonuç ── */}
            <div className="grid lg:grid-cols-[1fr_300px]">

                {/* ── Sol: Girişler ── */}
                <div className="p-6 sm:p-8 space-y-8 lg:border-r lg:border-[var(--home-border)]/30">

                    {/* Alan Girişi */}
                    <div className="space-y-4">
                        <SectionLabel icon={Ruler} label="Alan Bilgisi"
                            badge={s.mode === "dimensions" && s.width > 0 && s.length > 0 ? `${fmt(s.width * s.length)} m²` : undefined}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            {s.mode === "dimensions" && (
                                <>
                                    <NumberInput label="En (m)" value={s.width} step={0.1} min={0} onChange={(v) => set("width", v)} />
                                    <NumberInput label="Boy (m)" value={s.length} step={0.1} min={0} onChange={(v) => set("length", v)} />
                                    <label className="sm:col-span-2 flex items-center gap-3 py-2.5 px-4 rounded-xl bg-[var(--home-surface-soft)]/50 cursor-pointer select-none transition-colors hover:bg-[var(--home-surface-soft)]">
                                        <span className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                                            s.includeWalls ? "bg-[var(--home-accent)]" : "bg-[var(--home-border)]")}>
                                            <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                                                s.includeWalls ? "translate-x-[22px]" : "translate-x-[3px]")} />
                                            <input type="checkbox" checked={s.includeWalls} onChange={(e) => setS((p) => ({ ...p, includeWalls: e.target.checked }))} className="sr-only" />
                                        </span>
                                        <BrickWall className="h-4 w-4 text-[var(--home-muted)]" />
                                        <span className="text-sm font-medium text-[var(--home-text)]">Duvarları dahil et</span>
                                    </label>
                                    {s.includeWalls && (
                                        <div className="sm:col-span-2">
                                            <NumberInput label="Yükseklik (m)" value={s.height} step={0.1} min={0} onChange={(v) => set("height", v)} />
                                        </div>
                                    )}
                                </>
                            )}
                            {s.mode === "direct" && (
                                <>
                                    <NumberInput label="Toplam Alan (m²)" value={s.manualArea} step={0.1} min={0} compact onChange={(v) => set("manualArea", v)} />
                                    <NumberInput label="₺ / m²" value={s.unitPrice} min={0} step={1} compact onChange={(v) => set("unitPrice", v)} />
                                </>
                            )}
                        </div>
                    </div>

                    <hr className="border-[var(--home-border)]/25" />

                    {/* Karo Seçimi */}
                    <div className="space-y-4">
                        <SectionLabel icon={Grid3x3} label="Karo Boyutu" />
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {PRESETS.map(([w, l]) => {
                                const on = s.tileWidth === w && s.tileLength === l;
                                const area = getPackageArea(w, l);
                                return (
                                    <button key={`${w}${l}`} type="button"
                                        onClick={() => setS((p) => ({ ...p, tileWidth: w, tileLength: l }))}
                                        className={cn(
                                            "flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all duration-200 border-2",
                                            on
                                                ? "border-[var(--home-accent)] bg-[var(--home-accent)]/[0.07] shadow-sm"
                                                : "border-transparent bg-[var(--home-surface-soft)] hover:border-[var(--home-border)]/50"
                                        )}>
                                        <span className={cn("text-[13px] font-bold", on ? "text-[var(--home-accent)]" : "text-[var(--home-text)]")}>{w}×{l}</span>
                                        <span className={cn("text-[10px] font-medium leading-tight", on ? "text-[var(--home-accent)]/60" : "text-[var(--home-muted)]")}>{fmt(area)} m²</span>
                                    </button>
                                );
                            })}
                        </div>
                        {!isPreset && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <NumberInput label="Karo En (cm)" value={s.tileWidth} min={1} onChange={(v) => set("tileWidth", v)} />
                                <NumberInput label="Karo Boy (cm)" value={s.tileLength} min={1} onChange={(v) => set("tileLength", v)} />
                            </div>
                        )}
                        <p className="flex items-start gap-1.5 text-[11px] text-[var(--home-muted)] leading-relaxed">
                            <Info className="h-3 w-3 mt-0.5 shrink-0 opacity-50" />
                            Paket alanları tanımlı boyutlar için otomatik hesaplanır.
                        </p>
                    </div>

                    {s.mode !== "direct" && (
                        <>
                            <hr className="border-[var(--home-border)]/25" />
                            <div className="space-y-4">
                                <SectionLabel icon={Package} label="Birim Fiyat" />
                                <div className="max-w-xs">
                                    <NumberInput label="₺ / m²" value={s.unitPrice} min={0} step={1} compact onChange={(v) => set("unitPrice", v)} />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Sağ: Sonuç Paneli ── */}
                <aside className="lg:sticky lg:top-0 self-start p-5 space-y-3 bg-[var(--home-surface-soft)]/30">
                    <SectionLabel icon={Calculator} label="Sonuç" />

                    <div className="space-y-2 pt-1">
                        <ResultRow label="Karo" value={r.tileSpec} dim={!ok} />
                        <ResultRow label="Paket alanı" value={`${fmt(pkgArea)} m²`} dim={!ok} />
                        <ResultRow label="Gereken alan" value={`${fmt(r.requiredArea)} m²`} dim={!ok} />
                        <ResultRow label="Paket sayısı" value={fmt(r.requiredPackages)} dim={!ok} accent />
                        <ResultRow label="Satılan alan" value={`${fmt(r.soldArea)} m²`} dim={!ok} />
                    </div>

                    {/* Toplam */}
                    <div className={cn(
                        "relative rounded-2xl p-5 text-center transition-all duration-300 overflow-hidden mt-2",
                        ok
                            ? "bg-gradient-to-br from-[var(--home-accent)] to-[var(--home-accent-strong)] shadow-lg shadow-[var(--home-accent)]/20"
                            : "bg-[var(--home-surface-soft)]"
                    )}>
                        {ok && (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.15),transparent_55%)]" />
                        )}
                        <p className={cn(
                            "relative text-[10px] font-bold uppercase tracking-[0.2em]",
                            ok ? "text-white/50" : "text-[var(--home-muted)]"
                        )}>Toplam Tutar</p>
                        <p className={cn(
                            "relative text-2xl font-extrabold mt-1 tracking-tight",
                            ok ? "text-white" : "text-[var(--home-text)] opacity-25"
                        )}>{fmtTL(r.totalPrice)}</p>
                        {ok && r.requiredPackages > 0 && (
                            <p className="relative text-[10px] text-white/40 mt-1.5 font-medium">
                                {fmt(r.requiredPackages)} paket × {fmtTL(pkgArea * s.unitPrice)}/pkt
                            </p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

function SectionLabel({ icon: Icon, label, badge }: { icon: React.ComponentType<{ className?: string }>; label: string; badge?: string }) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-[var(--home-accent)]" />
            <h3 className="text-sm font-bold text-[var(--home-text)]">{label}</h3>
            {badge && <span className="ml-auto text-xs font-semibold text-[var(--home-accent)] tabular-nums">{badge}</span>}
        </div>
    );
}

function ResultRow({ label, value, dim, accent }: { label: string; value: string; dim?: boolean; accent?: boolean }) {
    return (
        <div className={cn("flex items-center justify-between py-2 px-3 rounded-lg transition-all text-sm", dim && "opacity-30", accent && !dim && "bg-[var(--home-accent)]/[0.06]")}>
            <span className="text-[var(--home-muted)]">{label}</span>
            <span className={cn("font-bold tabular-nums", accent && !dim ? "text-[var(--home-accent)]" : "text-[var(--home-text)]")}>{value}</span>
        </div>
    );
}
