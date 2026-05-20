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
      <div className="fixed right-4 top-3 z-50 hidden rounded-full border border-white/20 bg-white/90 px-2 py-1 shadow-lg backdrop-blur md:flex">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`nav-desktop-${label.toLowerCase()}`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
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
