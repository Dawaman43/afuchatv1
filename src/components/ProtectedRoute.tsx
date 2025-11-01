// ./components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client'; // Assuming you can import supabase here

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin'; 
}

/**
 * A wrapper component for routes that require authentication and optional role-based access.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading: isAuthLoading } = useAuth();
  const location = useLocation();

  // --- NEW ROLE STATE MANAGEMENT ---
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [isRoleChecking, setIsRoleChecking] = useState(false);

  // 1. Fetch Role when a role is required and we have a user
  useEffect(() => {
    const fetchRole = async () => {
      if (!user || !requiredRole) return;

      setIsRoleChecking(true);
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', requiredRole) // Only query for the required role
        .limit(1)
        .maybeSingle();

      setUserRole(data ? (data.role as 'admin') : null);
      setIsRoleChecking(false);
    };

    if (user && requiredRole) {
      fetchRole();
    } else if (!requiredRole) {
      // No role check needed for standard protected pages
      setUserRole('user'); // Treat them as a standard user
    } else {
      setUserRole(null);
    }
  }, [user, requiredRole]);


  // --- 1. Authentication and Role Loading State ---

  // Show skeleton if auth is loading OR if we're waiting for a role check
  if (isAuthLoading || (requiredRole && isRoleChecking)) {
    return (
      <div className="h-screen w-full flex flex-col p-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // --- 2. Authentication Failure ---
  
  if (!user) {
    // Redirect to /auth and save the target path in state
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  
  // --- 3. Role-Based Access Control (RBAC) Failure ---

  // Check if a role is required AND the user's role does not match the requirement
  // This covers the scenario where userRole is null (not found in DB) or the wrong role.
  if (requiredRole && userRole !== requiredRole) {
    // User is logged in but does not have access.
    return <Navigate to="/" replace />; 
  }

  // --- 4. Success ---
  
  // If authenticated and authorized, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
