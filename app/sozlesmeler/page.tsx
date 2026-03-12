"use client";

import React from 'react';
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder';
import { Header } from '@/components/Header';
import { Printer, Share2, Download, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function SozlesmelerPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="no-print">
        <Header />
      </div>

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Action Bar */}
          <div className="mb-6 flex items-center justify-between no-print">
            <div className="flex items-center gap-4">
              <Link href="/pos/quotes" className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-all">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kurumsal Teklif Oluşturucu</h1>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Interaktif ERP Modülü</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
              >
                <Share2 size={16} /> Paylaş
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
              >
                <Download size={16} /> Taslağı İndir
              </button>
            </div>
          </div>

          {/* Builder Canvas */}
          <div className="flex justify-center py-4 print:py-0">
            <QuoteBuilder />
          </div>
        </div>
      </main>

      <div className="no-print h-20 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border-t border-slate-200">
        AKSA İNŞAAT KURUMSAL TEKLİF SİSTEMİ v1.0
      </div>
    </div>
  );
}
