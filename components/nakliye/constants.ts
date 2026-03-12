import { Shipment, ShipmentInput } from "@/types/shipment";

// ── Thresholds & options ──────────────────────────────────
export const APPROACHING_THRESHOLD_DAYS = 2;
export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

// ── Formatters (module-level singletons) ──────────────────
export const DATE_TR_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

export const PRICE_TR_FORMATTER = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

// ── PillSelector option arrays (stable references) ────────
export const WAYBILL_TYPE_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    { value: "Standart", label: "Standart" },
    { value: "Transfer", label: "Transfer" },
    { value: "Iade", label: "İade" },
    { value: "Diger", label: "Diğer" },
] as const;

export const INVOICE_TYPE_OPTIONS = [
    { value: "e-fatura", label: "e-Fatura" },
    { value: "e-arşiv", label: "e-Arşiv" },
] as const;

// ── Helpers ───────────────────────────────────────────────
export function toISODate(value: Date) {
    return value.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number) {
    const base = new Date(`${dateStr}T00:00:00`);
    base.setDate(base.getDate() + days);
    return toISODate(base);
}

export function getExpectedPaymentDay(invoiceDate: string) {
    return addDays(invoiceDate, 5);
}

export function formatDateTR(dateStr?: string) {
    const raw = (dateStr || "").trim();
    if (!raw) return "-";

    const date = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(date.getTime())) return raw;

    return DATE_TR_FORMATTER.format(date);
}

export function parseRoute(value: string) {
    const normalized = (value || "").replace("→", "->").replace("=>", "->");
    const [from = "", to = ""] = normalized.split("->", 2).map((item) => item.trim());
    return { from, to };
}

export function buildRoute(from: string, to: string) {
    const fromText = from.trim();
    const toText = to.trim();
    return `${fromText} -> ${toText}`.trim();
}

export function isShipmentOverdue(shipment: Shipment, todayISO: string) {
    const expectedDay = getExpectedPaymentDay(shipment.invoiceDate);
    return shipment.paymentStatus === "Bekliyor" && expectedDay < todayISO;
}

export function getDayDiff(fromISO: string, toISO: string) {
    const from = new Date(`${fromISO}T00:00:00`).getTime();
    const to = new Date(`${toISO}T00:00:00`).getTime();
    return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export function isShipmentApproaching(shipment: Shipment, todayISO: string) {
    if (shipment.paymentStatus !== "Bekliyor") return false;

    const expectedDay = getExpectedPaymentDay(shipment.invoiceDate);
    const diff = getDayDiff(todayISO, expectedDay);

    return diff >= 0 && diff <= APPROACHING_THRESHOLD_DAYS;
}

export function createDefaultForm(): ShipmentInput {
    return {
        driverName: "",
        licensePlate: "",
        driverPhone: "",
        destination: "",
        waybillNumber: "",
        waybillType: "",
        waybillDescription: "",
        invoiceNumber: "",
        invoiceType: "e-fatura",
        invoiceDate: toISODate(new Date()),
        paymentDay: "",
        paymentStatus: "Bekliyor",
        bankName: "",
        paymentAmount: undefined,
        iban: "",
    };
}

export function formatPrice(amount?: number) {
    if (typeof amount !== "number") return "-";
    return PRICE_TR_FORMATTER.format(amount);
}

export function formatPhone(value: string) {
    const digits = (value || "").replace(/\D/g, "");
    const tenDigits = digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;

    if (tenDigits.length !== 10) return value;

    const area = tenDigits.slice(0, 3);
    const prefix = tenDigits.slice(3, 6);
    const line = tenDigits.slice(6, 10);
    return `(${area}) ${prefix}-${line}`;
}

// ── Types ─────────────────────────────────────────────────
export type StatusFilter = "all" | Shipment["paymentStatus"] | "overdue";

export type ShipmentSummary = {
    totalCount: number;
    waitingCount: number;
    paidCount: number;
    overdueCount: number;
    paidAmountTotal: number;
};

export type StatusConfirmData = {
    shipmentId: number;
    nextStatus: Shipment["paymentStatus"];
    paidDate: string;
    summary: Pick<Shipment, "driverName" | "licensePlate" | "waybillNumber" | "bankName" | "paymentAmount" | "invoiceDate" | "paymentDay">;
};
