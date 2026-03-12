"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Store, User, History, Package, Truck, FileText, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/kutuphane/urunler", label: "Ürün Yönetimi", icon: Package },
    { href: "/hesap", label: "Hesap", icon: Calculator },
    { href: "/pos/quotes", label: "Fişler", icon: History },
    { href: "/nakliye", label: "Nakliye", icon: Truck },
    { href: "/sozlesmeler", label: "Kurumsal Teklif", icon: FileText },
];

export function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 border-b border-[var(--home-border)] bg-[var(--home-bg)] text-[var(--home-text)]">
            <div className="w-full text-white" style={{ background: "linear-gradient(90deg, var(--home-accent-strong) 0%, var(--home-accent) 92%, var(--home-warm-accent) 100%)" }}>
                <div className="max-w-6xl mx-auto h-11 px-4 sm:px-6 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-semibold tracking-tight">Tüm Modüllerde Hızlı Hesap & Fiş</span>
                    <div className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wide">
                        <span>Yardım</span>
                        <span>İletişim</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
                <div className="flex items-center gap-4 sm:gap-6">
                    <Link href="/" className="flex items-center gap-3 group shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--home-accent)] text-white transition-colors duration-200 group-hover:bg-[var(--home-accent-strong)]">
                            <Store className="w-5 h-5" strokeWidth={2.2} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--home-text)] leading-none">
                                AKSA
                            </span>
                            <span className="text-[10px] font-semibold text-[var(--home-muted)] uppercase tracking-wider mt-1 hidden sm:block">
                                İNŞAAT
                            </span>
                        </div>
                    </Link>

                    <label className="hidden sm:flex items-center gap-2 flex-1 min-w-0 h-12 rounded-full bg-[var(--home-surface)] border border-[var(--home-border)] px-4">
                        <Search className="w-5 h-5 text-[var(--home-muted)] shrink-0" />
                        <input
                            type="text"
                            placeholder="Ürün, kategori veya fiş ara"
                            className="w-full bg-transparent text-sm text-[var(--home-text)] placeholder:text-[var(--home-muted)] outline-none"
                        />
                    </label>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link
                            href="/pos/quotes"
                            className="h-11 px-4 sm:px-5 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] text-[var(--home-text)] text-sm font-semibold flex items-center gap-2 hover:bg-[var(--home-surface-soft)] transition-colors"
                        >
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">Hesabım</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
                <nav className="flex items-center gap-2 overflow-x-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[13px] sm:text-sm font-semibold whitespace-nowrap transition-colors",
                                    isActive
                                        ? "bg-[var(--home-accent)] text-white border border-transparent"
                                        : "text-[var(--home-muted)] hover:text-[var(--home-text)] hover:bg-[var(--home-surface)]"
                                )}
                            >
                                <item.icon className="w-[17px] h-[17px]" strokeWidth={isActive ? 2.4 : 2.1} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="h-1" style={{ background: "linear-gradient(90deg, var(--home-accent-strong) 0%, var(--home-accent) 94%, var(--home-warm-accent) 100%)" }} />
        </header>
    );
}
