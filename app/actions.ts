"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CartItem, ManageableProduct, ProductOption } from "@/types";
import { promises as fs } from "node:fs";
import path from "node:path";

const EXTRA_PRODUCT_PRESETS: Array<{ name: string; unit: string; specs?: string }> = [
    { name: "Plastik İç Köşebent", unit: "Adet" },
    { name: "Plastik Dış Köşebent", unit: "Adet" },
    { name: "2mm Derz Artısı", unit: "Paket" },
    { name: "3mm Derz Artısı", unit: "Paket" },
    { name: "Silikonlu Gri Derz", unit: "Kg" },
    { name: "Silikonlu Beyaz Derz", unit: "Kg" },
    { name: "Derz Malası", unit: "Adet" },
    { name: "Süngerli Mala", unit: "Adet" },
    { name: "Seramik Yapıştırıcı 1133", unit: "Torba" },
    { name: "Fayans Üstü Astar", unit: "Litre" },
    { name: "Sarı Saplı Rulo", unit: "Adet" },
    { name: "Parmak Rulo", unit: "Adet" },
];

type TileLibraryItem = {
    name?: string;
    description?: string;
    imagePath?: string;
    prompt?: string;
};

type ProductCategory = "Fayans" | "Ek Ürün";

const toDbProductType = (category: ProductCategory) => (category === "Fayans" ? "TILE" : "EXTRA");

const toUiProductType = (productType: string): "tile" | "extra" => (productType === "TILE" ? "tile" : "extra");

const toCategory = (productType: string): ProductCategory => (productType === "TILE" ? "Fayans" : "Ek Ürün");

const toOption = (product: {
    id: string;
    name: string;
    productType: string;
    category: string | null;
    unit: string;
    specs: string | null;
    defaultPrice: number | null;
}): ProductOption => ({
    id: product.id,
    productId: product.id,
    variantId: undefined,
    name: product.name,
    variantName: undefined,
    productType: toUiProductType(product.productType),
    category: toCategory(product.productType),
    unit: product.unit,
    specs: product.specs ?? undefined,
    defaultPrice: product.defaultPrice ?? undefined,
});

const toVariantOption = (product: {
    id: string;
    name: string;
    productType: string;
}, variant: {
    id: string;
    name: string;
    unit: string;
    specs: string | null;
    defaultPrice: number | null;
}): ProductOption => ({
    id: variant.id,
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    variantName: variant.name,
    productType: toUiProductType(product.productType),
    category: toCategory(product.productType),
    unit: variant.unit,
    specs: variant.specs ?? undefined,
    defaultPrice: variant.defaultPrice ?? undefined,
});

const toManageableProduct = (product: {
    id: string;
    name: string;
    productType: string;
    category: string | null;
    unit: string;
    specs: string | null;
    defaultPrice: number | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}): ManageableProduct => ({
    id: product.id,
    name: product.name,
    productType: toUiProductType(product.productType),
    category: toCategory(product.productType),
    unit: product.unit,
    specs: product.specs ?? undefined,
    defaultPrice: product.defaultPrice ?? undefined,
    isActive: product.isActive,
    sortOrder: product.sortOrder,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
});

const buildFallbackOptions = async (): Promise<ProductOption[]> => {
    const options: ProductOption[] = [];

    try {
        const tiles = await readTileLibraryItems();
        tiles.forEach((tile, index) => {
            const name = (tile.name || "").trim();
            if (!name) return;
            options.push({
                id: `tile-fallback-${index}-${name}`,
                name,
                productType: "tile",
                category: "Fayans",
                unit: "m²",
                specs: tile.description || undefined,
            });
        });
    } catch (error) {
        console.error("Fallback tile list read error:", error);
    }

    EXTRA_PRODUCT_PRESETS.forEach((preset, index) => {
        options.push({
            id: `extra-fallback-${index}-${preset.name}`,
            name: preset.name,
            productType: "extra",
            category: "Ek Ürün",
            unit: preset.unit,
            specs: preset.specs || undefined,
        });
    });

    return options;
};

async function readTileLibraryItems() {
    const tilesPath = path.join(process.cwd(), "public", "tile-library", "tiles.json");
    const raw = await fs.readFile(tilesPath, "utf8");
    const parsed = JSON.parse(raw) as TileLibraryItem[];
    return Array.isArray(parsed) ? parsed : [];
}

async function ensureExtraPresetProducts() {
    const presetNames = EXTRA_PRODUCT_PRESETS.map((preset) => preset.name);

    const existingExtraProducts = await prisma.product.findMany({
        where: {
            productType: "EXTRA",
            name: { in: presetNames },
        },
        select: { name: true },
    });

    const existingNameSet = new Set(existingExtraProducts.map((product) => product.name));

    const missingPresets = EXTRA_PRODUCT_PRESETS.filter((preset) => !existingNameSet.has(preset.name));

    for (const [index, preset] of missingPresets.entries()) {
        await prisma.product.create({
            data: {
                name: preset.name,
                productType: "EXTRA",
                category: "Ek Ürün",
                unit: preset.unit,
                specs: preset.specs || null,
                sortOrder: index,
                isActive: true,
            },
        });
    }
}

