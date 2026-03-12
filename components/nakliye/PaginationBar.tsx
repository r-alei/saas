"use client";

import { PAGE_SIZE_OPTIONS } from "./constants";

interface PaginationBarProps {
    page: number;
    pageSize: (typeof PAGE_SIZE_OPTIONS)[number];
    totalCount: number;
    loading: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: (typeof PAGE_SIZE_OPTIONS)[number]) => void;
}

export function PaginationBar({ page, pageSize, totalCount, loading, onPageChange, onPageSizeChange }: PaginationBarProps) {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = Math.min(page * pageSize, totalCount);

    return (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[var(--home-border)] bg-white/70 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[var(--home-muted)]">
                Gösterilen: <strong>{pageStart}-{pageEnd}</strong> / <strong>{totalCount}</strong>
            </p>

            <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 text-[var(--home-muted)]">
                    Sayfa boyutu
                    <select
                        value={pageSize}
                        onChange={(event) => onPageSizeChange(Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
                        className="h-8 rounded-lg border border-[var(--home-border)] bg-white px-2 text-xs"
                    >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1 || loading}
                    className="h-8 rounded-lg border border-[var(--home-border)] bg-white px-3 font-semibold text-[var(--home-muted)] disabled:opacity-40"
                >
                    Önceki
                </button>

                <span className="font-semibold text-[var(--home-text)]">{page} / {totalPages}</span>

                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages || loading}
                    className="h-8 rounded-lg border border-[var(--home-border)] bg-white px-3 font-semibold text-[var(--home-muted)] disabled:opacity-40"
                >
                    Sonraki
                </button>
            </div>
        </div>
    );
}
