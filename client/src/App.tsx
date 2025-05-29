import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";

// Pages
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import UploadPage from "@/pages/upload";
import CalculatorPage from "@/pages/calculator";
import HistoryPage from "@/pages/history";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <AppLayout>
            <ProfilePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/upload">
        <ProtectedRoute>
          <AppLayout>
            <UploadPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/calculator">
        <ProtectedRoute>
          <AppLayout>
            <CalculatorPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/history">
        <ProtectedRoute>
          <AppLayout>
            <HistoryPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