async function ensureProductVariants() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            productType: true,
            unit: true,
            specs: true,
            defaultPrice: true,
            sortOrder: true,
            variants: {
                where: { isActive: true },
                select: { id: true },
                take: 1,
            },
        },
    });

    for (const product of products) {
        if (product.variants.length > 0) continue;

        const defaultVariantName = (product.specs || "").trim() || "Standart";

        await prisma.productVariant.create({
            data: {
                productId: product.id,
                name: defaultVariantName,
                unit: product.unit,
                specs: product.specs || null,
                defaultPrice: product.defaultPrice ?? null,
                isActive: true,
                sortOrder: product.sortOrder,
            },
        });
    }
}

export async function seedProductCatalog() {
    try {
        const tiles = await readTileLibraryItems();

        for (const [index, tile] of tiles.entries()) {
            const tileName = (tile.name || "").trim();
            if (!tileName) continue;

            await prisma.product.upsert({
                where: {
                    name_productType: {
                        name: tileName,
                        productType: "TILE",
                    },
                },
                update: {
                    specs: tile.description || null,
                    imagePath: tile.imagePath || null,
                    prompt: tile.prompt || null,
                    category: "Fayans",
                    unit: "m²",
                    sortOrder: index,
                    isActive: true,
                },
                create: {
                    name: tileName,
                    productType: "TILE",
                    specs: tile.description || null,
                    imagePath: tile.imagePath || null,
                    prompt: tile.prompt || null,
                    category: "Fayans",
                    unit: "m²",
                    sortOrder: index,
                    isActive: true,
                },
            });
        }

        for (const [index, preset] of EXTRA_PRODUCT_PRESETS.entries()) {
            await prisma.product.upsert({
                where: {
                    name_productType: {
                        name: preset.name,
                        productType: "EXTRA",
                    },
                },
                update: {
                    category: "Ek Ürün",
                    unit: preset.unit,
                    specs: preset.specs || null,
                    sortOrder: index,
                    isActive: true,
                },
                create: {
                    name: preset.name,
                    productType: "EXTRA",
                    category: "Ek Ürün",
                    unit: preset.unit,
                    specs: preset.specs || null,
                    sortOrder: index,
                    isActive: true,
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Seed Product Catalog Error:", error);
        return { success: false, error: "Ürün kataloğu hazırlanamadı." };
    }
}

export async function listProductOptions() {
    try {
        await ensureExtraPresetProducts();
        await ensureProductVariants();

        let products = await prisma.product.findMany({
            where: { isActive: true },
            orderBy: [
                { productType: "asc" },
                { sortOrder: "asc" },
                { name: "asc" },
            ],
            select: {
                id: true,
                name: true,
                productType: true,
                category: true,
                unit: true,
                specs: true,
                defaultPrice: true,
                variants: {
                    where: { isActive: true },
                    orderBy: [
                        { sortOrder: "asc" },
                        { name: "asc" },
                    ],
                    select: {
                        id: true,
                        name: true,
                        unit: true,
                        specs: true,
                        defaultPrice: true,
                    },
                },
            },
        });

        if (products.length === 0) {
            const seedResult = await seedProductCatalog();
            if (seedResult.success) {
                products = await prisma.product.findMany({
                    where: { isActive: true },
                    orderBy: [
                        { productType: "asc" },
                        { sortOrder: "asc" },
                        { name: "asc" },
                    ],
                    select: {
                        id: true,
                        name: true,
                        productType: true,
                        category: true,
                        unit: true,
                        specs: true,
                        defaultPrice: true,
                        variants: {
                            where: { isActive: true },
                            orderBy: [
                                { sortOrder: "asc" },
                                { name: "asc" },
                            ],
                            select: {
                                id: true,
                                name: true,
                                unit: true,
                                specs: true,
                                defaultPrice: true,
                            },
                        },
                    },
                });
            }
        }

        if (products.length === 0) {
            const fallbackOptions = await buildFallbackOptions();
            return { success: true, data: fallbackOptions };
        }

        const options = products.flatMap((product) => {
            if (product.variants.length === 0) {
                return [toOption(product)];
            }

            return product.variants.map((variant) => toVariantOption(product, variant));
        });

        return { success: true, data: options };
    } catch (error) {
        console.error("List Product Options Error:", error);
        const fallbackOptions = await buildFallbackOptions();
        if (fallbackOptions.length > 0) {
            return { success: true, data: fallbackOptions };
        }
        return { success: false, data: [] as ProductOption[], error: "Ürün seçenekleri getirilemedi." };
    }
}

export async function createProductOption(data: {
    name: string;
    category: ProductCategory;
    variantName?: string;
    unit?: string;
    specs?: string;
    defaultPrice?: number;
}) {
    try {
        const name = (data.name || "").trim();
        if (!name) {
            return { success: false, error: "Ürün adı gerekli." };
        }

        const productType = toDbProductType(data.category);
        const unit = (data.unit || "").trim() || (data.category === "Fayans" ? "m²" : "Adet");
        const variantName = (data.variantName || "").trim() || "Standart";

        const product = await prisma.product.upsert({
            where: {
                name_productType: {
                    name,
                    productType,
                },
            },
            update: {
                category: data.category,
                isActive: true,
            },
            create: {
                name,
                productType,
                category: data.category,
                unit,
                specs: null,
                defaultPrice: null,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                productType: true,
            },
        });

        const variant = await prisma.productVariant.upsert({
            where: {
                productId_name: {
                    productId: product.id,
                    name: variantName,
                },
            },
            update: {
                unit,
                specs: (data.specs || "").trim() || null,
                defaultPrice: Number.isFinite(data.defaultPrice) ? Number(data.defaultPrice) : null,
                isActive: true,
            },
            create: {
                productId: product.id,
                name: variantName,
                unit,
                specs: (data.specs || "").trim() || null,
                defaultPrice: Number.isFinite(data.defaultPrice) ? Number(data.defaultPrice) : null,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                unit: true,
                specs: true,
                defaultPrice: true,
            },
        });

        revalidatePath("/pos/quotes");
        return { success: true, data: toVariantOption(product, variant) };
    } catch (error) {
        console.error("Create Product Option Error:", error);
        return { success: false, error: "Ürün oluşturulamadı." };
    }
}

export async function listManageableProducts() {
    try {
        await ensureExtraPresetProducts();

        let products = await prisma.product.findMany({
            orderBy: [
                { isActive: "desc" },
                { productType: "asc" },
                { sortOrder: "asc" },
                { name: "asc" },
            ],
            select: {
                id: true,
                name: true,
                productType: true,
                category: true,
                unit: true,
                specs: true,
                defaultPrice: true,
                isActive: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (products.length === 0) {
            const seedResult = await seedProductCatalog();
            if (seedResult.success) {
                products = await prisma.product.findMany({
                    orderBy: [
                        { isActive: "desc" },
                        { productType: "asc" },
                        { sortOrder: "asc" },
                        { name: "asc" },
                    ],
                    select: {
                        id: true,
                        name: true,
                        productType: true,
                        category: true,
                        unit: true,
                        specs: true,
                        defaultPrice: true,
                        isActive: true,
                        sortOrder: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
            }
        }

        return { success: true, data: products.map(toManageableProduct) };
    } catch (error) {
        console.error("List Manageable Products Error:", error);
        return { success: false, data: [] as ManageableProduct[], error: "Ürünler getirilemedi." };
    }
}

export async function updateProductOption(data: {
    id: string;
    name: string;
    category: ProductCategory;
    unit?: string;
    specs?: string;
    defaultPrice?: number;
}) {
    try {
        const id = (data.id || "").trim();
        const name = (data.name || "").trim();
        if (!id) {
            return { success: false, error: "Ürün kimliği gerekli." };
        }
        if (!name) {
            return { success: false, error: "Ürün adı gerekli." };
        }

        const defaultPrice = Number(data.defaultPrice);
        if (Number.isFinite(defaultPrice) && defaultPrice < 0) {
            return { success: false, error: "Varsayılan fiyat negatif olamaz." };
        }

        const unit = (data.unit || "").trim() || (data.category === "Fayans" ? "m²" : "Adet");
        const productType = toDbProductType(data.category);

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                productType,
                category: data.category,
                unit,
                specs: (data.specs || "").trim() || null,
                defaultPrice: Number.isFinite(defaultPrice) ? defaultPrice : null,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                productType: true,
                category: true,
                unit: true,
                specs: true,
                defaultPrice: true,
                isActive: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        revalidatePath("/kutuphane/urunler");
        revalidatePath("/pos/quotes");
        return { success: true, data: toManageableProduct(product) };
    } catch (error) {
        console.error("Update Product Option Error:", error);
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: string }).code === "P2002"
        ) {
            return { success: false, error: "Aynı isimde ve türde bir ürün zaten var." };
        }
        return { success: false, error: "Ürün güncellenemedi." };
    }
}

export async function archiveProductOption(id: string) {
    try {
        const productId = (id || "").trim();
        if (!productId) {
            return { success: false, error: "Ürün kimliği gerekli." };
        }

        await prisma.product.update({
            where: { id: productId },
            data: { isActive: false },
        });

        revalidatePath("/kutuphane/urunler");
        revalidatePath("/pos/quotes");
        return { success: true };
    } catch (error) {
        console.error("Archive Product Option Error:", error);
        return { success: false, error: "Ürün pasife alınamadı." };
    }
}

const normalizeQuoteStatus = (status?: string) => {
    if (!status || status === "PENDING") return "Bekliyor";
    if (status === "Satıldı" || status === "Ödendi") return "Ödendi";
    if (status === "İptal" || status === "İade") return "İade";
    if (status === "Bekliyor") return status;
    return "Bekliyor";
};

export async function saveQuote(data: {
    customerName: string;
    items: CartItem[];
    totalAmount: number;
}) {
    try {
        const quote = await prisma.quote.create({
            data: {
                customerName: data.customerName || "İsimsiz Müşteri",
                items: JSON.stringify(data.items),
                totalAmount: data.totalAmount,
                status: "Bekliyor",
            },
        });

        revalidatePath("/pos/quotes");
        return { success: true, id: quote.id };
    } catch (error) {
        console.error("Save Quote Error:", error);
        return { success: false, error: "Failed to save quote" };
    }
}

export async function updateQuote(data: {
    id: string;
    customerName: string;
    items: CartItem[];
    totalAmount: number;
    status?: string;
    createdAt?: string;
    vatRate?: number;
    discountAmount?: number;
}) {
    try {
        const updateData: {
            customerName: string;
            items: string;
            totalAmount: number;
            status?: string;
            createdAt?: Date;
            vatRate?: number;
            discountAmount?: number;
        } = {
            customerName: data.customerName || "İsimsiz Müşteri",
            items: JSON.stringify(data.items),
            totalAmount: data.totalAmount,
        };

        if (data.status) {
            updateData.status = normalizeQuoteStatus(data.status);
        }

        if (data.createdAt) {
            const createdAtDate = new Date(data.createdAt);
            if (!Number.isNaN(createdAtDate.getTime())) {
                updateData.createdAt = createdAtDate;
            }
        }

        if (typeof data.vatRate === "number") {
            updateData.vatRate = data.vatRate;
        }

        if (typeof data.discountAmount === "number") {
            updateData.discountAmount = data.discountAmount;
        }

        await prisma.quote.update({
            where: { id: data.id },
            data: updateData,
        });

        revalidatePath("/pos/quotes");
        return { success: true };
    } catch (error) {
        console.error("Update Quote Error:", error);
        return { success: false, error: "Failed to update quote" };
    }
}

export async function saveHistoricalQuote(data: {
    customerName: string;
    items: CartItem[];
    totalAmount: number;
    status: string;
    createdAt: string;
    vatRate?: number;
    discountAmount?: number;
}) {
    try {
        if (!Array.isArray(data.items) || data.items.length === 0) {
            return { success: false, error: "En az bir ürün kalemi gerekli." };
        }

        const createdAtDate = new Date(data.createdAt);
        if (Number.isNaN(createdAtDate.getTime())) {
            return { success: false, error: "Geçerli bir tarih girin." };
        }

        const quote = await prisma.quote.create({
            data: {
                customerName: data.customerName.trim() || "İsimsiz Müşteri",
                items: JSON.stringify(data.items),
                totalAmount: Number(data.totalAmount) || 0,
                status: normalizeQuoteStatus(data.status),
                createdAt: createdAtDate,
                vatRate: typeof data.vatRate === "number" ? data.vatRate : 0,
                discountAmount: typeof data.discountAmount === "number" ? data.discountAmount : 0,
            },
        });

        revalidatePath("/pos/quotes");
        return { success: true, id: quote.id };
    } catch (error) {
        console.error("Save Historical Quote Error:", error);
        return { success: false, error: "Eski teklif kaydedilemedi." };
    }
}

export async function getQuotes() {
    try {
        const quotes = await prisma.quote.findMany({
            orderBy: { createdAt: "desc" },
        });

        const normalizedQuotes = quotes.map((quote) => ({
            ...quote,
            status: normalizeQuoteStatus(quote.status),
        }));

        return { success: true, data: normalizedQuotes };
    } catch (error) {
        console.error("Get Quotes Error:", error);
        return { success: false, data: [] };
    }
}

export async function updateQuoteStatus(id: string, status: string) {
    try {
        await prisma.quote.update({
            where: { id },
            data: { status: normalizeQuoteStatus(status) },
        });
        revalidatePath("/pos/quotes");
        return { success: true };
    } catch (error) {
        console.error("Update Status Error:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function deleteQuote(id: string) {
    try {
        await prisma.quote.delete({
            where: { id },
        });
        revalidatePath("/pos/quotes");
        return { success: true };
    } catch (error) {
        console.error("Delete Quote Error:", error);
        return { success: false, error: "Failed to delete quote" };
    }
}
