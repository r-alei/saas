import React from 'react';
import { cn } from "@/lib/utils";

interface QuoteItem {
  no: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vat: number;
  total: number;
}

interface QuoteTemplateProps {
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    whatsapp: string;
    email: string;
    logoUrl?: string;
  };
  customerInfo: {
    companyName: string;
    site: string;
    contact: string;
    date: string;
  };
  items: QuoteItem[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  notes: string[];
  partnerLogos?: string[];
}

export const QuoteTemplate: React.FC<QuoteTemplateProps> = ({
  companyInfo,
  customerInfo,
  items,
  subtotal,
  vatTotal,
  grandTotal,
  notes,
  partnerLogos = []
}) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(val);

  return (
    <div className="bg-white min-h-[297mm] w-[210mm] mx-auto p-16 text-slate-900 font-sans shadow-2xl print:shadow-none print:p-12 mb-10" id="quote-document">
      {/* 1. HEADER */}
      <header className="mb-14">
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none mb-2">
              {companyInfo.name}
            </h1>
            <div className="flex flex-col text-[11px] text-slate-500 font-bold uppercase tracking-widest space-y-0.5">
              <span>İnşaat Malzemeleri Tedarik ve Uygulama</span>
              <p className="max-w-md normal-case font-medium tracking-normal text-slate-400 mt-1">
                {companyInfo.address}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end text-right">
            {companyInfo.logoUrl ? (
              <img src={companyInfo.logoUrl} alt="Logo" className="h-14 w-auto object-contain mb-4" />
            ) : (
              <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-slate-200">
                A
              </div>
            )}
            <div className="space-y-1 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-end gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Telefon</span>
                <span>{companyInfo.phone}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">WhatsApp</span>
                <span>{companyInfo.whatsapp}</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-slate-900">
                <span>{companyInfo.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Logos Grid */}
        <div className="grid grid-cols-5 gap-8 py-6 opacity-30 grayscale hover:opacity-60 transition-opacity">
          {partnerLogos.length > 0 ? (
            partnerLogos.map((url, i) => (
              <div key={i} className="flex items-center justify-center p-2 border border-slate-100 rounded">
                <img src={url} alt={`Partner ${i}`} className="max-h-6 w-auto grayscale" />
              </div>
            ))
          ) : (
            ['EGE SERAMİK', 'KÜTAHYA SERAMİK', 'BİEN', 'NG KÜTAHYA', 'YURTBAY'].map((logo, i) => (
              <div key={i} className="flex items-center justify-center py-2 px-1 border border-slate-50 rounded-md">
                <span className="text-[9px] font-black tracking-widest text-slate-400 text-center leading-tight">{logo}</span>
              </div>
            ))
          )}
        </div>
      </header>

      {/* 2. CUSTOMER INFORMATION SECTION */}
      <section className="mb-14">
        <div className="bg-slate-50 border-y border-slate-200 overflow-hidden">
          <table className="w-full text-[13px] border-collapse">
            <tbody>
              <tr>
                <td className="w-24 px-6 py-4 font-black uppercase tracking-tighter text-slate-400 bg-slate-100/50 border-r border-white">Müşteri</td>
                <td className="px-6 py-4 font-bold text-slate-900 text-sm">{customerInfo.companyName}</td>
                <td className="w-24 px-6 py-4 font-black uppercase tracking-tighter text-slate-400 bg-slate-100/50 border-x border-white">Tarih</td>
                <td className="w-32 px-6 py-4 font-bold text-slate-900 text-center">{customerInfo.date}</td>
              </tr>
              <tr className="border-t border-white">
                <td className="px-6 py-4 font-black uppercase tracking-tighter text-slate-400 bg-slate-100/50 border-r border-white">Şantiye</td>
                <td className="px-6 py-4 font-semibold text-slate-600 uppercase text-[11px]">{customerInfo.site}</td>
                <td className="px-6 py-4 font-black uppercase tracking-tighter text-slate-400 bg-slate-100/50 border-x border-white">Temas</td>
                <td className="px-6 py-4 font-bold text-slate-900 text-[11px]">{customerInfo.contact}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. PRODUCT TABLE */}
      <section className="mb-12">
        <table className="w-full text-[11px] border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase tracking-[0.1em]">
              <th className="py-4 px-4 text-left w-12 rounded-tl-sm">No</th>
              <th className="py-4 px-4 text-left w-auto">Ürün Açıklaması / Spesifikasyonlar</th>
              <th className="py-4 px-4 text-right w-24">Miktar</th>
              <th className="py-4 px-4 text-center w-16">Birim</th>
              <th className="py-4 px-4 text-right w-28">Birim Fiyat</th>
              <th className="py-4 px-4 text-right w-16">KDV</th>
              <th className="py-4 px-4 text-right w-32 rounded-tr-sm">Toplam</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 border-x border-b border-slate-200">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 text-slate-400 font-black border-r border-slate-50">{String(item.no).padStart(2, '0')}</td>
                <td className="py-4 px-4 font-bold text-slate-800 text-[12px] leading-snug">
                  {item.description}
                </td>
                <td className="py-4 px-4 text-right font-bold text-slate-600">{item.quantity}</td>
                <td className="py-4 px-4 text-center font-bold text-slate-400 uppercase text-[10px]">{item.unit}</td>
                <td className="py-4 px-4 text-right font-bold text-slate-900">{formatCurrency(item.unitPrice)}</td>
                <td className="py-4 px-4 text-right font-medium text-slate-500">%{item.vat}</td>
                <td className="py-4 px-4 text-right font-black text-slate-900 text-[13px]">{formatCurrency(item.total)}</td>
              </tr>
            ))}
            {/* Minimal spacing row if items are few */}
            {items.length < 6 && Array.from({ length: 6 - items.length }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-12 opacity-20">
                <td className="border-r border-slate-50"></td>
                <td colSpan={6}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 4. TOTALS SECTION */}
      <section className="flex justify-end mb-16">
        <div className="w-80 space-y-0.5">
          <div className="flex justify-between px-6 py-2.5 bg-slate-50 border border-slate-200 text-[13px] rounded-t-lg">
            <span className="font-bold text-slate-400 uppercase tracking-tighter">Ara Toplam</span>
            <span className="font-bold text-slate-700">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between px-6 py-2.5 bg-slate-50 border border-slate-200 text-[13px]">
            <span className="font-bold text-slate-400 uppercase tracking-tighter">KDV (%20)</span>
            <span className="font-bold text-slate-700">{formatCurrency(vatTotal)}</span>
          </div>
          <div className="flex justify-between px-6 py-5 bg-slate-900 text-white rounded-b-lg shadow-xl shadow-slate-200">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Genel Toplam</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase">KDV Dahil</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </section>

      {/* 5. NOTES SECTION */}
      <section className="mb-14 grid grid-cols-2 gap-12">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
            Teklif Notları
          </h3>
          <ul className="space-y-2">
            {notes.map((note, i) => (
              <li key={i} className="text-[10px] leading-relaxed text-slate-500 font-semibold pl-3 border-l-2 border-slate-100">
                {note}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Payment Policy Placeholder */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Sevkiyat ve Palet Politikası</h3>
          <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
            Aksi belirtilmedikçe tüm sevkiyatlar fabrika çıkışlıdır. Palet depozito bedelleri iade edilen paletler için mahsuplaşılır. 
            Kırılma ve fire oranları şantiye kabulünde tutanakla belirlenmelidir.
          </p>
        </div>
      </section>

      {/* 6. SIGNATURE AREA */}
      <section className="grid grid-cols-2 gap-16 pt-12 border-t-2 border-slate-100">
        <div className="text-center group">
          <p className="text-[9px] font-black uppercase text-slate-300 mb-20 tracking-widest transition-colors group-hover:text-slate-400">TEKLİF HAZIRLAYAN (SATICI)</p>
          <div className="w-full border-b border-slate-200 mb-3"></div>
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{companyInfo.name}</p>
        </div>
        <div className="text-center group">
          <p className="text-[9px] font-black uppercase text-slate-300 mb-20 tracking-widest transition-colors group-hover:text-slate-400">ONAYLAYAN (ALICI)</p>
          <div className="w-full border-b border-slate-200 mb-3"></div>
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{customerInfo.companyName}</p>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="mt-16 pt-8 border-t border-slate-50 flex justify-between items-center text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
        <span>ERP GENERATED DOCUMENT</span>
        <span>ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
        <span>PAGE 01/01</span>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @media print {
          body { background: white !important; margin: 0; }
          #quote-document {
            box-shadow: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            border-radius: 0 !important;
          }
          .no-print { display: none !important; }
        }
        
        #quote-document {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};
