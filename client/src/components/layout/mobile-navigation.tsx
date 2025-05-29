import { Home, Camera, Calculator, History, User } from "lucide-react";
import { useLocation } from "wouter";

const navigationItems = [
  { id: "dashboard", label: "Home", icon: Home, path: "/dashboard" },
  { id: "upload", label: "Cupom", icon: Camera, path: "/upload" },
  { id: "calculator", label: "Calc", icon: Calculator, path: "/calculator" },
  { id: "history", label: "Histórico", icon: History, path: "/history" },
  { id: "profile", label: "Perfil", icon: User, path: "/profile" },
];

export function MobileNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="md:hidden bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
