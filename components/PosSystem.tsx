"use client";

import * as React from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import {
    Plus,
    Trash2,
    ShoppingCart,
    Printer,
    Receipt,
    Save,
    History,
    Loader2,
    Layers,
    Package,
    MoveRight,
    BrickWall,
    Ruler,
} from "lucide-react";
import { Input } from "./ui/Input";
import { NumberInput } from "./ui/NumberInput";
import { cn } from "@/lib/utils";
import { saveQuote, updateQuote } from "@/app/actions";
import { CartItem } from "@/types";
import Link from "next/link";

// --- Types ---

type CalculationMode = "dimensions" | "direct" | "metre";
type WizardStep = 1 | 2 | 3;

type ExtraCalcType = "coverage" | "quantity" | "fixed";

type ExtraCategory = "Hazırlık" | "Uygulama" | "Bitiş";

type ExtraProduct = {
    id: string;
    name: string;
    enabled: boolean;
    category: ExtraCategory;
    calcType: ExtraCalcType;
    rate: number;
    price: number;
    unit: string;
    note: string;
};

type CartGroup = {
    id: string;
    tile: CartItem | null;
    extras: CartItem[];
};

const EXTRA_DEFAULTS: ExtraProduct[] = [
    { id: "fayans-ustu-astar", name: "Fayans Üstü Astar", enabled: false, category: "Hazırlık", calcType: "coverage", rate: 10, price: 0, unit: "Litre", note: "Yaklaşık tüketim: m² / litre" },
    { id: "sari-sapli-rulo", name: "Sarı Saplı Rulo", enabled: false, category: "Hazırlık", calcType: "quantity", rate: 1, price: 0, unit: "Adet", note: "Astar uygulamasında kullanılır" },
    { id: "parmak-rulo", name: "Parmak Rulo", enabled: false, category: "Hazırlık", calcType: "quantity", rate: 1, price: 0, unit: "Adet", note: "Kenar ve dar alan uygulamalarında kullanılır" },
    { id: "seramik-yapistirici-1133", name: "Seramik Yapıştırıcı 1133", enabled: false, category: "Uygulama", calcType: "coverage", rate: 5, price: 0, unit: "Torba", note: "Yaklaşık tüketim: m² / torba" },
    { id: "silikonlu-gri-derz", name: "Silikonlu Gri Derz", enabled: false, category: "Uygulama", calcType: "coverage", rate: 4, price: 0, unit: "Kg", note: "Yaklaşık tüketim: m² / kg" },
    { id: "silikonlu-beyaz-derz", name: "Silikonlu Beyaz Derz", enabled: false, category: "Uygulama", calcType: "coverage", rate: 4, price: 0, unit: "Kg", note: "Yaklaşık tüketim: m² / kg" },
    { id: "derz-malasi", name: "Derz Malası", enabled: false, category: "Uygulama", calcType: "quantity", rate: 1, price: 0, unit: "Adet", note: "Uygulama ekipmanı" },
    { id: "sungerli-mala", name: "Süngerli Mala", enabled: false, category: "Uygulama", calcType: "quantity", rate: 1, price: 0, unit: "Adet", note: "Temizlik ve bitiş için" },
    { id: "plastik-ic-kosebent", name: "Plastik İç Köşebent", enabled: false, category: "Bitiş", calcType: "quantity", rate: 1, price: 0, unit: "Adet", note: "İç köşelerde bitiş profili" },
    { id: "plastik-dis-kosebent", name: "Plastik Dış Köşebent", enabled: false, category: "Bitiş", calcType: "quantity", rate: 1, price: 0, unit: "Adet", note: "Dış köşelerde koruyucu profil" },
    { id: "3mm-derz-artisi", name: "3mm Derz Artısı", enabled: false, category: "Bitiş", calcType: "quantity", rate: 1, price: 0, unit: "Paket", note: "Derz aralığı sabitleme aparatı" },
];

type FormValues = {
    itemName: string;
    width: number;
    length: number;
    height: number;
    manualArea: number;
    manualMetres: number;
    includeWalls: boolean;
    tileWidth: number;
    tileLength: number;
    unitPrice: number;
};



const defaultValues: FormValues = {
    itemName: "",
    width: 0,
    length: 0,
    height: 2.6,
    manualArea: 0,
    manualMetres: 0,
    includeWalls: false,
    tileWidth: 60,
    tileLength: 120,
    unitPrice: 0,
};

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
    }).format(amount);
};

const formatNumber = (num: number, maxDigits = 2) => {
    return new Intl.NumberFormat("tr-TR", {
        maximumFractionDigits: maxDigits,
    }).format(num);
};

