"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShoppingCart, Receipt, LogOut } from "lucide-react";
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
import Image from "next/image";
import { NavUser } from "../admin/Nav-User";
import logo from "@/public/logo.png";

const menuItems = [
  { icon: ShoppingCart, label: "New Transaction", url: "/cashier" },
  { icon: Receipt, label: "Transaction History", url: "/cashier/history" },
];

export function CashierSidebar() {
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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <div className="flex flex-row items-center gap-2">
            <Image src={logo} width={50} height={50} alt="logo" />
            <p className="text-xl font-semibold">DENALI STORE</p>
          </div>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
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
      <SidebarFooter>
        <NavUser></NavUser>
      </SidebarFooter>
    </Sidebar>
  );
}
