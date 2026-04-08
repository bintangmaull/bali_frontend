// components/Header.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
    return `px-3 py-1 rounded-4xl transition text-sm ${darkMode
        ? 'text-gray-200 hover:bg-[#1E5C9A] hover:text-white'
        : 'text-slate-600 hover:text-[#1E5C9A] hover:bg-slate-50'
      }`;
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-[2010] transition-all duration-300 border-b ${darkMode
        ? 'bg-[#0D0F12]/80 backdrop-blur-md border-white/5 text-white'
        : 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-900 shadow-sm'
      }`}>
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between py-1.5 px-3 md:px-6">
        {/* Left: Logo Area */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <img src="/logoitb.png" alt="ITB" className="h-6 w-auto" />
            <img src="/logobali.png" alt="Bali" className="h-6 w-auto" />
          </div>
          <Link href="/" className="flex items-center leading-none">
            <h1 className="text-base md:text-lg tracking-tighter flex items-center gap-2">
              <span className={`font-black uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>CATALYST</span>
              <span className={`text-[#1E5C9A] font-bold opacity-40 mx-0.5 text-sm md:text-base`}>:</span>
              <span className="text-blue-500 font-semibold text-[10px] md:text-xs truncate md:overflow-visible uppercase tracking-wider">Catastrophic Average Annual Loss Analyst</span>
            </h1>
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-12">
          {[
            { path: '/', label: 'Home' },
            { path: '/peta', label: 'Our Product' },
            { path: '/about', label: 'About Us' }
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`relative py-1 text-sm font-semibold transition-all duration-300 ${isActive(item.path)
                  ? (darkMode ? 'text-white' : 'text-blue-600')
                  : (darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-blue-600')
                }`}
            >
              {item.label}
              {isActive(item.path) && (
                <div className="absolute -bottom-[13px] left-0 right-0 h-1 bg-blue-500 rounded-t-sm shadow-[0_-2px_6px_rgba(59,130,246,0.3)]" />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-300 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-[#1E5C9A] hover:bg-slate-100'
                }`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{currentUser.nama}</span>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-full transition-all ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${darkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                  }`}>
                  Sign In
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className={`md:hidden w-full border-t shadow-lg pb-4 transition-colors duration-300 ${darkMode ? 'bg-[#1E2023] border-gray-700' : 'bg-white border-slate-200'
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
                className={`px-4 py-2.5 rounded-lg transition text-left text-sm font-semibold ${isActive(item.path)
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
                  className="px-4 py-2.5 rounded-lg transition text-left text-sm font-semibold text-red-500 hover:bg-red-500/10"
                >
                  Keluar
                </button>
              </>
            ) : (
              <button
                onClick={() => { router.push('/login'); setIsMobileMenuOpen(false); }}
                className="px-4 py-2.5 rounded-lg bg-[#1E5C9A] text-white text-sm font-black transition text-left shadow-sm"
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
