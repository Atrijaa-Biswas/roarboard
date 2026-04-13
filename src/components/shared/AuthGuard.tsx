import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';

export default function AuthGuard({ children }: { children?: React.ReactNode }) {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return (
    <div className="min-h-screen bg-pureBlack flex items-center justify-center font-sans tracking-wide">
        <div className="animate-pulse text-accentBlue font-bold text-sm uppercase">Authenticating...</div>
      </div>
    );
  }

  // Only allow staff bypass
  if (user.role !== 'staff') {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
