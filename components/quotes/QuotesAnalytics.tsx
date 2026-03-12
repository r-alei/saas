import { BarChart3, Banknote, CheckCircle2, Clock, CreditCard, Landmark, PieChart, ShoppingBag, TrendingUp, User, Users, Wallet } from "lucide-react";
import { QuotesAnalyticsData } from "./types";
import { formatCurrency, formatNumber } from "./utils";

type QuotesAnalyticsProps = {
    analytics: QuotesAnalyticsData;
};

export function QuotesAnalytics({ analytics }: QuotesAnalyticsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Dükkan Analiz & Rapor Merkezi</h2>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Finansal Veriler, Müşteri ve Ürün İstatistikleri</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-blue-300 transition-all">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 text-blue-900">
                        <Landmark size={120} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">Toplam Brüt Gelir</p>
                    <p className="text-3xl font-black text-slate-800 relative z-10">{formatCurrency(analytics.financial.totalRevenue)}</p>
                    <div className="mt-auto pt-4 flex items-center justify-between relative z-10">
                        <span className="text-xs font-semibold text-slate-400">İadeler hariç</span>
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Wallet size={16} /></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-emerald-300 transition-all">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 text-emerald-900">
                        <ShoppingBag size={120} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">Ortalama Sepet Tutarı</p>
                    <p className="text-3xl font-black text-emerald-700 relative z-10">{formatCurrency(analytics.financial.avgOrderValue)}</p>
                    <div className="mt-auto pt-4 flex items-center justify-between relative z-10">
                        <span className="text-xs font-semibold text-slate-400">Fiş başına düşen ciro</span>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Banknote size={16} /></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-indigo-300 transition-all">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 text-indigo-900">
                        <PieChart size={120} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">Vergi & İndirim</p>
                    <div className="space-y-2 mt-1 relative z-10">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-600">Tahsil Edilen KDV</span>
                            <span className="font-bold text-slate-800">{formatCurrency(analytics.financial.totalVat)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-600">Verilen İskonto</span>
                            <span className="font-bold text-red-600">-{formatCurrency(analytics.financial.totalDiscount)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-amber-300 transition-all">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 text-amber-900">
                        <CreditCard size={120} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">Tahsilat Durumu</p>
                    <div className="space-y-2 mt-1 relative z-10">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-600 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Tahsil Edilen</span>
                            <span className="font-bold text-slate-800">{formatCurrency(analytics.financial.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-600 flex items-center gap-1.5"><Clock size={14} className="text-amber-500" /> Bekleyen</span>
                            <span className="font-bold text-amber-600">{formatCurrency(analytics.financial.pendingAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl border border-blue-200 shadow-sm flex flex-col h-[480px] overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                                <Users size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Müşteriler</h3>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Harcama Top 15</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1.5 styled-scrollbar">
                        {analytics.topCustomers.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-6">Kayıt bulunamadı.</p>
                        ) : (
                            analytics.topCustomers.map((cust, idx) => (
                                <div key={`${cust.name}-${idx}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group">
                                <div className="w-8 h-8 shrink-0 rounded flex items-center justify-center bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate" title={cust.name}>{cust.name}</p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">Son Sipariş: {new Date(cust.lastOrder).toLocaleDateString("tr-TR")} • {cust.quoteCount} işlem</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[13px] font-black text-blue-700 bg-white border border-blue-100 shadow-sm px-2.5 py-1 rounded-lg">{formatCurrency(cust.totalAmount)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm flex flex-col h-[480px] overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600">
                                <TrendingUp size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Popüler Ürünler</h3>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Ciro Top 15</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1.5 styled-scrollbar">
                        {analytics.topProducts.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-6">Kayıt bulunamadı.</p>
                        ) : (
                            analytics.topProducts.map((prod, idx) => (
                                <div key={`${prod.name}-${idx}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-bold text-slate-900 truncate flex-1" title={prod.name}>{prod.name}</p>
                                            <span className="text-[8px] uppercase font-black tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">{prod.type === "tile" ? "Fayans" : "Ek Ürün"}</span>
                                        </div>
                                        <p className="text-[10px] font-medium text-slate-500">Miktar: {formatNumber(prod.quantity)} {prod.type === "tile" ? "m2" : "adet"}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[13px] font-black text-indigo-700 bg-white border border-indigo-100 shadow-sm px-2.5 py-1 rounded-lg">{formatCurrency(prod.revenue)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[480px] overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600">
                                <BarChart3 size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Aylık Satış Trendi</h3>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Son 12 Ay</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-5 space-y-5 styled-scrollbar">
                        {analytics.monthlyData.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-6">Veri bulunamadı.</p>
                        ) : (
                            analytics.monthlyData.map((month, index) => {
                                const percentage = analytics.maxMonthlyAmount > 0 ? (month.amount / analytics.maxMonthlyAmount) * 100 : 0;
                                return (
                                    <div key={`${month.monthKey}-${index}`} className="flex flex-col gap-2 relative group">
                                        <div className="flex items-end justify-between">
                                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{month.month}</span>
                                            <span className="text-xs font-black text-slate-800">{formatCurrency(month.amount)}</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/60">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.max(percentage, 2)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-400 text-right">{month.count} işlem kaydedildi</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .styled-scrollbar::-webkit-scrollbar {
                        width: 5px;
                        height: 5px;
                    }
                    .styled-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .styled-scrollbar::-webkit-scrollbar-thumb {
                        background-color: #cbd5e1;
                        border-radius: 10px;
                    }
                    .styled-scrollbar::-webkit-scrollbar-thumb:hover {
                        background-color: #94a3b8;
                    }
                `,
            }} />
        </div>
    );
}