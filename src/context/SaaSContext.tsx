import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { SaaSGlobalConfig, FormFieldSetting } from '../types';

interface SaaSContextType {
  config: SaaSGlobalConfig | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
  getField: (formName: 'userForm' | 'freightForm' | 'driverForm' | 'expenseForm', fieldId: string) => FormFieldSetting | null;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

// Helper to darken a hex color for hover states
function darkenColor(hex: string, percent: number): string {
  try {
    const cleanHex = hex.replace('#', '');
    let num = parseInt(cleanHex, 16);
    if (isNaN(num)) return hex;
    
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) - amt;
    let G = ((num >> 8) & 0x00FF) - amt;
    let B = (num & 0x0000FF) - amt;
    
    R = Math.max(0, Math.min(255, R));
    G = Math.max(0, Math.min(255, G));
    B = Math.max(0, Math.min(255, B));
    
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  } catch {
    return hex;
  }
}

export const SaaSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SaaSGlobalConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshConfig = useCallback(async () => {
    try {
      const saasData = await api.getSaaSGlobalConfig();
      setConfig(saasData);
      applyLayoutStyles(saasData);
    } catch (err) {
      console.error('Falha ao carregar configurações SaaS:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
    
    // Add custom event listener so saving settings inside config panel triggers instant re-renders
    window.addEventListener('saas_config_updated', refreshConfig);
    return () => {
      window.removeEventListener('saas_config_updated', refreshConfig);
    };
  }, [refreshConfig]);

  const applyLayoutStyles = (cfg: SaaSGlobalConfig) => {
    if (!cfg.layout) return;
    const { primaryColor, borderRadius, fontFamily, navbarStyle, systemBackground } = cfg.layout;

    let styleEl = document.getElementById('saas-custom-branding') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'saas-custom-branding';
      document.head.appendChild(styleEl);
    }

    const hoverColor = darkenColor(primaryColor, 12);
    
    // Border radius mappings
    const radiusMap = {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '24px'
    };
    const rVal = radiusMap[borderRadius] || '16px';
    const rValPlus = borderRadius === 'none' ? '0px' : borderRadius === 'sm' ? '8px' : borderRadius === 'md' ? '12px' : borderRadius === 'lg' ? '16px' : borderRadius === 'xl' ? '24px' : '32px';
    const rValMinus = borderRadius === 'none' ? '0px' : borderRadius === 'sm' ? '2px' : borderRadius === 'md' ? '4px' : borderRadius === 'lg' ? '8px' : borderRadius === 'xl' ? '12px' : '16px';

    // Font mappings
    const fontMap = {
      sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      serif: "'Playfair Display', Georgia, Cambria, serif",
      mono: "'Fira Code', 'Courier New', monospace",
      display: "'Montserrat', sans-serif"
    };
    const fVal = fontMap[fontFamily] || fontMap.sans;

    // Background color mappings
    let bgLight = '#FAFAFA';
    let bgDark = '#111827';
    if (systemBackground === 'warm') {
      bgLight = '#FCFAF7';
      bgDark = '#181412';
    } else if (systemBackground === 'slate') {
      bgLight = '#F8FAFC';
      bgDark = '#0F172A';
    }

    // Dynamic styles template overrides
    let cssRules = `
      :root {
        --primary-color: ${primaryColor};
        --primary-hover: ${hoverColor};
      }

      body {
        font-family: ${fVal} !important;
      }

      /* Primary Background Overrides */
      .bg-emerald-600 { background-color: ${primaryColor} !important; }
      .hover\\:bg-emerald-700:hover { background-color: ${hoverColor} !important; }
      .bg-emerald-500 { background-color: ${primaryColor} !important; }
      .bg-emerald-500\\/20 { background-color: ${primaryColor}33 !important; }
      .bg-emerald-50 { background-color: ${primaryColor}0d !important; }
      .bg-emerald-100 { background-color: ${primaryColor}1a !important; }
      .dark\\:bg-emerald-950\\/40 { background-color: ${primaryColor}12 !important; }
      .dark\\:bg-emerald-950 { background-color: ${primaryColor}15 !important; }

      /* Primary Text Overrides */
      .text-emerald-600 { color: ${primaryColor} !important; }
      .text-emerald-700 { color: ${primaryColor} !important; }
      .text-emerald-500 { color: ${primaryColor} !important; }
      .text-emerald-800 { color: ${darkenColor(primaryColor, 15)} !important; }
      .dark\\:text-emerald-300 { color: ${darkenColor(primaryColor, -25)} !important; }
      .dark\\:text-emerald-400 { color: ${darkenColor(primaryColor, -15)} !important; }

      /* Border Color Overrides */
      .border-emerald-600 { border-color: ${primaryColor} !important; }
      .border-emerald-500 { border-color: ${primaryColor} !important; }
      .border-emerald-300 { border-color: ${primaryColor}66 !important; }
      .dark\\:border-emerald-700 { border-color: ${primaryColor}88 !important; }

      /* Border Radius Custom Overrides */
      .rounded-2xl { border-radius: ${rValPlus} !important; }
      .rounded-xl { border-radius: ${rVal} !important; }
      .rounded-lg { border-radius: ${rValMinus} !important; }

      /* Global Layout Backgrounds */
      html {
        background-color: ${bgLight};
      }
      html.dark {
        background-color: ${bgDark};
      }
      body {
        background-color: ${bgLight};
        color: #0f172a;
      }
      .dark body {
        background-color: ${bgDark};
        color: #f8fafc;
      }
    `;

    // Dynamic Navbar styles
    if (navbarStyle === 'colored') {
      cssRules += `
        #navbar-main-container {
          background-color: ${primaryColor} !important;
          border-color: ${hoverColor} !important;
          color: white !important;
        }
        #navbar-main-container .text-slate-600,
        #navbar-main-container .text-slate-700,
        #navbar-main-container .text-slate-300,
        #navbar-main-container .text-slate-200 {
          color: #f1f5f9 !important;
        }
        #navbar-main-container .bg-slate-100,
        #navbar-main-container .bg-slate-200 {
          background-color: ${hoverColor} !important;
        }
      `;
    } else if (navbarStyle === 'light') {
      cssRules += `
        #navbar-main-container {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
        }
        .dark #navbar-main-container {
          background-color: #1e1e1e !important;
          border-color: #333333 !important;
          color: #f8fafc !important;
        }
      `;
    } else {
      // 'dark' or default: light background in light mode, dark background in dark mode
      cssRules += `
        #navbar-main-container {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
        }
        .dark #navbar-main-container {
          background-color: #0f172a !important;
          border-color: #1e293b !important;
          color: #ffffff !important;
        }
      `;
    }

    styleEl.innerHTML = cssRules;
  };

  const getField = (formName: 'userForm' | 'freightForm' | 'driverForm' | 'expenseForm', fieldId: string): FormFieldSetting | null => {
    if (!config?.formFields) return null;
    const list = config.formFields[formName];
    if (!list) return null;
    return list.find(f => f.id === fieldId) || null;
  };

  return (
    <SaaSContext.Provider value={{ config, loading, refreshConfig, getField }}>
      {children}
    </SaaSContext.Provider>
  );
};

export const useSaaS = () => {
  const context = useContext(SaaSContext);
  if (context === undefined) {
    throw new Error('useSaaS deve ser usado com um SaaSProvider');
  }
  return context;
};
