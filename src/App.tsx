
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "./components/AppLayout";
import AccountMonitor from "./pages/AccountMonitor";
import AccountDetails from "./pages/AccountDetails";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ExpertManagement from "./pages/ExpertManagement";
import SimulationManagement from "./pages/SimulationManagement";
import VPSManagement from "./pages/VPSManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<AccountMonitor />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/experts" element={<ExpertManagement />} />
              <Route path="/simulations" element={<SimulationManagement />} />
              <Route path="/vps" element={<VPSManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/account/:accountId" element={<AccountDetails />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
