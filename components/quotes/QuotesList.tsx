import React from "react";
import { Calendar, ChevronDown, History, Trash2 } from "lucide-react";
import { CartItem, SavedQuote } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "./utils";

type QuotesListProps = {
    isLoading: boolean;
    quotes: SavedQuote[];
    expandedQuoteId: string | null;
    onToggleExpand: (quoteId: string) => void;
    onDeleteQuote: (event: React.MouseEvent, id: string) => void;
    onStatusChange: (id: string, status: string) => void;
    onLoadQuote: (quote: SavedQuote) => void;
    onEditQuoteInForm: (quote: SavedQuote) => void;
};

export function QuotesList({
    isLoading,
    quotes,
    expandedQuoteId,
    onToggleExpand,
    onDeleteQuote,
    onStatusChange,
    onLoadQuote,
    onEditQuoteInForm,
}: QuotesListProps) {
    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">Yükleniyor...</div>;
    }

    if (quotes.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                <History className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">Kayıtlı fiş bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {quotes.map((quote) => {
                const isExpanded = expandedQuoteId === quote.id;
                const quoteItems = JSON.parse(quote.items) as CartItem[];
                const tileItems = quoteItems.filter((item) => item.itemType !== "extra");
                const totalPackages = tileItems.reduce((acc, item) => acc + item.requiredPackages, 0);
                const totalM2 = tileItems.reduce((acc, item) => acc + item.soldArea, 0);
                const status = quote.status || "Bekliyor";

                return (
                    <div key={quote.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-all hover:border-slate-300">
                        <div
                            onClick={() => onToggleExpand(quote.id)}
                            className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-50 select-none gap-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("p-1.5 rounded transition-transform duration-300", isExpanded ? "text-slate-700 rotate-180" : "text-slate-400")}>
                                    <ChevronDown size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-semibold text-slate-900 flex flex-wrap items-center gap-2">
                                        {quote.customerName}
                                        <span className={cn(
                                            "font-medium px-2 py-0.5 rounded text-xs uppercase tracking-wider",
                                            status === "Ödendi"
                                                ? "bg-green-100 text-green-700"
                                                : status === "İade"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                        )}>{status}</span>
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <Calendar size={12} /> {new Date(quote.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3">
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">{quoteItems.length} Kalem</div>
                                    <div className="text-sm font-bold text-slate-900">{formatCurrency(quote.totalAmount)}</div>
                                </div>
                                <ChevronDown className={cn("text-slate-400 transition-transform hidden md:block", isExpanded ? "rotate-180" : "")} size={18} />
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="border-t border-slate-200 bg-slate-50 p-4 animate-in slide-in-from-top-2">
                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white mb-4">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white text-slate-700 font-semibold text-xs uppercase border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2.5">Ürün / Ebat</th>
                                                <th className="px-4 py-2.5 text-center">Paket</th>
                                                <th className="px-4 py-2.5 text-right">Miktar</th>
                                                <th className="px-4 py-2.5 text-right">Birim Fiyat</th>
                                                <th className="px-4 py-2.5 text-right">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {quoteItems.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium text-slate-900">{item.name}</div>
                                                        <div className="text-xs text-slate-500">{item.specs}</div>
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-xs text-slate-600">{item.itemType === "extra" ? "-" : item.requiredPackages}</td>
                                                    <td className="px-4 py-2 text-right text-slate-700">{item.itemType === "extra" ? `${item.quantity || item.requiredPieces} ${item.unit || "Adet"}` : `${formatNumber(item.soldArea)} m²`}</td>
                                                    <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                                            <tr>
                                                <td className="px-4 py-2.5 text-xs">Toplam</td>
                                                <td className="px-4 py-2.5 text-center text-xs">{totalPackages}</td>
                                                <td className="px-4 py-2.5 text-right text-slate-600">{formatNumber(totalM2)} m²</td>
                                                <td colSpan={1} className="px-4 py-2.5"></td>
                                                <td className="px-4 py-2.5 text-right text-slate-900">{formatCurrency(quote.totalAmount)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-lg border border-slate-200 gap-2">
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded px-2 py-1.5 outline-none hover:border-slate-300 transition-colors cursor-pointer"
                                            value={status}
                                            onChange={(event) => onStatusChange(quote.id, event.target.value)}
                                        >
                                            <option value="Bekliyor">⏳ Bekliyor</option>
                                            <option value="Ödendi">✅ Ödendi</option>
                                            <option value="İade">❌ İade</option>
                                        </select>
                                        <button onClick={(event) => onDeleteQuote(event, quote.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex w-full sm:w-auto gap-2">
                                        <button
                                            onClick={() => onLoadQuote(quote)}
                                            className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all active:scale-[0.98]"
                                        >
                                            POS'a Yükle
                                        </button>
                                        <button
                                            onClick={() => onEditQuoteInForm(quote)}
                                            className="flex-1 sm:flex-none bg-slate-100 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all active:scale-[0.98]"
                                        >
                                            Düzenle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}