"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
    Plus,
    Loader2,
    Search,
    Settings2,
} from "lucide-react";
import { deleteShipment, listShipments } from "@/app/nakliye/actions";
import { Shipment } from "@/types/shipment";
import {
    toISODate,
    StatusFilter,
    ShipmentSummary,
    StatusConfirmData,
    PAGE_SIZE_OPTIONS,
} from "./constants";
import { SummaryStats } from "./SummaryStats";
import { CreateShipmentModal } from "./CreateShipmentModal";
import { StatusConfirmBanner } from "./StatusConfirmBanner";
import { FilterTabs } from "./FilterTabs";
import { ShipmentTableRow, ShipmentTableHead } from "./ShipmentTableRow";
import { EditShipmentRow } from "./EditShipmentRow";
import { WaybillPopover } from "./WaybillPopover";
import { PaginationBar } from "./PaginationBar";

export function NakliyeSystem() {
    // ── Shared data state ─────────────────────────────────
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [summary, setSummary] = useState<ShipmentSummary>({
        totalCount: 0, waitingCount: 0, paidCount: 0, overdueCount: 0, paidAmountTotal: 0,
    });

    // ── UI flags ──────────────────────────────────────────
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showActions, setShowActions] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pending, startTransition] = useTransition();

    // ── Waybill popover state ─────────────────────────────
    const [waybillInfoId, setWaybillInfoId] = useState<number | null>(null);
    const [waybillAnchor, setWaybillAnchor] = useState<{ top: number; left: number } | null>(null);

    // ── Status confirm state ──────────────────────────────
    const [statusConfirm, setStatusConfirm] = useState<StatusConfirmData | null>(null);

    // ── todayISO — stable per mount ───────────────────────
    const todayISO = useMemo(() => toISODate(new Date()), []);

    // ── Data fetching ─────────────────────────────────────
    const refresh = useCallback(async (targetPage?: number) => {
        const requestedPage = targetPage ?? page;
        setLoading(true);
        try {
            const data = await listShipments({
                status: statusFilter,
                search: debouncedSearch,
                page: requestedPage,
                pageSize,
            });
            setShipments(data.items);
            setTotalCount(data.totalCount);
            setSummary(data.summary);
        } catch (error) {
            const text = error instanceof Error ? error.message : "Nakliyeler yüklenemedi.";
            setMessage({ type: "error", text });
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, pageSize, statusFilter]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => { setPage(1); }, [statusFilter, pageSize, debouncedSearch]);
    useEffect(() => { refresh(); }, [refresh]);

    // ── Global event listeners ────────────────────────────
    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            const insideTrigger = target.closest("[data-waybill-trigger='true']");
            const insidePopover = target.closest("[data-waybill-popover='true']");
            if (insideTrigger || insidePopover) return;
            setWaybillInfoId(null);
            setWaybillAnchor(null);
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setWaybillInfoId(null);
                setWaybillAnchor(null);
            }
        }

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // ── Derived ───────────────────────────────────────────
    const selectedWaybillShipment = useMemo(() => {
        if (waybillInfoId === null) return null;
        return shipments.find((item) => item.id === waybillInfoId) || null;
    }, [shipments, waybillInfoId]);

    // ── Callbacks ─────────────────────────────────────────
    function showSuccess(text: string) {
        setMessage({ type: "success", text });
        setTimeout(() => setMessage(null), 3000);
    }

    function showError(error: unknown) {
        const text = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
        setMessage({ type: "error", text });
    }

    function handleCreateSuccess() {
        setIsCreateOpen(false);
        setPage(1);
        refresh(1).then(() => showSuccess("Nakliye kaydı eklendi."));
    }

    function onDelete(id: number) {
        startTransition(async () => {
            try {
                await deleteShipment(id);
                if (editingId === id) setEditingId(null);
                if (statusConfirm?.shipmentId === id) setStatusConfirm(null);
                if (waybillInfoId === id) { setWaybillInfoId(null); setWaybillAnchor(null); }
                await refresh();
                showSuccess("Nakliye kaydı silindi.");
            } catch (error) {
                showError(error);
            }
        });
    }

    function requestToggleStatus(shipment: Shipment) {
        const nextStatus = shipment.paymentStatus === "Ödendi" ? "Bekliyor" : "Ödendi";
        setWaybillInfoId(null);
        setWaybillAnchor(null);
        setStatusConfirm({
            shipmentId: shipment.id,
            nextStatus,
            paidDate: shipment.paymentStatus === "Ödendi" ? "" : shipment.paymentDay || toISODate(new Date()),
            summary: {
                driverName: shipment.driverName,
                licensePlate: shipment.licensePlate,
                waybillNumber: shipment.waybillNumber,
                bankName: shipment.bankName,
                paymentAmount: shipment.paymentAmount,
                invoiceDate: shipment.invoiceDate,
                paymentDay: shipment.paymentDay,
            },
        });
    }

    function toggleWaybillInfo(shipmentId: number, triggerEl: HTMLElement) {
        if (waybillInfoId === shipmentId) {
            setWaybillInfoId(null);
            setWaybillAnchor(null);
            return;
        }
        const rect = triggerEl.getBoundingClientRect();
        const popoverWidth = 256;
        const docTop = rect.bottom + window.scrollY + 6;
        const docLeft = rect.left + window.scrollX;
        const minLeft = window.scrollX + 8;
        const maxLeft = window.scrollX + window.innerWidth - popoverWidth - 8;
        setWaybillAnchor({ top: docTop, left: Math.max(minLeft, Math.min(docLeft, maxLeft)) });
        setWaybillInfoId(shipmentId);
    }

    function startEdit(shipment: Shipment) {
        setEditingId(shipment.id);
        setStatusConfirm(null);
        setWaybillInfoId(null);
        setWaybillAnchor(null);
    }

    function handleEditSaved() {
        setEditingId(null);
        refresh().then(() => showSuccess("Nakliye kaydı güncellendi."));
    }

    function handleStatusConfirmed() {
        setStatusConfirm(null);
        refresh().then(() => showSuccess("Ödeme durumu güncellendi."));
    }

    // ── Render ────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <SummaryStats summary={summary} />

            {message && (
                <div
                    className={[
                        "rounded-xl px-4 py-3 text-sm font-semibold border",
                        message.type === "success"
                            ? "bg-green-50 text-green-800 border-green-200"
                            : "bg-red-50 text-red-800 border-red-200",
                    ].join(" ")}
                >
                    {message.text}
                </div>
            )}

            {isCreateOpen && (
                <CreateShipmentModal
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            <section className="rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h2 className="text-lg font-bold">Nakliye Listesi</h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--home-muted)]" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Şoför, plaka, irsaliye ara"
                                className="h-10 w-full rounded-lg border border-[var(--home-border)] bg-white/80 pl-9 pr-3 text-sm outline-none"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[var(--home-accent)] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[var(--home-accent)]/20 transition-all hover:bg-[var(--home-accent-strong)] hover:shadow-lg hover:shadow-[var(--home-accent)]/30 whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            Yeni Nakliye Ekle
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowActions((prev) => !prev)}
                            className={[
                                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
                                showActions
                                    ? "border-[var(--home-accent)] bg-[var(--home-accent)] text-white"
                                    : "border-[var(--home-border)] bg-white text-[var(--home-muted)] hover:text-[var(--home-accent)]",
                            ].join(" ")}
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            {showActions ? "İşlemleri Gizle" : "İşlemler"}
                        </button>
                    </div>
                </div>

                <FilterTabs statusFilter={statusFilter} onFilterChange={setStatusFilter} summary={summary} />

                {statusConfirm && (
                    <StatusConfirmBanner
                        data={statusConfirm}
                        onPaidDateChange={(date) => setStatusConfirm((prev) => (prev ? { ...prev, paidDate: date } : prev))}
                        onConfirmed={handleStatusConfirmed}
                        onCancel={() => setStatusConfirm(null)}
                    />
                )}

                {loading ? (
                    <div className="py-10 flex items-center justify-center text-[var(--home-muted)] gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                    </div>
                ) : shipments.length === 0 ? (
                    <p className="py-10 text-center text-[var(--home-muted)]">Kayıt bulunamadı.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className={["w-full table-fixed text-sm", showActions ? "min-w-[1200px]" : "min-w-[1000px]"].join(" ")}>
                                {showActions ? (
                                    <colgroup><col className="w-[3%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[13%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[8%]" /><col className="w-[10%]" /></colgroup>
                                ) : (
                                    <colgroup><col className="w-[3%]" /><col className="w-[11%]" /><col className="w-[11%]" /><col className="w-[12%]" /><col className="w-[14%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[9%]" /></colgroup>
                                )}
                                <ShipmentTableHead showActions={showActions} />
                                <tbody>
                                    {shipments.map((shipment) => (
                                        <Fragment key={shipment.id}>
                                            <ShipmentTableRow
                                                shipment={shipment}
                                                todayISO={todayISO}
                                                showActions={showActions}
                                                pending={pending}
                                                deleteConfirmId={deleteConfirmId}
                                                onToggleWaybill={toggleWaybillInfo}
                                                onRequestToggleStatus={requestToggleStatus}
                                                onStartEdit={startEdit}
                                                onDelete={onDelete}
                                                onSetDeleteConfirmId={setDeleteConfirmId}
                                            />
                                            {editingId === shipment.id && (
                                                <EditShipmentRow
                                                    shipment={shipment}
                                                    colSpan={showActions ? 11 : 10}
                                                    onSaved={handleEditSaved}
                                                    onCancel={() => setEditingId(null)}
                                                />
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <PaginationBar
                            page={page}
                            pageSize={pageSize}
                            totalCount={totalCount}
                            loading={loading}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                        />
                    </>
                )}

                {selectedWaybillShipment && waybillAnchor && (
                    <WaybillPopover
                        shipment={selectedWaybillShipment}
                        anchor={waybillAnchor}
                        onClose={() => { setWaybillInfoId(null); setWaybillAnchor(null); }}
                    />
                )}
            </section>
        </div>
    );
}
