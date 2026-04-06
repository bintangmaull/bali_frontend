import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, maxWidth = "max-w-6xl", forceLightMode = false, children }) {
  const { darkMode: globalDarkMode } = useTheme();
  const darkMode = forceLightMode ? false : globalDarkMode;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4 pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className={`${
          darkMode 
            ? 'bg-[#0D0F12]/95 border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]' 
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        } rounded-[32px] border backdrop-blur-xl p-5 md:p-8 w-full ${maxWidth} relative transition-all duration-500 animate-in zoom-in-95 fade-in duration-300`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Glow effect for dark mode */}
        {darkMode && (
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[100px] pointer-events-none" />
        )}

        <div className="overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar relative z-10">
          {children}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className={`absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 border ${
            darkMode 
              ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:scale-110' 
              : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200 hover:scale-110'
          } shadow-sm z-[100]`}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>,
    document.body
  );
}
