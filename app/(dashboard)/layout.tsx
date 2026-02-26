import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto pb-20">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
