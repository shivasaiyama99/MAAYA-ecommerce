import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Administrative credentials are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authService.adminLogin(formData);
      if (response.success && response.data) {
        // Log in with isAdmin = true, isolating token in sessionStorage
        login(response.data.user, response.data.token, true);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(
        err.message || 'Access denied: Invalid administrative credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-stone-900/5">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border-2 border-stone-800 shadow-2xl relative">
        {/* Admin Header Shield */}
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Maya Collections Logo"
            className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-gold-400 shadow-md"
          />
          <span className="text-[11px] font-bold tracking-[0.25em] text-maroon-700 uppercase bg-maroon-50 border border-maroon-200 px-3 py-1 rounded-full">
            Restricted Staff Portal
          </span>
          <h1 className="mt-3 text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Maya Collections Console
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Secure authentication for store management, catalog control, and inventory audits.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                id="admin-login-email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="admin@sareesweb.com"
                className="block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="admin-login-password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••••••"
                className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="admin-login-submit-btn"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 border border-stone-700"
          >
            {loading ? (
              <span>Verifying Administrative Authority...</span>
            ) : (
              <>
                <span>Authenticate Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-stone-200 pt-5 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-maroon-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
