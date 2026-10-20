import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export const WhatsAppFloatingButton = ({
  phoneNumber = '919701607651',
  displayNumber = '97016 07651',
  message = 'Hello Maya Collections, I would like to inquire about your sarees and jewellery.',
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(true);

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 group">
      {/* Tooltip Popup on Desktop */}
      {tooltipVisible && (
        <div className="hidden sm:flex items-center gap-2 bg-stone-900/95 backdrop-blur text-white px-3.5 py-2 rounded-xl shadow-xl border border-stone-800 text-xs font-medium animate-in fade-in slide-in-from-right-4 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Need help? Chat with Maya Collections on WhatsApp</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTooltipVisible(false);
            }}
            className="text-stone-400 hover:text-white p-0.5"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat on WhatsApp with Maya Collections at ${displayNumber}`}
        className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full shadow-2xl hover:shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/80"
      >
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />

        {/* WhatsApp Icon */}
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          stroke="currentColor"
          strokeWidth="0"
          fill="currentColor"
          className="relative z-10"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.33C9.33 7.33 9.03 7.41 8.77 7.69C8.51 7.97 7.79 8.64 7.79 10.03C7.79 11.41 8.8 12.75 8.94 12.94C9.08 13.13 10.9 15.93 13.68 17.13C14.34 17.42 14.86 17.59 15.26 17.72C15.93 17.93 16.54 17.9 17.02 17.83C17.56 17.75 18.68 17.15 18.91 16.5C19.14 15.85 19.14 15.3 19.07 15.18C19 15.06 18.84 15 18.55 14.85C18.27 14.71 16.89 14.03 16.64 13.94C16.38 13.85 16.2 13.8 16.02 14.08C15.83 14.36 15.31 14.96 15.15 15.15C15 15.34 14.84 15.36 14.56 15.22C14.28 15.08 13.38 14.78 12.31 13.83C11.48 13.09 10.92 12.18 10.76 11.9C10.6 11.62 10.74 11.47 10.88 11.33C11.01 11.2 11.17 10.99 11.31 10.83C11.45 10.67 11.5 10.56 11.59 10.37C11.68 10.18 11.64 10.02 11.57 9.88C11.5 9.74 10.94 8.37 10.71 7.82C10.49 7.28 10.26 7.36 10.09 7.35C9.93 7.34 9.74 7.33 9.53 7.33Z" />
        </svg>

        {/* Small badge */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full border border-white" />
      </a>
    </div>
  );
};

export default WhatsAppFloatingButton;
