"use client";

import React, { useState, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { 
  Plus, Trash2, Printer, Building2, Phone, Mail, 
  MapPin, Calendar, User, Hash, FileText, 
  Truck, Shield, Clock, CheckCircle, CreditCard
} from 'lucide-react';

interface QuoteItem {
  id: string;
  no: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

const UNITS = ["adet", "m²", "paket", "kg", "metretül", "torba", "kova", "set", "ton", "m³"];
const VAT_RATES = [0, 1, 10, 20];

export const QuoteBuilder: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState({
    name: "AKSA İNŞAAT MALZEMELERİ",
    subtitle: "Ticaret ve Sanayi Limited Şirketi",
    address: "Merkez Mah. Atatürk Cad. No:45/A",
    district: "Gaziosmanpaşa / İstanbul",
    phone: "+90 (212) 555 44 33",
    whatsapp: "+90 (532) 111 22 33",
    email: "teklif@aksainsaat.com.tr",
    website: "www.aksainsaat.com.tr",
    taxOffice: "Gaziosmanpaşa",
    taxNumber: "123 456 7890",
  });

  const [customerInfo, setCustomerInfo] = useState({
    companyName: "",
    taxOffice: "",
    taxNumber: "",
    address: "",
    site: "",
    contact: "",
    phone: "",
    date: new Date().toISOString().split('T')[0],
    offerNumber: `TKF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    validityDays: 15,
  });

  const [items, setItems] = useState<QuoteItem[]>([
    { id: crypto.randomUUID(), no: 1, description: "", quantity: 1, unit: "m²", unitPrice: 0, vatRate: 20 }
  ]);

  const [notes, setNotes] = useState([
    "Fiyatlarımıza KDV dahil değildir.",
    "Nakliye alıcıya aittir, şantiye teslimi değildir.",
    "Palet depozitosu ayrıca tahsil edilir.",
    "Ödeme: %50 peşin, %50 teslimatta.",
  ]);

  const [paymentTerms, setPaymentTerms] = useState({
    method: "Havale / EFT",
    bank: "İş Bankası",
    iban: "TR12 3456 7890 1234 5678 9012 34",
  });

  // Calculations
  const calculations = useMemo(() => {
    const itemTotals = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const vatAmount = lineTotal * (item.vatRate / 100);
      return { lineTotal, vatAmount, totalWithVat: lineTotal + vatAmount };
    });

    const subtotal = itemTotals.reduce((sum, curr) => sum + curr.lineTotal, 0);
    const vatTotal = itemTotals.reduce((sum, curr) => sum + curr.vatAmount, 0);
    const grandTotal = subtotal + vatTotal;

    // KDV breakdown
    const vat0Items = items.filter(i => i.vatRate === 0);
    const vat1Items = items.filter(i => i.vatRate === 1);
    const vat10Items = items.filter(i => i.vatRate === 10);
    const vat20Items = items.filter(i => i.vatRate === 20);

    const vat0Total = vat0Items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * 0), 0);
    const vat1Total = vat1Items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * 0.01), 0);
    const vat10Total = vat10Items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * 0.10), 0);
    const vat20Total = vat20Items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * 0.20), 0);

    return { 
      subtotal, 
      vatTotal, 
      grandTotal, 
      itemTotals,
      vatBreakdown: {
        vat0: vat0Total,
        vat1: vat1Total,
        vat10: vat10Total,
        vat20: vat20Total,
      }
    };
  }, [items]);

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      no: items.length + 1,
      description: "",
      quantity: 1,
      unit: "m²",
      unitPrice: 0,
      vatRate: 20
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    const newItems = items.filter(item => item.id !== id).map((item, idx) => ({
      ...item,
      no: idx + 1
    }));
    setItems(newItems);
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getExpiryDate = () => {
    const date = new Date(customerInfo.date);
    date.setDate(date.getDate() + customerInfo.validityDays);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #quote-document {
            box-shadow: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            border-radius: 0 !important;
            min-height: auto !important;
          }
          .print-break { page-break-inside: avoid; }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
        
        #quote-document { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
        }
        
        .gradient-header {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%);
        }
        
        .gradient-accent {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        }
        
        .gradient-total {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
        }
        
        .input-invisible {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          outline: none !important;
          box-shadow: none !important;
        }
        
        .input-invisible:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        
        .input-minimal {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          border-radius: 6px;
          padding: 4px 8px;
        }
        
        .input-minimal:focus {
          border-color: rgba(255,255,255,0.5) !important;
          outline: none;
        }
        
        .table-row-hover:hover {
          background: linear-gradient(90deg, rgba(249,115,22,0.05) 0%, transparent 100%);
        }
      `}</style>

      {/* Floating Action Buttons - No Print */}
      <div className="no-print fixed top-24 right-6 flex flex-col gap-3 z-50 print:hidden">
        <button 
          onClick={handlePrint}
          className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all active:scale-95 hover:scale-105"
        >
          <Printer size={20} className="group-hover:animate-pulse" />
          <span>PDF Oluştur</span>
        </button>
      </div>

      {/* Main Document */}
      <div 
        className="bg-white min-h-[297mm] max-w-[210mm] w-full mx-auto shadow-xl print:shadow-none mb-10 overflow-hidden relative border border-slate-200"
        id="quote-document"
      >
        {/* ========== HEADER SECTION ========== */}
        <header className="gradient-header text-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative px-10 py-8">
            <div className="flex justify-between items-start gap-8">
              {/* Company Info Left */}
              <div className="flex items-start gap-5">
                {/* Logo */}
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-3xl font-black bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">A</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 gradient-accent rounded-full flex items-center justify-center">
                    <Building2 size={12} className="text-white" />
                  </div>
                </div>
                
                {/* Company Details */}
                <div className="py-1">
                  <input 
                    className="input-invisible text-2xl font-black tracking-tight text-white placeholder:text-white/40 w-full"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                    placeholder="FİRMA ADI"
                  />
                  <input 
                    className="input-invisible text-sm font-medium text-white/70 placeholder:text-white/40 w-full"
                    value={companyInfo.subtitle}
                    onChange={(e) => setCompanyInfo({...companyInfo, subtitle: e.target.value})}
                    placeholder="Alt başlık"
                  />
                  
                  <div className="mt-4 space-y-1.5 text-xs text-white/60">
                    <div className="flex items-center gap-2">
                      <MapPin size={11} className="text-orange-400" />
                      <input 
                        className="input-invisible w-64 placeholder:text-white/40"
                        value={companyInfo.address}
                        onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                        placeholder="Adres"
                      />
                      <span className="text-white/40">|</span>
                      <input 
                        className="input-invisible w-40 placeholder:text-white/40"
                        value={companyInfo.district}
                        onChange={(e) => setCompanyInfo({...companyInfo, district: e.target.value})}
                        placeholder="İlçe / İl"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} className="text-orange-400" />
                        <input 
                          className="input-invisible w-32 placeholder:text-white/40"
                          value={companyInfo.phone}
                          onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                          placeholder="Telefon"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail size={11} className="text-orange-400" />
                        <input 
                          className="input-invisible w-44 placeholder:text-white/40"
                          value={companyInfo.email}
                          onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                          placeholder="E-posta"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Offer Info Right */}
              <div className="text-right space-y-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                  <Hash size={14} className="text-orange-400" />
                  <input 
                    className="input-invisible w-28 text-lg font-bold text-white text-right placeholder:text-white/40"
                    value={customerInfo.offerNumber}
                    onChange={(e) => setCustomerInfo({...customerInfo, offerNumber: e.target.value})}
                    placeholder="TEKLİF NO"
                  />
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-end gap-2 text-white/70">
                    <Calendar size={12} className="text-orange-400" />
                    <span>Tarih:</span>
                    <input 
                      type="date"
                      className="input-minimal w-32 text-white text-right"
                      value={customerInfo.date}
                      onChange={(e) => setCustomerInfo({...customerInfo, date: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 text-white/70">
                    <Clock size={12} className="text-orange-400" />
                    <span>Geçerlilik:</span>
                    <input 
                      type="number"
                      className="input-minimal w-12 text-white text-center"
                      value={customerInfo.validityDays}
                      onChange={(e) => setCustomerInfo({...customerInfo, validityDays: parseInt(e.target.value) || 15})}
                    />
                    <span>gün</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Orange Accent Line */}
          <div className="h-1 gradient-accent" />
        </header>

        {/* ========== CUSTOMER INFO SECTION ========== */}
        <section className="px-10 py-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Müşteri Bilgileri</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Company Name */}
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Firma / Müşteri Adı</label>
              <input 
                className="w-full h-10 px-4 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-orange-400 focus:ring-0 transition-colors"
                placeholder="MÜŞTERİ UNVANI"
                value={customerInfo.companyName}
                onChange={(e) => setCustomerInfo({...customerInfo, companyName: e.target.value})}
              />
            </div>
            
            {/* Contact Person */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlgili Kişi</label>
              <input 
                className="w-full h-10 px-4 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-orange-400 focus:ring-0 transition-colors"
                placeholder="Ad Soyad"
                value={customerInfo.contact}
                onChange={(e) => setCustomerInfo({...customerInfo, contact: e.target.value})}
              />
            </div>
            
            {/* Address */}
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adres</label>
              <input 
                className="w-full h-10 px-4 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-600 placeholder:text-slate-300 focus:border-orange-400 focus:ring-0 transition-colors"
                placeholder="Fatura adresi"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
              />
            </div>
            
            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon</label>
              <input 
                className="w-full h-10 px-4 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-600 placeholder:text-slate-300 focus:border-orange-400 focus:ring-0 transition-colors"
                placeholder="+90 5XX XXX XX XX"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              />
            </div>
            
            {/* Site */}
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Şantiye / Proje</label>
              <input 
                className="w-full h-10 px-4 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-600 placeholder:text-slate-300 focus:border-orange-400 focus:ring-0 transition-colors"
                placeholder="Şantiye veya proje adı"
                value={customerInfo.site}
                onChange={(e) => setCustomerInfo({...customerInfo, site: e.target.value})}
              />
            </div>
            
            {/* Tax Info */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">V.D. / V.No</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 h-10 px-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-600 placeholder:text-slate-300 focus:border-orange-400 focus:ring-0 transition-colors"
                  placeholder="Vergi Dairesi"
                  value={customerInfo.taxOffice}
                  onChange={(e) => setCustomerInfo({...customerInfo, taxOffice: e.target.value})}
                />
                <input 
                  className="w-32 h-10 px-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-600 placeholder:text-slate-300 focus:border-orange-400 focus:ring-0 transition-colors"
                  placeholder="V.No"
                  value={customerInfo.taxNumber}
                  onChange={(e) => setCustomerInfo({...customerInfo, taxNumber: e.target.value})}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========== PRODUCTS TABLE ========== */}
        <section className="px-10 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                <FileText size={16} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Ürün / Hizmet Listesi</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{items.length} kalem</span>
          </div>
          
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="gradient-total text-white">
                  <th className="py-3.5 px-3 text-left w-12 font-bold uppercase tracking-wider text-[10px] rounded-tl-xl">No</th>
                  <th className="py-3.5 px-3 text-left font-bold uppercase tracking-wider text-[10px]">Ürün / Hizmet Açıklaması</th>
                  <th className="py-3.5 px-3 text-right w-20 font-bold uppercase tracking-wider text-[10px]">Miktar</th>
                  <th className="py-3.5 px-3 text-center w-20 font-bold uppercase tracking-wider text-[10px]">Birim</th>
                  <th className="py-3.5 px-3 text-right w-28 font-bold uppercase tracking-wider text-[10px]">Birim Fiyat</th>
                  <th className="py-3.5 px-3 text-right w-16 font-bold uppercase tracking-wider text-[10px]">KDV</th>
                  <th className="py-3.5 px-3 text-right w-32 font-bold uppercase tracking-wider text-[10px] rounded-tr-xl">Tutar</th>
                  <th className="no-print py-3.5 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="table-row-hover transition-colors">
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs">
                        {String(item.no).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <input 
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors"
                        placeholder="Ürün adı ve özellikleri..."
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input 
                        type="number"
                        className="w-full h-9 px-2 bg-slate-50 border border-slate-100 rounded-lg text-right text-sm font-bold text-slate-700 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select 
                        className="w-full h-9 px-2 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs font-bold text-slate-500 uppercase focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors cursor-pointer"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      >
                        {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input 
                        type="number"
                        className="w-full h-9 px-2 bg-slate-50 border border-slate-100 rounded-lg text-right text-sm font-bold text-slate-800 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select 
                        className="w-full h-9 px-1 bg-slate-50 border border-slate-100 rounded-lg text-right text-xs font-bold text-slate-600 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors cursor-pointer"
                        value={item.vatRate}
                        onChange={(e) => updateItem(item.id, 'vatRate', parseInt(e.target.value))}
                      >
                        {VAT_RATES.map(rate => <option key={rate} value={rate}>%{rate}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-sm font-bold text-slate-800">
                        {formatCurrency(calculations.itemTotals[idx].lineTotal)}
                      </span>
                    </td>
                    <td className="no-print py-2 px-1 text-center">
                      <button 
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Add Row Button */}
          <button 
            onClick={addItem}
            className="no-print mt-4 flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all font-bold text-xs uppercase tracking-wider"
          >
            <Plus size={16} /> Yeni Satır Ekle
          </button>
        </section>

        {/* ========== TOTALS SECTION ========== */}
        <section className="px-10 py-6">
          <div className="flex justify-end">
            <div className="w-96">
              {/* Totals Grid */}
              <div className="bg-slate-50 rounded-2xl overflow-hidden border-2 border-slate-200">
                {/* Ara Toplam */}
                <div className="flex justify-between items-center px-6 py-3.5 border-b border-slate-200">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ara Toplam</span>
                  <span className="text-base font-bold text-slate-700">{formatCurrency(calculations.subtotal)}</span>
                </div>
                
                {/* KDV Breakdown */}
                {calculations.vatBreakdown.vat20 > 0 && (
                  <div className="flex justify-between items-center px-6 py-2 bg-white border-b border-slate-100">
                    <span className="text-xs text-slate-400">KDV (%20)</span>
                    <span className="text-xs font-bold text-slate-500">{formatCurrency(calculations.vatBreakdown.vat20)}</span>
                  </div>
                )}
                {calculations.vatBreakdown.vat10 > 0 && (
                  <div className="flex justify-between items-center px-6 py-2 bg-white border-b border-slate-100">
                    <span className="text-xs text-slate-400">KDV (%10)</span>
                    <span className="text-xs font-bold text-slate-500">{formatCurrency(calculations.vatBreakdown.vat10)}</span>
                  </div>
                )}
                {calculations.vatBreakdown.vat1 > 0 && (
                  <div className="flex justify-between items-center px-6 py-2 bg-white border-b border-slate-100">
                    <span className="text-xs text-slate-400">KDV (%1)</span>
                    <span className="text-xs font-bold text-slate-500">{formatCurrency(calculations.vatBreakdown.vat1)}</span>
                  </div>
                )}
                
                {/* KDV Toplam */}
                <div className="flex justify-between items-center px-6 py-3.5 border-b border-slate-200 bg-slate-50">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">KDV Toplamı</span>
                  <span className="text-base font-bold text-slate-700">{formatCurrency(calculations.vatTotal)}</span>
                </div>
                
                {/* GENEL TOPLAM */}
                <div className="gradient-total px-6 py-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-white/60">Genel Toplam</span>
                      <span className="block text-[10px] text-white/40 font-medium">KDV Dahil</span>
                    </div>
                    <span className="text-2xl font-black text-white tracking-tight">
                      {formatCurrency(calculations.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Amount in Words */}
              <div className="mt-3 px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-[10px] text-orange-600 font-medium">
                  Yalnız: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(calculations.grandTotal).replace('₺', '')} Türk Lirası
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== NOTES & PAYMENT SECTION ========== */}
        <section className="px-10 py-6 grid grid-cols-2 gap-8">
          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-orange-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teklif Notları</h3>
            </div>
            <div className="space-y-2 no-print">
              {notes.map((note, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <input 
                    className="flex-1 text-xs font-medium text-slate-600 border-none bg-slate-50 p-2 rounded-lg focus:ring-2 focus:ring-orange-200 focus:bg-white transition-colors"
                    value={note}
                    onChange={(e) => {
                      const newNotes = [...notes];
                      newNotes[i] = e.target.value;
                      setNotes(newNotes);
                    }}
                  />
                  <button 
                    onClick={() => setNotes(notes.filter((_, idx) => idx !== i))} 
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setNotes([...notes, ""])} 
                className="text-[10px] font-bold text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-1 mt-2"
              >
                <Plus size={12} /> Not Ekle
              </button>
            </div>
            <ul className="hidden print:block space-y-1.5">
              {notes.filter(n => n).map((note, i) => (
                <li key={i} className="text-[10px] text-slate-500 font-medium flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Payment & Delivery Info */}
          <div className="space-y-4">
            {/* Payment Terms */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-orange-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Ödeme Bilgileri</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Banka:</span>
                  <input 
                    className="input-invisible text-right text-white font-medium w-32"
                    value={paymentTerms.bank}
                    onChange={(e) => setPaymentTerms({...paymentTerms, bank: e.target.value})}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">IBAN:</span>
                  <input 
                    className="input-invisible text-right text-white font-mono text-[10px] w-40"
                    value={paymentTerms.iban}
                    onChange={(e) => setPaymentTerms({...paymentTerms, iban: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            {/* Delivery Info */}
            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Truck size={14} className="text-orange-500" />
                <h3 className="text-xs font-bold text-orange-700 uppercase tracking-wider">Teslimat & Sevkiyat</h3>
              </div>
              <p className="text-[11px] text-orange-700/80 font-medium leading-relaxed">
                Aksi belirtilmedikçe tüm sevkiyatlar şantiye teslimi değildir. 
                Palet depozito bedelleri iade edilen paletler için mahsuplaşılır. 
                Teslim süresi stok durumuna göre 3-7 iş günüdür.
              </p>
            </div>
          </div>
        </section>

        {/* ========== SIGNATURE SECTION ========== */}
        <section className="px-10 py-10 mt-4 border-t-2 border-slate-200">
          <div className="grid grid-cols-2 gap-16">
            {/* Seller Signature */}
            <div className="text-center">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Teklifi Hazırlayan</p>
                <p className="text-xs font-bold text-slate-600">SATICI</p>
              </div>
              <div className="h-12 border-b-2 border-slate-300 mb-4" />
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800">{companyInfo.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {companyInfo.taxOffice} V.D. - {companyInfo.taxNumber}
                </p>
              </div>
            </div>
            
            {/* Buyer Signature */}
            <div className="text-center">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Onaylayan</p>
                <p className="text-xs font-bold text-slate-600">ALICI</p>
              </div>
              <div className="h-12 border-b-2 border-slate-300 mb-4" />
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800">
                  {customerInfo.companyName || "................................................"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Kaşe - İmza
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== FOOTER ========== */}
        <footer className="gradient-header text-white/60 px-10 py-4 mt-auto">
          <div className="flex justify-between items-center text-[9px] font-medium">
            <div className="flex items-center gap-3">
              <span className="uppercase tracking-wider">Bu belge elektronik ortamda oluşturulmuştur</span>
              <span className="text-white/30">|</span>
              <span>{companyInfo.website}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="no-print">{new Date().toLocaleTimeString('tr-TR')}</span>
              <span className="print:hidden">ÖNİZLEME</span>
              <span>Sayfa 1/1</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
