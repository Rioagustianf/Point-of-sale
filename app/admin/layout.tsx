import type React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <SidebarProvider>
        <SidebarTrigger className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg border border-slate-200 rounded-lg" />
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarProvider>
    </div>
  );
}
