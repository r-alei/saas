import { Header } from "@/components/Header";
import { NakliyeSystem } from "@/components/NakliyeSystem";

export default function NakliyePage() {
  return (
    <div className="min-h-screen bg-[var(--home-bg)] text-[var(--home-text)] flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--home-border)]">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Nakliye Takip</h1>
          </div>

          <NakliyeSystem />

          <footer className="text-center text-xs text-[var(--home-muted)] pt-10 pb-4">
            &copy; {new Date().getFullYear()} Aksa Seramik - Nakliye ve Irsaliye Takibi
          </footer>
        </div>
      </main>
    </div>
  );
}
