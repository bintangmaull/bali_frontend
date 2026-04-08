// components/Header.js - V2.5 Fresh Build
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Sun, Moon, Menu, X, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const router = useRouter();
  const { darkMode, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    router.push('/');
  };

  const isActive = (path) => router.pathname === path;
  const isMapPage = router.pathname === '/peta';

  return (
    <header className={`fixed top-0 left-0 w-full z-[3000] shadow-sm transition-all duration-300 ${
      isMapPage ? 'border-none' : 'border-b shadow-md'
    } ${
      darkMode 
        ? (isMapPage ? 'bg-transparent shadow-none' : 'bg-[#0D0F12]/80 backdrop-blur-md border-white/5 shadow-2xl') 
        : 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm'
    }`}>
      <div className={`${isMapPage ? 'flex w-full' : 'max-w-screen-2xl mx-auto flex'} items-center justify-between py-0 h-[64px]`}>
        {/* Left Area: Sidebar Branding Integration */}
        <div className={`flex items-center h-full transition-all duration-500 overflow-hidden ${
          isMapPage 
            ? `w-[280px] px-4 border-r border-b ${darkMode ? 'bg-[#0D0F12]/95 border-white/5' : 'bg-white border-slate-200'}` 
            : 'px-6'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 h-6 shrink-0">
              <img src="/logoitb.png" alt="ITB" className="h-full w-auto" />
              <img src="/logobali.png" alt="Bali" className="h-full w-auto" />
            </div>
            <Link href="/" className="flex items-center leading-tight min-w-0">
              <h1 className={`${isMapPage ? 'text-[10px]' : 'text-lg'} tracking-tighter flex items-baseline gap-2 font-black whitespace-nowrap`}>
                <span className={`uppercase tracking-widest ${isMapPage ? 'text-[8px]' : ''} ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  CATALYST
                </span>
                <span className={`text-[#1E5C9A] font-bold opacity-40 mx-0.5 ${isMapPage ? 'text-[10px]' : 'text-sm'}`}>:</span>
                <span className={`text-blue-500 uppercase tracking-widest ${isMapPage ? 'text-[6px] antialiased' : 'text-[10px]'}`}>
                  Catastrophic Average Annual Loss Analyst
                </span>
              </h1>
            </Link>
          </div>
        </div>

        {/* Center & Right Area */}
        <div className={`flex flex-1 items-center justify-between h-full px-6 transition-all duration-300 ${
          isMapPage 
            ? (darkMode ? 'bg-[#0D0F12]/80 backdrop-blur-md border-b border-white/5' : 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm')
            : ''
        }`}>
          {/* Navigation */}
          <nav className="hidden md:flex items-center justify-center space-x-12 relative h-full">
            {[
              { path: '/', label: 'HOME' },
              { path: '/peta', label: 'OUR PRODUCT' },
              { path: '/about', label: 'ABOUT US' }
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`relative py-1 text-[10px] font-black tracking-widest transition-all duration-300 h-full flex items-center ${
                  isActive(item.path)
                    ? (darkMode ? 'text-white' : 'text-[#1E5C9A]')
                    : (darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-[#1E5C9A]')
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[4px] bg-blue-500 rounded-t-full shadow-[0_-2px_6px_rgba(59,130,246,0.3)]" />
                )}
              </button>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-300 ${
                darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-[#1E5C9A] hover:bg-slate-100'
              }`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="h-6 w-px bg-white/5 hidden md:block" />

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest hidden lg:block ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                  {currentUser.nama}
                </span>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-xl transition-all ${
                    darkMode ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Keluar"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-black tracking-widest uppercase hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:scale-105 active:scale-95"
              >
                Masuk
              </button>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${darkMode ? 'text-white hover:bg-white/5' : 'text-slate-900 hover:bg-slate-100'}`}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className={`md:hidden w-full border-t animate-in slide-in-from-top-4 duration-300 ${
          darkMode ? 'bg-[#0D0F12] border-white/5' : 'bg-white border-slate-100 shadow-xl'
        }`}>
          <div className="flex flex-col px-6 py-4 space-y-2">
            {[
              { path: '/', label: 'HOME' },
              { path: '/peta', label: 'OUR PRODUCT' },
              { path: '/about', label: 'ABOUT US' }
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => { router.push(item.path); setIsMobileMenuOpen(false); }}
                className={`px-4 py-4 rounded-xl transition text-left text-xs font-black tracking-widest ${
                  isActive(item.path) 
                    ? 'bg-blue-600 text-white' 
                    : darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {!currentUser && (
               <button
                  onClick={() => { router.push('/login'); setIsMobileMenuOpen(false); }}
                  className="w-full mt-4 py-4 rounded-xl bg-blue-600 text-white text-xs font-black tracking-widest tracking-widest"
               >
                 MASUK
               </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
