import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  List, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pedidos/novo", label: "Novo Pedido", icon: FileText },
  { href: "/pedidos", label: "Histórico de Pedidos", icon: List },
  { href: "/clientes", label: "Cadastro de Clientes", icon: Users },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function SidebarContent() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedLogo = localStorage.getItem("epbov_logo");
    if (storedLogo) {
      setLogoUrl(storedLogo);
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="p-6 flex items-center justify-center border-b border-sidebar-border min-h-[88px]">
        {logoUrl ? (
          <img src={logoUrl} alt="Company Logo" className="max-h-12 max-w-full object-contain" />
        ) : (
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Leaf className="h-6 w-6" />
            <span>EP BOV</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Usuário</span>
            <span className="text-xs text-muted-foreground">vendedor@epbov.com</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <Leaf className="h-5 w-5" />
          <span>EP BOV</span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
