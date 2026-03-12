"use client";

import { memo } from "react";
import {
    FileText,
    Hash,
    User,
    Phone,
    Car,
    Route,
    CalendarDays,
    CalendarCheck2,
    Landmark,
    TurkishLira,
    HandCoins,
    CheckCircle2,
    Settings2,
    Pencil,
    Trash2,
    X,
} from "lucide-react";
import { Shipment } from "@/types/shipment";
import {
    formatDateTR,
    formatPhone,
    formatPrice,
    getExpectedPaymentDay,
    isShipmentOverdue,
    isShipmentApproaching,
} from "./constants";

interface ShipmentTableRowProps {
    shipment: Shipment;
    todayISO: string;
    showActions: boolean;
    pending: boolean;
    deleteConfirmId: number | null;
    onToggleWaybill: (shipmentId: number, triggerEl: HTMLElement) => void;
    onRequestToggleStatus: (shipment: Shipment) => void;
    onStartEdit: (shipment: Shipment) => void;
    onDelete: (id: number) => void;
    onSetDeleteConfirmId: (id: number | null) => void;
}

export const ShipmentTableRow = memo(function ShipmentTableRow({
    shipment,
    todayISO,
    showActions,
    pending,
    deleteConfirmId,
    onToggleWaybill,
    onRequestToggleStatus,
    onStartEdit,
    onDelete,
    onSetDeleteConfirmId,
}: ShipmentTableRowProps) {
    const expectedPaymentDay = getExpectedPaymentDay(shipment.invoiceDate);
    const overdue = isShipmentOverdue(shipment, todayISO);
    const approaching = !overdue && isShipmentApproaching(shipment, todayISO);
    const paidDate = shipment.paymentStatus === "Ödendi" ? shipment.paymentDay : "";
    const rowToneClass = overdue
        ? "border-l-4 border-l-red-500 bg-red-100"
        : approaching
            ? "border-l-4 border-l-amber-500 bg-amber-100"
            : shipment.paymentStatus === "Ödendi"
                ? "border-l-4 border-l-emerald-500 bg-emerald-50"
                : "border-l-4 border-l-blue-400 bg-blue-50/60";

    return (
        <tr
            className={[
                "border-b border-[var(--home-border)]/70 transition-colors hover:bg-white/70",
                rowToneClass,
            ].join(" ")}
        >
            <td className="px-2 py-2.5 sm:px-3 sm:py-3 font-semibold">{shipment.id}</td>
            <td className="px-2 py-2.5 sm:px-3 sm:py-3 font-medium truncate">{shipment.driverName}</td>
            <td className="px-2 py-2.5 sm:px-3 sm:py-3 tabular-nums">{formatPhone(shipment.driverPhone)}</td>
            <td className="px-2 py-2.5 sm:px-3 sm:py-3 truncate" title={shipment.licensePlate}>{shipment.licensePlate}</td>
            <td className="px-2 py-2.5 sm:px-3 sm:py-3 truncate" title={shipment.destination}>{shipment.destination}</td>
            <td className="px-2 py-2.5 sm:px-3 sm:py-3">
                <p className={overdue ? "font-semibold text-red-600" : ""}>{formatDateTR(shipment.invoiceDate)}</p>
                <p className="text-[10px] text-[var(--home-muted)] mt-0.5">{shipment.invoiceType || "-"}</p>
            </td>
            <td className="px-2 py-2.5 sm:px-3 sm:py-3">
                <span
                    className={[
                        overdue ? "font-semibold text-red-700" : "",
                        approaching ? "font-semibold text-amber-800" : "",
                    ].join(" ")}
                >
                    {formatDateTR(paidDate)}
                </span>
                {!paidDate && shipment.paymentStatus === "Bekliyor" && (
                    <p className="text-[10px] text-[var(--home-muted)] mt-0.5">Beklenen: {formatDateTR(expectedPaymentDay)}</p>
                )}
            </td>
            <td className="px-2 py-2.5 sm:px-3 sm:py-3 truncate" title={shipment.bankName || "-"}>{shipment.bankName || "-"}</td>
            <td className={[
                "px-2 py-2.5 sm:px-3 sm:py-3 font-semibold tabular-nums",
                shipment.paymentStatus === "Ödendi" ? "text-emerald-700" : overdue ? "text-red-700" : "text-slate-700",
            ].join(" ")}>{formatPrice(shipment.paymentAmount)}</td>
            <td className="relative px-2 py-2.5 sm:px-3 sm:py-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="İrsaliye detayı"
                        onClick={(e) => onToggleWaybill(shipment.id, e.currentTarget)}
                        data-waybill-trigger="true"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--home-border)] bg-white text-[var(--home-muted)] hover:text-[var(--home-accent)]"
                    >
                        <FileText className="h-3.5 w-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => onRequestToggleStatus(shipment)}
                        disabled={pending}
                        className={[
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm disabled:opacity-60",
                            shipment.paymentStatus === "Ödendi"
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-500 text-white",
                        ].join(" ")}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {shipment.paymentStatus}
                    </button>
                </div>
            </td>
            {showActions && (
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onStartEdit(shipment)}
                            disabled={pending}
                            aria-label="Düzenle"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--home-muted)] transition-colors hover:bg-[var(--home-accent)]/10 hover:text-[var(--home-accent)] disabled:opacity-50"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        {deleteConfirmId === shipment.id ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => { onDelete(shipment.id); onSetDeleteConfirmId(null); }}
                                    disabled={pending}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Evet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSetDeleteConfirmId(null)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--home-muted)] transition-colors hover:bg-[var(--home-surface)]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onSetDeleteConfirmId(shipment.id)}
                                disabled={pending}
                                aria-label="Sil"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--home-muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
});

// ── Table header ──────────────────────────────────────────

export function ShipmentTableHead({ showActions }: { showActions: boolean }) {
    return (
        <thead>
            <tr className="border-b-2 border-slate-300 bg-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><Hash className="h-3.5 w-3.5 text-slate-500" /> No</span></th>
                <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-500" /> Şoför</span></th>
                <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-blue-500" /> Telefon</span></th>
                <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><Car className="h-3.5 w-3.5 text-slate-500" /> Plaka</span></th>
                <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5 text-indigo-500" /> Varış</span></th>
                <th className="whitespace-nowrap px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-purple-500" /> F. Tarihi</span></th>
                <th className="whitespace-nowrap px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><CalendarCheck2 className="h-3.5 w-3.5 text-purple-500" /> O. Tarihi</span></th>
                <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><Landmark className="h-3.5 w-3.5 text-teal-600" /> Banka</span></th>
                <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><TurkishLira className="h-3.5 w-3.5 text-emerald-600" /> Tutar</span></th>
                <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><HandCoins className="h-3.5 w-3.5 text-amber-600" /> Ödeme</span></th>
                {showActions && <th className="px-2 py-2.5 sm:px-3 sm:py-3"><span className="inline-flex items-center gap-1"><Settings2 className="h-3.5 w-3.5 text-slate-400" /> İşlem</span></th>}
            </tr>
        </thead>
    );
}
