"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { 
  Plus, Trash2, Eye, Edit, MoreVertical, 
  CheckCircle2, Clock, XCircle, FileText,
  Building, Calendar, ChevronDown, Download,
  Copy, Send, Archive, RotateCcw
} from 'lucide-react';
import { QuoteBuilder } from './QuoteBuilder';

interface Quote {
  id: string;
  number: string;
  customerName: string;
  site: string;
  date: string;
  amount: number;
  status: 'Bekliyor' | 'Ödendi' | 'İade';
  productTypes: string[];
  items: number;
}

interface QuotesSystemProps {
  searchQuery: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  productTypeFilter: "Tümü" | "Fayans" | "Ek Ürün";
  importOpenExternal?: boolean;
  onImportOpenHandled?: () => void;
}

// Mock Data
const MOCK_QUOTES: Quote[] = [
  { id: '1', number: 'TKF-2024-0001', customerName: 'ABC İnşaat Ltd. Şti.', site: 'Güzeltepe Sitesi', date: '2024-01-15', amount: 125000, status: 'Bekliyor', productTypes: ['Fayans'], items: 5 },
  { id: '2', number: 'TKF-2024-0002', customerName: 'XYZ Mühendislik', site: 'Merkez Plaza', date: '2024-01-14', amount: 85000, status: 'Ödendi', productTypes: ['Fayans', 'Ek Ürün'], items: 8 },
  { id: '3', number: 'TKF-2024-0003', customerName: 'Defne Yapı', site: 'Yeşil Vadi Konutları', date: '2024-01-13', amount: 45000, status: 'İade', productTypes: ['Ek Ürün'], items: 3 },
  { id: '4', number: 'TKF-2024-0004', customerName: 'Nova İnşaat', site: 'Sapphire Tower', date: '2024-01-12', amount: 280000, status: 'Ödendi', productTypes: ['Fayans'], items: 12 },
  { id: '5', number: 'TKF-2024-0005', customerName: 'Atlas Proje', site: 'Marina Evleri', date: '2024-01-11', amount: 165000, status: 'Bekliyor', productTypes: ['Fayans', 'Ek Ürün'], items: 6 },
];

export const QuotesSystem: React.FC<QuotesSystemProps> = ({
  searchQuery,
  statusFilter,
  dateFrom,
  dateTo,
  minAmount,
  maxAmount,
  productTypeFilter,
  importOpenExternal,
  onImportOpenHandled,
}) => {
  const [quotes] = useState<Quote[]>(MOCK_QUOTES);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filter quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Search filter
      if (searchQuery && !quote.customerName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== "Tümü" && quote.status !== statusFilter) {
        return false;
      }
      
      // Date filter
      if (dateFrom && new Date(quote.date) < new Date(dateFrom)) {
        return false;
      }
      if (dateTo && new Date(quote.date) > new Date(dateTo)) {
        return false;
      }
      
      // Amount filter
      if (minAmount && quote.amount < parseFloat(minAmount)) {
        return false;
      }
      if (maxAmount && quote.amount > parseFloat(maxAmount)) {
        return false;
      }
      
      // Product type filter
      if (productTypeFilter !== "Tümü" && !quote.productTypes.includes(productTypeFilter)) {
        return false;
      }
      
      return true;
    });
  }, [quotes, searchQuery, statusFilter, dateFrom, dateTo, minAmount, maxAmount, productTypeFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = quotes.reduce((sum, q) => sum + q.amount, 0);
    const paid = quotes.filter(q => q.status === 'Ödendi').reduce((sum, q) => sum + q.amount, 0);
    const pending = quotes.filter(q => q.status === 'Bekliyor').reduce((sum, q) => sum + q.amount, 0);
    const refunded = quotes.filter(q => q.status === 'İade').reduce((sum, q) => sum + q.amount, 0);
    
    return { total, paid, pending, refunded, count: quotes.length };
  }, [quotes]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

  const getStatusConfig = (status: Quote['status']) => {
    switch (status) {
      case 'Ödendi':
        return { 
          bg: 'bg-emerald-50', 
          text: 'text-emerald-700', 
          border: 'border-emerald-200',
          icon: CheckCircle2 
        };
      case 'Bekliyor':
        return { 
          bg: 'bg-amber-50', 
          text: 'text-amber-700', 
          border: 'border-amber-200',
          icon: Clock 
        };
      case 'İade':
        return { 
          bg: 'bg-red-50', 
          text: 'text-red-700', 
          border: 'border-red-200',
          icon: XCircle 
        };
    }
  };

  // If showing builder, render it
  if (showBuilder || selectedQuote) {
    return (
      <div className="relative">
        <button 
          onClick={() => { setShowBuilder(false); setSelectedQuote(null); }}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RotateCcw size={16} />
          Listeye Dön
        </button>
        <QuoteBuilder />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-orange-300 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileText size={18} className="text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Teklif</p>
              <p className="text-xl font-black text-slate-800">{stats.count}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ödenen</p>
              <p className="text-xl font-black text-emerald-600">{formatCurrency(stats.paid)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-amber-300 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bekleyen</p>
              <p className="text-xl font-black text-amber-600">{formatCurrency(stats.pending)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Ciro</p>
              <p className="text-xl font-black text-blue-600">{formatCurrency(stats.total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Teklif Listesi</h2>
        <button 
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all"
        >
          <Plus size={16} />
          Yeni Teklif Oluştur
        </button>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teklif No</th>
                <th className="py-4 px-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Müşteri</th>
                <th className="py-4 px-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Şantiye</th>
                <th className="py-4 px-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tarih</th>
                <th className="py-4 px-5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tutar</th>
                <th className="py-4 px-5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="py-4 px-5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((quote) => {
                const statusConfig = getStatusConfig(quote.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr 
                    key={quote.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-800">{quote.number}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-semibold text-slate-700">{quote.customerName}</p>
                        <p className="text-xs text-slate-400">{quote.items} kalem</p>
                      </div>
                    </td>
                    <td className="py-4 px-5 hidden lg:table-cell">
                      <span className="text-slate-600">{quote.site}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={12} />
                        <span>{new Date(quote.date).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className="font-bold text-slate-800">{formatCurrency(quote.amount)}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border",
                          statusConfig.bg, statusConfig.text, statusConfig.border
                        )}>
                          <StatusIcon size={12} />
                          {quote.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedQuote(quote); }}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Görüntüle"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); }}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); }}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="PDF İndir"
                        >
                          <Download size={16} />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveDropdown(activeDropdown === quote.id ? null : quote.id);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeDropdown === quote.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                              <button className="w-full px-4 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                <Copy size={14} /> Kopyala
                              </button>
                              <button className="w-full px-4 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                <Send size={14} /> Gönder
                              </button>
                              <button className="w-full px-4 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                <Archive size={14} /> Arşivle
                              </button>
                              <hr className="my-2 border-slate-100" />
                              <button className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Trash2 size={14} /> Sil
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredQuotes.length === 0 && (
          <div className="py-16 text-center">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Sonuç bulunamadı</p>
            <p className="text-xs text-slate-300 mt-1">Farklı filtreler deneyin</p>
          </div>
        )}
      </div>
    </div>
  );
};
