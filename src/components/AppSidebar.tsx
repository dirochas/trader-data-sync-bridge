
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Monitor, 
  Settings, 
  Server, 
  Users, 
  BarChart3, 
  Command,
  FileText,
  Bot,
  Activity,
  FolderOpen,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const AppSidebar = () => {
  const permissions = usePermissions();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: LayoutDashboard,
      show: permissions.canAccessDashboard
    },
    { 
      name: 'Account Monitor', 
      href: '/accounts', 
      icon: Monitor,
      show: permissions.canAccessAccountMonitor
    },
    { 
      name: 'Inactive Accounts', 
      href: '/inactive-accounts', 
      icon: Archive,
      show: permissions.canAccessAccountsManagement
    },
    { 
      name: 'Hedge Simulator', 
      href: '/hedge-simulator', 
      icon: BarChart3,
      show: permissions.canAccessHedgeSimulator
    },
    { 
      name: 'VPS Management', 
      href: '/vps', 
      icon: Server,
      show: permissions.canAccessVPS
    },
    { 
      name: 'Groups Management', 
      href: '/groups', 
      icon: FolderOpen,
      show: permissions.canAccessGroupsManagement
    },
    { 
      name: 'Commands', 
      href: '/commands', 
      icon: Command,
      show: permissions.canAccessCommands
    },
    { 
      name: 'User Management', 
      href: '/users', 
      icon: Users,
      show: permissions.canAccessUserManagement
    },
    { 
      name: 'Expert Management', 
      href: '/experts', 
      icon: Bot,
      show: permissions.canAccessExpertManagement
    },
    { 
      name: 'Simulation Management', 
      href: '/simulations', 
      icon: FileText,
      show: permissions.canAccessHedgeSimulator
    },
    { 
      name: 'System Diagnostics', 
      href: '/diagnostics', 
      icon: Activity,
      show: permissions.canAccessSettings
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Settings,
      show: permissions.canAccessSettings
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          TraderLab
        </h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation
          .filter(item => item.show)
          .map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

export default AppSidebar;
