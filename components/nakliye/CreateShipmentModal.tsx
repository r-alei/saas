"use client";

import { useState, useTransition } from "react";
import {
    Plus,
    Truck,
    Loader2,
    X,
    User,
    Car,
    Phone,
    Hash,
    FileText,
    CalendarDays,
    Settings2,
    Landmark,
    TurkishLira,
} from "lucide-react";
import { createShipment } from "@/app/nakliye/actions";
import { ShipmentInput } from "@/types/shipment";
import {
    createDefaultForm,
    WAYBILL_TYPE_OPTIONS,
    INVOICE_TYPE_OPTIONS,
} from "./constants";
import { Field, RouteSplitField, PillSelector } from "./FormFields";

interface CreateShipmentModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateShipmentModal({ onClose, onSuccess }: CreateShipmentModalProps) {
    const [form, setForm] = useState<ShipmentInput>(() => createDefaultForm());
    const [pending, startTransition] = useTransition();

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        startTransition(async () => {
            const payload: ShipmentInput = {
                ...form,
                paymentDay: "",
            };

            await createShipment(payload);
            setForm(createDefaultForm());
            onSuccess();
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--home-border)] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-3 rounded-t-2xl border-b border-[var(--home-border)] bg-gradient-to-r from-white to-blue-50/60 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--home-accent)]/10">
                            <Truck className="h-4 w-4 text-[var(--home-accent)]" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold leading-tight">Yeni Nakliye</h2>
                            <p className="text-[10px] text-[var(--home-muted)]">Beklenen ödeme: fatura tarihinden 5 gün sonra</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--home-border)] bg-white text-[var(--home-muted)] shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="flex-1 space-y-3 overflow-y-auto p-4">
                    {/* Şoför Bilgileri */}
                    <fieldset className="rounded-lg border border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-transparent px-3 pb-3 pt-1">
                        <legend className="flex items-center gap-1.5 px-1.5 text-xs font-bold text-blue-700">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100">
                                <User className="h-3 w-3 text-blue-600" />
                            </span>
                            Şoför Bilgileri
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Field label="Şoför Adı" value={form.driverName} onChange={(v) => setForm((p) => ({ ...p, driverName: v }))} icon={<User className="h-3 w-3 text-blue-400" />} required />
                            <Field label="Plaka" value={form.licensePlate} onChange={(v) => setForm((p) => ({ ...p, licensePlate: v }))} icon={<Car className="h-3 w-3 text-blue-400" />} required />
                            <Field label="Telefon" value={form.driverPhone} onChange={(v) => setForm((p) => ({ ...p, driverPhone: v }))} icon={<Phone className="h-3 w-3 text-blue-400" />} required />
                            <RouteSplitField
                                label="Guzergah"
                                value={form.destination}
                                onChange={(v) => setForm((p) => ({ ...p, destination: v }))}
                                required
                            />
                        </div>
                    </fieldset>

                    {/* İrsaliye Bilgileri */}
                    <fieldset className="rounded-lg border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-transparent px-3 pb-3 pt-1">
                        <legend className="flex items-center gap-1.5 px-1.5 text-xs font-bold text-amber-700">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-100">
                                <FileText className="h-3 w-3 text-amber-600" />
                            </span>
                            İrsaliye Bilgileri
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Field label="İrsaliye No" value={form.waybillNumber} onChange={(v) => setForm((p) => ({ ...p, waybillNumber: v }))} icon={<Hash className="h-3 w-3 text-amber-400" />} placeholder="Numara yoksa boş bırakabilirsiniz" />
                            <PillSelector
                                label="İrsaliye Türü"
                                value={form.waybillType || ""}
                                onChange={(next) => setForm((p) => ({ ...p, waybillType: next }))}
                                icon={<Settings2 className="h-3 w-3 text-amber-400" />}
                                options={WAYBILL_TYPE_OPTIONS}
                                tone="amber"
                            />
                            <label className="flex flex-col gap-0.5 text-xs font-medium sm:col-span-2">
                                <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-amber-400" />
                                    İrsaliye Açıklaması
                                </span>
                                <textarea
                                    value={form.waybillDescription || ""}
                                    onChange={(e) => setForm((p) => ({ ...p, waybillDescription: e.target.value }))}
                                    rows={1}
                                    placeholder="Gerekiyorsa açıklama giriniz"
                                    className="rounded-md border border-[var(--home-border)] bg-white/80 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-300/30 transition-shadow"
                                />
                            </label>
                        </div>
                    </fieldset>

                    {/* Fatura & Ödeme yan yana */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        {/* Fatura Bilgileri */}
                        <fieldset className="rounded-lg border border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-transparent px-3 pb-3 pt-1">
                            <legend className="flex items-center gap-1.5 px-1.5 text-xs font-bold text-violet-700">
                                <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-100">
                                    <Hash className="h-3 w-3 text-violet-600" />
                                </span>
                                Fatura
                            </legend>
                            <div className="grid gap-2">
                                <Field label="Fatura No" value={form.invoiceNumber || ""} onChange={(v) => setForm((p) => ({ ...p, invoiceNumber: v }))} icon={<Hash className="h-3 w-3 text-violet-400" />} />
                                <PillSelector
                                    label="Fatura Tipi"
                                    value={form.invoiceType}
                                    onChange={(next) => setForm((p) => ({ ...p, invoiceType: next as ShipmentInput["invoiceType"] }))}
                                    icon={<Settings2 className="h-3 w-3 text-violet-400" />}
                                    options={INVOICE_TYPE_OPTIONS}
                                    tone="violet"
                                />
                                <label className="flex flex-col gap-0.5 text-xs font-medium">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3 text-violet-400" />
                                        Fatura Tarihi
                                    </span>
                                    <input
                                        type="date"
                                        value={form.invoiceDate}
                                        onChange={(e) => setForm((p) => ({ ...p, invoiceDate: e.target.value }))}
                                        className="h-8 rounded-md border border-[var(--home-border)] bg-white/80 px-2 text-sm outline-none focus:ring-2 focus:ring-violet-300/30 transition-shadow"
                                        required
                                    />
                                </label>
                            </div>
                        </fieldset>

                        {/* Ödeme Bilgileri */}
                        <fieldset className="rounded-lg border border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-transparent px-3 pb-3 pt-1">
                            <legend className="flex items-center gap-1.5 px-1.5 text-xs font-bold text-emerald-700">
                                <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100">
                                    <Landmark className="h-3 w-3 text-emerald-600" />
                                </span>
                                Ödeme
                            </legend>
                            <div className="grid gap-2">
                                <Field label="Banka" value={form.bankName} onChange={(v) => setForm((p) => ({ ...p, bankName: v }))} icon={<Landmark className="h-3 w-3 text-emerald-400" />} />
                                <label className="flex flex-col gap-0.5 text-xs font-medium">
                                    <span className="flex items-center gap-1">
                                        <TurkishLira className="h-3 w-3 text-emerald-400" />
                                        Ödeme Tutarı
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.paymentAmount ?? ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setForm((p) => ({ ...p, paymentAmount: value === "" ? undefined : Number(value) }));
                                        }}
                                        className="h-8 rounded-md border border-[var(--home-border)] bg-white/80 px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/30 transition-shadow"
                                    />
                                </label>
                            </div>
                        </fieldset>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-[var(--home-border)] pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-[var(--home-border)] px-4 py-2 text-xs font-semibold text-[var(--home-muted)] transition-colors hover:bg-[var(--home-surface)]"
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--home-accent)] text-white px-5 py-2 text-xs font-semibold shadow-md shadow-[var(--home-accent)]/20 hover:bg-[var(--home-accent-strong)] disabled:opacity-60 transition-all"
                        >
                            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Kaydı Ekle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
