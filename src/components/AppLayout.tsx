
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from './ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-linear">
          {/* Header */}
          <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-4 shadow-sm">
            <SidebarTrigger className="bg-card border border-border hover:bg-accent p-2 rounded-lg transition-colors" />
            <div className="flex-1 min-w-0">
              <h1 className="text-heading text-lg md:text-xl font-bold text-foreground">
                TRADERLAB Trading System
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4">
                <div className="text-caption text-muted-foreground font-medium">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
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
