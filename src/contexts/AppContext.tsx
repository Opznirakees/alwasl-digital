'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Language, User, Country, CartItem } from '@/types';
import { demoUser, countries } from '@/data/mock-data';

type Theme = 'dark' | 'light';

interface AppContextType {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, ar: string) => string;
  dir: 'ltr' | 'rtl';

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<boolean>;
  logout: () => void;
  verifyOtp: (otp: string) => Promise<boolean>;

  // Country
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (gameId: string, packageId: string) => void;
  clearCart: () => void;
  cartTotal: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [user, setUser] = useState<User | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingPhone, setPendingPhone] = useState<string>('');

  // Initialize theme from localStorage and apply to document
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const t = useCallback((en: string, ar: string) => {
    return language === 'ar' ? ar : en;
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const login = useCallback(async (phone: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPendingPhone(phone);
    return true;
  }, []);

  const verifyOtp = useCallback(async (otp: string): Promise<boolean> => {
    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (otp === '123456' || otp.length === 6) {
      setUser(demoUser);
      setPendingPhone('');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(
        i => i.gameId === item.gameId && i.packageId === item.packageId
      );
      if (existing) {
        return prev.map(i =>
          i.gameId === item.gameId && i.packageId === item.packageId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((gameId: string, packageId: string) => {
    setCart(prev => prev.filter(
      i => !(i.gameId === gameId && i.packageId === packageId)
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      t,
      dir,
      theme,
      toggleTheme,
      user,
      isAuthenticated: !!user,
      login,
      logout,
      verifyOtp,
      selectedCountry,
      setSelectedCountry,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
