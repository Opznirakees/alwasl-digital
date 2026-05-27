'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Language, User, Country, CartItem, Order, PaymentMethod, WalletTransaction } from '@/types';
import { demoUser, countries, sampleOrders, walletTransactions as sampleWalletTransactions } from '@/data/mock-data';

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

  // Demo data
  orders: Order[];
  walletTransactions: WalletTransaction[];
  createDemoOrder: (order: DemoOrderInput) => Order;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface DemoOrderInput {
  gameId: string;
  gameName: string;
  packageId: string;
  packageName: string;
  gameUserId: string;
  gameUsername?: string;
  zoneId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
  paymentMethod: PaymentMethod;
}

const storageKeys = {
  language: 'alwasl-language',
  theme: 'theme',
  country: 'alwasl-country',
  user: 'alwasl-demo-user',
  cart: 'alwasl-demo-cart',
  orders: 'alwasl-demo-orders',
  walletTransactions: 'alwasl-demo-wallet-transactions',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [user, setUser] = useState<User | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(sampleWalletTransactions);
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore demo state for a smoother presentation flow.
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKeys.theme) as Theme | null;
    const savedLanguage = localStorage.getItem(storageKeys.language) as Language | null;
    const savedCountryId = localStorage.getItem(storageKeys.country);

    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedCountryId) {
      const country = countries.find((item) => item.id === savedCountryId);
      if (country) setSelectedCountry(country);
    }

    setUser(readJson<User | null>(storageKeys.user, null));
    setCart(readJson<CartItem[]>(storageKeys.cart, []));
    setOrders(readJson<Order[]>(storageKeys.orders, sampleOrders));
    setWalletTransactions(readJson<WalletTransaction[]>(storageKeys.walletTransactions, sampleWalletTransactions));
    setIsHydrated(true);
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
    localStorage.setItem(storageKeys.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.language, language);
  }, [isHydrated, language]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.country, selectedCountry.id);
  }, [isHydrated, selectedCountry.id]);

  useEffect(() => {
    if (!isHydrated) return;
    if (user) {
      localStorage.setItem(storageKeys.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(storageKeys.user);
    }
  }, [isHydrated, user]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.cart, JSON.stringify(cart));
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.orders, JSON.stringify(orders));
  }, [isHydrated, orders]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.walletTransactions, JSON.stringify(walletTransactions));
  }, [isHydrated, walletTransactions]);

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
      setUser({
        ...demoUser,
        phone: pendingPhone || demoUser.phone,
        lastLogin: new Date().toISOString(),
      });
      setPendingPhone('');
      return true;
    }
    return false;
  }, [pendingPhone]);

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

  const createDemoOrder = useCallback((orderInput: DemoOrderInput) => {
    const now = new Date();
    const orderId = `ORD-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isInstantPayment = orderInput.paymentMethod === 'wallet';
    const order: Order = {
      id: orderId,
      userId: user?.id || demoUser.id,
      ...orderInput,
      status: isInstantPayment ? 'completed' : 'processing',
      paymentStatus: isInstantPayment ? 'completed' : 'pending',
      providerId: isInstantPayment ? 'provider-1' : undefined,
      providerOrderId: isInstantPayment ? `PROV-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: isInstantPayment ? new Date(now.getTime() + 22000).toISOString() : undefined,
    };

    setOrders((current) => [order, ...current]);

    if (isInstantPayment && user) {
      const nextBalance = Math.max(0, user.walletBalance - order.finalPrice);
      setUser({
        ...user,
        walletBalance: nextBalance,
        totalSpent: user.totalSpent + order.finalPrice,
      });
      setWalletTransactions((current) => [
        {
          id: `wt-${orderId.toLowerCase()}`,
          userId: user.id,
          type: 'purchase',
          amount: -order.finalPrice,
          currency: order.currency,
          balance: nextBalance,
          description: `Purchase: ${order.gameName} ${order.packageName}`,
          descriptionAr: `شراء: ${order.gameName} ${order.packageName}`,
          reference: order.id,
          createdAt: now.toISOString(),
        },
        ...current,
      ]);
    }

    return order;
  }, [user]);

  const resetDemoData = useCallback(() => {
    setUser(null);
    setCart([]);
    setOrders(sampleOrders);
    setWalletTransactions(sampleWalletTransactions);
    localStorage.removeItem(storageKeys.user);
    localStorage.removeItem(storageKeys.cart);
    localStorage.removeItem(storageKeys.orders);
    localStorage.removeItem(storageKeys.walletTransactions);
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
      orders,
      walletTransactions,
      createDemoOrder,
      resetDemoData,
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
