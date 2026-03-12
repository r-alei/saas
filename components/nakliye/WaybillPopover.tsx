"use client";

import { FileText, X } from "lucide-react";
import { Shipment } from "@/types/shipment";

interface WaybillPopoverProps {
    shipment: Shipment;
    anchor: { top: number; left: number };
    onClose: () => void;
}

export function WaybillPopover({ shipment, anchor, onClose }: WaybillPopoverProps) {
    return (
        <>
            <div className="fixed inset-0 z-[99]" onClick={onClose} />
            <div
                data-waybill-popover="true"
                className="absolute z-[100] w-64 rounded-xl border border-[var(--home-border)] bg-white p-3 text-xs shadow-xl"
                style={{ top: anchor.top, left: anchor.left }}
            >
                <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[var(--home-text)]">
                        <FileText className="h-3.5 w-3.5" />
                        <p className="text-xs font-bold">İrsaliye Detayı</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--home-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
                <div className="space-y-1 text-[var(--home-muted)]">
                    <p><span className="font-semibold text-[var(--home-text)]">No:</span> {shipment.waybillNumber || "-"}</p>
                    <p><span className="font-semibold text-[var(--home-text)]">Tür:</span> {shipment.waybillType || "Belirtilmedi"}</p>
                    <p className="leading-relaxed"><span className="font-semibold text-[var(--home-text)]">Açıklama:</span> {shipment.waybillDescription || "Açıklama girilmemiş"}</p>
                </div>
            </div>
        </>
    );
}
