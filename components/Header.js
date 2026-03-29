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

  const navBtnCls = (path) => `
    px-3 py-1 rounded-4xl transition text-sm
    ${isActive(path)
      ? 'bg-[#C6FF00] text-black'
      : 'text-gray-200 hover:bg-[#C6FF00] hover:text-black'}
  `;

  return (
    <header className="bg-[#1E2023] dark:bg-[#1E2023] light:bg-white text-white fixed top-0 left-0 w-full z-[2000] transition-colors duration-300">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between py-1.5 px-4">
        <div className="flex items-center space-x-3 md:pl-7">
          <div className="flex items-center gap-2">
            <div className="flex flex-col lg:flex-row lg:items-baseline py-1 lg:gap-3 leading-none">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                Budget <span className="text-[#C6FF00] font-black">Stress Testing</span>
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-slate-400 mt-1 lg:mt-0 lg:ml-2">
                <span className="text-slate-500">(</span>
                <span className="text-[#ff5252]">Catastrophic Model</span>
                <span className="text-slate-600 font-normal lowercase">dan</span>
                <span className="text-slate-300">Macro Fiscal Model</span>
                <span className="text-slate-500">)</span>
              </div>
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
            className="ml-2 p-2 rounded-full bg-white/10 hover:bg-[#C6FF00] hover:text-black text-gray-200 transition-all duration-300"
            title={darkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Auth Section */}
          {currentUser ? (
            <div className="flex items-center gap-2 ml-2 border-l border-gray-700 pl-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <User size={14} className="text-[#C6FF00]" />
                <span>{currentUser.nama}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 hover:text-red-400 text-gray-200 transition-all duration-300"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="ml-2 px-4 py-1.5 rounded-full bg-[#C6FF00] text-black text-sm font-semibold hover:bg-[#d4ff33] transition"
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
            className="mr-2 p-2 rounded-full bg-white/10 hover:bg-[#C6FF00] hover:text-black text-gray-200 transition-all duration-300"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-200 hover:text-white focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#1E2023] w-full border-t border-gray-700 shadow-lg pb-4">
          <div className="flex flex-col px-4 pt-2 space-y-2">
            <button
              onClick={() => { router.push('/'); setIsMobileMenuOpen(false); }}
              className={`px-4 py-3 rounded-xl transition text-left font-medium ${isActive('/') ? 'bg-[#C6FF00] text-black' : 'text-gray-200 hover:bg-[#333538]'}`}
            >
              Home
            </button>
            <button
              onClick={() => { router.push('/peta'); setIsMobileMenuOpen(false); }}
              className={`px-4 py-3 rounded-xl transition text-left font-medium ${isActive('/peta') ? 'bg-[#C6FF00] text-black' : 'text-gray-200 hover:bg-[#333538]'}`}
            >
              Our Product
            </button>
            <button
              onClick={() => { router.push('/about'); setIsMobileMenuOpen(false); }}
              className={`px-4 py-3 rounded-xl transition text-left font-medium ${isActive('/about') ? 'bg-[#C6FF00] text-black' : 'text-gray-200 hover:bg-[#333538]'}`}
            >
              About Us
            </button>
            {currentUser ? (
              <>
                <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-700">
                  Login sebagai: <span className="text-[#C6FF00] font-medium">{currentUser.nama}</span>
                </div>
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="px-4 py-3 rounded-xl transition text-left font-medium text-red-400 hover:bg-red-500/10"
                >
                  Keluar
                </button>
              </>
            ) : (
              <button
                onClick={() => { router.push('/login'); setIsMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-xl bg-[#C6FF00] text-black font-semibold transition text-left"
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
