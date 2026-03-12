import { Dispatch, SetStateAction, useState, useRef, useEffect, useMemo } from "react";
import { Plus, Save, Trash2, X, Package, Ruler, Hash, DollarSign, Calendar, User, Tag, Percent, Search, ChevronDown } from "lucide-react";
import { ProductOption } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { HistoricalItemDraft } from "./types";
import { formatCurrency, HISTORICAL_UNIT_OPTIONS, parseNumericInput } from "./utils";
import { NumberInput } from "@/components/ui/NumberInput";

type HistoricalQuoteModalProps = {
    isOpen: boolean;
    onClose: () => void;
    editingHistoricalQuoteId: string | null;
    tileOptions: ProductOption[];
    extraOptions: ProductOption[];
    isProductsLoading: boolean;
    showProductManager: boolean;
    setShowProductManager: Dispatch<SetStateAction<boolean>>;
    isCreatingProduct: boolean;
    newProductName: string;
    setNewProductName: Dispatch<SetStateAction<string>>;
    newProductCategory: "Fayans" | "Ek Ürün";
    setNewProductCategory: Dispatch<SetStateAction<"Fayans" | "Ek Ürün">>;
    newProductVariantName: string;
    setNewProductVariantName: Dispatch<SetStateAction<string>>;
    newProductUnit: string;
    setNewProductUnit: Dispatch<SetStateAction<string>>;
    newProductSpecs: string;
    setNewProductSpecs: Dispatch<SetStateAction<string>>;
    newProductPrice: string;
    setNewProductPrice: Dispatch<SetStateAction<string>>;
    onCreateProduct: () => void;
    onCancelProductManager: () => void;
    historicalCustomerName: string;
    setHistoricalCustomerName: Dispatch<SetStateAction<string>>;
    historicalStatus: string;
    setHistoricalStatus: Dispatch<SetStateAction<string>>;
    historicalCreatedAt: string;
    setHistoricalCreatedAt: Dispatch<SetStateAction<string>>;
    historicalDiscountAmount: string;
    setHistoricalDiscountAmount: Dispatch<SetStateAction<string>>;
    historicalVatRate: string;
    setHistoricalVatRate: Dispatch<SetStateAction<string>>;
    historicalItems: HistoricalItemDraft[];
    updateHistoricalItem: (index: number, field: keyof HistoricalItemDraft, value: string) => void;
    removeHistoricalItem: (index: number) => void;
    addHistoricalItem: () => void;
    historicalTotal: number;
    discountValue: number;
    historicalVatAmount: number;
    historicalGrandTotal: number;
    onCancelEdit: () => void;
    onSave: () => void;
    isSavingHistorical: boolean;
};

