// components/Header.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Sun, Moon, Menu, X, LogOut, User } from 'lucide-react';
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

  const navBtnCls = (path) => {
    const active = isActive(path);
    if (active) return `px-3 py-1 rounded-4xl transition text-sm bg-[#1E5C9A] text-white shadow-md`;
    return `px-3 py-1 rounded-4xl transition text-sm ${
      darkMode 
        ? 'text-gray-200 hover:bg-[#1E5C9A] hover:text-white' 
        : 'text-slate-600 hover:text-[#1E5C9A] hover:bg-slate-50'
    }`;
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-[2000] transition-all duration-300 border-b ${
      darkMode 
        ? 'bg-[#1E2023] border-[#1E5C9A]/30 text-white' 
        : 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-900 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)]'
    }`}>
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between py-1.5 px-4">
        <div className="flex items-center space-x-3 md:pl-7">
          <div className="flex items-center gap-2">
            <div className="flex flex-col lg:flex-row lg:items-baseline py-1 lg:gap-3 leading-none">
              <h1 className="text-lg md:text-xl font-bold tracking-tight">
                Bali <span className="text-[#1E5C9A] font-black">Risk Dashboard</span>
              </h1>
            </div>
          </div>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <button onClick={() => router.push('/')} className={navBtnCls('/')}>Home</button>
          <button onClick={() => router.push('/peta')} className={navBtnCls('/peta')}>Our Product</button>
          <button onClick={() => router.push('/about')} className={navBtnCls('/about')}>About Us</button>

          {/* Tombol Toggle Dark / Light Mode */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className={`ml-2 p-2 rounded-full transition-all duration-300 ${
              darkMode ? 'bg-white/10 hover:bg-[#1E5C9A] text-gray-200' : 'bg-slate-100 hover:bg-[#1E5C9A]/10 text-slate-600 hover:text-[#1E5C9A]'
            }`}
            title={darkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Auth Section */}
          {currentUser ? (
            <div className={`flex items-center gap-2 ml-2 border-l pl-4 ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
              <div className="flex items-center gap-1.5 text-xs">
                <User size={14} className="text-[#1E5C9A]" />
                <span className={darkMode ? 'text-gray-300' : 'text-slate-600'}>{currentUser.nama}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className={`p-2 rounded-full transition-all duration-300 ${
                  darkMode ? 'bg-white/10 hover:bg-red-500/30 hover:text-red-400 text-gray-200' : 'bg-slate-100 hover:bg-red-500/10 hover:text-red-600 text-slate-600'
                }`}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="ml-2 px-4 py-1.5 rounded-full bg-[#1E5C9A] text-white text-sm font-semibold hover:bg-[#1E5C9A] transition shadow-sm"
            >
              Masuk
            </button>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className={`mr-2 p-2 rounded-full transition-all duration-300 ${
              darkMode ? 'bg-white/10 hover:bg-[#1E5C9A] text-gray-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 focus:outline-none ${darkMode ? 'text-gray-200 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className={`md:hidden w-full border-t shadow-lg pb-4 transition-colors duration-300 ${
          darkMode ? 'bg-[#1E2023] border-gray-700' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col px-4 pt-2 space-y-2">
            {[
              { path: '/', label: 'Home' },
              { path: '/peta', label: 'Our Product' },
              { path: '/about', label: 'About Us' }
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => { router.push(item.path); setIsMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-xl transition text-left font-medium ${
                  isActive(item.path) 
                    ? 'bg-[#1E5C9A] text-white' 
                    : darkMode ? 'text-gray-200 hover:bg-[#333538]' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {currentUser ? (
              <>
                <div className={`px-4 py-2 text-xs border-t mt-2 ${darkMode ? 'border-gray-700 text-gray-400' : 'border-slate-100 text-[#2F6FAF]'}`}>
                  Login sebagai: <span className="text-[#2F6FAF] font-medium">{currentUser.nama}</span>
                </div>
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 rounded-xl transition text-left font-medium text-red-500 hover:bg-red-500/10"
                >
                  Keluar
                </button>
              </>
            ) : (
              <button
                onClick={() => { router.push('/login'); setIsMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-xl bg-[#1E5C9A] text-white font-semibold transition text-left shadow-sm"
              >
                Masuk
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
