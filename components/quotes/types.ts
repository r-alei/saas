export type HistoricalItemDraft = {
    productId: string;
    itemType: "tile" | "extra";
    name: string;
    specs: string;
    requiredPackages: string;
    soldArea: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    totalPrice: string;
};

export type QuotesAnalyticsData = {
    financial: {
        totalRevenue: number;
        totalDiscount: number;
        totalVat: number;
        avgOrderValue: number;
        paidAmount: number;
        pendingAmount: number;
        refundAmount: number;
    };
    topCustomers: Array<{
        name: string;
        quoteCount: number;
        totalAmount: number;
        lastOrder: string;
    }>;
    topProducts: Array<{
        name: string;
        type: string;
        quantity: number;
        revenue: number;
    }>;
    monthlyData: Array<{
        month: string;
        monthKey: string;
        amount: number;
        count: number;
    }>;
    maxMonthlyAmount: number;
};