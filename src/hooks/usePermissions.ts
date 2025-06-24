
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface Permissions {
  // Navigation permissions
  canAccessDashboard: boolean;
  canAccessAccountMonitor: boolean;
  canAccessAccountDetails: boolean;
  canAccessAccountsManagement: boolean; // Nova permissão para contas inativas
  canAccessHedgeSimulator: boolean;
  canAccessVPS: boolean;
  canAccessCommands: boolean;
  canAccessUserManagement: boolean;
  canAccessExpertManagement: boolean;
  canAccessSettings: boolean;
  
  // Action permissions
  canEditAccounts: boolean;
  canCloseAllPositions: boolean;
  canViewAccountDetails: boolean;
  canManageVPS: boolean;
  canEditVPSDisplayName: boolean; // Nova permissão específica para VPS
  
  // UI state
  isAdmin: boolean;
  isManager: boolean;
  isTrader: boolean;
  isInvestor: boolean;
  isAdminOrManager: boolean; // Nova propriedade combinada
}

export const usePermissions = (): Permissions => {
  const { profile } = useAuth();
  const userRole: UserRole = profile?.role || 'client_trader';

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isTrader = userRole === 'client_trader';
  const isInvestor = userRole === 'client_investor';

  // Admin and Manager have full access
  const isAdminOrManager = isAdmin || isManager;

  return {
    // Navigation permissions
    canAccessDashboard: true, // Everyone can access dashboard
    canAccessAccountMonitor: true, // Everyone can access account monitor
    canAccessAccountDetails: true, // Everyone can access account details
    canAccessAccountsManagement: true, // TODOS podem acessar contas inativas
    canAccessHedgeSimulator: isAdminOrManager || isTrader, // Investors cannot access
    canAccessVPS: true, // Everyone can access VPS (with different permissions)
    canAccessCommands: isAdminOrManager, // Only admin/manager
    canAccessUserManagement: isAdminOrManager, // Only admin/manager
    canAccessExpertManagement: isAdminOrManager || isTrader, // Investors cannot access
    canAccessSettings: true, // Everyone can access settings
    
    // Action permissions
    canEditAccounts: isAdminOrManager || isTrader, // Investors cannot edit
    canCloseAllPositions: isAdminOrManager || isTrader, // Investors cannot close positions
    canViewAccountDetails: true, // Everyone can view details
    canManageVPS: isAdminOrManager || isTrader, // Investors cannot manage VPS
    canEditVPSDisplayName: isAdminOrManager || isTrader, // Investors cannot edit VPS names
    
    // UI state helpers
    isAdmin,
    isManager,
    isTrader,
    isInvestor,
    isAdminOrManager, // Nova propriedade combinada
  };
};

// Helper function to get user role display name
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'client_trader':
      return 'Trader';
    case 'client_investor':
      return 'Investor';
    default:
      return 'User';
  }
};

// Helper function to get role permissions summary
export const getRolePermissionsSummary = (role: UserRole): string[] => {
  switch (role) {
    case 'admin':
    case 'manager':
      return ['Full Access', 'All Features', 'User Management'];
    case 'client_trader':
      return ['Trading Features', 'Account Management', 'Hedge Simulator'];
    case 'client_investor':
      return ['View Only', 'Account Monitoring', 'Basic Dashboard'];
    default:
      return ['Limited Access'];
  }
};
