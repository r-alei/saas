import { Header } from "@/components/Header";
import { ProductManager } from "@/components/ProductManager";

export default function ProductManagementPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[var(--home-bg)] text-[var(--home-text)]">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <ProductManager />
            </main>

            <footer className="border-t border-[var(--home-border)] py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-xs text-[var(--home-muted)]">
                        SeramikAI — Ürün Yönetim Paneli
                    </p>
                </div>
            </footer>
        </div>
    );
}
