
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
      className={`${isCollapsed ? 'w-16' : 'w-64'} border-r border-sidebar-border/50 bg-sidebar/95 backdrop-blur-xl`} 
      collapsible="icon"
    >
      <div className="p-4 border-b border-sidebar-border/50 bg-sidebar/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="text-heading text-lg tech-gradient-text">Hedge Matrix</h2>
              <p className="text-caption text-muted-foreground/80">Trading System</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={`${isCollapsed ? 'sr-only' : ''} text-caption text-muted-foreground/70 uppercase tracking-wider mb-2`}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
                        isActive(item.url)
                          ? 'sidebar-active font-semibold' 
                          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:translate-x-1'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive(item.url) ? 'text-indigo-400' : 'group-hover:text-indigo-400'
                      }`} />
                      {!isCollapsed && (
                        <span className="text-body font-medium truncate">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile Section */}
        <div className="mt-auto p-3">
          <div className={`tech-card p-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <User className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-sidebar-foreground">Admin User</p>
                  <p className="text-caption text-muted-foreground/70">admin@hedgematrix.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarContent>

      <div className="p-3 border-t border-sidebar-border/50">
        <SidebarTrigger className="w-full h-11 tech-card-hover transition-all duration-200" />
      </div>
    </Sidebar>
  );
}