const parseNumberInput = (rawValue: string) => {
    const normalized = (rawValue || "").replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getExtraQuantity = (extra: ExtraProduct, requiredArea: number) => {
    if (extra.calcType === "coverage") {
        if (requiredArea <= 0) return 0;
        return Math.ceil(requiredArea / Math.max(extra.rate || 1, 1));
    }
    if (extra.calcType === "quantity") {
        return Math.max(Math.ceil(extra.rate || 0), 0);
    }
    return extra.enabled ? 1 : 0;
};

const getExtraTotal = (extra: ExtraProduct, requiredArea: number) => {
    const quantity = getExtraQuantity(extra, requiredArea);
    if (extra.calcType === "fixed") {
        return extra.price;
    }
    return quantity * extra.price;
};

export function PosSystem() {
    // --- State ---
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [mode, setMode] = React.useState<CalculationMode>("dimensions");
    const [isReceiptMode, setIsReceiptMode] = React.useState(false);
    const [customerName, setCustomerName] = React.useState("");

    // DB State
    const [isLoading, setIsLoading] = React.useState(false);
    const [extras, setExtras] = React.useState<ExtraProduct[]>(EXTRA_DEFAULTS);
    const [showStepErrors, setShowStepErrors] = React.useState<Record<WizardStep, boolean>>({ 1: false, 2: false, 3: false });
    const [editingQuoteId, setEditingQuoteId] = React.useState<string | null>(null);
    const [selectedExtraTargetGroupId, setSelectedExtraTargetGroupId] = React.useState<string>("standalone");
    const [extraAreaBase, setExtraAreaBase] = React.useState<number>(0);

    const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

    React.useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2600);
        return () => clearTimeout(timer);
    }, [toast]);

    const updateExtra = (id: string, updates: Partial<ExtraProduct>) => {
        setExtras(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    };



    const isInitialMount = React.useRef(true);
    // --- Persistence & Init ---
    React.useEffect(() => {
        const savedCart = localStorage.getItem("pos-cart-v1");
        const savedCustomerName = localStorage.getItem("pos-customer-name-v1");
        const savedEditQuoteId = localStorage.getItem("pos-edit-quote-id-v1");

        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                    setCart(parsedCart);
                }
            } catch (e) { console.error(e); }
        }

        if (savedCustomerName) {
            setCustomerName(savedCustomerName);
        }

        if (savedEditQuoteId) {
            setEditingQuoteId(savedEditQuoteId);
        }
    }, []);

    React.useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        localStorage.setItem("pos-cart-v1", JSON.stringify(cart));
    }, [cart]);

    React.useEffect(() => {
        if (customerName) {
            localStorage.setItem("pos-customer-name-v1", customerName);
        } else {
            localStorage.removeItem("pos-customer-name-v1");
        }
    }, [customerName]);

    React.useEffect(() => {
        if (cart.length === 0 && editingQuoteId) {
            localStorage.removeItem("pos-edit-quote-id-v1");
            setEditingQuoteId(null);
        }
    }, [cart.length, editingQuoteId]);

    // --- Form ---
    const {
        register,
        control,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues,
        mode: "onChange",
    });

    const values = useWatch({ control });

    // --- Calculation ---
    const calculateResult = (vals: FormValues) => {
        const width = Number(vals.width) || 0;
        const length = Number(vals.length) || 0;
        const height = Number(vals.height) || 0;
        const manualArea = Number(vals.manualArea) || 0;
        const manualMetres = Number(vals.manualMetres) || 0;
        const includeWalls = vals.includeWalls;

        const tileWidth = Number(vals.tileWidth) || 0;
        const tileLength = Number(vals.tileLength) || 0;
        const unitPrice = Number(vals.unitPrice) || 0;

        let rawArea = 0;
        if (mode === "direct") {
            rawArea = manualArea;
        } else if (mode === "metre") {
            rawArea = manualMetres * (tileWidth / 100);
        } else {
            const base = width * length;
            const walls = (includeWalls && height > 0) ? (width + length) * 2 * height : 0;
            rawArea = base + walls;
        }

        const requiredArea = rawArea > 0 ? rawArea : 0;

        // Custom predefined package areas based on tile dimensions
        const tileSpec = `${tileWidth}x${tileLength}`;
        let packageArea = 0;

        switch (tileSpec) {
            case "45x45": packageArea = 1.82; break;
            case "58x58": packageArea = 1.35; break;
            case "60x60": packageArea = 1.46; break;
            case "60x120": packageArea = 1.44; break;
            case "30x90": packageArea = 1.35; break;
            case "30x75": packageArea = 1.35; break;
            case "30x60": packageArea = 2.16; break;
            default:
                // Fallback to calculation if custom size is entered
                const singleTileArea = (tileWidth * tileLength) / 10000;
                packageArea = singleTileArea; // Assuming 1 piece per package for custom sizes if piecesPerPackage is removed
                break;
        }

        let requiredPackages = 0;
        if (requiredArea > 0 && packageArea > 0) {
            requiredPackages = Math.ceil(requiredArea / packageArea);
        }

        const soldArea = requiredPackages * packageArea;
        const totalPrice = soldArea * unitPrice;
        const fireRate = 0;

        // Calculate extras costs
        const extrasCost = extras
            .filter(e => e.enabled && e.price > 0)
            .reduce((sum, e) => {
                return sum + getExtraTotal(e, requiredArea);
            }, 0);

        return {
            requiredArea,
            requiredPackages,
            soldArea,
            totalPrice,
            extrasCost,
            grandItemTotal: totalPrice + extrasCost,
            fireRate,
            tileSpec: `${tileWidth}x${tileLength} cm`
        };
    };

    const preview = calculateResult({
        ...defaultValues,
        ...values,
        itemName: values.itemName || ""
    } as FormValues);

    const groupedExtras = React.useMemo(() => {
        const grouped = extras.reduce((acc, extra) => {
            if (!acc[extra.category]) {
                acc[extra.category] = [];
            }
            acc[extra.category].push(extra);
            return acc;
        }, {} as Record<ExtraCategory, ExtraProduct[]>);

        return ["Hazırlık", "Uygulama", "Bitiş"].map((category) => ({
            category,
            items: grouped[category as ExtraCategory] || [],
        }));
    }, [extras]);

    const cartGroups = React.useMemo<CartGroup[]>(() => {
        const groups: CartGroup[] = [];
        let fallbackGroup: CartGroup | null = null;

        const getOrCreateById = (id: string) => {
            const existing = groups.find(group => group.id === id);
            if (existing) return existing;

            const created: CartGroup = { id, tile: null, extras: [] };
            groups.push(created);
            return created;
        };

        cart.forEach(item => {
            if (item.groupId) {
                const group = getOrCreateById(item.groupId);
                if (item.itemType === "extra") {
                    group.extras.push(item);
                } else {
                    group.tile = item;
                }
                return;
            }

            if (item.itemType === "extra") {
                if (fallbackGroup) {
                    fallbackGroup.extras.push(item);
                } else {
                    groups.push({ id: item.id, tile: null, extras: [item] });
                }
                return;
            }

            fallbackGroup = { id: item.id, tile: item, extras: [] };
            groups.push(fallbackGroup);
        });

        return groups;
    }, [cart]);

    const tileTargets = React.useMemo(() => {
        return cartGroups
            .filter(group => group.tile)
            .map(group => ({
                id: group.id,
                label: group.tile?.name || "İsimsiz Ürün",
                area: group.tile?.requiredArea || 0,
            }));
    }, [cartGroups]);

    React.useEffect(() => {
        if (preview.requiredArea > 0) {
            setExtraAreaBase(preview.requiredArea);
        }
    }, [preview.requiredArea]);

    React.useEffect(() => {
        if (selectedExtraTargetGroupId === "standalone") return;
        const hasTarget = tileTargets.some(target => target.id === selectedExtraTargetGroupId);
        if (!hasTarget) {
            setSelectedExtraTargetGroupId("standalone");
        }
    }, [selectedExtraTargetGroupId, tileTargets]);

    const isStep1Valid = React.useMemo(() => {
        if (mode === "direct") {
            return (Number(values.manualArea) || 0) > 0;
        }

        if (mode === "metre") {
            return (Number(values.manualMetres) || 0) > 0;
        }

        const width = Number(values.width) || 0;
        const length = Number(values.length) || 0;
        const height = Number(values.height) || 0;
        const includeWalls = Boolean(values.includeWalls);

        if (width <= 0 || length <= 0) return false;
        if (includeWalls && height <= 0) return false;

        return true;
    }, [mode, values.manualArea, values.manualMetres, values.width, values.length, values.height, values.includeWalls]);

    const isStep2Valid = React.useMemo(() => {
        const tileWidth = Number(values.tileWidth) || 0;
        const tileLength = Number(values.tileLength) || 0;
        const unitPrice = Number(values.unitPrice) || 0;

        return tileWidth > 0 && tileLength > 0 && unitPrice > 0;
    }, [values.tileWidth, values.tileLength, values.unitPrice]);

    const isStep3Valid = React.useMemo(() => {
        return extras.every(extra => {
            if (!extra.enabled) return true;
            if (extra.price < 0 || Number.isNaN(extra.price)) return false;
            if (extra.calcType === "fixed") return true;
            return extra.rate > 0 && !Number.isNaN(extra.rate);
        });
    }, [extras]);

    const hasPurchasableExtras = React.useMemo(() => {
        const baseArea = Math.max(extraAreaBase || 0, preview.requiredArea || 0);
        return extras
            .filter(extra => extra.enabled && extra.price > 0)
            .some(extra => getExtraTotal(extra, baseArea) > 0);
    }, [extras, extraAreaBase, preview.requiredArea]);

    const canCheckoutWithTile = isStep1Valid && isStep2Valid && preview.totalPrice > 0;

    const stepValidity: Record<WizardStep, boolean> = {
        1: isStep1Valid,
        2: isStep2Valid,
        3: canCheckoutWithTile,
    };

    const canAddToCart = stepValidity[3];

    const buildExtraCartItems = (requiredArea: number, groupId?: string, parentName?: string): CartItem[] => {
        const sourceArea = Math.max(requiredArea || 0, 0);
        const items: CartItem[] = [];

        extras
            .filter(extra => extra.enabled && extra.price > 0)
            .forEach(extra => {
                const quantity = getExtraQuantity(extra, sourceArea);
                const total = getExtraTotal(extra, sourceArea);
                if (total <= 0) return;

                const specText = extra.calcType === "fixed"
                    ? `${extra.note} • Sabit Tutar`
                    : `${quantity} ${extra.unit} × ${formatCurrency(extra.price)}`;

                items.push({
                    id: crypto.randomUUID(),
                    groupId,
                    itemType: "extra",
                    name: parentName ? `${extra.name} (${parentName})` : `${extra.name} (Bağımsız)`,
                    specs: specText,
                    requiredArea: sourceArea,
                    includeFire: false,
                    fireRate: 0,
                    requiredPieces: quantity,
                    requiredPackages: quantity,
                    soldArea: quantity,
                    unitPrice: extra.price,
                    priceUnit: extra.calcType === "fixed" ? "sabit" : "adet",
                    totalPrice: total,
                    extraCategory: extra.category,
                    extraCalcType: extra.calcType,
                    unit: extra.unit,
                    quantity,
                    note: extra.note,
                });
            });

        return items;
    };

    // --- Actions ---
    const addToCart = () => {
        if (!canAddToCart) {
            setShowStepErrors(prev => ({ ...prev, 3: true }));
            return;
        }

        const groupId = crypto.randomUUID();
        const newItems: CartItem[] = [];

        if (preview.totalPrice > 0 && isStep1Valid && isStep2Valid) {
            newItems.push({
                id: crypto.randomUUID(),
                groupId,
                name: values.itemName || "İsimsiz Ürün",
                itemType: "tile",
                specs: preview.tileSpec,
                requiredArea: preview.requiredArea,
                includeFire: false,
                fireRate: 0,
                requiredPieces: 0,
                requiredPackages: preview.requiredPackages,
                soldArea: preview.soldArea,
                unitPrice: Number(values.unitPrice) || 0,
                priceUnit: "m2",
                totalPrice: preview.totalPrice,
            });
        }

        const extraItems = buildExtraCartItems(preview.requiredArea, groupId, values.itemName || "İsimsiz");
        newItems.push(...extraItems);

        setCart([...cart, ...newItems]);

        // Reset key fields
        setValue("itemName", "");
        setValue("width", 0);
        setValue("length", 0);
        setValue("manualArea", 0);
        setValue("manualMetres", 0);
        setShowStepErrors({ 1: false, 2: false, 3: false });
    };

    const addExtrasToCart = () => {
        if (!isStep3Valid) {
            setToast({ type: "error", message: "Ek ürün değerleri geçersiz. Oran/fiyat alanlarını kontrol edin." });
            return;
        }

        const selectedTarget = tileTargets.find(target => target.id === selectedExtraTargetGroupId);
        const baseArea = selectedTarget ? selectedTarget.area : Math.max(extraAreaBase || 0, preview.requiredArea || 0);
        const parentName = selectedTarget?.label;

        const extraItems = buildExtraCartItems(baseArea, selectedTarget?.id, parentName);
        if (extraItems.length === 0) {
            setToast({ type: "error", message: "Sepete eklemek için fiyatı olan en az bir ek ürün seçin." });
            return;
        }

        setCart(prev => [...prev, ...extraItems]);
        setToast({ type: "success", message: selectedTarget ? "Ek ürünler seçilen ürüne eklendi." : "Bağımsız ek ürünler sepete eklendi." });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => {
            const target = prev.find(item => item.id === id);
            if (!target) return prev;

            if (target.itemType === "tile" && target.groupId) {
                return prev.filter(item => item.groupId !== target.groupId);
            }

            return prev.filter(item => item.id !== id);
        });
    };

    const updateCartItem = (id: string, updater: (item: CartItem) => CartItem) => {
        setCart(prev => prev.map(item => item.id === id ? updater(item) : item));
    };

    const handleCartUnitPriceChange = (id: string, rawValue: string) => {
        const nextUnitPrice = Math.max(parseNumberInput(rawValue), 0);
        updateCartItem(id, (item) => {
            if (item.itemType === "extra") {
                const quantity = Math.max(item.quantity || item.requiredPieces || 1, 1);
                return {
                    ...item,
                    unitPrice: nextUnitPrice,
                    totalPrice: nextUnitPrice * quantity,
                };
            }

            const soldArea = Math.max(item.soldArea || 0, 0);
            return {
                ...item,
                unitPrice: nextUnitPrice,
                totalPrice: nextUnitPrice * soldArea,
            };
        });
    };

    const handleCartTotalPriceChange = (id: string, rawValue: string) => {
        const nextTotalPrice = Math.max(parseNumberInput(rawValue), 0);
        updateCartItem(id, (item) => ({
            ...item,
            totalPrice: nextTotalPrice,
        }));
    };

    const handleCartQuantityChange = (id: string, rawValue: string) => {
        const nextQuantity = Math.max(parseNumberInput(rawValue), 0);
        updateCartItem(id, (item) => {
            if (item.itemType !== "extra") return item;

            return {
                ...item,
                quantity: nextQuantity,
                requiredPieces: nextQuantity,
                requiredPackages: nextQuantity,
                soldArea: nextQuantity,
                totalPrice: (item.unitPrice || 0) * nextQuantity,
            };
        });
    };

    const handleCartSoldAreaChange = (id: string, rawValue: string) => {
        const nextSoldArea = Math.max(parseNumberInput(rawValue), 0);
        updateCartItem(id, (item) => {
            if (item.itemType === "extra") return item;

            return {
                ...item,
                soldArea: nextSoldArea,
                totalPrice: (item.unitPrice || 0) * nextSoldArea,
            };
        });
    };

    const grandTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const selectedExtraTarget = tileTargets.find(target => target.id === selectedExtraTargetGroupId);
    const currentExtraArea = selectedExtraTarget ? selectedExtraTarget.area : Math.max(extraAreaBase || 0, preview.requiredArea || 0);
    const rightPanelExtraCount = extras.filter(extra => extra.enabled && extra.price > 0).length;
    const rightPanelExtraTotal = extras
        .filter(extra => extra.enabled && extra.price > 0)
        .reduce((sum, extra) => sum + getExtraTotal(extra, currentExtraArea), 0);

    const handleSaveToDB = async () => {
        if (cart.length === 0) return;
        setIsLoading(true);
        const res = editingQuoteId
            ? await updateQuote({
                id: editingQuoteId,
                customerName,
                items: cart,
                totalAmount: grandTotal,
            })
            : await saveQuote({
                customerName,
                items: cart,
                totalAmount: grandTotal
            });
        setIsLoading(false);
        if (res.success) {
            setToast({ type: "success", message: editingQuoteId ? "Fiş güncellendi." : "Fiş başarıyla kaydedildi." });
            if (editingQuoteId) {
                localStorage.removeItem("pos-edit-quote-id-v1");
                setEditingQuoteId(null);
            }
        } else {
            setToast({ type: "error", message: "Kaydetme başarısız oldu: " + res.error });
        }
    };

    const handlePrint = () => window.print();

    // --- Render ---

    // Receipt View
    if (isReceiptMode) {
        // (Keep existing Receipt View logic identical for now)
        return (
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(83,116,217,0.16),transparent_45%),var(--home-bg)] min-h-screen text-slate-900 font-sans p-4 lg:p-8 max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-200 print:bg-white print:text-black">
                <div className="print:hidden mb-6 flex gap-4 justify-between items-center bg-[var(--home-surface)] p-4 rounded-2xl border border-[var(--home-border)] shadow-sm">
                    <div className="text-sm font-semibold text-[var(--home-muted)]">Fiş Önizleme Modu</div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsReceiptMode(false)} className="px-4 py-2 bg-[var(--home-surface)] text-[var(--home-text)] border border-[var(--home-border)] rounded-xl hover:bg-[var(--home-surface-soft)] text-sm font-semibold">Düzenlemeye Dön</button>
                        <button onClick={handlePrint} className="px-4 py-2 bg-[var(--home-accent)] text-white rounded-xl hover:bg-[var(--home-accent-strong)] flex items-center gap-2 text-sm font-semibold"><Printer size={16} /> Yazdır</button>
                    </div>
                </div>
                <div className="border border-[var(--home-border)] p-6 lg:p-8 rounded-3xl print:border-0 print:p-0 bg-[var(--home-surface)] print:bg-white shadow-[0_20px_55px_rgba(35,67,150,0.1)] print:shadow-none">
                    <div className="text-center mb-8 pb-8 border-b border-dashed border-[var(--home-border)]">
                        <h1 className="text-3xl font-black tracking-tight mb-1 text-[var(--home-text)]">AKSA SERAMIK</h1>
                        <p className="text-sm text-[var(--home-muted)] font-semibold uppercase tracking-[0.12em]">Seramik ve Yapi Malzemeleri</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date().toLocaleDateString("tr-TR")}</p>
                    </div>
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Musteri</p>
                            <p className="text-lg font-bold text-gray-900">{customerName || "Misafir Musteri"}</p>
                        </div>
                    </div>
                    <table className="w-full text-sm mb-8">
                        <thead className="border-b-2 border-black">
                            <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                                <th className="py-2 font-medium">Ürün</th>
                                <th className="py-2 text-center font-medium">Paket</th>
                                <th className="py-2 text-right font-medium">Miktar</th>
                                <th className="py-2 text-right font-medium">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cart.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 pr-2"><p className="font-bold text-gray-900 flex items-center gap-2">{item.name}{item.itemType === "extra" && <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 uppercase tracking-wider">Ek Ürün</span>}</p><p className="text-xs text-gray-600 mt-0.5">{item.specs}</p></td>
                                    <td className="py-3 text-center align-top pt-3.5"><span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{item.itemType === "extra" ? "-" : item.requiredPackages}</span></td>
                                    <td className="py-3 text-right align-top pt-3.5"><p className="font-medium text-gray-900">{item.itemType === "extra" ? `${item.quantity || item.requiredPieces} ${item.unit || "Adet"}` : `${formatNumber(item.soldArea)} m²`}{item.priceUnit === "metre" && <span className="block text-xs text-gray-400">Metre fiyatlı</span>}</p></td>
                                    <td className="py-3 text-right font-bold text-gray-900 align-top pt-3.5">{formatCurrency(item.totalPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end border-t-2 border-black pt-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-500 mb-1">GENEL TOPLAM</p>
                            <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{formatCurrency(grandTotal)}</p>
                            <p className="text-xs text-gray-400 mt-2">KDV Dahildir.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // POS View
    return (
        <>
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

            <div className="space-y-3 max-w-[1700px] mx-auto">
                <div className="rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--home-muted)]">Aksa Seramik POS</p>
                            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-[var(--home-text)]">Operasyon Paneli</h1>
                        </div>
                        <div className="grid grid-cols-3 gap-2 lg:w-[520px]">
                            <div className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-widest text-[var(--home-muted)]">Kalem</p>
                                <p className="text-lg font-black text-[var(--home-text)]">{cart.length}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-widest text-[var(--home-muted)]">Ek Ürün</p>
                                <p className="text-lg font-black text-[var(--home-text)]">{rightPanelExtraCount}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--home-border)] bg-[var(--home-accent)] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-widest text-white/75">Toplam</p>
                                <p className="text-lg font-black tracking-tight text-white">{formatCurrency(grandTotal)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3 rounded-2xl border border-[var(--home-border)] p-3 bg-[var(--home-surface-soft)] lg:h-[calc(100vh-6rem)]">

                {/* LEFT PANEL: Calculator + Extras (Tabbed) */}
                <div className="w-full lg:w-[430px] xl:w-[460px] shrink-0 flex flex-col rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] overflow-hidden">
                    {/* Müşteri + Etiket - Sabit üstte */}
                    <div className="p-3.5 space-y-3 border-b border-[var(--home-border)] shrink-0 bg-[var(--home-surface-soft)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--home-muted)]">Hızlı Satış</p>
                                <h2 className="text-base font-extrabold tracking-tight text-[var(--home-text)]">Hızlı Satış Akışı</h2>
                            </div>
                            <div className="rounded-md border border-[var(--home-border)] bg-[var(--home-surface)] px-2 py-1 text-[10px] font-bold text-[var(--home-accent-strong)]">CANLI</div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Müşteri</label>
                                <Input
                                    placeholder="Müşteri Adı / Not"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="h-10 bg-white border-blue-300 text-slate-900 font-medium focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Etiket</label>
                                <Input placeholder="30x60 ELBA" {...register("itemName")} className="h-10 bg-white border-blue-300 text-slate-900 focus-visible:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Single Flow Content */}
                    <div className="flex-1 overflow-auto min-h-0 bg-[var(--home-surface)]">
                        <div className="p-4 space-y-4">
                            <div className="rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-3 py-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--home-accent-strong)]">1. Hızlı Ürün Girişi</p>
                            </div>
                                {/* Mod Seçimi */}
                                <div className="rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-1 flex text-sm font-medium">
                                    <button onClick={() => setMode("dimensions")} className={cn("flex-1 rounded-xl py-2 transition-all text-xs font-bold", mode === "dimensions" ? "bg-[var(--home-surface)] text-[var(--home-accent-strong)] shadow-sm" : "text-[var(--home-muted)] hover:text-[var(--home-text)]")}>Ölçü</button>
                                    <button onClick={() => setMode("direct")} className={cn("flex-1 rounded-xl py-2 transition-all text-xs font-bold", mode === "direct" ? "bg-[var(--home-surface)] text-[var(--home-accent-strong)] shadow-sm" : "text-[var(--home-muted)] hover:text-[var(--home-text)]")}>Direkt m²</button>
                                    <button onClick={() => setMode("metre")} className={cn("flex-1 rounded-xl py-2 transition-all text-xs font-bold", mode === "metre" ? "bg-[var(--home-surface)] text-[var(--home-accent-strong)] shadow-sm" : "text-[var(--home-muted)] hover:text-[var(--home-text)]")}>Metre</button>
                                </div>

                                {/* Adım 1: Alan */}
                                <div className="rounded-lg border border-[var(--home-border)] p-3 space-y-3 bg-[var(--home-surface)]">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">1. Alan Hesabı</p>
                                    {mode === "dimensions" ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <Controller control={control} name="width" render={({ field }) => <NumberInput label="En (m)" step={0.01} className="h-10" {...field} error={errors.width?.message} />} />
                                                <Controller control={control} name="length" render={({ field }) => <NumberInput label="Boy (m)" step={0.01} className="h-10" {...field} error={errors.length?.message} />} />
                                            </div>
                                            <div className="flex items-center gap-3 pt-2 border-t border-dashed border-[var(--home-border)]">
                                                <input type="checkbox" id="walls" className="w-4 h-4 rounded border-[var(--home-border)] accent-[var(--home-accent)]" {...register("includeWalls")} />
                                                <label htmlFor="walls" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2"><BrickWall size={14} /> Duvar</label>
                                            </div>
                                            {values.includeWalls && (
                                                <Controller control={control} name="height" render={({ field }) => <NumberInput label="Tavan (m)" step={0.01} className="h-10" {...field} error={errors.height?.message} />} />
                                            )}
                                        </div>
                                    ) : mode === "direct" ? (
                                        <Controller control={control} name="manualArea" render={({ field }) => (
                                            <input type="number" className="w-full h-11 px-4 text-lg font-bold text-center rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] text-[var(--home-text)] focus:outline-none focus:ring-2 focus:ring-[var(--home-accent)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" placeholder="0 m²" value={field.value || ""} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                                        )} />
                                    ) : (
                                        <div className="space-y-1">
                                            <Controller control={control} name="manualMetres" render={({ field }) => (
                                                <input type="number" className="w-full h-11 px-4 text-lg font-bold text-center rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] text-[var(--home-text)] focus:outline-none focus:ring-2 focus:ring-[var(--home-accent)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" placeholder="0 metre" value={field.value || ""} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                                            )} />
                                            <p className="text-[11px] text-slate-500 flex items-center gap-1"><Ruler size={11} /> Ene göre m²&apos;ye çevrilir</p>
                                        </div>
                                    )}
                                    {showStepErrors[1] && !isStep1Valid && <p className="text-xs text-red-500">Geçerli alan bilgisi girin.</p>}
                                </div>

                                {/* Adım 2: Seramik */}
                                <div className="rounded-lg border border-[var(--home-border)] p-3 space-y-3 bg-[var(--home-surface)]">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Layers size={11} /> 2. Seramik</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[{ w: 30, l: 60, m: 2.16 }, { w: 60, l: 60, m: 1.46 }, { w: 60, l: 120, m: 1.44 }, { w: 30, l: 90, m: 1.35 }, { w: 30, l: 75, m: 1.35 }, { w: 45, l: 45, m: 1.82 }, { w: 58, l: 58, m: 1.35 }].map(size => (
                                            <button type="button" key={`${size.w}-${size.l}`} onClick={() => { setValue("tileWidth", size.w); setValue("tileLength", size.l); }} className="text-[11px] font-semibold border border-[var(--home-border)] bg-[var(--home-surface)] text-[var(--home-muted)] rounded-lg px-2 py-1 hover:bg-[var(--home-surface-soft)] hover:text-[var(--home-accent-strong)] active:scale-95 transition-all">{size.w}x{size.l}</button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Controller control={control} name="tileWidth" render={({ field }) => <NumberInput label="En (cm)" className="h-10 text-sm" {...field} />} />
                                        <Controller control={control} name="tileLength" render={({ field }) => <NumberInput label="Boy (cm)" className="h-10 text-sm" {...field} />} />
                                        <Controller control={control} name="unitPrice" render={({ field }) => <NumberInput label="₺/m²" className="h-10 text-sm font-semibold" step={0.5} {...field} />} />
                                    </div>
                                    {showStepErrors[2] && !isStep2Valid && <p className="text-xs text-red-500">Ölçüleri ve m² fiyatını girin.</p>}
                                </div>

                                {/* Özet + Sepete Ekle */}
                                <div className="bg-[var(--home-accent)] p-3 rounded-lg text-white relative overflow-hidden border border-[color-mix(in_srgb,var(--home-accent)_70%,black_30%)]">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-end mb-3 pb-3 border-b border-white/10">
                                            <div className="text-sm text-blue-200 space-y-0.5">
                                                <p className="flex items-center gap-1.5 font-medium"><Package size={14} /> {preview.requiredPackages} Paket</p>
                                                <p className="flex items-center gap-1.5 font-medium"><MoveRight size={14} /> {formatNumber(preview.soldArea)} m²</p>
                                                {preview.extrasCost > 0 && <p className="text-[11px] text-blue-100">+ {formatCurrency(preview.extrasCost)} ek ürünler</p>}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black tracking-tight">{formatCurrency(preview.grandItemTotal)}</div>
                                                {preview.extrasCost > 0 && <p className="text-[10px] text-blue-200">Seramik: {formatCurrency(preview.totalPrice)}</p>}
                                            </div>
                                        </div>
                                        <button onClick={addToCart} disabled={!canAddToCart} className="w-full py-2.5 bg-white/15 text-white rounded-md text-sm font-bold hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-white/20">
                                            <Plus size={18} strokeWidth={3} /> Sepete Ekle
                                        </button>
                                        {showStepErrors[3] && !canAddToCart && <p className="text-xs text-red-300 mt-2">Adım 1 ve 2 bilgilerini tamamlayın.</p>}
                                    </div>
                                </div>
                            <div className="rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-3 py-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--home-accent-strong)] flex items-center gap-2">2. Ek Ürün Merkezi <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[var(--home-accent)] text-white text-[10px]">{rightPanelExtraCount}</span></p>
                            </div>

                            <div className="space-y-3 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] p-3">

                                <div className="flex items-center gap-2 flex-wrap">
                                    <button type="button" onClick={() => setSelectedExtraTargetGroupId("standalone")} className={cn("px-3 py-2 rounded-lg text-xs font-bold transition-all border", selectedExtraTargetGroupId === "standalone" ? "bg-[var(--home-accent)] text-white border-[var(--home-accent)] shadow-sm" : "bg-[var(--home-surface)] text-[var(--home-muted)] border-[var(--home-border)] hover:bg-[var(--home-surface-soft)]")}>Bağımsız</button>
                                    {tileTargets.map(target => (
                                        <button key={target.id} type="button" onClick={() => setSelectedExtraTargetGroupId(target.id)} className={cn("px-3 py-2 rounded-lg text-xs font-bold transition-all border max-w-[140px] truncate", selectedExtraTargetGroupId === target.id ? "bg-[var(--home-accent)] text-white border-[var(--home-accent)] shadow-sm" : "bg-[var(--home-surface)] text-[var(--home-muted)] border-[var(--home-border)] hover:bg-[var(--home-surface-soft)]")} title={target.label}>{target.label}</button>
                                    ))}
                                </div>

                                {selectedExtraTargetGroupId === "standalone" && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Alan (m²)</label>
                                        <input type="number" className="flex-1 h-9 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-3 text-sm font-bold text-[var(--home-text)] focus:outline-none focus:ring-2 focus:ring-[var(--home-accent)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" value={extraAreaBase || ""} onChange={(e) => setExtraAreaBase(Math.max(parseNumberInput(e.target.value), 0))} onWheel={(e) => (e.target as HTMLInputElement).blur()} placeholder="0" />
                                    </div>
                                )}

                                {/* Ek Ürün Listesi */}
                                {groupedExtras.map(group => {
                                    const categoryColors: Record<string, string> = { "Hazırlık": "bg-amber-500", "Uygulama": "bg-blue-500", "Bitiş": "bg-emerald-500" };
                                    return (
                                        <div key={group.category}>
                                            <div className="flex items-center gap-2 py-2 mt-1 first:mt-0">
                                                <div className={cn("w-1.5 h-4 rounded-full", categoryColors[group.category] || "bg-gray-400")} />
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{group.category}</span>
                                            </div>
                                            {group.items.map(extra => {
                                                const quantity = getExtraQuantity(extra, currentExtraArea);
                                                const total = getExtraTotal(extra, currentExtraArea);
                                                return (
                                                    <div key={extra.id} className={cn("rounded-xl border px-3 py-2.5 mb-1.5 transition-all", extra.enabled ? "border-blue-300 bg-blue-50/80 shadow-sm" : "border-transparent hover:border-blue-200 hover:bg-blue-50/30")}>
                                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                                            <input type="checkbox" checked={extra.enabled} onChange={(e) => updateExtra(extra.id, { enabled: e.target.checked })} className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0" />
                                                            <span className={cn("text-sm font-semibold flex-1", extra.enabled ? "text-slate-900" : "text-slate-400")}>{extra.name}</span>
                                                            {extra.enabled && total > 0 && <span className="text-xs font-bold text-blue-700 whitespace-nowrap">{formatCurrency(total)}</span>}
                                                        </label>
                                                        {extra.enabled && (
                                                            <div className="mt-2 ml-7 flex items-center gap-2 flex-wrap">
                                                                {extra.calcType !== "fixed" && (
                                                                    <div className="flex items-center gap-1.5 bg-white rounded-lg border border-blue-200 px-2 py-1">
                                                                        <input type="number" className="w-12 h-7 text-center text-xs font-bold bg-transparent focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" value={extra.rate} onChange={(e) => updateExtra(extra.id, { rate: parseFloat(e.target.value) || 0 })} onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                                                                        <span className="text-[10px] text-slate-500 font-medium">{extra.calcType === "coverage" ? `m²/${extra.unit.toLowerCase()}` : extra.unit}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1.5 bg-white rounded-lg border border-blue-200 px-2 py-1">
                                                                    <input type="number" className="w-14 h-7 text-center text-xs font-bold bg-transparent focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" value={extra.price} onChange={(e) => updateExtra(extra.id, { price: parseFloat(e.target.value) || 0 })} onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                                                                    <span className="text-[10px] text-slate-500 font-medium">₺/{extra.calcType === "fixed" ? "sabit" : extra.unit.toLowerCase()}</span>
                                                                </div>
                                                                {extra.calcType !== "fixed" && quantity > 0 && <span className="text-[11px] text-slate-500 font-medium">→ {quantity} {extra.unit}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}

                                {/* Ek Ürün Footer */}
                                {showStepErrors[3] && !isStep3Valid && <p className="text-xs text-red-500 font-medium">Ek ürünlerde oran ve fiyat değerleri geçersiz.</p>}
                                <div className="flex items-center justify-between rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-3 py-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam</span>
                                    <span className="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(rightPanelExtraTotal)}</span>
                                </div>
                                <button type="button" onClick={addExtrasToCart} disabled={!isStep3Valid || !hasPurchasableExtras} className="w-full py-3 bg-[var(--home-accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--home-accent-strong)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm">
                                    {selectedExtraTarget ? `"${selectedExtraTarget.label}" Ürününe Ekle` : "Bağımsız Ek Ürün Ekle"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Cart */}
                <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] overflow-hidden">
                    {/* Cart Header */}
                    <div className="shrink-0 border-b border-[var(--home-border)] bg-[var(--home-surface-soft)] px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-lg font-bold text-slate-900">
                            <div className="p-2 bg-[var(--home-surface)] text-[var(--home-accent-strong)] rounded-md border border-[var(--home-border)]"><ShoppingCart size={18} /></div>
                            Sepet <span className="bg-[var(--home-accent)] text-white text-xs px-2 py-0.5 rounded-full font-bold ml-1">{cart.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/pos/quotes" className="text-sm font-semibold text-[var(--home-accent-strong)] flex items-center gap-2 bg-[var(--home-surface)] border border-[var(--home-border)] px-3 py-1.5 rounded-md hover:bg-[var(--home-surface-soft)] transition-all">
                                <History size={15} /> <span className="hidden lg:inline">Kayıtlı Fişler</span>
                            </Link>
                            {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-md transition-colors flex items-center gap-1.5"><Trash2 size={14} /> Temizle</button>}
                        </div>
                    </div>

                    {/* Cart Content - only this scrolls */}
                    <div className="flex-1 overflow-auto min-h-0 bg-[var(--home-surface)]">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 space-y-4">
                                <div className="p-5 bg-[var(--home-surface-soft)] rounded-full border border-[var(--home-border)]"><ShoppingCart size={40} className="opacity-20" /></div>
                                <div className="text-center"><p className="text-base font-medium text-gray-500">Sepetiniz boş</p><p className="text-sm">Hesaplama yapıp ürün ekleyin.</p></div>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <table className="hidden md:table w-full text-sm text-left border-collapse">
                                    <thead className="bg-[var(--home-surface-soft)] text-slate-700 font-semibold border-b border-[var(--home-border)] text-xs uppercase tracking-wider sticky top-0 z-10">
                                        <tr><th className="px-5 py-3 font-medium">Ürün</th><th className="px-5 py-3 text-center font-medium">Paket</th><th className="px-5 py-3 text-center font-medium">Miktar</th><th className="px-5 py-3 text-right font-medium">Birim</th><th className="px-5 py-3 text-right font-medium">Tutar</th><th className="px-5 py-3 w-[40px]"></th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--home-border)] bg-[var(--home-surface)]">
                                        {cartGroups.map((group) => (
                                            <React.Fragment key={group.id}>
                                                {group.tile && (
                                                    <tr className="hover:bg-[var(--home-surface-soft)]/70 group transition-colors">
                                                        <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="p-1.5 bg-gray-100 rounded text-gray-400"><Layers size={14} /></div><div><p className="font-bold text-gray-900">{group.tile.name}</p><p className="text-xs text-gray-500">{group.tile.specs}</p></div></div></td>
                                                        <td className="px-5 py-3 text-center"><span className="bg-gray-100 text-gray-700 font-mono px-2 py-0.5 rounded text-xs font-bold border border-gray-200">{group.tile.requiredPackages}</span></td>
                                                        <td className="px-5 py-3 text-center"><input type="number" className="w-20 h-8 text-center text-xs font-semibold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={group.tile.soldArea || ""} onChange={(e) => handleCartSoldAreaChange(group.tile!.id, e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></td>
                                                        <td className="px-5 py-3 text-right"><input type="number" className="w-24 h-8 text-right px-2 text-xs font-semibold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={group.tile.unitPrice || ""} onChange={(e) => handleCartUnitPriceChange(group.tile!.id, e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></td>
                                                        <td className="px-5 py-3 text-right"><input type="number" className="w-28 h-8 text-right px-2 text-xs font-bold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={group.tile.totalPrice || ""} onChange={(e) => handleCartTotalPriceChange(group.tile!.id, e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></td>
                                                        <td className="px-5 py-3 text-center"><button onClick={() => removeFromCart(group.tile!.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button></td>
                                                    </tr>
                                                )}
                                                {group.extras.map((item) => (
                                                    <tr key={item.id} className="bg-[var(--home-surface-soft)]/60 hover:bg-[var(--home-surface-soft)] group transition-colors">
                                                        <td className="px-5 py-2.5"><div className="flex items-center gap-2 pl-2"><div className="p-1.5 bg-blue-100/80 rounded text-blue-600"><Plus size={12} /></div><div><p className="font-semibold text-gray-800 flex items-center gap-2">{item.name}<span className="text-[10px] px-1.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 uppercase">Ek</span></p><p className="text-xs text-gray-600">{item.specs}</p></div></div></td>
                                                        <td className="px-5 py-2.5 text-center"><span className="text-gray-400 text-xs">-</span></td>
                                                        <td className="px-5 py-2.5 text-center"><div className="inline-flex items-center gap-1"><input type="number" className="w-16 h-8 text-center text-xs font-semibold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={item.quantity || item.requiredPieces || ""} onChange={(e) => handleCartQuantityChange(item.id, e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} /><span className="text-xs text-gray-500">{item.unit || "Adet"}</span></div></td>
                                                        <td className="px-5 py-2.5 text-right"><input type="number" className="w-24 h-8 text-right px-2 text-xs font-semibold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={item.unitPrice || ""} onChange={(e) => handleCartUnitPriceChange(item.id, e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></td>
                                                        <td className="px-5 py-2.5 text-right"><input type="number" className="w-28 h-8 text-right px-2 text-xs font-bold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={item.totalPrice || ""} onChange={(e) => handleCartTotalPriceChange(item.id, e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></td>
                                                        <td className="px-5 py-2.5 text-center"><button onClick={() => removeFromCart(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"><Trash2 size={15} /></button></td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="md:hidden p-4 space-y-3">
                                    {cartGroups.map((group) => (
                                        <div key={group.id} className="bg-[var(--home-surface)] p-3 rounded-xl border border-[var(--home-border)] shadow-sm flex flex-col gap-2 relative">
                                            {group.tile && (
                                                <>
                                                    <button onClick={() => removeFromCart(group.tile!.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                                    <div><h3 className="font-bold text-gray-900 pr-6">{group.tile.name}</h3><p className="text-xs text-gray-500">{group.tile.specs}</p></div>
                                                    <div className="flex justify-between items-center bg-[var(--home-surface-soft)] p-2 rounded-lg text-sm border border-[var(--home-border)]">
                                                        <div className="text-center px-2 border-r border-gray-200"><p className="text-[10px] text-gray-500 uppercase">Paket</p><p className="font-bold">{group.tile.requiredPackages}</p></div>
                                                        <div className="text-center px-2"><p className="text-[10px] text-gray-500 uppercase">m²</p><input type="number" className="w-16 h-7 text-center text-xs font-semibold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={group.tile.soldArea || ""} onChange={(e) => handleCartSoldAreaChange(group.tile!.id, e.target.value)} /></div>
                                                        <div className="text-right px-2"><p className="text-[10px] text-gray-500 uppercase">Tutar</p><input type="number" className="w-20 h-7 text-right px-1 text-xs font-bold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={group.tile.totalPrice || ""} onChange={(e) => handleCartTotalPriceChange(group.tile!.id, e.target.value)} /></div>
                                                    </div>
                                                </>
                                            )}
                                            {group.extras.length > 0 && (
                                                <div className={cn("space-y-2", group.tile ? "border-t border-[var(--home-border)] pt-2" : "")}> 
                                                    {group.extras.map(item => (
                                                        <div key={item.id} className="bg-[var(--home-surface-soft)]/80 p-2 rounded-lg border border-[var(--home-border)] relative">
                                                            <button onClick={() => removeFromCart(item.id)} className="absolute top-1.5 right-1.5 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                                                            <h4 className="font-semibold text-gray-800 pr-6 text-sm">{item.name}</h4>
                                                            <div className="flex justify-between items-center mt-1.5 text-sm">
                                                                <div className="flex items-center gap-1 text-gray-500">
                                                                    <input type="number" className="w-12 h-7 text-center text-xs font-semibold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={item.quantity || item.requiredPieces || ""} onChange={(e) => handleCartQuantityChange(item.id, e.target.value)} />
                                                                    <span className="text-xs">{item.unit || "Adet"}</span>
                                                                </div>
                                                                <input type="number" className="w-20 h-7 text-right px-1 text-xs font-bold border border-[var(--home-border)] rounded bg-[var(--home-surface)]" value={item.totalPrice || ""} onChange={(e) => handleCartTotalPriceChange(item.id, e.target.value)} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Cart Footer - fixed at bottom */}
                    <div className="shrink-0 border-t border-[var(--home-border)] bg-[var(--home-surface)] p-4 lg:px-6 space-y-4 sticky bottom-0">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Genel Toplam</p>
                            <div className="text-right">
                                <div className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">{formatCurrency(grandTotal)}</div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">KDV Dahil</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleSaveToDB} disabled={cart.length === 0 || isLoading} className="flex-1 py-3 bg-[var(--home-surface)] text-[var(--home-text)] border border-[var(--home-border)] shadow-sm rounded-xl font-bold hover:bg-[var(--home-surface-soft)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]">
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {editingQuoteId ? "Güncelle" : "Kaydet"}
                            </button>
                            <button onClick={() => setIsReceiptMode(true)} disabled={cart.length === 0} className="flex-[2] py-3 bg-[var(--home-accent)] text-white rounded-xl font-bold hover:bg-[var(--home-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-sm transition-all active:scale-[0.98]">
                                <Receipt size={20} /> Fiş Oluştur
                            </button>
                        </div>
                    </div>
                </div>

                </div>
            </div>
        </>
    );
}

