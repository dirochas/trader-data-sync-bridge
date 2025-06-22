
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AccountMonitor from "./pages/AccountMonitor";
import AccountDetails from "./pages/AccountDetails";
import Settings from "./pages/Settings";
import SystemDiagnosticsPage from "./pages/SystemDiagnosticsPage";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Unauthorized from "./pages/Unauthorized";
import UserManagement from "./pages/UserManagement";
import VPSManagement from "./pages/VPSManagement";
import GroupsManagement from "./pages/GroupsManagement";
import ExpertManagement from "./pages/ExpertManagement";
import CommandsManagement from "./pages/CommandsManagement";
import SimulationManagement from "./pages/SimulationManagement";
import AccountsManagement from "./pages/AccountsManagement";
import InactiveAccounts from "./pages/InactiveAccounts";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="accounts" element={<ProtectedRoute><AccountMonitor /></ProtectedRoute>} />
                <Route path="account/:accountNumber" element={<ProtectedRoute><AccountDetails /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>} />
                <Route path="diagnostics" element={<ProtectedRoute requiredRole="admin"><SystemDiagnosticsPage /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
                <Route path="vps" element={<ProtectedRoute requiredRole={["admin", "manager"]}><VPSManagement /></ProtectedRoute>} />
                <Route path="groups" element={<ProtectedRoute requiredRole={["admin", "manager"]}><GroupsManagement /></ProtectedRoute>} />
                <Route path="experts" element={<ProtectedRoute requiredRole={["admin", "manager"]}><ExpertManagement /></ProtectedRoute>} />
                <Route path="commands" element={<ProtectedRoute requiredRole={["admin", "manager"]}><CommandsManagement /></ProtectedRoute>} />
                <Route path="simulations" element={<ProtectedRoute requiredRole={["admin", "manager"]}><SimulationManagement /></ProtectedRoute>} />
                <Route path="accounts-management" element={<ProtectedRoute requiredRole={["admin", "manager"]}><AccountsManagement /></ProtectedRoute>} />
                <Route path="inactive-accounts" element={<ProtectedRoute requiredRole={["admin", "manager"]}><InactiveAccounts /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
