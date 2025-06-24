"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  Cat as Categories,
  Receipt,
  BarChart,
  LogOut,
  List,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useEffect } from "react";
import { NavUser } from "./Nav-User";
import logo from "@/public/logo.png";
import Image from "next/image";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", url: "/admin" },
  { icon: Package, label: "Produk", url: "/admin/products" },
  { icon: List, label: "Kategori", url: "/admin/categories" },
  { icon: Users, label: "Users", url: "/admin/users" },
  { icon: Receipt, label: "Transaksi", url: "/admin/transactions" },
  { icon: BarChart, label: "Laporan", url: "/admin/reports" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const logout = async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    });
    if (res.ok) {
      await res.json();
      location.reload();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        logout();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Sidebar className="bg-blue-800 text-white min-h-screen">
      <SidebarContent className="bg-blue-800 to-blue-300">
        <SidebarHeader>
          <div className="flex flex-row items-center gap-2">
            <Image src={logo} width={50} height={50} alt="logo" />
            <p className="text-xl font-semibold text-white">DENALI STORE</p>
          </div>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "hover:bg-blue-700 hover:text-white transition-all",
                      pathname === item.url
                        ? "bg-blue-700 text-white font-bold shadow-lg"
                        : ""
                    )}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-blue-800 to-blue-300">
        <NavUser></NavUser>
      </SidebarFooter>
    </Sidebar>
  );
}
