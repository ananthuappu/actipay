"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCheck, ReceiptText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { gym } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Members",
      href: "/members",
      icon: Users,
    },
    {
      label: "Attendance",
      href: "/attendance",
      icon: UserCheck,
    },
    {
      label: "Payments",
      href: "/payments",
      icon: ReceiptText,
    },
  ];

  if (gym?.role === "admin") {
    navItems.push({
      label: "Admin",
      href: "/admin",
      icon: ShieldCheck,
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
      <div className={`max-w-md mx-auto grid py-2 px-2 ${navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 rounded-xl transition active:scale-95 ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}