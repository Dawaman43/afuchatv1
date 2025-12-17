import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import { CustomLoader } from '@/components/ui/CustomLoader';

interface CombinedRouteGuardProps {
  children: ReactNode;
}

export const CombinedRouteGuard = ({ children }: CombinedRouteGuardProps) => {
  const location = useLocation();
  const { loading, isBanned, hasCountry, hasDateOfBirth } = useProfileCheck();

  // Show loader while checking
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <CustomLoader size="lg" />
      </div>
    );
  }

  // Banned users go to banned page
  if (isBanned) {
    if (location.pathname === '/banned') {
      return <>{children}</>;
    }
    return <Navigate to="/banned" replace />;
  }

  // Missing country or DOB - redirect to complete profile
  if (!hasCountry || !hasDateOfBirth) {
    if (location.pathname === '/complete-profile') {
      return <>{children}</>;
    }
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};
