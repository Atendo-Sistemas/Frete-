import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('storage', checkDark);
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('storage', checkDark);
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains('dark');
    
    if (nextIsDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95"
      title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
      aria-label="Alternar Tema"
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-indigo-400 hover:-rotate-12 transition-transform" />
      ) : (
        <Sun className="w-5 h-5 text-amber-500 hover:rotate-45 transition-transform" />
      )}
    </button>
  );
};
