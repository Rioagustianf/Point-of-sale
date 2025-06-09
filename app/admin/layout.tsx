import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <SidebarTrigger />
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-8">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
