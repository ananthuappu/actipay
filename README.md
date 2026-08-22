# 🏋️ GymPay — Mobile Gym Member & Payment Tracker

A lightweight, mobile-first Progressive Web App (PWA) built with **Next.js**, **Tailwind CSS**, and **Firebase** for independent gym owners. Manage memberships, track recurring fee dues, log daily attendance, view payment analytics, and send one-tap WhatsApp reminders — engineered to run at **strictly $0/month operational cost**.

---

## 📱 Features

### 1. Multi-Tenant Authentication & Onboarding
- **Zero-Cost Owner Sign-In:** Authenticate using an **Owner Mobile Number** or **Email** and password without paid SMS OTP gateways.
- **Tenant Isolation:** Secure multi-tenant database partitioning ensuring data privacy across multiple gyms.

### 2. Dashboard & Dues Management (`/dashboard`)
- **Real-Time Overview Metrics:** Instant counters for Active Members, Dues Soon (within 3 days), and Overdue Members.
- **Dynamic Due Engine:** Calculates active, due, and overdue statuses on the client side ($0 Spark Plan friendly).
- **Quick Member Onboarding:** Add members, choose membership plans (Monthly, Quarterly, Half-Yearly, Annual), and track one-time **Admission/Advance Fees**.
- **One-Tap WhatsApp Reminders:** Send pre-formatted, personalized payment reminder messages with a single tap.
- **Fast Payment Extensions:** Log renewals by 1, 3, 6, or 12 months with payment mode selection (UPI, Cash, Card, Bank Transfer).
- **Payment History Drawer:** View previous transaction receipts for any member on demand.

### 3. Member Management & Inactivity Retention (`/members`)
- **Full Member Directory:** Searchable by member name or phone number.
- **Profile Editing:** Update fee amounts, subscription plan types, contact numbers, and next due dates.
- **Inactivity Tracker (4+ Days Absent):** Automatically detects members missing workouts for 4 or more consecutive days.
- **WhatsApp Absent Nudge:** Send personalized re-engagement messages directly to members who haven't visited recently.
- **Soft Exit & Reactivate:** Mark members as exited when they leave (retains financial and attendance records for reports) with instant reactivation.
- **Atomic Cascading Deletion:** Permanently delete a member along with their entire payment receipts and attendance logs via Firestore batch writes.

### 4. Daily Attendance & Check-In (`/attendance`)
- **One-Tap Attendance Roster:** Fast front-desk check-in interface with exact punch timestamps.
- **Live Daily Present Counter:** Instant tally of members checked in today.
- **Hardware-Ready Biometric Architecture:** Prepared for webhook push events from eSSL, ZKTeco, or Mantra facial/fingerprint scanners.

### 5. Sales & Revenue Analytics (`/payments`)
- **Revenue Snapshot:** Compare current month's collection with lifetime revenue.
- **Payment Method Split:** Live breakdown of collections across UPI, Cash, and Card/Other.
- **Registration vs. Subscription Tracking:** Distinguishes recurring subscription income from one-time onboarding admission charges.
- **Searchable Transaction Audit Feed:** Filter transaction records by calendar month or search by member name.

### 6. PWA & Offline Readiness
- **Installable Mobile PWA:** Add to iOS and Android home screens as a full-screen standalone application.
- **Offline Persistence:** Firestore local caching allows the app to load and function in low-connectivity areas (e.g., gym basements).

---

## 🛠️ Zero-Cost Tech Stack

| Layer | Technology | Cost |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router), React, Tailwind CSS, Lucide Icons | **$0** |
| **Hosting & CDN** | Vercel (Hobby Tier) | **$0** |
| **Database & Auth** | Firebase Authentication & Cloud Firestore (Spark Free Plan) | **$0** |
| **PWA Engine** | Web App Manifest & Service Worker Meta | **$0** |
| **Messaging** | Native `wa.me` WhatsApp Deep Linking | **$0** |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed on your machine
- A free [Firebase Console](https://console.firebase.google.com/) account

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id