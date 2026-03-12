import { TileReplacer } from "@/components/TileReplacer";
import { Header } from "@/components/Header";

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col bg-[var(--home-bg)] overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0">
        <TileReplacer />
      </main>
    </div>
  );
}
