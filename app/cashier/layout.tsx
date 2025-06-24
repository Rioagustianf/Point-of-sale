import { CashierSidebar } from "@/components/cashier/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      <SidebarProvider>
        <SidebarTrigger />
        <CashierSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-8">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
