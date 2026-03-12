"use client";

import { useState, useMemo, useCallback } from "react";
import { QuotesSystem } from "@/components/QuotesSystem";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Search, Clock, Calendar, Banknote, Package, Plus, CheckCircle2, XCircle, Filter } from "lucide-react";

export default function QuotesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("Tümü");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [productTypeFilter, setProductTypeFilter] = useState<"Tümü" | "Fayans" | "Ek Ürün">("Tümü");
    const [importOpen, setImportOpen] = useState(false);
    const handleImportHandled = useCallback(() => setImportOpen(false), []);

    return (
        <div className="min-h-screen bg-[var(--home-bg)] text-[var(--home-text)] flex flex-col">
            <Header />
            
            <div className="flex flex-1">
            {/* Sticky Sidebar */}
            <aside 
                className="hidden lg:block shrink-0 w-80 sticky top-[var(--header-h)] self-start z-40"
                style={{
                    height: "calc(100vh - var(--header-h))",
                    ["--header-h" as string]: "0px",
                }}
                ref={(el) => {
                    if (el) {
                        const header = document.querySelector('header');
                        if (header) {
                            const h = header.offsetHeight + 'px';
                            el.style.setProperty('--header-h', h);
                            el.style.top = h;
                            el.style.height = `calc(100vh - ${h})`;
                        }
                    }
                }}
            >
              <div className="h-full bg-white py-5 pl-5 pr-4 flex flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* Eski Fiş Ekle */}
                <button
                    onClick={() => setImportOpen(true)}
                    className="w-full mb-5 px-3 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus size={16} /> Eski Fiş Ekle
                </button>

                {/* Sidebar Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-5 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                            <Filter size={14} />
                        </div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filtreler</h3>
                    </div>

                    {/* Arama */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                            <Search size={13} /> Müşteri Ara
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <Input
                                placeholder="İsim yazın..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 w-full bg-white border-slate-200 rounded-lg focus-visible:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Durum */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                            <Clock size={13} /> Durum
                        </label>
                        <div className="flex flex-col gap-1.5">
                            {["Tümü", "Bekliyor", "Ödendi", "İade"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "px-3 py-2 text-sm font-medium rounded-lg transition-all text-left flex items-center gap-2",
                                        statusFilter === status
                                            ? status === "Tümü" ? "bg-blue-600 text-white shadow-sm" :
                                              status === "Bekliyor" ? "bg-yellow-500 text-white shadow-sm" :
                                              status === "Ödendi" ? "bg-emerald-500 text-white shadow-sm" :
                                              "bg-red-500 text-white shadow-sm"
                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    {status === "Tümü" && "Tümü"}
                                    {status === "Bekliyor" && <><Clock size={14} /> Bekleyen</>}
                                    {status === "Ödendi" && <><CheckCircle2 size={14} /> Ödendi</>}
                                    {status === "İade" && <><XCircle size={14} /> İade</>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tarih Aralığı */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                            <Calendar size={13} /> Tarih Aralığı
                        </label>
                        <div className="space-y-1.5">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Tutar Aralığı */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                            <Banknote size={13} /> Tutar Aralığı
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Min ₺"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                placeholder="Max ₺"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Ürün Tipi */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                            <Package size={13} /> Ürün Tipi
                        </label>
                        <div className="flex flex-col gap-1.5">
                            {["Tümü", "Fayans", "Ek Ürün"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setProductTypeFilter(type as "Tümü" | "Fayans" | "Ek Ürün")}
                                    className={cn(
                                        "px-3 py-2 text-sm font-medium rounded-lg transition-all text-left",
                                        productTypeFilter === type
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Temizle */}
                <div className="pt-4">
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("Tümü");
                            setDateFrom("");
                            setDateTo("");
                            setMinAmount("");
                            setMaxAmount("");
                            setProductTypeFilter("Tümü");
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Filtreleri Temizle
                    </button>
                </div>
              </div>
            </aside>

            <main className="flex-1 min-w-0 py-8 px-4 sm:px-6 lg:px-8 bg-[var(--home-bg)]">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <QuotesSystem 
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        minAmount={minAmount}
                        maxAmount={maxAmount}
                        productTypeFilter={productTypeFilter}
                        importOpenExternal={importOpen}
                        onImportOpenHandled={handleImportHandled}
                    />
                </div>
            </main>
            </div>
        </div>
    );
}
