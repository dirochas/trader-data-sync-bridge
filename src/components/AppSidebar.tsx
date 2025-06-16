
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Monitor, 
  Server, 
  Brain,
  Calculator,
  User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Account Monitor', url: '/', icon: Monitor },
  { title: 'Hedge Simulator', url: '/simulations', icon: Calculator },
  { title: 'User Management', url: '/users', icon: Users },
  { title: 'Expert Management', url: '/experts', icon: Brain },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath === path;
  };

  return (
    <Sidebar 
      className={`${isCollapsed ? 'w-16' : 'w-64'} border-r bg-sidebar backdrop-blur-sm`} 
      collapsible="icon"
    >
      <div className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 glow-blue">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-lg truncate bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">Hedge Matrix</h2>
              <p className="text-xs text-muted-foreground/80 truncate">Trading System</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={`${isCollapsed ? 'sr-only' : ''} text-muted-foreground/60 uppercase tracking-wider text-xs`}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] ${
                        isActive(item.url)
                          ? 'bg-gradient-to-r from-primary/20 to-cyan-400/20 text-primary font-semibold border-r-2 border-primary glow-blue backdrop-blur-sm' 
                          : 'hover:bg-sidebar-accent/30 text-sidebar-foreground/80 hover:text-sidebar-foreground transition-all duration-200 hover:translate-x-1'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.url) ? 'text-primary' : ''}`} />
                      {!isCollapsed && <span className="font-medium truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile Section */}
        <div className="mt-auto p-2">
          <div className={`flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/30 backdrop-blur-sm tech-border ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 glow-cyan">
              <User className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground/70 truncate">admin@hedgematrix.com</p>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>

      <div className="p-2 border-t border-sidebar-border/50">
        <SidebarTrigger className="w-full min-h-[44px] hover:bg-sidebar-accent/30 transition-all duration-200" />
      </div>
    </Sidebar>
  );
}
