import { Link, useLocation } from "wouter";
import { BarChart2, Home, Package, Receipt, Settings } from "lucide-react";

export default function NavBar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Billing", icon: Home },
    { href: "/history", label: "History", icon: Receipt },
    { href: "/sales", label: "Sales", icon: BarChart2 },
    { href: "/inventory", label: "Stock", icon: Package },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop top nav */}
      <div className="fixed right-3 top-2 z-50 hidden max-w-[calc(100vw-22rem)] rounded-full border border-white/20 bg-white/95 px-1.5 py-1 shadow-lg backdrop-blur md:flex lg:right-4 lg:top-3">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-bold transition-colors lg:px-3 lg:text-sm ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`nav-desktop-${label.toLowerCase()}`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe md:hidden">
        <div className="grid h-16 grid-cols-5 items-center">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
