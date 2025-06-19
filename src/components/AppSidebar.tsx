
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  Menu,
} from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sheet>) {
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
    <Sheet {...props}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="z-50 w-64 p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Explore as funcionalidades do sistema
          </SheetDescription>
        </SheetHeader>
        
        <div className="px-4 pb-4">
          <nav className="space-y-4">
            {menuItems.map((menu, index) => (
              <div key={index}>
                {menu.title && menu.items ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <menu.icon className="h-4 w-4" />
                      <span>{menu.title}</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {menu.items.map((item, i) => (
                        <Button
                          key={i}
                          variant={location.pathname === item.url ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => handleNavigation(item.url)}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant={location.pathname === menu.url ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleNavigation(menu.url!)}
                  >
                    <menu.icon className="mr-2 h-4 w-4" />
                    {menu.title}
                  </Button>
                )}
              </div>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
