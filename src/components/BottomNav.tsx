"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCheck, ReceiptText, ShieldCheck, Headset, X, Mail, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { gym } = useAuth();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

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
      icon: Headset,
      isAction: true,
      onClick: () => setIsSupportModalOpen(true)
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
    <>
      <nav className="fixed bottom-6 left-4 right-4 z-40 max-w-sm mx-auto">
        <div className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] px-4 py-3 flex items-center justify-between border border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            const activeClasses = "bg-blue-600 text-white shadow-md shadow-blue-200/50";
            const inactiveClasses = "text-slate-400 hover:bg-slate-50 hover:text-slate-600";
            
            const classes = `flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300 active:scale-95 ${
              isActive ? activeClasses : inactiveClasses
            }`;

            if (item.isAction) {
              return (
                <button key={item.label} onClick={item.onClick} className={classes}>
                  <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                </button>
              );
            }

            if (item.isExternal && item.href) {
              return (
                <a key={item.label} href={item.href} className={classes}>
                  <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                </a>
              );
            }

            return (
              <Link key={item.label} href={item.href || "#"} className={classes}>
                <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-xl mb-24 sm:mb-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Need Help?</h2>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <a 
                href="https://wa.me/919656768204"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsSupportModalOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-green-50 border border-green-200 hover:bg-green-100 transition group"
              >
                <div className="bg-green-500 text-white p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 text-base">Chat on WhatsApp</h3>
                  <p className="text-xs text-green-700 mt-0.5">Quickest response time</p>
                </div>
              </a>

              <a 
                href="mailto:gympaysupport@gmail.com?subject=Support%20Request%20-%20ActiPay"
                onClick={() => setIsSupportModalOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition group"
              >
                <div className="bg-blue-600 text-white p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-base">Send an Email</h3>
                  <p className="text-xs text-blue-700 mt-0.5">gympaysupport@gmail.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}