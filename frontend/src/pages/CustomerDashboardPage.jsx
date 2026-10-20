import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Calendar, ShieldCheck, LogOut, ShoppingBag, Sparkles, Heart } from 'lucide-react';

export const CustomerDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent Member';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-maroon-800 via-maroon-700 to-maroon-900 rounded-2xl p-8 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-gold-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customer Sanctuary</span>
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">
              Namaste, {user?.name || 'Valued Customer'}
            </h1>
            <p className="text-stone-200 text-xs sm:text-sm max-w-xl">
              Welcome to your personal Maya Collections account. Track your handloom saree & jewellery orders, manage preferences, and explore bridal collections.
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider border border-white/30 backdrop-blur transition-all disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 text-gold-300" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-maroon-700 to-maroon-500 text-gold-300 flex items-center justify-center font-serif text-2xl font-bold border border-gold-400/40 shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">{user?.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-700 capitalize bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {user?.role || 'customer'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4 space-y-3 text-xs">
            <div className="flex items-center gap-3 text-stone-600">
              <Mail className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="font-mono text-stone-800 truncate">{user?.email}</span>
            </div>

            <div className="flex items-center gap-3 text-stone-600">
              <Phone className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{user?.phone || 'No phone number provided'}</span>
            </div>

            <div className="flex items-center gap-3 text-stone-600">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Member since {formattedDate}</span>
            </div>

            <div className="flex items-center gap-3 text-stone-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified Session via Signed JWT</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Orders Preview */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">
              Your Orders & Drapes
            </h3>
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center text-stone-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-stone-700">No orders placed yet</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Your authenticated account is ready! Browse our silk collection to order your first heritage drape.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-wider transition-colors shadow-sm mt-2"
              >
                <span>Browse Sarees</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-maroon-100 text-maroon-800 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900">Saved Wishlist</h4>
                <p className="text-stone-500 mt-0.5">0 handcrafted pieces saved</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold-100 text-gold-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900">Bridal Consultation</h4>
                <p className="text-stone-500 mt-0.5">Complimentary drape styling</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
