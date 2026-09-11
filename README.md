# ⚡ ActiPay Fitness — Gym Member Dues & Business OS

A lightweight, mobile-first Progressive Web App (PWA) built with **Next.js**, **Tailwind CSS**, and **Firebase** for gyms, fitness clubs, and yoga studios. Manage memberships, track recurring fee dues, log daily attendance, view payment analytics, issue printable PDF receipts, and send one-tap WhatsApp reminders with direct UPI payment links.

Engineered with a **Pay-As-You-Grow Active Member Credit (AMC)** model — allowing gym owners to eliminate expensive fixed monthly software fees and pay only for members who actually train and pay.

---

## 📱 Key Features

### 1. Multi-Tenant Authentication & Multi-Role Staff Logins
- **Owner & Staff Logins:** Single unified login at `/login` supporting both Gym Owners and Front-Desk / Trainer staff.
- **Secondary App Staff Creation:** Gym owners can create reception staff accounts directly in the Dashboard Profile without being logged out of their own session.
- **Role-Based Permission Scoping:**
  - **Staff Members Can:** View members, search, mark daily attendance, add members, record renewals, and send WhatsApp receipts/due reminders.
  - **Staff Cannot:** View total monthly/lifetime revenue summaries (masked to "Owner View Only"), delete member records permanently, or manage other staff accounts.
- **Strict Multi-Tenant Isolation:** Database rules guarantee that staff and owners from one gym cannot access or query data from any other gym.

### 2. 30-Day Free Trial & Pay-As-You-Grow AMC Engine
- **30-Day Free Trial (50-Member Cap):** New gyms start on a 30-day trial with up to 50 active members. All attendance, payment logging, and member tracking features are completely unrestricted without AMC deduction.
- **Graceful Soft-Lock:** After day 30, gym owners can still log in and view member names and contact numbers. Adding new members, recording payments, and attendance check-ins resume upon recharging an AMC pack.
- **Prepaid Active Member Credits (AMC):**
  - **1 Month = 1 AMC** • **Quarterly = 3 AMCs** • **Half-Yearly = 6 AMCs** • **Annual = 12 AMCs**
  - AMCs are deducted only when an active member is added or renewed. Inactive members cost ₹0. Credits stay in the wallet forever.

### 3. Dashboard & Dues Management (`/dashboard`)
- **Real-Time Overview Metrics:** Counters for Active Members, Personal Training (PT) Enrolled, Due Soon (expiring in 5 days), and Overdue Members.
- **One-Tap WhatsApp Reminders with Direct UPI:** Configurable Gym UPI ID / VPA automatically attaches a clickable `upi://pay` link to WhatsApp reminder messages for instant 1-tap payments.
- **Search & Quick Filters:** Instant client-side search across member names and phone numbers, with tabs for `All`, `Due Soon`, and `Overdue`.
- **Payment History Drawer:** View previous transaction receipts for any member on demand.

### 4. Member Management & Retention (`/members`)
- **Full Member Directory:** Filter by Active, Absent (4+ days without attendance), or Exited members.
- **Profile Editing:** Update plans, fee amounts, joining dates, due dates, and Personal Training (PT) flags.
- **Inactivity Tracker & WhatsApp Nudge:** Detects members absent for 4+ consecutive days and sends personalized re-engagement messages via WhatsApp.
- **Soft Exit & Reactivation:** Mark members as exited when they leave (preserves financial logs) with 1-click reactivation.
- **Cascade Deletion (Owner Only):** Permanently removes a member along with their entire payment receipts and attendance logs.

### 5. Daily Attendance & Hardware-Ready Check-In (`/attendance`)
- **One-Tap Check-In Roster:** Instant front-desk check-in interface with exact timestamp logging.
- **Live Daily Present Counter:** Live tally of members checked in today.
- **Hardware-Ready Biometric Architecture:** Prepared for webhook integration with eSSL, ZKTeco, and Mantra facial/fingerprint scanners.

### 6. Sales & Revenue Analytics (`/payments`)
- **Revenue Snapshot (Owner Only):** Real-time totals for This Month's Collection, Lifetime Revenue, and Personal Training (PT) income.
- **6-Month Revenue Trend Chart:** Visual bar chart showing monthly collection trends.
- **Revenue Split & Payment Mode Breakdown:** Recurring vs. Admission fees, and UPI vs. Cash vs. Card collections.
- **Searchable Transaction Feed:** Filter transactions by date ranges (This Month, Last Month, Last 3 Months, Custom Range) or search by member name.
- **Multi-Format Receipts:** Generate printable/downloadable PDF receipts, WhatsApp text receipts, and downloadable image receipts.

### 7. SaaS Master Admin Panel (`/admin`)
- **Master Admin Dashboard:** Accessible exclusively to verified SaaS admin emails.
- **Gym Management:** Search registered gyms, adjust wallet AMC balances, and toggle between `TRIAL` and `PAID` subscription plans.

### 8. Desktop & Mobile PWA Experience
- **Responsive Split Desktop Auth:** Modern SaaS layout on desktop screens and native feel on mobile devices.
- **Installable PWA:** Add to iOS and Android home screens as a full-screen standalone application.
- **Offline Resilience:** Local Firestore caching enables operation in low-connectivity areas (e.g. gym basements).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Server & Client Components) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strictly Typed) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/) |
| **Backend & DB** | [Firebase Authentication](https://firebase.google.com/docs/auth) & [Cloud Firestore](https://firebase.google.com/docs/firestore) |
| **PWA** | Web App Manifest & Service Worker |
| **Receipt Generation** | HTML5 Canvas & PDF generation |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed on your machine
- A [Firebase Console](https://console.firebase.google.com/) project

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies & Run Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Firestore Security Rules Reference

Paste into **Firebase Console → Firestore Database → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.token.email in [
        'gympaysupport@gmail.com',
        'your-email@gmail.com'
      ];
    }

    function isOwner(gymId) {
      return request.auth != null && (
        request.auth.uid == gymId || 
        (resource != null && resource.data.ownerId == request.auth.uid)
      );
    }

    function isStaffOf(gymId) {
      return request.auth != null && 
        exists(/databases/$(database)/documents/staff/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/staff/$(request.auth.uid)).data.gymId == gymId;
    }

    match /staff/{staffId} {
      allow read: if request.auth != null && (request.auth.uid == staffId || isAdmin());
      allow create: if request.auth != null && (
        request.resource.data.gymId == request.auth.uid || isAdmin()
      );
      allow update, delete: if request.auth != null && (
        resource.data.gymId == request.auth.uid || isAdmin()
      );
    }

    match /gyms/{gymId} {
      allow create: if request.auth != null;
      allow read: if isOwner(gymId) || isStaffOf(gymId) || isAdmin();
      allow update, delete: if isOwner(gymId) || isAdmin();

      match /staff/{staffMemberId} {
        allow read, write, delete: if isOwner(gymId) || isAdmin();
      }

      match /members/{memberId} {
        allow read, write: if isOwner(gymId) || isStaffOf(gymId) || isAdmin();
        allow delete: if isOwner(gymId) || isAdmin();
      }

      match /payments/{paymentId} {
        allow read, write: if isOwner(gymId) || isStaffOf(gymId) || isAdmin();
      }

      match /attendance/{attendanceId} {
        allow read, write: if isOwner(gymId) || isStaffOf(gymId) || isAdmin();
      }
    }
  }
}
```

---

## 📄 License

Proprietary © ActiPay Fitness Technologies. All rights reserved.