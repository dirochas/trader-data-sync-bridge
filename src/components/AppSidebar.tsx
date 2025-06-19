
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Users,
  Activity,
  TrendingUp,
  Archive,
  Monitor,
  ServerCog,
  ListChecks,
  LayoutDashboard,
} from "lucide-react";

export function AppSidebar() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Trading",
      icon: TrendingUp,
      items: [
        { title: "Account Monitor", url: "/accounts", icon: Monitor },
        ...(profile?.role && ['admin', 'manager'].includes(profile.role) ? [
          { title: "Accounts Management", url: "/accounts-management", icon: Archive }
        ] : []),
      ]
    },
    {
      title: "Management",
      icon: LayoutDashboard,
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Simulations", url: "/simulations", icon: Activity },
        { title: "Experts", url: "/experts", icon: Settings },
        { title: "VPS", url: "/vps", icon: ServerCog },
      ]
    },
    {
      title: "Admin",
      icon: Users,
      items: [
        { title: "Commands", url: "/commands", icon: ListChecks },
        { title: "Users", url: "/users", icon: Users },
      ]
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  return (
    <Sidebar>
      <SidebarContent>
        {menuItems.map((menu, index) => (
          <SidebarGroup key={index}>
            {menu.title && menu.items ? (
              <>
                <SidebarGroupLabel className="flex items-center space-x-2">
                  <menu.icon className="h-4 w-4" />
                  <span>{menu.title}</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menu.items.map((item, i) => (
                      <SidebarMenuItem key={i}>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.url)}
                          isActive={location.pathname === item.url}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            ) : (
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(menu.url!)}
                      isActive={location.pathname === menu.url}
                    >
                      <menu.icon className="mr-2 h-4 w-4" />
                      <span>{menu.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
