import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Sparkles,
  HeartHandshake,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';

export const Footer = () => {
  const whatsappUrl =
    'https://wa.me/919701607651?text=Hello%20Maya%20Collections,%20I%20would%20like%20to%20inquire%20about%20your%20sarees%20and%20jewellery.';

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      {/* Trust Badges */}
      <div className="border-b border-stone-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-full bg-stone-800 text-gold-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-stone-100 text-sm">Silk Mark Certified</h4>
              <p className="text-xs text-stone-400 mt-1">100% Genuine Handloom Silks</p>
            </div>

            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-full bg-stone-800 text-gold-400 flex items-center justify-center mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-stone-100 text-sm">Pan-India Express Delivery</h4>
              <p className="text-xs text-stone-400 mt-1">Carefully packaged & insured</p>
            </div>

            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-full bg-stone-800 text-gold-400 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-stone-100 text-sm">100% Handloom Guarantee</h4>
              <p className="text-xs text-stone-400 mt-1">Authentic artisanal craftsmanship</p>
            </div>

            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-full bg-stone-800 text-gold-400 flex items-center justify-center mb-3">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-stone-100 text-sm">Handcrafted Jewellery & Sarees</h4>
              <p className="text-xs text-stone-400 mt-1">Supporting traditional artisans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Contact Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Maya Collections Logo"
                className="w-12 h-12 rounded-full object-cover border-2 border-gold-400 shadow"
              />
              <div>
                <span className="font-serif text-xl font-bold tracking-wider text-gold-300 block">
                  MAYA COLLECTIONS
                </span>
                <span className="text-[10px] tracking-[0.2em] text-gold-400/80 uppercase font-semibold">
                  Sarees & Jewellery
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Curating India's finest handloom silks and royal bridal jewellery. Each saree and ornament reflects heritage craftsmanship and pure luxury.
            </p>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold tracking-wider transition-all shadow-md hover:shadow-[#25D366]/30"
              >
                <span>Chat on WhatsApp (97016 07651)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Saree & Jewellery Categories */}
          <div>
            <h5 className="text-xs font-bold text-stone-100 tracking-widest uppercase mb-4">
              Weaves & Collections
            </h5>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/shop?category=Kanjivaram" className="hover:text-gold-300">Pure Kanjeevaram Silk</Link></li>
              <li><Link to="/shop?category=Banarasi" className="hover:text-gold-300">Banarasi Katan & Brocade</Link></li>
              <li><Link to="/shop?category=Chanderi" className="hover:text-gold-300">Chanderi & Cotton Silk</Link></li>
              <li><Link to="/shop?category=Organza" className="hover:text-gold-300">Sheer Organza & Tissue</Link></li>
              <li><Link to="/shop" className="hover:text-gold-300">Royal Jewellery & Ornaments</Link></li>
              <li><Link to="/shop" className="hover:text-gold-300">All Handcrafted Collections</Link></li>
            </ul>
          </div>

          {/* Store Address & Contact */}
          <div>
            <h5 className="text-xs font-bold text-stone-100 tracking-widest uppercase mb-4">
              Visit Atelier & Contact
            </h5>
            <ul className="space-y-3 text-xs text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>
                  H.no: 4-6-158/31A, Durga Nagar, Nacharam, Rangareddy. Pincode 500076
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <a
                  href="tel:+919701607651"
                  className="hover:text-gold-300 font-medium"
                >
                  +91 97016 07651
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <a
                  href="mailto:komakulakiranmai@gmail.com"
                  className="hover:text-gold-300 font-medium break-all"
                >
                  komakulakiranmai@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Customer & Staff Access */}
          <div>
            <h5 className="text-xs font-bold text-stone-100 tracking-widest uppercase mb-4">
              Customer Sanctuary
            </h5>
            <ul className="space-y-2 text-xs text-stone-400 mb-6">
              <li><Link to="/my-orders" className="hover:text-gold-300">Track My Orders</Link></li>
              <li><Link to="/cart" className="hover:text-gold-300">View Shopping Bag</Link></li>
              <li><Link to="/dashboard" className="hover:text-gold-300">Customer Account</Link></li>
            </ul>

            <h5 className="text-xs font-bold text-stone-100 tracking-widest uppercase mb-2">
              Atelier Portal
            </h5>
            <Link
              to="/admin/login"
              className="inline-block text-xs bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded border border-stone-700 text-gold-300 font-semibold transition-colors"
            >
              Staff / Admin Portal
            </Link>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-6 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-4">
          <p>
            &copy; {new Date().getFullYear()} Maya Collections (Sarees & Jewellery). All rights reserved.
          </p>
          <p className="text-[11px] text-stone-600">
            Nacharam, Rangareddy, Hyderabad • Tel: +91 97016 07651
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

