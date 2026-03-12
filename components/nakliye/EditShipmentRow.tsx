"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { Shipment, ShipmentInput } from "@/types/shipment";
import { updateShipment } from "@/app/nakliye/actions";
import { toISODate, WAYBILL_TYPE_OPTIONS, INVOICE_TYPE_OPTIONS } from "./constants";
import { Field, RouteSplitField, PillSelector } from "./FormFields";

interface EditShipmentRowProps {
    shipment: Shipment;
    colSpan: number;
    onSaved: () => void;
    onCancel: () => void;
}

export function EditShipmentRow({ shipment, colSpan, onSaved, onCancel }: EditShipmentRowProps) {
    const [editForm, setEditForm] = useState<ShipmentInput>({
        driverName: shipment.driverName,
        licensePlate: shipment.licensePlate,
        driverPhone: shipment.driverPhone,
        destination: shipment.destination,
        waybillNumber: shipment.waybillNumber,
        waybillType: shipment.waybillType || "",
        waybillDescription: shipment.waybillDescription || "",
        invoiceNumber: shipment.invoiceNumber || "",
        invoiceType: shipment.invoiceType || "e-fatura",
        invoiceDate: shipment.invoiceDate,
        paymentDay: shipment.paymentDay || "",
        paymentStatus: shipment.paymentStatus,
        bankName: shipment.bankName,
        paymentAmount: shipment.paymentAmount,
        iban: shipment.iban || "",
    });
    const [pending, startTransition] = useTransition();

    function onSaveEdit() {
        startTransition(async () => {
            const paidDate = editForm.paymentDay.trim();
            const nextPaymentStatus: ShipmentInput["paymentStatus"] = paidDate ? "Ödendi" : editForm.paymentStatus;
            const payload: ShipmentInput = {
                ...editForm,
                paymentStatus: nextPaymentStatus,
                paymentDay: nextPaymentStatus === "Ödendi" ? (paidDate || toISODate(new Date())) : "",
            };

            await updateShipment(shipment.id, payload);
            onSaved();
        });
    }

    return (
        <tr className="border-b border-[var(--home-border)]/70 bg-[var(--home-surface)]/60">
            <td className="py-3 pr-3" colSpan={colSpan}>
                <div className="rounded-xl border border-[var(--home-border)] bg-white/70 p-3">
                    <h3 className="mb-3 text-sm font-bold">Kayıt Düzenle</h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Şoför Adı" value={editForm.driverName} onChange={(v) => setEditForm((p) => ({ ...p, driverName: v }))} required />
                        <Field label="Plaka" value={editForm.licensePlate} onChange={(v) => setEditForm((p) => ({ ...p, licensePlate: v }))} required />
                        <Field label="Telefon" value={editForm.driverPhone} onChange={(v) => setEditForm((p) => ({ ...p, driverPhone: v }))} required />
                        <RouteSplitField
                            label="Guzergah"
                            value={editForm.destination}
                            onChange={(v) => setEditForm((p) => ({ ...p, destination: v }))}
                            required
                        />
                        <Field label="İrsaliye" value={editForm.waybillNumber} onChange={(v) => setEditForm((p) => ({ ...p, waybillNumber: v }))} placeholder="Numara yoksa boş bırakabilirsiniz" />
                        <PillSelector
                            label="İrsaliye Türü"
                            value={editForm.waybillType || ""}
                            onChange={(next) => setEditForm((p) => ({ ...p, waybillType: next }))}
                            options={WAYBILL_TYPE_OPTIONS}
                            tone="amber"
                            compact
                        />
                        <Field label="Fatura No" value={editForm.invoiceNumber || ""} onChange={(v) => setEditForm((p) => ({ ...p, invoiceNumber: v }))} />
                        <Field label="Banka" value={editForm.bankName} onChange={(v) => setEditForm((p) => ({ ...p, bankName: v }))} />

                        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2 lg:col-span-4">
                            İrsaliye Açıklaması
                            <textarea
                                value={editForm.waybillDescription || ""}
                                onChange={(e) => setEditForm((p) => ({ ...p, waybillDescription: e.target.value }))}
                                rows={2}
                                placeholder="Açıklama giriniz"
                                className="rounded-lg border border-[var(--home-border)] bg-white/80 px-3 py-2 outline-none"
                            />
                        </label>

                        <PillSelector
                            label="Fatura Tipi"
                            value={editForm.invoiceType}
                            onChange={(next) => setEditForm((p) => ({ ...p, invoiceType: next as ShipmentInput["invoiceType"] }))}
                            options={INVOICE_TYPE_OPTIONS}
                            tone="violet"
                            compact
                        />

                        <label className="flex flex-col gap-1 text-sm font-medium">
                            Fatura Tarihi
                            <input
                                type="date"
                                value={editForm.invoiceDate}
                                onChange={(e) => setEditForm((p) => ({ ...p, invoiceDate: e.target.value }))}
                                className="h-10 rounded-lg border border-[var(--home-border)] bg-white/80 px-3 outline-none"
                                required
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium">
                            Ödeme Durumu
                            <select
                                value={editForm.paymentStatus}
                                onChange={(e) => setEditForm((p) => ({ ...p, paymentStatus: e.target.value as ShipmentInput["paymentStatus"] }))}
                                className="h-10 rounded-lg border border-[var(--home-border)] bg-white/80 px-3 outline-none"
                            >
                                <option value="Bekliyor">Bekliyor</option>
                                <option value="Ödendi">Ödendi</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium">
                            Ödenen Tarih
                            <input
                                type="date"
                                value={editForm.paymentDay}
                                onChange={(e) => setEditForm((p) => ({ ...p, paymentDay: e.target.value }))}
                                className="h-10 rounded-lg border border-[var(--home-border)] bg-white/80 px-3 outline-none"
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium">
                            Ödeme Tutarı
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editForm.paymentAmount ?? ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setEditForm((p) => ({ ...p, paymentAmount: value === "" ? undefined : Number(value) }));
                                }}
                                className="h-10 rounded-lg border border-[var(--home-border)] bg-white/80 px-3 outline-none"
                            />
                        </label>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onSaveEdit}
                            disabled={pending}
                            className="rounded-lg bg-[var(--home-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--home-accent-strong)] disabled:opacity-60"
                        >
                            Kaydet
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={pending}
                            className="rounded-lg border border-[var(--home-border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--home-surface)] disabled:opacity-60"
                        >
                            Vazgeç
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}
