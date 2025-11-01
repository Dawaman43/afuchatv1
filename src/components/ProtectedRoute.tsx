// ./components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client'; 

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

  // --- NEW ROLE STATE MANAGEMENT: Now stores an array of roles ---
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isRoleChecking, setIsRoleChecking] = useState(false);

  // 1. Fetch ALL roles for the user
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return; // Should be handled by isAuthLoading check, but safety first

      setIsRoleChecking(true);
      
      // 🎯 FIX: Fetch ALL roles for the user
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id); // No longer filtering by requiredRole here

      // Extract roles into an array of strings, defaulting to empty array
      const roles = data ? data.map(row => row.role) : [];
      setUserRoles(roles);
      setIsRoleChecking(false);
    };

    if (user && requiredRole) {
      fetchRole();
    } else if (!requiredRole) {
      // If no role check is required, we are instantly done
      setIsRoleChecking(false);
    }
    
  }, [user, requiredRole]);


  // --- 1. Authentication and Role Loading State ---

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
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  
  // --- 3. Role-Based Access Control (RBAC) Failure ---

  if (requiredRole) {
      // 🎯 FIX: Check if the userRoles array includes the required role string
      const hasRequiredRole = userRoles.includes(requiredRole);
      
      if (!hasRequiredRole) {
        // User is logged in but does not have access. Redirect to home.
        return <Navigate to="/" replace />; 
      }
  }

  // --- 4. Success ---
  
  return <>{children}</>;
};

export default ProtectedRoute;
