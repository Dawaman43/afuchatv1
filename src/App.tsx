import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
// --- NEW IMPORT ---
import ProtectedRoute from "./components/ProtectedRoute"; 
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatRoom from "./pages/ChatRoom";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PostDetail from "./pages/PostDetail";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const ProfileRedirect = () => {
  const { userId } = useParams();
  return <Navigate to={`/${userId}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* 1. 🏠 Public/Index routes (must come first) */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* 2. 🔒 Protected User Routes (Require Auth) */}
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute>
                  <ChatRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            {/* Post detail usually allows non-logged-in viewing, but post creation/actions are protected */}
            <Route path="/post/:postId" element={<PostDetail />} /> 

            {/* 3. 👑 Protected Admin Route (Requires Auth + Admin Role) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 4. 🔁 Redirect old /profile/:userId -> /:userId */}
            <Route path="/profile/:userId" element={<ProfileRedirect />} />

            {/* 5. 👤 Clean username-based route (Catch-all for identifiers) */}
            <Route path="/:userId" element={<Profile />} />

            {/* 6. 🚫 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
