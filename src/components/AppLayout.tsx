
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { getRoleDisplayName } from '@/hooks/usePermissions';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile } = useAuth();

  const getGreeting = () => {
    if (!profile) return 'Bem-vindo';
    
    // Tenta usar o primeiro nome, senão usa o role
    const firstName = profile.first_name?.split(' ')[0];
    const displayName = firstName || getRoleDisplayName(profile.role);
    
    return `Bem-vindo, ${displayName}`;
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-linear">
          {/* Header */}
          <header className="h-[4.3rem] border-b bg-card/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-4 shadow-sm">
            <SidebarTrigger className="bg-card border border-border hover:bg-accent p-2 rounded-lg transition-colors" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col">
                <h1 className="text-heading text-lg md:text-xl font-bold text-foreground">
                  {getGreeting()}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hoje é {getCurrentDate()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
