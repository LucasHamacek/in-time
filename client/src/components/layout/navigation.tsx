import { Home, Camera, Calculator, History, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
  { id: "upload", label: "Cupom", icon: Camera, path: "/upload" },
  { id: "calculator", label: "Calculadora", icon: Calculator, path: "/calculator" },
  { id: "history", label: "Histórico", icon: History, path: "/history" },
  { id: "profile", label: "Perfil", icon: User, path: "/profile" },
];

export function Navigation() {
  const { userProfile, logout } = useAuth();
  const [location, setLocation] = useLocation();

  return (
    <nav className="hidden md:flex space-x-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.path;
        
        return (
          <button
            key={item.id}
            onClick={() => setLocation(item.path)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              isActive
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
      
      <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-slate-200">
        <span className="text-sm text-slate-600">{userProfile?.email}</span>
        <button
          onClick={logout}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
