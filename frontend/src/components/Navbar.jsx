import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles, User, Search, ShieldCheck, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-stone-200">
      {/* Top Banner */}
      <div className="bg-maroon-700 text-gold-200 text-xs py-1.5 px-4 text-center tracking-widest font-medium uppercase flex flex-wrap items-center justify-center gap-3">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>Handcrafted Pure Silk & Royal Jewellery</span>
        </span>
        <span className="hidden sm:inline text-gold-400">•</span>
        <a
          href="https://wa.me/919701607651?text=Hello%20Maya%20Collections,%20I%20would%20like%20to%20inquire%20about%20your%20sarees%20and%20jewellery."
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white underline font-semibold flex items-center gap-1"
        >
          <span>WhatsApp: +91 97016 07651</span>
        </a>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Maya Collections Logo"
              className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-gold-400/80 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-serif text-2xl font-bold tracking-wider text-maroon-800">
                MAYA
              </span>
              <span className="block text-[10px] tracking-[0.25em] text-gold-700 uppercase -mt-1 font-semibold">
                Collections • Sarees & Jewellery
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold uppercase tracking-wider text-stone-700">
            <Link to="/" className="hover:text-maroon-700 transition-colors">
              Home
            </Link>
            <Link to="/shop" className="hover:text-maroon-700 transition-colors">
              All Sarees
            </Link>
            <Link to="/shop?category=Kanjivaram" className="hover:text-maroon-700 transition-colors">
              Kanjeevaram
            </Link>
            <Link to="/shop?category=Banarasi" className="hover:text-maroon-700 transition-colors">
              Banarasi
            </Link>
            <Link to="/shop?category=Organza" className="hover:text-maroon-700 transition-colors">
              Organza & Tissue
            </Link>
            <Link to="/shop?category=Chanderi" className="hover:text-maroon-700 transition-colors">
              Chanderi
            </Link>
          </nav>

          {/* Action Icons & Authentication Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              to="/shop"
              id="nav-search-link"
              className="p-2 text-stone-600 hover:text-maroon-600 hover:bg-stone-100 rounded-full transition-colors"
              aria-label="Search sarees"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              id="nav-cart-btn"
              className="relative p-2 text-stone-700 hover:text-maroon-700 hover:bg-stone-100 rounded-full transition-colors"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-maroon-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Authentication Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  id="user-profile-menu-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    isAdmin
                      ? 'bg-stone-900 border-gold-400 text-gold-300 shadow-sm'
                      : 'bg-maroon-50 border-maroon-200 text-maroon-900 hover:bg-maroon-100'
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-gold-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-maroon-700 text-gold-200 flex items-center justify-center text-[10px] font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">
                    {isAdmin ? 'Admin' : user?.name?.split(' ')[0]}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="font-semibold text-stone-900 truncate">{user?.name}</p>
                      <p className="text-stone-500 text-[11px] truncate">{user?.email}</p>
                    </div>

                    {isAdmin ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gold-600" />
                        <span>Admin Console</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/my-orders"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <Package className="w-4 h-4 text-maroon-700" />
                          <span>My Orders & Drapes</span>
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-maroon-700" />
                          <span>Account Settings</span>
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left border-t border-stone-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  id="nav-login-link"
                  className="px-3 py-1.5 rounded-md text-stone-700 hover:text-maroon-700 font-semibold text-xs tracking-wider transition-colors uppercase"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  id="nav-register-link"
                  className="px-3.5 py-1.5 rounded-md bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs tracking-wider transition-all shadow-sm uppercase"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
