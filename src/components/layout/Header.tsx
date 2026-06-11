'use client';

import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';
import { useState } from 'react';

const languageOptions = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'ar', label: 'العربية', short: 'عربي' },
  { id: 'zh', label: '中文', short: '中文' },
] as const;

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
    cartTotal,
    theme,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLight = theme === 'light';
  const activeLanguage = languageOptions.find(option => option.id === language) || languageOptions[0];
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale).format(amount);
  };

  return (
    <header className={`sticky top-0 z-50 w-full glass border-b ${isLight ? 'border-black/10' : 'border-white/10'}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className={`${isLight ? 'text-zinc-700 hover:bg-zinc-100' : 'text-zinc-100 hover:bg-white/10'}`}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className={`w-80 ${isLight ? 'bg-white border-black/10' : 'bg-zinc-950 border-white/10'}`}>
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className={`text-lg font-medium transition-colors ${isLight ? 'text-zinc-900 hover:text-blue-600' : 'text-zinc-100 hover:text-blue-300'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('Home', 'الرئيسية')}
                </Link>
                <Link
                  href="/games"
                  className={`text-lg font-medium transition-colors ${isLight ? 'text-zinc-900 hover:text-blue-600' : 'text-zinc-100 hover:text-blue-300'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('WAHO Services', 'خدمات WAHO')}
                </Link>
                <Link
                  href="/promotions"
                  className={`text-lg font-medium transition-colors ${isLight ? 'text-zinc-900 hover:text-blue-600' : 'text-zinc-100 hover:text-blue-300'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('WAHO Offers', 'عروض WAHO')}
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      href="/orders"
                      className={`text-lg font-medium transition-colors ${isLight ? 'text-zinc-900 hover:text-blue-600' : 'text-zinc-100 hover:text-blue-300'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('My Orders', 'طلباتي')}
                    </Link>
                    <Link
                      href="/wallet"
                      className={`text-lg font-medium transition-colors ${isLight ? 'text-zinc-900 hover:text-blue-600' : 'text-zinc-100 hover:text-blue-300'}`}
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
            <div className="relative w-10 h-10 rounded-lg bg-white p-1 overflow-hidden border border-black/10 shadow-sm transition-all group-hover:border-blue-300">
              <Image
                src="/brand/alwasl-mark.jpg"
                alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}
                fill
                className="object-contain"
                sizes="44px"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-base font-semibold tracking-tight ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                {t('Al-Wasl Digital', 'الوصل')}
              </h1>
              <p className={`text-[10px] -mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {t('Page promotion • app recharge', 'ترويج صفحات • شحن تطبيقات')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className={`text-sm font-medium transition-colors ${isLight ? 'text-zinc-600 hover:text-blue-600' : 'text-zinc-300 hover:text-blue-300'}`}>
              {t('Home', 'الرئيسية')}
            </Link>
            <Link href="/games" className={`text-sm font-medium transition-colors ${isLight ? 'text-zinc-600 hover:text-blue-600' : 'text-zinc-300 hover:text-blue-300'}`}>
              {t('WAHO Services', 'خدمات WAHO')}
            </Link>
            <Link href="/promotions" className={`text-sm font-medium transition-colors ${isLight ? 'text-zinc-600 hover:text-blue-600' : 'text-zinc-300 hover:text-blue-300'}`}>
              {t('WAHO Offers', 'عروض WAHO')}
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <Button variant="ghost" size="icon" className={`hidden md:flex ${isLight ? 'text-zinc-500 hover:text-blue-600 hover:bg-zinc-100' : 'text-zinc-300 hover:text-blue-300 hover:bg-white/10'}`}>
              <Search className="h-4 w-4" />
            </Button>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 px-2 sm:px-3 ${isLight ? 'text-zinc-700 hover:bg-zinc-100' : 'text-zinc-100 hover:bg-white/10'}`}
                >
                  <Globe className={`h-4 w-4 ${isLight ? 'text-blue-600' : 'text-blue-300'}`} />
                  <span className="text-xs font-medium">{activeLanguage.short}</span>
                  <ChevronDown className={`h-3 w-3 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={isLight ? 'bg-white border-black/10' : 'bg-zinc-950 border-white/10'}>
                {languageOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setLanguage(option.id)}
                    className={`cursor-pointer ${isLight ? 'hover:bg-zinc-100' : 'hover:bg-white/10'} ${
                      language === option.id ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-200') : ''
                    }`}
                  >
                    <span className={isLight ? 'text-slate-700' : ''}>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <>
                {/* Wallet Balance (Desktop) */}
                <Link href="/wallet" className="hidden md:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 rounded-md ${isLight ? 'text-blue-700 hover:bg-blue-50 bg-blue-50' : 'text-blue-200 hover:bg-blue-500/15 bg-blue-500/10'}`}
                  >
                    <Wallet className={`h-4 w-4 ${isLight ? 'text-blue-600' : 'text-blue-300'}`} />
                    <span className={`text-xs font-semibold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                      {formatCurrency(user?.walletBalance || 0)}
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-blue-500' : 'text-blue-300/70'}`}>
                      {selectedCountry.currencySymbol}
                    </span>
                  </Button>
                </Link>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative ${isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-200 hover:bg-white/10'}`}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    2
                  </span>
                </Button>

                {/* Cart */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative ${isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-200 hover:bg-white/10'}`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartTotal > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
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
                      className={`gap-2 ${isLight ? 'text-zinc-700 hover:bg-zinc-100' : 'text-zinc-100 hover:bg-white/10'}`}
                    >
                      <Avatar className="h-8 w-8 border border-black/10">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-zinc-100 text-zinc-700 text-xs">
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={`w-56 ${isLight ? 'bg-white border-black/10' : 'bg-zinc-950 border-white/10'}`}>
                    <div className="px-3 py-3 border-b border-black/10">
                      <p className={isLight ? 'text-sm font-medium text-zinc-950' : 'text-sm font-medium text-white'}>{user?.name}</p>
                      <p className={isLight ? 'text-xs text-zinc-500' : 'text-xs text-zinc-400'}>{user?.phone}</p>
                      <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-md bg-blue-50">
                        <Wallet className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">
                          {formatCurrency(user?.walletBalance || 0)} {selectedCountry.currencySymbol}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-zinc-100">
                      <Link href="/profile" className="gap-2">
                        <User className="h-4 w-4" />
                        {t('Profile', 'الملف الشخصي')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-zinc-100">
                      <Link href="/orders" className="gap-2">
                        <History className="h-4 w-4" />
                        {t('Order History', 'سجل الطلبات')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-zinc-100">
                      <Link href="/wallet" className="gap-2">
                        <Wallet className="h-4 w-4" />
                        {t('Wallet', 'المحفظة')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-zinc-100">
                      <Link href="/settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        {t('Settings', 'الإعدادات')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-black/10" />
                    <DropdownMenuItem
                      onClick={logout}
                      className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
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
                  className="rounded-md bg-blue-600 text-white shadow-none hover:bg-blue-700"
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
