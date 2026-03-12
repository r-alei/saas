export type CartItem = {
    id: string;
    productId?: string;
    variantId?: string;
    groupId?: string;
    name: string;
    itemType?: "tile" | "extra";
    specs: string; // "60x120 cm"
    requiredArea: number; // calculated area (with or without fire)
    includeFire: boolean;
    fireRate: number;
    requiredPieces: number;
    requiredPackages: number;
    soldArea: number;
    unitPrice: number;
    priceUnit: "m2" | "metre" | "adet" | "sabit";
    totalPrice: number;
    extraCategory?: string;
    extraCalcType?: "coverage" | "quantity" | "fixed";
    unit?: string;
    quantity?: number;
    note?: string;
};

export type SavedQuote = {
    id: string;
    customerName: string;
    items: string; // JSON string of CartItem[]
    totalAmount: number;
    status: string;
    vatRate?: number;
    discountAmount?: number;
    createdAt: Date;
};

export type ProductOption = {
    id: string;
    productId?: string;
    variantId?: string;
    name: string;
    variantName?: string;
    productType: "tile" | "extra";
    category: "Fayans" | "Ek Ürün";
    unit: string;
    specs?: string;
    defaultPrice?: number;
};

export type ManageableProduct = {
    id: string;
    name: string;
    productType: "tile" | "extra";
    category: "Fayans" | "Ek Ürün";
    unit: string;
    specs?: string;
    defaultPrice?: number;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
};
