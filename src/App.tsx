import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatRoom from "./pages/ChatRoom";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PostDetail from "./pages/PostDetail";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// 🔁 Redirect component for old /profile/:userId URLs
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
            {/* 🏠 Main routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/chat/:chatId" element={<ChatRoom />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/post/:postId" element={<PostDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* 🔁 Redirect old /profile/:userId -> /:userId */}
            <Route path="/profile/:userId" element={<ProfileRedirect />} />

            {/* 👤 Clean username-based route (placed last) */}
            <Route path="/:userId" element={<Profile />} />

            {/* 🚫 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
