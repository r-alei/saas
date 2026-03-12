"use client";

import React, { useMemo, useState } from "react";
import { archiveProductOption, createProductOption, listManageableProducts, updateProductOption } from "@/app/actions";
import { ManageableProduct } from "@/types";
import { Input } from "./ui/Input";
import { cn } from "@/lib/utils";
import { Pencil, Save, X, Trash2, Search } from "lucide-react";

type SortKey = "name" | "category" | "defaultPrice" | "updatedAt";
type SortDirection = "asc" | "desc";

type EditingDraft = {
    name: string;
    category: "Fayans" | "Ek Ürün";
    unit: string;
    specs: string;
    defaultPrice: string;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
    }).format(amount);
};

const parseNumericInput = (value: string) => {
    const normalized = (value || "").replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

export function ProductManager() {
    const [products, setProducts] = useState<ManageableProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"Fayans" | "Ek Ürün">("Fayans");
    const [activeFilter, setActiveFilter] = useState<"Aktif" | "Pasif" | "Tümü">("Aktif");
    const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingDraft, setEditingDraft] = useState<EditingDraft | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [newProductName, setNewProductName] = useState("");
    const [newProductCategory, setNewProductCategory] = useState<"Fayans" | "Ek Ürün">("Fayans");
    const [newProductVariantName, setNewProductVariantName] = useState("");
    const [newProductUnit, setNewProductUnit] = useState("m²");
    const [newProductSpecs, setNewProductSpecs] = useState("");
    const [newProductPrice, setNewProductPrice] = useState("");
    const [archivingId, setArchivingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const loadProducts = React.useCallback(async () => {
        setIsLoading(true);
        const res = await listManageableProducts();
        if (res.success && res.data) {
            setProducts(res.data);
        } else {
            setToast({ type: "error", message: res.error || "Ürünler yüklenemedi." });
        }
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            void loadProducts();
        }, 0);

        return () => clearTimeout(timer);
    }, [loadProducts]);

    React.useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2600);
        return () => clearTimeout(timer);
    }, [toast]);

    const startEdit = (product: ManageableProduct) => {
        setEditingId(product.id);
        setEditingDraft({
            name: product.name,
            category: product.category,
            unit: product.unit,
            specs: product.specs || "",
            defaultPrice: product.defaultPrice !== undefined ? String(product.defaultPrice) : "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingDraft(null);
    };

    const handleSave = async (id: string) => {
        if (!editingDraft) return;
        const name = editingDraft.name.trim();
        if (!name) {
            setToast({ type: "error", message: "Ürün adı gerekli." });
            return;
        }

        setIsSaving(true);
        const rawPrice = editingDraft.defaultPrice.trim();
        const parsedPrice = rawPrice ? parseNumericInput(rawPrice) : undefined;

        const res = await updateProductOption({
            id,
            name,
            category: editingDraft.category,
            unit: editingDraft.unit,
            specs: editingDraft.specs,
            defaultPrice: parsedPrice,
        });
        setIsSaving(false);

        if (!res.success) {
            setToast({ type: "error", message: res.error || "Ürün güncellenemedi." });
            return;
        }

        setToast({ type: "success", message: "Ürün güncellendi." });
        cancelEdit();
        await loadProducts();
    };

    const handleArchive = async (id: string) => {
        if (!confirm("Bu ürünü pasife almak istiyor musunuz?")) return;

        setArchivingId(id);
        const res = await archiveProductOption(id);
        setArchivingId(null);

        if (!res.success) {
            setToast({ type: "error", message: res.error || "Ürün pasife alınamadı." });
            return;
        }

        if (editingId === id) {
            cancelEdit();
        }

        setToast({ type: "success", message: "Ürün pasife alındı." });
        await loadProducts();
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
        setToast({ type: "success", message: "Ürün kataloga eklendi." });
        await loadProducts();
    };

    const handleCancelCreateProduct = () => {
        setNewProductName("");
        setNewProductCategory(activeTab);
        setNewProductVariantName("");
        setNewProductUnit(activeTab === "Fayans" ? "m²" : "Adet");
        setNewProductSpecs("");
        setNewProductPrice("");
    };

    const filteredProducts = useMemo(() => {
        const query = searchQuery.trim().toLocaleLowerCase("tr-TR");

        const filtered = products.filter((product) => {
            const matchesSearch =
                !query ||
                product.name.toLocaleLowerCase("tr-TR").includes(query) ||
                (product.specs || "").toLocaleLowerCase("tr-TR").includes(query);

            const matchesCategory = product.category === activeTab;
            const matchesActive =
                activeFilter === "Tümü" ||
                (activeFilter === "Aktif" ? product.isActive : !product.isActive);

            return matchesSearch && matchesCategory && matchesActive;
        });

        return filtered.sort((left, right) => {
            const direction = sortDirection === "asc" ? 1 : -1;

            if (sortKey === "name") {
                return left.name.localeCompare(right.name, "tr-TR") * direction;
            }

            if (sortKey === "category") {
                return left.category.localeCompare(right.category, "tr-TR") * direction;
            }

            if (sortKey === "defaultPrice") {
                const leftPrice = left.defaultPrice ?? 0;
                const rightPrice = right.defaultPrice ?? 0;
                return (leftPrice - rightPrice) * direction;
            }

            return (new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()) * direction;
        });
    }, [products, searchQuery, activeTab, activeFilter, sortKey, sortDirection]);

    const toggleSort = (nextSortKey: SortKey) => {
        if (sortKey === nextSortKey) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortKey(nextSortKey);
        setSortDirection(nextSortKey === "name" || nextSortKey === "category" ? "asc" : "desc");
    };

    return (
        <div className="space-y-5">
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

            <div className="rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div>
                        <p className="text-base font-semibold text-[var(--home-text)]">Ürün Yönetimi</p>
                        <p className="text-sm text-[var(--home-muted)] mt-0.5">Ürünleri Fayans ve Ek Ürün sekmelerinde görüntüleyin, düzenleyin ve pasife alın.</p>
                    </div>
                    <div className="text-xs text-[var(--home-muted)]">
                        Toplam {products.length} ürün · {activeTab} sekmesinde {filteredProducts.length} ürün
                    </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-1 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab("Fayans")}
                        className={cn(
                            "h-9 px-4 rounded-lg text-sm font-semibold transition-colors",
                            activeTab === "Fayans"
                                ? "bg-[var(--home-accent)] text-white"
                                : "text-[var(--home-muted)] hover:text-[var(--home-text)]"
                        )}
                    >
                        Fayans
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("Ek Ürün")}
                        className={cn(
                            "h-9 px-4 rounded-lg text-sm font-semibold transition-colors",
                            activeTab === "Ek Ürün"
                                ? "bg-[var(--home-accent)] text-white"
                                : "text-[var(--home-muted)] hover:text-[var(--home-text)]"
                        )}
                    >
                        Ek Ürün
                    </button>
                </div>

                <div className="mt-4 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--home-muted)]">Ürün + Varyant Ekle</p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                        <Input
                            label="Ürün Adı"
                            value={newProductName}
                            onChange={(event) => setNewProductName(event.target.value)}
                            placeholder="Örn: Öykü"
                            className="h-10"
                        />

                        <div>
                            <label className="block text-xs font-semibold text-[var(--home-muted)] mb-1 uppercase tracking-wider">Kategori</label>
                            <select
                                value={newProductCategory}
                                onChange={(event) => {
                                    const category = event.target.value as "Fayans" | "Ek Ürün";
                                    setNewProductCategory(category);
                                    setNewProductUnit(category === "Fayans" ? "m²" : "Adet");
                                }}
                                className="h-10 w-full rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-3 text-sm text-[var(--home-text)]"
                            >
                                <option value="Fayans">Fayans</option>
                                <option value="Ek Ürün">Ek Ürün</option>
                            </select>
                        </div>

                        <Input
                            label="Varyant"
                            value={newProductVariantName}
                            onChange={(event) => setNewProductVariantName(event.target.value)}
                            placeholder="Örn: 60x120 / 2mm"
                            className="h-10"
                        />

                        <Input
                            label="Birim"
                            value={newProductUnit}
                            onChange={(event) => setNewProductUnit(event.target.value)}
                            placeholder="m² / Adet"
                            className="h-10"
                        />

                        <Input
                            label="Varsayılan Fiyat"
                            type="number"
                            value={newProductPrice}
                            onChange={(event) => setNewProductPrice(event.target.value)}
                            placeholder="0"
                            className="h-10"
                        />

                        <Input
                            label="Açıklama"
                            value={newProductSpecs}
                            onChange={(event) => setNewProductSpecs(event.target.value)}
                            placeholder="Opsiyonel"
                            className="h-10"
                        />
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleCancelCreateProduct}
                            className="px-3 py-2 rounded-md border border-[var(--home-border)] text-[var(--home-muted)] hover:bg-[var(--home-surface)] text-sm font-medium"
                        >
                            İptal
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleCreateProduct()}
                            disabled={isCreatingProduct}
                            className="px-3 py-2 rounded-md bg-[var(--home-accent)] text-white hover:bg-[var(--home-accent-strong)] disabled:opacity-50 text-sm font-semibold"
                        >
                            {isCreatingProduct ? "Ekleniyor..." : "Kataloğa Ekle"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_auto_auto] gap-3 mt-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--home-muted)]" />
                        <Input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Ürün adı veya açıklama ara"
                            className="pl-9"
                        />
                    </div>

                    <select
                        value={activeFilter}
                        onChange={(event) => setActiveFilter(event.target.value as "Aktif" | "Pasif" | "Tümü")}
                        className="h-11 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-3 text-sm text-[var(--home-text)]"
                    >
                        <option value="Aktif">Aktif</option>
                        <option value="Pasif">Pasif</option>
                        <option value="Tümü">Tümü</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => void loadProducts()}
                        className="h-11 px-4 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] text-sm font-semibold text-[var(--home-text)] hover:bg-[var(--home-surface-soft)]"
                    >
                        Yenile
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="bg-[var(--home-surface-soft)] text-[var(--home-muted)] text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <button type="button" className="font-semibold hover:text-[var(--home-text)]" onClick={() => toggleSort("name")}>Ad</button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button type="button" className="font-semibold hover:text-[var(--home-text)]" onClick={() => toggleSort("category")}>Kategori</button>
                                </th>
                                <th className="px-4 py-3 text-left">Birim</th>
                                <th className="px-4 py-3 text-left">Açıklama</th>
                                <th className="px-4 py-3 text-right">
                                    <button type="button" className="font-semibold hover:text-[var(--home-text)]" onClick={() => toggleSort("defaultPrice")}>Varsayılan Fiyat</button>
                                </th>
                                <th className="px-4 py-3 text-center">Durum</th>
                                <th className="px-4 py-3 text-right">
                                    <button type="button" className="font-semibold hover:text-[var(--home-text)]" onClick={() => toggleSort("updatedAt")}>Güncellenme</button>
                                </th>
                                <th className="px-4 py-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-[var(--home-muted)]">Yükleniyor...</td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-[var(--home-muted)]">Ürün bulunamadı.</td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const isEditing = editingId === product.id && editingDraft;

                                    return (
                                        <tr key={product.id} className="border-t border-[var(--home-border)] hover:bg-[var(--home-surface-soft)]/60">
                                            <td className="px-4 py-3 align-top">
                                                {isEditing ? (
                                                    <Input
                                                        value={editingDraft.name}
                                                        onChange={(event) => setEditingDraft({ ...editingDraft, name: event.target.value })}
                                                        className="h-10"
                                                    />
                                                ) : (
                                                    <p className="font-semibold text-[var(--home-text)]">{product.name}</p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                {isEditing ? (
                                                    <select
                                                        value={editingDraft.category}
                                                        onChange={(event) => {
                                                            const category = event.target.value as "Fayans" | "Ek Ürün";
                                                            setEditingDraft({
                                                                ...editingDraft,
                                                                category,
                                                                unit: category === "Fayans" ? "m²" : "Adet",
                                                            });
                                                        }}
                                                        className="h-10 w-full rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-3 text-sm text-[var(--home-text)]"
                                                    >
                                                        <option value="Fayans">Fayans</option>
                                                        <option value="Ek Ürün">Ek Ürün</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-[var(--home-text)]">{product.category}</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                {isEditing ? (
                                                    <Input
                                                        value={editingDraft.unit}
                                                        onChange={(event) => setEditingDraft({ ...editingDraft, unit: event.target.value })}
                                                        className="h-10"
                                                    />
                                                ) : (
                                                    <span className="text-[var(--home-text)]">{product.unit}</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-top max-w-[280px]">
                                                {isEditing ? (
                                                    <Input
                                                        value={editingDraft.specs}
                                                        onChange={(event) => setEditingDraft({ ...editingDraft, specs: event.target.value })}
                                                        className="h-10"
                                                    />
                                                ) : (
                                                    <span className="text-[var(--home-muted)]">{product.specs || "-"}</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-top text-right">
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={editingDraft.defaultPrice}
                                                        onChange={(event) => setEditingDraft({ ...editingDraft, defaultPrice: event.target.value })}
                                                        className="h-10 text-right"
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-[var(--home-text)]">
                                                        {product.defaultPrice !== undefined ? formatCurrency(product.defaultPrice) : "-"}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-top text-center">
                                                <span
                                                    className={cn(
                                                        "inline-flex px-2 py-1 rounded-full text-xs font-semibold border",
                                                        product.isActive
                                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                            : "bg-slate-100 border-slate-200 text-slate-600"
                                                    )}
                                                >
                                                    {product.isActive ? "Aktif" : "Pasif"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 align-top text-right text-[var(--home-muted)]">
                                                {new Date(product.updatedAt).toLocaleDateString("tr-TR", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleSave(product.id)}
                                                                disabled={isSaving}
                                                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--home-accent)] text-white text-xs font-semibold hover:bg-[var(--home-accent-strong)] disabled:opacity-60"
                                                            >
                                                                <Save size={14} /> Kaydet
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--home-border)] text-xs font-semibold text-[var(--home-muted)] hover:bg-[var(--home-surface-soft)]"
                                                            >
                                                                <X size={14} /> İptal
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(product)}
                                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--home-border)] text-xs font-semibold text-[var(--home-text)] hover:bg-[var(--home-surface-soft)]"
                                                        >
                                                            <Pencil size={14} /> Düzenle
                                                        </button>
                                                    )}

                                                    {product.isActive && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleArchive(product.id)}
                                                            disabled={archivingId === product.id}
                                                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
                                                        >
                                                            <Trash2 size={14} /> Pasife Al
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