export function HistoricalQuoteModal(props: HistoricalQuoteModalProps) {
    const {
        isOpen,
        onClose,
        editingHistoricalQuoteId,
        tileOptions,
        extraOptions,
        isProductsLoading,
        showProductManager,
        setShowProductManager,
        isCreatingProduct,
        newProductName,
        setNewProductName,
        newProductCategory,
        setNewProductCategory,
        newProductVariantName,
        setNewProductVariantName,
        newProductUnit,
        setNewProductUnit,
        newProductSpecs,
        setNewProductSpecs,
        newProductPrice,
        setNewProductPrice,
        onCreateProduct,
        onCancelProductManager,
        historicalCustomerName,
        setHistoricalCustomerName,
        historicalStatus,
        setHistoricalStatus,
        historicalCreatedAt,
        setHistoricalCreatedAt,
        historicalDiscountAmount,
        setHistoricalDiscountAmount,
        historicalVatRate,
        setHistoricalVatRate,
        historicalItems,
        updateHistoricalItem,
        removeHistoricalItem,
        addHistoricalItem,
        historicalTotal,
        discountValue,
        historicalVatAmount,
        historicalGrandTotal,
        onCancelEdit,
        onSave,
        isSavingHistorical,
    } = props;

    const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownIdx(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectProduct = (idx: number, opt: ProductOption) => {
        updateHistoricalItem(idx, "productId", opt.id);
        setOpenDropdownIdx(null);
        setSearchQuery("");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden bg-[var(--home-surface)] rounded-3xl border border-[var(--home-border)] shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--home-border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[var(--home-accent)]/10 text-[var(--home-accent)]">
                            <Save size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--home-text)] tracking-tight">
                                {editingHistoricalQuoteId ? "Geçmiş Fişi Düzenle" : "Yeni Geçmiş Fiş Ekle"}
                            </h2>
                            <p className="text-[11px] text-[var(--home-muted)] font-medium">
                                Eski satış kayıtlarını sisteme dahil edin.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-[var(--home-surface-soft)] text-[var(--home-muted)] hover:text-white hover:bg-red-500 transition-all active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* General Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--home-muted)] ml-1">
                                <User size={14} className="text-[var(--home-accent)]" />
                                Müşteri Adı
                            </label>
                            <Input
                                value={historicalCustomerName}
                                onChange={(e) => setHistoricalCustomerName(e.target.value)}
                                placeholder="Müşteri adı ve soyadı..."
                                className="h-10 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--home-muted)] ml-1">
                                <Tag size={14} className="text-[var(--home-accent)]" />
                                Durum
                            </label>
                            <div className="relative">
                                <select
                                    value={historicalStatus}
                                    onChange={(e) => setHistoricalStatus(e.target.value)}
                                    className="w-full h-10 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-3 text-sm text-[var(--home-text)] focus:ring-2 focus:ring-[var(--home-accent)] outline-none appearance-none transition-all cursor-pointer hover:border-[var(--home-accent)]/50"
                                >
                                    <option value="Bekliyor">Bekliyor</option>
                                    <option value="Ödendi">Ödendi</option>
                                    <option value="İade">İade</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--home-muted)]">
                                    <Plus size={16} className="rotate-45" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--home-muted)] ml-1">
                                <Calendar size={14} className="text-[var(--home-accent)]" />
                                Fiş Tarihi
                            </label>
                            <Input
                                type="date"
                                value={historicalCreatedAt}
                                onChange={(e) => setHistoricalCreatedAt(e.target.value)}
                                className="h-10 rounded-xl"
                            />
                        </div>

                        <div className="flex items-end flex-col justify-end">
                            <button
                                onClick={() => setShowProductManager(!showProductManager)}
                                className={cn(
                                    "flex items-center justify-center gap-2 h-10 w-full rounded-xl font-bold transition-all active:scale-95 shadow-sm border",
                                    showProductManager 
                                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                                        : "bg-[var(--home-accent)]/10 text-[var(--home-accent)] border-[var(--home-accent)]/20 hover:bg-[var(--home-accent)]/20"
                                )}
                            >
                                <Package size={16} />
                                {showProductManager ? "Katalogu Kapat" : "Yeni Ürün Kaydet"}
                            </button>
                        </div>
                    </div>

                    {/* Product Manager Section */}
                    {showProductManager && (
                        <div className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 space-y-3 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3 text-amber-700 font-bold mb-2">
                                <div className="p-1.5 rounded-lg bg-amber-500/10">
                                    <Plus size={16} />
                                </div>
                                <span className="text-base">Ürün Kataloğuna Yeni Ürün Ekle</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700/60 ml-1">
                                        <Tag size={12} />
                                        Ürün Adı
                                    </label>
                                    <Input
                                        value={newProductName}
                                        onChange={(e) => setNewProductName(e.target.value)}
                                        placeholder="Örn: Seramik 60x120"
                                        className="h-9 rounded-xl border-amber-500/20 focus:ring-amber-500 font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5 min-w-[200px]">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700/60 ml-1">
                                        <Package size={12} />
                                        Kategori
                                    </label>
                                    <div className="relative flex p-1 gap-1 bg-amber-500/5 rounded-xl border border-amber-500/10 h-9 shadow-inner">
                                        {/* Sliding indicator background */}
                                        <div 
                                            className={cn(
                                                "absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-10",
                                                newProductCategory === "Ek Ürün" && "translate-x-full"
                                            )}
                                        />
                                        <button
                                            onClick={() => setNewProductCategory("Fayans")}
                                            className={cn(
                                                "relative z-20 flex-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-1.5 flex items-center justify-center",
                                                newProductCategory === "Fayans" 
                                                    ? "text-amber-700" 
                                                    : "text-amber-700/40 hover:text-amber-700/70"
                                            )}
                                        >
                                            <Plus size={12} className={cn("transition-transform", newProductCategory === "Fayans" && "rotate-45")} />
                                            Fayans
                                        </button>
                                        <button
                                            onClick={() => setNewProductCategory("Ek Ürün")}
                                            className={cn(
                                                "relative z-20 flex-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-1.5 flex items-center justify-center",
                                                newProductCategory === "Ek Ürün" 
                                                    ? "text-amber-700" 
                                                    : "text-amber-700/40 hover:text-amber-700/70"
                                            )}
                                        >
                                            <Package size={12} />
                                            Ek Ürün
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700/60 ml-1">
                                        <Plus size={12} />
                                        Varyant/Açıklama
                                    </label>
                                    <Input
                                        value={newProductVariantName}
                                        onChange={(e) => setNewProductVariantName(e.target.value)}
                                        placeholder="Örn: Beyaz"
                                        className="h-9 rounded-xl border-amber-500/20 focus:ring-amber-500 font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700/60 ml-1">
                                        <DollarSign size={12} />
                                        Birim Fiyat
                                    </label>
                                    <Input
                                        value={newProductPrice}
                                        onChange={(e) => setNewProductPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="h-9 rounded-xl border-amber-500/20 focus:ring-amber-500 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={onCancelProductManager}
                                    className="px-6 py-2 rounded-xl text-xs font-bold text-[var(--home-muted)] hover:bg-[var(--home-surface-soft)] transition-all"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={onCreateProduct}
                                    disabled={isCreatingProduct || !newProductName.trim()}
                                    className="px-8 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                                >
                                    {isCreatingProduct ? "Ekleniyor..." : "Kataloğa Kaydet"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[var(--home-accent)]/10 text-[var(--home-accent)]">
                                    <Package size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--home-text)]">
                                    Satış Kalemleri
                                </h3>
                            </div>
                            <button
                                onClick={addHistoricalItem}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[var(--home-accent)] text-white text-sm font-black hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[var(--home-accent)]/20"
                            >
                                <Plus size={20} />
                                Yeni Satır Ekle
                            </button>
                        </div>

                        <div className="rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[var(--home-surface-soft)] text-[var(--home-muted)] text-[10px] font-black uppercase tracking-[0.1em]">
                                    <tr>
                                        <th className="px-6 py-3 w-56">
                                            <div className="flex items-center gap-2">
                                                <Tag size={12} />
                                                Ürün Tipi
                                            </div>
                                        </th>
                                        <th className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <Package size={12} />
                                                Ürün Detayları
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 w-36">
                                            <div className="flex items-center gap-2">
                                                <Hash size={12} />
                                                Miktar
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 w-40 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <DollarSign size={12} />
                                                Birim Fiyat
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 w-44 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Percent size={12} />
                                                Tutar
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--home-border)]/20">
                                    {historicalItems.map((item, idx) => (
                                        <tr 
                                            key={idx} 
                                            className={cn(
                                                "group transition-all border-b border-[var(--home-border)]/30 hover:bg-[var(--home-accent)]/[0.01] relative",
                                                openDropdownIdx === idx ? "z-50" : "z-0"
                                            )}
                                        >
                                            <td className="px-6 py-2.5 align-middle">
                                                <div className="relative flex p-1 gap-1 bg-[var(--home-surface-soft)]/40 rounded-xl w-fit border border-[var(--home-border)]/30">
                                                    {/* Sliding indicator background */}
                                                    <div 
                                                        className={cn(
                                                            "absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-10",
                                                            item.itemType === "extra" && "translate-x-full"
                                                        )}
                                                    />
                                                    <button
                                                        onClick={() => updateHistoricalItem(idx, "itemType", "tile")}
                                                        className={cn(
                                                            "relative z-20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                                                            item.itemType === "tile" 
                                                                ? "text-[var(--home-accent)]" 
                                                                : "text-[var(--home-muted)] hover:text-[var(--home-text)]"
                                                        )}
                                                    >
                                                        <Plus size={12} className={cn("transition-transform", item.itemType === "tile" && "rotate-45")} />
                                                        FAYANS
                                                    </button>
                                                    <button
                                                        onClick={() => updateHistoricalItem(idx, "itemType", "extra")}
                                                        className={cn(
                                                            "relative z-20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                                                            item.itemType === "extra" 
                                                                ? "text-[var(--home-accent)]" 
                                                                : "text-[var(--home-muted)] hover:text-[var(--home-text)]"
                                                        )}
                                                    >
                                                        <Package size={12} />
                                                        EK ÜRÜN
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 min-w-[320px] align-middle">
                                                <div className="space-y-1.5">
                                                    <div className="relative" ref={openDropdownIdx === idx ? dropdownRef : null}>
                                                        <button
                                                            onClick={() => {
                                                                if (openDropdownIdx === idx) {
                                                                    setOpenDropdownIdx(null);
                                                                } else {
                                                                    setOpenDropdownIdx(idx);
                                                                    setSearchQuery("");
                                                                }
                                                            }}
                                                            className={cn(
                                                                "w-full h-10 border-b border-[var(--home-border)]/50 text-sm font-bold text-left transition-all flex items-center justify-between group/select-btn py-1",
                                                                openDropdownIdx === idx && "border-[var(--home-accent)]"
                                                            )}
                                                        >
                                                            <span className={cn(
                                                                "truncate",
                                                                !item.productId ? "text-[var(--home-muted)] font-medium" : "text-[var(--home-text)]"
                                                            )}>
                                                                {item.productId 
                                                                    ? (item.itemType === "tile" ? tileOptions : extraOptions).find(o => o.id === item.productId)?.name || "Ürün Bulunamadı"
                                                                    : "Katalogdan Ürün Seçin..."}
                                                            </span>
                                                            <ChevronDown size={16} className={cn("text-[var(--home-muted)] transition-transform duration-300 ml-2", openDropdownIdx === idx && "rotate-180 text-[var(--home-accent)]")} />
                                                        </button>

                                                        {/* Custom Shared Dropdown Menu */}
                                                        {openDropdownIdx === idx && (
                                                            <div className="absolute z-[100] left-0 right-0 mt-2 p-2 bg-[var(--home-surface)] border border-[var(--home-border)] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top">
                                                                <div className="relative mb-2">
                                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--home-muted)]">
                                                                        <Search size={14} />
                                                                    </div>
                                                                    <input
                                                                        autoFocus
                                                                        placeholder="Ürün ara..."
                                                                        value={searchQuery}
                                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                                        className="w-full h-10 pl-9 pr-4 rounded-xl bg-[var(--home-surface-soft)] border border-transparent focus:border-[var(--home-accent)]/30 text-sm outline-none transition-all"
                                                                    />
                                                                </div>

                                                                <div className="max-h-[280px] overflow-y-auto custom-scrollbar space-y-1">
                                                                    {(item.itemType === "tile" ? tileOptions : extraOptions)
                                                                        .filter(opt => opt.name.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')))
                                                                        .map((opt) => (
                                                                            <button
                                                                                key={opt.id}
                                                                                onClick={() => handleSelectProduct(idx, opt)}
                                                                                className={cn(
                                                                                    "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group/opt hover:bg-[var(--home-accent)]/[0.04]",
                                                                                    item.productId === opt.id && "bg-[var(--home-accent)]/5 text-[var(--home-accent)]"
                                                                                )}
                                                                            >
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-bold tracking-tight">{opt.name}</span>
                                                                                    {opt.variantName && (
                                                                                        <span className="text-[10px] text-[var(--home-muted)] font-black uppercase tracking-wider">{opt.variantName}</span>
                                                                                    )}
                                                                                </div>
                                                                                {item.productId === opt.id && (
                                                                                    <Plus size={14} className="rotate-45" />
                                                                                )}
                                                                            </button>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <input
                                                        placeholder="Özel tanım veya açıklama..."
                                                        value={item.name}
                                                        onChange={(e) => updateHistoricalItem(idx, "name", e.target.value)}
                                                        className="w-full h-6 bg-transparent text-[11px] text-[var(--home-muted)] focus:outline-none py-1 transition-all placeholder:italic"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-2.5 align-middle">
                                                <div className="relative group/field">
                                                    <input
                                                        type="text"
                                                        value={item.itemType === "extra" ? item.quantity : item.soldArea}
                                                        onChange={(e) => updateHistoricalItem(idx, item.itemType === "extra" ? "quantity" : "soldArea", e.target.value)}
                                                        className="w-full h-10 bg-transparent border-b border-[var(--home-border)]/50 focus:border-[var(--home-accent)]/50 focus:outline-none text-sm font-black text-[var(--home-text)] transition-all py-1 pr-8"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--home-muted)] uppercase tracking-widest pointer-events-none">
                                                        {item.itemType === "extra" ? (item.unit || "ADT") : "M²"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-2.5 align-middle">
                                                <div className="relative group/field">
                                                    <input
                                                        type="text"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateHistoricalItem(idx, "unitPrice", e.target.value)}
                                                        className="w-full h-10 bg-transparent border-b border-[var(--home-border)]/50 focus:border-[var(--home-accent)]/50 focus:outline-none text-right text-sm font-black text-[var(--home-text)] transition-all py-1 pr-6"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--home-muted)] uppercase tracking-widest pointer-events-none">TL</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                <div className="text-sm font-black text-[var(--home-accent)] tracking-tight">
                                                    {formatCurrency(Number(item.totalPrice) || 0)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => removeHistoricalItem(idx)}
                                                    className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer / Totals */}
                <div className="p-4 bg-[var(--home-surface-soft)]/30 border-t border-[var(--home-border)]/50">
                    <div className="flex flex-col lg:flex-row items-end justify-between gap-4">
                        {/* Action Buttons - Moved to left for better balance */}
                        <div className="flex gap-3 w-full lg:w-auto order-2 lg:order-1">
                            <button
                                onClick={onCancelEdit}
                                className="px-6 py-2.5 rounded-xl font-bold text-[var(--home-muted)] hover:bg-white hover:text-red-500 transition-all active:scale-95 text-sm"
                            >
                                Bilgileri Temizle
                            </button>
                            <button
                                onClick={onSave}
                                disabled={isSavingHistorical}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-[var(--home-accent)] text-white font-black hover:brightness-110 hover:shadow-xl hover:shadow-[var(--home-accent)]/20 disabled:opacity-50 transition-all active:scale-95 group"
                            >
                                {isSavingHistorical ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                )}
                                <span className="text-sm">{editingHistoricalQuoteId ? "Güncelle" : "Kaydet"}</span>
                            </button>
                        </div>

                        {/* Totals & Adjustments Card */}
                        <div className="flex flex-col sm:flex-row items-end gap-4 w-full lg:w-auto order-1 lg:order-2">
                            {/* Compact Adjustments */}
                            <div className="grid grid-cols-2 gap-3 w-full sm:w-[320px]">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[var(--home-muted)] ml-1">
                                        <Percent size={10} className="text-[var(--home-accent)]" />
                                        İndirim
                                    </label>
                                    <div className="flex items-center bg-[var(--home-surface)] rounded-xl px-2.5 py-1.5 border border-[var(--home-border)]/50 focus-within:ring-2 focus-within:ring-[var(--home-accent)]/10 transition-all shadow-sm">
                                        <input
                                            type="text"
                                            value={historicalDiscountAmount}
                                            onChange={(e) => setHistoricalDiscountAmount(e.target.value)}
                                            className="w-full bg-transparent font-bold outline-none text-xs"
                                            placeholder="0"
                                        />
                                        <span className="text-[10px] font-black text-[var(--home-muted)] ml-1 uppercase">TL</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[var(--home-muted)] ml-1">
                                        <Percent size={10} className="text-[var(--home-accent)]" />
                                        KDV
                                    </label>
                                    <div className="flex items-center bg-[var(--home-surface)] rounded-xl px-2.5 py-1.5 border border-[var(--home-border)]/50 focus-within:ring-2 focus-within:ring-[var(--home-accent)]/10 transition-all shadow-sm">
                                        <input
                                            type="text"
                                            value={historicalVatRate}
                                            onChange={(e) => setHistoricalVatRate(e.target.value)}
                                            className="w-full bg-transparent font-bold outline-none text-xs"
                                            placeholder="0"
                                        />
                                        <span className="text-[10px] font-black text-[var(--home-muted)] ml-1">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="flex flex-col min-w-[280px] bg-[var(--home-surface)] p-5 rounded-3xl border border-[var(--home-border)] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--home-accent)]/2 rounded-full -mr-12 -mt-12 blur-xl group-hover:bg-[var(--home-accent)]/5 transition-colors" />
                                
                                <div className="space-y-2 relative">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-[var(--home-muted)] uppercase tracking-tight">
                                        <span>Ara Toplam</span>
                                        <span className="text-[var(--home-text)] font-black">{formatCurrency(historicalTotal)}</span>
                                    </div>
                                    {discountValue > 0 && (
                                        <div className="flex justify-between items-center text-[10px] font-bold text-red-500 uppercase tracking-tight">
                                            <span>İndirim</span>
                                            <span className="font-black">-{formatCurrency(discountValue)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-[10px] font-bold text-[var(--home-muted)] uppercase tracking-tight">
                                        <span>KDV ({historicalVatRate}%)</span>
                                        <span className="text-[var(--home-text)] font-black">{formatCurrency(historicalVatAmount)}</span>
                                    </div>
                                    <div className="pt-3 mt-1 border-t border-[var(--home-border)]/50 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-[var(--home-muted)] uppercase tracking-widest">ÖDENECEK</span>
                                            <span className="text-xs font-black text-[var(--home-text)] leading-none">Genel Toplam</span>
                                        </div>
                                        <div className="text-2xl font-black text-[var(--home-accent)] tracking-tighter">
                                            {formatCurrency(historicalGrandTotal)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}