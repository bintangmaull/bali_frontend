// context/ThemeContext.js
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(true); // default: dark

    // Baca preferensi dari localStorage saat pertama kali mount
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            setDarkMode(false);
        } else {
            setDarkMode(true);
        }
    }, []);

    // Terapkan class 'dark' ke <html> dan simpan ke localStorage
    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleTheme = () => setDarkMode((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
