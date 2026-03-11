// components/Header.js
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const router = useRouter();
  const { darkMode, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => router.pathname === path;

  return (
    <header className="bg-[#1E2023] dark:bg-[#1E2023] light:bg-white text-white fixed top-0 left-0 w-full z-[2000] transition-colors duration-300">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between py-3 px-4">
        <div className="flex items-center space-x-3 md:pl-7">
          <div>
            <h1 className="text-2xl font-bold font-[space grotesk] text-[#C6FF00]">CardinAAL</h1>
            <p className="text-gray-400 dark:text-gray-400 text-sm font-[space grotesk]">Calculation for Direct and Average Annual Loss</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className={`
              px-4 py-2 rounded-4xl transition
              ${isActive('/')
                ? 'bg-[#C6FF00] text-black'
                : 'text-gray-200 hover:bg-[#C6FF00] hover:text-black'}
            `}
          >
            Home
          </button>
          <button
            onClick={() => router.push('/calculation')}
            className={`
              px-4 py-2 rounded-4xl transition
              ${isActive('/calculation')
                ? 'bg-[#C6FF00] text-black'
                : 'text-gray-200 hover:bg-[#C6FF00] hover:text-black'}
            `}
          >
            Hasil Kalkulasi
          </button>
          <button
            onClick={() => router.push('/data')}
            className={`
              px-4 py-2 rounded-4xl transition
              ${isActive('/data')
                ? 'bg-[#C6FF00] text-black'
                : 'text-gray-200 hover:bg-[#C6FF00] hover:text-black'}
            `}
          >
            Model dan Data
          </button>
          <button
            onClick={() => router.push('/about')}
            className={`
              px-4 py-2 rounded-4xl transition
              ${isActive('/about')
                ? 'bg-[#C6FF00] text-black'
                : 'text-gray-200 hover:bg-[#C6FF00] hover:text-black'}
            `}
          >
            Tentang kami
          </button>

          {/* Tombol Toggle Dark / Light Mode */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className="ml-2 p-2 rounded-full bg-white/10 hover:bg-[#C6FF00] hover:text-black text-gray-200 transition-all duration-300"
            title={darkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
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
              className={`
                px-4 py-3 rounded-xl transition text-left font-medium
                ${isActive('/') ? 'bg-[#C6FF00] text-black' : 'text-gray-200 hover:bg-[#333538]'}
              `}
            >
              Home
            </button>
            <button
              onClick={() => { router.push('/calculation'); setIsMobileMenuOpen(false); }}
              className={`
                px-4 py-3 rounded-xl transition text-left font-medium
                ${isActive('/calculation') ? 'bg-[#C6FF00] text-black' : 'text-gray-200 hover:bg-[#333538]'}
              `}
            >
              Hasil Kalkulasi
            </button>
            <button
              onClick={() => { router.push('/data'); setIsMobileMenuOpen(false); }}
              className={`
                px-4 py-3 rounded-xl transition text-left font-medium
                ${isActive('/data') ? 'bg-[#C6FF00] text-black' : 'text-gray-200 hover:bg-[#333538]'}
              `}
            >
              Model dan Data
            </button>
            <button
              onClick={() => { router.push('/about'); setIsMobileMenuOpen(false); }}
              className={`
                px-4 py-3 rounded-xl transition text-left font-medium
                ${isActive('/about') ? 'bg-[#C6FF00] text-black' : 'text-gray-200 hover:bg-[#333538]'}
              `}
            >
              Tentang kami
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
