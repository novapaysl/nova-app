# Project: NovaPay – Sierra Leone Digital Wallet Platform

## Overview

NovaPay is a modern fintech web platform for Sierra Leone that enables users to create accounts, complete KYC identity verification, manage a Leone (SLE) digital wallet, send/receive money, and track transactions. It serves both individual users and merchants, with a separate admin compliance dashboard. Brand colors are Sky Blue (#1DA1F2) and Green (#22C55E) with a premium, clean, trustworthy aesthetic similar to PayPal, Wise, and Flutterwave.

---

<phase number="1" title="Landing Page & Brand Identity">

Deliver a high-converting, fully branded public homepage that establishes NovaPay's identity and drives signups.

#### Key Features

- Hero section with NovaPay logo, tagline, and CTA buttons (Create Account / Login)
- Trust section with encrypted payments, KYC verification, and digital wallet cards
- "How NovaPay Works" 3-step process section
- Features section with fintech feature cards (Wallet, Send, Receive, History, Security)
- Business/merchant section with "Become a Merchant" CTA
- Footer with logo, nav links, and social media

#### Tasks

- [x] Set up global brand theme — Sky Blue (#1DA1F2), Green (#22C55E), Tailwind config, fonts, and shared layout components (Navbar with logo from NovaPay Emblem.webp, Footer)
- [x] Build Hero section with NovaPay logo, tagline "The future of digital payments in Sierra Leone", subtitle, gradient background, and CTA buttons linking to /register and /login
- [x] Build Trust section ("Your money. Your identity. Protected.") with 3 glassmorphism cards: Secure Payments, Identity Verification, Digital Leone Wallet
- [x] Build "How NovaPay Works" 3-step section and Features section with 5 fintech feature cards (Digital Wallet, Send Money, Receive Payments, Transaction History, Security Monitoring)
- [x] Build Business/Merchant section ("Grow your business with NovaPay") and professional Footer with links and social icons

#### Notes

- Logo: use artifact `user-content:NovaPay Emblem.webp` via its artifact URL
- Design style: clean, modern, glassmorphism elements, rounded cards, smooth hover animations
- Brand tagline: "Pay Smart. Live Better."
- Landing page route: `/`

</phase>

<phase number="2" title="Authentication & KYC Onboarding Flow">

Deliver fully functional register, login, and KYC verification pages with professional fintech-grade UI.

#### Key Features

- Register page with full name, email, phone number, password, confirm password
- Login page with email, password, forgot password link
- KYC page with personal information and identity document upload sections
- Post-registration redirect to KYC page
- Post-KYC "under review" confirmation state

#### Tasks

- [x] Build Login page (`/login`) — email & password fields, "Forgot Password" link, login button, link to register; branded with NovaPay header and blue/green gradient accent
- [x] Build Register page (`/register`) — full name, email, phone number, password, confirm password fields; on success redirect to `/kyc`; uses `profiles` resource
- [x] Build KYC Verification page (`/kyc`) — Personal Info section (full name, DOB, address, city, country) and Identity Verification section (document type, national ID number, document upload, selfie upload)
- [x] Add KYC submission confirmation state — show "Your verification is under review" success screen after form submit
- [x] Wire up auth routing — protect dashboard routes, redirect unauthenticated users to `/login`, redirect authenticated users away from auth pages; add `<Authenticated>` wrappers in App.tsx

#### Notes

- Auth provider is custom/pre-configured — only build UI pages, not auth logic
- KYC uses `profiles` resource (account_status field tracks verification state)
- File upload fields are UI only (no backend storage needed in this phase)

</phase>

<phase number="3" title="User Dashboard – Core">

Deliver a fully functional user dashboard with sidebar navigation, wallet balance display, quick actions, KYC status indicator, and recent transactions.

#### Key Features

- Protected dashboard layout with sidebar (Dashboard, Wallet, Send Money, Transactions, Profile, Security)
- Wallet balance card showing SLE balance from `wallets` resource
- Quick action buttons: Send Money, Receive Money, Add Funds
- KYC status badge (Pending / Approved) from `profiles.account_status`
- Recent transactions table from `wallet_transactions` resource

#### Tasks

- [x] Build dashboard layout with responsive sidebar (collapsible on mobile) — navigation items: Dashboard, Wallet, Send Money, Transactions, Profile, Security; NovaPay logo at top
- [x] Build Dashboard home page (`/dashboard`) — wallet balance card (SLE 0.00 from `wallets` resource), KYC status badge, quick action buttons (Send Money, Receive Money, Add Funds)
- [x] Build Recent Transactions section on dashboard — table showing transaction reference, type, amount, direction, date, status from `wallet_transactions` resource; last 5 entries
- [x] Build Wallet page (`/dashboard/wallet`) — wallet details card (wallet number, currency, balance, status) and full transaction history table with pagination
- [x] Build Profile page (`/dashboard/profile`) — view and edit profile fields (full name, email, phone number, avatar); uses `profiles` resource

#### Notes

- Dashboard is protected — requires authentication
- Wallet balance formatted as "SLE X,XXX.XX"
- KYC status: Pending = amber badge, Approved = green badge, Suspended = red badge

</phase>

<phase number="4" title="Send Money & Transactions">

Enable users to send money between NovaPay wallets and view full transaction details.

#### Key Features

- Send Money form with recipient wallet number, amount, and description
- Transfer confirmation screen with reference number
- Full transactions list page with search and filter
- Transaction detail view

#### Tasks

- [x] Build Send Money page (`/dashboard/send`) — form with recipient wallet number, amount (SLE), description/note; uses `transfers` resource; validation to prevent sending to self
- [x] Build transfer confirmation screen — show transfer reference, sender/receiver wallet, amount, status after submit
- [x] Build Receive Money page (`/dashboard/receive`) — display user's wallet number with copy button and QR code placeholder for sharing
- [x] Build full Transactions page (`/dashboard/transactions`) — searchable, filterable table of all `wallet_transactions` with type, amount, direction (credit/debit), date, status; color-coded rows
- [x] Build Transaction detail modal/page — full details of a single transaction (reference, type, amount, wallet, description, timestamp, status)

#### Notes

- `transfers` resource: sender_wallet, receiver_wallet, amount, reference, status
- `wallet_transactions` resource: transaction_reference, transaction_type, amount, direction, description, status
- Debit = red, Credit = green color coding

</phase>

<phase number="5" title="Admin Dashboard">

Deliver a separate dark-themed admin interface for managing users, reviewing KYC applications, and monitoring transactions.

#### Key Features

- Admin overview with total users, active wallets, total transactions, pending KYC counts
- User management — view, search, suspend/activate user accounts
- KYC compliance — review applications, approve/reject users, view document info
- Transaction monitoring — view all transfers, search by reference or user

#### Tasks

- [x] Build Admin layout (`/admin`) — dark navy sidebar with sections: Overview, Users, KYC Compliance, Transactions, Security Logs; separate from user dashboard
- [x] Build Admin Overview page — stat cards for Total Users, Active Wallets, Total Transactions, Pending KYC (counts from `profiles`, `wallets`, `transfers`)
- [x] Build User Management page (`/admin/users`) — table of all `profiles` with full name, email, phone, account_status, created_at; search by name/email; suspend/activate action button
- [x] Build KYC Compliance page (`/admin/kyc`) — table of profiles with account_status = "pending"; view personal details; Approve / Reject action buttons that update `profiles.account_status`
- [x] Build Transaction Monitoring page (`/admin/transactions`) — full table of `transfers` with sender wallet, receiver wallet, amount, reference, status, date; search by reference; link to `wallet_transactions` for detail

#### Notes

- Admin routes: `/admin`, `/admin/users`, `/admin/kyc`, `/admin/transactions`
- Dark fintech theme: dark navy background (#0F172A), accent blue/green
- No separate admin auth in this phase — route-level access only

</phase>

<phase number="6" title="Notifications & Security Logs">

Add notification center and security activity log to complete the user and admin experience.

#### Key Features

- In-app notification bell with unread count for users
- Notifications list page with mark-as-read functionality
- Security logs page showing login/activity history
- Admin security logs view across all users

#### Tasks

- [x] Build Notifications page (`/dashboard/notifications`) — list of `notifications` for the current user (title, message, type, status, date); mark as read action; unread badge count in sidebar
- [x] Add notification bell icon to dashboard header with unread count badge
- [x] Build Security page (`/dashboard/security`) — table of `security_logs` for current user (action, IP address, device, date); read-only view
- [x] Build Admin Security Logs page (`/admin/security`) — all security log entries across users with user name, action, IP, device, timestamp; search by user or action

#### Notes

- `notifications` resource: user_id, title, message, notification_type, status
- `security_logs` resource: user_id, action, ip_address, device, created_at
- notification_type can drive icon display (info, warning, success)

</phase>
