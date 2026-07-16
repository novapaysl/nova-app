import "./App.css";
import { Authenticated, Refine } from "@refinedev/core";
import routerProvider, { NavigateToResource, UnsavedChangesNotifier } from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router";
import { RefineAiErrorComponent } from "@/components/catch-all";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "@/components/refine-ui/notification/toaster";

import { LoginPage } from "@/pages/auth/login";
import { RegisterPage } from "@/pages/auth/register";
import { KYCPage } from "@/pages/kyc";

import { dataProvider } from "@/providers/data";
import { authProvider } from "@/providers/auth";
import { LandingPage } from "@/pages/landing";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardPage } from "@/pages/dashboard";
import { WalletPage } from "@/pages/dashboard/wallet";
import { ProfilePage } from "@/pages/dashboard/profile";
import { SendMoneyPage } from "@/pages/dashboard/send";
import { ReceiveMoneyPage } from "@/pages/dashboard/receive";
import { TransactionsPage } from "@/pages/dashboard/transactions";
import { NotificationsPage } from "@/pages/dashboard/notifications";
import { SecurityPage } from "@/pages/dashboard/security";

// 🚦 IMPORT THE NEW CHECKOUT PAGE
import { CheckoutPage } from "@/pages/checkout";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOverviewPage } from "@/pages/admin";
import { AdminUsersPage } from "@/pages/admin/users";
import { AdminKycPage } from "@/pages/admin/kyc";
import { AdminTransactionsPage } from "@/pages/admin/transactions";
import { AdminSecurityPage } from "@/pages/admin/security";
console.log("--- 🕵️‍♂️ NOVAPAY ENV DIAGNOSTICS ---");
console.log("VITE_SUPABASE_URL is:", import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY is:", import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log("---------------------------------");
const App = () => {
  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerProvider}
        dataProvider={dataProvider}
        authProvider={authProvider}
        notificationProvider={useNotificationProvider}
        resources={[]}>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes */}
          <Route
            element={
              <Authenticated key="auth-pages" fallback={<Outlet />}>
                <Navigate to="/dashboard" />
              </Authenticated>
            }>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* KYC route — authenticated, no dashboard sidebar */}
          <Route
            element={
              <Authenticated key="kyc-route" fallback={<Navigate to="/login" />}>
                <Outlet />
              </Authenticated>
            }>
            <Route path="/kyc" element={<KYCPage />} />
          </Route>

          {/* Protected dashboard routes */}
          <Route
            element={
              <Authenticated key="dashboard-routes" fallback={<Navigate to="/login" />}>
                <DashboardLayout />
              </Authenticated>
            }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/wallet" element={<WalletPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/send" element={<SendMoneyPage />} />
            <Route path="/dashboard/receive" element={<ReceiveMoneyPage />} />
            <Route path="/dashboard/transactions" element={<TransactionsPage />} />
            <Route path="/dashboard/notifications" element={<NotificationsPage />} />
            <Route path="/dashboard/security" element={<SecurityPage />} />
            <Route path="/dashboard/*" element={<RefineAiErrorComponent />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="kyc" element={<AdminKycPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
            <Route path="*" element={<RefineAiErrorComponent />} />
          </Route>

          {/* 🚦 REGISTER THE PUBLIC CHECKOUT ROUTE */}
          <Route path="/pay" element={<CheckoutPage />} />

          <Route path="*" element={<RefineAiErrorComponent />} />
        </Routes>

        <Toaster />

        <UnsavedChangesNotifier />
      </Refine>
    </BrowserRouter>
  );
};

export default App;