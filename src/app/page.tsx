"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Menu, X, BarChart3, Users, MessageSquare, CreditCard } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const features = [
    {
      title: "Smart Customer Tracking",
      description: "Track your customer interactions, check-ins, or service fulfillments effortlessly across any industry.",
      icon: <Users className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Deep Revenue Analytics",
      description: "Understand your cash flow with built-in analytics. Tag specific services and see exactly where your revenue comes from.",
      icon: <BarChart3 className="h-6 w-6 text-emerald-600" />
    },
    {
      title: "Instant WhatsApp Invoicing",
      description: "Generate beautiful, customized invoice images and share them directly to your customer's WhatsApp with a single tap.",
      icon: <MessageSquare className="h-6 w-6 text-amber-500" />
    },
    {
      title: "Pay Per Active User",
      description: "No flat monthly fees. Buy prepaid credits and only consume them when a customer actually pays you.",
      icon: <CreditCard className="h-6 w-6 text-indigo-600" />
    }
  ];

  return (
    <main className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Activity className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-none">ActiPay Fitness</span>
                <span className="text-[9px] text-slate-500 tracking-wide mt-0.5 uppercase">PAY PER ACTIVE</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Pricing</a>
              
              <div className="flex items-center gap-3 border-l border-slate-200 pl-8">
                <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition">
                  Sign In
                </Link>
                <Link href="/register" className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-200">
                  Try Free
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900 p-2"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 absolute w-full left-0 shadow-lg">
            <div className="px-4 pt-2 pb-6 space-y-1">
              <a href="#features" className="block px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Features</a>
              <a href="#pricing" className="block px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Pricing</a>

              <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link href="/login" className="block text-center w-full px-4 py-3 text-base font-medium text-slate-700 border border-slate-300 rounded-full hover:bg-slate-50">
                  Log in
                </Link>
                <Link href="/register" className="block text-center w-full px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-full shadow-sm hover:bg-blue-700">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-6 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Installable as Mobile Apps (PWA)
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto">
            Zero Dead Subscriptions. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pay Only If You Earn.</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Built exclusively for small-scale owners. Throw away the book and pen. Stop paying flat monthly software fees for tools you barely use. With ActiPay Fitness, you only pay for customers who actually do business with you.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 duration-200">
              Start Free Trial <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#pricing" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition shadow-sm hover:shadow hover:-translate-y-0.5 duration-200">
              View Our Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to run your business</h2>
            <p className="text-slate-600 text-lg">Our products are built for small-scale business owners who want to upgrade from pen and paper without taking on fixed software overhead.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-md transition duration-200">
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-xs">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ActiPay Fitness AMC Pricing</h2>
            <p className="text-slate-400 text-lg">Buy Active Member Credits (AMC) in bulk. 1 AMC = 1 Month of Active Member Tracking.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* 30 AMC */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Starter Pack</h3>
              <p className="text-slate-400 text-sm mb-6">30 Active Member Credits</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">₹299</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" /> ₹9.96 / customer
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" /> Never expires
                </li>
              </ul>
              <Link href="/register" className="block text-center w-full py-3 px-4 rounded-full font-bold text-white bg-slate-700 hover:bg-slate-600 transition">Get Started</Link>
            </div>

            {/* 100 AMC */}
            <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-3xl p-8 border border-blue-500 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full">Most Popular</div>
              <h3 className="text-xl font-bold mb-2">Growth Pack</h3>
              <p className="text-blue-200 text-sm mb-6">100 Active Member Credits</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">₹599</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" /> ₹5.99 / customer
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Never expires
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Priority Support
                </li>
              </ul>
              <Link href="/register" className="block text-center w-full py-3 px-4 rounded-full font-bold text-blue-700 bg-white hover:bg-slate-50 transition shadow-lg">Start Free Trial</Link>
            </div>

            {/* 300 AMC */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Pro Pack</h3>
              <p className="text-slate-400 text-sm mb-6">300 Active Member Credits</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">₹1,199</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" /> ₹3.99 / customer
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" /> Never expires
                </li>
              </ul>
              <Link href="/register" className="block text-center w-full py-3 px-4 rounded-full font-bold text-white bg-slate-700 hover:bg-slate-600 transition">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-sm text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 font-bold text-lg text-white mb-4">
            <Activity className="h-5 w-5" /> fitness.actipay.online
          </div>
          <p>© {new Date().getFullYear()} ActiPay Fitness. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}