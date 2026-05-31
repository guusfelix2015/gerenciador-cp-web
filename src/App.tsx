import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MyDashboardPage } from "@/pages/MyDashboardPage";
import { AdminPage } from "@/pages/AdminPage";
import { UsersPage } from "@/pages/UsersPage";
import { ItemsPage } from "@/pages/ItemsPage";
import { DropsPage } from "@/pages/DropsPage";
import { DropFormPage } from "@/pages/DropFormPage";
import { DropDetailPage } from "@/pages/DropDetailPage";
import { DonationPage } from "@/pages/DonationPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { Toaster } from "@/components/ui/sonner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "SUPER_ADMIN") return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
}

function DashboardRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === "MEMBER") {
    return (
      <Layout>
        <MyDashboardPage />
      </Layout>
    );
  }
  return (
    <Layout>
      <DashboardPage />
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<DashboardRoute />} />
      <Route path="/my-dashboard" element={<ProtectedRoute><MyDashboardPage /></ProtectedRoute>} />
      <Route path="/admin" element={<SuperAdminRoute><AdminPage /></SuperAdminRoute>} />
      <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
      <Route path="/items" element={<ProtectedRoute><ItemsPage /></ProtectedRoute>} />
      <Route path="/drops" element={<ProtectedRoute><DropsPage /></ProtectedRoute>} />
      <Route path="/drops/new" element={<AdminRoute><DropFormPage /></AdminRoute>} />
      <Route path="/drops/:id/edit" element={<AdminRoute><DropFormPage /></AdminRoute>} />
      <Route path="/drops/:id" element={<ProtectedRoute><DropDetailPage /></ProtectedRoute>} />
      <Route path="/payments" element={<AdminRoute><PaymentsPage /></AdminRoute>} />
      <Route path="/audit-logs" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
      <Route path="/donation" element={<ProtectedRoute><DonationPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
