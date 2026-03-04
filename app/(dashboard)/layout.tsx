import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh flex flex-col bg-white overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <div className="max-w-lg mx-auto">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
