import { HistoricalItemDraft } from "./types";

export const HISTORICAL_UNIT_OPTIONS = ["Adet", "Paket", "Kg", "Torba", "Litre"];

export const buildDefaultHistoricalItem = (): HistoricalItemDraft => ({
    productId: "",
    itemType: "tile",
    name: "",
    specs: "",
    requiredPackages: "",
    soldArea: "",
    quantity: "",
    unit: "Adet",
    unitPrice: "",
    totalPrice: "",
});

export const normalizeHistoricalItem = (item?: Partial<HistoricalItemDraft>): HistoricalItemDraft => ({
    productId: item?.productId ?? "",
    itemType: item?.itemType === "extra" ? "extra" : "tile",
    name: item?.name ?? "",
    specs: item?.specs ?? "",
    requiredPackages: item?.requiredPackages ?? "",
    soldArea: item?.soldArea ?? "",
    quantity: item?.quantity ?? "",
    unit: item?.unit ?? "Adet",
    unitPrice: item?.unitPrice ?? "",
    totalPrice: item?.totalPrice ?? "",
});

export const getLocalDateValue = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export const toLocalDateInputValue = (dateValue: Date | string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return getLocalDateValue();
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
    }).format(amount);
};

export const formatNumber = (num: number, maxDigits = 2) => {
    return new Intl.NumberFormat("tr-TR", {
        maximumFractionDigits: maxDigits,
    }).format(num);
};

export const parseNumericInput = (value: string) => {
    const normalized = (value || "").replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const getHistoricalLineTotal = (item: HistoricalItemDraft) => {
    const unitPrice = parseNumericInput(item.unitPrice);
    if (item.itemType === "extra") {
        const quantity = parseNumericInput(item.quantity);
        return quantity * unitPrice;
    }

    const soldArea = parseNumericInput(item.soldArea);
    return soldArea * unitPrice;
};