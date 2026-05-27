'use client';

import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { countries, levelLabels } from '@/data/mock-data';
import {
  Menu,
  Globe,
  Wallet,
  ShoppingCart,
  User,
  LogOut,
  History,
  Bell,
  Settings,
  ChevronDown,
  Search,
  Moon,
  Sun,
} from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const {
    t,
    language,
    setLanguage,
    dir,
    user,
    isAuthenticated,
    logout,
    selectedCountry,
    setSelectedCountry,
    cartTotal,
    theme,
    toggleTheme,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLight = theme === 'light';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-IQ').format(amount);
  };

  return (
    <header className={`sticky top-0 z-50 w-full glass border-b ${isLight ? 'border-purple-200' : 'border-purple-500/10'}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className={`${isLight ? 'text-slate-700 hover:bg-purple-100' : 'text-white hover:bg-purple-500/10'}`}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className={`w-80 ${isLight ? 'bg-white border-purple-200' : 'bg-[#0d0a14] border-purple-500/20'}`}>
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className={`text-lg font-medium transition-colors ${isLight ? 'text-slate-800 hover:text-purple-600' : 'text-white hover:text-purple-400'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('Home', 'الرئيسية')}
                </Link>
                <Link
                  href="/games"
                  className={`text-lg font-medium transition-colors ${isLight ? 'text-slate-800 hover:text-purple-600' : 'text-white hover:text-purple-400'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('All Games', 'جميع الألعاب')}
                </Link>
                <Link
                  href="/promotions"
                  className={`text-lg font-medium transition-colors ${isLight ? 'text-slate-800 hover:text-purple-600' : 'text-white hover:text-purple-400'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('Promotions', 'العروض')}
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      href="/orders"
                      className={`text-lg font-medium transition-colors ${isLight ? 'text-slate-800 hover:text-purple-600' : 'text-white hover:text-purple-400'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('My Orders', 'طلباتي')}
                    </Link>
                    <Link
                      href="/wallet"
                      className={`text-lg font-medium transition-colors ${isLight ? 'text-slate-800 hover:text-purple-600' : 'text-white hover:text-purple-400'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('Wallet', 'المحفظة')}
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all">
              <span className="text-xl font-bold text-white">و</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {t('Al-Wasl Digital', 'الوصل الرقمي')}
              </h1>
              <p className={`text-[10px] -mt-0.5 ${isLight ? 'text-purple-500' : 'text-purple-400/60'}`}>
                {t('Top-Up Platform', 'منصة الشحن الرقمي')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className={`text-sm font-medium transition-colors ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/80 hover:text-purple-400'}`}>
              {t('Home', 'الرئيسية')}
            </Link>
            <Link href="/games" className={`text-sm font-medium transition-colors ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/80 hover:text-purple-400'}`}>
              {t('All Games', 'جميع الألعاب')}
            </Link>
            <Link href="/promotions" className={`text-sm font-medium transition-colors ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/80 hover:text-purple-400'}`}>
              {t('Promotions', 'العروض')}
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <Link href="/games" className="hidden md:flex">
              <Button variant="ghost" size="icon" className={isLight ? 'text-slate-500 hover:text-purple-600 hover:bg-purple-100' : 'text-white/70 hover:text-purple-400 hover:bg-purple-500/10'}>
                <Search className="h-4 w-4" />
              </Button>
            </Link>

            {/* Country Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 px-2 sm:px-3 ${isLight ? 'text-slate-700 hover:bg-purple-100' : 'text-white hover:bg-purple-500/10'}`}
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className={`hidden sm:inline text-xs ${isLight ? 'text-slate-500' : 'text-white/70'}`}>
                    {language === 'ar' ? selectedCountry.nameAr : selectedCountry.name}
                  </span>
                  <ChevronDown className={`h-3 w-3 ${isLight ? 'text-purple-500' : 'text-purple-400/60'}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={isLight ? 'bg-white border-purple-200' : 'bg-[#1a1225] border-purple-500/20'}>
                {countries.filter(c => c.isActive).map((country) => (
                  <DropdownMenuItem
                    key={country.id}
                    onClick={() => setSelectedCountry(country)}
                    className={`gap-2 cursor-pointer ${isLight ? 'hover:bg-purple-50' : 'hover:bg-purple-500/10'} ${
                      selectedCountry.id === country.id ? (isLight ? 'bg-purple-100' : 'bg-purple-500/20') : ''
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className={isLight ? 'text-slate-700' : ''}>{language === 'ar' ? country.nameAr : country.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className={`gap-1.5 px-2 sm:px-3 ${isLight ? 'text-slate-700 hover:bg-purple-100' : 'text-white hover:bg-purple-500/10'}`}
            >
              <Globe className={`h-4 w-4 ${isLight ? 'text-purple-500' : 'text-purple-400'}`} />
              <span className="text-xs font-medium">{language === 'en' ? 'عربي' : 'EN'}</span>
            </Button>

            {/* Dark/Light Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`hidden sm:flex ${isLight ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' : 'text-white/70 hover:text-yellow-400 hover:bg-purple-500/10'}`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <>
                {/* Wallet Balance (Desktop) */}
                <Link href="/wallet" className="hidden md:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 rounded-xl ${isLight ? 'text-purple-700 hover:bg-purple-100 bg-purple-50' : 'text-white hover:bg-purple-500/10 bg-purple-500/10'}`}
                  >
                    <Wallet className={`h-4 w-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                    <span className={`text-xs font-bold ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                      {formatCurrency(user?.walletBalance || 0)}
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-purple-500' : 'text-purple-400/60'}`}>
                      {selectedCountry.currencySymbol}
                    </span>
                  </Button>
                </Link>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative ${isLight ? 'text-slate-600 hover:bg-purple-100' : 'text-white hover:bg-purple-500/10'}`}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                </Button>

                {/* Cart */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative ${isLight ? 'text-slate-600 hover:bg-purple-100' : 'text-white hover:bg-purple-500/10'}`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartTotal > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {cartTotal}
                    </span>
                  )}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-white hover:bg-purple-500/10"
                    >
                      <Avatar className="h-8 w-8 border-2 border-purple-500/30">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-purple-900 text-purple-100 text-xs">
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#1a1225] border-purple-500/20">
                    <div className="px-3 py-3 border-b border-purple-500/20">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-purple-400/60">{user?.phone}</p>
                      <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg bg-purple-500/10">
                        <Wallet className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-sm font-bold text-purple-400">
                          {formatCurrency(user?.walletBalance || 0)} {selectedCountry.currencySymbol}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-purple-500/10">
                      <Link href="/profile" className="gap-2">
                        <User className="h-4 w-4" />
                        {t('Profile', 'الملف الشخصي')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-purple-500/10">
                      <Link href="/orders" className="gap-2">
                        <History className="h-4 w-4" />
                        {t('Order History', 'سجل الطلبات')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-purple-500/10">
                      <Link href="/wallet" className="gap-2">
                        <Wallet className="h-4 w-4" />
                        {t('Wallet', 'المحفظة')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-purple-500/10">
                      <Link href="/settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        {t('Settings', 'الإعدادات')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-purple-500/20" />
                    <DropdownMenuItem
                      onClick={logout}
                      className="gap-2 cursor-pointer text-pink-400 focus:text-pink-400 focus:bg-pink-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('Logout', 'تسجيل الخروج')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 rounded-xl"
                >
                  {t('Login', 'تسجيل الدخول')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
