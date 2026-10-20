import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

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
      setError('Please provide both your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(formData);
      const user = response?.data?.user || response?.user;
      const token = response?.data?.token || response?.token;

      if (response?.success && user && token) {
        login(user, token, false);
        navigate(from, { replace: true });
      } else {
        setError('Login succeeded but invalid customer session payload received.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-stone-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold-300/20 to-maroon-700/10 rounded-bl-full pointer-events-none" />

        <div className="text-center">
          <img
            src="/logo.png"
            alt="Maya Collections Logo"
            className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-gold-400 shadow-md"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maroon-50 border border-maroon-100 text-maroon-800 text-xs font-semibold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Customer Sign In</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Welcome to Maya Collections
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600">
            Sign in to access your curated wishlist, tailored saree orders, and express checkout.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                id="login-email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="priyanka@example.com"
                className="block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="login-password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors"
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
            id="login-submit-btn"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-stone-200 pt-6 space-y-3 text-center text-xs text-stone-600">
          <div>
            Don't have an account?{' '}
            <Link
              to="/register"
              state={{ from: location.state?.from }}
              className="font-semibold text-maroon-700 hover:text-maroon-900 underline"
            >
              Register now
            </Link>
          </div>
          <div className="pt-2">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-gold-600" />
              <span>Staff / Administrative Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
