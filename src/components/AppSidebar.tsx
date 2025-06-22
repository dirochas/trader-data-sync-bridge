
import { Home, Settings, Activity, TrendingUp, Users, Server, BarChart3, Upload, Terminal, Calculator, Archive, UserCog, LogOut, Shield, Users2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro durante o logout.",
        variant: "destructive",
      });
    }
  };

  const mainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Account Monitor",
      url: "/accounts",
      icon: Activity,
    },
  ];

  const managementItems = [
    ...(permissions.isAdminOrManager ? [
      {
        title: "VPS Management",
        url: "/vps",
        icon: Server,
      },
      {
        title: "Groups Management",
        url: "/groups",
        icon: Users2,
      },
      {
        title: "Expert Management",
        url: "/experts",
        icon: Upload,
      },
      {
        title: "Commands Management", 
        url: "/commands",
        icon: Terminal,
      },
      {
        title: "Simulation Management",
        url: "/simulations",
        icon: Calculator,
      },
      {
        title: "Accounts Management",
        url: "/accounts-management",
        icon: TrendingUp,
      },
      {
        title: "Inactive Accounts",
        url: "/inactive-accounts", 
        icon: Archive,
      },
    ] : []),
  ];

  const adminItems = [
    ...(permissions.isAdmin ? [
      {
        title: "User Management",
        url: "/users",
        icon: UserCog,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
      {
        title: "System Diagnostics",
        url: "/diagnostics",
        icon: Shield,
      },
    ] : []),
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="font-semibold">Trading Monitor</h1>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {managementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Gerenciamento</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {user && (
          <div className="px-4 py-2 text-xs text-muted-foreground">
            Conectado como: {user.email}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
