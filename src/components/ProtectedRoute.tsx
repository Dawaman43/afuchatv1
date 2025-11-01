// ./components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Assuming this path
import { Skeleton } from '@/components/ui/skeleton'; // Reusing your Skeleton component

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Optional: check for a specific role (e.g., 'admin')
  requiredRole?: 'admin'; 
}

/**
 * A wrapper component for routes that require authentication.
 * * It checks for:
 * 1. Auth Loading state (show spinner/skeleton).
 * 2. Authentication status (redirect to /auth if not logged in).
 * 3. Required Role (redirect to / if role is insufficient).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  // Assuming useAuth returns { user: User | null, isLoading: boolean, isAdmin: boolean }
  // We'll add 'isLoading' and 'isAdmin' to your AuthContext structure.
  // For now, we'll assume we can check if the user is null and if loading is finished.
  const { user, loading: isAuthLoading } = useAuth();

  // --- 1. Authentication Check ---
  
  // If the AuthContext is still loading the session, show a full-page loading screen
  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex flex-col p-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If loading is finished and no user is found, redirect to the login page
  if (!user) {
    // Navigate to /auth and pass the current location to redirect back later
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  
  // --- 2. Role-Based Access Control (RBAC) Check ---

  if (requiredRole === 'admin') {
    // NOTE: This assumes you can fetch and store the 'isAdmin' state in your AuthContext.
    // If isAdmin is not available in useAuth, you will need to add it there.
    // For this demonstration, we'll assume you have access to the logic from the Profile component.
    
    // Since we don't have the full AuthContext code, we'll use a placeholder logic.
    // In a real app, you would fetch the user's role on login and store it.
    const hasRequiredRole = (user as any).role === 'admin'; // Placeholder!

    if (!(user as any).isAdmin) { // Placeholder: Assume useAuth provides an isAdmin boolean
        // User is logged in but does not have the required role. Redirect to home.
        return <Navigate to="/" replace />;
    }
  }

  // If authenticated (and has the required role), render the children (the protected page)
  return <>{children}</>;
};

export default ProtectedRoute;
