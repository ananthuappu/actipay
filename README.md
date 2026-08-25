# ⚡ ActiPay — Member Dues & Payment Tracker

A lightweight, mobile-first Progressive Web App (PWA) built with **Next.js**, **Tailwind CSS**, and **Firebase** for gyms, yoga studios, and fitness centers. Manage memberships, track recurring fee dues, log daily attendance, view payment analytics, and send one-tap WhatsApp reminders.

Engineered with a unique **Prepaid Active Member Credit (AMC)** model — allowing businesses to stop paying flat SaaS fees for ghost members and only pay for exactly what they use.

---

## 📱 Features

### 1. Multi-Tenant Authentication & Onboarding
- **Zero-Cost Owner Sign-In:** Authenticate using an **Owner Mobile Number** or **Email** and password without paid SMS OTP gateways.
- **Tenant Isolation:** Secure multi-tenant database partitioning ensuring data privacy across multiple gyms.

### 2. Dashboard & Dues Management (`/dashboard`)
- **Real-Time Overview Metrics:** Instant counters for Active Members, Dues Soon (within 3 days), and Overdue Members.
- **Dynamic Due Engine:** Calculates active, due, and overdue statuses on the client side.
- **Quick Member Onboarding:** Add members, choose membership plans (Monthly, Quarterly, Half-Yearly, Annual), and track one-time **Admission/Advance Fees**.
- **Prepaid AMC Protection:** Seamlessly validates wallet balance before allowing an owner to add or renew a member. Automatically blocks actions if the owner doesn't have sufficient AMCs.
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

## 🛠️ Technology Stack

This platform is built on a modern, high-performance, and deeply integrated architecture:

### Core Framework & Language
* **Next.js (App Router):** The overarching React framework powering the app, handling routing, server-side rendering, and API endpoints (like the auto-generated logo).
* **React 19:** The UI library used to build all components, manage state, and handle interactive elements.
* **TypeScript:** The entire codebase is strictly typed to catch bugs at compile-time and mathematically secure data structures (like Gym and Member profiles).

### Styling & UI
* **Tailwind CSS v4:** The utility-first CSS framework used for all styling. Allows us to build beautiful, responsive layouts directly inside React components without maintaining separate CSS files.
* **Lucide React:** A beautiful, lightweight SVG icon library providing all the scalable icons used throughout the dashboard.

### Backend & Database (BaaS)
* **Firebase Authentication:** Handles all secure user sign-ups, secure logins, password management, and session tokens.
* **Firebase Cloud Firestore:** A real-time NoSQL database. Stores all Gyms, Members, Payments, and Attendance records. We heavily utilize **Atomic Transactions** (to securely deduct tokens without race conditions) and **Real-time Listeners** (to push live UI updates).

### Progressive Web App (PWA)
* **PWA Engine:** The app is configured with a Web Manifest and Service Worker, allowing it to bypass App Stores. It natively prompts users to install and runs directly on the device's hardware like a native iOS or Android app.

### Utilities
* **html-to-image:** A specialized library used in the Receipt Generator to take HTML receipt cards, convert them into crisp JPEGs, and pass them to the native mobile Web Share API for WhatsApp sharing.

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