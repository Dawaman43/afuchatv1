// ./components/ProtectedRoute.tsx (Updated for profiles.is_admin check)

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client'; 

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin'; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading: isAuthLoading } = useAuth();
  const location = useLocation();

  // --- NEW ROLE STATE MANAGEMENT (Simplified) ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRoleChecking, setIsRoleChecking] = useState(false);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (!user || requiredRole !== 'admin') return; // Only run if admin role is required

      setIsRoleChecking(true);
      
      // 🎯 FIX: Query the profiles table for the boolean 'is_admin' column
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id) // Check for the logged-in user's profile
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setIsAdmin(data.is_admin || false);
      } else {
        setIsAdmin(false); // Default to false on error or no data
        console.error("Failed to fetch admin status:", error);
      }

      setIsRoleChecking(false);
    };

    if (requiredRole === 'admin') {
      fetchAdminStatus();
    } else {
      // For non-admin protected routes, we are authorized by default if logged in.
      setIsAdmin(true); 
    }
    
  }, [user, requiredRole]);


  // 1. Loading State
  if (isAuthLoading || (requiredRole === 'admin' && isRoleChecking)) {
    // Show skeleton if auth is loading OR if we're waiting for admin check result
    return (
      <div className="h-screen w-full flex flex-col p-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // 2. Authentication Failure
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  
  // 3. Role/Authorization Failure
  if (requiredRole === 'admin' && !isAdmin) {
    // User is logged in but profiles.is_admin is false. Redirect to home.
    return <Navigate to="/" replace />; 
  }

  // 4. Success
  return <>{children}</>;
};

export default ProtectedRoute;
