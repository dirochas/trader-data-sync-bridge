
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Monitor, 
  Server, 
  Brain,
  Calculator,
  User,
  Terminal,
  Archive,
  LogOut,
  UserCog,
  Folder
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, getRoleDisplayName } from '@/hooks/usePermissions';

const menuItems = [
  { 
    title: 'Dashboard', 
    url: '/dashboard', 
    icon: LayoutDashboard,
    permissionKey: 'canAccessDashboard' as const
  },
  { 
    title: 'Account Monitor', 
    url: '/accounts', 
    icon: Monitor,
    permissionKey: 'canAccessAccountMonitor' as const
  },
  { 
    title: 'Groups Management', 
    url: '/groups', 
    icon: Folder,
    permissionKey: 'canAccessGroupsManagement' as const
  },
  { 
    title: 'Hedge Simulator', 
    url: '/simulations', 
    icon: Calculator,
    permissionKey: 'canAccessHedgeSimulator' as const
  },
  { 
    title: 'Expert Management', 
    url: '/experts', 
    icon: Brain,
    permissionKey: 'canAccessExpertManagement' as const
  },
  { 
    title: 'VPS Management', 
    url: '/vps', 
    icon: Server,
    permissionKey: 'canAccessVPS' as const
  },
  { 
    title: 'Commands', 
    url: '/commands', 
    icon: Terminal,
    permissionKey: 'canAccessCommands' as const
  },
  { 
    title: 'User Management', 
    url: '/users', 
    icon: Users,
    permissionKey: 'canAccessUserManagement' as const
  },
  { 
    title: 'Settings', 
    url: '/settings', 
    icon: Settings,
    permissionKey: 'canAccessSettings' as const
  },
];

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'from-red-400 to-red-500';
    case 'manager':
      return 'from-blue-400 to-blue-500';
    case 'client_trader':
      return 'from-emerald-400 to-teal-400';
    case 'client_investor':
      return 'from-purple-400 to-purple-500';
    default:
      return 'from-gray-400 to-gray-500';
  }
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const permissions = usePermissions();
  const currentPath = location.pathname;
  
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/accounts') {
      return currentPath === '/' || currentPath === '/accounts';
    }
    return currentPath === path;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const userRole = profile?.role || 'client_trader';
  const displayName = getRoleDisplayName(userRole);
  const roleColor = getRoleColor(userRole);

  // Filter menu items based on permissions
  const availableMenuItems = menuItems.filter(item => 
    permissions[item.permissionKey]
  );

  return (
    <Sidebar 
      className={`${isCollapsed ? 'w-[80px]' : 'w-64'} border-r border-sidebar-border`}
      collapsible="icon"
      style={{ backgroundColor: 'rgb(14, 16, 22)' }}
    >
      <div className="px-4 pt-3 pb-3 border-b border-sidebar-border" style={{ backgroundColor: 'rgb(14, 16, 22)' }}>
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
              <p className="text-xs text-sidebar-foreground/60 mt-1">Trading System</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className={`${isCollapsed ? 'px-2' : 'px-3'} py-4`} style={{ backgroundColor: 'rgb(14, 16, 22)' }}>
        <SidebarGroup>
          <SidebarGroupLabel className={`${isCollapsed ? 'sr-only' : ''} text-xs text-sidebar-foreground/60 uppercase tracking-wider mb-2`}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {availableMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group ${
                        isActive(item.url)
                          ? 'bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30' 
                          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:translate-x-1'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive(item.url) ? 'text-sky-400' : 'group-hover:text-sidebar-accent-foreground'
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

        {/* User Profile Section with Dropdown */}
        <div className={`mt-auto ${isCollapsed ? 'p-2' : 'p-3'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={`bg-sidebar-accent/30 border border-sidebar-border rounded-xl ${isCollapsed ? 'p-2' : 'p-3'} backdrop-blur-sm cursor-pointer hover:bg-sidebar-accent/50 transition-colors ${isCollapsed ? 'flex justify-center' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground">{displayName}</p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">{profile?.email || 'user@traderlab.com'}</p>
                      {permissions.isInvestor && (
                        <p className="text-xs text-purple-400 mt-1">View Only Access</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-sidebar border-sidebar-border"
              side={isCollapsed ? "right" : "top"}
            >
              <DropdownMenuLabel className="text-sidebar-foreground">
                Minha Conta
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-sidebar-border" />
              
              <DropdownMenuItem 
                onClick={handleSettings}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-sidebar-border" />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-400 hover:bg-red-900/20 hover:text-red-300 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarContent>

      <div className={`${isCollapsed ? 'p-2' : 'p-3'} border-t border-sidebar-border`} style={{ backgroundColor: 'rgb(14, 16, 22)' }}>
        <SidebarTrigger className="w-full h-11 bg-sidebar-accent/30 border border-sidebar-border rounded-lg hover:bg-sidebar-accent transition-all duration-200 text-sidebar-foreground hover:text-sidebar-accent-foreground" />
      </div>
    </Sidebar>
  );
}

export default AppSidebar;
