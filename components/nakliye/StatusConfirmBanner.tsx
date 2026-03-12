"use client";

import { useTransition } from "react";
import { updateShipment } from "@/app/nakliye/actions";
import { StatusConfirmData, formatDateTR, formatPrice, getExpectedPaymentDay, toISODate } from "./constants";

interface StatusConfirmBannerProps {
    data: StatusConfirmData;
    onPaidDateChange: (date: string) => void;
    onConfirmed: () => void;
    onCancel: () => void;
}

export function StatusConfirmBanner({ data, onPaidDateChange, onConfirmed, onCancel }: StatusConfirmBannerProps) {
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            const nextPaymentDay =
                data.nextStatus === "Ödendi"
                    ? (data.paidDate || toISODate(new Date()))
                    : "";

            await updateShipment(data.shipmentId, {
                paymentStatus: data.nextStatus,
                paymentDay: nextPaymentDay,
            });
            onConfirmed();
        });
    }

    return (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <p className="font-semibold text-amber-900">
                Ödeme durumu değişikliği onayı bekliyor.
            </p>
            <p className="mt-1 text-amber-800">
                Seçili kayıt için yeni durum: <strong>{data.nextStatus}</strong>
            </p>
            <div className="mt-2 grid gap-1 text-xs text-amber-900 sm:grid-cols-2 lg:grid-cols-3">
                <p><strong>Şoför:</strong> {data.summary.driverName}</p>
                <p><strong>Plaka:</strong> {data.summary.licensePlate}</p>
                <p><strong>İrsaliye:</strong> {data.summary.waybillNumber || "-"}</p>
                <p><strong>Banka:</strong> {data.summary.bankName}</p>
                <p><strong>Tutar:</strong> {formatPrice(data.summary.paymentAmount)}</p>
                <p><strong>Beklenen Ödeme:</strong> {formatDateTR(getExpectedPaymentDay(data.summary.invoiceDate))}</p>
                <p><strong>Ödenen Tarih:</strong> {formatDateTR(data.summary.paymentDay)}</p>
            </div>
            {data.nextStatus === "Ödendi" && (
                <label className="mt-3 flex max-w-xs flex-col gap-1 text-xs font-semibold text-amber-900">
                    Ödenen Tarih (G/A/Y)
                    <input
                        type="date"
                        value={data.paidDate}
                        onChange={(e) => onPaidDateChange(e.target.value)}
                        className="h-9 rounded-lg border border-amber-300 bg-white px-3 outline-none"
                    />
                </label>
            )}
            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={pending}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                    Onayla
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={pending}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                    İptal
                </button>
            </div>
        </div>
    );
}
