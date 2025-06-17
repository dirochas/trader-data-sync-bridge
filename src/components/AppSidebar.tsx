
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
      className={`${isCollapsed ? 'w-16' : 'w-64'} border-r`}
      collapsible="icon"
      style={{ backgroundColor: '#0E1016', borderColor: '#1F2937' }}
    >
      <div className="p-4 border-b" style={{ backgroundColor: '#0E1016', borderColor: '#1F2937' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
            <img 
              src="/lovable-uploads/39ba8fe9-453c-4813-8fc2-4add8c8536b2.png" 
              alt="TraderLab Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <img 
                src="/lovable-uploads/9a7101c2-5cb9-4ab1-a575-4a699474138e.png" 
                alt="TRADERLAB" 
                className="h-6 object-contain"
              />
              <p className="text-xs text-gray-400 mt-1">Trading System</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="px-3 py-4" style={{ backgroundColor: '#0E1016' }}>
        <SidebarGroup>
          <SidebarGroupLabel className={`${isCollapsed ? 'sr-only' : ''} text-xs text-gray-400 uppercase tracking-wider mb-2`}>
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
                          ? 'bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30' 
                          : 'hover:bg-gray-800 text-gray-300 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive(item.url) ? 'text-sky-400' : 'group-hover:text-sky-400'
                      }`} />
                      {!isCollapsed && (
                        <span className="text-sm font-medium truncate">
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
          <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-3 backdrop-blur-sm ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                <User className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-gray-400">admin@traderlab.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarContent>

      <div className="p-3 border-t" style={{ backgroundColor: '#0E1016', borderColor: '#1F2937' }}>
        <SidebarTrigger className="w-full h-11 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all duration-200 text-gray-300 hover:text-white" />
      </div>
    </Sidebar>
  );
}
