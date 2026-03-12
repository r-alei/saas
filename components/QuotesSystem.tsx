"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createProductOption, deleteQuote, getQuotes, listProductOptions, saveHistoricalQuote, updateQuote, updateQuoteStatus } from "@/app/actions";
import { CartItem, ProductOption, SavedQuote } from "@/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { HistoricalQuoteModal } from "./quotes/HistoricalQuoteModal";
import { QuotesAnalytics } from "./quotes/QuotesAnalytics";
import { QuotesList } from "./quotes/QuotesList";
import { HistoricalItemDraft } from "./quotes/types";
import {
    buildDefaultHistoricalItem,
    getHistoricalLineTotal,
    getLocalDateValue,
    normalizeHistoricalItem,
    parseNumericInput,
    toLocalDateInputValue,
} from "./quotes/utils";

export function QuotesSystem({
    searchQuery = "",
    statusFilter = "Tümü",
    dateFrom = "",
    dateTo = "",
    minAmount = "",
    maxAmount = "",
    productTypeFilter = "Tümü" as const,
    importOpenExternal = false,
    onImportOpenHandled,
}: {
    searchQuery?: string;
    statusFilter?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: string;
    maxAmount?: string;
    productTypeFilter?: "Tümü" | "Fayans" | "Ek Ürün";
    importOpenExternal?: boolean;
    onImportOpenHandled?: () => void;
} = {}) {
    const [quotes, setQuotes] = useState<SavedQuote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isSavingHistorical, setIsSavingHistorical] = useState(false);
    const [historicalCustomerName, setHistoricalCustomerName] = useState("");
    const [historicalStatus, setHistoricalStatus] = useState("Bekliyor");
    const [historicalCreatedAt, setHistoricalCreatedAt] = useState(getLocalDateValue());
    const [historicalVatRate, setHistoricalVatRate] = useState("0");
    const [historicalDiscountAmount, setHistoricalDiscountAmount] = useState("0");
    const [historicalItems, setHistoricalItems] = useState<HistoricalItemDraft[]>([buildDefaultHistoricalItem()]);
    const [editingHistoricalQuoteId, setEditingHistoricalQuoteId] = useState<string | null>(null);
    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
    const [isProductsLoading, setIsProductsLoading] = useState(false);
    const [showProductManager, setShowProductManager] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [newProductName, setNewProductName] = useState("");
    const [newProductCategory, setNewProductCategory] = useState<"Fayans" | "Ek Ürün">("Fayans");
    const [newProductVariantName, setNewProductVariantName] = useState("");
    const [newProductUnit, setNewProductUnit] = useState("m²");
    const [newProductSpecs, setNewProductSpecs] = useState("");
    const [newProductPrice, setNewProductPrice] = useState("");
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const router = useRouter();

    const tileOptions = useMemo(
        () => productOptions.filter((option) => option.productType === "tile"),
        [productOptions]
    );
    const extraOptions = useMemo(
        () => productOptions.filter((option) => option.productType === "extra"),
        [productOptions]
    );

    const findMatchingProductId = useCallback((itemType: "tile" | "extra", name: string, specs?: string) => {
        const normalizedName = name.trim().toLocaleLowerCase("tr-TR");
        const normalizedSpecs = (specs || "").trim().toLocaleLowerCase("tr-TR");
        if (!normalizedName) return "";

        const candidates = productOptions.filter((option) => option.productType === itemType);
        const exactMatch = candidates.find((option) => {
            const optionName = option.name.trim().toLocaleLowerCase("tr-TR");
            const optionVariant = (option.variantName || option.specs || "").trim().toLocaleLowerCase("tr-TR");
            if (optionName !== normalizedName) return false;
            if (!normalizedSpecs) return true;
            return optionVariant === normalizedSpecs;
        });
        if (exactMatch) return exactMatch.id;

        const includesMatch = candidates.find((option) => {
            const optionName = option.name.trim().toLocaleLowerCase("tr-TR");
            const optionVariant = (option.variantName || option.specs || "").trim().toLocaleLowerCase("tr-TR");
            if (!optionName.includes(normalizedName)) return false;
            if (!normalizedSpecs) return true;
            return optionVariant.includes(normalizedSpecs);
        });
        if (includesMatch) return includesMatch.id;

        return "";
    }, [productOptions]);

    useEffect(() => {
        if (importOpenExternal) {
            setIsImportOpen(true);
            onImportOpenHandled?.();
        }
    }, [importOpenExternal, onImportOpenHandled]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2600);
        return () => clearTimeout(timer);
    }, [toast]);

    const loadQuotes = useCallback(async () => {
        setIsLoading(true);
        const res = await getQuotes();
        if (res.success && res.data) {
            setQuotes(res.data as SavedQuote[]);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadQuotes();
        }, 0);

        return () => clearTimeout(timer);
    }, [loadQuotes]);

    const loadProductOptions = useCallback(async () => {
        setIsProductsLoading(true);
        const res = await listProductOptions();
        if (res.success && res.data) {
            setProductOptions(res.data);
        } else {
            setToast({ type: "error", message: "Ürün listesi getirilemedi." });
        }
        setIsProductsLoading(false);
    }, []);

    useEffect(() => {
        void loadProductOptions();
    }, [loadProductOptions]);

    useEffect(() => {
        if (productOptions.length === 0) return;

        setHistoricalItems((prev) => prev.map((item) => {
            const normalizedItem = normalizeHistoricalItem(item);
            if (normalizedItem.productId || !normalizedItem.name.trim()) {
                return normalizedItem;
            }

            const matchedId = findMatchingProductId(normalizedItem.itemType, normalizedItem.name, normalizedItem.specs);
            return matchedId ? { ...normalizedItem, productId: matchedId } : normalizedItem;
        }));
    }, [productOptions, findMatchingProductId]);

    const handleDeleteQuote = async (event: React.MouseEvent, id: string) => {
        event.stopPropagation();
        if (confirm("Bu fişi kalıcı olarak silmek istiyor musunuz?")) {
            await deleteQuote(id);
            void loadQuotes();
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        await updateQuoteStatus(id, newStatus);
        void loadQuotes();
    };

    const handleLoadQuote = (quote: SavedQuote) => {
        if (confirm("Mevcut fiş taslağı silinip bu kayıt yüklenecek. Devam edilsin mi?")) {
            try {
                localStorage.setItem("pos-cart-v1", quote.items);
                localStorage.setItem("pos-customer-name-v1", quote.customerName);
                localStorage.setItem("pos-edit-quote-id-v1", quote.id);
                router.push("/pos/quotes");
            } catch (error) {
                console.error("Parse error", error);
                setToast({ type: "error", message: "Fiş yüklenirken hata oluştu." });
            }
        }
    };

    const filteredQuotes = useMemo(() => {
        return quotes.filter((quote) => {
            const matchesSearch = quote.customerName.toLowerCase().includes(searchQuery.toLowerCase());
            const status = quote.status || "Bekliyor";
            const matchesStatus = statusFilter === "Tümü" || status === statusFilter;

            const quoteDate = new Date(quote.createdAt).toISOString().split("T")[0];
            const matchesDateFrom = !dateFrom || quoteDate >= dateFrom;
            const matchesDateTo = !dateTo || quoteDate <= dateTo;

            const min = parseNumericInput(minAmount);
            const max = parseNumericInput(maxAmount);
            const matchesMinAmount = !minAmount || quote.totalAmount >= min;
            const matchesMaxAmount = !maxAmount || quote.totalAmount <= max;

            let matchesProductType = productTypeFilter === "Tümü";
            if (productTypeFilter !== "Tümü") {
                try {
                    const items = JSON.parse(quote.items) as CartItem[];
                    matchesProductType = items.some((item) => (
                        productTypeFilter === "Fayans" ? item.itemType !== "extra" : item.itemType === "extra"
                    ));
                } catch {
                    matchesProductType = false;
                }
            }

            return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount && matchesProductType;
        });
    }, [quotes, searchQuery, statusFilter, dateFrom, dateTo, minAmount, maxAmount, productTypeFilter]);

    const analytics = useMemo(() => {
        const financial = {
            totalRevenue: 0,
            totalDiscount: 0,
            totalVat: 0,
            avgOrderValue: 0,
            paidAmount: 0,
            pendingAmount: 0,
            refundAmount: 0,
        };

        const productsMap = new Map<string, { name: string; type: string; quantity: number; revenue: number }>();
        const customersMap = new Map<string, { name: string; quoteCount: number; totalAmount: number; lastOrder: string }>();
        const monthlyMap = new Map<string, { month: string; monthKey: string; amount: number; count: number }>();

        let validOrderCount = 0;
        let maxMonthlyAmount = 0;

        quotes.forEach((quote) => {
            const status = quote.status || "Bekliyor";
            const amount = quote.totalAmount || 0;
            const discount = Number(quote.discountAmount) || 0;
            const vat = typeof quote.vatRate === "number" ? quote.vatRate : 0;

            if (status === "Ödendi") financial.paidAmount += amount;
            if (status === "Bekliyor") financial.pendingAmount += amount;
            if (status === "İade") financial.refundAmount += amount;

            if (status !== "İade") {
                financial.totalRevenue += amount;
                financial.totalDiscount += discount;

                const taxBase = amount / (1 + (vat / 100));
                financial.totalVat += amount - taxBase;
                validOrderCount++;

                const customerName = (quote.customerName || "İsimsiz Müşteri").trim() || "İsimsiz Müşteri";
                const customerKey = customerName.toLocaleLowerCase("tr-TR");
                const customer = customersMap.get(customerKey) || { name: customerName, quoteCount: 0, totalAmount: 0, lastOrder: "" };
                customer.quoteCount++;
                customer.totalAmount += amount;
                if (!customer.lastOrder || new Date(quote.createdAt) > new Date(customer.lastOrder)) {
                    customer.lastOrder = new Date(quote.createdAt).toISOString();
                }
                customersMap.set(customerKey, customer);

                const date = new Date(quote.createdAt);
                if (!Number.isNaN(date.getTime())) {
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    const monthName = date.toLocaleString("tr-TR", { month: "short", year: "numeric" });
                    const month = monthlyMap.get(monthKey) || { month: monthName, monthKey, amount: 0, count: 0 };
                    month.amount += amount;
                    month.count++;
                    monthlyMap.set(monthKey, month);
                    if (month.amount > maxMonthlyAmount) maxMonthlyAmount = month.amount;
                }

                try {
                    const items = JSON.parse(quote.items) as CartItem[];
                    items.forEach((item) => {
                        const key = item.name.trim() || "Bilinmeyen Ürün";
                        const product = productsMap.get(key) || { name: key, type: item.itemType || "extra", quantity: 0, revenue: 0 };
                        const quantity = item.itemType === "extra" ? (Number(item.quantity) || Number(item.requiredPieces) || 0) : (Number(item.soldArea) || 0);
                        const revenue = Number(item.totalPrice) || 0;
                        product.quantity += quantity;
                        product.revenue += revenue;
                        productsMap.set(key, product);
                    });
                } catch {
                    return;
                }
            }
        });

        if (validOrderCount > 0) {
            financial.avgOrderValue = financial.totalRevenue / validOrderCount;
        }

        const topCustomers = Array.from(customersMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
        const filteredCustomers = (searchQuery.trim()
            ? topCustomers.filter((customer) => customer.name.toLocaleLowerCase("tr-TR").includes(searchQuery.toLocaleLowerCase("tr-TR")))
            : topCustomers
        ).slice(0, 15);

        const topProducts = Array.from(productsMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 15);

        const monthlyData = Array.from(monthlyMap.values())
            .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
            .slice(-12);

        return {
            financial,
            topCustomers: filteredCustomers,
            topProducts,
            monthlyData,
            maxMonthlyAmount,
        };
    }, [quotes, searchQuery]);

    const historicalTotal = useMemo(() => {
        return historicalItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    }, [historicalItems]);

    const discountValue = useMemo(() => {
        return Math.max(parseNumericInput(historicalDiscountAmount), 0);
    }, [historicalDiscountAmount]);

    const historicalVatAmount = useMemo(() => {
        const rate = Math.max(parseNumericInput(historicalVatRate), 0);
        const subtotalAfterDiscount = historicalTotal - discountValue;
        return Math.max(subtotalAfterDiscount, 0) * (rate / 100);
    }, [historicalTotal, historicalVatRate, discountValue]);

    const historicalGrandTotal = useMemo(() => {
        const subtotalAfterDiscount = historicalTotal - discountValue;
        return Math.max(subtotalAfterDiscount, 0) + historicalVatAmount;
    }, [historicalTotal, historicalVatAmount, discountValue]);

    const updateHistoricalItem = (index: number, field: keyof HistoricalItemDraft, value: string) => {
        setHistoricalItems((prev) => prev.map((item, itemIndex) => {
            if (itemIndex !== index) return normalizeHistoricalItem(item);

            const nextItem = normalizeHistoricalItem({ ...item, [field]: value });

            if (field === "productId") {
                const selected = productOptions.find((option) => option.id === value);
                if (selected) {
                    nextItem.productId = selected.id;
                    nextItem.name = selected.name;
                    nextItem.itemType = selected.productType;
                    nextItem.specs = selected.variantName || selected.specs || "";

                    if (selected.defaultPrice && parseNumericInput(nextItem.unitPrice) <= 0) {
                        nextItem.unitPrice = String(selected.defaultPrice);
                    }

                    if (selected.productType === "extra") {
                        nextItem.unit = selected.unit || "Adet";
                        nextItem.requiredPackages = "";
                        nextItem.soldArea = "";
                    } else {
                        nextItem.unit = "Adet";
                        nextItem.quantity = "";
                    }
                }
            }

            if (field === "itemType") {
                nextItem.productId = "";
                nextItem.name = "";
                nextItem.specs = "";
                nextItem.unitPrice = "";
                nextItem.totalPrice = "";

                if (value === "tile") {
                    nextItem.unit = "Adet";
                    nextItem.quantity = "";
                    nextItem.requiredPackages = "";
                    nextItem.soldArea = "";
                } else {
                    nextItem.requiredPackages = "";
                    nextItem.soldArea = "";
                    nextItem.quantity = "";
                    nextItem.unit = "Adet";
                }
            }

            nextItem.totalPrice = String(getHistoricalLineTotal(nextItem));
            return nextItem;
        }));
    };

    const addHistoricalItem = () => {
        setHistoricalItems((prev) => [...prev.map((item) => normalizeHistoricalItem(item)), buildDefaultHistoricalItem()]);
    };

    const removeHistoricalItem = (index: number) => {
        setHistoricalItems((prev) => {
            if (prev.length === 1) return prev;
            return prev.filter((_, itemIndex) => itemIndex !== index).map((item) => normalizeHistoricalItem(item));
        });
    };

    const resetHistoricalForm = () => {
        setHistoricalCustomerName("");
        setHistoricalStatus("Bekliyor");
        setHistoricalCreatedAt(getLocalDateValue());
        setHistoricalVatRate("0");
        setHistoricalDiscountAmount("0");
        setHistoricalItems([buildDefaultHistoricalItem()]);
        setEditingHistoricalQuoteId(null);
    };

    const mapQuoteItemsToDraft = (items: CartItem[]): HistoricalItemDraft[] => {
        const mapped = items.map((item) => {
            if (item.itemType === "extra") {
                const matchedProductId = item.variantId
                    ? productOptions.find((option) => option.id === item.variantId && option.productType === "extra")?.id || ""
                    : findMatchingProductId("extra", item.name || "", item.specs || "");
                return normalizeHistoricalItem({
                    productId: matchedProductId,
                    itemType: "extra",
                    name: item.name,
                    specs: item.specs,
                    quantity: String(item.quantity ?? item.requiredPieces ?? item.soldArea ?? ""),
                    unit: item.unit || "Adet",
                    unitPrice: String(item.unitPrice ?? ""),
                    totalPrice: String(item.totalPrice ?? ""),
                });
            }

            const matchedProductId = item.variantId
                ? productOptions.find((option) => option.id === item.variantId && option.productType === "tile")?.id || ""
                : findMatchingProductId("tile", item.name || "", item.specs || "");
            return normalizeHistoricalItem({
                productId: matchedProductId,
                itemType: "tile",
                name: item.name,
                specs: item.specs,
                requiredPackages: String(item.requiredPackages ?? ""),
                soldArea: String(item.soldArea ?? ""),
                unitPrice: String(item.unitPrice ?? ""),
                totalPrice: String(item.totalPrice ?? ""),
            });
        });

        return mapped.length > 0 ? mapped : [buildDefaultHistoricalItem()];
    };

    const handleEditQuoteInForm = (quote: SavedQuote) => {
        try {
            const parsedItems = JSON.parse(quote.items) as CartItem[];
            const itemsSubtotal = parsedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            const savedDiscount = Math.max(Number(quote.discountAmount ?? 0), 0);
            const taxBase = Math.max(itemsSubtotal - savedDiscount, 0);

            let resolvedVatRate = 0;
            if (taxBase > 0) {
                const inferredVatRate = ((quote.totalAmount - taxBase) / taxBase) * 100;
                const normalizedInferredVatRate = Number.isFinite(inferredVatRate) ? Math.max(inferredVatRate, 0) : 0;
                const savedVatRate = quote.vatRate;

                if (typeof savedVatRate === "number") {
                    const looksLikeLegacyDefault20 = Math.abs(savedVatRate - 20) < 0.0001 && Math.abs(normalizedInferredVatRate) < 0.1;
                    resolvedVatRate = looksLikeLegacyDefault20 ? 0 : Math.max(savedVatRate, 0);
                } else {
                    resolvedVatRate = normalizedInferredVatRate;
                }
            }

            setHistoricalCustomerName(quote.customerName || "");
            setHistoricalStatus(quote.status || "Bekliyor");
            setHistoricalCreatedAt(toLocalDateInputValue(quote.createdAt));
            setHistoricalVatRate(String(resolvedVatRate));
            setHistoricalDiscountAmount(String(quote.discountAmount ?? 0));
            setHistoricalItems(mapQuoteItemsToDraft(parsedItems));
            setEditingHistoricalQuoteId(quote.id);
            setIsImportOpen(true);
            setToast({ type: "success", message: "Fiş formda düzenlemeye açıldı." });
        } catch (error) {
            console.error("Quote parse error:", error);
            setToast({ type: "error", message: "Fiş düzenleme için yüklenemedi." });
        }
    };

    const handleSaveHistoricalQuote = async () => {
        const customerName = historicalCustomerName.trim();
        if (!customerName) {
            setToast({ type: "error", message: "Müşteri adı gerekli." });
            return;
        }

        if (!historicalCreatedAt) {
            setToast({ type: "error", message: "Fiş tarihi gerekli." });
            return;
        }

        const rows = historicalItems
            .map((item, index) => ({
                index,
                itemType: item.itemType,
                name: item.name.trim(),
                specs: item.specs.trim(),
                requiredPackages: parseNumericInput(item.requiredPackages),
                soldArea: parseNumericInput(item.soldArea),
                quantity: parseNumericInput(item.quantity),
                unit: (item.unit || "").trim() || "Adet",
                unitPrice: parseNumericInput(item.unitPrice),
                totalPrice: parseNumericInput(item.totalPrice),
            }))
            .map((row) => ({
                ...row,
                totalPrice: row.itemType === "extra" ? row.quantity * row.unitPrice : row.soldArea * row.unitPrice,
            }))
            .filter((item) => {
                if (!item.name) return false;
                if (item.itemType === "extra") return item.quantity > 0;
                return item.soldArea > 0 || item.requiredPackages > 0;
            });

        if (rows.length === 0) {
            setToast({ type: "error", message: "En az bir geçerli ürün kalemi girin." });
            return;
        }

        const cartItems: CartItem[] = rows.map((row) => {
            const sourceDraft = historicalItems[row.index];
            const selectedOption = sourceDraft?.productId ? productOptions.find((option) => option.id === sourceDraft.productId) : undefined;

            if (row.itemType === "extra") {
                const effectiveQuantity = row.quantity > 0 ? row.quantity : 1;
                const effectiveUnitPrice = row.unitPrice > 0 ? row.unitPrice : row.totalPrice / effectiveQuantity;
                return {
                    id: crypto.randomUUID(),
                    productId: selectedOption?.productId,
                    variantId: selectedOption?.variantId,
                    name: row.name,
                    itemType: "extra",
                    specs: row.specs || `${effectiveQuantity} ${row.unit}`,
                    requiredArea: 0,
                    includeFire: false,
                    fireRate: 0,
                    requiredPieces: effectiveQuantity,
                    requiredPackages: effectiveQuantity,
                    soldArea: effectiveQuantity,
                    unitPrice: effectiveUnitPrice,
                    priceUnit: "adet",
                    totalPrice: row.totalPrice,
                    unit: row.unit,
                    quantity: effectiveQuantity,
                };
            }

            return {
                id: crypto.randomUUID(),
                productId: selectedOption?.productId,
                variantId: selectedOption?.variantId,
                name: row.name,
                itemType: "tile",
                specs: row.specs || "Belirtilmedi",
                requiredArea: row.soldArea,
                includeFire: false,
                fireRate: 0,
                requiredPieces: 0,
                requiredPackages: row.requiredPackages,
                soldArea: row.soldArea,
                unitPrice: row.unitPrice,
                priceUnit: "m2",
                totalPrice: row.totalPrice,
            };
        });

        setIsSavingHistorical(true);
        const vatRateValue = parseNumericInput(historicalVatRate);
        const discountAmountValue = discountValue;

        const res = editingHistoricalQuoteId
            ? await updateQuote({
                id: editingHistoricalQuoteId,
                customerName,
                items: cartItems,
                totalAmount: historicalGrandTotal,
                status: historicalStatus,
                createdAt: historicalCreatedAt,
                vatRate: vatRateValue,
                discountAmount: discountAmountValue,
            })
            : await saveHistoricalQuote({
                customerName,
                items: cartItems,
                totalAmount: historicalGrandTotal,
                status: historicalStatus,
                createdAt: historicalCreatedAt,
                vatRate: vatRateValue,
                discountAmount: discountAmountValue,
            });
        setIsSavingHistorical(false);

        if (!res.success) {
            setToast({ type: "error", message: `Kayıt başarısız: ${res.error || "Bilinmeyen hata"}` });
            return;
        }

        setToast({ type: "success", message: editingHistoricalQuoteId ? "Fiş güncellendi." : "Eski fiş kaydedildi." });
        resetHistoricalForm();
        setIsImportOpen(false);
        void loadQuotes();
    };

    const handleCreateProduct = async () => {
        const trimmedName = newProductName.trim();
        if (!trimmedName) {
            setToast({ type: "error", message: "Ürün adı gerekli." });
            return;
        }

        setIsCreatingProduct(true);
        const res = await createProductOption({
            name: trimmedName,
            category: newProductCategory,
            variantName: newProductVariantName,
            unit: newProductUnit,
            specs: newProductSpecs,
            defaultPrice: parseNumericInput(newProductPrice),
        });
        setIsCreatingProduct(false);

        if (!res.success) {
            setToast({ type: "error", message: res.error || "Ürün oluşturulamadı." });
            return;
        }

        setNewProductName("");
        setNewProductVariantName("");
        setNewProductSpecs("");
        setNewProductPrice("");
        setToast({ type: "success", message: "Ürün kataloğa eklendi." });
        await loadProductOptions();
    };

    const handleCancelProductManager = () => {
        setShowProductManager(false);
        setNewProductName("");
        setNewProductCategory("Fayans");
        setNewProductVariantName("");
        setNewProductUnit("m²");
        setNewProductSpecs("");
        setNewProductPrice("");
    };

    const handleCancelEdit = () => {
        resetHistoricalForm();
        setToast({ type: "success", message: "Düzenleme modu kapatıldı." });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {toast && (
                <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div
                        className={cn(
                            "px-4 py-2.5 rounded-xl border shadow-lg text-sm font-medium backdrop-blur bg-white/95",
                            toast.type === "success"
                                ? "border-emerald-200 text-emerald-700"
                                : "border-red-200 text-red-700"
                        )}
                    >
                        {toast.message}
                    </div>
                </div>
            )}

            <HistoricalQuoteModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                editingHistoricalQuoteId={editingHistoricalQuoteId}
                tileOptions={tileOptions}
                extraOptions={extraOptions}
                isProductsLoading={isProductsLoading}
                showProductManager={showProductManager}
                setShowProductManager={setShowProductManager}
                isCreatingProduct={isCreatingProduct}
                newProductName={newProductName}
                setNewProductName={setNewProductName}
                newProductCategory={newProductCategory}
                setNewProductCategory={setNewProductCategory}
                newProductVariantName={newProductVariantName}
                setNewProductVariantName={setNewProductVariantName}
                newProductUnit={newProductUnit}
                setNewProductUnit={setNewProductUnit}
                newProductSpecs={newProductSpecs}
                setNewProductSpecs={setNewProductSpecs}
                newProductPrice={newProductPrice}
                setNewProductPrice={setNewProductPrice}
                onCreateProduct={handleCreateProduct}
                onCancelProductManager={handleCancelProductManager}
                historicalCustomerName={historicalCustomerName}
                setHistoricalCustomerName={setHistoricalCustomerName}
                historicalStatus={historicalStatus}
                setHistoricalStatus={setHistoricalStatus}
                historicalCreatedAt={historicalCreatedAt}
                setHistoricalCreatedAt={setHistoricalCreatedAt}
                historicalDiscountAmount={historicalDiscountAmount}
                setHistoricalDiscountAmount={setHistoricalDiscountAmount}
                historicalVatRate={historicalVatRate}
                setHistoricalVatRate={setHistoricalVatRate}
                historicalItems={historicalItems}
                updateHistoricalItem={updateHistoricalItem}
                removeHistoricalItem={removeHistoricalItem}
                addHistoricalItem={addHistoricalItem}
                historicalTotal={historicalTotal}
                discountValue={discountValue}
                historicalVatAmount={historicalVatAmount}
                historicalGrandTotal={historicalGrandTotal}
                onCancelEdit={handleCancelEdit}
                onSave={handleSaveHistoricalQuote}
                isSavingHistorical={isSavingHistorical}
            />

            <div className="space-y-8">
                <QuotesAnalytics analytics={analytics} />
                <QuotesList
                    isLoading={isLoading}
                    quotes={filteredQuotes}
                    expandedQuoteId={expandedQuoteId}
                    onToggleExpand={(quoteId) => setExpandedQuoteId((current) => current === quoteId ? null : quoteId)}
                    onDeleteQuote={handleDeleteQuote}
                    onStatusChange={handleStatusChange}
                    onLoadQuote={handleLoadQuote}
                    onEditQuoteInForm={handleEditQuoteInForm}
                />
            </div>
        </div>
    );
}