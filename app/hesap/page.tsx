import { Header } from "@/components/Header";
import { HesapSystem } from "@/components/HesapSystem";

export default function HesapPage() {
    return (
        <div className="min-h-screen bg-[var(--home-bg)] text-[var(--home-text)] flex flex-col">
            <Header />
            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-[var(--home-bg)]">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--home-border)]">
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--home-text)] sm:text-3xl">
                            POS Hesap
                        </h1>
                    </div>

                    <HesapSystem />

                    <footer className="text-center text-xs text-[var(--home-muted)] pt-12 pb-4">
                        &copy; {new Date().getFullYear()} Aksa Seramik - POS Hesap Modulu
                    </footer>
                </div>
            </main>
        </div>
    );
}
