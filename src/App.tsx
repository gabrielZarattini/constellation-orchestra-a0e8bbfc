import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import { DashboardLayout } from "./components/dashboard/DashboardLayout.tsx";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const DashboardHome = lazy(() => import("./pages/DashboardHome.tsx"));
const ConstellationPage = lazy(() => import("./pages/ConstellationPage.tsx"));
const VideoEditorPage = lazy(() => import("./pages/VideoEditorPage.tsx"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage.tsx"));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage.tsx"));
const CampaignWizard = lazy(() => import("./pages/CampaignWizard.tsx"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail.tsx"));
const SocialAccountsPage = lazy(() => import("./pages/SocialAccountsPage.tsx"));
const SocialCallback = lazy(() => import("./pages/SocialCallback.tsx"));
const ContentLibraryPage = lazy(() => import("./pages/ContentLibraryPage.tsx"));
const CalendarPage = lazy(() => import("./pages/CalendarPage.tsx"));
const BlogEditorPage = lazy(() => import("./pages/BlogEditorPage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
                <Route path="content/video-editor/:id" element={<VideoEditorPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="social" element={<SocialAccountsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="blog" element={<BlogEditorPage />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>
              <Route path="/social/callback" element={<SocialCallback />} />
              <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
