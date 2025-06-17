
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import AccountMonitor from './pages/AccountMonitor';
import AccountDetails from './pages/AccountDetails';
import SimulationManagement from './pages/SimulationManagement';
import ExpertManagement from './pages/ExpertManagement';
import VPSManagement from './pages/VPSManagement';
import CommandsManagement from './pages/CommandsManagement';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/accounts" element={
                <ProtectedRoute requiredRoles={['admin', 'manager', 'client_trader']}>
                  <AccountMonitor />
                </ProtectedRoute>
              } />
              
              <Route path="/account/:accountId" element={
                <ProtectedRoute requiredRoles={['admin', 'manager', 'client_trader']}>
                  <AccountDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/simulations" element={
                <ProtectedRoute requiredRoles={['admin', 'manager', 'client_trader']}>
                  <SimulationManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/experts" element={
                <ProtectedRoute requiredRoles={['admin', 'manager', 'client_trader']}>
                  <ExpertManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/vps" element={
                <ProtectedRoute requiredRoles={['admin', 'manager']}>
                  <VPSManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/commands" element={
                <ProtectedRoute requiredRoles={['admin', 'manager']}>
                  <CommandsManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute requiredRoles={['admin', 'manager']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
