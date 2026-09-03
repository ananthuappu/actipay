"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCheck, ReceiptText, ShieldCheck, Headset } from "lucide-react";
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
    {
      label: "Support",
      href: "mailto:gympaysupport@gmail.com?subject=Support%20Request%20-%20ActiPay",
      icon: Headset,
      isExternal: true,
    },
  ];

  if (gym?.role === "admin") {
    navItems.push({
      label: "Admin",
      href: "/admin",
      icon: ShieldCheck,
    });
  }

  // Generate grid column class dynamically
  const gridColsClass = navItems.length === 6 ? "grid-cols-6" : "grid-cols-5";

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] px-4 py-3 flex items-center justify-between border border-slate-100">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          const activeClasses = "bg-blue-600 text-white shadow-md shadow-blue-200/50";
          const inactiveClasses = "text-slate-400 hover:bg-slate-50 hover:text-slate-600";
          
          const classes = `flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300 active:scale-95 ${
            isActive ? activeClasses : inactiveClasses
          }`;

          if (item.isExternal) {
            return (
              <a key={item.href} href={item.href} className={classes}>
                <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={classes}>
              <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}