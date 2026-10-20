import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute = ({
  children,
  requireAdminRole = false,
  requireCustomerRole = false,
}) => {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-stone-600">
        <Loader2 className="w-10 h-10 text-maroon-700 animate-spin mb-3" />
        <p className="text-sm font-medium">Verifying security credentials...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    const redirectTarget = requireAdminRole ? '/admin/login' : '/login';
    return <Navigate to={redirectTarget} state={{ from: location }} replace />;
  }

  // Requires admin, but user is customer
  if (requireAdminRole && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl shadow-lg text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
          Administrative Privileges Required
        </h2>
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">
          Your current account (<span className="font-semibold text-stone-800">{user?.email}</span>) does not possess administrative authorization to access this portal.
        </p>
        <div className="flex justify-center gap-4">
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  // Requires customer, but user is admin
  if (requireCustomerRole && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
