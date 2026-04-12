import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import Landing from "./pages/Landing.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import { DashboardLayout } from "./components/dashboard/DashboardLayout.tsx";
import DashboardHome from "./pages/DashboardHome.tsx";
import ConstellationPage from "./pages/ConstellationPage.tsx";
import CampaignsPage from "./pages/CampaignsPage.tsx";
import CampaignWizard from "./pages/CampaignWizard.tsx";
import CampaignDetail from "./pages/CampaignDetail.tsx";
import SocialAccountsPage from "./pages/SocialAccountsPage.tsx";
import SocialCallback from "./pages/SocialCallback.tsx";
import ContentLibraryPage from "./pages/ContentLibraryPage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="constellation" element={<ConstellationPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/new" element={<CampaignWizard />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />
              <Route path="content" element={<ContentLibraryPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="social" element={<SocialAccountsPage />} />
            </Route>
            <Route path="/social/callback" element={<SocialCallback />} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
