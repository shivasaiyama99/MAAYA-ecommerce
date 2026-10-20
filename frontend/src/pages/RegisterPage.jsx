import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { Sparkles, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required for order confirmations';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 10) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(formData);
      const user = response?.data?.user || response?.user;
      const token = response?.data?.token || response?.token;

      if (response?.success && user && token) {
        login(user, token, false);
        navigate(from, { replace: true });
      } else {
        setError('Registration succeeded but invalid customer session payload received.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-stone-200 shadow-xl relative overflow-hidden">
        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold-300/20 to-maroon-700/10 rounded-bl-full pointer-events-none" />

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maroon-50 border border-maroon-100 text-maroon-800 text-xs font-semibold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Customer Membership</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Create Your Account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600">
            Join Maya Collections for exclusive artisanal weaves, royal bridal silks, and bespoke jewellery.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                id="register-name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Priyanka Sharma"
                className={`block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border ${
                  fieldErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
              />
            </div>
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                id="register-email"
                value={formData.email}
                onChange={handleChange}
                placeholder="priyanka@example.com"
                className={`block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border ${
                  fieldErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone (Required) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                name="phone"
                id="register-phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={`block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border ${
                  fieldErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
              />
            </div>
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="register-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className={`block w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border ${
                  fieldErrors.password ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="register-confirm-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={`block w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border ${
                  fieldErrors.confirmPassword ? 'border-rose-400 bg-rose-50/30' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="register-submit-btn"
            disabled={loading}
            className="w-full mt-6 py-3 px-4 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Creating your account...</span>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-stone-200 pt-6 text-center text-xs text-stone-600">
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            className="font-semibold text-maroon-700 hover:text-maroon-900 underline"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
